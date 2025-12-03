// Load environment variables if not in production
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// Make sure you have a models/Url.js file for this to work
const Url = require('./models/Url'); 

const app = express();
// Vercel handles the port automatically
// const PORT = process.env.PORT || 5000; 

// Middleware
app.use(express.json()); // Allows parsing JSON bodies

// Configure CORS for your frontend URL
const frontendUrl = process.env.FRONTEND_URL;
if (frontendUrl) {
    app.use(cors({ origin: frontendUrl }));
} else {
    app.use(cors()); // Allow all origins if frontend URL is not set
}

// MongoDB Connection (Connect only once when the function is initialized)
const mongoURI = process.env.MONGODB_URI;
if (mongoURI) {
    mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
    console.error('MONGODB_URI environment variable not set.');
}


// --- API Routes ---

// 1. Route to get info about a specific URL ID (used by redirect page)
app.get('/api/info/:id', async (req, res) => {
    try {
        const urlEntry = await Url.findOne({ shortId: req.params.id });
        if (urlEntry) {
            return res.json({ originalUrl: urlEntry.originalUrl });
        } else {
            return res.status(404).json('No URL found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).json('Server error');
    }
});

// 2. Route to create a new short URL
app.post('/api/shorten', async (req, res) => {
    const { url: originalUrl } = req.body; // Renamed to match schema field name
    // Add validation here if needed

    try {
        let url = await Url.findOne({ originalUrl });
        if (url) {
            res.json(url);
        } else {
            // Generate a simple short ID (using nanoid package is better)
            const shortId = Math.random().toString(36).substr(2, 6); 
            url = new Url({
                originalUrl,
                shortId,
                date: new Date()
            });
            await url.save();
            res.status(201).json(url);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json('Server error');
    }
});


// 3. Main Redirect Route (Handle actual redirection)
// This must be handled by Vercel rewrites or a different function. 
// For this setup, we assume Vercel routing handles this.

// Remove the app.listen line
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// Vercel Export (CRITICAL CHANGE)
// We export the Express app so Vercel can use it as a serverless function handler.
module.exports = app;
