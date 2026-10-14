"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { Booking, BookingStatus, Room, RoomSegment } from "@/types/pms";
import { formatDateThai, formatCurrency } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Info,
  Building,
  Palmtree,
  CheckCircle,
  User,
  Phone,
  DoorOpen,
  Plus,
  DollarSign,
  CheckCircle2,
  Receipt,
  Hotel,
  X,
  Check,
  Camera,
  Upload,
  CreditCard,
  PenLine,
  Eye,
  Trash2,
  FileCheck2,
  CalendarRange,
  Smartphone,
  LayoutGrid,
  Layers,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  AlertTriangle,
  Wrench,
  Split,
  CalendarDays,
  RotateCcw,
  BedDouble,
  ChevronDown,
  XCircle,
  HelpCircle,
  FileText,
  CheckSquare,
  Square
} from "lucide-react";
import { SignaturePad } from "@/components/SignaturePad";
import { compressImageWithPdpaWatermark } from "@/lib/pdpaWatermark";

export function CalendarTimelineView({ 
  onGoToBooking, 
  onGoToFolio 
}: { 
  onGoToBooking: (roomId?: string) => void; 
  onGoToFolio?: (bookingId?: string) => void; 
}) {
  const { 
    filteredRooms, 
    filteredBookings, 
    checkInBooking, 
    checkOutBooking,
    addCustomChargeToBooking,
    updateBooking,
    addBooking,
    updateRoom,
    updateGroupColorTag,
    orders,
    requireCheckInDocuments,
    addNotification,
    cancelBooking,
    cancelMultipleBookings
  } = usePMS();
  
  // Asia/Bangkok (UTC+7) Timezone Helpers
  const BANGKOK_TIMEZONE = "Asia/Bangkok";

  const getBangkokToday = (): Date => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: BANGKOK_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const [y, m, d] = formatter.format(new Date()).split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0);
  };

  const toDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const THAI_MONTHS_FULL = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const THAI_MONTHS_SHORT = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];

  type CalendarViewMode = "10days" | "month" | "year" | "custom";
  type MobileDisplayMode = "timeline" | "daily";

  // View mode states
  const [viewMode, setViewMode] = useState<CalendarViewMode>("10days");
  const [mobileDisplay, setMobileDisplay] = useState<MobileDisplayMode>("timeline");

  // Timeline dates range: 10 days starting from Today in Bangkok timezone by default
  const [baseDate, setBaseDate] = useState<Date>(() => getBangkokToday());

  // Month view states
  const [selectedMonth, setSelectedMonth] = useState<number>(() => getBangkokToday().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => getBangkokToday().getFullYear());

  // Custom date range states (Default: from previous month to end of December)
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const today = getBangkokToday();
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return toDateStr(prevMonth);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const today = getBangkokToday();
    return `${today.getFullYear()}-12-31`;
  });

  // Mobile daily view selected date
  const [mobileSelectedDate, setMobileSelectedDate] = useState<Date>(() => getBangkokToday());

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Check-In Modal with PDPA Watermarked ID & Signature
  const [timelineCheckInBooking, setTimelineCheckInBooking] = useState<Booking | null>(null);
  const [timelineIdCardImage, setTimelineIdCardImage] = useState<string | null>(null);
  const [timelineSignatureImage, setTimelineSignatureImage] = useState<string | null>(null);
  const [isUploadingTimelineIdCard, setIsUploadingTimelineIdCard] = useState(false);
  const [viewingTimelineIdCardImage, setViewingTimelineIdCardImage] = useState<string | null>(null);
  const timelineCameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const timelineFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleTimelineIdCardChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !timelineCheckInBooking) return;
    try {
      setIsUploadingTimelineIdCard(true);
      const hotelTitle = timelineCheckInBooking.propertyId === "thanawong"
        ? "ธาราวงศ์ พูลวิลล่า รีสอร์ท"
        : "Bu-Gaan Sukhothai Resort";
      const compressed = await compressImageWithPdpaWatermark(
        file,
        hotelTitle,
        timelineCheckInBooking.bookingNumber
      );
      setTimelineIdCardImage(compressed);
    } catch (err) {
      console.error("Error compressing ID card in timeline:", err);
    } finally {
      setIsUploadingTimelineIdCard(false);
      if (e.target) e.target.value = "";
    }
  };

  // Group / Color Tag Quick Edit State
  const [isEditingColorTag, setIsEditingColorTag] = useState<boolean>(false);
  const [customTagColor, setCustomTagColor] = useState<string>("#3b82f6");
  const [editingCompanyName, setEditingCompanyName] = useState<string>("");
  const [applyToAllGroup, setApplyToAllGroup] = useState<boolean>(true);
  const [colorTagSuccessMsg, setColorTagSuccessMsg] = useState<string>("");

  // Group rooms by category/type (Double Bed Room, Family Room, etc.)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const roomsByType = React.useMemo(() => {
    const groups: { [type: string]: Room[] } = {};
    filteredRooms.forEach((r) => {
      const type = r.type || "Other";
      if (!groups[type]) groups[type] = [];
      groups[type].push(r);
    });
    return groups;
  }, [filteredRooms]);

  // Derive currently selected booking dynamically from context
  const selectedBooking = filteredBookings.find((b) => b.id === selectedBookingId) || null;

  // Find all related bookings if this booking is part of a company or group
  const relatedGroupBookings = React.useMemo(() => {
    if (!selectedBooking) return [];
    return filteredBookings.filter((b) => {
      if (selectedBooking.groupBookingId && b.groupBookingId === selectedBooking.groupBookingId) return true;
      if (selectedBooking.companyName && b.companyName === selectedBooking.companyName) return true;
      return false;
    });
  }, [filteredBookings, selectedBooking]);

  const hasGroup = relatedGroupBookings.length > 1;

  // Sync edit form fields whenever selectedBooking changes
  React.useEffect(() => {
    if (selectedBooking) {
      setCustomTagColor(selectedBooking.colorTag || "#3b82f6");
      setEditingCompanyName(selectedBooking.companyName || "");
      setIsEditingColorTag(false);
      setColorTagSuccessMsg("");
    }
  }, [selectedBookingId]);

  // Quick Charge Modal State inside Calendar
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [chargeTitle, setChargeTitle] = useState("");
  const [chargeAmount, setChargeAmount] = useState<number>(300);
  const [chargeSuccessMsg, setChargeSuccessMsg] = useState("");

  // Date calculation helpers
  const computeDaysDiff = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 0;
    const d1 = new Date(startStr);
    const d2 = new Date(endStr);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return isNaN(diff) ? 0 : diff;
  };

  const addDaysToStr = (dateStr: string, daysToAdd: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + daysToAdd);
    return toDateStr(d);
  };

  // Room Move States & Logic (Full Stay & Partial / Mid-Stay Split Move)
  interface RoomMovePending {
    booking: Booking;
    currentRoom: Room;
    targetRoom: Room;
    pricePerNightCurrent: number;
    pricePerNightTarget: number;
    totalNights: number;
    currentRoomTotal: number;
    targetRoomTotal: number;
    priceDiff: number;
    hasConflict: boolean;
    conflictingBooking?: Booking;

    // Partial / Mid-Stay Move Options
    isPartialMove: boolean;
    moveStartDate: string; // The day guest moves into the new room
    moveEndDate: string;   // The day guest checks out from the new room
    partialCurrentNights: number;
    partialTargetNights: number;
    partialCurrentTotal: number;
    partialTargetTotal: number;
    partialCombinedTotal: number;
    partialPriceDiff: number;
    moveReason: string;
    setOldRoomMaintenance: boolean;
  }

  const [pendingRoomMove, setPendingRoomMove] = useState<RoomMovePending | null>(null);
  const [recalculatePriceOption, setRecalculatePriceOption] = useState<boolean>(true);
  const [moveSuccessMessage, setMoveSuccessMessage] = useState<string>("");
  const [isSelectingRoomInModal, setIsSelectingRoomInModal] = useState<boolean>(false);
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);
  const [dragOverRoomId, setDragOverRoomId] = useState<string | null>(null);
  const dragOverRoomIdRef = React.useRef<string | null>(null);
  const [pressingBookingId, setPressingBookingId] = useState<string | null>(null);
  const timelineScrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Mobile Touch Drag & Drop State (Smooth long-press drag without text selection)
  interface TouchDragState {
    booking: Booking;
    startX: number;
    startY: number;
    curX: number;
    curY: number;
    isDragging: boolean;
  }
  const [touchDrag, setTouchDrag] = useState<TouchDragState | null>(null);
  const touchLongPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const touchCurrentPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const touchActiveBookingRef = React.useRef<Booking | null>(null);
  const isDraggingRef = React.useRef<boolean>(false);
  const dragJustEndedRef = React.useRef<boolean>(false);

  // Helper to retrieve all stay segments for a booking
  const getBookingSegments = (b: Booking): RoomSegment[] => {
    if (b.roomSegments && b.roomSegments.length > 0) {
      return b.roomSegments;
    }
    return [
      {
        id: `${b.id}-seg-0`,
        roomId: b.roomId,
        roomNumber: b.roomNumber,
        startDate: b.checkInDate,
        endDate: b.checkOutDate,
        roomRate: b.roomRate,
      },
    ];
  };

  // Reallocation States & Logic (Matching Little Hotelier / ZUZU - Image 2 & 3)
  interface PendingReallocation {
    booking: Booking;
    currentRoom: Room;
    targetRoom: Room;
    applyFromDate: string;
    availableDates: Array<{
      dateStr: string;
      label: string;
      isFullMove: boolean;
    }>;
    hasConflict: boolean;
    conflictingBooking?: Booking;
  }

  const [pendingReallocation, setPendingReallocation] = useState<PendingReallocation | null>(null);

  const getReallocationDates = (booking: Booking) => {
    const dates: Array<{ dateStr: string; label: string; isFullMove: boolean }> = [];
    const today = getBangkokToday();
    const todayStr = toDateStr(today);

    // Full move option from checkInDate
    const isTodayCheckIn = booking.checkInDate === todayStr;
    dates.push({
      dateStr: booking.checkInDate,
      label: isTodayCheckIn 
        ? `Today ${booking.checkInDate} (ย้ายทุกวันตลอดการจอง)` 
        : `${booking.checkInDate} (ย้ายทุกวันตลอดการจอง)`,
      isFullMove: true,
    });

    // Intermediate dates
    const dStart = new Date(booking.checkInDate + "T00:00:00");
    const dEnd = new Date(booking.checkOutDate + "T00:00:00");
    const cur = new Date(dStart);
    cur.setDate(cur.getDate() + 1);

    while (cur < dEnd) {
      const curStr = toDateStr(cur);
      const isCurToday = curStr === todayStr;
      dates.push({
        dateStr: curStr,
        label: isCurToday ? `Today ${curStr}` : curStr,
        isFullMove: false,
      });
      cur.setDate(cur.getDate() + 1);
    }

    return dates;
  };

  const initiateReallocation = (booking: Booking, targetRoomId: string) => {
    const segments = getBookingSegments(booking);
    if (segments.length === 1 && segments[0].roomId === targetRoomId) return;

    const currentRoom = filteredRooms.find((r) => r.id === booking.roomId) || {
      id: booking.roomId,
      propertyId: booking.propertyId,
      roomNumber: booking.roomNumber,
      name: `ห้อง ${booking.roomNumber}`,
      type: "Standard",
      isMeetingRoom: false,
      capacityAdults: 2,
      capacityKids: 0,
      pricePerNight: booking.roomRate,
      status: "AVAILABLE",
      floor: 1,
      amenities: []
    } as Room;

    const targetRoom = filteredRooms.find((r) => r.id === targetRoomId);
    if (!targetRoom) return;

    const availableDates = getReallocationDates(booking);
    const todayStr = toDateStr(getBangkokToday());
    const matchedToday = availableDates.find((d) => d.dateStr === todayStr);
    const defaultDate = matchedToday ? matchedToday.dateStr : availableDates[0].dateStr;

    // Check conflict
    const conflict = filteredBookings.find((bOther) => {
      if (bOther.id === booking.id || bOther.status === "CANCELLED") return false;
      const bOtherSegs = getBookingSegments(bOther);
      return bOtherSegs.some((otherSeg) => {
        if (otherSeg.roomId !== targetRoom.id) return false;
        return otherSeg.startDate < booking.checkOutDate && otherSeg.endDate > defaultDate;
      });
    });

    setPendingReallocation({
      booking,
      currentRoom,
      targetRoom,
      applyFromDate: defaultDate,
      availableDates,
      hasConflict: Boolean(conflict),
      conflictingBooking: conflict,
    });
    setIsSelectingRoomInModal(false);
  };

  const handleReallocationDateChange = (newDateStr: string) => {
    if (!pendingReallocation) return;
    const { booking, targetRoom } = pendingReallocation;

    const conflict = filteredBookings.find((bOther) => {
      if (bOther.id === booking.id || bOther.status === "CANCELLED") return false;
      const bOtherSegs = getBookingSegments(bOther);
      return bOtherSegs.some((otherSeg) => {
        if (otherSeg.roomId !== targetRoom.id) return false;
        return otherSeg.startDate < booking.checkOutDate && otherSeg.endDate > newDateStr;
      });
    });

    setPendingReallocation({
      ...pendingReallocation,
      applyFromDate: newDateStr,
      hasConflict: Boolean(conflict),
      conflictingBooking: conflict,
    });
  };

  const confirmReallocation = () => {
    if (!pendingReallocation) return;
    const { booking, currentRoom, targetRoom, applyFromDate } = pendingReallocation;

    const isFull = applyFromDate === booking.checkInDate;

    if (isFull) {
      const newSegments: RoomSegment[] = [
        {
          id: `seg-${Date.now()}-full`,
          roomId: targetRoom.id,
          roomNumber: targetRoom.roomNumber,
          startDate: booking.checkInDate,
          endDate: booking.checkOutDate,
          roomRate: targetRoom.pricePerNight,
        },
      ];

      updateBooking(booking.id, {
        roomId: targetRoom.id,
        roomNumber: targetRoom.roomNumber,
        roomSegments: newSegments,
      });

      if (booking.status === "CHECKED_IN") {
        updateRoom(currentRoom.id, { status: "CLEANING", currentBookingId: undefined, guestName: undefined });
        updateRoom(targetRoom.id, { status: "OCCUPIED", currentBookingId: booking.id, guestName: booking.guestName });
      }
    } else {
      const existing = getBookingSegments(booking);
      const newSegments: RoomSegment[] = [];

      for (const seg of existing) {
        if (seg.endDate <= applyFromDate) {
          newSegments.push({ ...seg });
        } else if (seg.startDate < applyFromDate) {
          newSegments.push({
            ...seg,
            endDate: applyFromDate,
          });
        }
      }

      newSegments.push({
        id: `seg-${Date.now()}-moved`,
        roomId: targetRoom.id,
        roomNumber: targetRoom.roomNumber,
        startDate: applyFromDate,
        endDate: booking.checkOutDate,
        roomRate: targetRoom.pricePerNight,
      });

      updateBooking(booking.id, {
        roomSegments: newSegments,
      });

      const todayStr = toDateStr(getBangkokToday());
      if (booking.status === "CHECKED_IN" && applyFromDate <= todayStr) {
        updateRoom(targetRoom.id, { status: "OCCUPIED", guestName: booking.guestName });
      }
    }

    if (addNotification) {
      addNotification({
        propertyId: booking.propertyId,
        title: "ย้ายห้องพักสำเร็จ",
        message: `ย้ายการจอง ${booking.guestName} (#${booking.bookingNumber}) ไปยังห้อง ${targetRoom.roomNumber} ${isFull ? "(ทุกวัน)" : `(เริ่ม ${applyFromDate})`}`,
        type: "BOOKING_UPDATE",
        audience: "ALL",
        priority: "NORMAL",
        roomNumber: targetRoom.roomNumber,
      });
    }

    setMoveSuccessMessage(`ย้ายห้องพักของ คุณ${booking.guestName} ไปยังห้อง ${targetRoom.roomNumber} เรียบร้อยแล้ว`);
    setTimeout(() => setMoveSuccessMessage(""), 4000);
    setPendingReallocation(null);
  };

  const handleSegmentRoomChange = (booking: Booking, segIndex: number, newRoomId: string) => {
    const targetRoom = filteredRooms.find((r) => r.id === newRoomId);
    if (!targetRoom) return;

    const segments = [...getBookingSegments(booking)];
    if (!segments[segIndex]) return;

    segments[segIndex] = {
      ...segments[segIndex],
      roomId: targetRoom.id,
      roomNumber: targetRoom.roomNumber,
      roomRate: targetRoom.pricePerNight,
    };

    // Auto-merge adjacent segments that share the same roomId
    const merged: RoomSegment[] = [];
    for (const seg of segments) {
      if (merged.length > 0 && merged[merged.length - 1].roomId === seg.roomId) {
        merged[merged.length - 1].endDate = seg.endDate;
      } else {
        merged.push({ ...seg });
      }
    }

    const primaryRoom = filteredRooms.find((r) => r.id === merged[0].roomId) || targetRoom;

    updateBooking(booking.id, {
      roomId: primaryRoom.id,
      roomNumber: primaryRoom.roomNumber,
      roomSegments: merged.length > 1 ? merged : undefined,
    });

    setMoveSuccessMessage(`อัปเดตห้องพักของ คุณ${booking.guestName} เป็นห้อง ${targetRoom.roomNumber} เรียบร้อยแล้ว`);
    setTimeout(() => setMoveSuccessMessage(""), 3000);
  };

  const mergeSegmentsBackToOriginal = (booking: Booking) => {
    const originalRoom = filteredRooms.find((r) => r.id === booking.roomId) || filteredRooms[0];
    updateBooking(booking.id, {
      roomId: originalRoom.id,
      roomNumber: originalRoom.roomNumber,
      roomSegments: undefined,
    });
    setMoveSuccessMessage(`ย้ายการจองของ คุณ${booking.guestName} กลับห้อง ${originalRoom.roomNumber} เรียบร้อยแล้ว`);
    setTimeout(() => setMoveSuccessMessage(""), 3000);
  };

  // Helper to detect which room row is at (clientX, clientY)
  // Combines elementFromPoint with a vertical Y-coordinate scan across all room rows
  // ensuring room detection NEVER fails even on sticky headers, borders, or gaps
  const detectRoomAtPoint = (clientX: number, clientY: number): string | null => {
    // 1. Direct hit-test
    const elem = document.elementFromPoint(clientX, clientY);
    const roomRow = elem?.closest("[data-room-id]");
    const foundId = roomRow?.getAttribute("data-room-id");
    if (foundId) return foundId;

    // 2. Y-axis intersection scan across all room rows
    const allRows = document.querySelectorAll("[data-room-id]");
    for (let i = 0; i < allRows.length; i++) {
      const rect = allRows[i].getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        return allRows[i].getAttribute("data-room-id");
      }
    }
    return null;
  };

  // Auto-scroll handler when dragging near viewport/container edges on mobile
  const handleAutoScroll = (clientX: number, clientY: number) => {
    // Vertical auto-scroll (window)
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
    const topThreshold = 85;
    const bottomThreshold = viewportHeight - 85;

    if (clientY < topThreshold) {
      window.scrollBy({ top: -10, behavior: "auto" });
    } else if (clientY > bottomThreshold) {
      window.scrollBy({ top: 10, behavior: "auto" });
    }

    // Horizontal auto-scroll (timeline container)
    if (timelineScrollContainerRef.current) {
      const containerRect = timelineScrollContainerRef.current.getBoundingClientRect();
      const leftThreshold = containerRect.left + 175; // after sticky room header
      const rightThreshold = containerRect.right - 50;

      if (clientX < leftThreshold && clientX > containerRect.left) {
        timelineScrollContainerRef.current.scrollLeft -= 12;
      } else if (clientX > rightThreshold) {
        timelineScrollContainerRef.current.scrollLeft += 12;
      }
    }
  };

  // Window-level non-passive touch listeners for 100% stable dragging
  const onGlobalTouchMove = (e: TouchEvent) => {
    if (!isDraggingRef.current || !touchActiveBookingRef.current) return;
    if (e.cancelable) {
      e.preventDefault(); // Stop native page gestures/scrolling completely while dragging
    }
    const touch = e.touches[0];
    if (!touch) return;

    touchCurrentPosRef.current = { x: touch.clientX, y: touch.clientY };

    setTouchDrag((prev) => prev ? ({ ...prev, curX: touch.clientX, curY: touch.clientY }) : null);

    handleAutoScroll(touch.clientX, touch.clientY);

    const foundRoomId = detectRoomAtPoint(touch.clientX, touch.clientY);
    if (foundRoomId) {
      if (dragOverRoomIdRef.current !== foundRoomId) {
        dragOverRoomIdRef.current = foundRoomId;
        setDragOverRoomId(foundRoomId);
        // Haptic feedback tick on entering a new room
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try { navigator.vibrate(20); } catch (_) {}
        }
      }
    }
  };

  const onGlobalTouchEnd = () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("touchmove", onGlobalTouchMove);
      window.removeEventListener("touchend", onGlobalTouchEnd);
      window.removeEventListener("touchcancel", onGlobalTouchEnd);
    }
    if (typeof document !== "undefined") {
      document.body.style.userSelect = "";
    }

    if (touchLongPressTimerRef.current) {
      clearTimeout(touchLongPressTimerRef.current);
      touchLongPressTimerRef.current = null;
    }
    setPressingBookingId(null);

    if (isDraggingRef.current && touchActiveBookingRef.current) {
      const bookingToMove = touchActiveBookingRef.current;
      const targetRoomId = dragOverRoomIdRef.current;

      // Prevent subsequent synthetic click event from opening details modal
      dragJustEndedRef.current = true;
      setTimeout(() => {
        dragJustEndedRef.current = false;
      }, 400);

      isDraggingRef.current = false;
      setTouchDrag(null);
      setDraggedBookingId(null);
      setDragOverRoomId(null);
      dragOverRoomIdRef.current = null;
      touchActiveBookingRef.current = null;
      touchStartPosRef.current = null;

      if (targetRoomId && targetRoomId !== bookingToMove.roomId) {
        initiateReallocation(bookingToMove, targetRoomId);
      }
    } else {
      isDraggingRef.current = false;
      setTouchDrag(null);
      setDraggedBookingId(null);
      setDragOverRoomId(null);
      dragOverRoomIdRef.current = null;
      touchActiveBookingRef.current = null;
      touchStartPosRef.current = null;
    }
  };

  // Clean up global listeners on unmount
  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("touchmove", onGlobalTouchMove);
        window.removeEventListener("touchend", onGlobalTouchEnd);
        window.removeEventListener("touchcancel", onGlobalTouchEnd);
      }
      if (typeof document !== "undefined") {
        document.body.style.userSelect = "";
      }
    };
  }, []);

  // Booking touch start: start 220ms press-and-hold timer with subtle pressing feedback
  const handleBookingTouchStart = (e: React.TouchEvent, booking: Booking) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    touchCurrentPosRef.current = { x: touch.clientX, y: touch.clientY };
    touchActiveBookingRef.current = booking;
    isDraggingRef.current = false;
    setPressingBookingId(booking.id);

    if (touchLongPressTimerRef.current) {
      clearTimeout(touchLongPressTimerRef.current);
    }

    touchLongPressTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      setPressingBookingId(null);
      setDraggedBookingId(booking.id);

      // Distinct haptic vibration when booking is "lifted"
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try { navigator.vibrate([40, 30, 40]); } catch (_) {}
      }

      if (typeof document !== "undefined") {
        document.body.style.userSelect = "none";
      }

      const cur = touchCurrentPosRef.current || { x: touch.clientX, y: touch.clientY };
      setTouchDrag({
        booking,
        startX: touchStartPosRef.current?.x || cur.x,
        startY: touchStartPosRef.current?.y || cur.y,
        curX: cur.x,
        curY: cur.y,
        isDragging: true,
      });

      // Bind non-passive global touch listeners
      if (typeof window !== "undefined") {
        window.addEventListener("touchmove", onGlobalTouchMove, { passive: false });
        window.addEventListener("touchend", onGlobalTouchEnd);
        window.addEventListener("touchcancel", onGlobalTouchEnd);
      }
    }, 220);
  };

  const handleBookingTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) {
      if (touchStartPosRef.current && e.touches.length === 1) {
        const touch = e.touches[0];
        const dist = Math.hypot(
          touch.clientX - touchStartPosRef.current.x,
          touch.clientY - touchStartPosRef.current.y
        );
        if (dist > 15) {
          // Finger moved more than 15px: cancel press-and-hold so user can scroll normally
          if (touchLongPressTimerRef.current) {
            clearTimeout(touchLongPressTimerRef.current);
            touchLongPressTimerRef.current = null;
          }
          setPressingBookingId(null);
          touchActiveBookingRef.current = null;
        }
      }
    }
  };

  const handleBookingTouchEnd = () => {
    if (!isDraggingRef.current) {
      if (touchLongPressTimerRef.current) {
        clearTimeout(touchLongPressTimerRef.current);
        touchLongPressTimerRef.current = null;
      }
      setPressingBookingId(null);
      touchActiveBookingRef.current = null;
    }
  };

  const handleBookingTouchCancel = () => {
    if (!isDraggingRef.current) {
      if (touchLongPressTimerRef.current) {
        clearTimeout(touchLongPressTimerRef.current);
        touchLongPressTimerRef.current = null;
      }
      setPressingBookingId(null);
      touchActiveBookingRef.current = null;
    }
  };

  // Date Shift / Move Dates States & Logic
  interface DateShiftPending {
    booking: Booking;
    room: Room;
    newCheckInDate: string;
    newCheckOutDate: string;
    newTotalNights: number;
    newRoomTotal: number;
    priceDiff: number;
    hasConflict: boolean;
    conflictingBooking?: Booking;
  }

  const [pendingDateShift, setPendingDateShift] = useState<DateShiftPending | null>(null);
  const [isSelectingDateShiftInModal, setIsSelectingDateShiftInModal] = useState<boolean>(false);

  const initiateRoomMove = (booking: Booking, targetRoomId: string) => {
    if (booking.roomId === targetRoomId) return;

    const currentRoom = filteredRooms.find((r) => r.id === booking.roomId) || {
      id: booking.roomId,
      propertyId: booking.propertyId,
      roomNumber: booking.roomNumber,
      name: `ห้อง ${booking.roomNumber}`,
      type: "Standard",
      isMeetingRoom: false,
      capacityAdults: 2,
      capacityKids: 0,
      pricePerNight: booking.roomRate,
      status: "AVAILABLE",
      floor: 1,
      amenities: []
    } as Room;

    const targetRoom = filteredRooms.find((r) => r.id === targetRoomId);
    if (!targetRoom) return;

    const pricePerNightCurrent = currentRoom.pricePerNight || booking.roomRate;
    const pricePerNightTarget = targetRoom.pricePerNight;
    const totalNights = booking.totalNights || 1;
    const currentRoomTotal = booking.roomTotal;
    const targetRoomTotal = pricePerNightTarget * totalNights;
    const priceDiff = targetRoomTotal - currentRoomTotal;

    // Default partial move configuration:
    // If stay is > 1 night, default moveStartDate to tomorrow or night 2
    const defaultPartialStart = totalNights > 1 ? addDaysToStr(booking.checkInDate, 1) : booking.checkInDate;
    const defaultPartialEnd = booking.checkOutDate;
    const partialCurrentNights = Math.max(1, computeDaysDiff(booking.checkInDate, defaultPartialStart));
    const partialTargetNights = Math.max(1, computeDaysDiff(defaultPartialStart, defaultPartialEnd));
    const partialCurrentTotal = pricePerNightCurrent * partialCurrentNights;
    const partialTargetTotal = pricePerNightTarget * partialTargetNights;
    const partialCombinedTotal = partialCurrentTotal + partialTargetTotal;
    const partialPriceDiff = partialCombinedTotal - currentRoomTotal;

    // Check conflict for full stay
    const conflict = filteredBookings.find((bOther) => {
      if (bOther.id === booking.id || bOther.roomId !== targetRoom.id || bOther.status === "CANCELLED") {
        return false;
      }
      return bOther.checkInDate < booking.checkOutDate && bOther.checkOutDate > booking.checkInDate;
    });

    setPendingRoomMove({
      booking,
      currentRoom,
      targetRoom,
      pricePerNightCurrent,
      pricePerNightTarget,
      totalNights,
      currentRoomTotal,
      targetRoomTotal,
      priceDiff,
      hasConflict: Boolean(conflict),
      conflictingBooking: conflict,

      // Partial defaults
      isPartialMove: false,
      moveStartDate: defaultPartialStart,
      moveEndDate: defaultPartialEnd,
      partialCurrentNights,
      partialTargetNights,
      partialCurrentTotal,
      partialTargetTotal,
      partialCombinedTotal,
      partialPriceDiff,
      moveReason: "ห้องเดิมชำรุด / แอร์เสีย มีปัญหา (Defect)",
      setOldRoomMaintenance: true,
    });
    setRecalculatePriceOption(priceDiff !== 0);
    setIsSelectingRoomInModal(false);
  };

  const updatePartialMoveConfig = (
    isPartial: boolean,
    newStart?: string,
    newEnd?: string,
    reason?: string,
    setMaint?: boolean
  ) => {
    if (!pendingRoomMove) return;
    const { booking, targetRoom, pricePerNightCurrent, pricePerNightTarget } = pendingRoomMove;

    const start = newStart !== undefined ? newStart : pendingRoomMove.moveStartDate;
    const end = newEnd !== undefined ? newEnd : pendingRoomMove.moveEndDate;
    const partialCurrNights = Math.max(1, computeDaysDiff(booking.checkInDate, start));
    const partialTgtNights = Math.max(1, computeDaysDiff(start, end));
    const partialCurrTotal = pricePerNightCurrent * partialCurrNights;
    const partialTgtTotal = pricePerNightTarget * partialTgtNights;
    const combinedTotal = partialCurrTotal + partialTgtTotal;
    const partialDiff = combinedTotal - booking.roomTotal;

    // Check conflict based on active mode
    const checkStart = isPartial ? start : booking.checkInDate;
    const checkEnd = isPartial ? end : booking.checkOutDate;
    const conflict = filteredBookings.find((bOther) => {
      if (bOther.id === booking.id || bOther.roomId !== targetRoom.id || bOther.status === "CANCELLED") {
        return false;
      }
      return bOther.checkInDate < checkEnd && bOther.checkOutDate > checkStart;
    });

    setPendingRoomMove((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        isPartialMove: isPartial,
        moveStartDate: start,
        moveEndDate: end,
        partialCurrentNights: partialCurrNights,
        partialTargetNights: partialTgtNights,
        partialCurrentTotal: partialCurrTotal,
        partialTargetTotal: partialTgtTotal,
        partialCombinedTotal: combinedTotal,
        partialPriceDiff: partialDiff,
        moveReason: reason !== undefined ? reason : prev.moveReason,
        setOldRoomMaintenance: setMaint !== undefined ? setMaint : prev.setOldRoomMaintenance,
        hasConflict: Boolean(conflict),
        conflictingBooking: conflict,
      };
    });
  };

  const confirmRoomMove = () => {
    if (!pendingRoomMove) return;

    const {
      booking,
      currentRoom,
      targetRoom,
      pricePerNightTarget,
      targetRoomTotal,
      priceDiff,
      isPartialMove,
      moveStartDate,
      moveEndDate,
      partialCurrentNights,
      partialTargetNights,
      partialCurrentTotal,
      partialTargetTotal,
      partialPriceDiff,
      moveReason,
      setOldRoomMaintenance
    } = pendingRoomMove;

    if (!isPartialMove) {
      // FULL STAY MOVE
      if (recalculatePriceOption && priceDiff !== 0) {
        const newRoomTotal = targetRoomTotal;
        const newGrandTotal = newRoomTotal + booking.extraBedTotal + booking.posChargesTotal;
        const newBalanceDue = newGrandTotal - booking.depositPaid;

        updateBooking(booking.id, {
          roomId: targetRoom.id,
          roomNumber: targetRoom.roomNumber,
          roomRate: pricePerNightTarget,
          roomTotal: newRoomTotal,
          grandTotal: newGrandTotal,
          balanceDue: newBalanceDue,
        });
      } else {
        updateBooking(booking.id, {
          roomId: targetRoom.id,
          roomNumber: targetRoom.roomNumber,
        });
      }

      // If booking is currently checked in, update room states
      if (booking.status === "CHECKED_IN") {
        updateRoom(currentRoom.id, {
          status: setOldRoomMaintenance ? "MAINTENANCE" : "CLEANING",
          currentBookingId: undefined,
          guestName: undefined,
        });
        updateRoom(targetRoom.id, {
          status: "OCCUPIED",
          currentBookingId: booking.id,
          guestName: booking.guestName,
        });
      }

      if (addNotification) {
        addNotification({
          propertyId: booking.propertyId,
          title: "ย้ายห้องพักสำเร็จ",
          message: `ย้ายการจอง ${booking.guestName} (#${booking.bookingNumber}) จากห้อง ${currentRoom.roomNumber} ไปยังห้อง ${targetRoom.roomNumber}`,
          type: "BOOKING_UPDATE",
          audience: "ALL",
          priority: "NORMAL",
          roomNumber: targetRoom.roomNumber,
        });
      }

      setMoveSuccessMessage(`ย้ายการจองของคุณ ${booking.guestName} จากห้อง ${currentRoom.roomNumber} ไปยังห้อง ${targetRoom.roomNumber} เรียบร้อยแล้ว`);
    } else {
      // PARTIAL / MID-STAY SPLIT MOVE
      const sharedGroupId = booking.groupBookingId || `GRP-${booking.bookingNumber}`;
      const segment1RoomTotal = partialCurrentTotal;
      const segment1GrandTotal = segment1RoomTotal;
      const segment1Deposit = Math.min(booking.depositPaid, segment1GrandTotal);
      const segment1Balance = Math.max(0, segment1GrandTotal - segment1Deposit);

      // 1. Update Segment 1 (original booking staying in current room until moveStartDate)
      updateBooking(booking.id, {
        checkOutDate: moveStartDate,
        totalNights: partialCurrentNights,
        roomTotal: segment1RoomTotal,
        grandTotal: segment1GrandTotal,
        depositPaid: segment1Deposit,
        balanceDue: segment1Balance,
        groupBookingId: sharedGroupId,
        specialRequests: `${booking.specialRequests ? booking.specialRequests + " | " : ""}[ย้ายกลางคัน คืนที่ ${partialCurrentNights + 1} ไปห้อง ${targetRoom.roomNumber} (${moveReason})]`
      });

      // 2. Create Segment 2 (new linked booking in target room starting moveStartDate)
      const remainingDeposit = Math.max(0, booking.depositPaid - segment1GrandTotal);
      const segment2Rate = recalculatePriceOption ? pricePerNightTarget : booking.roomRate;
      const segment2RoomTotal = segment2Rate * partialTargetNights;
      const segment2GrandTotal = segment2RoomTotal;
      const segment2Balance = Math.max(0, segment2GrandTotal - remainingDeposit);

      addBooking({
        propertyId: booking.propertyId,
        roomId: targetRoom.id,
        roomNumber: targetRoom.roomNumber,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        guestEmail: booking.guestEmail,
        source: booking.source,
        status: booking.status === "CHECKED_IN" ? "CHECKED_IN" : "CONFIRMED",
        checkInDate: moveStartDate,
        checkOutDate: moveEndDate,
        totalNights: partialTargetNights,
        estimatedTime: booking.estimatedTime || "14:00",
        adults: booking.adults,
        kids: booking.kids,
        hasExtraBed: booking.hasExtraBed,
        extraBedCount: booking.extraBedCount,
        extraBedRate: booking.extraBedRate,
        extraBedTotal: 0,
        roomRate: segment2Rate,
        roomTotal: segment2RoomTotal,
        posChargesTotal: 0,
        grandTotal: segment2GrandTotal,
        depositPaid: remainingDeposit,
        paymentMethod: booking.paymentMethod,
        colorTag: booking.colorTag,
        companyName: booking.companyName,
        groupBookingId: sharedGroupId,
        specialRequests: `[ย้ายมาจากห้อง ${currentRoom.roomNumber} เมื่อ ${moveStartDate} (${moveReason})]`,
        guestIdCardImage: booking.guestIdCardImage,
        guestSignatureImage: booking.guestSignatureImage,
        checkedInAt: booking.checkedInAt,
      });

      // 3. Update room states
      if (setOldRoomMaintenance) {
        updateRoom(currentRoom.id, {
          status: "MAINTENANCE",
          currentBookingId: undefined,
          guestName: undefined,
        });
      } else {
        updateRoom(currentRoom.id, {
          status: "CLEANING",
          currentBookingId: undefined,
          guestName: undefined,
        });
      }

      if (booking.status === "CHECKED_IN") {
        updateRoom(targetRoom.id, {
          status: "OCCUPIED",
          guestName: booking.guestName,
        });
      }

      if (addNotification) {
        addNotification({
          propertyId: booking.propertyId,
          title: "ย้ายห้องพักกลางคันสำเร็จ (Split Stay)",
          message: `คุณ${booking.guestName} ย้ายห้องจาก ${currentRoom.roomNumber} ไปยังห้อง ${targetRoom.roomNumber} (เริ่ม ${moveStartDate} ถึง ${moveEndDate}) เหตุผล: ${moveReason}`,
          type: "BOOKING_UPDATE",
          audience: "ALL",
          priority: "NORMAL",
          roomNumber: targetRoom.roomNumber,
        });
      }

      setMoveSuccessMessage(`ย้ายห้องพักกลางคันของคุณ ${booking.guestName} ไปยังห้อง ${targetRoom.roomNumber} (ช่วง ${moveStartDate} ถึง ${moveEndDate}) สำเร็จ`);
    }

    setTimeout(() => {
      setMoveSuccessMessage("");
    }, 4000);

    setPendingRoomMove(null);
  };

  // Date Shift Functions (เลื่อนวันเข้าพัก / ย้ายวัน)
  const initiateDateShift = (booking: Booking) => {
    const room = filteredRooms.find((r) => r.id === booking.roomId) || {
      id: booking.roomId,
      propertyId: booking.propertyId,
      roomNumber: booking.roomNumber,
      name: `ห้อง ${booking.roomNumber}`,
      type: "Standard",
      isMeetingRoom: false,
      capacityAdults: 2,
      capacityKids: 0,
      pricePerNight: booking.roomRate,
      status: "AVAILABLE",
      floor: 1,
      amenities: []
    } as Room;

    updateDateShiftState(booking, room, booking.checkInDate, booking.checkOutDate);
    setIsSelectingDateShiftInModal(true);
    setIsSelectingRoomInModal(false);
  };

  const updateDateShiftState = (booking: Booking, room: Room, start: string, end: string) => {
    const nights = Math.max(1, computeDaysDiff(start, end));
    const newRoomTotal = booking.roomRate * nights;
    const priceDiff = newRoomTotal - booking.roomTotal;

    const conflict = filteredBookings.find((bOther) => {
      if (bOther.id === booking.id || bOther.roomId !== room.id || bOther.status === "CANCELLED") {
        return false;
      }
      return bOther.checkInDate < end && bOther.checkOutDate > start;
    });

    setPendingDateShift({
      booking,
      room,
      newCheckInDate: start,
      newCheckOutDate: end,
      newTotalNights: nights,
      newRoomTotal,
      priceDiff,
      hasConflict: Boolean(conflict),
      conflictingBooking: conflict,
    });
  };

  const shiftBookingDays = (deltaDays: number) => {
    if (!pendingDateShift) return;
    const newStart = addDaysToStr(pendingDateShift.newCheckInDate, deltaDays);
    const newEnd = addDaysToStr(pendingDateShift.newCheckOutDate, deltaDays);
    updateDateShiftState(pendingDateShift.booking, pendingDateShift.room, newStart, newEnd);
  };

  const adjustBookingNights = (deltaNights: number) => {
    if (!pendingDateShift) return;
    const targetNights = Math.max(1, pendingDateShift.newTotalNights + deltaNights);
    const newEnd = addDaysToStr(pendingDateShift.newCheckInDate, targetNights);
    updateDateShiftState(pendingDateShift.booking, pendingDateShift.room, pendingDateShift.newCheckInDate, newEnd);
  };

  const confirmDateShift = () => {
    if (!pendingDateShift) return;
    const { booking, newCheckInDate, newCheckOutDate, newTotalNights, newRoomTotal } = pendingDateShift;
    const newGrandTotal = newRoomTotal + booking.extraBedTotal + booking.posChargesTotal;
    const newBalanceDue = newGrandTotal - booking.depositPaid;

    updateBooking(booking.id, {
      checkInDate: newCheckInDate,
      checkOutDate: newCheckOutDate,
      totalNights: newTotalNights,
      roomTotal: newRoomTotal,
      grandTotal: newGrandTotal,
      balanceDue: newBalanceDue,
    });

    if (addNotification) {
      addNotification({
        propertyId: booking.propertyId,
        title: "เลื่อนวันเข้าพักสำเร็จ",
        message: `เลื่อนวันเข้าพักการจอง ${booking.guestName} (#${booking.bookingNumber}) เป็น ${formatDateThai(newCheckInDate)} ถึง ${formatDateThai(newCheckOutDate)} (${newTotalNights} คืน)`,
        type: "BOOKING_UPDATE",
        audience: "ALL",
        priority: "NORMAL",
        roomNumber: booking.roomNumber,
      });
    }

    setMoveSuccessMessage(`เลื่อนวันเข้าพักของคุณ ${booking.guestName} เป็น ${newCheckInDate} ถึง ${newCheckOutDate} (${newTotalNights} คืน) สำเร็จ`);
    setTimeout(() => {
      setMoveSuccessMessage("");
    }, 4000);

    setPendingDateShift(null);
    setIsSelectingDateShiftInModal(false);
  };

  // Cancellation Flow State (Matching ZUZU PMS / User Reference Images)
  interface CancellationState {
    booking: Booking;
    linkedBookings: Booking[];
    step: "SCOPE" | "POLICY_CONFIRM";
    mode: "ALL" | "PARTIAL";
    selectedBookingIds: string[];
    expandedDetailsIds: string[];
    policyAdherence: "WAIVE_FULL_REFUND" | "FOLLOW_POLICY" | "CUSTOM_FEE";
    customFee: number;
    reason: string;
  }

  const [pendingCancellation, setPendingCancellation] = useState<CancellationState | null>(null);

  // Helper to find all linked bookings strictly belonging to the SAME GUEST / GROUP / RESERVATION
  const getLinkedBookingsForCancellation = (targetBooking: Booking): Booking[] => {
    return filteredBookings.filter((b) => {
      // Must not be already cancelled
      if (b.status === "CANCELLED") return false;
      // If it's the target booking itself, include it
      if (b.id === targetBooking.id) return true;

      // Must be at the same property
      if (b.propertyId !== targetBooking.propertyId) return false;

      // Same guest indicators
      const isSameGuestName = 
        b.guestName.trim().toLowerCase() === targetBooking.guestName.trim().toLowerCase();
      const isSameGuestPhone = 
        Boolean(targetBooking.guestPhone && b.guestPhone && b.guestPhone.trim() === targetBooking.guestPhone.trim());
      const isSameDates = 
        b.checkInDate === targetBooking.checkInDate && b.checkOutDate === targetBooking.checkOutDate;
      const isOverlappingStay = 
        b.checkInDate < targetBooking.checkOutDate && b.checkOutDate > targetBooking.checkInDate;

      // Condition 1: Explicit shared group booking ID (e.g. GRP-ZEE-M8E)
      if (
        targetBooking.groupBookingId && 
        b.groupBookingId && 
        targetBooking.groupBookingId.trim() !== "" &&
        b.groupBookingId === targetBooking.groupBookingId
      ) {
        return true;
      }

      // Condition 2: Explicit shared company / organization name on the same dates
      if (
        targetBooking.companyName && 
        b.companyName && 
        targetBooking.companyName.trim() !== "" &&
        targetBooking.companyName.trim().toLowerCase() === b.companyName.trim().toLowerCase() &&
        isOverlappingStay
      ) {
        return true;
      }

      // Condition 3: Same guest (name or phone) booking multiple rooms on the same trip / dates
      if ((isSameGuestName || isSameGuestPhone) && isOverlappingStay) {
        return true;
      }

      // Condition 4: OTA multi-room sub-booking suffix (e.g. "M8e885f85-01" vs "M8e885f85-02")
      // Only match if ends with -01, -02, -1, -2 AND same guest or same dates
      const getOtaBaseCode = (code: string) => {
        const match = code.match(/^(.*)-[0-9]{1,2}$/);
        return match ? match[1] : null;
      };
      const targetBase = getOtaBaseCode(targetBooking.bookingNumber);
      const bBase = getOtaBaseCode(b.bookingNumber);
      if (targetBase && bBase && targetBase === bBase && (isSameGuestName || isSameDates)) {
        return true;
      }

      return false;
    });
  };

  const initiateCancellation = (booking: Booking) => {
    const linked = getLinkedBookingsForCancellation(booking);
    const isMultiRoomGroup = linked.length > 1;

    if (isMultiRoomGroup) {
      // Step 1: Scope selection modal (Cancel all vs Cancel partial)
      setPendingCancellation({
        booking,
        linkedBookings: linked,
        step: "SCOPE",
        mode: "ALL",
        selectedBookingIds: linked.map((b) => b.id),
        expandedDetailsIds: [],
        policyAdherence: "WAIVE_FULL_REFUND",
        customFee: 0,
        reason: "",
      });
    } else {
      // Single booking: skip scope and proceed directly to Policy Confirmation
      setPendingCancellation({
        booking,
        linkedBookings: [booking],
        step: "POLICY_CONFIRM",
        mode: "PARTIAL",
        selectedBookingIds: [booking.id],
        expandedDetailsIds: [],
        policyAdherence: "WAIVE_FULL_REFUND",
        customFee: 0,
        reason: "",
      });
    }
  };

  const calculateCancellationFee = (state: CancellationState): number => {
    if (state.policyAdherence === "WAIVE_FULL_REFUND") {
      return 0;
    }
    if (state.policyAdherence === "CUSTOM_FEE") {
      return Math.max(0, state.customFee);
    }
    // FOLLOW_POLICY: Check days before check-in for the selected bookings
    // Rule: "Refundable up to 3 days before check-in"
    const today = getBangkokToday();
    const targets = state.linkedBookings.filter((b) => state.selectedBookingIds.includes(b.id));
    let totalFee = 0;
    targets.forEach((b) => {
      const checkIn = new Date(b.checkInDate);
      const daysUntilCheckIn = Math.round((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilCheckIn < 3) {
        // Less than 3 days: charge 1 night rate per room
        totalFee += b.roomRate;
      }
    });
    return totalFee;
  };

  const handleConfirmCancellation = () => {
    if (!pendingCancellation) return;
    const { selectedBookingIds, reason } = pendingCancellation;
    const fee = calculateCancellationFee(pendingCancellation);
    const waive = pendingCancellation.policyAdherence === "WAIVE_FULL_REFUND";

    if (selectedBookingIds.length > 1) {
      cancelMultipleBookings(selectedBookingIds, {
        reason: reason.trim() || undefined,
        cancellationFee: fee,
        waiveFee: waive,
      });
    } else if (selectedBookingIds.length === 1) {
      cancelBooking(selectedBookingIds[0], {
        reason: reason.trim() || undefined,
        cancellationFee: fee,
        waiveFee: waive,
      });
    }

    setPendingCancellation(null);
    setSelectedBookingId(null);
    setIsChargeModalOpen(false);
    setIsSelectingRoomInModal(false);
    setIsSelectingDateShiftInModal(false);
  };

  // Preset Colors for Group/Company Tags
  const COLOR_PALETTE = [
    { label: "น้ำเงินองค์กร (Blue)", color: "#2563eb", bgClass: "bg-blue-600" },
    { label: "ม่วงพรีเมียม (Purple)", color: "#7c3aed", bgClass: "bg-purple-600" },
    { label: "เขียวมรกต (Emerald)", color: "#059669", bgClass: "bg-emerald-600" },
    { label: "ชมพูสดใส (Pink)", color: "#db2777", bgClass: "bg-pink-600" },
    { label: "ส้มอิฐ (Amber)", color: "#d97706", bgClass: "bg-amber-600" },
    { label: "แดงทับทิม (Rose)", color: "#e11d48", bgClass: "bg-rose-600" },
    { label: "ฟ้าคราม (Cyan)", color: "#0891b2", bgClass: "bg-cyan-600" },
    { label: "เทาเข้ม (Slate)", color: "#475569", bgClass: "bg-slate-600" },
  ];

  // Dynamically compute days based on active view mode
  const days = React.useMemo(() => {
    if (viewMode === "10days") {
      return Array.from({ length: 10 }, (_, i) => {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        return d;
      });
    } else if (viewMode === "month") {
      const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      return Array.from({ length: totalDays }, (_, i) => {
        return new Date(selectedYear, selectedMonth, i + 1, 0, 0, 0);
      });
    } else if (viewMode === "custom") {
      const start = new Date(customStartDate + "T00:00:00");
      const end = new Date(customEndDate + "T00:00:00");
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return Array.from({ length: 10 }, (_, i) => {
          const d = new Date(baseDate);
          d.setDate(baseDate.getDate() + i);
          return d;
        });
      }
      const diffDays = Math.min(180, Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1));
      return Array.from({ length: diffDays }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    } else {
      // Year mode default fallback
      return Array.from({ length: 10 }, (_, i) => {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        return d;
      });
    }
  }, [viewMode, baseDate, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // 10-days navigation
  const prevDays = (count: number = 3) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - count);
    setBaseDate(d);
  };

  const nextDays = (count: number = 3) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + count);
    setBaseDate(d);
  };

  const resetToToday = () => {
    setBaseDate(getBangkokToday());
  };

  // Month navigation
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const resetToCurrentMonth = () => {
    const today = getBangkokToday();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
  };

  // Custom presets
  const setPresetPrevMonthToDec = () => {
    const today = getBangkokToday();
    const prevM = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    setCustomStartDate(toDateStr(prevM));
    setCustomEndDate(`${today.getFullYear()}-12-31`);
    setViewMode("custom");
  };

  const setPresetThisMonthToDec = () => {
    const today = getBangkokToday();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setCustomStartDate(toDateStr(firstDay));
    setCustomEndDate(`${today.getFullYear()}-12-31`);
    setViewMode("custom");
  };

  const setPresetNext30Days = () => {
    const today = getBangkokToday();
    const end = new Date(today);
    end.setDate(today.getDate() + 29);
    setCustomStartDate(toDateStr(today));
    setCustomEndDate(toDateStr(end));
    setViewMode("custom");
  };

  const setPresetNext60Days = () => {
    const today = getBangkokToday();
    const end = new Date(today);
    end.setDate(today.getDate() + 59);
    setCustomStartDate(toDateStr(today));
    setCustomEndDate(toDateStr(end));
    setViewMode("custom");
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "CHECKED_IN":
        return "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400";
      case "CONFIRMED":
        return "bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-amber-300";
      case "CHECKED_OUT":
        return "bg-gradient-to-r from-stone-400 to-stone-500 text-white border-stone-300";
      case "CANCELLED":
        return "bg-rose-500 text-white border-rose-300";
    }
  };

  const getStatusThai = (status: BookingStatus) => {
    switch (status) {
      case "CHECKED_IN": return "Checked-in (พักอยู่)";
      case "CONFIRMED": return "Confirmed (จองแล้ว)";
      case "CHECKED_OUT": return "Checked-out (ออกแล้ว)";
      case "CANCELLED": return "Cancelled (ยกเลิก)";
    }
  };

  const todayStr = toDateStr(getBangkokToday());
  const isBaseDateToday = toDateStr(baseDate) === todayStr;

  // Dynamic grid column sizing
  const columnMinWidth = days.length <= 10 ? 76 : days.length <= 31 ? 52 : 44;
  const gridMinWidth = 160 + days.length * columnMinWidth;

  // Month stats calculation for Year view
  const yearMonthlyStats = React.useMemo(() => {
    if (viewMode !== "year") return [];
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const monthStart = new Date(selectedYear, monthIndex, 1, 0, 0, 0);
      const monthEnd = new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59);
      const startStr = toDateStr(monthStart);
      const endStr = toDateStr(monthEnd);

      const monthBookings = filteredBookings.filter((b) => {
        if (b.status === "CANCELLED") return false;
        return b.checkInDate <= endStr && b.checkOutDate >= startStr;
      });

      const totalRevenue = monthBookings.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
      const totalRoomsCount = filteredRooms.length;
      const daysInMonth = monthEnd.getDate();
      const totalAvailableRoomNights = totalRoomsCount * daysInMonth;
      const bookedRoomNights = monthBookings.reduce((sum, b) => sum + (b.totalNights || 1), 0);
      const occupancyRate = totalAvailableRoomNights > 0 
        ? Math.min(100, Math.round((bookedRoomNights / totalAvailableRoomNights) * 100))
        : 0;

      return {
        monthIndex,
        monthName: THAI_MONTHS_FULL[monthIndex],
        monthShort: THAI_MONTHS_SHORT[monthIndex],
        bookingsCount: monthBookings.length,
        bookedRoomNights,
        occupancyRate,
        totalRevenue
      };
    });
  }, [viewMode, selectedYear, filteredBookings, filteredRooms]);

  // Mobile daily view data
  const mobileSelectedDateStr = toDateStr(mobileSelectedDate);
  const mobileDayBookings = React.useMemo(() => {
    return filteredBookings.filter((b) => {
      if (b.status === "CANCELLED") return false;
      return b.checkInDate <= mobileSelectedDateStr && b.checkOutDate > mobileSelectedDateStr;
    });
  }, [filteredBookings, mobileSelectedDateStr]);

  const mobileDayBookedRoomIds = new Set(mobileDayBookings.map((b) => b.roomId));
  const mobileVacantRoomsCount = filteredRooms.filter((r) => !mobileDayBookedRoomIds.has(r.id)).length;
  const mobileOccupiedRoomsCount = mobileDayBookings.length;

  return (
    <div className="space-y-4">
      
      {/* Toast Notification on Successful Room Move */}
      {moveSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{moveSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setMoveSuccessMessage("")}
            className="text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Calendar Header Controls & View Mode Bar */}
      <div className="bg-white dark:bg-[#101c42] p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3.5">
        
        {/* Row 1: Header + Badges */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-white truncate">
                ปฏิทินการเข้าพัก
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 truncate">
                {viewMode === "year" 
                  ? `ภาพรวมทั้งปี พ.ศ. ${selectedYear + 543} (ค.ศ. ${selectedYear})`
                  : `${formatDateThai(days[0])} – ${formatDateThai(days[days.length - 1])} (${days.length} วัน)`
                }
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Asia/Bangkok (UTC+7)</span>
            </span>
            {viewMode === "10days" && (
              isBaseDateToday ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
                  แถวแรกวันนี้
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 whitespace-nowrap">
                  กำลังดูย้อนหลัง
                </span>
              )
            )}
          </div>
        </div>

        {/* Row 2: View Mode Tabs & Display Mode (Horizontal scroll pill bar on mobile) */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {/* View Modes */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-stone-200 dark:border-stone-700 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("10days")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === "10days"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-stone-700 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-200/60 dark:hover:bg-slate-700"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>10 วัน (วันนี้)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === "month"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-stone-700 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-200/60 dark:hover:bg-slate-700"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>ทั้งเดือน</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("custom")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === "custom"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-stone-700 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-200/60 dark:hover:bg-slate-700"
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>กำหนดเอง</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("year")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === "year"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-stone-700 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-200/60 dark:hover:bg-slate-700"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ทั้งปี</span>
            </button>
          </div>

          {/* Timeline vs Mobile Daily toggle */}
          {viewMode !== "year" && (
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-stone-200 dark:border-stone-700 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => setMobileDisplay("timeline")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  mobileDisplay === "timeline"
                    ? "bg-white dark:bg-slate-700 text-stone-900 dark:text-white shadow-xs"
                    : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
                title="ตารางกานต์ชาร์ต"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ไทม์ไลน์</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileDisplay("daily")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  mobileDisplay === "daily"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
                title="การ์ดรายวัน สำหรับมือถือ"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>รายวัน</span>
              </button>
            </div>
          )}
        </div>

        {/* Row 3: Mode-specific Controls (Clean responsive grid/flex) */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
          {viewMode === "10days" && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              
              {/* Date Input + Today Quick Button */}
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-stone-300 text-xs font-semibold">
                  <CalendarIcon className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px] text-stone-400 font-normal whitespace-nowrap">เริ่มต้น:</span>
                  <input
                    type="date"
                    value={toDateStr(baseDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [y, m, d] = e.target.value.split("-").map(Number);
                        setBaseDate(new Date(y, m - 1, d, 0, 0, 0));
                      }
                    }}
                    className="bg-transparent text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer focus:outline-hidden w-full"
                    title="เลือกวันที่เริ่มต้นแถวแรก"
                  />
                </div>

                <button
                  type="button"
                  onClick={resetToToday}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isBaseDateToday
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs shadow-amber-600/30"
                      : "border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
                  }`}
                  title="ตั้งค่าให้แถวแรกเป็นวันนี้"
                >
                  <span>วันนี้</span>
                  {isBaseDateToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              </div>

              {/* Prev / Next 3 Days Button Pair (Perfect 50/50 on mobile, never orphaned) */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center shrink-0">
                <button
                  type="button"
                  onClick={() => prevDays(3)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300 transition-colors text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  title="ย้อนหลัง 3 วัน"
                >
                  <ChevronLeft className="w-4 h-4 text-stone-500" />
                  <span>ย้อนหลัง 3 วัน</span>
                </button>

                <button
                  type="button"
                  onClick={() => nextDays(3)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300 transition-colors text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  title="ถัดไป 3 วัน"
                >
                  <span>ถัดไป 3 วัน</span>
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                </button>
              </div>

            </div>
          )}

          {viewMode === "month" && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              
              {/* Month Navigation Stepper */}
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-amber-300/60 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 text-stone-900 dark:text-white text-xs sm:text-sm font-bold">
                  <CalendarIcon className="w-4 h-4 text-amber-600" />
                  <span>{THAI_MONTHS_FULL[selectedMonth]} {selectedYear + 543}</span>
                </div>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Month Quick Controls & Selectors */}
              <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
                <button
                  type="button"
                  onClick={resetToCurrentMonth}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 transition-colors cursor-pointer text-center"
                >
                  เดือนนี้
                </button>

                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-800 text-stone-800 dark:text-stone-200 cursor-pointer focus:outline-hidden"
                >
                  {THAI_MONTHS_FULL.map((name, idx) => (
                    <option key={idx} value={idx}>{name}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-800 text-stone-800 dark:text-stone-200 cursor-pointer focus:outline-hidden"
                >
                  {[selectedYear - 1, selectedYear, selectedYear + 1].map((yr) => (
                    <option key={yr} value={yr}>พ.ศ. {yr + 543}</option>
                  ))}
                </select>
              </div>

            </div>
          )}

          {viewMode === "custom" && (
            <div className="space-y-2.5">
              {/* Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-stone-300 text-xs font-semibold">
                  <span className="text-[11px] text-stone-400 font-normal whitespace-nowrap">ตั้งแต่วันที่:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer focus:outline-hidden w-full"
                  />
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-stone-300 text-xs font-semibold">
                  <span className="text-[11px] text-stone-400 font-normal whitespace-nowrap">ถึงวันที่:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer focus:outline-hidden w-full"
                  />
                </div>
              </div>

              {/* Presets Horizontal Pill Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <span className="text-[11px] text-stone-400 shrink-0 font-medium mr-1">ปุ่มลัด:</span>
                <button
                  type="button"
                  onClick={setPresetPrevMonthToDec}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                  title="เดือนที่แล้ว ถึง 31 ธันวาคม"
                >
                  เดือนที่แล้ว ถึง ธ.ค.
                </button>
                <button
                  type="button"
                  onClick={setPresetThisMonthToDec}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  เดือนนี้ ถึง ธ.ค.
                </button>
                <button
                  type="button"
                  onClick={setPresetNext30Days}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  30 วัน
                </button>
                <button
                  type="button"
                  onClick={setPresetNext60Days}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  60 วัน
                </button>
              </div>
            </div>
          )}

          {viewMode === "year" && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedYear(prev => prev - 1)}
                  className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                  title="ปีก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300/60 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 text-stone-900 dark:text-white text-xs sm:text-sm font-bold">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>ปี พ.ศ. {selectedYear + 543} (ค.ศ. {selectedYear})</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedYear(prev => prev + 1)}
                  className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                  title="ปีถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedYear(getBangkokToday().getFullYear())}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                ปีปัจจุบัน
              </button>
            </div>
          )}

        </div>

      </div>

      {/* VIEW MODE: YEAR OVERVIEW (12 Months Cards) */}
      {viewMode === "year" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {yearMonthlyStats.map((item) => (
              <div
                key={item.monthIndex}
                className="bg-white dark:bg-[#101c42] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      {item.monthName}
                    </h3>
                    <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      อัตราครองห้อง {item.occupancyRate}%
                    </span>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="w-full bg-stone-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.occupancyRate}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-stone-100 dark:border-stone-800/80 mb-3">
                    <div>
                      <span className="text-stone-400 block text-[10px]">จำนวนการจอง</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                        {item.bookingsCount} รายการ
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">ห้องพัก (Room Nights)</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                        {item.bookedRoomNights} คืน
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-500 mb-3">
                    <span>ยอดขายรวม:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100 font-mono">
                      ฿{item.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth(item.monthIndex);
                    setViewMode("month");
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-amber-50 dark:bg-slate-800 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-stone-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>เปิดดูปฏิทินรายวันเดือนนี้</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE: MOBILE DAILY AGENDA (Easy touch card interface for mobile) */}
      {viewMode !== "year" && mobileDisplay === "daily" && (
        <div className="space-y-4">
          
          {/* Mobile Date Switcher Bar */}
          <div className="bg-white dark:bg-[#101c42] p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                const prev = new Date(mobileSelectedDate);
                prev.setDate(prev.getDate() - 1);
                setMobileSelectedDate(prev);
              }}
              className="p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
              title="วันก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium text-stone-400">
                {mobileSelectedDateStr === todayStr ? "วันนี้ (Asia/Bangkok)" : "วันที่เลือก"}
              </span>
              <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-stone-900 dark:text-white">
                <CalendarIcon className="w-4 h-4 text-amber-600" />
                <span>{formatDateThai(mobileSelectedDate)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = new Date(mobileSelectedDate);
                next.setDate(next.getDate() + 1);
                setMobileSelectedDate(next);
              }}
              className="p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
              title="วันถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Status Summary Pills */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {mobileVacantRoomsCount}
              </div>
              <div>
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block">
                  ห้องว่างพร้อมจอง
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  จากทั้งหมด {filteredRooms.length} ห้อง
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {mobileOccupiedRoomsCount}
              </div>
              <div>
                <span className="text-xs text-amber-800 dark:text-amber-300 font-bold block">
                  มีผู้เข้าพัก / จองแล้ว
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400">
                  กำลังใช้งานในวันนี้
                </span>
              </div>
            </div>
          </div>

          {/* Room-by-room Mobile Card List */}
          <div className="space-y-3">
            {filteredRooms.map((room) => {
              const activeBooking = filteredBookings.find((b) => {
                if (b.status === "CANCELLED") return false;
                const segs = getBookingSegments(b);
                return segs.some(seg => seg.roomId === room.id && seg.startDate <= mobileSelectedDateStr && seg.endDate > mobileSelectedDateStr);
              });

              const isFullyPaid = activeBooking ? activeBooking.balanceDue <= 0 : true;

              return (
                <div
                  key={room.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    activeBooking
                      ? "bg-white dark:bg-[#101c42] border-stone-200 dark:border-stone-800 shadow-xs"
                      : "bg-stone-50/70 dark:bg-slate-900/40 border-dashed border-stone-300 dark:border-stone-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center font-serif font-bold text-base text-stone-900 dark:text-white shrink-0">
                        {room.roomNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-stone-900 dark:text-white">
                            {room.name}
                          </span>
                          {room.propertyId === "bugaan" ? (
                            <Building className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          ) : (
                            <Palmtree className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                        </div>
                        <span className="text-[11px] text-stone-500 block">
                          ประเภท: {room.type || "มาตรฐาน"}
                        </span>
                      </div>
                    </div>

                    <div>
                      {activeBooking ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs whitespace-nowrap shrink-0 ${getStatusColor(activeBooking.status)}`}>
                          {getStatusThai(activeBooking.status)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap shrink-0">
                          ห้องว่าง
                        </span>
                      )}
                    </div>
                  </div>

                  {/* If Room is Booked on this date */}
                  {activeBooking ? (
                    <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
                          <User className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {activeBooking.companyName ? `[${activeBooking.companyName}] ` : ""}
                            {activeBooking.guestName}
                          </span>
                        </div>
                        <span className="text-[10px] bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded text-stone-500 font-semibold">
                          ช่องทาง: {activeBooking.source}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 gap-1">
                        <span>เช็คอิน: {formatDateThai(activeBooking.checkInDate)}</span>
                        <span>เช็คเอาต์: {formatDateThai(activeBooking.checkOutDate)}</span>
                      </div>

                      {/* Payment Status Pill */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`w-2.5 h-2.5 rounded-full ${isFullyPaid ? "bg-blue-500" : "bg-red-500 animate-pulse"}`} />
                          <span className={isFullyPaid ? "text-blue-700 dark:text-blue-400 font-bold" : "text-red-600 dark:text-red-400 font-bold"}>
                            {isFullyPaid ? "ชำระครบแล้ว 100%" : `ค้างชำระ ฿${activeBooking.balanceDue.toLocaleString()}`}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBookingId(activeBooking.id);
                              setIsSelectingRoomInModal(true);
                              setIsSelectingDateShiftInModal(false);
                            }}
                            className="px-2.5 py-1.5 rounded-xl border border-amber-400 bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            title="ย้ายห้องพัก (เต็มช่วง หรือ ย้ายกลางคัน)"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span>ย้ายห้อง</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBookingId(activeBooking.id);
                              initiateDateShift(activeBooking);
                            }}
                            className="px-2.5 py-1.5 rounded-xl border border-blue-400 bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            title="เลื่อนวันเข้าพัก / ย้ายวัน"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>เลื่อนวัน</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedBookingId(activeBooking.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors cursor-pointer shadow-xs"
                          >
                            ดูบิล/ข้อมูล
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-2.5 border-t border-stone-200/50 dark:border-stone-800/50 flex items-center justify-between">
                      <span className="text-[11px] text-stone-400">
                        พร้อมเปิดรับแขก Walk-in หรือจองล่วงหน้า
                      </span>
                      <button
                        type="button"
                        onClick={() => onGoToBooking(room.id)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-stone-200 text-xs font-bold border border-stone-300 dark:border-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-600" />
                        <span>จองห้องนี้</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* VIEW MODE: TIMELINE GANTT CHART (Default Desktop & Scrollable Tablet/Mobile) */}
      {viewMode !== "year" && mobileDisplay === "timeline" && (
        <div className="bg-white dark:bg-[#101c42] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden select-none no-touch-select">
          
          {/* Scrollable Container - Unified smooth horizontal scroll without overlapping */}
          <div 
            ref={timelineScrollContainerRef}
            className="overflow-x-auto scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700 overscroll-x-contain select-none no-touch-select"
          >
            <div style={{ minWidth: `${gridMinWidth}px` }}>
              
              {/* Table Header Row: Days */}
              <div 
                style={{ gridTemplateColumns: `160px repeat(${days.length}, minmax(${columnMinWidth}px, 1fr))` }}
                className="grid border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-slate-800/60 sticky top-0 z-30"
              >
                <div className="p-3 text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wider border-r border-stone-200 dark:border-stone-800 flex items-center justify-between sticky left-0 z-30 bg-stone-50 dark:bg-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.06)] min-w-[160px] w-[160px]">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="text-amber-600 text-xs">▼</span> ทุกห้อง
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal">({filteredRooms.length})</span>
                </div>
                
                {days.map((day, idx) => {
                  const dayNum = day.getDate();
                  const dayName = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."][day.getDay()];
                  const dayStr = toDateStr(day);
                  const isToday = dayStr === todayStr;
                  const monthName = THAI_MONTHS_SHORT[day.getMonth()];
                  const showMonth = idx === 0 || day.getDate() === 1;

                  return (
                    <div
                      key={idx}
                      className={`p-2 text-center border-r border-stone-200 dark:border-stone-800 last:border-r-0 relative transition-colors ${
                        isToday 
                          ? "bg-amber-100/80 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-500/40" 
                          : ""
                      }`}
                    >
                      <div className={`text-[11px] font-medium ${isToday ? "text-amber-800 dark:text-amber-300 font-bold" : "text-stone-500 dark:text-stone-400"}`}>
                        {dayName}
                      </div>
                      <div className={`text-xs font-bold ${isToday ? "text-amber-700 dark:text-amber-400 font-extrabold text-sm" : "text-stone-800 dark:text-stone-200"}`}>
                        {dayNum} {showMonth ? monthName : ""}
                      </div>
                      {isToday && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[8px] font-extrabold bg-amber-600 text-white rounded-full shadow-xs">
                          วันนี้
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Table Body: Grouped by Room Type */}
              <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {Object.entries(roomsByType).map(([category, categoryRooms]) => {
                  const isCollapsed = collapsedCategories[category];
                  return (
                    <div key={category} className="border-b border-stone-200/80 dark:border-stone-800/80">
                      {/* Category Header Row - Full row with sticky inner content */}
                      <div 
                        onClick={() => toggleCategory(category)}
                        className="bg-stone-100/95 dark:bg-[#14204b] py-2 cursor-pointer hover:bg-stone-200/90 dark:hover:bg-[#19275c] transition-colors select-none border-y border-stone-200/60 dark:border-stone-800/60"
                      >
                        <div className="sticky left-0 inline-flex items-center gap-2 px-3 z-30">
                          <span className="text-stone-500 font-bold text-xs shrink-0">
                            {isCollapsed ? "▶" : "▼"}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-100 font-serif whitespace-nowrap">
                            {category}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-semibold whitespace-nowrap shrink-0">
                            {categoryRooms.length} ห้อง
                          </span>
                        </div>
                      </div>

                      {/* Room Rows in this Category */}
                      {!isCollapsed && categoryRooms.map((room) => {
                        const segmentsInRoom = filteredBookings.flatMap((b) => {
                          if (b.status === "CANCELLED") return [];
                          const segs = getBookingSegments(b);
                          return segs
                            .filter((seg) => seg.roomId === room.id)
                            .map((seg, segIdx) => ({
                              booking: b,
                              segment: seg,
                              segmentIndex: segIdx,
                              isTornLeft: seg.startDate > b.checkInDate,
                              isTornRight: seg.endDate < b.checkOutDate,
                            }));
                        });

                        return (
                          <div
                            key={room.id}
                            data-room-id={room.id}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                              if (draggedBookingId && dragOverRoomId !== room.id) {
                                setDragOverRoomId(room.id);
                              }
                            }}
                            onDragLeave={(e) => {
                              if (e.currentTarget === e.target) {
                                setDragOverRoomId(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const bId = e.dataTransfer.getData("text/plain") || draggedBookingId;
                              if (bId) {
                                const b = filteredBookings.find((item) => item.id === bId);
                                if (b) {
                                  initiateReallocation(b, room.id);
                                }
                              }
                              setDragOverRoomId(null);
                              setDraggedBookingId(null);
                            }}
                            style={{ gridTemplateColumns: `160px repeat(${days.length}, minmax(${columnMinWidth}px, 1fr))` }}
                            className={`grid min-h-[56px] transition-colors relative border-b border-stone-100 dark:border-stone-800/40 last:border-b-0 ${
                              dragOverRoomId === room.id
                                ? "bg-amber-100/90 dark:bg-amber-950/70 ring-2 ring-inset ring-amber-500 shadow-inner"
                                : "hover:bg-amber-50/20 dark:hover:bg-slate-800/30"
                            }`}
                          >
                            {/* Room Info Cell - Sticky to left with elevated z-index so timeline bars scroll underneath it */}
                            <div className={`p-2.5 border-r border-stone-200 dark:border-stone-800 flex items-center justify-between sticky left-0 z-25 shadow-[4px_0_10px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_10px_rgba(0,0,0,0.25)] min-w-[160px] w-[160px] transition-colors ${
                              dragOverRoomId === room.id
                                ? "bg-amber-500 text-white dark:bg-amber-600 ring-2 ring-amber-600 shadow-md"
                                : "bg-white dark:bg-[#101c42]"
                            }`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="min-w-0">
                                  <span className={`font-bold text-sm font-serif block ${
                                    dragOverRoomId === room.id ? "text-white" : "text-stone-900 dark:text-white"
                                  }`}>
                                    {room.roomNumber}
                                  </span>
                                  <span className={`text-[10px] truncate block ${
                                    dragOverRoomId === room.id ? "text-amber-100 font-semibold" : "text-stone-400"
                                  }`}>
                                    {dragOverRoomId === room.id ? "ปล่อยเพื่อย้ายห้องนี้" : room.name}
                                  </span>
                                </div>
                              </div>
                              {room.propertyId === "bugaan" ? (
                                <Building className={`w-3.5 h-3.5 shrink-0 ${dragOverRoomId === room.id ? "text-white" : "text-amber-600"}`} />
                              ) : (
                                <Palmtree className={`w-3.5 h-3.5 shrink-0 ${dragOverRoomId === room.id ? "text-white" : "text-emerald-600"}`} />
                              )}
                            </div>

                            {/* Day Cells & Bookings Placement */}
                            {days.map((day, dIdx) => {
                              const dayStr = toDateStr(day);
                              const isToday = dayStr === todayStr;

                              return (
                                <div
                                  key={dIdx}
                                  onClick={() => onGoToBooking(room.id)}
                                  title={`คลิกเพื่อจองห้อง ${room.roomNumber} วันที่ ${formatDateThai(day)}`}
                                  className={`border-r border-stone-200/60 dark:border-stone-800/60 last:border-r-0 relative group cursor-pointer ${
                                    isToday ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                                  }`}
                                >
                                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-amber-500/10 flex items-center justify-center pointer-events-none transition-opacity">
                                    <span className="text-[10px] font-bold text-amber-600">+</span>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Render Gantt Bars as absolute overlays on top of the date columns */}
                            {segmentsInRoom.map(({ booking: b, segment: seg, isTornLeft, isTornRight }) => {
                              const bStart = new Date(seg.startDate + "T00:00:00");
                              const bEnd = new Date(seg.endDate + "T00:00:00");
                              
                              const firstGridDate = days[0];
                              const lastGridDate = days[days.length - 1];

                              // Check overlap
                              if (bEnd < firstGridDate || bStart > lastGridDate) return null;

                              // Calculate start column offset & duration dynamically according to days.length
                              const diffFromStart = Math.round((bStart.getTime() - firstGridDate.getTime()) / (1000 * 60 * 60 * 24));
                              const startCol = Math.max(0, diffFromStart);
                              
                              const diffNights = Math.round((bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60 * 24));
                              const visibleDuration = Math.min(days.length - startCol, diffNights - Math.max(0, -diffFromStart));

                              if (visibleDuration <= 0) return null;

                              // Left percentage in the day columns area (after the 160px header)
                              const leftPercent = (startCol / days.length) * 100;
                              const widthPercent = (visibleDuration / days.length) * 100;

                              const hasCustomTag = Boolean(b.colorTag);
                              const isFullyPaid = b.balanceDue <= 0;
                              const isBeingDragged = draggedBookingId === b.id;

                              // Torn edge jagged clip-path (Image 5 style)
                              let clipPathStyle = "";
                              if (isTornLeft && isTornRight) {
                                clipPathStyle = "polygon(8px 0%, calc(100% - 8px) 0%, 100% 16.6%, calc(100% - 8px) 33.3%, 100% 50%, calc(100% - 8px) 66.6%, 100% 83.3%, calc(100% - 8px) 100%, 8px 100%, 0% 83.3%, 8px 66.6%, 0% 50%, 8px 33.3%, 0% 16.6%, 8px 0%)";
                              } else if (isTornRight) {
                                clipPathStyle = "polygon(0% 0%, calc(100% - 8px) 0%, 100% 16.6%, calc(100% - 8px) 33.3%, 100% 50%, calc(100% - 8px) 66.6%, 100% 83.3%, calc(100% - 8px) 100%, 0% 100%)";
                              } else if (isTornLeft) {
                                clipPathStyle = "polygon(8px 0%, 100% 0%, 100% 100%, 8px 100%, 0% 83.3%, 8px 66.6%, 0% 50%, 8px 33.3%, 0% 16.6%, 8px 0%)";
                              }

                              return (
                                <div
                                  key={`${b.id}-${seg.id || seg.startDate}`}
                                  draggable={true}
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", b.id);
                                    e.dataTransfer.effectAllowed = "move";
                                    setDraggedBookingId(b.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedBookingId(null);
                                    setDragOverRoomId(null);
                                  }}
                                  onTouchStart={(e) => handleBookingTouchStart(e, b)}
                                  onTouchMove={handleBookingTouchMove}
                                  onTouchEnd={handleBookingTouchEnd}
                                  onTouchCancel={handleBookingTouchCancel}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (dragJustEndedRef.current) return;
                                    if (!touchDrag?.isDragging && !isDraggingRef.current) {
                                      setSelectedBookingId(b.id);
                                    }
                                  }}
                                  title={`แตะค้างไว้เพื่อลากย้ายห้อง หรือแตะเพื่อดูรายละเอียด (${b.guestName}${isTornRight || isTornLeft ? " - มีการย้ายห้องกลางคัน" : ""})`}
                                  style={{
                                    left: `calc(160px + (100% - 160px) * ${leftPercent / 100})`,
                                    width: `calc((100% - 160px) * ${widthPercent / 100} - 4px)`,
                                    clipPath: clipPathStyle || undefined,
                                    userSelect: "none",
                                    WebkitUserSelect: "none",
                                    WebkitTouchCallout: "none",
                                    touchAction: isBeingDragged ? "none" : "manipulation",
                                    ...(hasCustomTag ? { backgroundColor: b.colorTag, borderColor: b.colorTag } : {})
                                  }}
                                  className={`absolute top-2 bottom-2 px-2.5 py-1 flex items-center justify-between text-xs font-semibold shadow-md cursor-grab active:cursor-grabbing border hover:brightness-110 transition-all z-10 text-white select-none no-touch-select [-webkit-touch-callout:none] [-webkit-user-select:none] ${
                                    !isTornLeft && !isTornRight ? "rounded-xl" : isTornLeft && !isTornRight ? "rounded-r-xl" : !isTornLeft && isTornRight ? "rounded-l-xl" : ""
                                  } ${hasCustomTag ? "shadow-md" : getStatusColor(b.status)} ${
                                    pressingBookingId === b.id ? "scale-[0.98] ring-2 ring-amber-400 brightness-110 shadow-lg" : ""
                                  } ${
                                    isBeingDragged ? "opacity-30 ring-2 ring-white scale-95 shadow-2xl" : ""
                                  }`}
                                >
                                  {/* Torn Left Jagged Notch Highlight */}
                                  {isTornLeft && (
                                    <span 
                                      className="absolute left-0 top-0 bottom-0 w-[5px] bg-white/40 border-r border-dashed border-white/80 pointer-events-none select-none"
                                      title="รอยฉีก: ย้ายมาจากห้องอื่นก่อนหน้านี้"
                                    />
                                  )}

                                  <div className={`truncate flex items-center gap-1.5 min-w-0 select-none pointer-events-none ${isTornLeft ? "pl-2" : ""} ${isTornRight ? "pr-2" : ""}`}>
                                    {/* Payment Indicator Dot */}
                                    <span 
                                      className={`w-2.5 h-2.5 rounded-full shrink-0 border border-white/80 shadow-xs ${
                                        isFullyPaid
                                          ? "bg-blue-400 ring-1 ring-blue-300"
                                          : "bg-red-500 ring-2 ring-red-300 animate-pulse"
                                      }`}
                                      title={
                                        isFullyPaid
                                          ? "จุดฟ้า: ลูกค้าจ่ายค่าห้องครบแล้ว 100%"
                                          : `จุดแดง: มียอดต้องเก็บเงินวันเข้าพัก ฿${b.balanceDue.toLocaleString()}`
                                      }
                                    />

                                    <span className="truncate select-none pointer-events-none">
                                      {b.companyName ? `[${b.companyName}] ${b.guestName}` : b.guestName}
                                    </span>
                                  </div>

                                  <div className={`flex items-center gap-1 shrink-0 ml-1 select-none pointer-events-none ${isTornRight ? "pr-2" : ""}`}>
                                    <span className="text-[10px] bg-black/30 px-1 rounded hidden sm:inline-block select-none pointer-events-none">
                                      {b.source}
                                    </span>
                                    {!isFullyPaid && (
                                      <span className="text-[9px] font-bold text-red-200 hidden md:inline-block select-none pointer-events-none">
                                        (฿{b.balanceDue.toLocaleString()})
                                      </span>
                                    )}
                                  </div>

                                  {/* Torn Right Jagged Notch Highlight */}
                                  {isTornRight && (
                                    <span 
                                      className="absolute right-0 top-0 bottom-0 w-[5px] bg-white/40 border-l border-dashed border-white/80 pointer-events-none select-none"
                                      title="รอยฉีก: ย้ายไปห้องอื่นหลังจากคืนนี้"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Legend */}
          <div className="p-3 bg-stone-50 dark:bg-slate-800/80 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-stone-500 font-bold">สถานะห้อง:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                <span>Checked-in (เข้าพัก)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                <span>Confirmed (รอเข้าพัก)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-stone-400 inline-block" />
                <span>Checked-out (เช็คเอาต์แล้ว)</span>
              </div>

              <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-1 hidden sm:block" />

              <span className="text-stone-500 font-bold">สถานะการเงิน:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 border border-white shadow-xs inline-block" />
                <span className="font-medium text-blue-700 dark:text-blue-300">จุดฟ้า = ลูกค้าจ่ายค่าห้องครบแล้ว</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-xs inline-block animate-pulse" />
                <span className="font-medium text-red-600 dark:text-red-400">จุดแดง = มียอดต้องเก็บเงินวันเข้าพัก</span>
              </div>
            </div>
            <div className="text-stone-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>คลิกที่แถบการจองเพื่อเปิดดูบิลและจัดการชำระเงิน</span>
            </div>
          </div>

        </div>
      )}

      {/* Floating Drag Preview on Mobile Touch Drag */}
      {touchDrag && touchDrag.isDragging && (
        <div
          style={{
            position: "fixed",
            left: `${touchDrag.curX}px`,
            top: `${touchDrag.curY - 45}px`,
            transform: "translate(-50%, -100%)",
            pointerEvents: "none",
            zIndex: 99999,
          }}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs shadow-2xl border-2 border-white flex items-center gap-2.5 select-none pointer-events-none animate-in zoom-in-95 duration-100 ring-4 ring-black/10"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <span className="block font-bold text-xs truncate max-w-[200px]">
              {touchDrag.booking.companyName ? `[${touchDrag.booking.companyName}] ` : ""}
              {touchDrag.booking.guestName}
            </span>
            <span className="text-[11px] text-amber-200 block font-medium">
              {dragOverRoomId ? (
                <>
                  เล็งห้อง: <span className="font-black text-white underline">ห้อง {filteredRooms.find((r) => r.id === dragOverRoomId)?.roomNumber}</span>
                  <span className="block text-[10px] text-amber-100 font-normal">ปล่อยนิ้วเพื่อยืนยันการย้าย</span>
                </>
              ) : (
                "ลากนิ้วไปที่แถวห้องที่ต้องการย้าย"
              )}
            </span>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedBookingId(null);
              setIsChargeModalOpen(false);
            }
          }}
        >
          <div 
            className="relative bg-white dark:bg-[#0c132c] rounded-3xl max-w-lg w-full shadow-2xl border border-amber-300/40 dark:border-amber-700/40 max-h-[calc(100vh-2rem)] sm:max-h-[85vh] flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header - Clean & Professional */}
            <div className="px-5 py-3.5 border-b border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-[#0c132c]/95 backdrop-blur-xs flex items-center justify-between shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs border border-amber-500/20 shrink-0">
                  <Hotel className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-stone-900 dark:text-white tracking-tight truncate">
                      ห้อง {selectedBooking.roomNumber}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/30 shrink-0">
                      {selectedBooking.source}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono truncate">
                    เลขที่จอง: {selectedBooking.bookingNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold shadow-xs border whitespace-nowrap shrink-0 ${getStatusColor(selectedBooking.status)}`}>
                  {getStatusThai(selectedBooking.status)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBookingId(null);
                    setIsChargeModalOpen(false);
                    setIsSelectingRoomInModal(false);
                    setIsSelectingDateShiftInModal(false);
                  }}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-all cursor-pointer"
                  title="ปิดหน้าต่าง"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden flex-1 min-h-0 space-y-4 text-xs sm:text-sm">
              
              {/* Quick Actions Control Strip - 4 evenly balanced action cards */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectingRoomInModal(!isSelectingRoomInModal);
                    if (!isSelectingRoomInModal) {
                      setIsSelectingDateShiftInModal(false);
                      setPendingDateShift(null);
                    }
                  }}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[52px] ${
                    isSelectingRoomInModal
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                      : "bg-stone-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700"
                  }`}
                  title="เปลี่ยนห้อง / ย้ายห้องพัก"
                >
                  <ArrowLeftRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="truncate">ย้ายห้อง</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isSelectingDateShiftInModal) {
                      setIsSelectingDateShiftInModal(false);
                      setPendingDateShift(null);
                    } else {
                      initiateDateShift(selectedBooking);
                    }
                  }}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[52px] ${
                    isSelectingDateShiftInModal
                      ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                      : "bg-stone-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700"
                  }`}
                  title="เลื่อนวันเข้าพัก / ปรับวัน"
                >
                  <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="truncate">เลื่อนวัน</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsChargeModalOpen(!isChargeModalOpen)}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[52px] ${
                    isChargeModalOpen
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                      : "bg-stone-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700"
                  }`}
                  title="เพิ่มค่าใช้จ่ายเข้าบิลห้องพัก"
                >
                  <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate">+ค่าใช้จ่าย</span>
                </button>

                {onGoToFolio ? (
                  <button
                    type="button"
                    onClick={() => {
                      onGoToFolio(selectedBooking.id);
                      setSelectedBookingId(null);
                    }}
                    className="py-2 px-1 rounded-xl border bg-stone-50 dark:bg-slate-800/60 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[52px]"
                    title="ดูบิลเฉพาะห้องนี้"
                  >
                    <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="truncate">ดูบิลห้อง</span>
                  </button>
                ) : (
                  <div />
                )}
              </div>
              
              {/* Quick Room Move Drawer inside Modal */}
              {isSelectingRoomInModal && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 dark:from-[#131d42] dark:to-[#0f1838] border border-amber-300/80 dark:border-amber-700/80 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900 dark:text-amber-200 flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
                      เลือกห้องพักใหม่ที่ต้องการย้ายไป:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSelectingRoomInModal(false)}
                      className="text-[11px] text-stone-400 hover:text-stone-600 font-semibold cursor-pointer"
                    >
                      ปิด
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {filteredRooms
                      .filter((r) => r.id !== selectedBooking.roomId)
                      .map((targetR) => {
                        // Check conflict
                        const isBusy = filteredBookings.some((b) => {
                          if (b.id === selectedBooking.id || b.roomId !== targetR.id || b.status === "CANCELLED") return false;
                          return b.checkInDate < selectedBooking.checkOutDate && b.checkOutDate > selectedBooking.checkInDate;
                        });

                        const priceDiff = (targetR.pricePerNight - selectedBooking.roomRate) * selectedBooking.totalNights;

                        return (
                          <button
                            key={targetR.id}
                            type="button"
                            onClick={() => initiateReallocation(selectedBooking, targetR.id)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isBusy 
                                ? "bg-stone-100 dark:bg-slate-800/50 border-stone-200 dark:border-stone-700 opacity-60 hover:opacity-100" 
                                : "bg-white dark:bg-slate-800 border-amber-300/70 dark:border-amber-700/70 hover:border-amber-500 hover:shadow-xs"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-serif font-bold text-sm text-stone-900 dark:text-white">
                                  {targetR.roomNumber}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${isBusy ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"}`}>
                                  {isBusy ? "มีจองซ้อน" : "ว่าง"}
                                </span>
                              </div>
                              <span className="text-[10px] text-stone-500 truncate block">
                                {targetR.type}
                              </span>
                            </div>
                            <div className="mt-1 pt-1 border-t border-stone-100 dark:border-stone-700 flex items-center justify-between text-[10px]">
                              <span className="font-bold text-stone-700 dark:text-stone-300">
                                ฿{targetR.pricePerNight.toLocaleString()}
                              </span>
                              {priceDiff !== 0 && (
                                <span className={`font-semibold ${priceDiff > 0 ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"}`}>
                                  {priceDiff > 0 ? `+฿${priceDiff.toLocaleString()}` : `-฿${Math.abs(priceDiff).toLocaleString()}`}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Quick Date Shift Drawer inside Modal */}
              {isSelectingDateShiftInModal && pendingDateShift && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 dark:from-[#0f1d38] dark:to-[#0a162b] border border-blue-300/80 dark:border-blue-700/80 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900 dark:text-blue-200 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                      เลื่อนวันเข้าพัก / ย้ายวัน (ห้อง {pendingDateShift.room.roomNumber}):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectingDateShiftInModal(false);
                        setPendingDateShift(null);
                      }}
                      className="text-[11px] text-stone-400 hover:text-stone-600 font-semibold cursor-pointer"
                    >
                      ปิด
                    </button>
                  </div>

                  {/* Quick Shortcut Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => shiftBookingDays(-1)}
                      className="px-2 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-stone-700 dark:text-stone-200 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer"
                      title="เลื่อนวันทั้งก้อนเร็วขึ้น 1 วัน"
                    >
                      -1 วัน (เร็วขึ้น)
                    </button>
                    <button
                      type="button"
                      onClick={() => shiftBookingDays(1)}
                      className="px-2 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-stone-700 dark:text-stone-200 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer"
                      title="เลื่อนวันทั้งก้อนช้าลง 1 วัน"
                    >
                      +1 วัน (ถัดไป)
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustBookingNights(1)}
                      className="px-2 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-stone-700 dark:text-stone-200 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer"
                      title="เพิ่มจำนวนวันพักอีก 1 คืน"
                    >
                      +1 คืน
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustBookingNights(-1)}
                      disabled={pendingDateShift.newTotalNights <= 1}
                      className="px-2 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-stone-700 dark:text-stone-200 hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                      title="ลดจำนวนวันพักลง 1 คืน"
                    >
                      -1 คืน
                    </button>
                  </div>

                  {/* Date Inputs */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-stone-500 font-medium block mb-1">
                        วันเช็คอินใหม่:
                      </label>
                      <input
                        type="date"
                        value={pendingDateShift.newCheckInDate}
                        onChange={(e) => updateDateShiftState(pendingDateShift.booking, pendingDateShift.room, e.target.value, pendingDateShift.newCheckOutDate)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-500 font-medium block mb-1">
                        วันเช็คเอาต์ใหม่:
                      </label>
                      <input
                        type="date"
                        value={pendingDateShift.newCheckOutDate}
                        onChange={(e) => updateDateShiftState(pendingDateShift.booking, pendingDateShift.room, pendingDateShift.newCheckInDate, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white text-xs font-semibold"
                      />
                    </div>
                  </div>

                  {/* Conflict Alert or Summary */}
                  {pendingDateShift.hasConflict ? (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">ช่วงวันที่ใหม่มีบุ๊กกิ้งซ้อนในห้องนี้</span>
                        <span className="text-[11px]">บุ๊กกิ้ง #{pendingDateShift.conflictingBooking?.bookingNumber} ({pendingDateShift.conflictingBooking?.guestName})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                      <span>จำนวน: <strong>{pendingDateShift.newTotalNights} คืน</strong></span>
                      <span>ยอดค่าห้อง: <strong>฿{pendingDateShift.newRoomTotal.toLocaleString()}</strong> ({pendingDateShift.priceDiff > 0 ? `+฿${pendingDateShift.priceDiff.toLocaleString()}` : pendingDateShift.priceDiff < 0 ? `-฿${Math.abs(pendingDateShift.priceDiff).toLocaleString()}` : "เท่าเดิม"})</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectingDateShiftInModal(false);
                        setPendingDateShift(null);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      disabled={pendingDateShift.hasConflict || pendingDateShift.newCheckInDate >= pendingDateShift.newCheckOutDate}
                      onClick={confirmDateShift}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>บันทึกการเปลี่ยนวัน</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Cancelled Banner if Booking is Cancelled */}
              {selectedBooking.status === "CANCELLED" && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold">การจองนี้ถูกยกเลิกแล้ว (Cancelled)</p>
                    {selectedBooking.cancelledAt && (
                      <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                        ยกเลิกเมื่อ: {formatDateThai(selectedBooking.cancelledAt)}
                      </p>
                    )}
                    {selectedBooking.cancellationReason && (
                      <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                        เหตุผล: {selectedBooking.cancellationReason}
                      </p>
                    )}
                    {typeof selectedBooking.cancellationFee === "number" && (
                      <p className="text-[11px] font-semibold text-rose-900 dark:text-rose-200">
                        ค่าธรรมเนียมยกเลิก: ฿{formatCurrency(selectedBooking.cancellationFee)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Guest Profile Box */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200/80 dark:border-stone-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-white">
                    <User className="w-4 h-4 text-amber-600" />
                    <span>{selectedBooking.guestName}</span>
                    {selectedBooking.colorTag && (
                      <span 
                        className="w-3 h-3 rounded-full border border-white shadow-xs inline-block ml-1"
                        style={{ backgroundColor: selectedBooking.colorTag }}
                        title="แท็กสีกำหนดเอง"
                      />
                    )}
                  </div>
                  <span className="text-stone-500 text-xs">
                    ผู้ใหญ่ {selectedBooking.adults} | เด็ก {selectedBooking.kids}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 dark:text-stone-300 pt-1 border-t border-stone-200/50 dark:border-stone-700/50 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    <span>{selectedBooking.guestPhone || "08X-XXX-XXXX"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
                    <span>{formatDateThai(selectedBooking.checkInDate)} – {formatDateThai(selectedBooking.checkOutDate)} ({selectedBooking.totalNights} คืน)</span>
                  </div>
                </div>
              </div>

              {/* Room Allocations Breakdown (Matching Little Hotelier - Image 4) */}
              {(() => {
                const segments = getBookingSegments(selectedBooking);
                const isSplitStay = segments.length > 1;

                return (
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200/80 dark:border-stone-700/60 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <BedDouble className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-stone-900 dark:text-white block truncate">
                            การจัดสรรห้องพัก (Room Allocations)
                          </span>
                          <span className="text-[10px] text-stone-400 block truncate">
                            {isSplitStay ? `แยกพัก ${segments.length} ห้องตลอดการเข้าพัก` : "พักห้องเดียวตลอดการจอง"}
                          </span>
                        </div>
                      </div>

                      {isSplitStay && (
                        <button
                          type="button"
                          onClick={() => mergeSegmentsBackToOriginal(selectedBooking)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-400 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                          title="รวมช่วงเข้าพักกลับเป็นห้องเดิมห้องเดียว"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-600" />
                          <span>ย้ายกลับห้องเดิม</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {segments.map((seg, sIdx) => {
                        const curRoom = filteredRooms.find((r) => r.id === seg.roomId) || {
                          id: seg.roomId,
                          roomNumber: seg.roomNumber,
                          type: "Standard",
                          pricePerNight: seg.roomRate,
                        };
                        const nights = computeDaysDiff(seg.startDate, seg.endDate);
                        const isOriginalRoom = seg.roomId === selectedBooking.roomId;

                        return (
                          <div
                            key={seg.id || sIdx}
                            className={`p-3 rounded-xl border text-xs transition-colors space-y-2 ${
                              !isOriginalRoom
                                ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300/80 dark:border-amber-700/80 shadow-2xs"
                                : "bg-white dark:bg-slate-900 border-stone-200 dark:border-stone-700 shadow-2xs"
                            }`}
                          >
                            {/* Segment Header */}
                            <div className="flex items-center justify-between gap-2 font-bold">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-stone-900 dark:text-white truncate">
                                  ช่วงที่ {sIdx + 1}: {curRoom.type || "ห้องพัก"}
                                </span>
                                {!isOriginalRoom && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold shrink-0">
                                    ย้ายห้อง
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 shrink-0">
                                {formatDateThai(seg.startDate)} – {formatDateThai(seg.endDate)} ({nights} คืน)
                              </span>
                            </div>

                            {/* Dropdown Container - Clean, properly sized, responsive */}
                            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                              <div className="flex items-center justify-between sm:justify-start gap-2">
                                <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                                  ห้องพัก (Room):
                                </span>
                                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 sm:hidden">
                                  ฿{curRoom.pricePerNight?.toLocaleString()}/คืน
                                </span>
                              </div>

                              <div className="relative w-full sm:w-auto sm:min-w-[220px] max-w-full">
                                <select
                                  value={seg.roomId}
                                  onChange={(e) => handleSegmentRoomChange(selectedBooking, sIdx, e.target.value)}
                                  className="w-full pl-3 pr-8 py-1.5 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-800 dark:text-stone-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500 truncate appearance-none"
                                >
                                  {filteredRooms.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      ห้อง {r.roomNumber} - {r.type || "มาตรฐาน"} (฿{r.pricePerNight.toLocaleString()}/คืน)
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Group / Company & Color Tag Customization Box */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-300/80 dark:border-amber-700/80 space-y-2.5">
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-4 h-4 rounded-full border border-white shadow-xs shrink-0" 
                      style={{ backgroundColor: selectedBooking.colorTag || "#3b82f6" }}
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-stone-900 dark:text-amber-200 truncate block">
                        {selectedBooking.companyName ? `บริษัท/คณะ: ${selectedBooking.companyName}` : "กลุ่มแขกบริษัท / คนจองเดียวกัน"}
                      </span>
                      {hasGroup && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold inline-block mt-0.5">
                          กลุ่มเดียวกัน {relatedGroupBookings.length} ห้อง
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingColorTag(!isEditingColorTag)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-400 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 transition-colors cursor-pointer shrink-0 ml-auto sm:ml-0"
                  >
                    {isEditingColorTag ? "ปิดแก้ไข" : "แก้ไขแท็กสี / คณะ"}
                  </button>
                </div>

                {colorTagSuccessMsg && (
                  <div className="p-2 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{colorTagSuccessMsg}</span>
                  </div>
                )}

                {/* Inline Color Tag & Company Editor */}
                {isEditingColorTag && (
                  <div className="p-3 bg-white dark:bg-[#101938] rounded-xl border border-amber-300/60 space-y-3 animate-in fade-in">
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        ชื่อบริษัท / ผู้จองหลัก (เช่น บ.มิตรเทคนิคัล, คณะทัวร์ Sayoo):
                      </label>
                      <input
                        type="text"
                        placeholder="ระบุชื่อบริษัทหรือคณะ..."
                        value={editingCompanyName}
                        onChange={(e) => setEditingCompanyName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-900 text-stone-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        เลือกแท็กสีสำหรับแสดงบนไทม์ไลน์:
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {COLOR_PALETTE.map((pal) => (
                          <button
                            key={pal.color}
                            type="button"
                            onClick={() => setCustomTagColor(pal.color)}
                            className={`h-7 rounded-lg transition-transform flex items-center justify-center cursor-pointer shadow-xs ${
                              customTagColor === pal.color ? "ring-2 ring-stone-900 dark:ring-white scale-110 font-bold text-white text-xs" : "hover:scale-105"
                            }`}
                            style={{ backgroundColor: pal.color }}
                            title={pal.label}
                          >
                            {customTagColor === pal.color && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {hasGroup && (
                      <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={applyToAllGroup}
                          onChange={(e) => setApplyToAllGroup(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                        />
                        <span>ปรับใช้แท็กสีนี้กับทุกห้องในกลุ่ม ({relatedGroupBookings.map(b => b.roomNumber).join(", ")})</span>
                      </label>
                    )}

                    <div className="flex justify-end gap-2 pt-1 border-t border-stone-200 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={() => setIsEditingColorTag(false)}
                        className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 text-xs"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const targetCompany = editingCompanyName.trim() || selectedBooking.guestName;
                          if (applyToAllGroup && hasGroup) {
                            const groupTarget = selectedBooking.groupBookingId || selectedBooking.companyName || selectedBooking.guestName;
                            updateGroupColorTag(groupTarget, customTagColor, targetCompany);
                            setColorTagSuccessMsg(`อัปเดตแท็กสีและชื่อคณะให้กับทุกห้อง (${relatedGroupBookings.length} ห้อง) เรียบร้อย!`);
                          } else {
                            updateBooking(selectedBooking.id, {
                              colorTag: customTagColor,
                              companyName: targetCompany,
                              groupBookingId: selectedBooking.groupBookingId || `GRP-${Date.now()}`
                            });
                            setColorTagSuccessMsg(`อัปเดตแท็กสีห้อง ${selectedBooking.roomNumber} เรียบร้อย!`);
                          }
                          setTimeout(() => {
                            setColorTagSuccessMsg("");
                            setIsEditingColorTag(false);
                          }, 1500);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                      >
                        บันทึกแท็กสี
                      </button>
                    </div>
                  </div>
                )}

                {/* Group Details: List of rooms in the same company/group with breakdowns */}
                {hasGroup && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                      <span>รายละเอียดค่าใช้จ่ายของแต่ละห้องในคณะ:</span>
                      <span className="font-extrabold">รวม {relatedGroupBookings.length} ห้อง</span>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {relatedGroupBookings.map((gb) => {
                        const isCurrent = gb.id === selectedBooking.id;
                        return (
                          <div
                            key={gb.id}
                            onClick={() => setSelectedBookingId(gb.id)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                              isCurrent 
                                ? "bg-white dark:bg-slate-800 border-amber-400 dark:border-amber-600 shadow-xs" 
                                : "bg-amber-500/5 dark:bg-slate-900/60 border-stone-200/60 dark:border-stone-800 hover:bg-amber-500/10"
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <div className="flex items-center gap-1.5">
                                <span className="font-serif text-amber-700 dark:text-amber-400">ห้อง {gb.roomNumber}</span>
                                <span className="text-stone-700 dark:text-stone-300 font-normal">({gb.guestName})</span>
                                {isCurrent && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-white font-bold">ห้องนี้</span>
                                )}
                              </div>
                              <span className="text-stone-900 dark:text-white font-extrabold">
                                {formatCurrency(gb.grandTotal)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-1 pt-1 border-t border-stone-100 dark:border-stone-800">
                              <span>ค่าห้อง {gb.totalNights} คืน: {formatCurrency(gb.roomTotal)} {gb.posChargesTotal > 0 ? `| ค่าบริการ +${formatCurrency(gb.posChargesTotal)}` : ""}</span>
                              <span className={gb.balanceDue > 0 ? "text-rose-600 font-bold" : "text-emerald-600 font-medium"}>
                                {gb.balanceDue > 0 ? `ค้าง: ${formatCurrency(gb.balanceDue)}` : "ชำระครบแล้ว"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Group Total Sum Box */}
                    <div className="p-2.5 rounded-xl bg-amber-600/10 dark:bg-amber-500/20 border border-amber-300/80 dark:border-amber-700/80 flex items-center justify-between text-xs font-bold text-stone-900 dark:text-white">
                      <span>ยอดรวมทั้งคณะ ({relatedGroupBookings.length} ห้อง):</span>
                      <span className="font-serif text-sm text-amber-700 dark:text-amber-300 font-extrabold">
                        {formatCurrency(relatedGroupBookings.reduce((sum, b) => sum + b.grandTotal, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {selectedBooking.hasExtraBed && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
                  <span>เพิ่มเตียงเสริม {selectedBooking.extraBedCount} เตียง</span>
                  <span className="font-bold">+{formatCurrency(selectedBooking.extraBedTotal)}</span>
                </div>
              )}

              {selectedBooking.specialRequests && (
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200/60 dark:border-stone-700/50 text-stone-600 dark:text-stone-300 text-xs">
                  <strong>หมายเหตุพิเศษ:</strong> {selectedBooking.specialRequests}
                </div>
              )}

              {/* Itemized Room Orders / Custom charges for this booking */}
              {(() => {
                const bookingOrders = orders.filter((o) => o.bookingId === selectedBooking.id);
                if (bookingOrders.length === 0) return null;
                return (
                  <div className="p-3.5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-300">
                      <span>รายการอาหาร / ค่าบริการพิเศษ ({bookingOrders.length} รายการ)</span>
                      <span>รวม {formatCurrency(selectedBooking.posChargesTotal)}</span>
                    </div>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {bookingOrders.map((ord) => (
                        <div key={ord.id} className="flex justify-between items-center text-[11px] bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-stone-200/50 dark:border-stone-700/50">
                          <span className="truncate max-w-[200px] text-stone-700 dark:text-stone-200">
                            {ord.items.map((i) => i.name).join(", ")}
                          </span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            +{formatCurrency(ord.totalAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Financial Balance Summary Box */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200 dark:border-stone-700 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600 dark:text-stone-300">
                  <span>ค่าห้องพัก ({selectedBooking.totalNights} คืน)</span>
                  <span>{formatCurrency(selectedBooking.roomTotal)}</span>
                </div>
                {selectedBooking.posChargesTotal > 0 && (
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>ยอดค่าบริการพิเศษ / รูมเซอร์วิส</span>
                    <span>+{formatCurrency(selectedBooking.posChargesTotal)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between font-extrabold text-sm text-stone-900 dark:text-white">
                  <span>ยอดรวมทั้งสิ้น (Grand Total)</span>
                  <span className="text-amber-600 dark:text-amber-400">{formatCurrency(selectedBooking.grandTotal)}</span>
                </div>
                <div className="flex justify-between pt-1 text-xs font-semibold">
                  <span className="text-emerald-600">ชำระแล้ว: {formatCurrency(selectedBooking.depositPaid)}</span>
                  <span className={selectedBooking.balanceDue > 0 ? "text-rose-600 font-bold" : "text-stone-400"}>
                    ยอดคงค้าง: {formatCurrency(selectedBooking.balanceDue)}
                  </span>
                </div>
              </div>

              {/* Success message when charge added */}
              {chargeSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{chargeSuccessMsg}</span>
                </div>
              )}

              {/* Add Custom Charge Inline Form */}
              {isChargeModalOpen && (
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl border border-amber-300/80 dark:border-amber-800/80 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 dark:text-amber-200 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      เพิ่มค่าใช้จ่ายเข้าบิลห้อง {selectedBooking.roomNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsChargeModalOpen(false)}
                      className="text-stone-400 hover:text-stone-600 text-xs"
                    >
                      ยกเลิก
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "ซักรีด", title: "ค่าบริการซักรีดเสื้อผ้า", amount: 180 },
                      { label: "ของเสียหาย", title: "ค่าชดเชยของใช้เสียหาย", amount: 500 },
                      { label: "ทำความสะอาดพิเศษ", title: "ค่าทำความสะอาดคราบหนักพิเศษ", amount: 350 },
                      { label: "รถรับส่ง", title: "ค่าบริการรถตู้รับส่งสนามบิน", amount: 600 },
                      { label: "มินิบาร์เพิ่ม", title: "เครื่องดื่มมินิบาร์พิเศษ", amount: 250 },
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setChargeTitle(preset.title);
                          setChargeAmount(preset.amount);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-stone-700 dark:text-stone-200 hover:bg-amber-100 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="ระบุรายการ เช่น ค่าซักรีด, ค่าทำแก้วแตก..."
                      value={chargeTitle}
                      onChange={(e) => setChargeTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2 text-xs text-stone-400 font-bold">฿</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="จำนวนเงิน"
                          value={chargeAmount}
                          onChange={(e) => setChargeAmount(Number(e.target.value))}
                          className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!chargeTitle || chargeAmount <= 0}
                        onClick={() => {
                          addCustomChargeToBooking(selectedBooking.id, chargeTitle, Number(chargeAmount));
                          setChargeSuccessMsg(`เพิ่ม "${chargeTitle}" (${formatCurrency(chargeAmount)}) สำเร็จ!`);
                          setChargeTitle("");
                          setIsChargeModalOpen(false);
                          setTimeout(() => {
                            setChargeSuccessMsg("");
                          }, 3000);
                        }}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
                      >
                        ยืนยัน
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Sticky Footer Actions - Clean, Streamlined & Mobile-Friendly */}
            <div className="px-5 py-3 border-t border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-[#0c132c]/95 backdrop-blur-xs shrink-0 sticky bottom-0 z-20 space-y-2">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBookingId(null);
                    setIsChargeModalOpen(false);
                    setIsSelectingRoomInModal(false);
                    setIsSelectingDateShiftInModal(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors min-h-[42px] cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>

                {/* Primary LifeCycle Button */}
                {selectedBooking.status === "CONFIRMED" && (
                  <button
                    type="button"
                    onClick={() => {
                      setTimelineCheckInBooking(selectedBooking);
                      setTimelineIdCardImage(selectedBooking.guestIdCardImage || null);
                      setTimelineSignatureImage(selectedBooking.guestSignatureImage || null);
                      setSelectedBookingId(null);
                      setIsChargeModalOpen(false);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 min-h-[42px] cursor-pointer transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Check-in เข้าพัก</span>
                  </button>
                )}

                {selectedBooking.status === "CHECKED_IN" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onGoToFolio) {
                        onGoToFolio(selectedBooking.id);
                      } else {
                        checkOutBooking(selectedBooking.id);
                      }
                      setSelectedBookingId(null);
                      setIsChargeModalOpen(false);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 min-h-[42px] cursor-pointer transition-all"
                  >
                    <DoorOpen className="w-4 h-4" />
                    <span>เช็คบิล / Check-out</span>
                  </button>
                )}

                {selectedBooking.status === "CHECKED_OUT" && onGoToFolio && (
                  <button
                    type="button"
                    onClick={() => {
                      onGoToFolio(selectedBooking.id);
                      setSelectedBookingId(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5 min-h-[42px] cursor-pointer transition-all"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>ดูใบเสร็จ / Folio</span>
                  </button>
                )}
              </div>

              {/* Secondary Actions Line: Group Folio and Subtle Cancellation */}
              <div className="flex items-center justify-between text-xs pt-0.5 px-1">
                {hasGroup && onGoToFolio ? (
                  <button
                    type="button"
                    onClick={() => {
                      onGoToFolio(selectedBooking.id);
                      setSelectedBookingId(null);
                    }}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-600" />
                    <span>ออกบิลรวมทั้งคณะ ({relatedGroupBookings.length} ห้อง)</span>
                  </button>
                ) : (
                  <div />
                )}

                {selectedBooking.status !== "CANCELLED" && (
                  <button
                    type="button"
                    onClick={() => initiateCancellation(selectedBooking)}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline flex items-center gap-1 ml-auto cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>ยกเลิกการจองห้องพัก</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Room Move Confirmation Pop-up Modal */}
      {pendingRoomMove && (
        <div 
          className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setPendingRoomMove(null)}
        >
          <div 
            className="relative bg-white dark:bg-[#0c132c] rounded-3xl max-w-lg w-full shadow-2xl border border-amber-400/50 dark:border-amber-600/50 overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-[#101c42] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                    ยืนยันการย้ายห้องพัก (Room Move)
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {pendingRoomMove.booking.guestName} | เลขที่จอง #{pendingRoomMove.booking.bookingNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingRoomMove(null)}
                className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-300 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs sm:text-sm">
              
              {/* Move Scope Mode Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-slate-800/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => updatePartialMoveConfig(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    !pendingRoomMove.isPartialMove
                      ? "bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-xs border border-stone-200 dark:border-stone-700"
                      : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
                  <span>ย้ายทั้งการจอง ({pendingRoomMove.totalNights} คืน)</span>
                </button>

                <button
                  type="button"
                  onClick={() => updatePartialMoveConfig(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    pendingRoomMove.isPartialMove
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  }`}
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>ย้ายเฉพาะบางคืน (ย้ายกลางคัน)</span>
                </button>
              </div>

              {/* From Room -> To Room Visual Card */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-stone-700">
                {/* Current Room */}
                <div className="text-center p-2 rounded-xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-stone-700">
                  <span className="text-[10px] text-stone-400 font-semibold block uppercase">ห้องเดิม</span>
                  <span className="text-lg font-serif font-extrabold text-stone-900 dark:text-white block">
                    {pendingRoomMove.currentRoom.roomNumber}
                  </span>
                  <span className="text-[11px] text-stone-500 block truncate">
                    {pendingRoomMove.currentRoom.name}
                  </span>
                  <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mt-1">
                    ฿{pendingRoomMove.pricePerNightCurrent.toLocaleString()}/คืน
                  </span>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center justify-center px-1">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Target Room */}
                <div className="text-center p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block uppercase">ห้องใหม่</span>
                  <span className="text-lg font-serif font-extrabold text-amber-800 dark:text-amber-300 block">
                    {pendingRoomMove.targetRoom.roomNumber}
                  </span>
                  <span className="text-[11px] text-stone-600 dark:text-stone-300 block truncate">
                    {pendingRoomMove.targetRoom.name}
                  </span>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block mt-1">
                    ฿{pendingRoomMove.pricePerNightTarget.toLocaleString()}/คืน
                  </span>
                </div>
              </div>

              {/* If Partial Move: Show date selector and reason configuration */}
              {pendingRoomMove.isPartialMove ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Split className="w-4 h-4 text-amber-600" />
                      <span>กำหนดย้ายห้องกลางคัน (Mid-Stay Split Stay)</span>
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-full font-bold">
                      แยก 2 ช่วงเข้าพัก
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 block mb-1">
                        เริ่มย้ายเข้าห้องใหม่ตั้งแต่วันที่:
                      </label>
                      <input
                        type="date"
                        value={pendingRoomMove.moveStartDate}
                        min={pendingRoomMove.booking.checkInDate}
                        max={pendingRoomMove.booking.checkOutDate}
                        onChange={(e) => updatePartialMoveConfig(true, e.target.value, pendingRoomMove.moveEndDate)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 block mb-1">
                        อยู่ห้องใหม่จนถึงวันที่:
                      </label>
                      <input
                        type="date"
                        value={pendingRoomMove.moveEndDate}
                        min={pendingRoomMove.moveStartDate}
                        max={pendingRoomMove.booking.checkOutDate}
                        onChange={(e) => updatePartialMoveConfig(true, pendingRoomMove.moveStartDate, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 block mb-1">
                      สาเหตุการย้ายห้อง:
                    </label>
                    <select
                      value={pendingRoomMove.moveReason}
                      onChange={(e) => updatePartialMoveConfig(true, undefined, undefined, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-900 text-xs font-medium"
                    >
                      <option value="ห้องเดิมชำรุด / แอร์เสีย มีปัญหา (Defect)">ห้องเดิมชำรุด / แอร์เสีย มีปัญหา (Defect)</option>
                      <option value="ลูกค้าขอเปลี่ยนห้องระหว่างพัก (Guest Request)">ลูกค้าขอเปลี่ยนห้องระหว่างพัก (Guest Request)</option>
                      <option value="อัปเกรดห้องพักระหว่างพัก (Upgrade)">อัปเกรดห้องพักระหว่างพัก (Upgrade)</option>
                      <option value="เหตุผลอื่นๆ ทางการปฏิบัติการ">เหตุผลอื่นๆ ทางการปฏิบัติการ</option>
                    </select>
                  </div>

                  <label className="flex items-start gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pendingRoomMove.setOldRoomMaintenance}
                      onChange={(e) => updatePartialMoveConfig(true, undefined, undefined, undefined, e.target.checked)}
                      className="mt-0.5 text-amber-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-xs text-stone-900 dark:text-white block">
                        ตั้งสถานะห้องเดิม ({pendingRoomMove.currentRoom.roomNumber}) เป็น "ชำรุด/แจ้งซ่อม (MAINTENANCE)" ทันที
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        ปิดไม่ให้ระบบหรือช่องทาง OTA นำห้องที่มีปัญหาไปขายต่ออัตโนมัติ
                      </span>
                    </div>
                  </label>

                  {/* 2-Segment Summary Cards */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-stone-100 dark:bg-slate-800">
                      <div>
                        <span className="font-bold text-stone-800 dark:text-stone-200 block">
                          ช่วงที่ 1: ห้องเดิม {pendingRoomMove.currentRoom.roomNumber} ({pendingRoomMove.partialCurrentNights} คืน)
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {formatDateThai(pendingRoomMove.booking.checkInDate)} ถึง {formatDateThai(pendingRoomMove.moveStartDate)} (฿{pendingRoomMove.pricePerNightCurrent.toLocaleString()}/คืน)
                        </span>
                      </div>
                      <span className="font-bold text-stone-900 dark:text-white">
                        ฿{pendingRoomMove.partialCurrentTotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700">
                      <div>
                        <span className="font-bold text-amber-900 dark:text-amber-200 block">
                          ช่วงที่ 2: ห้องใหม่ {pendingRoomMove.targetRoom.roomNumber} ({pendingRoomMove.partialTargetNights} คืน)
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400">
                          {formatDateThai(pendingRoomMove.moveStartDate)} ถึง {formatDateThai(pendingRoomMove.moveEndDate)} (฿{pendingRoomMove.pricePerNightTarget.toLocaleString()}/คืน)
                        </span>
                      </div>
                      <span className="font-bold text-amber-800 dark:text-amber-300">
                        ฿{pendingRoomMove.partialTargetTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Full Stay Dates */
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800/40 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
                  <span>ระยะเวลาเข้าพัก:</span>
                  <span className="font-bold text-stone-900 dark:text-white">
                    {formatDateThai(pendingRoomMove.booking.checkInDate)} – {formatDateThai(pendingRoomMove.booking.checkOutDate)} ({pendingRoomMove.totalNights} คืน)
                  </span>
                </div>
              )}

              {/* Conflict Warning if any */}
              {pendingRoomMove.hasConflict ? (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">คำเตือน: ห้อง {pendingRoomMove.targetRoom.roomNumber} มีการจองซ้อนในช่วงเวลานี้</span>
                    <span className="text-[11px] text-rose-700 dark:text-rose-300">
                      บุ๊กกิ้ง #{pendingRoomMove.conflictingBooking?.bookingNumber} ({pendingRoomMove.conflictingBooking?.guestName}) จองอยู่ ({pendingRoomMove.conflictingBooking?.checkInDate} ถึง {pendingRoomMove.conflictingBooking?.checkOutDate})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ห้อง {pendingRoomMove.targetRoom.roomNumber} ว่างพร้อมย้ายเข้าพักได้ในช่วงเวลาดังกล่าว</span>
                </div>
              )}

              {/* Price Difference Breakdown & Options */}
              {(() => {
                const effectiveDiff = pendingRoomMove.isPartialMove ? pendingRoomMove.partialPriceDiff : pendingRoomMove.priceDiff;
                const effectiveNewTotal = pendingRoomMove.isPartialMove ? pendingRoomMove.partialCombinedTotal : pendingRoomMove.targetRoomTotal;
                const effectiveOriginalTotal = pendingRoomMove.booking.roomTotal;

                return (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/80 space-y-3">
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span className="text-stone-800 dark:text-stone-200">รายละเอียดราคาและส่วนต่าง:</span>
                      {effectiveDiff > 0 ? (
                        <span className="text-amber-700 dark:text-amber-400">
                          ส่วนต่างเพิ่ม +฿{effectiveDiff.toLocaleString()}
                        </span>
                      ) : effectiveDiff < 0 ? (
                        <span className="text-blue-700 dark:text-blue-400">
                          ส่วนต่างลดลง -฿{Math.abs(effectiveDiff).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400">
                          ราคาห้องเท่ากัน (ไม่มียอดส่วนต่าง)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-amber-200/60 dark:border-amber-800/60 text-stone-600 dark:text-stone-300">
                      <div>
                        <span className="text-[11px] text-stone-400 block">ราคาห้องเดิมรวม</span>
                        <span className="font-bold text-stone-900 dark:text-white">
                          ฿{effectiveOriginalTotal.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-stone-400 block">ราคาห้องใหม่คำนวณรวม</span>
                        <span className="font-bold text-amber-700 dark:text-amber-400">
                          ฿{effectiveNewTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Pricing Options */}
                    {effectiveDiff !== 0 && (
                      <div className="space-y-2 pt-1 text-xs">
                        <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                          เลือกรูปแบบการคิดราคา:
                        </span>

                        <label className="flex items-start gap-2.5 p-2 rounded-xl border border-amber-300/60 bg-white dark:bg-slate-900 cursor-pointer">
                          <input
                            type="radio"
                            name="pricingOption"
                            checked={recalculatePriceOption}
                            onChange={() => setRecalculatePriceOption(true)}
                            className="mt-0.5 text-amber-600 focus:ring-amber-500"
                          />
                          <div>
                            <span className="font-bold text-stone-900 dark:text-white block">
                              ปรับยอดรวมตามราคาห้องใหม่ (คิดส่วนต่างตามจริง)
                            </span>
                            <span className="text-[11px] text-stone-500 block">
                              ยอดรวมบิลใหม่จะเป็น ฿{(pendingRoomMove.booking.grandTotal + effectiveDiff).toLocaleString()} (ยอดค้างชำระปรับอัตโนมัติ)
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 cursor-pointer">
                          <input
                            type="radio"
                            name="pricingOption"
                            checked={!recalculatePriceOption}
                            onChange={() => setRecalculatePriceOption(false)}
                            className="mt-0.5 text-amber-600 focus:ring-amber-500"
                          />
                          <div>
                            <span className="font-bold text-stone-900 dark:text-white block">
                              คงราคาเดิมตามที่ลูกค้าจองไว้ (อัปเกรดฟรี / ไม่คิดส่วนต่างเพิ่ม)
                            </span>
                            <span className="text-[11px] text-stone-500 block">
                              ยอดรวมบิลและยอดค้างชำระคงเดิม ฿{pendingRoomMove.booking.grandTotal.toLocaleString()} (เหมาะสำหรับกรณีห้องมีปัญหาจากทางโรงแรม)
                            </span>
                          </div>
                        </label>
                      </div>
                    )}

                  </div>
                );
              })()}

              {/* Confirmation Question Prompt */}
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-slate-800 text-center font-bold text-stone-900 dark:text-white text-xs sm:text-sm">
                ท่านแน่ใจหรือไม่ว่าต้องการย้ายการจองของ คุณ{pendingRoomMove.booking.guestName} จากห้อง {pendingRoomMove.currentRoom.roomNumber} ไปยังห้อง {pendingRoomMove.targetRoom.roomNumber} {pendingRoomMove.isPartialMove ? `(ย้ายเฉพาะช่วง ${pendingRoomMove.moveStartDate} ถึง ${pendingRoomMove.moveEndDate})` : ""}?
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-[#101c42] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPendingRoomMove(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={confirmRoomMove}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>ยืนยันการย้ายห้องพัก</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Reallocation Pop-up Dialog (Matching Little Hotelier / ZUZU - Images 2 & 3) */}
      {pendingReallocation && (
        <div 
          className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setPendingReallocation(null)}
        >
          <div 
            className="relative bg-white dark:bg-[#0c132c] rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-[#101c42] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                  Reallocation (การจัดสรรห้องพักใหม่)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {pendingReallocation.booking.guestName} (#{pendingReallocation.booking.bookingNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingReallocation(null)}
                className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-300 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs sm:text-sm">
              {/* Question / Instruction matching Little Hotelier Image 2 */}
              <div className="space-y-1">
                <p className="font-semibold text-stone-800 dark:text-stone-200 text-xs sm:text-sm">
                  Set the stay date which you want this room reallocation to apply from:
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  กำหนดวันที่ต้องการให้เริ่มการย้ายห้องพักนี้:
                </p>
              </div>

              {/* Room Target Visual */}
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block uppercase">ย้ายจากห้อง</span>
                  <span className="font-bold text-stone-900 dark:text-white text-sm">
                    {pendingReallocation.currentRoom.roomNumber} ({pendingReallocation.currentRoom.type})
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-right">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block uppercase font-bold">ไปยังห้องใหม่</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                    {pendingReallocation.targetRoom.roomNumber} ({pendingReallocation.targetRoom.type})
                  </span>
                </div>
              </div>

              {/* Dropdown matching Little Hotelier Image 2 & 3 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  Moved (เริ่มย้ายวันที่):
                </label>
                <select
                  value={pendingReallocation.applyFromDate}
                  onChange={(e) => handleReallocationDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-xs"
                >
                  {pendingReallocation.availableDates.map((item) => (
                    <option key={item.dateStr} value={item.dateStr}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conflict Alert if any */}
              {pendingReallocation.hasConflict ? (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">คำเตือน: ห้อง {pendingReallocation.targetRoom.roomNumber} มีการจองซ้อนในช่วงนี้</span>
                    <span className="text-[11px] text-rose-700 dark:text-rose-300">
                      บุ๊กกิ้ง #{pendingReallocation.conflictingBooking?.bookingNumber} ({pendingReallocation.conflictingBooking?.guestName}) จองอยู่ ({pendingReallocation.conflictingBooking?.checkInDate} ถึง {pendingReallocation.conflictingBooking?.checkOutDate})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ห้อง {pendingReallocation.targetRoom.roomNumber} ว่างพร้อมย้ายเข้าพักได้ในช่วงเวลานี้</span>
                </div>
              )}

              {/* Little Hotelier Question Text: "Are you sure you wish to proceed?" */}
              <div className="pt-2 text-center">
                <p className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm">
                  Are you sure you wish to proceed?
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  คุณแน่ใจหรือไม่ว่าต้องการดำเนินการย้ายห้องพักนี้?
                </p>
              </div>
            </div>

            {/* Little Hotelier Footer Buttons: Orange [ใช่] and [ยกเลิก] */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-[#101c42] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPendingReallocation(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                disabled={pendingReallocation.hasConflict}
                onClick={confirmReallocation}
                className="px-6 py-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-orange-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>ใช่</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Check-In Modal with PDPA Watermarked ID & Signature */}
      {timelineCheckInBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#101c42] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-blue-500/30 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                      เช็คอินเข้าพัก (Check-in)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 whitespace-nowrap shrink-0">
                      {timelineCheckInBooking.source}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    ห้อง {timelineCheckInBooking.roomNumber} - #{timelineCheckInBooking.bookingNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTimelineCheckInBooking(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guest Summary Card */}
            <div className="mt-4 space-y-4">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400">ผู้เข้าพัก</span>
                    <h4 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <User className="w-4 h-4 text-blue-600" />
                      <span>{timelineCheckInBooking.guestName}</span>
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400">ห้องพัก</span>
                    <div className="text-lg font-bold font-serif text-emerald-600 dark:text-emerald-400">
                      ห้อง {timelineCheckInBooking.roomNumber}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[11px]">เบอร์โทร</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {timelineCheckInBooking.guestPhone || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">ระยะเวลา</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {timelineCheckInBooking.totalNights} คืน ({timelineCheckInBooking.checkInDate} ถึง {timelineCheckInBooking.checkOutDate})
                    </span>
                  </div>
                </div>
              </div>

              {/* ID Card Upload with PDPA Watermark */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                        <span>เอกสารประจำตัว (ID Card / Passport)</span>
                        {requireCheckInDocuments ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 whitespace-nowrap shrink-0">
                            จำเป็น (PDPA)
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-stone-400 whitespace-nowrap shrink-0">
                            (ไม่บังคับ)
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        ระบบจะประทับลายน้ำคุ้มครอง PDPA อัตโนมัติ
                      </p>
                    </div>
                  </div>
                  {timelineIdCardImage && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 whitespace-nowrap shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>แนบแล้ว</span>
                    </span>
                  )}
                </div>

                {/* Hidden file inputs */}
                <input
                  ref={timelineCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleTimelineIdCardChange}
                />
                <input
                  ref={timelineFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleTimelineIdCardChange}
                />

                {timelineIdCardImage ? (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700">
                    <div
                      onClick={() => setViewingTimelineIdCardImage(timelineIdCardImage)}
                      className="relative w-24 h-16 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 cursor-pointer shrink-0 group bg-stone-100 dark:bg-slate-800 flex items-center justify-center"
                    >
                      <img
                        src={timelineIdCardImage}
                        alt="Guest ID"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px]">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                        ประทับลายน้ำ PDPA เรียบร้อย
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setViewingTimelineIdCardImage(timelineIdCardImage)}
                          className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>ดูรูป</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => timelineCameraInputRef.current?.click()}
                          className="text-[11px] font-medium text-stone-600 dark:text-stone-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>ถ่ายใหม่</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTimelineIdCardImage(null)}
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
                      onClick={() => timelineCameraInputRef.current?.click()}
                      disabled={isUploadingTimelineIdCard}
                      className="p-3 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-stone-700 dark:text-stone-300 transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer min-h-[64px]"
                    >
                      <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-semibold">ถ่ายรูปด้วยกล้อง</span>
                      <span className="text-[10px] text-stone-400">เปิดกล้องมือถือ/แท็บเล็ต</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => timelineFileInputRef.current?.click()}
                      disabled={isUploadingTimelineIdCard}
                      className="p-3 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-stone-700 dark:text-stone-300 transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer min-h-[64px]"
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
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                        <span>ลายมือชื่อผู้เข้าพัก (Guest Digital Signature)</span>
                        {requireCheckInDocuments && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 whitespace-nowrap shrink-0">
                            จำเป็น
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        เซ็นชื่อยืนยันการเข้าพักโรงแรม
                      </p>
                    </div>
                  </div>
                  {timelineSignatureImage && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 whitespace-nowrap shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>เซ็นแล้ว</span>
                    </span>
                  )}
                </div>

                <SignaturePad
                  initialSignature={timelineSignatureImage || undefined}
                  onChange={(sig) => setTimelineSignatureImage(sig)}
                  height={140}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setTimelineCheckInBooking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    checkInBooking(timelineCheckInBooking.id, {
                      guestIdCardImage: timelineIdCardImage || undefined,
                      guestSignatureImage: timelineSignatureImage || undefined,
                    });
                    setTimelineCheckInBooking(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันเช็คอินเข้าห้อง</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Fullscreen Viewer Modal */}
      {viewingTimelineIdCardImage && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 border border-stone-200 dark:border-stone-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white">
              <span className="font-serif font-bold text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>ภาพเอกสารประจำตัวผู้เข้าพัก (ID Card / Passport)</span>
              </span>
              <button
                type="button"
                onClick={() => setViewingTimelineIdCardImage(null)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 flex justify-center">
              <img
                src={viewingTimelineIdCardImage}
                alt="ID Card / Passport"
                className="max-h-[65vh] w-auto rounded-xl object-contain border border-stone-200 dark:border-stone-800 shadow-inner"
              />
            </div>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setViewingTimelineIdCardImage(null)}
                className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Flow Dialogs (Matching ZUZU PMS / Little Hotelier / Reference Images) */}
      {pendingCancellation && (
        <div 
          className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setPendingCancellation(null)}
        >
          <div 
            className="relative bg-white dark:bg-[#0f172a] rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-700/80 overflow-hidden my-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step 1: Cancellation Scope Selection (Image 2 & Image 4) */}
            {pendingCancellation.step === "SCOPE" && (
              <div>
                {/* Header */}
                <div className="px-5 py-4 border-b border-stone-200/70 dark:border-stone-800 bg-stone-50/80 dark:bg-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white">
                        Confirm (ยืนยันการยกเลิก)
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        การจองแบบเชื่อมโยงหลายห้องของ คุณ{pendingCancellation.booking.guestName}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingCancellation(null)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                      Are you sure you want to cancel these linked bookings?
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองของ คุณ{pendingCancellation.booking.guestName} ที่เชื่อมโยงกัน?
                    </p>
                  </div>

                  {/* Radio 1 & 2 */}
                  <div className="space-y-2">
                    <label className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      pendingCancellation.mode === "ALL"
                        ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs"
                        : "border-stone-200 dark:border-stone-700/70 hover:bg-stone-50 dark:hover:bg-slate-800/40"
                    }`}>
                      <input
                        type="radio"
                        name="cancelScope"
                        checked={pendingCancellation.mode === "ALL"}
                        onChange={() => setPendingCancellation({
                          ...pendingCancellation,
                          mode: "ALL",
                          selectedBookingIds: pendingCancellation.linkedBookings.map((b) => b.id)
                        })}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200">
                        ยกเลิกการจองที่เชื่อมโยงทั้งหมดของ คุณ{pendingCancellation.booking.guestName} ({pendingCancellation.linkedBookings.length} ห้อง)
                      </span>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      pendingCancellation.mode === "PARTIAL"
                        ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs"
                        : "border-stone-200 dark:border-stone-700/70 hover:bg-stone-50 dark:hover:bg-slate-800/40"
                    }`}>
                      <input
                        type="radio"
                        name="cancelScope"
                        checked={pendingCancellation.mode === "PARTIAL"}
                        onChange={() => setPendingCancellation({
                          ...pendingCancellation,
                          mode: "PARTIAL",
                          selectedBookingIds: [pendingCancellation.booking.id]
                        })}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200">
                        ยกเลิกการจองที่เชื่อมโยงเพียงบางส่วนเท่านั้น
                      </span>
                    </label>
                  </div>

                  {/* Partial Selection Sub-view (Matching Image 4) */}
                  {pendingCancellation.mode === "PARTIAL" && (
                    <div className="pt-3 border-t border-stone-200/70 dark:border-stone-800 space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          Select the bookings to cancel: (เลือกห้องที่ต้องการยกเลิก)
                        </span>
                        <div className="flex items-center gap-3 text-xs">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-stone-600 dark:text-stone-400 hover:text-amber-600">
                            <input
                              type="radio"
                              name="quickSelect"
                              checked={pendingCancellation.selectedBookingIds.length === pendingCancellation.linkedBookings.length}
                              onChange={() => setPendingCancellation({
                                ...pendingCancellation,
                                selectedBookingIds: pendingCancellation.linkedBookings.map((b) => b.id)
                              })}
                              className="w-3.5 h-3.5 text-amber-600"
                            />
                            <span>Select All</span>
                          </label>
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-stone-600 dark:text-stone-400 hover:text-amber-600">
                            <input
                              type="radio"
                              name="quickSelect"
                              checked={pendingCancellation.selectedBookingIds.length === 0}
                              onChange={() => setPendingCancellation({
                                ...pendingCancellation,
                                selectedBookingIds: []
                              })}
                              className="w-3.5 h-3.5 text-amber-600"
                            />
                            <span>Deselect All</span>
                          </label>
                        </div>
                      </div>

                      {/* Linked Bookings List */}
                      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                        {pendingCancellation.linkedBookings.map((item) => {
                          const isCurrent = item.id === pendingCancellation.booking.id;
                          const isSelected = pendingCancellation.selectedBookingIds.includes(item.id);
                          const isExpanded = pendingCancellation.expandedDetailsIds.includes(item.id);
                          const roomObj = filteredRooms.find((r) => r.id === item.roomId);
                          const roomTypeDisplay = roomObj?.type || "Standard Room";

                          return (
                            <div
                              key={item.id}
                              className={`p-2.5 rounded-xl border text-xs transition-colors ${
                                isCurrent
                                  ? "bg-amber-100/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 shadow-xs"
                                  : isSelected
                                    ? "bg-amber-50/40 dark:bg-slate-800/60 border-amber-200 dark:border-stone-700"
                                    : "bg-stone-50 dark:bg-slate-800/30 border-stone-200/80 dark:border-stone-700/50"
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const nextIds = e.target.checked
                                      ? [...pendingCancellation.selectedBookingIds, item.id]
                                      : pendingCancellation.selectedBookingIds.filter((id) => id !== item.id);
                                    setPendingCancellation({
                                      ...pendingCancellation,
                                      selectedBookingIds: nextIds,
                                    });
                                  }}
                                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer mt-0.5 shrink-0"
                                />

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                                      Booking {item.bookingNumber}: {roomTypeDisplay} ({item.roomNumber})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextExp = isExpanded
                                          ? pendingCancellation.expandedDetailsIds.filter((id) => id !== item.id)
                                          : [...pendingCancellation.expandedDetailsIds, item.id];
                                        setPendingCancellation({
                                          ...pendingCancellation,
                                          expandedDetailsIds: nextExp,
                                        });
                                      }}
                                      className="text-amber-700 dark:text-amber-400 hover:underline font-semibold ml-auto shrink-0 flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>{isExpanded ? "Hide Details" : "Show Details"}</span>
                                      <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                                    {formatDateThai(item.checkInDate)} ถึง {formatDateThai(item.checkOutDate)} ({item.totalNights} คืน) - {item.guestName}
                                  </p>
                                </div>
                              </div>

                              {/* Expanded Breakdown */}
                              {isExpanded && (
                                <div className="mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-700/50 pl-6 space-y-1 text-[11px] text-stone-600 dark:text-stone-300 animate-in fade-in duration-100">
                                  <div className="flex justify-between">
                                    <span>ช่องทางจอง:</span>
                                    <strong className="text-stone-800 dark:text-stone-200">{item.source}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>ราคาต่อคืน / ยอดรวม:</span>
                                    <span className="font-mono">฿{formatCurrency(item.roomRate)} / ฿{formatCurrency(item.grandTotal)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>ชำระแล้ว:</span>
                                    <span className="text-emerald-600 font-mono">฿{formatCurrency(item.depositPaid)} (ค้าง: ฿{formatCurrency(item.balanceDue)})</span>
                                  </div>
                                  {item.specialRequests && (
                                    <div className="pt-0.5 text-stone-500">
                                      <span>หมายเหตุ: {item.specialRequests}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons (Matching Image 2 / Image 4) */}
                <div className="px-5 py-3.5 border-t border-stone-200/70 dark:border-stone-800 bg-stone-50/50 dark:bg-slate-900/40 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPendingCancellation(null)}
                    className="px-5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors min-h-[38px] cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={pendingCancellation.selectedBookingIds.length === 0}
                    onClick={() => setPendingCancellation({
                      ...pendingCancellation,
                      step: "POLICY_CONFIRM"
                    })}
                    className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-amber-500/30 transition-all min-h-[38px] cursor-pointer"
                  >
                    ใช่
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Policy & Cancellation Fee Confirmation (Matching Image 1) */}
            {pendingCancellation.step === "POLICY_CONFIRM" && (
              <div>
                {/* Header */}
                <div className="px-5 py-4 border-b border-stone-200/70 dark:border-stone-800 bg-stone-50/80 dark:bg-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white">
                        Confirm (ยืนยันเงื่อนไขการยกเลิก)
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        ตรวจสอบนโยบายและค่าธรรมเนียมก่อนดำเนินการ
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingCancellation(null)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                  {/* Cancellation Policy Box (Matching Image 1) */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/90 dark:border-amber-800/50 space-y-1">
                    <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        Cancellation policy for {pendingCancellation.selectedBookingIds.map((id) => {
                          const b = pendingCancellation.linkedBookings.find((x) => x.id === id);
                          return b ? b.bookingNumber : id;
                        }).join(", ")}
                      </span>
                    </div>
                    <div className="text-xs text-amber-800 dark:text-amber-300">
                      Refundable up to 3 days before check-in (สามารถคืนเงินได้สูงสุด 3 วันก่อนวันเช็คอิน)
                    </div>
                  </div>

                  {/* Dropdown: การปฏิบัติตามนโยบายการยกเลิก */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                      การปฏิบัติตามนโยบายการยกเลิก
                    </label>
                    <select
                      value={pendingCancellation.policyAdherence}
                      onChange={(e) => setPendingCancellation({
                        ...pendingCancellation,
                        policyAdherence: e.target.value as any
                      })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="WAIVE_FULL_REFUND">ข้าม (คืนเงินเต็มจำนวน)</option>
                      <option value="FOLLOW_POLICY">ปฏิบัติตามนโยบาย (หักค่าธรรมเนียมตามเงื่อนไข)</option>
                      <option value="CUSTOM_FEE">ระบุค่าธรรมเนียมยกเลิกเอง (กำหนดจำนวนเงิน)</option>
                    </select>
                  </div>

                  {/* Custom Fee Input */}
                  {pendingCancellation.policyAdherence === "CUSTOM_FEE" && (
                    <div className="space-y-1 animate-in fade-in duration-100">
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                        ระบุจำนวนเงินค่าธรรมเนียมที่จะเรียกเก็บ (บาท)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={pendingCancellation.customFee}
                        onChange={(e) => setPendingCancellation({
                          ...pendingCancellation,
                          customFee: Number(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs font-bold font-mono focus:ring-2 focus:ring-amber-500"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {/* Fee Highlight Box (Matching Image 1) */}
                  <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-slate-800/80 border border-stone-200 dark:border-stone-700 text-center">
                    <p className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                      <span className="text-rose-600 dark:text-rose-400">
                        ฿{formatCurrency(calculateCancellationFee(pendingCancellation))}
                      </span>{" "}
                      จะถูกเรียกเก็บ หากยกเลิกทันที
                    </p>
                  </div>

                  {/* Target bookings summary */}
                  <div className="text-xs text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-700/50">
                    <span>รายการที่จะถูกยกเลิก: </span>
                    <strong className="text-stone-800 dark:text-stone-200">
                      {pendingCancellation.selectedBookingIds.length} รายการ
                    </strong>
                    <span className="text-stone-500 ml-1">
                      ({pendingCancellation.selectedBookingIds.map((id) => {
                        const b = pendingCancellation.linkedBookings.find((x) => x.id === id);
                        return b ? `ห้อง ${b.roomNumber}` : "";
                      }).filter(Boolean).join(", ")})
                    </span>
                  </div>

                  {/* Optional Reason Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                      เหตุผลการยกเลิก (บันทึกลงในระบบ):
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ลูกค้าติดธุระด่วน / สภาพอากาศ / ขอยกเลิกเอง"
                      value={pendingCancellation.reason}
                      onChange={(e) => setPendingCancellation({
                        ...pendingCancellation,
                        reason: e.target.value
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Proceed Question (Matching Image 1) */}
                  <p className="text-sm font-bold text-center text-stone-900 dark:text-white pt-1">
                    ท่านต้องการดำเนินการต่อหรือไม่ ??
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="px-5 py-3.5 border-t border-stone-200/70 dark:border-stone-800 bg-stone-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-2.5">
                  {pendingCancellation.linkedBookings.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setPendingCancellation({
                        ...pendingCancellation,
                        step: "SCOPE"
                      })}
                      className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                    >
                      ย้อนกลับไปเลือกห้อง
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPendingCancellation(null)}
                      className="px-5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors min-h-[38px] cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCancellation}
                      className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all min-h-[38px] cursor-pointer"
                    >
                      ใช่
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
