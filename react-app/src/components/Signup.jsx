import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import "./Auth.css";
import API_URL from "../constants";
import {
  FaShoppingBag,
  FaMapMarkerAlt,
  FaHandshake,
  FaArrowLeft,
  FaShieldAlt,
} from "react-icons/fa";

function Signup() {
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
        setError(res.data.message || "Google signup failed");
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Error with Google signup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-Up failed. Please try again.");
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="branding-content">
            <div className="branding-logo">🛒</div>
            <h1 className="branding-title">Join SellBUY Today</h1>
            <p className="branding-subtitle">
              Create an account with your IIITM email to start buying and
              selling within your campus community.
            </p>

            <div className="branding-features">
              <div className="branding-feature">
                <div className="branding-feature-icon">
                  <FaMapMarkerAlt />
                </div>
                <span className="branding-feature-text">
                  Connect with students in your hostel
                </span>
              </div>
              <div className="branding-feature">
                <div className="branding-feature-icon">
                  <FaShoppingBag />
                </div>
                <span className="branding-feature-text">
                  List items for free, sell instantly
                </span>
              </div>
              <div className="branding-feature">
                <div className="branding-feature-icon">
                  <FaHandshake />
                </div>
                <span className="branding-feature-text">
                  Trusted campus community
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            <Link to="/" className="back-to-home">
              <FaArrowLeft /> Back to Home
            </Link>

            <div className="auth-header">
              <div className="auth-logo-mobile">🛒</div>
              <h2 className="auth-title">Join SellBUY</h2>
              <p className="auth-subtitle">
                Sign up with your IIITM college email
              </p>
            </div>

            {/* Security Notice */}
            <div className="security-notice">
              <div className="security-icon">
                <FaShieldAlt />
              </div>
              <div className="security-content">
                <h3>Secure & Private Authentication</h3>
                <p>
                  For your security and privacy, SellBUY only supports Google Sign-In 
                  with your official IIITM college email (@iiitm.ac.in). This ensures:
                </p>
                <ul>
                  <li>✓ No passwords to remember or manage</li>
                  <li>✓ Verified campus community members only</li>
                  <li>✓ Protected against fake or temporary accounts</li>
                  <li>✓ Enhanced security with Google's authentication</li>
                </ul>
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

            {/* Google Sign-Up */}
            <div className="google-login-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                width="100%"
                text="signup_with"
                shape="rectangular"
              />
            </div>

            <p className="google-note">
              <FaShieldAlt style={{ marginRight: "5px" }} />
              Only @iiitm.ac.in college emails are allowed for security
            </p>

            <div className="auth-footer">
              <p>
                Already have an account? <Link to="/login">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
