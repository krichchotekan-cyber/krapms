"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  CalendarDays, 
  UtensilsCrossed, 
  PlusCircle, 
  Receipt, 
  Settings,
  Lock,
  Grid3X3,
  BedDouble,
  TrendingUp,
  Tag,
  Sparkles,
  LayoutGrid,
  X,
  ChevronRight,
  ShieldCheck,
  User,
  Building2,
  Palmtree,
  QrCode,
  Database,
  ArrowRight
} from "lucide-react";
import { usePMS } from "@/context/PMSContext";
import { isUserAdminOrGM } from "@/types/pms";

export type TabType = 
  | "dashboard" 
  | "calendar" 
  | "pos" 
  | "booking" 
  | "folio" 
  | "admin"
  | "rate-grid"
  | "room-types"
  | "market-pricing"
  | "promotions"
  | "housekeeping";

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function NavigationTabs({ activeTab, setActiveTab }: NavigationProps) {
  const { currentUser, activePropertyId, properties } = usePMS();
  const isAdmin = isUserAdminOrGM(currentUser);
  const currentProperty = properties.find((p) => p.id === activePropertyId) || properties[0];

  // Mobile More Features Drawer State
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Desktop & Tablet Navigation Items (Scrollable Header)
  const desktopTabs = [
    { id: "dashboard" as TabType, label: "สถานะห้องพัก", sub: "Live Status", icon: LayoutDashboard },
    { id: "calendar" as TabType, label: "ปฏิทินไทม์ไลน์", sub: "Timeline Gantt", icon: CalendarDays },
    { id: "rate-grid" as TabType, label: "ปฏิทินห้องว่าง & ราคา", sub: "Rate Grid", icon: Grid3X3 },
    { id: "room-types" as TabType, label: "ห้องพักและความจุ", sub: "Capacity", icon: BedDouble },
    { id: "market-pricing" as TabType, label: "การตั้งราคาอิงตลาด", sub: "Rate Intelligence", icon: TrendingUp },
    { id: "promotions" as TabType, label: "โปรโมชั่น", sub: "Deals", icon: Tag },
    { id: "housekeeping" as TabType, label: "ตารางทำความสะอาด", sub: "Housekeeping", icon: Sparkles },
    { id: "booking" as TabType, label: "จองห้องพัก", sub: "New Booking", icon: PlusCircle },
    { id: "pos" as TabType, label: "อาหาร & POS", sub: "Room Service", icon: UtensilsCrossed },
    { id: "folio" as TabType, label: "บิล & เช็คเอาต์", sub: "Billing & Folio", icon: Receipt },
    { id: "admin" as TabType, label: "ระบบหลังบ้าน", sub: "Backoffice & Settings", icon: Settings },
  ].filter((tab) => tab.id !== "admin" || isAdmin);

  // Check if active tab is one of the secondary tabs
  const isSecondaryActive = [
    "rate-grid",
    "room-types",
    "market-pricing",
    "promotions",
    "housekeeping",
    "pos",
    "admin"
  ].includes(activeTab);

  const getSecondaryActiveLabel = () => {
    switch (activeTab) {
      case "rate-grid": return "ปฏิทินราคา";
      case "room-types": return "ประเภทห้อง";
      case "market-pricing": return "ราคาตลาด";
      case "promotions": return "โปรโมชั่น";
      case "housekeeping": return "แม่บ้าน";
      case "pos": return "อาหาร/POS";
      case "admin": return "หลังบ้าน";
      default: return "เมนูจัดการ";
    }
  };

  const handleSelectTab = (tabId: TabType) => {
    setActiveTab(tabId);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* 1. Desktop & Tablet Top Navigation Tabs */}
      <div className="hidden sm:block border-b border-amber-200/40 dark:border-amber-900/40 bg-white/70 dark:bg-[#090f26]/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-1.5 py-2 overflow-x-auto scrollbar-none">
            {desktopTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isRestrictedAdmin = tab.id === "admin" && !isAdmin;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-xs transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/25 font-bold"
                      : "text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-amber-600 dark:text-amber-400"}`} />
                  <span>{tab.label}</span>
                  {isRestrictedAdmin && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-200/80 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                      <Lock className="w-2.5 h-2.5" />
                      <span>GM</span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 2. Mobile Bottom Navigation Bar (Clean 5-Item Native Architecture) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#070c1e]/95 backdrop-blur-2xl border-t border-stone-200/70 dark:border-slate-800/80 shadow-[0_-8px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.4)] pb-[max(env(safe-area-inset-bottom),0.35rem)]">
        <div className="grid grid-cols-5 h-15 items-center px-1 max-w-lg mx-auto">
          {/* 1. Dashboard (ผังห้องพัก) */}
          <button
            onClick={() => handleSelectTab("dashboard")}
            className={`flex flex-col items-center justify-center h-full transition-all py-1 relative cursor-pointer select-none ${
              activeTab === "dashboard"
                ? "text-amber-600 dark:text-amber-400 font-bold"
                : "text-stone-400 dark:text-stone-500 hover:text-stone-700"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === "dashboard" ? "bg-amber-500/15 dark:bg-amber-500/20 scale-105" : ""
            }`}>
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 leading-tight tracking-tight font-medium">
              ห้องพัก
            </span>
            {activeTab === "dashboard" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5" />
            )}
          </button>

          {/* 2. Calendar Timeline (ปฏิทินไทม์ไลน์) */}
          <button
            onClick={() => handleSelectTab("calendar")}
            className={`flex flex-col items-center justify-center h-full transition-all py-1 relative cursor-pointer select-none ${
              activeTab === "calendar"
                ? "text-amber-600 dark:text-amber-400 font-bold"
                : "text-stone-400 dark:text-stone-500 hover:text-stone-700"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === "calendar" ? "bg-amber-500/15 dark:bg-amber-500/20 scale-105" : ""
            }`}>
              <CalendarDays className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 leading-tight tracking-tight font-medium">
              ปฏิทิน
            </span>
            {activeTab === "calendar" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5" />
            )}
          </button>

          {/* 3. Center Hero Action: เปิดจองห้องพัก (Floating Center Button) */}
          <button
            onClick={() => handleSelectTab("booking")}
            className="flex flex-col items-center justify-center h-full transition-all relative -top-2 cursor-pointer select-none"
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                activeTab === "booking"
                  ? "bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-white shadow-lg shadow-amber-500/40 ring-4 ring-white dark:ring-[#070c1e] scale-105"
                  : "bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/25 ring-3 ring-white dark:ring-[#070c1e] hover:scale-102"
              }`}
            >
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <span className={`text-[10px] mt-0.5 leading-tight font-bold tracking-tight ${
              activeTab === "booking" ? "text-amber-600 dark:text-amber-400" : "text-stone-600 dark:text-stone-300"
            }`}>
              เปิดจอง
            </span>
          </button>

          {/* 4. Folio & Billing (บิล & เช็คเอาต์) */}
          <button
            onClick={() => handleSelectTab("folio")}
            className={`flex flex-col items-center justify-center h-full transition-all py-1 relative cursor-pointer select-none ${
              activeTab === "folio"
                ? "text-amber-600 dark:text-amber-400 font-bold"
                : "text-stone-400 dark:text-stone-500 hover:text-stone-700"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === "folio" ? "bg-amber-500/15 dark:bg-amber-500/20 scale-105" : ""
            }`}>
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 leading-tight tracking-tight font-medium">
              บิล/Folio
            </span>
            {activeTab === "folio" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5" />
            )}
          </button>

          {/* 5. More Features Hub (เมนู & ระบบจัดการ) */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center h-full transition-all py-1 relative cursor-pointer select-none ${
              isSecondaryActive
                ? "text-amber-600 dark:text-amber-400 font-bold"
                : "text-stone-400 dark:text-stone-500 hover:text-stone-700"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all relative ${
              isSecondaryActive ? "bg-amber-500/15 dark:bg-amber-500/20 scale-105" : ""
            }`}>
              <LayoutGrid className="w-4 h-4" />
              {isSecondaryActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 leading-tight tracking-tight font-medium truncate max-w-[56px]">
              {isSecondaryActive ? getSecondaryActiveLabel() : "เมนูจัดการ"}
            </span>
            {isSecondaryActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* 3. Mobile "More Features" Bottom Sheet Modal (Drawer) */}
      {isMoreMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          {/* Backdrop Click */}
          <div className="flex-1" onClick={() => setIsMoreMenuOpen(false)} />

          {/* Slide-up Container */}
          <div className="bg-white dark:bg-[#0a1028] rounded-t-3xl border-t border-stone-200 dark:border-slate-800 shadow-2xl p-5 max-h-[85vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom duration-200">
            {/* Top Handle & User Info Header */}
            <div className="flex flex-col items-center gap-2 -mt-1">
              <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-slate-700" />
              <div className="w-full flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {currentUser?.name || "พนักงานต้อนรับ"}
                      </span>
                      {isAdmin ? (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                          GM / Admin
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-400">
                          Staff
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      {currentProperty.nameTh}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-500 flex items-center justify-center hover:bg-stone-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Section 1: ราคาและจำนวนห้อง (Rates & Inventory - ZUZU Style) */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-1">
                ราคาและจำนวนห้อง (Rates & Inventory)
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Rate & Allotment Grid */}
                <button
                  onClick={() => handleSelectTab("rate-grid")}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    activeTab === "rate-grid"
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs"
                      : "bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-slate-800 text-stone-800 dark:text-stone-200 hover:border-amber-400"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                    <Grid3X3 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block leading-tight">ปฏิทินห้องว่าง</span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Rate & Allotment Grid</span>
                  </div>
                </button>

                {/* Room Types & Capacity */}
                <button
                  onClick={() => handleSelectTab("room-types")}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    activeTab === "room-types"
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs"
                      : "bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-slate-800 text-stone-800 dark:text-stone-200 hover:border-amber-400"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 shrink-0">
                    <BedDouble className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block leading-tight">ห้องพักและความจุ</span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Room Types Setup</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Section 2: การจัดการรายได้ & การตลาด (Revenue Management) */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-1">
                การจัดการรายได้ (Revenue Management)
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Market Pricing */}
                <button
                  onClick={() => handleSelectTab("market-pricing")}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    activeTab === "market-pricing"
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs"
                      : "bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-slate-800 text-stone-800 dark:text-stone-200 hover:border-amber-400"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block leading-tight">ราคาอิงตลาด</span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Rate Intelligence</span>
                  </div>
                </button>

                {/* Promotions & Deals */}
                <button
                  onClick={() => handleSelectTab("promotions")}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    activeTab === "promotions"
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs"
                      : "bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-slate-800 text-stone-800 dark:text-stone-200 hover:border-amber-400"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block leading-tight">โปรโมชั่น OTA</span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Deals & Rate Logs</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Section 3: การปฏิบัติงาน & บริการ (Operations) */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-1">
                การปฏิบัติงาน (Operations & Services)
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Housekeeping */}
                <button
                  onClick={() => handleSelectTab("housekeeping")}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    activeTab === "housekeeping"
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs"
                      : "bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-slate-800 text-stone-800 dark:text-stone-200 hover:border-amber-400"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block leading-tight">ตารางแม่บ้าน</span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Housekeeping Tasks</span>
                  </div>
                </button>

                {/* Food & POS */}
                <button
                  onClick={() => handleSelectTab("pos")}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    activeTab === "pos"
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs"
                      : "bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-slate-800 text-stone-800 dark:text-stone-200 hover:border-amber-400"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block leading-tight">อาหาร & POS</span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Room Service Order</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Section 4: ระบบหลังบ้าน & ผู้ดูแลระบบ (Administration - Admin Only) */}
            {isAdmin && (
              <div className="space-y-2 pt-1 border-t border-stone-100 dark:border-slate-800/80">
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-1 flex items-center justify-between">
                  <span>ระบบหลังบ้าน (Administration)</span>
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded">
                    Admin / GM
                  </span>
                </div>
                <button
                  onClick={() => handleSelectTab("admin")}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === "admin"
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs"
                      : "bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-slate-800 text-stone-800 dark:text-stone-200 hover:border-amber-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-stone-300">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold block text-sm">ระบบหลังบ้าน & รายงาน</span>
                      <span className="text-[11px] text-stone-400">
                        พร้อมเพย์, พนักงาน, บิลย้อนหลัง และส่งออก Excel
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
