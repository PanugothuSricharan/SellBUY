import { useEffect, useState } from "react";
import API_URL, { getImageUrl } from "../constants";
import Header from "./Header";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import categories from "./CategoriesList";
import { PRODUCT_LOCATIONS } from "./LocationList";
import "./AddProduct.css";
import {
  FaCamera,
  FaTimes,
  FaTag,
  FaMapMarkerAlt,
  FaSave,
  FaCheckCircle,
  FaImage,
  FaBoxOpen,
  FaClock,
  FaLink,
  FaArrowLeft,
  FaWhatsapp,
  FaPhone,
} from "react-icons/fa";

// Product condition and age options
const PRODUCT_CONDITIONS = ["New", "Sealed", "Like New", "Used"];
const PRODUCT_AGES = [
  "Less than 1 month",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "1-2 years",
  "2+ years",
];
const CONTACT_PREFERENCES = ["WhatsApp", "Phone Call", "Both"];

function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
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
  const [existingImage1, setExistingImage1] = useState(null);
  const [existingImage2, setExistingImage2] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Fetch product data
    axios
      .get(`${API_URL}/get-product/${id}`)
      .then((res) => {
        if (res.data.product) {
          const p = res.data.product;
          setPname(p.pname || "");
          setPdesc(p.pdesc || "");
          setPrice(p.price || "");
          setCategory(p.category || "");
          setLocation(p.location || "");
          setCondition(p.condition || "");
          setProductAge(p.productAge || "");
          setOriginalUrl(p.originalUrl || "");
          setContactPreference(p.contactPreference || "Both");
          setExistingImage1(p.pimage || null);
          setExistingImage2(p.pimage2 || null);
        }
      })
      .catch((err) => {
        console.error("Error fetching product:", err);
        alert("Failed to load product");
        navigate("/my-listings");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, navigate]);

  const handleImageChange = (e, imageNumber) => {
    const file = e.target.files[0];
    if (file) {
      if (imageNumber === 1) {
        setPimage(file);
        setPreviewImage1(URL.createObjectURL(file));
        setExistingImage1(null);
      } else {
        setPimage2(file);
        setPreviewImage2(URL.createObjectURL(file));
        setExistingImage2(null);
      }
    }
  };

  const removeImage = (imageNumber) => {
    if (imageNumber === 1) {
      setPimage(null);
      setPreviewImage1(null);
      setExistingImage1(null);
    } else {
      setPimage2(null);
      setPreviewImage2(null);
      setExistingImage2(null);
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
    if (!pimage && !existingImage1)
      newErrors.pimage = "At least one image is required";

    // Validate URL if provided
    if (originalUrl && !isValidUrl(originalUrl)) {
      newErrors.originalUrl = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

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
    formData.append("userId", localStorage.getItem("userId"));

    // Keep existing images if no new ones uploaded
    if (pimage) {
      formData.append("pimage", pimage);
    } else if (existingImage1) {
      formData.append("existingImage1", existingImage1);
    }

    if (pimage2) {
      formData.append("pimage2", pimage2);
    } else if (existingImage2) {
      formData.append("existingImage2", existingImage2);
    }

    try {
      const response = await axios.put(
        `${API_URL}/update-product/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.message) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate("/my-listings");
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="add-product-page">
        <Header />
        <div className="add-product-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-product-page">
      <Header />

      <div className="add-product-container">
        <div className="add-product-header">
          <button className="back-btn" onClick={() => navigate("/my-listings")}>
            <FaArrowLeft /> Back to Listings
          </button>
          <h1>Edit Product</h1>
          <p>Update your product details</p>
        </div>

        <form onSubmit={handleSubmit} className="add-product-form">
          {/* Image Upload Section */}
          <div className="form-section">
            <h3 className="form-section-title">
              <FaCamera /> Product Images
            </h3>
            <div className="image-upload-grid">
              {/* Primary Image */}
              <div
                className={`image-upload-box ${errors.pimage ? "error" : ""} ${
                  previewImage1 || existingImage1 ? "has-image" : ""
                }`}
              >
                {previewImage1 || existingImage1 ? (
                  <div className="image-preview">
                    <img
                      src={previewImage1 || getImageUrl(existingImage1)}
                      alt="Primary"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(1)}
                    >
                      <FaTimes />
                    </button>
                    <span className="image-label">Primary Image</span>
                  </div>
                ) : (
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 1)}
                      hidden
                    />
                    <FaImage className="upload-icon" />
                    <span>Add Primary Image</span>
                    <span className="upload-hint">Required</span>
                  </label>
                )}
              </div>

              {/* Secondary Image */}
              <div
                className={`image-upload-box ${
                  previewImage2 || existingImage2 ? "has-image" : ""
                }`}
              >
                {previewImage2 || existingImage2 ? (
                  <div className="image-preview">
                    <img
                      src={previewImage2 || getImageUrl(existingImage2)}
                      alt="Secondary"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(2)}
                    >
                      <FaTimes />
                    </button>
                    <span className="image-label">Secondary Image</span>
                  </div>
                ) : (
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 2)}
                      hidden
                    />
                    <FaImage className="upload-icon" />
                    <span>Add Secondary Image</span>
                    <span className="upload-hint">Optional</span>
                  </label>
                )}
              </div>
            </div>
            {errors.pimage && (
              <p className="error-message">{errors.pimage}</p>
            )}
          </div>

          {/* Product Details Section */}
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
                value={pname}
                onChange={(e) => setPname(e.target.value)}
                placeholder="e.g., Dell Laptop, Study Table"
              />
              {errors.pname && (
                <p className="error-message">{errors.pname}</p>
              )}
            </div>

            {/* Product URL - moved to 2nd position */}
            <div className="form-group url-after-name">
              <label className="form-label">
                <FaLink style={{ marginRight: "4px" }} /> Original Product Link
              </label>
              <div className="quick-search-links top-position">
                <span>Search product on:</span>
                <a 
                  href={pname ? `https://www.amazon.in/s?k=${encodeURIComponent(pname)}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`quick-link amazon ${!pname ? 'disabled' : ''}`}
                  onClick={(e) => !pname && e.preventDefault()}
                  title={!pname ? "Enter product name first" : "Search on Amazon"}
                >
                  🛒 Amazon
                </a>
                <a 
                  href={pname ? `https://www.flipkart.com/search?q=${encodeURIComponent(pname)}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`quick-link flipkart ${!pname ? 'disabled' : ''}`}
                  onClick={(e) => !pname && e.preventDefault()}
                  title={!pname ? "Enter product name first" : "Search on Flipkart"}
                >
                  📦 Flipkart
                </a>
              </div>
              <input
                type="url"
                className={`form-input ${errors.originalUrl ? "error" : ""}`}
                placeholder="Paste Amazon/Flipkart product URL here"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
              />
              {errors.originalUrl && (
                <p className="error-message">{errors.originalUrl}</p>
              )}
              <p className="form-hint">
                💡 Copy the product URL and paste here. Buyers can verify original price & specs.
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Price (₹) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className={`form-input ${errors.price ? "error" : ""}`}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                />
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
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="error-message">{errors.category}</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Description <span className="required">*</span>
                {originalUrl && <span className="desc-tip"> (Keep it short - buyers can check URL for details)</span>}
              </label>
              <textarea
                className={`form-textarea ${errors.pdesc ? "error" : ""} ${originalUrl ? "compact-desc" : ""}`}
                value={pdesc}
                onChange={(e) => setPdesc(e.target.value)}
                placeholder={originalUrl 
                  ? "Brief description - condition, any defects, reason for selling..." 
                  : "Describe your product, include details like brand, specifications, any defects..."}
                rows={originalUrl ? 3 : 4}
                maxLength={originalUrl ? 500 : 2000}
              />
              {errors.pdesc && (
                <p className="error-message">{errors.pdesc}</p>
              )}
              <p className="form-hint">
                {originalUrl 
                  ? `Keep it brief since you've added product link (${pdesc.length}/500 chars)`
                  : "Tip: A detailed description helps buyers make a decision"}
              </p>
            </div>
          </div>

          {/* Condition & Location Section */}
          <div className="form-section">
            <h3 className="form-section-title">
              <FaBoxOpen /> Condition & Location
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
                    <option key={index} value={cond}>
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
                    <option key={index} value={age}>
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
                <FaMapMarkerAlt style={{ marginRight: "4px" }} /> Hostel / Location <span className="required">*</span>
              </label>
              <select
                className={`form-select ${errors.location ? "error" : ""}`}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Select your hostel</option>
                {PRODUCT_LOCATIONS.map((loc, index) => (
                  <option key={index} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              {errors.location && (
                <p className="error-message">{errors.location}</p>
              )}
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

          {/* Submit Button */}
          <div className="submit-section">
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Updating...
                </>
              ) : (
                <>
                  <FaSave /> Save Changes
                </>
              )}
            </button>
            <p className="submit-hint">
              🛡️ Your changes will be saved immediately
            </p>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-icon">
              <FaCheckCircle />
            </div>
            <h2>Product Updated!</h2>
            <p>Your changes have been saved successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditProduct;
