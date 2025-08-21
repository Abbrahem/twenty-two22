import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FiFilter, FiGrid, FiList } from 'react-icons/fi';
import { productsService } from '../services/firebaseService';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef(null);

  // Sample products - in real app, this would come from Firebase
  const sampleProducts = [
    {
      id: '1',
      name: 'Basic Cotton T-Shirt',
      price: 29,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 't-shirts',
      colors: ['Black', 'White', 'Light Blue'],
      sizes: ['S', 'M', 'L', 'XL']
    },
    {
      id: '2',
      name: 'Classic Denim Jeans',
      price: 59,
      image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 'pants',
      colors: ['Blue', 'Black'],
      sizes: ['M', 'L', 'XL', 'XXL']
    },
    {
      id: '3',
      name: 'Comfortable Sweatshirt',
      price: 45,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 'sweatshirts',
      colors: ['Gray', 'Black', 'White'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL']
    },
    {
      id: '4',
      name: 'Elegant Polo Shirt',
      price: 35,
      image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 't-shirts',
      colors: ['White', 'Light Blue', 'Brown'],
      sizes: ['S', 'M', 'L', 'XL']
    },
    {
      id: '5',
      name: 'Athletic Pants',
      price: 40,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 'pants',
      colors: ['Black', 'Gray'],
      sizes: ['M', 'L', 'XL']
    },
    {
      id: '6',
      name: 'Modern Hoodie',
      price: 55,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 'sweatshirts',
      colors: ['Black', 'Gray', 'Red'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL']
    }
  ];

  const loadProducts = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const page = await productsService.getProductsPaginated({
        pageSize: 12,
        cursor: reset ? null : cursorRef.current,
        category: selectedCategory
      });
      const normalized = page.items.map(product => ({
        ...product,
        colors: product.colors || [],
        sizes: product.sizes || [],
        name: product.name || 'Unknown Product',
        price: product.price || 0
      }));
      setProducts(prev => reset ? normalized : [...prev, ...normalized]);
      setFilteredProducts(prev => reset ? normalized : [...prev, ...normalized]);
      cursorRef.current = page.cursor;
      setHasMore(page.hasMore);
    } catch (error) {
      // Fallback to localStorage if Firebase fails
      try {
        const loadedProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const validatedProducts = loadedProducts.map(product => ({
          ...product,
          colors: product.colors || [],
          sizes: product.sizes || [],
          name: product.name || 'Unknown Product',
          price: product.price || 0
        }));
        setProducts(validatedProducts);
        setFilteredProducts(validatedProducts);
        setHasMore(false);
      } catch (localError) {
        setProducts(sampleProducts);
        setFilteredProducts(sampleProducts);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // On first mount
  useEffect(() => {
    loadProducts(true);
  }, []);

  // Reload when category changes
  useEffect(() => {
    cursorRef.current = null;
    setProducts([]);
    setFilteredProducts([]);
    setHasMore(true);
    loadProducts(true);
  }, [selectedCategory]);

  useEffect(() => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '', 'en');
      }
    });

    setFilteredProducts(filtered);
  }, [products, selectedCategory, sortBy]);

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 't-shirts', label: 'T-Shirts' },
    { value: 'pants', label: 'Pants' },
    { value: 'sweatshirts', label: 'Sweatshirts' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ];

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Our Products</h1>
            <p className="text-gray-300">Discover our premium collection of clothing</p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-dark-card p-4 rounded-lg mb-8 border border-dark-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            
            {/* Category Filter */}
            <div className="flex items-center space-x-4">
              <FiFilter className="text-white" size={20} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-gray-300 text-dark-bg rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort and View Controls */}
            <div className="flex items-center space-x-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-gray-300 text-dark-bg rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-white text-dark-bg border-2 border-dark-bg' : 'bg-gray-200 text-gray-600'}`}
                >
                  <FiGrid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-white text-dark-bg border-2 border-dark-bg' : 'bg-gray-200 text-gray-600'}`}
                >
                  <FiList size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredProducts.length} products
          </p>
        </div>

        {/* Products Grid/List */}
        {filteredProducts.length === 0 ? (
          loading ? (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="animate-pulse bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="w-full h-64 bg-gray-800" />
                  <div className="p-4">
                    <div className="h-5 bg-gray-700 rounded w-2/3 mb-3" />
                    <div className="h-8 bg-gray-700 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products available in this category</p>
            </div>
          )
        ) : (
          <>
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              {filteredProducts.map((product) => (
                <div key={product.id} className={`relative bg-dark-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-dark-border ${product.soldOut ? 'opacity-90' : ''}`}>
                  <div className="relative aspect-w-1 aspect-h-1">
                    <img
                      src={product.images && product.images.length > 0 ? product.images[0] : product.image}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-64 object-contain bg-gray-800"
                    />
                    {product.soldOut && (
                      <div className="absolute top-0 left-0 right-0 bg-red-600/90 text-white text-center py-1 pointer-events-none">
                        <span className="text-xs sm:text-sm font-extrabold tracking-widest">SOLD OUT</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
                    <p className={`px-3 py-1 rounded font-bold text-xl mb-3 ${product.soldOut ? 'bg-red-100 text-red-700 line-through' : 'bg-white text-dark-bg'}`}>{product.price} LE</p>
                    {viewMode === 'list' && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">
                          Colors: {product.colors ? product.colors.join(', ') : 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Sizes: {product.sizes ? product.sizes.join(', ') : 'N/A'}
                        </p>
                      </div>
                    )}
                    {product.soldOut ? (
                      <button disabled className="block w-full text-center cursor-not-allowed bg-gray-400 text-white py-2 rounded">Sold Out</button>
                    ) : (
                      <Link
                        to={`/product/${product.id}`}
                        className="block w-full text-center btn-primary"
                      >
                        View Product
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              {hasMore && (
                <button
                  onClick={() => loadProducts(false)}
                  disabled={loading}
                  className={`btn-secondary ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'جارِ التحميل...' : 'تحميل المزيد'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProductsPage;