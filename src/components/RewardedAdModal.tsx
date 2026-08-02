import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlayCircle, Award, ShieldAlert, CheckCircle2, Clock, X, Lock, Sparkles, Volume2, VolumeX, Play, Pause, Film, Loader2, Tv, AlertTriangle } from "lucide-react";
import { UserProfile } from "../types";
import { requestTapsellRewardedAd, showTapsellRewardedAd, TAPSELL_CONFIG } from "../services/tapsell";

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onRewardEarned: (newScore: number) => void;
}

// Ultra-reliable public MP4 fallback video URLs with CORS enabled
const PROMO_VIDEOS = [
  {
    title: "تیزر اسپانسری ویدیویی ویرا و تپسل",
    urls: [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://media.w3.org/2010/05/sintel/trailer.mp4"
    ]
  },
  {
    title: "ویدیوی جایزه‌دار شبکه تبلیغات تپسل",
    urls: [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      "https://www.w3schools.com/html/mov_bbb.mp4"
    ]
  },
  {
    title: "چالش‌ها و جوایز آنلاین ویرا کویز",
    urls: [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      "https://media.w3.org/2010/05/sintel/trailer.mp4"
    ]
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
  const [videoSourceIndex, setVideoSourceIndex] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [hasVideoFailed, setHasVideoFailed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAdState("idle");
      setCountdown(10);
      setErrorMsg("");
      setIsMuted(true);
      setHasVideoFailed(false);
      setIsVideoLoading(true);
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

  // Ensure HTML5 video muted state is synchronously updated on the DOM element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

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
    setVideoSourceIndex(0);
    setHasVideoFailed(false);
    setIsVideoLoading(true);

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
          videoRef.current.muted = isMuted;
          videoRef.current.play().catch((err) => {
            console.warn("Autoplay was prevented or video failed to play:", err);
            // If play is blocked or fails, try next source or trigger fallback player
            handleVideoError();
          });
        }
      }, 150);
    } else {
      setAdState("idle");
    }
  };

  const handleVideoError = () => {
    if (videoSourceIndex + 1 < currentVideo.urls.length) {
      console.log("Primary video URL failed, trying secondary fallback source...");
      setVideoSourceIndex((prev) => prev + 1);
      setIsVideoLoading(true);
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
    } else {
      console.warn("All remote video URLs failed to load. Displaying Tapsell Animated Interactive Video Ad Canvas fallback.");
      setHasVideoFailed(true);
      setIsVideoLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (hasVideoFailed) {
      setIsPlaying(!isPlaying);
      return;
    }
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
      try {
        videoRef.current.pause();
      } catch (e) {}
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
            className="w-full max-w-sm bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-700/60 rounded-3xl p-5 shadow-2xl text-center relative overflow-hidden"
            dir="rtl"
          >
            {/* Close button only available if NOT playing */}
            {adState !== "playing" && (
              <button
                onClick={onClose}
                className="absolute top-4 left-4 p-1.5 rounded-full bg-indigo-800/60 text-indigo-300 hover:text-white transition z-10"
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
                  <h3 className="text-base font-black text-white mb-1">دیدن فیلم تپسل و دریافت ۱ امتیاز</h3>
                  <p className="text-xs text-indigo-200">
                    با تماشای کامل ویدیوی ۱۰ ثانیه‌ای تپسل، <span className="text-yellow-400 font-bold">۱ امتیاز رایگان</span> دریافت کن!
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
                  className={`w-full py-3.5 text-xs font-black rounded-2xl transition shadow-xl flex items-center justify-center gap-2 ${
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
              <div className="space-y-3 py-1 text-right">
                <div className="flex items-center justify-between text-xs text-yellow-400 font-bold bg-indigo-900/60 border border-indigo-700/60 px-3 py-1.5 rounded-2xl">
                  <span className="flex items-center gap-1 truncate max-w-[190px]">
                    <Film className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                    <span className="truncate">{currentVideo.title}</span>
                  </span>
                  <span className="bg-yellow-400 text-indigo-950 px-2 py-0.5 rounded-lg text-[10px] font-black flex-shrink-0">
                    Tapsell Ad
                  </span>
                </div>

                {/* Video Container */}
                <div className="relative w-full h-56 bg-slate-950 rounded-2xl border-2 border-indigo-600 overflow-hidden shadow-2xl flex items-center justify-center">
                  {!hasVideoFailed ? (
                    <>
                      <video
                        ref={videoRef}
                        src={currentVideo.urls[videoSourceIndex]}
                        autoPlay
                        playsInline
                        muted={isMuted}
                        onLoadStart={() => setIsVideoLoading(true)}
                        onCanPlay={() => setIsVideoLoading(false)}
                        onWaiting={() => setIsVideoLoading(true)}
                        onPlaying={() => setIsVideoLoading(false)}
                        onError={handleVideoError}
                        onEnded={() => verifyAdRewardOnServer()}
                        className="w-full h-full object-cover"
                      />

                      {/* Loading Spinner overlay when video is buffering */}
                      {isVideoLoading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-yellow-400 z-10">
                          <Loader2 className="w-8 h-8 animate-spin" />
                          <span className="text-[11px] font-bold text-white">در حال آماده‌سازی واریز ویدیو تپسل...</span>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Interactive Tapsell Video Ad Canvas Fallback (used if external MP4 CDN is blocked) */
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-950 p-4 flex flex-col items-center justify-between relative overflow-hidden text-center">
                      {/* Animated Background Particles */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl animate-pulse" />
                      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl animate-pulse" />

                      <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-xl text-[11px] text-yellow-300 font-bold mt-2">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                        <span>ویدیوی اسپانسری هوشمند تپسل (Tapsell Ad)</span>
                      </div>

                      <div className="space-y-2 my-auto z-10">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center text-indigo-950 font-black shadow-xl animate-bounce">
                          <Tv className="w-8 h-8" />
                        </div>
                        <h4 className="text-sm font-black text-white">سامانه هوشمند ویرا و تپسل</h4>
                        <p className="text-[11px] text-indigo-200 leading-snug px-2">
                          در حال محاسبه و ثبت هوشمند ۱ امتیاز رایگان برای حساب کاربری شما...
                        </p>
                      </div>

                      {/* Animated Equalizer Sound Bars */}
                      <div className="flex items-end justify-center gap-1.5 h-6 mb-2">
                        <span className="w-1.5 bg-yellow-400 rounded-full animate-bounce h-full" />
                        <span className="w-1.5 bg-cyan-400 rounded-full animate-bounce h-3/4 delay-100" />
                        <span className="w-1.5 bg-emerald-400 rounded-full animate-bounce h-1/2 delay-200" />
                        <span className="w-1.5 bg-purple-400 rounded-full animate-bounce h-full delay-300" />
                        <span className="w-1.5 bg-yellow-400 rounded-full animate-bounce h-2/3 delay-150" />
                      </div>
                    </div>
                  )}

                  {/* Top Overlay: Countdown & Mute button */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-auto z-20">
                    <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] text-amber-300 font-mono font-black flex items-center gap-1.5 border border-amber-400/30 shadow-lg">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span>{countdown} ثانیه تا دریافت ۱ امتیاز</span>
                    </div>

                    {!hasVideoFailed && (
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="p-2 bg-black/80 hover:bg-black backdrop-blur-md rounded-xl text-yellow-400 border border-yellow-400/30 transition shadow-lg"
                        title={isMuted ? "وصل صدا" : "قطع صدا"}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Center Overlay: Play/Pause toggle overlay */}
                  {!hasVideoFailed && !isVideoLoading && (
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition group z-10"
                    >
                      {!isPlaying && (
                        <div className="w-14 h-14 rounded-full bg-yellow-400 text-indigo-950 flex items-center justify-center shadow-2xl scale-100 group-hover:scale-110 transition">
                          <Play className="w-7 h-7 ml-1 fill-current" />
                        </div>
                      )}
                    </button>
                  )}

                  {/* Bottom Overlay: Progress bar */}
                  <div className="absolute bottom-0 inset-x-0 h-2 bg-slate-900/80 z-20">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-cyan-400 transition-all duration-1000 ease-linear"
                      style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-indigo-300 text-center font-bold">
                  تماشای کامل تا پایان تایمر معکوس برای ثبت امتیاز در حساب کاربری الزامی است.
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
