import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlayCircle, Award, ShieldAlert, CheckCircle2, Clock, X, Lock, Sparkles, Volume2, VolumeX, Play, Pause, Film } from "lucide-react";
import { UserProfile } from "../types";
import { requestTapsellRewardedAd, showTapsellRewardedAd, TAPSELL_CONFIG } from "../services/tapsell";

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onRewardEarned: (newScore: number) => void;
}

const PROMO_VIDEOS = [
  {
    title: "تبلیغ ویژه بازی و ویدیوی اسپانسری تپسل",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  },
  {
    title: "تیزر تبلیغاتی برنامه و سرویس‌های برتر ویرا",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
  },
  {
    title: "ویدیو انیمیشن چالش‌ها و جوایز آنلاین",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
  }
];

export default function RewardedAdModal({
  isOpen,
  onClose,
  user,
  onRewardEarned
}: RewardedAdModalProps) {
  const [adState, setAdState] = useState<"idle" | "playing" | "verifying" | "completed" | "rate_limited">("idle");
  const [countdown, setCountdown] = useState(10); // 10s video ad timer
  const [errorMsg, setErrorMsg] = useState("");
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [remainingAdsToday, setRemainingAdsToday] = useState(5);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);

  // Video Player state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(PROMO_VIDEOS[0]);

  useEffect(() => {
    if (isOpen) {
      setAdState("idle");
      setCountdown(10);
      setErrorMsg("");
      setIsMuted(true);
      checkAdLimits();
    }
  }, [isOpen]);

  const checkAdLimits = async () => {
    try {
      const res = await fetch(`/api/ads/check-limits?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setRemainingAdsToday(data.remainingToday);
        setCooldownTimeLeft(data.cooldownSeconds);
        if (data.cooldownSeconds > 0 || data.remainingToday <= 0) {
          setAdState("rate_limited");
        }
      }
    } catch (e) {
      console.warn("Limits check failed:", e);
    }
  };

  // Video playback countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (adState === "playing" && countdown > 0 && isPlaying) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (adState === "playing" && countdown === 0) {
      verifyAdRewardOnServer();
    }
    return () => clearInterval(timer);
  }, [adState, countdown, isPlaying]);

  const startAdPlayback = async () => {
    if (remainingAdsToday <= 0) {
      setErrorMsg("سقف روزانه تماشای تبلیغ (۵ عدد در روز) پر شده است.");
      return;
    }
    if (cooldownTimeLeft > 0) {
      setErrorMsg(`لطفاً ${cooldownTimeLeft} ثانیه دیگر صبر کنید.`);
      return;
    }

    setErrorMsg("");
    setAdState("verifying");

    // Pick a random promotional video
    const randomVideo = PROMO_VIDEOS[Math.floor(Math.random() * PROMO_VIDEOS.length)];
    setCurrentVideo(randomVideo);

    const res = await requestTapsellRewardedAd(TAPSELL_CONFIG.rewardedZoneId, {
      onError: (err) => setErrorMsg(err),
      onNoAd: () => setErrorMsg("در حال حاضر تبلیغی در شبکه تپسل موجود نیست. مجدداً تلاش کنید.")
    });

    if (res.success && res.adId) {
      await showTapsellRewardedAd(res.adId);
      setAdState("playing");
      setCountdown(10);
      setIsPlaying(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } else {
      setAdState("idle");
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const verifyAdRewardOnServer = async () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setAdState("verifying");
    try {
      const res = await fetch("/api/ads/verify-watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          adNetwork: "tapsell"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEarnedPoints(data.pointsEarned);
        setAdState("completed");
        onRewardEarned(data.newScore);
      } else {
        setErrorMsg(data.error || "خطا در تأیید نمایش تبلیغ توسط سرور.");
        setAdState("idle");
      }
    } catch (e) {
      setErrorMsg("خطا در برقراری ارتباط با سرور تبلیغات.");
      setAdState("idle");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="rewarded-ad-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-indigo-950/90 backdrop-blur-md">
          <motion.div
            id="rewarded-ad-card"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-700/60 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden"
            dir="rtl"
          >
            {/* Close button only available if NOT playing */}
            {adState !== "playing" && (
              <button
                onClick={onClose}
                className="absolute top-4 left-4 p-1.5 rounded-full bg-indigo-800/60 text-indigo-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {adState === "idle" || adState === "rate_limited" ? (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-yellow-400/20 border border-yellow-400/40 rounded-2xl flex items-center justify-center">
                  <PlayCircle className="w-9 h-9 text-yellow-400 animate-pulse" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-white mb-1">دیدن فیلم تپسل و دریافت ۱ امتیاز</h3>
                  <p className="text-xs text-indigo-200">
                    با تماشای یک ویدیوی ۱۰ ثانیه‌ای تپسل، <span className="text-yellow-400 font-bold">۱ امتیاز رایگان</span> دریافت کن!
                  </p>
                </div>

                {/* Limit status indicator */}
                <div className="bg-indigo-950/80 border border-indigo-800/80 rounded-2xl p-3 text-xs space-y-1 text-right">
                  <div className="flex justify-between items-center text-indigo-300">
                    <span>فرصت باقی‌مانده امروز:</span>
                    <strong className="text-white">{remainingAdsToday} از ۵</strong>
                  </div>
                  {cooldownTimeLeft > 0 && (
                    <div className="flex justify-between items-center text-amber-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> زمان انتظار مجدد:
                      </span>
                      <span>{cooldownTimeLeft} ثانیه</span>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-2.5 text-red-300 text-xs flex items-center gap-2 text-right">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  disabled={remainingAdsToday <= 0 || cooldownTimeLeft > 0}
                  onClick={startAdPlayback}
                  className={`w-full py-4 text-xs font-black rounded-2xl transition shadow-xl flex items-center justify-center gap-2 ${
                    remainingAdsToday <= 0 || cooldownTimeLeft > 0
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-indigo-950 shadow-yellow-500/20"
                  }`}
                >
                  {remainingAdsToday <= 0 ? (
                    <>
                      <Lock className="w-4 h-4" />
                      سقف تماشای امروز پر شد
                    </>
                  ) : cooldownTimeLeft > 0 ? (
                    <>
                      <Clock className="w-4 h-4" />
                      در حال خنک‌سازی سیستم...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      شروع پخش فیلم تپسل و گرفتن ۱ امتیاز
                    </>
                  )}
                </button>
              </div>
            ) : adState === "playing" ? (
              <div className="space-y-3 py-2 text-right">
                <div className="flex items-center justify-between text-xs text-yellow-400 font-bold bg-indigo-900/60 border border-indigo-700/60 px-3 py-1.5 rounded-2xl">
                  <span className="flex items-center gap-1">
                    <Film className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{currentVideo.title}</span>
                  </span>
                  <span className="bg-yellow-400 text-indigo-950 px-2 py-0.5 rounded-lg text-[10px] font-black">
                    Tapsell Video Ad
                  </span>
                </div>

                {/* Real HTML5 Video Player Container */}
                <div className="relative w-full h-52 bg-black rounded-2xl border-2 border-indigo-600 overflow-hidden shadow-2xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={currentVideo.url}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    onEnded={() => verifyAdRewardOnServer()}
                    className="w-full h-full object-cover"
                  />

                  {/* Top Overlay: Countdown & Mute button */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-auto">
                    <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] text-amber-300 font-mono font-black flex items-center gap-1.5 border border-amber-400/30">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span>{countdown} ثانیه تا واریز ۱ امتیاز</span>
                    </div>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-2 bg-black/80 hover:bg-black backdrop-blur-md rounded-xl text-yellow-400 border border-yellow-400/30 transition"
                      title={isMuted ? "وصل صدا" : "قطع صدا"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Center Overlay: Play/Pause toggle overlay */}
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition group"
                  >
                    {!isPlaying && (
                      <div className="w-14 h-14 rounded-full bg-yellow-400 text-indigo-950 flex items-center justify-center shadow-2xl scale-100 group-hover:scale-110 transition">
                        <Play className="w-7 h-7 ml-1 fill-current" />
                      </div>
                    )}
                  </button>

                  {/* Bottom Overlay: Progress bar */}
                  <div className="absolute bottom-0 inset-x-0 h-2 bg-slate-900/80">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-indigo-300 text-center font-bold">
                  تماشای کامل فیلم تا پایان تایمر برای ثبت امتیاز در کیف پول الزامی است.
                </p>
              </div>
            ) : adState === "verifying" ? (
              <div className="py-8 space-y-3">
                <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-white">درحال استعلام اعتبار تبلیغ از سرور تپسل...</p>
                <p className="text-[10px] text-indigo-300">مقابله با تقلب و اعتبارسنجی تراکنش</p>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">تبریک! جایزه واریز شد</h3>
                  <p className="text-xs text-emerald-300 font-bold mt-1">
                    +{earnedPoints} امتیاز به کیف پول شما اضافه گردید.
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-indigo-950 font-black text-xs rounded-xl transition"
                >
                  باشه، متشکرم
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
