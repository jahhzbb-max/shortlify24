import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// -----------------------------
// 🔵 CONNECT MONGODB
// -----------------------------
mongoose
  .connect(
    "mongodb+srv://jahhzbb_db_user:0pAyIXj6kdxFAaih@cluster0.matlruh.mongodb.net/shortlify?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// -----------------------------
// 🟣 MONGOOSE SCHEMA
// -----------------------------
const ShortUrlSchema = new mongoose.Schema({
  shortId: String,
  originalUrl: String,
  clicks: { type: Number, default: 0 },
});

const ShortUrl = mongoose.model("ShortUrl", ShortUrlSchema);

// -----------------------------
// 🟢 CREATE SHORT URL
// -----------------------------
app.post("/api/shorten", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.json({ status: "error", message: "URL is required" });
    }

    const id = Math.random().toString(36).substring(2, 8);

    await ShortUrl.create({
      shortId: id,
      originalUrl: url,
    });

    return res.json({
      status: "success",
      shortUrl: id,
      originalUrl: url,
    });
  } catch (err) {
    return res.json({ status: "error", message: err.message });
  }
});

// -----------------------------
// 🔵 REDIRECT PAGE INFO API
// -----------------------------
app.get("/api/info/:id", async (req, res) => {
  const data = await ShortUrl.findOne({ shortId: req.params.id });

  if (!data) {
    return res.json({ originalUrl: null });
  }

  return res.json({
    originalUrl: data.originalUrl,
  });
});

// -----------------------------
// 🔴 FINAL REDIRECT
// -----------------------------
app.get("/:id", async (req, res) => {
  const data = await ShortUrl.findOne({ shortId: req.params.id });

  if (!data) {
    return res.send("❌ Invalid Short URL");
  }

  data.clicks++;
  await data.save();

  return res.redirect(data.originalUrl);
});

// -----------------------------
// 🟢 START SERVER
// -----------------------------
app.listen(3000, () => console.log("🚀 Server running on port 3000"));
