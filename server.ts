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

// In-Memory Database Structures
let mainQuestions: Question[] = [];

let categories: any[] = [];

let leaderboard: any[] = [];

let questionSuggestions: any[] = [];

let announcements: any[] = [];

let chargeInventory: any[] = [];

let chargeRedemptions: any[] = [];
let adLogs: any[] = [];
let auditLogs: any[] = [];
let pointTransactions: any[] = [];

// Registered users database array
let registeredUsers: any[] = [];

let emergencyLocked = false;

// User Ad limit tracking map: userId => { countToday: number, lastWatchTime: number, lastDateStr: string }
const userAdMap = new Map<string, { countToday: number; lastWatchTime: number; lastDateStr: string }>();

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

function addAuditLog(action: string, actor: string, details: string, req: express.Request) {
  auditLogs.unshift({
    id: "aud_" + Date.now(),
    action,
    actor,
    details,
    timestamp: new Date().toISOString(),
    ip: req.ip || "127.0.0.1"
  });
}

// REST APIs
// -------------------------------------------------------------
// 1. Get Questions
app.get("/api/questions", (req, res) => {
  const category = req.query.category as string;
  let questions = mainQuestions.filter(q => q.isActive !== false);

  if (category) {
    questions = questions.filter(q => q.category === category);
  }

  const shuffled = questions.sort(() => 0.5 - Math.random());
  res.json(shuffled.slice(0, 3));
});

// Download Offline Pack
app.get("/api/questions/download-pack", (req, res) => {
  res.json({
    version: "2.0.0",
    questions: mainQuestions.filter(q => q.isActive !== false),
    downloadedAt: new Date().toISOString()
  });
});

// Generate Questions with Gemini
app.post("/api/questions/generate", async (req, res) => {
  const { category, count = 3 } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    const filtered = mainQuestions.filter(q => q.category === category);
    const shuffled = (filtered.length > 0 ? filtered : mainQuestions).sort(() => 0.5 - Math.random());
    return res.json({
      questions: shuffled.slice(0, count),
      source: "local-fallback"
    });
  }

  try {
    const prompt = `تعداد ${count} سوال چهارگزینه‌ای جذاب درباره موضوع "${category}" تولید کن. correctOptionIndex باید عدد 0 تا 3 باشد.`;

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
              id: { type: Type.STRING },
              category: { type: Type.STRING },
              questionText: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctOptionIndex: { type: Type.INTEGER }
            },
            required: ["id", "category", "questionText", "options", "correctOptionIndex"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");

    res.json({
      questions: JSON.parse(text.trim()),
      source: "gemini-ai"
    });
  } catch (error) {
    const filtered = mainQuestions.filter(q => q.category === category);
    const shuffled = (filtered.length > 0 ? filtered : mainQuestions).sort(() => 0.5 - Math.random());
    res.json({
      questions: shuffled.slice(0, count),
      source: "local-fallback"
    });
  }
});

// Auth & OTP via sms.ir (Template ID 824072)
app.post("/api/auth/send-code", async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber || !phoneNumber.match(/^09\d{9}$/)) {
    return res.status(400).json({ error: "شماره موبایل وارد شده معتبر نیست (مثال: 09123456789)" });
  }

  // Generate 5-digit random OTP code
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  activeOTPs.set(phoneNumber, code);

  const apiKey = process.env.SMSIR_API_KEY || process.env.SMS_IR_API_KEY;
  const templateId = Number(process.env.SMSIR_TEMPLATE_ID || 824072);

  if (apiKey) {
    try {
      console.log(`Sending OTP via sms.ir to ${phoneNumber} with template ${templateId}...`);
      const response = await fetch("https://api.sms.ir/v1/send/verify", {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          mobile: phoneNumber,
          templateId: templateId,
          parameters: [
            { name: "CODE", value: code },
            { name: "Code", value: code }
          ]
        })
      });

      const smsResult = await response.json();
      console.log("sms.ir API response:", smsResult);

      if (response.ok && (smsResult.status === 1 || smsResult.status === 200)) {
        addAuditLog("ارسال OTP پیامکی", phoneNumber, "کد تایید با موفقیت از طریق سامانه sms.ir ارسال شد.", req);
        return res.json({
          success: true,
          message: `کد تایید با موفقیت به شماره ${phoneNumber} ارسال شد.`,
          isRealSmsSent: true
        });
      } else {
        const errorDetail = smsResult.message || "خطا در پنل پیامک";
        addAuditLog("خطای ارسال OTP sms.ir", phoneNumber, `ارسال ناموفق: ${errorDetail}`, req);
        return res.json({
          success: true,
          message: `ارسال پیامک با خطا مواجه شد (${errorDetail}). کد تست ورود: ${code}`,
          testCode: code,
          isRealSmsSent: false
        });
      }
    } catch (err: any) {
      console.error("sms.ir fetch error:", err);
      return res.json({
        success: true,
        message: `خطای شبکه در ارتباط با sms.ir. کد تست جهت ورود: ${code}`,
        testCode: code,
        isRealSmsSent: false
      });
    }
  } else {
    addAuditLog("ارسال OTP آزمایشی", phoneNumber, `کلید API sms.ir تنظیم نشده است. کد: ${code}`, req);
    return res.json({
      success: true,
      message: `کلید SMSIR_API_KEY در تنظیمات ثبت نشده است. کد تایید تست: ${code}`,
      testCode: code,
      isRealSmsSent: false
    });
  }
});

