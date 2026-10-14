"use client";

import React, { useState, useEffect } from "react";
import { usePMS } from "@/context/PMSContext";
import { OTAChannelConfig, OTAChannelId, OTARoomMapping, OTASyncLog, PropertyId } from "@/types/pms";
import { formatCurrency, formatDateThai } from "@/lib/utils";
import { OtaLogo } from "@/components/OtaLogo";
import { 
  Globe, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Key, 
  Lock, 
  ArrowRightLeft, 
  Link2, 
  Unlink, 
  Activity, 
  Cpu, 
  BellRing, 
  Copy, 
  Check, 
  SlidersHorizontal, 
  ExternalLink,
  Plus,
  Play,
  FileSpreadsheet,
  X,
  Layers,
  Sparkles,
  Zap,
  Send,
  MessageSquare,
  Bot,
  Building2,
  Palmtree,
  Table,
  Webhook,
  Edit2,
  Search,
  CheckCheck,
  Eye,
  Info,
  TrendingUp
} from "lucide-react";
import { exportToCSV } from "@/lib/exportExcel";
import { DynamicPricingManager } from "@/components/DynamicPricingManager";

export function ChannelManagerView() {
  const {
    activePropertyId,
    setActivePropertyId,
    properties,
    rooms,
    bookings,
    otaChannels,
    otaSyncLogs,
    roomMappings,
    updateRoomMapping,
    autoMapAllRooms,
    telegramConfig,
    updateTelegramConfig,
    testTelegramNotification,
    connectOTAChannel,
    disconnectOTAChannel,
    syncAllOTAChannels,
    simulateIncomingOTABooking,
    toggleChannelAutoClose,
    clearSyncLogs,
  } = usePMS();

  const isSpecificProperty = activePropertyId !== "all";
  const targetPropId: PropertyId = (activePropertyId === "all" ? "bugaan" : activePropertyId) as PropertyId;
  const activeProperty = properties.find((p) => p.id === targetPropId);
  const hotelName = activeProperty?.name || (targetPropId === "thanawong" ? "ธนวงศ์ พูลวิลล่า" : "Bu-Gaan Sukhothai Village");
  const roomUnit = targetPropId === "thanawong" ? "วิลล่า" : "ห้องพัก";
  const propRooms = rooms.filter((r) => r.propertyId === targetPropId);
  const propMappings = roomMappings.filter((m) => m.propertyId === targetPropId);

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<"channels" | "pricing" | "mapping" | "telegram" | "webhook" | "logs">("channels");

  // Modal State for Connecting / Editing OTA
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<OTAChannelConfig | null>(null);
  const [modalForm, setModalForm] = useState({
    hotelId: "",
    username: "",
    apiKey: "",
    autoCloseInventory: true,
    autoImportBookings: true,
  });

  // Modal State for Editing Room Mapping
  const [editingMapping, setEditingMapping] = useState<OTARoomMapping | null>(null);

  // Telegram Config Local Form State
  const [tgForm, setTgForm] = useState({
    botToken: telegramConfig.botToken || "",
    chatId: telegramConfig.chatId || "",
    botUsername: telegramConfig.botUsername || "@HotelPmsNotifyBot",
    isEnabled: telegramConfig.isEnabled,
    notifyOnNewBooking: telegramConfig.notifyOnNewBooking,
    notifyOnCheckIn: telegramConfig.notifyOnCheckIn,
    notifyOnOTABlock: telegramConfig.notifyOnOTABlock,
  });
  const [isSavingTg, setIsSavingTg] = useState(false);
  const [isTestingTg, setIsTestingTg] = useState(false);
  const [tgTestMessage, setTgTestMessage] = useState<string | null>(null);

  // Live Webhook Test Form State
  const [webhookTestForm, setWebhookTestForm] = useState({
    propertyId: targetPropId,
    channel: "Booking.com",
    roomNumber: targetPropId === "thanawong" ? "902" : "D1",
    guestName: targetPropId === "thanawong" ? "คุณปรมินทร์ วงศ์สุวรรณ (Thanawong OTA Guest)" : "คุณวิภาวรรณ สิทธิเดช (Bu-Gaan OTA Guest)",
    guestPhone: "089-123-4567",
    checkInDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    checkOutDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    totalAmount: targetPropId === "thanawong" ? 6500 : 2580,
  });
  const [webhookRunning, setWebhookRunning] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<any | null>(null);

  // Room Mapping Filter & Search - automatically sync with activePropertyId
  const [mappingHotelFilter, setMappingHotelFilter] = useState<PropertyId | "all">(activePropertyId);
  const [mappingSearch, setMappingSearch] = useState("");

  useEffect(() => {
    if (activePropertyId !== "all") {
      setMappingHotelFilter(activePropertyId);
    }
  }, [activePropertyId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const otaTab = params.get("ota_tab") || params.get("sub");
      if (otaTab === "pricing" || otaTab === "rates" || otaTab === "yield") {
        setActiveSubTab("pricing");
      }
    }
  }, []);

  useEffect(() => {
    if (activePropertyId === "thanawong") {
      setWebhookTestForm({
        propertyId: "thanawong",
        channel: "Booking.com",
        roomNumber: "902",
        guestName: "คุณปรมินทร์ วงศ์สุวรรณ (Thanawong OTA Guest)",
        guestPhone: "081-998-7711",
        checkInDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        checkOutDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        totalAmount: 6500,
      });
    } else {
      setWebhookTestForm({
        propertyId: "bugaan",
        channel: "Booking.com",
        roomNumber: "D1",
        guestName: "คุณวิภาวรรณ สิทธิเดช (Bu-Gaan OTA Guest)",
        guestPhone: "089-123-4567",
        checkInDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        checkOutDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        totalAmount: 2580,
      });
    }
  }, [activePropertyId]);

  // Simulation Feedback Banner
  const [simulationResult, setSimulationResult] = useState<{
    bookingNumber: string;
    guestName: string;
    roomNumber: string;
    source: string;
    blockedChannels: string[];
    dates: string;
  } | null>(null);

  // Syncing Animation State
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Log filter
  const [logFilter, setLogFilter] = useState<string>("ALL");

  const connectedChannelsCount = otaChannels.filter((c) => c.status === "connected").length;

  const handleOpenConnect = (channel: OTAChannelConfig) => {
    setSelectedChannel(channel);
    const isTW = targetPropId === "thanawong";
    const defaultHotelId = channel.hotelId || (
      isTW 
        ? (channel.id === "booking_com" ? "TW-BOOKING-33019" : channel.id === "agoda" ? "TW-AGODA-77102" : channel.id === "airbnb" ? "TW-AIRBNB-6604" : "TW-EXP-1102")
        : (channel.id === "booking_com" ? "BG-BOOKING-88201" : channel.id === "agoda" ? "AGODA-55410" : channel.id === "airbnb" ? "BG-AIRBNB-7721" : "BG-EXP-9912")
    );
    const defaultUsername = channel.username || (
      isTW ? "thanawong_poolvilla_mgr" : (channel.id === "booking_com" ? "bugaan_hotel_admin" : "bugaan_ota_partner")
    );
    setModalForm({
      hotelId: defaultHotelId,
      username: defaultUsername,
      apiKey: channel.apiKey || "live_api_sec_key_sample",
      autoCloseInventory: channel.autoCloseInventory,
      autoImportBookings: channel.autoImportBookings,
    });
    setIsConnectModalOpen(true);
  };

  const handleSaveConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel) return;
    await connectOTAChannel(selectedChannel.id, {
      hotelId: modalForm.hotelId,
      username: modalForm.username,
      apiKey: modalForm.apiKey,
      autoCloseInventory: modalForm.autoCloseInventory,
      autoImportBookings: modalForm.autoImportBookings,
    }, targetPropId);
    setIsConnectModalOpen(false);
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    await syncAllOTAChannels(targetPropId);
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  const handleSimulate = (channelId: OTAChannelId) => {
    const res = simulateIncomingOTABooking(channelId, targetPropId);
    if (res.success && res.booking) {
      setSimulationResult({
        bookingNumber: res.booking.bookingNumber,
        guestName: res.booking.guestName,
        roomNumber: res.booking.roomNumber,
        source: res.booking.source,
        blockedChannels: res.blockedChannels,
        dates: `${res.booking.checkInDate} ถึง ${res.booking.checkOutDate}`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleSaveTelegramConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTg(true);
    updateTelegramConfig(tgForm);
    setTimeout(() => {
      setIsSavingTg(false);
      setTgTestMessage("บันทึกการตั้งค่า Telegram Bot สำเร็จเรียบร้อย!");
      setTimeout(() => setTgTestMessage(null), 3000);
    }, 500);
  };

  const handleTestTelegram = async () => {
    setIsTestingTg(true);
    setTgTestMessage(null);
    try {
      const res = await testTelegramNotification();
      setTgTestMessage(res.message);
    } catch (err: any) {
      setTgTestMessage("ทดสอบไม่สำเร็จ: " + err.message);
    } finally {
      setIsTestingTg(false);
    }
  };

  const handleRunWebhookTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setWebhookRunning(true);
    setWebhookResponse(null);

    try {
      const payload = {
        event: "NEW_RESERVATION",
        channel: webhookTestForm.channel,
        propertyId: webhookTestForm.propertyId,
        bookingNumber: `${webhookTestForm.channel.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-6)}`,
        roomNumber: webhookTestForm.roomNumber,
        guestName: webhookTestForm.guestName,
        guestPhone: webhookTestForm.guestPhone,
        checkInDate: webhookTestForm.checkInDate,
        checkOutDate: webhookTestForm.checkOutDate,
        totalAmount: webhookTestForm.totalAmount,
        telegramConfig: telegramConfig,
      };

      const res = await fetch("/api/webhooks/ota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setWebhookResponse(data);

      if (data.success) {
        // Trigger simulated PMS booking to keep UI synchronized
        simulateIncomingOTABooking(webhookTestForm.channel.toLowerCase().includes("agoda") ? "agoda" : "booking_com");
      }
    } catch (err: any) {
      setWebhookResponse({ success: false, error: err.message });
    } finally {
      setWebhookRunning(false);
    }
  };

  const handleExportLogsExcel = () => {
    const headers = [
      "เวลา (Timestamp)",
      "แพลตฟอร์ม (Channel)",
      "ประเภทเหตุการณ์ (Type)",
      "สถานะ (Status)",
      "เลขห้อง (Room)",
      "เลขที่การจอง (Booking No)",
      "รายละเอียด (Details)",
    ];
    const rows = otaSyncLogs.map((l) => [
      l.timestamp,
      l.channel,
      l.type,
      l.status,
      l.roomNumber || "-",
      l.bookingNumber || "-",
      l.details,
    ]);
    exportToCSV(`channel_manager_allocation_logs_${new Date().toISOString().split("T")[0]}`, headers, rows);
  };

  const filteredLogs = otaSyncLogs.filter((l) => {
    if (logFilter === "ALL") return true;
    return l.channelId === logFilter || l.channel.toLowerCase().includes(logFilter.toLowerCase());
  });

  const effectiveFilter = isSpecificProperty 
    ? targetPropId 
    : (mappingHotelFilter !== "all" ? mappingHotelFilter : "all");

  const filteredMappings = roomMappings.filter((m) => {
    if (effectiveFilter !== "all" && m.propertyId !== effectiveFilter) return false;
    if (mappingSearch) {
      const q = mappingSearch.toLowerCase();
      return (
        m.roomNumber.toLowerCase().includes(q) ||
        m.roomName.toLowerCase().includes(q) ||
        m.channelRoomId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const liveWebhookEndpoint = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/ota${targetPropId ? `?property=${targetPropId}` : ""}`
    : `/api/webhooks/ota${targetPropId ? `?property=${targetPropId}` : ""}`;

  return (
    <div className="space-y-6">

      {/* Simulation Result Alert Banner */}
      {simulationResult && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl p-5 shadow-lg animate-in slide-in-from-top duration-300 relative">
          <button 
            onClick={() => setSimulationResult(null)} 
            className="absolute top-4 right-4 text-emerald-600 dark:text-emerald-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                  2-Way Auto Allocation สำเร็จ
                </span>
                <span className="text-xs text-stone-500 font-mono">#{simulationResult.bookingNumber}</span>
              </div>
              <h4 className="font-serif font-black text-base text-stone-900 dark:text-white">
                ดึงข้อมูลการจองจาก <span className="text-emerald-600 dark:text-emerald-400">{simulationResult.source}</span> เข้าสู่ระบบ PMS เรียบร้อย
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300">
                ผู้เข้าพัก: <span className="font-bold text-stone-900 dark:text-white">{simulationResult.guestName}</span> | ห้องพัก: <span className="font-bold text-amber-600 dark:text-amber-400">{simulationResult.roomNumber}</span> ({simulationResult.dates})
              </p>
              {simulationResult.blockedChannels.length > 0 ? (
                <div className="pt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>ระบบส่งคำสั่งตัดสต็อกและปิดการจองห้อง {simulationResult.roomNumber} บน <u>{simulationResult.blockedChannels.join(", ")}</u> ทันทีอัตโนมัติ เพื่อป้องกัน Overbooking</span>
                </div>
              ) : (
                <div className="pt-1 text-xs text-stone-500">
                  (ไม่มีแพลตฟอร์มอื่นที่เชื่อมต่ออยู่ ระบบบันทึกเข้า PMS เรียบร้อย)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Property Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0c1533] p-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setActivePropertyId("bugaan");
              setMappingHotelFilter("bugaan");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              targetPropId === "bugaan"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
                : "bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-700"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Bu-Gaan Sukhothai Village (27 ห้อง)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
              targetPropId === "bugaan" ? "bg-amber-700 text-amber-100" : "bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300"
            }`}>
              RATE-BG-BAR-BB
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePropertyId("thanawong");
              setMappingHotelFilter("thanawong");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              targetPropId === "thanawong"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                : "bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-700"
            }`}
          >
            <Palmtree className="w-4 h-4" />
            <span>ธนวงศ์ พูลวิลล่า (10 หลัง)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
              targetPropId === "thanawong" ? "bg-emerald-700 text-emerald-100" : "bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300"
            }`}>
              RATE-TW-VILLA-PKG
            </span>
          </button>
        </div>

        <div className="text-xs text-stone-500 font-medium px-2">
          เลือกสลับสาขาโรงแรมเพื่อตั้งค่า OTA และผังจับคู่ห้องพักแยกอิสระ
        </div>
      </div>

      {/* Control Center & Status Header */}
      <div className="bg-gradient-to-r from-[#0d1733] to-[#182a5c] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-amber-300/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold tracking-wider text-amber-300 uppercase">
                {isSpecificProperty ? `${hotelName} - 2-Way OTA Webhook Engine` : "Centralized Channel Manager & 2-Way OTA Webhook Engine"}
              </span>
            </div>
            <h2 className="font-serif font-black text-2xl sm:text-3xl text-white">
              {isSpecificProperty ? `ระบบจัดการ OTA & เชื่อมต่อช่องทาง - ${hotelName}` : "ระบบจัดการ OTA & เชื่อมต่อทุกแพลตฟอร์มแบบมืออาชีพ"}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              {isSpecificProperty 
                ? `เชื่อมต่อ Booking.com, Agoda, Expedia, Airbnb, Trip.com ผ่าน 2-Way Webhook API สำหรับ ${hotelName} (${propRooms.length} ${roomUnit}) พร้อมผังจับคู่ห้องพักและส่งแจ้งเตือน Telegram`
                : "เชื่อมต่อ Booking.com, Agoda, Expedia, Airbnb, Trip.com ผ่าน 2-Way Webhook API พร้อมระบบ Room Mapping จัดสรรห้องพัก 37 ห้อง และแจ้งเตือนรายงานเข้า Telegram Bot แยกหัวโรงแรมชัดเจน"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/30 transition-all cursor-pointer min-h-[44px]"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "กำลังซิงค์ข้อมูล..." : "ซิงค์สต็อกทันที (Sync Now)"}</span>
            </button>

            <button
              onClick={() => handleSimulate("booking_com")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer min-h-[44px]"
              title="จำลองรับการจองผ่าน Booking.com และทดสอบตัดสต็อกแพลตฟอร์มอื่นพร้อมแจ้งเตือน Telegram"
            >
              <Play className="w-4 h-4" />
              <span>จำลองจอง Booking.com</span>
            </button>

            <button
              onClick={() => handleSimulate("agoda")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer min-h-[44px]"
              title="จำลองรับการจองผ่าน Agoda และทดสอบตัดสต็อกแพลตฟอร์มอื่นพร้อมแจ้งเตือน Telegram"
            >
              <Play className="w-4 h-4" />
              <span>จำลองจอง Agoda</span>
            </button>

            {targetPropId === "thanawong" && (
              <button
                onClick={() => handleSimulate("airbnb")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-600/30 transition-all cursor-pointer min-h-[44px]"
                title="จำลองรับการจองผ่าน Airbnb พูลวิลล่า และทดสอบตัดสต็อกแพลตฟอร์มอื่น"
              >
                <Play className="w-4 h-4" />
                <span>จำลองจอง Airbnb</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
          <div>
            <span className="text-stone-400 block">2-Way Channel Engine</span>
            <span className="text-emerald-400 font-bold text-sm sm:text-base flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-4 h-4" /> Webhook ใช้งานได้จริง
            </span>
          </div>
          <div>
            <span className="text-stone-400 block">ผูกห้องพักในระบบ ({targetPropId === "thanawong" ? "ธนวงศ์" : "บูกาน"})</span>
            <span className="text-white font-bold text-sm sm:text-base mt-0.5 block">
              {isSpecificProperty ? `${propRooms.length} ${roomUnit} (${hotelName})` : "37 ห้องพัก (บูกาน 27 + ธนวงศ์ 10)"}
            </span>
          </div>
          <div>
            <span className="text-stone-400 block">สถานะ Telegram Bot</span>
            <span className={`${telegramConfig.isEnabled && telegramConfig.botToken ? "text-emerald-400" : "text-amber-300"} font-bold text-sm sm:text-base mt-0.5 block`}>
              {telegramConfig.isEnabled && telegramConfig.botToken ? "เปิดใช้งานพร้อมส่งรายงาน" : "ยังไม่ได้ตั้งค่า Token"}
            </span>
          </div>
          <div>
            <span className="text-stone-400 block">แพลตฟอร์มเชื่อมต่อ</span>
            <span className="text-white font-bold text-sm sm:text-base mt-0.5 block">
              {connectedChannelsCount} จาก {otaChannels.length} แพลตฟอร์ม
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab("channels")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === "channels"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
              : "bg-white dark:bg-[#101c42] text-stone-700 dark:text-stone-300 hover:bg-stone-100 border border-stone-200 dark:border-stone-800"
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>แพลตฟอร์ม OTA & สถานะเชื่อมต่อ</span>
        </button>

        <button
          onClick={() => setActiveSubTab("pricing")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === "pricing"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
              : "bg-white dark:bg-[#101c42] text-stone-700 dark:text-stone-300 hover:bg-stone-100 border border-stone-200 dark:border-stone-800"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>ปรับราคาอัตโนมัติ & เทศกาล (Dynamic Pricing)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("mapping")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === "mapping"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
              : "bg-white dark:bg-[#101c42] text-stone-700 dark:text-stone-300 hover:bg-stone-100 border border-stone-200 dark:border-stone-800"
          }`}
        >
          <Table className="w-4 h-4" />
          <span>ผังจับคู่ห้องพัก (Room Mapping {isSpecificProperty ? `${propRooms.length} ${roomUnit}` : "37 ห้อง"})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("telegram")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === "telegram"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
              : "bg-white dark:bg-[#101c42] text-stone-700 dark:text-stone-300 hover:bg-stone-100 border border-stone-200 dark:border-stone-800"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>ตั้งค่า Telegram Bot แจ้งเตือน</span>
        </button>

        <button
          onClick={() => setActiveSubTab("webhook")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === "webhook"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
              : "bg-white dark:bg-[#101c42] text-stone-700 dark:text-stone-300 hover:bg-stone-100 border border-stone-200 dark:border-stone-800"
          }`}
        >
          <Webhook className="w-4 h-4" />
          <span>Live Webhook Console & ทดสอบสด</span>
        </button>

        <button
          onClick={() => setActiveSubTab("logs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === "logs"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
              : "bg-white dark:bg-[#101c42] text-stone-700 dark:text-stone-300 hover:bg-stone-100 border border-stone-200 dark:border-stone-800"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>ประวัติการจัดสรรสต็อก (Logs)</span>
        </button>
      </div>

      {/* SUBTAB 1: OTA Channels Grid */}
      {activeSubTab === "channels" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-600" />
              <span>{isSpecificProperty ? `ช่องทาง OTA ของ ${hotelName}` : "ช่องทาง OTA ที่รองรับการเชื่อมต่อ 2-Way API"}</span>
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              (Booking.com, Agoda, Expedia, Airbnb, Trip.com)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {otaChannels.map((channel) => {
              const isConnected = channel.status === "connected";

              return (
                <div
                  key={channel.id}
                  className={`rounded-3xl p-6 border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isConnected
                      ? "bg-white dark:bg-[#101c42] border-emerald-500/40 shadow-md shadow-emerald-500/5"
                      : "bg-white/80 dark:bg-[#0c1533]/80 border-stone-200 dark:border-stone-800 shadow-xs"
                  }`}
                >
                  <div>
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <OtaLogo channel={channel.id} className="w-12 h-12" />
                        <div>
                          <h4 className="font-bold text-base text-stone-900 dark:text-white">
                            {channel.name}
                          </h4>
                          <span className="text-[11px] text-stone-500 block">
                            {channel.codeName}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                          isConnected
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-stone-400"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isConnected ? "bg-emerald-500 animate-pulse" : "bg-stone-400"
                          }`}
                        />
                        <span>{isConnected ? "เชื่อมต่อสด" : "ไม่ได้เชื่อมต่อ"}</span>
                      </span>
                    </div>

                    {/* Metadata & Channel Info */}
                    <div className="space-y-2.5 text-xs text-stone-600 dark:text-stone-300 py-3 border-y border-stone-100 dark:border-stone-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Hotel Property ID:</span>
                        <span className="font-mono font-bold text-stone-900 dark:text-white">
                          {channel.hotelId || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Rate Plan ที่ผูก:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {channel.activeRatePlan || "Standard Best Available"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">ห้องพักที่แมปไว้:</span>
                        <span className="font-semibold text-stone-900 dark:text-white">
                          {isConnected 
                            ? `${propMappings.length} ${roomUnit} (Mapped ครบ)`
                            : `0 ${roomUnit}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">การซิงค์ล่าสุด:</span>
                        <span className="text-stone-500">
                          {channel.lastSyncTime ? `${channel.lastSyncTime} น.` : "ยังไม่มีข้อมูล"}
                        </span>
                      </div>
                    </div>

                    {/* Webhook URL Endpoint Box */}
                    <div className="mt-3 p-2.5 rounded-xl bg-stone-50 dark:bg-[#0c1533] border border-stone-200 dark:border-stone-800">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-stone-500 flex items-center gap-1">
                          <Link2 className="w-3 h-3 text-amber-600" />
                          <span>Webhook Endpoint URL</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(liveWebhookEndpoint)}
                          className="text-amber-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          {copiedUrl === liveWebhookEndpoint ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>คัดลอก</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-[10px] text-stone-600 dark:text-stone-400 truncate bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-stone-200/60 dark:border-stone-800 select-all">
                        {liveWebhookEndpoint}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenConnect(channel)}
                          className="flex-1 py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 hover:bg-stone-100 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>ตั้งค่า API</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => disconnectOTAChannel(channel.id, targetPropId)}
                          className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors cursor-pointer"
                          title="ตัดการเชื่อมต่อชั่วคราว"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenConnect(channel)}
                        className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>เปิดใช้งาน 2-Way Sync</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB PRICING: Dynamic Pricing & Seasonal Rates */}
      {activeSubTab === "pricing" && (
        <DynamicPricingManager
          targetPropId={targetPropId}
          isSpecificProperty={isSpecificProperty}
          hotelName={hotelName}
        />
      )}

      {/* SUBTAB 2: Universal Room Mapping Matrix */}
      {activeSubTab === "mapping" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#101c42] p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white flex items-center gap-2">
                  <Table className="w-5 h-5 text-amber-600" />
                  <span>
                    {isSpecificProperty 
                      ? `ผังจับคู่ห้องพัก ${hotelName} (Universal Room Mapping Matrix)`
                      : "ผังจับคู่ห้องพักทุกแพลตฟอร์ม (Universal Room Mapping Matrix)"}
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  {isSpecificProperty
                    ? `ระบบเชื่อมต่อรหัสห้องพัก (Channel Room ID) และ Rate Plan ของ ${hotelName} (${propRooms.length} ${roomUnit}) ให้ตรงกันทุกแพลตฟอร์ม`
                    : "ระบบเชื่อมต่อรหัสห้องพัก (Channel Room ID) และ Rate Plan ของทั้ง 2 โรงแรมให้ตรงกันทุกแพลตฟอร์ม"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => autoMapAllRooms(mappingHotelFilter === "all" ? undefined : mappingHotelFilter)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {mappingHotelFilter === "thanawong"
                      ? "แมปห้องพักอัตโนมัติ (ธนวงศ์ 10 หลัง)"
                      : mappingHotelFilter === "bugaan"
                      ? "แมปห้องพักอัตโนมัติ (Bu-Gaan 27 ห้อง)"
                      : "แมปห้องพักอัตโนมัติทั้งหมด (37 ห้อง)"}
                  </span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
              {isSpecificProperty ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-xs font-bold text-stone-800 dark:text-stone-200">
                  {targetPropId === "thanawong" ? (
                    <>
                      <Palmtree className="w-4 h-4 text-emerald-500" />
                      <span>ธนวงศ์ พูลวิลล่า ({propRooms.length} วิลล่า)</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 text-amber-500" />
                      <span>Bu-Gaan Sukhothai Village ({propRooms.length} ห้อง)</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMappingHotelFilter("all")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      mappingHotelFilter === "all" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs" : "text-stone-600 dark:text-stone-300"
                    }`}
                  >
                    ภาพรวม 37 ห้อง
                  </button>
                  <button
                    type="button"
                    onClick={() => setMappingHotelFilter("bugaan")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      mappingHotelFilter === "bugaan" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs" : "text-stone-600 dark:text-stone-300"
                    }`}
                  >
                    <Building2 className="w-3 h-3 text-amber-500" />
                    <span>Bu-Gaan (27 ห้อง)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMappingHotelFilter("thanawong")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      mappingHotelFilter === "thanawong" ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-xs" : "text-stone-600 dark:text-stone-300"
                    }`}
                  >
                    <Palmtree className="w-3 h-3 text-emerald-500" />
                    <span>ธนวงศ์ (10 หลัง)</span>
                  </button>
                </div>
              )}

              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ค้นหาเลขห้อง หรือชื่อห้อง..."
                  value={mappingSearch}
                  onChange={(e) => setMappingSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs text-stone-900 dark:text-white"
                />
              </div>
            </div>

            {/* Room Mapping Matrix Table */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-slate-800/80 text-stone-500 font-semibold border-b border-stone-200 dark:border-stone-800">
                    <tr>
                      <th className="p-3 whitespace-nowrap">เลขห้อง</th>
                      <th className="p-3 whitespace-nowrap">โรงแรม</th>
                      <th className="p-3">ชื่อห้องพักในระบบ PMS</th>
                      <th className="p-3 whitespace-nowrap">Booking.com Room ID</th>
                      <th className="p-3 whitespace-nowrap">Agoda / Expedia Code</th>
                      <th className="p-3 whitespace-nowrap">Rate Plan</th>
                      <th className="p-3 text-center whitespace-nowrap">2-Way Sync</th>
                      <th className="p-3 text-right whitespace-nowrap">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono text-[11px]">
                    {filteredMappings.map((m) => {
                      const isBuGaan = m.propertyId === "bugaan";
                      return (
                        <tr key={m.roomId} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 whitespace-nowrap font-bold text-amber-600 dark:text-amber-400 font-sans">
                            ห้อง {m.roomNumber}
                          </td>
                          <td className="p-3 whitespace-nowrap font-sans">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${
                              isBuGaan 
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}>
                              {isBuGaan ? (
                                <>
                                  <Building2 className="w-3 h-3" />
                                  <span>Bu-Gaan</span>
                                </>
                              ) : (
                                <>
                                  <Palmtree className="w-3 h-3" />
                                  <span>ธนวงศ์</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-3 font-sans text-stone-800 dark:text-stone-200">
                            {m.roomName}
                          </td>
                          <td className="p-3 text-blue-600 dark:text-blue-400 font-semibold">
                            {m.channelRoomId}
                          </td>
                          <td className="p-3 text-rose-600 dark:text-rose-400 font-semibold">
                            {m.channelRoomId.replace("BK-", "AG-")}
                          </td>
                          <td className="p-3 text-stone-500 font-sans">
                            {m.ratePlanId}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Active</span>
                            </span>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setEditingMapping(m)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                              title="แก้ไขรหัสแมปห้อง"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Telegram Bot Integration */}
      {activeSubTab === "telegram" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Settings Form (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#101c42] p-6 sm:p-7 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/30 shrink-0">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white">
                  ตั้งค่าระบบแจ้งเตือนผ่าน Telegram Bot
                </h3>
                <p className="text-xs text-stone-500">
                  ส่งรายงานบุ๊กกิ้งแยกหัวโรงแรมชัดเจน (Bu-Gaan vs Thanawong) เข้ากลุ่มแอดมินหรือพนักงานทันที
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveTelegramConfig} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">
                  1. Telegram Bot Token (จาก @BotFather) *
                </label>
                <input
                  type="text"
                  placeholder="เช่น 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz..."
                  value={tgForm.botToken}
                  onChange={(e) => setTgForm({ ...tgForm, botToken: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 font-mono text-stone-900 dark:text-white text-xs"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  วิธีสร้าง: เปิด Telegram ค้นหา @BotFather แล้วพิมพ์ /newbot เพื่อรับ HTTP API Token
                </span>
              </div>

              <div>
                <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">
                  2. Telegram Chat ID หรือ Group ID *
                </label>
                <input
                  type="text"
                  placeholder="เช่น -100192837465 หรือ 987654321"
                  value={tgForm.chatId}
                  onChange={(e) => setTgForm({ ...tgForm, chatId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 font-mono text-stone-900 dark:text-white text-xs"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  ดึง Chat ID ได้ง่ายๆ โดยเพิ่ม @userinfobot เข้ากลุ่ม หรือส่งข้อความหาบอท
                </span>
              </div>

              {/* Notification Triggers */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                <span className="font-bold text-stone-900 dark:text-white block">
                  ตัวเลือกการแจ้งเตือนอัตโนมัติ (Automated Notification Events)
                </span>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tgForm.isEnabled}
                    onChange={(e) => setTgForm({ ...tgForm, isEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    เปิดใช้งานระบบ Telegram Bot Dispatcher
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tgForm.notifyOnNewBooking}
                    onChange={(e) => setTgForm({ ...tgForm, notifyOnNewBooking: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-stone-700 dark:text-stone-300">
                    แจ้งเตือนเมื่อมีบุ๊กกิ้งใหม่ (OTA Webhooks, Walk-in, Direct Booking)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tgForm.notifyOnCheckIn}
                    onChange={(e) => setTgForm({ ...tgForm, notifyOnCheckIn: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-stone-700 dark:text-stone-300">
                    แจ้งเตือนเมื่อมีแขกเช็คอินเข้าห้องพัก (Check-in Arrival)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tgForm.notifyOnOTABlock}
                    onChange={(e) => setTgForm({ ...tgForm, notifyOnOTABlock: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-stone-700 dark:text-stone-300">
                    แจ้งเตือนรายงานการตัดสต็อกห้องพักข้ามแพลตฟอร์ม (2-Way Cross-Channel Block)
                  </span>
                </label>
              </div>

              {tgTestMessage && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-200">
                  {tgTestMessage}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingTg}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingTg ? "กำลังบันทึก..." : "บันทึกการตั้งค่าบอท"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={isTestingTg || !tgForm.botToken || !tgForm.chatId}
                  className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${isTestingTg ? "animate-spin" : ""}`} />
                  <span>{isTestingTg ? "กำลังส่ง..." : "ทดสอบส่งบอทเดี๋ยวนี้"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Telegram Preview Box (5 cols) */}
          <div className="lg:col-span-5 bg-[#0f172a] text-white p-6 rounded-3xl border border-slate-700 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">ตัวอย่างข้อความ Telegram</h4>
                  <span className="text-[10px] text-slate-400">หัวข้อโรงแรมระบุอัตโนมัติ 100%</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">HTML FORMAT</span>
            </div>

            {/* Bu-Gaan Sample Card */}
            <div className="p-3.5 rounded-2xl bg-[#1e293b] border border-slate-700 text-xs space-y-1.5">
              <div className="font-bold text-amber-400 flex items-center gap-1">
                <span>[แจ้งเตือนบุ๊กกิ้งใหม่] Bu-Gaan Sukhothai Village</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 font-sans">
                <p><b>ช่องทางการจอง:</b> Booking.com Direct</p>
                <p><b>เลขที่การจอง:</b> <code className="bg-slate-800 px-1 rounded">#BK-202610-8812</code></p>
                <p><b>ห้องพัก:</b> <b>ห้อง Deluxe Pool Villa D1</b></p>
                <p><b>ผู้เข้าพัก:</b> คุณกฤษฎา วัฒนกุล</p>
                <p><b>ระยะเวลา:</b> 14 ต.ค. - 16 ต.ค. (2 คืน)</p>
                <p><b>ยอดรวม:</b> ฿2,580 (ชำระผ่าน OTA เรียบร้อย)</p>
              </div>
              <div className="pt-1.5 text-[10px] text-emerald-400 border-t border-slate-700/60 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>ระบบ 2-Way Channel Manager ส่งคำสั่งตัดสต็อกบน Agoda & Expedia เรียบร้อย</span>
              </div>
            </div>

            {/* Thanawong Sample Card */}
            <div className="p-3.5 rounded-2xl bg-[#1e293b] border border-slate-700 text-xs space-y-1.5">
              <div className="font-bold text-emerald-400 flex items-center gap-1">
                <span>[แจ้งเตือนบุ๊กกิ้งใหม่] Thanawong Pool Villa</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 font-sans">
                <p><b>ช่องทางการจอง:</b> Agoda VIP Express</p>
                <p><b>เลขที่การจอง:</b> <code className="bg-slate-800 px-1 rounded">#AG-202610-4491</code></p>
                <p><b>ห้องพัก:</b> <b>ห้อง Pool Villa VIP-01</b></p>
                <p><b>ผู้เข้าพัก:</b> Jennifer Smith (UK)</p>
                <p><b>ระยะเวลา:</b> 20 ต.ค. - 22 ต.ค. (2 คืน)</p>
                <p><b>ยอดรวม:</b> ฿5,800 (ชำระผ่าน OTA เรียบร้อย)</p>
              </div>
              <div className="pt-1.5 text-[10px] text-emerald-400 border-t border-slate-700/60 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>ระบบ 2-Way Channel Manager ส่งคำสั่งตัดสต็อกบน Booking.com เรียบร้อย</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Live Webhook Console & Test Runner */}
      {activeSubTab === "webhook" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Test Runner Form (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#101c42] p-6 sm:p-7 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                  <Webhook className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base text-stone-900 dark:text-white">
                    ทดสอบส่ง Webhook สด (Live Webhook Test Runner)
                  </h3>
                  <p className="text-xs text-stone-500">
                    ยิง POST Request ตรงไปยัง Webhook Endpoint เพื่อทดสอบ 2-Way Flow จริง
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRunWebhookTest} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    โรงแรม (Hotel Property) *
                  </label>
                  <select
                    value={webhookTestForm.propertyId}
                    onChange={(e) => setWebhookTestForm({ ...webhookTestForm, propertyId: e.target.value as PropertyId })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 font-bold text-stone-900 dark:text-white"
                  >
                    <option value="bugaan">Bu-Gaan Sukhothai Village (27 ห้อง)</option>
                    <option value="thanawong">Thanawong Pool Villa (10 หลัง)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    ช่องทาง OTA ที่ส่งมา (Source Channel) *
                  </label>
                  <select
                    value={webhookTestForm.channel}
                    onChange={(e) => setWebhookTestForm({ ...webhookTestForm, channel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 font-bold text-stone-900 dark:text-white"
                  >
                    <option value="Booking.com">Booking.com</option>
                    <option value="Agoda">Agoda</option>
                    <option value="Expedia Group">Expedia Group</option>
                    <option value="Airbnb">Airbnb</option>
                    <option value="Trip.com">Trip.com</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    เลขห้องพัก *
                  </label>
                  <input
                    type="text"
                    required
                    value={webhookTestForm.roomNumber}
                    onChange={(e) => setWebhookTestForm({ ...webhookTestForm, roomNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 font-bold text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    ชื่อผู้เข้าพัก (Guest Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={webhookTestForm.guestName}
                    onChange={(e) => setWebhookTestForm({ ...webhookTestForm, guestName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    เช็คอิน (Check-in) *
                  </label>
                  <input
                    type="date"
                    required
                    value={webhookTestForm.checkInDate}
                    onChange={(e) => setWebhookTestForm({ ...webhookTestForm, checkInDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    เช็คเอาต์ (Check-out) *
                  </label>
                  <input
                    type="date"
                    required
                    value={webhookTestForm.checkOutDate}
                    onChange={(e) => setWebhookTestForm({ ...webhookTestForm, checkOutDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    ยอดเงินรวม (฿) *
                  </label>
                  <input
                    type="number"
                    required
                    value={webhookTestForm.totalAmount}
                    onChange={(e) => setWebhookTestForm({ ...webhookTestForm, totalAmount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={webhookRunning}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Zap className={`w-4 h-4 ${webhookRunning ? "animate-spin" : ""}`} />
                  <span>{webhookRunning ? "กำลังประมวลผล Webhook..." : "ยิง Webhook สดและส่งสัญญาณตัดสต็อก 2-Way"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Webhook Response Console (5 cols) */}
          <div className="lg:col-span-5 bg-[#0a0f1d] text-white p-6 rounded-3xl border border-stone-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-xs font-bold text-stone-300">Webhook Response Payload</span>
                </div>
                <span className="text-[10px] text-stone-500 font-mono">STATUS 200 OK</span>
              </div>

              {webhookResponse ? (
                <pre className="font-mono text-[11px] text-emerald-400 bg-[#060a14] p-4 rounded-2xl overflow-x-auto border border-emerald-500/20 max-h-96">
                  {JSON.stringify(webhookResponse, null, 2)}
                </pre>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-stone-500">
                  <Webhook className="w-8 h-8 text-stone-600 mb-2" />
                  <span className="text-xs">กดปุ่ม "ยิง Webhook สด" เพื่อดูผลตอบกลับแบบ Real-time</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800 text-[10px] text-stone-400 flex items-center justify-between">
              <span>Endpoint: /api/webhooks/ota</span>
              <span>2-Way Auto Inventory Block Active</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: Allocation Logs Table */}
      {activeSubTab === "logs" && (
        <div className="bg-white dark:bg-[#101c42] p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                  ประวัติการจัดสรรสต็อก & บันทึกการทำงานของระบบ 2-Way (Real-time Audit Logs)
                </h3>
                <p className="text-xs text-stone-500">
                  ประวัติการรับบุ๊กกิ้ง, ส่งคำสั่งปิดห้องพัก (Block Inventory), และส่งแจ้งเตือน Telegram Bot
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <option value="ALL">ทุกแพลตฟอร์ม (All Channels)</option>
                <option value="Booking.com">Booking.com</option>
                <option value="Agoda">Agoda</option>
                <option value="Expedia">Expedia</option>
                <option value="Telegram Bot">Telegram Bot</option>
              </select>

              <button
                onClick={handleExportLogsExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={clearSyncLogs}
                className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                ล้างประวัติ
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-slate-800/80 text-stone-500 font-semibold border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-3 whitespace-nowrap">เวลา</th>
                    <th className="p-3 whitespace-nowrap">แพลตฟอร์ม</th>
                    <th className="p-3 whitespace-nowrap">ประเภทการทำงาน</th>
                    <th className="p-3">รายละเอียดการจัดสรร / ปิดห้องพัก</th>
                    <th className="p-3 text-center whitespace-nowrap">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono text-[11px]">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-stone-400 font-sans">
                        ยังไม่มีประวัติการส่งข้อมูล OTA
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isImport = log.type === "IMPORT_BOOKING";
                      const isClose = log.type === "CLOSE_INVENTORY";
                      const isTelegram = log.type === "TELEGRAM_NOTIFY";

                      return (
                        <tr key={log.id} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 whitespace-nowrap text-stone-500">{log.timestamp}</td>
                          <td className="p-3 whitespace-nowrap font-bold text-stone-900 dark:text-white font-sans">
                            {log.channel}
                          </td>
                          <td className="p-3 whitespace-nowrap font-sans">
                            {isImport ? (
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                                รับการจองใหม่ (Ingest)
                              </span>
                            ) : isClose ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                                ปิดสต็อกห้อง (Auto Block)
                              </span>
                            ) : isTelegram ? (
                              <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 font-bold text-[10px]">
                                รายงาน Telegram
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                                ซิงค์ราคา/เรท
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-stone-700 dark:text-stone-300 font-sans text-xs">
                            {log.details}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                              SUCCESS
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Connect / Edit OTA Modal */}
      {isConnectModalOpen && selectedChannel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#101c42] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <OtaLogo channel={selectedChannel.id} className="w-10 h-10" />
                <div>
                  <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white">
                    ตั้งค่าการเชื่อมต่อ API ({selectedChannel.name})
                  </h3>
                  <span className="text-xs text-stone-500">2-Way Channel Connectivity</span>
                </div>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConnect} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Hotel ID / Property Code (ตามระบบ {selectedChannel.name}) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น BG-BOOKING-88201 หรือ AGODA-55410"
                  value={modalForm.hotelId}
                  onChange={(e) => setModalForm({ ...modalForm, hotelId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 font-mono text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  บัญชีผู้ใช้งาน / Username หรือ Partner Email *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น hotel_partner_admin"
                  value={modalForm.username}
                  onChange={(e) => setModalForm({ ...modalForm, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  API Key / Channel Manager Secret Token *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••••••••••••"
                  value={modalForm.apiKey}
                  onChange={(e) => setModalForm({ ...modalForm, apiKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 font-mono text-stone-900 dark:text-white"
                />
              </div>

              {/* Webhook Endpoint copy */}
              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Webhook Ingestion URL (นำลิงก์นี้ไปวางในระบบหลังบ้านของ {selectedChannel.name})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={liveWebhookEndpoint}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-slate-900/80 font-mono text-[11px] text-stone-500 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(liveWebhookEndpoint)}
                    className="px-3 py-2 rounded-xl bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-stone-200 font-semibold hover:bg-stone-300 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedUrl === liveWebhookEndpoint ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอก</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-stone-700 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalForm.autoCloseInventory}
                    onChange={(e) => setModalForm({ ...modalForm, autoCloseInventory: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-stone-900 dark:text-white block">
                      เปิดระบบ 2-Way ปิดสต็อกห้องพักข้ามแพลตฟอร์มอัตโนมัติ (แนะนำ)
                    </span>
                    <span className="text-stone-500 block text-[11px]">
                      หากมีบุ๊กกิ้งเข้ามาจากช่องทางนี้ ระบบจะส่งคำสั่งตัดสต็อกบน OTA อื่นทันที
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-stone-200 dark:border-stone-700/60">
                  <input
                    type="checkbox"
                    checked={modalForm.autoImportBookings}
                    onChange={(e) => setModalForm({ ...modalForm, autoImportBookings: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-stone-900 dark:text-white block">
                      ดึงบุ๊กกิ้งเข้ามาสร้าง Folio ใน PMS อัตโนมัติ (Instant Import)
                    </span>
                    <span className="text-stone-500 block text-[11px]">
                      บันทึกชื่อแขก ยอดชำระ และผูกห้องพักลงในตารางผังห้องทันทีโดยไม่ต้องกรอกซ้ำ
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันและเชื่อมต่อ API</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Mapping Modal */}
      {editingMapping && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#101c42] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-base text-stone-900 dark:text-white">
                แก้ไขรหัสเชื่อมโยงห้องพัก: ห้อง {editingMapping.roomNumber}
              </h3>
              <button onClick={() => setEditingMapping(null)} className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                  Channel Room ID (เช่น BK-BG-D1, AG-TW-VIP1)
                </label>
                <input
                  type="text"
                  value={editingMapping.channelRoomId}
                  onChange={(e) => setEditingMapping({ ...editingMapping, channelRoomId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 font-mono text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                  Rate Plan ID
                </label>
                <input
                  type="text"
                  value={editingMapping.ratePlanId}
                  onChange={(e) => setEditingMapping({ ...editingMapping, ratePlanId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 font-mono text-stone-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMapping(null)}
                  className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateRoomMapping(editingMapping);
                    setEditingMapping(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                >
                  บันทึกการแมป
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
