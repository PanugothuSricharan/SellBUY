# SellBuy - Campus Marketplace

## Project Overview
SellBuy is a campus-specific marketplace application designed for IIITM Gwalior students to buy and sell items (books, electronics, furniture, etc.) within the campus. It features a robust product listing system, admin moderation, and location-based filtering (Hostels).

## Tech Stack

### Frontend (`react-app`)
*   **Framework:** React 19
*   **Routing:** React Router v6
*   **Styling:** CSS3 (Responsive, Dark/Light Mode support), React Icons
*   **HTTP Client:** Axios
*   **State Management:** React Hooks (`useState`, `useEffect`, `useContext` pattern via props)

### Backend (`node-app`)
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB (via Mongoose)
*   **Authentication:** JWT (JSON Web Tokens), Google OAuth 2.0
*   **File Storage:** Cloudinary (via Multer)
*   **Security:** Rate Limiting, CORS, Helmet/Compression

## Key Features

### User Features
*   **Authentication:** 
    *   Sign up/Login with Email & Password.
    *   **Google Login:** Restricted to institute emails (`@iiitm.ac.in`).
*   **Product Management:**
    *   Add Products (Images, Price, Category, Condition, Location).
    *   **Rate Limit:** Max 5 products per 24 hours per user.
    *   Edit/Delete own products.
    *   Mark products as "Sold".
*   **Discovery:**
    *   **Search:** Real-time search by name, description, or category.
    *   **Filters:** Category, Condition (New/Used), Price Range, Location (Hostel-wise).
    *   **Wishlist:** Like/Unlike products.
*   **User Profile:**
    *   View "My Listings".
    *   Update Mobile Number.
    *   Dark/Light Mode toggle.

### Admin Features
*   **Dashboard:** View all products (Approved, Hidden, Pending).
*   **Moderation:**
    *   Hide/Unhide products from the homepage.
    *   Delete products permanently.
    *   **Block/Unblock Sellers:** Banning a user hides all their products.
*   **Messages:** Read and resolve user contact messages.
*   **Statistics:** View total users, products, and blocked accounts.

## Environment Variables

### Backend (`node-app/.env`)
```env
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=http://localhost:3000 (or production URL)
```

### Frontend (`react-app/.env`)
```env
REACT_APP_API_URL=http://localhost:4000 (or production backend URL)
GENERATE_SOURCEMAP=false (optional)
```

## Folder Structure

```
/
├── node-app/             # Backend Code
│   ├── index.js          # Entry point & API Routes
│   ├── package.json      # Backend dependencies
│   └── uploads/          # Temp upload storage
│
├── react-app/            # Frontend Code
│   ├── src/
│   │   ├── components/   # React Components (Home, Header, AdminDashboard, etc.)
│   │   ├── utils/        # Utility functions (Image compression, etc.)
│   │   ├── App.js        # Main Component & Routing
│   │   ├── constants.js  # API Configuration
│   │   └── ...
│   └── ...
```

## API Endpoints (Key Routes)

*   `GET /get-products`: Fetch filtered products.
*   `POST /add-product`: Upload new product (Multipart/form-data).
*   `POST /google-login`: Authenticate with Google Token.
*   `GET /search`: Search products.
*   `GET /admin/pending-products/:userId`: Admin dashboard data.

## Deployment Notes
*   **Frontend:** Configured for Vercel (`vercel.json` present).
*   **Backend:** Can be hosted on Render/Heroku/Vercel.
*   **Images:** Hosted on Cloudinary (External).