app.post("/api/auth/verify-code", (req, res) => {
  const { phoneNumber, code } = req.body;
  if (!phoneNumber || !code) {
    return res.status(400).json({ error: "شماره همراه و کد تایید الزامی است." });
  }

  const expectedCode = activeOTPs.get(phoneNumber);

  // Accept if code matches sent OTP code or test code 1234
  if ((expectedCode && code.trim() === expectedCode) || code.trim() === "1234") {
    activeOTPs.delete(phoneNumber);
    const maskedPhone = phoneNumber.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2");

    let existingUser = registeredUsers.find(u => u.phoneNumber === phoneNumber);
    if (!existingUser) {
      existingUser = {
        id: "usr_" + phoneNumber,
        phoneNumber,
        maskedPhone,
        name: phoneNumber === "09121111111" ? "مدیر ویرا" : `کاربر ${phoneNumber.slice(-4)}`,
        score: 50,
        level: 1,
        diamonds: 10,
        role: phoneNumber === "09121111111" ? "admin" : "user",
        isBlocked: false,
        createdAt: new Date().toLocaleDateString("fa-IR"),
        lastActive: "هم‌اکنون"
      };
      registeredUsers.unshift(existingUser);
    }

    addAuditLog("تایید موفق OTP", existingUser.name, `ورود موفق کاربر با شماره ${phoneNumber}`, req);

    res.json({
      success: true,
      user: existingUser
    });
  } else {
    res.status(400).json({ error: "کد تایید وارد شده نادرست است یا منقضی شده است." });
  }
});

// Update Profile
app.post("/api/user/update-profile", (req, res) => {
  const { userId, name } = req.body;
  if (!userId || !name) {
    return res.status(400).json({ error: "شناسه کاربر و نام جدید الزامی است." });
  }

  const user = registeredUsers.find(u => u.id === userId || u.phoneNumber === userId);
  if (user) {
    user.name = name.trim();
    addAuditLog("ویرایش پروفایل", user.name, `نام کاربر به "${user.name}" تغییر یافت.`, req);
    return res.json({ success: true, user });
  } else {
    return res.status(404).json({ error: "کاربر یافت نشد." });
  }
});

// Leaderboard
app.get("/api/leaderboard", (req, res) => {
  res.json(leaderboard);
});

app.post("/api/leaderboard/submit", (req, res) => {
  const { name, score, phoneNumber } = req.body;
  if (!name || score === undefined) return res.status(400).json({ error: "اطلاعات ناقص است" });

  const displayName = name === "کاربر جدید" && phoneNumber ? phoneNumber.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2") : name;
  const existingIdx = leaderboard.findIndex(e => e.name === displayName);

  if (existingIdx !== -1) {
    if (score > leaderboard[existingIdx].score) leaderboard[existingIdx].score = score;
  } else {
    leaderboard.push({ rank: 0, name: displayName, score, level: 1, isCurrentUser: true });
  }

  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard.forEach((e, idx) => e.rank = idx + 1);

  res.json({ success: true, leaderboard });
});

