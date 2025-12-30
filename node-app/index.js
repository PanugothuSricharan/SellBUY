const express = require("express");
const cors = require("cors");
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
});

// ============ PRODUCT CONDITION ENUM ============
const VALID_CONDITIONS = ["New", "Sealed", "Mint", "Used"];
const VALID_STATUS = ["Available", "Sold"];
const VALID_CONTACT_PREFERENCES = ["WhatsApp", "Phone Call", "Both"];
const VALID_APPROVAL_STATUS = ["PENDING", "APPROVED", "REJECTED"];

// ============ ADMIN CONFIGURATION ============
const ADMIN_EMAIL = "imt_2021imt072@iiitm.ac.in";

const Products = mongoose.model("Product", {
  pname: String,
  pdesc: String,
  price: String,
  category: String,
  pimage: String,
  pimage2: String,
  location: String,
  condition: { type: String, enum: VALID_CONDITIONS, default: "Good" },
  productAge: String, // e.g., "6 months", "1 year"
  originalUrl: String, // Amazon/Flipkart URL for specs
  contactPreference: {
    type: String,
    enum: VALID_CONTACT_PREFERENCES,
    default: "Both",
  },
  status: { type: String, enum: VALID_STATUS, default: "Available" },
  approvalStatus: { type: String, enum: VALID_APPROVAL_STATUS, default: "PENDING" },
  addedBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
});

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/search", (req, res) => {
  let search = req.query.search;
  let location = req.query.location;

  // Build query with search conditions
  let query = {
    $or: [
      { pname: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { pdesc: { $regex: search, $options: "i" } },
    ],
  };

  // Apply location filter if not "Entire Campus"
  if (location && location !== ENTIRE_CAMPUS && isValidLocation(location)) {
    query.location = location;
  }

  Products.find(query)
    .then((results) => {
      res.send({ message: "success", products: results });
    })
    .catch((err) => {
      res.send({ message: "server err" });
    });
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

app.get("/get-user/:userId", (req, res) => {
  Users.findOne({ _id: req.params.userId })
    .then((result) => {
      console.log(result, "user data");
      res.send({
        message: "success",
        user: {
          username: result.username,
          email: result.email,
          mobile: result.mobile,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.send({ message: "server err" });
    });
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
  (req, res) => {
    console.log(req.body);
    console.log(req.files);

    const pname = req.body.pname;
    const pdesc = req.body.pdesc;
    const price = req.body.price;
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
      .then(() => {
        res.send({ message: "Product added successfully!" });
      })
      .catch((err) => {
        console.error("Error saving product:", err);
        res.status(500).send({ message: "Server error while saving product." });
      });
  }
);

app.get("/get-products", (req, res) => {
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

  // TODO: Add index on 'location' field for O(log n) query performance
  // db.products.createIndex({ location: 1 })
  // Consider compound index: { location: 1, category: 1 } for common queries

  Products.find(filter)
    .then((result) => {
      res.send({ message: "success", products: result });
    })
    .catch((err) => {
      console.error("Error fetching products:", err);
      res.status(500).send({ message: "server err" });
    });
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

// Get all pending products (admin only)
app.get("/admin/pending-products/:userId", async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const pendingProducts = await Products.find({ approvalStatus: "PENDING" })
      .populate("addedBy", "username email mobile")
      .sort({ createdAt: -1 });

    res.json({ message: "success", products: pendingProducts });
  } catch (error) {
    console.error("Error fetching pending products:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all products for admin (including pending and rejected)
app.get("/admin/all-products/:userId", async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const allProducts = await Products.find({})
      .populate("addedBy", "username email mobile")
      .sort({ createdAt: -1 });

    res.json({ message: "success", products: allProducts });
  } catch (error) {
    console.error("Error fetching all products:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Approve a product (admin only)
app.put("/admin/approve-product/:productId", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await Users.findById(userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const product = await Products.findByIdAndUpdate(
      req.params.productId,
      { approvalStatus: "APPROVED" },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product approved successfully", product });
  } catch (error) {
    console.error("Error approving product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reject a product (admin only)
app.put("/admin/reject-product/:productId", async (req, res) => {
  try {
    const { userId, rejectionReason } = req.body;
    const user = await Users.findById(userId);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const product = await Products.findByIdAndUpdate(
      req.params.productId,
      { approvalStatus: "REJECTED" },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product rejected", product, reason: rejectionReason });
  } catch (error) {
    console.error("Error rejecting product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
