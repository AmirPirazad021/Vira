import React, { useState } from "react";
import { UserProfile } from "../types";
import { X, User, Phone, ShieldCheck, Award, Gem, Hash, Calendar, Edit3, Check, LogOut } from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onLogout,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setIsSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, name: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUpdateUser({ ...user, name: newName.trim() });
        setIsEditingName(false);
        setMessage("نام شما با موفقیت تغییر یافت.");
      } else {
        setMessage(data.error || "خطا در ویرایش نام.");
      }
    } catch (e) {
      onUpdateUser({ ...user, name: newName.trim() });
      setIsEditingName(false);
      setMessage("نام در حافظه محلی به‌روزرسانی شد.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-indigo-950 border border-indigo-700/80 w-full max-w-sm rounded-3xl p-5 text-right text-white shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">پروفایل و اطلاعات کاربر</h3>
              <p className="text-[10px] text-indigo-300 font-mono">حساب کاربری فعال</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {message && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs p-2.5 rounded-xl text-center font-bold">
            {message}
          </div>
        )}

        {/* User Card Main Info */}
        <div className="bg-indigo-900/60 border border-indigo-700/60 p-4 rounded-2xl space-y-3">
          {/* Name Field */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-300 font-bold flex items-center gap-1.5">
              <User className="w-4 h-4 text-yellow-400" />
              نام کاربری:
            </span>

            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-indigo-950 border border-yellow-400/60 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none w-28 text-center"
                />
                <button
                  disabled={isSaving}
                  onClick={handleSaveName}
                  className="p-1.5 bg-emerald-500 text-indigo-950 rounded-xl font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-yellow-300">{user.name}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-indigo-400 hover:text-yellow-400 text-xs"
                  title="ویرایش نام"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div className="flex items-center justify-between text-xs border-t border-indigo-800/60 pt-2.5">
            <span className="text-indigo-300 font-bold flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-400" />
              شماره همراه:
            </span>
            <span className="font-mono text-emerald-300 font-black">{user.phoneNumber}</span>
          </div>

          {/* User ID */}
          <div className="flex items-center justify-between text-xs border-t border-indigo-800/60 pt-2.5">
            <span className="text-indigo-300 font-bold flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-cyan-400" />
              شناسه کاربری (ID):
            </span>
            <span className="font-mono text-cyan-300 text-[11px]">{user.id}</span>
          </div>

          {/* Account Role & Security */}
          <div className="flex items-center justify-between text-xs border-t border-indigo-800/60 pt-2.5">
            <span className="text-indigo-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              وضعیت حساب:
            </span>
            <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-lg border border-purple-500/40">
              {user.role === "admin" ? "مدیر سیستم 🛡️" : "کاربر تاییدشده SMS OTP ✅"}
            </span>
          </div>

          {user.createdAt && (
            <div className="flex items-center justify-between text-xs border-t border-indigo-800/60 pt-2.5">
              <span className="text-indigo-300 font-bold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                تاریخ عضویت:
              </span>
              <span className="text-amber-300 text-[11px] font-mono">{user.createdAt}</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-indigo-900/40 border border-indigo-800/60 p-2.5 rounded-2xl">
            <Award className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <span className="text-[10px] text-indigo-300 block">امتیاز کل</span>
            <span className="text-xs font-black text-yellow-400 font-mono">{user.score}</span>
          </div>

          <div className="bg-indigo-900/40 border border-indigo-800/60 p-2.5 rounded-2xl">
            <Gem className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-[10px] text-indigo-300 block">الماس</span>
            <span className="text-xs font-black text-cyan-300 font-mono">{user.diamonds || 10}</span>
          </div>

          <div className="bg-indigo-900/40 border border-indigo-800/60 p-2.5 rounded-2xl">
            <User className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] text-indigo-300 block">سطح حساب</span>
            <span className="text-xs font-black text-emerald-300 font-mono">سطح {user.level || 1}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-black text-xs rounded-2xl transition flex items-center justify-center gap-2 mt-2"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>خروج کامل از حساب کاربری</span>
        </button>
      </div>
    </div>
  );
};