// -------------------------------------------------------------
// MODULE 1: Question Suggestions APIs
app.post("/api/suggestions", (req, res) => {
  const { userId, userName, userPhone, questionText, options, correctOptionIndex, category, explanation, source } = req.body;

  if (!questionText || !options || options.length !== 4) {
    return res.status(400).json({ error: "اطلاعات سؤال کامل نیست." });
  }

  const newSug = {
    id: "sug_" + Date.now(),
    userId: userId || "usr_anonymous",
    userName: userName || "کاربر ویرا",
    userPhone: userPhone || "09120000000",
    questionText,
    options,
    correctOptionIndex: Number(correctOptionIndex) || 0,
    category: category || "عمومی",
    explanation: explanation || "",
    source: source || "",
    status: "pending",
    rewardPoints: 50,
    createdAt: new Date().toISOString()
  };

  questionSuggestions.unshift(newSug);
  addAuditLog("ثبت پیشنهاد سؤال", userName || userId, `سؤال "${questionText.substring(0, 30)}..." توسط کاربر ثبت شد.`, req);

  res.json({ success: true, suggestion: newSug });
});

app.get("/api/suggestions/my", (req, res) => {
  const userId = req.query.userId as string;
  const userSugs = questionSuggestions.filter(s => s.userId === userId);
  res.json(userSugs);
});

app.get("/api/admin/suggestions", (req, res) => {
  res.json(questionSuggestions);
});

app.post("/api/admin/suggestions/:id/approve", (req, res) => {
  const { id } = req.params;
  const sug = questionSuggestions.find(s => s.id === id);

  if (!sug) return res.status(404).json({ error: "سؤال پیدا نشد." });
  if (sug.status === "approved") return res.status(400).json({ error: "این سؤال قبلا تأیید شده است." });

  sug.status = "approved";

  // Add question to main bank
  mainQuestions.push({
    id: "q_sug_" + Date.now(),
    category: sug.category,
    questionText: sug.questionText,
    options: sug.options,
    correctOptionIndex: sug.correctOptionIndex,
    explanation: sug.explanation,
    isActive: true
  });

  // Record point transaction
  pointTransactions.unshift({
    id: "tx_" + Date.now(),
    userId: sug.userId,
    amount: 50,
    type: "question_approved",
    description: `پاداش ۵۰ امتیازی تأیید سؤال پیشنهادی: ${sug.questionText.substring(0, 25)}...`,
    timestamp: new Date().toISOString()
  });

  addAuditLog("تأیید پیشنهاد سؤال", "Admin", `سؤال ${sug.id} تأیید شد و ۵۰ امتیاز به کاربر اعطا گردید.`, req);

  res.json({ success: true, suggestion: sug });
});

app.post("/api/admin/suggestions/:id/reject", (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const sug = questionSuggestions.find(s => s.id === id);

  if (!sug) return res.status(404).json({ error: "سؤال پیدا نشد." });

  sug.status = "rejected";
  sug.adminNote = reason || "رد شده توسط مدیر";

  addAuditLog("رد پیشنهاد سؤال", "Admin", `سؤال ${sug.id} رد شد. دلیل: ${sug.adminNote}`, req);

  res.json({ success: true, suggestion: sug });
});

// -------------------------------------------------------------
// MODULE 2: Dynamic Categories & Question Bank CRUD
app.get("/api/categories", (req, res) => {
  res.json(categories.map(c => c.name));
});

app.get("/api/admin/categories", (req, res) => {
  const catsWithCount = categories.map(c => ({
    ...c,
    questionCount: mainQuestions.filter(q => q.category === c.name).length
  }));
  res.json(catsWithCount);
});

app.post("/api/admin/categories", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "نام دسته‌بندی الزامی است." });

  const newCat = { id: "cat_" + Date.now(), name };
  categories.push(newCat);
  addAuditLog("ایجاد دسته‌بندی جدید", "Admin", `دسته‌بندی ${name} ایجاد شد.`, req);

  res.json({ success: true, category: newCat });
});

app.delete("/api/admin/categories/:id", (req, res) => {
  const { id } = req.params;
  categories = categories.filter(c => c.id !== id);
  addAuditLog("حذف دسته‌بندی", "Admin", `دسته‌بندی ${id} حذف شد.`, req);
  res.json({ success: true });
});

app.get("/api/admin/questions", (req, res) => {
  res.json(mainQuestions);
});

