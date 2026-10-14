"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { Booking, BookingStatus, MenuItem, MenuCategory, PropertyId, Room, RoomType, RoomStatus, isUserAdminOrGM, RoomOrder, PropertyPromptPayConfig, PromptPayTargetType } from "@/types/pms";
import { formatCurrency, formatDateThai } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportExcel";
import QRCode from "qrcode";
import { generatePromptPayPayload, DEFAULT_PROMPTPAY_CONFIGS } from "@/lib/promptpay";
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Edit3, 
  Utensils, 
  DollarSign, 
  Search, 
  History, 
  CheckCircle2, 
  X,
  ShoppingBag,
  Database,
  Download,
  Upload,
  RefreshCw,
  BedDouble,
  BarChart3,
  AlertTriangle,
  FileJson,
  Check,
  Building,
  Palmtree,
  Sparkles,
  Calendar,
  TrendingUp,
  BarChart2,
  PieChart,
  Filter,
  ArrowUpRight,
  SlidersHorizontal,
  Globe,
  Users,
  UserPlus,
  UserCheck,
  Shield,
  Key,
  ChevronDown,
  Grid3X3,
  Layers,
  Eye,
  Receipt,
  ShieldCheck,
  FileCheck2,
  PenLine,
  Phone,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  LayoutList,
  LayoutGrid,
  Table,
  QrCode
} from "lucide-react";
import { StaffUser } from "@/types/pms";
import { ChannelManagerView } from "@/components/ChannelManagerView";
import { RoomAvailabilityManager } from "@/components/RoomAvailabilityManager";

interface BackofficeAdminViewProps {
  onOpenInstall?: () => void;
  onGoToFolio?: (bookingId?: string) => void;
}

