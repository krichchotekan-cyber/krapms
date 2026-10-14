"use client";

import React, { useState, useMemo } from "react";
import { usePMS } from "@/context/PMSContext";
import { 
  DynamicPricingRule, 
  PricingRuleType, 
  PropertyId, 
  OTAChannelId 
} from "@/types/pms";
import { formatCurrency, formatDateThai } from "@/lib/utils";
import { 
  TrendingUp, 
  Calendar, 
  Percent, 
  Trash2, 
  Edit2, 
  Plus, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  Zap, 
  Building2, 
  Palmtree, 
  Clock, 
  SlidersHorizontal, 
  X, 
  Check, 
  Flame, 
  BarChart3, 
  AlertCircle,
  ShieldCheck,
  Send,
  HelpCircle,
  Tag,
  ArrowRight
} from "lucide-react";
import { OtaLogo } from "@/components/OtaLogo";

interface DynamicPricingManagerProps {
  targetPropId: PropertyId;
  isSpecificProperty: boolean;
  hotelName: string;
}

export function DynamicPricingManager({
  targetPropId,
  isSpecificProperty,
  hotelName,
}: DynamicPricingManagerProps) {
  const {
    properties,
    rooms,
    bookings,
    otaChannels,
    dynamicPricingRules,
    addDynamicPricingRule,
    updateDynamicPricingRule,
    deleteDynamicPricingRule,
    toggleDynamicPricingRule,
    calculateDynamicRate,
    syncDynamicRatesToChannels,
  } = usePMS();

  // Filters
  const [propFilter, setPropFilter] = useState<PropertyId | "all">(targetPropId);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Live Simulator state
  const [simPropId, setSimPropId] = useState<PropertyId>(targetPropId);
  const [simRoomId, setSimRoomId] = useState<string>("");
  const [simDate, setSimDate] = useState<string>("2026-11-22"); // Default to Loy Krathong Peak

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "FESTIVAL" as PricingRuleType,
    propertyId: "all" as PropertyId | "all",
    roomType: "all",
    adjustmentType: "PERCENT" as "PERCENT" | "FIXED_AMOUNT",
    adjustmentValue: 20,
    startDate: "2026-11-20",
    endDate: "2026-11-28",
    daysOfWeek: [5, 6] as number[],
    minOccupancyPercent: 70,
    minStayNights: 1,
    channels: ["booking_com", "agoda", "airbnb", "expedia", "direct"] as (OTAChannelId | "direct")[],
    isActive: true,
    description: "",
  });

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return dynamicPricingRules.filter((rule) => {
      if (propFilter !== "all" && rule.propertyId !== "all" && rule.propertyId !== propFilter) {
        return false;
      }
      if (typeFilter !== "ALL" && rule.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [dynamicPricingRules, propFilter, typeFilter]);

  // Simulator room options
  const simRooms = useMemo(() => {
    return rooms.filter((r) => r.propertyId === simPropId);
  }, [rooms, simPropId]);

  const selectedSimRoom = useMemo(() => {
    if (simRoomId) {
      const found = simRooms.find((r) => r.id === simRoomId);
      if (found) return found;
    }
    return simRooms[0] || null;
  }, [simRooms, simRoomId]);

  // Calculate simulated dynamic rate
  const simulationResult = useMemo(() => {
    if (!selectedSimRoom || !simDate) {
      return { finalRate: 0, appliedRules: [], breakdown: [] };
    }
    return calculateDynamicRate(
      selectedSimRoom.pricePerNight,
      simDate,
      simPropId,
      selectedSimRoom.type
    );
  }, [selectedSimRoom, simDate, simPropId, calculateDynamicRate]);

  // Handle Sync to OTAs
  const handlePushRatesToOTAs = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncDynamicRatesToChannels(propFilter);
      setSyncFeedback(`ซิงค์ราคา Dynamic Pricing ไปยัง ${res.updatedChannels} แพลตฟอร์มเรียบร้อยแล้ว`);
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch {
      setSyncFeedback("เกิดข้อผิดพลาดในการซิงค์ราคา");
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingRuleId(null);
    setForm({
      name: "",
      type: "FESTIVAL",
      propertyId: "all",
      roomType: "all",
      adjustmentType: "PERCENT",
      adjustmentValue: 20,
      startDate: "2026-11-20",
      endDate: "2026-11-28",
      daysOfWeek: [5, 6],
      minOccupancyPercent: 70,
      minStayNights: 1,
      channels: ["booking_com", "agoda", "airbnb", "expedia", "direct"],
      isActive: true,
      description: "",
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (rule: DynamicPricingRule) => {
    setEditingRuleId(rule.id);
    setForm({
      name: rule.name,
      type: rule.type,
      propertyId: rule.propertyId,
      roomType: rule.roomType || "all",
      adjustmentType: rule.adjustmentType,
      adjustmentValue: rule.adjustmentValue,
      startDate: rule.startDate || "2026-11-20",
      endDate: rule.endDate || "2026-11-28",
      daysOfWeek: rule.daysOfWeek || [5, 6],
      minOccupancyPercent: rule.minOccupancyPercent || 70,
      minStayNights: rule.minStayNights || 1,
      channels: rule.channels,
      isActive: rule.isActive,
      description: rule.description,
    });
    setIsModalOpen(true);
  };

  // Save Modal Form
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingRuleId) {
      updateDynamicPricingRule(editingRuleId, {
        name: form.name,
        type: form.type,
        propertyId: form.propertyId,
        roomType: form.roomType,
        adjustmentType: form.adjustmentType,
        adjustmentValue: Number(form.adjustmentValue),
        startDate: form.type === "FESTIVAL" || form.type === "SEASONAL" ? form.startDate : undefined,
        endDate: form.type === "FESTIVAL" || form.type === "SEASONAL" ? form.endDate : undefined,
        daysOfWeek: form.type === "DAY_OF_WEEK" ? form.daysOfWeek : undefined,
        minOccupancyPercent: form.type === "OCCUPANCY" ? Number(form.minOccupancyPercent) : undefined,
        minStayNights: Number(form.minStayNights) || 1,
        channels: form.channels,
        isActive: form.isActive,
        description: form.description,
      });
    } else {
      addDynamicPricingRule({
        name: form.name,
        type: form.type,
        propertyId: form.propertyId,
        roomType: form.roomType,
        adjustmentType: form.adjustmentType,
        adjustmentValue: Number(form.adjustmentValue),
        startDate: form.type === "FESTIVAL" || form.type === "SEASONAL" ? form.startDate : undefined,
        endDate: form.type === "FESTIVAL" || form.type === "SEASONAL" ? form.endDate : undefined,
        daysOfWeek: form.type === "DAY_OF_WEEK" ? form.daysOfWeek : undefined,
        minOccupancyPercent: form.type === "OCCUPANCY" ? Number(form.minOccupancyPercent) : undefined,
        minStayNights: Number(form.minStayNights) || 1,
        channels: form.channels,
        isActive: form.isActive,
        priority: 5,
        description: form.description,
      });
    }
    setIsModalOpen(false);
  };

  const getRuleTypeBadge = (type: PricingRuleType) => {
    switch (type) {
      case "FESTIVAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>เทศกาลพิเศษ (Festival)</span>
          </span>
        );
      case "DAY_OF_WEEK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            <Calendar className="w-3 h-3 text-blue-500" />
            <span>สุดสัปดาห์ (Weekend)</span>
          </span>
        );
      case "OCCUPANCY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20">
            <BarChart3 className="w-3 h-3 text-purple-500" />
            <span>ดีมานด์ยอดจอง (Yield)</span>
          </span>
        );
      case "LAST_MINUTE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <Clock className="w-3 h-3 text-rose-500" />
            <span>Last-Minute</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-500/15 text-stone-700 dark:text-stone-300 border border-stone-500/20">
            <Tag className="w-3 h-3 text-stone-400" />
            <span>ทั่วไป</span>
          </span>
        );
    }
  };

  const activeRulesCount = dynamicPricingRules.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6">

      {/* Sync Success / Alert Toast Banner */}
      {syncFeedback && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl p-4 shadow-lg animate-in slide-in-from-top duration-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              {syncFeedback}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner & Yield Automation Actions */}
      <div className="bg-gradient-to-r from-[#0d1733] via-[#13224d] to-[#1c326e] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-amber-400/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Yield Management & Smart Seasonal Rates</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>คำนวณอัตโนมัติ</span>
              </span>
            </div>

            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white">
              ระบบปรับราคาห้องพักอัตโนมัติตามช่วงเทศกาลและดีมานด์
            </h2>

            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              เพิ่มรายได้และอัตรากำไรสูงสุด (Yield) โดยปรับราคาห้องพักอัตโนมัติตามช่วงเทศกาลสำคัญของสุโขทัย เช่น 
              <strong className="text-amber-300 font-semibold"> ประเพณีลอยกระทง เผาเทียน เล่นไฟ</strong>, 
              วันหยุดสุดสัปดาห์ ศุกร์-เสาร์ หรือเมื่ออัตราการจองของโรงแรมสูงเกิน 70% 
              พร้อมส่งราคาใหม่ไปยัง Booking.com, Agoda และทุกช่องทางในคลิกเดียว
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>เพิ่มกฎราคาใหม่</span>
            </button>

            <button
              type="button"
              onClick={handlePushRatesToOTAs}
              disabled={isSyncing}
              className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังส่งราคา...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ซิงค์ราคาไปยังทุก OTA ทันที</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/5">
            <span className="text-stone-400 block text-[11px]">สถานะระบบ Dynamic Pricing</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-300 font-bold text-sm">
                เปิดใช้งาน ({activeRulesCount} จาก {dynamicPricingRules.length} กฎ)
              </span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/5">
            <span className="text-amber-300/80 block text-[11px]">เทศกาลสุโขทัยถัดไป</span>
            <div className="text-white font-bold text-sm mt-1 truncate" title="ประเพณีลอยกระทง เผาเทียน เล่นไฟ สุโขทัย">
              ลอยกระทง (+50%)
            </div>
            <span className="text-[10px] text-stone-400 block mt-0.5">20 - 28 พ.ย. (พักขั้นต่ำ 2 คืน)</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/5">
            <span className="text-blue-300/80 block text-[11px]">วันหยุดสุดสัปดาห์</span>
            <div className="text-white font-bold text-sm mt-1">
              ศุกร์ - เสาร์ (+20%)
            </div>
            <span className="text-[10px] text-stone-400 block mt-0.5">ปรับอัตโนมัติทุกสัปดาห์</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/5">
            <span className="text-purple-300/80 block text-[11px]">ดีมานด์ห้องพักเกิน 70%</span>
            <div className="text-white font-bold text-sm mt-1">
              ปรับพุ่งขึ้น (+25%)
            </div>
            <span className="text-[10px] text-stone-400 block mt-0.5">ทำงานเมื่อยอดจองเกินเป้า</span>
          </div>
        </div>
      </div>

      {/* LIVE RATE SIMULATOR & CALCULATOR (เครื่องมือจำลองราคาแบบอินเทอร์แอคทีฟ) */}
      <div className="bg-white dark:bg-[#101c42] rounded-3xl p-6 sm:p-7 border border-amber-300/40 dark:border-amber-400/20 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                เครื่องมือจำลองคำนวณราคาห้องพักสด (Live Rate Simulator & Yield Calculator)
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              ทดสอบเลือกวันที่และห้องพัก เพื่อดูราคาที่ระบบคำนวณเพิ่ม/ลดตามกฎเทศกาลและดีมานด์จริงแบบเรียลไทม์
            </p>
          </div>

          {/* Quick Dates Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSimDate("2026-11-22")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                simDate === "2026-11-22"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
              }`}
            >
              ลอยกระทงสุโขทัย (22 พ.ย.)
            </button>
            <button
              type="button"
              onClick={() => {
                const nextSat = new Date();
                nextSat.setDate(nextSat.getDate() + ((6 - nextSat.getDay() + 7) % 7 || 7));
                setSimDate(nextSat.toISOString().split("T")[0]);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition-all cursor-pointer"
            >
              คืนวันเสาร์นี้
            </button>
            <button
              type="button"
              onClick={() => setSimDate("2026-12-31")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                simDate === "2026-12-31"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
              }`}
            >
              เคาต์ดาวน์ปีใหม่ (31 ธ.ค.)
            </button>
            <button
              type="button"
              onClick={() => {
                const wed = new Date();
                wed.setDate(wed.getDate() + ((3 - wed.getDay() + 7) % 7 || 7));
                setSimDate(wed.toISOString().split("T")[0]);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition-all cursor-pointer"
            >
              วันธรรมดาปกติ
            </button>
          </div>
        </div>

        {/* Simulator Controls & Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
          
          {/* Left Inputs (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                เลือกสาขาโรงแรม
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSimPropId("bugaan");
                    const bgRooms = rooms.filter((r) => r.propertyId === "bugaan");
                    if (bgRooms[0]) setSimRoomId(bgRooms[0].id);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    simPropId === "bugaan"
                      ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50"
                  }`}
                >
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span className="truncate">บูก้าน สุโขทัย</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimPropId("thanawong");
                    const twRooms = rooms.filter((r) => r.propertyId === "thanawong");
                    if (twRooms[0]) setSimRoomId(twRooms[0].id);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    simPropId === "thanawong"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50"
                  }`}
                >
                  <Palmtree className="w-4 h-4 text-emerald-600" />
                  <span className="truncate">ธนวงศ์ พูลวิลล่า</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                เลือกห้องพักทดสอบ
              </label>
              <select
                value={selectedSimRoom?.id || ""}
                onChange={(e) => setSimRoomId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white text-xs font-medium cursor-pointer"
              >
                {simRooms.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    ห้อง {rm.roomNumber} - {rm.name} (ราคาปกติ {formatCurrency(rm.pricePerNight)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                วันที่เข้าพักที่ต้องการทดสอบ
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={simDate}
                  onChange={(e) => setSimDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white text-xs font-bold cursor-pointer"
                />
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">
                {formatDateThai(simDate)}
              </span>
            </div>
          </div>

          {/* Right Output Card (7 cols) */}
          <div className="lg:col-span-7 bg-stone-50 dark:bg-[#0c1533] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                ผลการคำนวณราคา Dynamic Yield
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>จำลองการซิงค์ส่งราคา OTA</span>
              </span>
            </div>

            {/* Price Comparison Box */}
            <div className="grid grid-cols-2 gap-3 items-center bg-white dark:bg-[#101c42] p-4 rounded-xl border border-stone-200 dark:border-stone-800">
              <div>
                <span className="text-[11px] text-stone-400 block">ราคามาตรฐานเดิม (Base Rate)</span>
                <span className="text-base sm:text-lg font-bold text-stone-600 dark:text-stone-400 line-through">
                  {formatCurrency(selectedSimRoom?.pricePerNight || 0)}
                </span>
                <span className="text-[10px] text-stone-400 block">ต่อคืน</span>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block">
                  ราคาขายจริงหลังปรับ Yield (Dynamic Rate)
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white font-serif">
                  {formatCurrency(simulationResult.finalRate)}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                  {simulationResult.finalRate > (selectedSimRoom?.pricePerNight || 0)
                    ? `+${formatCurrency(simulationResult.finalRate - (selectedSimRoom?.pricePerNight || 0))} (ปรับขึ้นตามดีมานด์)`
                    : simulationResult.finalRate < (selectedSimRoom?.pricePerNight || 0)
                    ? `-${formatCurrency((selectedSimRoom?.pricePerNight || 0) - simulationResult.finalRate)} (ส่วนลดระบายห้อง)`
                    : "ราคาปกติ (ไม่มีกฎปรับราคา)"}
                </span>
              </div>
            </div>

            {/* Applied Rules Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                กฎที่ตรวจพบและมีผลกับวันที่ {formatDateThai(simDate)}:
              </span>

              {simulationResult.appliedRules.length === 0 ? (
                <div className="p-3 rounded-xl bg-white dark:bg-[#101c42] border border-stone-200 dark:border-stone-800 text-xs text-stone-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-stone-400" />
                  <span>ไม่มีกฎปรับราคาที่ตรงกับวันนี้ ระบบจะใช้ราคาห้องพักมาตรฐานปกติ</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {simulationResult.appliedRules.map((rule, idx) => {
                    const ruleDelta = simulationResult.breakdown[idx]?.amount || 0;
                    return (
                      <div
                        key={rule.id}
                        className="p-3 rounded-xl bg-white dark:bg-[#101c42] border border-amber-500/30 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {getRuleTypeBadge(rule.type)}
                            <span className="font-bold text-stone-900 dark:text-white">
                              {rule.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-500 block">
                            {rule.description}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`font-bold text-sm block ${
                            ruleDelta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"
                          }`}>
                            {ruleDelta >= 0 ? `+${formatCurrency(ruleDelta)}` : formatCurrency(ruleDelta)}
                          </span>
                          {rule.minStayNights && rule.minStayNights > 1 && (
                            <span className="text-[10px] text-amber-600 font-semibold block">
                              พักขั้นต่ำ {rule.minStayNights} คืน
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Channels Pushed Simulation Preview */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
              <span className="text-[11px] text-stone-400 block mb-2 font-medium">
                ช่องทางจำหน่ายที่จะได้รับราคานี้อัตโนมัติ:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {["Booking.com", "Agoda", "Airbnb", "Expedia"].map((ch) => (
                  <div key={ch} className="p-2 rounded-xl bg-white dark:bg-[#101c42] border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">{ch}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">ซิงค์พร้อม</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* RULES LIST & MANAGEMENT SECTION */}
      <div className="space-y-4">
        
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#101c42] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-stone-500 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>กรองรายการ:</span>
            </span>

            {/* Property Filter */}
            <select
              value={propFilter}
              onChange={(e) => setPropFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white text-xs font-bold cursor-pointer"
            >
              <option value="all">ทุกสาขาโรงแรม (All Properties)</option>
              <option value="bugaan">Bu-Gaan Sukhothai Village</option>
              <option value="thanawong">ธนวงศ์ พูลวิลล่า</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white text-xs font-bold cursor-pointer"
            >
              <option value="ALL">ทุกประเภทกฎ (All Types)</option>
              <option value="FESTIVAL">เทศกาลพิเศษ (Festival Peak)</option>
              <option value="DAY_OF_WEEK">วันในสัปดาห์ (Weekend)</option>
              <option value="OCCUPANCY">อัตราการจอง (Occupancy Yield)</option>
              <option value="LAST_MINUTE">Last-Minute Deal</option>
            </select>
          </div>

          <div className="text-xs text-stone-500 font-medium">
            แสดง {filteredRules.length} กฎ จากทั้งหมด {dynamicPricingRules.length} กฎ
          </div>
        </div>

        {/* Rules Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map((rule) => {
            const isLoyKrathong = rule.id === "rule-loy-krathong";

            return (
              <div
                key={rule.id}
                className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                  rule.isActive
                    ? isLoyKrathong
                      ? "bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-amber-950/20 dark:via-[#101c42] dark:to-amber-950/10 border-amber-500/40 shadow-md shadow-amber-500/5"
                      : "bg-white dark:bg-[#101c42] border-stone-200 dark:border-stone-800 shadow-xs"
                    : "bg-stone-50/70 dark:bg-slate-900/40 border-stone-200 dark:border-stone-800 opacity-60"
                }`}
              >
                <div className="space-y-3">
                  
                  {/* Top Badges & Active Toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {getRuleTypeBadge(rule.type)}
                      {rule.propertyId === "all" ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300">
                          ทุกโรงแรม
                        </span>
                      ) : rule.propertyId === "thanawong" ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          ธนวงศ์ พูลวิลล่า
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          บูก้าน สุโขทัย
                        </span>
                      )}
                    </div>

                    {/* Active / Inactive Switch */}
                    <button
                      type="button"
                      onClick={() => toggleDynamicPricingRule(rule.id, !rule.isActive)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                        rule.isActive ? "bg-emerald-600" : "bg-stone-300 dark:bg-slate-700"
                      }`}
                      title={rule.isActive ? "คลิกเพื่อปิดใช้งาน" : "คลิกเพื่อเปิดใช้งาน"}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          rule.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                      {rule.name}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                      {rule.description}
                    </p>
                  </div>

                  {/* Rule Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 dark:bg-[#0c1533] p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-medium">การปรับราคา</span>
                      <span className={`font-extrabold text-sm ${
                        rule.adjustmentValue >= 0 
                          ? "text-emerald-600 dark:text-emerald-400" 
                          : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {rule.adjustmentValue >= 0 ? `+${rule.adjustmentValue}` : rule.adjustmentValue}
                        {rule.adjustmentType === "PERCENT" ? "%" : " ฿"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 block font-medium">เงื่อนไขช่วงเวลา / ดีมานด์</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200 text-xs truncate block">
                        {rule.type === "FESTIVAL" || rule.type === "SEASONAL"
                          ? `${formatDateThai(rule.startDate || "")} - ${formatDateThai(rule.endDate || "")}`
                          : rule.type === "DAY_OF_WEEK"
                          ? "ทุกคืนวันศุกร์และเสาร์"
                          : rule.type === "OCCUPANCY"
                          ? `ยอดจองห้องพักเกิน ${rule.minOccupancyPercent}%`
                          : "จองวันเดียวกัน (Same-Day)"}
                      </span>
                    </div>

                    {rule.minStayNights && rule.minStayNights > 1 && (
                      <div className="col-span-2 pt-1 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          ข้อกำหนดการเข้าพัก:
                        </span>
                        <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                          พักขั้นต่ำ {rule.minStayNights} คืน
                        </span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-stone-100 dark:border-stone-800/80">
                  <span className="text-[10px] text-stone-400">
                    อัปเดต: {rule.updatedAt}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(rule)}
                      className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="แก้ไขกฎ"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`คุณต้องการลบกฎ "${rule.name}" หรือไม่?`)) {
                          deleteDynamicPricingRule(rule.id);
                        }
                      }}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="ลบกฎ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* MODAL: ADD / EDIT DYNAMIC PRICING RULE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#101c42] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <span>{editingRuleId ? "แก้ไขกฎปรับราคา Dynamic Pricing" : "เพิ่มกฎปรับราคาห้องพักอัตโนมัติ"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  ชื่อกฎปรับราคา (เช่น ประเพณีลอยกระทงสุโขทัย, วันหยุดสุดสัปดาห์)
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ระบุชื่อกฎ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    ประเภทกฎ
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as PricingRuleType })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white font-bold cursor-pointer"
                  >
                    <option value="FESTIVAL">เทศกาลพิเศษ / อีเวนต์ (Festival Peak)</option>
                    <option value="DAY_OF_WEEK">วันในสัปดาห์ (Day of Week / Weekend)</option>
                    <option value="OCCUPANCY">อัตราการจองห้องพัก (Occupancy Spike)</option>
                    <option value="LAST_MINUTE">Last-Minute Deal วันเดียวกัน</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    สาขาโรงแรมที่บังคับใช้
                  </label>
                  <select
                    value={form.propertyId}
                    onChange={(e) => setForm({ ...form, propertyId: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white font-bold cursor-pointer"
                  >
                    <option value="all">ทุกโรงแรม (ทั้ง 2 สาขา)</option>
                    <option value="bugaan">Bu-Gaan Sukhothai Village</option>
                    <option value="thanawong">ธนวงศ์ พูลวิลล่า</option>
                  </select>
                </div>
              </div>

              {/* Adjustments: Type and Value */}
              <div className="grid grid-cols-2 gap-3 bg-stone-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    รูปแบบการปรับราคา
                  </label>
                  <select
                    value={form.adjustmentType}
                    onChange={(e) => setForm({ ...form, adjustmentType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white font-bold cursor-pointer"
                  >
                    <option value="PERCENT">ปรับเป็นเปอร์เซ็นต์ (%)</option>
                    <option value="FIXED_AMOUNT">ปรับเป็นจำนวนเงินคงที่ (บาท ฿)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    อัตราปรับ (เช่น +50 สำหรับขึ้น 50%, -15 สำหรับลด 15%)
                  </label>
                  <input
                    type="number"
                    required
                    value={form.adjustmentValue}
                    onChange={(e) => setForm({ ...form, adjustmentValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Conditional inputs depending on rule type */}
              {(form.type === "FESTIVAL" || form.type === "SEASONAL") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      วันที่เริ่มต้น
                    </label>
                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      วันที่สิ้นสุด
                    </label>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {form.type === "OCCUPANCY" && (
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    อัตราการจองห้องพักขั้นต่ำที่เริ่มปรับราคา (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.minOccupancyPercent}
                    onChange={(e) => setForm({ ...form, minOccupancyPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white font-bold"
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    ตัวอย่าง: เมื่อโรงแรมถูกจองไปแล้วมากกว่า 70% ระบบจะปรับขึ้นอัตโนมัติ
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    เข้าพักขั้นต่ำ (จำนวนคืน)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={form.minStayNights}
                    onChange={(e) => setForm({ ...form, minStayNights: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white font-bold"
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    เช่น ลอยกระทง บังคับพักขั้นต่ำ 2 คืน
                  </span>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-slate-800">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      เปิดใช้งานกฎนี้ทันที
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  คำอธิบายเพิ่มเติม / บันทึกภายใน
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="รายละเอียดกฎหรือเหตุผลในการปรับราคา..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 font-semibold cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-md"
                >
                  {editingRuleId ? "บันทึกการแก้ไข" : "บันทึกกฎใหม่"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
