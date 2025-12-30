import "./Header.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
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
} from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { BROWSE_LOCATIONS, LOCATIONS } from "./LocationList";

function Header(props) {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState(
    LOCATIONS.ENTIRE_CAMPUS
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const userMenuRef = useRef(null);
  const locationRef = useRef(null);

  useEffect(() => {
    // Check login status
    setIsLoggedIn(!!localStorage.getItem("token"));

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
            >
              <FaMapMarkerAlt className="location-icon" />
              <span className="location-text">{selectedLocation}</span>
              <FaChevronDown className={`location-arrow ${showLocationDropdown ? 'open' : ''}`} />
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
        <div className="header-center">
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
                >
                  <FaUser />
                  <FaChevronDown
                    className={`menu-arrow ${showUserMenu ? "open" : ""}`}
                  />
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
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
  );
}

export default Header;
