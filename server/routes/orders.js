const express = require('express');
const { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit
} = require('firebase/firestore');
const { db } = require('../config/firebase');
const { validateOrder, handleFirebaseError } = require('../utils/validation');
const { authenticateAdmin, authenticateUser } = require('../middleware/auth');
const { generateOrderId } = require('../utils/helpers');

const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate order data
    const validation = validateOrder(orderData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Generate unique order ID
    const orderId = generateOrderId();
    
    // Calculate totals
    let subtotal = 0;
    const validatedItems = [];
    
    for (const item of orderData.items) {
      // Verify product exists and get current price
      const productRef = doc(db, 'products', item.productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }
      
      const product = productSnap.data();
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      
      validatedItems.push({
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        image: product.image,
        total: itemTotal
      });
    }
    
    // Calculate shipping (free shipping over $100)
    const shippingFee = subtotal >= 100 ? 0 : 12;
    const total = subtotal + shippingFee;

    // Create order object
    const newOrder = {
      orderId,
      customerInfo: {
        name: orderData.customerInfo.name,
        phone: orderData.customerInfo.phone,
        address: orderData.customerInfo.address,
        city: orderData.customerInfo.city,
        notes: orderData.customerInfo.notes || ''
      },
      items: validatedItems,
      pricing: {
        subtotal,
        shippingFee,
        total
      },
      status: 'pending',
      paymentMethod: 'cash_on_delivery',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now
    };

    const docRef = await addDoc(collection(db, 'orders'), newOrder);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: docRef.id,
        orderId,
        ...newOrder
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Get all orders (Admin only)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      pageSize = 20,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    let ordersQuery = collection(db, 'orders');
    
    // Apply status filter
    if (status && status !== 'all') {
      ordersQuery = query(ordersQuery, where('status', '==', status));
    }
    
    // Apply sorting
    const validSortFields = ['createdAt', 'updatedAt', 'total', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';
    
    ordersQuery = query(ordersQuery, orderBy(sortField, sortOrder));
    
    // Apply pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSizeNum = Math.min(50, Math.max(1, parseInt(pageSize)));
    
    ordersQuery = query(ordersQuery, limit(pageSizeNum));

    const snapshot = await getDocs(ordersQuery);
    
    const orders = [];
    snapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total: orders.length,
        hasMore: orders.length === pageSizeNum
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Get single order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const orderRef = doc(db, 'orders', id);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: orderSnap.id,
        ...orderSnap.data()
      }
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Get order by order ID (for customer lookup)
router.get('/lookup/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const ordersQuery = query(
      collection(db, 'orders'),
      where('orderId', '==', orderId),
      limit(1)
    );
    
    const snapshot = await getDocs(ordersQuery);

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderDoc = snapshot.docs[0];
    res.json({
      success: true,
      data: {
        id: orderDoc.id,
        ...orderDoc.data()
      }
    });

  } catch (error) {
    console.error('Error looking up order:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Update order status (Admin only)
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      });
    }

    const orderRef = doc(db, 'orders', id);
    
    // Check if order exists
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.uid || 'admin'
    };

    if (notes) {
      updateData.adminNotes = notes;
    }

    // Add status history
    const currentOrder = orderSnap.data();
    const statusHistory = currentOrder.statusHistory || [];
    statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      updatedBy: req.user?.uid || 'admin',
      notes
    });
    updateData.statusHistory = statusHistory;

    await updateDoc(orderRef, updateData);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        id,
        ...currentOrder,
        ...updateData
      }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Get order statistics (Admin only)
router.get('/stats/overview', authenticateAdmin, async (req, res) => {
  try {
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    
    const stats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };

    let totalRevenue = 0;
    let completedOrders = 0;

    snapshot.forEach((doc) => {
      const order = doc.data();
      stats.total++;
      stats[order.status] = (stats[order.status] || 0) + 1;
      
      if (order.status === 'delivered') {
        totalRevenue += order.pricing?.total || 0;
        completedOrders++;
      }
    });

    stats.totalRevenue = totalRevenue;
    stats.averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching order statistics:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

module.exports = router;
