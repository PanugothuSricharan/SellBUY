const express = require("express");
const cors = require("cors");
const compression = require("compression");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// ============ COMPRESSION MIDDLEWARE ============
app.use(compression());

// ============ GOOGLE OAUTH CONFIGURATION ============
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "45965234451-stt1nfrj264pphitcqnve10ov8c54tgv.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ============ CLOUDINARY CONFIGURATION ============
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sellbuy-products",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 800, height: 800, crop: "limit", quality: "auto" },
    ],
  },
});

const upload = multer({ storage: storage });

// ============ LOCATION ENUM ============
const VALID_LOCATIONS = ["BH-1", "BH-2", "BH-3", "GH", "IVH", "Satpura"];
const ENTIRE_CAMPUS = "Entire Campus";

const isValidLocation = (location) => VALID_LOCATIONS.includes(location);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("DB connected successfully");
  })
  .catch((err) => {
    console.log("DB connection failed");
    console.log(err);
  });

// Database Model
const Users = mongoose.model("User", {
  username: String,
  password: String,
  email: String,
  mobile: String,
  googleId: String, // For Google OAuth users
  likedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  isBlocked: { type: Boolean, default: false }, // Admin can block sellers
  blockedReason: String, // Reason for blocking
  blockedAt: Date,
});

// ============ ADMIN MESSAGES SCHEMA ============
const MessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["unread", "read", "resolved"], default: "unread" },
  adminReply: String,
  createdAt: { type: Date, default: Date.now },
  readAt: Date,
  resolvedAt: Date,
});

const Messages = mongoose.model("Message", MessageSchema);

// ============ PRODUCT CONDITION ENUM ============
const VALID_CONDITIONS = ["New", "Sealed", "Like New", "Used"];
const VALID_STATUS = ["Available", "Sold"];
const VALID_CONTACT_PREFERENCES = ["WhatsApp", "Phone Call", "Both"];
const VALID_APPROVAL_STATUS = ["APPROVED", "HIDDEN"]; // Products go live immediately, admin can hide

// ============ ADMIN CONFIGURATION ============
const ADMIN_EMAIL = "imt_2021072@iiitm.ac.in";

// ============ RATE LIMIT CONFIGURATION ============
const PRODUCTS_PER_DAY_LIMIT = 10;
const RATE_LIMIT_HOURS = 24;

// ============ PRODUCT SCHEMA WITH INDEXES ============
const ProductSchema = new mongoose.Schema({
  pname: { type: String, index: true },
  pdesc: String,
  price: String,
  isNegotiable: { type: Boolean, default: false },
  category: { type: String, index: true },
  pimage: String,
  pimage2: String,
  location: { type: String, index: true },
  condition: { type: String, enum: VALID_CONDITIONS, default: "Good" },
  productAge: String,
  originalUrl: String,
  contactPreference: {
    type: String,
    enum: VALID_CONTACT_PREFERENCES,
    default: "Both",
  },
  status: { type: String, enum: VALID_STATUS, default: "Available", index: true },
  approvalStatus: { type: String, enum: VALID_APPROVAL_STATUS, default: "APPROVED", index: true },
  hiddenReason: String, // Why admin hid the product
  addedBy: { type: mongoose.Schema.Types.ObjectId, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Compound indexes for common queries
ProductSchema.index({ approvalStatus: 1, location: 1 });
ProductSchema.index({ approvalStatus: 1, category: 1 });
ProductSchema.index({ addedBy: 1, createdAt: -1 });

const Products = mongoose.model("Product", ProductSchema);

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/search", async (req, res) => {
  let search = req.query.search;
  let location = req.query.location;

  // Build query with search conditions
  let query = {
    $or: [
      { pname: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { pdesc: { $regex: search, $options: "i" } },
    ],
    approvalStatus: "APPROVED", // Only show approved products
  };

  // Apply location filter if not "Entire Campus"
  if (location && location !== ENTIRE_CAMPUS && isValidLocation(location)) {
    query.location = location;
  }

  try {
    // Exclude products from blocked users
    const blockedUsers = await Users.find({ isBlocked: true }).select('_id');
    const blockedUserIds = blockedUsers.map(u => u._id);
    
    if (blockedUserIds.length > 0) {
      query.addedBy = { $nin: blockedUserIds };
    }

    const results = await Products.find(query).sort({ createdAt: -1 });
    res.send({ message: "success", products: results });
  } catch (err) {
    console.error("Search error:", err);
    res.send({ message: "server err" });
  }
});

app.post("/like-product", (req, res) => {
  let productId = req.body.productId;
  let userId = req.body.userId;

  // Check if product is already liked
  Users.findOne({ _id: userId })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      const isLiked = user.likedProducts.includes(productId);

      if (isLiked) {
        // Unlike: Remove from array
        return Users.updateOne(
          { _id: userId },
          { $pull: { likedProducts: productId } }
        ).then(() => {
          res.send({ message: "unliked", isLiked: false });
        });
      } else {
        // Like: Add to array
        return Users.updateOne(
          { _id: userId },
          { $addToSet: { likedProducts: productId } }
        ).then(() => {
          res.send({ message: "liked", isLiked: true });
        });
      }
    })
    .catch((err) => {
      console.error("Error toggling like:", err);
      res.status(500).send({ message: "Error toggling like" });
    });
});

