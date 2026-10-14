"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { NotificationItem, NotificationType, isUserAdminOrGM, canUserViewNotification } from "@/types/pms";
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Send, 
  Calendar, 
  ShieldCheck, 
  CreditCard, 
  LogIn, 
  LogOut, 
  AlertCircle,
  ExternalLink,
  Hotel,
  Palmtree,
  Building2,
  Clock,
  Sparkles,
  MessageSquare,
  Lock,
  ShieldAlert,
  Users
} from "lucide-react";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChannelManager?: () => void;
}

export function NotificationCenter({ isOpen, onClose, onOpenChannelManager }: NotificationCenterProps) {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearNotifications,
    telegramConfig,
    testTelegramNotification,
    currentUser
  } = usePMS();

  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAdmin = isUserAdminOrGM(currentUser);

  // Filter notifications visible to this user
  const visibleNotifications = notifications.filter((n) => canUserViewNotification(currentUser, n));

  const unreadCount = visibleNotifications.filter(n => !n.isRead).length;

  const filteredNotifications = visibleNotifications.filter(n => {
    if (activeFilter === "UNREAD") return !n.isRead;
    if (activeFilter === "ADMIN_ONLY") return n.audience === "ADMIN_ONLY";
    if (activeFilter === "BUGAAN") return n.propertyId === "bugaan";
    if (activeFilter === "THANAWONG") return n.propertyId === "thanawong";
    if (activeFilter === "OTA") return n.type === "BOOKING_NEW" || n.type === "OTA_BLOCK";
    return true;
  });

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "BOOKING_NEW":
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case "OTA_BLOCK":
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case "CHECK_IN":
        return <LogIn className="w-4 h-4 text-amber-600" />;
      case "CHECK_OUT":
        return <LogOut className="w-4 h-4 text-purple-600" />;
      case "PAYMENT_RECEIVED":
        return <CreditCard className="w-4 h-4 text-teal-600" />;
      case "SYSTEM_ALERT":
      default:
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTestResult(null);
    try {
      const res = await testTelegramNotification();
      setTestResult(res.message);
    } catch {
      setTestResult("การทดสอบล้มเหลว กรุณาตรวจสอบ Token");
    } finally {
      setIsTestingTelegram(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Flyout Drawer */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-white dark:bg-[#0c142e] h-full shadow-2xl border-l border-stone-200 dark:border-stone-800 flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-[#101c42]/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-base text-stone-900 dark:text-white">
                  ศูนย์การแจ้งเตือน
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white animate-pulse">
                    {unreadCount} ใหม่
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Notification Center & Real-time Alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {notifications.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  title="ทำเครื่องหมายว่าอ่านแล้วทั้งหมด"
                  className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">อ่านแล้วทั้งหมด</span>
                </button>
                <button
                  type="button"
                  onClick={clearNotifications}
                  title="ล้างประวัติการแจ้งเตือน"
                  className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telegram Bot Live Status Banner */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-900/20 via-sky-900/10 to-transparent border-b border-sky-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${telegramConfig.isEnabled && telegramConfig.botToken ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <div>
              <span className="font-bold text-stone-800 dark:text-stone-200">
                Telegram Bot: {telegramConfig.isEnabled && telegramConfig.botToken ? "เชื่อมต่อเปิดใช้งานแล้ว" : "ยังไม่ได้ตั้งค่า Bot Token"}
              </span>
              <span className="block text-[10px] text-stone-500">
                แจ้งเตือนแยกหัวโรงแรมชัดเจน Bu-Gaan / Thanawong
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={isTestingTelegram}
              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>{isTestingTelegram ? "ส่ง..." : "ทดสอบส่งบอท"}</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 font-medium">
            {testResult}
          </div>
        )}

        {/* Filter Pills */}
        <div className="p-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
              activeFilter === "ALL" 
                ? "bg-amber-600 text-white shadow-xs" 
                : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
            }`}
          >
            ทั้งหมด ({visibleNotifications.length})
          </button>
          <button
            onClick={() => setActiveFilter("UNREAD")}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
              activeFilter === "UNREAD" 
                ? "bg-rose-600 text-white shadow-xs" 
                : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
            }`}
          >
            ยังไม่อ่าน ({unreadCount})
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveFilter("ADMIN_ONLY")}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                activeFilter === "ADMIN_ONLY" 
                  ? "bg-purple-700 text-white shadow-xs" 
                  : "bg-purple-100/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200/70"
              }`}
            >
              <Lock className="w-3 h-3 text-purple-300" />
              <span>เฉพาะแอดมิน ({visibleNotifications.filter(n => n.audience === "ADMIN_ONLY").length})</span>
            </button>
          )}
          <button
            onClick={() => setActiveFilter("BUGAAN")}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeFilter === "BUGAAN" 
                ? "bg-amber-700 text-white shadow-xs" 
                : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
            }`}
          >
            <Building2 className="w-3 h-3 text-amber-400" />
            <span>Bu-Gaan</span>
          </button>
          <button
            onClick={() => setActiveFilter("THANAWONG")}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeFilter === "THANAWONG" 
                ? "bg-emerald-700 text-white shadow-xs" 
                : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
            }`}
          >
            <Palmtree className="w-3 h-3 text-emerald-400" />
            <span>ธนวงศ์</span>
          </button>
          <button
            onClick={() => setActiveFilter("OTA")}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
              activeFilter === "OTA" 
                ? "bg-blue-600 text-white shadow-xs" 
                : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
            }`}
          >
            OTA & Webhooks
          </button>
        </div>

        {/* Notifications Scroll List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <div className="w-16 h-16 rounded-3xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-stone-300 dark:text-stone-600" />
              </div>
              <h4 className="font-bold text-stone-700 dark:text-stone-300 text-sm">
                ไม่มีการแจ้งเตือนในหมวดนี้
              </h4>
              <p className="text-xs text-stone-500 max-w-xs mt-1">
                เมื่อมีบุ๊กกิ้งใหม่จาก OTA, การตัดสต็อกห้องพัก หรือข้อความจากระบบ รายการจะปรากฏที่นี่ทันที
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isBuGaan = n.propertyId === "bugaan";
              const isThanawong = n.propertyId === "thanawong";

              return (
                <div
                  key={n.id}
                  onClick={() => markNotificationAsRead(n.id)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    n.isRead
                      ? "bg-stone-50/50 dark:bg-[#0e1633]/50 border-stone-200/60 dark:border-stone-800 opacity-80 hover:opacity-100"
                      : "bg-white dark:bg-[#101c42] border-amber-400/40 dark:border-amber-500/30 shadow-sm ring-1 ring-amber-500/10"
                  }`}
                >
                  {!n.isRead && (
                    <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 border border-stone-200 dark:border-stone-700">
                      {getIconForType(n.type)}
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {isBuGaan && (
                          <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/20">
                            Bu-Gaan
                          </span>
                        )}
                        {isThanawong && (
                          <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/20">
                            ธนวงศ์ พูลวิลล่า
                          </span>
                        )}
                        {n.audience === "ADMIN_ONLY" && (
                          <span className="px-2 py-0.2 rounded-md text-[10px] font-extrabold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-400/30 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> เฉพาะแอดมิน / GM
                          </span>
                        )}
                        {n.audience === "BRANCH_ONLY" && (
                          <span className="px-2 py-0.2 rounded-md text-[10px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-400/30 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> เฉพาะผู้ดูแลสาขา
                          </span>
                        )}
                        {n.audience === "ALL" && (
                          <span className="px-2 py-0.2 rounded-md text-[10px] font-semibold bg-stone-500/15 text-stone-700 dark:text-stone-300 border border-stone-400/30 flex items-center gap-1">
                            ข้อมูลทั่วไป
                          </span>
                        )}
                        {n.priority === "URGENT" && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                            ด่วนที่สุด
                          </span>
                        )}
                        {n.source && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-stone-300">
                            {n.source}
                          </span>
                        )}
                        {n.telegramSent && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 flex items-center gap-0.5">
                            <Send className="w-2.5 h-2.5" /> Telegram (ส่งแล้ว)
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white leading-snug">
                        {n.title}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{n.timestamp}</span>
                        </span>
                        {n.amount && (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ฿{n.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-[#101c42]/60 flex items-center justify-between text-xs shrink-0">
          <span className="text-stone-500 text-[11px]">
            ระบบแจ้งเตือนแบบเรียลไทม์ 2-Way PMS Engine
          </span>
          {onOpenChannelManager && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenChannelManager();
              }}
              className="text-amber-600 dark:text-amber-400 hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>จัดการ OTA & Telegram Bot</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
