import { useEffect, useState } from "react";
import API_URL, { getImageUrl } from "../constants";
import Header from "./Header";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaTrash,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaPlus,
  FaBoxOpen,
  FaExclamationTriangle,
  FaTimes,
  FaEdit,
  FaTimesCircle,
  FaHome,
  FaChevronRight,
  FaSearch,
} from "react-icons/fa";
import "./MyListings.css";

function MyListings() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMyProducts();
    checkBlockedStatus();
  }, [navigate]);

  const checkBlockedStatus = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    
    try {
      const res = await axios.get(`${API_URL}/get-user/${userId}`);
      if (res.data.user) {
        setIsBlocked(res.data.user.isBlocked || false);
        setBlockedReason(res.data.user.blockedReason || "");
      }
    } catch (err) {
      console.error("Error checking blocked status:", err);
    }
  };

  const fetchMyProducts = () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setIsLoading(true);
    axios
      .get(`${API_URL}/my-products/${userId}`)
      .then((res) => {
        if (res.data.products) {
          setProducts(res.data.products);
          setFilteredProducts(res.data.products);
        }
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter((product) => {
      return (
        product.pname?.toLowerCase().includes(query) ||
        product.pdesc?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        product.location?.toLowerCase().includes(query)
      );
    });
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!productToDelete) return;

    setActionLoading(productToDelete._id);
    const userId = localStorage.getItem("userId");

    axios
      .delete(`${API_URL}/delete-product/${productToDelete._id}`, {
        data: { userId },
      })
      .then((res) => {
        if (res.data.message.includes("success")) {
          setProducts(products.filter((p) => p._id !== productToDelete._id));
        }
      })
      .catch((err) => {
        console.error("Error deleting product:", err);
        alert("Failed to delete product");
      })
      .finally(() => {
        setActionLoading(null);
        setShowDeleteModal(false);
        setProductToDelete(null);
      });
  };

  const toggleStatus = (product) => {
    setActionLoading(product._id);
    const userId = localStorage.getItem("userId");
    const newStatus = product.status === "Available" ? "Sold" : "Available";

    axios
      .put(`${API_URL}/update-product-status/${product._id}`, {
        userId,
        status: newStatus,
      })
      .then((res) => {
        if (res.data.message) {
          setProducts(
            products.map((p) =>
              p._id === product._id ? { ...p, status: newStatus } : p
            )
          );
        }
      })
      .catch((err) => {
        console.error("Error updating status:", err);
        alert("Failed to update product status");
      })
      .finally(() => {
        setActionLoading(null);
      });
  };

  const handleProduct = (id) => {
    navigate(`/product/${id}`);
  };

  // Product Card Component
  const ProductCard = ({ item }) => (
    <div className="listing-card">
      <div
        className="listing-image-container"
        onClick={() => handleProduct(item._id)}
      >
        <img
          src={getImageUrl(item.pimage)}
          alt={item.pname}
          className="listing-image"
        />
        {item.status === "Sold" && (
          <div className="sold-overlay">
            <span>SOLD</span>
          </div>
        )}
        <span className="listing-location-badge">
          <FaMapMarkerAlt /> {item.location}
        </span>
        {item.condition && (
          <span className="listing-condition-badge">{item.condition}</span>
        )}
        {/* Approval Status Badge */}
        {item.approvalStatus && (
          <span className={`approval-badge ${item.approvalStatus.toLowerCase()}`}>
            {item.approvalStatus === "APPROVED" && <><FaCheckCircle /> Live</>}
            {item.approvalStatus === "HIDDEN" && <><FaTimesCircle /> Hidden by Admin</>}
          </span>
        )}
      </div>
      <div className="listing-info">
        <h3 className="listing-price">₹{Number(item.price).toLocaleString('en-IN')}</h3>
        <p className="listing-title">{item.pname}</p>
        <p className="listing-category">{item.category}</p>
        {item.productAge && (
          <p className="listing-age">
            <FaBoxOpen /> {item.productAge} old
          </p>
        )}
        <span className={`listing-status ${item.status?.toLowerCase()}`}>
          {item.status || "Available"}
        </span>
      </div>
      <div className="listing-actions">
        <button
          className="action-btn edit-btn"
          onClick={() => navigate(`/edit-product/${item._id}`)}
        >
          <FaEdit /> Edit
        </button>
        <button
          className={`action-btn status-btn ${
            item.status === "Sold" ? "mark-available" : "mark-sold"
          }`}
          onClick={() => toggleStatus(item)}
          disabled={actionLoading === item._id}
        >
          {actionLoading === item._id ? (
            <span className="loading-spinner-small"></span>
          ) : item.status === "Sold" ? (
            <>
              <FaBoxOpen /> Mark Available
            </>
          ) : (
            <>
              <FaCheckCircle /> Mark as Sold
            </>
          )}
        </button>
        <button
          className="action-btn delete-btn"
          onClick={() => handleDelete(item)}
          disabled={actionLoading === item._id}
        >
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  );

  // Skeleton Loader
  const SkeletonCard = () => (
    <div className="listing-card skeleton-card">
      <div className="skeleton skeleton-image"></div>
      <div className="listing-info">
        <div className="skeleton skeleton-price"></div>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-text"></div>
      </div>
      <div className="listing-actions">
        <div className="skeleton skeleton-btn"></div>
        <div className="skeleton skeleton-btn"></div>
      </div>
    </div>
  );

  // Empty State
  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-state-icon">📦</div>
      <h3>Ready to start selling?</h3>
      <p>Your shop is empty! List your first item and turn your unused stuff into cash.</p>
      <Link to="/add-product" className="btn btn-accent">
        <FaPlus /> Create Your First Listing
      </Link>
    </div>
  );

  return (
    <div className="my-listings-page">
      <Header hideSearch={true} />

      <main className="listings-content">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="breadcrumb">
            <Link to="/" aria-label="Go to home page">
              <FaHome /> Home
            </Link>
            <FaChevronRight />
            <span>Your Products</span>
          </nav>

          {/* Account Blocked Banner */}
          {isBlocked && (
            <div className="blocked-banner">
              <FaExclamationTriangle />
              <div>
                <strong>🚫 Your account has been suspended</strong>
                <p>Your products are not visible on the marketplace. 
                   {blockedReason && ` Reason: ${blockedReason}`}
                </p>
                <small>If you believe this is a mistake, please contact the admin.</small>
              </div>
            </div>
          )}

          <div className="listings-header">
            <div>
              <h1>My Listings</h1>
              <p>Manage your products and track sales</p>
            </div>
            <Link to="/add-product" className="btn btn-accent">
              <FaPlus /> Add New Product
            </Link>
          </div>

          {/* Search Bar */}
          {!isLoading && products.length > 0 && (
            <div className="listings-search-bar">
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search your products by name, category, or location..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="search-input"
                  aria-label="Search your products"
                />
                {searchQuery && (
                  <button 
                    className="clear-search-btn" 
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="search-results-text">
                  Found {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                </p>
              )}
            </div>
          )}

          {/* Stats */}
          {!isLoading && products.length > 0 && (
            <div className="listings-stats">
              <div className="stat-card">
                <span className="stat-value">{products.length}</span>
                <span className="stat-label">Total Listings</span>
              </div>
              <div className="stat-card">
                <span className="stat-value available">
                  {products.filter((p) => p.status !== "Sold" && p.approvalStatus === "APPROVED").length}
                </span>
                <span className="stat-label">Live</span>
              </div>
              <div className="stat-card">
                <span className="stat-value sold">
                  {products.filter((p) => p.status === "Sold").length}
                </span>
                <span className="stat-label">Sold</span>
              </div>
              {products.filter((p) => p.approvalStatus === "HIDDEN").length > 0 && (
                <div className="stat-card">
                  <span className="stat-value hidden">
                    {products.filter((p) => p.approvalStatus === "HIDDEN").length}
                  </span>
                  <span className="stat-label">Hidden</span>
                </div>
              )}
            </div>
          )}

          {/* Products Grid */}
          {isLoading ? (
            <div className="listings-grid">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="listings-grid">
              {filteredProducts.map((item) => (
                <ProductCard key={item._id} item={item} />
              ))}
            </div>
          ) : searchQuery ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No products found</h3>
              <p>No products match "{searchQuery}". Try a different search term.</p>
              <button className="btn btn-secondary" onClick={clearSearch}>
                Clear Search
              </button>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowDeleteModal(false)}
            >
              <FaTimes />
            </button>
            <div className="modal-icon warning">
              <FaExclamationTriangle />
            </div>
            <h2>Delete Listing?</h2>
            <p>
              Are you sure you want to delete "{productToDelete?.pname}"? This
              action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span className="loading-spinner-small"></span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyListings;