app.get("/get-product/:productId", (req, res) => {
  Products.findOne({ _id: req.params.productId })
    .then((result) => {
      console.log(result, "product data");
      res.send({ message: "success", product: result });
    })
    .catch((err) => {
      console.log(err);
      res.send({ message: "server err" });
    });
});

app.get("/get-user/:userId", async (req, res) => {
  try {
    const result = await Users.findOne({ _id: req.params.userId });
    if (!result) {
      return res.status(404).send({ message: "User not found" });
    }

    // Get remaining product uploads (5 per 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000);
    const recentProductCount = await Products.countDocuments({
      addedBy: req.params.userId,
      createdAt: { $gte: twentyFourHoursAgo }
    });
    const remainingUploads = Math.max(0, PRODUCTS_PER_DAY_LIMIT - recentProductCount);

    console.log(result, "user data");
    res.send({
      message: "success",
      user: {
        username: result.username,
        email: result.email,
        mobile: result.mobile,
        isBlocked: result.isBlocked || false,
        blockedReason: result.blockedReason || "",
      },
      remainingUploads: remainingUploads,
      maxUploadsPerDay: PRODUCTS_PER_DAY_LIMIT,
    });
  } catch (err) {
    console.log(err);
    res.send({ message: "server err" });
  }
});

app.post("/liked-products", (req, res) => {
  let userId = req.body.userId;

  Users.findOne({ _id: userId })
    .populate("likedProducts")
    .then((result) => {
      console.log(result, "user data");
      res.send({
        message: "success",
        products: result.likedProducts,
      });
    })
    .catch((err) => {
      console.log(err);
      res.send({ message: "server err" });
    });
});

app.post("/signup", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  const mobile = req.body.mobile;

  // Validate college email - only @iiitm.ac.in allowed
  if (!email || !email.endsWith("@iiitm.ac.in")) {
    return res.status(400).send({
      message: "Only IIITM Gwalior college emails (@iiitm.ac.in) are allowed",
    });
  }

  const user = new Users({
    username: username,
    password: password,
    email: email,
    mobile: mobile,
  });

  user
    .save()
    .then(() => {
      res.send({ message: "saved success." });
    })
    .catch((err) => {
      res.send({ message: "server err" });
    });
});

