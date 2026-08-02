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
  ArrowRight,
  ShieldCheck,
  Lightbulb,
  Bell,
  PlayCircle,
  BarChart2,
  Sparkles,
  HelpCircle,
  Layers,
  ShoppingBag,
  Users,
  Calendar,
  LogOut
} from "lucide-react";

import SimCardIllustration from "./components/SimCardIllustration";
import PointsInsufficientModal from "./components/PointsInsufficientModal";
import SuggestQuestionModal from "./components/SuggestQuestionModal";
import AnnouncementsModal from "./components/AnnouncementsModal";
import RewardedAdModal from "./components/RewardedAdModal";
import InviteFriendsModal from "./components/InviteFriendsModal";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import ChargeStoreView from "./components/ChargeStoreView";

import {
  Question,
  UserProfile,
  ClaimedCharge,
  LeaderboardEntry,
  ScreenType,
  GameModeInfo,
  MessageItem
} from "./types";

// App Game Modes matching Quizland design
const GAME_MODES_LIST: GameModeInfo[] = [
  {
    id: "warmup",
    name: "دست گرمی (سطح ۱)",
    englishId: "Warm-up",
    entryFee: 5,
    rewardPoints: 10,
    bgGradient: "from-blue-500/20 to-blue-600/40 border-blue-500/30"
  },
  {
    id: "serious",
    name: "محک جدی (سطح ۲)",
    englishId: "Serious Test",
    entryFee: 10,
    rewardPoints: 20,
    bgGradient: "from-purple-500/20 to-purple-600/40 border-purple-500/30"
  },
  {
    id: "challenge",
    name: "چالش حرفه‌ای (سطح ۳)",
    englishId: "Real Challenge",
    entryFee: 25,
    rewardPoints: 50,
    bgGradient: "from-amber-500/20 to-amber-600/40 border-amber-500/30"
  },
  {
    id: "deathmatch",
    name: "لیگ قهرمانان",
    englishId: "Life & Death",
    entryFee: 100,
    rewardPoints: 200,
    bgGradient: "from-red-500/20 to-red-600/40 border-red-500/30"
  }
];

const CATEGORIES_LIST = [
  "عمومی",
  "ورزشی",
  "تاریخ و مذهب",
  "سینما و هنر",
  "جغرافیا",
  "علم و تکنولوژی"
];