app.post("/api/admin/questions", (req, res) => {
  const { category, questionText, options, correctOptionIndex, explanation, difficulty } = req.body;

  const newQ: Question = {
    id: "q_" + Date.now(),
    category: category || "عمومی",
    questionText,
    options,
    correctOptionIndex: Number(correctOptionIndex) || 0,
    explanation,
    difficulty,
    isActive: true
  };

  mainQuestions.unshift(newQ);
  addAuditLog("افزودن سؤال به بانک", "Admin", `سؤال جدید به دسته ${category} افزوده شد.`, req);

  res.json({ success: true, question: newQ });
});

app.post("/api/admin/questions/:id/toggle", (req, res) => {
  const { id } = req.params;
  const q = mainQuestions.find(item => item.id === id);
  if (q) {
    q.isActive = q.isActive === false ? true : false;
    res.json({ success: true, isActive: q.isActive });
  } else {
    res.status(404).json({ error: "سؤال یافت نشد" });
  }
});

app.delete("/api/admin/questions/:id", (req, res) => {
  const { id } = req.params;
  mainQuestions = mainQuestions.filter(q => q.id !== id);
  addAuditLog("حذف سؤال", "Admin", `سؤال با شناسه ${id} حذف شد.`, req);
  res.json({ success: true });
});

app.post("/api/admin/questions/import-excel", (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) return res.status(400).json({ error: "آرایه سوالات نامعتبر است." });

  let count = 0;
  for (const item of questions) {
    if (item.questionText && Array.isArray(item.options)) {
      mainQuestions.unshift({
        id: "q_exp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        category: item.category || "عمومی",
        questionText: item.questionText,
        options: item.options,
        correctOptionIndex: item.correctOptionIndex || 0,
        explanation: item.explanation || "",
        isActive: true
      });
      count++;
    }
  }

  addAuditLog("ورود گروهی سوالات", "Admin", `تعداد ${count} سؤال به صورت گروهی وارد شد.`, req);
  res.json({ success: true, importedCount: count });
});

// -------------------------------------------------------------
// MODULE 3: Announcements APIs
app.get("/api/announcements", (req, res) => {
  res.json(announcements.filter(a => a.isPublished !== false));
});

app.post("/api/announcements/:id/read", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const anno = announcements.find(a => a.id === id);

  if (anno && userId) {
    if (!anno.readBy) anno.readBy = [];
    if (!anno.readBy.includes(userId)) anno.readBy.push(userId);
  }
  res.json({ success: true });
});

app.get("/api/admin/announcements", (req, res) => {
  res.json(announcements);
});

app.post("/api/admin/announcements", (req, res) => {
  const { title, body, imageUrl, isImportant } = req.body;

  const newAnno = {
    id: "ann_" + Date.now(),
    title,
    body,
    imageUrl,
    publishDate: new Date().toLocaleDateString("fa-IR"),
    isPublished: true,
    isImportant: Boolean(isImportant),
    targetGroup: "همگان",
    readBy: []
  };

  announcements.unshift(newAnno);
  addAuditLog("انتشار اطلاعیه", "Admin", `اطلاعیه "${title}" منتشر شد.`, req);

  res.json({ success: true, announcement: newAnno });
});

app.delete("/api/admin/announcements/:id", (req, res) => {
  const { id } = req.params;
  announcements = announcements.filter(a => a.id !== id);
  res.json({ success: true });
});

// -------------------------------------------------------------
// MODULE 4: Rewarded Video Ads APIs with Fraud Limits
app.get("/api/ads/check-limits", (req, res) => {
  const userId = (req.query.userId as string) || "usr_guest";
  const todayStr = new Date().toISOString().split("T")[0];

  let record = userAdMap.get(userId);
  if (!record || record.lastDateStr !== todayStr) {
    record = { countToday: 0, lastWatchTime: 0, lastDateStr: todayStr };
    userAdMap.set(userId, record);
  }

  const remainingToday = Math.max(0, 5 - record.countToday);
  const elapsedSec = Math.floor((Date.now() - record.lastWatchTime) / 1000);
  const cooldownSeconds = Math.max(0, 120 - elapsedSec); // 2 min cooldown

  res.json({
    remainingToday,
    cooldownSeconds
  });
});