app.post("/login", (req, res) => {
  console.log(req.body);
  const username = req.body.username;
  const password = req.body.password;

  // Check for empty fields
  if (!username || !password) {
    return res.json({ message: "Username and password are required" });
  }

  Users.findOne({ username: username })
    .then((result) => {
      console.log(result, "user data");
      if (!result) {
        return res.json({ message: "User not found" });
      }

      if (result.password === password) {
        const token = jwt.sign(
          {
            data: result,
          },
          process.env.JWT_SECRET || "MY_SECRET_KEY",
          { expiresIn: "1h" }
        );
        return res.json({
          message: "User Logged In",
          token: token,
          success: true,
          userId: result._id,
        });
      } else {
        return res.json({ message: "Invalid password" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.json({ message: "Error logging in user" });
    });
});

// ============ GOOGLE AUTHENTICATION ============
app.post("/google-login", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "No credential provided" });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    console.log("Google user:", { email, name, googleId });

    // ============ INSTITUTE EMAIL VALIDATION ============
    // Only allow @iiitm.ac.in emails
    if (!email || !email.endsWith("@iiitm.ac.in")) {
      return res.status(403).json({
        message: "Only IIITM Gwalior college emails (@iiitm.ac.in) are allowed",
        success: false,
      });
    }

    // Check if user already exists with this email
    let user = await Users.findOne({ email: email });

    if (!user) {
      // Create new user with Google data
      user = new Users({
        username: name || email.split("@")[0],
        email: email,
        password: `google_${googleId}`, // Placeholder - user can't login with password
        mobile: "", // Can be updated later by user
        googleId: googleId,
      });
      await user.save();
      console.log("New Google user created:", user._id);
    }

    // Generate JWT token
    const token = jwt.sign(
      { data: user },
      process.env.JWT_SECRET || "MY_SECRET_KEY",
      { expiresIn: "7d" } // Longer expiry for Google users
    );

    return res.json({
      message: "Google login successful",
      success: true,
      token: token,
      userId: user._id,
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({
      message: "Error verifying Google token",
      success: false,
    });
  }
});

// ============ UPDATE USER MOBILE NUMBER ============
app.put("/update-mobile/:userId", (req, res) => {
  const userId = req.params.userId;
  const { mobile } = req.body;

  // Validate mobile number
  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      message: "Please provide a valid 10-digit mobile number",
    });
  }

  Users.updateOne({ _id: userId }, { mobile: mobile })
    .then(() => {
      res.json({ message: "Mobile number updated successfully" });
    })
    .catch((err) => {
      console.error("Error updating mobile:", err);
      res.status(500).json({ message: "Error updating mobile number" });
    });
});

app.post(
  "/add-product",
  upload.fields([{ name: "pimage" }, { name: "pimage2" }]),
  async (req, res) => {
    console.log(req.body);
    console.log(req.files);

    const pname = req.body.pname;
    const pdesc = req.body.pdesc;
    const price = req.body.price;
    const isNegotiable = req.body.isNegotiable === 'true' || req.body.isNegotiable === true;
    const category = req.body.category;
    const location = req.body.location;
    const condition = req.body.condition || "Good";
    const productAge = req.body.productAge || "";
    const originalUrl = req.body.originalUrl || "";
    const contactPreference = req.body.contactPreference || "Both";
    // Cloudinary returns the full URL in path
    const pimage = req.files?.pimage?.[0]?.path;
    const pimage2 = req.files?.pimage2?.[0]?.path || null;
    const addedBy = req.body.userId;

    // ============ RATE LIMIT CHECK ============
    // Users can only add 5 products per 24 hours
    try {
      const twentyFourHoursAgo = new Date(Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000);
      const recentProductCount = await Products.countDocuments({
        addedBy: addedBy,
        createdAt: { $gte: twentyFourHoursAgo }
      });

      if (recentProductCount >= PRODUCTS_PER_DAY_LIMIT) {
        return res.status(429).send({
          message: `You can only add ${PRODUCTS_PER_DAY_LIMIT} products per ${RATE_LIMIT_HOURS} hours. Please try again later.`,
          limitReached: true
        });
      }
    } catch (err) {
      console.error("Rate limit check error:", err);
      // Continue anyway - don't block on rate limit check failure
    }

    // ============ VALIDATION ============
    // Location is mandatory and must be a valid enum value
    if (!location) {
      return res.status(400).send({
        message: "Location is required. Please select a valid hostel location.",
      });
    }

    if (!isValidLocation(location)) {
      return res.status(400).send({
        message: `Invalid location. Must be one of: ${VALID_LOCATIONS.join(
          ", "
        )}`,
      });
    }

    // Validate condition if provided
    if (condition && !VALID_CONDITIONS.includes(condition)) {
      return res.status(400).send({
        message: `Invalid condition. Must be one of: ${VALID_CONDITIONS.join(
          ", "
        )}`,
      });
    }

    // Validate contact preference if provided
    if (
      contactPreference &&
      !VALID_CONTACT_PREFERENCES.includes(contactPreference)
    ) {
      return res.status(400).send({
        message: `Invalid contact preference. Must be one of: ${VALID_CONTACT_PREFERENCES.join(
          ", "
        )}`,
      });
    }

    // Validate other required fields
    if (!pname || !pdesc || !price || !category) {
      return res.status(400).send({
        message: "Product name, description, price, and category are required.",
      });
    }

    if (!pimage) {
      return res.status(400).send({
        message: "At least one product image is required.",
      });
    }

    const product = new Products({
      pname,
      pdesc,
      price,
      isNegotiable,
      category,
      location,
      condition,
      productAge,
      originalUrl,
      contactPreference,
      pimage,
      pimage2,
      addedBy,
    });

    product
      .save()
      .then((savedProduct) => {
        res.send({ 
          message: "Product added successfully!",
          productId: savedProduct._id 
        });
      })
      .catch((err) => {
        console.error("Error saving product:", err);
        res.status(500).send({ message: "Server error while saving product." });
      });
  }
);

