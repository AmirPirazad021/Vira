import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import * as XLSX from "xlsx";
import {
  ShieldCheck,
  Lightbulb,
  HelpCircle,
  Bell,
  CreditCard,
  Video,
  FileText,
  Plus,
  Check,
  X,
  Edit2,
  Trash2,
  Upload,
  Lock,
  Unlock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Database,
  Users,
  FileSpreadsheet,
  UserCheck,
  UserX,
  KeyRound
} from "lucide-react";

import {
  Question,
  QuestionSuggestion,
  Announcement,
  ChargeItem,
  AuditLog,
  AdRewardLog,
  CategoryItem,
  UserProfile
} from "../types";

interface AdminDashboardProps {
  onBackToApp: () => void;
}

export default function AdminDashboard({ onBackToApp }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "users" | "questions" | "charge" | "suggestions" | "announcements" | "ads" | "audit"
  >("users");

  // State data
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [suggestions, setSuggestions] = useState<QuestionSuggestion[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [chargeInventory, setChargeInventory] = useState<ChargeItem[]>([]);
  const [adLogs, setAdLogs] = useState<AdRewardLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [emergencyLocked, setEmergencyLocked] = useState(false);

  // Forms / Modals
  const [newCatName, setNewCatName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("all");
  const [feedback, setFeedback] = useState("");

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Charge Product Edit Modal State
  const [editingCharge, setEditingCharge] = useState<ChargeItem | null>(null);

  // Admin Credentials Modal State
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");

  // Question Form
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [qCategory, setQCategory] = useState("عمومی");
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState<string[]>(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState(0);
  const [qExplanation, setQExplanation] = useState("");
  const [qDifficulty, setQDifficulty] = useState<"ساده" | "متوسط" | "سخت">("متوسط");

  // Announcement Form
  const [isAddingAnno, setIsAddingAnno] = useState(false);
  const [annoTitle, setAnnoTitle] = useState("");
  const [annoBody, setAnnoBody] = useState("");
  const [annoImg, setAnnoImg] = useState("");
  const [annoImportant, setAnnoImportant] = useState(false);

  // Charge Inventory Form
  const [isAddingCharge, setIsAddingCharge] = useState(false);
  const [cOperator, setCOperator] = useState<"همراه اول" | "ایرانسل" | "رایتل">("همراه اول");
  const [cTitle, CSetTitle] = useState("شارژ ۱۰,۰۰۰ ریالی");
  const [cValue, CSetValue] = useState("۱۰,۰۰۰ ریال");
  const [cCost, CSetCost] = useState(100);
  const [cCode, CSetCode] = useState("");

  // Excel Bulk Import Modal
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelJsonText, setExcelJsonText] = useState("");

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const fetchAllAdminData = async () => {
    try {
      const [resUsers, resSug, resQ, resCat, resAnno, resCharge, resAds, resAudit] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/suggestions"),
        fetch("/api/admin/questions"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/announcements"),
        fetch("/api/admin/charge-inventory"),
        fetch("/api/admin/ad-logs"),
        fetch("/api/admin/audit-logs")
      ]);

      if (resUsers.ok) setUsers(await resUsers.json());
      if (resSug.ok) setSuggestions(await resSug.json());
      if (resQ.ok) setQuestions(await resQ.json());
      if (resCat.ok) setCategories(await resCat.json());
      if (resAnno.ok) setAnnouncements(await resAnno.json());
      if (resCharge.ok) {
        const cData = await resCharge.json();
        setChargeInventory(cData.inventory || []);
        setEmergencyLocked(cData.emergencyLocked || false);
      }
      if (resAds.ok) setAdLogs(await resAds.json());
      if (resAudit.ok) setAuditLogs(await resAudit.json());
    } catch (e) {
      console.warn("Failed loading admin data:", e);
    }
  };

  const triggerNotify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 4000);
  };

  // --- 1. Suggestion Handlers ---
  const handleApproveSuggestion = async (sugId: string) => {
    try {
      const res = await fetch(`/api/admin/suggestions/${sugId}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        triggerNotify("سؤال تأیید و وارد بانک سؤالات شد. ۵۰ امتیاز به کاربر اعطا گردید!");
        fetchAllAdminData();
      } else {
        triggerNotify(data.error || "خطا در تأیید سؤال");
      }
    } catch (e) {
      triggerNotify("خطا در برقراری ارتباط");
    }
  };

  const handleRejectSuggestion = async (sugId: string) => {
    const reason = prompt("علت رد سؤال را وارد کنید:") || "سؤال تکراری یا نامناسب بود.";
    try {
      const res = await fetch(`/api/admin/suggestions/${sugId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        triggerNotify("سؤال رد شد.");
        fetchAllAdminData();
      }
    } catch (e) {
      triggerNotify("خطا در رد سؤال");
    }
  };

  // --- 2. Category Handlers ---
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName })
      });
      if (res.ok) {
        setNewCatName("");
        triggerNotify("دسته‌بندی جدید اضافه شد.");
        fetchAllAdminData();
      }
    } catch (e) {
      triggerNotify("خطا در افزودن دسته‌بندی");
    }
  };

  // --- 3. Question Handlers ---
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || qOptions.some((o) => !o.trim())) {
      triggerNotify("لطفاً متن سؤال و ۴ گزینه را وارد کنید.");
      return;
    }

    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: qCategory,
          questionText: qText,
          options: qOptions,
          correctOptionIndex: qCorrect,
          explanation: qExplanation,
          difficulty: qDifficulty
        })
      });

      if (res.ok) {
        triggerNotify("سؤال جدید به بانک افزوده‌شد.");
        setQText("");
        setQOptions(["", "", "", ""]);
        setQExplanation("");
        setIsAddingQuestion(false);
        fetchAllAdminData();
      }
    } catch (e) {
      triggerNotify("خطا در ثبت سؤال");
    }
  };

  const handleToggleQuestionActive = async (qId: string) => {
    try {
      await fetch(`/api/admin/questions/${qId}/toggle`, { method: "POST" });
      fetchAllAdminData();
    } catch (e) {
      console.warn("Toggle question active status failed");
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("آیا از حذف این سؤال اطمینان دارید؟")) return;
    try {
      await fetch(`/api/admin/questions/${qId}`, { method: "DELETE" });
      triggerNotify("سؤال حذف شد.");
      fetchAllAdminData();
    } catch (e) {
      triggerNotify("خطا در حذف سؤال");
    }
  };

  // --- 3.5 User Management Handlers ---
  const handleToggleBlockUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-block`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        triggerNotify(data.isBlocked ? "کاربر با موفقیت مسدود گردید." : "کاربر رفع مسدودی گردید.");
        fetchAllAdminData();
      }
    } catch (e) {
      triggerNotify("خطا در تغییر وضعیت کاربر");
    }
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingUser.name,
          score: Number(editingUser.score),
          level: Number(editingUser.level),
          diamonds: Number(editingUser.diamonds),
          role: editingUser.role,
          isBlocked: editingUser.isBlocked
        })
      });

      if (res.ok) {
        triggerNotify("مشخصات و امتیازات کاربر با موفقیت ویرایش گردید.");
        setEditingUser(null);
        fetchAllAdminData();
      }
    } catch (e) {
      triggerNotify("خطا در ویرایش اطلاعات کاربر");
    }
  };

  // --- 3.6 Product / Charge Management Handlers ---
  const handleSaveChargeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCharge) return;

    try {
      const res = await fetch(`/api/admin/charge-inventory/edit/${editingCharge.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operator: editingCharge.operator,
          title: editingCharge.title,
          faceValue: editingCharge.faceValue,
          pointsCost: Number(editingCharge.pointsCost),
          codeRaw: editingCharge.codeRaw
        })
      });

      if (res.ok) {
        triggerNotify("اطلاعات محصول/کارت شارژ با موفقیت به‌روزرسانی شد.");
        setEditingCharge(null);
        fetchAllAdminData();
      }
    } catch (e) {
      triggerNotify("خطا در ویرایش کارت شارژ");
    }
  };

  const handleDeleteCharge = async (id: string) => {
    if (!confirm("آیا از حذف این کارت شارژ از انبار اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/charge-inventory/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerNotify("محصول با موفقیت از انبار حذف شد.");
        fetchAllAdminData();
      }
    } catch (e) {
      triggerNotify("خطا در حذف کارت شارژ");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

        if (rawData.length < 2) {
          triggerNotify("فایل اکسل تهی است یا سطرهای معتبر ندارد.");
          return;
        }

        const questionsToImport: any[] = [];
        const startRow = typeof rawData[0][0] === "string" && rawData[0][0].includes("دسته") ? 1 : 0;

        for (let i = startRow; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || !row[1]) continue;

          const category = row[0] ? String(row[0]).trim() : "عمومی";
          const questionText = String(row[1]).trim();
          const opt1 = row[2] ? String(row[2]).trim() : "";
          const opt2 = row[3] ? String(row[3]).trim() : "";
          const opt3 = row[4] ? String(row[4]).trim() : "";
          const opt4 = row[5] ? String(row[5]).trim() : "";
          const correctVal = row[6] !== undefined ? String(row[6]).trim() : "1";

          let correctIndex = 0;
          if (["1", "2", "3", "4"].includes(correctVal)) {
            correctIndex = parseInt(correctVal, 10) - 1;
          } else if (["0", "1", "2", "3"].includes(correctVal)) {
            correctIndex = parseInt(correctVal, 10);
          } else {
            if (correctVal === opt1) correctIndex = 0;
            else if (correctVal === opt2) correctIndex = 1;
            else if (correctVal === opt3) correctIndex = 2;
            else if (correctVal === opt4) correctIndex = 3;
          }

          questionsToImport.push({
            category,
            questionText,
            options: [opt1, opt2, opt3, opt4],
            correctOptionIndex: correctIndex,
            explanation: row[7] ? String(row[7]).trim() : ""
          });
        }

        if (questionsToImport.length === 0) {
          triggerNotify("هیچ سوال معتبری پیدا نشد.");
          return;
        }

        const res = await fetch("/api/admin/questions/import-excel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: questionsToImport })
        });

        const data = await res.json();
        if (res.ok) {
          triggerNotify(`تعداد ${data.importedCount} سوال با موفقیت از اکسل استخراج و وارد بانک سوالات گردید!`);
          setIsExcelModalOpen(false);
          fetchAllAdminData();
        } else {
          triggerNotify(data.error || "خطا در افزودن سوالات");
        }
      } catch (err) {
        console.error(err);
        triggerNotify("فرمت فایل اکسل نامعتبر است. فرمت ستون‌ها: دسته بندی | سوال | گزینه ۱ | گزینه ۲ | گزینه ۳ | گزینه ۴ | جواب صحیح");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExcelImport = async () => {
    try {
      const parsed = JSON.parse(excelJsonText);
      const res = await fetch("/api/admin/questions/import-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: parsed })
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotify(`تعداد ${data.importedCount} سؤال به صورت گروهی وارد دیتابیس شد!`);
        setIsExcelModalOpen(false);
        setExcelJsonText("");
        fetchAllAdminData();
      } else {
        triggerNotify(data.error || "فرمت اکسل/جیسون نادرست است.");
      }
    } catch (e) {
      triggerNotify("کد JSON وارد شده نامعتبر است.");
    }
  };

  // --- 4. Announcement Handlers ---
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annoTitle.trim() || !annoBody.trim()) return;

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annoTitle,
          body: annoBody,
          imageUrl: annoImg,
          isImportant: annoImportant
        })
      });

      if (res.ok) {
        triggerNotify("اطلاعیه جدید با موفقیت منتشر شد!");
        setAnnoTitle("");
        setAnnoBody("");
        setAnnoImg("");
        setIsAddingAnno(false);
        fetchAllAdminData();
      }
    } catch (e) {
      triggerNotify("خطا در انتشار اطلاعیه");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      triggerNotify("اطلاعیه حذف شد.");
      fetchAllAdminData();
    } catch (e) {
      triggerNotify("خطا در حذف اطلاعیه");
    }
  };

  // --- 5. Charge Card & Emergency Lock Handlers ---
  const handleToggleEmergencyLock = async () => {
    try {
      const res = await fetch("/api/admin/toggle-emergency-lock", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setEmergencyLocked(data.emergencyLocked);
        triggerNotify(
          data.emergencyLocked
            ? "قفل اضطراری خروجی کارت شارژ فعال گردید (تمام درخواست‌های دریافت مسدود شدند)."
            : "قفل اضطراری کارت شارژ برداشته شد."
        );
      }
    } catch (e) {
      triggerNotify("خطا در تغییر وضعیت قفل اضطراری");
    }
  };

  const handleAddChargeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cCode.trim()) return;

    try {
      const res = await fetch("/api/admin/charge-inventory/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operator: cOperator,
          title: cTitle,
          faceValue: cValue,
          pointsCost: Number(cCost),
          codeRaw: cCode
        })
      });

      if (res.ok) {
        triggerNotify("کد کارت شارژ به صورت رمزنگاری‌شده در انبار ذخیره شد.");
        CSetCode("");
        setIsAddingCharge(false);
        fetchAllAdminData();
      }
    } catch (e) {
      triggerNotify("خطا در افزودن کارت شارژ");
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesCat = selectedCatFilter === "all" || q.category === selectedCatFilter;
    const matchesSearch = q.questionText.includes(searchQuery) || q.options.some((o) => o.includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#07090e] text-white p-3 md:p-6 overflow-y-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-indigo-900 to-indigo-950 p-4 rounded-3xl border border-indigo-700/60 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-indigo-950 font-black flex items-center justify-center text-xl shadow-lg">
            🛡️
          </div>
          <div>
            <h1 className="text-lg font-black text-white">پنل مدیریت پیشرفته ویرا (Vira Admin Panel)</h1>
            <p className="text-xs text-indigo-300">مدیریت کامل بانک سوالات، اطلاعیه‌ها، کارت شارژ امن و ضدتقلب</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCredentialsModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-800 hover:bg-indigo-700 text-yellow-300 font-bold text-xs rounded-xl transition border border-indigo-600 flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>تغییر رمز ورود</span>
          </button>

          <button
            onClick={onBackToApp}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black text-xs rounded-xl transition shadow-md"
          >
            بازگشت به برنامه 📱
          </button>
        </div>
      </div>

      {feedback && (
        <div className="bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 p-3 rounded-2xl text-xs font-bold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-indigo-950/80 p-1.5 rounded-2xl border border-indigo-800">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "users" ? "bg-yellow-400 text-indigo-950 shadow-md" : "text-indigo-300 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          مدیریت کاربران ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("questions")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "questions" ? "bg-yellow-400 text-indigo-950 shadow-md" : "text-indigo-300 hover:text-white"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          بانک سوالات و اکسل ({questions.length})
        </button>

        <button
          onClick={() => setActiveTab("charge")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "charge" ? "bg-yellow-400 text-indigo-950 shadow-md" : "text-indigo-300 hover:text-white"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          محصولات و انبار کارت شارژ
        </button>

        <button
          onClick={() => setActiveTab("suggestions")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "suggestions" ? "bg-yellow-400 text-indigo-950 shadow-md" : "text-indigo-300 hover:text-white"
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          پیشنهاد سوالات ({suggestions.filter((s) => s.status === "pending").length})
        </button>

        <button
          onClick={() => setActiveTab("announcements")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "announcements" ? "bg-yellow-400 text-indigo-950 shadow-md" : "text-indigo-300 hover:text-white"
          }`}
        >
          <Bell className="w-4 h-4" />
          مدیریت اطلاعیه‌ها ({announcements.length})
        </button>

        <button
          onClick={() => setActiveTab("ads")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "ads" ? "bg-yellow-400 text-indigo-950 shadow-md" : "text-indigo-300 hover:text-white"
          }`}
        >
          <Video className="w-4 h-4" />
          سوابق تبلیغات جایزه‌دار ({adLogs.length})
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "audit" ? "bg-yellow-400 text-indigo-950 shadow-md" : "text-indigo-300 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          لاگ‌های امنیتی (Audit)
        </button>
      </div>

      {/* --- TAB 0: User Management & Monitoring --- */}
      {activeTab === "users" && (
        <div className="space-y-5">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-indigo-900/60 border border-indigo-700/60 p-4 rounded-2xl">
              <span className="text-[11px] text-indigo-300 font-bold block mb-1">کل کاربران ثبت‌شده</span>
              <span className="text-xl font-black text-white">{users.length} نفر</span>
            </div>
            <div className="bg-indigo-900/60 border border-indigo-700/60 p-4 rounded-2xl">
              <span className="text-[11px] text-indigo-300 font-bold block mb-1">کاربران فعال</span>
              <span className="text-xl font-black text-emerald-400">{users.filter(u => !u.isBlocked).length} نفر</span>
            </div>
            <div className="bg-indigo-900/60 border border-indigo-700/60 p-4 rounded-2xl">
              <span className="text-[11px] text-indigo-300 font-bold block mb-1">کاربران مسدود شده</span>
              <span className="text-xl font-black text-red-400">{users.filter(u => u.isBlocked).length} نفر</span>
            </div>
            <div className="bg-indigo-900/60 border border-indigo-700/60 p-4 rounded-2xl">
              <span className="text-[11px] text-indigo-300 font-bold block mb-1">کل تبلیغات دیده‌شده</span>
              <span className="text-xl font-black text-amber-400">{adLogs.length} ویدیو</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-indigo-950 p-3 rounded-2xl border border-indigo-800">
            <Search className="w-4 h-4 text-indigo-400" />
            <input
              type="text"
              placeholder="جستجو با شماره تلفن یا نام کاربر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-indigo-400 focus:outline-none w-full"
            />
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {users
              .filter(u => u.phoneNumber.includes(searchQuery) || u.name.includes(searchQuery))
              .map(u => (
                <div key={u.id} className="bg-indigo-950 border border-indigo-800 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-800 border border-indigo-600 flex items-center justify-center font-black text-yellow-400">
                      {u.name.charAt(0) || "👤"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-white">{u.name}</h4>
                        <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-300 font-bold text-[10px] rounded-lg">
                          سطح {u.level}
                        </span>
                        {u.role === "admin" && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-black text-[10px] rounded-lg border border-purple-500/40">
                            مدیر سیستم (Admin)
                          </span>
                        )}
                        {u.isBlocked ? (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-300 font-bold text-[10px] rounded-lg border border-red-500/30 flex items-center gap-1">
                            <UserX className="w-3 h-3" /> مسدود
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] rounded-lg border border-emerald-500/30 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> فعال
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-indigo-300 mt-0.5 dir-ltr text-right">📱 {u.phoneNumber}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="text-center">
                      <span className="text-[10px] text-indigo-400 block">امتیاز (کیف پول)</span>
                      <span className="font-black text-yellow-400">{u.score} امتیاز</span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-indigo-400 block">الماس</span>
                      <span className="font-black text-cyan-400">{u.diamonds || 0} 💎</span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-indigo-400 block">مشاهده تبلیغ</span>
                      <span className="font-bold text-white">{u.adsWatchedCount || 0} بار</span>
                    </div>

                    <div className="flex items-center gap-2 mr-2">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-yellow-300 text-xs font-bold rounded-xl flex items-center gap-1 shadow"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        ویرایش
                      </button>

                      <button
                        onClick={() => handleToggleBlockUser(u.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
                          u.isBlocked
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                            : "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                        }`}
                      >
                        {u.isBlocked ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            رفع مسدودی
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            مسدودسازی
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* --- TAB 1: User Suggestions --- */}
      {activeTab === "suggestions" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">سؤالات پیشنهادی کاربران جهت بررسی و اعطای امتیاز</h3>

          {suggestions.length === 0 ? (
            <div className="text-center py-12 text-indigo-300 text-xs bg-indigo-950/40 rounded-3xl border border-indigo-900">
              هیچ سؤال پیشنهادی در صف بررسی وجود ندارد.
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((sug) => (
                <div
                  key={sug.id}
                  className={`p-4 rounded-3xl border transition ${
                    sug.status === "pending"
                      ? "bg-indigo-900/60 border-indigo-700 hover:border-yellow-400"
                      : "bg-indigo-950/40 border-indigo-900 opacity-70"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[10px] font-bold rounded-lg">
                        دسته: {sug.category}
                      </span>
                      <span className="text-xs font-bold text-indigo-200">
                        پیشنهاددهنده: {sug.userName} ({sug.userPhone})
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg ${
                        sug.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : sug.status === "rejected"
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      وضعیت: {sug.status === "approved" ? "تأییدشده" : sug.status === "rejected" ? "ردشده" : "در انتظار بررسی"}
                    </span>
                  </div>

                  <p className="text-xs font-black text-white mb-3">{sug.questionText}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {sug.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border text-xs ${
                          i === sug.correctOptionIndex
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                            : "bg-indigo-950 border-indigo-800 text-indigo-300"
                        }`}
                      >
                        {i + 1}. {opt} {i === sug.correctOptionIndex && "✓"}
                      </div>
                    ))}
                  </div>

                  {sug.explanation && (
                    <div className="text-[11px] text-indigo-300 bg-indigo-950/80 p-2.5 rounded-xl border border-indigo-800 mb-3">
                      <strong>منبع/توضیح:</strong> {sug.explanation}
                    </div>
                  )}

                  {sug.status === "pending" && (
                    <div className="flex gap-2 pt-2 border-t border-indigo-800/60">
                      <button
                        onClick={() => handleApproveSuggestion(sug.id)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-indigo-950 text-xs font-black rounded-xl transition flex items-center gap-1 shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        تأیید و پرداخت ۵۰ امتیاز هدیه به کاربر
                      </button>

                      <button
                        onClick={() => handleRejectSuggestion(sug.id)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold rounded-xl transition flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        رد سؤال
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: Question & Category Management --- */}
      {activeTab === "questions" && (
        <div className="space-y-6">
          {/* Dynamic Categories CRUD Bar */}
          <div className="bg-indigo-900/50 p-4 rounded-3xl border border-indigo-800 space-y-3">
            <h4 className="text-xs font-bold text-indigo-200">مدیریت دسته‌بندی‌های پویا</h4>

            <div className="flex flex-wrap items-center gap-2">
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="px-3 py-1.5 bg-indigo-950 border border-indigo-700/80 text-white text-xs font-bold rounded-xl flex items-center gap-2"
                >
                  {c.name}
                  <span className="text-[10px] text-yellow-400">({c.questionCount} سوال)</span>
                </span>
              ))}
            </div>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="عنوان دسته‌بندی جدید..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 bg-indigo-950 border border-indigo-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black text-xs rounded-xl"
              >
                افزودن دسته‌بندی
              </button>
            </div>
          </div>

          {/* Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsAddingQuestion(!isAddingQuestion)}
                className="px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-indigo-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                افزودن سؤال جدید
              </button>

              <label className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-indigo-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg cursor-pointer">
                <FileSpreadsheet className="w-4 h-4" />
                <span>ورود از فایل اکسل (.xlsx)</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setIsExcelModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg"
              >
                <Upload className="w-4 h-4 text-yellow-400" />
                ورود متن JSON
              </button>
            </div>

            {/* Filter / Search */}
            <div className="flex items-center gap-2">
              <select
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="bg-indigo-950 border border-indigo-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="all">همه دسته‌ها ({questions.length})</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="جستجو در سوالات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-indigo-950 border border-indigo-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Create Question Form Modal/Box */}
          {isAddingQuestion && (
            <form onSubmit={handleCreateQuestion} className="bg-indigo-900/80 p-5 rounded-3xl border border-indigo-700 space-y-4">
              <h4 className="text-sm font-black text-white">ایجاد سؤال جدید</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-indigo-200 mb-1">دسته‌بندی</label>
                  <select
                    value={qCategory}
                    onChange={(e) => setQCategory(e.target.value)}
                    className="w-full bg-indigo-950 border border-indigo-700 rounded-xl p-2 text-xs text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-indigo-200 mb-1">سطح سختی</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as any)}
                    className="w-full bg-indigo-950 border border-indigo-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="ساده">ساده</option>
                    <option value="متوسط">متوسط</option>
                    <option value="سخت">سخت</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-indigo-200 mb-1">متن سؤال</label>
                <input
                  type="text"
                  placeholder="متن سؤال..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full bg-indigo-950 border border-indigo-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {qOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 bg-indigo-950 p-2 rounded-xl border border-indigo-800">
                    <input
                      type="radio"
                      name="adminCorrect"
                      checked={qCorrect === i}
                      onChange={() => setQCorrect(i)}
                      className="accent-yellow-400"
                    />
                    <input
                      type="text"
                      placeholder={`گزینه ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...qOptions];
                        newOpts[i] = e.target.value;
                        setQOptions(newOpts);
                      }}
                      className="bg-transparent text-xs text-white focus:outline-none flex-1"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs text-indigo-200 mb-1">توضیح پاسخ</label>
                <input
                  type="text"
                  placeholder="توضیحات پاسخ صحیح..."
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  className="w-full bg-indigo-950 border border-indigo-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="px-5 py-2.5 bg-yellow-400 text-indigo-950 font-black text-xs rounded-xl">
                  ذخیره سؤال
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingQuestion(false)}
                  className="px-4 py-2.5 bg-indigo-800 text-indigo-200 text-xs rounded-xl"
                >
                  انصراف
                </button>
              </div>
            </form>
          )}

          {/* Question List */}
          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <div key={q.id} className="bg-indigo-950/80 border border-indigo-800/80 p-4 rounded-3xl flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-300 text-[10px] font-bold rounded">
                      {q.category}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-800 text-indigo-200 text-[10px] rounded">
                      {q.difficulty || "متوسط"}
                    </span>
                    {q.isActive ? (
                      <span className="text-[10px] text-emerald-400 font-bold">● فعال</span>
                    ) : (
                      <span className="text-[10px] text-red-400 font-bold">● غیرفعال</span>
                    )}
                  </div>
                  <h5 className="text-xs font-black text-white">{q.questionText}</h5>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleQuestionActive(q.id)}
                    className="p-2 bg-indigo-900 hover:bg-indigo-800 text-indigo-200 rounded-xl text-xs font-bold"
                  >
                    {q.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: Announcements --- */}
      {activeTab === "announcements" && (
        <div className="space-y-4">
          <button
            onClick={() => setIsAddingAnno(!isAddingAnno)}
            className="px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-indigo-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            انتشار اطلاعیه جدید
          </button>

          {isAddingAnno && (
            <form onSubmit={handleCreateAnnouncement} className="bg-indigo-900/80 p-5 rounded-3xl border border-indigo-700 space-y-3">
              <h4 className="text-sm font-black text-white">انتشار اطلاعیه جدید</h4>

              <input
                type="text"
                placeholder="عنوان اطلاعیه..."
                value={annoTitle}
                onChange={(e) => setAnnoTitle(e.target.value)}
                className="w-full bg-indigo-950 border border-indigo-700 rounded-xl p-2.5 text-xs text-white"
              />

              <input
                type="text"
                placeholder="لینک تصویر شاخص (عکس کاور)..."
                value={annoImg}
                onChange={(e) => setAnnoImg(e.target.value)}
                className="w-full bg-indigo-950 border border-indigo-700 rounded-xl p-2 text-xs text-white"
              />

              <textarea
                rows={3}
                placeholder="متن کامل اطلاعیه..."
                value={annoBody}
                onChange={(e) => setAnnoBody(e.target.value)}
                className="w-full bg-indigo-950 border border-indigo-700 rounded-xl p-2.5 text-xs text-white"
              />

              <label className="flex items-center gap-2 text-xs text-indigo-200">
                <input
                  type="checkbox"
                  checked={annoImportant}
                  onChange={(e) => setAnnoImportant(e.target.checked)}
                  className="accent-yellow-400"
                />
                علامت‌گذاری به عنوان اطلاعیه مهم
              </label>

              <button type="submit" className="px-5 py-2 bg-yellow-400 text-indigo-950 font-black text-xs rounded-xl">
                انتشار اطلاعیه
              </button>
            </form>
          )}

          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="bg-indigo-950 border border-indigo-800 p-4 rounded-3xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-white">{a.title}</h5>
                  <p className="text-[11px] text-indigo-300 mt-1">{a.body}</p>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(a.id)}
                  className="p-2 bg-red-500/20 text-red-300 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: Charge Inventory & Security Lock --- */}
      {activeTab === "charge" && (
        <div className="space-y-6">
          {/* Emergency Lock Switch Banner */}
          <div className="bg-gradient-to-r from-red-950 via-indigo-950 to-slate-950 border-2 border-red-500/50 p-5 rounded-3xl flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                {emergencyLocked ? (
                  <Lock className="w-6 h-6 text-red-400 animate-pulse" />
                ) : (
                  <Unlock className="w-6 h-6 text-emerald-400" />
                )}
              </div>

              <div>
                <h4 className="text-sm font-black text-white">قفل اضطراری توزیع کارت شارژ</h4>
                <p className="text-xs text-indigo-300">
                  در صورت تشخیص آنومالی یا نفوذ، خروجی کلیه کدهای شارژ را در یک ثانیه مسدود کنید.
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleEmergencyLock}
              className={`px-6 py-3 font-black text-xs rounded-2xl transition shadow-xl ${
                emergencyLocked
                  ? "bg-emerald-500 hover:bg-emerald-600 text-indigo-950"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {emergencyLocked ? "خروج از قفل اضطراری" : "فعال‌سازی قفل اضطراری 🔒"}
            </button>
          </div>

          <button
            onClick={() => setIsAddingCharge(!isAddingCharge)}
            className="px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-indigo-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            افزودن کارت شارژ جدید به انبار رمزنگاری‌شده
          </button>

          {isAddingCharge && (
            <form onSubmit={handleAddChargeCode} className="bg-indigo-900/80 p-5 rounded-3xl border border-indigo-700 space-y-3">
              <h4 className="text-sm font-black text-white">افزودن کارت شارژ جدید</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-indigo-200 mb-1">اپراتور</label>
                  <select
                    value={cOperator}
                    onChange={(e) => setCOperator(e.target.value as any)}
                    className="w-full bg-indigo-950 border border-indigo-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="همراه اول">همراه اول</option>
                    <option value="ایرانسل">ایرانسل</option>
                    <option value="رایتل">رایتل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-indigo-200 mb-1">مبلغ اسمی کارت</label>
                  <input
                    type="text"
                    value={cTitle}
                    onChange={(e) => CSetTitle(e.target.value)}
                    className="w-full bg-indigo-950 border border-indigo-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-indigo-200 mb-1">هزینه امتیاز</label>
                  <input
                    type="number"
                    value={cCost}
                    onChange={(e) => CSetCost(Number(e.target.value))}
                    className="w-full bg-indigo-950 border border-indigo-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-indigo-200 mb-1">کد شارژ خام (محرمانه)</label>
                  <input
                    type="text"
                    placeholder="کد شارژ ۱۴ رقمی..."
                    value={cCode}
                    onChange={(e) => CSetCode(e.target.value)}
                    className="w-full bg-indigo-950 border border-indigo-700 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <button type="submit" className="px-5 py-2 bg-yellow-400 text-indigo-950 font-black text-xs rounded-xl">
                رمزنگاری و ذخیره در انبار
              </button>
            </form>
          )}

          {/* Charge Inventory View */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-indigo-200">موجودی فعلی انبار کدهای شارژ و جوایز ({chargeInventory.length})</h4>
            {chargeInventory.map((item) => (
              <div key={item.id} className="bg-indigo-950 border border-indigo-800 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{item.operator} - {item.title}</span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-lg border border-amber-400/30">
                      ({item.pointsCost} امتیاز)
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-300 mt-0.5">ارزش اسمی: {item.faceValue || "نامشخص"}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-indigo-300 bg-indigo-900/60 px-2.5 py-1 rounded-lg border border-indigo-700">{item.codeEncrypted}</span>
                    {item.isRedeemed ? (
                      <span className="px-2 py-1 bg-red-500/20 text-red-300 text-[10px] font-bold rounded-lg border border-red-500/30">تحویل شده به کاربر</span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-500/30">آماده در انبار</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingCharge(item)}
                      className="p-2 bg-indigo-800 hover:bg-indigo-700 text-yellow-300 rounded-xl text-xs font-bold flex items-center gap-1"
                      title="ویرایش محصول"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCharge(item.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl"
                      title="حذف از انبار"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 5: Ad Reward Logs --- */}
      {activeTab === "ads" && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-indigo-200">سوابق تراکنش‌های ویدیوهای جایزه‌دار</h3>
          {adLogs.map((ad) => (
            <div key={ad.id} className="bg-indigo-950 border border-indigo-800 p-3 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white">{ad.userName}</span>
                <span className="text-indigo-400 text-[10px] mx-2">شبکه: {ad.adNetwork}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">+{ad.pointsEarned} امتیاز</span>
                <span className="text-indigo-400 text-[10px]">{new Date(ad.timestamp).toLocaleTimeString("fa-IR")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- TAB 6: Audit Logs --- */}
      {activeTab === "audit" && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-indigo-200">تاریخچه کامل رویدادهای امنیتی (Audit Logs)</h3>
          {auditLogs.map((log) => (
            <div key={log.id} className="bg-indigo-950 border border-indigo-800 p-3 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-yellow-400">{log.action}</span>
                <p className="text-indigo-300 text-[11px] mt-0.5">{log.details}</p>
              </div>
              <div className="text-left font-mono text-[10px] text-indigo-400">
                <div>{new Date(log.timestamp).toLocaleString("fa-IR")}</div>
                <div>IP: {log.ip}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- User Edit Modal --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form onSubmit={handleSaveUserEdit} className="bg-indigo-950 border border-indigo-700 rounded-3xl p-6 max-w-md w-full text-right space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-800 pb-3">
              <h3 className="text-sm font-black text-white">ویرایش اطلاعات و امتیازات کاربر</h3>
              <button type="button" onClick={() => setEditingUser(null)} className="text-indigo-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs text-indigo-200 mb-1">نام و نام خانوادگی</label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                className="w-full bg-slate-900 border border-indigo-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-indigo-200 mb-1">موجودی امتیاز (کیف پول)</label>
                <input
                  type="number"
                  value={editingUser.score}
                  onChange={(e) => setEditingUser({ ...editingUser, score: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-indigo-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-indigo-200 mb-1">تعداد الماس</label>
                <input
                  type="number"
                  value={editingUser.diamonds || 0}
                  onChange={(e) => setEditingUser({ ...editingUser, diamonds: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-indigo-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-indigo-200 mb-1">سطح کاربر (Level)</label>
                <input
                  type="number"
                  value={editingUser.level}
                  onChange={(e) => setEditingUser({ ...editingUser, level: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-indigo-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-indigo-200 mb-1">نقش کاربر</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full bg-slate-900 border border-indigo-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="user">کاربر معمولی</option>
                  <option value="admin">مدیر سیستم (Admin)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-5 py-2.5 bg-yellow-400 text-indigo-950 font-black text-xs rounded-xl flex-1">
                ذخیره تغییرات
              </button>
              <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2.5 bg-indigo-900 text-indigo-200 text-xs rounded-xl">
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- Product / Charge Edit Modal --- */}
      {editingCharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form onSubmit={handleSaveChargeEdit} className="bg-indigo-950 border border-indigo-700 rounded-3xl p-6 max-w-md w-full text-right space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-800 pb-3">
              <h3 className="text-sm font-black text-white">ویرایش مشخصات محصول / کارت شارژ</h3>
              <button type="button" onClick={() => setEditingCharge(null)} className="text-indigo-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-indigo-200 mb-1">اپراتور</label>
                <select
                  value={editingCharge.operator}
                  onChange={(e) => setEditingCharge({ ...editingCharge, operator: e.target.value as any })}
                  className="w-full bg-slate-900 border border-indigo-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="همراه اول">همراه اول</option>
                  <option value="ایرانسل">ایرانسل</option>
                  <option value="رایتل">رایتل</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-indigo-200 mb-1">عنوان محصول</label>
                <input
                  type="text"
                  value={editingCharge.title}
                  onChange={(e) => setEditingCharge({ ...editingCharge, title: e.target.value })}
                  className="w-full bg-slate-900 border border-indigo-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-indigo-200 mb-1">هزینه امتیاز خرید</label>
                <input
                  type="number"
                  value={editingCharge.pointsCost}
                  onChange={(e) => setEditingCharge({ ...editingCharge, pointsCost: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-indigo-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-indigo-200 mb-1">کد شارژ خام / رمز (محرمانه)</label>
                <input
                  type="text"
                  value={editingCharge.codeRaw || ""}
                  onChange={(e) => setEditingCharge({ ...editingCharge, codeRaw: e.target.value })}
                  className="w-full bg-slate-900 border border-indigo-800 rounded-xl p-2.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-5 py-2.5 bg-yellow-400 text-indigo-950 font-black text-xs rounded-xl flex-1">
                ذخیره مشخصات
              </button>
              <button type="button" onClick={() => setEditingCharge(null)} className="px-4 py-2.5 bg-indigo-900 text-indigo-200 text-xs rounded-xl">
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Excel / JSON Import Modal */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-indigo-950 border border-indigo-700 rounded-3xl p-6 max-w-lg w-full text-right space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-800 pb-3">
              <h3 className="text-base font-black text-white">ورود گروهی سوالات از فایل اکسل یا JSON</h3>
              <button onClick={() => setIsExcelModalOpen(false)} className="text-indigo-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct File Picker Option */}
            <div className="bg-indigo-900/60 p-4 rounded-2xl border border-indigo-700 text-center space-y-2">
              <span className="text-xs font-bold text-white block">گزینه ۱: انتخاب فایل اکسل (.xlsx / .csv)</span>
              <p className="text-[11px] text-indigo-300">
                ترتیب ستون‌ها: دسته بندی | سوال | گزینه ۱ | گزینه ۲ | گزینه ۳ | گزینه ۴ | جواب صحیح (شماره ۱ تا ۴)
              </p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-indigo-950 font-black text-xs rounded-xl cursor-pointer shadow-lg transition">
                <FileSpreadsheet className="w-4 h-4" />
                <span>انتخاب فایل Excel از رایانه</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* JSON Option */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white block">گزینه ۲: یا چسباندن کد JSON سوالات</span>
              <textarea
                rows={6}
                placeholder={`[
  {
    "category": "ورزشی",
    "questionText": "قهرمان جام جهانی ۲۰۲۲ چه تیمی شد؟",
    "options": ["آرژانتین", "فرانسه", "برزیل", "آلمان"],
    "correctOptionIndex": 0
  }
]`}
                value={excelJsonText}
                onChange={(e) => setExcelJsonText(e.target.value)}
                className="w-full bg-slate-900 border border-indigo-800 rounded-xl p-3 text-xs text-white font-mono"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={handleExcelImport} className="px-5 py-2.5 bg-yellow-400 text-indigo-950 font-black text-xs rounded-xl flex-1">
                ورود سوالات از JSON
              </button>
              <button onClick={() => setIsExcelModalOpen(false)} className="px-4 py-2.5 bg-indigo-900 text-indigo-200 text-xs rounded-xl">
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Credentials Change Modal */}
      {isCredentialsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch("/api/admin/credentials/update", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    currentPassword: currentPass,
                    newUsername: newAdminUser,
                    newPassword: newAdminPass
                  })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                  triggerNotify("یوزرنیم و پسورد جدید مدیر با موفقیت ذخیره شد.");
                  setIsCredentialsModalOpen(false);
                  setCurrentPass("");
                  setNewAdminUser("");
                  setNewAdminPass("");
                } else {
                  triggerNotify(data.error || "خطا در تغییر مشخصات مدیر.");
                }
              } catch (err) {
                triggerNotify("خطا در ارتباط با سرور.");
              }
            }}
            className="bg-indigo-950 border border-indigo-700 rounded-3xl p-6 max-w-md w-full text-right space-y-4"
          >
            <div className="flex items-center justify-between border-b border-indigo-800 pb-3">
              <h3 className="text-sm font-black text-white">تغییر نام کاربری و کلمه عبور مدیریت</h3>
              <button type="button" onClick={() => setIsCredentialsModalOpen(false)} className="text-indigo-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs text-indigo-200 mb-1">کلمه عبور فعلی مدیریت (الزامی)</label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="adminpass"
                className="w-full bg-slate-900 border border-indigo-800 rounded-xl p-2.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-indigo-200 mb-1">نام کاربری جدید (Username)</label>
              <input
                type="text"
                value={newAdminUser}
                onChange={(e) => setNewAdminUser(e.target.value)}
                placeholder="نام کاربری جدید..."
                className="w-full bg-slate-900 border border-indigo-800 rounded-xl p-2.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-indigo-200 mb-1">کلمه عبور جدید (Password)</label>
              <input
                type="password"
                value={newAdminPass}
                onChange={(e) => setNewAdminPass(e.target.value)}
                placeholder="کلمه عبور جدید..."
                className="w-full bg-slate-900 border border-indigo-800 rounded-xl p-2.5 text-xs text-white font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-5 py-2.5 bg-yellow-400 text-indigo-950 font-black text-xs rounded-xl flex-1">
                ثبت و ذخیره در دیتابیس
              </button>
              <button type="button" onClick={() => setIsCredentialsModalOpen(false)} className="px-4 py-2.5 bg-indigo-900 text-indigo-200 text-xs rounded-xl">
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
