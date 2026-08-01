import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { staticQuestions, Question } from "./src/questionsData";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data structures for online capabilities
const leaderboard = [
  { rank: 1, name: "ترابی", score: 3931, isCurrentUser: false },
  { rank: 2, name: "۰۹۱۲******۶", score: 1450, isCurrentUser: false },
  { rank: 3, name: "۰۹۱۲******۷", score: 950, isCurrentUser: false },
  { rank: 4, name: "آرش دادیار", score: 820, isCurrentUser: false },
  { rank: 5, name: "سارا حسینی", score: 640, isCurrentUser: false }
];

const activeOTPs = new Map<string, string>();

// Lazy Gemini API Client Initialization
let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        console.log("Gemini client successfully initialized.");
      } catch (error) {
        console.error("Failed to initialize Gemini client:", error);
      }
    }
  }
  return aiClient;
}

// REST APIs
// 1. Get Questions (Server Question Bank)
app.get("/api/questions", (req, res) => {
  const category = req.query.category as string;
  let questions = [...staticQuestions];

  if (category) {
    questions = questions.filter(q => q.category === category);
  }

  // Shuffle and return a package of 3 questions (matching Quizland's round structure shown in images)
  const shuffled = questions.sort(() => 0.5 - Math.random());
  res.json(shuffled.slice(0, 3));
});

// 2. Download Offline Question Pack
app.get("/api/questions/download-pack", (req, res) => {
  // Returns all static questions to be cached in the browser's localStorage
  res.json({
    version: "1.2.0",
    questions: staticQuestions,
    downloadedAt: new Date().toISOString()
  });
});

// 3. Generate Questions dynamically using Gemini
app.post("/api/questions/generate", async (req, res) => {
  const { category, count = 3 } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    console.log("No Gemini API key available. Falling back to local questions.");
    // Filter and shuffle static questions
    const filtered = staticQuestions.filter(q => q.category === category);
    const shuffled = (filtered.length > 0 ? filtered : staticQuestions).sort(() => 0.5 - Math.random());
    return res.json({
      questions: shuffled.slice(0, count),
      source: "local-fallback"
    });
  }

  try {
    const prompt = `تعداد ${count} سوال چهارگزینه‌ای جذاب، سخت و علمی به زبان فارسی درباره موضوع "${category}" تولید کن. 
سعی کن پاسخ‌ها کاملا دقیق و چالش‌برانگیز باشند. فیلد correctOptionIndex باید ایندکس پاسخ صحیح در آرایه گزینه‌ها (از 0 تا 3) باشد.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "یک آیدی یونیک مانند gem_gen_1" },
              category: { type: Type.STRING, description: "دسته‌بندی سوال دقیقا برابر با ورودی" },
              questionText: { type: Type.STRING, description: "متن سوال به زبان فارسی" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "آرایه‌ای شامل دقیقا ۴ گزینه به فارسی"
              },
              correctOptionIndex: { type: Type.INTEGER, description: "ایندکس گزینه صحیح بین 0 تا 3" }
            },
            required: ["id", "category", "questionText", "options", "correctOptionIndex"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const generatedQuestions = JSON.parse(text.trim());
    res.json({
      questions: generatedQuestions,
      source: "gemini-ai"
    });
  } catch (error) {
    console.error("Gemini question generation error:", error);
    // Fallback to static
    const filtered = staticQuestions.filter(q => q.category === category);
    const shuffled = (filtered.length > 0 ? filtered : staticQuestions).sort(() => 0.5 - Math.random());
    res.json({
      questions: shuffled.slice(0, count),
      source: "local-fallback",
      error: "Gemini error: " + (error as Error).message
    });
  }
});

// 4. Send Code (Phone verification simulation)
app.post("/api/auth/send-code", (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber || !phoneNumber.match(/^09\d{9}$/)) {
    return res.status(400).json({ error: "شماره موبایل وارد شده معتبر نیست" });
  }

  // Simulate verification code
  const code = "1234"; // Consistent code for easy user testing
  activeOTPs.set(phoneNumber, code);
  console.log(`Generated OTP code ${code} for phone number ${phoneNumber}`);

  res.json({ success: true, message: "کد فعال‌سازی با موفقیت ارسال شد (کد تست: 1234)" });
});

// 5. Verify Code
app.post("/api/auth/verify-code", (req, res) => {
  const { phoneNumber, code } = req.body;
  const expectedCode = activeOTPs.get(phoneNumber) || "1234"; // Default to 1234 for flexibility

  if (code === expectedCode) {
    // Generate simple profile
    const maskedPhone = phoneNumber.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2");
    res.json({
      success: true,
      user: {
        phoneNumber,
        maskedPhone,
        name: "کاربر جدید",
        score: 200 // Default initial points
      }
    });
  } else {
    res.status(400).json({ error: "کد فعال‌سازی وارد شده صحیح نیست" });
  }
});

// 6. Get Leaderboard
app.get("/api/leaderboard", (req, res) => {
  res.json(leaderboard);
});

// 7. Submit Score
app.post("/api/leaderboard/submit", (req, res) => {
  const { name, score, phoneNumber } = req.body;
  if (!name || score === undefined) {
    return res.status(400).json({ error: "اطلاعات نام و امتیاز ضروری است" });
  }

  // Mask name or phone
  const displayName = name === "کاربر جدید" && phoneNumber ? phoneNumber.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2") : name;

  // Check if player is already on the leaderboard, or update
  const existingIndex = leaderboard.findIndex(entry => entry.name === displayName || (phoneNumber && entry.name === phoneNumber.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2")));

  if (existingIndex !== -1) {
    if (score > leaderboard[existingIndex].score) {
      leaderboard[existingIndex].score = score;
    }
  } else {
    leaderboard.push({
      rank: 0, // Recalculated below
      name: displayName,
      score: score,
      isCurrentUser: true
    });
  }

  // Sort and re-rank
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  res.json({ success: true, leaderboard });
});

// Integration with Vite dev server or serving static files
async function init() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

init();
