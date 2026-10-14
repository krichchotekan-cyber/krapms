"use client";

import React, { useState, useEffect } from "react";
import { usePMS } from "@/context/PMSContext";
import { PropertyId, canUserAccessProperty } from "@/types/pms";
import { 
  Building2, 
  Palmtree, 
  Layers, 
  Check, 
  Sparkles, 
  ArrowRight, 
  X, 
  Hotel, 
  BedDouble, 
  TrendingUp, 
  Bookmark,
  CheckCircle2,
  Info,
  Lock,
  ShieldCheck
} from "lucide-react";

interface PropertySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelected?: (propertyId: PropertyId | "all") => void;
}

export function PropertySelectModal({ isOpen, onClose, onSelected }: PropertySelectModalProps) {
  const { 
    properties, 
    activePropertyId, 
    setActivePropertyId, 
    rooms, 
    bookings, 
    currentUser 
  } = usePMS();

  const [selectedId, setSelectedId] = useState<PropertyId | "all">(activePropertyId);
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(true);
  const [skipNextTime, setSkipNextTime] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const canAccessBugaan = canUserAccessProperty(currentUser, "bugaan");
  const canAccessThanawong = canUserAccessProperty(currentUser, "thanawong");
  const canAccessAll = canUserAccessProperty(currentUser, "all");

  useEffect(() => {
    if (isOpen) {
      if (canUserAccessProperty(currentUser, activePropertyId)) {
        setSelectedId(activePropertyId);
      } else if (canAccessBugaan) {
        setSelectedId("bugaan");
      } else if (canAccessThanawong) {
        setSelectedId("thanawong");
      } else {
        setSelectedId("all");
      }

      if (typeof window !== "undefined") {
        const isDefault = localStorage.getItem("hotel_pms_default_property");
        if (isDefault) {
          setSaveAsDefault(true);
        }
        const skip = localStorage.getItem("hotel_pms_skip_property_modal") === "true";
        setSkipNextTime(skip);
      }
    }
  }, [isOpen, activePropertyId, currentUser, canAccessBugaan, canAccessThanawong]);

  if (!isOpen) return null;

  // Calculate stats for Bu-Gaan
  const bugaanRooms = rooms.filter((r) => r.propertyId === "bugaan");
  const bugaanOccupied = bugaanRooms.filter((r) => r.status === "OCCUPIED").length;
  const bugaanAvailable = bugaanRooms.filter((r) => r.status === "AVAILABLE").length;
  const bugaanOccupancyRate = bugaanRooms.length > 0 ? Math.round((bugaanOccupied / bugaanRooms.length) * 100) : 0;
  const bugaanActiveBookings = bookings.filter((b) => b.propertyId === "bugaan" && (b.status === "CONFIRMED" || b.status === "CHECKED_IN")).length;

  // Calculate stats for Thanawong
  const thanawongRooms = rooms.filter((r) => r.propertyId === "thanawong");
  const thanawongOccupied = thanawongRooms.filter((r) => r.status === "OCCUPIED").length;
  const thanawongAvailable = thanawongRooms.filter((r) => r.status === "AVAILABLE").length;
  const thanawongOccupancyRate = thanawongRooms.length > 0 ? Math.round((thanawongOccupied / thanawongRooms.length) * 100) : 0;
  const thanawongActiveBookings = bookings.filter((b) => b.propertyId === "thanawong" && (b.status === "CONFIRMED" || b.status === "CHECKED_IN")).length;

  // Total stats
  const totalRooms = rooms.length;
  const totalOccupied = bugaanOccupied + thanawongOccupied;
  const totalAvailable = bugaanAvailable + thanawongAvailable;
  const totalOccupancyRate = totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0;

  const handleConfirm = (propIdToUse?: PropertyId | "all") => {
    const target = propIdToUse ?? selectedId;

    if (!canUserAccessProperty(currentUser, target)) {
      setToastMessage("ไม่มีสิทธิ์เข้าถึงโรงแรมนี้ (Access Denied)");
      return;
    }

    setActivePropertyId(target);

    if (typeof window !== "undefined") {
      // Save current chosen property
      localStorage.setItem("hotel_pms_property", target);

      // Save as default if checked
      if (saveAsDefault) {
        localStorage.setItem("hotel_pms_default_property", target);
      } else {
        localStorage.removeItem("hotel_pms_default_property");
      }

      // Save skip preference
      if (skipNextTime) {
        localStorage.setItem("hotel_pms_skip_property_modal", "true");
      } else {
        localStorage.removeItem("hotel_pms_skip_property_modal");
      }

      // Update URL search parameters
      const url = new URL(window.location.href);
      url.searchParams.set("property", target);
      window.history.replaceState({}, "", url.toString());
    }

    const propName = target === "all" 
      ? "ภาพรวมทั้ง 2 โรงแรม" 
      : target === "bugaan" 
      ? "Bu-Gaan Sukhothai Village" 
      : "Thanawong Pool Villa";

    setToastMessage(`เข้าสู่ระบบจัดการ: ${propName}`);

    if (onSelected) {
      onSelected(target);
    }

    setTimeout(() => {
      onClose();
      setToastMessage("");
    }, 450);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative bg-white dark:bg-[#0c132c] rounded-3xl max-w-2xl w-full shadow-2xl border border-amber-300/40 dark:border-amber-700/40 max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-amber-200/50 dark:border-amber-800/40 bg-gradient-to-r from-stone-50 via-amber-50/30 to-stone-50 dark:from-[#0d1636] dark:via-[#111e48] dark:to-[#0d1636] flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Hotel className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base sm:text-xl text-stone-900 dark:text-amber-100 tracking-tight truncate">
                  เลือกโรงแรมที่ต้องการจัดการ
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30 hidden xs:inline-block">
                  Multi-Property
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                {currentUser ? `ยินดีต้อนรับคุณ ${currentUser.name} (${currentUser.role})` : "กรุณาเลือกสาขาที่ต้องการปฏิบัติงาน"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 min-h-0 space-y-4">

          {/* Quick Notice Banner */}
          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">คำแนะนำสำหรับผู้จัดการและเจ้าหน้าที่:</span> สามารถสลับการทำงานระหว่างโรงแรมได้ตลอดเวลาจากเมนูด้านบน หรือเลือก <span className="font-semibold underline">ภาพรวมทั้ง 2 โรงแรม</span> เพื่อดูปฏิทินและสถิติรวมของทั้งเครือ
            </div>
          </div>

          {/* Toast Message when selection applied */}
          {toastMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{toastMessage}</span>
            </div>
          )}

          {/* User Property Permission Status Badge */}
          {currentUser && (
            <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
              currentUser.propertyAccess === "all"
                ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-850 text-emerald-800 dark:text-emerald-200"
                : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-850 text-amber-800 dark:text-amber-200"
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="truncate">
                  <strong>สิทธิ์การเข้าถึงโรงแรม: </strong>
                  {currentUser.propertyAccess === "all"
                    ? "จัดการได้ทุกโรงแรมในเครือ (All Properties)"
                    : currentUser.propertyAccess === "bugaan"
                    ? "จำกัดเฉพาะ Bu-Gaan Sukhothai Village (ไม่สามารถเข้าสาขาอื่น)"
                    : "จำกัดเฉพาะ Thanawong Pool Villa (ไม่สามารถเข้าสาขาอื่น)"}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border shrink-0 text-stone-600 dark:text-stone-300">
                @{currentUser.username}
              </span>
            </div>
          )}

          {/* Property Selection Cards Grid */}
          <div className="space-y-3">
            
            {/* Card 1: Bu-Gaan Sukhothai Village */}
            <div
              onClick={canAccessBugaan ? () => setSelectedId("bugaan") : undefined}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all relative overflow-hidden group ${
                !canAccessBugaan
                  ? "border-stone-200/60 dark:border-stone-800/60 bg-stone-100/40 dark:bg-stone-900/30 opacity-60 cursor-not-allowed"
                  : selectedId === "bugaan"
                  ? "border-amber-500 bg-amber-500/8 dark:bg-amber-500/10 shadow-lg shadow-amber-500/10 cursor-pointer"
                  : "border-stone-200 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-800 bg-stone-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 transition-transform ${
                    canAccessBugaan ? "group-hover:scale-105" : ""
                  } ${
                    !canAccessBugaan
                      ? "bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-500"
                      : selectedId === "bugaan"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  }`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                        Bu-Gaan Sukhothai Village
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                        บูติค วิลเลจ
                      </span>
                      {!canAccessBugaan && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> ไม่มีสิทธิ์เข้าถึงสาขานี้
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      เมืองเก่า สุโขทัย • สถาปัตยกรรมไทยร่วมสมัย (12 วิลล่า)
                    </p>

                    {/* Live KPIs */}
                    <div className="flex items-center gap-3 sm:gap-4 mt-3 text-xs flex-wrap">
                      <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                        <BedDouble className="w-3.5 h-3.5 text-amber-600" />
                        <span>ห้องว่างวันนี้: <strong className="text-emerald-600">{bugaanAvailable}</strong>/{bugaanRooms.length}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                        <span>อัตราเข้าพัก: <strong className="text-amber-700 dark:text-amber-300">{bugaanOccupancyRate}%</strong></span>
                      </div>
                      <div className="text-[11px] text-stone-400">
                        ({bugaanActiveBookings} รายการจองใช้งาน)
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                  !canAccessBugaan
                    ? "bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-400"
                    : selectedId === "bugaan"
                    ? "bg-amber-600 border-amber-600 text-white"
                    : "border-stone-300 dark:border-stone-700 text-transparent"
                }`}>
                  {!canAccessBugaan ? (
                    <Lock className="w-3.5 h-3.5 text-stone-400" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Thanawong Pool Villa */}
            <div
              onClick={canAccessThanawong ? () => setSelectedId("thanawong") : undefined}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all relative overflow-hidden group ${
                !canAccessThanawong
                  ? "border-stone-200/60 dark:border-stone-800/60 bg-stone-100/40 dark:bg-stone-900/30 opacity-60 cursor-not-allowed"
                  : selectedId === "thanawong"
                  ? "border-emerald-500 bg-emerald-500/8 dark:bg-emerald-500/10 shadow-lg shadow-emerald-500/10 cursor-pointer"
                  : "border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-800 bg-stone-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 transition-transform ${
                    canAccessThanawong ? "group-hover:scale-105" : ""
                  } ${
                    !canAccessThanawong
                      ? "bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-500"
                      : selectedId === "thanawong"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}>
                    <Palmtree className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                        Thanawong Pool Villa
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                        พูลวิลล่าส่วนตัว
                      </span>
                      {!canAccessThanawong && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> ไม่มีสิทธิ์เข้าถึงสาขานี้
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      สุโขทัย • ลักชัวรี่พูลวิลล่าเพื่อการพักผ่อนระดับพรีเมียม (10 หลัง)
                    </p>

                    {/* Live KPIs */}
                    <div className="flex items-center gap-3 sm:gap-4 mt-3 text-xs flex-wrap">
                      <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                        <BedDouble className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ห้องว่างวันนี้: <strong className="text-emerald-600">{thanawongAvailable}</strong>/{thanawongRooms.length}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>อัตราเข้าพัก: <strong className="text-emerald-700 dark:text-emerald-300">{thanawongOccupancyRate}%</strong></span>
                      </div>
                      <div className="text-[11px] text-stone-400">
                        ({thanawongActiveBookings} รายการจองใช้งาน)
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                  !canAccessThanawong
                    ? "bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-400"
                    : selectedId === "thanawong"
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-stone-300 dark:border-stone-700 text-transparent"
                }`}>
                  {!canAccessThanawong ? (
                    <Lock className="w-3.5 h-3.5 text-stone-400" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: All Properties Overview */}
            <div
              onClick={canAccessAll ? () => setSelectedId("all") : undefined}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all relative overflow-hidden group ${
                !canAccessAll
                  ? "border-stone-200/60 dark:border-stone-800/60 bg-stone-100/40 dark:bg-stone-900/30 opacity-60 cursor-not-allowed"
                  : selectedId === "all"
                  ? "border-indigo-500 bg-indigo-500/8 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/10 cursor-pointer"
                  : "border-stone-200 dark:border-stone-800 hover:border-indigo-300 dark:hover:border-indigo-800 bg-stone-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 transition-transform ${
                    canAccessAll ? "group-hover:scale-105" : ""
                  } ${
                    !canAccessAll
                      ? "bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-500"
                      : selectedId === "all"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                  }`}>
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                        ภาพรวมทั้ง 2 โรงแรม (All Properties)
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                        สำหรับผู้บริหาร
                      </span>
                      {!canAccessAll && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> เฉพาะผู้จัดการ GM / แอดมิน
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      ดูผังห้องและปฏิทินจองรวมทั้ง Bu-Gaan และ Thanawong (รวม 41 ห้อง)
                    </p>

                    {/* Live KPIs */}
                    <div className="flex items-center gap-3 sm:gap-4 mt-3 text-xs flex-wrap">
                      <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                        <BedDouble className="w-3.5 h-3.5 text-indigo-600" />
                        <span>ห้องว่างรวม: <strong className="text-emerald-600">{totalAvailable}</strong>/{totalRooms}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                        <span>อัตราเข้าพักรวม: <strong className="text-indigo-700 dark:text-indigo-300">{totalOccupancyRate}%</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                  !canAccessAll
                    ? "bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-400"
                    : selectedId === "all"
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "border-stone-300 dark:border-stone-700 text-transparent"
                }`}>
                  {!canAccessAll ? (
                    <Lock className="w-3.5 h-3.5 text-stone-400" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* User Preferences & Recommendations */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#131f47] border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 dark:text-stone-200">
              <Bookmark className="w-4 h-4 text-amber-600" />
              <span>การตั้งค่าการจัดเก็บและการจดจำ (Storage Preferences)</span>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveAsDefault}
                onChange={(e) => setSaveAsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 dark:border-stone-700"
              />
              <span>ตั้งโรงแรมที่เลือกนี้เป็นโรงแรมเริ่มต้นของฉัน (Default Property)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipNextTime}
                onChange={(e) => setSkipNextTime(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 dark:border-stone-700"
              />
              <span>ไม่ต้องเด้งถามอีกในครั้งถัดไปเมื่อล็อกอิน (จำการเลือกและเปิดโรงแรมนี้อัตโนมัติ)</span>
            </label>
          </div>

        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-[#101938] shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium transition-colors"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={() => handleConfirm()}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 flex items-center gap-2 transition-all min-h-[44px]"
          >
            <span>ยืนยันเข้าจัดการโรงแรมที่เลือก</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
