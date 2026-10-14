"use client";

import React, { useState, useMemo } from "react";
import { usePMS } from "@/context/PMSContext";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Minus, 
  ExternalLink,
  ShieldAlert,
  ArrowLeft
} from "lucide-react";
import { PropertyId } from "@/types/pms";

export function RoomAvailabilityManager() {
  const { 
    activePropertyId, 
    properties, 
    rooms, 
    bookings, 
    roomBlocks, 
    toggleDateBlock, 
    toggleRoomTypeBlock, 
    setRoomTypeAvailableCount 
  } = usePMS();

  // Current selected property (default to activePropertyId if not "all", else first property)
  const currentPropertyId: PropertyId = activePropertyId === "all" ? "bugaan" : activePropertyId;
  const currentProperty = properties.find((p) => p.id === currentPropertyId) || properties[0];

  // Selected Month/Year State (Default to current reference October 2026)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 0-indexed: 9 = October
  const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>(null); // e.g. "2026-10-12"
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

  // Month names in Thai
  const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const THAI_MONTHS_SHORT = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];

  // Filter rooms belonging to current property
  const propertyRooms = useMemo(() => {
    return rooms.filter((r) => r.propertyId === currentPropertyId);
  }, [rooms, currentPropertyId]);

  // Group rooms by room type
  const roomTypes = useMemo(() => {
    const map = new Map<string, { type: string; totalRooms: number; minPrice: number; sampleRoom: typeof propertyRooms[0] }>();
    propertyRooms.forEach((r) => {
      const typeKey = r.type || "Standard Room";
      const existing = map.get(typeKey);
      if (existing) {
        existing.totalRooms += 1;
        existing.minPrice = Math.min(existing.minPrice, r.pricePerNight);
      } else {
        map.set(typeKey, {
          type: typeKey,
          totalRooms: 1,
          minPrice: r.pricePerNight,
          sampleRoom: r,
        });
      }
    });
    return Array.from(map.values());
  }, [propertyRooms]);

  // Total rooms in property
  const totalPropertyRooms = propertyRooms.length;

  // Generate days for the selected month
  const daysInMonth = useMemo(() => {
    const days: string[] = [];
    const date = new Date(selectedYear, selectedMonth, 1);
    while (date.getMonth() === selectedMonth) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      days.push(`${y}-${m}-${d}`);
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedYear, selectedMonth]);

  // Compute daily stats for a specific date
  const getDayStats = (dateStr: string) => {
    // Check master block for this date
    const masterBlock = roomBlocks.find(
      (b) => b.propertyId === currentPropertyId && b.date === dateStr && b.targetType === "ALL"
    );
    const isMasterClosed = masterBlock?.isClosed || false;

    // Bookings overlapping with dateStr
    // Booking overlaps if checkInDate <= dateStr and checkOutDate > dateStr
    const activeBookings = bookings.filter((b) => {
      if (b.propertyId !== currentPropertyId) return false;
      if (b.status === "CANCELLED") return false;
      return b.checkInDate <= dateStr && b.checkOutDate > dateStr;
    });

    const bookedCount = activeBookings.length;

    // Check room type blocks
    let blockedRoomsCount = 0;
    if (isMasterClosed) {
      blockedRoomsCount = totalPropertyRooms;
    } else {
      roomTypes.forEach((rt) => {
        const typeBlock = roomBlocks.find(
          (b) => b.propertyId === currentPropertyId && b.date === dateStr && b.targetType === "ROOM_TYPE" && b.roomType === rt.type
        );
        if (typeBlock?.isClosed) {
          blockedRoomsCount += rt.totalRooms;
        }
      });
    }

    const availableCount = isMasterClosed 
      ? 0 
      : Math.max(0, totalPropertyRooms - bookedCount - blockedRoomsCount);

    const noAvailabilityCount = (availableCount === 0 && !isMasterClosed) ? totalPropertyRooms : 0;

    return {
      isMasterClosed,
      totalRooms: totalPropertyRooms,
      availableCount,
      bookedCount,
      blockedRoomsCount,
      noAvailabilityCount,
    };
  };

  // Compute stats for a specific Room Type on a specific date
  const getRoomTypeStats = (dateStr: string, roomType: string, totalOfType: number) => {
    const masterBlock = roomBlocks.find(
      (b) => b.propertyId === currentPropertyId && b.date === dateStr && b.targetType === "ALL"
    );
    const isMasterClosed = masterBlock?.isClosed || false;

    const typeBlock = roomBlocks.find(
      (b) => b.propertyId === currentPropertyId && b.date === dateStr && b.targetType === "ROOM_TYPE" && b.roomType === roomType
    );
    const isTypeClosed = isMasterClosed || (typeBlock?.isClosed || false);

    // Bookings for this room type
    const bookedOfType = bookings.filter((b) => {
      if (b.propertyId !== currentPropertyId) return false;
      if (b.status === "CANCELLED") return false;
      if (b.checkInDate <= dateStr && b.checkOutDate > dateStr) {
        // match room's roomType
        const r = rooms.find((rm) => rm.roomNumber === b.roomNumber && rm.propertyId === currentPropertyId);
        return r?.type === roomType;
      }
      return false;
    }).length;

    let available = totalOfType - bookedOfType;
    if (isTypeClosed) {
      available = 0;
    } else if (typeBlock?.availableOverride !== undefined) {
      available = Math.min(totalOfType, Math.max(0, typeBlock.availableOverride));
    } else {
      available = Math.max(0, available);
    }

    return {
      isClosed: isTypeClosed,
      totalOfType,
      bookedOfType,
      available,
      availableOverride: typeBlock?.availableOverride,
    };
  };

  // Format date header like "12 ตุลาคม 2026"
  const formatDateHeading = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dayNum = d;
    const monthName = THAI_MONTHS[m - 1];
    return `${dayNum} ${monthName} ${y}`;
  };

  // Check if date is today (relative to 2026-10-12)
  const isToday = (dateStr: string) => dateStr === "2026-10-12";

  // Navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* If Day Detail is open, show Screenshot 2 layout */}
      {selectedDayDetail ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden animate-fadeIn">
          {/* Header Bar matching Orange design */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-4 sm:p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all text-white"
                title="ย้อนกลับ"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-serif leading-tight">
                  {formatDateHeading(selectedDayDetail)}
                </h2>
                <div className="text-xs text-amber-100 flex items-center gap-2 mt-0.5">
                  <span>{currentProperty.name}</span>
                  {isToday(selectedDayDetail) && (
                    <span className="bg-amber-800/60 text-amber-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      วันนี้
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-all text-white flex items-center gap-1.5"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>มุมมองทั้งเดือน</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 bg-stone-50/60 dark:bg-[#0a0f1d]/50">
            {/* Master Card: ทุกห้อง (All Rooms) */}
            {(() => {
              const dayStat = getDayStats(selectedDayDetail);
              const occPercent = totalPropertyRooms > 0 
                ? Math.round((dayStat.bookedCount / totalPropertyRooms) * 100) 
                : 0;

              return (
                <div className="bg-white dark:bg-[#101c42] rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-xs transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
                      <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white">
                        ทุกห้อง (Master All Rooms)
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                        {dayStat.isMasterClosed ? "ปิดการขายทั้งโรงแรม (Closed)" : "เปิดการขายปกติ (Open)"}
                      </span>
                      <button
                        onClick={() => toggleDateBlock(currentPropertyId, selectedDayDetail, !dayStat.isMasterClosed)}
                        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          !dayStat.isMasterClosed ? "bg-emerald-600" : "bg-stone-300 dark:bg-stone-700"
                        }`}
                        aria-pressed={!dayStat.isMasterClosed}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            !dayStat.isMasterClosed ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3">
                      <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        มีห้องว่างพร้อมขาย
                      </div>
                      <div className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
                        {dayStat.availableCount} <span className="text-xs font-normal text-emerald-600">ห้อง</span>
                      </div>
                    </div>

                    <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl p-3">
                      <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                        ขายห้องแล้ว (Booked)
                      </div>
                      <div className="text-xl font-black text-rose-900 dark:text-rose-200 mt-1">
                        {dayStat.bookedCount} <span className="text-xs font-normal text-rose-600">ห้อง</span>
                      </div>
                    </div>

                    <div className="bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3">
                      <div className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                        ปิดการขายห้อง (Stop Sell)
                      </div>
                      <div className="text-xl font-black text-stone-800 dark:text-stone-200 mt-1">
                        {dayStat.blockedRoomsCount} <span className="text-xs font-normal text-stone-500">ห้อง</span>
                      </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
                      <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        อัตราการเข้าพัก (Occupancy)
                      </div>
                      <div className="text-xl font-black text-amber-900 dark:text-amber-200 mt-1">
                        {occPercent}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Individual Room Type Cards (matching Screenshot 2 layout) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  ประเภทห้องพัก ({roomTypes.length} ประเภท)
                </h4>
                <span className="text-xs text-stone-400">
                  คลิกสวิตช์เพื่อ Stop Sell หรือกด +/- เพื่อจำกัดโควต้าห้องว่าง
                </span>
              </div>

              {roomTypes.map((rt) => {
                const typeStat = getRoomTypeStats(selectedDayDetail, rt.type, rt.totalRooms);

                return (
                  <div
                    key={rt.type}
                    className={`bg-white dark:bg-[#101c42] rounded-2xl border transition-all p-4 sm:p-5 shadow-xs ${
                      typeStat.isClosed 
                        ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10" 
                        : "border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                            {rt.type}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300">
                            ทั้งหมด {rt.totalRooms} ห้อง
                          </span>
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          {propertyRooms.filter((r) => r.type === rt.type).map((r) => r.roomNumber).join(", ")}
                        </div>
                      </div>

                      {/* Right Toggle Switch */}
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${typeStat.isClosed ? "text-rose-600" : "text-emerald-600"}`}>
                          {typeStat.isClosed ? "ปิดการขาย (Closed)" : "เปิดการขาย (Open)"}
                        </span>
                        <button
                          onClick={() => toggleRoomTypeBlock(currentPropertyId, selectedDayDetail, rt.type, !typeStat.isClosed)}
                          className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            !typeStat.isClosed ? "bg-emerald-600" : "bg-stone-300 dark:bg-stone-700"
                          }`}
                          aria-pressed={!typeStat.isClosed}
                        >
                          <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              !typeStat.isClosed ? "translate-x-6" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Stepper & Breakdown matching Screenshot 2 */}
                    <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Availability Stepper */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                          จำนวนห้องว่าง:
                        </span>
                        <div className="flex items-center bg-stone-100 dark:bg-slate-800 rounded-xl p-1 border border-stone-200 dark:border-stone-700">
                          <button
                            onClick={() => {
                              const newCount = Math.max(0, typeStat.available - 1);
                              setRoomTypeAvailableCount(currentPropertyId, selectedDayDetail, rt.type, newCount);
                            }}
                            disabled={typeStat.isClosed || typeStat.available <= 0}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-stone-200 disabled:opacity-40 transition-all shadow-xs"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="px-3 min-w-[56px] text-center font-bold text-sm text-stone-900 dark:text-white">
                            {typeStat.available} / {rt.totalRooms}
                          </div>
                          <button
                            onClick={() => {
                              const newCount = Math.min(rt.totalRooms, typeStat.available + 1);
                              setRoomTypeAvailableCount(currentPropertyId, selectedDayDetail, rt.type, newCount);
                            }}
                            disabled={typeStat.isClosed || typeStat.available >= rt.totalRooms}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-stone-200 disabled:opacity-40 transition-all shadow-xs"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Status Pills */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {typeStat.bookedOfType > 0 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900 whitespace-nowrap shrink-0">
                            ขายห้องแล้ว: {typeStat.bookedOfType} ห้อง
                          </span>
                        )}
                        {typeStat.isClosed ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-stone-300 font-semibold whitespace-nowrap shrink-0">
                            ปิดการขายห้อง: {rt.totalRooms} ห้อง
                          </span>
                        ) : typeStat.available === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900 whitespace-nowrap shrink-0">
                            ไม่มีห้องว่าง: 0 ห้อง
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-900 whitespace-nowrap shrink-0">
                            เปิดขายว่าง: {typeStat.available} ห้อง
                          </span>
                        )}
                      </div>

                      {/* Right: Rate Display matching Screenshot 2 "BAR incl tax: ฿X.00 THB" */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-stone-800">
                        <div className="text-right">
                          <div className="text-[11px] text-stone-400 font-medium">BAR incl tax</div>
                          <div className="font-serif font-black text-base text-amber-700 dark:text-amber-400">
                            ฿{rt.minPrice.toLocaleString("th-TH")}.00 <span className="text-[10px] text-stone-400">THB</span>
                          </div>
                        </div>

                        <button 
                          className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-amber-600 text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-all flex items-center gap-1"
                        >
                          <span>SEE RATES</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Overview Screen (Screenshot 1: Monthly/Daily Overview List) */
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          {/* Header Bar matching Orange design */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif leading-tight">
                  จำนวนห้องว่าง (Room Availability & Stop Sell)
                </h2>
                <div className="text-xs sm:text-sm text-amber-100 mt-1 flex items-center gap-2">
                  <span>{currentProperty.name}</span>
                  <span>•</span>
                  <span>รวมห้องพัก {totalPropertyRooms} ห้อง</span>
                </div>
              </div>

              {/* Month Picker Controls */}
              <div className="flex items-center gap-2 bg-black/15 backdrop-blur-xs p-1.5 rounded-2xl self-start sm:self-auto">
                <button
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 py-1 font-bold text-sm sm:text-base text-white min-w-[100px] text-center">
                  {THAI_MONTHS_SHORT[selectedMonth]} {selectedYear}
                </div>

                <button
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Calendar picker popup button */}
                <button
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="ml-1 px-3 py-1.5 rounded-xl bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-700" />
                  <span>เลือกวันที่</span>
                </button>
              </div>
            </div>

            {/* Date Picker Selector Drawer */}
            {isDatePickerOpen && (
              <div className="mt-4 p-3 bg-white dark:bg-[#101c42] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl text-stone-900 dark:text-white flex flex-wrap gap-2 animate-fadeIn">
                <div className="w-full text-xs font-bold text-stone-500 mb-1 flex items-center justify-between">
                  <span>เลือกเดือนที่ต้องการดู:</span>
                  <button 
                    onClick={() => setIsDatePickerOpen(false)}
                    className="text-stone-400 hover:text-stone-600 text-xs"
                  >
                    ปิด [×]
                  </button>
                </div>
                {THAI_MONTHS_SHORT.map((mShort, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedMonth(idx);
                      setIsDatePickerOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedMonth === idx 
                        ? "bg-amber-600 text-white" 
                        : "bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100"
                    }`}
                  >
                    {mShort} {selectedYear}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Daily List matching Screenshot 1 */}
          <div className="divide-y divide-stone-100 dark:divide-stone-800/80 bg-white dark:bg-[#0f172a]">
            {daysInMonth.map((dayStr) => {
              const stats = getDayStats(dayStr);
              const isDayToday = isToday(dayStr);

              return (
                <div
                  key={dayStr}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all ${
                    isDayToday ? "bg-amber-50/70 dark:bg-amber-950/30" : ""
                  }`}
                >
                  {/* Left: Date & Sub-stats */}
                  <div 
                    onClick={() => setSelectedDayDetail(dayStr)}
                    className="cursor-pointer flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white group-hover:text-amber-600">
                        {formatDateHeading(dayStr)}
                      </span>
                      {isDayToday && (
                        <span className="bg-amber-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap shrink-0">
                          วันนี้
                        </span>
                      )}
                      <span className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium ml-1 whitespace-nowrap shrink-0">
                        <span>ดูแยกตามห้อง</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Stats pills matching screenshot */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-stone-600 dark:text-stone-300">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>มีห้องว่าง:</span>
                        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                          {stats.availableCount}
                        </strong>
                      </span>
                      <span className="text-stone-300 dark:text-stone-700">•</span>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span>ขายแล้ว:</span>
                        <strong className="text-rose-700 dark:text-rose-400 font-bold">
                          {stats.bookedCount}
                        </strong>
                      </span>
                      <span className="text-stone-300 dark:text-stone-700">•</span>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                        <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                        <span>ปิด:</span>
                        <strong className="text-stone-700 dark:text-stone-300 font-bold">
                          {stats.blockedRoomsCount}
                        </strong>
                      </span>
                      <span className="text-stone-300 dark:text-stone-700">•</span>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>ไม่มีห้องว่าง:</span>
                        <strong className="text-amber-700 dark:text-amber-400 font-bold">
                          {stats.noAvailabilityCount}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Right: Master Toggle Switch for this day */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                    <span className={`text-xs font-bold ${stats.isMasterClosed ? "text-rose-600" : "text-emerald-600"}`}>
                      {stats.isMasterClosed ? "ปิดการขายทุกห้อง" : "เปิดการขายปกติ"}
                    </span>
                    <button
                      onClick={() => toggleDateBlock(currentPropertyId, dayStr, !stats.isMasterClosed)}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        !stats.isMasterClosed ? "bg-emerald-600" : "bg-stone-300 dark:bg-stone-700"
                      }`}
                      aria-pressed={!stats.isMasterClosed}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          !stats.isMasterClosed ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
