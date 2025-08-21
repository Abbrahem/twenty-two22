const { doc, getDoc, query, collection, where, getDocs, limit } = require('firebase/firestore');
const { db } = require('../config/firebase');

// Authenticate admin middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin token required.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // For demo purposes, using simple token validation
    // In production, use proper JWT tokens with expiration
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [username, timestamp] = decoded.split(':');
      
      // Check if token is not too old (24 hours)
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (tokenAge > maxAge) {
        return res.status(401).json({
          success: false,
          message: 'Admin token expired. Please login again.'
        });
      }

      // Validate admin credentials
      const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
      
      if (username !== ADMIN_USERNAME) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin token.'
        });
      }

      // Add admin info to request
      req.user = {
        username,
        role: 'admin',
        loginTime: new Date(parseInt(timestamp)).toISOString()
      };

      next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token format.'
      });
    }

  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication service error'
    });
  }
};

// Authenticate user middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User token required.'
      });
    }

    const token = authHeader.substring(7);
    
    // For demo purposes, using simple token validation
    // In production, use proper JWT tokens with Firebase Auth
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId, email, timestamp] = decoded.split(':');
      
      // Check if token is not too old (7 days)
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (tokenAge > maxAge) {
        return res.status(401).json({
          success: false,
          message: 'User token expired. Please login again.'
        });
      }

      // Verify user exists and is active
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return res.status(401).json({
          success: false,
          message: 'User not found.'
        });
      }

      const userData = userSnap.data();
      
      if (!userData.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated.'
        });
      }

      if (userData.email !== email) {
        return res.status(401).json({
          success: false,
          message: 'Invalid user token.'
        });
      }

      // Add user info to request
      req.user = {
        id: userId,
        email,
        name: userData.name,
        role: userData.role || 'customer',
        loginTime: new Date(parseInt(timestamp)).toISOString()
      };

      next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user token format.'
      });
    }

  } catch (error) {
    console.error('User authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication service error'
    });
  }
};

// Optional authentication middleware (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth provided, continue without user info
      req.user = null;
      return next();
    }

    // Try to authenticate, but don't fail if invalid
    try {
      await authenticateUser(req, res, next);
    } catch (error) {
      // Authentication failed, but continue without user info
      req.user = null;
      next();
    }

  } catch (error) {
    // Continue without authentication
    req.user = null;
    next();
  }
};

// Rate limiting middleware
const createRateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [key, value] of requests.entries()) {
      if (value.timestamp < windowStart) {
        requests.delete(key);
      }
    }
    
    // Check current client
    const clientRequests = requests.get(clientId) || { count: 0, timestamp: now };
    
    if (clientRequests.timestamp < windowStart) {
      // Reset counter for new window
      clientRequests.count = 1;
      clientRequests.timestamp = now;
    } else {
      clientRequests.count++;
    }
    
    requests.set(clientId, clientRequests);
    
    if (clientRequests.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - clientRequests.count));
    res.setHeader('X-RateLimit-Reset', new Date(clientRequests.timestamp + windowMs).toISOString());
    
    next();
  };
};

module.exports = {
  authenticateAdmin,
  authenticateUser,
  optionalAuth,
  createRateLimit
};