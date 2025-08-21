import React from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiMessageCircle } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { name: 'Home', href: '/' },
    { name: 'All Products', href: '/products' },
    { name: 'T-Shirts', href: '/category/t-shirts' },
    { name: 'Pants', href: '/category/pants' },
    { name: 'Sweatshirts', href: '/category/sweatshirts' },
  ];

  return (
    <footer className="bg-dark-card text-white py-12 border-t border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/twenty.jpg" 
                alt="Twenty-Two Logo" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <h3 className="text-2xl font-bold text-white">Twenty-Two</h3>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Your destination for premium fashion. We offer the latest trends in clothing 
              with exceptional quality and style.
            </p>
            
            {/* Social Media Links */}
            <div className="flex space-x-4">
              <a
                href="https://instagram.com/twentytwo"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 p-3 rounded-full hover:bg-white hover:text-dark-bg transition-colors"
              >
                <FiInstagram size={20} />
              </a>
              <a
                href="https://wa.me/201113362364"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 p-3 rounded-full hover:bg-white hover:text-dark-bg transition-colors"
              >
                <FiMessageCircle size={20} />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {footerLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-2 text-gray-300">
              <p>📱 WhatsApp: +20 111 336 2364</p>
              <p>📧 Email: info@twentytwo.com</p>
              <p>🚚 Delivery: 3-5 business days</p>
              <p>💰 Shipping: 50 LE</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {currentYear} Twenty-Two. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;