app.get("/get-products", async (req, res) => {
  const catName = req.query.catName;
  const location = req.query.location;
  let filter = {};

  // Category filter
  if (catName) {
    filter.category = catName;
  }

  // ============ LOCATION FILTERING (Server-side enforced) ============
  // If location is "Entire Campus" or not provided → no location filter (show all)
  // If location is a specific hostel → strict WHERE location = selectedLocation
  if (location && location !== ENTIRE_CAMPUS && isValidLocation(location)) {
    filter.location = location;
  }

  // Only show APPROVED products to public
  filter.approvalStatus = "APPROVED";

  console.log("Filter:", filter);

  try {
    // Get list of blocked user IDs to exclude their products
    const blockedUsers = await Users.find({ isBlocked: true }).select('_id');
    const blockedUserIds = blockedUsers.map(u => u._id);
    
    if (blockedUserIds.length > 0) {
      filter.addedBy = { $nin: blockedUserIds };
    }

    const result = await Products.find(filter).sort({ createdAt: -1 });
    res.send({ message: "success", products: result });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send({ message: "server err" });
  }
});

// ============ MY LISTINGS ============
// Get products added by a specific user
app.get("/my-products/:userId", (req, res) => {
  const userId = req.params.userId;

  Products.find({ addedBy: userId })
    .sort({ createdAt: -1 })
    .then((result) => {
      res.send({ message: "success", products: result });
    })
    .catch((err) => {
      console.error("Error fetching user products:", err);
      res.status(500).send({ message: "server err" });
    });
});

// Delete a product (only by owner)
app.delete("/delete-product/:productId", (req, res) => {
  const productId = req.params.productId;
  const userId = req.body.userId;

  Products.findOne({ _id: productId })
    .then((product) => {
      if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }

      // Check if user is the owner
      if (product.addedBy.toString() !== userId) {
        return res
          .status(403)
          .send({ message: "You can only delete your own products" });
      }

      return Products.deleteOne({ _id: productId });
    })
    .then(() => {
      res.send({ message: "Product deleted successfully" });
    })
    .catch((err) => {
      console.error("Error deleting product:", err);
      res.status(500).send({ message: "server err" });
    });
});

// ============ UPDATE PRODUCT ============
// Update a product (only by owner)
app.put(
  "/update-product/:productId",
  upload.fields([{ name: "pimage" }, { name: "pimage2" }]),
  async (req, res) => {
    const productId = req.params.productId;
    const userId = req.body.userId;

    try {
      const product = await Products.findOne({ _id: productId });

      if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }

      // Check if user is the owner
      if (product.addedBy.toString() !== userId) {
        return res
          .status(403)
          .send({ message: "You can only update your own products" });
      }

      // Build update object
      const updateData = {
        pname: req.body.pname || product.pname,
        pdesc: req.body.pdesc || product.pdesc,
        price: req.body.price || product.price,
        isNegotiable: req.body.isNegotiable === 'true' || req.body.isNegotiable === true,
        category: req.body.category || product.category,
        location: req.body.location || product.location,
        condition: req.body.condition || product.condition,
        productAge: req.body.productAge || product.productAge,
        originalUrl: req.body.originalUrl || product.originalUrl,
        contactPreference:
          req.body.contactPreference || product.contactPreference || "Both",
      };

      // Handle images - Cloudinary returns full URLs
      if (req.files?.pimage?.[0]?.path) {
        updateData.pimage = req.files.pimage[0].path;
      } else if (req.body.existingImage1) {
        updateData.pimage = req.body.existingImage1;
      }

      if (req.files?.pimage2?.[0]?.path) {
        updateData.pimage2 = req.files.pimage2[0].path;
      } else if (req.body.existingImage2) {
        updateData.pimage2 = req.body.existingImage2;
      }

      // Validate location
      if (updateData.location && !isValidLocation(updateData.location)) {
        return res.status(400).send({
          message: `Invalid location. Must be one of: ${VALID_LOCATIONS.join(
            ", "
          )}`,
        });
      }

      await Products.updateOne({ _id: productId }, updateData);
      res.send({ message: "Product updated successfully" });
    } catch (err) {
      console.error("Error updating product:", err);
      res.status(500).send({ message: "server err" });
    }
  }
);

