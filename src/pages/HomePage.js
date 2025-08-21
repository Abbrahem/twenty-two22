import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductSlider from '../components/ProductSlider';
import Footer from '../components/Footer';
import { FiShoppingBag, FiTruck, FiShield } from 'react-icons/fi';
import { productsService } from '../services/firebaseService';

const HomePage = () => {
  const [complaintForm, setComplaintForm] = useState({
    name: '',
    phone: '',
    message: ''
  });
  const [latestProduct, setLatestProduct] = useState(null);

  // Get the latest product from Firebase Firestore
  useEffect(() => {
    const loadLatestProduct = async () => {
      try {
        const firebaseProducts = await productsService.getProducts();
        if (firebaseProducts.length > 0) {
          // Products are already sorted by creation date (newest first) from Firebase
          setLatestProduct(firebaseProducts[0]);
        }
      } catch (error) {
        console.error('Error loading latest product from Firebase:', error);
        // Fallback to localStorage
        const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
        if (savedProducts.length > 0) {
          const sortedProducts = savedProducts.sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : parseInt(a.id) || 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : parseInt(b.id) || 0;
            return bTime - aTime;
          });
          setLatestProduct(sortedProducts[0]);
        }
      }
    };

    loadLatestProduct();
  }, []);

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    const whatsappMessage = `Hello! I have a complaint:

Name: ${complaintForm.name}
Phone: ${complaintForm.phone}
Message: ${complaintForm.message}`;
    
    const whatsappUrl = `https://wa.me/201113362364?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
    
    setComplaintForm({ name: '', phone: '', message: '' });
  };

  const categories = [
    {
      name: 'T-Shirts',
      image: '/TSHIRT.jpg',
      link: '/category/t-shirts'
    },
    {
      name: 'Pants',
      image: '/SHORT.jpg',
      link: '/category/pants'
    },
    {
      name: 'Swoot',
      image: '/SWOOT.jpg',
      link: '/category/sweatshirts'
    }
  ];

  const aboutCards = [
    {
      icon: <FiShoppingBag className="text-4xl text-white" />,
      title: 'About Our Store',
      description: 'We are Twenty-Two, specializing in modern clothing and premium fashion. We offer the best products with high quality and competitive prices.'
    },
    {
      icon: <FiTruck className="text-4xl text-white" />,
      title: 'Delivery',
      description: 'We provide fast and secure delivery service nationwide. Delivery within 3-5 business days with shipping fee of only $5.'
    },
    {
      icon: <FiShield className="text-4xl text-white" />,
      title: 'Materials',
      description: 'We use the finest imported fabrics and materials to ensure comfort and high quality in all our products.'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-dark-bg">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/twenty.jpg')`,
            filter: 'brightness(0.4)'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            Twenty-Two
          </h1>
          <p className="text-xl md:text-2xl mb-8 animate-fade-in-delay">
            Premium Fashion Collection
          </p>
          <Link 
            to="/products" 
            className="inline-block bg-white hover:bg-gray-200 text-dark-bg font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 animate-fade-in-delay-2"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Product Slider Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-dark-gray mb-12">Latest Products</h2>
          <ProductSlider />
          <div className="text-center mt-8">
            <Link 
              to="/products"
              className="btn-primary"
            >
              More Products
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-dark-gray mb-12">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={category.link}
                className="group relative overflow-hidden rounded-lg shadow-lg card-hover"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <h3 className="text-white text-2xl font-bold">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Products Section */}
      {latestProduct && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-dark-bg mb-4">New Product</h2>
              <p className="text-gray-600 text-lg">Discover our latest addition to the collection</p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-500 border border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Product Image */}
                  <div className="relative overflow-hidden">
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-white border-2 border-dark-bg text-dark-bg px-4 py-2 rounded-full text-sm font-bold">
                        NEW
                      </span>
                    </div>
                    <img
                      src={latestProduct.images && latestProduct.images.length > 0 ? latestProduct.images[0] : latestProduct.image}
                      alt={latestProduct.name}
                      className="w-full h-96 lg:h-full object-cover transform hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  
                  {/* Product Details */}
                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <div className="mb-6">
                      <h3 className="text-3xl font-bold text-dark-gray mb-4">{latestProduct.name}</h3>
                      <p className="text-gray-600 mb-6">
                        {latestProduct.description || 'Experience the perfect blend of style and comfort with our latest design. Crafted with premium materials for the modern lifestyle.'}
                      </p>
                      
                      {/* Price */}
                      <div className="mb-6">
                        <span className="text-4xl font-bold bg-white text-dark-bg px-4 py-2 rounded-lg border-2 border-dark-bg">{latestProduct.price} LE</span>
                      </div>
                      
                      {/* Colors & Sizes */}
                      <div className="mb-6 space-y-3">
                        {latestProduct.colors && latestProduct.colors.length > 0 && (
                          <div>
                            <span className="text-sm font-semibold text-gray-700 block mb-2">Available Colors:</span>
                            <div className="flex flex-wrap gap-2">
                              {latestProduct.colors.slice(0, 3).map((color, index) => (
                                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                  {color}
                                </span>
                              ))}
                              {latestProduct.colors.length > 3 && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                  +{latestProduct.colors.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {latestProduct.sizes && latestProduct.sizes.length > 0 && (
                          <div>
                            <span className="text-sm font-semibold text-gray-700 block mb-2">Available Sizes:</span>
                            <div className="flex flex-wrap gap-2">
                              {latestProduct.sizes.map((size, index) => (
                                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                  {size}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* CTA Button */}
                    <Link
                      to={`/product/${latestProduct.id}`}
                      className="inline-flex items-center justify-center bg-white border-2 border-dark-bg text-dark-bg px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Shop Now
                      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-16 bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {aboutCards.map((card, index) => (
              <div
                key={index}
                className="bg-dark-card p-8 rounded-lg shadow-lg text-center card-hover animate-slide-up border border-dark-border"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="mb-4 flex justify-center">{card.icon}</div>
                <h3 className="text-xl font-bold text-white mb-4">{card.title}</h3>
                <p className="text-gray-300">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Complaint Form Section */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-dark-gray mb-12">Submit a Complaint</h2>
          <form onSubmit={handleComplaintSubmit} className="bg-white p-8 rounded-lg shadow-lg">
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-gray mb-2">
                Name
              </label>
              <input
                type="text"
                value={complaintForm.name}
                onChange={(e) => setComplaintForm({...complaintForm, name: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                placeholder="Enter your name"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-gray mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={complaintForm.phone}
                onChange={(e) => setComplaintForm({...complaintForm, phone: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                placeholder="Enter your phone number"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-gray mb-2">
                Message
              </label>
              <textarea
                value={complaintForm.message}
                onChange={(e) => setComplaintForm({...complaintForm, message: e.target.value})}
                required
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                placeholder="Write your complaint here"
              ></textarea>
            </div>
            
            <button
              type="submit"
              className="w-full btn-primary"
            >
              Submit Complaint
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;