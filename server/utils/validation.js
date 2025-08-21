// Validation utilities for the backend

// Validate product data
const validateProduct = (productData, isPartial = false) => {
  const errors = [];
  const required = ['name', 'price', 'category', 'image'];
  
  // Check required fields (only for full validation)
  if (!isPartial) {
    required.forEach(field => {
      if (!productData[field]) {
        errors.push(`${field} is required`);
      }
    });
  }
  
  // Validate specific fields if present
  if (productData.name !== undefined) {
    if (typeof productData.name !== 'string' || productData.name.trim().length < 2) {
      errors.push('Product name must be at least 2 characters long');
    }
    if (productData.name.trim().length > 100) {
      errors.push('Product name must be less than 100 characters');
    }
  }
  
  if (productData.price !== undefined) {
    if (typeof productData.price !== 'number' || productData.price <= 0) {
      errors.push('Price must be a positive number');
    }
    if (productData.price > 10000) {
      errors.push('Price must be less than $10,000');
    }
  }
  
  if (productData.category !== undefined) {
    const validCategories = ['t-shirts', 'pants', 'sweatshirts', 'accessories', 'shoes'];
    if (!validCategories.includes(productData.category)) {
      errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }
  }
  
  if (productData.image !== undefined) {
    if (typeof productData.image !== 'string' || !isValidUrl(productData.image)) {
      errors.push('Image must be a valid URL');
    }
  }
  
  if (productData.colors !== undefined) {
    if (!Array.isArray(productData.colors) || productData.colors.length === 0) {
      errors.push('Colors must be a non-empty array');
    }
  }
  
  if (productData.sizes !== undefined) {
    if (!Array.isArray(productData.sizes) || productData.sizes.length === 0) {
      errors.push('Sizes must be a non-empty array');
    }
  }
  
  if (productData.description !== undefined) {
    if (typeof productData.description !== 'string') {
      errors.push('Description must be a string');
    }
    if (productData.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate order data
const validateOrder = (orderData) => {
  const errors = [];
  
  // Check required fields
  if (!orderData.customerInfo) {
    errors.push('Customer information is required');
  } else {
    const { name, phone, address, city } = orderData.customerInfo;
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Customer name is required and must be at least 2 characters');
    }
    
    if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
      errors.push('Valid phone number is required');
    }
    
    if (!address || typeof address !== 'string' || address.trim().length < 10) {
      errors.push('Complete address is required');
    }
    
    if (!city || typeof city !== 'string' || city.trim().length < 2) {
      errors.push('City is required');
    }
  }
  
  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('Order must contain at least one item');
  } else {
    orderData.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
      
      if (item.quantity > 10) {
        errors.push(`Item ${index + 1}: Maximum quantity is 10`);
      }
      
      if (!item.color || typeof item.color !== 'string') {
        errors.push(`Item ${index + 1}: Color is required`);
      }
      
      if (!item.size || typeof item.size !== 'string') {
        errors.push(`Item ${index + 1}: Size is required`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate user data
const validateUser = (userData, isPartial = false) => {
  const errors = [];
  
  if (!isPartial) {
    // Required fields for registration
    if (!userData.name || typeof userData.name !== 'string' || userData.name.trim().length < 2) {
      errors.push('Name is required and must be at least 2 characters');
    }
    
    if (!userData.email || typeof userData.email !== 'string' || !isValidEmail(userData.email)) {
      errors.push('Valid email address is required');
    }
    
    if (!userData.password || typeof userData.password !== 'string' || userData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
  } else {
    // Partial validation for updates
    if (userData.name !== undefined) {
      if (typeof userData.name !== 'string' || userData.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
      }
    }
    
    if (userData.email !== undefined) {
      if (typeof userData.email !== 'string' || !isValidEmail(userData.email)) {
        errors.push('Valid email address is required');
      }
    }
  }
  
  // Validate name length
  if (userData.name && userData.name.length > 50) {
    errors.push('Name must be less than 50 characters');
  }
  
  // Validate phone if provided
  if (userData.phone !== undefined && userData.phone !== '') {
    if (typeof userData.phone !== 'string' || userData.phone.length < 10) {
      errors.push('Phone number must be at least 10 characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate URL format
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Handle Firebase errors and convert to standardized format
const handleFirebaseError = (error) => {
  console.error('Firebase error:', error);
  
  // Map Firebase error codes to user-friendly messages
  const errorMap = {
    'auth/user-not-found': { status: 404, message: 'User not found' },
    'auth/wrong-password': { status: 401, message: 'Invalid password' },
    'auth/email-already-in-use': { status: 409, message: 'Email already registered' },
    'auth/weak-password': { status: 400, message: 'Password is too weak' },
    'auth/invalid-email': { status: 400, message: 'Invalid email format' },
    'permission-denied': { status: 403, message: 'Access denied' },
    'not-found': { status: 404, message: 'Document not found' },
    'already-exists': { status: 409, message: 'Document already exists' },
    'failed-precondition': { status: 400, message: 'Operation failed due to invalid state' },
    'out-of-range': { status: 400, message: 'Invalid range or limit' },
    'unauthenticated': { status: 401, message: 'Authentication required' },
    'unavailable': { status: 503, message: 'Service temporarily unavailable' },
    'deadline-exceeded': { status: 504, message: 'Request timeout' }
  };
  
  const errorCode = error.code || 'unknown';
  const mappedError = errorMap[errorCode];
  
  if (mappedError) {
    return {
      success: false,
      status: mappedError.status,
      message: mappedError.message,
      code: errorCode
    };
  }
  
  // Default error response
  return {
    success: false,
    status: 500,
    message: 'Internal server error',
    code: errorCode
  };
};

// Sanitize user input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim(); // Remove leading/trailing whitespace
};

// Validate and sanitize object fields
const sanitizeObject = (obj, allowedFields) => {
  const sanitized = {};
  
  allowedFields.forEach(field => {
    if (obj[field] !== undefined) {
      if (typeof obj[field] === 'string') {
        sanitized[field] = sanitizeInput(obj[field]);
      } else {
        sanitized[field] = obj[field];
      }
    }
  });
  
  return sanitized;
};

module.exports = {
  validateProduct,
  validateOrder,
  validateUser,
  isValidEmail,
  isValidUrl,
  handleFirebaseError,
  sanitizeInput,
  sanitizeObject
};