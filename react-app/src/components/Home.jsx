import React, { useEffect, useState, useCallback } from "react";
import Header from "./Header";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Categories from "./Categories";
import {
  FaHeart,
  FaMapMarkerAlt,
  FaPlus,
  FaFilter,
  FaTimes,
  FaBoxOpen,
  FaTh,
  FaThLarge,
  FaList,
  FaChevronDown,
} from "react-icons/fa";
import "./Home.css";
import { LOCATIONS, BROWSE_LOCATIONS } from "./LocationList";
import categories from "./CategoriesList";
import API_URL, { getImageUrl, getImageSrcSet } from "../constants";

// Product conditions for filter
const PRODUCT_CONDITIONS = ["New", "Sealed", "Like New", "Used"];
// Product status options for filter
const PRODUCT_STATUS = [
  { value: "all", label: "All Products" },
  { value: "Available", label: "Available" },
  { value: "Sold", label: "Sold" }
];
// View modes
const VIEW_MODES = { GRID: "grid", LIST: "list", COMPACT: "compact" };

function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products, setproducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setsearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(
    localStorage.getItem("selectedLocation") || LOCATIONS.ENTIRE_CAMPUS
  );

  // Track liked products
  const [likedProducts, setLikedProducts] = useState(new Set());

  // Advanced filter states
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all"); // 'all', 'Available', 'Sold'
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [maxPriceLimit, setMaxPriceLimit] = useState(100000);
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("productViewMode") || VIEW_MODES.GRID
  );
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileLocationOpen, setMobileLocationOpen] = useState(false);
  const [showLocationTip, setShowLocationTip] = useState(false);

  // Show location tip for first-time users - only once ever
  useEffect(() => {
    const hasSeenLocationTip = localStorage.getItem("hasSeenLocationTip");
    if (!hasSeenLocationTip) {
      // Show tip after a short delay
      const timer = setTimeout(() => {
        setShowLocationTip(true);
        // Auto-dismiss after 10 seconds and mark as seen
        setTimeout(() => {
          setShowLocationTip(false);
          localStorage.setItem("hasSeenLocationTip", "true");
        }, 10000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissLocationTip = () => {
    setShowLocationTip(false);
    localStorage.setItem("hasSeenLocationTip", "true");
  };

  // Core search/filter function - used everywhere
  const filterProducts = useCallback((productsToFilter, searchValue, categories, conditions, price, status = 'all') => {
    let result = [...productsToFilter];
    
    // Status filter - filter by product availability status
    if (status && status !== 'all') {
      result = result.filter((item) => item.status === status);
    }
    
    // Search filter - check title, description, AND category (case-insensitive)
    const currentSearch = (searchValue || '').trim().toLowerCase();
    if (currentSearch) {
      result = result.filter((item) => {
        const titleMatch = item.pname?.toLowerCase().includes(currentSearch);
        const descMatch = item.pdesc?.toLowerCase().includes(currentSearch);
        const categoryMatch = item.category?.toLowerCase().includes(currentSearch);
        return titleMatch || descMatch || categoryMatch;
      });
    }

    // Category filter
    if (categories && categories.length > 0) {
      result = result.filter((item) => categories.includes(item.category));
    }

    // Condition filter
    if (conditions && conditions.length > 0) {
      result = result.filter((item) => conditions.includes(item.condition));
    }

    // Price range filter
    if (price) {
      result = result.filter((item) => {
        const itemPrice = parseFloat(item.price) || 0;
        return itemPrice >= price.min && itemPrice <= price.max;
      });
    }

    return result;
  }, []);

  // Check for search query from URL (from ProductDetail page)
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setsearch(searchQuery);
    }
  }, [searchParams]);

  // Apply search from URL when products are loaded - this is the KEY fix
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery && products.length > 0 && !isLoading) {
      // Apply filter with the URL search query
      const filtered = filterProducts(
        products,
        searchQuery,
        selectedCategories,
        selectedConditions,
        priceRange,
        selectedStatus
      );
      setFilteredProducts(filtered);
    }
  }, [products, isLoading, searchParams, filterProducts, selectedCategories, selectedConditions, priceRange, selectedStatus]);

  // Fetch all products (includes both Available and Sold)
  const fetchProducts = useCallback((location, searchQuery = null) => {
    setIsLoading(true);
    let url = `${API_URL}/get-products`;
    const params = new URLSearchParams();
    
    if (location && location !== LOCATIONS.ENTIRE_CAMPUS) {
      params.append('location', location);
    }
    // Note: We fetch ALL products (both Available and Sold) and filter client-side
    // This allows instant filter switching without additional API calls
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    axios
      .get(url)
      .then((res) => {
        if (res.data.products) {
          // Store ALL products (both Available and Sold)
          const allProducts = res.data.products;
          setproducts(allProducts);

          // Calculate max price for slider from all products
          let newMaxPrice = 100000;
          let newPriceRange = { min: 0, max: 100000 };
          if (allProducts.length > 0) {
            const maxPrice = Math.max(
              ...allProducts.map((p) => parseFloat(p.price) || 0)
            );
            newMaxPrice = Math.ceil(maxPrice / 1000) * 1000 || 100000;
            newPriceRange = { min: 0, max: newMaxPrice };
            setMaxPriceLimit(newMaxPrice);
            setPriceRange(newPriceRange);
          }

          // Apply all filters including status
          if (searchQuery && searchQuery.trim()) {
            const filtered = filterProducts(
              allProducts,
              searchQuery,
              selectedCategories,
              selectedConditions,
              newPriceRange,
              selectedStatus
            );
            setFilteredProducts(filtered);
          } else {
            // Apply status filter even without search
            const filtered = filterProducts(
              allProducts,
              '',
              selectedCategories,
              selectedConditions,
              newPriceRange,
              selectedStatus
            );
            setFilteredProducts(filtered);
          }
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [filterProducts, selectedCategories, selectedConditions, selectedStatus]);

  useEffect(() => {
    // Pass the search query from URL to fetchProducts so it applies immediately
    const searchQuery = searchParams.get('search');
    fetchProducts(selectedLocation, searchQuery);
    fetchLikedProducts();
  }, [selectedLocation, fetchProducts, searchParams]);

  // Re-apply filters when status changes
  useEffect(() => {
    if (products.length > 0 && !isLoading) {
      const filtered = filterProducts(
        products,
        search,
        selectedCategories,
        selectedConditions,
        priceRange,
        selectedStatus
      );
      setFilteredProducts(filtered);
    }
  }, [selectedStatus, products, search, selectedCategories, selectedConditions, priceRange, filterProducts, isLoading]);

  // Fetch liked products on mount
  const fetchLikedProducts = () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    axios
      .post(`${API_URL}/liked-products`, { userId })
      .then((res) => {
        if (res.data.products) {
          const likedIds = new Set(res.data.products.map((p) => p._id));
          setLikedProducts(likedIds);
        }
      })
      .catch((err) => {
        console.log("Error fetching liked products:", err);
      });
  };

  // Debounced search - applies filter 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim()) {
        applyFilters();
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Apply filters whenever filter states change (except search - that's debounced above)
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedConditions, priceRange, products]);

  // Main filter function - uses the core filterProducts function
  const applyFilters = useCallback(() => {
    const result = filterProducts(
      products,
      search,
      selectedCategories,
      selectedConditions,
      priceRange,
      selectedStatus
    );
    setFilteredProducts(result);
  }, [products, search, selectedCategories, selectedConditions, priceRange, selectedStatus, filterProducts]);

  const handleLocationChange = (newLocation) => {
    setSelectedLocation(newLocation);
    clearAllFilters();
  };

  const handlesearch = (value) => {
    setsearch(value);
    // If search is cleared, immediately show all products (apply other filters only)
    if (!value.trim()) {
      // Clear URL search param if present
      if (searchParams.get('search')) {
        navigate('/', { replace: true });
      }
      // Show all products with current filters (no search)
      const result = filterProducts(products, '', selectedCategories, selectedConditions, priceRange, selectedStatus);
      setFilteredProducts(result);
    }
  };

  // Clear search and show all products
  const clearSearch = () => {
    setsearch("");
    // Clear URL search param if present
    if (searchParams.get('search')) {
      navigate('/', { replace: true });
    }
    // Apply filters without search
    const result = filterProducts(products, '', selectedCategories, selectedConditions, priceRange, selectedStatus);
    setFilteredProducts(result);
  };

  const handleClick = () => {
    // Force re-apply all filters including search
    applyFilters();
  };

  const handleCategory = (value) => {
    if (selectedCategories.includes(value)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== value));
    } else {
      setSelectedCategories([...selectedCategories, value]);
    }
  };

  const toggleCondition = (condition) => {
    if (selectedConditions.includes(condition)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== condition));
    } else {
      setSelectedConditions([...selectedConditions, condition]);
    }
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedConditions([]);
    setSelectedStatus("all"); // Reset status filter
    setPriceRange({ min: 0, max: maxPriceLimit });
    setsearch("");
    // Clear URL search param if present
    if (searchParams.get('search')) {
      navigate('/', { replace: true });
    }
    // Reset to show all products
    setFilteredProducts(products);
  };

  const hasActiveFilters = () => {
    return (
      selectedCategories.length > 0 ||
      selectedConditions.length > 0 ||
      selectedStatus !== "all" ||
      priceRange.min > 0 ||
      priceRange.max < maxPriceLimit ||
      search.trim()
    );
  };

  const handleLike = (productId, e) => {
    e.stopPropagation();
    let userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    // Optimistic UI update
    const newLikedProducts = new Set(likedProducts);
    const wasLiked = likedProducts.has(productId);
    
    if (wasLiked) {
      newLikedProducts.delete(productId);
    } else {
      newLikedProducts.add(productId);
    }
    setLikedProducts(newLikedProducts);

    // API call
    const url = `${API_URL}/like-product`;
    const data = { productId, userId };
    axios
      .post(url, data)
      .then((res) => {
        // Verify server response matches our optimistic update
        if (res.data.message === "liked" && !newLikedProducts.has(productId)) {
          newLikedProducts.add(productId);
          setLikedProducts(new Set(newLikedProducts));
        } else if (res.data.message === "unliked" && newLikedProducts.has(productId)) {
          newLikedProducts.delete(productId);
          setLikedProducts(new Set(newLikedProducts));
        }
      })
      .catch((err) => {
        console.log(err);
        // Revert on error
        setLikedProducts(new Set(likedProducts));
      });
  };

  const handleProduct = (id) => {
    navigate(`/products/${id}`);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("productViewMode", mode);
  };

  // Product Card Component with Sold badge
  const ProductCard = React.memo(({ item }) => {
    const isLiked = likedProducts.has(item._id);
    const isSold = item.status === "Sold";
    
    return (
      <div className={`product-card ${isSold ? 'sold' : ''}`} onClick={() => handleProduct(item._id)}>
        <div className="product-image-container">
          <img
            src={getImageUrl(item.pimage, { width: 400 })}
            srcSet={getImageSrcSet(item.pimage)}
            sizes="(max-width: 576px) 160px, (max-width: 768px) 240px, (max-width: 1200px) 280px, 300px"
            alt={item.pname}
            className="product-image"
            loading="lazy"
            decoding="async"
          />
          {/* Sold Overlay Badge */}
          {isSold && (
            <div className="sold-badge-overlay">
              <span className="sold-badge-text">SOLD</span>
            </div>
          )}
          <button
            className={`like-btn ${isLiked ? "liked" : ""}`}
            onClick={(e) => handleLike(item._id, e)}
            aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
            title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
          >
            <FaHeart />
          </button>
      </div>
      <div className="product-info">
        <div className="product-price-row">
          <h3 className="product-price">₹{Number(item.price).toLocaleString('en-IN')}</h3>
          {item.isNegotiable !== undefined && (
            <span className={`negotiable-badge ${item.isNegotiable ? 'negotiable' : 'fixed'}`}>
              {item.isNegotiable ? 'Negotiable' : 'Fixed'}
            </span>
          )}
        </div>
        <p className="product-title">{item.pname}</p>
        <p className="product-category">{item.category}</p>
        {/* Age and Location row - 50/50 */}
        <div className="product-meta-row">
          {item.productAge && (
            <span className="product-age">
              <FaBoxOpen /> {item.productAge}
            </span>
          )}
          <span className="info-location-badge">
            <FaMapMarkerAlt /> {item.location}
          </span>
        </div>
        {/* Description and Condition row */}
        <div className="product-desc-row">
          <p className="product-desc">{item.pdesc}</p>
          {item.condition && (
            <span className="info-condition-badge">{item.condition}</span>
          )}
        </div>
      </div>
    </div>
  );
  });

  // Skeleton Loader
  const SkeletonCard = () => (
    <div className="product-card skeleton-card">
      <div className="skeleton skeleton-image"></div>
      <div className="product-info">
        <div className="skeleton skeleton-price"></div>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-text"></div>
      </div>
    </div>
  );

  // Loading state with tips for first-time users
  const LoadingState = () => {
    const isFirstVisit = !localStorage.getItem("hasVisitedBefore");
    const tips = [
      "💡 You can filter products by your hostel to find items nearby!",
      "🔍 Use the search bar to find specific items quickly",
      "❤️ Save items you like by clicking the heart icon",
      "📍 Change your location to see products from different hostels",
      "💰 Use price filters to find items within your budget"
    ];
    const [currentTip, setCurrentTip] = useState(0);
    
    useEffect(() => {
      if (isFirstVisit) {
        const tipInterval = setInterval(() => {
          setCurrentTip(prev => (prev + 1) % tips.length);
        }, 3000);
        return () => clearInterval(tipInterval);
      }
    }, [isFirstVisit, tips.length]);

    useEffect(() => {
      // Mark as visited after first load
      localStorage.setItem("hasVisitedBefore", "true");
    }, []);
    
    return (
      <div className="loading-state">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading products...</p>
        </div>
        {isFirstVisit && (
          <div className="first-visit-tips">
            <h4>👋 Welcome to SellBUY!</h4>
            <p className="tip-text">{tips[currentTip]}</p>
            <div className="tip-dots">
              {tips.map((_, i) => (
                <span key={i} className={`tip-dot ${i === currentTip ? 'active' : ''}`}></span>
              ))}
            </div>
          </div>
        )}
        <div className="products-grid grid loading-grid">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  };

  // Empty State Component
  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-state-icon">📦</div>
      <h2>Nothing here yet!</h2>
      <p>
        {hasActiveFilters()
          ? "No matches for your filters — try tweaking them or start fresh!"
          : `Looks like ${selectedLocation} is quiet right now. Be the first to list something amazing!`}
      </p>
      {hasActiveFilters() && (
        <button className="btn btn-secondary" onClick={clearAllFilters}>
          <FaTimes /> Clear Filters
        </button>
      )}
      {localStorage.getItem("token") && !hasActiveFilters() && (
        <Link to="/add-product" className="btn btn-accent">
          <FaPlus /> List Your First Item
        </Link>
      )}
    </div>
  );

  return (
    <div className="home-page">
      <Header
        search={search}
        handlesearch={handlesearch}
        handleClick={handleClick}
        onLocationChange={handleLocationChange}
      />

      <Categories
        handleCategory={handleCategory}
        selectedCategories={selectedCategories}
      />

      {/* Hero Banner - Hide when searching */}
      {!search && (
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Buy & Sell Within Your Campus</h1>
            <p className="hero-subtitle">
              Find great deals from students in {selectedLocation}
            </p>
            {!localStorage.getItem("token") && (
              <Link to="/signup" className="btn btn-accent btn-lg">
                Get Started - It's Free
              </Link>
            )}
          </div>
          {/* Disclaimer */}
          <p className="hero-disclaimer">
            🎓 This platform is built to help students buy and sell responsibly. 
            Misuse of this service may lead to account suspension.
          </p>
        </section>
      )}

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {/* Mobile Results Row - Simple count display */}
          <div className="mobile-results-info">
            <span className="results-count">{filteredProducts.length} items</span>
            <div className="location-badge-wrapper">
              <span className="location-badge" onClick={() => setMobileLocationOpen(true)}>
                <FaMapMarkerAlt /> {selectedLocation}
              </span>
              {/* Show the Pro tip tooltip only on desktop */}
              {showLocationTip && window.innerWidth > 768 && (
                <div className="location-tooltip">
                  <button className="tooltip-close" onClick={dismissLocationTip} aria-label="Dismiss location tip">×</button>
                  <p>💡 <strong>Pro tip:</strong > Filter products by your hostel to find items nearby!</p>
                </div>
              )}
            </div>
          </div>

          {/* Layout with Sidebar Filters */}
          <div className="home-layout">
            {/* Filters Sidebar - Desktop Only */}
            <aside className={`filters-sidebar ${filtersExpanded ? 'expanded' : 'collapsed'}`}>
              <div className="sidebar-header" onClick={() => setFiltersExpanded(!filtersExpanded)}>
                <h2 className="sidebar-title">
                  <FaFilter /> Filters
                  {hasActiveFilters() && <span className="filter-count">{selectedCategories.length + selectedConditions.length + (priceRange.min > 0 || priceRange.max < maxPriceLimit ? 1 : 0)}</span>}
                </h2>
                <div className="sidebar-header-right">
                  {hasActiveFilters() && (
                    <button
                      className="clear-filters-link"
                      onClick={(e) => { e.stopPropagation(); clearAllFilters(); }}
                      aria-label="Clear all filters"
                    >
                      Clear
                    </button>
                  )}
                  <span className={`expand-arrow ${filtersExpanded ? 'open' : ''}`}>
                    <FaChevronDown />
                  </span>
                </div>
              </div>

              <div className="filters-content">
                {/* Price Range */}
                <div className="filter-group">
                <h4 className="filter-title">Price Range</h4>
                <div className="price-slider-container">
                  <div className="price-inputs-compact">
                    <div className="price-input-compact">
                      <span>₹</span>
                      <input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) =>
                          setPriceRange({
                            ...priceRange,
                            min: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        min="0"
                        max={priceRange.max}
                        placeholder="Min"
                        aria-label="Minimum price"
                      />
                    </div>
                    <span className="price-dash">-</span>
                    <div className="price-input-compact">
                      <span>₹</span>
                      <input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) =>
                          setPriceRange({
                            ...priceRange,
                            max: Math.min(
                              maxPriceLimit,
                              parseInt(e.target.value) || maxPriceLimit
                            ),
                          })
                        }
                        min={priceRange.min}
                        max={maxPriceLimit}
                        placeholder="Max"
                        aria-label="Maximum price"
                      />
                    </div>
                  </div>
                  <div className="range-slider">
                    <input
                      type="range"
                      min="0"
                      max={maxPriceLimit}
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({
                          ...priceRange,
                          min: Math.min(
                            parseInt(e.target.value),
                            priceRange.max - 100
                          ),
                        })
                      }
                      className="slider slider-min"
                      aria-label="Minimum price slider"
                    />
                    <input
                      type="range"
                      min="0"
                      max={maxPriceLimit}
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({
                          ...priceRange,
                          max: Math.max(
                            parseInt(e.target.value),
                            priceRange.min + 100
                          ),
                        })
                      }
                      className="slider slider-max"
                      aria-label="Maximum price slider"
                    />
                    <div
                      className="slider-track"
                      style={{
                        left: `${(priceRange.min / maxPriceLimit) * 100}%`,
                        right: `${
                          100 - (priceRange.max / maxPriceLimit) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Condition Filter */}
              <div className="filter-group">
                <h4 className="filter-title">Condition</h4>
                <div className="filter-chips-compact">
                  {PRODUCT_CONDITIONS.map((cond) => (
                    <button
                      key={cond}
                      className={`filter-chip-compact ${
                        selectedConditions.includes(cond) ? "active" : ""
                      }`}
                      onClick={() => toggleCondition(cond)}
                      aria-label={`Filter by ${cond} condition`}
                      aria-pressed={selectedConditions.includes(cond)}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability Status Filter */}
              <div className="filter-group">
                <h4 className="filter-title">Availability</h4>
                <div className="filter-chips-compact status-filter">
                  {PRODUCT_STATUS.map((status) => (
                    <button
                      key={status.value}
                      className={`filter-chip-compact ${
                        selectedStatus === status.value ? "active" : ""
                      }`}
                      onClick={() => setSelectedStatus(status.value)}
                      aria-label={`Filter by ${status.label}`}
                      aria-pressed={selectedStatus === status.value}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="filter-group">
                <h4 className="filter-title">Categories</h4>
                <div className="filter-chips-compact category-list">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`filter-chip-compact ${
                        selectedCategories.includes(cat) ? "active" : ""
                      }`}
                      onClick={() => handleCategory(cat)}
                      aria-label={`Filter by ${cat} category`}
                      aria-pressed={selectedCategories.includes(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              </div>
            </aside>

            {/* Products Area */}
            <div className="products-area">
              {/* Results Info Bar */}
              <div className="results-bar">
                <div className="results-info">
                  <span className="results-count">
                    {filteredProducts.length} items
                  </span>
                  <div className="location-info-wrapper">
                    <span className="location-info">
                      <FaMapMarkerAlt /> {selectedLocation}
                    </span>
                    {showLocationTip && (
                      <div className="location-tooltip desktop-tooltip">
                        <button className="tooltip-close" onClick={dismissLocationTip}>×</button>
                        <p>💡 <strong>Pro tip:</strong> Use the location filter in the header to find products in your hostel</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="view-mode-toggle">
                  <button
                    className={`view-btn ${viewMode === VIEW_MODES.GRID ? "active" : ""}`}
                    onClick={() => handleViewModeChange(VIEW_MODES.GRID)}
                    title="Grid View"
                    aria-label="Switch to grid view"
                    aria-pressed={viewMode === VIEW_MODES.GRID}
                  >
                    <FaThLarge />
                  </button>
                  <button
                    className={`view-btn ${viewMode === VIEW_MODES.COMPACT ? "active" : ""}`}
                    onClick={() => handleViewModeChange(VIEW_MODES.COMPACT)}
                    title="Compact View"
                    aria-label="Switch to compact view"
                    aria-pressed={viewMode === VIEW_MODES.COMPACT}
                  >
                    <FaTh />
                  </button>
                  <button
                    className={`view-btn ${viewMode === VIEW_MODES.LIST ? "active" : ""}`}
                    onClick={() => handleViewModeChange(VIEW_MODES.LIST)}
                    title="List View"
                    aria-label="Switch to list view"
                    aria-pressed={viewMode === VIEW_MODES.LIST}
                  >
                    <FaList />
                  </button>
                </div>
              </div>

              {/* Active Filters Pills */}
              {hasActiveFilters() && (
                <div className="active-filters">
                  {search && (
                    <span className="filter-pill">
                      Search: "{search}"
                      <button onClick={clearSearch} aria-label="Clear search">
                        <FaTimes />
                      </button>
                    </span>
                  )}
                  {selectedCategories.map((cat) => (
                    <span key={cat} className="filter-pill">
                      {cat}
                      <button onClick={() => handleCategory(cat)} aria-label={`Remove ${cat} filter`}>
                        <FaTimes />
                      </button>
                    </span>
                  ))}
                  {selectedConditions.map((cond) => (
                    <span key={cond} className="filter-pill">
                      {cond}
                      <button onClick={() => toggleCondition(cond)} aria-label={`Remove ${cond} condition filter`}>
                        <FaTimes />
                      </button>
                    </span>
                  ))}
                  {(priceRange.min > 0 || priceRange.max < maxPriceLimit) && (
                    <span className="filter-pill">
                      ₹{priceRange.min} - ₹{priceRange.max}
                      <button
                        onClick={() =>
                          setPriceRange({ min: 0, max: maxPriceLimit })
                        }
                        aria-label="Remove price range filter"
                      >
                        <FaTimes />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Products Grid */}
              {isLoading ? (
                <LoadingState />
              ) : filteredProducts.length > 0 ? (
                <div className={`products-grid ${viewMode}`}>
                  {filteredProducts.map((item) => (
                    <ProductCard key={item._id} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-left">
              <span className="footer-logo">SellBUY</span>
              <span className="footer-divider">•</span>
              <span className="footer-tagline">Campus Marketplace</span>
            </div>
            
            <div className="footer-center">
              <span className="footer-message">
                😊 See you Tomorrow With New Products!!
              </span>
            </div>

            {/* <div className="footer-right">
              <span>2025 </span>
            </div> */}
          </div>
        </div>
      </footer>

      {/* Mobile Floating Sell Button */}
      {localStorage.getItem("token") && (
        <Link to="/add-product" className="mobile-floating-sell-btn">
          <FaPlus /> SELL
        </Link>
      )}

      {/* Mobile Floating Filter FAB */}
      <div className={`mobile-fab-filter ${mobileFilterOpen ? 'open' : ''}`}>
        <button 
          className="fab-trigger filter-fab"
          onClick={() => {
            setMobileFilterOpen(!mobileFilterOpen);
            setMobileLocationOpen(false);
          }}
          aria-label="Open filters"
          aria-expanded={mobileFilterOpen}
        >
          <FaFilter />
          {hasActiveFilters() && <span className="fab-badge">{selectedCategories.length + selectedConditions.length + (priceRange.min > 0 || priceRange.max < maxPriceLimit ? 1 : 0)}</span>}
        </button>
        
        <div className="fab-panel filter-panel">
          <div className="fab-panel-header">
            <h2><FaFilter /> Filters</h2>
            <button className="close-fab" onClick={() => setMobileFilterOpen(false)} aria-label="Close filters"><FaTimes /></button>
          </div>
          
          {/* View Mode Toggle */}
          <div className="filter-group">
            <h4 className="filter-title">View Mode</h4>
            <div className="view-mode-options">
              <button
                className={`view-option ${viewMode === VIEW_MODES.GRID ? "active" : ""}`}
                onClick={() => handleViewModeChange(VIEW_MODES.GRID)}
                aria-label="Switch to grid view"
                aria-pressed={viewMode === VIEW_MODES.GRID}
              >
                <FaThLarge /> Grid
              </button>
              <button
                className={`view-option ${viewMode === VIEW_MODES.COMPACT ? "active" : ""}`}
                onClick={() => handleViewModeChange(VIEW_MODES.COMPACT)}
                aria-label="Switch to compact view"
                aria-pressed={viewMode === VIEW_MODES.COMPACT}
              >
                <FaTh /> Compact
              </button>
              <button
                className={`view-option ${viewMode === VIEW_MODES.LIST ? "active" : ""}`}
                onClick={() => handleViewModeChange(VIEW_MODES.LIST)}
                aria-label="Switch to list view"
                aria-pressed={viewMode === VIEW_MODES.LIST}
              >
                <FaList /> List
              </button>
            </div>
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <h4 className="filter-title">Price Range</h4>
            <div className="price-inputs-compact">
              <div className="price-input-compact">
                <span>₹</span>
                <input type="number" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: Math.max(0, parseInt(e.target.value) || 0)})} min="0" max={priceRange.max} aria-label="Minimum price" />
              </div>
              <span className="price-dash">-</span>
              <div className="price-input-compact">
                <span>₹</span>
                <input type="number" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: Math.min(maxPriceLimit, parseInt(e.target.value) || maxPriceLimit)})} min={priceRange.min} max={maxPriceLimit} aria-label="Maximum price" />
              </div>
            </div>
          </div>

          {/* Condition */}
          <div className="filter-group">
            <h4 className="filter-title">Condition</h4>
            <div className="filter-chips-compact">
              {PRODUCT_CONDITIONS.map((cond) => (
                <button key={cond} className={`filter-chip-compact ${selectedConditions.includes(cond) ? "active" : ""}`} onClick={() => toggleCondition(cond)} aria-label={`Filter by ${cond} condition`} aria-pressed={selectedConditions.includes(cond)}>{cond}</button>
              ))}
            </div>
          </div>

          {/* Availability Status */}
          <div className="filter-group">
            <h4 className="filter-title">Availability</h4>
            <div className="filter-chips-compact status-filter">
              {PRODUCT_STATUS.map((status) => (
                <button key={status.value} className={`filter-chip-compact ${selectedStatus === status.value ? "active" : ""}`} onClick={() => setSelectedStatus(status.value)} aria-label={`Filter by ${status.label}`} aria-pressed={selectedStatus === status.value}>{status.label}</button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="filter-group">
            <h4 className="filter-title">Categories</h4>
            <div className="filter-chips-compact category-list">
              {categories.map((cat) => (
                <button key={cat} className={`filter-chip-compact ${selectedCategories.includes(cat) ? "active" : ""}`} onClick={() => handleCategory(cat)} aria-label={`Filter by ${cat} category`} aria-pressed={selectedCategories.includes(cat)}>{cat}</button>
              ))}
            </div>
          </div>

          {hasActiveFilters() && (
            <button className="clear-all-btn" onClick={clearAllFilters}><FaTimes /> Clear All Filters</button>
          )}
        </div>
      </div>

      {/* Mobile Floating Location FAB */}
      <div className={`mobile-fab-location ${mobileLocationOpen ? 'open' : ''}`}>
        {showLocationTip && (
          <div className="fab-tooltip">
            <span>Filter by your hostel</span>
            <button onClick={dismissLocationTip}>×</button>
          </div>
        )}
        <button 
          className={`fab-trigger location-fab ${showLocationTip ? 'pulse' : ''}`}
          onClick={() => {
            setMobileLocationOpen(!mobileLocationOpen);
            setMobileFilterOpen(false);
            dismissLocationTip();
          }}
          aria-label="Select location"
          aria-expanded={mobileLocationOpen}
        >
          <FaMapMarkerAlt />
        </button>
        
        <div className="fab-panel location-panel">
          <div className="fab-panel-header">
            <h2><FaMapMarkerAlt /> Select Location</h2>
            <button className="close-fab" onClick={() => setMobileLocationOpen(false)} aria-label="Close location selector"><FaTimes /></button>
          </div>
          <p className="location-hint">Find products closer to you by selecting your hostel or block</p>
          
          <div className="location-options">
            {BROWSE_LOCATIONS.map((loc) => (
              <button 
                key={loc} 
                className={`location-option ${selectedLocation === loc ? 'active' : ''}`}
                onClick={() => {
                  setSelectedLocation(loc);
                  setMobileLocationOpen(false);
                }}
                aria-label={`Select ${loc} location`}
                aria-pressed={selectedLocation === loc}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Backdrop for FAB panels */}
      {(mobileFilterOpen || mobileLocationOpen) && (
        <div 
          className="fab-backdrop" 
          onClick={() => {
            setMobileFilterOpen(false);
            setMobileLocationOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default Home;
