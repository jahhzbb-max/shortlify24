require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { nanoid } = require('nanoid');
const Url = require('./models/Url');

const app = express();
const PORT = process.env.PORT || 5000;

/* ===================================================
   MIDDLEWARE
=================================================== */
app.use(express.json());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,         // Netlify Frontend
    process.env.BASE_URL              // Backend URL (Render)
  ],
  methods: ['GET', 'POST'],
}));

app.get('/health', (req, res) => res.json({ status: 'ok' }));


/* ===================================================
   ✅ CREATE SHORT URL
=================================================== */
app.post('/api/shorten', async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl)
      return res.status(400).json({ error: 'originalUrl is required' });

    // Validate URL format
    try { new URL(originalUrl); }
    catch (e) {
      return res.status(400).json({ error: 'invalid URL' });
    }

    const shortId = nanoid(8);

    const entry = new Url({
      shortId,
      originalUrl,
      clicks: 0,
      createdAt: new Date()
    });

    await entry.save();

    const base = process.env.BASE_URL || `http://localhost:${PORT}`;

    return res.json({
      shortId,
      shortUrl: `${base}/r/${shortId}`
    });

  } catch (err) {
    console.error('Shorten Error:', err);
    return res.status(500).json({ error: 'server error' });
  }
});


/* ===================================================
   ✅ FETCH URL INFO FOR REDIRECT PAGE
   Example: /api/info/abc123
=================================================== */
app.get('/api/info/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;

    const entry = await Url.findOne({ shortId });

    if (!entry) {
      return res.json({ error: 'not found' });
    }

    return res.json({
      shortId: entry.shortId,
      originalUrl: entry.originalUrl,
      clicks: entry.clicks
    });

  } catch (err) {
    console.error('Info Error:', err);
    return res.status(500).json({ error: 'server error' });
  }
});


/* ===================================================
   ✅ REDIRECT SHORT URL → ORIGINAL URL
   Example: /r/abc123
=================================================== */
app.get('/r/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;

    const entry = await Url.findOne({ shortId });

    if (!entry) return res.status(404).send('Not found');

    entry.clicks = (entry.clicks || 0) + 1;
    await entry.save();

    return res.redirect(entry.originalUrl);

  } catch (err) {
    console.error('Redirect Error:', err);
    return res.status(500).send('Server error');
  }
});


/* ===================================================
   🔌 CONNECT DATABASE & START SERVER
=================================================== */
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('MongoDB connected ✔');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
