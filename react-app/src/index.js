import "./index.css";
import reportWebVitals from "./reportWebVitals";
import * as React from "react";
import { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Analytics } from "@vercel/analytics/react";
const link = document.createElement("link"); link.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&display=swap"; link.rel = "stylesheet"; document.head.appendChild(link);

// Lazy load components for code splitting
const Home = lazy(() => import("./components/Home"));
const Login = lazy(() => import("./components/Login"));
const Signup = lazy(() => import("./components/Signup"));
const AddProduct = lazy(() => import("./components/AddProduct"));
const LikedProducts = lazy(() => import("./components/LikedProducts"));
const ProductDetail = lazy(() => import("./components/ProductDetail"));
const CategoryPage = lazy(() => import("./components/CategoryPage"));
const MyListings = lazy(() => import("./components/MyListings"));
const EditProduct = lazy(() => import("./components/EditProduct"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const ContactAdmin = lazy(() => import("./components/ContactAdmin"));

const GOOGLE_CLIENT_ID = "45965234451-stt1nfrj264pphitcqnve10ov8c54tgv.apps.googleusercontent.com";

// Loading fallback component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#f8fafc'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #ff6b35',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Suspense fallback={<PageLoader />}><Home /></Suspense>,
  },
  {
    path: "/category/:categoryName",
    element: <Suspense fallback={<PageLoader />}><CategoryPage /></Suspense>,
  },
  {
    path: "/categories/:categoryName",
    element: <Suspense fallback={<PageLoader />}><CategoryPage /></Suspense>,
  },
  {
    path: "/login",
    element: <Suspense fallback={<PageLoader />}><Login /></Suspense>,
  },
  {
    path: "/signup",
    element: <Suspense fallback={<PageLoader />}><Signup /></Suspense>,
  },
  {
    path: "/add-product",
    element: <Suspense fallback={<PageLoader />}><AddProduct /></Suspense>,
  },
  {
    path: "/liked-products",
    element: <Suspense fallback={<PageLoader />}><LikedProducts /></Suspense>,
  },
  {
    path: "/Liked-products",
    element: <Suspense fallback={<PageLoader />}><LikedProducts /></Suspense>,
  },
  {
    path: "/my-listings",
    element: <Suspense fallback={<PageLoader />}><MyListings /></Suspense>,
  },
  {
    path: "/edit-product/:id",
    element: <Suspense fallback={<PageLoader />}><EditProduct /></Suspense>,
  },
  {
    path: "/product/:productId",
    element: <Suspense fallback={<PageLoader />}><ProductDetail /></Suspense>,
  },
  {
    path: "/products/:productId",
    element: <Suspense fallback={<PageLoader />}><ProductDetail /></Suspense>,
  },
  {
    path: "/admin",
    element: <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>,
  },
]);

const root = createRoot(document.getElementById("root"));
root.render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <RouterProvider router={router} />
    <Suspense fallback={null}>
      <ContactAdmin />
    </Suspense>
    <Analytics />
  </GoogleOAuthProvider>
);

reportWebVitals();
