import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiShoppingCart, FiMenu, FiX } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getCartItemsCount } = useCart();
  const { user, openAuthModal, logout } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      openAuthModal('login');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'All Products', href: '/products' },
    { name: 'T-Shirts', href: '/category/t-shirts' },
    { name: 'Pants', href: '/category/pants' },
    { name: 'Sweatshirts', href: '/category/sweatshirts' },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-white text-dark-bg py-2 text-center text-sm">
        <p>Browse the Summer Collection</p>
      </div>

      {/* Main Navbar */}
      <nav className="bg-dark-bg shadow-lg sticky top-0 z-50 border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>

            {/* Logo and Site Name */}
            <div className="flex items-center space-x-2">
              <Link to="/" className="flex items-center space-x-2">
                <img 
                  src="/twenty.jpg" 
                  alt="Twenty-Two Logo" 
                  className="h-10 w-10 rounded-full object-cover"
                />
                <span className="text-xl font-bold text-white">Twenty-Two</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-white hover:text-gray-300 transition-colors font-medium">
                Home
              </Link>
              <Link to="/products" className="text-white hover:text-gray-300 transition-colors font-medium">
                Products
              </Link>
              <Link to="/cart" className="text-white hover:text-gray-300 transition-colors font-medium relative">
                <FiShoppingCart size={20} />
                {getCartItemsCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-dark-bg text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartItemsCount()}
                  </span>
                )}
              </Link>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
                  >
                    <FiUser size={20} />
                    <span className="font-medium">{user.name}</span>
                    <FiChevronDown size={16} />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-card rounded-md shadow-lg py-1 z-50 border border-dark-border">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-white hover:bg-dark-border"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-border"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="text-white hover:text-gray-300 transition-colors font-medium">
                  Login
                </Link>
              )}
            </div>

            {/* Profile and Cart Icons */}
            <div className="flex items-center space-x-4">
              {/* Profile Icon */}
              <div className="relative">
                {user ? (
                  <div className="group relative">
                    <button
                      onClick={handleProfileClick}
                      className="text-white hover:text-gray-300 transition-colors p-2"
                    >
                      <FiUser size={20} />
                    </button>
                    {/* Dropdown Menu */}
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        <button
                          onClick={handleProfileClick}
                          className="block w-full text-left px-4 py-2 text-sm text-dark-gray hover:bg-gray-100"
                        >
                          My Account
                        </button>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-dark-gray hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleProfileClick}
                    className="text-white hover:text-gray-300 transition-colors p-2"
                  >
                    <FiUser size={20} />
                  </button>
                )}
              </div>

              {/* Cart Icon */}
              <Link
                to="/cart"
                className="relative text-white hover:text-gray-300 transition-colors p-2"
              >
                <FiShoppingCart size={20} />
                {getCartItemsCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-dark-bg text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {getCartItemsCount()}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-dark-card border-t border-dark-border">
              <Link
                to="/"
                className="block px-3 py-2 text-white hover:text-gray-300 transition-colors font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/products"
                className="block px-3 py-2 text-white hover:text-gray-300 transition-colors font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                to="/cart"
                className="block px-3 py-2 text-white hover:text-gray-300 transition-colors font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Cart
              </Link>
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-white hover:text-gray-300 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-white hover:text-gray-300 transition-colors font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-3 py-2 text-white hover:text-gray-300 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;