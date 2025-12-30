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
  FaEnvelope,
  FaPhone,
  FaShoppingBag,
  FaMapMarkerAlt,
  FaHandshake,
  FaCheck,
} from "react-icons/fa";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    mobile: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return { strength: "", text: "" };
    if (password.length < 6) return { strength: "weak", text: "Weak" };
    if (password.length < 8) return { strength: "medium", text: "Medium" };
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (hasUpper && hasLower && hasNumber && password.length >= 8) {
      return { strength: "strong", text: "Strong" };
    }
    return { strength: "medium", text: "Medium" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Please enter a username");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Please enter an email address");
      return false;
    }
    // College email validation - only @iiitm.ac.in allowed
    if (!formData.email.endsWith("@iiitm.ac.in")) {
      setError("Only IIITM Gwalior college emails (@iiitm.ac.in) are allowed");
      return false;
    }
    if (!formData.mobile.trim()) {
      setError("Please enter a mobile number");
      return false;
    }
    if (!/^[0-9]{10}$/.test(formData.mobile)) {
      setError("Please enter a valid 10-digit mobile number");
      return false;
    }
    if (!formData.password) {
      setError("Please enter a password");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);
    const url = `${API_URL}/signup`;

    try {
      const res = await axios.post(url, formData);
      if (res.data.message === "saved success.") {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(res.data.message || "Signup failed. Please try again.");
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
              <h2 className="auth-title">Create Account</h2>
              <p className="auth-subtitle">
                Fill in your details to get started
              </p>
            </div>

            {success && (
              <div className="success-message">
                <FaCheck /> Account created successfully! Redirecting to
                login...
              </div>
            )}

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
                    name="username"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">College Email Address</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your.name@iiitm.ac.in"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
                <p
                  className="form-hint"
                  style={{
                    marginTop: "4px",
                    fontSize: "0.8rem",
                    color: "var(--accent-orange)",
                  }}
                >
                  Only @iiitm.ac.in emails are allowed
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Mobile Number</label>
                <div className="input-wrapper">
                  <FaPhone className="input-icon" />
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    placeholder="10-digit mobile number"
                    value={formData.mobile}
                    onChange={handleChange}
                    autoComplete="tel"
                    maxLength="10"
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
                    name="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
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
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className={`strength-fill ${passwordStrength.strength}`}
                      ></div>
                    </div>
                    <div className="strength-text">
                      <span>Password strength</span>
                      <span>{passwordStrength.text}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <span>or continue with</span>
            </div>

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
              Only @iiitm.ac.in emails are allowed
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
