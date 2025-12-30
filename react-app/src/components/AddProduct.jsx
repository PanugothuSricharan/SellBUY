import { useEffect, useState } from "react";
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import categories from "./CategoriesList";
import { PRODUCT_LOCATIONS } from "./LocationList";
import "./AddProduct.css";
import {
  FaCamera,
  FaTimes,
  FaTag,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaCheckCircle,
  FaImage,
  FaBoxOpen,
  FaClock,
  FaLink,
  FaWhatsapp,
  FaPhone,
} from "react-icons/fa";
import API_URL from "../constants";

// Product condition and age options
const PRODUCT_CONDITIONS = ["New", "Sealed", "Mint", "Used"];
const PRODUCT_AGES = [
  "Less than 1 month",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "1-2 years",
  "2+ years",
];
const CONTACT_PREFERENCES = ["WhatsApp", "Phone Call", "Both"];

function AddProduct() {
  const navigate = useNavigate();
  const [pname, setPname] = useState("");
  const [pdesc, setPdesc] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("");
  const [productAge, setProductAge] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [contactPreference, setContactPreference] = useState("Both");
  const [pimage, setPimage] = useState(null);
  const [pimage2, setPimage2] = useState(null);
  const [previewImage1, setPreviewImage1] = useState(null);
  const [previewImage2, setPreviewImage2] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Mobile number modal state
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [checkingMobile, setCheckingMobile] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [remainingUploads, setRemainingUploads] = useState(5);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    
    // Check if user has mobile number
    checkUserMobile();
  }, []);

  const checkUserMobile = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      const res = await axios.get(`${API_URL}/get-user/${userId}`);
      if (res.data.user) {
        const userMobile = res.data.user.mobile;
        if (!userMobile || userMobile.trim() === "") {
          // No mobile number - show modal
          setShowMobileModal(true);
        }
        // Set remaining uploads
        if (res.data.remainingUploads !== undefined) {
          setRemainingUploads(res.data.remainingUploads);
        }
      }
    } catch (err) {
      console.error("Error checking user mobile:", err);
    } finally {
      setCheckingMobile(false);
    }
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

    // Save mobile number to user profile
    const userId = localStorage.getItem("userId");
    try {
      const res = await axios.put(`${API_URL}/update-mobile/${userId}`, {
        mobile: mobileNumber,
      });
      if (res.data.message.includes("success")) {
        setShowMobileModal(false);
        setMobileError("");
      } else {
        setMobileError(res.data.message || "Failed to update mobile number");
      }
    } catch (err) {
      setMobileError("Error updating mobile number. Please try again.");
    }
  };

  const handleImageChange = (e, imageNumber) => {
    const file = e.target.files[0];
    if (file) {
      if (imageNumber === 1) {
        setPimage(file);
        setPreviewImage1(URL.createObjectURL(file));
      } else {
        setPimage2(file);
        setPreviewImage2(URL.createObjectURL(file));
      }
    }
  };

  const removeImage = (imageNumber) => {
    if (imageNumber === 1) {
      setPimage(null);
      setPreviewImage1(null);
    } else {
      setPimage2(null);
      setPreviewImage2(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!pname.trim()) newErrors.pname = "Product name is required";
    if (!pdesc.trim()) newErrors.pdesc = "Description is required";
    if (!price.trim()) newErrors.price = "Price is required";
    else if (isNaN(price) || Number(price) <= 0)
      newErrors.price = "Enter a valid price";
    if (!category) newErrors.category = "Please select a category";
    if (!location) newErrors.location = "Please select a location";
    if (!condition) newErrors.condition = "Please select product condition";
    if (!productAge) newErrors.productAge = "Please select product age";
    if (!pimage) newErrors.pimage = "At least one image is required";

    // Validate URL if provided
    if (originalUrl && !isValidUrl(originalUrl)) {
      newErrors.originalUrl = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // URL validation helper
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleApi = () => {
    if (!validateForm()) return;

    // Check rate limit before submitting
    if (remainingUploads <= 0) {
      setShowLimitModal(true);
      return;
    }

    // Validate image file sizes (max 5MB each)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (pimage && pimage.size > MAX_FILE_SIZE) {
      alert("Primary image is too large. Please use an image under 5MB.");
      return;
    }
    if (pimage2 && pimage2.size > MAX_FILE_SIZE) {
      alert("Secondary image is too large. Please use an image under 5MB.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    const url = API_URL + "/add-product";

    const formData = new FormData();
    formData.append("pname", pname);
    formData.append("pdesc", pdesc);
    formData.append("price", price);
    formData.append("category", category);
    formData.append("location", location);
    formData.append("condition", condition);
    formData.append("productAge", productAge);
    formData.append("originalUrl", originalUrl);
    formData.append("contactPreference", contactPreference);
    formData.append("pimage", pimage);
    if (pimage2) {
      formData.append("pimage2", pimage2);
    }
    formData.append("userId", localStorage.getItem("userId"));

    axios
      .post(url, formData, {
        timeout: 120000, // 2 minutes timeout for image uploads
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      })
      .then((res) => {
        setIsSubmitting(false);
        setUploadProgress(0);
        if (res.data.message && res.data.message.includes("success")) {
          setShowSuccess(true);
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else if (res.data.limitReached) {
          // Rate limit reached
          setShowLimitModal(true);
        } else {
          alert(res.data.message || "Product added!");
        }
      })
      .catch((err) => {
        setIsSubmitting(false);
        setUploadProgress(0);
        console.log(err);
        
        // Handle specific error cases
        if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
          alert("Upload timed out. Please check your internet connection and try again with smaller images.");
        } else if (err.response?.status === 429) {
          setShowLimitModal(true);
        } else if (err.response?.status === 413) {
          alert("Images are too large. Please use smaller images (under 5MB each).");
        } else {
          alert(err.response?.data?.message || "Error adding product. Please try again.");
        }
      });
  };

  return (
    <div className="add-product-page">
      <Header />

      <div className="add-product-container">
        <div className="add-product-header">
          <h1>Sell Your Product</h1>
          <p>Fill in the details below to list your item on SellBUY</p>
        </div>

        <div className="add-product-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3 className="form-section-title">
              <FaTag /> Basic Information
            </h3>

            <div className="form-group">
              <label className="form-label">
                Product Name <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.pname ? "error" : ""}`}
                placeholder="e.g., Engineering Mathematics Textbook"
                value={pname}
                onChange={(e) => setPname(e.target.value)}
              />
              {errors.pname && <p className="error-message">{errors.pname}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Description <span className="required">*</span>
              </label>
              <textarea
                className={`form-textarea ${errors.pdesc ? "error" : ""}`}
                placeholder="Describe your product - condition, features, reason for selling..."
                value={pdesc}
                onChange={(e) => setPdesc(e.target.value)}
              />
              {errors.pdesc && <p className="error-message">{errors.pdesc}</p>}
              <p className="form-hint">
                Tip: A detailed description helps buyers make a decision
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Price <span className="required">*</span>
                </label>
                <div className="price-input-wrapper">
                  <span className="price-symbol">₹</span>
                  <input
                    type="number"
                    className={`form-input ${errors.price ? "error" : ""}`}
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                {errors.price && (
                  <p className="error-message">{errors.price}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Category <span className="required">*</span>
                </label>
                <select
                  className={`form-select ${errors.category ? "error" : ""}`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map((item, index) => (
                    <option key={"cat" + index} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="error-message">{errors.category}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <h3 className="form-section-title">
              <FaMapMarkerAlt /> Location
            </h3>

            <div className="form-group">
              <label className="form-label">
                Hostel / Location <span className="required">*</span>
              </label>
              <select
                className={`form-select ${errors.location ? "error" : ""}`}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Select your hostel</option>
                {PRODUCT_LOCATIONS.map((loc, index) => (
                  <option key={"loc" + index} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              {errors.location && (
                <p className="error-message">{errors.location}</p>
              )}
              <p className="form-hint">
                Select where buyers can pick up this item
              </p>
            </div>
          </div>

          {/* Product Condition & Details */}
          <div className="form-section">
            <h3 className="form-section-title">
              <FaBoxOpen /> Product Condition & Details
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Condition <span className="required">*</span>
                </label>
                <select
                  className={`form-select ${errors.condition ? "error" : ""}`}
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="">Select condition</option>
                  {PRODUCT_CONDITIONS.map((cond, index) => (
                    <option key={"cond" + index} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
                {errors.condition && (
                  <p className="error-message">{errors.condition}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FaClock style={{ marginRight: "4px" }} /> Product Age <span className="required">*</span>
                </label>
                <select
                  className={`form-select ${errors.productAge ? "error" : ""}`}
                  value={productAge}
                  onChange={(e) => setProductAge(e.target.value)}
                >
                  <option value="">How old is this product?</option>
                  {PRODUCT_AGES.map((age, index) => (
                    <option key={"age" + index} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
                {errors.productAge && (
                  <p className="error-message">{errors.productAge}</p>
                )}
                <p className="form-hint">
                  Helps buyers understand the product's usage
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaLink style={{ marginRight: "4px" }} /> Original Product Link
              </label>
              <input
                type="url"
                className={`form-input ${errors.originalUrl ? "error" : ""}`}
                placeholder="https://amazon.in/product-link or https://flipkart.com/product-link"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
              />
              {errors.originalUrl && (
                <p className="error-message">{errors.originalUrl}</p>
              )}
              <p className="form-hint">
                Add Amazon/Flipkart link so buyers can check original specs &
                price
              </p>
            </div>

            {/* Contact Preference */}
            <div className="form-group">
              <label className="form-label">
                <FaPhone style={{ marginRight: "4px" }} /> Contact Preference
              </label>
              <div className="contact-preference-options">
                {CONTACT_PREFERENCES.map((pref) => (
                  <label
                    key={pref}
                    className={`contact-option ${
                      contactPreference === pref ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="contactPreference"
                      value={pref}
                      checked={contactPreference === pref}
                      onChange={(e) => setContactPreference(e.target.value)}
                    />
                    {pref === "WhatsApp" && (
                      <FaWhatsapp className="contact-icon whatsapp" />
                    )}
                    {pref === "Phone Call" && (
                      <FaPhone className="contact-icon phone" />
                    )}
                    {pref === "Both" && (
                      <>
                        <FaWhatsapp className="contact-icon whatsapp" />
                        <FaPhone className="contact-icon phone" />
                      </>
                    )}
                    <span>{pref}</span>
                  </label>
                ))}
              </div>
              <p className="form-hint">
                How would you like buyers to contact you?
              </p>
            </div>
          </div>

          {/* Images */}
          <div className="form-section">
            <h3 className="form-section-title">
              <FaImage /> Product Images
            </h3>

            <div className="image-upload-grid">
              {/* Primary Image */}
              <div
                className={`image-upload-box ${
                  previewImage1 ? "has-image" : ""
                }`}
              >
                {previewImage1 ? (
                  <>
                    <img
                      src={previewImage1}
                      alt="Preview 1"
                      className="image-preview"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(1)}
                    >
                      <FaTimes />
                    </button>
                  </>
                ) : (
                  <>
                    <FaCamera className="image-upload-icon" />
                    <p className="image-upload-text">
                      Primary Image{" "}
                      <span style={{ color: "var(--error)" }}>*</span>
                    </p>
                    <p className="image-upload-hint">Tap to take photo or upload</p>
                    {/* Camera capture for mobile */}
                    <input
                      type="file"
                      className="image-upload-input"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleImageChange(e, 1)}
                    />
                  </>
                )}
              </div>

              {/* Secondary Image */}
              <div
                className={`image-upload-box ${
                  previewImage2 ? "has-image" : ""
                }`}
              >
                {previewImage2 ? (
                  <>
                    <img
                      src={previewImage2}
                      alt="Preview 2"
                      className="image-preview"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(2)}
                    >
                      <FaTimes />
                    </button>
                  </>
                ) : (
                  <>
                    <FaCamera className="image-upload-icon" />
                    <p className="image-upload-text">
                      Secondary Image{" "}
                      <span className="optional">(Optional)</span>
                    </p>
                    <p className="image-upload-hint">Tap to take photo or upload</p>
                    {/* Camera capture for mobile */}
                    <input
                      type="file"
                      className="image-upload-input"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleImageChange(e, 2)}
                    />
                  </>
                )}
              </div>
            </div>
            {errors.pimage && (
              <p
                className="error-message"
                style={{ marginTop: "var(--space-sm)" }}
              >
                {errors.pimage}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="submit-section">
            {/* Remaining uploads info */}
            <p className="uploads-remaining" style={{ 
              fontSize: '0.9rem', 
              color: remainingUploads <= 2 ? '#e53935' : '#666',
              marginBottom: '1rem'
            }}>
              📦 You can post {remainingUploads} more product{remainingUploads !== 1 ? 's' : ''} today
            </p>

            {/* Terms Agreement Checkbox */}
            <div className="terms-agreement">
              <label className="terms-checkbox-label">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="terms-checkbox"
                />
                <span>
                  I confirm that the product I am selling is <strong>legal and authentic</strong>, and I agree to the{" "}
                  <button
                    type="button"
                    className="terms-link"
                    onClick={() => setShowTermsModal(true)}
                  >
                    Terms & Conditions
                  </button>
                </span>
              </label>
              {errors.terms && (
                <p className="error-message">{errors.terms}</p>
              )}
            </div>
            
            {/* Upload Progress Bar */}
            {isSubmitting && (
              <div className="upload-progress-container">
                <div className="upload-progress-header">
                  <span className="upload-icon">🚀</span>
                  <span className="upload-text">
                    {uploadProgress < 100 ? 'Uploading your product...' : 'Processing...'}
                  </span>
                </div>
                <div className="upload-progress-bar">
                  <div 
                    className="upload-progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="upload-progress-info">
                  <span>{uploadProgress}% complete</span>
                  <span>Please don't close this page</span>
                </div>
              </div>
            )}
            
            <button
              className="submit-btn"
              onClick={handleApi}
              disabled={isSubmitting || remainingUploads <= 0 || !agreedToTerms}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  {uploadProgress > 0 && uploadProgress < 100 
                    ? `Uploading... ${uploadProgress}%` 
                    : 'Processing...'}
                </>
              ) : remainingUploads <= 0 ? (
                <>
                  ⏳ Daily Limit Reached
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Post Your Ad
                </>
              )}
            </button>
            <p className="submit-hint">
              🛡️ Your listing will go live immediately after posting
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-icon">
              <FaCheckCircle />
            </div>
            <h2>Product Listed! 🎉</h2>
            <p>
              Your product is now live on the marketplace. Buyers can see it immediately!
            </p>
            <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
              Redirecting to home...
            </p>
          </div>
        </div>
      )}

      {/* Mobile Number Modal */}
      {showMobileModal && (
        <div className="modal-overlay">
          <div className="mobile-modal">
            <div className="mobile-modal-header">
              <FaPhone className="mobile-icon" />
              <h2>Add Your Mobile Number</h2>
              <p>We need your mobile number to let buyers contact you</p>
            </div>
            
            <div className="mobile-modal-body">
              <div className="form-group">
                <label>Mobile Number</label>
                <div className="input-wrapper">
                  <FaPhone className="input-icon" />
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value);
                      setMobileError("");
                    }}
                    maxLength="10"
                    autoFocus
                  />
                </div>
                {mobileError && (
                  <p className="error-message">{mobileError}</p>
                )}
              </div>

              <div className="mobile-note">
                <FaWhatsapp style={{ color: "#25D366" }} />
                <span>
                  This number will be shown to buyers. Make sure WhatsApp is enabled if you select WhatsApp as contact preference.
                </span>
              </div>
            </div>

            <div className="mobile-modal-footer">
              <button className="btn-primary" onClick={handleMobileSubmit}>
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Limit Modal */}
      {showLimitModal && (
        <div className="modal-overlay">
          <div className="mobile-modal">
            <div className="mobile-modal-header">
              <span style={{ fontSize: '3rem' }}>⏳</span>
              <h2>Daily Limit Reached</h2>
              <p>You can only post 5 products every 24 hours to ensure quality listings.</p>
            </div>
            
            <div className="mobile-modal-body" style={{ textAlign: 'center' }}>
              <p style={{ color: '#666', marginBottom: '1rem' }}>
                Please come back later to post more products. Thank you for your understanding!
              </p>
            </div>

            <div className="mobile-modal-footer">
              <button className="btn-primary" onClick={() => navigate("/")}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="modal-overlay">
          <div className="terms-modal">
            <div className="terms-modal-header">
              <h2>📜 Terms & Conditions</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowTermsModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="terms-modal-body">
              <div className="terms-section">
                <h3>🛡️ Platform Disclaimer</h3>
                <p>
                  SellBUY is a <strong>listing and discovery platform</strong> that connects students within the campus. 
                  We do <strong>not manufacture, own, verify, or guarantee</strong> any product listed on this platform.
                </p>
              </div>

              <div className="terms-section">
                <h3>✅ Seller Responsibilities</h3>
                <ul>
                  <li>All products listed must be <strong>legal, authentic, and compliant</strong> with applicable laws.</li>
                  <li>Sellers are solely responsible for the <strong>accuracy, quality, safety, and legality</strong> of their listings.</li>
                  <li>Sellers must ensure items are <strong>not stolen, counterfeit, or prohibited</strong>.</li>
                  <li>Any misrepresentation or false claims are the seller's responsibility.</li>
                </ul>
              </div>

              <div className="terms-section">
                <h3>⚠️ Liability Disclaimer</h3>
                <ul>
                  <li>The platform and its developers are <strong>not responsible</strong> for any disputes, losses, fraud, damage, or legal issues arising from transactions.</li>
                  <li>All interactions between buyers and sellers are <strong>at their own risk</strong>.</li>
                  <li>We do not guarantee delivery, quality, or authenticity of any product.</li>
                  <li>The developers/owners will <strong>not be held liable</strong> under any circumstances for user actions.</li>
                </ul>
              </div>

              <div className="terms-section">
                <h3>🚫 Moderation Rights</h3>
                <ul>
                  <li>We reserve the right to <strong>remove listings</strong> or <strong>block sellers</strong> if violations are reported.</li>
                  <li>Such actions do <strong>not imply prior approval</strong> or verification of other listings.</li>
                  <li>Repeated violations may result in <strong>permanent account suspension</strong>.</li>
                </ul>
              </div>

              <div className="terms-section">
                <h3>🤝 User Agreement</h3>
                <p>
                  By using SellBUY, you acknowledge and agree that:
                </p>
                <ul>
                  <li>The platform is not responsible for misuse, illegal activity, or consequences caused by users.</li>
                  <li>You will not list or purchase prohibited, illegal, or stolen items.</li>
                  <li>You understand all transactions are between users and at your own risk.</li>
                  <li>You will report any suspicious or fraudulent activity.</li>
                </ul>
              </div>

              <div className="terms-highlight">
                <span className="highlight-icon">⚡</span>
                <p>
                  <strong>Important:</strong> Misuse of this platform may lead to account suspension and/or legal action. 
                  Always transact responsibly and verify products before purchase.
                </p>
              </div>
            </div>

            <div className="terms-modal-footer">
              <button 
                className="btn-primary"
                onClick={() => {
                  setAgreedToTerms(true);
                  setShowTermsModal(false);
                }}
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddProduct;
