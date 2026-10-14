"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { BookingSource, PropertyId } from "@/types/pms";
import { formatCurrency, calculateNights } from "@/lib/utils";
import { 
  Building, 
  Palmtree, 
  User, 
  Phone, 
  Mail, 
  Bed, 
  CheckCircle,
  Calendar,
  Sparkles,
  AlertCircle,
  Briefcase,
  Filter,
  Check,
  QrCode,
  Camera,
  Layers,
  Users
} from "lucide-react";
import { PromptPayPaymentModal } from "@/components/PromptPayPaymentModal";

export function BookingFormView({ preselectedRoomId, onSuccess }: { preselectedRoomId?: string; onSuccess: () => void }) {
  const { rooms, bookings, addBooking, addMultipleBookings, activePropertyId } = usePMS();

  // Selected Property: default to activePropertyId or URL parameter
  const [propertyId, setPropertyId] = useState<PropertyId>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("property");
      if (p === "thanawong" || p === "bugaan") return p;
    }
    return activePropertyId === "thanawong" ? "thanawong" : "bugaan";
  });

  // Keep synchronized whenever activePropertyId changes
  React.useEffect(() => {
    if (activePropertyId === "thanawong" || activePropertyId === "bugaan") {
      setPropertyId(activePropertyId);
    }
  }, [activePropertyId]);

  // Dates: default to today (2026-10-12) to tomorrow (2026-10-13)
  const [checkInDate, setCheckInDate] = useState("2026-10-12");
  const [checkOutDate, setCheckOutDate] = useState("2026-10-13");
  const [estimatedTime, setEstimatedTime] = useState("14:00");

  // Filter option: show only available rooms (default true as requested) or all rooms
  const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean>(true);
  const [selectedRoomTypeFilter, setSelectedRoomTypeFilter] = useState<string>("ALL");

  // All rooms belonging to selected property
  const propertyRooms = React.useMemo(() => {
    return rooms.filter((r) => r.propertyId === propertyId);
  }, [rooms, propertyId]);

  // Compute availability for each room based on selected check-in and check-out dates
  const roomAvailabilityMap = React.useMemo(() => {
    const map: Record<string, { isAvailable: boolean; conflictReason?: string }> = {};
    const checkInTime = new Date(checkInDate + "T00:00:00").getTime();
    const checkOutTime = new Date(checkOutDate + "T00:00:00").getTime();

    propertyRooms.forEach((r) => {
      // Check maintenance status
      if (r.status === "MAINTENANCE") {
        map[r.id] = { isAvailable: false, conflictReason: "ปิดซ่อมบำรุง (Maintenance)" };
        return;
      }

      // Check if dates conflict with active bookings (CONFIRMED or CHECKED_IN)
      const conflictingBooking = bookings.find((b) => {
        if (b.roomId !== r.id || b.status === "CANCELLED" || b.status === "CHECKED_OUT") return false;
        const bStart = new Date(b.checkInDate + "T00:00:00").getTime();
        const bEnd = new Date(b.checkOutDate + "T00:00:00").getTime();
        // Overlap condition: start < existingEnd AND end > existingStart
        return checkInTime < bEnd && checkOutTime > bStart;
      });

      if (conflictingBooking) {
        map[r.id] = { 
          isAvailable: false, 
          conflictReason: `มีผู้เข้าพัก (${conflictingBooking.guestName} ${conflictingBooking.checkInDate} - ${conflictingBooking.checkOutDate})` 
        };
      } else {
        map[r.id] = { isAvailable: true };
      }
    });

    return map;
  }, [propertyRooms, bookings, checkInDate, checkOutDate]);

  // Filtered rooms to display
  const displayedRooms = React.useMemo(() => {
    return propertyRooms.filter((r) => {
      if (selectedRoomTypeFilter !== "ALL" && r.type !== selectedRoomTypeFilter) return false;
      if (showOnlyAvailable && !roomAvailabilityMap[r.id]?.isAvailable) return false;
      return true;
    });
  }, [propertyRooms, selectedRoomTypeFilter, showOnlyAvailable, roomAvailabilityMap]);

  // Multi-room selection state (supports 1 or more rooms under the same guest name)
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(() => {
    if (preselectedRoomId && propertyRooms.some(r => r.id === preselectedRoomId)) {
      return [preselectedRoomId];
    }
    const firstAvail = propertyRooms.find(r => roomAvailabilityMap[r.id]?.isAvailable);
    return firstAvail ? [firstAvail.id] : propertyRooms[0]?.id ? [propertyRooms[0].id] : [];
  });

  // Ensure selected rooms remain valid when dates or filters change
  React.useEffect(() => {
    // If no valid available rooms currently selected, auto-select the first available
    const hasAnyValid = selectedRoomIds.some(id => displayedRooms.some(r => r.id === id));
    if (!hasAnyValid && displayedRooms.length > 0) {
      const firstAvail = displayedRooms.find(r => roomAvailabilityMap[r.id]?.isAvailable);
      if (firstAvail) {
        setSelectedRoomIds([firstAvail.id]);
      } else if (displayedRooms[0]) {
        setSelectedRoomIds([displayedRooms[0].id]);
      }
    }
  }, [displayedRooms, selectedRoomIds, roomAvailabilityMap]);

  // Toggle room selection handler
  const handleToggleRoom = (rId: string) => {
    const isAvail = roomAvailabilityMap[rId]?.isAvailable;
    if (!isAvail) return;

    setSelectedRoomIds((prev) => {
      if (prev.includes(rId)) {
        // Only allow deselecting if more than 1 room is selected
        if (prev.length > 1) {
          return prev.filter(id => id !== rId);
        }
        return prev;
      } else {
        return [...prev, rId];
      }
    });
  };

  // Guest Details
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);

  // OTA / Source
  const [source, setSource] = useState<BookingSource>("Booking.com");

  // Extra Bed
  const [hasExtraBed, setHasExtraBed] = useState(false);
  const [extraBedCount, setExtraBedCount] = useState(1);
  const extraBedRate = propertyId === "thanawong" ? 800 : 600;

  // Meeting Room Session
  const [meetingSession, setMeetingSession] = useState<"morning" | "afternoon" | "full_day">("full_day");

  // Requests
  const [specialRequests, setSpecialRequests] = useState("");
  const [depositPaid, setDepositPaid] = useState<number>(0);
  const [depositSlip, setDepositSlip] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Selected Rooms Array
  const selectedRooms = React.useMemo(() => {
    return propertyRooms.filter(r => selectedRoomIds.includes(r.id));
  }, [propertyRooms, selectedRoomIds]);

  const nights = calculateNights(checkInDate, checkOutDate);
  const totalRoomRatePerNight = selectedRooms.reduce((sum, r) => sum + r.pricePerNight, 0);
  const roomTotal = totalRoomRatePerNight * nights;
  const extraBedTotal = hasExtraBed ? extraBedRate * extraBedCount * nights : 0;
  const grandTotal = roomTotal + extraBedTotal;

  // Unique Room Types for category pill filter
  const roomTypes = React.useMemo(() => {
    return Array.from(new Set(propertyRooms.map(r => r.type)));
  }, [propertyRooms]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRooms.length === 0) return;

    if (selectedRooms.length === 1) {
      const singleRoom = selectedRooms[0];
      addBooking({
        propertyId,
        roomId: singleRoom.id,
        roomNumber: singleRoom.roomNumber,
        guestName,
        companyName: companyName.trim() || undefined,
        guestPhone,
        guestEmail: guestEmail || "guest@booking.com",
        source,
        status: "CONFIRMED",
        checkInDate,
        checkOutDate,
        estimatedTime,
        adults: Number(adults),
        kids: Number(kids),
        hasExtraBed,
        extraBedCount: hasExtraBed ? Number(extraBedCount) : 0,
        extraBedRate,
        meetingSession: singleRoom.isMeetingRoom ? meetingSession : undefined,
        specialRequests,
        totalNights: nights,
        roomRate: singleRoom.pricePerNight,
        roomTotal: singleRoom.pricePerNight * nights,
        extraBedTotal,
        posChargesTotal: 0,
        grandTotal,
        depositPaid: Number(depositPaid) || 0,
        slipImage: depositSlip || undefined,
        paymentMethod: depositSlip ? "PROMPTPAY_QR" : undefined,
      });
    } else {
      // Multi-Room Booking with shared Group Booking ID and Color Tag
      const sharedGroupId = `GRP-${Date.now()}`;
      const sharedColorTag = "#3b82f6"; // Blue tag for group booking
      const totalDeposit = Number(depositPaid) || 0;

      const bookingsToAdd = selectedRooms.map((r, index) => {
        const thisRoomRate = r.pricePerNight;
        const thisRoomTotal = thisRoomRate * nights;
        const thisExtraBedTotal = index === 0 ? extraBedTotal : 0;
        const thisGrandTotal = thisRoomTotal + thisExtraBedTotal;
        const thisDeposit = index === 0 ? totalDeposit : 0;

        return {
          propertyId,
          roomId: r.id,
          roomNumber: r.roomNumber,
          guestName,
          companyName: companyName.trim() || `${guestName} (จอง ${selectedRooms.length} ห้อง)`,
          groupBookingId: sharedGroupId,
          colorTag: sharedColorTag,
          guestPhone,
          guestEmail: guestEmail || "guest@booking.com",
          source,
          status: "CONFIRMED" as const,
          checkInDate,
          checkOutDate,
          estimatedTime,
          adults: Math.max(1, Math.round(Number(adults) / selectedRooms.length)),
          kids: Math.round(Number(kids) / selectedRooms.length),
          hasExtraBed: index === 0 ? hasExtraBed : false,
          extraBedCount: index === 0 && hasExtraBed ? Number(extraBedCount) : 0,
          extraBedRate,
          meetingSession: r.isMeetingRoom ? meetingSession : undefined,
          specialRequests: specialRequests ? `[ห้อง ${r.roomNumber}] ${specialRequests}` : undefined,
          totalNights: nights,
          roomRate: thisRoomRate,
          roomTotal: thisRoomTotal,
          extraBedTotal: thisExtraBedTotal,
          posChargesTotal: 0,
          grandTotal: thisGrandTotal,
          depositPaid: thisDeposit,
          slipImage: index === 0 ? (depositSlip || undefined) : undefined,
          paymentMethod: depositSlip ? ("PROMPTPAY_QR" as const) : undefined,
        };
      });

      addMultipleBookings(bookingsToAdd);
    }

    setFormSubmitted(true);
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  const availableCount = propertyRooms.filter(r => roomAvailabilityMap[r.id]?.isAvailable).length;

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-[#101c42] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-xl">
      
      {/* Header */}
      <div className="pb-6 border-b border-stone-200 dark:border-stone-800">
        <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-white">
          แบบฟอร์มการจองห้องพัก (New Reservation)
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          เลือกระบุวันเข้าพักเพื่อตรวจสอบและเลือกเฉพาะห้องที่ว่าง (แถบสีเขียว) สะดวกรวดเร็ว
        </p>
      </div>

      {formSubmitted && (
        <div className="my-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm font-semibold">
            บันทึกการจองสำเร็จเรียบร้อย! กำลังพาคุณไปยังหน้าสถานะห้องพัก...
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        
        {/* Step 1: Hotel & Date & Available Rooms */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              1. เลือกวันที่และห้องพักที่ว่าง (Dates & Available Rooms)
            </h3>
            {activePropertyId === "all" && (
              <button
                type="button"
                onClick={() => {
                  const nextProp = propertyId === "bugaan" ? "thanawong" : "bugaan";
                  setPropertyId(nextProp);
                  const newRoom = rooms.find((r) => r.propertyId === nextProp);
                  if (newRoom) setSelectedRoomIds([newRoom.id]);
                }}
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold underline cursor-pointer"
              >
                สลับโรงแรม
              </button>
            )}
          </div>

          {/* Selected Hotel Display Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-amber-300/80 dark:border-amber-700/80 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent dark:from-amber-950/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-200 shadow-xs flex items-center justify-center p-0.5">
                <img 
                  src={propertyId === "bugaan" ? "/logos/bugaan-logo.jpg" : "/logos/thanawong-logo.jpg"} 
                  alt="Hotel Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-white truncate">
                    {propertyId === "bugaan" ? "Bu-Gaan Sukhothai Village" : "Thanawong Pool Villa"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 whitespace-nowrap shrink-0">
                    โรงแรมที่เลือก
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                  {propertyId === "bugaan" 
                    ? "บูกาน สุโขทัย วิลเลจ • สุโขทัย" 
                    : "ธนวงศ์ พูลวิลล่า • สุโขทัย"}
                </p>
              </div>
            </div>
            
            <div className="hidden sm:block text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ว่าง {availableCount} จาก {propertyRooms.length} ห้อง
              </span>
            </div>
          </div>

          {/* Date Picker Section - Prominently placed first */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                กำหนดวันที่เช็กอิน & เช็กเอาต์:
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-stone-500">จำนวนพัก:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30 whitespace-nowrap shrink-0">
                  {nights} คืน
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                  วันที่เช็กอิน (Check-in) *
                </label>
                <input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                  วันที่เช็กเอาต์ (Check-out) *
                </label>
                <input
                  type="date"
                  required
                  value={checkOutDate}
                  min={checkInDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick date presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-stone-500 text-[11px] whitespace-nowrap shrink-0">เลือกด่วน:</span>
              <button
                type="button"
                onClick={() => {
                  setCheckInDate("2026-10-12");
                  setCheckOutDate("2026-10-13");
                }}
                className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 hover:border-amber-400 text-stone-700 dark:text-stone-300 font-medium transition-colors whitespace-nowrap shrink-0"
              >
                วันนี้ 1 คืน (12-13 ต.ค.)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCheckInDate("2026-10-12");
                  setCheckOutDate("2026-10-14");
                }}
                className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 hover:border-amber-400 text-stone-700 dark:text-stone-300 font-medium transition-colors whitespace-nowrap shrink-0"
              >
                2 คืน (12-14 ต.ค.)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCheckInDate("2026-10-16");
                  setCheckOutDate("2026-10-18");
                }}
                className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 hover:border-amber-400 text-stone-700 dark:text-stone-300 font-medium transition-colors whitespace-nowrap shrink-0"
              >
                สุดสัปดาห์นี้ (16-18 ต.ค.)
              </button>
            </div>
          </div>

          {/* Room Selector Header & Availability Filter */}
          <div className="pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
              <div>
                <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  ตัวเลือกห้องพักว่าง (Available Rooms)
                </label>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  คลิกเลือกห้องสีเขียวด้านล่าง (สามารถคลิกเลือกมากกว่า 1 ห้องเพื่อจองพร้อมกันในชื่อเดียวกันได้)
                </p>
              </div>

              {/* Show only available checkbox toggle */}
              <label className="inline-flex items-center gap-2 cursor-pointer bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <input
                  type="checkbox"
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 accent-emerald-600"
                />
                <span>แสดงเฉพาะห้องว่าง (สีเขียว)</span>
              </label>
            </div>

            {/* Multi-Room Selection Live Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 flex flex-wrap items-center justify-between gap-2.5 mb-3">
              <div className="flex items-center gap-2 text-xs">
                <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-stone-900 dark:text-white">
                    เลือกจอง {selectedRooms.length} ห้อง:
                  </span>{" "}
                  <span className="font-black text-amber-700 dark:text-amber-300">
                    {selectedRooms.map((r) => `ห้อง ${r.roomNumber}`).join(", ")}
                  </span>
                  <span className="text-stone-500 dark:text-stone-400 text-[11px] block sm:inline sm:ml-2">
                    (ใช้ชื่อผู้จองเดียวกัน • คลิกการ์ดห้องอื่นเพื่อเลือกเพิ่ม)
                  </span>
                </div>
              </div>

              {selectedRooms.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedRoomIds([selectedRoomIds[0]])}
                  className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  รีเซ็ตเหลือ 1 ห้อง
                </button>
              )}
            </div>

            {/* Room Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 mb-3.5">
              <button
                type="button"
                onClick={() => setSelectedRoomTypeFilter("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedRoomTypeFilter === "ALL"
                    ? "bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 font-bold"
                    : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
                }`}
              >
                ทั้งหมด ({propertyRooms.length})
              </button>
              {roomTypes.map((t) => {
                const count = propertyRooms.filter(r => r.type === t).length;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedRoomTypeFilter(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedRoomTypeFilter === t
                        ? "bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 font-bold"
                        : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
                    }`}
                  >
                    {t} ({count})
                  </button>
                );
              })}
            </div>

            {/* Visual Green Room Cards Grid */}
            {displayedRooms.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
                <p className="font-bold text-sm">ไม่พบห้องว่างตามเงื่อนไขที่เลือกในช่วงวันที่ระบุ</p>
                <p className="text-xs text-rose-600/80 mt-1">
                  ลองเปลี่ยนวันที่เช็กอิน/เช็กเอาต์ หรือยกเลิกการติ๊ก &quot;แสดงเฉพาะห้องว่าง&quot; เพื่อดูห้องทั้งหมด
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {displayedRooms.map((r) => {
                  const availInfo = roomAvailabilityMap[r.id];
                  const isAvailable = availInfo?.isAvailable ?? false;
                  const isSelected = selectedRoomIds.includes(r.id);
                  const selectionIndex = selectedRoomIds.indexOf(r.id);

                  return (
                    <button
                      type="button"
                      key={r.id}
                      disabled={!isAvailable}
                      onClick={() => handleToggleRoom(r.id)}
                      className={`relative text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        !isAvailable
                          ? "border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-slate-900/40 opacity-50 cursor-not-allowed"
                          : isSelected
                          ? "border-emerald-600 bg-emerald-100/80 dark:bg-emerald-950/60 ring-2 ring-emerald-500 shadow-md shadow-emerald-600/20"
                          : "border-emerald-400/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-500 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-serif font-black text-base text-stone-900 dark:text-white">
                          ห้อง {r.roomNumber}
                        </span>
                        {isAvailable ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 ${
                            isSelected 
                              ? "bg-emerald-600 text-white shadow-xs" 
                              : "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                          }`}>
                            <Check className="w-3 h-3 shrink-0" />
                            {isSelected ? (selectedRoomIds.length > 1 ? `เลือกแล้ว (ห้องที่ ${selectionIndex + 1})` : "เลือกแล้ว") : "ว่าง (+ คลิกเลือก)"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 whitespace-nowrap shrink-0">
                            ไม่ว่าง
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-stone-700 dark:text-stone-300 truncate">
                        {r.name}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-2 pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
                        <span className="truncate">{r.type} • พัก {r.capacityAdults} ท่าน</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                          {formatCurrency(r.pricePerNight)}/คืน
                        </span>
                      </div>

                      {!isAvailable && availInfo?.conflictReason && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 truncate">
                          {availInfo.conflictReason}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Booking Source / OTA Selection */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              แหล่งที่มาการจอง (Booking Source / OTA) *
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as BookingSource)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <optgroup label="OTA & Online Travel Platforms">
                <option value="Booking.com">Booking.com</option>
                <option value="Agoda">Agoda</option>
                <option value="Expedia">Expedia</option>
                <option value="Airbnb">Airbnb</option>
                <option value="Trip.com">Trip.com</option>
              </optgroup>
              <optgroup label="Central Reservations & Direct Channel">
                <option value="CentralReservationsCalls">CentralReservationsCalls (โทรจองฝ่ายขายส่วนกลาง)</option>
                <option value="CentralReservationsEmail">CentralReservationsEmail (อีเมลจองส่วนกลาง)</option>
                <option value="DirectWebsitePrepay">DirectWebsitePrepay (หน้าเว็บโรงแรม - จ่ายล่วงหน้า)</option>
                <option value="DirectWebsitePostpay">DirectWebsitePostpay (หน้าเว็บโรงแรม - จ่ายวันเข้าพัก)</option>
              </optgroup>
              <optgroup label="Hotel Offline & Front Desk">
                <option value="HotelOfflinePrepay">HotelOfflinePrepay (ออฟไลน์ - โอนชำระครบแล้ว)</option>
                <option value="HotelOfflinePostpay">HotelOfflinePostpay (ออฟไลน์ - เก็บเงินวันเข้าพัก)</option>
                <option value="HotelWalk-in">HotelWalk-in (วอล์กอินหน้าฟรอนต์)</option>
                <option value="Facebook / LINE">Facebook / LINE Official</option>
                <option value="Direct Call">Direct Call (โทรหาโรงแรมโดยตรง)</option>
              </optgroup>
            </select>
          </div>

          {selectedRooms.some(r => r.isMeetingRoom) && (
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">
                ช่วงเวลาการใช้งานห้องประชุม (Meeting Session)
              </label>
              <div className="flex gap-2">
                {(
                  [
                    { id: "morning", label: "ครึ่งวันเช้า (08:30 - 12:00)" },
                    { id: "afternoon", label: "ครึ่งวันบ่าย (13:00 - 17:00)" },
                    { id: "full_day", label: "ทั้งวัน (08:30 - 17:00)" },
                  ] as const
                ).map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setMeetingSession(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      meetingSession === s.id
                        ? "bg-purple-600 text-white"
                        : "bg-white dark:bg-slate-800 text-stone-600 dark:text-stone-300"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Guest Details */}
        <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-600" />
              2. ข้อมูลผู้เข้าพัก (Guest Details)
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              วันที่พัก: <strong className="text-stone-800 dark:text-stone-200">{checkInDate} ถึง {checkOutDate} ({nights} คืน)</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                ชื่อ - นามสกุล ผู้เข้าพัก / ผู้จองหลัก *
                {selectedRooms.length > 1 && (
                  <span className="text-amber-600 dark:text-amber-400 font-bold ml-1.5">
                    (ใช้ชื่อนี้สำหรับจองทั้ง {selectedRooms.length} ห้อง)
                  </span>
                )}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="เช่น คุณกฤษฎา บุญส่ง"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                ชื่อบริษัท / คณะ / กรุ๊ป (Company / Corporate Group)
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="เช่น บริษัท มิตรแท้ จำกัด / กรุ๊ปสัมมนา"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                เบอร์โทรศัพท์ *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="08X-XXX-XXXX"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                อีเมล (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                ผู้ใหญ่ (Adults)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                เด็ก (Kids)
              </label>
              <input
                type="number"
                min="0"
                max="6"
                value={kids}
                onChange={(e) => setKids(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Extra Bed & Add-ons */}
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bed className="w-5 h-5 text-amber-600" />
              <div>
                <span className="font-bold text-sm text-stone-900 dark:text-white">
                  ตัวเลือกเตียงเสริม (Extra Bed)
                </span>
                <p className="text-xs text-stone-500">
                  อัตราค่าบริการ {formatCurrency(extraBedRate)} / เตียง / คืน
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasExtraBed}
                onChange={(e) => setHasExtraBed(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {hasExtraBed && (
            <div className="pt-2 flex items-center justify-between border-t border-amber-200/50">
              <span className="text-xs text-stone-700 dark:text-stone-300 font-medium">จำนวนเตียงเสริม:</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setExtraBedCount(count)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      extraBedCount === count
                        ? "bg-amber-600 text-white"
                        : "bg-white dark:bg-slate-800 text-stone-700 dark:text-stone-300"
                    }`}
                  >
                    {count} เตียง
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Special Request & Deposit */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              คำขอพิเศษ (Special Requests)
            </label>
            <textarea
              rows={2}
              placeholder="เช่น ขอห้องชั้น 1, มีสัตว์เลี้ยงขนาดเล็ก, เซ็ตฮันนีมูน..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  ยอดมัดจำที่ชำระแล้ว (Deposit Paid THB)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (depositPaid === 0 && grandTotal > 0) {
                      setDepositPaid(Math.round(grandTotal / 2));
                    }
                    setIsQrModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>สแกน QR จ่ายมัดจำ</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  value={depositPaid}
                  onChange={(e) => setDepositPaid(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {depositSlip && (
                <div className="mt-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold truncate">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">แนบสลิปมัดจำแล้ว ({formatCurrency(depositPaid)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(true)}
                    className="text-[11px] text-blue-600 font-bold hover:underline shrink-0"
                  >
                    ดู/ถ่ายใหม่
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                เวลาคาดว่าจะถึง (Estimated Arrival)
              </label>
              <input
                type="time"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Pricing Summary Box */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200 dark:border-stone-700 space-y-2 text-sm">
          <div className="space-y-1">
            {selectedRooms.map((r) => (
              <div key={r.id} className="flex justify-between text-stone-600 dark:text-stone-300 text-xs">
                <span>
                  ค่าห้อง {r.roomNumber} ({r.name}) - {formatCurrency(r.pricePerNight)} × {nights} คืน
                </span>
                <span className="font-medium text-stone-900 dark:text-stone-200">
                  {formatCurrency(r.pricePerNight * nights)}
                </span>
              </div>
            ))}
          </div>

          {hasExtraBed && (
            <div className="flex justify-between text-stone-600 dark:text-stone-300 text-xs pt-1 border-t border-stone-200/50">
              <span>เตียงเสริม ({formatCurrency(extraBedRate)} × {extraBedCount} เตียง × {nights} คืน)</span>
              <span>{formatCurrency(extraBedTotal)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between items-baseline font-bold">
            <span className="text-stone-900 dark:text-white">
              ยอดรวมทั้งสิ้น {selectedRooms.length > 1 ? `(${selectedRooms.length} ห้อง)` : ""} (Grand Total)
            </span>
            <span className="text-xl text-amber-600 dark:text-amber-400 font-serif">
              {formatCurrency(grandTotal)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-stone-500">
            <span>มัดจำ: {formatCurrency(depositPaid)}</span>
            <span className="font-semibold text-rose-600">ยอดคงเหลือชำระวันเช็คอิน: {formatCurrency(grandTotal - depositPaid)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:opacity-95 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/25 transition-all text-sm sm:text-base min-h-[48px]"
        >
          {selectedRooms.length > 1 
            ? `ยืนยันการบันทึกการจอง (${selectedRooms.length} ห้องพร้อมกันในชื่อ ${guestName || "ผู้จอง"})` 
            : "ยืนยันการบันทึกการจอง (Create Reservation)"}
        </button>

      </form>

      {/* PromptPay QR & Slip Verification Modal for Deposit */}
      <PromptPayPaymentModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        amount={depositPaid > 0 ? depositPaid : Math.round(grandTotal / 2) || 1000}
        title={`ชำระเงินมัดจำผ่าน PromptPay (${propertyId === "thanawong" ? "Thanawong" : "Bu-Gaan"} • ${selectedRooms.length} ห้อง)`}
        roomNumber={selectedRooms.map((r) => r.roomNumber).join(", ")}
        guestName={guestName}
        propertyId={propertyId}
        onPaymentSuccess={(slipUrl) => {
          if (slipUrl) {
            setDepositSlip(slipUrl);
          }
          if (depositPaid === 0) {
            setDepositPaid(Math.round(grandTotal / 2) || 1000);
          }
        }}
      />

    </div>
  );
}
