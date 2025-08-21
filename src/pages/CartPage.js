import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag } from 'react-icons/fi';
import Swal from 'sweetalert2';

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, getCartTotal, getShippingTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const handleRemoveItem = (item) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This product will be removed from the cart',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#D4AF37',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        removeFromCart(item);
        Swal.fire({
          title: 'Deleted!',
          text: 'Product has been removed from cart',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const handleClearCart = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'All products will be removed from the cart',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#D4AF37',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, clear all',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        clearCart();
        Swal.fire({
          title: 'Cleared!',
          text: 'All products have been removed from cart',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const updateItemQuantity = (item, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(item);
    } else {
      updateQuantity(item, newQuantity);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <FiShoppingBag className="mx-auto text-6xl text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-dark-gray mb-4">Cart is Empty</h2>
            <p className="text-gray-600 mb-8">You haven't added any products to your cart yet</p>
            <Link to="/products" className="btn-primary">
              Shop Now
            </Link>
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
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-dark-gray">Shopping Cart</h1>
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={`${item.id}-${item.color}-${item.size}`} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-dark-gray">{item.name}</h3>
                    <p className="text-sm text-gray-600">Color: {item.color}</p>
                    <p className="text-sm text-gray-600">Size: {item.size}</p>
                    <p className="text-lg font-bold bg-white text-dark-bg px-3 py-1 rounded mt-2">{item.price} LE</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateItemQuantity(item, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gold transition-colors"
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateItemQuantity(item, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gold transition-colors"
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item)}
                    className="text-red-600 hover:text-red-800 transition-colors p-2"
                  >
                    <FiTrash2 size={20} />
                  </button>
                </div>

                {/* Item Total */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-dark-gray">{item.price * item.quantity} LE</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-dark-gray mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{getCartTotal()} LE</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-semibold">{getShippingTotal()} LE</span>
                </div>
                
                <div className="border-t border-gray-300 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-dark-gray">Total:</span>
                    <span className="text-lg font-bold bg-white text-dark-bg px-3 py-1 rounded">{getCartTotal() + getShippingTotal()} LE</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full btn-primary"
                >
                  Proceed to Checkout
                </button>
                
                <Link
                  to="/products"
                  className="block w-full text-center btn-secondary"
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Shipping Info */}
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="font-semibold text-dark-gray mb-2">Shipping Information</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Delivery within 3-5 business days</li>
                  <li>• Cash on delivery available</li>
                  <li>• Free shipping for orders over $100</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CartPage;