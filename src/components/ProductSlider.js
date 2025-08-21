import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { productsService } from '../services/firebaseService';

const ProductSlider = () => {
  const [products, setProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Sample products - in real app, this would come from Firebase
  const sampleProducts = [
    {
      id: '1',
      name: 'Basic Cotton T-Shirt',
      price: 29,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 't-shirts'
    },
    {
      id: '2',
      name: 'Classic Denim Jeans',
      price: 59,
      image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 'pants'
    },
    {
      id: '3',
      name: 'Comfortable Sweatshirt',
      price: 45,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 'sweatshirts'
    },
    {
      id: '4',
      name: 'Elegant Polo Shirt',
      price: 35,
      image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 't-shirts'
    },
    {
      id: '5',
      name: 'Athletic Pants',
      price: 40,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 'pants'
    }
  ];

  useEffect(() => {
    // Load products from Firebase Firestore
    const loadProducts = async () => {
      try {
        const firebaseProducts = await productsService.getProducts();
        if (firebaseProducts.length > 0) {
          setProducts(firebaseProducts);
        } else {
          setProducts(sampleProducts);
        }
      } catch (error) {
        console.error('Error loading products from Firebase:', error);
        // Fallback to localStorage then sample data
        const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
        if (savedProducts.length > 0) {
          setProducts(savedProducts);
        } else {
          setProducts(sampleProducts);
        }
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    // Auto-play slider
    const interval = setInterval(() => {
      if (products.length > 0) {
        setCurrentSlide((prev) => (prev + 1) % Math.ceil(products.length / 3));
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [products.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(products.length / 3));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(products.length / 3)) % Math.ceil(products.length / 3));
  };

  const getVisibleProducts = () => {
    const start = currentSlide * 3;
    const end = start + 3;
    return products.slice(start, end);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No products available at the moment</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {getVisibleProducts().map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden card-hover border border-gray-200">
            <div className="aspect-w-16 aspect-h-12 bg-gray-100">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-64 object-contain"
              />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-dark-bg mb-2">{product.name}</h3>
              <p className="text-dark-bg font-bold text-xl mb-4">{product.price} LE</p>
              <Link
                to={`/product/${product.id}`}
                className="block w-full text-center bg-white border-2 border-dark-bg text-dark-bg py-2 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                View Product
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {products.length > 3 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute top-1/2 -translate-y-1/2 -left-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          >
            <FiChevronLeft className="text-dark-gray" size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute top-1/2 -translate-y-1/2 -right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          >
            <FiChevronRight className="text-dark-gray" size={24} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {products.length > 3 && (
        <div className="flex justify-center space-x-2 mt-6">
          {Array.from({ length: Math.ceil(products.length / 3) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                currentSlide === index ? 'bg-white' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSlider;