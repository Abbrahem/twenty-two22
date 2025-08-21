import React from 'react';

const LoadingPage = () => {
  return (
    <div className="fixed inset-0 bg-dark-gray flex flex-col items-center justify-center z-50">
      <div className="text-center">
        {/* Logo */}
        <div className="w-24 h-24 mx-auto mb-6 animate-pulse">
          <img 
            src="/twenty.jpg" 
            alt="Twenty-Two Logo" 
            className="w-full h-full object-cover rounded-full shadow-2xl"
          />
        </div>
        
        {/* Brand Name */}
        <h1 className="text-4xl font-bold text-white mb-4 animate-fade-in">
          Twenty-Two
        </h1>
        
        {/* Tagline */}
        <p className="text-white text-lg mb-8 animate-fade-in">
          Modern Fashion Store
        </p>
        
        {/* Loading Spinner */}
        <div className="spinner mx-auto"></div>
      </div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border border-gold rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 border border-gold rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-32 w-12 h-12 border border-gold rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 right-10 w-24 h-24 border border-gold rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>
    </div>
  );
};

export default LoadingPage;