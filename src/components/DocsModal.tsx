import React, { useState } from "react";
import { X, Download, FileText, Palette, CheckCircle2, Clock, Sparkles, Layers, ShieldCheck } from "lucide-react";
import { jsPDF } from "jspdf";

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"PRD" | "DESIGN">("PRD");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      
      if (activeTab === "PRD") {
        doc.setFontSize(18);
        doc.text("Vira Quiz - Product Requirement Document (PRD)", 10, 20);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        
        doc.text("Version: 2.5.0 | Date: August 2026", 10, 30);
        doc.text("Status: Active & Production Ready", 10, 38);
        
        doc.line(10, 42, 200, 42);
        
        doc.setFont("helvetica", "bold");
        doc.text("1. Executive Summary", 10, 50);
        doc.setFont("helvetica", "normal");
        doc.text("Vira Quiz is a full-stack Iranian quiz and gaming platform built with React + Express.", 10, 58);
        doc.text("It incorporates mandatory phone SMS OTP verification, leagues, and charge store.", 10, 64);
        
        doc.setFont("helvetica", "bold");
        doc.text("2. Implemented Core Features", 10, 75);
        doc.setFont("helvetica", "normal");
        doc.text("- Mandatory Phone SMS OTP Login (Integrated with SMS.ir template fast-send)", 10, 83);
        doc.text("- Game Engine (Single, 2-Player, Online Live League, Offline Packs)", 10, 89);
        doc.text("- Charge Store & Marketplace (MCI, Irancell, Righter with encrypted codes)", 10, 95);
        doc.text("- Rewarded Video Ads (Integrated with Tapsell AppKey & ZoneID)", 10, 101);
        doc.text("- Comprehensive Admin Dashboard (CMS, Users, Audit Logs, Questions)", 10, 107);
        doc.text("- Containerized Production Stack (Dockerfile + docker-compose.yml)", 10, 113);
        
        doc.setFont("helvetica", "bold");
        doc.text("3. Future Roadmap (Pending Features)", 10, 125);
        doc.setFont("helvetica", "normal");
        doc.text("- Cloud SQL PostgreSQL / Firestore Database Sync (ORM Level)", 10, 133);
        doc.text("- In-App Purchases for Diamonds (CafeBazaar & Zibal Gateway)", 10, 139);
        doc.text("- Real-time WebSocket Live Multiplayer 2v2 Arena", 10, 145);
        doc.text("- Gemini AI Automated Question Generator Engine", 10, 151);

        doc.save("Vira_Quiz_PRD_Document.pdf");
      } else {
        doc.setFontSize(18);
        doc.text("Vira Quiz - Design System Specification", 10, 20);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        
        doc.text("Version: 1.0.0 | Environment: Mobile-First Dark Luxury PWA", 10, 30);
        doc.line(10, 35, 200, 35);
        
        doc.setFont("helvetica", "bold");
        doc.text("1. Design Philosophy", 10, 45);
        doc.setFont("helvetica", "normal");
        doc.text("Luxury Dark Indigo Atmosphere designed to prevent eye fatigue.", 10, 53);
        doc.text("High-contrast semantic accents for Diamonds (Cyan) and Gold Points (Amber).", 10, 59);
        
        doc.setFont("helvetica", "bold");
        doc.text("2. Color Palette & Tokens", 10, 70);
        doc.setFont("helvetica", "normal");
        doc.text("Background Canvas: #090d16 (indigo-950)", 10, 78);
        doc.text("Surface Cards: #1e1b4b translucency (bg-indigo-900/60)", 10, 84);
        doc.text("Gold Accent: #f59e0b (text-yellow-400 / amber-500)", 10, 90);
        doc.text("Diamond Cyan: #06b6d4 (text-cyan-400)", 10, 96);
        doc.text("Emerald Success: #10b981 (text-emerald-400)", 10, 102);

        doc.setFont("helvetica", "bold");
        doc.text("3. Corner Radius Math Rule", 10, 115);
        doc.setFont("helvetica", "normal");
        doc.text("Inner Corner Radius = Outer Corner Radius - Padding", 10, 123);
        doc.text("Cards: rounded-3xl (24px) | Buttons: rounded-2xl (16px)", 10, 129);

        doc.save("Vira_Quiz_Design_System.pdf");
      }
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5" dir="rtl">
      <div className="bg-indigo-950 border border-indigo-700/80 w-full max-w-2xl max-h-[90vh] rounded-3xl p-5 text-right text-white shadow-2xl flex flex-col relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-800/80 pb-4 mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center">
              {activeTab === "PRD" ? <FileText className="w-6 h-6" /> : <Palette className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-base font-black text-white">مستندات و فایل‌های ساختار ویرا</h2>
              <p className="text-xs text-indigo-300 font-mono">سند PRD و سیستم طراحی (Design System)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-gradient-to-tr from-yellow-400 to-amber-500 text-indigo-950 font-black text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 hover:scale-105 transition shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? "در حال دریافت..." : "دانلود PDF"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 bg-indigo-900/60 p-1.5 rounded-2xl border border-indigo-800/80 mb-4 flex-shrink-0">
          <button
            onClick={() => setActiveTab("PRD")}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              activeTab === "PRD"
                ? "bg-gradient-to-tr from-yellow-400 to-amber-500 text-indigo-950 shadow-md"
                : "text-indigo-300 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>سند نیازمندی‌های محصول (PRD کامل)</span>
          </button>

          <button
            onClick={() => setActiveTab("DESIGN")}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              activeTab === "DESIGN"
                ? "bg-gradient-to-tr from-yellow-400 to-amber-500 text-indigo-950 shadow-md"
                : "text-indigo-300 hover:text-white"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>سیستم طراحی (Design System)</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-4 pr-1 pl-1 text-xs leading-relaxed text-indigo-100 flex-grow">
          {activeTab === "PRD" ? (
            <div className="space-y-4">
              {/* Box 1: Status */}
              <div className="bg-indigo-900/50 border border-indigo-700/60 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-yellow-400 font-black block text-sm">نسخه ۲.۵.۰ - آماده تولید</span>
                  <span className="text-[11px] text-indigo-300">آخرین به‌روزرسانی: مرداد ۱۴۰۵ (تولید کامل)</span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-xl border border-emerald-500/40">
                  Production Ready 🚀
                </span>
              </div>

              {/* Section: Implemented Features */}
              <div className="space-y-2">
                <h3 className="text-sm font-black text-yellow-400 flex items-center gap-1.5 border-b border-indigo-800/80 pb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ۱. قابلیت‌ها و بخش‌های پیاده‌سازی‌شده (Implemented Features)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-indigo-900/40 border border-indigo-800/60 p-3 rounded-2xl space-y-1">
                    <span className="font-black text-white text-xs block">🔐 احراز هویت پیامکی اجباری (OTP)</span>
                    <p className="text-[11px] text-indigo-300">
                      ورود الزام‌آور با شماره همراه، ارسال کد OTP واقعی از طریق SMS.ir با الگوهای FastSend و ذخیره کامل جلسه.
                    </p>
                  </div>

                  <div className="bg-indigo-900/40 border border-indigo-800/60 p-3 rounded-2xl space-y-1">
                    <span className="font-black text-white text-xs block">🎮 موتور مسابقات و لیگ‌ها</span>
                    <p className="text-[11px] text-indigo-300">
                      لیگ تک‌نفره، دونفره، رقابت آنلاین زنده، چالش‌های گروهی و حالت آفلاین با بسته‌های دانلودی سوالات.
                    </p>
                  </div>

                  <div className="bg-indigo-900/40 border border-indigo-800/60 p-3 rounded-2xl space-y-1">
                    <span className="font-black text-white text-xs block">💳 فروشگاه کارت شارژ</span>
                    <p className="text-[11px] text-indigo-300">
                      امکان تبدیل امتیاز به کارت شارژ همراه اول، ایرانسل و رایتل با سیستم کدهای رمزنگاری‌شده و ماسک‌شده.
                    </p>
                  </div>

                  <div className="bg-indigo-900/40 border border-indigo-800/60 p-3 rounded-2xl space-y-1">
                    <span className="font-black text-white text-xs block">🎬 تبلیغات ویدئویی تپسل (Rewarded)</span>
                    <p className="text-[11px] text-indigo-300">
                      یکپارچه‌سازی تپسل (AppKey & ZoneID) جهت تماشای ویدئو و دریافت فوری الماس و امتیاز.
                    </p>
                  </div>

                  <div className="bg-indigo-900/40 border border-indigo-800/60 p-3 rounded-2xl space-y-1">
                    <span className="font-black text-white text-xs block">🛡️ پنل مدیریت و CMS کامل</span>
                    <p className="text-[11px] text-indigo-300">
                      مدیریت بانک سوالات، دسته‌بندی‌های داینامیک، مدیریت کاربران، تایید سوالات پیشنهادی و لاگ‌های امنیتی.
                    </p>
                  </div>

                  <div className="bg-indigo-900/40 border border-indigo-800/60 p-3 rounded-2xl space-y-1">
                    <span className="font-black text-white text-xs block">🐳 کانتینری‌سازی Docker</span>
                    <p className="text-[11px] text-indigo-300">
                      ارائه Dockerfile دو مرحله‌ای و فایل docker-compose.yml جهت دپلوی آنی روی Cloud Run و سرورهای لینوکس.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Pending Roadmap */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-1.5 border-b border-indigo-800/80 pb-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  ۲. قابلیت‌ها و برنامه‌های آینده که باید اضافه شوند (Roadmap)
                </h3>

                <div className="space-y-2">
                  <div className="bg-indigo-900/30 border border-indigo-800/50 p-2.5 rounded-2xl flex items-start gap-2">
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-lg border border-amber-500/40 mt-0.5">
                      اولویت بالا
                    </span>
                    <div>
                      <span className="font-bold text-white block">اتصال به پایگاه داده دائمی (Cloud SQL / PostgreSQL)</span>
                      <p className="text-[11px] text-indigo-300">
                        مهاجرت از آرایه‌های In-Memory به دیتابیس توزیع‌شده با Drizzle ORM جهت ذخیره دائمی میلیون‌ها کاربر.
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-900/30 border border-indigo-800/50 p-2.5 rounded-2xl flex items-start gap-2">
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-lg border border-amber-500/40 mt-0.5">
                      اولویت بالا
                    </span>
                    <div>
                      <span className="font-bold text-white block">پرداخت درون‌برنامه‌ای (کافه بازار / مایکت / درگاه ریالی)</span>
                      <p className="text-[11px] text-indigo-300">
                        اتصال به SDK کافه بازار و زیبال برای خرید مستقیم بسته‌های الماس و خنثی‌سازی زمان انتظار.
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-900/30 border border-indigo-800/50 p-2.5 rounded-2xl flex items-start gap-2">
                    <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-lg border border-cyan-500/40 mt-0.5">
                      اولویت متوسط
                    </span>
                    <div>
                      <span className="font-bold text-white block">رقابت همزمان زنده ۲ به ۲ (WebSockets Live Arena)</span>
                      <p className="text-[11px] text-indigo-300">
                        ایجاد اتاق‌های بازی همزمان آنلاین با قابلیت چت متنی و صوتی زنده بین حریفان.
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-900/30 border border-indigo-800/50 p-2.5 rounded-2xl flex items-start gap-2">
                    <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-lg border border-purple-500/40 mt-0.5">
                      هوش مصنوعی
                    </span>
                    <div>
                      <span className="font-bold text-white block">موتور هوش مصنوعی طراح سوال (Gemini Question Generator)</span>
                      <p className="text-[11px] text-indigo-300">
                        تولید خودکار روزانه ۱۰۰ سوال استاندارد از آخرین اخبار روز با هوش مصنوعی Gemini.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Design System Header */}
              <div className="bg-indigo-900/50 border border-indigo-700/60 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-yellow-400 font-black block text-sm">سیستم طراحی ویرا (Vira Design System)</span>
                  <span className="text-[11px] text-indigo-300">معماری بصری: Luxury Dark Indigo Atmosphere</span>
                </div>
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </div>

              {/* Colors Grid */}
              <div className="space-y-2">
                <h3 className="text-sm font-black text-cyan-400 flex items-center gap-1.5 border-b border-indigo-800/80 pb-1.5">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  ۱. پالت رنگی و توکن‌های بصری (Color Palette)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="bg-indigo-950 border border-indigo-700 p-2.5 rounded-xl text-center">
                    <div className="w-full h-6 rounded-lg bg-indigo-950 border border-indigo-700 mb-1"></div>
                    <span className="font-bold text-white text-[11px] block">Indigo 950</span>
                    <span className="text-[9px] text-indigo-300 font-mono">#090d16 (Canvas)</span>
                  </div>

                  <div className="bg-indigo-950 border border-indigo-700 p-2.5 rounded-xl text-center">
                    <div className="w-full h-6 rounded-lg bg-gradient-to-tr from-yellow-400 to-amber-500 mb-1"></div>
                    <span className="font-bold text-yellow-300 text-[11px] block">Amber Gold</span>
                    <span className="text-[9px] text-indigo-300 font-mono">#f59e0b (امتیاز/طلا)</span>
                  </div>

                  <div className="bg-indigo-950 border border-indigo-700 p-2.5 rounded-xl text-center">
                    <div className="w-full h-6 rounded-lg bg-cyan-500/80 mb-1"></div>
                    <span className="font-bold text-cyan-300 text-[11px] block">Diamond Cyan</span>
                    <span className="text-[9px] text-indigo-300 font-mono">#06b6d4 (الماس)</span>
                  </div>

                  <div className="bg-indigo-950 border border-indigo-700 p-2.5 rounded-xl text-center">
                    <div className="w-full h-6 rounded-lg bg-emerald-500/80 mb-1"></div>
                    <span className="font-bold text-emerald-300 text-[11px] block">Emerald Green</span>
                    <span className="text-[9px] text-indigo-300 font-mono">#10b981 (تایید/شارژ)</span>
                  </div>

                  <div className="bg-indigo-950 border border-indigo-700 p-2.5 rounded-xl text-center">
                    <div className="w-full h-6 rounded-lg bg-purple-500/80 mb-1"></div>
                    <span className="font-bold text-purple-300 text-[11px] block">Royal Purple</span>
                    <span className="text-[9px] text-indigo-300 font-mono">#a855f7 (مدیریت/VIP)</span>
                  </div>

                  <div className="bg-indigo-950 border border-indigo-700 p-2.5 rounded-xl text-center">
                    <div className="w-full h-6 rounded-lg bg-red-500/80 mb-1"></div>
                    <span className="font-bold text-red-300 text-[11px] block">Rose Danger</span>
                    <span className="text-[9px] text-indigo-300 font-mono">#f43f5e (هشدار/خروج)</span>
                  </div>
                </div>
              </div>

              {/* Typography Rules */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-black text-yellow-400 flex items-center gap-1.5 border-b border-indigo-800/80 pb-1.5">
                  <Layers className="w-4 h-4 text-yellow-400" />
                  ۲. تایپوگرافی و ریاضیات فواصل (Typography & Spacing)
                </h3>

                <div className="bg-indigo-900/40 border border-indigo-800/60 p-3 rounded-2xl space-y-2 text-[11px]">
                  <div className="flex justify-between items-center border-b border-indigo-800/50 pb-1.5">
                    <span className="font-bold text-white">فرمول محاسبه شعاع زوایای تو در تو:</span>
                    <span className="text-yellow-300 font-mono text-[10px]">Inner = Outer - Padding</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-indigo-800/50 pb-1.5">
                    <span className="text-indigo-200">شعاع کارت‌ها و مدال‌های اصلی:</span>
                    <span className="text-cyan-300 font-mono">rounded-3xl (24px)</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-indigo-800/50 pb-1.5">
                    <span className="text-indigo-200">شعاع دکمه‌ها و عناصر تعاملی:</span>
                    <span className="text-cyan-300 font-mono">rounded-2xl (16px)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-200">حداقل لمس در موبایل:</span>
                    <span className="text-emerald-300 font-mono">44px Height Target</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-indigo-800/80 pt-3 mt-3 flex items-center justify-between text-[11px] text-indigo-300 flex-shrink-0">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            فایل‌های سورس در `/docs` ذخیره شده‌اند
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl font-bold transition"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
