require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { nanoid } = require('nanoid');
const Url = require('./models/Url');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET','POST','PUT','DELETE']
}));

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

/* ==========================================
   CREATE SHORT URL
========================================== */
app.post('/api/shorten', async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: 'originalUrl is required' });
    }

    // URL validation
    try { new URL(originalUrl); }
    catch(e) {
      return res.status(400).json({ error: 'invalid URL' });
    }

    const shortId = nanoid(7);

    const entry = new Url({
      shortId,
      originalUrl,
      clicks: 0
    });

    await entry.save();

    const base = process.env.BASE_URL || ('http://localhost:' + PORT);
    return res.json({
      shortId,
      shortUrl: `${base}/r/${shortId}`
    });

  } catch (err) {
    console.error('Shorten Error:', err);
    return res.status(500).json({ error: 'server error' });
  }
});


/* ==========================================
   🔍 GET URL INFO (for frontend redirect page)
   /api/info/:shortId
========================================== */
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


/* ==========================================
   REDIRECT TO ORIGINAL URL
   /r/:shortId
========================================== */
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


/* ==========================================
   CONNECT DATABASE & START SERVER
========================================== */
mongoose.connect(process.env.MONGO_URL, {})
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log('Server running on port', PORT);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
