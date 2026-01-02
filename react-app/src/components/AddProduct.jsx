import { useEffect, useState, useRef, useCallback } from "react";
import Header from "./Header";
import { useNavigate, useBlocker } from "react-router-dom";
import axios from "axios";
import categories from "./CategoriesList";
import { PRODUCT_LOCATIONS } from "./LocationList";
import "./AddProduct.css";
import { compressImageToSize } from "../utils/imageCompression";
import ExitIntentPrompt from "./ExitIntentPrompt";
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
  FaCopy,
  FaCheck,
  FaHome,
  FaShareAlt,
  FaHeart,
} from "react-icons/fa";
import API_URL from "../constants";

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

function AddProduct() {
  const navigate = useNavigate();
  const [pname, setPname] = useState("");
  const [pdesc, setPdesc] = useState("");
  const [price, setPrice] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);
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
  const [isUpdatingMobile, setIsUpdatingMobile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [remainingUploads, setRemainingUploads] = useState(5);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [createdProductId, setCreatedProductId] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Image picker modal state
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [activeImageSlot, setActiveImageSlot] = useState(null); // 1 or 2
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Exit-intent state
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [exitSessionId] = useState(() => `exit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [hasShownExitPrompt, setHasShownExitPrompt] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const exitTypeRef = useRef('navigation');
  
  // Refs for hidden file inputs
  const cameraInput1Ref = useRef(null);
  const galleryInput1Ref = useRef(null);
  const cameraInput2Ref = useRef(null);
  const galleryInput2Ref = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    
    // Detect if device is desktop (screen width > 768px and not a touch device)
    const checkIsDesktop = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isWideScreen = window.innerWidth > 768;
      setIsDesktop(isWideScreen && !hasTouch);
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    // Check if user has mobile number
    checkUserMobile();
    
    // Handle browser close/back button for exit intent
    const handleBeforeUnload = (e) => {
      if (hasFormData() && !showSuccess && !hasShownExitPrompt) {
        exitTypeRef.current = 'close_tab';
        // Can't show custom modal on beforeunload, just track the attempt
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('resize', checkIsDesktop);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccess, hasShownExitPrompt]);

  // Calculate form progress percentage
  const calculateProgress = useCallback(() => {
    const fields = [
      { filled: !!pname.trim(), weight: 15 },
      { filled: !!pdesc.trim(), weight: 15 },
      { filled: !!price.trim(), weight: 15 },
      { filled: !!category, weight: 10 },
      { filled: !!location, weight: 10 },
      { filled: !!condition, weight: 10 },
      { filled: !!productAge, weight: 10 },
      { filled: !!pimage, weight: 15 },
    ];
    
    const progress = fields.reduce((sum, field) => 
      sum + (field.filled ? field.weight : 0), 0
    );
    return Math.min(100, progress);
  }, [pname, pdesc, price, category, location, condition, productAge, pimage]);

  // Get completed field names for analytics
  const getCompletedFields = useCallback(() => {
    const fields = [];
    if (pname.trim()) fields.push('name');
    if (pdesc.trim()) fields.push('description');
    if (price.trim()) fields.push('price');
    if (category) fields.push('category');
    if (location) fields.push('location');
    if (condition) fields.push('condition');
    if (productAge) fields.push('age');
    if (pimage) fields.push('image');
    if (originalUrl) fields.push('url');
    return fields;
  }, [pname, pdesc, price, category, location, condition, productAge, pimage, originalUrl]);

  // Check if user has entered any form data
  const hasFormData = useCallback(() => {
    return !!(pname.trim() || pdesc.trim() || price.trim() || category || 
              location || condition || productAge || pimage);
  }, [pname, pdesc, price, category, location, condition, productAge, pimage]);

  // Get motivational message based on progress
  const getMotivationalMessage = useCallback(() => {
    const progress = calculateProgress();
    if (progress === 0) return null;
    if (progress < 25) return "Great start! Keep going 💪";
    if (progress < 50) return "You're making progress! 🚀";
    if (progress < 75) return "More than halfway there! 🎯";
    if (progress < 100) return "Almost done — just a few more details! 🏁";
    return "Ready to list your product! 🎉";
  }, [calculateProgress]);

  // Handle exit prompt close
  const handleExitPromptClose = useCallback(() => {
    setShowExitPrompt(false);
    setHasShownExitPrompt(true);
    
    // If there's a pending navigation, proceed
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  // Handle exit prompt submit
  const handleExitPromptSubmit = useCallback(() => {
    setShowExitPrompt(false);
    setHasShownExitPrompt(true);
    
    // Proceed with navigation if pending
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  // Use React Router's blocker for route changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasFormData() &&
      !showSuccess &&
      !hasShownExitPrompt &&
      currentLocation.pathname !== nextLocation.pathname
  );

  // Handle blocker state changes
  useEffect(() => {
    if (blocker.state === 'blocked' && !hasShownExitPrompt && !showSuccess) {
      exitTypeRef.current = 'route_change';
      setPendingNavigation(() => () => blocker.proceed());
      setShowExitPrompt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker.state, hasShownExitPrompt, showSuccess]);

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
    }
  };

  const handleMobileSubmit = async () => {
    if (!mobileNumber.trim()) {
      setMobileError("Please enter your mobile number");
      return;
    }
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      setMobileError("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsUpdatingMobile(true);
    setMobileError("");
    const userId = localStorage.getItem("userId");

    try {
      const res = await axios.put(`${API_URL}/update-mobile/${userId}`, {
        mobile: mobileNumber,
      });
      
      if (res.data.message.includes("success")) {
        setShowMobileModal(false);
        setMobileError("");
        setMobileNumber("");
      } else {
        setMobileError(res.data.message || "Failed to update mobile number");
      }
    } catch (err) {
      setMobileError(err.response?.data?.message || "Error updating mobile number");
    } finally {
      setIsUpdatingMobile(false);
    }
  };

  const handleImageChange = async (e, imageNumber) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview immediately with original file
      const previewUrl = URL.createObjectURL(file);
      if (imageNumber === 1) {
        setPreviewImage1(previewUrl);
      } else {
        setPreviewImage2(previewUrl);
      }

      try {
        // Compress image if larger than 2MB
        let processedFile = file;
        if (file.size > 2 * 1024 * 1024) {
          console.log(`Compressing image: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
          processedFile = await compressImageToSize(file, 2);
          console.log(`Compressed to: ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);
        }

        if (imageNumber === 1) {
          setPimage(processedFile);
        } else {
          setPimage2(processedFile);
        }
      } catch (error) {
        console.error('Image compression failed:', error);
        // Use original file if compression fails
        if (imageNumber === 1) {
          setPimage(file);
        } else {
          setPimage2(file);
        }
      }
    }
  };

  // Open image picker modal
  const openImagePicker = (imageNumber) => {
    setActiveImageSlot(imageNumber);
    setShowImagePicker(true);
  };

  // Handle camera selection (mobile only)
  const handleCameraSelect = () => {
    setShowImagePicker(false);
    // Use native camera input
    setTimeout(() => {
      if (activeImageSlot === 1) {
        cameraInput1Ref.current?.click();
      } else {
        cameraInput2Ref.current?.click();
      }
    }, 100);
  };

  // Handle gallery selection
  const handleGallerySelect = () => {
    setShowImagePicker(false);
    // Small delay to ensure modal closes first
    setTimeout(() => {
      if (activeImageSlot === 1) {
        galleryInput1Ref.current?.click();
      } else {
        galleryInput2Ref.current?.click();
      }
    }, 100);
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
    
    // Scroll to first error
    if (Object.keys(newErrors).length > 0) {
      const errorElement = document.querySelector(`[class*="error"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
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
    formData.append("isNegotiable", isNegotiable);
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
          setCreatedProductId(res.data.productId);
          setShowSuccess(true);
          // Don't auto-redirect - let user share first
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
      <Header hideSearch={true} />
      
      {/* Exit Intent Prompt - Non-blocking feedback */}
      <ExitIntentPrompt
        isOpen={showExitPrompt}
        onClose={handleExitPromptClose}
        onSubmit={handleExitPromptSubmit}
        formProgress={calculateProgress()}
        fieldsCompleted={getCompletedFields()}
        sessionId={exitSessionId}
      />

      {/* Sticky Progress Bar */}
      {hasFormData() && !showSuccess && (
        <div className="sticky-progress-bar">
          <div className="progress-content">
            <div className="progress-info">
              <span className="progress-label">
                <FaHeart className="progress-heart" /> {calculateProgress()}% complete
              </span>
              {getMotivationalMessage() && (
                <span className="progress-motivation">{getMotivationalMessage()}</span>
              )}
            </div>
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="add-product-container">
        <button 
          className="back-to-home-btn"
          onClick={() => navigate("/")}
          aria-label="Return to home"
        >
          <FaHome /> Return to Home
        </button>
        
        <div className="add-product-header">
          <h1>Sell Your Product</h1>
          <p>Fill in the details below to list your item on SellBUY</p>
          {hasFormData() && !showSuccess && (
            <p className="header-encouragement">{getMotivationalMessage()}</p>
          )}
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

            <div className="form-group">
              <label className="form-label">
                Description <span className="required">*</span>
                {originalUrl && <span className="desc-tip"> (Keep it short - buyers can check URL for details)</span>}
              </label>
              <textarea
                className={`form-textarea ${errors.pdesc ? "error" : ""} ${originalUrl ? "compact-desc" : ""}`}
                placeholder={originalUrl 
                  ? "Brief description - condition, any defects, reason for selling..." 
                  : "Describe your product - condition, features, reason for selling..."}
                value={pdesc}
                onChange={(e) => setPdesc(e.target.value)}
                maxLength={originalUrl ? 500 : 2000}
              />
              {errors.pdesc && <p className="error-message">{errors.pdesc}</p>}
              <p className="form-hint">
                {originalUrl 
                  ? `Keep it brief since you've added product link (${pdesc.length}/500 chars)`
                  : "Tip: A detailed description helps buyers make a decision"}
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
                <div className="price-type-selector">
                  <label className="price-type-option">
                    <input
                      type="radio"
                      name="priceType"
                      checked={!isNegotiable}
                      onChange={() => setIsNegotiable(false)}
                    />
                    <span className="price-type-box">
                      <span className="price-type-check">✓</span>
                      Fixed Price
                    </span>
                  </label>
                  <label className="price-type-option">
                    <input
                      type="radio"
                      name="priceType"
                      checked={isNegotiable}
                      onChange={() => setIsNegotiable(true)}
                    />
                    <span className="price-type-box">
                      <span className="price-type-check">✓</span>
                      Negotiable
                    </span>
                  </label>
                </div>
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
                onClick={() => !previewImage1 && openImagePicker(1)}
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
                      onClick={(e) => { e.stopPropagation(); removeImage(1); }}
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
                    <p className="image-upload-hint">
                      {isDesktop ? 'Click to upload photo' : 'Tap to take photo or upload from gallery'}
                    </p>
                  </>
                )}
              </div>

              {/* Secondary Image */}
              <div
                className={`image-upload-box ${
                  previewImage2 ? "has-image" : ""
                }`}
                onClick={() => !previewImage2 && openImagePicker(2)}
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
                      onClick={(e) => { e.stopPropagation(); removeImage(2); }}
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
                    <p className="image-upload-hint">
                      {isDesktop ? 'Click to upload photo' : 'Tap to take photo or upload from gallery'}
                    </p>
                  </>
                )}
              </div>
            </div>
            
            {/* Hidden file inputs for camera and gallery */}
            <input
              ref={cameraInput1Ref}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleImageChange(e, 1)}
              style={{ display: 'none' }}
            />
            <input
              ref={galleryInput1Ref}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, 1)}
              style={{ display: 'none' }}
            />
            <input
              ref={cameraInput2Ref}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleImageChange(e, 2)}
              style={{ display: 'none' }}
            />
            <input
              ref={galleryInput2Ref}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, 2)}
              style={{ display: 'none' }}
            />
            
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
            {!agreedToTerms && !isSubmitting && (
              <p className="submit-hint-terms">
                ☝️ Please agree to the terms above to post your ad
              </p>
            )}
            <p className="submit-hint">
              🛡️ Your listing will go live immediately after posting
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal with Share Options */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-modal share-modal">
            <div className="success-icon">
              <FaCheckCircle />
            </div>
            <h2>Product Listed! 🎉</h2>
            <p>
              Your product is now live on the marketplace. Share it with friends!
            </p>
            
            {/* Share Section */}
            <div className="share-section">
              <h3><FaShareAlt /> Share your listing</h3>
              
              <div className="share-link-box">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/product/${createdProductId}`}
                  className="share-link-input"
                />
                <button 
                  className={`copy-link-btn ${linkCopied ? 'copied' : ''}`}
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/product/${createdProductId}`);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                >
                  {linkCopied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy</>}
                </button>
              </div>

              <div className="share-buttons">
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(`Grab a Deal 🛒\n${pname}\nPrice: Rs.${price}\n${condition ? `Condition: ${condition}\n` : ''}${isNegotiable ? 'Price Negotiable\n' : ''}\nView on SellBUY: ${window.location.origin}/product/${createdProductId}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-btn whatsapp"
                >
                  <FaWhatsapp /> Share on WhatsApp
                </a>
              </div>
            </div>

            <button 
              className="go-home-btn"
              onClick={() => navigate("/")}
            >
              <FaHome /> Go to Home
            </button>
          </div>
        </div>
      )}

      {/* Image Picker Modal */}
      {showImagePicker && (
        <div className="modal-overlay" onClick={() => setShowImagePicker(false)}>
          <div className="image-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-picker-header">
              <h3>Add Photo</h3>
              <button 
                className="close-picker-btn"
                onClick={() => setShowImagePicker(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="image-picker-options">
              {/* Only show camera option on mobile */}
              {!isDesktop && (
                <button 
                  className="picker-option"
                  onClick={handleCameraSelect}
                >
                  <FaCamera className="picker-icon" />
                  <span>Take a Photo</span>
                </button>
              )}
              <button 
                className="picker-option"
                onClick={handleGallerySelect}
              >
                <FaImage className="picker-icon" />
                <span>{isDesktop ? 'Upload Photo' : 'Choose from Gallery'}</span>
              </button>
            </div>
            <button 
              className="picker-cancel-btn"
              onClick={() => setShowImagePicker(false)}
            >
              Cancel
            </button>
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
              <p>Enter your 10-digit mobile number</p>
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
                      setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
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
              <button 
                className="btn-primary" 
                onClick={handleMobileSubmit}
                disabled={isUpdatingMobile || mobileNumber.length !== 10}
              >
                {isUpdatingMobile ? 'Updating...' : 'Update Number'}
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
