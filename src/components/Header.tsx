"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { PropertyId, canUserViewNotification, canUserAccessProperty } from "@/types/pms";
import { 
  Building2, 
  Moon, 
  Sun, 
  ChevronDown, 
  Hotel, 
  Palmtree, 
  Check, 
  Layers,
  User,
  ShieldCheck, 
  Database,
  Bell,
  Lock
} from "lucide-react";

import { TabType } from "@/components/NavigationTabs";

const tabMeta: Record<TabType, { title: string; subtitle: string }> = {
  dashboard: { title: "สถานะห้องพัก", subtitle: "ภาพรวมผังห้องพักและสถานะเช็คอินแบบ Real-time" },
  calendar: { title: "ปฏิทินไทม์ไลน์", subtitle: "ตารางการจองห้องพักผัง Gantt Chart รายวัน" },
  booking: { title: "เปิดจองห้องพักใหม่", subtitle: "แบบฟอร์มบันทึกรายการจองห้องพักและบริการเสริม" },
  pos: { title: "อาหาร & POS รูมเซอร์วิส", subtitle: "สั่งอาหาร เครื่องดื่ม และมินิบาร์ลงบิลห้องพัก" },
  folio: { title: "บิล & เช็คเอาต์ (Folio)", subtitle: "ตรวจสอบยอดค่าใช้จ่าย พิมพ์ใบเสร็จ และรับชำระเงิน" },
  admin: { title: "ระบบหลังบ้าน & รายงาน", subtitle: "จัดการข้อมูลห้องพัก เมนูอาหาร ประวัติการจอง และ Export Excel" },
};

