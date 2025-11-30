// ---------------------------
// Shortlify24 – Backend Server
// Fully Working + Debug Logs
// ---------------------------

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// DEBUG LOG
console.log("🚀 Server starting...");

// ---------------------------
// MONGODB CONNECTION
// ---------------------------
mongoose
  .connect(process.env.MONGO_URI, { dbName: "shortlify24" })
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
// Helper: Generate Short ID
// ---------------------------
function generateShortId() {
  return crypto.randomBytes(4).toString("hex"); // 8 character ID
}

// ---------------------------
// API: Home Test
// ---------------------------
app.get("/", (req, res) => {
  console.log("📩 GET / called");
  res.json({ success: true, message: "Shortlify24 Backend Running" });
});

// ---------------------------
// API: Create Short URL
// ---------------------------
app.post("/create", async (req, res) => {
  try {
    console.log("📩 POST /create:", req.body);

    const { originalUrl, expireHours } = req.body;
    if (!originalUrl) {
      console.log("❌ Error: No URL provided");
      return res.status(400).json({ error: "URL is required" });
    }

    const shortId = generateShortId();

    let expireTime = null;
    if (expireHours) {
      expireTime = new Date(Date.now() + expireHours * 60 * 60 * 1000);
      console.log("⏳ Expire set to:", expireTime);
    }

    await ShortURL.create({
      shortId,
      originalUrl,
      expireAt: expireTime,
    });

    console.log("✅ URL SHORTENED:", shortId);

    res.json({
      success: true,
      shortId,
      shortUrl: `${process.env.DOMAIN}/${shortId}`,
    });
  } catch (err) {
    console.error("❌ Create Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ---------------------------
// API: Redirect Handler
// ---------------------------
app.get("/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;
    console.log("📩 REDIRECT REQUEST:", shortId);

    const urlDoc = await ShortURL.findOne({ shortId });
    if (!urlDoc) {
      console.log("❌ Invalid Link");
      return res.status(404).json({
        error: "Invalid or Expired Link",
        message: "This URL does not exist",
      });
    }

    // Check Expiry
    if (urlDoc.expireAt && new Date() > urlDoc.expireAt) {
      console.log("⏳ EXPIRED:", urlDoc.shortId);
      return res.status(410).json({
        error: "Expired Link",
        message: "This URL has expired.",
      });
    }

    // Count Click
    urlDoc.clicks += 1;
    await urlDoc.save();

    console.log(`🔗 Redirecting → ${urlDoc.originalUrl}`);

    return res.redirect(urlDoc.originalUrl);
  } catch (err) {
    console.error("❌ Redirect Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ---------------------------
// SERVER START
// ---------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server Live on PORT: ${PORT}`)
);
