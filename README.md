# Twenty-Two Clothing Store

A modern, responsive clothing store website built with React, Tailwind CSS, and Firebase.

## Features

### 🏠 Homepage
- Animated loading page with auto-redirect
- Hero section with call-to-action
- Product slider with auto-play
- Category sections (T-shirts, Pants, Sweatshirts)
- About section with animated cards
- Complaint form with WhatsApp integration
- Responsive navbar and footer

### 🛍️ Shopping Experience
- Product catalog with filtering and sorting
- Detailed product pages with image slider
- Shopping cart with quantity management
- Checkout process with order confirmation
- Category-specific product pages

### 👤 User Authentication
- User registration and login
- Profile page with order history
- LocalStorage-based authentication

### 🔧 Admin Dashboard
- Secure admin login
- Add/edit/delete products
- Manage product categories, sizes, and colors
- View and manage customer orders
- Order status management

### 📱 Mobile Responsive
- Fully responsive design
- Mobile-optimized navigation
- Touch-friendly interface

## Tech Stack

- **Frontend**: React, Tailwind CSS, React Router
- **Backend**: Node.js, Express.js
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: LocalStorage (for demo)
- **Notifications**: SweetAlert2
- **Icons**: React Icons

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd twenty
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Update `src/firebase/config.js` with your Firebase configuration

4. Start the development server:
```bash
npm start
```

5. Start the backend server (optional):
```bash
npm run server
```

## Usage

### For Customers:
1. Visit the homepage
2. Browse products by category or view all products
3. Click on products to view details
4. Add items to cart and proceed to checkout
5. Create an account to track orders

### For Admins:
1. Visit `/admin-login`
2. Login with credentials: `admin` / `admin123`
3. Access the admin dashboard to manage products and orders

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── AuthModal.js    # Authentication modal
│   ├── Footer.js       # Site footer
│   ├── LoadingPage.js  # Loading screen
│   ├── Navbar.js       # Navigation bar
│   └── ProductSlider.js # Product carousel
├── context/            # React context providers
│   ├── AuthContext.js  # Authentication state
│   └── CartContext.js  # Shopping cart state
├── firebase/           # Firebase configuration
│   └── config.js       # Firebase setup
├── pages/              # Page components
│   ├── AdminLogin.js   # Admin login page
│   ├── AdminPage.js    # Admin dashboard
│   ├── CartPage.js     # Shopping cart
│   ├── CategoryPage.js # Category products
│   ├── CheckoutPage.js # Checkout process
│   ├── HomePage.js     # Main homepage
│   ├── ProductDetailsPage.js # Product details
│   ├── ProductsPage.js # All products
│   └── ProfilePage.js  # User profile
├── App.js              # Main app component
├── index.js            # App entry point
└── index.css           # Global styles
```

## Features in Detail

### Product Management
- Add products with multiple images, colors, and sizes
- Categorize products (T-shirts, Pants, Sweatshirts)
- Set prices and descriptions
- Upload product images

### Order Management
- Track customer orders
- Update order status (Pending, Completed, Delivered, Cancelled)
- View customer information and order details
- Calculate totals including shipping

### Shopping Cart
- Add/remove items
- Update quantities
- Persistent cart using localStorage
- Shipping calculation (120 EGP)

### Responsive Design
- Mobile-first approach
- Responsive grid layouts
- Touch-friendly buttons and navigation
- Optimized for all screen sizes

## Customization

### Colors
The website uses a gold and dark gray color scheme defined in `tailwind.config.js`:
- Primary: Gold (#D4AF37)
- Secondary: Dark Gray (#2D2D2D)

### Fonts
Uses Cairo font for Arabic text support.

### Animations
Custom animations defined in Tailwind config:
- Fade in effects
- Slide up animations
- Bounce in effects

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `build` folder to your hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, contact: info@twentytwo.com
WhatsApp: +20 123 456 7890
