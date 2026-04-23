const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());

// ----------------------------------------------------
// DEBUG ENDPOINT (helps us inspect headers if needed)
// ----------------------------------------------------
app.get("/debug", (req, res) => {
  res.json({
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    origin: req.headers.origin || null,
    referer: req.headers.referer || null,
    userAgent: req.headers["user-agent"],
    allHeaders: req.headers
  });
});

// ----------------------------------------------------
// ALLOWED ORIGINS
// ----------------------------------------------------
const allowedOrigins = [
  "https://grainforesight.com",
  "https://www.grainforesight.com",
  "https://app.powerbi.com"   // Power BI is the REAL caller
];

// ----------------------------------------------------
// CORS MIDDLEWARE
// ----------------------------------------------------
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer || "";

  // Block GitHub Pages explicitly
  if (referer.includes("github.io")) {
    return res.status(403).json({ error: "Forbidden: GitHub Pages blocked" });
  }

  // If Origin exists, enforce whitelist
  if (origin) {
    if (!allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: "Forbidden: Origin not allowed" });
    }
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Headers", "Content-Type");
    return next();
  }

  // If no Origin → block
  return res.status(403).json({ error: "Forbidden: Missing Origin" });
});

// ----------------------------------------------------
// GEMINI PROXY ENDPOINT
// ----------------------------------------------------
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

// ----------------------------------------------------
// START SERVER
// ----------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gemini proxy running on port ${PORT}`);
});
