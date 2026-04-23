const express = require("express");
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

app.get("/debug", (req, res) => {
  res.json({
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    origin: req.headers.origin || null,
    referer: req.headers.referer || null,
    host: req.headers.host,
    userAgent: req.headers["user-agent"],
    allHeaders: req.headers
  });
});

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer || "";
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

  // 1. Block GitHub Pages by referer
  if (referer.includes("github.io")) {
    return res.status(403).json({ error: "Forbidden: GitHub Pages blocked" });
  }

  // 2. Allow Hostinger by IP (Hostinger uses 2 main ranges)
  const isHostingerIP =
    ip.startsWith("185.") ||  // Hostinger Europe
    ip.startsWith("154.");    // Hostinger US/Asia

  if (isHostingerIP) {
    res.header("Access-Control-Allow-Origin", "https://grainforesight.com");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    return next();
  }

  // 3. If Origin exists, enforce whitelist
  const allowedOrigins = [
    "https://grainforesight.com",
    "https://www.grainforesight.com"
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Headers", "Content-Type");
    return next();
  }

  // 4. Block everything else
  return res.status(403).json({ error: "Forbidden: Unauthorized source" });
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
