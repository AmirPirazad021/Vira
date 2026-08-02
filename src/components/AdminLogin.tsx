import React, { useState } from "react";
import { ShieldCheck, Lock, User, KeyRound, AlertCircle, ArrowRight } from "lucide-react";

interface AdminLoginProps {
  onSuccess: (token: string) => void;
  onBackToApp: () => void;
}

export default function AdminLogin({ onSuccess, onBackToApp }: AdminLoginProps) {
  const [username, setUsername] = useState("adminuser");
  const [password, setPassword] = useState("adminpass");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("vira_admin_session", data.token);
        onSuccess(data.token);
      } else {
        setError(data.error || "نام کاربری یا کلمه عبور نامعتبر است.");
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-right" dir="rtl">
      <div className="max-w-md w-full bg-indigo-950/90 border border-indigo-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-indigo-500" />

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBackToApp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/60 hover:bg-indigo-900 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-700/50 transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به برنامه</span>
          </button>
          <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-xl font-black text-white mb-1">ورود به پنل مدیریت ویرا</h1>
          <p className="text-xs text-indigo-300">برای دسترسی به تنظیمات و دیتابیس مشترک وارد شوید</p>
        </div>

        {error && (
          <div className="mb-5 bg-red-500/20 border border-red-500/40 rounded-2xl p-3 flex items-center gap-2 text-red-300 text-xs font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-indigo-200 mb-1.5">نام کاربری (Username)</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="adminuser"
                className="w-full bg-slate-900/90 border border-indigo-800 rounded-2xl py-3 px-4 text-xs font-mono text-white placeholder-indigo-500 focus:outline-none focus:border-yellow-400 transition"
              />
              <User className="w-4 h-4 text-indigo-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-indigo-200 mb-1.5">کلمه عبور (Password)</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-indigo-800 rounded-2xl py-3 px-4 text-xs font-mono text-white placeholder-indigo-500 focus:outline-none focus:border-yellow-400 transition"
              />
              <Lock className="w-4 h-4 text-indigo-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Preset credentials tip */}
          <div className="bg-indigo-900/50 border border-indigo-800 rounded-2xl p-3 text-[11px] text-indigo-300 flex items-center justify-between">
            <span className="font-bold">یوزرنیم / پسورد پیش‌فرض:</span>
            <span className="font-mono bg-indigo-950 px-2 py-1 rounded border border-indigo-700 text-yellow-400">adminuser / adminpass</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:brightness-105 text-indigo-950 font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>در حال بررسی اعتبار...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>ورود به سامانه مدیریت</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-indigo-900/80 text-center text-[11px] text-indigo-400">
          دیتابیس ویرا به‌صورت مشترک و زنده بین پنل و اپلیکیشن همگام است.
        </div>
      </div>
    </div>
  );
}