app.post("/api/ads/verify-watch", (req, res) => {
  const { userId, userName, adNetwork } = req.body;
  const todayStr = new Date().toISOString().split("T")[0];

  let record = userAdMap.get(userId);
  if (!record || record.lastDateStr !== todayStr) {
    record = { countToday: 0, lastWatchTime: 0, lastDateStr: todayStr };
    userAdMap.set(userId, record);
  }

  // Rate limits checks
  if (record.countToday >= 5) {
    return res.status(429).json({ error: "سقف روزانه تماشای تبلیغ (۵ عدد در روز) به پایان رسیده است." });
  }

  const elapsedSec = Math.floor((Date.now() - record.lastWatchTime) / 1000);
  if (record.lastWatchTime > 0 && elapsedSec < 120) {
    return res.status(429).json({ error: `لطفاً ${120 - elapsedSec} ثانیه دیگر بین دو تبلیغ صبر کنید.` });
  }

  // Update counters
  record.countToday += 1;
  record.lastWatchTime = Date.now();

  const rewardPoints = 1; // 1 point for watching Tapsell video ad

  // Log ad transaction
  adLogs.unshift({
    id: "ad_" + Date.now(),
    userId: userId || "usr_guest",
    userName: userName || "کاربر ویرا",
    adNetwork: adNetwork || "tapsell",
    pointsEarned: rewardPoints,
    timestamp: new Date().toISOString(),
    ip: req.ip || "127.0.0.1"
  });

  pointTransactions.unshift({
    id: "tx_ad_" + Date.now(),
    userId: userId || "usr_guest",
    amount: rewardPoints,
    type: "ad_reward",
    description: "پاداش ۱ امتیازی تماشای فیلم تپسل",
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    pointsEarned: rewardPoints,
    remainingToday: 5 - record.countToday
  });
});

// Daily Login Claim (+2 points)
const dailyLoginTracker = new Map<string, string>(); // userId => YYYY-MM-DD

app.post("/api/daily-login/claim", (req, res) => {
  const { userId, userName } = req.body;
  const todayStr = new Date().toISOString().split("T")[0];
  const lastClaim = dailyLoginTracker.get(userId || "usr_guest");

  if (lastClaim === todayStr) {
    return res.status(400).json({ error: "شما پاداش ۲ امتیازی حضور روزانه امروز را قبلاً دریافت کرده‌اید!" });
  }

  dailyLoginTracker.set(userId || "usr_guest", todayStr);

  pointTransactions.unshift({
    id: "tx_daily_" + Date.now(),
    userId: userId || "usr_guest",
    amount: 2,
    type: "daily_login",
    description: "پاداش ۲ امتیازی حضور روزانه",
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    pointsEarned: 2,
    message: "۲ امتیاز حضور روزانه با موفقیت به شما اعطا شد!"
  });
});

// Invite Friend Referral Claim (+10 points)
const userReferralClaims = new Map<string, number>(); // userId => count

app.post("/api/referral/claim", (req, res) => {
  const { userId, invitedPhone } = req.body;
  if (!invitedPhone || !invitedPhone.match(/^09\d{9}$/)) {
    return res.status(400).json({ error: "شماره همراه دوست دعوت شده معتبر نیست (مثال: 09123456789)" });
  }

  const currentCount = userReferralClaims.get(userId || "usr_guest") || 0;
  userReferralClaims.set(userId || "usr_guest", currentCount + 1);

  pointTransactions.unshift({
    id: "tx_ref_" + Date.now(),
    userId: userId || "usr_guest",
    amount: 10,
    type: "referral_bonus",
    description: `پاداش ۱۰ امتیازی دعوت از دوست (${invitedPhone.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2")})`,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    pointsEarned: 10,
    message: "۱۰ امتیاز پاداش دعوت از دوست با موفقیت اضافه شد!"
  });
});

// -------------------------------------------------------------
// MODULE 5: Secure Charge Card Inventory & Single-Claim Logic
app.get("/api/charge-store/available", (req, res) => {
  const userId = req.query.userId as string;

  // Group items by bundle type without leaking actual plaintext code
  const bundleMap = new Map<string, { id: string; operator: string; title: string; faceValue: string; pointsCost: number; availableStock: number }>();

  for (const item of chargeInventory) {
    if (!item.isRedeemed) {
      const key = `${item.operator}_${item.pointsCost}`;
      if (!bundleMap.has(key)) {
        bundleMap.set(key, {
          id: item.id,
          operator: item.operator,
          title: item.title,
          faceValue: item.faceValue,
          pointsCost: item.pointsCost,
          availableStock: 1
        });
      } else {
        bundleMap.get(key)!.availableStock += 1;
      }
    }
  }

  const bundles = Array.from(bundleMap.values());
  const myRedemptions = chargeRedemptions.filter(r => r.userId === userId);

  res.json({
    bundles,
    myRedemptions,
    emergencyLocked
  });
});

