import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10kb" }));
app.use("/api/", rateLimit({ windowMs: 60000, max: 30 }));
app.use(express.static(path.join(__dirname, "public")));

const KEY = process.env.OPENROUTER_API_KEY;

const MODELS = {
  chatgpt: "openai/gpt-4o-mini",
  claude: "anthropic/claude-3.5-haiku",
  gemini: "google/gemini-flash-1.5",
  grok: "x-ai/grok-beta",
  deepseek: "deepseek/deepseek-chat",
  copilot: "openai/gpt-4o-mini",
  mistral: "mistralai/mistral-7b-instruct",
  perplexity: "perplexity/llama-3.1-sonar-small-128k-online"
};

app.post("/api/chat", async (req, res) => {
  try {
    const { message, model } = req.body;
    if (!message || typeof message !== "string") return res.status(400).json({ error: "No message" });
    if (message.length > 2000) return res.status(400).json({ error: "Too long" });
    if (!KEY) return res.status(500).json({ error: "API key missing" });

    const chosen = MODELS[model] || "openai/gpt-4o-mini";
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + KEY,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fifteen-tools.onrender.com",
        "X-Title": "Fifteen Tools"
      },
      body: JSON.stringify({ model: chosen, messages: [{ role: "user", content: message }] })
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("OpenRouter error:", r.status, errText);
      return res.status(502).json({ error: "OpenRouter error " + r.status });
    }

    const d = await r.json();
    const reply = d.choices?.[0]?.message?.content || "Empty";
    res.json({ reply });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Fifteen Tools started on port " + PORT));
