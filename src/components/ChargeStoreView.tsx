import React, { useState, useEffect } from "react";
import { Smartphone, Lock, ShieldCheck, Copy, Check, Clock, AlertTriangle, Coins, RefreshCw } from "lucide-react";
import { UserProfile, ChargeRedemption } from "../types";

interface ChargeStoreViewProps {
  user: UserProfile;
  onUpdateUserScore: (newScore: number) => void;
  onBack: () => void;
}

interface AvailableBundle {
  id: string;
  operator: "همراه اول" | "ایرانسل" | "رایتل";
  title: string;
  faceValue: string;
  pointsCost: number;
  availableStock: number;
}

export default function ChargeStoreView({
  user,
  onUpdateUserScore,
  onBack
}: ChargeStoreViewProps) {
  const [availableBundles, setAvailableBundles] = useState<AvailableBundle[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<ChargeRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [revealedCodeInfo, setRevealedCodeInfo] = useState<{ title: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emergencyLocked, setEmergencyLocked] = useState(false);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/charge-store/available?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableBundles(data.bundles || []);
        setMyRedemptions(data.myRedemptions || []);
        setEmergencyLocked(data.emergencyLocked || false);
      }
    } catch (e) {
      console.warn("Failed to fetch store data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async (bundle: AvailableBundle) => {
    if (user.score < bundle.pointsCost) {
      setErrorMsg(`امتیاز شما (${user.score}) برای دریافت این کارت شارژ کافی نیست.`);
      return;
    }

    if (emergencyLocked) {
      setErrorMsg("خروجی کارت شارژ موقتاً توسط مدیر جهت امنیت به حالت تعلیق درآمده است.");
      return;
    }

    setErrorMsg("");
    setRedeemingId(bundle.id);

    try {
      const res = await fetch("/api/charge-store/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          bundleId: bundle.id
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRevealedCodeInfo({
          title: bundle.title,
          code: data.codeRevealed
        });
        onUpdateUserScore(data.newScore);
        fetchStoreData();
      } else {
        setErrorMsg(data.error || "خطا در دریافت کارت شارژ.");
      }
    } catch (e) {
      setErrorMsg("خطا در برقراری ارتباط با سرور امنیتی کارت شارژ.");
    } finally {
      setRedeemingId(null);
    }
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 text-right" dir="rtl">
      {/* Top Banner */}
      <div className="flex items-center justify-between mb-4 bg-indigo-900/40 p-3 rounded-2xl border border-indigo-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">فروشگاه امن شارژ سیم‌کارت</h2>
            <p className="text-[10px] text-indigo-300">تحویل آنی + رمزنگاری یکبارمصرف کدهای شارژ</p>
          </div>
        </div>

        <div className="bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 rounded-xl text-center">
          <span className="text-[9px] text-indigo-300 block">موجودی کیف پول</span>
          <span className="text-xs font-black text-yellow-400 flex items-center justify-center gap-1">
            {user.score} <Coins className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Security notice badge */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 mb-4 flex items-center gap-2 text-emerald-300 text-xs">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />
        <span>کد شارژها به‌صورت مستقیم از دیتابیس امن سرور استخراج و پس از تحویل فوراً سوزانده می‌شوند.</span>
      </div>

      {emergencyLocked && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-3 mb-4 flex items-center gap-2 text-red-300 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>سیستم توزیع کارت شارژ در حالت قفل اضطراری مدیر قرار دارد.</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-3 mb-4 flex items-center gap-2 text-red-300 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Single Revealed Code Result Box */}
      {revealedCodeInfo && (
        <div className="bg-gradient-to-r from-emerald-950 via-indigo-950 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-4 mb-5 shadow-2xl text-center space-y-3">
          <div className="text-xs font-bold text-emerald-400">کد شارژ شما آماده استفاده است:</div>
          <div className="text-sm font-black text-white">{revealedCodeInfo.title}</div>

          <div className="bg-slate-950 border border-emerald-500/40 py-3 px-4 rounded-xl flex items-center justify-between font-mono text-lg font-black text-yellow-300 tracking-widest">
            <span>{revealedCodeInfo.code}</span>
            <button
              onClick={() => copyCodeToClipboard(revealedCodeInfo.code)}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-indigo-950 text-xs font-sans font-bold rounded-lg flex items-center gap-1 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> کپی شد
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> کپی کد
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-indigo-300">توجه: این کد فقط یک‌بار برای شما نمایش داده می‌شود.</p>
        </div>
      )}

      {/* Available Bundles */}
      <h3 className="text-xs font-bold text-indigo-200 mb-3">بسته‌های شارژ قابل دریافت</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {availableBundles.map((bundle) => {
          const canAfford = user.score >= bundle.pointsCost;
          const isStockOut = bundle.availableStock <= 0;

          return (
            <div
              key={bundle.id}
              className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                isStockOut
                  ? "bg-indigo-950/40 border-indigo-900 opacity-60"
                  : canAfford
                  ? "bg-indigo-900/60 border-indigo-700/80 hover:border-yellow-400"
                  : "bg-indigo-950/60 border-indigo-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs ${
                    bundle.operator === "همراه اول"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : bundle.operator === "ایرانسل"
                      ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                      : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  }`}
                >
                  {bundle.operator}
                </div>

                <div>
                  <h4 className="text-xs font-black text-white">{bundle.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-indigo-300 font-bold">
                      مبلغ: {bundle.faceValue}
                    </span>
                    <span className="text-[10px] text-indigo-400">|</span>
                    <span className="text-[10px] text-amber-400 font-bold">
                      موجودی انبار: {bundle.availableStock} عدد
                    </span>
                  </div>
                </div>
              </div>

              <button
                disabled={!canAfford || isStockOut || emergencyLocked || redeemingId === bundle.id}
                onClick={() => handleRedeem(bundle)}
                className={`px-3 py-2 text-xs font-black rounded-xl transition flex items-center gap-1 shadow-md ${
                  isStockOut
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : canAfford && !emergencyLocked
                    ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-indigo-950 hover:scale-105"
                    : "bg-indigo-950 text-indigo-400 border border-indigo-800"
                }`}
              >
                {redeemingId === bundle.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{bundle.pointsCost} امتیاز</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* History of Claims */}
      <h3 className="text-xs font-bold text-indigo-200 mb-2">سوابق دریافت شارژ من ({myRedemptions.length})</h3>
      <div className="space-y-2">
        {myRedemptions.length === 0 ? (
          <div className="text-center py-6 text-indigo-400 text-xs bg-indigo-950/40 rounded-2xl border border-indigo-900">
            هنوز کارت شارژی دریافت نکرده‌اید.
          </div>
        ) : (
          myRedemptions.map((red) => (
            <div
              key={red.id}
              className="bg-indigo-950/80 border border-indigo-800 p-3 rounded-2xl flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white">{red.chargeTitle}</div>
                <div className="text-[10px] text-indigo-300 mt-0.5">
                  تعداد امتیاز خرج‌شده: {red.pointsCost} | تاریخ: {red.date}
                </div>
              </div>

              <div className="font-mono text-xs text-yellow-300 font-bold bg-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-700">
                {red.codeRevealed}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