export function BackofficeAdminView({ onOpenInstall, onGoToFolio }: BackofficeAdminViewProps = {}) {
  const { 
    bookings, 
    menuItems, 
    orders, 
    rooms,
    properties,
    activePropertyId,
    updateBooking, 
    deleteBooking, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem,
    deleteOrder,
    transferOrderToRoom,
    addCustomChargeToBooking,
    addRoom,
    updateRoom,
    deleteRoom,
    backupDatabase,
    restoreDatabase,
    resetDatabase,
    isDatabaseInstalled,
    databaseConfig,
    lastSyncTime,
    currentUser,
    staffUsers,
    addStaffUser,
    updateStaffUser,
    deleteStaffUser,
    requireCheckInDocuments,
    setRequireCheckInDocuments,
    promptPayConfigs,
    updatePromptPayConfig,
    getPromptPayConfig
  } = usePMS();

  type AdminSubTab = "history" | "ota" | "rooms" | "menu" | "charges" | "staff" | "database" | "analytics" | "payment";

  const isStaffOnly = currentUser ? !isUserAdminOrGM(currentUser) : false;

  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get("subtab");
      if (isStaffOnly) return "rooms";
      if (sub && ["history", "ota", "rooms", "menu", "charges", "staff", "database", "analytics", "payment"].includes(sub)) {
        return sub as AdminSubTab;
      }
    }
    return isStaffOnly ? "rooms" : "history";
  });

  // Synchronize subtab to URL so refresh persists the current subtab
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("subtab") !== activeSubTab) {
        url.searchParams.set("subtab", activeSubTab);
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeSubTab]);

  // Handle browser back/forward buttons
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get("subtab");
      if (isStaffOnly) {
        setActiveSubTab("rooms");
        return;
      }
      if (sub && ["history", "ota", "rooms", "menu", "charges", "staff", "database", "analytics", "payment"].includes(sub)) {
        setActiveSubTab(sub as AdminSubTab);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const getSubTabUrl = (sub: AdminSubTab) => {
    if (typeof window === "undefined") return `?property=${activePropertyId}&tab=admin&subtab=${sub}`;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "admin");
      url.searchParams.set("subtab", sub);
      return url.search;
    } catch {
      return `?property=${activePropertyId}&tab=admin&subtab=${sub}`;
    }
  };

  // Mobile Menu Sheet State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Search & Filter for History & Reports
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS" | "90DAYS" | "YEAR" | "CUSTOM">("ALL");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Pagination State for History Table
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [historyViewMode, setHistoryViewMode] = useState<"list" | "grid" | "table">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hotel_history_view_mode");
      if (saved === "list" || saved === "grid" || saved === "table") return saved;
    }
    return "list";
  });

  const handleViewModeChange = (mode: "list" | "grid" | "table") => {
    setHistoryViewMode(mode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("hotel_history_view_mode", mode);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Graph Time Resolution & Metric State
  const [graphPeriod, setGraphPeriod] = useState<"DAILY" | "MONTHLY" | "YEARLY">("DAILY");
  const [graphMetric, setGraphMetric] = useState<"REVENUE" | "BOOKINGS">("REVENUE");
  const [graphStatusFilter, setGraphStatusFilter] = useState<string>("ALL");
  const [hoveredGraphIndex, setHoveredGraphIndex] = useState<number | null>(null);

  // Room Sub-tab Mode ("setup" for room CRUD vs "availability" for stop sell & quotas)
  const [roomSubMode, setRoomSubMode] = useState<"setup" | "availability">("availability");

  // Database Backup / Restore State
  const [backupRestoreMsg, setBackupRestoreMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Room Management State
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState<{
    propertyId: PropertyId;
    roomNumber: string;
    name: string;
    type: RoomType;
    isMeetingRoom: boolean;
    capacityAdults: number;
    capacityKids: number;
    pricePerNight: number;
    status: RoomStatus;
    floor: number;
    amenities: string;
  }>({
    propertyId: "bugaan",
    roomNumber: "",
    name: "Heritage Deluxe Villa",
    type: "Deluxe Villa",
    isMeetingRoom: false,
    capacityAdults: 2,
    capacityKids: 1,
    pricePerNight: 2800,
    status: "AVAILABLE",
    floor: 1,
    amenities: "King Bed, Rain Shower, Garden View, Smart TV, High Speed WiFi",
  });

  // Edit Booking Modal
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Booking Details & PDPA Viewer Modal States
  const [viewingBookingDetails, setViewingBookingDetails] = useState<Booking | null>(null);
  const [viewingPdpaDocumentImage, setViewingPdpaDocumentImage] = useState<string | null>(null);

  // Add/Edit Menu Item Modal
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState<{
    name: string;
    category: MenuCategory;
    price: number;
    propertyId: PropertyId;
    image: string;
    description: string;
    isAvailable: boolean;
  }>({
    name: "",
    category: "FOOD",
    price: 150,
    propertyId: "bugaan",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
    description: "",
    isAvailable: true,
  });
  const menuImageInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploadingMenuImage, setIsUploadingMenuImage] = useState(false);

  // POS Order Management State in Backoffice
  const [menuSubMode, setMenuSubMode] = useState<"items" | "orders">("items");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<"ALL" | "ROOM_CHARGE" | "DIRECT">("ALL");
  const [orderPropertyFilter, setOrderPropertyFilter] = useState<PropertyId | "all">("all");
  const [viewingOrderDetails, setViewingOrderDetails] = useState<RoomOrder | null>(null);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  const handleDeleteOrder = (order: RoomOrder) => {
    const isRoomCharge = order.isRoomCharge && order.bookingId;
    const confirmMessage = isRoomCharge
      ? `คุณต้องการลบรายการสั่งซื้อ #${order.orderNumber} ยอดเงิน ${formatCurrency(order.totalAmount)} (ห้อง ${order.roomNumber}) ใช่หรือไม่?\n\nหมายเหตุ: หากรายการนี้ถูกชาร์จเข้าห้องพัก ระบบจะหักลดยอดออกจากบิล Folio โดยอัตโนมัติ`
      : `คุณต้องการลบรายการสั่งซื้อ #${order.orderNumber} ยอดเงิน ${formatCurrency(order.totalAmount)} ใช่หรือไม่?`;

    if (window.confirm(confirmMessage)) {
      deleteOrder(order.id);
      if (viewingOrderDetails?.id === order.id) {
        setViewingOrderDetails(null);
      }
      setOrderSuccessMsg(`ลบรายการสั่งซื้อ #${order.orderNumber} เรียบร้อยแล้ว ${isRoomCharge ? "(ปรับลดยอดใน Folio ห้องพักแล้ว)" : ""}`);
      setTimeout(() => setOrderSuccessMsg(null), 4000);
    }
  };

  const [transferringOrder, setTransferringOrder] = useState<RoomOrder | null>(null);
  const [targetTransferRoomId, setTargetTransferRoomId] = useState<string>("");

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
    setOrderSuccessMsg(
      `ย้ายบิล #${transferringOrder.orderNumber} ไปยังห้อง ${targetRoom.roomNumber} (${targetRoom.guestName || "ผู้เข้าพัก"}) เรียบร้อยแล้ว ยอด Folio ได้รับการปรับปรุงอัตโนมัติ`
    );
    setTransferringOrder(null);
    if (viewingOrderDetails?.id === transferringOrder.id) {
      setViewingOrderDetails(null);
    }
    setTimeout(() => setOrderSuccessMsg(null), 4000);
  };

  // Custom Charge Form
  const [chargeTargetBookingId, setChargeTargetBookingId] = useState("");
  const [chargeTitle, setChargeTitle] = useState("");
  const [chargeAmount, setChargeAmount] = useState<number>(300);
  const [chargeSuccessMsg, setChargeSuccessMsg] = useState("");

  // Staff User Management State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffUser, setEditingStaffUser] = useState<StaffUser | null>(null);
  const [staffForm, setStaffForm] = useState<{
    name: string;
    username: string;
    role: "General Manager" | "Front Desk Receptionist" | "F&B Manager" | "Housekeeping Lead";
    propertyAccess: PropertyId | "all";
    avatar: string;
  }>({
    name: "",
    username: "",
    role: "Front Desk Receptionist",
    propertyAccess: "all",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  });
  const [staffSuccessMsg, setStaffSuccessMsg] = useState<string | null>(null);

  // PromptPay Branch Payment Settings State
  const [selectedPaymentPropertyId, setSelectedPaymentPropertyId] = useState<PropertyId>(() => {
    return activePropertyId !== "all" ? activePropertyId : "bugaan";
  });
  const [paymentForm, setPaymentForm] = useState<PropertyPromptPayConfig>(() => {
    return promptPayConfigs[selectedPaymentPropertyId] || DEFAULT_PROMPTPAY_CONFIGS[selectedPaymentPropertyId];
  });
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [testPaymentAmount, setTestPaymentAmount] = useState<number>(0);
  const [paymentQrDataUrl, setPaymentQrDataUrl] = useState<string>("");
  const [paymentQrPayload, setPaymentQrPayload] = useState<string>("");
  const paymentQrImageInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync form when branch changes or promptPayConfigs updates
  React.useEffect(() => {
    const cfg = promptPayConfigs[selectedPaymentPropertyId] || DEFAULT_PROMPTPAY_CONFIGS[selectedPaymentPropertyId];
    setPaymentForm(cfg);
  }, [selectedPaymentPropertyId, promptPayConfigs]);

  // Live generate test QR Code whenever paymentForm or testPaymentAmount changes
  React.useEffect(() => {
    try {
      const payload = generatePromptPayPayload(paymentForm, testPaymentAmount > 0 ? testPaymentAmount : undefined);
      setPaymentQrPayload(payload);
      QRCode.toDataURL(payload, {
        width: 320,
        margin: 1.5,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M",
      })
        .then((url) => setPaymentQrDataUrl(url))
        .catch((err) => console.error("QR Code generation error:", err));
    } catch (err) {
      console.error("Payload error:", err);
    }
  }, [paymentForm, testPaymentAmount]);

  const handleSavePaymentConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updatePromptPayConfig(selectedPaymentPropertyId, paymentForm);
    setPaymentSuccessMsg(`บันทึกการตั้งค่า PromptPay QR สำหรับ ${paymentForm.propertyName} เรียบร้อยแล้ว`);
    setTimeout(() => setPaymentSuccessMsg(null), 4000);
  };

  const handleResetPaymentConfig = () => {
    if (confirm(`คุณต้องการคืนค่าเริ่มต้นของ PromptPay สำหรับสาขานี้ใช่หรือไม่?`)) {
      const def = DEFAULT_PROMPTPAY_CONFIGS[selectedPaymentPropertyId];
      setPaymentForm(def);
      updatePromptPayConfig(selectedPaymentPropertyId, def);
      setPaymentSuccessMsg(`คืนค่าเริ่มต้น PromptPay สำหรับ ${def.propertyName} เรียบร้อยแล้ว`);
      setTimeout(() => setPaymentSuccessMsg(null), 4000);
    }
  };

  const handlePaymentQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPaymentForm((prev) => ({ ...prev, customQrImage: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // Filter Bookings by Property, Search, Status & Date Range
  const filteredBookingsList = bookings.filter((b) => {
    const matchesProp = activePropertyId === "all" || b.propertyId === activePropertyId;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      !term ||
      b.guestName.toLowerCase().includes(term) ||
      (b.guestPhone ? b.guestPhone.toLowerCase().includes(term) : false) ||
      b.bookingNumber.toLowerCase().includes(term) ||
      b.roomNumber.toLowerCase().includes(term) ||
      (b.companyName ? b.companyName.toLowerCase().includes(term) : false);
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    
    // Date Range calculation
    let matchesDate = true;
    if (dateRangeFilter === "CUSTOM" || customStartDate || customEndDate) {
      if (customStartDate && customEndDate) {
        matchesDate = 
          (b.checkInDate <= customEndDate && b.checkOutDate >= customStartDate) ||
          (b.checkInDate >= customStartDate && b.checkInDate <= customEndDate);
      } else if (customStartDate) {
        matchesDate = b.checkOutDate >= customStartDate || b.checkInDate >= customStartDate;
      } else if (customEndDate) {
        matchesDate = b.checkInDate <= customEndDate;
      }
    } else if (dateRangeFilter === "TODAY") {
      const today = new Date().toISOString().split("T")[0];
      matchesDate = (b.checkInDate <= today && b.checkOutDate >= today) || b.checkInDate === today;
    } else if (dateRangeFilter !== "ALL") {
      const bDate = new Date(b.checkInDate).getTime();
      const refDate = new Date().getTime();
      const diffDays = Math.floor((refDate - bDate) / (1000 * 60 * 60 * 24));
      if (dateRangeFilter === "7DAYS") matchesDate = diffDays >= 0 && diffDays <= 7;
      else if (dateRangeFilter === "30DAYS") matchesDate = diffDays >= 0 && diffDays <= 30;
      else if (dateRangeFilter === "90DAYS") matchesDate = diffDays >= 0 && diffDays <= 90;
      else if (dateRangeFilter === "YEAR") matchesDate = diffDays >= 0 && diffDays <= 365;
    }

    return matchesProp && matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination calculations for History Table
  const totalPages = Math.max(1, Math.ceil(filteredBookingsList.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedBookingsList = filteredBookingsList.slice(startIndex, startIndex + pageSize);

  const filteredBookingsTotal = filteredBookingsList.reduce((sum, b) => sum + b.grandTotal, 0);
  const filteredBookingsPaid = filteredBookingsList.reduce((sum, b) => sum + b.depositPaid, 0);
  const filteredBookingsBalance = filteredBookingsList.reduce((sum, b) => sum + b.balanceDue, 0);

  // Filter Orders for POS Backoffice Management
  const filteredOrdersList = orders.filter((o) => {
    const effectiveProp = orderPropertyFilter !== "all" 
      ? orderPropertyFilter 
      : activePropertyId !== "all" 
        ? activePropertyId 
        : "all";
    const matchesProp = effectiveProp === "all" || o.propertyId === effectiveProp;

    const term = orderSearchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      o.orderNumber.toLowerCase().includes(term) ||
      (o.roomNumber ? o.roomNumber.toLowerCase().includes(term) : false) ||
      (o.guestName ? o.guestName.toLowerCase().includes(term) : false) ||
      o.items.some((item) => item.name.toLowerCase().includes(term));

    const matchesPayment =
      orderPaymentFilter === "ALL" ||
      (orderPaymentFilter === "ROOM_CHARGE" && o.isRoomCharge) ||
      (orderPaymentFilter === "DIRECT" && !o.isRoomCharge);

    return matchesProp && matchesSearch && matchesPayment;
  });

  const totalOrdersCount = orders.length;
  const totalOrdersAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const roomChargeOrders = orders.filter((o) => o.isRoomCharge);
  const directPaidOrders = orders.filter((o) => !o.isRoomCharge);

  // Graph Data Aggregations (Daily, Monthly, Yearly)
  const graphBookingsPool = bookings.filter((b) => {
    const matchesProp = activePropertyId === "all" || b.propertyId === activePropertyId;
    const matchesStatus = graphStatusFilter === "ALL" || b.status === graphStatusFilter;
    return matchesProp && matchesStatus;
  });

  // 1. Daily Graph Data (Dates Oct 6 to Oct 17, 2026)
  const dailyGraphData = [
    "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10",
    "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15",
    "2026-10-16", "2026-10-17"
  ].map((dateStr) => {
    const dayBks = graphBookingsPool.filter((b) => {
      return (b.checkInDate <= dateStr && b.checkOutDate >= dateStr) || b.checkInDate === dateStr;
    });
    const rev = dayBks.reduce((sum, b) => sum + (b.roomRate || Math.round(b.grandTotal / (b.totalNights || 1))), 0);
    const count = dayBks.length;
    const [y, m, d] = dateStr.split("-");
    const isToday = dateStr === "2026-10-12";
    return {
      label: `${parseInt(d)} ต.ค.`,
      subLabel: isToday ? "วันนี้" : `${parseInt(d)}/${parseInt(m)}`,
      fullDate: dateStr,
      revenue: rev,
      bookings: count,
      value: graphMetric === "REVENUE" ? rev : count,
      highlight: isToday
    };
  });

  // 2. Monthly Graph Data (Months in 2026)
  const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const monthlyGraphData = thaiMonths.map((mName, idx) => {
    const mNumStr = String(idx + 1).padStart(2, "0");
    const mPrefix = `2026-${mNumStr}`;
    const mBks = graphBookingsPool.filter((b) => b.checkInDate.startsWith(mPrefix));
    const rev = mBks.reduce((sum, b) => sum + b.grandTotal, 0);
    const count = mBks.length;
    return {
      label: mName,
      subLabel: `2026`,
      fullDate: `2026-${mNumStr}`,
      revenue: rev,
      bookings: count,
      value: graphMetric === "REVENUE" ? rev : count,
      highlight: mNumStr === "10"
    };
  });

  // 3. Yearly Graph Data (2024, 2025, 2026)
  const yearlyGraphData = ["2024", "2025", "2026"].map((yr) => {
    const yBks = graphBookingsPool.filter((b) => b.checkInDate.startsWith(yr));
    const rev = yBks.reduce((sum, b) => sum + b.grandTotal, 0);
    const count = yBks.length;
    return {
      label: `ปี ${yr}`,
      subLabel: `ค.ศ. ${yr}`,
      fullDate: yr,
      revenue: rev,
      bookings: count,
      value: graphMetric === "REVENUE" ? rev : count,
      highlight: yr === "2026"
    };
  });

  const activeGraphData = 
    graphPeriod === "DAILY" ? dailyGraphData :
    graphPeriod === "MONTHLY" ? monthlyGraphData : yearlyGraphData;

  const graphMaxValue = Math.max(...activeGraphData.map((d) => d.value), 1);
  const graphTotalRevenue = activeGraphData.reduce((s, d) => s + d.revenue, 0);
  const graphTotalBookings = activeGraphData.reduce((s, d) => s + d.bookings, 0);

  // Export Graph Dataset to Excel
  const handleExportGraphExcel = () => {
    const headers = [
      "ช่วงเวลา (Period)",
      "จำนวนการจอง (Bookings)",
      "ยอดรายได้ (Revenue THB)",
      "สัดส่วน (%)",
    ];
    const rows = activeGraphData.map((d) => [
      d.label + (d.subLabel ? ` (${d.subLabel})` : ""),
      d.bookings,
      d.revenue,
      graphTotalRevenue > 0 ? `${Math.round((d.revenue / graphTotalRevenue) * 100)}%` : "0%",
    ]);
    exportToCSV(`hotel_graph_${graphPeriod.toLowerCase()}_report_${new Date().toISOString().split("T")[0]}`, headers, rows);
  };

  // Export Bookings to Excel (CSV with UTF-8 BOM)
  const handleExportBookingsExcel = () => {
    const headers = [
      "เลขที่การจอง (Booking No)",
      "โรงแรม (Property)",
      "รหัสห้อง (Room)",
      "ชื่อผู้เข้าพัก (Guest Name)",
      "เบอร์โทรศัพท์ (Phone)",
      "แหล่งที่มา (Source)",
      "สถานะ (Status)",
      "วันเช็คอิน (Check-in)",
      "วันเช็คเอาต์ (Check-out)",
      "จำนวนคืน (Nights)",
      "ผู้ใหญ่",
      "เด็ก",
      "เตียงเสริม (Extra Bed)",
      "ค่าห้องพัก (Room Total)",
      "ค่าเตียงเสริม (Extra Bed Total)",
      "ค่ารูมเซอร์วิส/อาหาร (POS)",
      "ยอดรวมทั้งสิ้น (Grand Total)",
      "มัดจำแล้ว (Deposit Paid)",
      "ยอดค้างชำระ (Balance Due)",
      "วันที่ทำรายการ (Created At)",
    ];

    const rows = filteredBookingsList.map((b) => [
      b.bookingNumber,
      b.propertyId === "bugaan" ? "Bu-Gaan Sukhothai Village" : "Thanawong Pool Villa",
      b.roomNumber,
      b.guestName,
      b.guestPhone,
      b.source,
      b.status,
      b.checkInDate,
      b.checkOutDate,
      b.totalNights,
      b.adults,
      b.kids,
      b.hasExtraBed ? `${b.extraBedCount} เตียง` : "ไม่มี",
      b.roomTotal,
      b.extraBedTotal,
      b.posChargesTotal,
      b.grandTotal,
      b.depositPaid,
      b.balanceDue,
      b.createdAt,
    ]);

    exportToCSV(`hotel_bookings_report_${dateRangeFilter.toLowerCase()}_${new Date().toISOString().split("T")[0]}`, headers, rows);
  };

  // Export F&B and POS Orders to Excel
  const handleExportOrdersExcel = () => {
    const headers = [
      "เลขที่ออเดอร์ (Order No)",
      "โรงแรม (Property)",
      "ห้องพัก (Room)",
      "ชื่อลูกค้า (Guest)",
      "รายการอาหารและเครื่องดื่ม (Items)",
      "ยอดรวม (Total THB)",
      "วิธีชำระ (Payment)",
      "วันที่สั่ง (Order Date)",
    ];

    const rows = orders.map((o) => [
      o.orderNumber,
      o.propertyId === "bugaan" ? "Bu-Gaan Sukhothai Village" : "Thanawong Pool Villa",
      o.roomNumber,
      o.guestName || "ทั่วไป",
      o.items.map((i) => `${i.name} (x${i.quantity})`).join("; "),
      o.totalAmount,
      o.paymentMethod,
      o.createdAt,
    ]);

    exportToCSV(`hotel_orders_report_${new Date().toISOString().split("T")[0]}`, headers, rows);
  };

  // Menu Form Handlers
  const handleMenuImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMenuImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsUploadingMenuImage(false);
        return;
      }

      // Optimize and resize image using HTML5 Canvas to prevent excessive localStorage usage
      const img = new Image();
      img.onload = () => {
        const maxWidth = 600;
        const maxHeight = 600;
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
          setMenuForm((prev) => ({ ...prev, image: compressed }));
        } else {
          setMenuForm((prev) => ({ ...prev, image: dataUrl }));
        }
        setIsUploadingMenuImage(false);
      };
      img.onerror = () => {
        setMenuForm((prev) => ({ ...prev, image: dataUrl }));
        setIsUploadingMenuImage(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setIsUploadingMenuImage(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleOpenAddMenu = () => {
    setEditingMenuItem(null);
    setMenuForm({
      name: "",
      category: "FOOD",
      price: 180,
      propertyId: activePropertyId === "thanawong" ? "thanawong" : "bugaan",
      image: "",
      description: "",
      isAvailable: true,
    });
    setIsMenuModalOpen(true);
  };

  const handleOpenEditMenu = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuForm({
      name: item.name,
      category: item.category,
      price: item.price,
      propertyId: item.propertyId,
      image: item.image,
      description: item.description,
      isAvailable: item.isAvailable,
    });
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMenuItem) {
      updateMenuItem(editingMenuItem.id, menuForm);
    } else {
      addMenuItem(menuForm);
    }
    setIsMenuModalOpen(false);
  };

  // Custom Charge Handlers
  const handleAddCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeTargetBookingId || !chargeTitle || chargeAmount <= 0) return;

    addCustomChargeToBooking(chargeTargetBookingId, chargeTitle, Number(chargeAmount));
    setChargeSuccessMsg(`เพิ่มค่าบริการ "${chargeTitle}" (${formatCurrency(chargeAmount)}) เข้าบิลสำเร็จ!`);
    setChargeTitle("");
    setTimeout(() => {
      setChargeSuccessMsg("");
    }, 2500);
  };

  // Staff User Handlers
  const handleOpenAddStaff = () => {
    setEditingStaffUser(null);
    setStaffForm({
      name: "",
      username: "",
      role: "Front Desk Receptionist",
      propertyAccess: activePropertyId === "thanawong" ? "thanawong" : "all",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    });
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (user: StaffUser) => {
    setEditingStaffUser(user);
    setStaffForm({
      name: user.name,
      username: user.username,
      role: user.role,
      propertyAccess: user.propertyAccess,
      avatar: user.avatar,
    });
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.username) return;

    if (editingStaffUser) {
      updateStaffUser(editingStaffUser.id, staffForm);
      setStaffSuccessMsg(`อัปเดตข้อมูลพนักงาน "${staffForm.name}" สำเร็จ!`);
    } else {
      addStaffUser(staffForm);
      setStaffSuccessMsg(`เพิ่มพนักงานใหม่ "${staffForm.name}" เข้าสู่ระบบเรียบร้อย!`);
    }
    setIsStaffModalOpen(false);
    setTimeout(() => setStaffSuccessMsg(null), 3000);
  };

  const handleDeleteStaff = (user: StaffUser) => {
    if (confirm(`คุณต้องการลบข้อมูลพนักงาน "${user.name}" (${user.username}) หรือไม่?`)) {
      deleteStaffUser(user.id);
      setStaffSuccessMsg(`ลบพนักงาน "${user.name}" ออกจากระบบแล้ว`);
      setTimeout(() => setStaffSuccessMsg(null), 3000);
    }
  };

  // Edit Booking Save
  const handleSaveBookingEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    updateBooking(editingBooking.id, {
      guestName: editingBooking.guestName,
      guestPhone: editingBooking.guestPhone,
      guestEmail: editingBooking.guestEmail,
      specialRequests: editingBooking.specialRequests,
      status: editingBooking.status,
      depositPaid: Number(editingBooking.depositPaid),
    });
    setEditingBooking(null);
  };

  // Database Backup Handler (Export JSON)
  const handleExportDatabase = () => {
    try {
      const data = backupDatabase();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute(
        "download",
        `hotel_pms_database_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupRestoreMsg({
        type: "success",
        text: `สำรองข้อมูลสำเร็จ! บันทึกไฟล์ JSON เรียบร้อย (${data.rooms.length} ห้อง, ${data.bookings.length} การจอง, ${data.menuItems.length} เมนู)`,
      });
      setTimeout(() => setBackupRestoreMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสำรองข้อมูล";
      setBackupRestoreMsg({ type: "error", text: msg });
    }
  };

  // Database Restore Handler (Import JSON file)
  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const result = restoreDatabase(parsed);
        if (result.success) {
          setBackupRestoreMsg({ type: "success", text: result.message });
        } else {
          setBackupRestoreMsg({ type: "error", text: result.message });
        }
      } catch (err: unknown) {
        setBackupRestoreMsg({ type: "error", text: "ไม่สามารถอ่านไฟล์ JSON ได้ กรุณาตรวจสอบรูปแบบไฟล์" });
      }
      setTimeout(() => setBackupRestoreMsg(null), 5000);
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = "";
  };

  // Database Reset Handler
  const handleResetConfirm = () => {
    resetDatabase();
    setIsResetConfirmOpen(false);
    setBackupRestoreMsg({
      type: "info",
      text: "รีเซ็ตฐานข้อมูลเป็นค่าเริ่มต้นของระบบเรียบร้อยแล้ว",
    });
    setTimeout(() => setBackupRestoreMsg(null), 4000);
  };

  // Room CRUD Handlers
  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      propertyId: activePropertyId === "thanawong" ? "thanawong" : "bugaan",
      roomNumber: "",
      name: "Heritage Deluxe Villa",
      type: "Deluxe Villa",
      isMeetingRoom: false,
      capacityAdults: 2,
      capacityKids: 1,
      pricePerNight: 2800,
      status: "AVAILABLE",
      floor: 1,
      amenities: "King Bed, Rain Shower, Garden View, Smart TV, Bathtub, High Speed WiFi",
    });
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomForm({
      propertyId: room.propertyId,
      roomNumber: room.roomNumber,
      name: room.name,
      type: room.type,
      isMeetingRoom: room.isMeetingRoom,
      capacityAdults: room.capacityAdults,
      capacityKids: room.capacityKids,
      pricePerNight: room.pricePerNight,
      status: room.status,
      floor: room.floor,
      amenities: room.amenities.join(", "),
    });
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const amenitiesArr = roomForm.amenities.split(",").map((s) => s.trim()).filter(Boolean);

    if (editingRoom) {
      updateRoom(editingRoom.id, {
        propertyId: roomForm.propertyId,
        roomNumber: roomForm.roomNumber,
        name: roomForm.name,
        type: roomForm.type,
        isMeetingRoom: roomForm.isMeetingRoom,
        capacityAdults: Number(roomForm.capacityAdults),
        capacityKids: Number(roomForm.capacityKids),
        pricePerNight: Number(roomForm.pricePerNight),
        status: roomForm.status,
        floor: Number(roomForm.floor),
        amenities: amenitiesArr,
      });
    } else {
      addRoom({
        propertyId: roomForm.propertyId,
        roomNumber: roomForm.roomNumber,
        name: roomForm.name,
        type: roomForm.type,
        isMeetingRoom: roomForm.isMeetingRoom,
        capacityAdults: Number(roomForm.capacityAdults),
        capacityKids: Number(roomForm.capacityKids),
        pricePerNight: Number(roomForm.pricePerNight),
        status: roomForm.status,
        floor: Number(roomForm.floor),
        amenities: amenitiesArr,
      });
    }
    setIsRoomModalOpen(false);
  };

  // Filter Rooms based on active property
  const filteredRoomsList = rooms.filter(
    (r) => activePropertyId === "all" || r.propertyId === activePropertyId
  );

  // Revenue & Occupancy Calculations
  const propertyBookings = bookings.filter(
    (b) => activePropertyId === "all" || b.propertyId === activePropertyId
  );
  const totalRevenue = propertyBookings.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
  const totalDeposited = propertyBookings.reduce((sum, b) => sum + (b.depositPaid || 0), 0);
  const totalBalanceDue = propertyBookings.reduce((sum, b) => sum + (b.balanceDue || 0), 0);
  const occupiedCount = filteredRoomsList.filter((r) => r.status === "OCCUPIED").length;
  const occupancyRate = filteredRoomsList.length > 0 
    ? Math.round((occupiedCount / filteredRoomsList.length) * 100) 
    : 0;

  const subTabItems = [
    {
      id: "history" as AdminSubTab,
      title: "ประวัติการจอง & แก้ไขบิล",
      shortTitle: "ประวัติการจอง",
      category: "operations",
      categoryName: "งานจอง & ห้องพัก",
      icon: History,
      count: bookings.length,
      description: "ตรวจสอบบุ๊กกิ้ง บิลค่าใช้จ่าย และสถานะผู้เข้าพัก",
    },
    {
      id: "ota" as AdminSubTab,
      title: "Channel Manager (OTA 2-Way Sync)",
      shortTitle: "Channel Manager",
      category: "operations",
      categoryName: "งานจอง & ห้องพัก",
      icon: Globe,
      description: "เชื่อมต่อ Booking.com, Agoda และจัดสรรห้องพักอัตโนมัติ",
    },
    {
      id: "rooms" as AdminSubTab,
      title: "จัดการห้องพัก & ผังห้อง",
      shortTitle: "จัดการห้องพัก",
      category: "operations",
      categoryName: "งานจอง & ห้องพัก",
      icon: BedDouble,
      count: rooms.length,
      description: "ตั้งค่าห้องพัก ราคา สิ่งอำนวยความสะดวก และโควตาห้อง",
    },
    {
      id: "menu" as AdminSubTab,
      title: "เมนูอาหาร & มินิบาร์",
      shortTitle: "อาหาร & บาร์",
      category: "services",
      categoryName: "บริการ & รายได้",
      icon: Utensils,
      count: menuItems.length,
      description: "จัดการรายการอาหาร เครื่องดื่ม รูมเซอร์วิส และราคาสินค้า",
    },
    {
      id: "charges" as AdminSubTab,
      title: "ชาร์จค่าบริการพิเศษ",
      shortTitle: "ชาร์จบริการพิเศษ",
      category: "services",
      categoryName: "บริการ & รายได้",
      icon: DollarSign,
      description: "เพิ่มค่าบริการพิเศษ ค่าปรับ ค่าซักรีด เข้าบิลห้องพัก",
    },
    {
      id: "analytics" as AdminSubTab,
      title: "รายงานสถิติ & รายรับ",
      shortTitle: "รายงานสถิติ",
      category: "services",
      categoryName: "บริการ & รายได้",
      icon: BarChart3,
      description: "วิเคราะห์รายได้ อัตราการเข้าพัก ADR และยอดขายรวม",
    },
    {
      id: "payment" as AdminSubTab,
      title: "ตั้งค่า PromptPay QR & บัญชีธนาคาร",
      shortTitle: "ตั้งค่าพร้อมเพย์",
      category: "services",
      categoryName: "การเงิน & ชำระเงิน",
      icon: QrCode,
      description: "กำหนดค่าบัญชีพร้อมเพย์ หมายเลขโทรศัพท์ นิติบุคคล (Tax ID) หรือ Biller ID แยกตามสาขา",
    },
    {
      id: "staff" as AdminSubTab,
      title: "จัดการพนักงาน & สิทธิ์ผู้ใช้",
      shortTitle: "จัดการพนักงาน",
      category: "system",
      categoryName: "ระบบ & พนักงาน",
      icon: Users,
      count: staffUsers.length,
      description: "กำหนดสิทธิ์ผู้ใช้งาน บัญชีพนักงาน และการเข้าถึงโรงแรม",
    },
    {
      id: "database" as AdminSubTab,
      title: "ตั้งค่าฐานข้อมูล & Cloud Sync",
      shortTitle: "ฐานข้อมูล & ซิงค์",
      category: "system",
      categoryName: "ระบบ & พนักงาน",
      icon: Database,
      description: "สำรองข้อมูล กู้คืนระบบ และจัดการ Cloud Storage",
    },
  ];

  const activeMeta = subTabItems.find((item) => item.id === activeSubTab) || subTabItems[0];
  const ActiveSubTabIcon = activeMeta.icon;

  return (
    <div className="space-y-6">

      {/* Staff Room Management Permission Banner */}
      {isStaffOnly && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs text-xs">
          <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold">
              สิทธิ์พนักงานทั่วไป: สามารถเปิด-ปิดห้องพัก (Stop Sell) และปรับเปลี่ยนจำนวนห้องว่างรายวันได้
            </span>
          </div>
          <a
            href="?tab=dashboard"
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors text-xs"
          >
            กลับหน้าหลัก Dashboard
          </a>
        </div>
      )}

      {/* Redesigned Responsive Sub-tab Navigation */}
      <div className="bg-white dark:bg-[#101c42] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm p-4 sm:p-5 space-y-4">
        
        {/* Top Header: Current Active Module & Exports */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-3.5 border-b border-stone-100 dark:border-stone-800/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-600/25 shrink-0">
              <ActiveSubTabIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 whitespace-nowrap shrink-0">
                  {activeMeta.categoryName}
                </span>
                {activeMeta.count !== undefined && (
                  <span className="text-xs font-semibold text-stone-400 whitespace-nowrap shrink-0">
                    ({activeMeta.count} รายการ)
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-white truncate mt-0.5">
                {activeMeta.title}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate hidden sm:block">
                {activeMeta.description}
              </p>
            </div>
          </div>

          {/* Action Area: Mobile Switcher + Excel Exports */}
          <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
            {/* Mobile / Tablet Menu Selector Button (Opens Drawer / Modal) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold transition-colors min-h-[44px] cursor-pointer"
            >
              <Grid3X3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>เลือกเมนู ({subTabItems.length})</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
            </button>

            {/* Export Bookings Excel */}
            <button
              onClick={handleExportBookingsExcel}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all min-h-[44px] cursor-pointer"
              title="ดาวน์โหลดข้อมูลการจองห้องพักทั้งหมดเป็นไฟล์ Excel (.csv)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Export การจอง Excel</span>
              <span className="sm:hidden">Excel จอง</span>
            </button>

            {/* Export POS Excel */}
            <button
              onClick={handleExportOrdersExcel}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all min-h-[44px] cursor-pointer"
              title="ดาวน์โหลดรายการออเดอร์รูมเซอร์วิสทั้งหมดเป็นไฟล์ Excel"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Export อาหาร/POS</span>
              <span className="sm:hidden">Excel POS</span>
            </button>
          </div>
        </div>

        {/* Desktop / Large Screen: Clean 9-Pill Grid */}
        <div className="hidden lg:grid grid-cols-3 xl:grid-cols-9 gap-2 pt-1">
          {subTabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <a
                key={tab.id}
                href={getSubTabUrl(tab.id)}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSubTab(tab.id);
                }}
                className={`flex flex-col items-center justify-center text-center p-2.5 rounded-2xl transition-all border cursor-pointer group min-h-[66px] ${
                  isActive
                    ? "bg-gradient-to-b from-amber-500 to-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/30 scale-[1.02]"
                    : "bg-stone-50 dark:bg-slate-800/80 border-stone-200/80 dark:border-stone-700/80 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-700/80 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-stone-500 dark:text-stone-400 group-hover:text-amber-600"}`} />
                  {tab.count !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap shrink-0 ${
                      isActive ? "bg-white/25 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold mt-1 truncate max-w-full">
                  {tab.shortTitle}
                </span>
              </a>
            );
          })}
        </div>

        {/* Mobile / Tablet: Quick Horizontal Scroll Bar with compact pill badges */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
          {subTabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <a
                key={tab.id}
                href={getSubTabUrl(tab.id)}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSubTab(tab.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 min-h-[40px] cursor-pointer ${
                  isActive
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                    : "bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200/80 dark:border-stone-700/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.shortTitle}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-bold px-1 rounded-full whitespace-nowrap shrink-0 ${
                    isActive ? "bg-white/20 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </a>
            );
          })}
        </div>

      </div>

      {/* Mobile Menu Bottom Sheet / Modal Selector */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#101c42] rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-stone-200 dark:border-stone-800 animate-in slide-in-from-bottom sm:zoom-in-95 space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                  <Grid3X3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                    เมนูการจัดการระบบ (Backoffice Menu)
                  </h3>
                  <p className="text-xs text-stone-500">
                    เลือกโมดูลที่ต้องการใช้งาน
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categorized List of Subtabs */}
            <div className="space-y-4 py-1">
              
              {/* Category 1: Operations */}
              <div>
                <h4 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>งานจอง & ห้องพัก (Operations)</span>
                </h4>
                <div className="space-y-1.5">
                  {subTabItems.filter((t) => t.category === "operations").map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveSubTab(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                          isActive
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-700 ring-2 ring-amber-500/20"
                            : "bg-stone-50/80 dark:bg-slate-800/60 border-stone-200/80 dark:border-stone-700/80 hover:bg-stone-100"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? "bg-amber-600 text-white" : "bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900 dark:text-white">
                              {tab.title}
                            </span>
                            {tab.count !== undefined && (
                              <span className="text-[10px] font-semibold px-1.5 rounded-full bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300">
                                {tab.count}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                            {tab.description}
                          </p>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 2: Services & Revenue */}
              <div>
                <h4 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>บริการ & รายได้ (Services & Revenue)</span>
                </h4>
                <div className="space-y-1.5">
                  {subTabItems.filter((t) => t.category === "services").map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveSubTab(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                          isActive
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-700 ring-2 ring-amber-500/20"
                            : "bg-stone-50/80 dark:bg-slate-800/60 border-stone-200/80 dark:border-stone-700/80 hover:bg-stone-100"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? "bg-amber-600 text-white" : "bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900 dark:text-white">
                              {tab.title}
                            </span>
                            {tab.count !== undefined && (
                              <span className="text-[10px] font-semibold px-1.5 rounded-full bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300">
                                {tab.count}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                            {tab.description}
                          </p>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 3: System & Admin */}
              <div>
                <h4 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>ระบบ & พนักงาน (System & Admin)</span>
                </h4>
                <div className="space-y-1.5">
                  {subTabItems.filter((t) => t.category === "system").map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveSubTab(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                          isActive
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-700 ring-2 ring-amber-500/20"
                            : "bg-stone-50/80 dark:bg-slate-800/60 border-stone-200/80 dark:border-stone-700/80 hover:bg-stone-100"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? "bg-amber-600 text-white" : "bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900 dark:text-white">
                              {tab.title}
                            </span>
                            {tab.count !== undefined && (
                              <span className="text-[10px] font-semibold px-1.5 rounded-full bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300">
                                {tab.count}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                            {tab.description}
                          </p>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SUBTAB OTA: Channel Manager & 2-Way Allocation */}
      {activeSubTab === "ota" && <ChannelManagerView />}

      {/* SUBTAB 1: Booking History & Report Export */}
      {activeSubTab === "history" && (
        <div className="space-y-4">

          {/* PDPA & Check-In Security Policy Toggle Card */}
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-blue-950/30 p-4 sm:p-5 rounded-3xl border border-blue-200 dark:border-blue-800/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/25">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-white">
                    นโยบายความปลอดภัยและ PDPA: บันทึกเอกสาร & ลายเซ็นก่อนเช็คอิน
                  </h3>
                  {requireCheckInDocuments ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 whitespace-nowrap shrink-0">
                      เปิดใช้งาน
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 dark:bg-slate-800 dark:text-stone-300 whitespace-nowrap shrink-0">
                      ปิดใช้งาน (ไม่บังคับ)
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                  เมื่อเปิดใช้งาน: ทุกการเช็คอิน (Walk-in, OTA, ไทม์ไลน์) จะต้องแนบรูปถ่ายบัตรประชาชน/พาสปอร์ตพร้อมประทับลายน้ำคุ้มครอง PDPA อัตโนมัติ และเซ็นชื่อดิจิทัลก่อนยืนยันเข้าห้องพัก
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setRequireCheckInDocuments(!requireCheckInDocuments)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs min-h-[44px] ${
                  requireCheckInDocuments
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
                    : "bg-white dark:bg-slate-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{requireCheckInDocuments ? "ระบบเปิดอยู่ (คลิกเพื่อปิด)" : "คลิกเพื่อเปิดใช้งานระบบ"}</span>
              </button>
            </div>
          </div>
          
          {/* Filters & Export Control Bar */}
          <div className="bg-white dark:bg-[#101c42] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
            
            {/* Top row: Search input & Status filter & Export */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อลูกค้า, เบอร์โทรศัพท์, เลขที่การจอง, หรือเลขห้อง..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-stone-500 font-medium whitespace-nowrap">สถานะ:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
                  >
                    <option value="ALL">ทุกสถานะ (All Status)</option>
                    <option value="CHECKED_IN">Checked-in (เข้าพัก)</option>
                    <option value="CONFIRMED">Confirmed (ยืนยันแล้ว)</option>
                    <option value="CHECKED_OUT">Checked-out (เช็คเอาต์แล้ว)</option>
                    <option value="CANCELLED">Cancelled (ยกเลิก)</option>
                  </select>
                </div>

                {/* Export Filtered Report Button */}
                <button
                  type="button"
                  onClick={handleExportBookingsExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title="Export รายการที่เลือกในตารางนี้เป็น Excel (.csv)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export ({filteredBookingsList.length})</span>
                </button>
              </div>
            </div>

            {/* Bottom row: Calendar Date Pickers & Range Presets */}
            <div className="pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-stone-500 font-medium flex items-center gap-1 whitespace-nowrap">
                  <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>เลือกช่วงเวลา:</span>
                </span>

                {/* Preset Selector */}
                <select
                  value={dateRangeFilter}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setDateRangeFilter(val);
                    if (val === "TODAY") {
                      const today = new Date().toISOString().split("T")[0];
                      setCustomStartDate(today);
                      setCustomEndDate(today);
                    } else if (val !== "CUSTOM") {
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
                >
                  <option value="ALL">ทั้งหมดทุกช่วงเวลา (All Time)</option>
                  <option value="TODAY">วันนี้ (Today)</option>
                  <option value="7DAYS">ย้อนหลัง 7 วัน (Last 7 Days)</option>
                  <option value="30DAYS">ย้อนหลัง 30 วัน (Last 30 Days)</option>
                  <option value="90DAYS">ย้อนหลัง 3 เดือน (Last 90 Days)</option>
                  <option value="YEAR">ย้อนหลัง 1 ปี (Last 1 Year)</option>
                  <option value="CUSTOM">กำหนดเองจากปฏิทิน (Custom)</option>
                </select>

                {/* Quick "วันนี้" Button (วันนี้ถึงวันนี้) */}
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split("T")[0];
                    setCustomStartDate(today);
                    setCustomEndDate(today);
                    setDateRangeFilter("CUSTOM");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    customStartDate && customEndDate && customStartDate === customEndDate && customStartDate === new Date().toISOString().split("T")[0]
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-slate-700"
                  }`}
                  title="เลือกวันนี้ถึงวันนี้"
                >
                  วันนี้ ({new Date().toISOString().split("T")[0]})
                </button>
              </div>

              {/* Calendar Date Inputs: Start Date to End Date */}
              <div className="flex flex-wrap items-center gap-1.5 bg-stone-50 dark:bg-slate-800/90 p-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="text-[11px] text-stone-500 font-medium pl-1">จาก:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setDateRangeFilter("CUSTOM");
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-900 text-xs font-medium text-stone-900 dark:text-white cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />

                <span className="text-[11px] text-stone-500 font-medium">ถึง:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setDateRangeFilter("CUSTOM");
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-900 text-xs font-medium text-stone-900 dark:text-white cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />

                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate("");
                      setCustomEndDate("");
                      setDateRangeFilter("ALL");
                      setCurrentPage(1);
                    }}
                    className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded cursor-pointer"
                    title="ล้างช่วงวันที่"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>

          </div>

          {/* KPI Summary for Filtered Results */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#101c42] border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] text-stone-500 font-medium block">รายการที่พบ</span>
              <div className="text-lg font-black text-stone-900 dark:text-white mt-0.5">
                {filteredBookingsList.length} <span className="text-xs font-normal text-stone-400">การจอง</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#101c42] border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] text-stone-500 font-medium block">ยอดรวมบิล</span>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {formatCurrency(filteredBookingsTotal)}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#101c42] border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] text-stone-500 font-medium block">รับชำระแล้ว</span>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(filteredBookingsPaid)}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#101c42] border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] text-stone-500 font-medium block">ค้างชำระ</span>
              <div className={`text-lg font-black mt-0.5 ${filteredBookingsBalance > 0 ? "text-rose-600" : "text-stone-400"}`}>
                {formatCurrency(filteredBookingsBalance)}
              </div>
            </div>
          </div>

          {/* Responsive Bookings Container: List / Grid / Table View Modes */}
          <div className="bg-white dark:bg-[#101c42] rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            
            {/* View Mode Header & Segmented Switcher */}
            <div className="p-3.5 sm:p-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 flex-wrap">
                <History className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-bold text-sm text-stone-900 dark:text-white">
                  รายการประวัติการจองและบิลย้อนหลัง
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-stone-300">
                  {filteredBookingsList.length} รายการ
                </span>
              </div>

              {/* View Switcher Controls */}
              <div className="inline-flex items-center p-1 rounded-xl bg-stone-200/70 dark:bg-slate-800 border border-stone-300/60 dark:border-stone-700 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleViewModeChange("list")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    historyViewMode === "list"
                      ? "bg-white dark:bg-amber-600 text-stone-900 dark:text-white shadow-xs"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                  }`}
                  title="แสดงผลแบบลิสต์ (List View)"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>แบบลิสต์ (List)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    historyViewMode === "grid"
                      ? "bg-white dark:bg-amber-600 text-stone-900 dark:text-white shadow-xs"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                  }`}
                  title="แสดงผลแบบการ์ด / กริิด (Grid View)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>แบบการ์ด (Grid)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    historyViewMode === "table"
                      ? "bg-white dark:bg-amber-600 text-stone-900 dark:text-white shadow-xs"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                  }`}
                  title="แสดงผลแบบตาราง (Table View)"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>แบบตาราง (Table)</span>
                </button>
              </div>
            </div>

            {/* Empty State */}
            {filteredBookingsList.length === 0 ? (
              <div className="p-12 text-center text-stone-400">
                <History className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                <p className="font-semibold text-sm text-stone-700 dark:text-stone-300">ไม่พบข้อมูลประวัติการจองตามเงื่อนไขที่เลือก</p>
                <p className="text-xs text-stone-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกช่วงเวลาอื่น</p>
              </div>
            ) : (
              <>
                {/* 1. LIST VIEW (แบบลิสต์ อ่านง่าย ไม่แออัด) */}
                {historyViewMode === "list" && (
                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                    {paginatedBookingsList.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 sm:p-5 hover:bg-stone-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        {/* Section A: Room Badge & Booking Identification */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-[240px]">
                          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">ห้อง</span>
                            <span className="text-base font-serif font-black text-amber-700 dark:text-amber-300 leading-tight">
                              {b.roomNumber}
                            </span>
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-stone-900 dark:text-white text-sm tracking-tight">
                                {b.bookingNumber}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 ${
                                b.status === "CHECKED_IN" 
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : b.status === "CONFIRMED"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                  : "bg-stone-500/15 text-stone-600 dark:text-stone-300"
                              }`}>
                                {b.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
                              <span className="font-semibold text-amber-600 dark:text-amber-400">{b.source}</span>
                              <span>•</span>
                              <span>{b.propertyId === "bugaan" ? "Bu-Gaan Sukhothai" : "Thanawong Pool Villa"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Section B: Guest Details & Stay Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 lg:px-4">
                          {/* Guest Contact & PDPA Verification */}
                          <div className="space-y-1">
                            <div className="font-bold text-stone-800 dark:text-stone-100 text-sm">
                              {b.guestName}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                              <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                              <span>{b.guestPhone || "ไม่มีเบอร์โทร"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {b.guestIdCardImage ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingBookingDetails(b)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 hover:opacity-85 cursor-pointer whitespace-nowrap shrink-0"
                                  title="คลิกเพื่อดูเอกสารลายน้ำ PDPA"
                                >
                                  <FileCheck2 className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span>บัตร ปชช. (PDPA)</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-stone-400 whitespace-nowrap shrink-0">ยังไม่แนบ PDPA</span>
                              )}
                              {b.guestSignatureImage && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 whitespace-nowrap shrink-0">
                                  <PenLine className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                  <span>มีลายเซ็น</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stay Dates */}
                          <div className="space-y-1 sm:pl-2">
                            <div className="flex items-center gap-1.5 text-xs text-stone-700 dark:text-stone-300 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span className="whitespace-nowrap">{formatDateThai(b.checkInDate)} - {formatDateThai(b.checkOutDate)}</span>
                            </div>
                            <div className="text-xs text-stone-500 dark:text-stone-400 pl-5">
                              ระยะเวลาเข้าพัก: <span className="font-bold text-amber-700 dark:text-amber-400">{b.totalNights} คืน</span>
                            </div>
                          </div>
                        </div>

                        {/* Section C: Financials & Action Buttons */}
                        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                          {/* Financial Summary Box */}
                          <div className="grid grid-cols-3 gap-2 px-3 py-2 rounded-xl bg-stone-100/80 dark:bg-slate-800/80 text-xs min-w-[240px]">
                            <div>
                              <span className="text-[10px] text-stone-400 block whitespace-nowrap">ยอดรวมบิล</span>
                              <span className="font-bold text-stone-900 dark:text-white whitespace-nowrap">{formatCurrency(b.grandTotal)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-stone-400 block whitespace-nowrap">ชำระแล้ว</span>
                              <span className="font-semibold text-emerald-600 whitespace-nowrap">{formatCurrency(b.depositPaid)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-stone-400 block whitespace-nowrap">ค้างชำระ</span>
                              <span className={`font-bold whitespace-nowrap ${b.balanceDue > 0 ? "text-rose-600" : "text-stone-400"}`}>
                                {formatCurrency(b.balanceDue)}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => setViewingBookingDetails(b)}
                              className="h-9 px-3 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                              title="ดูรายละเอียดการจอง & เอกสารลายน้ำ PDPA"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                              <span>รายละเอียด</span>
                            </button>

                            {onGoToFolio && (
                              <button
                                type="button"
                                onClick={() => onGoToFolio(b.id)}
                                className="h-9 px-3 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                title="ออกบิลย้อนหลัง (Folio)"
                              >
                                <Receipt className="w-3.5 h-3.5 shrink-0" />
                                <span>ออกบิล</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setEditingBooking(b)}
                              className="h-9 px-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              title="แก้ไขข้อมูลบิลและการจอง"
                            >
                              <Edit3 className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">แก้ไข</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`คุณต้องการลบรายการจอง ${b.bookingNumber} ใช่หรือไม่?`)) {
                                  deleteBooking(b.id);
                                }
                              }}
                              className="h-9 w-9 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 flex items-center justify-center cursor-pointer shrink-0"
                              title="ลบรายการจอง"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. GRID / CARD VIEW (แบบการ์ด จัดวางเป็นบล็อกสวยงาม) */}
                {historyViewMode === "grid" && (
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedBookingsList.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-2xl bg-white dark:bg-[#0c142c] border border-stone-200 dark:border-stone-800/80 shadow-xs hover:border-amber-400/50 hover:shadow-md transition-all flex flex-col justify-between space-y-3.5"
                      >
                        {/* Top Banner: Room Badge & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center shrink-0">
                              <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400">ห้อง</span>
                              <span className="text-sm font-serif font-black text-amber-700 dark:text-amber-300 leading-tight">
                                {b.roomNumber}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-stone-900 dark:text-white text-sm truncate">
                                {b.bookingNumber}
                              </div>
                              <div className="text-[11px] text-stone-400 truncate">
                                {b.propertyId === "bugaan" ? "Bu-Gaan Sukhothai" : "Thanawong Pool Villa"}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 ${
                              b.status === "CHECKED_IN" 
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : b.status === "CONFIRMED"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                : "bg-stone-500/15 text-stone-600 dark:text-stone-300"
                            }`}>
                              {b.status}
                            </span>
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap shrink-0">
                              {b.source}
                            </span>
                          </div>
                        </div>

                        {/* Guest Contact Box */}
                        <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800/50 border border-stone-100 dark:border-stone-800/80 space-y-1">
                          <div className="font-bold text-stone-800 dark:text-stone-200 text-xs truncate">
                            {b.guestName}
                          </div>
                          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                              <span>{b.guestPhone || "-"}</span>
                            </span>
                            <div className="flex items-center gap-1 flex-wrap justify-end">
                              {b.guestIdCardImage ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingBookingDetails(b)}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 hover:opacity-85 cursor-pointer whitespace-nowrap shrink-0"
                                  title="คลิกเพื่อดูเอกสารลายน้ำ PDPA"
                                >
                                  <FileCheck2 className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span>PDPA</span>
                                </button>
                              ) : (
                                <span className="text-[9px] text-stone-400 whitespace-nowrap shrink-0">ยังไม่แนบ PDPA</span>
                              )}
                              {b.guestSignatureImage && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 whitespace-nowrap shrink-0">
                                  <PenLine className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                  <span>เซ็นแล้ว</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stay Dates */}
                        <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>{formatDateThai(b.checkInDate)} - {formatDateThai(b.checkOutDate)}</span>
                          </span>
                          <span className="font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap shrink-0">
                            {b.totalNights} คืน
                          </span>
                        </div>

                        {/* Financial Box */}
                        <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-xl bg-stone-100/80 dark:bg-slate-800/80 text-xs">
                          <div>
                            <span className="text-[10px] text-stone-400 block whitespace-nowrap">ยอดรวม</span>
                            <span className="font-bold text-stone-900 dark:text-white whitespace-nowrap">{formatCurrency(b.grandTotal)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 block whitespace-nowrap">ชำระแล้ว</span>
                            <span className="font-semibold text-emerald-600 whitespace-nowrap">{formatCurrency(b.depositPaid)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-stone-400 block whitespace-nowrap">ยอดค้าง</span>
                            <span className={`font-bold whitespace-nowrap ${b.balanceDue > 0 ? "text-rose-600" : "text-stone-400"}`}>
                              {formatCurrency(b.balanceDue)}
                            </span>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-stone-100 dark:border-stone-800/80">
                          <button
                            type="button"
                            onClick={() => setViewingBookingDetails(b)}
                            className="flex-1 min-h-[36px] px-2 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                            title="ดูรายละเอียดการจอง & เอกสารลายน้ำ PDPA"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span>รายละเอียด</span>
                          </button>

                          {onGoToFolio && (
                            <button
                              type="button"
                              onClick={() => onGoToFolio(b.id)}
                              className="flex-1 min-h-[36px] px-2 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                              title="ออกบิลย้อนหลัง (Folio)"
                            >
                              <Receipt className="w-3.5 h-3.5 shrink-0" />
                              <span>ออกบิล</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setEditingBooking(b)}
                            className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                            title="แก้ไขข้อมูลบิลและการจอง"
                          >
                            <Edit3 className="w-3.5 h-3.5 shrink-0" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`คุณต้องการลบรายการจอง ${b.bookingNumber} ใช่หรือไม่?`)) {
                                deleteBooking(b.id);
                              }
                            }}
                            className="min-h-[36px] w-9 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 flex items-center justify-center cursor-pointer shrink-0"
                            title="ลบรายการจอง"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. TABLE VIEW (แบบตาราง มาตรฐานสำหรับเปรียบเทียบข้อมูล) */}
                {historyViewMode === "table" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 dark:bg-slate-800/80 text-stone-500 font-semibold border-b border-stone-200 dark:border-stone-800">
                        <tr>
                          <th className="p-3.5 whitespace-nowrap">เลขที่จอง / ช่องทาง</th>
                          <th className="p-3.5 whitespace-nowrap">ห้องพัก / โรงแรม</th>
                          <th className="p-3.5 whitespace-nowrap">ชื่อผู้เข้าพัก & ติดต่อ</th>
                          <th className="p-3.5 whitespace-nowrap">เอกสารยืนยัน</th>
                          <th className="p-3.5 whitespace-nowrap">ระยะเวลาเข้าพัก</th>
                          <th className="p-3.5 text-right whitespace-nowrap">ยอดรวมบิล</th>
                          <th className="p-3.5 text-right whitespace-nowrap">ชำระแล้ว</th>
                          <th className="p-3.5 text-right whitespace-nowrap">ค้างชำระ</th>
                          <th className="p-3.5 text-center whitespace-nowrap">สถานะ</th>
                          <th className="p-3.5 text-center whitespace-nowrap">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {paginatedBookingsList.map((b) => (
                          <tr key={b.id} className="hover:bg-amber-50/20 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-3.5">
                              <span className="font-bold text-stone-900 dark:text-white block whitespace-nowrap">{b.bookingNumber}</span>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold whitespace-nowrap shrink-0">{b.source}</span>
                            </td>
                            <td className="p-3.5">
                              <span className="font-serif font-bold text-stone-900 dark:text-white text-sm block whitespace-nowrap">ห้อง {b.roomNumber}</span>
                              <span className="text-[10px] text-stone-400 whitespace-nowrap">
                                {b.propertyId === "bugaan" ? "Bu-Gaan Sukhothai" : "Thanawong Pool Villa"}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className="font-semibold text-stone-800 dark:text-stone-200 block">{b.guestName}</span>
                              <span className="text-[10px] text-stone-400 block whitespace-nowrap">{b.guestPhone || "-"}</span>
                            </td>
                            <td className="p-3.5">
                              <div className="flex flex-wrap items-center gap-1">
                                {b.guestIdCardImage ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewingBookingDetails(b)}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 hover:opacity-85 cursor-pointer whitespace-nowrap shrink-0"
                                    title="คลิกเพื่อดูเอกสารลายน้ำ PDPA"
                                  >
                                    <FileCheck2 className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <span>PDPA</span>
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-stone-400 whitespace-nowrap shrink-0">ยังไม่แนบ PDPA</span>
                                )}
                                {b.guestSignatureImage && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 whitespace-nowrap shrink-0">
                                    <PenLine className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                    <span>เซ็นแล้ว</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="text-stone-700 dark:text-stone-300 block">{formatDateThai(b.checkInDate)}</span>
                              <span className="text-[10px] text-stone-400">ถึง {formatDateThai(b.checkOutDate)} ({b.totalNights} คืน)</span>
                            </td>
                            <td className="p-3.5 text-right font-bold text-stone-900 dark:text-white whitespace-nowrap">
                              {formatCurrency(b.grandTotal)}
                            </td>
                            <td className="p-3.5 text-right text-emerald-600 font-semibold whitespace-nowrap">
                              {formatCurrency(b.depositPaid)}
                            </td>
                            <td className="p-3.5 text-right font-bold whitespace-nowrap">
                              <span className={b.balanceDue > 0 ? "text-rose-600" : "text-stone-400"}>
                                {formatCurrency(b.balanceDue)}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 ${
                                b.status === "CHECKED_IN" 
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : b.status === "CONFIRMED"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                  : "bg-stone-500/15 text-stone-600 dark:text-stone-300"
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingBookingDetails(b)}
                                  className="p-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer"
                                  title="ดูรายละเอียดการจอง & เอกสารลายน้ำ PDPA"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {onGoToFolio && (
                                  <button
                                    type="button"
                                    onClick={() => onGoToFolio(b.id)}
                                    className="p-1.5 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/60 cursor-pointer"
                                    title="ออกบิลย้อนหลัง (Folio)"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setEditingBooking(b)}
                                  className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-300 cursor-pointer"
                                  title="แก้ไขข้อมูลบิลและการจอง"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`คุณต้องการลบรายการจอง ${b.bookingNumber} ใช่หรือไม่?`)) {
                                      deleteBooking(b.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer"
                                  title="ลบรายการจอง"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Pagination Controls Bar */}
            <div className="p-3.5 sm:p-4 border-t border-stone-200 dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-3 bg-stone-50/70 dark:bg-slate-800/40 text-xs">
              {/* Left: Page Size Selector & Count Info */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300 font-medium">
                  <span>แสดงผลต่อหน้า:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white font-semibold cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  >
                    <option value={10}>10 รายการ</option>
                    <option value={20}>20 รายการ</option>
                    <option value={50}>50 รายการ</option>
                    <option value={100}>100 รายการ</option>
                  </select>
                </div>

                <span className="text-stone-500 dark:text-stone-400">
                  แสดง {filteredBookingsList.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + pageSize, filteredBookingsList.length)} จากทั้งหมด {filteredBookingsList.length} รายการ
                </span>
              </div>

              {/* Right: Page Navigation Buttons */}
              <div className="flex items-center gap-1.5 w-full md:w-auto justify-center md:justify-end">
                {/* Previous Button */}
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-stone-300 font-medium hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">ก่อนหน้า</span>
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                    .filter((p) => {
                      // Always show first, last, and pages close to current
                      if (totalPages <= 7) return true;
                      if (p === 1 || p === totalPages) return true;
                      if (Math.abs(p - safeCurrentPage) <= 1) return true;
                      return false;
                    })
                    .map((pageNum, i, arr) => {
                      const prev = arr[i - 1];
                      const showEllipsis = prev && pageNum - prev > 1;
                      return (
                        <div key={pageNum} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="px-1 text-stone-400">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              safeCurrentPage === pageNum
                                ? "bg-amber-600 text-white shadow-sm"
                                : "border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            {pageNum}
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-stone-300 font-medium hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span className="hidden sm:inline">ถัดไป</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 2: Menu & Minibar Management + POS Orders Management */}
      {activeSubTab === "menu" && (
        <div className="space-y-4">
          
          {/* Sub-mode Navigation Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#101c42] p-3 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMenuSubMode("items")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] cursor-pointer ${
                  menuSubMode === "items"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                    : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-slate-700"
                }`}
              >
                <Utensils className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">รายการเมนูสินค้า ({menuItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMenuSubMode("orders")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] cursor-pointer ${
                  menuSubMode === "orders"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                    : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-slate-700"
                }`}
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">ประวัติการสั่งซื้อ & ลบรายการ POS ({orders.length})</span>
              </button>
            </div>

            {menuSubMode === "items" ? (
              <button
                onClick={handleOpenAddMenu}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:opacity-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-amber-500/30 min-h-[44px] shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="whitespace-nowrap">เพิ่มเมนูใหม่</span>
              </button>
            ) : (
              <div className="text-xs text-stone-500 dark:text-stone-400">
                แอดมินสามารถตรวจสอบลายเซ็น สลิป และลบรายการสั่งซื้อที่ผิดพลาดได้
              </div>
            )}
          </div>

          {orderSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{orderSuccessMsg}</span>
            </div>
          )}

          {/* MODE 1: Menu Items Catalog */}
          {menuSubMode === "items" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-[#101c42] rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="relative h-36 w-full bg-stone-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-stone-900/80 backdrop-blur-xs text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                          {formatCurrency(item.price)}
                        </div>
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                          {item.propertyId === "bugaan" ? "Bu-Gaan" : "Thanawong"}
                        </div>
                      </div>

                      <div className="p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 whitespace-nowrap shrink-0">
                            {item.category}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${item.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {item.isAvailable ? "พร้อมขาย" : "สินค้าหมด"}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-stone-900 dark:text-white mt-1 line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                          {item.description || "ไม่มีคำอธิบายเพิ่มเติม"}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 pt-0 border-t border-stone-100 dark:border-stone-800/80 flex gap-2">
                      <button
                        onClick={() => handleOpenEditMenu(item)}
                        className="flex-1 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-slate-800 text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-center gap-1 min-h-[36px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`คุณต้องการลบเมนู "${item.name}" ใช่หรือไม่?`)) {
                            deleteMenuItem(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                        title="ลบเมนูนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODE 2: POS Orders History & Admin Deletion */}
          {menuSubMode === "orders" && (
            <div className="space-y-4">
              {/* POS Order KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-[#101c42] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    ยอดขาย POS ทั้งหมด
                  </div>
                  <div className="text-base sm:text-lg font-bold text-stone-900 dark:text-white mt-1">
                    {formatCurrency(totalOrdersAmount)}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {totalOrdersCount} รายการสั่งซื้อ
                  </div>
                </div>

                <div className="bg-white dark:bg-[#101c42] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                    ชาร์จเข้าห้องพัก (Room Charge)
                  </div>
                  <div className="text-base sm:text-lg font-bold text-amber-600 mt-1">
                    {formatCurrency(roomChargeOrders.reduce((s, o) => s + o.totalAmount, 0))}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {roomChargeOrders.length} รายการ (ชำระตอนเช็คเอาต์)
                  </div>
                </div>

                <div className="bg-white dark:bg-[#101c42] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    ชำระตรงทันที (Direct Paid)
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-600 mt-1">
                    {formatCurrency(directPaidOrders.reduce((s, o) => s + o.totalAmount, 0))}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {directPaidOrders.length} รายการ (เงินสด/QR/บัตร)
                  </div>
                </div>

                <div className="bg-white dark:bg-[#101c42] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    รายการที่ตรงกับตัวกรอง
                  </div>
                  <div className="text-base sm:text-lg font-bold text-indigo-600 mt-1">
                    {filteredOrdersList.length} รายการ
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    ยอดรวม {formatCurrency(filteredOrdersList.reduce((s, o) => s + o.totalAmount, 0))}
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="bg-white dark:bg-[#101c42] p-3 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    placeholder="ค้นหาเลขที่ออเดอร์, ห้อง, ชื่อลูกค้า, หรือเมนูอาหาร..."
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-slate-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  {orderSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setOrderSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={orderPropertyFilter}
                    onChange={(e) => setOrderPropertyFilter(e.target.value as PropertyId | "all")}
                    className="px-3 py-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-200"
                  >
                    <option value="all">ทุกโรงแรม</option>
                    <option value="bugaan">Bu-Gaan Sukhothai</option>
                    <option value="thanawong">Thanawong Pool Villa</option>
                  </select>

                  <select
                    value={orderPaymentFilter}
                    onChange={(e) => setOrderPaymentFilter(e.target.value as "ALL" | "ROOM_CHARGE" | "DIRECT")}
                    className="px-3 py-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-200"
                  >
                    <option value="ALL">ทุกวิธีชำระ</option>
                    <option value="ROOM_CHARGE">ชาร์จเข้าห้อง (Room Charge)</option>
                    <option value="DIRECT">ชำระตรง (Direct Paid)</option>
                  </select>
                </div>
              </div>

              {/* Orders List Table (Desktop) */}
              <div className="hidden md:block bg-white dark:bg-[#101c42] rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-slate-800/60 text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
                    <tr>
                      <th className="p-3.5 font-bold">เลขที่ออเดอร์ / เวลา</th>
                      <th className="p-3.5 font-bold">ห้องพัก & ลูกค้า</th>
                      <th className="p-3.5 font-bold">รายการสินค้า</th>
                      <th className="p-3.5 font-bold text-right">ยอดรวม</th>
                      <th className="p-3.5 font-bold text-center">วิธีชำระ & หลักฐาน</th>
                      <th className="p-3.5 font-bold text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {filteredOrdersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-stone-400">
                          <ShoppingBag className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
                          <p>ไม่พบรายการสั่งซื้อที่ตรงกับเงื่อนไข</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrdersList.map((order) => {
                        const isRoomCharge = order.isRoomCharge;
                        const dateFormatted = new Date(order.createdAt).toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        });

                        return (
                          <tr key={order.id} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-stone-900 dark:text-white">
                                #{order.orderNumber}
                              </div>
                              <div className="text-[11px] text-stone-400 mt-0.5">
                                {dateFormatted}
                              </div>
                            </td>

                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-800 dark:text-stone-200">
                                  {order.roomNumber ? `ห้อง ${order.roomNumber}` : "หน้าร้าน (Walk-in)"}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300 font-medium whitespace-nowrap shrink-0">
                                  {order.propertyId === "bugaan" ? "Bu-Gaan" : "Thanawong"}
                                </span>
                              </div>
                              {order.guestName && (
                                <div className="text-[11px] text-stone-500 mt-0.5">
                                  {order.guestName}
                                </div>
                              )}
                            </td>

                            <td className="p-3.5 max-w-xs">
                              <div className="space-y-0.5">
                                {order.items.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="text-stone-700 dark:text-stone-300 truncate">
                                    • {item.name} <span className="text-stone-400">x{item.quantity}</span>
                                  </div>
                                ))}
                                {order.items.length > 2 && (
                                  <div className="text-[11px] text-amber-600 font-semibold">
                                    +{order.items.length - 2} รายการเพิ่มเติม
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="p-3.5 text-right font-bold text-stone-900 dark:text-white">
                              {formatCurrency(order.totalAmount)}
                            </td>

                            <td className="p-3.5 text-center">
                              {isRoomCharge ? (
                                <div className="inline-flex flex-col items-center gap-1">
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[11px] font-bold whitespace-nowrap shrink-0">
                                    ชาร์จเข้าห้องพัก
                                  </span>
                                  {order.guestSignature ? (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0">
                                      <PenLine className="w-3 h-3" /> มีลายเซ็นยืนยัน
                                    </span>
                                  ) : order.guestConfirmed ? (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0">
                                      <CheckCircle2 className="w-3 h-3" /> กดยืนยันแล้ว
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-stone-400 whitespace-nowrap shrink-0">
                                      จ่ายตอนเช็คเอาต์
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="inline-flex flex-col items-center gap-1">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold whitespace-nowrap shrink-0">
                                    {order.paymentMethod === "CASH"
                                      ? "เงินสด"
                                      : order.paymentMethod === "PROMPTPAY"
                                      ? "โอนเงิน QR"
                                      : "ชำระตรงแล้ว"}
                                  </span>
                                  {order.slipImage && (
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0">
                                      <Receipt className="w-3 h-3" /> มีสลิปหลักฐาน
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingOrderDetails(order)}
                                  className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800 hover:text-amber-600 transition-colors cursor-pointer"
                                  title="ดูรายละเอียดบิลและหลักฐาน"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {order.isRoomCharge && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenTransferModal(order)}
                                    className="p-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors cursor-pointer"
                                    title="ย้ายบิลนี้ไปห้องอื่น (Transfer Room)"
                                  >
                                    <ArrowRightLeft className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOrder(order)}
                                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                                  title="ลบรายการสั่งซื้อนี้"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Orders List Cards (Mobile) */}
              <div className="block md:hidden space-y-3">
                {filteredOrdersList.length === 0 ? (
                  <div className="bg-white dark:bg-[#101c42] p-8 rounded-2xl border border-stone-200 dark:border-stone-800 text-center text-stone-400">
                    <ShoppingBag className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
                    <p className="text-xs">ไม่พบรายการสั่งซื้อที่ตรงกับเงื่อนไข</p>
                  </div>
                ) : (
                  filteredOrdersList.map((order) => {
                    const isRoomCharge = order.isRoomCharge;
                    const dateFormatted = new Date(order.createdAt).toLocaleString("th-TH", {
                      dateStyle: "short",
                      timeStyle: "short",
                    });

                    return (
                      <div
                        key={order.id}
                        className="bg-white dark:bg-[#101c42] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-sm text-stone-900 dark:text-white">
                              #{order.orderNumber}
                            </div>
                            <div className="text-[11px] text-stone-400 mt-0.5">
                              {dateFormatted}
                            </div>
                          </div>

                          {isRoomCharge ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold whitespace-nowrap shrink-0">
                              ชาร์จเข้าห้อง
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold whitespace-nowrap shrink-0">
                              ชำระตรงแล้ว
                            </span>
                          )}
                        </div>

                        <div className="bg-stone-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-stone-800 dark:text-stone-200">
                              {order.roomNumber ? `ห้อง ${order.roomNumber}` : "หน้าร้าน"}
                            </span>
                            <span className="text-[10px] text-stone-500">
                              {order.propertyId === "bugaan" ? "Bu-Gaan" : "Thanawong"}
                            </span>
                          </div>
                          {order.guestName && (
                            <div className="text-stone-600 dark:text-stone-400 text-[11px]">
                              ลูกค้า: {order.guestName}
                            </div>
                          )}
                        </div>

                        <div className="text-xs space-y-0.5">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-stone-600 dark:text-stone-400">
                              <span className="truncate">• {item.name} x{item.quantity}</span>
                              <span className="shrink-0 ml-2 font-medium">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                          <div>
                            <div className="text-[10px] text-stone-400">ยอดรวมทั้งสิ้น</div>
                            <div className="text-base font-bold text-stone-900 dark:text-white">
                              {formatCurrency(order.totalAmount)}
                            </div>
                          </div>

                          {order.guestSignature ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0">
                              <PenLine className="w-3.5 h-3.5" /> มีลายเซ็นยินยอม
                            </span>
                          ) : order.slipImage ? (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0">
                              <Receipt className="w-3.5 h-3.5" /> มีสลิปแนบ
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setViewingOrderDetails(order)}
                            className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-amber-600" />
                            <span>ดูรายละเอียด/บิล</span>
                          </button>

                          {order.isRoomCharge && (
                            <button
                              type="button"
                              onClick={() => handleOpenTransferModal(order)}
                              className="px-3 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1 min-h-[44px] cursor-pointer"
                              title="ย้ายบิลไปห้องอื่น"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                              <span className="hidden sm:inline">ย้ายห้อง</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order)}
                            className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUBTAB 3: Custom Room Charges (Laundry, Damage, Tour, Spa, etc.) */}
      {activeSubTab === "charges" && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#101c42] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                บันทึกค่าใช้จ่ายอื่นๆ เข้าห้องพัก (Custom Folio Charge)
              </h3>
              <p className="text-xs text-stone-500">
                เช่น ค่าซักรีด (Laundry), ค่าบริการสปา, ค่าบริการรถตู้รับส่ง, หรือค่าความเสียหาย
              </p>
            </div>
          </div>

          {chargeSuccessMsg && (
            <div className="my-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{chargeSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleAddCharge} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                เลือกห้องพักเป้าหมายที่ต้องการชาร์จ *
              </label>
              <select
                required
                value={chargeTargetBookingId}
                onChange={(e) => setChargeTargetBookingId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white"
              >
                <option value="">-- เลือกห้องพักที่มีผู้เข้าพักในปัจจุบัน --</option>
                {bookings.filter((b) => b.status === "CHECKED_IN").map((b) => (
                  <option key={b.id} value={b.id}>
                    ห้อง {b.roomNumber} - {b.guestName} (บิล: {b.bookingNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                รายการค่าบริการ (Charge Title / Description) *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น ค่าซักรีดเสื้อผ้า 3 ชิ้น, ค่าบริการรถตู้สนามบิน, ค่าเตาบาร์บีคิวเพิ่ม..."
                value={chargeTitle}
                onChange={(e) => setChargeTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                จำนวนเงิน (THB) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white font-bold"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!chargeTargetBookingId}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:opacity-95 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/25 min-h-[44px]"
              >
                บันทึกค่าใช้จ่ายเข้า Folio ห้องพัก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 4: Room Management (CRUD, Capacity, Pricing, Amenities & Stop Sell) */}
      {activeSubTab === "rooms" && (
        <div className="space-y-4">
          {/* Top Sub-Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#101c42] p-2.5 sm:p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-slate-900 rounded-xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setRoomSubMode("availability")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  roomSubMode === "availability"
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm"
                    : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>จำนวนห้องว่าง & ปิดห้อง (Availability & Stop Sell)</span>
              </button>

              <button
                type="button"
                onClick={() => setRoomSubMode("setup")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  roomSubMode === "setup"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                <BedDouble className="w-4 h-4" />
                <span>จัดการผังห้องพักและราคา (Room Setup)</span>
              </button>
            </div>

            {roomSubMode === "setup" && (
              <button
                onClick={handleOpenAddRoom}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:opacity-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-amber-500/30 min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มห้องพักใหม่</span>
              </button>
            )}
          </div>

          {roomSubMode === "availability" ? (
            <RoomAvailabilityManager />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRoomsList.map((room) => (
              <div
                key={room.id}
                className="bg-white dark:bg-[#101c42] rounded-3xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-black text-xl text-stone-900 dark:text-white">
                          ห้อง {room.roomNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 whitespace-nowrap shrink-0">
                          ชั้น {room.floor}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-stone-700 dark:text-stone-300 mt-1">
                        {room.name}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {room.propertyId === "bugaan" ? "Bu-Gaan Sukhothai Village" : "Thanawong Pool Villa"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-base text-amber-700 dark:text-amber-400">
                        {formatCurrency(room.pricePerNight)}
                      </div>
                      <div className="text-[10px] text-stone-400">/ คืน</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
                    <span className="bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg whitespace-nowrap shrink-0">
                      ผู้ใหญ่ {room.capacityAdults} | เด็ก {room.capacityKids}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg font-semibold text-[11px] whitespace-nowrap shrink-0 ${
                      room.status === "AVAILABLE"
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                        : room.status === "OCCUPIED"
                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                        : room.status === "CLEANING"
                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                        : "bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-stone-300"
                    }`}>
                      {room.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                      สิ่งอำนวยความสะดวก
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {room.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60 whitespace-nowrap shrink-0"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex gap-2">
                  <button
                    onClick={() => handleOpenEditRoom(room)}
                    className="flex-1 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-slate-800 text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-center gap-1.5 min-h-[38px]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไขห้อง</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`คุณต้องการลบห้อง ${room.roomNumber} ใช่หรือไม่?`)) {
                        deleteRoom(room.id);
                      }
                    }}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                    title="ลบห้องพักนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* SUBTAB 5: Database Backup & Restore */}
      {activeSubTab === "database" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Notification Alert Message */}
          {backupRestoreMsg && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3 animate-in fade-in ${
                backupRestoreMsg.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-800 dark:text-emerald-200"
                  : backupRestoreMsg.type === "error"
                  ? "bg-rose-50 dark:bg-rose-950/50 border-rose-300 text-rose-800 dark:text-rose-200"
                  : "bg-blue-50 dark:bg-blue-950/50 border-blue-300 text-blue-800 dark:text-blue-200"
              }`}
            >
              {backupRestoreMsg.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : backupRestoreMsg.type === "error" ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              ) : (
                <RefreshCw className="w-5 h-5 text-blue-600 shrink-0" />
              )}
              <span className="font-medium">{backupRestoreMsg.text}</span>
            </div>
          )}

          {/* Cloud Database Connection & Realtime Sync Card (Moved into Setting) */}
          <div className="bg-white dark:bg-[#101c42] p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                  <Database className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-white">
                      การเชื่อมต่อฐานข้อมูลออนไลน์ (Cloud Database & Multi-Device Sync)
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${
                      isDatabaseInstalled
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isDatabaseInstalled ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                      {isDatabaseInstalled ? "Cloud Online DB" : "Local Browser DB"}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {isDatabaseInstalled
                      ? `เชื่อมต่อกับ Cloud Database เรียบร้อยแล้ว ซิงค์ข้อมูลระหว่างเครื่องได้ทันที ${lastSyncTime ? `(อัปเดตล่าสุด: ${lastSyncTime})` : ""}`
                      : "ปัจจุบันใช้งานโหมดจัดเก็บข้อมูลใน Browser (Local Storage) หากต้องการเปิดใช้งานพร้อมกันหลายเครื่อง ให้กดติดตั้ง Cloud DB"}
                  </p>
                </div>
              </div>

              {onOpenInstall && (
                <button
                  type="button"
                  onClick={onOpenInstall}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[44px]"
                >
                  <Database className="w-4 h-4 text-white" />
                  <span>{isDatabaseInstalled ? "ตั้งค่าฐานข้อมูล Cloud DB" : "ติดตั้งฐานข้อมูลออนไลน์ (Cloud DB)"}</span>
                </button>
              )}
            </div>

            {isDatabaseInstalled && databaseConfig && (
              <div className="mt-4 p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-stone-400 block text-[11px]">ประเภทฐานข้อมูล:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{databaseConfig.provider}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">Database Host / Endpoint:</span>
                  <span className="font-mono text-stone-700 dark:text-stone-300 truncate block">{databaseConfig.host || "Cloud Hosted"}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">สถานะการซิงค์:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 whitespace-nowrap shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    เชื่อมต่อสมบูรณ์ (Active)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#101c42] p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="flex items-center gap-3 pb-5 border-b border-stone-200 dark:border-stone-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-white">
                  ระบบสำรอง & นำเข้าฐานข้อมูล (Database Backup & Restore)
                </h3>
                <p className="text-xs text-stone-500">
                  ดาวน์โหลดข้อมูลทั้งหมดของโรงแรมเก็บไว้เป็นไฟล์ JSON หรืออัปโหลดไฟล์แบ็กอัพกลับเข้าสู่ระบบได้ทุกเมื่อ
                </p>
              </div>
            </div>

            {/* Current Database Summary Card */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-center">
                <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{rooms.length}</div>
                <div className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">ห้องพักในระบบ</div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-center">
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{bookings.length}</div>
                <div className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">ประวัติการจอง</div>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-center">
                <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{menuItems.length}</div>
                <div className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">รายการอาหาร/มินิบาร์</div>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-center">
                <div className="text-2xl font-black text-purple-700 dark:text-purple-400">{orders.length}</div>
                <div className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">ออเดอร์รูมเซอร์วิส</div>
              </div>
            </div>

            {/* Two Action Panels: Export & Import */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Export Panel */}
              <div className="p-6 rounded-3xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-stone-700/80 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2.5 text-stone-900 dark:text-white font-bold text-base">
                    <Download className="w-5 h-5 text-amber-600" />
                    <span>แบ็กอัพฐานข้อมูล (Export Database)</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                    สร้างไฟล์สำรองข้อมูลฉบับสมบูรณ์ (.json) ประกอบด้วยผังห้องพัก, ประวัติการจองทุกรายชื่อ, รายการเมนู, และบิลค่าใช้จ่ายทั้งหมด
                  </p>
                </div>

                <button
                  onClick={handleExportDatabase}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-amber-500/25 transition-all min-h-[44px]"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์แบ็กอัพ (.json)</span>
                </button>
              </div>

              {/* Import Panel */}
              <div className="p-6 rounded-3xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-stone-700/80 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2.5 text-stone-900 dark:text-white font-bold text-base">
                    <Upload className="w-5 h-5 text-emerald-600" />
                    <span>นำเข้าไฟล์ฐานข้อมูล (Restore Database)</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                    เลือกไฟล์แบ็กอัพ JSON ที่เคยบันทึกไว้ เพื่อกู้คืนข้อมูลห้องพักและการจองทั้งหมดกลับเข้าสู่ระบบทันที
                  </p>
                </div>

                <label className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer min-h-[44px]">
                  <Upload className="w-4 h-4" />
                  <span>เลือกไฟล์ JSON เพื่อนำเข้า</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportDatabase}
                    className="hidden"
                  />
                </label>
              </div>

            </div>

            {/* Reset to Default Section */}
            <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  รีเซ็ตข้อมูลเป็นค่าเริ่มต้น (Reset to Initial Demo Data)
                </h4>
                <p className="text-[11px] text-stone-400">
                  ล้างข้อมูลที่บันทึกไว้ใน Browser และคืนค่า Mock Data 22 ห้องพัก และการจองตัวอย่าง
                </p>
              </div>

              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors min-h-[40px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>รีเซ็ตค่าเริ่มต้น</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SUBTAB 6: Business Analytics & Interactive Graph Reports */}
      {activeSubTab === "analytics" && (
        <div className="space-y-6">

          {/* Interactive Graph Report Section */}
          <div className="bg-white dark:bg-[#101c42] p-5 sm:p-7 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            
            {/* Graph Controls Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-white">
                    รายงานกราฟผลประกอบการและการจอง (Graph Analytics)
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  วิเคราะห์ยอดรายได้และจำนวนการจองย้อนหลัง แสดงกราฟเปรียบเทียบ แต่ละวัน แต่ละเดือน และแต่ละปี
                </p>
              </div>

              {/* Resolution Period Buttons (Day, Month, Year) */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => setGraphPeriod("DAILY")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      graphPeriod === "DAILY"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                    }`}
                  >
                    แต่ละวัน (Daily)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGraphPeriod("MONTHLY")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      graphPeriod === "MONTHLY"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                    }`}
                  >
                    แต่ละเดือน (Monthly)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGraphPeriod("YEARLY")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      graphPeriod === "YEARLY"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                    }`}
                  >
                    แต่ละปี (Yearly)
                  </button>
                </div>

                {/* Metric Selector (Revenue vs Bookings) */}
                <div className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => setGraphMetric("REVENUE")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      graphMetric === "REVENUE"
                        ? "bg-emerald-600 text-white shadow-xs font-bold"
                        : "text-stone-600 dark:text-stone-300"
                    }`}
                  >
                    ยอดรายรับ (฿)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGraphMetric("BOOKINGS")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      graphMetric === "BOOKINGS"
                        ? "bg-blue-600 text-white shadow-xs font-bold"
                        : "text-stone-600 dark:text-stone-300"
                    }`}
                  >
                    จำนวนการจอง
                  </button>
                </div>

                {/* Status Filter for Graph */}
                <select
                  value={graphStatusFilter}
                  onChange={(e) => setGraphStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs font-medium text-stone-800 dark:text-stone-200 cursor-pointer"
                  title="กรองสถานะสำหรับกราฟ"
                >
                  <option value="ALL">สถานะ: ทั้งหมด (All)</option>
                  <option value="CHECKED_IN">Checked-in</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CHECKED_OUT">Checked-out</option>
                </select>

                {/* Export Graph Button */}
                <button
                  type="button"
                  onClick={handleExportGraphExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title="ดาวน์โหลดข้อมูลกราฟนี้เป็นไฟล์ Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export กราฟ</span>
                </button>
              </div>
            </div>

            {/* Quick Metric Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700">
                <span className="text-[11px] text-stone-400 font-medium">รวมรายได้ตามกราฟ</span>
                <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {formatCurrency(graphTotalRevenue)}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700">
                <span className="text-[11px] text-stone-400 font-medium">รวมการจองตามกราฟ</span>
                <div className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
                  {graphTotalBookings} รายการ
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700">
                <span className="text-[11px] text-stone-400 font-medium">เฉลี่ยต่อช่วงเวลา</span>
                <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {graphMetric === "REVENUE" 
                    ? formatCurrency(Math.round(graphTotalRevenue / (activeGraphData.length || 1)))
                    : `${(graphTotalBookings / (activeGraphData.length || 1)).toFixed(1)} รายการ`}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700">
                <span className="text-[11px] text-stone-400 font-medium">จุดสูงสุด (Peak)</span>
                <div className="text-base sm:text-lg font-black text-stone-900 dark:text-white mt-0.5">
                  {graphMetric === "REVENUE" ? formatCurrency(graphMaxValue) : `${graphMaxValue} รายการ`}
                </div>
              </div>
            </div>

            {/* SVG Interactive Bar Chart */}
            <div className="p-4 rounded-2xl bg-stone-50/70 dark:bg-[#0c1430] border border-stone-200 dark:border-stone-800 overflow-x-auto">
              <div className="min-w-[650px] sm:min-w-full">
                
                {/* SVG Graph View */}
                <div className="relative h-64 sm:h-72 w-full flex items-end pt-10 pb-6 px-4">
                  
                  {/* Grid Guidelines */}
                  <div className="absolute inset-x-4 top-10 bottom-6 pointer-events-none flex flex-col justify-between border-b border-stone-200 dark:border-stone-800">
                    {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => (
                      <div key={idx} className="border-b border-dashed border-stone-200 dark:border-stone-800/80 w-full relative">
                        <span className="absolute right-0 -top-3 text-[9px] text-stone-400 font-mono">
                          {graphMetric === "REVENUE"
                            ? `฿${Math.round((graphMaxValue * ratio) / 1000)}k`
                            : Math.round(graphMaxValue * ratio)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Vertical Bars */}
                  <div className="relative w-full h-full flex items-end justify-between gap-1.5 sm:gap-3 z-10">
                    {activeGraphData.map((item, idx) => {
                      const heightPercent = Math.max(8, Math.round((item.value / graphMaxValue) * 100));
                      const isHovered = hoveredGraphIndex === idx;

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredGraphIndex(idx)}
                          onMouseLeave={() => setHoveredGraphIndex(null)}
                          className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                        >
                          {/* Value on top of bar */}
                          <div className={`text-[10px] sm:text-[11px] font-bold mb-1 transition-all ${
                            isHovered 
                              ? "text-amber-600 dark:text-amber-300 scale-110 font-black" 
                              : "text-stone-500 dark:text-stone-400"
                          }`}>
                            {graphMetric === "REVENUE"
                              ? item.value >= 1000 ? `฿${(item.value / 1000).toFixed(item.value >= 10000 ? 0 : 1)}k` : `฿${item.value}`
                              : item.value}
                          </div>

                          {/* The Bar */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full max-w-[42px] rounded-t-xl transition-all duration-300 ${
                              item.highlight
                                ? "bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 shadow-md shadow-amber-500/30"
                                : isHovered
                                ? "bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/20"
                                : "bg-gradient-to-t from-stone-400/80 via-stone-300/80 to-amber-500/60 dark:from-slate-700 dark:via-slate-600 dark:to-amber-500/50"
                            }`}
                          />

                          {/* Bottom X-axis label */}
                          <div className="mt-2 text-center">
                            <span className={`text-[10px] sm:text-xs font-bold block ${
                              item.highlight
                                ? "text-amber-600 dark:text-amber-400 font-extrabold"
                                : "text-stone-600 dark:text-stone-300"
                            }`}>
                              {item.label}
                            </span>
                            <span className="text-[9px] text-stone-400 hidden sm:block">
                              {item.subLabel}
                            </span>
                          </div>

                          {/* Hover Tooltip Card */}
                          {isHovered && (
                            <div className="absolute -top-16 z-30 px-3 py-1.5 rounded-xl bg-stone-900 text-white text-[11px] whitespace-nowrap shadow-xl border border-stone-700 pointer-events-none animate-in fade-in zoom-in-95">
                              <div className="font-bold">{item.label} ({item.fullDate})</div>
                              <div className="text-emerald-400 font-semibold">{formatCurrency(item.revenue)}</div>
                              <div className="text-stone-300 text-[10px]">{item.bookings} การจอง</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* Detailed Table Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  ตารางแจกแจงตัวเลข (Data Breakdown: {graphPeriod === "DAILY" ? "รายวัน" : graphPeriod === "MONTHLY" ? "รายเดือน" : "รายปี"})
                </span>
                <span className="text-[11px] text-stone-400">
                  ทั้งหมด {activeGraphData.length} ช่วงเวลา
                </span>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-slate-800 text-stone-500 font-semibold border-b border-stone-200 dark:border-stone-800">
                    <tr>
                      <th className="p-3">ช่วงเวลา (Period)</th>
                      <th className="p-3 text-center">จำนวนการจอง</th>
                      <th className="p-3 text-right">ยอดรายรับ (Revenue)</th>
                      <th className="p-3 text-right">เฉลี่ยต่อบิล</th>
                      <th className="p-3 text-right">สัดส่วน (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-[#101c42]">
                    {activeGraphData.map((d, i) => {
                      const sharePct = graphTotalRevenue > 0 ? Math.round((d.revenue / graphTotalRevenue) * 100) : 0;
                      return (
                        <tr key={i} className="hover:bg-amber-50/20 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-stone-800 dark:text-stone-200">
                            {d.label} <span className="text-[10px] text-stone-400 font-normal">({d.subLabel})</span>
                          </td>
                          <td className="p-3 text-center font-bold text-blue-600 dark:text-blue-400">
                            {d.bookings} รายการ
                          </td>
                          <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-400">
                            {formatCurrency(d.revenue)}
                          </td>
                          <td className="p-3 text-right text-stone-500">
                            {d.bookings > 0 ? formatCurrency(Math.round(d.revenue / d.bookings)) : "฿0"}
                          </td>
                          <td className="p-3 text-right">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                              {sharePct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#101c42] border border-stone-200 dark:border-stone-800 shadow-xs">
              <span className="text-xs text-stone-500 font-medium">ยอดรายรับรวม (Total Revenue)</span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrency(totalRevenue)}
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">จากการจองทั้งหมด {propertyBookings.length} รายการ</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#101c42] border border-stone-200 dark:border-stone-800 shadow-xs">
              <span className="text-xs text-stone-500 font-medium">รับชำระแล้ว (Collected)</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(totalDeposited)}
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">เงินสด, บัตรเครดิต, QR Code</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#101c42] border border-stone-200 dark:border-stone-800 shadow-xs">
              <span className="text-xs text-stone-500 font-medium">ยอดค้างชำระ (Pending Balance)</span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {formatCurrency(totalBalanceDue)}
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">รอชำระก่อนเช็คเอาต์</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#101c42] border border-stone-200 dark:border-stone-800 shadow-xs">
              <span className="text-xs text-stone-500 font-medium">อัตราการเข้าพัก (Occupancy Rate)</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {occupancyRate}%
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">เข้าพักอยู่ {occupiedCount} จาก {filteredRoomsList.length} ห้อง</span>
            </div>
          </div>

          {/* Sources Breakdown & Property Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Booking Channels */}
            <div className="bg-white dark:bg-[#101c42] p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
              <h4 className="font-serif font-bold text-base text-stone-900 dark:text-white mb-4">
                สัดส่วนช่องทางการจอง (Booking Channels)
              </h4>
              <div className="space-y-3">
                {[
                  { name: "Booking.com", count: propertyBookings.filter((b) => b.source === "Booking.com").length, color: "bg-blue-600" },
                  { name: "Agoda", count: propertyBookings.filter((b) => b.source === "Agoda").length, color: "bg-emerald-600" },
                  { name: "Direct Walk-in", count: propertyBookings.filter((b) => b.source === "Walk-in").length, color: "bg-amber-500" },
                  { name: "Airbnb", count: propertyBookings.filter((b) => b.source === "Airbnb").length, color: "bg-rose-500" },
                  { name: "Facebook / LINE", count: propertyBookings.filter((b) => b.source === "Facebook / LINE").length, color: "bg-teal-500" },
                ].map((item, idx) => {
                  const pct = propertyBookings.length > 0 ? Math.round((item.count / propertyBookings.length) * 100) : 0;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-stone-700 dark:text-stone-300">{item.name}</span>
                        <span className="text-stone-500">{item.count} รายการ ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Property Comparison Card */}
            <div className="bg-white dark:bg-[#101c42] p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
              <h4 className="font-serif font-bold text-base text-stone-900 dark:text-white mb-4">
                เปรียบเทียบทั้ง 2 โรงแรม (Property Performance)
              </h4>
              <div className="space-y-4">
                {properties.map((prop) => {
                  const propBks = bookings.filter((b) => b.propertyId === prop.id);
                  const propRev = propBks.reduce((sum, b) => sum + b.grandTotal, 0);
                  const propRooms = rooms.filter((r) => r.propertyId === prop.id);
                  const propOcc = propRooms.filter((r) => r.status === "OCCUPIED").length;

                  return (
                    <div key={prop.id} className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-stone-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {prop.id === "bugaan" ? (
                            <Building className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Palmtree className="w-4 h-4 text-emerald-600" />
                          )}
                          <span className="font-bold text-sm text-stone-900 dark:text-white">{prop.name}</span>
                        </div>
                        <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                          {formatCurrency(propRev)}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-stone-500 flex justify-between">
                        <span>ห้องพักทั้งหมด: {propRooms.length} ห้อง</span>
                        <span>เข้าพัก: {propOcc} ห้อง ({propRooms.length > 0 ? Math.round((propOcc / propRooms.length) * 100) : 0}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUBTAB: ตั้งค่า PromptPay QR & บัญชีธนาคารแต่ละสาขา */}
      {activeSubTab === "payment" && (
        <div className="space-y-6">

          {/* Feedback Toast */}
          {paymentSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{paymentSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setPaymentSuccessMsg(null)}
                className="text-emerald-600 hover:text-emerald-800 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Branch Selector Header Banner */}
          <div className="bg-white dark:bg-[#101c42] p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/25 shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                    ตั้งค่าชำระเงินผ่าน PromptPay QR แต่ละสาขา
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                    BOT EMVCo Standard
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  กำหนดค่าพร้อมเพย์ บัญชีธนาคาร และ Biller ID แยกอิสระสำหรับ Bu-Gaan Sukhothai และ Thanawong Pool Villa
                </p>
              </div>
            </div>

            {/* Branch Selector Segmented Buttons */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-100 dark:bg-slate-800/90 border border-stone-200 dark:border-stone-700 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setSelectedPaymentPropertyId("bugaan")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPaymentPropertyId === "bugaan"
                    ? "bg-white dark:bg-amber-600 text-stone-900 dark:text-white shadow-xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Bu-Gaan Sukhothai</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentPropertyId("thanawong")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPaymentPropertyId === "thanawong"
                    ? "bg-white dark:bg-amber-600 text-stone-900 dark:text-white shadow-xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                <Palmtree className="w-3.5 h-3.5" />
                <span>Thanawong Pool Villa</span>
              </button>
            </div>
          </div>

          {/* Form and Live QR Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT: Configuration Form (7 Columns) */}
            <form onSubmit={handleSavePaymentConfig} className="lg:col-span-7 space-y-5">
              
              {/* Card 1: Status & Branch Identity */}
              <div className="bg-white dark:bg-[#101c42] p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm text-stone-900 dark:text-white">
                      สถานะการเปิดรับชำระ ({paymentForm.propertyName})
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentForm.isActive}
                      onChange={(e) => setPaymentForm({ ...paymentForm, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Auto Fill Amount Toggle */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-stone-100 dark:border-stone-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 dark:text-white">
                        ระบุยอดเงินอัตโนมัติ (Dynamic QR)
                      </span>
                      <input
                        type="checkbox"
                        checked={paymentForm.autoFillAmount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, autoFillAmount: e.target.checked })}
                        className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      เมื่อเปิด: ยอดเงินจากบิลห้องพักหรือ POS จะถูกใส่ในแอปธนาคารของลูกค้าให้อัตโนมัติ ป้องกันลูกค้ากรอกยอดเงินผิด
                    </p>
                  </div>

                  {/* Branch Identifier Info */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-stone-100 dark:border-stone-800 space-y-1">
                    <span className="text-xs font-bold text-stone-900 dark:text-white block">
                      รหัสสาขาในระบบ
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      {paymentForm.propertyId}
                    </span>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      เชื่อมโยงกับระบบบิล Folio, POS, และระบบจองห้องพักของสาขานี้
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: PromptPay Target & Account Info */}
              <div className="bg-white dark:bg-[#101c42] p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>ข้อมูลบัญชีธนาคาร & พร้อมเพย์</span>
                </h4>

                {/* PromptPay Target Type Selection */}
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                    ประเภทการรับชำระพร้อมเพย์ (PromptPay Target Type) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, type: "BILLER_ID" })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        paymentForm.type === "BILLER_ID"
                          ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20"
                          : "border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      <div className="font-bold text-xs">Biller ID (15 หลัก)</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">บิลเลอร์ธุรกิจ/ธนาคาร</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, type: "TAX_ID" })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        paymentForm.type === "TAX_ID"
                          ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20"
                          : "border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      <div className="font-bold text-xs">Tax ID / เลขนิติบุคคล (13 หลัก)</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">บริษัท / ห้างหุ้นส่วน</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, type: "PHONE" })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        paymentForm.type === "PHONE"
                          ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20"
                          : "border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      <div className="font-bold text-xs">เบอร์โทรศัพท์ (10 หลัก)</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">เบอร์มือถือพร้อมเพย์</div>
                    </button>
                  </div>
                </div>

                {/* PromptPay Target ID Input */}
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {paymentForm.type === "BILLER_ID"
                      ? "รหัสผู้ให้บริการ Biller ID (15 หลัก)"
                      : paymentForm.type === "TAX_ID"
                      ? "เลขประจำตัวผู้เสียภาษี / เลขนิติบุคคล (13 หลัก)"
                      : "หมายเลขโทรศัพท์พร้อมเพย์ (10 หลัก)"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.promptPayId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, promptPayId: e.target.value })}
                    placeholder={
                      paymentForm.type === "BILLER_ID"
                        ? "เช่น 004999209279107"
                        : paymentForm.type === "TAX_ID"
                        ? "เช่น 0645564000188"
                        : "เช่น 0812345678"
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm font-mono font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    ตัวเลขอย่างเดียว ระบบจะนำไปคำนวณ Checksum CRC-16 ตามมาตรฐาน Thai QR EMVCo โดยอัตโนมัติ
                  </span>
                </div>

                {/* Merchant Name & Bank Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      ชื่อบัญชี / ชื่อโรงแรมที่แสดง <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentForm.merchantName}
                      onChange={(e) => setPaymentForm({ ...paymentForm, merchantName: e.target.value })}
                      placeholder="เช่น บูก้านสุโขทัยวิลเลจ หรือ บจก. ธนะวงษ์"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      ธนาคารเจ้าของบัญชี <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={paymentForm.bankName}
                      onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="ธนาคารกสิกรไทย (KBANK)">ธนาคารกสิกรไทย (KBANK)</option>
                      <option value="ธนาคารไทยพาณิชย์ (SCB)">ธนาคารไทยพาณิชย์ (SCB)</option>
                      <option value="ธนาคารกรุงเทพ (BBL)">ธนาคารกรุงเทพ (BBL)</option>
                      <option value="ธนาคารกรุงไทย (KTB)">ธนาคารกรุงไทย (KTB)</option>
                      <option value="ธนาคารกรุงศรีอยุธยา (BAY)">ธนาคารกรุงศรีอยุธยา (BAY)</option>
                      <option value="ธนาคารทหารไทยธนชาต (ttb)">ธนาคารทหารไทยธนชาต (ttb)</option>
                      <option value="ธนาคารออมสิน (GSB)">ธนาคารออมสิน (GSB)</option>
                      <option value="ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)">ธ.ก.ส. (BAAC)</option>
                    </select>
                  </div>
                </div>

                {/* Account Number Masked */}
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    เลขที่บัญชีธนาคาร (แสดงในหน้าใบเสร็จและหน้าสแกน)
                  </label>
                  <input
                    type="text"
                    value={paymentForm.accountNumberMasked}
                    onChange={(e) => setPaymentForm({ ...paymentForm, accountNumberMasked: e.target.value })}
                    placeholder="เช่น 049-9-92092-7 หรือ xxx-x-x1419-x"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm font-mono text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Note / Instruction */}
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    คำแนะนำสำหรับลูกค้าเมื่อสแกนชำระเงิน
                  </label>
                  <input
                    type="text"
                    value={paymentForm.note || ""}
                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    placeholder="เช่น กรุณาตรวจสอบชื่อบัญชีและแนบสลิปการโอนเงินทุกครั้ง"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Card 3: Custom Official Bank QR Poster (Optional) */}
              <div className="bg-white dark:bg-[#101c42] p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>อัปโหลดรูปป้าย QR Code จากธนาคาร (ตัวเลือกเสริม)</span>
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      หากโรงแรมมีป้าย QR Code สำเร็จรูปที่ธนาคารออกให้ สามารถอัปโหลดไว้สำหรับแสดงผลได้
                    </p>
                  </div>
                  {paymentForm.customQrImage && (
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, customQrImage: undefined })}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบรูปภาพ</span>
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={paymentQrImageInputRef}
                  onChange={handlePaymentQrImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                {paymentForm.customQrImage ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-stone-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={paymentForm.customQrImage}
                      alt="Bank QR Preview"
                      className="w-16 h-16 object-contain rounded-xl border border-stone-200 bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-stone-900 dark:text-white block">
                        แนบป้าย QR Code สำเร็จแล้ว
                      </span>
                      <span className="text-[11px] text-stone-400 block truncate">
                        ลูกค้าสามารถเลือกดูระหว่าง QR Dynamic และป้ายทางการนี้ได้
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => paymentQrImageInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-600 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      เปลี่ยนรูป
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => paymentQrImageInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-stone-500 hover:text-amber-600 transition-colors cursor-pointer bg-stone-50/50 dark:bg-slate-800/30"
                  >
                    <Upload className="w-6 h-6 text-stone-400" />
                    <span className="text-xs font-bold">คลิกเพื่ออัปโหลดไฟล์รูป QR Code ธนาคาร (PNG, JPG)</span>
                    <span className="text-[10px] text-stone-400">หรือใช้ระบบสร้าง Dynamic QR อัตโนมัติโดยไม่ต้องอัปโหลด</span>
                  </button>
                )}
              </div>

              {/* Submit & Reset Bar */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetPaymentConfig}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs font-bold transition-all min-h-[44px] cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>คืนค่าเริ่มต้น</span>
                </button>

                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-600/25 transition-all min-h-[44px] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกการตั้งค่า ({paymentForm.propertyName})</span>
                </button>
              </div>

            </form>

            {/* RIGHT: Live Interactive Thai QR Preview (5 Columns) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-6 space-y-4">
                
                {/* Preview Box Card */}
                <div className="bg-white dark:bg-[#101c42] p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col items-center text-center space-y-4">
                  <div className="flex items-center justify-between w-full pb-3 border-b border-stone-100 dark:border-stone-800">
                    <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>ตัวอย่าง QR Code จริง (Live Preview)</span>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      อัปเดตทันที
                    </span>
                  </div>

                  {/* Test Amount Selector Pills */}
                  <div className="w-full space-y-1.5">
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 block text-left">
                      ทดสอบยอดเงินใน QR Code:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[0, 100, 500, 1500, 2800].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setTestPaymentAmount(amt)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            testPaymentAmount === amt
                              ? "bg-amber-600 text-white shadow-2xs"
                              : "bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {amt === 0 ? "ยอดเปิด (Open)" : `${amt} บาท`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thai QR Stand Model */}
                  <div className="w-full max-w-[260px] bg-white rounded-2xl border-2 border-[#0b3864] shadow-lg overflow-hidden text-center transition-all">
                    {/* Top Navy Header */}
                    <div className="bg-[#0b3864] text-white py-2 px-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-left">
                        <QrCode className="w-4 h-4 text-emerald-300" />
                        <div>
                          <div className="text-[10px] font-black tracking-wider leading-none">THAI QR</div>
                          <div className="text-[8px] font-semibold text-stone-300 tracking-wider">PAYMENT</div>
                        </div>
                      </div>
                      <div className="bg-white text-[#0b3864] px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight flex items-center gap-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/logos/promptpay-logo.png"
                          alt="PromptPay"
                          className="w-3 h-3 object-contain"
                        />
                        <span>PromptPay</span>
                      </div>
                    </div>

                    {/* QR Code Canvas Display */}
                    <div className="p-3 bg-white flex flex-col items-center justify-center">
                      {paymentQrDataUrl ? (
                        <div className="relative p-1 bg-white rounded-xl border border-stone-200 shadow-inner">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={paymentQrDataUrl}
                            alt="PromptPay Preview QR"
                            className="w-44 h-44 object-contain"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-8 rounded-lg bg-white p-0.5 shadow-md flex items-center justify-center border border-white overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="/logos/promptpay-logo.png"
                                alt="PromptPay Center Logo"
                                className="w-full h-full object-contain rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center text-xs text-stone-400">
                          กำลังสร้าง QR...
                        </div>
                      )}

                      {/* Account info below QR */}
                      <div className="mt-2.5 space-y-0.5 text-xs text-stone-700">
                        <p className="font-semibold text-emerald-700 text-[11px]">สแกน QR เพื่อโอนเข้าบัญชี</p>
                        <p className="font-bold text-xs text-stone-900 truncate max-w-[220px]">
                          {paymentForm.merchantName || "ชื่อบัญชีโรงแรม"}
                        </p>
                        <p className="text-[10px] text-stone-600">
                          <span className="font-mono font-semibold">{paymentForm.accountNumberMasked || "-"}</span> ({paymentForm.bankName})
                        </p>
                        <p className="text-[9px] text-stone-400 font-mono">
                          {paymentForm.type === "PHONE" 
                            ? `เบอร์พร้อมเพย์: ${paymentForm.promptPayId}` 
                            : paymentForm.type === "TAX_ID" 
                            ? `Tax ID: ${paymentForm.promptPayId}` 
                            : `Biller ID: ${paymentForm.promptPayId}`}
                        </p>
                      </div>
                    </div>

                    {/* Amount Banner */}
                    <div className="py-2 px-3 bg-stone-50 border-t border-b border-stone-200 flex items-center justify-between">
                      <span className="text-[11px] text-stone-500 font-medium">ยอดชำระ:</span>
                      <span className="text-base font-black text-emerald-700 font-serif">
                        {testPaymentAmount > 0 ? formatCurrency(testPaymentAmount) : "ตามยอดบิลจริง"}
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="py-1.5 px-3 bg-[#0a5839] text-white flex items-center justify-center gap-1 text-[9px] font-medium">
                      <span className="font-black bg-white text-[#0a5839] px-1 rounded text-[8px]">PromptPay</span>
                      <span>Accepts all banks | รับเงินได้ทุกธนาคาร</span>
                    </div>
                  </div>

                  {/* Actions & Verification */}
                  <div className="w-full space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!paymentQrDataUrl) return;
                        const a = document.createElement("a");
                        a.href = paymentQrDataUrl;
                        a.download = `PromptPay-${paymentForm.propertyId}-${testPaymentAmount || "open"}-THB.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      className="w-full py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลดรูปภาพ QR Code (PNG)</span>
                    </button>
                    <p className="text-[11px] text-stone-400">
                      สามารถใช้สมาร์ทโฟนเปิดแอปธนาคารใดก็ได้ (K PLUS, SCB, Krungthai NEXT ฯลฯ) สแกนทดสอบได้ทันที
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUBTAB 5: จัดการพนักงาน & สิทธิ์ผู้ใช้ (Staff User Management) */}
      {activeSubTab === "staff" && (
        <div className="space-y-6">
          {/* Header & Add Button */}
          <div className="bg-white dark:bg-[#101c42] p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                    จัดการพนักงาน & บัญชีผู้ใช้งานระบบ (Staff Users)
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    เพิ่ม แก้ไขข้อมูล กำหนดตำแหน่ง และสิทธิ์การเข้าถึงข้อมูลแต่ละโรงแรม (Bu-Gaan & Thanawong)
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenAddStaff}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all min-h-[44px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มพนักงานใหม่ (Add Staff)</span>
            </button>
          </div>

          {/* Feedback Alert */}
          {staffSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{staffSuccessMsg}</span>
            </div>
          )}

          {/* Staff List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffUsers.map((user) => {
              const isCurrentUser = currentUser?.id === user.id;
              const isGM = user.role === "General Manager" || user.username.toLowerCase() === "admin";

              return (
                <div
                  key={user.id}
                  className="bg-white dark:bg-[#101c42] p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    {/* Header: Avatar, Name, and Role Badge */}
                    <div className="flex items-start gap-3.5">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-13 h-13 rounded-2xl object-cover border-2 border-stone-200 dark:border-stone-700 shadow-xs shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm text-stone-900 dark:text-white truncate">
                            {user.name}
                          </h4>
                          {isCurrentUser && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 whitespace-nowrap shrink-0">
                              คุณ (You)
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-stone-500 dark:text-stone-400 mt-0.5">
                          @{user.username}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
                            isGM
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                          }`}>
                            <Shield className="w-2.5 h-2.5" />
                            <span>{user.role}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details: Property Access & Permissions */}
                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 text-[11px]">สิทธิ์การเข้าถึงโรงแรม:</span>
                        <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                          {user.propertyAccess === "all" ? (
                            <span className="text-amber-600 dark:text-amber-400">เข้าถึงทั้ง 2 โรงแรม (All)</span>
                          ) : user.propertyAccess === "bugaan" ? (
                            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                              <Building className="w-3 h-3" /> Bu-Gaan
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                              <Palmtree className="w-3 h-3" /> Thanawong
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span>รหัสผ่านทดสอบ:</span>
                        <span className="font-mono font-semibold text-stone-600 dark:text-stone-300 flex items-center gap-1">
                          <Key className="w-2.5 h-2.5" /> 1234
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditStaff(user)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-semibold transition-colors min-h-[44px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไขข้อมูล</span>
                    </button>

                    {/* Prevent deleting own account or the master admin */}
                    {user.username !== "admin" && (
                      <button
                        onClick={() => handleDeleteStaff(user)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="ลบพนักงาน"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Staff Add/Edit Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0e1738] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  {editingStaffUser ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                  {editingStaffUser ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
                </h3>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="mt-4 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  ชื่อ-นามสกุลพนักงาน *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น คุณกมลวรรณ สุขเกษม"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  ชื่อผู้ใช้งานสำหรับล็อกอิน (Username) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น frontdesk2, reservation, gm"
                  value={staffForm.username}
                  onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value.toLowerCase().trim() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  ตำแหน่งหน้าที่ (Role) *
                </label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="General Manager">General Manager (ผู้จัดการทั่วไป / สิทธิ์ดูแลระบบทั้งหมด)</option>
                  <option value="Front Desk Receptionist">Front Desk Receptionist (พนักงานต้อนรับ / เช็คอิน / จองห้อง)</option>
                  <option value="F&B Manager">F&B Manager (ผู้จัดการอาหารและเครื่องดื่ม / POS)</option>
                  <option value="Housekeeping Lead">Housekeeping Lead (หัวหน้าแม่บ้าน / จัดการสถานะห้องพัก)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  สิทธิ์การเข้าถึงข้อมูลโรงแรม (Property Access) *
                </label>
                <select
                  value={staffForm.propertyAccess}
                  onChange={(e) => setStaffForm({ ...staffForm, propertyAccess: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">ดูแลทั้ง 2 โรงแรม (Bu-Gaan & Thanawong)</option>
                  <option value="bugaan">เฉพาะ Bu-Gaan Sukhothai Village</option>
                  <option value="thanawong">เฉพาะ Thanawong Pool Villa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  รูปโปรไฟล์ (Avatar Image URL)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={staffForm.avatar}
                  onChange={(e) => setStaffForm({ ...staffForm, avatar: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-100 min-h-[44px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/30 min-h-[44px]"
                >
                  {editingStaffUser ? "บันทึกการแก้ไข" : "ยืนยันเพิ่มพนักงาน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0e1738] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300/40">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                แก้ไขข้อมูลการจอง ({editingBooking.bookingNumber})
              </h3>
              <button onClick={() => setEditingBooking(null)} className="p-1.5 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBookingEdit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">ชื่อผู้เข้าพัก</label>
                <input
                  type="text"
                  required
                  value={editingBooking.guestName}
                  onChange={(e) => setEditingBooking({ ...editingBooking, guestName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={editingBooking.guestPhone}
                    onChange={(e) => setEditingBooking({ ...editingBooking, guestPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">สถานะ</label>
                  <select
                    value={editingBooking.status}
                    onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value as BookingStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="CHECKED_IN">CHECKED_IN</option>
                    <option value="CHECKED_OUT">CHECKED_OUT</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">ยอดมัดจำที่ชำระแล้ว (THB)</label>
                <input
                  type="number"
                  value={editingBooking.depositPaid}
                  onChange={(e) => setEditingBooking({ ...editingBooking, depositPaid: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">หมายเหตุพิเศษ</label>
                <textarea
                  rows={2}
                  value={editingBooking.specialRequests || ""}
                  onChange={(e) => setEditingBooking({ ...editingBooking, specialRequests: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Details & PDPA Documents Modal */}
      {viewingBookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-[#101c42] rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-blue-500/30 max-h-[90vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                      ข้อมูลการจองและเอกสาร PDPA
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 whitespace-nowrap shrink-0">
                      {viewingBookingDetails.bookingNumber}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    ช่องทาง: {viewingBookingDetails.source} | โรงแรม: {viewingBookingDetails.propertyId === "bugaan" ? "Bu-Gaan Sukhothai" : "Thanawong Pool Villa"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingBookingDetails(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Guest & Room Details Grid */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-stone-400 block text-[11px]">ชื่อผู้เข้าพัก (Guest Name)</span>
                    <h4 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>{viewingBookingDetails.guestName}</span>
                      {viewingBookingDetails.companyName && (
                        <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                          ({viewingBookingDetails.companyName})
                        </span>
                      )}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-400 block text-[11px]">ห้องพัก</span>
                    <span className="text-base font-serif font-bold text-blue-600 dark:text-blue-400">
                      ห้อง {viewingBookingDetails.roomNumber}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                  <div>
                    <span className="text-stone-400 block text-[11px]">เบอร์โทรศัพท์</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-stone-400" />
                      {viewingBookingDetails.guestPhone || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">ช่วงเวลาเข้าพัก</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5 block">
                      {formatDateThai(viewingBookingDetails.checkInDate)} - {formatDateThai(viewingBookingDetails.checkOutDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">จำนวนคืน / ผู้เข้าพัก</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5 block">
                      {viewingBookingDetails.totalNights} คืน (ผู้ใหญ่ {viewingBookingDetails.adults || 2} ท่าน)
                    </span>
                  </div>
                </div>

                {/* Financial overview */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                  <div>
                    <span className="text-stone-400 block text-[11px]">ยอดรวมบิล</span>
                    <span className="font-bold text-stone-900 dark:text-white mt-0.5 block">
                      {formatCurrency(viewingBookingDetails.grandTotal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">ชำระแล้ว</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {formatCurrency(viewingBookingDetails.depositPaid)}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">ยอดคงค้าง</span>
                    <span className={`font-bold mt-0.5 block ${viewingBookingDetails.balanceDue > 0 ? "text-rose-600" : "text-stone-400"}`}>
                      {formatCurrency(viewingBookingDetails.balanceDue)}
                    </span>
                  </div>
                </div>

                {viewingBookingDetails.specialRequests && (
                  <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                    <span className="text-stone-400 block text-[11px]">หมายเหตุพิเศษ (Special Requests)</span>
                    <p className="text-stone-700 dark:text-stone-300 italic mt-0.5">
                      "{viewingBookingDetails.specialRequests}"
                    </p>
                  </div>
                )}
              </div>

              {/* PDPA Watermarked ID Document Section */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                        <span>เอกสารประจำตัวที่มีลายน้ำป้องกัน PDPA</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 whitespace-nowrap shrink-0">
                          PDPA Compliant
                        </span>
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        ประทับลายน้ำถาวรลงในเนื้อภาพ ป้องกันการนำไปใช้ผิดวัตถุประสงค์
                      </p>
                    </div>
                  </div>

                  {viewingBookingDetails.guestIdCardImage && (
                    <button
                      type="button"
                      onClick={() => setViewingPdpaDocumentImage(viewingBookingDetails.guestIdCardImage || null)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูภาพเต็ม</span>
                    </button>
                  )}
                </div>

                {viewingBookingDetails.guestIdCardImage ? (
                  <div className="space-y-2">
                    <div
                      onClick={() => setViewingPdpaDocumentImage(viewingBookingDetails.guestIdCardImage || null)}
                      className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-slate-900 cursor-pointer group flex items-center justify-center max-h-56"
                    >
                      <img
                        src={viewingBookingDetails.guestIdCardImage}
                        alt="PDPA Watermarked ID Document"
                        className="w-full h-auto max-h-56 object-contain group-hover:scale-102 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity gap-1.5">
                        <Eye className="w-4 h-4" />
                        <span>คลิกเพื่อขยายดูภาพขนาดใหญ่</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-[11px] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>เอกสารนี้ได้รับการประทับลายน้ำคุ้มครอง PDPA เรียบร้อย ห้ามนำไปใช้นอกเหนือจากการลงทะเบียนเข้าพักโรงแรม</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center text-stone-400">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">ยังไม่มีการบันทึกภาพเอกสารประจำตัวสำหรับการจองนี้</p>
                    <p className="text-[10px] mt-0.5">เปิดนโยบาย PDPA ด้านบนเพื่อให้ระบบบังคับถ่ายรูปบัตรประชาชนในทุกการเช็คอิน</p>
                  </div>
                )}
              </div>

              {/* Guest Digital Signature Section */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <PenLine className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                      ลายมือชื่อดิจิทัลผู้เข้าพัก (Guest Digital E-Signature)
                    </h4>
                    <p className="text-[10px] text-stone-400">
                      ลายเซ็นยืนยันข้อตกลงการเข้าพักและเงื่อนไขโรงแรม
                    </p>
                  </div>
                </div>

                {viewingBookingDetails.guestSignatureImage ? (
                  <div className="space-y-1.5">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700 flex items-center justify-center min-h-[90px]">
                      <img
                        src={viewingBookingDetails.guestSignatureImage}
                        alt="Guest Digital Signature"
                        className="max-h-24 w-auto object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
                      <span>ยืนยันตัวตนถูกต้อง</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>บันทึกดิจิทัลแล้ว</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center text-stone-400">
                    <PenLine className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                    <p className="font-medium">ยังไม่มีการบันทึกลายเซ็นดิจิทัลสำหรับการจองนี้</p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewingBookingDetails(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>

                {onGoToFolio && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = viewingBookingDetails.id;
                      setViewingBookingDetails(null);
                      onGoToFolio(id);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>ออกบิลย้อนหลัง (Folio)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const target = viewingBookingDetails;
                    setViewingBookingDetails(null);
                    setEditingBooking(target);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>แก้ไขข้อมูลการจอง</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* PDPA Watermarked ID Fullscreen Modal */}
      {viewingPdpaDocumentImage && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 border border-stone-200 dark:border-stone-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white">
              <span className="font-serif font-bold text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>ภาพเอกสารประจำตัวผู้เข้าพัก (มีลายน้ำคุ้มครอง PDPA)</span>
              </span>
              <button
                type="button"
                onClick={() => setViewingPdpaDocumentImage(null)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 flex justify-center">
              <img
                src={viewingPdpaDocumentImage}
                alt="PDPA Compliant ID Card"
                className="max-h-[70vh] w-auto rounded-xl object-contain border border-stone-200 dark:border-stone-800 shadow-inner"
              />
            </div>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setViewingPdpaDocumentImage(null)}
                className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0e1738] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-300/40">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                {editingMenuItem ? "แก้ไขเมนูอาหาร" : "เพิ่มเมนูอาหารใหม่"}
              </h3>
              <button onClick={() => setIsMenuModalOpen(false)} className="p-1.5 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">ชื่อรายการอาหาร / สินค้า *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ข้าวผัดปู หรือ นวดอโรมาเธอราปี"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">หมวดหมู่</label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value as MenuCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800"
                  >
                    <option value="FOOD">อาหารคาว (FOOD)</option>
                    <option value="BEVERAGE">เครื่องดื่ม (BEVERAGE)</option>
                    <option value="SPECIAL_SET">เซ็ตพิเศษ / Floating</option>
                    <option value="MINIBAR">มินิบาร์ (MINIBAR)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">ราคา (THB)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">โรงแรมที่จำหน่าย</label>
                <select
                  value={menuForm.propertyId}
                  onChange={(e) => setMenuForm({ ...menuForm, propertyId: e.target.value as PropertyId })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800"
                >
                  <option value="bugaan">Bu-Gaan Sukhothai Village</option>
                  <option value="thanawong">Thanawong Pool Villa</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-stone-700 dark:text-stone-300">
                  รูปภาพเมนูอาหาร (Food Photo)
                </label>

                {/* Hidden File Input for Native File Picker / Camera */}
                <input
                  type="file"
                  ref={menuImageInputRef}
                  accept="image/*"
                  onChange={handleMenuImageUpload}
                  className="hidden"
                />

                {menuForm.image ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-slate-800/80">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-slate-900 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={menuForm.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-stone-900 dark:text-white truncate">
                        แนบรูปภาพอาหารเรียบร้อย
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                        พร้อมแสดงผลบน POS และเมนูรูมเซอร์วิส
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => menuImageInputRef.current?.click()}
                        disabled={isUploadingMenuImage}
                        className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="เปลี่ยนรูปภาพใหม่"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isUploadingMenuImage ? "กำลังโหลด..." : "เปลี่ยนรูป"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMenuForm((prev) => ({ ...prev, image: "" }))}
                        className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="ลบรูปภาพ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => menuImageInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-stone-50 dark:bg-slate-800/50 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="font-bold text-xs text-stone-800 dark:text-stone-200 block">
                        {isUploadingMenuImage ? "กำลังประมวลผลรูปภาพ..." : "คลิกเพื่ออัปโหลดรูปภาพเมนู"}
                      </span>
                      <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 block">
                        รองรับไฟล์รูปภาพ JPG, PNG, WEBP (ระบบบีบอัดอัตโนมัติ)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1">คำอธิบาย</label>
                <textarea
                  rows={2}
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="menuAvailable"
                  checked={menuForm.isAvailable}
                  onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="menuAvailable" className="font-semibold cursor-pointer">
                  พร้อมจำหน่าย (Available for Sale)
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md"
                >
                  บันทึกเมนู
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details & Audit Modal (Signature, Items, Folio, Slip) */}
      {viewingOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0e1738] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[92vh] overflow-y-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                    รายละเอียดคำสั่งซื้อ #{viewingOrderDetails.orderNumber}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {new Date(viewingOrderDetails.createdAt).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingOrderDetails(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room / Property / Guest Info Card */}
            <div className="bg-stone-50 dark:bg-slate-800/60 p-3.5 rounded-2xl text-xs space-y-2 border border-stone-200/60 dark:border-stone-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-900 dark:text-white">
                    {viewingOrderDetails.roomNumber ? `ห้องพัก ${viewingOrderDetails.roomNumber}` : "ลูกค้าหน้าร้าน (Walk-in)"}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-stone-300">
                    {viewingOrderDetails.propertyId === "bugaan" ? "Bu-Gaan Sukhothai Village" : "Thanawong Pool Villa"}
                  </span>
                </div>
                {viewingOrderDetails.isRoomCharge ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold">
                    ชาร์จเข้าห้องพัก
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                    ชำระตรงแล้ว
                  </span>
                )}
              </div>

              {viewingOrderDetails.guestName && (
                <div className="text-stone-600 dark:text-stone-300">
                  <span className="text-stone-400">ผู้สั่ง / ผู้เข้าพัก:</span> <span className="font-semibold">{viewingOrderDetails.guestName}</span>
                </div>
              )}

              {viewingOrderDetails.orderNotes && (
                <div className="text-stone-600 dark:text-stone-300 bg-white dark:bg-slate-900 p-2 rounded-xl text-[11px] border border-stone-200 dark:border-stone-700">
                  <span className="text-stone-400">หมายเหตุคำขอ:</span> {viewingOrderDetails.orderNotes}
                </div>
              )}
            </div>

            {/* Room Charge Verification Details */}
            {viewingOrderDetails.isRoomCharge && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-2xl text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>หลักฐานการยืนยันชาร์จเข้าห้องพัก (Room Charge Verification)</span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                  รายการนี้ถูกบันทึกชาร์จเข้า Folio ของห้องพักแล้ว และรอการชำระเงินรวมตอนเช็คเอาต์
                </p>

                {viewingOrderDetails.guestConfirmed && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>ผู้เข้าพักกดยินยอมให้ชาร์จเข้าห้องพัก ณ วันที่สั่งซื้อ</span>
                    {viewingOrderDetails.guestConfirmedAt && (
                      <span className="text-stone-400 text-[10px]">
                        ({new Date(viewingOrderDetails.guestConfirmedAt).toLocaleTimeString("th-TH")})
                      </span>
                    )}
                  </div>
                )}

                {viewingOrderDetails.guestSignature && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <PenLine className="w-3.5 h-3.5 text-amber-600" />
                      <span>ลายเซ็นดิจิทัลของผู้เข้าพัก (Guest Digital Signature):</span>
                    </div>
                    <div className="bg-white rounded-xl border border-stone-300 dark:border-stone-700 p-2 flex items-center justify-center max-h-32 overflow-hidden shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={viewingOrderDetails.guestSignature}
                        alt="ลายเซ็นผู้เข้าพัก"
                        className="max-h-28 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Direct Payment Slip */}
            {viewingOrderDetails.slipImage && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 p-3.5 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold">
                  <Receipt className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>หลักฐานสลิปการโอนเงิน (Payment Slip):</span>
                </div>
                <div className="bg-white rounded-xl border border-stone-300 dark:border-stone-700 p-2 flex items-center justify-center max-h-48 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewingOrderDetails.slipImage}
                    alt="สลิปการโอนเงิน"
                    className="max-h-44 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Itemized Order Breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-700 dark:text-stone-300">
                รายการสินค้าในคำสั่งซื้อ ({viewingOrderDetails.items.length} รายการ)
              </div>
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 dark:bg-slate-800/80 text-stone-500 text-[11px]">
                    <tr>
                      <th className="p-2.5">รายการ</th>
                      <th className="p-2.5 text-center">จำนวน</th>
                      <th className="p-2.5 text-right">ราคา/หน่วย</th>
                      <th className="p-2.5 text-right">ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {viewingOrderDetails.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-stone-800 dark:text-stone-200">
                          <div>{item.name}</div>
                          {item.specialNote && (
                            <div className="text-[10px] text-amber-600">คำขอ: {item.specialNote}</div>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-medium">{item.quantity}</td>
                        <td className="p-2.5 text-right text-stone-500">{formatCurrency(item.price)}</td>
                        <td className="p-2.5 text-right font-bold text-stone-900 dark:text-white">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-stone-50 dark:bg-slate-800/50 font-bold border-t border-stone-200 dark:border-stone-800">
                    <tr>
                      <td colSpan={3} className="p-2.5 text-right">ยอดรวมทั้งสิ้น</td>
                      <td className="p-2.5 text-right text-base text-amber-600">
                        {formatCurrency(viewingOrderDetails.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setViewingOrderDetails(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs min-h-[44px] cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
              >
                ปิดหน้าต่าง
              </button>

              {viewingOrderDetails.isRoomCharge && (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenTransferModal(viewingOrderDetails);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/30 min-h-[44px] cursor-pointer transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>ย้ายไปห้องอื่น</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDeleteOrder(viewingOrderDetails)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 min-h-[44px] cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบรายการสั่งซื้อนี้</span>
              </button>
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

      {/* Add / Edit Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0e1738] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300/40 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-amber-600" />
                <span>{editingRoom ? `แก้ไขห้อง ${editingRoom.roomNumber}` : "เพิ่มห้องพักใหม่"}</span>
              </h3>
              <button onClick={() => setIsRoomModalOpen(false)} className="p-1.5 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">สังกัดโรงแรม *</label>
                  <select
                    value={roomForm.propertyId}
                    onChange={(e) => setRoomForm({ ...roomForm, propertyId: e.target.value as PropertyId })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                  >
                    <option value="bugaan">Bu-Gaan Sukhothai Village</option>
                    <option value="thanawong">Thanawong Pool Villa</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">หมายเลขห้อง (Room No.) *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น V105, PV201"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">ชื่อเรียกห้องพัก *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Grand Family Pool Villa"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">ประเภทห้อง (Type) *</label>
                  <select
                    value={roomForm.type}
                    onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value as RoomType })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                  >
                    <option value="Deluxe Villa">Deluxe Villa</option>
                    <option value="Pool Villa Suite">Pool Villa Suite</option>
                    <option value="Family Pool Villa">Family Pool Villa</option>
                    <option value="Executive Grand Villa">Executive Grand Villa</option>
                    <option value="Meeting & Event Hall (ห้องประชุม/จัดเลี้ยง)">ห้องประชุม/จัดเลี้ยง (Meeting Hall)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">ราคาต่อคืน (THB) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={roomForm.pricePerNight}
                    onChange={(e) => setRoomForm({ ...roomForm, pricePerNight: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">ผู้ใหญ่ (คน)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={roomForm.capacityAdults}
                    onChange={(e) => setRoomForm({ ...roomForm, capacityAdults: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">เด็ก (คน)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={roomForm.capacityKids}
                    onChange={(e) => setRoomForm({ ...roomForm, capacityKids: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">ชั้นที่ (Floor)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">สถานะห้องเริ่มต้น</label>
                <select
                  value={roomForm.status}
                  onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value as RoomStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                >
                  <option value="AVAILABLE">AVAILABLE (พร้อมขาย)</option>
                  <option value="CLEANING">CLEANING (กำลังทำความสะอาด)</option>
                  <option value="MAINTENANCE">MAINTENANCE (ปิดปรับปรุง)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">สิ่งอำนวยความสะดวก (คั่นด้วยจุลภาค ,)</label>
                <input
                  type="text"
                  placeholder="เช่น King Bed, Private Pool, Bathtub, Smart TV"
                  value={roomForm.amenities}
                  onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md"
                >
                  {editingRoom ? "บันทึกการแก้ไขห้อง" : "เพิ่มห้องพัก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0e1738] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-300/40 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                ยืนยันการรีเซ็ตฐานข้อมูล?
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                การดำเนินการนี้จะลบข้อมูลที่แก้ไขและคืนค่าเป็นชุดข้อมูลตั้งต้นของโรงแรม แนะนำให้กดดาวน์โหลดไฟล์แบ็กอัพ (.json) เก็บไว้ก่อน
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                ยืนยันรีเซ็ต
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
