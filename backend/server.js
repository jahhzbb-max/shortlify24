// server.js

// ---------------------------
// Shortlify24 – Backend Server (FIXED)
// Fully Working + Debug Logs
// ---------------------------

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

console.log("🚀 Server starting...");

// ---------------------------
// MONGO CONNECT (dbName option removed)
// ---------------------------
mongoose
  .connect(process.env.MONGO_URI) 
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ---------------------------
// URL SCHEMA
// ---------------------------
const urlSchema = new mongoose.Schema({
  shortId: { type: String, required: true, unique: true },
  originalUrl: { type: String, required: true },
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expireAt: { type: Date, default: null },
});

const ShortURL = mongoose.model("ShortURL", urlSchema);

// ---------------------------
// Generate Unique ID
// ---------------------------
function generateShortId() {
  return crypto.randomBytes(4).toString("hex"); // 8 chars
}

// ---------------------------
// HOME ROUTE
// ---------------------------
app.get("/", (req, res) => {
  res.json({ success: true, server: "Shortlify24 backend running" });
});

// ---------------------------
// CREATE SHORT URL (Used by Frontend)
// ---------------------------
app.post("/api/create", async (req, res) => {
  try {
    console.log("📩 POST /api/create:", req.body);

    const { originalUrl, expireHours } = req.body;
    if (!originalUrl) return res.status(400).json({ error: "URL is required" });

    const shortId = generateShortId();

    let expireTime = null;
    if (expireHours) {
      expireTime = new Date(Date.now() + expireHours * 60 * 60 * 1000);
    }

    // Use create which inherently saves the document
    await ShortURL.create({
      shortId,
      originalUrl,
      expireAt: expireTime,
    });

    console.log("✅ URL SHORTENED →", shortId);

    res.json({
      success: true,
      shortId,
      shortUrl: `${process.env.DOMAIN}/redirect.html?c=${shortId}`,
    });
  } catch (err) {
    console.error("❌ Error in /api/create:", err); // বিস্তারিত লগিং
    res.status(500).json({ error: "Server Error" });
  }
});

// ---------------------------
// API INFO ROUTE (Frontend calls this)
// ---------------------------
app.get("/api/info/:id", async (req, res) => {
  try {
    console.log("📩 INFO REQUEST:", req.params.id);

    const data = await ShortURL.findOne({ shortId: req.params.id });

    if (!data) return res.json({ originalUrl: null });

    res.json({
      originalUrl: data.originalUrl,
      clicks: data.clicks,
      expireAt: data.expireAt,
    });
  } catch (err) {
    console.error("❌ Error in /api/info:", err);
    res.json({ error: "Server Error" });
  }
});

// ---------------------------
// DIRECT REDIRECT (Last Route)
// ---------------------------
app.get("/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;
    console.log("📩 REDIRECT REQUEST:", shortId);

    const urlDoc = await ShortURL.findOne({ shortId });
    if (!urlDoc) return res.send("Invalid or expired link");

    // Check expiry
    if (urlDoc.expireAt && new Date() > urlDoc.expireAt) {
      return res.send("This short link has expired.");
    }

    urlDoc.clicks += 1;
    await urlDoc.save();

    res.redirect(urlDoc.originalUrl);
  } catch (err) {
    console.error("❌ Error in redirect:", err);
    res.send("Server Error");
  }
});

// ---------------------------
// SERVER START
// ---------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server Live on PORT ${PORT}`)
);
