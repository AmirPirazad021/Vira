import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lightbulb, Send, CheckCircle2, Clock, AlertCircle, XCircle, Plus, FileText, ChevronLeft } from "lucide-react";
import { QuestionSuggestion, UserProfile } from "../types";

interface SuggestQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  categories: string[];
  onSuggestionSubmitted: () => void;
}

export default function SuggestQuestionModal({
  isOpen,
  onClose,
  user,
  categories,
  onSuggestionSubmitted
}: SuggestQuestionModalProps) {
  const [tab, setTab] = useState<"new" | "history">("new");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [category, setCategory] = useState<string>(categories[0] || "عمومی");
  const [explanation, setExplanation] = useState("");
  const [source, setSource] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [mySuggestions, setMySuggestions] = useState<QuestionSuggestion[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchMySuggestions();
    }
  }, [isOpen]);

  const fetchMySuggestions = async () => {
    try {
      const res = await fetch(`/api/suggestions/my?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setMySuggestions(data);
      }
    } catch (e) {
      console.warn("Error fetching user suggestions:", e);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setErrorMsg("لطفاً متن سؤال را وارد کنید.");
      return;
    }
    if (options.some((opt) => !opt.trim())) {
      setErrorMsg("لطفاً هر ۴ گزینه را تکمیل کنید.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userPhone: user.phoneNumber,
          questionText,
          options,
          correctOptionIndex,
          category,
          explanation,
          source
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("سؤال شما با موفقیت جهت بررسی مدیر ثبت شد! پس از تأیید، ۵۰ امتیاز به کیف‌پول شما اضافه می‌شود.");
        setQuestionText("");
        setOptions(["", "", "", ""]);
        setExplanation("");
        setSource("");
        fetchMySuggestions();
        onSuggestionSubmitted();
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setErrorMsg(data.error || "خطا در ثبت سؤال.");
      }
    } catch (err) {
      setErrorMsg("خطا در ارتباط با سرور.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: QuestionSuggestion["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            تأییدشده (+۵۰ امتیاز)
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold rounded-lg flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-400" />
            ردشده
          </span>
        );
      case "needs_revision":
        return (
          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-lg flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            نیازمند اصلاح
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold rounded-lg flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-400" />
            در انتظار بررسی مدیر
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="suggest-question-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-indigo-950/80 backdrop-blur-md">
          <motion.div
            id="suggest-question-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-md bg-gradient-to-b from-indigo-900 to-indigo-950 border border-indigo-700/60 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-yellow-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">پیشنهاد سؤال به طراحان ویرا</h3>
                  <p className="text-[10px] text-indigo-300">طراح سؤال شو و با هر سؤال تأییدشده ۵۰ امتیاز بگیر!</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-indigo-800/60 hover:bg-indigo-700 text-indigo-300 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-4 bg-indigo-950/80 p-1 rounded-xl border border-indigo-800/50">
              <button
                onClick={() => setTab("new")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  tab === "new"
                    ? "bg-yellow-400 text-indigo-950 shadow-md"
                    : "text-indigo-300 hover:text-white"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                ثبت سؤال جدید
              </button>
              <button
                onClick={() => setTab("history")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  tab === "history"
                    ? "bg-yellow-400 text-indigo-950 shadow-md"
                    : "text-indigo-300 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                سؤالات پیشنهادی من ({mySuggestions.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto pl-1 pr-1 space-y-3">
              {tab === "new" ? (
                <form onSubmit={handleSubmit} className="space-y-3 text-right">
                  {errorMsg && (
                    <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-2.5 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-2.5 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-indigo-200 mb-1">دسته‌بندی موضوعی</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-indigo-950 border border-indigo-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-200 mb-1">متن دقیق سؤال</label>
                    <textarea
                      rows={2}
                      placeholder="مثال: بزرگترین دریاچه جهان چه نام دارد؟"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      className="w-full bg-indigo-950 border border-indigo-700/80 rounded-xl p-2.5 text-xs text-white placeholder-indigo-400/60 focus:outline-none focus:border-yellow-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-200 mb-1">گزینه‌ها (تیک رادیویی برای گزینه صحیح)</label>
                    <div className="space-y-2">
                      {options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-indigo-950/70 p-1.5 rounded-xl border border-indigo-800/80">
                          <input
                            type="radio"
                            name="correctOpt"
                            checked={correctOptionIndex === idx}
                            onChange={() => setCorrectOptionIndex(idx)}
                            className="w-4 h-4 accent-yellow-400 cursor-pointer"
                          />
                          <span className="text-[11px] font-bold text-indigo-300 w-12">گزینه {idx + 1}:</span>
                          <input
                            type="text"
                            placeholder={`متن گزینه ${idx + 1}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-200 mb-1">توضیح پاسخ یا منبع علمی (اختیاری)</label>
                    <input
                      type="text"
                      placeholder="مثال: دریای خزر بر اساس جغرافیا بزرگترین دریاچه محصور است."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      className="w-full bg-indigo-950 border border-indigo-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-indigo-400/60 focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 mt-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-indigo-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 transition"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? "درحال ارسال به مدیر..." : "ارسال جهت بررسی و دریافت امتیاز"}
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  {mySuggestions.length === 0 ? (
                    <div className="text-center py-10 text-indigo-300 text-xs">
                      هنوز هیچ سؤالی پیشنهاد نداده‌اید. با اولین سؤال ۵۰ امتیاز هدیه بگیرید!
                    </div>
                  ) : (
                    mySuggestions.map((sug) => (
                      <div
                        key={sug.id}
                        className="bg-indigo-950/80 border border-indigo-800 p-3 rounded-2xl space-y-2 text-right"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded font-bold">
                            {sug.category}
                          </span>
                          {getStatusBadge(sug.status)}
                        </div>

                        <p className="text-xs font-bold text-white leading-relaxed">{sug.questionText}</p>

                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {sug.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`text-[10px] p-1.5 rounded-lg border ${
                                i === sug.correctOptionIndex
                                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                                  : "bg-indigo-900/40 border-indigo-800/60 text-indigo-300"
                              }`}
                            >
                              {i + 1}. {opt} {i === sug.correctOptionIndex && "✓"}
                            </div>
                          ))}
                        </div>

                        {sug.adminNote && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-[10px] text-amber-300 mt-2">
                            <strong>پیام مدیر:</strong> {sug.adminNote}
                          </div>
                        )}

                        <div className="text-[9px] text-indigo-400/80 text-left pt-1">
                          تاریخ ثبت: {new Date(sug.createdAt).toLocaleDateString("fa-IR")}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
