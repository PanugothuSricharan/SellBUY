import "./Header.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaSearch,
  FaHeart,
  FaPlus,
  FaMapMarkerAlt,
  FaUser,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaBoxOpen,
  FaShoppingCart,
  FaChevronDown,
  FaShieldAlt,
  FaPhone,
  FaHome,
} from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { BROWSE_LOCATIONS, LOCATIONS } from "./LocationList";
import API_URL from "../constants";

function Header(props) {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState(
    LOCATIONS.ENTIRE_CAMPUS
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [mobileSuccess, setMobileSuccess] = useState(false);
  const [isSubmittingMobile, setIsSubmittingMobile] = useState(false);
  const userMenuRef = useRef(null);
  const locationRef = useRef(null);
  const mobileInputRef = useRef(null);

  useEffect(() => {
    // Check login status
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    setIsLoggedIn(!!token);

    // Fetch user info if logged in
    if (token && userId) {
      fetchUserInfo(userId);
      checkAdminStatus(userId);
    }

    // Get user location from localStorage on component mount (global app state)
    const savedLocation = localStorage.getItem("selectedLocation");
    if (savedLocation && BROWSE_LOCATIONS.includes(savedLocation)) {
      setSelectedLocation(savedLocation);
    } else {
      // Default to "Entire Campus" if no location saved
      localStorage.setItem("selectedLocation", LOCATIONS.ENTIRE_CAMPUS);
    }

    // Check dark mode preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }

    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUserInfo = async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/get-user/${userId}`);
      if (res.data.user) {
        setUserName(res.data.user.username || res.data.user.email?.split("@")[0] || "User");
        setUserEmail(res.data.user.email || "");
      }
    } catch (err) {
      console.log("Error fetching user info:", err);
    }
  };

  const checkAdminStatus = async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/check-admin/${userId}`);
      setIsAdmin(res.data.isAdmin);
    } catch (err) {
      console.log("Error checking admin status:", err);
    }
  };

  const handleEditMobile = () => {
    setShowUserMenu(false);
    setShowMobileModal(true);
    setMobileError("");
    setMobileSuccess(false);
    // Focus the input after modal opens
    setTimeout(() => mobileInputRef.current?.focus(), 100);
  };

  const handleMobileSubmit = async () => {
    // Validate mobile number
    if (!mobileNumber.trim()) {
      setMobileError("Please enter your mobile number");
      return;
    }
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      setMobileError("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsSubmittingMobile(true);
    setMobileError("");
    const userId = localStorage.getItem("userId");

    try {
      const res = await axios.put(`${API_URL}/update-mobile/${userId}`, {
        mobile: mobileNumber,
      });
      
      if (res.data.message.includes("success")) {
        setMobileSuccess(true);
        setTimeout(() => {
          setShowMobileModal(false);
          setMobileNumber("");
          setMobileSuccess(false);
        }, 1500);
      } else {
        setMobileError(res.data.message || "Failed to update mobile number");
      }
    } catch (err) {
      setMobileError(err.response?.data?.message || "Error updating mobile number. Please try again.");
    } finally {
      setIsSubmittingMobile(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    setUserName("");
    setUserEmail("");
    setIsAdmin(false);
    setShowUserMenu(false);
    navigate("/login");
  };

  const handleLocationChange = (newLocation) => {
    // Persist location as global app state
    localStorage.setItem("selectedLocation", newLocation);
    setSelectedLocation(newLocation);
    setShowLocationDropdown(false);

    // Notify parent component to refetch data with new location filter
    if (props.onLocationChange) {
      props.onLocationChange(newLocation);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter" && props.handleClick) {
      props.handleClick();
    }
  };

  return (
    <>
    <header className="header">
      <div className="header-container">
        {/* Left Section - Logo & Location */}
        <div className="header-left">
          <Link to="/" className="logo">
            <span className="logo-icon">
              <FaShoppingCart />
            </span>
            <span className="logo-text">
              <span className="logo-sell">Sell</span>
              <span className="logo-buy">
                B<span className="flip-letter">U</span>Y
              </span>
            </span>
          </Link>

          <div className="location-picker" ref={locationRef}>
            <button 
              className="location-btn"
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              aria-label={`Current location: ${selectedLocation}. Click to change location`}
              aria-expanded={showLocationDropdown}
              aria-haspopup="listbox"
            >
              <FaMapMarkerAlt className="location-icon" aria-hidden="true" />
              <span className="location-text">{selectedLocation}</span>
              <FaChevronDown className={`location-arrow ${showLocationDropdown ? 'open' : ''}`} aria-hidden="true" />
            </button>
            
            {showLocationDropdown && (
              <div className="location-dropdown">
                {BROWSE_LOCATIONS.map((loc, index) => (
                  <button
                    key={index}
                    className={`location-option ${selectedLocation === loc ? 'active' : ''}`}
                    onClick={() => handleLocationChange(loc)}
                  >
                    <FaMapMarkerAlt />
                    <span>{loc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Section - Search */}
        <div className={`header-center ${props.hideSearch ? 'header-center-home-only' : ''}`}>
          <button 
            className={`home-btn ${props.hideSearch ? 'home-btn-highlight' : ''}`}
            title="Go to Home"
            onClick={() => {
              // Clear search and navigate to home
              if (props.handlesearch) {
                props.handlesearch("");
              }
              navigate("/");
              // Force page reload if already on home to reset filters
              if (window.location.pathname === "/") {
                window.location.reload();
              }
            }}
          >
            <FaHome />
            {props.hideSearch && <span className="home-btn-text">Search your product at Home</span>}
          </button>
          {!props.hideSearch && (
            <div className="search-container">
              <input
                className="search-input"
                type="text"
                value={props?.search || ""}
                onChange={(e) =>
                  props.handlesearch && props.handlesearch(e.target.value)
                }
                onKeyPress={handleSearchKeyPress}
                placeholder="Search for laptops, books, furniture..."
              />
              <button
                className="search-btn"
                onClick={() => props.handleClick && props.handleClick()}
                aria-label="Search"
              >
                <FaSearch />
              </button>
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="header-right">
          {isLoggedIn ? (
            <>
              {/* User Dropdown Menu */}
              <div className="user-menu-container" ref={userMenuRef}>
                <button
                  className="user-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-label={`User menu for ${userName}`}
                  aria-expanded={showUserMenu}
                  aria-haspopup="menu"
                >
                  <FaUser aria-hidden="true" />
                  <FaChevronDown
                    className={`menu-arrow ${showUserMenu ? "open" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {showUserMenu && (
                  <div className="user-dropdown" role="menu" aria-label="User account menu">
                    {/* User Info Section */}
                    <div className="dropdown-user-info">
                      <div className="user-avatar">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <span className="user-name">{userName}</span>
                        {userEmail && <span className="user-email">{userEmail}</span>}
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link
                      to="/my-listings"
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FaBoxOpen />
                      <span>My Listings</span>
                    </Link>
                    <Link
                      to="/Liked-products"
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FaHeart />
                      <span>Wishlist</span>
                    </Link>
                    <button
                      className="dropdown-item"
                      onClick={handleEditMobile}
                    >
                      <FaPhone />
                      <span>Edit Phone Number</span>
                    </button>
                    {isAdmin && (
                      <>
                        <div className="dropdown-divider"></div>
                        <Link
                          to="/admin"
                          className="dropdown-item admin-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FaShieldAlt />
                          <span>Admin Panel</span>
                        </Link>
                      </>
                    )}
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item theme-item"
                      onClick={toggleDarkMode}
                    >
                      {isDarkMode ? <FaSun /> : <FaMoon />}
                      <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                      <span
                        className={`theme-indicator ${
                          isDarkMode ? "dark" : ""
                        }`}
                      ></span>
                    </button>
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SELL Button - Separate */}
              <Link to="/add-product" className="sell-btn">
                <FaPlus />
                <span>SELL</span>
              </Link>
            </>
          ) : (
            <>
              {/* Theme Toggle for non-logged in users */}
              <button
                className="theme-toggle-simple"
                onClick={toggleDarkMode}
                title={isDarkMode ? "Light Mode" : "Dark Mode"}
              >
                {isDarkMode ? <FaSun /> : <FaMoon />}
              </button>
              <Link to="/login" className="login-btn">
                <FaUser />
                <span>Login</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>

    {/* Edit Phone Number Modal */}
    {showMobileModal && (
      <div 
        className="mobile-modal-overlay" 
        onClick={() => setShowMobileModal(false)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-modal-title"
      >
        <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
          <button 
            className="modal-close" 
            onClick={() => {
              setShowMobileModal(false);
              setMobileNumber("");
              setMobileError("");
            }}
            aria-label="Close modal"
          >
            ×
          </button>
          <h2 id="mobile-modal-title">
            📱 {mobileSuccess ? "Updated!" : "Update Phone Number"}
          </h2>
          {mobileSuccess ? (
            <p style={{ color: "var(--success-color)", textAlign: "center" }} role="status" aria-live="polite">
              ✓ Mobile number updated successfully!
            </p>
          ) : (
            <>
              <p id="mobile-modal-desc">Enter your 10-digit mobile number.</p>
              <input
                ref={mobileInputRef}
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                  setMobileError("");
                }}
                className="mobile-input"
                aria-describedby="mobile-modal-desc mobile-error"
                aria-invalid={!!mobileError}
              />
              {mobileError && (
                <p id="mobile-error" className="mobile-error" role="alert" aria-live="assertive">
                  {mobileError}
                </p>
              )}
              <button 
                className="mobile-submit-btn" 
                onClick={handleMobileSubmit}
                disabled={isSubmittingMobile || mobileNumber.length !== 10}
                aria-busy={isSubmittingMobile}
              >
                {isSubmittingMobile ? "Updating..." : "Update Number"}
              </button>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}

export default Header;
