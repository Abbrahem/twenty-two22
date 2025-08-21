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
  limit
} = require('firebase/firestore');
const { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} = require('firebase/auth');
const { db, auth } = require('../config/firebase');
const { validateUser, handleFirebaseError } = require('../utils/validation');
const { authenticateUser } = require('../middleware/auth');
const bcrypt = require('bcrypt');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate user data
    const validation = validateUser({ name, email, password });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if user already exists
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email.toLowerCase()),
      limit(1)
    );
    const existingUser = await getDocs(usersQuery);
    
    if (!existingUser.empty) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password for local storage (backup)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in Firebase Auth
    let firebaseUser;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;
      
      // Update display name
      await updateProfile(firebaseUser, { displayName: name });
    } catch (authError) {
      console.error('Firebase Auth error:', authError);
      // Continue with local user creation if Firebase Auth fails
    }

    // Create user document in Firestore
    const userData = {
      name,
      email: email.toLowerCase(),
      hashedPassword, // Store hashed password as backup
      firebaseUid: firebaseUser?.uid || null,
      role: 'customer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      profile: {
        phone: '',
        address: '',
        city: '',
        preferences: {
          newsletter: false,
          notifications: true
        }
      }
    };

    const docRef = await addDoc(collection(db, 'users'), userData);

    // Remove sensitive data from response
    const { hashedPassword: _, ...safeUserData } = userData;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: docRef.id,
        firebaseUid: firebaseUser?.uid,
        ...safeUserData
      }
    });

  } catch (error) {
    console.error('Error registering user:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user in Firestore
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email.toLowerCase()),
      limit(1)
    );
    const userSnapshot = await getDocs(usersQuery);
    
    if (userSnapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Check if user is active
    if (!userData.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    let authSuccess = false;
    let firebaseUser = null;

    // Try Firebase Auth first
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;
      authSuccess = true;
    } catch (authError) {
      console.log('Firebase Auth failed, trying local auth:', authError.code);
      
      // Fallback to local password verification
      if (userData.hashedPassword) {
        const isValidPassword = await bcrypt.compare(password, userData.hashedPassword);
        if (isValidPassword) {
          authSuccess = true;
        }
      }
    }

    if (!authSuccess) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await updateDoc(doc(db, 'users', userDoc.id), {
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Remove sensitive data from response
    const { hashedPassword: _, ...safeUserData } = userData;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: userDoc.id,
        firebaseUid: firebaseUser?.uid,
        ...safeUserData,
        lastLogin: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    // Sign out from Firebase Auth if available
    try {
      await signOut(auth);
    } catch (authError) {
      console.log('Firebase signout error (non-critical):', authError.code);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Error logging out user:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Get user profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userSnap.data();
    const { hashedPassword: _, ...safeUserData } = userData;

    res.json({
      success: true,
      data: {
        id: userSnap.id,
        ...safeUserData
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Update user profile
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, city, preferences } = req.body;
    
    // Validate update data
    const updateData = {};
    
    if (name) updateData.name = name.trim();
    if (phone) updateData['profile.phone'] = phone.trim();
    if (address) updateData['profile.address'] = address.trim();
    if (city) updateData['profile.city'] = city.trim();
    if (preferences) updateData['profile.preferences'] = preferences;
    
    updateData.updatedAt = new Date().toISOString();

    const userRef = doc(db, 'users', userId);
    
    // Check if user exists
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await updateDoc(userRef, updateData);

    // Get updated user data
    const updatedUserSnap = await getDoc(userRef);
    const userData = updatedUserSnap.data();
    const { hashedPassword: _, ...safeUserData } = userData;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUserSnap.id,
        ...safeUserData
      }
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Get user orders
router.get('/orders', authenticateUser, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const ordersQuery = query(
      collection(db, 'orders'),
      where('customerInfo.email', '==', userEmail),
      orderBy('createdAt', 'desc')
    );
    
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
      data: orders
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

// Change password
router.post('/change-password', authenticateUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user data
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userSnap.data();

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userData.hashedPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await updateDoc(userRef, {
      hashedPassword: hashedNewPassword,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    const firebaseError = handleFirebaseError(error);
    res.status(firebaseError.status).json(firebaseError);
  }
});

module.exports = router;