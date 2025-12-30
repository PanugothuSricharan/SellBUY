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

    setIsSubmitting(true);
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
      .post(url, formData)
      .then((res) => {
        setIsSubmitting(false);
        if (res.data.message && res.data.message.includes("success")) {
          setShowSuccess(true);
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          alert(res.data.message || "Product added!");
        }
      })
      .catch((err) => {
        setIsSubmitting(false);
        console.log(err);
        alert(err.response?.data?.message || "Error Adding Product");
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
                  <FaClock style={{ marginRight: "4px" }} /> Product Age
                </label>
                <select
                  className="form-select"
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
            <button
              className="submit-btn"
              onClick={handleApi}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Posting...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Post Your Ad
                </>
              )}
            </button>
            <p className="submit-hint">
              By posting, you agree to our terms and conditions
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
            <h2>Product Submitted!</h2>
            <p>
              Your product has been submitted for review. Admin will approve it shortly and it will be visible on the marketplace.
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
    </div>
  );
}

export default AddProduct;
