"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { Room, RoomStatus, isUserAdminOrGM } from "@/types/pms";
import { formatCurrency } from "@/lib/utils";
import { OtaLogo } from "@/components/OtaLogo";
import { SignaturePad } from "@/components/SignaturePad";
import { 
  CheckCircle2, 
  Users, 
  Sparkles, 
  Wrench, 
  Plus, 
  DoorOpen, 
  Check, 
  Clock, 
  Zap, 
  Building, 
  Palmtree, 
  CalendarCheck, 
  CreditCard, 
  Phone, 
  Mail, 
  Calendar, 
  AlertCircle, 
  X, 
  Camera, 
  Upload, 
  Eye, 
  Trash2, 
  PenLine,
  BedDouble,
  ShieldCheck,
  FileCheck2
} from "lucide-react";
import { compressImageWithPdpaWatermark } from "@/lib/pdpaWatermark";

export function DashboardView({ 
  onGoToBooking, 
  onGoToFolio,
  onGoToAdminRooms 
}: { 
  onGoToBooking: (roomId?: string) => void; 
  onGoToFolio?: (bookingId?: string) => void; 
  onGoToAdminRooms?: () => void;
}) {
  const { 
    filteredRooms, 
    filteredBookings, 
    updateRoomStatus, 
    quickWalkIn, 
    checkInBooking, 
    checkOutBooking,
    currentUser,
    activePropertyId,
    requireCheckInDocuments
  } = usePMS();
  const [selectedFilter, setSelectedFilter] = useState<RoomStatus | "ALL" | "AWAITING_CHECKIN">("ALL");
  const [quickWalkInModalRoom, setQuickWalkInModalRoom] = useState<Room | null>(null);
  const [walkInGuestName, setWalkInGuestName] = useState("");
  const [walkInGuestPhone, setWalkInGuestPhone] = useState("");
  const [walkInNights, setWalkInNights] = useState(1);

  // Walk-in ID Document & Signature States
  const [walkInIdCardImage, setWalkInIdCardImage] = useState<string | null>(null);
  const [walkInSignatureImage, setWalkInSignatureImage] = useState<string | null>(null);
  const [isUploadingWalkInIdCard, setIsUploadingWalkInIdCard] = useState(false);
  const walkInCameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const walkInFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // OTA Incoming / Pending Check-in Detail Modal State
  const [selectedOtaBookingForCheckIn, setSelectedOtaBookingForCheckIn] = useState<any | null>(null);

  // Check-in ID Card and Guest Signature States
  const [checkInIdCardImage, setCheckInIdCardImage] = useState<string | null>(null);
  const [checkInSignatureImage, setCheckInSignatureImage] = useState<string | null>(null);
  const [isUploadingIdCard, setIsUploadingIdCard] = useState(false);
  const [viewingIdCardImage, setViewingIdCardImage] = useState<string | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync ID card & signature when selected booking changes
  React.useEffect(() => {
    if (selectedOtaBookingForCheckIn) {
      setCheckInIdCardImage(selectedOtaBookingForCheckIn.guestIdCardImage || null);
      setCheckInSignatureImage(selectedOtaBookingForCheckIn.guestSignatureImage || null);
    } else {
      setCheckInIdCardImage(null);
      setCheckInSignatureImage(null);
    }
  }, [selectedOtaBookingForCheckIn]);

  const handleIdCardFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingIdCard(true);
      const hotelTitle = selectedOtaBookingForCheckIn?.propertyId === "thanawong"
        ? "ธาราวงศ์ พูลวิลล่า รีสอร์ท"
        : "Bu-Gaan Sukhothai Resort";
      const compressed = await compressImageWithPdpaWatermark(
        file,
        hotelTitle,
        selectedOtaBookingForCheckIn?.bookingNumber
      );
      setCheckInIdCardImage(compressed);
    } catch (err) {
      console.error("Error compressing ID card image:", err);
    } finally {
      setIsUploadingIdCard(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleWalkInIdCardChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingWalkInIdCard(true);
      const hotelTitle = quickWalkInModalRoom?.propertyId === "thanawong"
        ? "ธาราวงศ์ พูลวิลล่า รีสอร์ท"
        : "Bu-Gaan Sukhothai Resort";
      const compressed = await compressImageWithPdpaWatermark(
        file,
        hotelTitle,
        quickWalkInModalRoom ? `WI-${quickWalkInModalRoom.roomNumber}` : undefined
      );
      setWalkInIdCardImage(compressed);
    } catch (err) {
      console.error("Error compressing walk-in ID card:", err);
    } finally {
      setIsUploadingWalkInIdCard(false);
      if (e.target) e.target.value = "";
    }
  };

  // Status Counts
  const availableCount = filteredRooms.filter((r) => r.status === "AVAILABLE").length;
  const occupiedCount = filteredRooms.filter((r) => r.status === "OCCUPIED").length;
  const cleaningCount = filteredRooms.filter((r) => r.status === "CLEANING").length;
  const maintenanceCount = filteredRooms.filter((r) => r.status === "MAINTENANCE").length;

  // Awaiting Check-in: Rooms with confirmed bookings waiting for check-in
  const awaitingCheckinRooms = filteredRooms.filter((r) => {
    return filteredBookings.some(
      (b) => (b.roomId === r.id || b.roomNumber === r.roomNumber) && b.status === "CONFIRMED"
    );
  });
  const awaitingCheckinCount = awaitingCheckinRooms.length;

  const displayRooms = selectedFilter === "ALL" 
    ? filteredRooms 
    : selectedFilter === "AWAITING_CHECKIN"
    ? awaitingCheckinRooms
    : filteredRooms.filter((r) => r.status === selectedFilter);

  const handleOpenWalkIn = (room: Room) => {
    setQuickWalkInModalRoom(room);
    setWalkInGuestName("");
    setWalkInGuestPhone("");
    setWalkInNights(1);
    setWalkInIdCardImage(null);
    setWalkInSignatureImage(null);
  };

  const handleConfirmWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickWalkInModalRoom) return;
    quickWalkIn(
      quickWalkInModalRoom.id, 
      walkInGuestName, 
      walkInGuestPhone, 
      Number(walkInNights),
      {
        guestIdCardImage: walkInIdCardImage || undefined,
        guestSignatureImage: walkInSignatureImage || undefined,
      }
    );
    setQuickWalkInModalRoom(null);
  };

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case "AVAILABLE":
        return {
          label: "ห้องว่าง (Available)",
          bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
          dot: "bg-emerald-500",
        };
      case "OCCUPIED":
        return {
          label: "มีผู้พัก (Occupied)",
          bg: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
          dot: "bg-rose-500",
        };
      case "CLEANING":
        return {
          label: "ทำความสะอาด (Cleaning)",
          bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
          dot: "bg-amber-500",
        };
      case "MAINTENANCE":
        return {
          label: "ปิดปรับปรุง (Maintenance)",
          bg: "bg-stone-500/10 text-stone-700 dark:text-stone-400 border-stone-500/30",
          dot: "bg-stone-500",
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Available Card */}
        <div 
          onClick={() => setSelectedFilter(selectedFilter === "AVAILABLE" ? "ALL" : "AVAILABLE")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedFilter === "AVAILABLE"
              ? "ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500"
              : "bg-white dark:bg-[#101c42] border-stone-200/80 dark:border-stone-800 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">ห้องว่างพร้อมขาย</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-white">
              {availableCount}
            </span>
            <span className="text-xs text-stone-400">ห้อง</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            เปิดจอง Quick Walk-in ได้ทันที
          </div>
        </div>

        {/* Awaiting Check-in Card */}
        <div 
          onClick={() => setSelectedFilter(selectedFilter === "AWAITING_CHECKIN" ? "ALL" : "AWAITING_CHECKIN")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedFilter === "AWAITING_CHECKIN"
              ? "ring-2 ring-blue-500 bg-blue-500/10 border-blue-500"
              : "bg-white dark:bg-[#101c42] border-stone-200/80 dark:border-stone-800 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">รอเช็กอิน (OTA/ตรง)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-white">
              {awaitingCheckinCount}
            </span>
            <span className="text-xs text-stone-400">ห้อง</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            มีบุ๊กกิ้ง รอผู้เข้าพักเช็กอิน
          </div>
        </div>

        {/* Occupied Card */}
        <div 
          onClick={() => setSelectedFilter(selectedFilter === "OCCUPIED" ? "ALL" : "OCCUPIED")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedFilter === "OCCUPIED"
              ? "ring-2 ring-rose-500 bg-rose-500/10 border-rose-500"
              : "bg-white dark:bg-[#101c42] border-stone-200/80 dark:border-stone-800 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">ห้องมีผู้พัก</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-white">
              {occupiedCount}
            </span>
            <span className="text-xs text-stone-400">ห้อง</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            สั่งอาหาร / ชาร์จเข้าห้องได้
          </div>
        </div>

        {/* Cleaning Card */}
        <div 
          onClick={() => setSelectedFilter(selectedFilter === "CLEANING" ? "ALL" : "CLEANING")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedFilter === "CLEANING"
              ? "ring-2 ring-amber-500 bg-amber-500/10 border-amber-500"
              : "bg-white dark:bg-[#101c42] border-stone-200/80 dark:border-stone-800 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">แม่บ้านทำความสะอาด</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-white">
              {cleaningCount}
            </span>
            <span className="text-xs text-stone-400">ห้อง</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            เปลี่ยนเป็นห้องว่างเมื่อตรวจแล้ว
          </div>
        </div>

        {/* Maintenance Card */}
        <div 
          onClick={() => setSelectedFilter(selectedFilter === "MAINTENANCE" ? "ALL" : "MAINTENANCE")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all col-span-2 sm:col-span-1 ${
            selectedFilter === "MAINTENANCE"
              ? "ring-2 ring-stone-500 bg-stone-500/10 border-stone-500"
              : "bg-white dark:bg-[#101c42] border-stone-200/80 dark:border-stone-800 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">ปิดปรับปรุง / ซ่อมบำรุง</span>
            <div className="w-8 h-8 rounded-xl bg-stone-500/15 flex items-center justify-center text-stone-600 dark:text-stone-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-white">
              {maintenanceCount}
            </span>
            <span className="text-xs text-stone-400">ห้อง</span>
          </div>
          <div className="mt-1 text-[11px] text-stone-500 font-medium truncate">
            งดจำหน่ายชั่วคราว
          </div>
        </div>

      </div>

      {/* Filter Tabs Bar & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
              selectedFilter === "ALL"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white dark:bg-[#101c42] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-slate-800/60"
            }`}
          >
            ทั้งหมด ({filteredRooms.length})
          </button>
          <button
            onClick={() => setSelectedFilter("AVAILABLE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
              selectedFilter === "AVAILABLE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-[#101c42] text-emerald-700 dark:text-emerald-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-slate-800/60"
            }`}
          >
            ว่าง ({availableCount})
          </button>
          <button
            onClick={() => setSelectedFilter("AWAITING_CHECKIN")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
              selectedFilter === "AWAITING_CHECKIN"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-[#101c42] text-blue-700 dark:text-blue-400 border border-stone-200 dark:border-stone-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
            }`}
          >
            รอเช็กอิน ({awaitingCheckinCount})
          </button>
          <button
            onClick={() => setSelectedFilter("OCCUPIED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
              selectedFilter === "OCCUPIED"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white dark:bg-[#101c42] text-rose-700 dark:text-rose-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-slate-800/60"
            }`}
          >
            มีผู้พัก ({occupiedCount})
          </button>
          <button
            onClick={() => setSelectedFilter("CLEANING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
              selectedFilter === "CLEANING"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white dark:bg-[#101c42] text-amber-700 dark:text-amber-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-slate-800/60"
            }`}
          >
            ทำความสะอาด ({cleaningCount})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {/* Button: จัดการห้องพัก & เปิด-ปิดห้อง (Room Availability & Stop Sell) - Accessible by all staff */}
          <a
            href={`?property=${activePropertyId}&tab=admin&subtab=rooms`}
            onClick={(e) => {
              e.preventDefault();
              if (onGoToAdminRooms) {
                onGoToAdminRooms();
              } else if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("tab", "admin");
                url.searchParams.set("subtab", "rooms");
                window.location.href = url.toString();
              }
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-[#101c42] hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all min-h-[44px] cursor-pointer whitespace-nowrap"
            title="เปิด-ปิดห้องพักและจัดการจำนวนห้องว่าง (Room Availability & Stop Sell)"
          >
            <BedDouble className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>จัดการห้องพัก<span className="hidden sm:inline"> (เปิด-ปิดห้อง)</span></span>
          </a>

          <button
            onClick={() => onGoToBooking()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-amber-500/20 transition-all min-h-[44px] shrink-0 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>เปิดบิลจองใหม่<span className="hidden sm:inline"> (Reservation)</span></span>
          </button>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayRooms.map((room) => {
          const badge = getStatusBadge(room.status);
          const isAvailable = room.status === "AVAILABLE";
          const isOccupied = room.status === "OCCUPIED";

          // Look up if this room has a pending CONFIRMED booking (e.g. from OTA or Reservation) waiting to check in
          const pendingBooking = isAvailable 
            ? filteredBookings.find(
                (b) => (b.roomId === room.id || b.roomNumber === room.roomNumber) && b.status === "CONFIRMED"
              )
            : null;

          const isOtaPending = !!pendingBooking;

          return (
            <div
              key={room.id}
              className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between ${
                isOtaPending
                  ? "bg-white dark:bg-[#101c42] border-blue-500/50 hover:border-blue-500/80 shadow-md ring-1 ring-blue-500/20"
                  : isAvailable
                  ? "bg-white dark:bg-[#101c42] border-emerald-500/30 hover:border-emerald-500/60 shadow-xs"
                  : isOccupied
                  ? "bg-white dark:bg-[#101c42] border-rose-500/30 hover:border-rose-500/60 shadow-xs"
                  : "bg-white/80 dark:bg-[#0d1636] border-stone-200 dark:border-stone-800"
              }`}
            >
              {/* Header: Room Number & Property */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl sm:text-2xl font-bold font-serif text-stone-900 dark:text-white tracking-tight shrink-0">
                        {room.roomNumber}
                      </span>
                      {room.isMeetingRoom && (
                        <span className="text-[10px] font-semibold uppercase bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                          ห้องประชุม
                        </span>
                      )}
                      {isOtaPending && (
                        <span className="animate-pulse flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-700 shrink-0 whitespace-nowrap">
                          <CalendarCheck className="w-3 h-3 shrink-0" />
                          <span>รอเช็กอิน</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-stone-600 dark:text-stone-300 mt-0.5 truncate">
                      {room.name}
                    </p>
                  </div>

                  {/* Property Icon Tag */}
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-slate-800 px-2 py-1 rounded-lg shrink-0 whitespace-nowrap">
                    {room.propertyId === "bugaan" ? (
                      <>
                        <Building className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Bu-Gaan</span>
                      </>
                    ) : (
                      <>
                        <Palmtree className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Thanawong</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  {isOtaPending ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 truncate min-w-0">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0" />
                      <span className="truncate">มีบุ๊กกิ้งจองแล้ว ({pendingBooking.source})</span>
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg} shrink-0 whitespace-nowrap`}>
                      <span className={`w-2 h-2 rounded-full ${badge.dot} shrink-0`} />
                      <span>{badge.label}</span>
                    </div>
                  )}
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0 whitespace-nowrap">
                    {formatCurrency(room.pricePerNight)}
                    <span className="text-[10px] text-stone-400 font-normal"> / คืน</span>
                  </span>
                </div>

                {/* Occupied Details or OTA Pending Details or Amenities */}
                <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-stone-800/80">
                  {isOccupied ? (
                    (() => {
                      const occBooking = filteredBookings.find((b) => b.id === room.currentBookingId);
                      const isFullyPaid = occBooking ? occBooking.balanceDue <= 0 : false;
                      const hasDeposit = occBooking ? occBooking.depositPaid > 0 && occBooking.balanceDue > 0 : false;

                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 truncate min-w-0">
                              <Users className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{room.guestName || "ผู้เข้าพัก"}</span>
                            </div>

                            {/* Payment Status Badge for Occupied Room */}
                            {occBooking && (
                              isFullyPaid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0 whitespace-nowrap">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                  <span>ชำระเงินแล้ว</span>
                                </span>
                              ) : hasDeposit ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0 whitespace-nowrap">
                                  <AlertCircle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                  <span>มัดจำแล้ว (ค้าง ฿{occBooking.balanceDue.toLocaleString()})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0 whitespace-nowrap animate-pulse">
                                  <CreditCard className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                  <span>รอชำระ ฿{occBooking.grandTotal.toLocaleString()}</span>
                                </span>
                              )
                            )}
                          </div>
                          
                          <div className="text-[11px] text-stone-400 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>รหัสบิล: {room.currentBookingId}</span>
                            </span>
                            {occBooking && occBooking.balanceDue > 0 && (
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 shrink-0 whitespace-nowrap">
                                ค้างชำระ: ฿{occBooking.balanceDue.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : isOtaPending ? (
                    (() => {
                      const isFullyPaid = pendingBooking.balanceDue <= 0;
                      const hasDeposit = pendingBooking.depositPaid > 0 && pendingBooking.balanceDue > 0;

                      return (
                        /* Display Pending OTA Booking Details with clear Payment Status Badge */
                        <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
                              pendingBooking.source === "Booking.com"
                                ? "bg-blue-600 text-white"
                                : pendingBooking.source === "Agoda"
                                ? "bg-amber-600 text-white"
                                : "bg-emerald-600 text-white"
                            }`}>
                              {pendingBooking.source}
                            </span>

                            {/* Prominent Payment Indicator */}
                            {isFullyPaid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shrink-0 whitespace-nowrap">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                <span>ชำระเงินแล้ว</span>
                              </span>
                            ) : hasDeposit ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0 whitespace-nowrap">
                                <AlertCircle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                <span>มัดจำแล้ว (รอชำระเพิ่ม)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700 shrink-0 whitespace-nowrap animate-pulse">
                                <CreditCard className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                <span>รอชำระเงิน</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-white truncate">
                            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{pendingBooking.guestName}</span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-blue-200/50 dark:border-blue-900/40">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{pendingBooking.checkInDate} ถึง {pendingBooking.checkOutDate}</span>
                            </span>
                            <span className="font-semibold text-stone-900 dark:text-white">
                              ยอดรวม: <span className="font-bold text-emerald-600 dark:text-emerald-400">฿{pendingBooking.grandTotal.toLocaleString()}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {room.amenities.slice(0, 3).map((a, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800/80 text-stone-600 dark:text-stone-300"
                        >
                          {a}
                        </span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800/80 text-stone-400">
                          +{room.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons (Touch Target >= 44px) */}
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex gap-2">
                {isOtaPending ? (
                  /* Changed Button for OTA Pending: Check-in with Guest Name */
                  <button
                    onClick={() => setSelectedOtaBookingForCheckIn(pendingBooking)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all min-h-[44px]"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    <span className="truncate">เช็คอิน: {pendingBooking.guestName.split(" ")[0]}</span>
                  </button>
                ) : isAvailable ? (
                  <button
                    onClick={() => handleOpenWalkIn(room)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Quick Walk-in (1-Click)</span>
                  </button>
                ) : null}

                {isOccupied && (
                  <button
                    onClick={() => {
                      if (onGoToFolio && room.currentBookingId) {
                        onGoToFolio(room.currentBookingId);
                      } else if (room.currentBookingId) {
                        checkOutBooking(room.currentBookingId);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors min-h-[44px]"
                  >
                    <DoorOpen className="w-3.5 h-3.5" />
                    <span>เช็คบิล / เช็คเอาต์</span>
                  </button>
                )}

                {room.status === "CLEANING" && (
                  <button
                    onClick={() => updateRoomStatus(room.id, "AVAILABLE")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors min-h-[44px]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ทำความสะอาดเสร็จ (พร้อมขาย)</span>
                  </button>
                )}

                {room.status === "MAINTENANCE" && (
                  <button
                    onClick={() => updateRoomStatus(room.id, "AVAILABLE")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-700 hover:bg-stone-800 text-white rounded-xl text-xs font-medium transition-colors min-h-[44px]"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>เปิดใช้งานห้อง</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Quick Walk-in Modal */}
      {quickWalkInModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#101c42] rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-amber-300/40 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                    เปิดห้อง Walk-in ทันที
                  </h3>
                  <p className="text-xs text-stone-500 truncate max-w-[200px] sm:max-w-none">
                    ห้อง {quickWalkInModalRoom.roomNumber} ({quickWalkInModalRoom.name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickWalkInModalRoom(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmWalkIn} className="mt-4 space-y-3 sm:space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  ชื่อลูกค้า (Guest Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น คุณสมชาย มั่งมี"
                  value={walkInGuestName}
                  onChange={(e) => setWalkInGuestName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800/80 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  เบอร์โทรศัพท์ติดต่อ (Phone)
                </label>
                <input
                  type="tel"
                  placeholder="08X-XXX-XXXX"
                  value={walkInGuestPhone}
                  onChange={(e) => setWalkInGuestPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800/80 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    จำนวนคืน (Nights)
                  </label>
                  <select
                    value={walkInNights}
                    onChange={(e) => setWalkInNights(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800/80 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    {[1, 2, 3, 4, 5, 7, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} คืน
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    ยอดรวมชำระ
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-sm">
                    {formatCurrency(quickWalkInModalRoom.pricePerNight * walkInNights)}
                  </div>
                </div>
              </div>

              {/* Document & PDPA Watermark Upload */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                        <span>บัตร ปชช. / พาสปอร์ต</span>
                        {requireCheckInDocuments ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                            จำเป็น (PDPA)
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-stone-400">
                            (ไม่บังคับ)
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        ระบบจะประทับลายน้ำคุ้มครอง PDPA อัตโนมัติ
                      </p>
                    </div>
                  </div>
                  {walkInIdCardImage && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>แนบแล้ว</span>
                    </span>
                  )}
                </div>

                {/* Hidden walk-in inputs */}
                <input
                  ref={walkInCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleWalkInIdCardChange}
                />
                <input
                  ref={walkInFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleWalkInIdCardChange}
                />

                {walkInIdCardImage ? (
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700">
                    <div
                      onClick={() => setViewingIdCardImage(walkInIdCardImage)}
                      className="relative w-20 h-14 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 cursor-pointer shrink-0 group bg-stone-100 dark:bg-slate-800 flex items-center justify-center"
                    >
                      <img
                        src={walkInIdCardImage}
                        alt="ID Card"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px]">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                        ประทับลายน้ำ PDPA เรียบร้อย
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setViewingIdCardImage(walkInIdCardImage)}
                          className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>ดูรูป</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => walkInCameraInputRef.current?.click()}
                          className="text-[11px] font-medium text-stone-600 dark:text-stone-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>ถ่ายใหม่</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setWalkInIdCardImage(null)}
                          className="text-[11px] font-medium text-rose-600 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => walkInCameraInputRef.current?.click()}
                      disabled={isUploadingWalkInIdCard}
                      className="p-2.5 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-stone-700 dark:text-stone-300 transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer min-h-[58px]"
                    >
                      <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-[11px] font-semibold">ถ่ายรูปด้วยกล้อง</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => walkInFileInputRef.current?.click()}
                      disabled={isUploadingWalkInIdCard}
                      className="p-2.5 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-stone-700 dark:text-stone-300 transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer min-h-[58px]"
                    >
                      <Upload className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                      <span className="text-[11px] font-semibold">เลือกไฟล์ภาพ</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Guest E-Signature */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <PenLine className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                        <span>ลายเซ็นผู้เข้าพัก (E-Signature)</span>
                        {requireCheckInDocuments && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                            จำเป็น
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        เซ็นชื่อยืนยันการลงทะเบียนเข้าพัก
                      </p>
                    </div>
                  </div>
                  {walkInSignatureImage && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>เซ็นแล้ว</span>
                    </span>
                  )}
                </div>

                <SignaturePad
                  initialSignature={walkInSignatureImage || undefined}
                  onChange={(sig) => setWalkInSignatureImage(sig)}
                  height={130}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setQuickWalkInModalRoom(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-100 min-h-[44px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/30 min-h-[44px]"
                >
                  ยืนยันเปิดห้องทันที
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTA / Reserved Booking Check-in Modal */}
      {selectedOtaBookingForCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#101c42] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-blue-500/30 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <OtaLogo channel={selectedOtaBookingForCheckIn.source} className="w-11 h-11" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                      เช็คอินตามการจอง (Check-in)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                      {selectedOtaBookingForCheckIn.source}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    เลขที่บุ๊กกิ้ง: #{selectedOtaBookingForCheckIn.bookingNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOtaBookingForCheckIn(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Booking Details Card */}
            <div className="mt-4 space-y-4">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400">ชื่อผู้เข้าพัก (Guest)</span>
                    <h4 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>{selectedOtaBookingForCheckIn.guestName}</span>
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400">ห้องพักที่จัดสรร</span>
                    <div className="text-lg font-bold font-serif text-blue-600 dark:text-blue-400">
                      ห้อง {selectedOtaBookingForCheckIn.roomNumber}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[11px]">เบอร์โทรติดต่อ</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-stone-400" />
                      {selectedOtaBookingForCheckIn.guestPhone || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">อีเมล</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{selectedOtaBookingForCheckIn.guestEmail || "-"}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[11px]">ระยะเวลาเข้าพัก</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5 block">
                      {selectedOtaBookingForCheckIn.checkInDate} ถึง {selectedOtaBookingForCheckIn.checkOutDate} ({selectedOtaBookingForCheckIn.totalNights} คืน)
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">ยอดชำระแล้ว</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                      {formatCurrency(selectedOtaBookingForCheckIn.depositPaid)}
                    </span>
                  </div>
                </div>

                {selectedOtaBookingForCheckIn.specialRequests && (
                  <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-xs">
                    <span className="text-stone-400 block text-[11px]">คำขอพิเศษ (Special Requests)</span>
                    <p className="text-stone-700 dark:text-stone-300 italic mt-0.5 bg-white dark:bg-slate-900/50 p-2 rounded-lg border border-stone-200/60 dark:border-stone-800">
                      "{selectedOtaBookingForCheckIn.specialRequests}"
                    </p>
                  </div>
                )}
              </div>

              {/* Guest ID / Passport Photo Capture & Upload */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                        เอกสารประจำตัว (ID Card / Passport)
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        ถ่ายรูปหรือแนบภาพบัตรประชาชนหรือหนังสือเดินทาง
                      </p>
                    </div>
                  </div>
                  {checkInIdCardImage && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>แนบแล้ว</span>
                    </span>
                  )}
                </div>

                {/* Hidden file inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleIdCardFileChange}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleIdCardFileChange}
                />

                {checkInIdCardImage ? (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700">
                    <div
                      onClick={() => setViewingIdCardImage(checkInIdCardImage)}
                      className="relative w-24 h-16 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 cursor-pointer shrink-0 group bg-stone-100 dark:bg-slate-800 flex items-center justify-center"
                    >
                      <img
                        src={checkInIdCardImage}
                        alt="Guest ID / Passport"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-medium">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                        เอกสารประจำตัวผู้เข้าพัก
                      </p>
                      <p className="text-[10px] text-stone-400">
                        บันทึกความละเอียดสูงเรียบร้อย
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setViewingIdCardImage(checkInIdCardImage)}
                          className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>ดูรูป</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="text-[11px] font-medium text-stone-600 dark:text-stone-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>ถ่ายใหม่</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckInIdCardImage(null)}
                          className="text-[11px] font-medium text-rose-600 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isUploadingIdCard}
                      className="p-3 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-stone-700 dark:text-stone-300 transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer min-h-[64px]"
                    >
                      <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-semibold">ถ่ายรูปด้วยกล้อง</span>
                      <span className="text-[10px] text-stone-400">เปิดกล้องมือถือ/แท็บเล็ต</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingIdCard}
                      className="p-3 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-stone-700 dark:text-stone-300 transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer min-h-[64px]"
                    >
                      <Upload className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                      <span className="text-xs font-semibold">เลือกไฟล์รูปภาพ</span>
                      <span className="text-[10px] text-stone-400">จากคลังภาพในเครื่อง</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Guest Digital Signature */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <PenLine className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                        ลายมือชื่อผู้เข้าพัก (Guest Digital Signature)
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        เซ็นชื่อเพื่อยืนยันข้อตกลงการเข้าพักโรงแรม
                      </p>
                    </div>
                  </div>
                  {checkInSignatureImage && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>เซ็นแล้ว</span>
                    </span>
                  )}
                </div>

                <SignaturePad
                  initialSignature={checkInSignatureImage || undefined}
                  onChange={(sig) => setCheckInSignatureImage(sig)}
                  height={150}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedOtaBookingForCheckIn(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
                >
                  ปิดหน้าต่าง
                </button>
                {onGoToFolio && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedOtaBookingForCheckIn.id;
                      setSelectedOtaBookingForCheckIn(null);
                      onGoToFolio(id);
                    }}
                    className="py-2.5 px-4 rounded-xl border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors min-h-[44px]"
                  >
                    ดูบิล Folio ละเอียด
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    checkInBooking(selectedOtaBookingForCheckIn.id, {
                      guestIdCardImage: checkInIdCardImage || undefined,
                      guestSignatureImage: checkInSignatureImage || undefined,
                    });
                    setSelectedOtaBookingForCheckIn(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>เช็กอินเข้าห้อง</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Fullscreen Viewer Modal */}
      {viewingIdCardImage && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 border border-stone-200 dark:border-stone-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white">
              <span className="font-serif font-bold text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>ภาพเอกสารประจำตัวผู้เข้าพัก (ID Card / Passport)</span>
              </span>
              <button
                type="button"
                onClick={() => setViewingIdCardImage(null)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 flex justify-center">
              <img
                src={viewingIdCardImage}
                alt="ID Card / Passport"
                className="max-h-[65vh] w-auto rounded-xl object-contain border border-stone-200 dark:border-stone-800 shadow-inner"
              />
            </div>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setViewingIdCardImage(null)}
                className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
