/**
 * Gemini API Proxy Server (Stable v1 - 2026)
 * Fixes: 403 PERMISSION_DENIED (User Project)
 */
const express = require('express');
// const fetch = require('node-fetch'); // Node 22 has fetch built-in!const cors = require('cors'); // Added for safety with your frontend
const app = express();

app.use(cors());
app.use(express.json());

// CONFIGURATION
const API_KEY = process.env.GEMINI_API_KEY;
const PROJECT_ID = "gemini-proxy-new-495613"; 
const PORT = process.env.PORT || 3000;

app.post('/api/chat', async (req, res) => {
    try {
        // 1. Stable v1 Endpoint (Required for paid/billing accounts in 2026)
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        // 2. Outgoing Request Configuration
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // THE "FINAL BOSS" FIX: Tells Google which project is paying for the call
                'x-goog-user-project': PROJECT_ID 
            },
            body: JSON.stringify({
                contents: req.body.contents, // Ensure your frontend sends a 'contents' array
                generationConfig: req.body.generationConfig || {}
            })
        });

        const data = await response.json();

        // 3. Error Handling
        if (!response.ok) {
            console.error(`[Google API Error] ${response.status}:`, JSON.stringify(data, null, 2));
            return res.status(response.status).json({
                error: "Google API rejected the request",
                details: data.error ? data.error.message : data
            });
        }

        // 4. Return successful response
        res.json(data);

    } catch (error) {
        console.error('[Server Exception]:', error.message);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Gemini Proxy active on port ${PORT}`);
    console.log(`🎯 Billing Project: ${PROJECT_ID}`);
});
