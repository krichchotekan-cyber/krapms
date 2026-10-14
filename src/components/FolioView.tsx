"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { formatCurrency, formatDateThai } from "@/lib/utils";
import { SignaturePad } from "@/components/SignaturePad";
import { 
  Receipt, 
  Printer, 
  DoorOpen, 
  Building, 
  Palmtree, 
  UtensilsCrossed,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck2,
  Plus,
  DollarSign,
  Camera,
  Upload,
  Eye,
  Trash2,
  PenLine,
  Image as ImageIcon,
  Mail,
  Send,
  Copy,
  Check,
  ArrowRightLeft
} from "lucide-react";
import { PromptPayPaymentModal } from "@/components/PromptPayPaymentModal";
import { compressImageWithPdpaWatermark } from "@/lib/pdpaWatermark";
import { RoomOrder } from "@/types/pms";

// Image compression helper using HTML5 Canvas to keep data size light
const compressImageFile = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export function FolioView({ initialBookingId }: { initialBookingId?: string }) {
  const { 
    filteredBookings, 
    filteredOrders, 
    settleBookingAndCheckOut, 
    addCustomChargeToBooking, 
    updateBooking,
    deleteOrder,
    transferOrderToRoom,
    rooms
  } = usePMS();

  // POS Order Management (Cancel from room / Transfer room)
  const [transferringOrder, setTransferringOrder] = useState<RoomOrder | null>(null);
  const [targetTransferRoomId, setTargetTransferRoomId] = useState<string>("");
  const [orderActionFeedback, setOrderActionFeedback] = useState<string | null>(null);

  const handleDeleteOrderFromFolio = (order: RoomOrder) => {
    if (
      window.confirm(
        `คุณต้องการยกเลิกบิลสั่งอาหาร #${order.orderNumber} ยอดรวม ${formatCurrency(
          order.totalAmount
        )} ออกจากห้องพัก ${order.roomNumber} ใช่หรือไม่?\n\nหมายเหตุ: ระบบจะหักลดยอดอาหารนี้ออกจากบิลห้องพัก (Folio) ทันที`
      )
    ) {
      deleteOrder(order.id);
      setOrderActionFeedback(`ยกเลิกบิล #${order.orderNumber} และหักลดยอดออกจาก Folio เรียบร้อยแล้ว`);
      setTimeout(() => setOrderActionFeedback(null), 4000);
    }
  };

  const handleOpenTransferModal = (order: RoomOrder) => {
    setTransferringOrder(order);
    setTargetTransferRoomId("");
  };

  const handleConfirmTransferOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringOrder || !targetTransferRoomId) return;

    const targetRoom = rooms.find((r) => r.id === targetTransferRoomId);
    if (!targetRoom) return;

    transferOrderToRoom(transferringOrder.id, targetTransferRoomId);
    setOrderActionFeedback(
      `ย้ายบิล #${transferringOrder.orderNumber} ไปยังห้อง ${targetRoom.roomNumber} (${targetRoom.guestName || "ผู้เข้าพัก"}) เรียบร้อยแล้ว ยอด Folio ของทั้งสองห้องได้รับการปรับปรุงอัตโนมัติ`
    );
    setTransferringOrder(null);
    setTimeout(() => setOrderActionFeedback(null), 4000);
  };
  
  // Filter status for the Folio room selector:
  // 'CHECKED_IN' (default: in-house only), 'CHECKED_OUT' (past bills), 'ALL' (all records)
  const [folioFilterStatus, setFolioFilterStatus] = useState<"CHECKED_IN" | "CHECKED_OUT" | "ALL">("CHECKED_IN");

  // Select active or recent booking
  const checkedInBookings = filteredBookings.filter((b) => b.status === "CHECKED_IN");
  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    initialBookingId || checkedInBookings[0]?.id || filteredBookings[0]?.id || ""
  );

  // Sync selectedBookingId and filter when initialBookingId prop changes
  React.useEffect(() => {
    if (initialBookingId) {
      setSelectedBookingId(initialBookingId);
      const target = filteredBookings.find((b) => b.id === initialBookingId);
      if (target && target.status === "CHECKED_OUT") {
        setFolioFilterStatus("ALL");
      }
    }
  }, [initialBookingId, filteredBookings]);

  // Counts for selector filter pills
  const inHouseCount = React.useMemo(() => filteredBookings.filter((b) => b.status === "CHECKED_IN").length, [filteredBookings]);
  const checkedOutCount = React.useMemo(() => filteredBookings.filter((b) => b.status === "CHECKED_OUT").length, [filteredBookings]);

  // Filtered bookings for the dropdown selector
  const selectorBookings = React.useMemo(() => {
    if (folioFilterStatus === "CHECKED_IN") {
      const inHouseList = filteredBookings.filter((b) => b.status === "CHECKED_IN");
      // If initialBookingId is passed but not in inHouseList, prepend it so it remains visible
      if (initialBookingId && !inHouseList.some((b) => b.id === initialBookingId)) {
        const target = filteredBookings.find((b) => b.id === initialBookingId);
        if (target) return [target, ...inHouseList];
      }
      return inHouseList;
    }
    if (folioFilterStatus === "CHECKED_OUT") {
      return filteredBookings.filter((b) => b.status === "CHECKED_OUT");
    }
    return filteredBookings;
  }, [filteredBookings, folioFilterStatus, initialBookingId]);

  // Auto-select first item when switching filter if current selection is not present
  React.useEffect(() => {
    if (selectorBookings.length > 0 && !selectorBookings.some((b) => b.id === selectedBookingId)) {
      setSelectedBookingId(selectorBookings[0].id);
    }
  }, [selectorBookings, selectedBookingId]);

  // Billing Mode: 'SINGLE' for this room, 'COMBINED' for all rooms in the group
  const [billingMode, setBillingMode] = useState<"SINGLE" | "COMBINED">("SINGLE");

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"CASH" | "PROMPTPAY_QR" | "CREDIT_CARD">("PROMPTPAY_QR");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // PromptPay QR & Slip Camera Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);
  const [checkoutSlipImage, setCheckoutSlipImage] = useState<string | null>(null);

  // Guest Digital Signature & ID Card States
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [tempSignature, setTempSignature] = useState<string | null>(null);
  const [viewingIdCardUrl, setViewingIdCardUrl] = useState<string | null>(null);
  const [isAttachingIdModalOpen, setIsAttachingIdModalOpen] = useState(false);
  const [isUploadingIdCard, setIsUploadingIdCard] = useState(false);
  const folioCameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const folioFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Quick Charge Modal State inside Folio
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [chargeTitle, setChargeTitle] = useState("");
  const [chargeAmount, setChargeAmount] = useState<number>(300);
  const [chargeSuccessMsg, setChargeSuccessMsg] = useState("");

  const selectedBooking = filteredBookings.find((b) => b.id === selectedBookingId);

  // Check if this booking belongs to a group/company
  const groupKey = selectedBooking?.groupBookingId || (selectedBooking?.companyName ? `COMP-${selectedBooking.companyName}` : null);
  const relatedGroupBookings = React.useMemo(() => {
    if (!selectedBooking) return [];
    return filteredBookings.filter((b) => {
      if (selectedBooking.groupBookingId && b.groupBookingId === selectedBooking.groupBookingId) return true;
      if (selectedBooking.companyName && b.companyName === selectedBooking.companyName) return true;
      return false;
    });
  }, [filteredBookings, selectedBooking]);

  const hasGroup = relatedGroupBookings.length > 1;

  // Active bookings for calculation: either single or all related group bookings
  const activeFolioBookings = React.useMemo(() => {
    if (!selectedBooking) return [];
    if (billingMode === "COMBINED" && hasGroup) {
      return relatedGroupBookings;
    }
    return [selectedBooking];
  }, [selectedBooking, billingMode, hasGroup, relatedGroupBookings]);

  // Associated Orders for active folio bookings
  const roomOrders = filteredOrders.filter((o) => {
    return activeFolioBookings.some((b) => o.bookingId === b.id || o.roomNumber === b.roomNumber);
  });

  // Aggregated totals for Combined mode
  const combinedRoomTotal = activeFolioBookings.reduce((sum, b) => sum + b.roomTotal, 0);
  const combinedExtraBedTotal = activeFolioBookings.reduce((sum, b) => sum + b.extraBedTotal, 0);
  const combinedPosChargesTotal = activeFolioBookings.reduce((sum, b) => sum + b.posChargesTotal, 0);
  const combinedGrandTotal = combinedRoomTotal + combinedExtraBedTotal + combinedPosChargesTotal;
  const combinedDepositPaid = activeFolioBookings.reduce((sum, b) => sum + b.depositPaid, 0);
  const combinedBalanceDue = combinedGrandTotal - combinedDepositPaid;

  const handlePrint = () => {
    window.print();
  };

  const handleOpenCheckout = () => {
    setIsCheckoutModalOpen(true);
    setCheckoutSuccess(false);
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    if (billingMode === "COMBINED" && hasGroup) {
      // Settle all bookings in the group
      activeFolioBookings.forEach((b) => {
        settleBookingAndCheckOut(b.id, selectedPaymentMethod, checkoutSlipImage || undefined);
      });
    } else {
      settleBookingAndCheckOut(selectedBooking.id, selectedPaymentMethod, checkoutSlipImage || undefined);
    }

    setCheckoutSuccess(true);
    setTimeout(() => {
      setIsCheckoutModalOpen(false);
      setCheckoutSuccess(false);
      setCheckoutSlipImage(null);
    }, 1200);
  };

  // Email Receipt Modal States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState("");
  const [emailErrorMsg, setEmailErrorMsg] = useState("");
  const [copiedSummary, setCopiedSummary] = useState(false);

  React.useEffect(() => {
    if (selectedBooking) {
      setEmailInput(selectedBooking.guestEmail || "");
      setEmailStatusMsg("");
      setEmailErrorMsg("");
      setCopiedSummary(false);
    }
  }, [selectedBooking]);

  const hotelAddress = selectedBooking?.propertyId === "bugaan"
    ? "เลขที่ 150/9 หมู่ 2 บ้านเมืองเก่า ตำบลเมืองเก่า อำเภอเมืองสุโขทัย จังหวัดสุโขทัย 64210"
    : "331/7 หมู่ 4 ตำบลปากแคว อำเภอเมืองสุโขทัย จังหวัดสุโขทัย 64000";

  const hotelNameTh = selectedBooking?.propertyId === "bugaan"
    ? "บูก้าน สุโขทัย วิลเลจ (Bu-Gaan Sukhothai Village)"
    : "ธนะวงษ์ พูล วิลลา (Thanawong Pool Villa)";

  const handleSendFolioEmail = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      setEmailErrorMsg("กรุณาระบุที่อยู่อีเมลที่ถูกต้อง เช่น customer@gmail.com");
      return;
    }
    if (!selectedBooking) return;

    setIsSendingEmail(true);
    setEmailErrorMsg("");
    setEmailStatusMsg("");

    try {
      const res = await fetch("/api/send-folio-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: emailInput.trim(),
          bookingNumber: selectedBooking.bookingNumber,
          guestName: selectedBooking.guestName,
          roomNumber: selectedBooking.roomNumber,
          propertyName: hotelNameTh,
          hotelAddress,
          grandTotal: billingMode === "COMBINED" ? combinedGrandTotal : selectedBooking.grandTotal,
          balanceDue: billingMode === "COMBINED" ? combinedBalanceDue : selectedBooking.balanceDue,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmailStatusMsg(data.message || `ส่งใบเสร็จไปยัง ${emailInput} เรียบร้อยแล้ว`);
        if (!selectedBooking.guestEmail && emailInput) {
          updateBooking(selectedBooking.id, { guestEmail: emailInput.trim() });
        }
        setTimeout(() => {
          setIsEmailModalOpen(false);
          setEmailStatusMsg("");
        }, 2200);
      } else {
        setEmailErrorMsg(data.error || "เกิดข้อผิดพลาดในการส่งอีเมล");
      }
    } catch {
      setEmailErrorMsg("ไม่สามารถเชื่อมต่อระบบส่งอีเมลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getFolioTextSummary = () => {
    if (!selectedBooking) return "";
    const total = billingMode === "COMBINED" ? combinedGrandTotal : selectedBooking.grandTotal;
    const balance = billingMode === "COMBINED" ? combinedBalanceDue : selectedBooking.balanceDue;
    return `[ใบเสร็จรับเงิน / GUEST FOLIO]\n` +
      `โรงแรม: ${hotelNameTh}\n` +
      `ที่อยู่: ${hotelAddress}\n` +
      `เลขที่การจอง: #${selectedBooking.bookingNumber}\n` +
      `ห้องพัก: ห้อง ${selectedBooking.roomNumber}\n` +
      `ผู้เข้าพัก: ${selectedBooking.guestName}\n` +
      `เบอร์โทร: ${selectedBooking.guestPhone || "-"}\n` +
      `ระยะเวลา: ${formatDateThai(selectedBooking.checkInDate)} ถึง ${formatDateThai(selectedBooking.checkOutDate)} (${selectedBooking.totalNights} คืน)\n` +
      `ยอดรวมสุทธิ: ${formatCurrency(total)}\n` +
      `ยอดค้างชำระ: ${formatCurrency(balance)}\n` +
      `สถานะ: ${selectedBooking.status === "CHECKED_OUT" ? "ชำระครบถ้วนแล้ว" : "กำลังเข้าพัก"}\n` +
      `ผู้ออกบิล: คุณชนินทร์ ฟื้นตน (General Manager)`;
  };

  const handleCopySummary = () => {
    const text = getFolioTextSummary();
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const getMailtoHref = () => {
    if (!selectedBooking) return "#";
    const subject = encodeURIComponent(`ใบเสร็จรับเงิน ${hotelNameTh} - ห้อง ${selectedBooking.roomNumber} (#${selectedBooking.bookingNumber})`);
    const body = encodeURIComponent(
      `เรียน คุณ ${selectedBooking.guestName},\n\n` +
      `ทางโรงแรมขอส่งสรุปใบเสร็จรับเงิน (Guest Folio) รายละเอียดดังนี้:\n\n` +
      getFolioTextSummary() +
      `\n\nขอขอบพระคุณที่เลือกเข้าพักกับเรา\nคุณชนินทร์ ฟื้นตน (General Manager)`
    );
    return `mailto:${emailInput || selectedBooking.guestEmail || ""}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Booking Selector & Group Options Bar (Hide on Print) */}
      <div className="no-print bg-white dark:bg-[#101c42] p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col gap-4">
        
        {/* Top Header & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-white whitespace-nowrap">
                เลือกห้องพักเพื่อดูใบแจ้งหนี้ / เช็คเอาต์:
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {folioFilterStatus === "CHECKED_IN"
                  ? `แสดงเฉพาะห้องที่กำลังเข้าพัก (${selectorBookings.length} ห้อง)`
                  : folioFilterStatus === "CHECKED_OUT"
                  ? `แสดงประวัติห้องที่เช็คเอาต์แล้ว (${selectorBookings.length} ห้อง)`
                  : `แสดงห้องพักทั้งหมด (${selectorBookings.length} รายการ)`}
              </p>
            </div>
          </div>

          {/* Quick Filter Switcher Pills */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800/80 p-1 rounded-2xl shrink-0 self-start md:self-auto text-xs">
            <button
              type="button"
              onClick={() => setFolioFilterStatus("CHECKED_IN")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                folioFilterStatus === "CHECKED_IN"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${folioFilterStatus === "CHECKED_IN" ? "bg-white" : "bg-emerald-500"}`} />
              <span>กำลังพักอยู่</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                folioFilterStatus === "CHECKED_IN" ? "bg-white/20 text-white" : "bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300"
              }`}>
                {inHouseCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFolioFilterStatus("CHECKED_OUT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                folioFilterStatus === "CHECKED_OUT"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <span>เช็คเอาต์แล้ว (ประวัติ)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                folioFilterStatus === "CHECKED_OUT" ? "bg-white/20 text-white" : "bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300"
              }`}>
                {checkedOutCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFolioFilterStatus("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                folioFilterStatus === "ALL"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <span>ทั้งหมด ({filteredBookings.length})</span>
            </button>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">
            ห้องพักที่เลือก:
          </label>

          {selectorBookings.length === 0 ? (
            <div className="w-full sm:w-auto flex-1 flex items-center justify-between p-2 px-3 bg-stone-50 dark:bg-slate-800 rounded-xl text-xs text-stone-400">
              <span>ไม่มีห้องพักในหมวดหมู่นี้</span>
              <button
                type="button"
                onClick={() => setFolioFilterStatus("ALL")}
                className="text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
              >
                ดูห้องพักทั้งหมด
              </button>
            </div>
          ) : (
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="w-full sm:w-auto flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white cursor-pointer"
            >
              {selectorBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  ห้อง {b.roomNumber} - {b.guestName} {b.companyName ? `(${b.companyName})` : ""} [{b.status === "CHECKED_IN" ? "กำลังพักอยู่" : b.status === "CHECKED_OUT" ? "เช็คเอาต์แล้ว" : b.status}]
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Group & Combined Billing Toggle Banner if this booking is part of a group */}
        {hasGroup && (
          <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/5 dark:bg-amber-500/10 -mx-4 -mb-4 p-4 rounded-b-2xl">
            <div className="flex items-center gap-2.5">
              <span 
                className="w-3.5 h-3.5 rounded-full shrink-0 border border-white shadow-xs" 
                style={{ backgroundColor: selectedBooking?.colorTag || "#3b82f6" }}
              />
              <div>
                <div className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <span>คณะ / บริษัท:</span>
                  <span className="text-amber-700 dark:text-amber-300 font-extrabold">
                    {selectedBooking?.companyName || selectedBooking?.guestName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold">
                    กลุ่ม {relatedGroupBookings.length} ห้องพัก ({relatedGroupBookings.map(b => b.roomNumber).join(", ")})
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  เลือกรูปแบบใบเสร็จได้ตามต้องการ: แยกบิลทีละห้อง หรือ ออกบิลรวมทุกห้องในใบเดียว
                </p>
              </div>
            </div>

            {/* Billing Mode Switcher Buttons */}
            <div className="flex items-center gap-1.5 bg-stone-200/70 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setBillingMode("SINGLE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  billingMode === "SINGLE"
                    ? "bg-white dark:bg-amber-600 text-stone-900 dark:text-white shadow-xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
                }`}
              >
                บิลเฉพาะห้อง {selectedBooking?.roomNumber}
              </button>
              <button
                type="button"
                onClick={() => setBillingMode("COMBINED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingMode === "COMBINED"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
                }`}
              >
                <span>บิลรวม {relatedGroupBookings.length} ห้อง</span>
                <span className="text-[10px] bg-black/20 px-1 rounded">ออกรวม</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedBooking ? (
        <div className="space-y-6">

          {/* Action Controls Bar (Print, Checkout, Documents, Signatures) - Dedicated Top Toolbar (Hide on Print) */}
          <div className="no-print bg-white dark:bg-[#101c42] p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left: Quick Room & Guest Status Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap border ${
                selectedBooking.status === "CHECKED_IN"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  : selectedBooking.status === "CHECKED_OUT"
                  ? "bg-stone-500/15 text-stone-700 dark:text-stone-300 border-stone-400/30"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-400/30"
              }`}>
                <span className={`w-2 h-2 rounded-full ${selectedBooking.status === "CHECKED_IN" ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`} />
                <span className="whitespace-nowrap">
                  {selectedBooking.status === "CHECKED_IN" 
                    ? "กำลังเข้าพัก (In-House)" 
                    : selectedBooking.status === "CHECKED_OUT" 
                    ? "เช็คเอาต์แล้ว (Checked Out)" 
                    : selectedBooking.status}
                </span>
              </div>

              <div className="text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2">
                <span className="font-serif font-black text-stone-900 dark:text-white text-sm whitespace-nowrap">
                  ห้อง {selectedBooking.roomNumber}
                </span>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200 whitespace-nowrap">
                  {selectedBooking.guestName}
                </span>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <span className={`font-bold whitespace-nowrap ${
                  (billingMode === "COMBINED" ? combinedBalanceDue : selectedBooking.balanceDue) > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {(billingMode === "COMBINED" ? combinedBalanceDue : selectedBooking.balanceDue) > 0
                    ? `ค้างชำระ: ${formatCurrency(billingMode === "COMBINED" ? combinedBalanceDue : selectedBooking.balanceDue)}`
                    : "ชำระครบถ้วน"}
                </span>
              </div>
            </div>

            {/* Right: Action Buttons Group (Never overlaps bill contents) */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* 1. Print Receipt Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors min-h-[42px] cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-4 h-4 text-stone-500" />
                <span className="whitespace-nowrap">พิมพ์ใบเสร็จ (Print)</span>
              </button>

              {/* 2. Email Receipt Button */}
              <button
                type="button"
                onClick={() => {
                  setEmailInput(selectedBooking.guestEmail || "");
                  setEmailErrorMsg("");
                  setEmailStatusMsg("");
                  setIsEmailModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/25 transition-all min-h-[42px] cursor-pointer whitespace-nowrap"
              >
                <Mail className="w-4 h-4" />
                <span className="whitespace-nowrap">ส่งใบเสร็จเข้าอีเมล (Email)</span>
              </button>

              {/* 3. PromptPay QR Button if there is outstanding balance */}
              {(billingMode === "COMBINED" ? combinedBalanceDue : selectedBooking.balanceDue) > 0 && (
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all min-h-[42px] cursor-pointer whitespace-nowrap"
                >
                  <QrCode className="w-4 h-4" />
                  <span className="whitespace-nowrap">QR รับเงิน ({formatCurrency(billingMode === "COMBINED" ? combinedBalanceDue : selectedBooking.balanceDue)})</span>
                </button>
              )}

              {/* 4. Guest ID / Passport Button */}
              {selectedBooking.guestIdCardImage ? (
                <button
                  type="button"
                  onClick={() => setViewingIdCardUrl(selectedBooking.guestIdCardImage || null)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition-all min-h-[42px] cursor-pointer whitespace-nowrap"
                >
                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="whitespace-nowrap">ดูบัตร/Passport</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAttachingIdModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-semibold transition-all min-h-[42px] cursor-pointer whitespace-nowrap"
                >
                  <CreditCard className="w-4 h-4 text-stone-500" />
                  <span className="whitespace-nowrap">แนบบัตร/Passport</span>
                </button>
              )}

              {/* 5. Guest Signature Button */}
              <button
                type="button"
                onClick={() => {
                  setTempSignature(selectedBooking.guestSignatureImage || null);
                  setIsSignatureModalOpen(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[42px] cursor-pointer border whitespace-nowrap ${
                  selectedBooking.guestSignatureImage
                    ? "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-xs"
                }`}
              >
                <PenLine className="w-4 h-4" />
                <span className="whitespace-nowrap">{selectedBooking.guestSignatureImage ? "ดู/แก้ไขลายเซ็น" : "เซ็นชื่อผู้เข้าพัก"}</span>
              </button>

              {/* 6. Slip Viewer Button if slip is attached */}
              {selectedBooking.slipImage && (
                <button
                  type="button"
                  onClick={() => setViewingSlipUrl(selectedBooking.slipImage || null)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all min-h-[42px] cursor-pointer whitespace-nowrap"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span className="whitespace-nowrap">ดูสลิปโอนเงิน</span>
                </button>
              )}

              {/* 7. Checkout Button if Checked In */}
              {selectedBooking.status === "CHECKED_IN" && (
                <button
                  type="button"
                  onClick={handleOpenCheckout}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all min-h-[42px] cursor-pointer whitespace-nowrap"
                >
                  <DoorOpen className="w-4 h-4" />
                  <span className="whitespace-nowrap">ชำระยอดค้าง & เช็คเอาต์</span>
                </button>
              )}

              {/* 8. Settled Badge if Checked Out */}
              {selectedBooking.status === "CHECKED_OUT" && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-700 whitespace-nowrap">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span className="whitespace-nowrap">ชำระครบถ้วน & เช็คเอาต์แล้ว</span>
                </div>
              )}
            </div>

          </div>

          {/* Luxury Printable Receipt Container */}
          <div id="printable-receipt" className="bg-white dark:bg-[#101c42] rounded-3xl border border-amber-300/40 dark:border-amber-800/40 p-5 sm:p-8 md:p-10 shadow-2xl relative transition-all space-y-6">
            
            {/* Hotel Letterhead with Official Logo */}
            <div className="border-b-2 border-amber-500/20 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-white shrink-0 border border-amber-200/60 shadow-xs flex items-center justify-center p-1.5">
                  <img 
                    src={selectedBooking.propertyId === "bugaan" ? "/logos/bugaan-logo.jpg" : "/logos/thanawong-logo.jpg"} 
                    alt={selectedBooking.propertyId === "bugaan" ? "Bu-Gaan Sukhothai Logo" : "Thanawong Pool Villa Logo"}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-stone-900 dark:text-white font-serif font-black text-base sm:text-2xl leading-tight tracking-wide uppercase">
                    {selectedBooking.propertyId === "bugaan" ? (
                      <span>BU-GAAN SUKHOTHAI VILLAGE</span>
                    ) : (
                      <span>THANAWONG POOL VILLA</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1">
                    {hotelNameTh}
                  </p>
                  <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                    {hotelAddress}
                  </p>
                  <p className="text-[10.5px] text-stone-400 mt-0.5">
                    GUEST FOLIO & TAX INVOICE • ใบสรุปค่าใช้จ่ายและใบเสร็จรับเงิน
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-400/40 whitespace-nowrap">
                  {selectedBooking.status === "CHECKED_OUT" ? "ใบเสร็จรับเงิน (OFFICIAL RECEIPT)" : "ใบแจ้งหนี้ / ใบเสร็จอย่างย่อ"}
                </span>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 whitespace-nowrap">
                  พิมพ์เมื่อ: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Folio Info & Guest Details (Structured, elegant luxury hotel metadata table) */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800/80 bg-stone-50/70 dark:bg-slate-900/40 p-4 sm:p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-3.5 sm:gap-y-4 text-xs">
                
                {/* 1. Folio Number */}
                <div className="min-w-0">
                  <span className="text-[10.5px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    {billingMode === "COMBINED" && hasGroup ? "รหัสกลุ่ม (Group ID)" : "เลขที่บิล (Folio No.)"}
                  </span>
                  <span className="font-mono font-bold text-stone-900 dark:text-white text-xs sm:text-sm mt-0.5 block truncate">
                    {billingMode === "COMBINED" && hasGroup 
                      ? (selectedBooking.groupBookingId || selectedBooking.bookingNumber) 
                      : selectedBooking.bookingNumber}
                  </span>
                </div>

                {/* 2. Room & Property */}
                <div className="min-w-0">
                  <span className="text-[10.5px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    {billingMode === "COMBINED" && hasGroup ? "ห้องพัก (Rooms)" : "ห้องพัก (Room No.)"}
                  </span>
                  <span className="font-serif font-bold text-amber-700 dark:text-amber-400 text-xs sm:text-sm mt-0.5 block truncate">
                    {billingMode === "COMBINED" && hasGroup
                      ? `${activeFolioBookings.map(b => `ห้อง ${b.roomNumber}`).join(", ")} (${activeFolioBookings.length} ห้อง)`
                      : `ห้อง ${selectedBooking.roomNumber}`}
                  </span>
                </div>

                {/* 3. Guest Name */}
                <div className="min-w-0">
                  <span className="text-[10.5px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    {billingMode === "COMBINED" && hasGroup ? "ผู้จอง / คณะ" : "ชื่อผู้เข้าพัก (Guest Name)"}
                  </span>
                  <span className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm mt-0.5 block truncate" title={selectedBooking.guestName}>
                    {billingMode === "COMBINED" && hasGroup
                      ? (selectedBooking.companyName || selectedBooking.guestName)
                      : selectedBooking.guestName}
                  </span>
                </div>

                {/* 4. Contact Phone */}
                <div className="min-w-0">
                  <span className="text-[10.5px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    เบอร์ติดต่อ (Phone)
                  </span>
                  <span className="font-mono font-medium text-stone-900 dark:text-white text-xs sm:text-sm mt-0.5 block truncate">
                    {selectedBooking.guestPhone || "-"}
                  </span>
                </div>

                {/* 5. Check-in Date */}
                <div className="min-w-0">
                  <span className="text-[10.5px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    วันเช็คอิน (Check-in)
                  </span>
                  <span className="font-medium text-stone-800 dark:text-stone-200 text-xs sm:text-sm mt-0.5 block truncate">
                    {formatDateThai(selectedBooking.checkInDate)}
                  </span>
                </div>

                {/* 6. Check-out Date */}
                <div className="min-w-0">
                  <span className="text-[10.5px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    วันเช็คเอาต์ (Check-out)
                  </span>
                  <span className="font-medium text-stone-800 dark:text-stone-200 text-xs sm:text-sm mt-0.5 block truncate">
                    {formatDateThai(selectedBooking.checkOutDate)} ({selectedBooking.totalNights} คืน)
                  </span>
                </div>

                {/* 7. Folio Type */}
                <div className="min-w-0">
                  <span className="text-[10.5px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    รูปแบบบิล (Folio Type)
                  </span>
                  <span className="font-semibold text-amber-800 dark:text-amber-300 text-xs sm:text-sm mt-0.5 block truncate">
                    {billingMode === "COMBINED" && hasGroup ? `บิลรวม (${activeFolioBookings.length} ห้อง)` : "บิลเดี่ยวแยกห้อง"}
                  </span>
                </div>

                {/* 8. Booking Source */}
                <div className="min-w-0">
                  <span className="text-[10.5px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    ช่องทาง (Channel)
                  </span>
                  <span className="font-medium text-stone-800 dark:text-stone-200 text-xs sm:text-sm mt-0.5 block truncate">
                    {selectedBooking.source}
                  </span>
                </div>

              </div>
            </div>

            {orderActionFeedback && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 print:hidden shadow-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{orderActionFeedback}</span>
              </div>
            )}

            {/* Charges Itemized Table */}
            <div className="py-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white whitespace-nowrap">
                    {billingMode === "COMBINED" && hasGroup
                      ? `รายการค่าใช้จ่ายรวมทุกห้องพัก (${activeFolioBookings.length} ห้อง - ${selectedBooking.companyName || selectedBooking.guestName})`
                      : "รายการค่าใช้จ่ายทั้งหมด (Itemized Breakdown)"}
                  </h4>
                  {billingMode === "COMBINED" && hasGroup && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 whitespace-nowrap">
                      แสดงรายละเอียดแยกตามแต่ละห้อง พร้อมยอดรวมทั้งกลุ่ม
                    </p>
                  )}
                </div>

                {selectedBooking.status === "CHECKED_IN" && (
                  <button
                    type="button"
                    onClick={() => setIsChargeModalOpen(!isChargeModalOpen)}
                    className="no-print self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold transition-all min-h-[36px] cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="whitespace-nowrap">+ เพิ่มค่าใช้จ่าย (ซักผ้า, ค่าเสียหาย, ทัวร์, ฯลฯ)</span>
                  </button>
                )}
              </div>

              {chargeSuccessMsg && (
                <div className="no-print mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{chargeSuccessMsg}</span>
                </div>
              )}

              {/* Quick Charge Form inside Folio (Hide on Print) */}
              {isChargeModalOpen && (
                <div className="no-print mb-4 p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-300/60 dark:border-amber-800/60 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 dark:text-amber-200 flex items-center gap-1.5 whitespace-nowrap">
                      <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                      เพิ่มค่าใช้จ่ายเข้าบิลห้อง {selectedBooking.roomNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsChargeModalOpen(false)}
                      className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "ซักรีด", title: "ค่าบริการซักรีดเสื้อผ้า", amount: 180 },
                      { label: "ของเสียหาย", title: "ค่าชดเชยของใช้เสียหาย", amount: 500 },
                      { label: "ทำความสะอาดพิเศษ", title: "ค่าทำความสะอาดคราบหนักพิเศษ", amount: 350 },
                      { label: "รถรับส่งสนามบิน", title: "ค่าบริการรถตู้รับส่งสนามบิน", amount: 600 },
                      { label: "มินิบาร์เพิ่ม", title: "เครื่องดื่มมินิบาร์พิเศษ", amount: 250 },
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setChargeTitle(preset.title);
                          setChargeAmount(preset.amount);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/60 text-stone-700 dark:text-stone-200 hover:bg-amber-100/60 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="ระบุรายการ เช่น ค่าซักรีด 4 ชิ้น, ค่าแก้วแตก..."
                      value={chargeTitle}
                      onChange={(e) => setChargeTitle(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <div className="relative w-32">
                        <span className="absolute left-2.5 top-2 text-xs text-stone-400 font-bold">฿</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="จำนวนเงิน"
                          value={chargeAmount}
                          onChange={(e) => setChargeAmount(Number(e.target.value))}
                          className="w-full pl-6 pr-2.5 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!chargeTitle || chargeAmount <= 0}
                        onClick={() => {
                          addCustomChargeToBooking(selectedBooking.id, chargeTitle, Number(chargeAmount));
                          setChargeSuccessMsg(`เพิ่ม "${chargeTitle}" (${formatCurrency(chargeAmount)}) เข้าบิลสำเร็จ!`);
                          setChargeTitle("");
                          setIsChargeModalOpen(false);
                          setTimeout(() => {
                            setChargeSuccessMsg("");
                          }, 3000);
                        }}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer whitespace-nowrap"
                      >
                        บันทึกเข้าบิล
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Itemized Charges List: Table on Desktop/Print, Card List on Mobile */}
              <div>
                {/* 1. Desktop & Print View: Elegant Table */}
                <div className="hidden md:block print:block rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50/80 dark:bg-slate-800/80 text-stone-500 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-stone-800">
                      <tr>
                        <th className="p-3.5">รายการ (Description)</th>
                        <th className="p-3.5 text-center">ห้องพัก</th>
                        <th className="p-3.5 text-center">จำนวน</th>
                        <th className="p-3.5 text-right">ราคาต่อหน่วย</th>
                        <th className="p-3.5 text-right">รวมเงิน (THB)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                      {/* Room Charges for all active bookings */}
                      {activeFolioBookings.map((b) => (
                        <React.Fragment key={`room-${b.id}`}>
                          <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-3.5 font-medium text-stone-800 dark:text-stone-200">
                              <div>
                                <span className="font-semibold">ค่าห้องพัก ({b.roomNumber}) - {b.guestName}</span>
                                {b.companyName && (
                                  <span className="block text-[10px] text-amber-600 dark:text-amber-400">
                                    คณะ: {b.companyName}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 text-center font-bold text-stone-700 dark:text-stone-300">
                              ห้อง {b.roomNumber}
                            </td>
                            <td className="p-3.5 text-center text-stone-600 dark:text-stone-300">
                              {b.totalNights} คืน
                            </td>
                            <td className="p-3.5 text-right text-stone-600 dark:text-stone-300">
                              {formatCurrency(b.roomRate)}
                            </td>
                            <td className="p-3.5 text-right font-bold text-stone-900 dark:text-white">
                              {formatCurrency(b.roomTotal)}
                            </td>
                          </tr>

                          {/* Extra Bed for this room */}
                          {b.hasExtraBed && (
                            <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="p-3.5 font-medium text-stone-800 dark:text-stone-200">
                                เตียงเสริม (Extra Bed) - ห้อง {b.roomNumber}
                              </td>
                              <td className="p-3.5 text-center text-stone-600 dark:text-stone-300">
                                ห้อง {b.roomNumber}
                              </td>
                              <td className="p-3.5 text-center text-stone-600 dark:text-stone-300">
                                {b.extraBedCount} เตียง × {b.totalNights} คืน
                              </td>
                              <td className="p-3.5 text-right text-stone-600 dark:text-stone-300">
                                {formatCurrency(b.extraBedRate)}
                              </td>
                              <td className="p-3.5 text-right font-bold text-stone-900 dark:text-white">
                                {formatCurrency(b.extraBedTotal)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}

                      {/* Room Orders POS Charges */}
                      {roomOrders.map((ord) => (
                        <tr key={ord.id} className="bg-amber-50/20 dark:bg-amber-950/20 hover:bg-amber-50/40 dark:hover:bg-amber-950/30 transition-colors">
                          <td className="p-3.5">
                            <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                              <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
                              <span>รูมเซอร์วิส / อาหาร ({ord.orderNumber})</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {ord.items.map((i, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-medium">
                                  {i.name} (x{i.quantity})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 text-center font-bold text-amber-800 dark:text-amber-300">
                            ห้อง {ord.roomNumber}
                          </td>
                          <td className="p-3.5 text-center text-stone-600 dark:text-stone-300">
                            1 บิล
                          </td>
                          <td className="p-3.5 text-right text-stone-600 dark:text-stone-300">
                            {formatCurrency(ord.totalAmount)}
                          </td>
                          <td className="p-3.5 text-right font-bold text-amber-800 dark:text-amber-300">
                            <div className="flex items-center justify-end gap-2">
                              <span>{formatCurrency(ord.totalAmount)}</span>
                              <div className="flex items-center gap-1 no-print print:hidden">
                                <button
                                  type="button"
                                  onClick={() => handleOpenTransferModal(ord)}
                                  className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                                  title="ย้ายบิลนี้ไปห้องอื่น (Transfer Room)"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOrderFromFolio(ord)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                                  title="ยกเลิก/ลบบิลอาหารนี้ออกจากห้อง (หักยอดออกจาก Folio)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 2. Mobile View: Responsive Line-Item Cards (No horizontal overflow or clipping) */}
                <div className="block md:hidden print:hidden space-y-3">
                  {/* Room Charges */}
                  {activeFolioBookings.map((b) => (
                    <div key={`mob-room-${b.id}`} className="p-3.5 rounded-2xl bg-stone-50/80 dark:bg-slate-800/50 border border-stone-200/80 dark:border-stone-700/80 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-semibold text-stone-900 dark:text-white text-xs block">
                            ค่าห้องพัก (ห้อง {b.roomNumber})
                          </span>
                          <span className="text-[11px] text-stone-500 dark:text-stone-400 block truncate">
                            {b.guestName} {b.companyName ? `• ${b.companyName}` : ""}
                          </span>
                        </div>
                        <span className="font-bold text-stone-900 dark:text-white text-sm shrink-0">
                          {formatCurrency(b.roomTotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-300 pt-1.5 border-t border-stone-200/60 dark:border-stone-700/60">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-stone-200/60 dark:bg-stone-700/60 text-stone-700 dark:text-stone-200 font-medium">
                          ห้อง {b.roomNumber}
                        </span>
                        <span>{b.totalNights} คืน × {formatCurrency(b.roomRate)}</span>
                      </div>

                      {/* Extra Bed on Mobile */}
                      {b.hasExtraBed && (
                        <div className="pt-2 mt-2 border-t border-dashed border-stone-200 dark:border-stone-700 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-stone-800 dark:text-stone-200 text-xs">
                              เตียงเสริม (Extra Bed)
                            </span>
                            <span className="font-bold text-stone-900 dark:text-white text-xs shrink-0">
                              {formatCurrency(b.extraBedTotal)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                            <span>ห้อง {b.roomNumber}</span>
                            <span>{b.extraBedCount} เตียง × {b.totalNights} คืน @ {formatCurrency(b.extraBedRate)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Room Orders POS on Mobile */}
                  {roomOrders.map((ord) => (
                    <div key={`mob-ord-${ord.id}`} className="p-3.5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300">
                            <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
                            <span>รูมเซอร์วิส / อาหาร ({ord.orderNumber})</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {ord.items.map((i, idx) => (
                              <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-100/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-medium">
                                {i.name} (x{i.quantity})
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="font-bold text-amber-900 dark:text-amber-300 text-sm shrink-0">
                          {formatCurrency(ord.totalAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-300 pt-1.5 border-t border-amber-200/60 dark:border-amber-900/50">
                        <span className="font-medium">ห้อง {ord.roomNumber}</span>
                        <span>1 บิลคำสั่งซื้อ</span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-amber-200/80 dark:border-amber-900/60 no-print print:hidden">
                        <button
                          type="button"
                          onClick={() => handleOpenTransferModal(ord)}
                          className="px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1 hover:bg-amber-50 cursor-pointer min-h-[38px]"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>ย้ายไปห้องอื่น</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrderFromFolio(ord)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 text-xs font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer min-h-[38px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ/ยกเลิกบิล</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grand Total Summary Box */}
            <div className="bg-gradient-to-br from-stone-50 to-amber-50/30 dark:from-slate-800/80 dark:to-slate-900/60 p-5 sm:p-6 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 gap-4">
                <span>ยอดรวมค่าห้องพักและเตียงเสริม ({activeFolioBookings.length} ห้อง)</span>
                <span className="text-stone-900 dark:text-stone-200 font-medium shrink-0">
                  {formatCurrency(combinedRoomTotal + combinedExtraBedTotal)}
                </span>
              </div>
              {combinedPosChargesTotal > 0 && (
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 gap-4">
                  <span>ยอดรวมค่าอาหารและรูมเซอร์วิส (Charge to Room)</span>
                  <span className="text-stone-900 dark:text-stone-200 font-medium shrink-0">
                    {formatCurrency(combinedPosChargesTotal)}
                  </span>
                </div>
              )}
              <div className="pt-2.5 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between font-bold text-sm sm:text-base gap-4">
                <span className="text-stone-900 dark:text-white">ยอดรวมสุทธิ (Grand Total)</span>
                <span className="font-serif text-amber-700 dark:text-amber-400 text-base sm:text-lg shrink-0">
                  {formatCurrency(combinedGrandTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 pt-1 gap-4">
                <span>หัก เงินมัดจำที่ชำระแล้ว (Deposit Paid)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                  -{formatCurrency(combinedDepositPaid)}
                </span>
              </div>
              <div className="pt-2.5 border-t border-dashed border-stone-300 dark:border-stone-600 flex items-center justify-between font-bold text-sm sm:text-base gap-4">
                <span className={combinedBalanceDue > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                  {combinedBalanceDue > 0 ? "ยอดค้างชำระเช็คเอาต์ (Balance Due)" : "ยอดชำระครบถ้วน (Fully Settled)"}
                </span>
                <span className={`text-base sm:text-xl font-serif shrink-0 ${combinedBalanceDue > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {formatCurrency(combinedBalanceDue)}
                </span>
              </div>
            </div>

            {/* Signatures for Print and Digital Display */}
            <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-8 sm:gap-12 text-center text-xs text-stone-500">
              
              {/* Guest Signature Box */}
              <div className="flex flex-col items-center">
                <div className="min-h-16 relative flex flex-col items-center justify-end pb-1 w-full">
                  {selectedBooking.guestSignatureImage ? (
                    <div className="relative group">
                      <img
                        src={selectedBooking.guestSignatureImage}
                        alt="Guest Signature"
                        className="max-h-14 max-w-[200px] object-contain mx-auto"
                      />
                      <div className="no-print absolute -top-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setTempSignature(selectedBooking.guestSignatureImage || null);
                            setIsSignatureModalOpen(true);
                          }}
                          className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md border border-stone-300 dark:border-stone-600 hover:bg-stone-200 cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          แก้ไข
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center">
                      <div className="no-print mb-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTempSignature(null);
                            setIsSignatureModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-dashed border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs font-semibold flex items-center gap-1.5 mx-auto cursor-pointer transition-colors whitespace-nowrap"
                        >
                          <PenLine className="w-3.5 h-3.5" />
                          <span>เซ็นชื่อดิจิทัล (E-Signature)</span>
                        </button>
                      </div>
                      <div className="h-8 border-b border-stone-300 dark:border-stone-700 w-48 sm:w-56"></div>
                    </div>
                  )}
                </div>
                <div className="border-t border-stone-300 dark:border-stone-700 w-48 sm:w-56 pt-1.5 mt-1">
                  <p className="font-semibold text-stone-800 dark:text-stone-200">
                    ลายมือชื่อผู้เข้าพัก (Guest Signature)
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {selectedBooking.guestName}
                  </p>
                  {selectedBooking.guestSignatureImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempSignature(selectedBooking.guestSignatureImage || null);
                        setIsSignatureModalOpen(true);
                      }}
                      className="no-print text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer font-medium whitespace-nowrap"
                    >
                      <PenLine className="w-3 h-3" />
                      <span>เปลี่ยน/เซ็นชื่อใหม่</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Front Desk Cashier / GM Signature Box */}
              <div className="flex flex-col items-center">
                <div className="min-h-16 flex items-end justify-center pb-1 w-full">
                  <div className="h-8 border-b border-stone-300 dark:border-stone-700 w-48 sm:w-56 flex items-center justify-center">
                    <span className="font-serif italic text-amber-700/60 dark:text-amber-400/60 text-xs tracking-wider">Chanin Fuenton</span>
                  </div>
                </div>
                <div className="border-t border-stone-300 dark:border-stone-700 w-48 sm:w-56 pt-1.5 mt-1">
                  <p className="font-semibold text-stone-800 dark:text-stone-200">
                    คุณชนินทร์ ฟื้นตน
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    General Manager / ผู้จัดการทั่วไป
                  </p>
                </div>
              </div>

            </div>

            {/* Official Footer Note */}
            <div className="pt-4 text-center text-[11px] text-stone-400 border-t border-stone-100 dark:border-stone-800">
              <p>
                เอกสารนี้ออกโดยระบบบริหารจัดการโรงแรม (Hotel PMS) • ขอขอบพระคุณที่เลือกเข้าพักกับเรา
              </p>
            </div>

          </div>

        </div>
      ) : (
        <div className="p-12 text-center text-stone-400 bg-white dark:bg-[#101c42] rounded-3xl border border-stone-200 dark:border-stone-800">
          ไม่มีข้อมูลการจองในขณะนี้
        </div>
      )}

      {/* Checkout Settlement Modal */}
      {isCheckoutModalOpen && selectedBooking && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-[#0e1738] rounded-3xl max-w-lg w-full p-4 sm:p-6 md:p-7 shadow-2xl border border-amber-300/40 dark:border-amber-800/40 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold shrink-0">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                    ยืนยันเช็คเอาต์ห้องพัก {selectedBooking.roomNumber}
                  </h3>
                  <p className="text-xs text-stone-500 truncate max-w-[200px] sm:max-w-none">
                    ผู้เข้าพัก: {selectedBooking.guestName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                  ปิดบิลและเช็คเอาต์สำเร็จ!
                </h4>
                <p className="text-xs text-stone-500">
                  ห้องพักถูกเปลี่ยนสถานะเป็น &quot;กำลังทำความสะอาด (Cleaning)&quot; เรียบร้อย
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmCheckout} className="mt-4 space-y-4">
                
                {/* Outstanding balance breakdown box */}
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>สรุปยอดค้างชำระก่อนส่งมอบห้อง (Outstanding Folio)</span>
                  </div>

                  <div className="text-xs space-y-1 pt-1">
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>ยอดค่าห้อง + เตียงเสริม:</span>
                      <span className="font-medium text-stone-900 dark:text-stone-200">
                        {formatCurrency(selectedBooking.roomTotal + selectedBooking.extraBedTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>ยอดรวมอาหาร/รูมเซอร์วิส (POS):</span>
                      <span className="font-medium text-stone-900 dark:text-stone-200">
                        {formatCurrency(selectedBooking.posChargesTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>มัดจำแล้ว:</span>
                      <span className="font-semibold text-emerald-600">
                        -{formatCurrency(selectedBooking.depositPaid)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 flex justify-between items-baseline font-bold">
                      <span className="text-stone-900 dark:text-white text-sm">ยอดเงินที่ต้องชำระสุทธิ:</span>
                      <span className="text-xl font-serif text-rose-600 dark:text-rose-400">
                        {formatCurrency(selectedBooking.balanceDue)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selector */}
                {selectedBooking.balanceDue > 0 ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                      เลือกวิธีชำระยอดค้างชำระ:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod("PROMPTPAY_QR")}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all ${
                          selectedPaymentMethod === "PROMPTPAY_QR"
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700"
                        }`}
                      >
                        <QrCode className="w-5 h-5" />
                        <span>PromptPay QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod("CASH")}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all ${
                          selectedPaymentMethod === "CASH"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700"
                        }`}
                      >
                        <Banknote className="w-5 h-5" />
                        <span>เงินสด (Cash)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod("CREDIT_CARD")}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all ${
                          selectedPaymentMethod === "CREDIT_CARD"
                            ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                            : "bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700"
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span>บัตรเครดิต</span>
                      </button>
                    </div>

                    {selectedPaymentMethod === "PROMPTPAY_QR" && (
                      <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 text-xs">
                            <p className="font-bold text-stone-900 dark:text-white truncate">
                              QR รับเงิน Bu-Gaan ({formatCurrency(selectedBooking.balanceDue)})
                            </p>
                            <p className="text-[11px] text-stone-500 truncate">
                              {checkoutSlipImage ? "แนบภาพสลิปแล้ว" : "สแกน QR พร้อมถ่ายรูปสลิป"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsQrModalOpen(true)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs shrink-0 cursor-pointer"
                        >
                          {checkoutSlipImage ? "ดู/เปลี่ยนสลิป" : "เปิด QR & ถ่ายสลิป"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>ผู้เข้าพักชำระเงินครบถ้วนแล้ว ไม่มีหนี้ค้างชำระ</span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-slate-800 min-h-[44px]"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 min-h-[44px]"
                  >
                    ยืนยันการรับชำระ & ปิดห้อง
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PromptPay QR & Slip Verification Modal */}
      {selectedBooking && (
        <PromptPayPaymentModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          amount={billingMode === "COMBINED" && hasGroup ? combinedBalanceDue : selectedBooking.balanceDue}
          title={`ชำระเงินห้อง ${selectedBooking.roomNumber} (${selectedBooking.propertyId === "thanawong" ? "Thanawong" : "Bu-Gaan"})`}
          bookingNumber={selectedBooking.bookingNumber}
          roomNumber={selectedBooking.roomNumber}
          guestName={selectedBooking.guestName}
          propertyId={selectedBooking.propertyId}
          onPaymentSuccess={(slipUrl) => {
            if (slipUrl) {
              setCheckoutSlipImage(slipUrl);
            }
            if (isCheckoutModalOpen) {
              setSelectedPaymentMethod("PROMPTPAY_QR");
            } else {
              // Direct payment settlement from Folio
              settleBookingAndCheckOut(selectedBooking.id, "PROMPTPAY_QR", slipUrl);
            }
          }}
        />
      )}

      {/* Slip Fullscreen Viewer */}
      {viewingSlipUrl && (
        <div className="no-print fixed inset-0 z-60 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 border border-stone-200 dark:border-stone-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white">
              <span className="font-serif font-bold text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                หลักฐานสลิปการโอนเงิน (Slip Preview)
              </span>
              <button
                onClick={() => setViewingSlipUrl(null)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 flex justify-center">
              <img
                src={viewingSlipUrl}
                alt="Payment Slip"
                className="max-h-[65vh] rounded-xl object-contain border border-stone-200 dark:border-stone-800 shadow-inner"
              />
            </div>
            <div className="text-center pt-2">
              <button
                onClick={() => setViewingSlipUrl(null)}
                className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Digital Signature Modal */}
      {isSignatureModalOpen && selectedBooking && (
        <div className="no-print fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-white dark:bg-[#101c42] rounded-3xl p-5 sm:p-6 border border-stone-200 dark:border-stone-700 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <PenLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                    ลายมือชื่อผู้เข้าพัก (Guest Digital Signature)
                  </h3>
                  <p className="text-xs text-stone-500">
                    ห้อง {selectedBooking.roomNumber} - {selectedBooking.guestName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-stone-600 dark:text-stone-300">
                กรุณาให้ลูกค้าลงลายมือชื่อบนหน้าจอเพื่อใช้ประกอบใบเสร็จ Folio และบันทึกประวัติการเข้าพัก:
              </p>
              <SignaturePad
                initialSignature={tempSignature || undefined}
                onChange={(sig) => setTempSignature(sig)}
                height={190}
              />
            </div>

            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
              {selectedBooking.guestSignatureImage ? (
                <button
                  type="button"
                  onClick={() => {
                    updateBooking(selectedBooking.id, { guestSignatureImage: undefined });
                    setTempSignature(null);
                    setIsSignatureModalOpen(false);
                  }}
                  className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer transition-colors"
                >
                  ลบลายเซ็นเดิม
                </button>
              ) : (
                <div></div>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (tempSignature) {
                      updateBooking(selectedBooking.id, { guestSignatureImage: tempSignature });
                    }
                    setIsSignatureModalOpen(false);
                  }}
                  disabled={!tempSignature}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  บันทึกลายเซ็น
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID Card / Passport Viewer Modal */}
      {viewingIdCardUrl && selectedBooking && (
        <div className="no-print fixed inset-0 z-60 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <div className="relative max-w-xl w-full bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 border border-stone-200 dark:border-stone-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white">
              <span className="font-serif font-bold text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>เอกสารประจำตัวผู้เข้าพัก (ID Card / Passport)</span>
              </span>
              <button
                type="button"
                onClick={() => setViewingIdCardUrl(null)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 flex justify-center">
              <img
                src={viewingIdCardUrl}
                alt="Guest ID / Passport"
                className="max-h-[65vh] w-auto rounded-xl object-contain border border-stone-200 dark:border-stone-800 shadow-inner"
              />
            </div>
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  updateBooking(selectedBooking.id, { guestIdCardImage: undefined });
                  setViewingIdCardUrl(null);
                }}
                className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer"
              >
                ลบเอกสารนี้
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewingIdCardUrl(null);
                    setIsAttachingIdModalOpen(true);
                  }}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  อัปโหลดใหม่
                </button>
                <button
                  type="button"
                  onClick={() => setViewingIdCardUrl(null)}
                  className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attach ID Card / Passport Modal */}
      {isAttachingIdModalOpen && selectedBooking && (
        <div className="no-print fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200 dark:border-stone-700 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white">
              <span className="font-serif font-bold text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>แนบเอกสารประจำตัว (ID Card / Passport)</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAttachingIdModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-stone-600 dark:text-stone-300">
                ห้อง {selectedBooking.roomNumber} - {selectedBooking.guestName}
              </p>

              {/* Hidden file inputs */}
              <input
                ref={folioCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setIsUploadingIdCard(true);
                    const hotelTitle = selectedBooking.propertyId === "thanawong"
                      ? "ธาราวงศ์ พูลวิลล่า รีสอร์ท"
                      : "Bu-Gaan Sukhothai Resort";
                    const compressed = await compressImageWithPdpaWatermark(
                      file,
                      hotelTitle,
                      selectedBooking.bookingNumber
                    );
                    updateBooking(selectedBooking.id, { guestIdCardImage: compressed });
                    setIsAttachingIdModalOpen(false);
                    setViewingIdCardUrl(compressed);
                  } catch (err) {
                    console.error("Upload error:", err);
                  } finally {
                    setIsUploadingIdCard(false);
                    if (e.target) e.target.value = "";
                  }
                }}
              />
              <input
                ref={folioFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setIsUploadingIdCard(true);
                    const hotelTitle = selectedBooking.propertyId === "thanawong"
                      ? "ธาราวงศ์ พูลวิลล่า รีสอร์ท"
                      : "Bu-Gaan Sukhothai Resort";
                    const compressed = await compressImageWithPdpaWatermark(
                      file,
                      hotelTitle,
                      selectedBooking.bookingNumber
                    );
                    updateBooking(selectedBooking.id, { guestIdCardImage: compressed });
                    setIsAttachingIdModalOpen(false);
                    setViewingIdCardUrl(compressed);
                  } catch (err) {
                    console.error("Upload error:", err);
                  } finally {
                    setIsUploadingIdCard(false);
                    if (e.target) e.target.value = "";
                  }
                }}
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => folioCameraInputRef.current?.click()}
                  disabled={isUploadingIdCard}
                  className="p-4 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-stone-700 dark:text-stone-300 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer min-h-[90px]"
                >
                  <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold">ถ่ายรูปด้วยกล้อง</span>
                  <span className="text-[10px] text-stone-400">ใช้กล้องมือถือ/แท็บเล็ต</span>
                </button>
                <button
                  type="button"
                  onClick={() => folioFileInputRef.current?.click()}
                  disabled={isUploadingIdCard}
                  className="p-4 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-stone-700 dark:text-stone-300 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer min-h-[90px]"
                >
                  <Upload className="w-6 h-6 text-stone-500 dark:text-stone-400" />
                  <span className="text-xs font-bold">เลือกไฟล์รูปภาพ</span>
                  <span className="text-[10px] text-stone-400">จากโฟลเดอร์/คลังรูป</span>
                </button>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setIsAttachingIdModalOpen(false)}
                className="px-4 py-2 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Folio Receipt Modal */}
      {isEmailModalOpen && selectedBooking && (
        <div className="no-print fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="relative max-w-lg w-full bg-white dark:bg-[#101c42] rounded-3xl p-5 sm:p-6 border border-amber-300/40 dark:border-amber-800/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg">
                    ส่งใบเสร็จรับเงินเข้าอีเมล (Email Folio)
                  </h3>
                  <p className="text-xs text-stone-500">
                    ห้อง {selectedBooking.roomNumber} - {selectedBooking.guestName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  ระบุอีเมลผู้รับ (Recipient Email):
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="เช่น guest@gmail.com หรือ finance@company.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-900 text-xs sm:text-sm font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                {/* Quick domain buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-stone-400">เพิ่มด่วน:</span>
                  {["@gmail.com", "@hotmail.com", "@yahoo.com", "@outlook.com"].map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => {
                        const prefix = emailInput.split("@")[0] || "";
                        if (prefix) setEmailInput(prefix + domain);
                        else setEmailInput(domain);
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>

              {/* Folio Preview Summary Card */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-stone-700/80 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-stone-500 pb-1.5 border-b border-stone-200 dark:border-stone-700">
                  <span className="font-bold text-stone-800 dark:text-stone-200">{hotelNameTh}</span>
                  <span className="font-mono text-[11px]">#{selectedBooking.bookingNumber}</span>
                </div>
                <div className="text-[11px] text-stone-500">
                  <p>{hotelAddress}</p>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-300 pt-1">
                  <span>ผู้เข้าพัก: <b className="text-stone-900 dark:text-white">{selectedBooking.guestName}</b></span>
                  <span>ห้อง: <b className="text-amber-700 dark:text-amber-400">ห้อง {selectedBooking.roomNumber}</b></span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-300">
                  <span>ระยะเวลา: {formatDateThai(selectedBooking.checkInDate)} - {formatDateThai(selectedBooking.checkOutDate)}</span>
                  <span>({selectedBooking.totalNights} คืน)</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900 dark:text-white pt-1.5 border-t border-stone-200 dark:border-stone-700">
                  <span>ยอดสุทธิ:</span>
                  <span className="font-serif text-amber-700 dark:text-amber-400">
                    {formatCurrency(billingMode === "COMBINED" ? combinedGrandTotal : selectedBooking.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Alerts */}
              {emailErrorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{emailErrorMsg}</span>
                </div>
              )}

              {emailStatusMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{emailStatusMsg}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="คัดลอกข้อความสรุปส่ง LINE หรือ Chat"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSummary ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}</span>
                </button>

                <a
                  href={getMailtoHref()}
                  className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="เปิดในแอปเมลในเครื่อง (เช่น Mail หรือ Outlook)"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>เปิดใน Mail App</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  type="button"
                  disabled={isSendingEmail || !emailInput}
                  onClick={handleSendFolioEmail}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSendingEmail ? (
                    <span>กำลังส่ง...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>ส่งอีเมลทันที</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Transfer Order to Another Room Modal */}
      {transferringOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0e1738] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-300/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                  ย้ายบิลอาหารไปห้องอื่น (Transfer Room)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTransferringOrder(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-2xl text-xs space-y-1.5 border border-amber-200/80 dark:border-amber-900/60">
              <div className="flex justify-between">
                <span className="text-stone-500">เลขที่บิล:</span>
                <span className="font-bold text-stone-900 dark:text-white">#{transferringOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">ห้องพักปัจจุบัน:</span>
                <span className="font-bold text-amber-700 dark:text-amber-300">ห้อง {transferringOrder.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">ยอดรวมค่าอาหาร:</span>
                <span className="font-bold text-stone-900 dark:text-white">{formatCurrency(transferringOrder.totalAmount)}</span>
              </div>
              <div className="text-[11px] text-stone-500 pt-1 border-t border-amber-200/60 dark:border-amber-900/40 truncate">
                รายการ: {transferringOrder.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
              </div>
            </div>

            <form onSubmit={handleConfirmTransferOrder} className="space-y-4">
              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-stone-700 dark:text-stone-300">
                  เลือกห้องพักเป้าหมายที่ต้องการย้ายบิลไป *
                </label>
                <select
                  required
                  value={targetTransferRoomId}
                  onChange={(e) => setTargetTransferRoomId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs font-semibold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- กรุณาเลือกห้องพักเป้าหมาย --</option>
                  {rooms
                    .filter((r) => r.id !== transferringOrder.roomId && r.status === "OCCUPIED")
                    .map((room) => (
                      <option key={room.id} value={room.id}>
                        ห้อง {room.roomNumber} - {room.guestName || "ผู้เข้าพัก"} ({room.propertyId === "bugaan" ? "Bu-Gaan" : "Thanawong"})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-stone-400">
                  ระบบจะหักยอดออกจากบิลห้อง {transferringOrder.roomNumber} และนำไปชาร์จเพิ่มในบิลห้องเป้าหมายให้อัตโนมัติ
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTransferringOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-800 min-h-[44px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!targetTransferRoomId}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-600/30 cursor-pointer min-h-[44px]"
                >
                  ยืนยันย้ายห้อง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
