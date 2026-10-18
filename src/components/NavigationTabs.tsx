"use client";

import React from "react";
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
  Sparkles
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
  const { currentUser } = usePMS();
  const tabs = [
    { id: "dashboard", label: "สถานะห้องพัก", sub: "Live Status", icon: LayoutDashboard },
    { id: "calendar", label: "ปฏิทินไทม์ไลน์", sub: "Timeline Gantt", icon: CalendarDays },
    { id: "rate-grid", label: "ปฏิทินห้องว่าง & ราคา", sub: "Rate Grid", icon: Grid3X3 },
    { id: "room-types", label: "ห้องพักและความจุ", sub: "Capacity", icon: BedDouble },
    { id: "market-pricing", label: "การตั้งราคาอิงตลาด", sub: "Rate Intelligence", icon: TrendingUp },
    { id: "promotions", label: "โปรโมชั่น", sub: "Deals", icon: Tag },
    { id: "housekeeping", label: "ตารางทำความสะอาด", sub: "Housekeeping", icon: Sparkles },
    { id: "booking", label: "จองห้องพัก", sub: "New Booking", icon: PlusCircle },
    { id: "pos", label: "อาหาร & POS", sub: "Room Service", icon: UtensilsCrossed },
    { id: "folio", label: "บิล & เช็คเอาต์", sub: "Billing & Folio", icon: Receipt },
    { id: "admin", label: "ระบบหลังบ้าน", sub: "Backoffice & Settings", icon: Settings },
  ].filter((tab) => tab.id !== "admin" || isUserAdminOrGM(currentUser));

  return (
    <>
      {/* Desktop & Tablet Top Navigation Tabs */}
      <div className="hidden sm:block border-b border-amber-200/40 dark:border-amber-900/40 bg-white/70 dark:bg-[#090f26]/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isRestrictedAdmin = tab.id === "admin" && !isUserAdminOrGM(currentUser);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/25 font-semibold"
                      : "text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-amber-600 dark:text-amber-400"}`} />
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

      {/* Mobile-First Bottom Navigation Bar (Touch Target >= 48px) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#070c1e]/95 backdrop-blur-2xl border-t border-amber-200/50 dark:border-amber-900/40 shadow-2xl safe-area-bottom">
        <div className={`grid ${tabs.length === 5 ? "grid-cols-5" : "grid-cols-6"} h-16 items-center px-1`}>
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isCenterBooking = tabs.length === 5 && tab.id === "booking";

            const mobileLabel = 
              tab.id === "dashboard" ? "ห้องพัก" :
              tab.id === "calendar" ? "ปฏิทิน" :
              tab.id === "booking" ? "เปิดจอง" :
              tab.id === "pos" ? "อาหาร/POS" :
              tab.id === "folio" ? "บิล/Folio" : "หลังบ้าน";

            if (isCenterBooking) {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className="flex flex-col items-center justify-center h-full transition-all relative py-1 cursor-pointer select-none"
                >
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-white shadow-lg shadow-amber-500/40 -translate-y-2 ring-4 ring-white dark:ring-[#070c1e] scale-105"
                        : "bg-gradient-to-tr from-amber-600/90 to-amber-500/90 text-white shadow-md shadow-amber-500/25 -translate-y-1.5 ring-3 ring-white dark:ring-[#070c1e]"
                    }`}
                  >
                    <PlusCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-[10px] mt-0.5 leading-tight font-bold tracking-tight ${
                    isActive ? "text-amber-600 dark:text-amber-400" : "text-stone-600 dark:text-stone-300"
                  }`}>
                    {mobileLabel}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex flex-col items-center justify-center h-full transition-all py-1 relative cursor-pointer select-none ${
                  isActive
                    ? "text-amber-600 dark:text-amber-400 font-bold"
                    : "text-stone-400 dark:text-stone-500 hover:text-stone-700"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all relative ${
                    isActive
                      ? "bg-amber-500/15 dark:bg-amber-500/20 scale-105 text-amber-600 dark:text-amber-400 shadow-xs"
                      : "text-stone-500 dark:text-stone-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] mt-0.5 leading-tight tracking-tight whitespace-nowrap ${
                  isActive ? "font-bold text-amber-600 dark:text-amber-400" : "font-medium text-stone-500 dark:text-stone-400"
                }`}>
                  {mobileLabel}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
