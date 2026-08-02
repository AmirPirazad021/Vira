import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, ChevronLeft, CheckCheck, Sparkles, AlertTriangle, Calendar } from "lucide-react";
import { Announcement, UserProfile } from "../types";

interface AnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export default function AnnouncementsModal({
  isOpen,
  onClose,
  user
}: AnnouncementsModalProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeItem, setActiveItem] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
    }
  }, [isOpen]);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/announcements?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (e) {
      console.warn("Failed to fetch announcements:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (announcementId: string) => {
    try {
      await fetch(`/api/announcements/${announcementId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcementId ? { ...a, readBy: [...a.readBy, user.id] } : a
        )
      );
    } catch (e) {
      console.warn("Error marking read:", e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="announcements-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-indigo-950/80 backdrop-blur-md">
          <motion.div
            id="announcements-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-md bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-700/60 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-pink-400 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">اطلاعیه‌ها و اخبار ویرا</h3>
                  <p className="text-[10px] text-indigo-300">آخرین جوایز، به‌روزرسانی‌ها و مسابقات مهم</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-indigo-800/60 hover:bg-indigo-700 text-indigo-300 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* List or Active Item View */}
            <div className="flex-1 overflow-y-auto space-y-3 pl-1 pr-1">
              {activeItem ? (
                <div className="space-y-4 text-right">
                  <button
                    onClick={() => setActiveItem(null)}
                    className="text-xs font-bold text-yellow-400 hover:underline flex items-center gap-1"
                  >
                    ← بازگشت به لیست اطلاعیه‌ها
                  </button>

                  {activeItem.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-indigo-700/60 h-44 bg-indigo-900/50 relative">
                      <img
                        src={activeItem.imageUrl}
                        alt={activeItem.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {activeItem.isImportant && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          اطلاعیه مهم
                        </span>
                      )}
                      <span className="text-[10px] text-indigo-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        {activeItem.publishDate}
                      </span>
                    </div>

                    <h2 className="text-lg font-black text-white mb-2">{activeItem.title}</h2>
                    <p className="text-xs text-indigo-200 leading-relaxed whitespace-pre-line bg-indigo-950/60 p-3 rounded-2xl border border-indigo-800/60">
                      {activeItem.body}
                    </p>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="text-center py-12 text-indigo-300 text-xs">
                  درحال بارگذاری اخبار ویرا...
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12 text-indigo-300 text-xs">
                  اطلاعیه جدیدی برای نمایش وجود ندارد.
                </div>
              ) : (
                announcements.map((item) => {
                  const isRead = item.readBy?.includes(user.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setActiveItem(item);
                        if (!isRead) handleMarkAsRead(item.id);
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex gap-3 text-right ${
                        item.isImportant
                          ? "bg-gradient-to-r from-red-950/40 to-indigo-950 border-red-500/40 hover:border-red-400"
                          : "bg-indigo-950/70 border-indigo-800/80 hover:border-yellow-400/60"
                      }`}
                    >
                      {item.imageUrl && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-indigo-900 border border-indigo-700/50 flex-shrink-0">
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-indigo-300 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-indigo-400" />
                            {item.publishDate}
                          </span>

                          {!isRead ? (
                            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-white truncate mb-1 flex items-center gap-1.5">
                          {item.isImportant && <Sparkles className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                          {item.title}
                        </h4>

                        <p className="text-[11px] text-indigo-300 line-clamp-2 leading-tight">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
