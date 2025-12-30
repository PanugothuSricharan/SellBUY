import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import "./Auth.css";
import API_URL from "../constants";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaShoppingBag,
  FaMapMarkerAlt,
  FaHandshake,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError("");
    
    try {
      const res = await axios.post(`${API_URL}/google-login`, {
        credential: credentialResponse.credential,
      });
      
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.userId);
        navigate("/");
      } else {
        setError(res.data.message || "Google login failed");
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Error with Google login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In failed. Please try again.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate empty fields
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);
    const url = `${API_URL}/login`;
    const data = { username, password };

    try {
      const res = await axios.post(url, data);
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.userId);
        navigate("/");
      } else {
        setError(res.data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      console.log(err);
      setError("Error connecting to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="branding-content">
            <div className="branding-logo">🛒</div>
            <h1 className="branding-title">Welcome to SellBUY</h1>
            <p className="branding-subtitle">
              Your trusted IIITM campus marketplace. Buy and sell with students
              in your hostel.
            </p>

            <div className="branding-features">
              <div className="branding-feature">
                <div className="branding-feature-icon">
                  <FaMapMarkerAlt />
                </div>
                <span className="branding-feature-text">
                  Location-based listings for your hostel
                </span>
              </div>
              <div className="branding-feature">
                <div className="branding-feature-icon">
                  <FaShoppingBag />
                </div>
                <span className="branding-feature-text">
                  Buy & sell electronics, books, furniture & more
                </span>
              </div>
              <div className="branding-feature">
                <div className="branding-feature-icon">
                  <FaHandshake />
                </div>
                <span className="branding-feature-text">
                  Safe transactions within campus community
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            <Link to="/" className="back-to-home">
              <FaArrowLeft /> Back to Home
            </Link>

            <div className="auth-header">
              <div className="auth-logo-mobile">🛒</div>
              <h2 className="auth-title">Welcome Back!</h2>
              <p className="auth-subtitle">Sign in to continue to SellBUY</p>
            </div>

            {error && (
              <div
                className="error-message"
                style={{
                  padding: "var(--space-md)",
                  background: "var(--error-light)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "var(--space-md)",
                }}
              >
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            {/* Google Sign-In */}
            <div className="google-login-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                width="100%"
                text="signin_with"
                shape="rectangular"
              />
            </div>

            <p className="google-note">
              Only @iiitm.ac.in emails are allowed
            </p>

            <div className="auth-footer">
              <p>
                Don't have an account? <Link to="/signup">Create Account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
