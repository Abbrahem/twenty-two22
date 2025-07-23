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
  limit,
  startAfter
} = require('firebase/firestore');
const { db } = require('../config/firebase');
const { validateProduct, handleFirebaseError } = require('../utils/validation');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all products with optional filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      sortBy = 'name', 
      order = 'asc', 
      page = 1, 
      pageSize = 20,
      search
    } = req.query;

    let productsQuery = collection(db, 'products');
    
    // Apply category filter
    if (category && category !== 'all') {
      productsQuery = query(productsQuery, where('category', '==', category));
    }
    
    // Apply search filter
    if (search) {
      // Note: Firestore doesn't support full-text search natively
      // For production, consider using Algolia or similar service
      productsQuery = query(productsQuery, 
        where('name', '>=', search),
        where('name', '<=', search + '\uf8ff')
      );
    }
    
    // Apply sorting
    const validSortFields = ['name', 'price', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const sortOrder = order === 'desc' ? 'desc' : 'asc';
    
    productsQuery = query(productsQuery, orderBy(sortField, sortOrder));
    
    // Apply pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSizeNum = Math.min(50, Math.max(1, parseInt(pageSize))); // Max 50 items per page
    
    if (pageNum > 1) {
      // For pagination, you'd need to implement cursor-based pagination
      // This is a simplified version
      productsQuery = query(productsQuery, limit(pageSizeNum));
    } else {
      productsQuery = query(productsQuery, limit(pageSizeNum));
    }

    const snapshot = await getDocs(productsQuery);
    
    const products = [];
    snapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total: products.length,
        hasMore: products.length === pageSizeNum
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: productSnap.id,
        ...productSnap.data()
      }
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Create new product (Admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const productData = req.body;
    
    // Validate product data
    const validation = validateProduct(productData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Add timestamps
    const newProduct = {
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user?.uid || 'admin'
    };

    const docRef = await addDoc(collection(db, 'products'), newProduct);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: docRef.id,
        ...newProduct
      }
    });

  } catch (error) {
    console.error('Error creating product:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Update product (Admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Validate update data
    const validation = validateProduct(updateData, true); // true for partial validation
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const productRef = doc(db, 'products', id);
    
    // Check if product exists
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Add update timestamp
    const updatedProduct = {
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.uid || 'admin'
    };

    await updateDoc(productRef, updatedProduct);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        id,
        ...productSnap.data(),
        ...updatedProduct
      }
    });

  } catch (error) {
    console.error('Error updating product:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Delete product (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const productRef = doc(db, 'products', id);
    
    // Check if product exists
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await deleteDoc(productRef);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Get product categories
router.get('/categories/list', async (req, res) => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    const categories = new Set();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });

    res.json({
      success: true,
      data: Array.from(categories).sort()
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

module.exports = router;
