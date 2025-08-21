import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { FiChevronLeft, FiChevronRight, FiShoppingCart, FiCreditCard } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { productsService } from '../services/firebaseService';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // Load product from Firebase Firestore (single doc)
    const loadProduct = async () => {
      try {
        const foundProduct = await productsService.getProductById(id);
        if (foundProduct) {
          // If product is sold out, block access and redirect
          if (foundProduct.soldOut) {
            Swal.fire({
              icon: 'info',
              title: 'Sold Out',
              text: 'This product is sold out and is no longer available.',
            }).then(() => navigate('/'));
            return;
          }
          // Use only uploaded images from admin panel, fallback to single image if no images array
          const productImages = foundProduct.images && foundProduct.images.length > 0 
            ? foundProduct.images 
            : (foundProduct.image ? [foundProduct.image] : []);
          
          setProduct({
            ...foundProduct,
            images: productImages,
            description: foundProduct.description || 'High-quality product made from the finest imported materials. Comfortable and suitable for daily use. Features durability and elegance at the same time.'
          });
          setSelectedColor(foundProduct.colors && foundProduct.colors.length > 0 ? foundProduct.colors[0] : '');
          setSelectedSize(foundProduct.sizes && foundProduct.sizes.length > 0 ? foundProduct.sizes[0] : '');
        }
      } catch (error) {
        console.error('Error loading product from Firebase:', error);
        // Fallback to localStorage
        const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const foundProduct = savedProducts.find(p => p.id === id);
        
        if (foundProduct) {
          if (foundProduct.soldOut) {
            Swal.fire({
              icon: 'info',
              title: 'Sold Out',
              text: 'This product is sold out and is no longer available.',
            }).then(() => navigate('/'));
            return;
          }
          const productImages = foundProduct.images && foundProduct.images.length > 0 
            ? foundProduct.images 
            : (foundProduct.image ? [foundProduct.image] : []);
          
          setProduct({
            ...foundProduct,
            images: productImages,
            description: foundProduct.description || 'High-quality product made from the finest imported materials. Comfortable and suitable for daily use. Features durability and elegance at the same time.'
          });
          setSelectedColor(foundProduct.colors && foundProduct.colors.length > 0 ? foundProduct.colors[0] : '');
          setSelectedSize(foundProduct.sizes && foundProduct.sizes.length > 0 ? foundProduct.sizes[0] : '');
        }
      }
    };

    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product?.soldOut) {
      Swal.fire({ icon: 'info', title: 'Sold Out', text: 'This product is sold out.' });
      return;
    }
    if (!selectedColor || !selectedSize) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please select color and size'
      });
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      color: selectedColor,
      size: selectedSize,
      quantity
    };

    addToCart(cartItem);
    
    Swal.fire({
      icon: 'success',
      title: 'Product added to cart',
      showConfirmButton: false,
      timer: 1500
    });
  };

  const handleBuyNow = () => {
    if (product?.soldOut) {
      Swal.fire({ icon: 'info', title: 'Sold Out', text: 'This product is sold out.' });
      return;
    }
    if (!selectedColor || !selectedSize) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please select color and size'
      });
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      color: selectedColor,
      size: selectedSize,
      quantity
    };

    addToCart(cartItem);
    navigate('/checkout');
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-lg">Product not found</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-w-16 aspect-h-16 bg-gray-100 rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-96 object-contain bg-gray-50"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">No Image Available</span>
                </div>
              )}
              {product.soldOut && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-red-600 text-white px-4 py-1 rounded text-sm font-bold rotate-[-15deg]">SOLD OUT</span>
                </div>
              )}
              
              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition-all"
                  >
                    <FiChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition-all"
                  >
                    <FiChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Images */}
            <div className="flex space-x-2">
              {product.images && product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-gold' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-contain bg-gray-50"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-dark-gray mb-2">{product.name}</h1>
              <p className="text-3xl font-bold bg-white text-dark-bg px-4 py-2 rounded-lg border-2 border-dark-bg">{product.price} LE</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dark-gray mb-2">Description</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>

            {/* Colors */}
            <div>
              <h3 className="text-lg font-semibold text-dark-gray mb-3">Color</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors && product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedColor === color
                        ? 'border-white bg-white text-black'
                        : 'border-gray-300 hover:border-white'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-lg font-semibold text-dark-gray mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes && product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedSize === size
                        ? 'border-white bg-white text-black'
                        : 'border-gray-300 hover:border-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="text-lg font-semibold text-dark-gray mb-3">Quantity</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-gold transition-colors"
                >
                  -
                </button>
                <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-gold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center space-x-2 btn-secondary"
              >
                <FiShoppingCart size={20} />
                <span>Add to Cart</span>
              </button>
              
              <button
                onClick={handleBuyNow}
                className="w-full flex items-center justify-center space-x-2 btn-primary"
              >
                <FiCreditCard size={20} />
                <span>Buy Now</span>
              </button>
            </div>

            {/* Shipping Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-dark-gray mb-2">Shipping Information</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Shipping fee: 50 LE</li>
                <li>• Delivery time: 3-5 business days</li>
                <li>• Cash on delivery available</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetailsPage;