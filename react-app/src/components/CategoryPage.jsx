import { useEffect, useState } from "react";
import Header from "./Header";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Categories from "./Categories";
import { FaHeart, FaMapMarkerAlt, FaSearch, FaBoxOpen } from "react-icons/fa";
import "./Home.css";
import { LOCATIONS } from "./LocationList";
import API_URL, { getImageUrl } from "../constants";

// ProductCard Component
function ProductCard({ product, onLike, isLiked }) {
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
        className={`like-btn ${isLiked ? "liked" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          onLike(product._id, e);
        }}
      >
        <FaHeart />
      </button>
    </div>
  );
}

// Skeleton Loading Card
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton skeleton-text" style={{ width: "60%" }}></div>
        <div className="skeleton skeleton-text" style={{ width: "80%" }}></div>
        <div className="skeleton skeleton-text" style={{ width: "40%" }}></div>
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ category, location }) {
  return (
    <div className="empty-state">
      <FaBoxOpen className="empty-state-icon" />
      <h3 className="empty-state-title">No {category} products found</h3>
      <p className="empty-state-text">
        There are no products in this category at {location}
      </p>
      <Link to="/" className="btn btn-primary">
        Browse All Products
      </Link>
    </div>
  );
}

function CategoryPage() {
  const navigate = useNavigate();
  const param = useParams();

  const [products, setProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [likedProducts, setLikedProducts] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(
    localStorage.getItem("selectedLocation") || LOCATIONS.ENTIRE_CAMPUS
  );

  // Load liked products from localStorage
  useEffect(() => {
    const liked = JSON.parse(localStorage.getItem("likedProducts") || "[]");
    setLikedProducts(liked);
  }, []);

  // Fetch products with category and location filter
  const fetchProducts = (category, location) => {
    setIsLoading(true);
    let url = `${API_URL}/get-products?catName=${encodeURIComponent(
      category
    )}&location=${encodeURIComponent(location)}`;

    axios
      .get(url)
      .then((res) => {
        if (res.data.products) {
          setProducts(res.data.products);
          setSearchResults([]);
          setIsSearching(false);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts(param.categoryName, selectedLocation);
  }, [param, selectedLocation]);

  // Handle location change from Header
  const handleLocationChange = (newLocation) => {
    setSelectedLocation(newLocation);
    setIsSearching(false);
  };

  const handleLike = (productId, e) => {
    e.stopPropagation();
    let userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please login to like products");
      navigate("/login");
      return;
    }

    const url = `${API_URL}/like-product`;
    const data = { productId, userId };

    axios
      .post(url, data)
      .then((res) => {
        if (res.data.message === "liked") {
          setLikedProducts([...likedProducts, productId]);
          let stored = JSON.parse(
            localStorage.getItem("likedProducts") || "[]"
          );
          stored.push(productId);
          localStorage.setItem("likedProducts", JSON.stringify(stored));
        } else {
          setLikedProducts(likedProducts.filter((id) => id !== productId));
          let stored = JSON.parse(
            localStorage.getItem("likedProducts") || "[]"
          );
          stored = stored.filter((id) => id !== productId);
          localStorage.setItem("likedProducts", JSON.stringify(stored));
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error updating wishlist");
      });
  };

  const displayProducts = isSearching ? searchResults : products;

  return (
    <div className="home-page">
      <Header onLocationChange={handleLocationChange} />

      <Categories />

      <div className="home-container">
        {/* Category Header */}
        <div className="section-header">
          <div>
            <h2
              className="section-title"
              style={{ fontSize: "var(--font-size-2xl)" }}
            >
              {param.categoryName}
            </h2>
            <p
              style={{
                color: "var(--gray-600)",
                marginTop: "var(--space-xs)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-xs)",
              }}
            >
              <FaMapMarkerAlt /> {selectedLocation} • {displayProducts.length}{" "}
              items
            </p>
          </div>
          {isSearching && (
            <button
              className="btn btn-secondary"
              onClick={() => setIsSearching(false)}
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="products-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <EmptyState
            category={param.categoryName}
            location={selectedLocation}
          />
        ) : (
          <div className="products-grid">
            {displayProducts.map((item) => (
              <ProductCard
                key={item._id}
                product={item}
                onLike={handleLike}
                isLiked={likedProducts.includes(item._id)}
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

export default CategoryPage;
