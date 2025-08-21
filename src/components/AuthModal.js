import React, { useState } from 'react';
import { FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const AuthModal = () => {
  const { isAuthModalOpen, authMode, closeAuthModal, login, register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      if (authMode === 'login') {
        result = login(formData.email, formData.password);
      } else {
        result = register(formData.name, formData.email, formData.password);
      }

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: authMode === 'login' ? 'Login Successful' : 'Account Created Successfully',
          showConfirmButton: false,
          timer: 1500
        });
        setFormData({ name: '', email: '', password: '' });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.message
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 animate-bounce-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-dark-gray">
            {authMode === 'login' ? 'Login' : 'Create Account'}
          </h2>
          <button
            onClick={closeAuthModal}
            className="text-gray-500 hover:text-dark-gray transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-dark-gray mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                placeholder="Enter your name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-gray mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-gray mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-dark-bg"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="spinner mr-2"></div>
                Loading...
              </div>
            ) : (
              authMode === 'login' ? 'Login' : 'Create Account'
            )}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => {
                const newMode = authMode === 'login' ? 'register' : 'login';
                closeAuthModal();
                setTimeout(() => {
                  document.querySelector('[data-auth-mode]')?.click();
                }, 100);
              }}
              className="text-white hover:underline ml-1"
            >
              {authMode === 'login' ? 'Create Account' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;