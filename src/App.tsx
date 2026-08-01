import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  User,
  Home,
  ArrowLeft,
  Check,
  X,
  Clock,
  Smartphone,
  Send,
  Share2,
  MessageSquare,
  Gift,
  Download,
  Wifi,
  WifiOff,
  Database,
  AlertCircle,
  Coins,
  Lock,
  Compass,
  ArrowRight
} from "lucide-react";

import SimCardIllustration from "./components/SimCardIllustration";
import PointsInsufficientModal from "./components/PointsInsufficientModal";
import {
  Question,
  UserProfile,
  ClaimedCharge,
  LeaderboardEntry,
  ScreenType,
  GameModeInfo,
  MessageItem
} from "./types";

// App Game Modes matching screenshots
const GAME_MODES_LIST: GameModeInfo[] = [
  {
    id: "warmup",
    name: "دست گرمی",
    englishId: "Warm-up",
    entryFee: 5,
    rewardPoints: 10,
    bgGradient: "from-blue-500/20 to-blue-600/40 border-blue-500/30"
  },
  {
    id: "serious",
    name: "محک جدی",
    englishId: "Serious Test",
    entryFee: 10,
    rewardPoints: 20,
    bgGradient: "from-purple-500/20 to-purple-600/40 border-purple-500/30"
  },
  {
    id: "challenge",
    name: "چالش واقعی",
    englishId: "Real Challenge",
    entryFee: 25,
    rewardPoints: 50,
    bgGradient: "from-amber-500/20 to-amber-600/40 border-amber-500/30"
  },
  {
    id: "deathmatch",
    name: "مرگ و زندگی",
    englishId: "Life & Death",
    entryFee: 100,
    rewardPoints: 200,
    bgGradient: "from-red-500/20 to-red-600/40 border-red-500/30"
  }
];

const CATEGORIES_LIST = [
  { id: "general", name: "عمومی" },
  { id: "history", name: "تاریخی" },
  { id: "sports", name: "ورزشی" },
  { id: "cinema", name: "سینما" },
  { id: "art", name: "هنری" },
  { id: "religious", name: "مذهبی" },
  { id: "geography", name: "جغرافیا" },
  { id: "math", name: "ریاضی" },
  { id: "literature", name: "ادبیات" },
  { id: "political", name: "سیاسی" }
];