// Mark product as sold/available (toggle status)
app.put("/update-product-status/:productId", (req, res) => {
  const productId = req.params.productId;
  const userId = req.body.userId;
  const newStatus = req.body.status;

  if (!VALID_STATUS.includes(newStatus)) {
    return res.status(400).send({
      message: `Invalid status. Must be one of: ${VALID_STATUS.join(", ")}`,
    });
  }

  Products.findOne({ _id: productId })
    .then((product) => {
      if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }

      // Check if user is the owner
      if (product.addedBy.toString() !== userId) {
        return res
          .status(403)
          .send({ message: "You can only update your own products" });
      }

      return Products.updateOne({ _id: productId }, { status: newStatus });
    })
    .then(() => {
      res.send({ message: `Product marked as ${newStatus}` });
    })
    .catch((err) => {
      console.error("Error updating product status:", err);
      res.status(500).send({ message: "server err" });
    });
});

// ============ ADVANCED FILTERS ============
// Get products with multiple filters (price range, condition, category, location)
app.get("/filter-products", (req, res) => {
  const { location, category, condition, minPrice, maxPrice, search, status } =
    req.query;
  let filter = {};

  // Only show available products by default (unless explicitly requested)
  filter.status = status || "Available";

  // Location filter
  if (location && location !== ENTIRE_CAMPUS && isValidLocation(location)) {
    filter.location = location;
  }

  // Category filter (can be multiple, comma-separated)
  if (category) {
    const categories = category.split(",");
    if (categories.length > 1) {
      filter.category = { $in: categories };
    } else {
      filter.category = category;
    }
  }

  // Condition filter (can be multiple, comma-separated)
  if (condition) {
    const conditions = condition.split(",");
    if (conditions.length > 1) {
      filter.condition = { $in: conditions };
    } else {
      filter.condition = condition;
    }
  }

  // Price range filter
  if (minPrice || maxPrice) {
    filter.$expr = {
      $and: [],
    };
    if (minPrice) {
      filter.$expr.$and.push({
        $gte: [{ $toDouble: "$price" }, parseFloat(minPrice)],
      });
    }
    if (maxPrice) {
      filter.$expr.$and.push({
        $lte: [{ $toDouble: "$price" }, parseFloat(maxPrice)],
      });
    }
  }

  // Search filter
  if (search) {
    filter.$or = [
      { pname: { $regex: search, $options: "i" } },
      { pdesc: { $regex: search, $options: "i" } },
    ];
  }

  // Only show approved products
  filter.approvalStatus = "APPROVED";

  console.log("Advanced Filter:", JSON.stringify(filter, null, 2));

  Products.find(filter)
    .sort({ createdAt: -1 })
    .then((result) => {
      res.send({ message: "success", products: result });
    })
    .catch((err) => {
      console.error("Error filtering products:", err);
      res.status(500).send({ message: "server err" });
    });
});

// ============ ADMIN ENDPOINTS ============

// Check if user is admin
app.get("/check-admin/:userId", async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", isAdmin: false });
    }
    const isAdmin = user.email === ADMIN_EMAIL;
    res.json({ isAdmin, email: user.email });
  } catch (error) {
    console.error("Error checking admin:", error);
    res.status(500).json({ message: "Server error", isAdmin: false });
  }
});

