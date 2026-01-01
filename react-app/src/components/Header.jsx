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
  FaRedo,
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
  // OTP states
  const [otpStep, setOtpStep] = useState('phone'); // 'phone' or 'otp'
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [devOtp, setDevOtp] = useState(''); // For development only
  const userMenuRef = useRef(null);
  const locationRef = useRef(null);
  const mobileInputRef = useRef(null);
  const otpInputRef = useRef(null);

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
    setOtpStep('phone');
    setOtp('');
    setDevOtp('');
    // Focus the input after modal opens
    setTimeout(() => mobileInputRef.current?.focus(), 100);
  };

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleSendOtp = async () => {
    // Validate mobile number
    if (!mobileNumber.trim()) {
      setMobileError("Please enter your mobile number");
      return;
    }
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      setMobileError("Please enter a valid 10-digit mobile number");
      return;
    }

    setOtpSending(true);
    setMobileError("");
    const userId = localStorage.getItem("userId");

    try {
      const res = await axios.post(`${API_URL}/send-otp`, {
        mobile: mobileNumber,
        userId,
      });
      
      if (res.data.message.includes("success")) {
        setOtpStep('otp');
        setOtpTimer(60); // 60 second cooldown for resend
        // For development - show the OTP
        if (res.data.devOtp) {
          setDevOtp(res.data.devOtp);
        }
        setTimeout(() => otpInputRef.current?.focus(), 100);
      } else {
        setMobileError(res.data.message || "Failed to send OTP");
      }
    } catch (err) {
      setMobileError(err.response?.data?.message || "Error sending OTP. Please try again.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    
    setOtpSending(true);
    setMobileError("");
    const userId = localStorage.getItem("userId");

    try {
      const res = await axios.post(`${API_URL}/resend-otp`, {
        mobile: mobileNumber,
        userId,
      });
      
      if (res.data.message.includes("success")) {
        setOtpTimer(60);
        setOtp('');
        if (res.data.devOtp) {
          setDevOtp(res.data.devOtp);
        }
      } else {
        setMobileError(res.data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setMobileError(err.response?.data?.message || "Error resending OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const handleMobileSubmit = async () => {
    // For OTP step, verify OTP and update mobile
    if (otpStep === 'otp') {
      if (!otp.trim() || otp.length !== 6) {
        setMobileError("Please enter the 6-digit OTP");
        return;
      }

      setIsSubmittingMobile(true);
      const userId = localStorage.getItem("userId");
      
      try {
        const res = await axios.put(`${API_URL}/update-mobile/${userId}`, {
          mobile: mobileNumber,
          otp: otp,
        });
        
        if (res.data.message.includes("success") || res.data.message.includes("verified")) {
          setMobileSuccess(true);
          setTimeout(() => {
            setShowMobileModal(false);
            setMobileNumber("");
            setMobileSuccess(false);
            setOtp('');
            setOtpStep('phone');
            setDevOtp('');
          }, 1500);
        } else {
          setMobileError(res.data.message || "Failed to verify OTP");
        }
      } catch (err) {
        setMobileError(err.response?.data?.message || "Error verifying OTP. Please try again.");
      } finally {
        setIsSubmittingMobile(false);
      }
    } else {
      // Phone step - send OTP
      handleSendOtp();
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
                          <span>Pending Approvals</span>
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
              setOtpStep('phone');
              setOtp('');
              setDevOtp('');
            }}
            aria-label="Close modal"
          >
            ×
          </button>
          <h2 id="mobile-modal-title">
            📱 {mobileSuccess ? "Verified!" : otpStep === 'otp' ? "Enter OTP" : "Verify Phone Number"}
          </h2>
          {mobileSuccess ? (
            <p style={{ color: "var(--success-color)", textAlign: "center" }} role="status" aria-live="polite">
              ✓ Mobile number verified and updated!
            </p>
          ) : otpStep === 'phone' ? (
            <>
              <p id="mobile-modal-desc">We'll send an OTP to verify your number.</p>
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
                onClick={handleSendOtp}
                disabled={otpSending}
                aria-busy={otpSending}
              >
                {otpSending ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          ) : (
            <>
              <p id="mobile-modal-desc">
                Enter the 6-digit OTP sent to <strong>+91 {mobileNumber}</strong>
              </p>
              {/* Dev OTP display - REMOVE IN PRODUCTION */}
              {devOtp && (
                <p style={{ 
                  background: '#fef3c7', 
                  padding: '8px 12px', 
                  borderRadius: '6px', 
                  fontSize: '0.85rem',
                  marginBottom: '12px',
                  color: '#92400e'
                }}>
                  🔧 Dev Mode OTP: <strong>{devOtp}</strong>
                </p>
              )}
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setMobileError("");
                }}
                className="mobile-input otp-input"
                maxLength={6}
                aria-describedby="mobile-modal-desc mobile-error"
                aria-invalid={!!mobileError}
                style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' }}
              />
              {mobileError && (
                <p id="mobile-error" className="mobile-error" role="alert" aria-live="assertive">
                  {mobileError}
                </p>
              )}
              <button 
                className="mobile-submit-btn" 
                onClick={handleMobileSubmit}
                disabled={isSubmittingMobile || otp.length !== 6}
                aria-busy={isSubmittingMobile}
              >
                {isSubmittingMobile ? "Verifying..." : "Verify & Update"}
              </button>
              <div className="otp-actions">
                <button 
                  className="otp-back-btn"
                  onClick={() => {
                    setOtpStep('phone');
                    setOtp('');
                    setMobileError('');
                  }}
                >
                  ← Change Number
                </button>
                <button 
                  className="otp-resend-btn"
                  onClick={handleResendOtp}
                  disabled={otpTimer > 0 || otpSending}
                >
                  <FaRedo style={{ marginRight: '4px' }} />
                  {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}

export default Header;
