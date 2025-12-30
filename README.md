# 🛒 SellBUY - IIITM Campus Marketplace

A full-stack marketplace application for IIITM Gwalior students to buy and sell second-hand items within their campus community.

[![React](https://img.shields.io/badge/React-19.2.3-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen.svg)](https://www.mongodb.com/)

## 🌟 Features

### 🔐 Authentication
- Email/Password login and signup
- **Google Sign-In** with @iiitm.ac.in email restriction
- JWT-based session management
- Mobile number collection on first listing

### 🏪 Product Listings
- Create, edit, and delete product listings
- Upload multiple product images (Cloudinary integration)
- Product details:
  - Name, Description, Price
  - Category, Location (hostel-based)
  - Condition (New, Sealed, Mint, Used)
  - Product age, Original product URL
  - Contact preferences (WhatsApp, Phone Call, Both)
- Mark products as Sold/Available

### 🔍 Search & Filters
- Real-time search across product names and descriptions
- Location-based filtering by hostel (BH-1, BH-2, BH-3, GH, IVH, Satpura)
- Category filters
- Price range slider
- Product condition filters
- Advanced multi-filter support

### ❤️ Wishlist
- Like/unlike products with visual feedback (filled heart)
- Persistent wishlist across sessions
- View all saved products
- Remove from wishlist

### 📱 User Features
- My Listings dashboard
- Edit product details
- Delete listings
- View product analytics (future)

### 🎨 UI/UX
- **Dark mode** support
- Responsive design (mobile, tablet, desktop)
- Skeleton loaders for better UX
- Optimistic UI updates
- Empty state designs
- Toast notifications

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2.3** - UI framework
- **React Router 6** - Client-side routing
- **Axios** - HTTP requests
- **React Icons** - Icon library
- **@react-oauth/google** - Google Sign-In

### Backend
- **Node.js** - Runtime
- **Express 5** - Web framework
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **Multer + Cloudinary** - Image uploads
- **Google Auth Library** - OAuth verification

### Services
- **MongoDB Atlas** - Cloud database
- **Cloudinary** - Image hosting & CDN
- **Google OAuth 2.0** - Social login

---

## 📦 Installation

### Prerequisites
- Node.js (v16+)
- MongoDB account (Atlas recommended)
- Cloudinary account
- Google Cloud Console project (for OAuth)

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/sellbuy-iiitm.git
cd sellbuy-iiitm
```

### 2. Backend Setup
```bash
cd node-app
npm install
```

Create `.env` file in `node-app/` (use `.env.example` as template):
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret_key_min_32_chars
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
FRONTEND_URL=http://localhost:3000
PORT=4000
```

### 3. Frontend Setup
```bash
cd ../react-app
npm install
```

Create `.env` file in `react-app/` (use `.env.example` as template):
```env
REACT_APP_API_URL=http://localhost:4000
```

### 4. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd node-app
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd react-app
npm start
```

Access the app at `http://localhost:3000`

---

## 🔑 Environment Variables Guide

### MongoDB URI
Get from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas):
1. Create cluster
2. Click "Connect" → "Connect your application"
3. Copy connection string
4. Replace `<password>` with your password

### Cloudinary
Get from [Cloudinary Dashboard](https://cloudinary.com/console):
1. Sign up/Login
2. Copy Cloud Name, API Key, API Secret from dashboard

### Google OAuth
Get from [Google Cloud Console](https://console.cloud.google.com/):
1. Create project
2. Enable Google+ API
3. Create OAuth 2.0 Client ID (Web application)
4. Add `http://localhost:3000` to Authorized JavaScript origins
5. Copy Client ID

### JWT Secret
Generate a strong random string (32+ characters):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📁 Project Structure

```
sellbuy-iiitm/
├── node-app/              # Backend (Express + MongoDB)
│   ├── index.js          # Main server file
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── react-app/            # Frontend (React)
│   ├── public/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── Header.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── AddProduct.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── LikedProducts.jsx
│   │   │   ├── MyListings.jsx
│   │   │   └── ...
│   │   ├── constants.js  # API URL config
│   │   ├── index.js      # App entry point
│   │   └── ...
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── .gitignore            # Root gitignore
├── README.md             # This file
├── EDGE_CASES.md         # Security & edge cases doc
└── WISHLIST_FIX.md       # Wishlist feature documentation
```

---

## 🚀 Deployment

### Backend (Render/Railway)
1. Create new Web Service
2. Connect GitHub repo
3. Set build command: `cd node-app && npm install`
4. Set start command: `cd node-app && npm start`
5. Add environment variables from `.env`

### Frontend (Vercel/Netlify)
1. Connect GitHub repo
2. Set root directory: `react-app`
3. Build command: `npm run build`
4. Publish directory: `build`
5. Add environment variable: `REACT_APP_API_URL=your_backend_url`

### Update Google OAuth
Add production URLs to Google Cloud Console:
- Authorized JavaScript origins: `https://your-domain.com`
- Authorized redirect URIs: `https://your-domain.com`

---

## 🔒 Security Notes

### ⚠️ IMPORTANT - Before Production

**CRITICAL FIXES NEEDED:**
1. **Hash Passwords** - Currently stored in plain text! (Use bcrypt)
2. **Add Auth Middleware** - Protect routes with JWT verification
3. **Remove JWT Secret Fallback** - No hardcoded secrets
4. **Input Sanitization** - Prevent XSS/NoSQL injection
5. **Rate Limiting** - Prevent spam/DoS attacks

See [EDGE_CASES.md](EDGE_CASES.md) for complete security analysis.

### What's Already Secure ✅
- Google OAuth token verification
- Institute email validation (@iiitm.ac.in only)
- Cloudinary secure uploads
- CORS configuration
- JWT expiration

---

## 📝 API Endpoints

### Authentication
- `POST /signup` - User registration
- `POST /login` - User login
- `POST /google-login` - Google Sign-In

### Products
- `GET /get-products` - Get all products (with filters)
- `POST /add-product` - Create new listing
- `GET /get-product/:id` - Get single product
- `PUT /update-product/:id` - Update product
- `DELETE /delete-product/:id` - Delete product
- `PUT /update-product-status/:id` - Mark as sold/available
- `GET /my-products/:userId` - User's listings
- `GET /search` - Search products

### Wishlist
- `POST /like-product` - Toggle like/unlike
- `POST /liked-products` - Get user's wishlist

### User
- `GET /get-user/:userId` - Get user details
- `PUT /update-mobile/:userId` - Update mobile number

---

## 🧪 Testing

Run frontend tests:
```bash
cd react-app
npm test
```

---

## 📊 Features Roadmap

### ✅ Implemented
- [x] User authentication (Email + Google)
- [x] Product CRUD operations
- [x] Image uploads (Cloudinary)
- [x] Search & filters
- [x] Wishlist functionality
- [x] Location-based filtering
- [x] Dark mode
- [x] Responsive design
- [x] Mobile number collection

### 🔮 Planned
- [ ] Password hashing (bcrypt)
- [ ] Auth middleware
- [ ] Rate limiting
- [ ] Email notifications
- [ ] Chat/messaging system
- [ ] User profiles
- [ ] Product analytics
- [ ] Admin dashboard
- [ ] Pagination
- [ ] Image optimization
- [ ] PWA support

---

## 🐛 Known Issues

See [EDGE_CASES.md](EDGE_CASES.md) for complete list.

**High Priority:**
- Passwords stored in plain text
- No authentication middleware
- No rate limiting

---

## 🤝 Contributing

This is a college project, but suggestions are welcome!

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

This project is for educational purposes (IIITM Gwalior).

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

---

## 🙏 Acknowledgments

- IIITM Gwalior for the inspiration
- React & Node.js communities
- Cloudinary for image hosting
- MongoDB Atlas for database

---

## 📸 Screenshots

### Home Page
![Home Page](screenshots/home.png)

### Product Listing
![Product Listing](screenshots/product.png)

### Wishlist
![Wishlist](screenshots/wishlist.png)

---

## 🔗 Live Demo

**Frontend:** [Coming Soon]  
**Backend API:** [Coming Soon]

---

## 💡 Tips for Recruiters

**Key Technical Highlights:**
- Full-stack MERN application
- RESTful API design
- Google OAuth integration
- Cloud image storage (Cloudinary)
- Responsive UI with dark mode
- Optimistic UI updates
- State management (React hooks)
- MongoDB aggregation & indexing

**Code Quality:**
- Modular component architecture
- Reusable components
- Error handling
- Loading states
- Empty states
- Comprehensive documentation

---

**Made with ❤️ for IIITM Gwalior Community**
