import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase/config';

// Products Service
export const productsService = {
  // Add a new product
  async addProduct(productData) {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...productData };
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  // Get all products
  async getProducts() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'products'), orderBy('createdAt', 'desc'))
      );
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  },

  // Update a product
  async updateProduct(productId, productData) {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        ...productData,
        updatedAt: new Date().toISOString()
      });
      return { id: productId, ...productData };
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete a product
  async deleteProduct(productId) {
    try {
      await deleteDoc(doc(db, 'products', productId));
      return productId;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Listen to products changes (real-time)
  onProductsChange(callback) {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      callback(products);
    });
  }
};

// Orders Service
export const ordersService = {
  // Test Firebase connection
  async testConnection() {
    try {
      const testRef = collection(db, 'test');
      await getDocs(testRef);
      return true;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return false;
    }
  },

  // Test orders collection access
  async testOrdersAccess() {
    try {
      const ordersRef = collection(db, 'orders');
      const querySnapshot = await getDocs(ordersRef);
      console.log(`Orders collection accessible. Found ${querySnapshot.size} orders.`);
      return { success: true, orderCount: querySnapshot.size };
    } catch (error) {
      console.error('Orders collection access test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Add a new order
  async addOrder(orderData) {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...orderData };
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  },

  // Get all orders
  async getOrders() {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('orderDate', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  },

  // Get single order by ID
  async getOrder(orderId) {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }
      
      return { id: orderSnap.id, ...orderSnap.data() };
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  },

  // Create new order
  async createOrder(orderData) {
    try {
      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, {
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(orderId, newStatus) {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      
      if (!newStatus) {
        throw new Error('New status is required');
      }
      
      const validStatuses = ['pending', 'completed', 'delivered', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Valid statuses: ${validStatuses.join(', ')}`);
      }
      
      console.log(`Attempting to update order ${orderId} to status: ${newStatus}`);
      
      const orderRef = doc(db, 'orders', orderId);
      
      // First check if the order exists
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        console.error(`Order ${orderId} not found in Firestore`);
        throw new Error('Order not found');
      }
      
      console.log(`Order ${orderId} found, current status: ${orderSnap.data().status}`);
      
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Order ${orderId} status updated successfully to: ${newStatus}`);
      return { success: true, orderId, newStatus };
    } catch (error) {
      console.error('Error updating order status:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  // Listen to orders changes (real-time)
  onOrdersChange(callback) {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const orders = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      callback(orders);
    });
  }
};

// Image Storage Service
export const imageService = {
  // Upload multiple images
  async uploadImages(files, productId) {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileName = `products/${productId}/${Date.now()}_${index}_${file.name}`;
        const storageRef = ref(storage, fileName);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      });

      const imageUrls = await Promise.all(uploadPromises);
      return imageUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  },

  // Delete images
  async deleteImages(imageUrls) {
    try {
      const deletePromises = imageUrls.map(async (url) => {
        const imageRef = ref(storage, url);
        await deleteObject(imageRef);
      });
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting images:', error);
      throw error;
    }
  },

  // Compress image before upload
  compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }
};

// Utility function to migrate localStorage data to Firestore
export const migrateLocalStorageToFirestore = async () => {
  try {
    // Migrate products
    const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
    if (localProducts.length > 0) {
      console.log('Migrating products to Firestore...');
      for (const product of localProducts) {
        await productsService.addProduct(product);
      }
      console.log('Products migrated successfully');
    }

    // Migrate orders
    const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    if (localOrders.length > 0) {
      console.log('Migrating orders to Firestore...');
      for (const order of localOrders) {
        await ordersService.addOrder(order);
      }
      console.log('Orders migrated successfully');
    }
  } catch (error) {
    console.error('Error migrating data:', error);
  }
};