export function Header({ 
  onOpenLogin,
  onOpenPropertySelect,
  onOpenInstall,
  onOpenNotifications,
  activeTab = "dashboard"
}: { 
  onOpenLogin: () => void;
  onOpenPropertySelect?: () => void;
  onOpenInstall?: () => void;
  onOpenNotifications?: () => void;
  activeTab?: TabType;
}) {
  const { 
    activePropertyId, 
    setActivePropertyId, 
    properties, 
    isDarkMode, 
    isMounted, 
    toggleDarkMode,
    currentUser,
    isDatabaseInstalled,
    notifications
  } = usePMS();

  const unreadCount = notifications.filter(n => canUserViewNotification(currentUser, n) && !n.isRead).length;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentProperty = properties.find((p) => p.id === activePropertyId);

  const getPropertyName = (isCompact = false) => {
    if (activePropertyId === "all") return isCompact ? "ภาพรวม 2 โรงแรม" : "ภาพรวมทั้ง 2 โรงแรม (All Properties)";
    return currentProperty ? currentProperty.name : "เลือกโรงแรม";
  };

  const selectProperty = (id: PropertyId | "all") => {
    setActivePropertyId(id);
    setIsDropdownOpen(false);
  };

  return (
    <header className="no-print sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-[#090f26]/95 border-b border-amber-200/50 dark:border-amber-900/40 shadow-xs transition-colors">
      {/* 1. Desktop Minimalist Header: Shows ONLY the Active Tab Title & Context */}
      <div className="hidden lg:flex items-center justify-between h-16 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <h1 className="font-serif font-bold text-xl xl:text-2xl text-stone-900 dark:text-stone-100 tracking-tight">
            {tabMeta[activeTab]?.title || "ระบบจัดการโรงแรม"}
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/30">
            {isMounted ? getPropertyName() : "เลือกโรงแรม"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {tabMeta[activeTab]?.subtitle}
          </p>
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              title="ศูนย์การแจ้งเตือน (Notification Center)"
              className="relative p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-400 bg-stone-50 dark:bg-slate-800/80 text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer shadow-xs hover:scale-105"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. Mobile/Tablet Touch Header (< lg) */}
      <div className="lg:hidden max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-20">
          
          {/* Logo & Hotel Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
              <Hotel className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-sm sm:text-xl tracking-tight text-stone-900 dark:text-stone-100">
                  KRA
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-1.5 py-0.2 rounded">
                  PMS
                </span>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 hidden md:block">
                Sukhothai Village & Thanawong Pool Villa
              </p>
            </div>
          </div>

          {/* Property Selector & Theme Toggle */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Property Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl border border-amber-300/60 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-all text-xs sm:text-sm font-medium text-stone-800 dark:text-amber-100 shadow-xs"
              >
                {isMounted && activePropertyId === "bugaan" ? (
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : isMounted && activePropertyId === "thanawong" ? (
                  <Palmtree className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                
                <span className="max-w-[120px] xs:max-w-[160px] sm:max-w-[240px] truncate text-left text-[11px] sm:text-sm font-semibold">
                  {isMounted ? getPropertyName(true) : "ภาพรวม 2 โรงแรม"}
                </span>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-500 dark:text-stone-400 shrink-0" />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#101c42] shadow-2xl border border-amber-200/60 dark:border-amber-800/60 py-2 z-40 transition-all">
                    <div className="px-3 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                      เลือกดูโรงแรมที่ต้องการ
                    </div>

                    {canUserAccessProperty(currentUser, "all") ? (
                      <button
                        onClick={() => selectProperty("all")}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                          activePropertyId === "all"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold"
                            : "text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <div>
                            <div>ภาพรวมทั้ง 2 โรงแรม</div>
                            <div className="text-[11px] text-stone-400 font-normal">Bu-Gaan (27 ห้อง) & Thanawong (14 ห้อง) รวม 41 ห้อง</div>
                          </div>
                        </div>
                        {activePropertyId === "all" && <Check className="w-4 h-4 text-amber-600" />}
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between px-3.5 py-2 text-left text-sm opacity-50 cursor-not-allowed bg-stone-50/50 dark:bg-stone-900/30">
                        <div className="flex items-center gap-2.5">
                          <Layers className="w-4 h-4 text-stone-400" />
                          <div>
                            <div className="text-stone-400">ภาพรวมทั้ง 2 โรงแรม</div>
                            <div className="text-[10px] text-stone-400">เฉพาะผู้จัดการ GM / แอดมิน</div>
                          </div>
                        </div>
                        <Lock className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                    )}

                    <div className="my-1 border-t border-stone-100 dark:border-stone-800" />

                    {properties.map((prop) => {
                      const canAccess = canUserAccessProperty(currentUser, prop.id);
                      if (!canAccess) {
                        return (
                          <div
                            key={prop.id}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm opacity-50 cursor-not-allowed bg-stone-50/50 dark:bg-stone-900/30"
                          >
                            <div className="flex items-center gap-2.5">
                              {prop.id === "bugaan" ? (
                                <Building2 className="w-4 h-4 text-stone-400" />
                              ) : (
                                <Palmtree className="w-4 h-4 text-stone-400" />
                              )}
                              <div>
                                <div className="text-stone-400">{prop.name}</div>
                                <div className="text-[10px] text-rose-500 dark:text-rose-400">ไม่มีสิทธิ์เข้าถึงสาขานี้</div>
                              </div>
                            </div>
                            <Lock className="w-3.5 h-3.5 text-stone-400" />
                          </div>
                        );
                      }

                      return (
                        <button
                          key={prop.id}
                          onClick={() => selectProperty(prop.id)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                            activePropertyId === prop.id
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold"
                              : "text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {prop.id === "bugaan" ? (
                              <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Palmtree className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            )}
                            <div>
                              <div>{prop.name}</div>
                              <div className="text-[11px] text-stone-400 font-normal">{prop.nameTh} ({prop.totalRooms} ห้อง)</div>
                            </div>
                          </div>
                          {activePropertyId === prop.id && <Check className="w-4 h-4 text-amber-600" />}
                        </button>
                      );
                    })}

                    {onOpenPropertySelect && (
                      <div className="pt-1 mt-1 border-t border-stone-100 dark:border-stone-800">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onOpenPropertySelect();
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                        >
                          <Hotel className="w-3.5 h-3.5 shrink-0" />
                          <span>เปิดหน้าต่างเลือกโรงแรม & ดูสถิติสด...</span>
                        </button>
                      </div>
                    )}

                    {onOpenInstall && (
                      <div className="pt-1 border-t border-stone-100 dark:border-stone-800">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onOpenInstall();
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Database className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{isDatabaseInstalled ? "ตั้งค่าฐานข้อมูลออนไลน์ (Cloud DB)" : "ติดตั้งฐานข้อมูลออนไลน์ (Install DB)..."}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Notification Bell (Mobile) */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                title="ศูนย์การแจ้งเตือน (Notification Center)"
                className="relative p-2 sm:p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-amber-300 transition-colors"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}



            {/* Staff Login / Profile Button */}
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#101c42] hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-stone-800 dark:text-stone-200"
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                {isMounted && currentUser ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <span className="hidden sm:inline-block max-w-[100px] truncate">
                {isMounted && currentUser ? currentUser.name.split(" ")[0] : "เข้าสู่ระบบ"}
              </span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