// Get all pending products (admin only) - for moderation dashboard
app.get("/admin/pending-products/:userId", async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    // Get all products for moderation (both approved and hidden)
    const allProducts = await Products.find({})
      .populate("addedBy", "username email mobile isBlocked")
      .sort({ createdAt: -1 });

    res.json({ message: "success", products: allProducts });
  } catch (error) {
    console.error("Error fetching products for moderation:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all products for admin (all products visible)
app.get("/admin/all-products/:userId", async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const allProducts = await Products.find({})
      .populate("addedBy", "username email mobile isBlocked")
      .sort({ createdAt: -1 });

    res.json({ message: "success", products: allProducts });
  } catch (error) {
    console.error("Error fetching all products:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Hide a product from homepage (admin only) - "Remove from Home"
app.put("/admin/hide-product/:productId", async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const user = await Users.findById(userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const product = await Products.findByIdAndUpdate(
      req.params.productId,
      { 
        approvalStatus: "HIDDEN",
        hiddenReason: reason || "Hidden by admin"
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product hidden from homepage", product });
  } catch (error) {
    console.error("Error hiding product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Unhide a product (restore to homepage)
app.put("/admin/unhide-product/:productId", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await Users.findById(userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const product = await Products.findByIdAndUpdate(
      req.params.productId,
      { 
        approvalStatus: "APPROVED",
        hiddenReason: null
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product restored to homepage", product });
  } catch (error) {
    console.error("Error unhiding product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a product permanently (admin only)
app.delete("/admin/delete-product/:productId", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await Users.findById(userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const product = await Products.findByIdAndDelete(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted permanently" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Block a seller (admin only) - hides all their products
app.put("/admin/block-seller/:sellerId", async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const user = await Users.findById(userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const seller = await Users.findByIdAndUpdate(
      req.params.sellerId,
      { 
        isBlocked: true,
        blockedReason: reason || "Blocked by admin",
        blockedAt: new Date()
      },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Count how many products are affected
    const productCount = await Products.countDocuments({ addedBy: req.params.sellerId });

    res.json({ 
      message: "Seller blocked successfully", 
      seller: { username: seller.username, email: seller.email },
      productsHidden: productCount
    });
  } catch (error) {
    console.error("Error blocking seller:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Unblock a seller (admin only)
app.put("/admin/unblock-seller/:sellerId", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await Users.findById(userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const seller = await Users.findByIdAndUpdate(
      req.params.sellerId,
      { 
        isBlocked: false,
        blockedReason: null,
        blockedAt: null
      },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.json({ 
      message: "Seller unblocked successfully", 
      seller: { username: seller.username, email: seller.email }
    });
  } catch (error) {
    console.error("Error unblocking seller:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all sellers (admin only)
app.get("/admin/all-sellers/:userId", async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const sellers = await Users.find({}).select("username email isBlocked blockedReason blockedAt createdAt");
    
    // Get product count for each seller
    const sellersWithProductCount = await Promise.all(
      sellers.map(async (seller) => {
        const productCount = await Products.countDocuments({ addedBy: seller._id });
        return {
          ...seller.toObject(),
          productCount
        };
      })
    );

    res.json({ message: "success", sellers: sellersWithProductCount });
  } catch (error) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ CONTACT ADMIN - MESSAGE SYSTEM ============

// Send a message to admin
app.post("/contact-admin", async (req, res) => {
  try {
    const { userId, subject, message } = req.body;

    if (!userId || !subject || !message) {
      return res.status(400).json({ message: "User ID, subject and message are required" });
    }

    // Verify user exists
    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newMessage = new Messages({
      userId,
      subject,
      message,
    });

    await newMessage.save();
    res.json({ message: "Message sent successfully! Admin will review it soon." });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Get all messages (admin only)
app.get("/admin/messages/:userId", async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const messages = await Messages.find({})
      .populate("userId", "username email")
      .sort({ createdAt: -1 });

    // Get counts by status
    const unreadCount = await Messages.countDocuments({ status: "unread" });
    const readCount = await Messages.countDocuments({ status: "read" });
    const resolvedCount = await Messages.countDocuments({ status: "resolved" });

    res.json({ 
      message: "success", 
      messages,
      counts: { unread: unreadCount, read: readCount, resolved: resolvedCount }
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark message as read (admin only)
app.put("/admin/message/read/:messageId", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await Users.findById(userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const msg = await Messages.findByIdAndUpdate(
      req.params.messageId,
      { status: "read", readAt: new Date() },
      { new: true }
    );

    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({ message: "Marked as read", data: msg });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Resolve message with optional reply (admin only)
app.put("/admin/message/resolve/:messageId", async (req, res) => {
  try {
    const { userId, adminReply } = req.body;
    const user = await Users.findById(userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const msg = await Messages.findByIdAndUpdate(
      req.params.messageId,
      { 
        status: "resolved", 
        resolvedAt: new Date(),
        adminReply: adminReply || ""
      },
      { new: true }
    );

    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({ message: "Message resolved", data: msg });
  } catch (error) {
    console.error("Error resolving message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete message (admin only)
app.delete("/admin/message/:messageId", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await Users.findById(userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Messages.findByIdAndDelete(req.params.messageId);
    res.json({ message: "Message deleted" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
