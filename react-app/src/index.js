import "./index.css";
import reportWebVitals from "./reportWebVitals";
import Home from "./components/Home";
import * as React from "react";
import { createRoot } from "react-dom/client";
import Login from "./components/Login";
import { createBrowserRouter, RouterProvider, Link } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Signup from "./components/Signup";
import AddProduct from "./components/AddProduct";
import LikedProducts from "./components/LikedProducts";
import ProductDetail from "./components/ProductDetail";
import CategoryPage from "./components/CategoryPage";
import MyListings from "./components/MyListings";
import EditProduct from "./components/EditProduct";

const GOOGLE_CLIENT_ID = "45965234451-stt1nfrj264pphitcqnve10ov8c54tgv.apps.googleusercontent.com";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/category/:categoryName",
    element: <CategoryPage />,
  },
  {
    path: "/categories/:categoryName",
    element: <CategoryPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/add-product",
    element: <AddProduct />,
  },
  {
    path: "/liked-products",
    element: <LikedProducts />,
  },
  {
    path: "/Liked-products",
    element: <LikedProducts />,
  },
  {
    path: "/my-listings",
    element: <MyListings />,
  },
  {
    path: "/edit-product/:id",
    element: <EditProduct />,
  },
  {
    path: "/product/:productId",
    element: <ProductDetail />,
  },
  {
    path: "/products/:productId",
    element: <ProductDetail />,
  },
]);

const root = createRoot(document.getElementById("root"));
root.render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <RouterProvider router={router} />
  </GoogleOAuthProvider>
);

reportWebVitals();
