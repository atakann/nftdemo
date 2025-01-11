//server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const passport = require("passport");
const session = require("express-session");
const User = require('./models/User');

const connectMongo = require("../src/lib/db.js");

const { registerUser, loginUser } = require("./controllers/authController.js");
const {
  getUserInfo,
  updateUserInfo,
  getAllDesigners,
  getDesignerByUsername,
  getDesignerById,
} = require("./controllers/userController.js");
const {
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionByAddress,
  getCollections,
  getCollectionByCollectionAddress,
  getAllCollections,
  getCollectionByDesignerId,
  getCollectionById,
} = require("./controllers/collectionController.js");
const {
  updateProduct,
  createProduct,
  deleteProduct,
  getCollectionProducts,
  getProductById,
  getProductsByCollectionId,
  getProductSize,
  listProduct,
  getListedProduct,
} = require("./controllers/productController.js");
const {
  addSize,
  deleteSize,
  updateSize,
} = require("./controllers/sizeController.js");
const { createNFT, getAllNFTs } = require("./controllers/nftController.js");
const { createListing } = require("./controllers/listingController.js");
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// Load environment variables from .env file
dotenv.config();

console.log('Environment variables loaded:', {
  mongodbUri: !!process.env.MONGODB_URI,
  googleClientId: !!process.env.GOOGLE_CLIENT_ID,
  jwtSecret: !!process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL
});

const server = express();
const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

server.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
server.use(express.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(router);

// MongoDB connection

connectMongo().then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Google OAuth route
router.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: "No credential provided" });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ error: "Invalid token" });
    }

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      try {
        user = await User.create({
          email: payload.email,
          username: payload.email?.split('@')[0],
          name: payload.name,
          profilePicture: payload.picture,
          googleId: payload.sub,
          role: 'designer',
          password: Math.random().toString(36).slice(-8) 
        });
        console.log("Created new user:", user.email);
      } catch (createError) {
        console.error("Error creating user:", createError);
        return res.status(500).json({ error: "Failed to create user", details: createError.message });
      }
    }
    try {
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          profilePicture: user.profilePicture
        }
      });
    } catch (tokenError) {
      return res.status(500).json({ error: "Failed to generate token", details: tokenError.message });
    }
  } catch (error) {
    return res.status(500).json({ 
      error: "Authentication failed", 
      details: error.message,
      stack: error.stack 
    });
  }
});

// USERS

// User registration route
router.post("/api/register", registerUser);
// User login route
router.post("/api/login", loginUser);
// Fetch user info route
router.get("/api/userinfo", getUserInfo);
// Update user info route
router.put("/api/userinfo", updateUserInfo);

// COLLECTIONS

// Create collection route
router.post("/api/collections", createCollection);
// Edit collection route
router.put("/api/collections/:id", updateCollection);
// Delete collection route
router.delete("/api/collections/:id", deleteCollection);
// Fetch collections route
router.get("/api/collections", getCollections);
// Fetch collection by address
router.get("/api/public/collections/address/:address", getCollectionByAddress);
// Add this route for fetching collection by collectionAddress
router.get(
  "/api/public/collections/address/:collectionAddress",
  getCollectionByCollectionAddress
);

// PRODUCTS

// Fetch products in a collection
router.get("/api/collections/:collectionId/products", getCollectionProducts);
// Add product to collection route
router.post("/api/products", createProduct);
// Edit product route
router.put("/api/products/:id", updateProduct);
// Delete product route
router.delete("/api/products/:id", deleteProduct);
// Fetch product by ID route
router.get("/api/products/:id", getProductById);
// Fetch all public collections route
router.get("/api/public/collections", getAllCollections);
// Public route to fetch products for a collection
router.get(
  "/api/public/collections/:collectionId/products",
  getProductsByCollectionId
);

// SIZES

// Fetch sizes for a product
router.get("/api/products/:productId/sizes", getProductSize);
// Add a size to a product
router.post("/api/sizes", addSize);
// Delete a size
router.delete("/api/sizes/:id", deleteSize);
// Update a size
router.put("/api/sizes/:id", updateSize);

// DESIGNERS

// Fetch all designers route
router.get("/api/designers", getAllDesigners);
// Fetch collections by designer route
router.get(
  "/api/collections/by-designer/:designerId",
  getCollectionByDesignerId
);
// Fetch designer by username
router.get("/api/public/designers/username/:username", getDesignerByUsername);
// Designer profile endpoint
router.get("/api/public/designers/:designerId", getDesignerById);

// RERGULAR USERS

// Fetch single collection for public users route
router.get("/api/public/collections/:id", getCollectionById);

//NFTS

router.post("/api/saveNFT", createNFT);
router.get("/api/nfts", getAllNFTs);

// LISTINGS

router.post("/api/listings", createListing);
router.post("/api/products/list", listProduct);
router.get("/api/products/listed", getListedProduct);

// Custom route handling for Next.js pages
server.all("*", (req, res) => {
  res.status(404).send("Not found");
});

server.listen(4000, () => {
  console.log("> API server ready on http://localhost:4000");
});
