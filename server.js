const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());

// -------------------------------
// 1. STRICT DOMAIN WHITELIST
// -------------------------------
const allowedOrigins = [
  "https://grainforesight.com",
  "https://www.grainforesight.com"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Block requests with NO Origin (server-to-server, curl, GitHub Pages, etc.)
  if (!origin) {
    return res.status(403).json({ error: "Forbidden: Missing Origin" });
  }

  // Block requests with Origin:null (GitHub Pages, local files)
  if (origin === "null") {
    return res.status(403).json({ error: "Forbidden: Null Origin" });
  }

  // Allow only your Hostinger domain
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "Forbidden: Origin not allowed" });
  }

  // Set CORS headers for allowed domain
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// -------------------------------
// 2. GEMINI PROXY ENDPOINT
// -------------------------------
app.post("/gemini", async (req, res) => {
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------------------
// 3. START SERVER
// -------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gemini proxy running on port ${PORT}`);
});
