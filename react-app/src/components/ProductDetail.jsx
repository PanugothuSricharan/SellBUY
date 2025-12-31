import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Header from "./Header";
import "./ProductDetail.css";
import API_URL, { getImageUrl, getFullImageUrl } from "../constants";
import {
  FaMapMarkerAlt,
  FaTag,
  FaClock,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaHeart,
  FaChevronRight,
  FaHome,
  FaBoxOpen,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaWhatsapp,
} from "react-icons/fa";

function ProductDetail() {
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { productId } = useParams();

  const images = [];

  if (product) {
    if (product.pimage) images.push(product.pimage);
    if (product.pimage2) images.push(product.pimage2);
  }

  useEffect(() => {
    const url = `${API_URL}/get-product/${productId}`;
    axios
      .get(url)
      .then((res) => {
        if (res.data.product) {
          setProduct(res.data.product);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.log("Error:", err);
        setIsLoading(false);
      });

    // Check if product is liked from backend
    checkIfLiked();
  }, [productId]);

  const checkIfLiked = () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    axios
      .post(`${API_URL}/liked-products`, { userId })
      .then((res) => {
        if (res.data.products) {
          const likedIds = res.data.products.map((p) => p._id);
          setIsLiked(likedIds.includes(productId));
        }
      })
      .catch((err) => {
        console.log("Error checking liked status:", err);
      });
  };

  const handleContact = (addedBy) => {
    setContactLoading(true);
    const url = `${API_URL}/get-user/${addedBy}`;
    axios
      .get(url)
      .then((res) => {
        if (res.data.user) {
          setUser(res.data.user);
        }
        setContactLoading(false);
      })
      .catch((err) => {
        alert("Server Error. Please try again.");
        setContactLoading(false);
      });
  };

  const handleLike = () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please login to save products");
      return;
    }

    // Optimistic UI update
    setIsLiked(!isLiked);

    const url = `${API_URL}/like-product`;
    axios
      .post(url, { productId, userId })
      .then((res) => {
        if (res.data.message === "liked") {
          setIsLiked(true);
        } else if (res.data.message === "unliked") {
          setIsLiked(false);
        }
      })
      .catch((err) => {
        console.log(err);
        // Revert on error
        setIsLiked(!isLiked);
        alert("Error updating wishlist");
      });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getSellerInitials = (name) => {
    if (!name) return "S";
    return name.charAt(0).toUpperCase();
  };

  // Handle search - navigate to home with search query
  const handleSearch = () => {
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="product-detail-page">
      <Header 
        search={search}
        handlesearch={setSearch}
        handleClick={handleSearch}
      />

      <div className="product-detail-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">
            <FaHome /> Home
          </Link>
          <FaChevronRight />
          {product && (
            <>
              <Link to={`/category/${product.category}`}>
                {product.category}
              </Link>
              <FaChevronRight />
              <span>{product.pname}</span>
            </>
          )}
        </nav>

        {isLoading ? (
          <div className="product-loading">
            <div className="loading-spinner-large"></div>
            <p>Loading product details...</p>
          </div>
        ) : !product ? (
          <div className="product-loading">
            <p>Product not found</p>
            <Link to="/" className="btn btn-primary">
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            <div className="product-detail-layout">
              {/* Image Gallery */}
              <div className="product-gallery">
                <div className="main-image-container">
                  <img
                    className="main-image"
                    src={getFullImageUrl(images[activeImage])}
                    alt={product.pname}
                  />
                </div>
                {images.length > 1 && (
                  <div className="thumbnail-grid">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        className={`thumbnail ${
                          activeImage === index ? "active" : ""
                        }`}
                        onClick={() => setActiveImage(index)}
                      >
                        <img
                          src={getImageUrl(img)}
                          alt={`${product.pname} ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info Sidebar */}
              <div className="product-info-sidebar">
                {/* Price Card */}
                <div className="product-price-card">
                  <div className="price-row">
                    <h2 className="product-detail-price">
                      ₹{product.price?.toLocaleString("en-IN")}
                    </h2>
                    {product.isNegotiable !== undefined && (
                      <span className={`negotiable-tag ${product.isNegotiable ? 'negotiable' : 'fixed'}`}>
                        {product.isNegotiable ? 'Negotiable' : 'Fixed Price'}
                      </span>
                    )}
                  </div>
                  <h1 className="product-detail-title">{product.pname}</h1>

                  <div className="product-meta">
                    <div className="product-meta-item">
                      <FaTag />
                      <span>
                        Category: <strong>{product.category}</strong>
                      </span>
                    </div>
                    <div className="product-meta-item">
                      <FaMapMarkerAlt />
                      <span>
                        Location:{" "}
                        <strong>{product.location || "Campus"}</strong>
                      </span>
                    </div>
                    {product.condition && (
                      <div className="product-meta-item">
                        <FaCheckCircle />
                        <span>
                          Condition: <strong>{product.condition}</strong>
                        </span>
                      </div>
                    )}
                    {product.productAge && (
                      <div className="product-meta-item">
                        <FaBoxOpen />
                        <span>
                          Product Age: <strong>{product.productAge}</strong>
                        </span>
                      </div>
                    )}
                    <div className="product-meta-item">
                      <FaClock />
                      <span>
                        Posted: <strong>{formatDate(product.createdAt)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Original Product Link */}
                  {product.originalUrl && (
                    <div className="original-product-link">
                      <a
                        href={product.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="original-link-btn"
                      >
                        <FaExternalLinkAlt />
                        View Original Product (Amazon/Flipkart)
                      </a>
                      <p className="original-link-hint">
                        Check the original specs and compare prices
                      </p>
                    </div>
                  )}

                  <div className="product-actions">
                    {!user ? (
                      <button
                        className="action-btn action-btn-primary"
                        onClick={() => handleContact(product.addedBy)}
                        disabled={contactLoading}
                      >
                        {contactLoading ? "Loading..." : "Show Contact Details"}
                      </button>
                    ) : (
                      <div className="contact-revealed">
                        <h4>Contact Details</h4>
                        <div className="seller-details">
                          <div className="seller-detail-item">
                            <FaUser />
                            <span>{user.username}</span>
                          </div>
                          <div className="seller-detail-item">
                            <FaEnvelope />
                            <span>{user.email}</span>
                          </div>
                          <div className="seller-detail-item">
                            <FaPhone />
                            <span>{user.mobile}</span>
                          </div>
                        </div>

                        {/* Contact Action Buttons */}
                        <div className="contact-action-buttons">
                          {(product.contactPreference === "WhatsApp" ||
                            product.contactPreference === "Both" ||
                            !product.contactPreference) && (
                            <a
                              href={`https://wa.me/91${user.mobile?.replace(
                                /\D/g,
                                ""
                              )}?text=Hi, I'm interested in your product "${
                                product.pname
                              }" listed on SellBUY for ₹${product.price}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="contact-action-btn whatsapp-btn"
                            >
                              <FaWhatsapp /> WhatsApp
                            </a>
                          )}
                          {(product.contactPreference === "Phone Call" ||
                            product.contactPreference === "Both" ||
                            !product.contactPreference) && (
                            <a
                              href={`tel:${user.mobile}`}
                              className="contact-action-btn call-btn"
                            >
                              <FaPhone /> Call Now
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    <button
                      className={`action-btn action-btn-wishlist ${
                        isLiked ? "liked" : ""
                      }`}
                      onClick={handleLike}
                    >
                      <FaHeart
                        style={{ color: isLiked ? "#e74c3c" : "inherit" }}
                      />
                      {isLiked ? "Saved to Wishlist" : "Save to Wishlist"}
                    </button>
                  </div>
                </div>

                {/* Seller Card */}
                <div className="seller-card">
                  <div className="seller-card-header">
                    <div className="seller-avatar">
                      {user ? getSellerInitials(user.username) : "S"}
                    </div>
                    <div className="seller-info">
                      <h4>{user?.username || "Seller"}</h4>
                      <p>IIITM Student</p>
                    </div>
                  </div>
                  <p
                    style={{
                      color: "var(--gray-600)",
                      fontSize: "var(--font-size-sm)",
                    }}
                  >
                    Click "Show Contact Details" to view seller information
                  </p>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="description-card">
              <h3>Description</h3>
              <p className="description-text">
                {product.pdesc || "No description provided."}
              </p>
            </div>

            {/* Mobile Sticky CTA */}
            <div className="mobile-sticky-cta">
              <div className="sticky-price">
                ₹{product.price?.toLocaleString("en-IN")}
              </div>
              <div className="sticky-actions">
                {!user ? (
                  <button
                    className="action-btn action-btn-primary"
                    onClick={() => handleContact(product.addedBy)}
                    disabled={contactLoading}
                  >
                    {contactLoading ? "Loading..." : "Contact Seller"}
                  </button>
                ) : (
                  <>
                    {(product.contactPreference === "WhatsApp" ||
                      product.contactPreference === "Both" ||
                      !product.contactPreference) && (
                      <a
                        href={`https://wa.me/91${user.mobile?.replace(
                          /\D/g,
                          ""
                        )}?text=Hi, I'm interested in your product "${
                          product.pname
                        }" listed on SellBUY`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn whatsapp-btn-mobile"
                      >
                        <FaWhatsapp />
                      </a>
                    )}
                    {(product.contactPreference === "Phone Call" ||
                      product.contactPreference === "Both" ||
                      !product.contactPreference) && (
                      <a
                        href={`tel:${user.mobile}`}
                        className="action-btn action-btn-primary"
                      >
                        <FaPhone />
                      </a>
                    )}
                  </>
                )}
                <button
                  className={`action-btn action-btn-wishlist ${
                    isLiked ? "liked" : ""
                  }`}
                  onClick={handleLike}
                >
                  <FaHeart style={{ color: isLiked ? "#e74c3c" : "inherit" }} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;
