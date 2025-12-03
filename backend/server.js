// Load environment variables if not in production
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Url = require('./models/Url'); // Import the URL model

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Allows parsing JSON bodies

// Configure CORS for your frontend URL
const frontendUrl = process.env.FRONTEND_URL;
if (frontendUrl) {
    app.use(cors({ origin: frontendUrl }));
} else {
    app.use(cors()); // Allow all origins if frontend URL is not set (less secure)
}

// MongoDB Connection
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
            // Return original URL info to frontend redirect page
            return res.json({ originalUrl: urlEntry.originalUrl });
        } else {
            return res.status(404).json('No URL found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).json('Server error');
    }
});

// 2. Route to create a new short URL (You will need a frontend form to use this)
app.post('/api/shorten', async (req, res) => {
    const { originalUrl } = req.body;
    // Add validation here if needed

    try {
        let url = await Url.findOne({ originalUrl });
        if (url) {
            res.json(url);
        } else {
            // Generate a simple short ID (e.g., using nanoid package)
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
// This route typically needs to be handled by your backend host's routing, 
// or you can configure it here if your host allows wildcards.
app.get('/:shortId', async (req, res) => {
    try {
        const urlEntry = await Url.findOne({ shortId: req.params.shortId });
        if (urlEntry) {
            // Redirect the user to the original URL
            return res.redirect(urlEntry.originalUrl);
        } else {
            // If ID not found, redirect to frontend homepage with an error
            return res.redirect(process.env.FRONTEND_URL || '/');
        }
    } catch (err) {
        console.error(err);
        res.status(500).json('Server error');
    }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

