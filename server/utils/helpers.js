// Helper utility functions for the backend

// Generate unique order ID
const generateOrderId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${randomStr}`.toUpperCase();
};

// Generate unique product SKU
const generateSKU = (category, name) => {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const nameCode = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
  const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${categoryCode}-${nameCode}-${randomCode}`;
};

// Format currency for display
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// Calculate shipping cost based on total and location
const calculateShipping = (subtotal, city = '') => {
  // Free shipping over $100
  if (subtotal >= 100) {
    return 0;
  }
  
  // Base shipping rate
  let shippingRate = 12;
  
  // Adjust for different cities/regions (example)
  const premiumCities = ['New York', 'Los Angeles', 'Chicago', 'San Francisco'];
  if (premiumCities.includes(city)) {
    shippingRate += 3;
  }
  
  return shippingRate;
};

// Calculate estimated delivery date
const calculateDeliveryDate = (city = '', processingDays = 1) => {
  const now = new Date();
  
  // Base delivery time (business days)
  let deliveryDays = 3;
  
  // Adjust for location
  const remoteCities = ['Alaska', 'Hawaii', 'International'];
  if (remoteCities.some(remote => city.includes(remote))) {
    deliveryDays = 7;
  }
  
  // Add processing time
  const totalDays = processingDays + deliveryDays;
  
  // Calculate delivery date (excluding weekends)
  let deliveryDate = new Date(now);
  let addedDays = 0;
  
  while (addedDays < totalDays) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    
    // Skip weekends
    if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
      addedDays++;
    }
  }
  
  return deliveryDate.toISOString();
};

// Validate and normalize phone number
const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format US phone numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // Return original if can't normalize
  return phone;
};

// Generate pagination metadata
const generatePaginationMeta = (page, pageSize, totalCount) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

// Create search filters for Firestore queries
const createSearchFilters = (searchTerm) => {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return null;
  }
  
  const term = searchTerm.toLowerCase().trim();
  
  return {
    startAt: term,
    endAt: term + '\uf8ff'
  };
};

// Log activity for audit trail
const logActivity = (type, action, details, userId = null) => {
  const activity = {
    type,
    action,
    details,
    userId,
    timestamp: new Date().toISOString(),
    ip: null, // Would be filled by middleware
    userAgent: null // Would be filled by middleware
  };
  
  console.log('Activity Log:', JSON.stringify(activity));
  
  // In production, you might want to store this in a separate collection
  return activity;
};

// Validate file upload
const validateFileUpload = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxSize = 5 * 1024 * 1024) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    errors.push(`File size too large. Maximum size: ${maxSizeMB}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate secure random token
const generateSecureToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// Create user session token (simplified for demo)
const createUserToken = (userId, email) => {
  const timestamp = Date.now();
  const tokenData = `${userId}:${email}:${timestamp}`;
  return Buffer.from(tokenData).toString('base64');
};

// Parse user token
const parseUserToken = (token) => {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, email, timestamp] = decoded.split(':');
    
    return {
      userId,
      email,
      timestamp: parseInt(timestamp),
      isValid: userId && email && timestamp
    };
  } catch (error) {
    return { isValid: false };
  }
};

// Retry function for database operations
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};

// Clean up old data (for maintenance tasks)
const cleanupOldData = async (collection, daysOld = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  console.log(`Cleanup: Looking for ${collection} data older than ${cutoffDate.toISOString()}`);
  
  // This would implement the actual cleanup logic
  // For now, just return a summary
  return {
    collection,
    cutoffDate: cutoffDate.toISOString(),
    deletedCount: 0,
    message: 'Cleanup completed'
  };
};

module.exports = {
  generateOrderId,
  generateSKU,
  formatCurrency,
  calculateShipping,
  calculateDeliveryDate,
  normalizePhoneNumber,
  generatePaginationMeta,
  createSearchFilters,
  logActivity,
  validateFileUpload,
  generateSecureToken,
  createUserToken,
  parseUserToken,
  retryOperation,
  cleanupOldData
};