export default function App() {
  // Navigation & User Session State
  const [screen, setScreen] = useState<ScreenType>("SPLASH");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [downloadedPack, setDownloadedPack] = useState<{
    version: string;
    questions: Question[];
    downloadedAt: string;
  } | null>(null);

  // Authentication UI Input State
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [otpInput, setOtpInput] = useState<string>("");
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Active Gameplay Selection State
  const [selectedMode, setSelectedMode] = useState<GameModeInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isNotEnoughPointsOpen, setIsNotEnoughPointsOpen] = useState<boolean>(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false);

  // Active Quiz Playing State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [timer, setTimer] = useState<number>(60);
  const [answersHistory, setAnswersHistory] = useState<boolean[]>([]);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Lists & Mock Elements
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [claimedCharges, setClaimedCharges] = useState<ClaimedCharge[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string>("");

  // Refs
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load local persistence on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("vira_quiz_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedPack = localStorage.getItem("vira_quiz_offline_pack");
    if (savedPack) {
      setDownloadedPack(JSON.parse(savedPack));
    }

    const savedCharges = localStorage.getItem("vira_quiz_charges");
    if (savedCharges) {
      setClaimedCharges(JSON.parse(savedCharges));
    }

    // Default messages
    setMessages([
      {
        id: "msg_1",
        title: "به مسابقه بزرگ ویرا خوش آمدید!",
        body: "مسابقه هیجان‌انگیز ویرا با برترین سوالات تریویا هم‌اکنون به صورت آنلاین و آفلاین در دسترس شماست. امتیاز جمع کنید و آن را به شارژ سیم‌کارت تبدیل کنید!",
        date: "۱۴۰۵/۰۴/۲۷",
        read: false
      },
      {
        id: "msg_2",
        title: "هدیه خوش‌آمدگویی فعال شد",
        body: "به پاس همراهی شما، ۵۰ امتیاز هدیه به صورت خودکار به کیف‌پول شما واریز شد.",
        date: "۱۴۰۵/۰۴/۲۷",
        read: true
      }
    ]);

    // Fetch initial leaderboard online
    fetchLeaderboard();
  }, []);

  // Save User profile to localStorage on change
  const saveUserToStorage = (updatedUser: UserProfile | null) => {
    setUser(updatedUser);
    if (updatedUser) {
      localStorage.setItem("vira_quiz_user", JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem("vira_quiz_user");
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.warn("Failed to fetch live leaderboard, utilizing local leaderboard mock.");
      setLeaderboard([
        { rank: 1, name: "ترابی", score: 3931 },
        { rank: 2, name: "۰۹۱۲******۶", score: 1450 },
        { rank: 3, name: "۰۹۱۲******۷", score: 950 },
        { rank: 4, name: "آرش دادیار", score: 820 },
        { rank: 5, name: "سارا حسینی", score: 640 }
      ]);
    }
  };

  // Dynamic feedback notifier helper
  const triggerNotification = (text: string) => {
    setActionFeedback(text);
    setTimeout(() => {
      setActionFeedback("");
    }, 4000);
  };

  // Authentication Flow
  const handleSendOtp = async () => {
    if (!phoneInput || !phoneInput.match(/^09\d{9}$/)) {
      setAuthError("لطفاً یک شماره معتبر با قالب 09123456789 وارد کنید");
      return;
    }
    setAuthError("");
    setIsAuthenticating(true);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneInput })
      });
      const data = await res.json();
      if (res.ok) {
        setIsOtpSent(true);
        triggerNotification("کد تایید پیامک شد! (کد تست: 1234)");
      } else {
        setAuthError(data.error || "خطایی در ارسال پیامک رخ داد.");
      }
    } catch (err) {
      // Offline fallback simulation
      setIsOtpSent(true);
      triggerNotification("عدم اتصال به سرور: فعال‌سازی در حالت آفلاین انجام شد (کد: 1234)");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput) {
      setAuthError("لطفاً کد تایید را وارد کنید");
      return;
    }
    setAuthError("");
    setIsAuthenticating(true);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneInput, code: otpInput })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        saveUserToStorage(data.user);
        triggerNotification("با موفقیت وارد حساب خود شدید!");
        setScreen("DASHBOARD");
      } else {
        setAuthError(data.error || "کد فعال‌سازی نادرست است.");
      }
    } catch (err) {
      // Offline mock login
      if (otpInput === "1234") {
        const masked = phoneInput.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2");
        const mockUser = {
          phoneNumber: phoneInput,
          maskedPhone: masked,
          name: "کاربر مهمان (آفلاین)",
          score: 250
        };
        saveUserToStorage(mockUser);
        triggerNotification("کد پذیرفته شد. خوش آمدید!");
        setScreen("DASHBOARD");
      } else {
        setAuthError("کد فعال‌سازی نامعتبر است (از ۱۲۳۴ استفاده کنید)");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Download complete question bank to LocalStorage
  const handleDownloadQuestionPack = async () => {
    try {
      const res = await fetch("/api/questions/download-pack");
      if (res.ok) {
        const data = await res.json();
        setDownloadedPack(data);
        localStorage.setItem("vira_quiz_offline_pack", JSON.stringify(data));
        triggerNotification("بانک سوالات با موفقیت دانلود شد! اکنون می‌توانید آفلاین بازی کنید.");
      } else {
        triggerNotification("خطا در دانلود بسته سوالات.");
      }
    } catch (err) {
      triggerNotification("برای دانلود بسته سوالات باید به اینترنت متصل باشید.");
    }
  };

  // Handle Game Mode Choice
  const handleSelectGameMode = (mode: GameModeInfo) => {
    if (!user) {
      setScreen("AUTH");
      return;
    }

    if (user.score < mode.entryFee) {
      setSelectedMode(mode);
      setIsNotEnoughPointsOpen(true);
      return;
    }

    setSelectedMode(mode);
    setScreen("CONFIRM_TOPIC");
  };

  // Select Topic Options
  const handleChooseRandomTopic = () => {
    if (!selectedMode || !user) return;

    // Deduct entry point cost from profile
    const updatedUser = {
      ...user,
      score: user.score - selectedMode.entryFee
    };
    saveUserToStorage(updatedUser);

    const randomCategory = CATEGORIES_LIST[Math.floor(Math.random() * CATEGORIES_LIST.length)].name;
    setSelectedCategory(randomCategory);
    startQuizGame(selectedMode, randomCategory);
  };

  const handleSelectCustomTopic = () => {
    setScreen("SELECT_CATEGORY");
  };

  // Confirm Custom Category Selection
  const handleConfirmCustomCategory = (categoryName: string) => {
    if (!selectedMode || !user) return;

    const extraFee = 1; // Custom category select costs 1 extra point as displayed in original images
    const totalCost = selectedMode.entryFee + extraFee;

    if (user.score < totalCost) {
      triggerNotification("امتیاز کافی برای انتخاب موضوع اختصاصی ندارید (هزینه اضافه: ۱ امتیاز)");
      return;
    }

    const updatedUser = {
      ...user,
      score: user.score - totalCost
    };
    saveUserToStorage(updatedUser);
    setSelectedCategory(categoryName);
    startQuizGame(selectedMode, categoryName);
  };

  // Initialize Game Logic & Load Questions
  const startQuizGame = async (mode: GameModeInfo, categoryName: string) => {
    setIsLoadingQuiz(true);
    setScreen("QUIZ");
    setQuestions([]);
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setAnswersHistory([]);
    setQuizFinished(false);
    setTimer(60);

    // If Offline Mode or Internet failure, pull from local offline storage cache!
    if (offlineMode) {
      const localPack = downloadedPack?.questions || [];
      const filtered = localPack.filter(q => q.category === categoryName);
      const chosen = (filtered.length > 0 ? filtered : localPack)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      if (chosen.length === 0) {
        // Fallback to static staticQuestions import
        const fallbackList = require("./questionsData").staticQuestions;
        const fallbackFiltered = fallbackList.filter((q: any) => q.category === categoryName);
        setQuestions((fallbackFiltered.length > 0 ? fallbackFiltered : fallbackList).slice(0, 3));
      } else {
        setQuestions(chosen);
      }
      setIsLoadingQuiz(false);
      startTimerCountdown();
      return;
    }

    // Online dynamic generation via backend (uses Gemini)
    try {
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: categoryName, count: 3 })
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        if (data.source === "gemini-ai") {
          triggerNotification("بسته سوالات هوشمند با هوش مصنوعی جمینی ساخته شد!");
        } else {
          triggerNotification("اتصال برقرار شد، بسته سوالات محلی سرور بارگذاری گردید.");
        }
      } else {
        throw new Error("Server failed");
      }
    } catch (e) {
      // Graceful offline fallback
      const localPack = downloadedPack?.questions || [];
      const filtered = localPack.filter(q => q.category === categoryName);
      const chosen = (filtered.length > 0 ? filtered : localPack)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      setQuestions(chosen);
      triggerNotification("بازی به دلیل قطع اینترنت در حالت پشتیبان آفلاین شروع شد.");
    } finally {
      setIsLoadingQuiz(false);
      startTimerCountdown();
    }
  };

  // Timer loop
  const startTimerCountdown = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setTimer(60);

    countdownIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          // Timer ran out! Unanswered question treated as incorrect
          handleAnswerSelect(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Answer selection callback
  const handleAnswerSelect = (optionIdx: number) => {
    if (selectedOptionIdx !== null) return; // Prevent double answers
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setSelectedOptionIdx(optionIdx);
    const activeQuestion = questions[currentQuestionIdx];
    const isCorrect = optionIdx === activeQuestion?.correctOptionIndex;

    // Append to answer history (green or red progress bubbles)
    const updatedHistory = [...answersHistory, isCorrect];
    setAnswersHistory(updatedHistory);

    // After 1.8 seconds delay, transition to next question or complete quiz
    setTimeout(() => {
      if (currentQuestionIdx < 2 && currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
        setSelectedOptionIdx(null);
        startTimerCountdown();
      } else {
        // Quiz completed
        completeQuizGame(updatedHistory);
      }
    }, 1800);
  };

  const completeQuizGame = async (finalHistory: boolean[]) => {
    if (!selectedMode || !user) return;

    // Calculate correct answers
    const corrects = finalHistory.filter(h => h === true).length;
    const isSuccess = corrects === 3; // Fully solved

    let rewardEarned = 0;
    if (isSuccess) {
      rewardEarned = selectedMode.rewardPoints;
    }

    // Update user local points
    const newScore = user.score + rewardEarned;
    const updatedUser = {
      ...user,
      score: newScore
    };
    saveUserToStorage(updatedUser);

    setQuizFinished(true);
    setScreen("GAME_OVER");

    // Submit online score if connected
    if (!offlineMode) {
      try {
        await fetch("/api/leaderboard/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.name,
            score: newScore,
            phoneNumber: user.phoneNumber
          })
        });
        fetchLeaderboard(); // Update rankings
      } catch (e) {
        console.warn("Could not submit score to online server leaderboard.");
      }
    }
  };

  // Gift claiming helper (Adds 50 points)
  const handleClaimDailyGift = () => {
    if (!user) return;
    const updatedUser = {
      ...user,
      score: user.score + 50
    };
    saveUserToStorage(updatedUser);
    triggerNotification("هدیه روزانه ۵۰ امتیاز به کیف‌پول شما افزوده شد!");
  };

  // Points redemption store logic
  const handleRedeemCharge = (pointsCost: number, title: string) => {
    if (!user) return;
    if (user.score < pointsCost) {
      triggerNotification("امتیاز شما برای دریافت این کارت شارژ کافی نیست.");
      return;
    }

    const newCharge: ClaimedCharge = {
      id: "ch_" + Date.now(),
      title: title,
      pointsCost: pointsCost,
      date: new Date().toLocaleDateString("fa-IR")
    };

    const updatedCharges = [newCharge, ...claimedCharges];
    setClaimedCharges(updatedCharges);
    localStorage.setItem("vira_quiz_charges", JSON.stringify(updatedCharges));

    const updatedUser = {
      ...user,
      score: user.score - pointsCost
    };
    saveUserToStorage(updatedUser);

    triggerNotification(`با موفقیت خرید شد! کد شارژ ارسال خواهد شد. از بخش هدایا مشاهده کنید.`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#06080c] text-white p-2 md:p-6 select-none font-sans overflow-x-hidden">
      {/* Simulation Notification Top Bar */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 z-50 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm px-6 py-3 rounded-full shadow-2xl flex items-center gap-3"
            dir="rtl"
          >
            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>{actionFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Mobile Screen Wrapper */}
      <div className="relative w-full max-w-[420px] h-[850px] bg-[#0b0c10] border-4 border-slate-800 rounded-[42px] shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        
        {/* Device Notch Header */}
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-950 flex justify-center items-center z-40">
          <div className="w-28 h-4 bg-[#0b0c10] rounded-b-xl border-x border-b border-slate-800" />
        </div>

        {/* Dynamic Screen Delivery */}
        <div className="flex-1 pt-6 overflow-y-auto overflow-x-hidden relative flex flex-col pb-16">
          
          {/* Splash Screen */}
          {screen === "SPLASH" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full bg-gradient-to-b from-slate-900 via-slate-950 to-[#07080c]"
            >
              {/* Vira glowing logo container */}
              <div className="relative mb-8 p-6 flex justify-center items-center">
                <div className="absolute w-44 h-44 rounded-full bg-amber-500/10 blur-2xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-amber-500/30 w-36 h-36 rounded-[32px] flex items-center justify-center shadow-[0_15px_40px_rgba(245,158,11,0.2)]">
                  <div className="flex flex-col items-center">
                    {/* Lightbulb glowing outline */}
                    <div className="text-amber-500 text-4xl font-extrabold animate-bounce duration-1000">💡</div>
                    <span className="text-amber-400 font-extrabold text-2xl tracking-widest mt-2">ویرا</span>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold tracking-wide text-white mb-2">مسابقه هوش و اطلاعات عمومی</h2>
              <p className="text-slate-400 text-sm max-w-xs mb-10 leading-relaxed">
                بازی کن، امتیاز کسب کن، در رقابت‌های جهانی شرکت کن و جایزه بگیر!
              </p>

              <button
                id="splash-start-btn"
                onClick={() => setScreen(user ? "DASHBOARD" : "AUTH")}
                className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-lg rounded-2xl transition duration-300 shadow-xl shadow-orange-500/20 w-3/4 animate-pulse"
              >
                بزن بریم!
              </button>
            </motion.div>
          )}

          {/* Authentication Page */}
          {screen === "AUTH" && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex-1 flex flex-col p-6"
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-200">فعال‌سازی کاربری</h2>
                <button onClick={() => setScreen("SPLASH")} className="p-2 rounded-full hover:bg-slate-800">
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* SIM Card Illustration */}
              <SimCardIllustration />

              <div className="text-center mb-6">
                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  شماره موبایل را وارد کرده و کد فعال‌سازی را از طریق پیامک دریافت کنید
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  (برای شروع تست می‌توانید شماره دلخواه خود را وارد کنید)
                </p>
              </div>

              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-center gap-2 text-red-400 text-xs text-right">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-4">
                {!isOtpSent ? (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-medium">شماره تلفن همراه</label>
                    <div className="relative">
                      <Smartphone className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
                      <input
                        id="phone-input"
                        type="text"
                        maxLength={11}
                        placeholder="09120252467"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full py-3.5 pr-12 pl-4 bg-slate-900 border border-slate-800 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-center font-bold tracking-widest text-lg text-white"
                      />
                    </div>

                    <button
                      id="send-otp-btn"
                      disabled={isAuthenticating}
                      onClick={handleSendOtp}
                      className="w-full mt-4 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black rounded-xl transition duration-200 shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
                    >
                      {isAuthenticating ? "درحال ارسال..." : "ارسال کد فعال‌سازی"}
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-medium">کد فعال‌سازی پیامک شده</label>
                    <div className="relative">
                      <Send className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
                      <input
                        id="otp-input"
                        type="text"
                        maxLength={4}
                        placeholder="کد تست: 1234"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="w-full py-3.5 pr-12 pl-4 bg-slate-900 border border-slate-800 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-center font-bold tracking-widest text-lg text-white"
                      />
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        id="verify-otp-btn"
                        disabled={isAuthenticating}
                        onClick={handleVerifyOtp}
                        className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-xl transition duration-200 shadow-md"
                      >
                        {isAuthenticating ? "تایید..." : "تایید کد فعال‌سازی"}
                      </button>
                      <button
                        id="resend-otp-btn"
                        onClick={() => setIsOtpSent(false)}
                        className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                      >
                        اصلاح شماره
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Guest Login Skip Button */}
              <button
                id="auth-guest-btn"
                onClick={() => {
                  const guest = {
                    phoneNumber: "09990001122",
                    maskedPhone: "0999****122",
                    name: "مهمان موقت",
                    score: 185
                  };
                  saveUserToStorage(guest);
                  setScreen("DASHBOARD");
                }}
                className="mt-auto py-3 text-slate-500 hover:text-slate-300 text-xs font-bold underline"
              >
                ورود به عنوان مهمان بدون شماره (تست سریع)
              </button>
            </motion.div>
          )}

          {/* Dashboard (Main Menu) */}
          {screen === "DASHBOARD" && user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col p-6"
              dir="rtl"
            >
              {/* Header profile & status panel */}
              <div className="flex items-center justify-between mb-6 bg-slate-900/50 p-3 rounded-2xl border border-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{user.name}</h3>
                    <p className="text-xs text-slate-400">{user.maskedPhone}</p>
                  </div>
                </div>

                {/* Connection Status Switch */}
                <button
                  id="connection-toggle-btn"
                  onClick={() => {
                    setOfflineMode(!offlineMode);
                    triggerNotification(
                      !offlineMode
                        ? "حالت بازی آفلاین فعال شد! سوالات از حافظه دانلود شده لود می‌شوند."
                        : "حالت بازی آنلاین فعال شد! سوالات به صورت زنده از سرور لود می‌شوند."
                    );
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition duration-200 ${
                    offlineMode
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                      : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {offlineMode ? (
                    <>
                      <WifiOff className="w-3.5 h-3.5" />
                      آفلاین (حافظه)
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3.5 h-3.5" />
                      آنلاین (سرور)
                    </>
                  )}
                </button>
              </div>

              {/* Total points banner matching screenshots */}
              <div className="relative mb-6 text-center bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-inner">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-0.5 bg-slate-950 text-[10px] text-slate-400 rounded-full border border-slate-800">
                  امتیاز کل کیف پول
                </div>
                <div className="text-5xl font-black text-amber-500 my-2 tracking-wide flex items-center justify-center gap-2">
                  <span>{user.score}</span>
                  <Coins className="w-8 h-8 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                </div>
                <div className="text-xs text-slate-400 font-medium">امتیاز من</div>
              </div>

              {/* Caching/Bank controller message for the specific user request */}
              {offlineMode && !downloadedPack && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mb-6 flex flex-col gap-2">
                  <div className="flex gap-2 text-amber-400 text-xs font-bold">
                    <Database className="w-4 h-4 flex-shrink-0" />
                    <span>بانک سوالات محلی شما خالی است!</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    برای بازی در حالت بدون اینترنت، ابتدا به اینترنت متصل شده و بسته سوالات را دانلود کنید تا در حافظه موبایل شما بماند.
                  </p>
                  <button
                    id="download-pack-btn"
                    onClick={handleDownloadQuestionPack}
                    className="mt-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    دانلود پکیج کامل سوالات (۳۰ سوال کامل)
                  </button>
                </div>
              )}

              {downloadedPack && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-200">بسته سوالات ذخیره شده</p>
                      <p className="text-[9px] text-slate-400">تعداد: {downloadedPack.questions.length} سوال | نسخه {downloadedPack.version}</p>
                    </div>
                  </div>
                  <button
                    id="redownload-pack-btn"
                    onClick={handleDownloadQuestionPack}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    title="به‌روزرسانی بسته سوالات"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Action grid dashboard buttons matching screenshots */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  id="nav-store-btn"
                  onClick={() => setScreen("CHARGE_STORE")}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition duration-200 text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">تبدیل امتیاز به شارژ</span>
                </button>

                <button
                  id="nav-inbox-btn"
                  onClick={() => setScreen("INBOX")}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition duration-200 text-center relative"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">صندوق پیام</span>
                  {messages.some(m => !m.read) && (
                    <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </button>

                <button
                  id="claim-gift-btn"
                  onClick={handleClaimDailyGift}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition duration-200 text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">دریافت امتیاز هدیه</span>
                </button>

                <button
                  id="referral-code-btn"
                  onClick={() => {
                    const code = prompt("کد معرف دوست خود را وارد کنید:");
                    if (code) {
                      const bonus = 25;
                      const updated = { ...user, score: user.score + bonus };
                      saveUserToStorage(updated);
                      triggerNotification(`کد معرف ثبت شد! ۲۵ امتیاز هدیه به شما و معرف اهدا شد.`);
                    }
                  }}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition duration-200 text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">ثبت کد معرّف</span>
                </button>
              </div>

              {/* Main Play CTA Button matching screen image */}
              <button
                id="dashboard-play-btn"
                onClick={() => setScreen("GAME_MODES")}
                className="w-full mt-auto py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-base rounded-2xl transition duration-200 shadow-xl shadow-orange-500/20 text-center"
              >
                بازی کن و امتیازت رو افزایش بده
              </button>
            </motion.div>
          )}

          {/* Level Game Modes (چند مرده حلاجی؟) */}
          {screen === "GAME_MODES" && user && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col p-6"
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">چند مرده حلاجی؟</h2>
                </div>
                <button onClick={() => setScreen("DASHBOARD")} className="p-2 rounded-full hover:bg-slate-800">
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Modes loop */}
              <div className="space-y-4 flex-1">
                {GAME_MODES_LIST.map((mode) => (
                  <button
                    id={`mode-card-${mode.id}`}
                    key={mode.id}
                    onClick={() => handleSelectGameMode(mode)}
                    className={`w-full bg-slate-900 border hover:border-amber-500/50 p-4 rounded-2xl flex items-center justify-between text-right transition duration-200 group relative overflow-hidden`}
                  >
                    {/* Inner color tint decoration */}
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-amber-500" />

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-slate-400 font-medium">ورودی</span>
                        <span className="text-xs font-black text-amber-400">{mode.entryFee}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white group-hover:text-amber-400 transition">{mode.name}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">مسابقه چالش‌برانگیز ۳ سوالی</p>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block font-medium">جایزه نهایی</span>
                      <span className="text-sm font-black text-emerald-400">+{mode.rewardPoints} امتیاز</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center p-3 mt-6 bg-slate-950 border border-slate-900 rounded-xl">
                <span className="text-xs text-slate-400">موجودی فعلی شما: <strong className="text-amber-400">{user.score} امتیاز</strong></span>
              </div>
            </motion.div>
          )}

          {/* Level Entrance Options (تصادفی vs خودم انتخاب می‌کنم) */}
          {screen === "CONFIRM_TOPIC" && selectedMode && user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col p-6"
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white">{selectedMode.name}</h2>
                <button onClick={() => setScreen("GAME_MODES")} className="p-2 rounded-full hover:bg-slate-800">
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Mode cost badge */}
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
                  هزینه ورود: {selectedMode.entryFee} امتیاز
                </div>
                <h3 className="text-sm text-slate-300 font-bold mt-6 mb-2">موضوع سوال‌ها را چگونه انتخاب می‌کنی؟</h3>
                <p className="text-xs text-slate-500">انتخاب موضوع اختصاصی نیاز به پرداخت امتیاز اضافی دارد</p>
              </div>

              <div className="space-y-4 flex-1">
                {/* Random selection option */}
                <button
                  id="topic-random-btn"
                  onClick={handleChooseRandomTopic}
                  className="w-full bg-gradient-to-br from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-slate-950 p-5 rounded-2xl flex items-center justify-between text-right transition duration-200 shadow-xl shadow-orange-500/10"
                >
                  <div>
                    <h4 className="font-black text-sm">موضوع تصادفی (رایگان)</h4>
                    <p className="text-[10px] text-slate-900 mt-0.5">سیستم به صورت کاملا رندوم موضوعی انتخاب می‌کند</p>
                  </div>
                  <div className="px-3 py-1 bg-slate-950/20 text-slate-950 text-xs font-bold rounded-lg">
                    رایگان
                  </div>
                </button>

                {/* Selective selection option */}
                <button
                  id="topic-custom-btn"
                  onClick={handleSelectCustomTopic}
                  className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 p-5 rounded-2xl flex items-center justify-between text-right transition duration-200"
                >
                  <div>
                    <h4 className="font-bold text-sm text-white">خودم انتخاب می‌کنم</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">دسته‌بندی سوال را خودت مشخص کن</p>
                  </div>
                  <div className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/20">
                    هزینه: ۲ امتیاز
                  </div>
                </button>
              </div>

              <p className="text-[10px] text-slate-500 text-center mt-auto">
                مطمئنید که می‌خواهید وارد مسابقه شوید؟ پس از شروع امکان لغو وجود ندارد.
              </p>
            </motion.div>
          )}

          {/* Category Selection Grid (انتخاب موضوع) */}
          {screen === "SELECT_CATEGORY" && selectedMode && user && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex flex-col p-6"
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">انتخاب موضوع</h2>
                <button onClick={() => setScreen("CONFIRM_TOPIC")} className="p-2 rounded-full hover:bg-slate-800">
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4 text-center leading-relaxed">
                یکی از دسته‌بندی‌های زیر را برای ساخت مسابقه انتخاب کنید. (هزینه انتخاب موضوع اختصاصی ۱ امتیاز آب می‌خورد)
              </p>

              {/* Grid 2x5 of categories matching screenshots */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {CATEGORIES_LIST.map((cat) => (
                  <button
                    id={`category-item-${cat.id}`}
                    key={cat.id}
                    onClick={() => handleConfirmCustomCategory(cat.name)}
                    className="py-3.5 px-4 bg-slate-900 border border-slate-800/80 hover:border-amber-500 text-white hover:text-amber-400 font-bold text-xs rounded-xl transition text-center shadow-sm"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Link pick random */}
              <div className="text-center mt-auto">
                <p className="text-[11px] text-slate-400 mb-3">
                  مطمئنید که می‌خواهید یک امتیاز خرج کنید و این موضوع را انتخاب کنید؟
                </p>
                <button
                  id="category-cancel-btn"
                  onClick={handleChooseRandomTopic}
                  className="text-xs text-amber-500 hover:text-amber-400 underline font-bold"
                >
                  نه! یک موضوع تصادفی انتخاب کن
                </button>
              </div>
            </motion.div>
          )}

          {/* Quiz Active Play Screen */}
          {screen === "QUIZ" && selectedMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col p-6 h-full relative"
              dir="rtl"
            >
              {/* Header Details */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs text-amber-400 font-black">{selectedMode.name}</span>
                  <span className="text-[10px] text-slate-500 mx-1.5">|</span>
                  <span className="text-xs text-slate-300 font-medium">{selectedCategory}</span>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg">
                  {selectedMode.rewardPoints} امتیاز
                </div>
              </div>

              {isLoadingQuiz ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm text-slate-400 font-bold">درحال دانلود پکیج سوالات...</p>
                  <p className="text-xs text-slate-500 mt-2">اتصال با هوش مصنوعی برقرار می‌شود</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <AlertCircle className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
                  <p className="text-sm text-red-400 font-bold mb-4">خطا در بارگذاری سوالات!</p>
                  <button
                    id="retry-quiz-btn"
                    onClick={() => startQuizGame(selectedMode, selectedCategory || "عمومی")}
                    className="px-6 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
                  >
                    تلاش مجدد
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* Progress Bubble state matching screenshot 2 */}
                  <div className="flex justify-between items-center gap-3 mb-6 bg-slate-900/50 p-2.5 rounded-xl border border-slate-850">
                    {["اول", "دوم", "سوم"].map((numStr, idx) => {
                      const wasAnswered = idx < answersHistory.length;
                      const wasCorrect = wasAnswered ? answersHistory[idx] : null;

                      let bubbleStyle = "border-slate-700 text-slate-400 bg-transparent";
                      if (idx === currentQuestionIdx && selectedOptionIdx === null) {
                        bubbleStyle = "border-amber-500 text-amber-500 bg-amber-500/5 animate-pulse font-bold";
                      } else if (wasAnswered) {
                        bubbleStyle = wasCorrect
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold"
                          : "bg-red-500/10 border-red-500 text-red-400 font-bold";
                      }

                      return (
                        <div
                          id={`progress-bubble-${idx}`}
                          key={idx}
                          className={`flex-1 py-1.5 px-2 border rounded-full text-[11px] text-center transition duration-300 ${bubbleStyle}`}
                        >
                          سوال {numStr}
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Question Panel */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 mb-6 shadow-inner text-center min-h-[140px] flex items-center justify-center">
                    <h3 className="text-base font-bold text-white leading-relaxed">
                      {questions[currentQuestionIdx]?.questionText}
                    </h3>
                  </div>

                    {/* Choices loop */}
                  <div className="space-y-3 flex-1 justify-center flex flex-col">
                    {questions[currentQuestionIdx]?.options.map((option, idx) => {
                      const isSelected = selectedOptionIdx === idx;
                      const isCorrectAnswer = idx === questions[currentQuestionIdx]?.correctOptionIndex;
                      const hasAnswered = selectedOptionIdx !== null;

                      let buttonStyle = "bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-850 hover:border-slate-700";
                      let iconEl = null;

                      if (hasAnswered) {
                        if (isCorrectAnswer) {
                          buttonStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold";
                          iconEl = <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
                        } else if (isSelected) {
                          buttonStyle = "bg-red-500/10 border-red-500 text-red-400 font-bold";
                          iconEl = <X className="w-5 h-5 text-red-400 flex-shrink-0" />;
                        } else {
                          buttonStyle = "bg-slate-950/40 border-slate-900 text-slate-500 opacity-60";
                        }
                      }

                      return (
                        <button
                          id={`option-btn-${idx}`}
                          key={idx}
                          disabled={hasAnswered}
                          onClick={() => handleAnswerSelect(idx)}
                          className={`w-full py-4 px-5 border rounded-2xl flex items-center justify-between text-right transition duration-150 ${buttonStyle}`}
                        >
                          <span className="text-sm font-medium">{option}</span>
                          {iconEl}
                        </button>
                      );
                    })}
                  </div>

                  {/* Timer Display at bottom inside countdown circle */}
                  <div className="mt-auto pt-4 flex flex-col items-center">
                    <div className="relative w-16 h-16 rounded-full border-4 border-orange-500/20 flex items-center justify-center bg-slate-900 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                      {/* Active ticking outline */}
                      <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 border-r-orange-500 animate-spin duration-3000 opacity-60" />
                      <span className="text-xl font-black text-orange-400">{timer}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">زمان باقی مانده</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Game Over Screen */}
          {screen === "GAME_OVER" && selectedMode && user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col p-6 justify-center items-center text-center"
              dir="rtl"
            >
              {/* Correct answers header banner */}
              <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black px-4 py-1.5 rounded-full mb-6">
                {answersHistory.filter(h => h === true).length} پاسخ صحیح
              </div>

              {/* Status Visual Face Emoji */}
              {answersHistory.filter(h => h === true).length === 3 ? (
                <div className="mb-6">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-5xl mx-auto shadow-[0_0_25px_rgba(16,185,129,0.2)] animate-bounce">
                    🏆
                  </div>
                  <h3 className="text-xl font-extrabold text-emerald-400 mt-4 mb-2">برد شیرین!</h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    تبریک! بازی را با موفقیت به پایان رساندید و جایزه را در آغوش کشیدید!
                  </p>
                  <p className="text-sm font-black text-emerald-400 mt-4">
                    +{selectedMode.rewardPoints} امتیاز هدیه
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  {/* Sad face emoji match image 3 */}
                  <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-5xl mx-auto shadow-[0_0_25px_rgba(239,68,68,0.2)]">
                    😔
                  </div>
                  <h3 className="text-lg font-extrabold text-red-400 mt-4 mb-2">باختی!</h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    بازی را با موفقیت به پایان نرساندید. نگران نباش، دست بعدی بهتر میزنی!
                  </p>
                  <p className="text-sm font-black text-red-400 mt-4">
                    -{selectedMode.entryFee} امتیاز ورودی
                  </p>
                </div>
              )}

              {/* Bottom stats panel */}
              <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 my-6 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>نام کاربری:</span>
                  <span className="font-bold text-white">{user.name}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>موجودی جدید شما:</span>
                  <span className="font-bold text-amber-400">{user.score} امتیاز</span>
                </div>
              </div>

              <button
                id="gameover-home-btn"
                onClick={() => setScreen("DASHBOARD")}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-sm rounded-2xl transition shadow-lg shadow-orange-500/10"
              >
                بازگشت به صفحه اصلی
              </button>
            </motion.div>
          )}

          {/* Leaderboard Screen */}
          {screen === "LEADERBOARD" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col p-6"
              dir="rtl"
            >
              <h2 className="text-xl font-bold text-white text-center mb-6">برترین کاربران</h2>

              {/* Podiums or highscore list */}
              <div className="space-y-3 flex-1">
                {leaderboard.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-8">درحال دریافت رده‌بندی...</div>
                ) : (
                  leaderboard.map((player) => {
                    const isSelf = user && (player.name === user.name || player.name === user.maskedPhone);
                    return (
                      <div
                        id={`leaderboard-player-${player.rank}`}
                        key={player.rank}
                        className={`flex items-center justify-between p-4 rounded-xl border transition ${
                          isSelf
                            ? "bg-orange-500/10 border-orange-500 text-orange-400 font-bold"
                            : "bg-slate-900 border-slate-800 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 w-5 text-center">{player.rank}</span>
                          <span className="text-sm font-bold">{player.name}</span>
                        </div>
                        <span className="text-sm font-black font-mono">{player.score}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {offlineMode && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-center rounded-xl text-xs flex items-center justify-center gap-1.5">
                  <WifiOff className="w-4 h-4 flex-shrink-0" />
                  <span>درحال نمایش آفلاین. برای ثبت امتیاز آنلاین شوید.</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Profile Screen */}
          {screen === "PROFILE" && user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col p-6"
              dir="rtl"
            >
              <h2 className="text-xl font-bold text-white text-center mb-6">پروفایل کاربری</h2>

              {/* Profile Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center mb-6">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                  👤
                </div>
                <h3 className="text-base font-bold text-white">{user.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{user.phoneNumber}</p>

                <div className="mt-4 pt-4 border-t border-slate-850 flex justify-around">
                  <div>
                    <span className="text-xs text-slate-500 block">امتیاز من</span>
                    <span className="text-sm font-black text-amber-500">{user.score}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">شارژهای خریده شده</span>
                    <span className="text-sm font-black text-orange-400">{claimedCharges.length} عدد</span>
                  </div>
                </div>
              </div>

              {/* Options list */}
              <div className="space-y-3 flex-1">
                <button
                  id="profile-store-btn"
                  onClick={() => setScreen("CHARGE_STORE")}
                  className="w-full py-4 px-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl flex items-center justify-between text-right text-slate-200 transition"
                >
                  <span className="text-xs font-bold">فروشگاه خرید امتیاز</span>
                  <Smartphone className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  id="profile-gift-btn"
                  onClick={handleClaimDailyGift}
                  className="w-full py-4 px-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl flex items-center justify-between text-right text-slate-200 transition"
                >
                  <span className="text-xs font-bold">دریافت امتیاز هدیه روزانه</span>
                  <Gift className="w-4 h-4 text-slate-400" />
                </button>

                {/* Clear Session / Logout */}
                <button
                  id="profile-logout-btn"
                  onClick={() => {
                    saveUserToStorage(null);
                    setScreen("AUTH");
                    triggerNotification("از حساب خارج شدید.");
                  }}
                  className="w-full py-4 px-5 bg-red-950/20 hover:bg-red-950/30 border border-red-900/30 rounded-2xl flex items-center justify-between text-right text-red-400 transition mt-6"
                >
                  <span className="text-xs font-bold">خروج از حساب کاربری</span>
                  <Lock className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Messages Inbox */}
          {screen === "INBOX" && (
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex flex-col p-6"
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">صندوق پیام‌ها</h2>
                <button onClick={() => setScreen("DASHBOARD")} className="p-2 rounded-full hover:bg-slate-800">
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                {messages.map((msg) => (
                  <div
                    id={`msg-item-${msg.id}`}
                    key={msg.id}
                    className={`p-4 rounded-2xl border ${
                      msg.read ? "bg-slate-900/60 border-slate-800/80" : "bg-orange-500/5 border-orange-500/20"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xs font-black text-white">{msg.title}</h4>
                      <span className="text-[9px] text-slate-500 font-mono">{msg.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{msg.body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Mobile Charge Store */}
          {screen === "CHARGE_STORE" && user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col p-6"
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">تبدیل امتیاز به شارژ</h2>
                <button onClick={() => setScreen("DASHBOARD")} className="p-2 rounded-full hover:bg-slate-800">
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mb-4 text-center leading-relaxed">
                با کسب امتیاز در بازی، می‌توانید آن‌ها را مستقیماً به کدهای شارژ سیم‌کارت سیم‌کارت‌های مختلف تبدیل کنید!
              </p>

              {/* Claims Tab Selector */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-900/80 p-3 rounded-xl text-center border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">امتیاز شما</span>
                  <span className="text-sm font-black text-amber-500">{user.score}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl text-center border border-slate-800 col-span-2 flex items-center justify-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">تعداد شارژ دریافتی</span>
                    <span className="text-xs font-bold text-white">{claimedCharges.length} مورد</span>
                  </div>
                </div>
              </div>

              {/* Charge Options list */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
                <div className="text-xs text-slate-400 font-bold mb-2">دسته‌های شارژ سیم‌کارت:</div>

                {[
                  { title: "کارت شارژ ۲۰۰۰ تومانی ایرانسل", cost: 200 },
                  { title: "کارت شارژ ۵۰۰۰ تومانی همراه اول", cost: 450 },
                  { title: "کارت شارژ ۱۰۰۰۰ تومانی رایتل", cost: 800 }
                ].map((item, idx) => (
                  <div
                    id={`charge-option-${idx}`}
                    key={idx}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      <p className="text-[9px] text-slate-500 mt-1">شارژ فیزیکی به همراه پین کد تایید</p>
                    </div>

                    <button
                      id={`redeem-btn-${idx}`}
                      onClick={() => handleRedeemCharge(item.cost, item.title)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 text-[11px] font-black rounded-xl transition duration-150"
                    >
                      {item.cost} امتیاز
                    </button>
                  </div>
                ))}

                {/* History list inside image 14 */}
                {claimedCharges.length > 0 && (
                  <div className="mt-6">
                    <div className="text-xs text-slate-400 font-bold mb-2">لیست شارژهای دریافت شده:</div>
                    <div className="space-y-2">
                      {claimedCharges.map((ch) => (
                        <div
                          id={`claimed-item-${ch.id}`}
                          key={ch.id}
                          className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-medium text-slate-200">{ch.title}</span>
                            <span className="text-[10px] text-slate-500 block mt-1">خریداری شده با {ch.pointsCost} امتیاز</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono">{ch.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </div>

        {/* Global Bottom Tab Bar Navigation matching Image 1 */}
        {screen !== "SPLASH" && screen !== "AUTH" && screen !== "QUIZ" && screen !== "GAME_OVER" && (
          <div className="absolute bottom-0 inset-x-0 h-16 bg-slate-950 border-t border-slate-850 flex items-center justify-around px-4 z-40">
            {/* Tab 1: Leaderboard */}
            <button
              id="tab-leaderboard"
              onClick={() => setScreen("LEADERBOARD")}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
                screen === "LEADERBOARD" ? "text-amber-500 scale-110" : "text-slate-400 hover:text-white"
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="text-[9px] mt-1 font-bold">برترین‌ها</span>
            </button>

            {/* Tab 2: Profile */}
            <button
              id="tab-profile"
              onClick={() => setScreen("PROFILE")}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
                screen === "PROFILE" ? "text-amber-500 scale-110" : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[9px] mt-1 font-bold">پروفایل</span>
            </button>

            {/* Tab 3: Home/Dashboard */}
            <button
              id="tab-home"
              onClick={() => setScreen("DASHBOARD")}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
                screen === "DASHBOARD" ? "text-amber-500 scale-110" : "text-slate-400 hover:text-white"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[9px] mt-1 font-bold">خانه</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