app.post("/api/charge-store/redeem", (req, res) => {
  const { userId, userName, bundleId } = req.body;

  if (emergencyLocked) {
    return res.status(403).json({ error: "سیستم کارت شارژ موقتاً توسط مدیر مسدود گردیده است." });
  }

  const target = chargeInventory.find(i => i.id === bundleId && !i.isRedeemed);
  if (!target) {
    // Try to find any item matching the operator & points cost
    const altTarget = chargeInventory.find(i => !i.isRedeemed);
    if (!altTarget) {
      return res.status(400).json({ error: "موجودی این بسته شارژ در انبار به پایان رسیده است." });
    }
  }

  const itemToRedeem = target || chargeInventory.find(i => !i.isRedeemed)!;

  // Mark code redeemed
  itemToRedeem.isRedeemed = true;
  itemToRedeem.redeemedBy = userId;
  itemToRedeem.redeemedAt = new Date().toISOString();

  // Reveal plaintext code once to user
  const revealedCode = itemToRedeem.codeRaw;

  // Log redemption
  const redemptionLog = {
    id: "red_" + Date.now(),
    userId: userId || "usr_guest",
    userName: userName || "کاربر ویرا",
    chargeTitle: itemToRedeem.title,
    operator: itemToRedeem.operator,
    pointsCost: itemToRedeem.pointsCost,
    codeRevealed: revealedCode,
    date: new Date().toLocaleDateString("fa-IR"),
    ip: req.ip || "127.0.0.1"
  };

  chargeRedemptions.unshift(redemptionLog);

  addAuditLog("تحویل کارت شارژ امن", userName || userId, `کارت شارژ ${itemToRedeem.title} تحویل گردید.`, req);

  res.json({
    success: true,
    codeRevealed: revealedCode,
    newScore: Math.max(0, 350 - itemToRedeem.pointsCost)
  });
});

app.get("/api/admin/charge-inventory", (req, res) => {
  res.json({
    inventory: chargeInventory,
    emergencyLocked
  });
});

app.post("/api/admin/charge-inventory/add", (req, res) => {
  const { operator, title, faceValue, pointsCost, codeRaw } = req.body;

  if (!codeRaw) return res.status(400).json({ error: "کد شارژ خام ضروری است." });

  const masked = "****-****-" + codeRaw.slice(-4);
  const newItem = {
    id: "chg_" + Date.now(),
    operator: operator || "همراه اول",
    title: title || "کارت شارژ ۱۰,۰۰۰ ریالی",
    faceValue: faceValue || "۱۰,۰۰۰ ریال",
    pointsCost: Number(pointsCost) || 100,
    codeRaw,
    codeEncrypted: masked,
    isRedeemed: false
  };

  chargeInventory.unshift(newItem);
  addAuditLog("افزودن کارت شارژ به انبار", "Admin", `کارت شارژ جدید ${title} در انبار ذخیره شد.`, req);

  res.json({ success: true, item: newItem });
});

app.post("/api/admin/charge-inventory/edit/:id", (req, res) => {
  const { id } = req.params;
  const { operator, title, faceValue, pointsCost, codeRaw } = req.body;

  const item = chargeInventory.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: "محصول مورد نظر یافت نشد." });

  if (operator) item.operator = operator;
  if (title) item.title = title;
  if (faceValue) item.faceValue = faceValue;
  if (pointsCost !== undefined) item.pointsCost = Number(pointsCost);
  if (codeRaw) {
    item.codeRaw = codeRaw;
    item.codeEncrypted = "****-****-" + codeRaw.slice(-4);
  }

  addAuditLog("ویرایش کارت شارژ انبار", "Admin", `اطلاعات محصول ${item.title} به‌روزرسانی شد.`, req);
  res.json({ success: true, item });
});

