import { useEffect, useState } from "react";
import Header from "./Header";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaHeart,
  FaMapMarkerAlt,
  FaHeartBroken,
  FaArrowLeft,
} from "react-icons/fa";
import "./Home.css";
import API_URL, { getImageUrl } from "../constants";

// ProductCard Component
function ProductCard({ product, onUnlike }) {
  return (
    <div className="product-card">
      <Link to={`/product/${product._id}`} className="product-card-link">
        <div className="product-image-container">
          <img
            src={getImageUrl(product.pimage)}
            alt={product.pname}
            className="product-image"
          />
          {product.plocation && (
            <span className="product-location-badge">
              <FaMapMarkerAlt /> {product.plocation}
            </span>
          )}
        </div>
        <div className="product-info">
          <h3 className="product-price">
            ₹{product.price?.toLocaleString("en-IN")}
          </h3>
          <p className="product-name">{product.pname}</p>
          <p className="product-category">{product.category}</p>
        </div>
      </Link>
      <button
        className="like-btn liked"
        onClick={(e) => {
          e.preventDefault();
          onUnlike(product._id);
        }}
        title="Remove from wishlist"
      >
        <FaHeart />
      </button>
    </div>
  );
}

// Empty State Component
function EmptyWishlist() {
  return (
    <div className="empty-state">
      <FaHeartBroken className="empty-state-icon" />
      <h3 className="empty-state-title">No saved items yet!</h3>
      <p className="empty-state-text">
        ❤️ Tap the heart on any product to save it here for later. Your future finds are waiting!
      </p>
      <Link to="/" className="btn btn-primary">
        <FaArrowLeft /> Discover Products
      </Link>
    </div>
  );
}

function LikedProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    const url = `${API_URL}/liked-products`;
    const data = { userId };

    axios
      .post(url, data)
      .then((res) => {
        if (res.data.products) {
          setProducts(res.data.products);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(false);
      });
  }, [navigate]);

  const handleUnlike = (productId) => {
    const userId = localStorage.getItem("userId");
    const url = `${API_URL}/like-product`;
    const data = { productId, userId };

    // Optimistic UI - remove immediately
    setProducts(products.filter((p) => p._id !== productId));

    axios
      .post(url, data)
      .then((res) => {
        if (res.data.message === "unliked") {
          // Successfully unliked - already removed from UI
          console.log("Product removed from wishlist");
        } else {
          // If server says it's liked (unexpected), refetch
          console.warn("Unexpected response, refetching...");
          fetchLikedProducts();
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error removing from wishlist");
        // Revert on error - refetch to get accurate state
        fetchLikedProducts();
      });
  };

  const fetchLikedProducts = () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const url = `${API_URL}/liked-products`;
    const data = { userId };

    axios
      .post(url, data)
      .then((res) => {
        if (res.data.products) {
          setProducts(res.data.products);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="home-page">
      <Header hideSearch={true} />

      <div className="home-container">
        {/* Page Header */}
        <div
          className="section-header"
          style={{ marginBottom: "var(--space-xl)" }}
        >
          <h2
            className="section-title"
            style={{ fontSize: "var(--font-size-2xl)" }}
          >
            <FaHeart
              style={{ color: "#e74c3c", marginRight: "var(--space-sm)" }}
            />
            My Wishlist
          </h2>
          <p style={{ color: "var(--gray-600)", marginTop: "var(--space-sm)" }}>
            {products.length} {products.length === 1 ? "item" : "items"} saved
          </p>
        </div>

        {isLoading ? (
          <div className="products-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="skeleton-card">
                <div className="skeleton skeleton-image"></div>
                <div className="skeleton-content">
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "60%" }}
                  ></div>
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "80%" }}
                  ></div>
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "40%" }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="products-grid">
            {products.map((item) => (
              <ProductCard
                key={item._id}
                product={item}
                onUnlike={handleUnlike}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 SellIt - IIITM Campus Marketplace</p>
        </div>
      </footer>
    </div>
  );
}

export default LikedProducts;
