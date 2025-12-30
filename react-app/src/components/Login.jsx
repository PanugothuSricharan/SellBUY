import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import "./Auth.css";
import API_URL from "../constants";
import {
  FaArrowLeft,
  FaShoppingBag,
  FaMapMarkerAlt,
  FaHandshake,
  FaShieldAlt,
} from "react-icons/fa";

function Login() {
  const navigate = useNavigate();
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
              <p className="auth-subtitle">Sign in with your IIITM college email</p>
            </div>

            {/* Security Notice */}
            <div className="security-notice">
              <div className="security-icon">
                <FaShieldAlt />
              </div>
              <div className="security-content">
                <h3>Secure Authentication</h3>
                <p>
                  Sign in securely using your IIITM college email. No passwords 
                  to remember, just click the button below to continue.
                </p>
              </div>
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
              <FaShieldAlt style={{ marginRight: "5px" }} />
              Only @iiitm.ac.in college emails are allowed for security
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