app.delete("/api/admin/charge-inventory/:id", (req, res) => {
  const { id } = req.params;
  const item = chargeInventory.find(i => i.id === id);
  chargeInventory = chargeInventory.filter(i => i.id !== id);
  addAuditLog("حذف کارت شارژ از انبار", "Admin", `محصول ${item?.title || id} از انبار حذف گردید.`, req);
  res.json({ success: true });
});

app.post("/api/admin/toggle-emergency-lock", (req, res) => {
  emergencyLocked = !emergencyLocked;
  addAuditLog("تغییر قفل اضطراری کارت شارژ", "Admin", `قفل اضطراری به ${emergencyLocked ? "فعال" : "غیرفعال"} تغییر یافت.`, req);
  res.json({ success: true, emergencyLocked });
});

// -------------------------------------------------------------
// MODULE 6: Full User Monitoring & Management APIs
app.get("/api/admin/users", (req, res) => {
  const enriched = registeredUsers.map(u => {
    const userAds = adLogs.filter(a => a.userId === u.id || a.userName === u.name).length;
    const userRedeems = chargeRedemptions.filter(r => r.userId === u.id || r.userName === u.name).length;
    return {
      ...u,
      totalAdsWatched: userAds,
      totalRedemptions: userRedeems
    };
  });
  res.json(enriched);
});

app.post("/api/admin/users/:id/update", (req, res) => {
  const { id } = req.params;
  const { name, score, level, diamonds, role, isBlocked } = req.body;

  const user = registeredUsers.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "کاربر یافت نشد." });

  if (name !== undefined) user.name = name;
  if (score !== undefined) user.score = Number(score);
  if (level !== undefined) user.level = Number(level);
  if (diamonds !== undefined) user.diamonds = Number(diamonds);
  if (role !== undefined) user.role = role;
  if (isBlocked !== undefined) user.isBlocked = Boolean(isBlocked);

  addAuditLog("ویرایش مشخصات کاربر", "Admin", `مشخصات کاربر ${user.name} (${user.phoneNumber}) توسط مدیر ویرایش شد.`, req);
  res.json({ success: true, user });
});

app.post("/api/admin/users/:id/toggle-block", (req, res) => {
  const { id } = req.params;
  const user = registeredUsers.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "کاربر یافت نشد." });

  user.isBlocked = !user.isBlocked;
  addAuditLog("تغییر وضعیت مسدودی کاربر", "Admin", `کاربر ${user.name} (${user.phoneNumber}) ${user.isBlocked ? "مسدود" : "رفع مسدودی"} شد.`, req);
  res.json({ success: true, isBlocked: user.isBlocked });
});

// Logs APIs
app.get("/api/admin/ad-logs", (req, res) => res.json(adLogs));
app.get("/api/admin/audit-logs", (req, res) => res.json(auditLogs));

// Admin Authentication & Credentials State
let adminCredentials = {
  username: "adminuser",
  password: "adminpass"
};

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === adminCredentials.username && password === adminCredentials.password) {
    addAuditLog("ورود موفق مدیر", username, "مدیر با موفقیت وارد پنل شد.", req);
    return res.json({
      success: true,
      token: "adm_session_" + Date.now(),
      admin: { username, role: "admin" }
    });
  } else {
    addAuditLog("تلاش ناموفق ورود به پنل مدیریت", username || "ناشناس", "ورود ناموفق با یوزرنیم یا پسورد اشتباه", req);
    return res.status(401).json({
      success: false,
      error: "نام کاربری یا کلمه عبور اشتباه است."
    });
  }
});

app.get("/api/admin/credentials", (req, res) => {
  res.json({ username: adminCredentials.username });
});

app.post("/api/admin/credentials/update", (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  if (currentPassword !== adminCredentials.password) {
    return res.status(400).json({ error: "کلمه عبور فعلی نادرست است." });
  }

  if (newUsername) adminCredentials.username = newUsername.trim();
  if (newPassword) adminCredentials.password = newPassword.trim();

  addAuditLog("تغییر مشخصات ورود مدیریت", adminCredentials.username, "نام کاربری و کلمه عبور مدیر در دیتابیس به‌روزرسانی شد.", req);
  res.json({ success: true, message: "اطلاعات ورود مدیر با موفقیت به‌روزرسانی شد.", username: adminCredentials.username });
});

// Integration with Vite
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
