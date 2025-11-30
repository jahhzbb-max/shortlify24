require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { nanoid } = require('nanoid');
const Url = require('./models/Url');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Create short URL
app.post('/api/shorten', async (req, res) => {
  try {
    const { originalUrl } = req.body;
    if (!originalUrl) return res.status(400).json({ error: 'originalUrl is required' });

    // URL validation
    try { new URL(originalUrl); } catch (e) {
      return res.status(400).json({ error: 'invalid URL' });
    }

    const shortId = nanoid(7);
    const entry = new Url({ shortId, originalUrl });
    await entry.save();

    const base = process.env.BASE_URL || ('http://localhost:' + PORT);
    return res.json({ shortId, shortUrl: `${base}/r/${shortId}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

// Redirect
app.get('/r/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const entry = await Url.findOne({ shortId });
    if (!entry) return res.status(404).send('Not found');

    entry.clicks = (entry.clicks || 0) + 1;
    await entry.save();

    return res.redirect(entry.originalUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Connect DB and start server
mongoose.connect(process.env.MONGO_URI, {})   // ✅ fixed variable name
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
