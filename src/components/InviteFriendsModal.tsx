import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Gift, Share2, Copy, Check, X, Smartphone, AlertCircle } from "lucide-react";
import { UserProfile } from "../types";

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onInviteSuccess: (newScore: number) => void;
}

export default function InviteFriendsModal({
  isOpen,
  onClose,
  user,
  onInviteSuccess
}: InviteFriendsModalProps) {
  const [friendPhone, setFriendPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const referralLink = `https://vira-quiz.ir/invite?ref=${user.phoneNumber || "09121111111"}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendInvite = async () => {
    if (!friendPhone || !friendPhone.match(/^09\d{9}$/)) {
      setErrorMsg("لطفاً یک شماره معتبر با قالب 09123456789 وارد کنید");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/referral/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          invitedPhone: friendPhone
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const newScore = user.score + 10;
        setSuccessMsg("🎉 ۱۰ امتیاز پاداش دعوت از دوست به حساب شما اضافه شد!");
        onInviteSuccess(newScore);
        setFriendPhone("");
      } else {
        setErrorMsg(data.error || "خطا در ثبت دعوت دوست");
      }
    } catch (e) {
      setErrorMsg("خطا در برقراری ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-indigo-950/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-700/60 rounded-3xl p-5 shadow-2xl relative text-right"
            dir="rtl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-indigo-800/60 text-indigo-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-indigo-950 flex items-center justify-center font-black shadow-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">دعوت دوستان (+۱۰ امتیاز)</h3>
                <p className="text-[11px] text-indigo-200">با دعوت از هر دوست ۱۰ امتیاز هدیه بگیرید!</p>
              </div>
            </div>

            {/* Share link box */}
            <div className="bg-indigo-950/80 border border-indigo-800 rounded-2xl p-3 mb-4 space-y-2">
              <span className="text-[11px] font-bold text-yellow-400 block">لینک اختصاصی دعوت شما:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-indigo-900/60 border border-indigo-700 rounded-xl px-2.5 py-1.5 text-[10px] text-indigo-200 text-left font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black text-xs rounded-xl flex items-center gap-1 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "کپی شد" : "کپی"}
                </button>
              </div>
            </div>

            {/* Invite by Phone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">ثبت شماره همراه دوست دعوت شده:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={11}
                  placeholder="09123456789"
                  value={friendPhone}
                  onChange={(e) => setFriendPhone(e.target.value)}
                  className="flex-1 bg-indigo-950 border border-indigo-700 rounded-xl px-3 py-2 text-xs font-bold text-white text-center tracking-widest focus:outline-none focus:border-yellow-400"
                />
                <button
                  disabled={isSubmitting}
                  onClick={handleSendInvite}
                  className="px-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-indigo-950 font-black text-xs rounded-xl shadow-md transition"
                >
                  {isSubmitting ? "ثبت..." : "ثبت و دریافت ۱۰ امتیاز"}
                </button>
              </div>

              {errorMsg && (
                <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-2 text-red-300 text-[11px] flex items-center gap-1.5 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-2 text-emerald-300 text-[11px] flex items-center gap-1.5 mt-2 font-bold">
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
