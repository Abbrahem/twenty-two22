import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiShield, FiLogOut, FiPackage, FiShoppingCart, FiUsers, FiUpload } from 'react-icons/fi';
import { productsService, ordersService, imageService } from '../services/firebaseService';
import Swal from 'sweetalert2';

const AdminPage = React.memo(() => {
  const [activeTab, setActiveTab] = useState('add-product');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    category: 't-shirts',
    sizes: [],
    colors: [],
    images: []
  });

  // Edit product state
  const [editingProduct, setEditingProduct] = useState(null);

  const categories = [
    { value: 't-shirts', label: 'T-Shirts' },
    { value: 'pants', label: 'Pants' },
    { value: 'sweatshirts', label: 'Sweatshirts' }
  ];

  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const availableColors = ['Black', 'White', 'Light Blue', 'Blue', 'Brown', 'Red', 'Pink', 'Gray'];

  useEffect(() => {
    // Check admin authentication
    const adminSession = localStorage.getItem('adminSession');
    if (!adminSession) {
      navigate('/admin-login');
      return;
    }

    // Test Firebase connection first
    const testConnection = async () => {
      try {
        const isConnected = await ordersService.testConnection();
        if (!isConnected) {
          console.warn('Firebase connection test failed - using local fallback');
        }
      } catch (error) {
        console.error('Connection test error:', error);
      }
    };

    // Load products and orders from Firebase Firestore
    const loadProducts = async () => {
      try {
        const firebaseProducts = await productsService.getProducts();
        setProducts(firebaseProducts);
      } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to localStorage if Firebase fails
        const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
        setProducts(savedProducts);
      }
    };
    
    const loadOrders = async () => {
      try {
        const firebaseOrders = await ordersService.getOrders();
        setOrders(firebaseOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
        // Fallback to localStorage if Firebase fails
        const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        setOrders(savedOrders);
      }
    };

    testConnection();
    loadProducts();
    loadOrders();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/admin-login');
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSizeChange = (size) => {
    setProductForm(prev => {
      if (!prev) return { name: '', price: '', description: '', category: 't-shirts', sizes: [size], colors: [], image: '' };
      const currentSizes = prev.sizes || [];
      return {
        ...prev,
        sizes: currentSizes.includes(size)
          ? currentSizes.filter(s => s !== size)
          : [...currentSizes, size]
      };
    });
  };

  const handleColorChange = (color) => {
    setProductForm(prev => {
      if (!prev) return { name: '', price: '', description: '', category: 't-shirts', sizes: [], colors: [color], image: '' };
      const currentColors = prev.colors || [];
      return {
        ...prev,
        colors: currentColors.includes(color)
          ? currentColors.filter(c => c !== color)
          : [...currentColors, color]
      };
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const imagePromises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            // Compress image data
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              // Set canvas size for compression (max 800x800)
              const maxSize = 800;
              let { width, height } = img;
              
              if (width > height) {
                if (width > maxSize) {
                  height = (height * maxSize) / width;
                  width = maxSize;
                }
              } else {
                if (height > maxSize) {
                  width = (width * maxSize) / height;
                  height = maxSize;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
              resolve(compressedDataUrl);
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(imagePromises).then(compressedImages => {
        setProductForm(prev => ({
          ...prev,
          images: [...(prev.images || []), ...compressedImages]
        }));
      });
    }
  };
  
  const removeImage = (index) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (productForm.sizes.length === 0 || productForm.colors.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please select sizes and colors'
      });
      return;
    }
    
    if (!productForm.images || productForm.images.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please upload at least one product image'
      });
      return;
    }

    try {
      // Show loading
      Swal.fire({
        title: 'Adding Product...',
        text: 'Please wait while we save your product',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const newProduct = {
        ...productForm,
        price: parseFloat(productForm.price),
        image: productForm.images[0] // Keep first image as main for compatibility
      };

      // Add product to Firebase
      const addedProduct = await productsService.addProduct(newProduct);
      
      // Update local state
      setProducts(prev => [addedProduct, ...prev]);

      // Reset form
      setProductForm({
        name: '',
        price: '',
        description: '',
        category: 't-shirts',
        sizes: [],
        colors: [],
        images: []
      });

      Swal.fire({
        icon: 'success',
        title: 'Product added successfully',
        text: 'Your product has been saved to the database',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error adding product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add product. Please try again.'
      });
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm(product);
    setActiveTab('add-product');
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    try {
      // Show loading
      Swal.fire({
        title: 'Updating Product...',
        text: 'Please wait while we update your product',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const updatedProductData = {
        ...productForm,
        price: parseFloat(productForm.price)
      };

      // Update product in Firebase
      await productsService.updateProduct(editingProduct.id, updatedProductData);
      
      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id ? { ...updatedProductData, id: editingProduct.id } : p
      ));
      
      setEditingProduct(null);
      setProductForm({
        name: '',
        price: '',
        description: '',
        category: 't-shirts',
        sizes: [],
        colors: [],
        images: []
      });

      Swal.fire({
        icon: 'success',
        title: 'Product updated successfully',
        text: 'Your product has been updated in the database',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error updating product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update product. Please try again.'
      });
    }
  };

  const handleDeleteProduct = (productId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This product will be permanently deleted from the database',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Show loading
          Swal.fire({
            title: 'Deleting Product...',
            text: 'Please wait while we delete the product',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          // Delete product from Firebase
          await productsService.deleteProduct(productId);
          
          // Update local state
          setProducts(prev => prev.filter(p => p.id !== productId));
          
          Swal.fire({
            title: 'Deleted!',
            text: 'Product has been deleted successfully',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        } catch (error) {
          console.error('Error deleting product:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete product. Please try again.'
          });
        }
      }
    });
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Show loading
      Swal.fire({
        title: 'Updating Order Status...',
        text: 'Please wait while we update the order status',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Update order status in Firebase
      await ordersService.updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      Swal.fire({
        icon: 'success',
        title: 'Order status updated',
        text: `Order status changed to ${newStatus}`,
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      
      // More detailed error message
      let errorMessage = 'Failed to update order status. Please try again.';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your admin access.';
      } else if (error.code === 'not-found') {
        errorMessage = 'Order not found. Please refresh the page.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Firebase service unavailable. Please check your internet connection.';
      } else if (error.code === 'deadline-exceeded') {
        errorMessage = 'Request timeout. Please try again.';
      } else if (error.code === 'resource-exhausted') {
        errorMessage = 'Firebase quota exceeded. Please try again later.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      // Try fallback to localStorage if Firebase fails
      try {
        const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        const updatedLocalOrders = localOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        );
        localStorage.setItem('orders', JSON.stringify(updatedLocalOrders));
        
        // Update local state
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        
        Swal.fire({
          icon: 'warning',
          title: 'Order status updated (local)',
          text: `Order status changed to ${newStatus} (saved locally due to connection issues)`,
          showConfirmButton: false,
          timer: 2000
        });
        return;
      } catch (localError) {
        console.error('Local fallback also failed:', localError);
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-card shadow-sm border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/twenty.jpg" 
                alt="Twenty-Two Logo" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white hover:bg-gray-200 text-dark-bg px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex flex-wrap justify-center md:justify-start space-x-2 md:space-x-8">
            <button
              onClick={() => setActiveTab('add-product')}
              className={`py-3 px-3 md:py-4 md:px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'add-product'
                  ? 'border-white text-white'
                  : 'border-transparent text-white hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <FiPlus className="inline mr-1 md:mr-2" size={16} />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button
              onClick={() => setActiveTab('manage-products')}
              className={`py-3 px-3 md:py-4 md:px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'manage-products'
                  ? 'border-white text-white'
                  : 'border-transparent text-white hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <FiPackage className="inline mr-1 md:mr-2" size={16} />
              <span className="hidden sm:inline">Manage Products</span>
              <span className="sm:hidden">Manage</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-3 md:py-4 md:px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-white text-white'
                  : 'border-transparent text-white hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <FiShoppingCart className="inline mr-1 md:mr-2" size={16} />
              <span className="hidden sm:inline">Orders</span>
              <span className="sm:hidden">Orders</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'add-product' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-dark-gray mb-6">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            
            <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={productForm.name}
                    onChange={handleProductFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">
                    Price (LE) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={productForm.price}
                    onChange={handleProductFormChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-gray mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={handleProductFormChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                  placeholder="Product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-gray mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={productForm.category}
                  onChange={handleProductFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-gray mb-2">
                  Sizes *
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeChange(size)}
                      className={`px-3 py-1 rounded-md border-2 transition-all ${
                        (productForm && productForm.sizes && productForm.sizes.includes(size))
                          ? 'border-dark-bg bg-dark-bg text-white'
                          : 'border-gray-300 hover:border-white text-black bg-gray-100'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-gray mb-2">
                  Colors *
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      className={`px-3 py-1 rounded-md border-2 transition-all ${
                        (productForm && productForm.colors && productForm.colors.includes(color))
                          ? 'border-dark-bg bg-dark-bg text-white'
                          : 'border-gray-300 hover:border-white text-black bg-gray-100'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-gray mb-2">
                  Product Images *
                </label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center space-x-2 btn-secondary cursor-pointer"
                    >
                      <FiUpload size={20} />
                      <span>Upload Images</span>
                    </label>
                    <span className="text-sm text-gray-500">
                      Select multiple images (max 800x800px, compressed automatically)
                    </span>
                  </div>
                  
                  {/* Image Preview Grid */}
                  {productForm.images && productForm.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {productForm.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-contain rounded-lg bg-gray-50"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-1 left-1 bg-white text-dark-bg text-xs px-2 py-1 rounded">
                              Main
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({
                        name: '',
                        price: '',
                        description: '',
                        category: 't-shirts',
                        sizes: [],
                        colors: [],
                        images: []
                      });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {activeTab === 'manage-products' && (
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-xl font-bold text-dark-gray mb-6">Manage Products</h2>
            
            {products.length === 0 ? (
              <div className="text-center py-12">
                <FiPackage className="mx-auto text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500">No products available</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex space-x-1 mr-4">
                                {product.images && product.images.length > 0 ? (
                                  product.images.slice(0, 3).map((image, index) => (
                                    <img
                                      key={index}
                                      src={image}
                                      alt={`${product.name} ${index + 1}`}
                                      className="w-10 h-10 object-contain rounded border-2 border-gray-200"
                                    />
                                  ))
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">No Image</span>
                                  </div>
                                )}
                                {product.images && product.images.length > 3 && (
                                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">+{product.images.length - 3}</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {(product.colors || []).join(', ')} • {(product.sizes || []).join(', ')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {categories.find(c => c.value === product.category)?.label}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.price} LE
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Edit Product"
                              >
                                <FiEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Delete Product"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start space-x-3">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-16 h-16 object-contain rounded border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {categories.find(c => c.value === product.category)?.label}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {product.price} LE
                          </p>
                          <div className="text-xs text-gray-500 mt-1">
                            Colors: {(product.colors || []).join(', ') || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Sizes: {(product.sizes || []).join(', ') || 'N/A'}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-900 p-2 bg-white rounded-md border border-gray-200"
                            title="Edit Product"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900 p-2 bg-white rounded-md border border-gray-200"
                            title="Delete Product"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-dark-gray">Orders</h2>
              <div className="flex space-x-2">
                <button
                  onClick={async () => {
                    try {
                      const isConnected = await ordersService.testConnection();
                      const ordersAccess = await ordersService.testOrdersAccess();
                      
                      let message = isConnected ? 'Firebase connection is working' : 'Firebase connection failed';
                      if (ordersAccess.success) {
                        message += `\nOrders collection accessible (${ordersAccess.orderCount} orders found)`;
                      } else {
                        message += `\nOrders collection access failed: ${ordersAccess.error}`;
                      }
                      
                      Swal.fire({
                        icon: isConnected && ordersAccess.success ? 'success' : 'warning',
                        title: 'Connection Test',
                        text: message,
                        showConfirmButton: false,
                        timer: 3000
                      });
                    } catch (error) {
                      Swal.fire({
                        icon: 'error',
                        title: 'Connection Test Failed',
                        text: error.message,
                        showConfirmButton: false,
                        timer: 2000
                      });
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Test Connection
                </button>
                {orders.length > 0 && (
                  <button
                    onClick={async () => {
                      try {
                        const firstOrder = orders[0];
                        const orderDetails = await ordersService.getOrder(firstOrder.id);
                        Swal.fire({
                          icon: 'info',
                          title: 'Order Details',
                          html: `
                            <div class="text-left">
                              <p><strong>Order ID:</strong> ${orderDetails.id}</p>
                              <p><strong>Status:</strong> ${orderDetails.status}</p>
                              <p><strong>Customer:</strong> ${orderDetails.customerInfo?.name || 'N/A'}</p>
                              <p><strong>Total:</strong> ${orderDetails.total || orderDetails.pricing?.total || 'N/A'} LE</p>
                            </div>
                          `,
                          confirmButtonText: 'OK'
                        });
                      } catch (error) {
                        Swal.fire({
                          icon: 'error',
                          title: 'Error',
                          text: error.message,
                          confirmButtonText: 'OK'
                        });
                      }
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Debug First Order
                  </button>
                )}
              </div>
            </div>
            
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <FiUsers className="mx-auto text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-dark-gray">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(order.orderDate)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer Info */}
                      <div>
                        <h4 className="font-semibold text-dark-gray mb-2">Customer Information</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Name:</strong> {order.customerInfo.name}</p>
                          <p><strong>Phone:</strong> {order.customerInfo.phone}</p>
                          {order.customerInfo.alternatePhone && (
                            <p><strong>Alternate Phone:</strong> {order.customerInfo.alternatePhone}</p>
                          )}
                          <p><strong>Address:</strong> {order.customerInfo.address}</p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold text-dark-gray mb-2">Products</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-3 space-x-reverse text-sm">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-8 h-8 object-contain rounded bg-gray-50"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-gray-600">
                                  {item.color} • {item.size} • Quantity: {item.quantity}
                                </p>
                              </div>
                              <p className="font-semibold">{item.price * item.quantity} LE</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Order Total */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-dark-gray">Total Amount:</span>
                        <span className="font-bold bg-white text-dark-bg px-3 py-1 rounded text-lg">{order.total} LE</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
});

export default AdminPage;
