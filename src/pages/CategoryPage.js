import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FiGrid, FiList } from 'react-icons/fi';

const CategoryPage = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');

  const categoryNames = {
    't-shirts': 'تيشرتات',
    'pants': 'بناطيل',
    'sweatshirts': 'سويت شيرت'
  };

  useEffect(() => {
    // Load products from localStorage and filter by category
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const categoryProducts = savedProducts.filter(product => product.category === category);
    
    // Sort products
    const sortedProducts = [...categoryProducts].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
        default:
          return a.name.localeCompare(b.name, 'ar');
      }
    });
    
    setProducts(sortedProducts);
  }, [category, sortBy]);

  const sortOptions = [
    { value: 'name', label: 'الاسم' },
    { value: 'price-low', label: 'السعر: من الأقل للأعلى' },
    { value: 'price-high', label: 'السعر: من الأعلى للأقل' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link to="/" className="hover:text-gold">الرئيسية</Link>
            <span className="mx-2">/</span>
            <span>{categoryNames[category]}</span>
          </nav>
          <h1 className="text-3xl font-bold text-dark-gray mb-4">{categoryNames[category]}</h1>
          <p className="text-gray-600">اكتشف مجموعتنا من {categoryNames[category]}</p>
        </div>

        {/* Controls */}
        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            
            {/* Products Count */}
            <div>
              <p className="text-gray-600">
                عرض {products.length} منتج
              </p>
            </div>

            {/* Sort and View Controls */}
            <div className="flex items-center space-x-4 space-x-reverse">
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

        {/* Products Grid/List */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">لا توجد منتجات متاحة في هذه الفئة</p>
            <Link to="/products" className="btn-primary mt-4 inline-block">
              تصفح جميع المنتجات
            </Link>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {products.map((product) => (
              <div
                key={product.id}
                className={viewMode === 'grid'
                  ? 'bg-white rounded-lg shadow-lg overflow-hidden card-hover'
                  : 'bg-white rounded-lg shadow-lg overflow-hidden flex card-hover'
                }
              >
                <div className={viewMode === 'grid' ? 'aspect-w-16 aspect-h-12' : 'w-48 flex-shrink-0'}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className={viewMode === 'grid' ? 'w-full h-64 object-cover' : 'w-full h-48 object-cover'}
                  />
                </div>
                <div className="p-6 flex-1">
                  <h3 className="text-lg font-semibold text-dark-gray mb-2">{product.name}</h3>
                  <p className="text-gold font-bold text-xl mb-2">{product.price} جنيه</p>
                  
                  {viewMode === 'list' && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">
                        الألوان: {product.colors.join(', ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        المقاسات: {product.sizes.join(', ')}
                      </p>
                    </div>
                  )}
                  
                  <Link
                    to={`/product/${product.id}`}
                    className="block w-full text-center btn-primary"
                  >
                    عرض المنتج
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CategoryPage;