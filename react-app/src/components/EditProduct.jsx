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
            <h2 className="section-title">
              <FaCamera /> Product Images
            </h2>
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
              <span className="error-message">{errors.pimage}</span>
            )}
          </div>

          {/* Product Details Section */}
          <div className="form-section">
            <h2 className="section-title">
              <FaTag /> Product Details
            </h2>

            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={pname}
                onChange={(e) => setPname(e.target.value)}
                placeholder="e.g., Dell Laptop, Study Table"
                className={errors.pname ? "error" : ""}
              />
              {errors.pname && (
                <span className="error-message">{errors.pname}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                  className={errors.price ? "error" : ""}
                />
                {errors.price && (
                  <span className="error-message">{errors.price}</span>
                )}
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={errors.category ? "error" : ""}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <span className="error-message">{errors.category}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={pdesc}
                onChange={(e) => setPdesc(e.target.value)}
                placeholder="Describe your product, include details like brand, specifications, any defects..."
                rows={4}
                className={errors.pdesc ? "error" : ""}
              />
              {errors.pdesc && (
                <span className="error-message">{errors.pdesc}</span>
              )}
            </div>
          </div>

          {/* Condition & Location Section */}
          <div className="form-section">
            <h2 className="section-title">
              <FaBoxOpen /> Condition & Location
            </h2>

            <div className="form-row">
              <div className="form-group">
                <label>Condition *</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className={errors.condition ? "error" : ""}
                >
                  <option value="">Select condition</option>
                  {PRODUCT_CONDITIONS.map((cond, index) => (
                    <option key={index} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
                {errors.condition && (
                  <span className="error-message">{errors.condition}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <FaClock /> Product Age
                </label>
                <select
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
                <span className="input-hint">
                  Helps buyers understand the product's usage
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>
                <FaMapMarkerAlt /> Hostel / Location *
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={errors.location ? "error" : ""}
              >
                <option value="">Select your hostel</option>
                {PRODUCT_LOCATIONS.map((loc, index) => (
                  <option key={index} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              {errors.location && (
                <span className="error-message">{errors.location}</span>
              )}
            </div>

            <div className="form-group">
              <label>
                <FaLink /> Original Product URL
              </label>
              <input
                type="url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="https://amazon.in/... or Flipkart link"
                className={errors.originalUrl ? "error" : ""}
              />
              {errors.originalUrl && (
                <span className="error-message">{errors.originalUrl}</span>
              )}
              <span className="input-hint">
                Link to original product page (Amazon, Flipkart etc.) for price
                comparison
              </span>
            </div>

            {/* Contact Preference */}
            <div className="form-group">
              <label>
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
              <span className="input-hint">
                How would you like buyers to contact you?
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="loading-spinner-small"></span>
                Updating...
              </>
            ) : (
              <>
                <FaSave /> Save Changes
              </>
            )}
          </button>
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
