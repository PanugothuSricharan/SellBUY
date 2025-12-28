const express = require("express");
const app = express();
const cors=require("cors");
app.use(cors());
app.use(express.json());
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const PORT = 4000;
const mongoose = require("mongoose");

mongoose
  .connect("mongodb+srv://sricharan_fpv:Charan960@cluster0.mukkkot.mongodb.net")
  .then(() => {
    console.log("DB connected successfully");
  })
  .catch((err) => {
    console.log("DB connection failed");
    console.log(err);
  });

const Users = mongoose.model("User", {
  username: String,
  password: String,
});

app.get("/", (req, res) => {
  res.send("Hello World!");
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
