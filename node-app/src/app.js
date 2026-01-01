const express = require("express");
const cors = require("cors");
const compression = require("compression");
const bodyParser = require("body-parser");
require("dotenv").config();

const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

/**
 * Create and configure the Express application
 */
const createApp = () => {
  const app = express();

  // ============ MIDDLEWARE ============
  
  // Enable gzip compression
  app.use(compression());

  // CORS configuration
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "*",
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // ============ ROUTES ============
  app.use("/", routes);

  // ============ ERROR HANDLING ============
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
