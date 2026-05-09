import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { GoogleAuth } from "google-auth-library";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
  scopes: ["https://www.googleapis.com/auth/cloud-platform"]
});

const PROJECT_ID = "grainforesight-vertex";
const LOCATION = "us-central1";
const MODEL = "gemini-2.0-flash";

app.post("/generate", async (req, res) => {
  try {
    const client = await auth.getClient();

    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

    const response = await client.request({
      url,
      method: "POST",
      data: {
        contents: [
          {
            role: "user",
            parts: [{ text: req.body.prompt }]
          }
        ]
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error("Vertex AI Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Vertex AI Proxy running on port 3000");
});
