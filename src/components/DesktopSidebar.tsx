"use client";

import React, { useState, useEffect } from "react";
import { usePMS } from "@/context/PMSContext";
import { TabType } from "@/components/NavigationTabs";
import { PropertyId, isUserAdminOrGM, canUserViewNotification, canUserAccessProperty } from "@/types/pms";
import { 
  LayoutDashboard, 
  CalendarDays, 
  PlusCircle, 
  UtensilsCrossed, 
  Receipt, 
  Settings, 
  Building2, 
  Palmtree, 
  Layers, 
  Check, 
  Database, 
  Sun, 
  Moon, 
  User, 
  ShieldCheck, 
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  ChevronRight,
  Lock,
  Bell,
  BedDouble,
  TrendingUp,
  Tag,
  Grid3X3
} from "lucide-react";

interface DesktopSidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenLogin: () => void;
  onOpenPropertySelect: () => void;
  onOpenInstall: () => void;
  onOpenNotifications?: () => void;
}

export function DesktopSidebar({
  activeTab,
  setActiveTab,
  onOpenLogin,
  onOpenPropertySelect,
  onOpenInstall,
  onOpenNotifications,
}: DesktopSidebarProps) {
  const {
    activePropertyId,
    setActivePropertyId,
    properties,
    currentUser,
    logout,
    isDarkMode,
    toggleDarkMode,
    isMounted,
    isDatabaseInstalled,
    lastSyncTime,
    notifications
  } = usePMS();

  const unreadCount = notifications.filter(n => canUserViewNotification(currentUser, n) && !n.isRead).length;

  const canAccessBugaan = canUserAccessProperty(currentUser, "bugaan");
  const canAccessThanawong = canUserAccessProperty(currentUser, "thanawong");
  const canAccessAll = canUserAccessProperty(currentUser, "all");

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Load collapsed state preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hotel_pms_sidebar_collapsed") === "true";
      setIsCollapsed(saved);
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("hotel_pms_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  const navItems = [
    { id: "dashboard" as TabType, label: "สถานะห้องพัก", sub: "Live Room Status", icon: LayoutDashboard },
    { id: "calendar" as TabType, label: "ปฏิทินไทม์ไลน์", sub: "Gantt Timeline", icon: CalendarDays },
    { id: "rate-grid" as TabType, label: "ปฏิทินห้องว่าง & ราคา", sub: "Rate & Allotment Grid", icon: Grid3X3 },
    { id: "room-types" as TabType, label: "ห้องพักและความจุ", sub: "Room Types & Capacity", icon: BedDouble },
    { id: "market-pricing" as TabType, label: "การตั้งราคาอิงตลาด", sub: "Rate Intelligence", icon: TrendingUp },
    { id: "promotions" as TabType, label: "โปรโมชั่น & ส่วนลด", sub: "Promotions & Deals", icon: Tag },
    { id: "housekeeping" as TabType, label: "ตารางทำความสะอาด", sub: "Housekeeping Schedule", icon: Sparkles },
    { id: "booking" as TabType, label: "เปิดจองห้องพัก", sub: "New Reservation", icon: PlusCircle },
    { id: "pos" as TabType, label: "อาหาร & POS", sub: "Room Service & Minibar", icon: UtensilsCrossed },
    { id: "folio" as TabType, label: "บิล & เช็คเอาต์", sub: "Billing & Folio", icon: Receipt },
    { id: "admin" as TabType, label: "ระบบหลังบ้าน", sub: "Backoffice & Settings", icon: Settings },
  ].filter((item) => item.id !== "admin" || isUserAdminOrGM(currentUser));

  return (
    <aside
      className={`no-print hidden lg:flex shrink-0 flex-col h-screen sticky top-0 border-r border-amber-200/50 dark:border-amber-900/40 bg-white/95 dark:bg-[#080e24]/95 backdrop-blur-xl z-30 transition-all duration-300 ease-in-out shadow-lg select-none ${
        isCollapsed ? "w-20" : "w-72 xl:w-80"
      }`}
    >
      {/* 1. Header with Hotel Brand & Minimize Toggle Button */}
      <div className={`border-b border-amber-200/40 dark:border-amber-900/30 shrink-0 transition-all ${
        isCollapsed ? "p-3" : "p-4 xl:p-5"
      }`}>
        {isCollapsed ? (
          /* Collapsed Header */
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={toggleCollapse}
              title="ขยายเมนูด้านข้าง (Expand Sidebar)"
              className="w-10 h-10 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-400 bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-amber-300 flex items-center justify-center transition-all cursor-pointer hover:scale-105"
            >
              <PanelLeftOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </button>

            {/* Quick Hotel Logos Icons */}
            <div className="flex flex-col items-center gap-2 pt-1 border-t border-stone-100 dark:border-stone-800 w-full">
              {/* Bu-Gaan Logo Icon */}
              <button
                type="button"
                disabled={!canAccessBugaan}
                onClick={canAccessBugaan ? () => setActivePropertyId("bugaan") : undefined}
                title={canAccessBugaan ? "Bu-Gaan Sukhothai Village (27 ห้อง)" : "ไม่มีสิทธิ์เข้าถึงสาขานี้"}
                className={`w-11 h-11 rounded-xl p-0.5 border-2 transition-all relative overflow-hidden bg-white shadow-xs ${
                  !canAccessBugaan
                    ? "opacity-35 cursor-not-allowed grayscale border-stone-200 dark:border-stone-800"
                    : activePropertyId === "bugaan"
                    ? "border-amber-500 ring-2 ring-amber-500/30 scale-105 cursor-pointer"
                    : "border-stone-200 dark:border-stone-700 opacity-70 hover:opacity-100 cursor-pointer"
                }`}
              >
                <img
                  src="/logos/bugaan-logo.jpg"
                  alt="Bu-Gaan Logo"
                  className="w-full h-full object-contain"
                />
                {!canAccessBugaan && (
                  <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>

              {/* Thanawong Logo Icon */}
              <button
                type="button"
                disabled={!canAccessThanawong}
                onClick={canAccessThanawong ? () => setActivePropertyId("thanawong") : undefined}
                title={canAccessThanawong ? "Thanawong Pool Villa (14 ห้อง)" : "ไม่มีสิทธิ์เข้าถึงสาขานี้"}
                className={`w-11 h-11 rounded-xl p-0.5 border-2 transition-all relative overflow-hidden bg-white shadow-xs ${
                  !canAccessThanawong
                    ? "opacity-35 cursor-not-allowed grayscale border-stone-200 dark:border-stone-800"
                    : activePropertyId === "thanawong"
                    ? "border-emerald-500 ring-2 ring-emerald-500/30 scale-105 cursor-pointer"
                    : "border-stone-200 dark:border-stone-700 opacity-70 hover:opacity-100 cursor-pointer"
                }`}
              >
                <img
                  src="/logos/thanawong-logo.jpg"
                  alt="Thanawong Logo"
                  className="w-full h-full object-contain"
                />
                {!canAccessThanawong && (
                  <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>

              {/* All Properties Icon */}
              {canAccessAll ? (
                <button
                  type="button"
                  onClick={() => setActivePropertyId("all")}
                  title="ภาพรวมทั้ง 2 โรงแรม (41 ห้อง)"
                  className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                    activePropertyId === "all"
                      ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30"
                      : "border-stone-200 dark:border-stone-700 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <Layers className="w-5 h-5 text-amber-600" />
                </button>
              ) : (
                <div
                  title="เฉพาะ GM / แอดมิน"
                  className="w-11 h-11 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-center opacity-40 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4 text-stone-400" />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Expanded Header */
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-sm tracking-wider bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent">
                  KRA
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                  PMS
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  title="สลับธีม สว่าง / มืด"
                  className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-amber-300 transition-colors cursor-pointer"
                >
                  {isMounted && isDarkMode ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-stone-600" />
                  )}
                </button>

                {/* Minimize Toggle Button */}
                <button
                  type="button"
                  onClick={toggleCollapse}
                  title="ย่อเมนูด้านข้าง (Minimize Sidebar)"
                  className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-400 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-amber-300 transition-all cursor-pointer"
                >
                  <PanelLeftClose className="w-4 h-4 text-stone-500 hover:text-amber-600" />
                </button>
              </div>
            </div>

            {/* Hotel Cards With Uploaded Real Logos */}
            <div className="space-y-2">
              
              {/* Card 1: Bu-Gaan */}
              <div
                onClick={canAccessBugaan ? () => setActivePropertyId("bugaan") : undefined}
                className={`p-2.5 rounded-2xl border transition-all flex items-center gap-3 relative overflow-hidden group ${
                  !canAccessBugaan
                    ? "border-stone-200/60 dark:border-stone-800/60 bg-stone-100/40 dark:bg-stone-900/30 opacity-60 cursor-not-allowed"
                    : activePropertyId === "bugaan"
                    ? "border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 shadow-sm cursor-pointer"
                    : "border-stone-200/80 dark:border-stone-800/80 hover:border-amber-300 dark:hover:border-amber-700/60 bg-stone-50/60 dark:bg-slate-800/30 cursor-pointer"
                }`}
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-200 shadow-xs flex items-center justify-center p-0.5 relative">
                  <img
                    src="/logos/bugaan-logo.jpg"
                    alt="Bu-Gaan Logo"
                    className={`w-full h-full object-contain ${!canAccessBugaan ? "grayscale opacity-50" : ""}`}
                  />
                  {!canAccessBugaan && (
                    <div className="absolute inset-0 bg-stone-900/30 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-xs text-stone-900 dark:text-white truncate">
                      Bu-Gaan Village
                    </span>
                    {!canAccessBugaan ? (
                      <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> ล็อก
                      </span>
                    ) : activePropertyId === "bugaan" ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    ) : null}
                  </div>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                    {!canAccessBugaan ? "ไม่มีสิทธิ์เข้าถึงสาขานี้" : "บูก้าน สุโขทัย • 27 ห้อง"}
                  </p>
                </div>
              </div>

              {/* Card 2: Thanawong */}
              <div
                onClick={canAccessThanawong ? () => setActivePropertyId("thanawong") : undefined}
                className={`p-2.5 rounded-2xl border transition-all flex items-center gap-3 relative overflow-hidden group ${
                  !canAccessThanawong
                    ? "border-stone-200/60 dark:border-stone-800/60 bg-stone-100/40 dark:bg-stone-900/30 opacity-60 cursor-not-allowed"
                    : activePropertyId === "thanawong"
                    ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-sm cursor-pointer"
                    : "border-stone-200/80 dark:border-stone-800/80 hover:border-emerald-300 dark:hover:border-emerald-700/60 bg-stone-50/60 dark:bg-slate-800/30 cursor-pointer"
                }`}
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-200 shadow-xs flex items-center justify-center p-0.5 relative">
                  <img
                    src="/logos/thanawong-logo.jpg"
                    alt="Thanawong Logo"
                    className={`w-full h-full object-contain ${!canAccessThanawong ? "grayscale opacity-50" : ""}`}
                  />
                  {!canAccessThanawong && (
                    <div className="absolute inset-0 bg-stone-900/30 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-xs text-stone-900 dark:text-white truncate">
                      Thanawong Villa
                    </span>
                    {!canAccessThanawong ? (
                      <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> ล็อก
                      </span>
                    ) : activePropertyId === "thanawong" ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ) : null}
                  </div>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                    {!canAccessThanawong ? "ไม่มีสิทธิ์เข้าถึงสาขานี้" : "ธนวงศ์ พูลวิลล่า • 14 ห้อง"}
                  </p>
                </div>
              </div>

              {/* Card 3: All Properties */}
              {canAccessAll ? (
                <button
                  type="button"
                  onClick={() => setActivePropertyId("all")}
                  className={`w-full py-1.5 px-3 rounded-xl border text-[11px] font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    activePropertyId === "all"
                      ? "border-amber-400/80 bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold"
                      : "border-stone-200/60 dark:border-stone-800/60 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100/60 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>ภาพรวมทั้ง 2 โรงแรม (41 ห้อง)</span>
                  </div>
                  {activePropertyId === "all" && <Check className="w-3 h-3 text-amber-600" />}
                </button>
              ) : (
                <div className="w-full py-1.5 px-3 rounded-xl border border-stone-200/50 dark:border-stone-800/50 text-[11px] font-medium text-stone-400 flex items-center justify-between opacity-50 cursor-not-allowed bg-stone-50/50 dark:bg-stone-900/30">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-stone-400" />
                    <span>ภาพรวม 2 โรงแรม (เฉพาะ GM)</span>
                  </div>
                  <Lock className="w-3 h-3 text-stone-400" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Navigation Menu List */}
      <div className={`flex-1 overflow-y-auto space-y-1 ${isCollapsed ? "px-2 py-3" : "px-3 xl:px-4 py-3"}`}>
        {!isCollapsed && (
          <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-3 mb-1 block">
            เมนูระบบจัดการ (Navigation)
          </span>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? `${item.label} (${item.sub})` : undefined}
              className={`transition-all cursor-pointer group flex items-center ${
                isCollapsed
                  ? `w-12 h-12 mx-auto justify-center rounded-2xl relative ${
                      isActive
                        ? "bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30"
                        : "text-stone-600 dark:text-stone-400 hover:bg-amber-50/70 dark:hover:bg-slate-800/60 hover:text-amber-600"
                    }`
                  : `w-full gap-3 px-3.5 py-3 rounded-2xl font-medium text-xs xl:text-sm text-left ${
                      isActive
                        ? "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white font-bold shadow-md shadow-amber-500/25"
                        : "text-stone-700 dark:text-stone-300 hover:bg-amber-50/70 dark:hover:bg-slate-800/60 hover:text-amber-700 dark:hover:text-amber-300"
                    }`
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive
                  ? isCollapsed ? "text-white" : "bg-white/20 text-white"
                  : isCollapsed ? "" : "bg-stone-100 dark:bg-slate-800 text-stone-500 group-hover:text-amber-600 group-hover:bg-amber-100/60"
              }`}>
                <Icon className={isCollapsed ? "w-5 h-5" : "w-4 h-4"} />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate leading-tight">{item.label}</span>
                    {item.id === "admin" && !isUserAdminOrGM(currentUser) && (
                      <span className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive 
                          ? "bg-amber-900/40 text-amber-100" 
                          : "bg-stone-200/80 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                      }`}>
                        <Lock className="w-2.5 h-2.5" />
                        <span>GM</span>
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? "text-amber-100" : "text-stone-400 dark:text-stone-500"}`}>
                    {item.sub}
                  </div>
                </div>
              )}
              {isCollapsed && item.id === "admin" && !isUserAdminOrGM(currentUser) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Action: Notification Center */}
      {onOpenNotifications && (
        <div className={`shrink-0 ${isCollapsed ? "p-2 flex justify-center" : "px-3 py-1.5"}`}>
          <button
            type="button"
            onClick={onOpenNotifications}
            title={isCollapsed ? `การแจ้งเตือน ${unreadCount > 0 ? `(${unreadCount} ใหม่)` : ""}` : undefined}
            className={`transition-all cursor-pointer flex items-center ${
              isCollapsed
                ? "w-10 h-10 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-400 bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-stone-300 justify-center relative hover:scale-105"
                : "w-full gap-2.5 px-3 py-2 rounded-xl border border-amber-200/60 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-100/50 text-stone-700 dark:text-stone-300 text-xs font-semibold justify-between"
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              {!isCollapsed && <span>ศูนย์การแจ้งเตือน</span>}
            </div>
            {unreadCount > 0 && (
              <span className={`${isCollapsed ? "absolute -top-1 -right-1" : ""} px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 4. Footer: Staff User & Logout */}
      <div className={`border-t border-amber-200/40 dark:border-amber-900/30 shrink-0 bg-stone-50/50 dark:bg-[#090f26] ${
        isCollapsed ? "p-2.5 flex flex-col items-center gap-2" : "p-3 xl:p-4"
      }`}>
        {currentUser ? (
          isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onOpenLogin}
                title={`โปรไฟล์: ${currentUser.name} (${currentUser.role})`}
                className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xs cursor-pointer hover:scale-105"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </button>
              <button
                type="button"
                onClick={logout}
                title="ออกจากระบบ (Logout)"
                className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div 
                onClick={onOpenLogin}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-85"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-500/20">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-stone-900 dark:text-white truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-300 truncate">
                    {currentUser.role}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="ออกจากระบบ (Logout)"
                className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )
        ) : (
          isCollapsed ? (
            <button
              type="button"
              onClick={onOpenLogin}
              title="เข้าสู่ระบบพนักงาน (Login)"
              className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center cursor-pointer hover:scale-105"
            >
              <User className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบพนักงาน (Login)</span>
            </button>
          )
        )}
      </div>

    </aside>
  );
}