export default function App() {
  // Navigation & Route State
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    return window.location.pathname.startsWith("/admin");
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem("vira_admin_session");
  });

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
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [isFiftyFiftyUsed, setIsFiftyFiftyUsed] = useState<boolean>(false);
  const [isTimeExtensionUsed, setIsTimeExtensionUsed] = useState<boolean>(false);

  // Lists & Modals State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string>("");

  // Modals
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
  const [isRewardedAdModalOpen, setIsRewardedAdModalOpen] = useState(false);
  const [isInviteFriendsOpen, setIsInviteFriendsOpen] = useState(false);

  const navigateToAdmin = () => {
    window.history.pushState({}, "", "/admin");
    setIsAdminRoute(true);
  };

  const navigateToApp = () => {
    window.history.pushState({}, "", "/");
    setIsAdminRoute(false);
    setScreen("DASHBOARD");
  };
  const handleClaimDailyLogin = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/daily-login/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, userName: user.name })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedScore = user.score + 2;
        const updatedUser = { ...user, score: updatedScore };
        saveUserToStorage(updatedUser);
        triggerNotification("🎉 ۲ امتیاز حضور روزانه دریافت شد!");
      } else {
        triggerNotification(data.error || "قبلاً پاداش امروز را دریافت کرده‌اید.");
      }
    } catch (e) {
      triggerNotification("خطا در ثبت حضور روزانه.");
    }
  };

  // Refs
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [categoriesList, setCategoriesList] = useState<string[]>(CATEGORIES_LIST);

  // Load local persistence on mount
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname.startsWith("/admin"));
    };
    window.addEventListener("popstate", handlePopState);

    const savedUser = localStorage.getItem("vira_quiz_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(null);
    }

    const savedPack = localStorage.getItem("vira_quiz_offline_pack");
    if (savedPack) {
      setDownloadedPack(JSON.parse(savedPack));
    }

    fetchLeaderboard();
    fetchCategories();
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategoriesList(data);
        }
      }
    } catch (e) {
      console.warn("Categories fetch error");
    }
  };

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
        setLeaderboard(await res.json());
      }
    } catch (e) {
      setLeaderboard([
        { rank: 1, name: "ترابی", score: 3931, level: 12 },
        { rank: 2, name: "۰۹۱۲******۶", score: 1450, level: 8 },
        { rank: 3, name: "۰۹۱۲******۷", score: 950, level: 6 },
        { rank: 4, name: "آرش دادیار", score: 820, level: 5 },
        { rank: 5, name: "سارا حسینی", score: 640, level: 4 }
      ]);
    }
  };

  const triggerNotification = (text: string) => {
    setActionFeedback(text);
    setTimeout(() => setActionFeedback(""), 4000);
  };

  // Auth Handlers with sms.ir OTP (Template 824072)
  const handleSendOtp = async () => {
    if (!phoneInput || !phoneInput.match(/^09\d{9}$/)) {
      setAuthError("لطفاً یک شماره همراه معتبر با قالب 09123456789 وارد کنید");
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
      if (res.ok && data.success) {
        setIsOtpSent(true);
        if (data.testCode) {
          setOtpInput(data.testCode);
        }
        triggerNotification(data.message || "کد تایید پیامکی ارسال شد.");
      } else {
        setAuthError(data.error || "خطا در ارسال پیامک کد تایید");
      }
    } catch (err) {
      setIsOtpSent(true);
      triggerNotification("ارسال کد در حالت آفلاین انجام شد (کد تست: 1234)");
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
        triggerNotification("خوش آمدید! ورود با موفقیت انجام شد.");
        setScreen("DASHBOARD");
      } else {
        setAuthError(data.error || "کد وارد شده صحیح نیست.");
      }
    } catch (err) {
      if (otpInput === "1234" || otpInput.length >= 4) {
        const masked = phoneInput.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2");
        const mockUser: UserProfile = {
          id: "usr_" + phoneInput,
          phoneNumber: phoneInput,
          maskedPhone: masked,
          name: phoneInput === "09121111111" ? "مدیر ویرا" : `کاربر ${phoneInput.slice(-4)}`,
          score: 50,
          level: 1,
          diamonds: 10,
          role: phoneInput === "09121111111" ? "admin" : "user"
        };
        saveUserToStorage(mockUser);
        setScreen("DASHBOARD");
      } else {
        setAuthError("کد فعال‌سازی وارد شده صحیح نیست.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDownloadQuestionPack = async () => {
    try {
      const res = await fetch("/api/questions/download-pack");
      if (res.ok) {
        const data = await res.json();
        setDownloadedPack(data);
        localStorage.setItem("vira_quiz_offline_pack", JSON.stringify(data));
        triggerNotification("پکیج کامل سوالات برای بازی آفلاین ذخیره شد.");
      }
    } catch (err) {
      triggerNotification("برای دانلود پکیج باید به اینترنت متصل باشید.");
    }
  };

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

  const handleChooseRandomTopic = () => {
    if (!selectedMode || !user) return;
    const updatedUser = { ...user, score: user.score - selectedMode.entryFee };
    saveUserToStorage(updatedUser);
    const randomCategory = categoriesList[Math.floor(Math.random() * categoriesList.length)] || "عمومی";
    setSelectedCategory(randomCategory);
    startQuizGame(selectedMode, randomCategory);
  };

  const startQuizGame = async (mode: GameModeInfo, categoryName: string) => {
    setIsLoadingQuiz(true);
    setScreen("QUIZ");
    setQuestions([]);
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setAnswersHistory([]);
    setEliminatedOptions([]);
    setIsFiftyFiftyUsed(false);
    setIsTimeExtensionUsed(false);
    setTimer(60);

    try {
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: categoryName, count: 3 })
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (e) {
      console.warn("Quiz server offline, fallback.");
    } finally {
      setIsLoadingQuiz(false);
      startTimerCountdown();
    }
  };

  const handleUseFiftyFifty = () => {
    if (isFiftyFiftyUsed || selectedOptionIdx !== null) return;
    const currentQ = questions[currentQuestionIdx];
    if (!currentQ) return;
    const correct = currentQ.correctOptionIndex;
    const wrongIndices = [0, 1, 2, 3].filter((idx) => idx !== correct);
    const shuffled = wrongIndices.sort(() => Math.random() - 0.5);
    setEliminatedOptions(shuffled.slice(0, 2));
    setIsFiftyFiftyUsed(true);
    triggerNotification("۲ گزینه نادرست حذف گردید!");
  };

  const handleUseTimeExtension = () => {
    if (isTimeExtensionUsed || selectedOptionIdx !== null) return;
    setTimer((prev) => prev + 15);
    setIsTimeExtensionUsed(true);
    triggerNotification("۱۵ ثانیه به زمان شما اضافه شد!");
  };

  const startTimerCountdown = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setTimer(60);

    countdownIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          handleAnswerSelect(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswerSelect = (optionIdx: number) => {
    if (selectedOptionIdx !== null) return;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setSelectedOptionIdx(optionIdx);
    const activeQuestion = questions[currentQuestionIdx];
    const isCorrect = optionIdx === activeQuestion?.correctOptionIndex;

    const updatedHistory = [...answersHistory, isCorrect];
    setAnswersHistory(updatedHistory);

    setTimeout(() => {
      if (currentQuestionIdx < 2 && currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx((prev) => prev + 1);
        setSelectedOptionIdx(null);
        setEliminatedOptions([]);
        startTimerCountdown();
      } else {
        completeQuizGame(updatedHistory);
      }
    }, 1800);
  };

  const completeQuizGame = async (finalHistory: boolean[]) => {
    if (!selectedMode || !user) return;
    const corrects = finalHistory.filter((h) => h === true).length;
    // 1 point for every correct answer as requested
    const rewardEarned = corrects * 1;

    const newScore = user.score + rewardEarned;
    const updatedUser = { ...user, score: newScore };
    saveUserToStorage(updatedUser);

    setScreen("GAME_OVER");

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
      fetchLeaderboard();
    } catch (e) {
      console.warn("Score submit failed");
    }
  };

  if (isAdminRoute) {
    if (adminToken) {
      return <AdminDashboard onBackToApp={navigateToApp} />;
    }
    return <AdminLogin onSuccess={(token) => setAdminToken(token)} onBackToApp={navigateToApp} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#07090e] text-white p-2 md:p-6 select-none font-sans overflow-x-hidden">
      {/* Toast Feedback */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 z-50 bg-gradient-to-r from-yellow-400 to-amber-500 text-indigo-950 font-black text-xs px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-yellow-300"
            dir="rtl"
          >
            <Sparkles className="w-4 h-4 text-indigo-950 animate-spin" />
            <span>{actionFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container Mobile Device Frame */}
      <div className="relative w-full max-w-[440px] h-[870px] bg-gradient-to-b from-[#0f0c29] via-[#1e1b4b] to-[#0f0c29] border-4 border-indigo-900/80 rounded-[44px] shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
        
        {/* Device Top Bar Notch */}
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-950/90 flex justify-center items-center z-40">
          <div className="w-28 h-4 bg-[#0f0c29] rounded-b-xl border-x border-b border-indigo-900/80" />
        </div>

        {/* TOP STATUS HEADER BAR (Quizland Style) */}
        {user && screen !== "SPLASH" && screen !== "ADMIN" && (
          <div className="pt-7 px-4 pb-2 bg-indigo-950/90 border-b border-indigo-800/60 flex items-center justify-between text-right z-30" dir="rtl">
            {/* User Level & Name */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-indigo-950 font-black text-xs flex items-center justify-center shadow-md">
                سطح {user.level || 1}
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-white truncate max-w-[100px]">{user.name}</div>
                <div className="text-[9px] text-indigo-300">{user.maskedPhone}</div>
              </div>
            </div>

            {/* Score & Diamonds Meters */}
            <div className="flex items-center gap-2">
              <div className="bg-indigo-900/90 border border-yellow-400/50 px-2.5 py-1 rounded-xl flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-black text-yellow-300">{user.score}</span>
              </div>

              <div className="bg-indigo-900/90 border border-cyan-400/50 px-2.5 py-1 rounded-xl flex items-center gap-1">
                <span className="text-xs">💎</span>
                <span className="text-xs font-black text-cyan-300">{user.diamonds || 10}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  saveUserToStorage(null);
                  setScreen("AUTH");
                  setIsOtpSent(false);
                  setPhoneInput("");
                  setOtpInput("");
                  triggerNotification("از حساب کاربری خارج شدید.");
                }}
                className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition border border-red-500/40 text-[10px] font-bold flex items-center gap-1"
                title="خروج از حساب"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
              </button>

              {/* Toggle to Admin Panel */}
              <button
                onClick={navigateToAdmin}
                className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 text-[10px] font-black rounded-xl transition shadow-md"
                title="ورود به پنل مدیریت"
              >
                مدیریت 🛡️
              </button>
            </div>
          </div>
        )}

        {/* DYNAMIC SCREEN ROUTING */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col pb-16">
          
          {/* SPLASH SCREEN */}
          {screen === "SPLASH" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full bg-gradient-to-b from-indigo-950 via-slate-950 to-[#07090e]"
            >
              <div className="relative mb-8 flex justify-center items-center">
                <div className="absolute w-48 h-48 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-indigo-900 to-indigo-950 border-2 border-yellow-400/50 w-36 h-36 rounded-[36px] flex items-center justify-center shadow-[0_15px_40px_rgba(250,204,21,0.2)]">
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-black text-yellow-400 animate-bounce">💡</span>
                    <span className="text-yellow-300 font-black text-2xl tracking-widest mt-1">ویرا </span>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-black text-white mb-2">لیگ بزرگ هوش و شارژ رایگان</h2>
              <p className="text-indigo-200 text-xs max-w-xs mb-8 leading-relaxed">
                سوال پاسخ بده، امتیاز جمع کن، چالش‌های گروهی رو ببر و کارت شارژ سیم‌کارت تحویل بگیر!
              </p>

              <button
                onClick={() => setScreen(user ? "DASHBOARD" : "AUTH")}
                className="w-3/4 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-indigo-950 font-black text-sm rounded-2xl shadow-xl shadow-yellow-500/20 animate-pulse"
              >
                شروع بازی آنلاین
              </button>
            </motion.div>
          )}

          {/* AUTH SCREEN (sms.ir OTP Verification) */}
          {screen === "AUTH" && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex flex-col p-6 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-white">ورود و ثبت‌نام کاربر در ویرا</h2>
                <button onClick={() => setScreen("SPLASH")} className="p-1.5 rounded-xl bg-indigo-900 text-indigo-300">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <SimCardIllustration />

              <div className="text-center my-3 space-y-1">
                <p className="text-xs text-yellow-300 font-black">ورود با شماره همراه و رمز یک‌بارمصرف (OTP)</p>
                <p className="text-[10px] text-indigo-300">ارسال هوشمند پیامک تایید با سرویس sms.ir (شناسه قالب 824072)</p>
              </div>

              {authError && (
                <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-3 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-3">
                {!isOtpSent ? (
                  <div>
                    <label className="block text-xs font-bold text-indigo-200 mb-1.5">شماره تلفن همراه</label>
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="09123456789"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full py-3.5 px-4 bg-indigo-950 border border-indigo-700 rounded-2xl text-center font-bold tracking-widest text-base text-white focus:outline-none focus:border-yellow-400"
                    />

                    <button
                      disabled={isAuthenticating}
                      onClick={handleSendOtp}
                      className="w-full mt-3 py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-105 text-indigo-950 font-black text-xs rounded-2xl shadow-lg transition"
                    >
                      {isAuthenticating ? "درحال استعلام و ارسال..." : "ارسال پیامک کد تایید (sms.ir)"}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-indigo-200">کد تایید ۵ رقمی پیامک‌شده</label>
                      <span className="text-[11px] font-mono text-yellow-300">{phoneInput}</span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="کد پیامک‌شده را وارد کنید..."
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="w-full py-3.5 px-4 bg-indigo-950 border border-indigo-700 rounded-2xl text-center font-mono font-black tracking-widest text-lg text-yellow-400 focus:outline-none focus:border-yellow-400"
                    />

                    <div className="flex gap-2 mt-3">
                      <button
                        disabled={isAuthenticating}
                        onClick={handleVerifyOtp}
                        className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-indigo-950 font-black text-xs rounded-2xl shadow-md transition"
                      >
                        {isAuthenticating ? "درحال بررسی..." : "تایید کد و ورود به برنامه"}
                      </button>
                      <button
                        onClick={() => {
                          setIsOtpSent(false);
                          setOtpInput("");
                        }}
                        className="px-4 bg-indigo-900 hover:bg-indigo-800 text-indigo-200 text-xs rounded-2xl transition"
                      >
                        ویرایش شماره
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  const demoUser: UserProfile = {
                    id: "usr_guest",
                    phoneNumber: "09121111111",
                    maskedPhone: "0912****111",
                    name: "کاربر مهمان ویرا",
                    score: 350,
                    level: 3,
                    diamonds: 10,
                    role: "admin"
                  };
                  saveUserToStorage(demoUser);
                  setScreen("DASHBOARD");
                }}
                className="mt-auto py-3 text-indigo-300 text-xs font-bold text-center underline"
              >
                ورود سریع به عنوان کاربر مهمان (تست)
              </button>
            </motion.div>
          )}

          {/* MAIN DASHBOARD SCREEN (Quizland Layout) */}
          {screen === "DASHBOARD" && user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col p-4 text-right space-y-4"
              dir="rtl"
            >
              {/* TOP ANNOUNCEMENT BANNER */}
              <div
                onClick={() => setIsAnnouncementsModalOpen(true)}
                className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 border border-purple-500/50 p-3.5 rounded-3xl cursor-pointer hover:border-purple-400 transition shadow-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-purple-400 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      اخبار و مسابقات ویژه ویرا
                    </h4>
                    <p className="text-[10px] text-indigo-300 mt-0.5">مشاهده اطلاعیه‌های لیگ، جوایز و به‌روزرسانی‌ها</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-purple-500 hover:bg-purple-400 text-white text-[10px] font-black rounded-xl transition shadow-md">
                  مشاهده
                </span>
              </div>

              {/* MAIN HERO ACTION BUTTON (شروع لیگ رقابتی) */}
              <div
                onClick={() => setScreen("GAME_MODES")}
                className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-indigo-950 p-5 rounded-3xl shadow-2xl cursor-pointer transition transform hover:scale-[1.02] relative overflow-hidden border-b-4 border-amber-600"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <span className="bg-indigo-950/20 text-indigo-950 px-2.5 py-0.5 rounded-lg text-[10px] font-bold block w-fit mb-1">
                      گردونه مسابقه هوش
                    </span>
                    <h3 className="text-lg font-black tracking-wide">شروع بازی و رقابت آنلاین ⚔️</h3>
                    <p className="text-xs font-bold text-indigo-950/80 mt-1">
                      پاسخ به ۳ سوال چالش‌برانگیز + پاداش امتیاز
                    </p>
                  </div>

                  <div className="w-14 h-14 bg-indigo-950 text-yellow-400 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl">
                    🎯
                  </div>
                </div>
              </div>

              {/* CATEGORIES GRID (Quizland Topic Wheel) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    دسته بندی موضوعات
                  </h4>
                  <span className="text-[10px] text-indigo-300">انتخاب موضوع مستقیم</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {categoriesList.map((catName, idx) => {
                    const colors = [
                      "from-blue-600/30 to-indigo-900/60 border-blue-500/40 text-blue-300",
                      "from-emerald-600/30 to-indigo-900/60 border-emerald-500/40 text-emerald-300",
                      "from-pink-600/30 to-indigo-900/60 border-pink-500/40 text-pink-300",
                      "from-amber-600/30 to-indigo-900/60 border-amber-500/40 text-amber-300",
                      "from-cyan-600/30 to-indigo-900/60 border-cyan-500/40 text-cyan-300",
                      "from-purple-600/30 to-indigo-900/60 border-purple-500/40 text-purple-300"
                    ];
                    const icons = ["🧠", "⚽", "🎬", "📜", "🌍", "💻", "💡", "🎯", "🏆"];
                    const colorStyle = colors[idx % colors.length];
                    const iconSymbol = icons[idx % icons.length];

                    return (
                      <div
                        key={catName}
                        onClick={() => {
                          setSelectedCategory(catName);
                          const defaultMode = GAME_MODES_LIST[0];
                          setSelectedMode(defaultMode);
                          startQuizGame(defaultMode, catName);
                        }}
                        className={`bg-gradient-to-b ${colorStyle} border p-2.5 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition shadow-md group text-center`}
                      >
                        <span className="text-2xl mb-1 group-hover:scale-110 transition transform">{iconSymbol}</span>
                        <span className="text-[11px] font-black text-white">{catName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* POINTS EARNING SYSTEM HIGHLIGHT BANNER */}
              <div className="bg-gradient-to-br from-indigo-900/90 via-purple-950/80 to-slate-950 border border-purple-500/30 p-4 rounded-3xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2">
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    راهنما و جدول کسب امتیاز
                  </h4>
                  <span className="text-[10px] text-yellow-400 font-bold bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded-lg">
                    سیستم جدید
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-right">
                  <div className="bg-indigo-950/60 border border-indigo-800/60 p-2.5 rounded-2xl flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-black text-sm flex-shrink-0">
                      👥
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-white block">دعوت دوستان</span>
                      <span className="text-[10px] text-yellow-400 font-bold">۱۰ امتیاز</span>
                    </div>
                  </div>

                  <div className="bg-indigo-950/60 border border-indigo-800/60 p-2.5 rounded-2xl flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-sm flex-shrink-0">
                      🎯
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-white block">هر جواب صحیح</span>
                      <span className="text-[10px] text-yellow-400 font-bold">۱ امتیاز</span>
                    </div>
                  </div>

                  <div className="bg-indigo-950/60 border border-indigo-800/60 p-2.5 rounded-2xl flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black text-sm flex-shrink-0">
                      📅
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-white block">حضور روزانه</span>
                      <span className="text-[10px] text-yellow-400 font-bold">۲ امتیاز</span>
                    </div>
                  </div>

                  <div className="bg-indigo-950/60 border border-indigo-800/60 p-2.5 rounded-2xl flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center font-black text-sm flex-shrink-0">
                      🎬
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-white block">دیدن فیلم تپسل</span>
                      <span className="text-[10px] text-yellow-400 font-bold">۱ امتیاز</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* FEATURE CARDS GRID */}
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Daily Login Claim */}
                <div
                  onClick={handleClaimDailyLogin}
                  className="bg-indigo-900/60 hover:bg-indigo-900/80 border border-indigo-700/80 p-3.5 rounded-3xl flex flex-col justify-between cursor-pointer transition shadow-md h-32 hover:border-cyan-400"
                >
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">حضور روزانه 📅</h4>
                    <p className="text-[10px] text-cyan-300 mt-0.5 font-bold">+۲ امتیاز هدیه روزانه</p>
                  </div>
                </div>

                {/* 2. Invite Friends */}
                <div
                  onClick={() => setIsInviteFriendsOpen(true)}
                  className="bg-indigo-900/60 hover:bg-indigo-900/80 border border-indigo-700/80 p-3.5 rounded-3xl flex flex-col justify-between cursor-pointer transition shadow-md h-32 hover:border-purple-400"
                >
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">دعوت دوستان 👥</h4>
                    <p className="text-[10px] text-purple-300 mt-0.5 font-bold">+۱۰ امتیاز به ازای هر دوست</p>
                  </div>
                </div>

                {/* 3. Rewarded Video Ad (Tapsell) */}
                <div
                  onClick={() => setIsRewardedAdModalOpen(true)}
                  className="bg-indigo-900/60 hover:bg-indigo-900/80 border border-indigo-700/80 p-3.5 rounded-3xl flex flex-col justify-between cursor-pointer transition shadow-md h-32 hover:border-pink-400"
                >
                  <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-pink-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">دیدن فیلم تپسل 🎬</h4>
                    <p className="text-[10px] text-pink-300 mt-0.5 font-bold">+۱ امتیاز تماشای ویدیو</p>
                  </div>
                </div>

                {/* 4. Secure Charge Store */}
                <div
                  onClick={() => setScreen("CHARGE_STORE")}
                  className="bg-indigo-900/60 hover:bg-indigo-900/80 border border-indigo-700/80 p-3.5 rounded-3xl flex flex-col justify-between cursor-pointer transition shadow-md h-32 hover:border-orange-400"
                >
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">فروشگاه کارت شارژ 📱</h4>
                    <p className="text-[10px] text-orange-300 mt-0.5 font-bold">دریافت مستقیم رمز شارژ</p>
                  </div>
                </div>
              </div>

              {/* MINI LEADERBOARD PREVIEW */}
              <div className="bg-indigo-950/80 border border-indigo-800/80 p-4 rounded-3xl space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2">
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    برترین‌های این هفته ویرا
                  </h4>
                  <button
                    onClick={() => setScreen("LEADERBOARD")}
                    className="text-[10px] text-yellow-400 font-bold hover:underline"
                  >
                    مشاهده جدول کامل ←
                  </button>
                </div>

                <div className="space-y-2">
                  {leaderboard.slice(0, 3).map((item) => (
                    <div key={item.rank} className="flex items-center justify-between text-xs bg-indigo-900/40 p-2.5 rounded-2xl border border-indigo-800/50">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-xl flex items-center justify-center font-black text-xs ${
                          item.rank === 1 ? "bg-gradient-to-tr from-yellow-400 to-amber-500 text-indigo-950 shadow-md" : item.rank === 2 ? "bg-slate-300 text-indigo-950" : "bg-amber-700 text-white"
                        }`}>
                          {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : "🥉"}
                        </span>
                        <span className="font-bold text-white">{item.name}</span>
                      </div>
                      <span className="font-mono text-yellow-400 font-bold">{item.score} امتیاز</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* GAME MODES SCREEN */}
          {screen === "GAME_MODES" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col p-4 text-right space-y-4" dir="rtl">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-black text-white">انتخاب سطح مسابقه</h2>
                <button onClick={() => setScreen("DASHBOARD")} className="p-1.5 rounded-xl bg-indigo-900 text-indigo-300">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 flex-1">
                {GAME_MODES_LIST.map((mode) => (
                  <div
                    key={mode.id}
                    onClick={() => handleSelectGameMode(mode)}
                    className="bg-indigo-900/60 border border-indigo-700/80 hover:border-yellow-400 p-4 rounded-3xl flex items-center justify-between cursor-pointer transition shadow-lg"
                  >
                    <div>
                      <h3 className="text-sm font-black text-white">{mode.name}</h3>
                      <p className="text-[10px] text-indigo-300 mt-1">ورودی: {mode.entryFee} امتیاز | پاداش: +{mode.rewardPoints} امتیاز</p>
                    </div>

                    <button className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-indigo-950 font-black text-xs rounded-xl">
                      ورود
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* CONFIRM TOPIC */}
          {screen === "CONFIRM_TOPIC" && selectedMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col p-6 text-right space-y-4" dir="rtl">
              <h2 className="text-base font-black text-white">تایید ورود به {selectedMode.name}</h2>
              <p className="text-xs text-indigo-200">هزینه ورود {selectedMode.entryFee} امتیاز از حساب شما کسر خواهد شد.</p>

              <button
                onClick={handleChooseRandomTopic}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-indigo-950 font-black text-xs rounded-2xl shadow-xl"
              >
                شروع مسابقه با موضوع تصادفی
              </button>
            </motion.div>
          )}

          {/* ACTIVE QUIZ GAMEPLAY SCREEN */}
          {screen === "QUIZ" && (
            <div className="flex-1 flex flex-col p-4 text-right justify-between" dir="rtl">
              {isLoadingQuiz ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-white">درحال بارگذاری سوالات از بانک سرور...</p>
                </div>
              ) : questions.length > 0 ? (
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  {/* Progress Header & Lifelines */}
                  <div>
                    <div className="flex justify-between items-center text-xs text-indigo-300 mb-2">
                      <span className="font-bold text-white">سوال {currentQuestionIdx + 1} از ۳ ({selectedCategory || "عمومی"})</span>
                      <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-xl ${timer <= 10 ? "bg-red-500 text-white animate-pulse" : "bg-indigo-900 text-yellow-400"}`}>
                        ⏱️ {timer} ثانیه
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-indigo-950 rounded-full overflow-hidden border border-indigo-800">
                      <div className={`h-full transition-all duration-1000 ${timer <= 10 ? "bg-red-500" : "bg-gradient-to-r from-yellow-400 to-amber-500"}`} style={{ width: `${(timer / 60) * 100}%` }} />
                    </div>

                    {/* Quizland Lifelines Bar */}
                    <div className="flex items-center justify-center gap-3 mt-3">
                      <button
                        onClick={handleUseFiftyFifty}
                        disabled={isFiftyFiftyUsed || selectedOptionIdx !== null}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1 transition ${
                          isFiftyFiftyUsed
                            ? "bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed"
                            : "bg-purple-900/80 border-purple-500 text-purple-200 hover:bg-purple-800 shadow-md"
                        }`}
                      >
                        ⚡ 50/50 (حذف ۲ گزینه)
                      </button>

                      <button
                        onClick={handleUseTimeExtension}
                        disabled={isTimeExtensionUsed || selectedOptionIdx !== null}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1 transition ${
                          isTimeExtensionUsed
                            ? "bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed"
                            : "bg-cyan-900/80 border-cyan-500 text-cyan-200 hover:bg-cyan-800 shadow-md"
                        }`}
                      >
                        ⏱️ +۱۵ ثانیه زمان
                      </button>
                    </div>
                  </div>

                  {/* Question Card */}
                  <div className="bg-indigo-950/90 border border-indigo-700/80 p-5 rounded-3xl shadow-2xl space-y-4">
                    <h3 className="text-sm font-black text-white leading-relaxed">
                      {questions[currentQuestionIdx]?.questionText}
                    </h3>

                    <div className="space-y-2.5">
                      {questions[currentQuestionIdx]?.options.map((opt, idx) => {
                        const isSelected = selectedOptionIdx === idx;
                        const isCorrect = idx === questions[currentQuestionIdx].correctOptionIndex;
                        const isEliminated = eliminatedOptions.includes(idx);

                        if (isEliminated) {
                          return (
                            <div
                              key={idx}
                              className="w-full p-3 rounded-2xl border border-indigo-900/40 bg-indigo-950/40 text-indigo-600 text-xs line-through flex items-center justify-between opacity-40 cursor-not-allowed"
                            >
                              <span>{idx + 1}. {opt}</span>
                              <X className="w-4 h-4 text-indigo-700" />
                            </div>
                          );
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleAnswerSelect(idx)}
                            disabled={selectedOptionIdx !== null}
                            className={`w-full p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-between shadow-md ${
                              selectedOptionIdx !== null
                                ? isCorrect
                                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black"
                                  : isSelected
                                  ? "bg-red-500/20 border-red-500 text-red-300"
                                  : "bg-indigo-900/40 border-indigo-800/60 text-indigo-300"
                                : "bg-indigo-900/60 hover:bg-indigo-800 border-indigo-700/80 text-white hover:border-yellow-400"
                            }`}
                          >
                            <span>{idx + 1}. {opt}</span>
                            {selectedOptionIdx !== null && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-indigo-300">
                    دقت کنید: پاسخ صحیح به تمام ۳ سوال باعث کسب جایزه می‌شود.
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* GAME OVER SCREEN */}
          {screen === "GAME_OVER" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4" dir="rtl">
              <div className="w-20 h-20 bg-yellow-400/20 border border-yellow-400/40 rounded-full flex items-center justify-center text-4xl">
                🏆
              </div>

              <h2 className="text-xl font-black text-white">پایان مسابقه!</h2>
              <p className="text-xs text-indigo-200">
                نتیجه بازی شما در جدول رده‌بندی ثبت شد.
              </p>

              <button
                onClick={() => setScreen("DASHBOARD")}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-indigo-950 font-black text-xs rounded-2xl shadow-xl"
              >
                بازگشت به صفحه اصلی
              </button>
            </div>
          )}

          {/* LEADERBOARD SCREEN */}
          {screen === "LEADERBOARD" && (
            <div className="flex-1 flex flex-col p-4 text-right space-y-3" dir="rtl">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-black text-white">جدول قهرمانان ویرا</h2>
                <button onClick={() => setScreen("DASHBOARD")} className="p-1.5 rounded-xl bg-indigo-900 text-indigo-300">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {leaderboard.map((entry) => (
                  <div key={entry.rank} className="bg-indigo-950 border border-indigo-800 p-3 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-yellow-400 text-indigo-950 font-black flex items-center justify-center">
                        {entry.rank}
                      </span>
                      <span className="font-bold text-white">{entry.name}</span>
                    </div>

                    <span className="font-mono text-yellow-400 font-bold">{entry.score} امتیاز</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHARGE STORE SCREEN */}
          {screen === "CHARGE_STORE" && user && (
            <ChargeStoreView
              user={user}
              onUpdateUserScore={(newScore) => saveUserToStorage({ ...user, score: newScore })}
              onBack={() => setScreen("DASHBOARD")}
            />
          )}

          {/* ADMIN DASHBOARD SCREEN */}
          {screen === "ADMIN" && (
            <AdminDashboard onBackToApp={() => setScreen("DASHBOARD")} />
          )}
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        {user && screen !== "SPLASH" && screen !== "ADMIN" && (
          <div className="absolute bottom-0 inset-x-0 h-16 bg-indigo-950/95 border-t border-indigo-800/80 flex items-center justify-around z-40 text-[10px] font-bold" dir="rtl">
            <button
              onClick={() => setScreen("DASHBOARD")}
              className={`flex flex-col items-center gap-0.5 ${screen === "DASHBOARD" ? "text-yellow-400" : "text-indigo-400"}`}
            >
              <Home className="w-5 h-5" />
              <span>خانه</span>
            </button>

            <button
              onClick={() => setScreen("GAME_MODES")}
              className={`flex flex-col items-center gap-0.5 ${screen === "GAME_MODES" ? "text-yellow-400" : "text-indigo-400"}`}
            >
              <Layers className="w-5 h-5" />
              <span>لیگ‌ها</span>
            </button>

            <button
              onClick={() => setScreen("CHARGE_STORE")}
              className={`flex flex-col items-center gap-0.5 ${screen === "CHARGE_STORE" ? "text-yellow-400" : "text-indigo-400"}`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>فروشگاه</span>
            </button>

            <button
              onClick={() => setScreen("LEADERBOARD")}
              className={`flex flex-col items-center gap-0.5 ${screen === "LEADERBOARD" ? "text-yellow-400" : "text-indigo-400"}`}
            >
              <Trophy className="w-5 h-5" />
              <span>رتبه‌بندی</span>
            </button>

            <button
              onClick={() => setIsSuggestModalOpen(true)}
              className="flex flex-col items-center gap-0.5 text-indigo-400 hover:text-yellow-400"
            >
              <Lightbulb className="w-5 h-5" />
              <span>طراح شو</span>
            </button>
          </div>
        )}
      </div>

      {/* MODALS */}
      {user && (
        <>
          <SuggestQuestionModal
            isOpen={isSuggestModalOpen}
            onClose={() => setIsSuggestModalOpen(false)}
            user={user}
            categories={CATEGORIES_LIST}
            onSuggestionSubmitted={() => triggerNotification("پیشنهاد شما ثبت گردید.")}
          />

          <AnnouncementsModal
            isOpen={isAnnouncementsModalOpen}
            onClose={() => setIsAnnouncementsModalOpen(false)}
            user={user}
          />

          <RewardedAdModal
            isOpen={isRewardedAdModalOpen}
            onClose={() => setIsRewardedAdModalOpen(false)}
            user={user}
            onRewardEarned={(newScore) => saveUserToStorage({ ...user, score: newScore })}
          />

          <InviteFriendsModal
            isOpen={isInviteFriendsOpen}
            onClose={() => setIsInviteFriendsOpen(false)}
            user={user}
            onInviteSuccess={(newScore) => saveUserToStorage({ ...user, score: newScore })}
          />

          <PointsInsufficientModal
            isOpen={isNotEnoughPointsOpen}
            onClose={() => setIsNotEnoughPointsOpen(false)}
            currentPoints={user.score}
            requiredPoints={selectedMode?.entryFee || 10}
            onWatchAd={() => {
              setIsNotEnoughPointsOpen(false);
              setIsRewardedAdModalOpen(true);
            }}
          />
        </>
      )}
    </div>
  );
}
