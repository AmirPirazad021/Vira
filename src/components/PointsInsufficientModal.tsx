import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Gift } from "lucide-react";

interface PointsInsufficientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimGift: () => void;
}

export default function PointsInsufficientModal({
  isOpen,
  onClose,
  onClaimGift
}: PointsInsufficientModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="points-insufficient-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            id="points-insufficient-card"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-slate-900 border border-amber-500/20 rounded-3xl p-6 shadow-2xl text-center"
            dir="rtl"
          >
            {/* Warning Icon */}
            <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-3">امتیازت کافی نیست</h3>

            {/* Body */}
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              ما در ازای هر روز همراهی، <span className="text-amber-400 font-bold">۵۰ امتیاز هدیه</span> بهت میدیم. 
              ضمناً میتونی از قسمت دریافت هدیه، یک نفر رو به بازی دعوت کنی و <span className="text-amber-400 font-bold">۵۰۰ امتیاز</span> دریافت کنی.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                id="claim-daily-gift-btn"
                onClick={() => {
                  onClaimGift();
                  onClose();
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl transition duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Gift className="w-5 h-5" />
                دریافت ۵۰ امتیاز هدیه روزانه
              </button>

              <button
                id="insufficient-ok-btn"
                onClick={onClose}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl transition duration-200"
              >
                باشه، فهمیدم
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
