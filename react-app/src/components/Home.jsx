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
  FaExternalLinkAlt,
  FaTh,
  FaThLarge,
  FaList,
  FaChevronDown,
} from "react-icons/fa";
import "./Home.css";
import { LOCATIONS, BROWSE_LOCATIONS } from "./LocationList";
import categories from "./CategoriesList";
import API_URL, { getImageUrl } from "../constants";

// Product conditions for filter
const PRODUCT_CONDITIONS = ["New", "Sealed", "Like New", "Used"];
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
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [maxPriceLimit, setMaxPriceLimit] = useState(100000);
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("productViewMode") || VIEW_MODES.GRID
  );
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [showMobileLocationDropdown, setShowMobileLocationDropdown] = useState(false);

  // Check for search query from URL (from ProductDetail page)
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setsearch(searchQuery);
    }
  }, [searchParams]);

  // Auto-trigger search when products load and there's a URL search query
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery && products.length > 0 && !isLoading) {
      // Apply the search filter
      const searchFiltered = products.filter((item) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          item.pname?.toLowerCase().includes(searchLower) ||
          item.pdesc?.toLowerCase().includes(searchLower) ||
          item.category?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredProducts(searchFiltered);
    }
  }, [products, isLoading, searchParams]);

  // Fetch all products
  const fetchProducts = useCallback((location) => {
    setIsLoading(true);
    let url = `${API_URL}/get-products`;
    if (location && location !== LOCATIONS.ENTIRE_CAMPUS) {
      url += `?location=${encodeURIComponent(location)}`;
    }

    axios
      .get(url)
      .then((res) => {
        if (res.data.products) {
          // Filter out sold products
          const availableProducts = res.data.products.filter(
            (p) => p.status !== "Sold"
          );
          setproducts(availableProducts);
          setFilteredProducts(availableProducts);

          // Calculate max price for slider
          if (availableProducts.length > 0) {
            const maxPrice = Math.max(
              ...availableProducts.map((p) => parseFloat(p.price) || 0)
            );
            setMaxPriceLimit(Math.ceil(maxPrice / 1000) * 1000 || 100000);
            setPriceRange({
              min: 0,
              max: Math.ceil(maxPrice / 1000) * 1000 || 100000,
            });
          }
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchProducts(selectedLocation);
    fetchLikedProducts();
  }, [selectedLocation, fetchProducts]);

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

  // Apply filters whenever filter states change (except search - that's on button click only)
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedConditions, priceRange, products]);

  const applyFilters = useCallback(() => {
    let result = [...products];

    // Search filter - use the current search value
    const currentSearch = search.trim();
    if (currentSearch) {
      const searchLower = currentSearch.toLowerCase();
      result = result.filter(
        (item) =>
          item.pname.toLowerCase().includes(searchLower) ||
          item.pdesc?.toLowerCase().includes(searchLower) ||
          item.category?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((item) =>
        selectedCategories.includes(item.category)
      );
    }

    // Condition filter
    if (selectedConditions.length > 0) {
      result = result.filter((item) =>
        selectedConditions.includes(item.condition)
      );
    }

    // Price range filter
    result = result.filter((item) => {
      const price = parseFloat(item.price) || 0;
      return price >= priceRange.min && price <= priceRange.max;
    });

    setFilteredProducts(result);
  }, [products, search, selectedCategories, selectedConditions, priceRange]);

  const handleLocationChange = (newLocation) => {
    setSelectedLocation(newLocation);
    clearAllFilters();
  };

  const handlesearch = (value) => {
    setsearch(value);
    // If search is cleared, reset to show all products with current filters
    if (!value.trim()) {
      applyFilters();
    }
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
    setPriceRange({ min: 0, max: maxPriceLimit });
    setsearch("");
  };

  const hasActiveFilters = () => {
    return (
      selectedCategories.length > 0 ||
      selectedConditions.length > 0 ||
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

  // Product Card Component
  const ProductCard = React.memo(({ item }) => {
    const isLiked = likedProducts.has(item._id);
    
    return (
      <div className="product-card" onClick={() => handleProduct(item._id)}>
        <div className="product-image-container">
          <img
            src={getImageUrl(item.pimage)}
            alt={item.pname}
            className="product-image"
            loading="lazy"
            decoding="async"
          />
          <button
            className={`like-btn ${isLiked ? "liked" : ""}`}
            onClick={(e) => handleLike(item._id, e)}
            aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
            title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
          >
            <FaHeart />
          </button>
        <span className="product-location-badge">
          <FaMapMarkerAlt /> {item.location}
        </span>
        {item.condition && (
          <span className="product-condition-badge">{item.condition}</span>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-price">₹{Number(item.price).toLocaleString('en-IN')}</h3>
        <p className="product-title">{item.pname}</p>
        <p className="product-category">{item.category}</p>
        {item.productAge && (
          <p className="product-age">
            <FaBoxOpen /> {item.productAge} old
          </p>
        )}
        <p className="product-desc">{item.pdesc}</p>
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

  // Empty State Component
  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-state-icon">📦</div>
      <h3>No products found</h3>
      <p>
        {hasActiveFilters()
          ? "Try different filters or clear all filters"
          : `No products available in ${selectedLocation}`}
      </p>
      {hasActiveFilters() && (
        <button className="btn btn-secondary" onClick={clearAllFilters}>
          <FaTimes /> Clear All Filters
        </button>
      )}
      {localStorage.getItem("token") && !hasActiveFilters() && (
        <Link to="/add-product" className="btn btn-accent">
          <FaPlus /> Sell Something
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

      {/* Hero Banner */}
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

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {/* Mobile Sticky Bar - Results + Filters Toggle */}
          <div className="mobile-sticky-bar">
            <div className="mobile-results-row">
              <span className="results-count">{filteredProducts.length} items</span>
              <div className="mobile-location-picker">
                <button 
                  className="mobile-location-btn"
                  onClick={() => setShowMobileLocationDropdown(!showMobileLocationDropdown)}
                >
                  <FaMapMarkerAlt /> {selectedLocation} <FaChevronDown className={showMobileLocationDropdown ? 'rotate' : ''} />
                </button>
                {showMobileLocationDropdown && (
                  <div className="mobile-location-dropdown">
                    {BROWSE_LOCATIONS.map((loc) => (
                      <div 
                        key={loc} 
                        className={`mobile-location-option ${selectedLocation === loc ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setShowMobileLocationDropdown(false);
                        }}
                      >
                        {loc}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="view-mode-toggle">
                <button
                  className={`view-btn ${viewMode === VIEW_MODES.GRID ? "active" : ""}`}
                  onClick={() => handleViewModeChange(VIEW_MODES.GRID)}
                  title="Grid View"
                >
                  <FaThLarge />
                </button>
                <button
                  className={`view-btn ${viewMode === VIEW_MODES.COMPACT ? "active" : ""}`}
                  onClick={() => handleViewModeChange(VIEW_MODES.COMPACT)}
                  title="Compact View"
                >
                  <FaTh />
                </button>
                <button
                  className={`view-btn ${viewMode === VIEW_MODES.LIST ? "active" : ""}`}
                  onClick={() => handleViewModeChange(VIEW_MODES.LIST)}
                  title="List View"
                >
                  <FaList />
                </button>
              </div>
            </div>
            <div className="mobile-filter-toggle" onClick={() => setFiltersExpanded(!filtersExpanded)}>
              <span><FaFilter /> Filters {hasActiveFilters() && <span className="filter-count">{selectedCategories.length + selectedConditions.length + (priceRange.min > 0 || priceRange.max < maxPriceLimit ? 1 : 0)}</span>}</span>
              <span className={`expand-arrow ${filtersExpanded ? 'open' : ''}`}><FaChevronDown /></span>
            </div>
            {filtersExpanded && (
              <div className="mobile-filter-content">
                {/* Price Range */}
                <div className="filter-group">
                  <h4 className="filter-title">Price Range</h4>
                  <div className="price-inputs-compact">
                    <div className="price-input-compact">
                      <span>₹</span>
                      <input type="number" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: Math.max(0, parseInt(e.target.value) || 0)})} min="0" max={priceRange.max} />
                    </div>
                    <span className="price-dash">-</span>
                    <div className="price-input-compact">
                      <span>₹</span>
                      <input type="number" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: Math.min(maxPriceLimit, parseInt(e.target.value) || maxPriceLimit)})} min={priceRange.min} max={maxPriceLimit} />
                    </div>
                  </div>
                </div>
                {/* Condition */}
                <div className="filter-group">
                  <h4 className="filter-title">Condition</h4>
                  <div className="filter-chips-compact">
                    {PRODUCT_CONDITIONS.map((cond) => (
                      <button key={cond} className={`filter-chip-compact ${selectedConditions.includes(cond) ? "active" : ""}`} onClick={() => toggleCondition(cond)}>{cond}</button>
                    ))}
                  </div>
                </div>
                {/* Categories */}
                <div className="filter-group">
                  <h4 className="filter-title">Categories</h4>
                  <div className="filter-chips-compact category-list">
                    {categories.map((cat) => (
                      <button key={cat} className={`filter-chip-compact ${selectedCategories.includes(cat) ? "active" : ""}`} onClick={() => handleCategory(cat)}>{cat}</button>
                    ))}
                  </div>
                </div>
                {hasActiveFilters() && (
                  <button className="clear-all-btn" onClick={clearAllFilters}><FaTimes /> Clear All Filters</button>
                )}
              </div>
            )}
          </div>

          {/* Layout with Sidebar Filters */}
          <div className="home-layout">
            {/* Filters Sidebar - Desktop Only */}
            <aside className={`filters-sidebar ${filtersExpanded ? 'expanded' : 'collapsed'}`}>
              <div className="sidebar-header" onClick={() => setFiltersExpanded(!filtersExpanded)}>
                <h3 className="sidebar-title">
                  <FaFilter /> Filters
                  {hasActiveFilters() && <span className="filter-count">{selectedCategories.length + selectedConditions.length + (priceRange.min > 0 || priceRange.max < maxPriceLimit ? 1 : 0)}</span>}
                </h3>
                <div className="sidebar-header-right">
                  {hasActiveFilters() && (
                    <button
                      className="clear-filters-link"
                      onClick={(e) => { e.stopPropagation(); clearAllFilters(); }}
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
                    >
                      {cond}
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
                  <span className="location-info">
                    <FaMapMarkerAlt /> {selectedLocation}
                  </span>
                </div>
                <div className="view-mode-toggle">
                  <button
                    className={`view-btn ${viewMode === VIEW_MODES.GRID ? "active" : ""}`}
                    onClick={() => handleViewModeChange(VIEW_MODES.GRID)}
                    title="Grid View"
                  >
                    <FaThLarge />
                  </button>
                  <button
                    className={`view-btn ${viewMode === VIEW_MODES.COMPACT ? "active" : ""}`}
                    onClick={() => handleViewModeChange(VIEW_MODES.COMPACT)}
                    title="Compact View"
                  >
                    <FaTh />
                  </button>
                  <button
                    className={`view-btn ${viewMode === VIEW_MODES.LIST ? "active" : ""}`}
                    onClick={() => handleViewModeChange(VIEW_MODES.LIST)}
                    title="List View"
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
                      <button onClick={() => setsearch("")}>
                        <FaTimes />
                      </button>
                    </span>
                  )}
                  {selectedCategories.map((cat) => (
                    <span key={cat} className="filter-pill">
                      {cat}
                      <button onClick={() => handleCategory(cat)}>
                        <FaTimes />
                      </button>
                    </span>
                  ))}
                  {selectedConditions.map((cond) => (
                    <span key={cond} className="filter-pill">
                      {cond}
                      <button onClick={() => toggleCondition(cond)}>
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
                      >
                        <FaTimes />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Products Grid */}
              {isLoading ? (
                <div className={`products-grid ${viewMode}`}>
                  {[...Array(8)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
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
              <a 
                href="https://youtu.be/Ph_beNQsIp0?si=cpiAN9HihHm1-yg1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-dev-link"
              >
                Built with ❤️ by a drone enthusiast
              </a>
            </div>

            <div className="footer-right">
              <span>© 2025 </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Sell Button */}
      {localStorage.getItem("token") && (
        <Link to="/add-product" className="mobile-floating-sell-btn">
          <FaPlus /> SELL
        </Link>
      )}
    </div>
  );
}

export default Home;
