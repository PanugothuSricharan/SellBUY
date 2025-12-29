const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 4000;

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

// Database Connection
mongoose
  .connect("mongodb+srv://sricharan_fpv:Charan960@cluster0.mukkkot.mongodb.net")
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
});

const Products = mongoose.model("Product", {
  pname: String,
  pdesc: String,
  price: String,
  category: String,
  pimage: String,
});

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/get-product", (req, res) => {
  Products.findOne({ username: username })
    .then((result) => {
      console.log(result, "user data");
      res.send({ message: "Product fetched", data: result });
    })
    .catch((err) => {
      console.log(err);
      res.json({ message: "Error in fetching product" });
    });
});

app.post("/signup", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const User = new Users({
    username: username,
    password: password,
  });

  User.save()
    .then(() => {
      res.send("User Created");
    })
    .catch((err) => {
      res.status(500).send("Error creating user");
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
          "MY_SECRET_KEY",
          { expiresIn: "1h" }
        );
        return res.json({
          message: "User Logged In",
          token: token,
          success: true,
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

app.post("/add-product", upload.single("pimage"), (req, res) => {
  console.log(req.body);
  console.log(req.file.filename);

  const pname = req.body.pname;
  const pdesc = req.body.pdesc;
  const price = req.body.price;
  const category = req.body.category;
  const pimage = req.file.filename;

  const product = new Products({
    pname,
    pdesc,
    price,
    category,
    pimage,
  });

  product
    .save()
    .then(() => {
      res.send({ message: "saved success." });
    })
    .catch(() => {
      res.send({ message: "server err" });
    });
});

app.get("/get-products", (req, res) => {
  Products.find()
    .then((result) => {
      res.send({ message: "success", products: result });
    })
    .catch((err) => {
      res.send({ message: "server err" });
    });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
