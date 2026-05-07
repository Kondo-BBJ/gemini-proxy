require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

const allowedOrigins = [
  "https://kondo-bbj.github.io",
  "https://grainforesight.com"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const port = 3000;


app.use(express.json());

app.post('/gemini', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).send('Missing prompt');

try {
  const response = await axios.post(
    // 1. MUST use v1beta to trigger the 'Paid Tier' check
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent`,
    {
      contents: [{ parts: [{ text: prompt }] }]
    },
    {
    headers: { 
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
      // 💡 以下の2行を追加してください
      'x-goog-user-project': 'gemini-proxy-new-495613',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  }
);
  res.json(response.data);
} catch (error) {
  // If this still fails, it will give us a NEW specific error code
  console.error('Final Debug:', JSON.stringify(error.response?.data, null, 2));
  res.status(500).json(error.response?.data);
}
});

app.listen(port, () => {
  console.log(`✅ Proxy server running at http://localhost:${port}`);
});


app.post('/gemini', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).send('Missing prompt');

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        params: { key: process.env.GEMINI_API_KEY }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Gemini API error:', error.response?.data || error.message);
    res.status(500).send(`Gemini API error:\n${JSON.stringify(error.response?.data || error.message, null, 2)}`);
  }
});
