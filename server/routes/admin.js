const express = require('express');
const { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit
} = require('firebase/firestore');
const { db } = require('../config/firebase');
const { validateUser, handleFirebaseError } = require('../utils/validation');
const { authenticateAdmin } = require('../middleware/auth');
const bcrypt = require('bcrypt');

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // For demo purposes, using hardcoded admin credentials
    // In production, store admin credentials securely in database
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Create admin session token (simplified for demo)
    const adminToken = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        username,
        role: 'admin',
        token: adminToken,
        loginTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = {
      products: { total: 0, active: 0, categories: 0 },
      orders: { total: 0, pending: 0, completed: 0, revenue: 0 },
      users: { total: 0, active: 0, newThisMonth: 0 },
      performance: { averageOrderValue: 0, conversionRate: 0 }
    };

    // Get product statistics
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const categories = new Set();
    
    productsSnapshot.forEach((doc) => {
      const product = doc.data();
      stats.products.total++;
      if (product.isActive !== false) stats.products.active++;
      if (product.category) categories.add(product.category);
    });
    stats.products.categories = categories.size;

    // Get order statistics
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    let totalRevenue = 0;
    let completedOrders = 0;
    
    ordersSnapshot.forEach((doc) => {
      const order = doc.data();
      stats.orders.total++;
      
      if (order.status === 'pending') stats.orders.pending++;
      if (order.status === 'delivered') {
        stats.orders.completed++;
        completedOrders++;
        totalRevenue += order.pricing?.total || 0;
      }
    });
    
    stats.orders.revenue = totalRevenue;
    stats.performance.averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // Get user statistics
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      stats.users.total++;
      if (user.isActive !== false) stats.users.active++;
      
      const createdAt = new Date(user.createdAt);
      if (createdAt > oneMonthAgo) stats.users.newThisMonth++;
    });

    // Calculate conversion rate (simplified)
    stats.performance.conversionRate = stats.users.total > 0 
      ? (stats.orders.total / stats.users.total) * 100 
      : 0;

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Get all users (Admin only)
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20,
      sortBy = 'createdAt',
      order = 'desc',
      status = 'all'
    } = req.query;

    let usersQuery = collection(db, 'users');
    
    // Apply status filter
    if (status !== 'all') {
      const isActive = status === 'active';
      usersQuery = query(usersQuery, where('isActive', '==', isActive));
    }
    
    // Apply sorting
    const validSortFields = ['createdAt', 'updatedAt', 'name', 'email'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';
    
    usersQuery = query(usersQuery, orderBy(sortField, sortOrder));
    
    // Apply pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSizeNum = Math.min(50, Math.max(1, parseInt(pageSize)));
    
    usersQuery = query(usersQuery, limit(pageSizeNum));

    const snapshot = await getDocs(usersQuery);
    
    const users = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      // Remove sensitive data
      const { hashedPassword: _, ...safeUserData } = userData;
      users.push({
        id: doc.id,
        ...safeUserData
      });
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total: users.length,
        hasMore: users.length === pageSizeNum
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Update user status (Admin only)
router.patch('/users/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const userRef = doc(db, 'users', id);
    
    // Check if user exists
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await updateDoc(userRef, {
      isActive,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.username || 'admin'
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Get recent activities (Admin only)
router.get('/activities', authenticateAdmin, async (req, res) => {
  try {
    const { limit: limitParam = 50 } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(limitParam)));

    const activities = [];

    // Get recent orders
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(Math.floor(limitNum / 2))
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    
    ordersSnapshot.forEach((doc) => {
      const order = doc.data();
      activities.push({
        id: doc.id,
        type: 'order',
        action: 'created',
        description: `New order #${order.orderId} from ${order.customerInfo?.name}`,
        amount: order.pricing?.total,
        timestamp: order.createdAt,
        status: order.status
      });
    });

    // Get recent user registrations
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(Math.floor(limitNum / 2))
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      activities.push({
        id: doc.id,
        type: 'user',
        action: 'registered',
        description: `New user registration: ${user.name}`,
        email: user.email,
        timestamp: user.createdAt,
        status: user.isActive ? 'active' : 'inactive'
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: activities.slice(0, limitNum)
    });

  } catch (error) {
    console.error('Error fetching activities:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Export data (Admin only)
router.get('/export/:type', authenticateAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['products', 'orders', 'users'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid export type. Valid types: ' + validTypes.join(', ')
      });
    }

    const snapshot = await getDocs(collection(db, type));
    const data = [];
    
    snapshot.forEach((doc) => {
      const docData = doc.data();
      // Remove sensitive data for users
      if (type === 'users') {
        const { hashedPassword: _, ...safeData } = docData;
        data.push({ id: doc.id, ...safeData });
      } else {
        data.push({ id: doc.id, ...docData });
      }
    });

    // Set appropriate headers for CSV download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.json"`);
    
    res.json({
      success: true,
      exportType: type,
      exportDate: new Date().toISOString(),
      totalRecords: data.length,
      data
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// System health check (Admin only)
router.get('/system/health', authenticateAdmin, async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: 'unknown',
        storage: 'unknown'
      }
    };

    // Test database connection
    try {
      await getDocs(query(collection(db, 'products'), limit(1)));
      health.services.database = 'healthy';
    } catch (dbError) {
      health.services.database = 'error';
      health.status = 'degraded';
    }

    // Test storage (simplified check)
    health.services.storage = 'healthy'; // Assume healthy for now

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      data: {
        status: 'error',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;