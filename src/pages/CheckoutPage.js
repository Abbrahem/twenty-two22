import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiCreditCard, FiTruck, FiShield } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { ordersService } from '../services/firebaseService';

const CheckoutPage = () => {
  const { items, getCartTotal, getShippingTotal, clearCart } = useCart();
  const { user, addOrderToUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    address: '',
    phone: '',
    alternatePhone: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate phone numbers
      if (!formData.phone.startsWith('+20')) {
        formData.phone = '+20' + formData.phone.replace(/^\+?20/, '');
      }
      if (formData.alternatePhone && !formData.alternatePhone.startsWith('+20')) {
        formData.alternatePhone = '+20' + formData.alternatePhone.replace(/^\+?20/, '');
      }

      // Create order object
      const order = {
        id: Date.now().toString(),
        customerInfo: formData,
        items: items,
        subtotal: getCartTotal(),
        shipping: getShippingTotal(),
        total: getCartTotal() + getShippingTotal(),
        status: 'pending',
        orderDate: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now
      };

      // Save order to Firebase Firestore
      await ordersService.createOrder(order);

      // Add order to user if logged in
      if (user) {
        addOrderToUser(order);
      }

      // Clear cart
      clearCart();

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Order Confirmed!',
        text: `Thank you ${formData.name}! Your order has been confirmed successfully. Order number: ${order.id}`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#D4AF37'
      });

      // Redirect to home
      navigate('/');

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while confirming the order. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to cart if no items - use useEffect to avoid setState during render
  React.useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-dark-gray mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-dark-gray mb-6">Delivery Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-gray mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                  placeholder="Enter customer full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-gray mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                  placeholder="Any additional notes for delivery"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-gray mb-2">
                  Full Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                  placeholder="Enter your full address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-gray mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-gray mb-2">
                  Alternate Phone Number
                </label>
                <input
                  type="tel"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                  placeholder="Enter your alternate phone number"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Delivery takes 3-5 working days. You will be contacted before shipping to confirm the order.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Confirming Order...
                  </div>
                ) : (
                  'Confirm Order'
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-dark-gray mb-6">Order Summary</h2>
            
            {/* Order Items */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={`${item.id}-${item.color}-${item.size}`} className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-16 h-16 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-dark-gray">{item.name}</h4>
                    <p className="text-sm text-gray-600">Color: {item.color}</p>
                    <p className="text-sm text-gray-600">Size: {item.size}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-dark-gray">{item.price * item.quantity} LE</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-300 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{getCartTotal()} LE</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-semibold">{getShippingTotal()} LE</span>
              </div>
              
              <div className="flex justify-between text-lg font-bold text-dark-gray pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span className="text-lg font-bold bg-white text-dark-bg px-3 py-1 rounded">{getCartTotal() + getShippingTotal()} LE</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-semibold text-dark-gray mb-2">Payment Method</h4>
              <p className="text-sm text-gray-600">Cash on Delivery</p>
              <p className="text-sm text-gray-600">الدفع عند الاستلام (كاش)</p>
            </div>

            {/* Delivery Info */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-semibold text-dark-gray mb-2">معلومات التوصيل</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• التوصيل خلال 3-5 أيام عمل</li>
                <li>• يتم التواصل قبل التوصيل</li>
                <li>• إمكانية فحص المنتج قبل الدفع</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutPage;