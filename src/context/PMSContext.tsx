"use client";

import React, { createContext, useContext, useState, useEffect, useSyncExternalStore } from "react";
import { 
  Property, 
  Room, 
  Booking, 
  MenuItem, 
  RoomOrder, 
  PropertyId, 
  RoomStatus, 
  StaffUser, 
  PMSBackupData, 
  DatabaseConfig,
  OTAChannelConfig,
  OTASyncLog,
  OTAChannelId,
  OTARoomMapping,
  TelegramConfig,
  NotificationItem,
  RoomBlockRule,
  DynamicPricingRule,
  UserSession,
  canUserAccessProperty,
  BookingStatus,
  PropertyPromptPayConfig
} from "@/types/pms";
import { DEFAULT_PROMPTPAY_CONFIGS } from "@/lib/promptpay";
import { 
  getActiveSession, 
  createSession, 
  destroySession, 
  updateSessionActivity,
  updateSessionUser 
} from "@/lib/session";
import { 
  initialProperties, 
  initialRooms, 
  initialBookings, 
  initialMenuItems, 
  initialOrders, 
  initialStaffUsers,
  initialOTAChannels,
  initialOTAChannelsByProperty,
  initialOTALogs,
  initialTelegramConfig,
  initialNotifications,
  initialDynamicPricingRules
} from "@/lib/mockData";

function subscribeToUser(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getUserSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hotel_pms_user");
}

function getUserServerSnapshot(): string | null {
  return null;
}

interface PMSContextType {
  activePropertyId: PropertyId | "all";
  setActivePropertyId: (id: PropertyId | "all") => void;
  properties: Property[];
  rooms: Room[];
  bookings: Booking[];
  menuItems: MenuItem[];
  orders: RoomOrder[];
  isDarkMode: boolean;
  isMounted: boolean;
  toggleDarkMode: () => void;
  
  // Auth, Staff & Session Management
  currentSession: UserSession | null;
  currentUser: StaffUser | null;
  staffUsers: StaffUser[];
  login: (username: string, pass: string, rememberMe?: boolean) => boolean;
  logout: () => void;
  addStaffUser: (user: Omit<StaffUser, "id">) => void;
  updateStaffUser: (id: string, updated: Partial<StaffUser>) => void;
  deleteStaffUser: (id: string) => void;

  // Database Installation & Online Multi-Device Sync
  isDatabaseInstalled: boolean;
  databaseConfig: DatabaseConfig | null;
  installDatabase: (config: DatabaseConfig) => Promise<{ success: boolean; message: string }>;
  resetDatabaseInstallation: () => void;
  syncStatus: "connected" | "disconnected" | "syncing" | "local";
  lastSyncTime: string | null;

  // OTA Channel Manager & 2-Way Sync
  otaChannels: OTAChannelConfig[];
  otaChannelsByProperty: Record<PropertyId, OTAChannelConfig[]>;
  otaSyncLogs: OTASyncLog[];
  roomMappings: OTARoomMapping[];
  connectOTAChannel: (channelId: OTAChannelId, config: Partial<OTAChannelConfig>, targetPropertyId?: PropertyId) => Promise<boolean>;
  disconnectOTAChannel: (channelId: OTAChannelId, targetPropertyId?: PropertyId) => void;
  syncAllOTAChannels: (targetPropertyId?: PropertyId) => Promise<void>;
  simulateIncomingOTABooking: (channelId: OTAChannelId, targetPropertyId?: PropertyId) => { success: boolean; booking?: Booking; blockedChannels: string[] };
  toggleChannelAutoClose: (channelId: OTAChannelId, enabled: boolean, targetPropertyId?: PropertyId) => void;
  clearSyncLogs: () => void;
  updateRoomMapping: (mapping: OTARoomMapping) => void;
  autoMapAllRooms: (targetPropertyId?: PropertyId | "all") => void;

  // Telegram Bot & Notification Center
  telegramConfig: TelegramConfig;
  notifications: NotificationItem[];
  updateTelegramConfig: (config: Partial<TelegramConfig>) => void;
  testTelegramNotification: () => Promise<{ success: boolean; message: string }>;
  sendTelegramNotification: (hotelTitle: string, booking: Booking, eventType?: string) => Promise<boolean>;
  addNotification: (notif: Omit<NotificationItem, "id" | "timestamp" | "isRead" | "telegramSent">) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  
  // Room Availability & Stop Sell / Block Rules
  roomBlocks: RoomBlockRule[];
  toggleDateBlock: (propertyId: PropertyId, date: string, isClosed: boolean) => void;
  toggleRoomTypeBlock: (propertyId: PropertyId, date: string, roomType: string, isClosed: boolean) => void;
  setRoomTypeAvailableCount: (propertyId: PropertyId, date: string, roomType: string, count: number) => void;

  // Dynamic Pricing & Seasonal Rules
  dynamicPricingRules: DynamicPricingRule[];
  addDynamicPricingRule: (rule: Omit<DynamicPricingRule, "id" | "updatedAt">) => void;
  updateDynamicPricingRule: (id: string, updated: Partial<DynamicPricingRule>) => void;
  deleteDynamicPricingRule: (id: string) => void;
  toggleDynamicPricingRule: (id: string, isActive: boolean) => void;
  calculateDynamicRate: (baseRate: number, date: string, propertyId: PropertyId, roomType?: string) => { finalRate: number; appliedRules: DynamicPricingRule[]; breakdown: { ruleName: string; amount: number }[] };
  syncDynamicRatesToChannels: (targetPropertyId?: PropertyId | "all") => Promise<{ success: boolean; updatedChannels: number; logsCount: number }>;

  // Actions
  addBooking: (booking: Omit<Booking, "id" | "bookingNumber" | "createdAt" | "balanceDue">) => void;
  addMultipleBookings: (bookings: Array<Omit<Booking, "id" | "bookingNumber" | "createdAt" | "balanceDue">>) => void;
  updateBooking: (bookingId: string, updated: Partial<Booking>) => void;
  updateGroupColorTag: (groupBookingIdOrCompany: string, colorTag: string, companyName?: string) => void;
  cancelBooking: (bookingId: string, options?: { reason?: string; cancellationFee?: number; waiveFee?: boolean }) => void;
  cancelMultipleBookings: (bookingIds: string[], options?: { reason?: string; cancellationFee?: number; waiveFee?: boolean }) => void;
  deleteBooking: (bookingId: string) => void;
  updateRoomStatus: (roomId: string, status: RoomStatus) => void;
  addRoom: (room: Omit<Room, "id">) => void;
  updateRoom: (roomId: string, updated: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;
  addOrder: (order: Omit<RoomOrder, "id" | "orderNumber" | "createdAt">) => RoomOrder;
  deleteOrder: (orderId: string) => void;
  transferOrderToRoom: (orderId: string, targetRoomId: string) => void;
  checkInBooking: (bookingId: string, checkInData?: { guestIdCardImage?: string; guestSignatureImage?: string }) => void;
  checkOutBooking: (bookingId: string) => void;
  settleBookingAndCheckOut: (bookingId: string, paymentMethod?: "CASH" | "PROMPTPAY_QR" | "CREDIT_CARD", slipImage?: string) => void;
  quickWalkIn: (roomId: string, guestName: string, guestPhone: string, nights: number, docs?: { guestIdCardImage?: string; guestSignatureImage?: string }) => void;
  requireCheckInDocuments: boolean;
  setRequireCheckInDocuments: (enabled: boolean) => void;
  
  // Menu Management
  addMenuItem: (item: Omit<MenuItem, "id">) => void;
  updateMenuItem: (itemId: string, updated: Partial<MenuItem>) => void;
  deleteMenuItem: (itemId: string) => void;

  // Custom Charges
  addCustomChargeToBooking: (bookingId: string, title: string, amount: number) => void;

  // PromptPay QR & Branch Payment Settings
  promptPayConfigs: Record<PropertyId, PropertyPromptPayConfig>;
  updatePromptPayConfig: (propertyId: PropertyId, config: Partial<PropertyPromptPayConfig>) => void;
  getPromptPayConfig: (propertyId?: PropertyId | "all") => PropertyPromptPayConfig;

  // Database Backup, Restore, and Reset
  backupDatabase: () => PMSBackupData;
  restoreDatabase: (data: PMSBackupData) => { success: boolean; message: string };
  resetDatabase: () => void;

  filteredRooms: Room[];
  filteredBookings: Booking[];
  filteredOrders: RoomOrder[];
}

const PMSContext = createContext<PMSContextType | undefined>(undefined);

export function PMSProvider({ children }: { children: React.ReactNode }) {
  const [activePropertyId, setActivePropertyId] = useState<PropertyId | "all">(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const propParam = params.get("property");
        if (propParam === "bugaan" || propParam === "thanawong" || propParam === "all") {
          return propParam as PropertyId | "all";
        }
        const saved = localStorage.getItem("hotel_pms_property");
        if (saved === "bugaan" || saved === "thanawong" || saved === "all") {
          return saved as PropertyId | "all";
        }
      } catch (e) {
        console.error(e);
      }
    }
    return "bugaan";
  });
  const [properties] = useState<Property[]>(initialProperties);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [orders, setOrders] = useState<RoomOrder[]>(initialOrders);

  // PromptPay QR & Branch Payment State
  const [promptPayConfigs, setPromptPayConfigs] = useState<Record<PropertyId, PropertyPromptPayConfig>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hotel_promptpay_configs");
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            bugaan: { ...DEFAULT_PROMPTPAY_CONFIGS.bugaan, ...(parsed.bugaan || {}) },
            thanawong: { ...DEFAULT_PROMPTPAY_CONFIGS.thanawong, ...(parsed.thanawong || {}) },
          };
        }
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_PROMPTPAY_CONFIGS;
  });

  const updatePromptPayConfig = (propertyId: PropertyId, config: Partial<PropertyPromptPayConfig>) => {
    setPromptPayConfigs((prev) => {
      const updated = {
        ...prev,
        [propertyId]: {
          ...prev[propertyId],
          ...config,
        },
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("hotel_promptpay_configs", JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
  };

  const getPromptPayConfig = (propId?: PropertyId | "all"): PropertyPromptPayConfig => {
    if (propId && propId !== "all" && promptPayConfigs[propId]) {
      return promptPayConfigs[propId];
    }
    if (activePropertyId !== "all" && promptPayConfigs[activePropertyId]) {
      return promptPayConfigs[activePropertyId];
    }
    return promptPayConfigs.bugaan || DEFAULT_PROMPTPAY_CONFIGS.bugaan;
  };

  // Online Database & Sync State
  const [databaseConfig, setDatabaseConfig] = useState<DatabaseConfig | null>(null);
  const [isDatabaseInstalled, setIsDatabaseInstalled] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<"connected" | "disconnected" | "syncing" | "local">("local");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // OTA Channel Manager & 2-Way Sync State (Isolated per property)
  const [otaChannelsByProperty, setOtaChannelsByProperty] = useState<Record<PropertyId, OTAChannelConfig[]>>(initialOTAChannelsByProperty);
  const [otaSyncLogs, setOtaSyncLogs] = useState<OTASyncLog[]>(initialOTALogs);

  // Initial room mapping generator with property-specific rate plans & channel room IDs
  const generateInitialRoomMappings = (allRooms: Room[]): OTARoomMapping[] => {
    return allRooms.map((r) => {
      const isBG = r.propertyId === "bugaan";
      const cleanNum = r.roomNumber.replace(/[^a-zA-Z0-9]/g, "");
      return {
        roomId: r.id,
        roomNumber: r.roomNumber,
        roomName: r.name,
        propertyId: r.propertyId,
        channelRoomId: `${isBG ? "BK-BG" : "BK-TW"}-${cleanNum}`,
        channelRoomName: r.name,
        ratePlanId: isBG ? "RATE-BG-BAR-BB" : "RATE-TW-VILLA-PKG",
        isSynced: true,
      };
    });
  };

  const [roomMappings, setRoomMappings] = useState<OTARoomMapping[]>(() => generateInitialRoomMappings(initialRooms));

  const currentOTAProperty: PropertyId = (activePropertyId === "all" ? "bugaan" : activePropertyId) as PropertyId;
  const otaChannels = otaChannelsByProperty[currentOTAProperty] || otaChannelsByProperty.bugaan;

  // Room Blocks & Stop Sell State
  const [roomBlocks, setRoomBlocks] = useState<RoomBlockRule[]>([]);

  // Dynamic Pricing & Seasonal Rules State
  const [dynamicPricingRules, setDynamicPricingRules] = useState<DynamicPricingRule[]>(initialDynamicPricingRules);

  // Telegram Bot & Notification Center State
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(initialTelegramConfig);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  // Staff Users State
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(initialStaffUsers);

  // Check-in Document & PDPA E-Signature Policy State
  const [requireCheckInDocuments, setRequireCheckInDocumentsState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hotel_pms_require_checkin_docs");
      if (saved !== null) return saved === "true";
    }
    return true; // Default to true (safe PDPA compliant check-in policy)
  });

  const setRequireCheckInDocuments = (enabled: boolean) => {
    setRequireCheckInDocumentsState(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem("hotel_pms_require_checkin_docs", enabled ? "true" : "false");
    }
  };

  // Formal User Session State
  const [currentSession, setCurrentSession] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") {
      try {
        return getActiveSession();
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  // Sync session on mount and when storage updates
  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = getActiveSession();
      setCurrentSession(active);
    }
  }, []);

  const syncedUserRaw = useSyncExternalStore(subscribeToUser, getUserSnapshot, getUserServerSnapshot);
  
  // Re-verify session when storage event fires
  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = getActiveSession();
      setCurrentSession(active);
    }
  }, [syncedUserRaw]);

  // Derive currentUser directly from validated active session
  const currentUser: StaffUser | null = React.useMemo(() => {
    if (currentSession && currentSession.user) {
      return currentSession.user;
    }
    return null;
  }, [currentSession]);

  // Sliding session heartbeat (record user activity throttled)
  useEffect(() => {
    if (typeof window === "undefined" || !currentSession) return;
    const handleActivity = () => {
      const now = Date.now();
      const last = new Date(currentSession.lastActiveAt).getTime();
      // Throttle update to once every 2 minutes
      if (now - last > 2 * 60 * 1000) {
        const updated = updateSessionActivity(currentSession);
        setCurrentSession(updated);
      }
    };
    window.addEventListener("click", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [currentSession]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Initialize state with defaults, then hydrate from localStorage once mounted
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const DATA_VERSION_KEY = "hotel_pms_data_version_v15";
        const currentVersion = localStorage.getItem("hotel_pms_data_version");
        if (currentVersion !== DATA_VERSION_KEY) {
          setRooms(initialRooms);
          setBookings(initialBookings);
          setStaffUsers(initialStaffUsers);
          setNotifications(initialNotifications);
          const newMappings = generateInitialRoomMappings(initialRooms);
          setRoomMappings(newMappings);
          setOtaChannelsByProperty(initialOTAChannelsByProperty);
          localStorage.setItem("hotel_pms_db_rooms", JSON.stringify(initialRooms));
          localStorage.setItem("hotel_pms_db_bookings", JSON.stringify(initialBookings));
          localStorage.setItem("hotel_pms_db_staff", JSON.stringify(initialStaffUsers));
          localStorage.setItem("hotel_pms_db_notifications", JSON.stringify(initialNotifications));
          localStorage.setItem("hotel_pms_db_room_mappings", JSON.stringify(newMappings));
          localStorage.setItem("hotel_pms_db_ota_channels_by_prop", JSON.stringify(initialOTAChannelsByProperty));
          localStorage.setItem("hotel_pms_data_version", DATA_VERSION_KEY);

          // Update active session user if currently logged in as admin/GM
          const active = getActiveSession();
          if (active && (active.userId === "usr-01" || active.user.username === "admin")) {
            const updatedUser: StaffUser = {
              ...active.user,
              name: "คุณชนินทร์ ฟื้นตน",
              role: "General Manager",
            };
            const updatedSession = updateSessionUser(updatedUser);
            if (updatedSession) {
              setCurrentSession(updatedSession);
            }
          }
        } else {
          const savedRooms = localStorage.getItem("hotel_pms_db_rooms");
          if (savedRooms) setRooms(JSON.parse(savedRooms));

          const savedBookings = localStorage.getItem("hotel_pms_db_bookings");
          if (savedBookings) setBookings(JSON.parse(savedBookings));

          const savedOtaByProp = localStorage.getItem("hotel_pms_db_ota_channels_by_prop");
          if (savedOtaByProp) {
            setOtaChannelsByProperty(JSON.parse(savedOtaByProp));
          } else {
            setOtaChannelsByProperty(initialOTAChannelsByProperty);
          }
        }

        const savedMenuItems = localStorage.getItem("hotel_pms_db_menu");
        if (savedMenuItems) setMenuItems(JSON.parse(savedMenuItems));

        const savedOrders = localStorage.getItem("hotel_pms_db_orders");
        if (savedOrders) setOrders(JSON.parse(savedOrders));

        const savedOtaLogs = localStorage.getItem("hotel_pms_db_ota_logs");
        if (savedOtaLogs) setOtaSyncLogs(JSON.parse(savedOtaLogs));

        const savedStaffUsers = localStorage.getItem("hotel_pms_db_staff");
        if (savedStaffUsers) setStaffUsers(JSON.parse(savedStaffUsers));

        const savedRoomMappings = localStorage.getItem("hotel_pms_db_room_mappings");
        if (savedRoomMappings) setRoomMappings(JSON.parse(savedRoomMappings));

        const savedRoomBlocks = localStorage.getItem("hotel_pms_db_room_blocks");
        if (savedRoomBlocks) setRoomBlocks(JSON.parse(savedRoomBlocks));

        const savedDynamicPricing = localStorage.getItem("hotel_pms_db_dynamic_pricing");
        if (savedDynamicPricing) setDynamicPricingRules(JSON.parse(savedDynamicPricing));

        const savedTelegram = localStorage.getItem("hotel_pms_db_telegram");
        if (savedTelegram) setTelegramConfig(JSON.parse(savedTelegram));

        const savedNotifications = localStorage.getItem("hotel_pms_db_notifications");
        if (savedNotifications) setNotifications(JSON.parse(savedNotifications));

        const savedDb = localStorage.getItem("hotel_pms_db_config");
        if (savedDb) {
          const parsed = JSON.parse(savedDb);
          setDatabaseConfig(parsed);
          setIsDatabaseInstalled(true);
          setSyncStatus("connected");
          setLastSyncTime(new Date().toLocaleTimeString("th-TH"));
        } else {
          setIsDatabaseInstalled(false);
          setSyncStatus("local");
        }
      } catch (err) {
        console.error("Failed to load PMS database from localStorage:", err);
      }
    }
  }, []);

  // Save to localStorage whenever core data changes (only when mounted to prevent overwriting with SSR initials)
  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      try {
        localStorage.setItem("hotel_pms_db_rooms", JSON.stringify(rooms));
      } catch (e) {
        console.error(e);
      }
    }
  }, [rooms, isMounted]);

  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      try {
        localStorage.setItem("hotel_pms_db_bookings", JSON.stringify(bookings));
      } catch (e) {
        console.error(e);
      }
    }
  }, [bookings, isMounted]);

  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      try {
        localStorage.setItem("hotel_pms_db_menu", JSON.stringify(menuItems));
      } catch (e) {
        console.error(e);
      }
    }
  }, [menuItems, isMounted]);

  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      try {
        localStorage.setItem("hotel_pms_db_orders", JSON.stringify(orders));
      } catch (e) {
        console.error(e);
      }
    }
  }, [orders, isMounted]);

  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      try {
        localStorage.setItem("hotel_pms_db_room_blocks", JSON.stringify(roomBlocks));
      } catch (e) {
        console.error(e);
      }
    }
  }, [roomBlocks, isMounted]);

  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      try {
        localStorage.setItem("hotel_pms_db_dynamic_pricing", JSON.stringify(dynamicPricingRules));
      } catch (e) {
        console.error(e);
      }
    }
  }, [dynamicPricingRules, isMounted]);

  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      try {
        localStorage.setItem("hotel_pms_db_ota_channels_by_prop", JSON.stringify(otaChannelsByProperty));
      } catch (e) {
        console.error(e);
      }
    }
  }, [otaChannelsByProperty, isMounted]);

  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      try {
        localStorage.setItem("hotel_pms_db_ota_logs", JSON.stringify(otaSyncLogs));
      } catch (e) {
        console.error(e);
      }
    }
  }, [otaSyncLogs, isMounted]);

  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      try {
        localStorage.setItem("hotel_pms_db_staff", JSON.stringify(staffUsers));
      } catch (e) {
        console.error(e);
      }
    }
  }, [staffUsers, isMounted]);

  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      try {
        localStorage.setItem("hotel_pms_db_room_mappings", JSON.stringify(roomMappings));
      } catch (e) {
        console.error(e);
      }
    }
  }, [roomMappings, isMounted]);

  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      try {
        localStorage.setItem("hotel_pms_db_telegram", JSON.stringify(telegramConfig));
      } catch (e) {
        console.error(e);
      }
    }
  }, [telegramConfig, isMounted]);

  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      try {
        localStorage.setItem("hotel_pms_db_notifications", JSON.stringify(notifications));
      } catch (e) {
        console.error(e);
      }
    }
  }, [notifications, isMounted]);

  // Sync with localStorage upon mount and storage events for theme
  useEffect(() => {
    const checkTheme = () => {
      const saved = localStorage.getItem("hotel_pms_theme");
      const dark = saved === "dark";
      setIsDarkMode(dark);
      if (dark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    checkTheme();
    window.addEventListener("storage", checkTheme);
    return () => window.removeEventListener("storage", checkTheme);
  }, []);

  // Synchronize activePropertyId with URL search parameters (including popstate navigation)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const propParam = params.get("property");
      if (propParam === "bugaan" || propParam === "thanawong" || propParam === "all") {
        setActivePropertyId(propParam);
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  // Security Guard: Ensure current logged in user has authorization for activePropertyId
  useEffect(() => {
    if (currentUser && !canUserAccessProperty(currentUser, activePropertyId)) {
      const allowed = (currentUser.propertyAccess === "all" ? "bugaan" : currentUser.propertyAccess) as PropertyId;
      setActivePropertyId(allowed);
    }
  }, [currentUser, activePropertyId]);

  // Sync activePropertyId with URL search parameters and localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      try {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get("property") !== activePropertyId) {
          currentUrl.searchParams.set("property", activePropertyId);
          window.history.replaceState({}, "", currentUrl.toString());
        }
        localStorage.setItem("hotel_pms_property", activePropertyId);
      } catch (err) {
        console.error(err);
      }
    }
  }, [activePropertyId, isMounted]);

  const setAuthorizedActivePropertyId = (id: PropertyId | "all") => {
    if (currentUser && !canUserAccessProperty(currentUser, id)) {
      console.warn(`Access Denied: User ${currentUser.username} is not permitted to access property: ${id}`);
      return;
    }
    setActivePropertyId(id);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("property", id);
        window.history.pushState({}, "", url.toString());
        localStorage.setItem("hotel_pms_property", id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        if (next) {
          document.documentElement.classList.add("dark");
          localStorage.setItem("hotel_pms_theme", "dark");
        } else {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("hotel_pms_theme", "light");
        }
        window.dispatchEvent(new Event("storage"));
      }
      return next;
    });
  };

  const updateRoomStatus = (roomId: string, status: RoomStatus) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status } : r))
    );
  };

  const triggerTwoWayChannelBlock = (
    roomNumber: string,
    checkInDate: string,
    checkOutDate: string,
    sourcePlatform: string,
    bookingNumber: string
  ) => {
    const timestamp = new Date().toLocaleTimeString("th-TH");
    // Find all other connected OTA channels that have autoCloseInventory enabled
    const otherConnected = otaChannels.filter(
      (ch) => ch.status === "connected" && ch.autoCloseInventory && ch.name.toLowerCase() !== (sourcePlatform || "").toLowerCase()
    );

    if (otherConnected.length > 0) {
      const logs: OTASyncLog[] = otherConnected.map((ch) => ({
        id: `log-block-${Date.now()}-${ch.id}-${Math.floor(Math.random() * 1000)}`,
        timestamp,
        channel: ch.name,
        channelId: ch.id,
        type: "CLOSE_INVENTORY",
        status: "SUCCESS",
        details: `[2-Way Auto Allocation] ตรวจพบการจองจาก "${sourcePlatform}" (#${bookingNumber}) -> ส่งสัญญาณสั่งปิดห้องพัก ${roomNumber} (ช่วง ${checkInDate} ถึง ${checkOutDate}) บนแพลตฟอร์ม ${ch.name} สำเร็จ เพื่อป้องกัน Overbooking`,
        roomNumber,
        bookingNumber,
      }));
      setOtaSyncLogs((prev) => [...logs, ...prev]);
    }
  };

  const addBooking = (newBookingData: Omit<Booking, "id" | "bookingNumber" | "createdAt" | "balanceDue">) => {
    const id = `BK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const codePrefix = newBookingData.propertyId === "bugaan" ? "BG" : "TW";
    const bookingNumber = `${codePrefix}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
    const balanceDue = newBookingData.grandTotal - newBookingData.depositPaid;
    
    const newBooking: Booking = {
      ...newBookingData,
      id,
      bookingNumber,
      balanceDue,
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);

    // In-App Notification (แจ้งเตือนผู้ดูแลสาขานั้นหรือทุกคนที่เข้าถึงสาขานี้)
    const notifItem: NotificationItem = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      propertyId: newBooking.propertyId,
      title: `เปิดการจองใหม่ (#${newBooking.bookingNumber})`,
      message: `${newBooking.guestName} จองห้อง ${newBooking.roomNumber} (${newBooking.checkInDate} ถึง ${newBooking.checkOutDate}) ช่องทาง: ${newBooking.source}`,
      type: "BOOKING_NEW",
      audience: "BRANCH_ONLY",
      priority: "NORMAL",
      source: newBooking.source,
      bookingNumber: newBooking.bookingNumber,
      roomNumber: newBooking.roomNumber,
      amount: newBooking.grandTotal,
      timestamp: "เมื่อสักครู่",
      isRead: false,
      telegramSent: telegramConfig.isEnabled && !!telegramConfig.botToken,
    };
    setNotifications((prev) => [notifItem, ...prev]);

    // Send Telegram Notification
    if (telegramConfig.isEnabled && telegramConfig.botToken && telegramConfig.chatId && telegramConfig.notifyOnNewBooking) {
      const hotelTitle = newBooking.propertyId === "thanawong"
        ? "Thanawong Pool Villa (ธนวงศ์ พูลวิลล่า)"
        : "Bu-Gaan Sukhothai Village (บูกาน สุโขทัย)";
      sendTelegramNotification(hotelTitle, newBooking, "BOOKING_NEW");
    }

    // 2-Way Channel Allocation: Auto close inventory across other connected OTAs
    triggerTwoWayChannelBlock(newBooking.roomNumber, newBooking.checkInDate, newBooking.checkOutDate, newBooking.source, bookingNumber);

    // Update room status if checked-in or confirmed for today
    if (newBooking.status === "CHECKED_IN") {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === newBooking.roomId
            ? { ...r, status: "OCCUPIED", currentBookingId: id, guestName: newBooking.guestName }
            : r
        )
      );
    }
  };

  const addMultipleBookings = (newBookingsData: Array<Omit<Booking, "id" | "bookingNumber" | "createdAt" | "balanceDue">>) => {
    if (!newBookingsData.length) return;

    const timestamp = Date.now();
    const createdBookings: Booking[] = newBookingsData.map((data, index) => {
      const id = `BK-${timestamp}-${index}-${Math.floor(100 + Math.random() * 900)}`;
      const codePrefix = data.propertyId === "bugaan" ? "BG" : "TW";
      const bookingNumber = `${codePrefix}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
      const balanceDue = data.grandTotal - data.depositPaid;
      return {
        ...data,
        id,
        bookingNumber,
        balanceDue,
        createdAt: new Date().toISOString(),
      };
    });

    setBookings((prev) => [...createdBookings, ...prev]);

    // 2-Way Channel Allocation: Auto close inventory for all created bookings
    createdBookings.forEach((b) => {
      triggerTwoWayChannelBlock(b.roomNumber, b.checkInDate, b.checkOutDate, b.source, b.bookingNumber);
    });

    // Update rooms for checked-in bookings if any
    const checkedInCreated = createdBookings.filter((b) => b.status === "CHECKED_IN");
    if (checkedInCreated.length > 0) {
      setRooms((prev) =>
        prev.map((r) => {
          const match = checkedInCreated.find((b) => b.roomId === r.id);
          if (match) {
            return { ...r, status: "OCCUPIED", currentBookingId: match.id, guestName: match.guestName };
          }
          return r;
        })
      );
    }
  };

  // OTA Channel Manager Functions (Property-Isolated)
  const connectOTAChannel = async (
    channelId: OTAChannelId, 
    config: Partial<OTAChannelConfig>,
    targetPropertyId?: PropertyId
  ): Promise<boolean> => {
    const propId = targetPropertyId || (activePropertyId === "all" ? "bugaan" : activePropertyId);
    const nowTime = new Date().toLocaleTimeString("th-TH");
    const isoNow = new Date().toISOString();
    let channelName: string = channelId;
    const mappedCount = roomMappings.filter((m) => m.propertyId === propId && m.isSynced).length;

    setOtaChannelsByProperty((prev) => {
      const currentList = prev[propId] || [];
      const updated = currentList.map((ch) => {
        if (ch.id === channelId) {
          channelName = ch.name;
          return {
            ...ch,
            ...config,
            status: "connected" as const,
            connectedAt: isoNow,
            lastSyncTime: nowTime,
            mappedRoomCount: mappedCount,
          };
        }
        return ch;
      });
      return { ...prev, [propId]: updated };
    });

    const hotelName = properties.find((p) => p.id === propId)?.name || propId;
    const log: OTASyncLog = {
      id: `log-conn-${Date.now()}`,
      timestamp: nowTime,
      channel: channelName,
      channelId,
      type: "CHANNEL_CONNECT",
      status: "SUCCESS",
      details: `เชื่อมต่อระบบ 2-Way API กับ ${channelName} สำหรับ ${hotelName} สำเร็จ (Hotel ID: ${config.hotelId || "Default"}) พร้อมเปิดระบบจัดสรรสต็อกห้องพักอัตโนมัติ`,
    };
    setOtaSyncLogs((prev) => [log, ...prev]);
    return true;
  };

  const disconnectOTAChannel = (channelId: OTAChannelId, targetPropertyId?: PropertyId) => {
    const propId = targetPropertyId || (activePropertyId === "all" ? "bugaan" : activePropertyId);
    const nowTime = new Date().toLocaleTimeString("th-TH");
    let channelName: string = channelId;

    setOtaChannelsByProperty((prev) => {
      const currentList = prev[propId] || [];
      const updated = currentList.map((ch) => {
        if (ch.id === channelId) {
          channelName = ch.name;
          return {
            ...ch,
            status: "disconnected" as const,
            connectedAt: null,
          };
        }
        return ch;
      });
      return { ...prev, [propId]: updated };
    });

    const hotelName = properties.find((p) => p.id === propId)?.name || propId;
    const log: OTASyncLog = {
      id: `log-disconn-${Date.now()}`,
      timestamp: nowTime,
      channel: channelName,
      channelId,
      type: "CHANNEL_CONNECT",
      status: "WARNING",
      details: `ยกเลิกการเชื่อมต่อกับ ${channelName} ของ ${hotelName} เรียบร้อยแล้ว (ระบบระงับการซิงค์ข้อมูลชั่วคราว)`,
    };
    setOtaSyncLogs((prev) => [log, ...prev]);
  };

  const syncAllOTAChannels = async (targetPropertyId?: PropertyId) => {
    const propId = targetPropertyId || (activePropertyId === "all" ? "bugaan" : activePropertyId);
    const nowTime = new Date().toLocaleTimeString("th-TH");
    const propRoomsCount = roomMappings.filter((m) => m.propertyId === propId && m.isSynced).length;
    const hotelName = properties.find((p) => p.id === propId)?.name || propId;

    setOtaChannelsByProperty((prev) => {
      const currentList = prev[propId] || [];
      const updated = currentList.map((ch) => (ch.status === "connected" ? { ...ch, lastSyncTime: nowTime, mappedRoomCount: propRoomsCount } : ch));
      return { ...prev, [propId]: updated };
    });

    const currentList = otaChannelsByProperty[propId] || [];
    const connectedList = currentList.filter((c) => c.status === "connected");
    const logs: OTASyncLog[] = connectedList.map((ch) => ({
      id: `log-sync-${Date.now()}-${ch.id}`,
      timestamp: nowTime,
      channel: ch.name,
      channelId: ch.id,
      type: "PRICE_SYNC",
      status: "SUCCESS",
      details: `ซิงค์สถานะห้องพัก ${propRoomsCount} ห้อง และเรทราคาล่าสุดของ ${hotelName} กับ ${ch.name} แบบเรียลไทม์สำเร็จ`,
    }));
    setOtaSyncLogs((prev) => [...logs, ...prev]);
  };

  const toggleChannelAutoClose = (channelId: OTAChannelId, enabled: boolean, targetPropertyId?: PropertyId) => {
    const propId = targetPropertyId || (activePropertyId === "all" ? "bugaan" : activePropertyId);
    setOtaChannelsByProperty((prev) => {
      const currentList = prev[propId] || [];
      const updated = currentList.map((ch) => (ch.id === channelId ? { ...ch, autoCloseInventory: enabled } : ch));
      return { ...prev, [propId]: updated };
    });
  };

  const clearSyncLogs = () => {
    setOtaSyncLogs([]);
  };

  // Helper to send Telegram message
  const sendTelegramNotification = async (hotelTitle: string, booking: Booking, eventType: string = "BOOKING_NEW"): Promise<boolean> => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      return false;
    }

    const eventTitle = eventType === "CHECK_IN" 
      ? "[เช็คอินเข้าพักเรียบร้อย]"
      : eventType === "CHECK_OUT"
      ? "[เช็คเอาต์ & เคลียร์บิลแล้ว]"
      : "[แจ้งเตือนบุ๊กกิ้งใหม่]";

    const text = `
<b>${eventTitle} ${hotelTitle}</b>
━━━━━━━━━━━━━━━━━━━━
<b>ช่องทางการจอง:</b> ${booking.source || "Direct Walk-In"}
<b>เลขที่การจอง:</b> <code>#${booking.bookingNumber}</code>
<b>ห้องพัก:</b> <b>ห้อง ${booking.roomNumber}</b>
<b>ผู้เข้าพัก:</b> ${booking.guestName}
<b>เบอร์ติดต่อ:</b> ${booking.guestPhone || "-"}
<b>ระยะเวลา:</b> ${booking.checkInDate} ถึง ${booking.checkOutDate} (${booking.totalNights} คืน)
<b>ยอดรวม:</b> ฿${Number(booking.grandTotal || 0).toLocaleString()} ${booking.balanceDue <= 0 ? "(ชำระครบแล้ว)" : `(ค้างชำระ ฿${booking.balanceDue.toLocaleString()})`}
${booking.specialRequests ? `<b>คำขอพิเศษ:</b> ${booking.specialRequests}\n` : ""}
<i>ระบบ 2-Way Channel Manager จัดสรรสต็อกห้องพักแบบ Real-time</i>
    `.trim();

    try {
      const res = await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramConfig.chatId,
          text,
          parse_mode: "HTML",
        }),
      });

      const isOk = res.ok;
      const nowTime = new Date().toLocaleTimeString("th-TH");
      const log: OTASyncLog = {
        id: `log-tg-${Date.now()}`,
        timestamp: nowTime,
        channel: "Telegram Bot",
        type: "TELEGRAM_NOTIFY",
        status: isOk ? "SUCCESS" : "FAILED",
        details: isOk 
          ? `[Telegram Bot] ส่งรายงานบุ๊กกิ้ง #${booking.bookingNumber} (${hotelTitle}) ไปยัง Telegram สำเร็จ`
          : `[Telegram Bot] ส่งข้อความล้มเหลว ตรวจสอบ Bot Token หรือ Chat ID`,
        bookingNumber: booking.bookingNumber,
        roomNumber: booking.roomNumber,
      };
      setOtaSyncLogs((prev) => [log, ...prev]);
      return isOk;
    } catch (e) {
      console.error("Failed to send telegram message:", e);
      return false;
    }
  };

  const testTelegramNotification = async (): Promise<{ success: boolean; message: string }> => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      return { success: false, message: "กรุณาระบุ Telegram Bot Token และ Chat ID ก่อนทดสอบ" };
    }

    const testText = `
<b>[ทดสอบระบบแจ้งเตือน Telegram Bot]</b>
━━━━━━━━━━━━━━━━━━━━
<b>การเชื่อมต่อสำเร็จ 100%!</b>
<b>ระบบรองรับทั้ง 2 โรงแรม:</b>
  • Bu-Gaan Sukhothai Village (27 ห้อง)
  • Thanawong Pool Villa (10 หลัง)

<i>ระบบพร้อมส่งรายงานการจองแยกหัวโรงแรมแบบอัตโนมัติ Real-time แล้ว</i>
<b>เวลาทดสอบ:</b> ${new Date().toLocaleString("th-TH")}
    `.trim();

    try {
      const res = await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramConfig.chatId,
          text: testText,
          parse_mode: "HTML",
        }),
      });

      if (res.ok) {
        const testedAt = new Date().toLocaleTimeString("th-TH");
        setTelegramConfig((prev) => ({ ...prev, lastTestedAt: testedAt }));
        return { success: true, message: `ส่งข้อความทดสอบเข้า Telegram สำเร็จเรียบร้อย! (${testedAt})` };
      } else {
        const errData = await res.json().catch(() => ({}));
        return { success: false, message: `ส่งไม่สำเร็จ: ${errData.description || res.statusText}` };
      }
    } catch (err: any) {
      return { success: false, message: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message}` };
    }
  };

  const updateTelegramConfig = (config: Partial<TelegramConfig>) => {
    setTelegramConfig((prev) => ({ ...prev, ...config }));
  };

  const addNotification = (notif: Omit<NotificationItem, "id" | "timestamp" | "isRead" | "telegramSent">) => {
    const item: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: "เมื่อสักครู่",
      isRead: false,
      telegramSent: telegramConfig.isEnabled && !!telegramConfig.botToken,
    };
    setNotifications((prev) => [item, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updateRoomMapping = (mapping: OTARoomMapping) => {
    setRoomMappings((prev) =>
      prev.map((m) => (m.roomId === mapping.roomId ? { ...m, ...mapping } : m))
    );
  };

  const autoMapAllRooms = (targetPropertyId?: PropertyId | "all") => {
    const propId = targetPropertyId !== undefined ? targetPropertyId : activePropertyId;
    if (propId === "all") {
      const newMappings = generateInitialRoomMappings(rooms);
      setRoomMappings(newMappings);
    } else {
      const otherMappings = roomMappings.filter((m) => m.propertyId !== propId);
      const propRooms = rooms.filter((r) => r.propertyId === propId);
      const newPropMappings = generateInitialRoomMappings(propRooms);
      setRoomMappings([...otherMappings, ...newPropMappings]);
    }
  };

  const simulateIncomingOTABooking = (channelId: OTAChannelId, targetPropertyId?: PropertyId) => {
    const propId = targetPropertyId || (activePropertyId === "all" ? "bugaan" : activePropertyId);
    const propChannels = otaChannelsByProperty[propId] || otaChannelsByProperty.bugaan;
    const channel = propChannels.find((c) => c.id === channelId);
    const platformName = channel ? channel.name : (channelId === "booking_com" ? "Booking.com" : channelId === "agoda" ? "Agoda" : channelId === "airbnb" ? "Airbnb" : "Expedia");
    
    // Pick an available room for THIS property
    const propRooms = rooms.filter((r) => r.propertyId === propId);
    const availableRooms = propRooms.filter((r) => r.status === "AVAILABLE" && !r.isMeetingRoom);
    const selectedRoom = availableRooms.length > 0 
      ? availableRooms[Math.floor(Math.random() * availableRooms.length)] 
      : (propRooms[0] || rooms[0]);

    const isTW = propId === "thanawong";
    const guestSamples = isTW
      ? [
          { name: "คุณปรมินทร์ วงศ์สุวรรณ (Thanawong VIP)", phone: "081-998-7711", email: "poramin.w@gmail.com" },
          { name: "Sir Richard Branson (Airbnb Direct)", phone: "+44 7700 900123", email: "richard.b@virgin.com" },
          { name: "Alexander Wright (Booking.com Luxury)", phone: "+1 415 555 2671", email: "alex.wright@california.io" },
          { name: "คุณนันท์นภัส ธีรโชติวัฒน์ (Agoda VIP)", phone: "089-771-4433", email: "nannaphat.t@outlook.com" },
        ]
      : [
          { name: "Michael Chang (Booking.com)", phone: "+65 9123 4567", email: "michael.c@singmail.com" },
          { name: "Yuki Tanaka (Agoda)", phone: "+81 90 1234 5678", email: "yuki.tanaka@tokyonet.jp" },
          { name: "Emma Watson (Expedia Group)", phone: "+44 7700 900077", email: "emma.watson@ukmail.co.uk" },
          { name: "Hans Müller (Booking.com Direct)", phone: "+49 151 23456789", email: "hans.m@berlin-corp.de" },
          { name: "คุณกิตติศักดิ์ เจริญกิจ (Agoda VIP)", phone: "089-887-6655", email: "kittisak.k@gmail.com" },
        ];
    const guest = guestSamples[Math.floor(Math.random() * guestSamples.length)];

    const today = new Date();
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + 3);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + 2);

    const checkInStr = checkIn.toISOString().split("T")[0];
    const checkOutStr = checkOut.toISOString().split("T")[0];

    const totalNights = 2;
    const roomRate = selectedRoom.pricePerNight;
    const roomTotal = roomRate * totalNights;
    const grandTotal = roomTotal;
    const depositPaid = grandTotal;
    const balanceDue = 0;

    const timestamp = Date.now();
    const otaCode = channelId === "booking_com" ? "BK" : channelId === "agoda" ? "AG" : channelId === "airbnb" ? "AB" : "EXP";
    const propCode = isTW ? "TW" : "BG";
    const bookingNumber = `${propCode}-${otaCode}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking: Booking = {
      id: `BK-OTA-${timestamp}`,
      bookingNumber,
      propertyId: selectedRoom.propertyId,
      roomId: selectedRoom.id,
      roomNumber: selectedRoom.roomNumber,
      guestName: guest.name,
      guestPhone: guest.phone,
      guestEmail: guest.email,
      source: (platformName as any),
      status: "CONFIRMED",
      checkInDate: checkInStr,
      checkOutDate: checkOutStr,
      estimatedTime: "14:00",
      adults: selectedRoom.capacityAdults || 2,
      kids: 0,
      hasExtraBed: false,
      extraBedCount: 0,
      extraBedRate: 600,
      specialRequests: isTW ? "ขอเตาบาร์บีคิวริมสระว่ายน้ำ และเซ็ต Floating Breakfast" : `จองผ่านระบบ ${platformName} (Instant OTA Booking Confirmed)`,
      totalNights,
      roomRate,
      roomTotal,
      extraBedTotal: 0,
      posChargesTotal: 0,
      grandTotal,
      depositPaid,
      balanceDue,
      createdAt: new Date().toISOString(),
    };

    // Ingest into PMS Bookings
    setBookings((prev) => [newBooking, ...prev]);

    // 2-Way Sync: Find all other connected channels of this property and close inventory
    const otherConnected = propChannels.filter(
      (ch) => ch.status === "connected" && ch.autoCloseInventory && ch.id !== channelId
    );
    const nowTime = new Date().toLocaleTimeString("th-TH");

    const importLog: OTASyncLog = {
      id: `log-imp-${timestamp}`,
      timestamp: nowTime,
      channel: platformName,
      channelId,
      type: "IMPORT_BOOKING",
      status: "SUCCESS",
      details: `[Incoming Booking] รับการจองใหม่จาก ${platformName} #${bookingNumber} ผู้เข้าพัก "${guest.name}" ห้อง ${selectedRoom.roomNumber} (${checkInStr} ถึง ${checkOutStr}) ยอดเงิน ฿${grandTotal.toLocaleString()}`,
      roomNumber: selectedRoom.roomNumber,
      bookingNumber,
    };

    const blockLogs: OTASyncLog[] = otherConnected.map((ch) => ({
      id: `log-block-${timestamp}-${ch.id}`,
      timestamp: nowTime,
      channel: ch.name,
      channelId: ch.id,
      type: "CLOSE_INVENTORY",
      status: "SUCCESS",
      details: `[2-Way Auto Block] ส่งคำสั่งปิดห้องพัก (Block Inventory) ห้อง ${selectedRoom.roomNumber} (ช่วง ${checkInStr} ถึง ${checkOutStr}) ไปยัง ${ch.name} ทันที สำเร็จ (ป้องกันการจองซ้ำ)`,
      roomNumber: selectedRoom.roomNumber,
      bookingNumber,
    }));

    setOtaSyncLogs((prev) => [importLog, ...blockLogs, ...prev]);

    // Update channel last sync
    setOtaChannelsByProperty((prev) => {
      const currentList = prev[propId] || [];
      const updated = currentList.map((ch) => (ch.id === channelId ? { ...ch, lastSyncTime: nowTime } : ch));
      return { ...prev, [propId]: updated };
    });

    // Hotel name formatting for Telegram header
    const hotelTitle = selectedRoom.propertyId === "thanawong"
      ? "Thanawong Pool Villa (ธนวงศ์ พูลวิลล่า)"
      : "Bu-Gaan Sukhothai Village (บูกาน สุโขทัย)";

    // Add Notification to in-app Notification Center (แจ้งเตือนผู้ดูแลสาขาและแอดมิน)
    const notifItem: NotificationItem = {
      id: `notif-${timestamp}`,
      propertyId: selectedRoom.propertyId,
      title: `บุ๊กกิ้งเข้าใหม่ ${platformName} (#${bookingNumber})`,
      message: `${guest.name} จองห้อง ${selectedRoom.roomNumber} (${checkInStr} ถึง ${checkOutStr}) ยอด ฿${grandTotal.toLocaleString()} ชำระแล้ว`,
      type: "BOOKING_NEW",
      audience: "BRANCH_ONLY",
      priority: "HIGH",
      source: platformName,
      bookingNumber,
      roomNumber: selectedRoom.roomNumber,
      amount: grandTotal,
      timestamp: "เมื่อสักครู่",
      isRead: false,
      telegramSent: telegramConfig.isEnabled && !!telegramConfig.botToken,
    };
    setNotifications((prev) => [notifItem, ...prev]);

    // Send Telegram Notification if enabled
    if (telegramConfig.isEnabled && telegramConfig.botToken && telegramConfig.chatId && telegramConfig.notifyOnNewBooking) {
      sendTelegramNotification(hotelTitle, newBooking, "BOOKING_NEW");
    }

    return {
      success: true,
      booking: newBooking,
      blockedChannels: otherConnected.map((c) => c.name),
    };
  };

  const updateBooking = (bookingId: string, updated: Partial<Booking>) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const merged = { ...b, ...updated };
          const grandTotal = merged.roomTotal + merged.extraBedTotal + merged.posChargesTotal;
          const balanceDue = grandTotal - merged.depositPaid;
          return { ...merged, grandTotal, balanceDue };
        }
        return b;
      })
    );
  };

  const updateGroupColorTag = (groupBookingIdOrCompany: string, colorTag: string, companyName?: string) => {
    if (!groupBookingIdOrCompany) return;
    setBookings((prev) =>
      prev.map((b) => {
        const isMatched = 
          b.groupBookingId === groupBookingIdOrCompany ||
          (b.companyName && b.companyName === groupBookingIdOrCompany) ||
          b.guestName.includes(groupBookingIdOrCompany);
        
        if (isMatched) {
          return {
            ...b,
            colorTag,
            ...(companyName ? { companyName } : {}),
            groupBookingId: b.groupBookingId || `GRP-${Date.now()}`
          };
        }
        return b;
      })
    );
  };

  const cancelBooking = (
    bookingId: string, 
    options?: { reason?: string; cancellationFee?: number; waiveFee?: boolean }
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setRooms((prev) =>
      prev.map((r) =>
        r.id === booking.roomId && r.currentBookingId === bookingId
          ? { ...r, status: "AVAILABLE", currentBookingId: undefined, guestName: undefined }
          : r
      )
    );

    const fee = options?.waiveFee ? 0 : (options?.cancellationFee ?? 0);
    const nowIso = new Date().toISOString();

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: "CANCELLED" as BookingStatus,
              cancelledAt: nowIso,
              cancellationFee: fee,
              cancellationReason: options?.reason,
              specialRequests: options?.reason 
                ? `${b.specialRequests ? b.specialRequests + " | " : ""}เหตุผลการยกเลิก: ${options.reason}` 
                : b.specialRequests,
            }
          : b
      )
    );

    addNotification({
      propertyId: booking.propertyId,
      title: "ยกเลิกการจองสำเร็จ",
      message: `ยกเลิกการจองของ คุณ${booking.guestName} (#${booking.bookingNumber}) ห้อง ${booking.roomNumber} เรียบร้อยแล้ว`,
      type: "BOOKING_UPDATE",
      audience: "ALL",
      priority: "NORMAL",
      roomNumber: booking.roomNumber,
    });
  };

  const cancelMultipleBookings = (
    bookingIds: string[], 
    options?: { reason?: string; cancellationFee?: number; waiveFee?: boolean }
  ) => {
    if (bookingIds.length === 0) return;

    const targets = bookings.filter((b) => bookingIds.includes(b.id));
    if (targets.length === 0) return;

    const targetRoomIds = targets.map((b) => b.roomId);

    setRooms((prev) =>
      prev.map((r) => {
        if (targetRoomIds.includes(r.id) && r.currentBookingId && bookingIds.includes(r.currentBookingId)) {
          return { ...r, status: "AVAILABLE", currentBookingId: undefined, guestName: undefined };
        }
        return r;
      })
    );

    const nowIso = new Date().toISOString();
    const feePerBooking = options?.waiveFee ? 0 : (options?.cancellationFee ? options.cancellationFee / bookingIds.length : 0);

    setBookings((prev) =>
      prev.map((b) => {
        if (bookingIds.includes(b.id)) {
          return {
            ...b,
            status: "CANCELLED" as BookingStatus,
            cancelledAt: nowIso,
            cancellationFee: feePerBooking,
            cancellationReason: options?.reason,
            specialRequests: options?.reason 
              ? `${b.specialRequests ? b.specialRequests + " | " : ""}เหตุผลการยกเลิก: ${options.reason}` 
              : b.specialRequests,
          };
        }
        return b;
      })
    );

    const first = targets[0];
    addNotification({
      propertyId: first.propertyId,
      title: "ยกเลิกการจองกลุ่มสำเร็จ",
      message: `ยกเลิกการจองที่เชื่อมโยงจำนวน ${targets.length} ห้อง (${targets.map(t => t.roomNumber).join(", ")}) เรียบร้อยแล้ว`,
      type: "BOOKING_UPDATE",
      audience: "ALL",
      priority: "NORMAL",
    });
  };

  const deleteBooking = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === booking.roomId && r.currentBookingId === bookingId
            ? { ...r, status: "AVAILABLE", currentBookingId: undefined, guestName: undefined }
            : r
        )
      );
    }
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const checkInBooking = (
    bookingId: string, 
    checkInData?: { guestIdCardImage?: string; guestSignatureImage?: string }
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const nowIso = new Date().toISOString();
    const updatedBooking: Booking = {
      ...booking,
      status: "CHECKED_IN",
      guestIdCardImage: checkInData?.guestIdCardImage || booking.guestIdCardImage,
      guestSignatureImage: checkInData?.guestSignatureImage || booking.guestSignatureImage,
      checkedInAt: nowIso,
    };

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? updatedBooking : b))
    );
    setRooms((prev) =>
      prev.map((r) =>
        r.id === booking.roomId
          ? { ...r, status: "OCCUPIED", currentBookingId: booking.id, guestName: booking.guestName }
          : r
      )
    );

    // Send Telegram Notification on Check-In if enabled
    if (telegramConfig.isEnabled && telegramConfig.botToken && telegramConfig.chatId && telegramConfig.notifyOnCheckIn) {
      const hotelTitle = booking.propertyId === "thanawong"
        ? "Thanawong Pool Villa (ธนวงศ์ พูลวิลล่า)"
        : "Bu-Gaan Sukhothai Village (บูกาน สุโขทัย)";
      sendTelegramNotification(hotelTitle, updatedBooking, "CHECK_IN");
    }
  };

  const login = (username: string, pass: string, rememberMe = true): boolean => {
    // Demo authentication: check against live staffUsers list
    const matched = staffUsers.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (matched && (pass === "1234" || pass === "admin1234" || pass === "hotel1234")) {
      const sess = createSession(matched, rememberMe);
      setCurrentSession(sess);
      if (matched.propertyAccess !== "all") {
        setActivePropertyId(matched.propertyAccess);
      }
      return true;
    }
    // Allow any username if password matches 1234
    if (pass === "1234") {
      const newUser: StaffUser = {
        id: `usr-${Date.now()}`,
        name: username,
        username,
        role: "Front Desk Receptionist",
        propertyAccess: "all",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      };
      const sess = createSession(newUser, rememberMe);
      setCurrentSession(sess);
      return true;
    }
    return false;
  };

  const addStaffUser = (userData: Omit<StaffUser, "id">) => {
    const id = `usr-${Date.now()}`;
    const newUser: StaffUser = {
      ...userData,
      id,
    };
    setStaffUsers((prev) => [...prev, newUser]);
  };

  const updateStaffUser = (id: string, updated: Partial<StaffUser>) => {
    setStaffUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updated } : u))
    );
    // If updating current logged in user, sync session as well
    if (currentSession?.userId === id) {
      const updatedUser = { ...currentSession.user, ...updated };
      const updatedSess = { ...currentSession, user: updatedUser };
      setCurrentSession(updatedSess);
      if (typeof window !== "undefined") {
        localStorage.setItem("hotel_pms_session_v2", JSON.stringify(updatedSess));
      }
    }
  };

  const deleteStaffUser = (id: string) => {
    setStaffUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const logout = () => {
    destroySession();
    setCurrentSession(null);
  };

  const installDatabase = async (config: DatabaseConfig): Promise<{ success: boolean; message: string }> => {
    try {
      setSyncStatus("syncing");
      // Simulate real-time schema creation and connection verification
      await new Promise((r) => setTimeout(r, 1000));

      setDatabaseConfig(config);
      setIsDatabaseInstalled(true);
      setSyncStatus("connected");
      const timeStr = new Date().toLocaleTimeString("th-TH");
      setLastSyncTime(timeStr);

      if (typeof window !== "undefined") {
        localStorage.setItem("hotel_pms_db_config", JSON.stringify(config));
        localStorage.setItem("hotel_pms_installed", "true");
        window.dispatchEvent(new Event("storage"));
      }

      return {
        success: true,
        message: `เชื่อมต่อและติดตั้งฐานข้อมูล ${config.provider} สำเร็จ! พร้อมสำหรับการดูและจัดการออนไลน์พร้อมกันหลายอุปกรณ์`,
      };
    } catch (err: any) {
      setSyncStatus("disconnected");
      return { success: false, message: err?.message || "ไม่สามารถติดตั้งฐานข้อมูลได้" };
    }
  };

  const resetDatabaseInstallation = () => {
    setDatabaseConfig(null);
    setIsDatabaseInstalled(false);
    setSyncStatus("local");
    setLastSyncTime(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("hotel_pms_db_config");
      localStorage.removeItem("hotel_pms_installed");
      window.dispatchEvent(new Event("storage"));
    }
  };

  const settleBookingAndCheckOut = (
    bookingId: string,
    paymentMethod: "CASH" | "PROMPTPAY_QR" | "CREDIT_CARD" = "CASH",
    slipImage?: string
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    if (process.env.NODE_ENV !== "production") {
      console.log(`[PMS] Settle booking ${booking.bookingNumber} via ${paymentMethod}`);
    }

    // Settle balance: depositPaid becomes grandTotal, balanceDue becomes 0
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              depositPaid: b.grandTotal,
              balanceDue: 0,
              paymentMethod,
              slipImage: slipImage || b.slipImage,
              paidAt: new Date().toISOString(),
              status: "CHECKED_OUT",
            }
          : b
      )
    );

    // Update room to cleaning status
    setRooms((prev) =>
      prev.map((r) =>
        r.id === booking.roomId
          ? { ...r, status: "CLEANING", currentBookingId: undefined, guestName: undefined }
          : r
      )
    );
  };

  const checkOutBooking = (bookingId: string) => {
    settleBookingAndCheckOut(bookingId, "CASH");
  };

  const quickWalkIn = (
    roomId: string, 
    guestName: string, 
    guestPhone: string, 
    nights: number, 
    docs?: { guestIdCardImage?: string; guestSignatureImage?: string }
  ) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    const today = new Date();
    const checkOut = new Date();
    checkOut.setDate(today.getDate() + nights);

    const checkInStr = today.toISOString().split("T")[0];
    const checkOutStr = checkOut.toISOString().split("T")[0];
    const roomTotal = room.pricePerNight * nights;

    addBooking({
      propertyId: room.propertyId,
      roomId: room.id,
      roomNumber: room.roomNumber,
      guestName: guestName || "ลูกค้า Walk-in",
      guestPhone: guestPhone || "08X-XXX-XXXX",
      guestEmail: "walkin@guest.com",
      source: "Walk-in",
      status: "CHECKED_IN",
      checkInDate: checkInStr,
      checkOutDate: checkOutStr,
      estimatedTime: "ทันที",
      adults: room.capacityAdults,
      kids: 0,
      hasExtraBed: false,
      extraBedCount: 0,
      extraBedRate: 600,
      totalNights: nights,
      roomRate: room.pricePerNight,
      roomTotal: roomTotal,
      extraBedTotal: 0,
      posChargesTotal: 0,
      grandTotal: roomTotal,
      depositPaid: roomTotal,
      guestIdCardImage: docs?.guestIdCardImage,
      guestSignatureImage: docs?.guestSignatureImage,
      checkedInAt: new Date().toISOString(),
    });
  };

  const addOrder = (orderData: Omit<RoomOrder, "id" | "orderNumber" | "createdAt">) => {
    const id = `ORD-${Date.now()}`;
    const orderNumber = `ORD-${orderData.roomNumber}-${Math.floor(10 + Math.random() * 90)}`;
    const newOrder: RoomOrder = {
      ...orderData,
      id,
      orderNumber,
      createdAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);

    // If charged to room, automatically add to booking total
    if (orderData.isRoomCharge && orderData.bookingId) {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === orderData.bookingId) {
            const newPosTotal = b.posChargesTotal + orderData.totalAmount;
            const newGrand = b.roomTotal + b.extraBedTotal + newPosTotal;
            return {
              ...b,
              posChargesTotal: newPosTotal,
              grandTotal: newGrand,
              balanceDue: newGrand - b.depositPaid,
            };
          }
          return b;
        })
      );
    }
    return newOrder;
  };

  const deleteOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order && order.bookingId && order.isRoomCharge) {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === order.bookingId) {
            const newPosTotal = Math.max(0, b.posChargesTotal - order.totalAmount);
            const newGrand = b.roomTotal + b.extraBedTotal + newPosTotal;
            return {
              ...b,
              posChargesTotal: newPosTotal,
              grandTotal: newGrand,
              balanceDue: newGrand - b.depositPaid,
            };
          }
          return b;
        })
      );
    }
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const transferOrderToRoom = (orderId: string, targetRoomId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const targetRoom = rooms.find((r) => r.id === targetRoomId);
    if (!targetRoom) return;

    // 1. Remove pos charge from previous booking (if was a room charge)
    if (order.bookingId && order.isRoomCharge) {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === order.bookingId) {
            const newPosTotal = Math.max(0, b.posChargesTotal - order.totalAmount);
            const newGrand = b.roomTotal + b.extraBedTotal + newPosTotal;
            return {
              ...b,
              posChargesTotal: newPosTotal,
              grandTotal: newGrand,
              balanceDue: newGrand - b.depositPaid,
            };
          }
          return b;
        })
      );
    }

    // 2. Add pos charge to target booking (if target room has an active booking)
    const targetBookingId = targetRoom.currentBookingId;
    if (targetBookingId) {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === targetBookingId) {
            const newPosTotal = b.posChargesTotal + order.totalAmount;
            const newGrand = b.roomTotal + b.extraBedTotal + newPosTotal;
            return {
              ...b,
              posChargesTotal: newPosTotal,
              grandTotal: newGrand,
              balanceDue: newGrand - b.depositPaid,
            };
          }
          return b;
        })
      );
    }

    // 3. Update order details
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            roomId: targetRoom.id,
            roomNumber: targetRoom.roomNumber,
            propertyId: targetRoom.propertyId,
            bookingId: targetBookingId || undefined,
            guestName: targetRoom.guestName || "ลูกค้าทั่วไป",
            isRoomCharge: !!targetBookingId,
            paymentMethod: targetBookingId ? ("ROOM_CHARGE" as const) : o.paymentMethod,
          };
        }
        return o;
      })
    );
  };

  const addMenuItem = (itemData: Omit<MenuItem, "id">) => {
    const newItem: MenuItem = {
      ...itemData,
      id: `m-${Date.now().toString().slice(-4)}`,
    };
    setMenuItems((prev) => [newItem, ...prev]);
  };

  const updateMenuItem = (itemId: string, updated: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ...updated } : i))
    );
  };

  const deleteMenuItem = (itemId: string) => {
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const addCustomChargeToBooking = (bookingId: string, title: string, amount: number) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // Record as RoomOrder for itemized tracking
    addOrder({
      propertyId: booking.propertyId,
      roomId: booking.roomId,
      roomNumber: booking.roomNumber,
      bookingId: booking.id,
      guestName: booking.guestName,
      items: [
        {
          menuItemId: `custom-${Date.now().toString().slice(-4)}`,
          name: title,
          price: amount,
          quantity: 1,
        },
      ],
      totalAmount: amount,
      isRoomCharge: true,
      paymentMethod: "ROOM_CHARGE",
      status: "COMPLETED",
    });
  };

  // Room Management CRUD
  const addRoom = (roomData: Omit<Room, "id">) => {
    const id = `rm-${Date.now().toString().slice(-5)}`;
    const newRoom: Room = {
      ...roomData,
      id,
    };
    setRooms((prev) => [...prev, newRoom]);
  };

  const updateRoom = (roomId: string, updated: Partial<Room>) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, ...updated } : r))
    );
  };

  const deleteRoom = (roomId: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  };

  // Database Backup, Restore, and Reset
  const backupDatabase = (): PMSBackupData => {
    const backup: PMSBackupData = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      exportedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : "System Admin",
      properties,
      rooms,
      bookings,
      menuItems,
      orders,
      promptPayConfigs,
    };
    return backup;
  };

  const restoreDatabase = (data: PMSBackupData): { success: boolean; message: string } => {
    try {
      if (!data || !Array.isArray(data.rooms) || !Array.isArray(data.bookings)) {
        return { success: false, message: "รูปแบบไฟล์ฐานข้อมูลไม่ถูกต้อง (Invalid PMS Schema)" };
      }

      setRooms(data.rooms);
      setBookings(data.bookings);
      if (Array.isArray(data.menuItems)) setMenuItems(data.menuItems);
      if (Array.isArray(data.orders)) setOrders(data.orders);
      if (data.promptPayConfigs) {
        setPromptPayConfigs(data.promptPayConfigs);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("hotel_pms_db_rooms", JSON.stringify(data.rooms));
        localStorage.setItem("hotel_pms_db_bookings", JSON.stringify(data.bookings));
        if (Array.isArray(data.menuItems)) localStorage.setItem("hotel_pms_db_menu", JSON.stringify(data.menuItems));
        if (Array.isArray(data.orders)) localStorage.setItem("hotel_pms_db_orders", JSON.stringify(data.orders));
        if (data.promptPayConfigs) localStorage.setItem("hotel_promptpay_configs", JSON.stringify(data.promptPayConfigs));
      }

      return { 
        success: true, 
        message: `กู้คืนข้อมูลสำเร็จ: ห้องพัก ${data.rooms.length} ห้อง, การจอง ${data.bookings.length} รายการ, เมนู ${data.menuItems?.length || 0} รายการ` 
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการกู้คืนข้อมูล";
      return { success: false, message: msg };
    }
  };

  const toggleDateBlock = (propertyId: PropertyId, date: string, isClosed: boolean) => {
    setRoomBlocks((prev) => {
      const existingIdx = prev.findIndex(
        (b) => b.propertyId === propertyId && b.date === date && b.targetType === "ALL"
      );
      const now = new Date().toISOString();
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          isClosed,
          updatedAt: now,
        };
        return next;
      } else {
        const newRule: RoomBlockRule = {
          id: `blk-all-${propertyId}-${date}-${Date.now()}`,
          propertyId,
          date,
          targetType: "ALL",
          isClosed,
          updatedAt: now,
        };
        return [...prev, newRule];
      }
    });

    const hotelName = properties.find((p) => p.id === propertyId)?.name || propertyId;
    addNotification({
      propertyId,
      type: "SYSTEM_ALERT",
      audience: "ADMIN_ONLY", // คำสั่ง Stop Sell เป็นข้อมูลสำคัญสำหรับแอดมิน/GM
      priority: "URGENT",
      title: isClosed ? "ปิดการขายทุกห้องพัก (Stop Sell)" : "เปิดการขายห้องพัก",
      message: `${isClosed ? "ปิดการขายห้องทุกประเภท" : "เปิดการขายห้องพักปกติ"} ของ ${hotelName} ในวันที่ ${date}`,
    });

    // Sync OTA channels log for the specific property
    const propChannels = otaChannelsByProperty[propertyId] || otaChannelsByProperty.bugaan;
    propChannels.filter((c) => c.status === "connected").forEach((c) => {
      const log: OTASyncLog = {
        id: `log-block-${Date.now()}-${c.id}`,
        channel: c.name,
        channelId: c.id,
        type: isClosed ? "CLOSE_INVENTORY" : "OPEN_INVENTORY",
        timestamp: new Date().toLocaleTimeString("th-TH"),
        status: "SUCCESS",
        details: `${isClosed ? "Stop Sell ปิดทุกห้อง" : "เปิดขายทุกห้อง"} วันที่ ${date}`,
      };
      setOtaSyncLogs((l) => [log, ...l.slice(0, 49)]);
    });
  };

  const toggleRoomTypeBlock = (propertyId: PropertyId, date: string, roomType: string, isClosed: boolean) => {
    setRoomBlocks((prev) => {
      const existingIdx = prev.findIndex(
        (b) => b.propertyId === propertyId && b.date === date && b.targetType === "ROOM_TYPE" && b.roomType === roomType
      );
      const now = new Date().toISOString();
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          isClosed,
          updatedAt: now,
        };
        return next;
      } else {
        const newRule: RoomBlockRule = {
          id: `blk-type-${propertyId}-${roomType}-${date}-${Date.now()}`,
          propertyId,
          date,
          targetType: "ROOM_TYPE",
          roomType,
          isClosed,
          updatedAt: now,
        };
        return [...prev, newRule];
      }
    });

    const hotelName = properties.find((p) => p.id === propertyId)?.name || propertyId;
    addNotification({
      propertyId,
      type: "SYSTEM_ALERT",
      audience: "ADMIN_ONLY", // คำสั่ง Stop Sell เป็นข้อมูลสำคัญสำหรับแอดมิน/GM
      priority: "HIGH",
      title: isClosed ? `ปิดขายประเภทห้อง: ${roomType}` : `เปิดขายประเภทห้อง: ${roomType}`,
      message: `${isClosed ? "ปิดการขาย" : "เปิดการขาย"}ประเภท ${roomType} ของ ${hotelName} วันที่ ${date}`,
    });

    const propChannels = otaChannelsByProperty[propertyId] || otaChannelsByProperty.bugaan;
    propChannels.filter((c) => c.status === "connected").forEach((c) => {
      const log: OTASyncLog = {
        id: `log-type-${Date.now()}-${c.id}`,
        channel: c.name,
        channelId: c.id,
        type: isClosed ? "CLOSE_INVENTORY" : "OPEN_INVENTORY",
        timestamp: new Date().toLocaleTimeString("th-TH"),
        status: "SUCCESS",
        details: `${isClosed ? "Stop Sell" : "Open Sell"} ${roomType} วันที่ ${date}`,
      };
      setOtaSyncLogs((l) => [log, ...l.slice(0, 49)]);
    });
  };

  const setRoomTypeAvailableCount = (propertyId: PropertyId, date: string, roomType: string, count: number) => {
    setRoomBlocks((prev) => {
      const existingIdx = prev.findIndex(
        (b) => b.propertyId === propertyId && b.date === date && b.targetType === "ROOM_TYPE" && b.roomType === roomType
      );
      const now = new Date().toISOString();
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          availableOverride: count,
          updatedAt: now,
        };
        return next;
      } else {
        const newRule: RoomBlockRule = {
          id: `blk-count-${propertyId}-${roomType}-${date}-${Date.now()}`,
          propertyId,
          date,
          targetType: "ROOM_TYPE",
          roomType,
          isClosed: count === 0,
          availableOverride: count,
          updatedAt: now,
        };
        return [...prev, newRule];
      }
    });
  };

  // Dynamic Pricing & Seasonal Rules Actions
  const addDynamicPricingRule = (ruleData: Omit<DynamicPricingRule, "id" | "updatedAt">) => {
    const newRule: DynamicPricingRule = {
      ...ruleData,
      id: `rule-${Date.now().toString().slice(-6)}`,
      updatedAt: new Date().toLocaleString("th-TH"),
    };
    setDynamicPricingRules((prev) => [newRule, ...prev]);
  };

  const updateDynamicPricingRule = (id: string, updated: Partial<DynamicPricingRule>) => {
    setDynamicPricingRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated, updatedAt: new Date().toLocaleString("th-TH") } : r))
    );
  };

  const deleteDynamicPricingRule = (id: string) => {
    setDynamicPricingRules((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleDynamicPricingRule = (id: string, isActive: boolean) => {
    setDynamicPricingRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive, updatedAt: new Date().toLocaleString("th-TH") } : r))
    );
  };

  const calculateDynamicRate = (
    baseRate: number,
    date: string,
    propertyId: PropertyId,
    roomType?: string
  ) => {
    if (!baseRate || baseRate <= 0) {
      return { finalRate: 0, appliedRules: [], breakdown: [] };
    }

    const appliedRules: DynamicPricingRule[] = [];
    const breakdown: { ruleName: string; amount: number }[] = [];
    let currentRate = baseRate;

    const applicableRules = dynamicPricingRules
      .filter((r) => {
        if (!r.isActive) return false;
        if (r.propertyId !== "all" && r.propertyId !== propertyId) return false;
        if (r.roomType && r.roomType !== "all" && roomType && r.roomType !== roomType) return false;
        return true;
      })
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));

    const propRooms = rooms.filter((rm) => rm.propertyId === propertyId);
    const bookedCount = bookings.filter((b) => 
      b.propertyId === propertyId &&
      b.status !== "CANCELLED" &&
      b.checkInDate <= date &&
      b.checkOutDate > date
    ).length;
    const occupancyPercent = propRooms.length > 0 ? (bookedCount / propRooms.length) * 100 : 0;

    const targetDate = new Date(date + "T00:00:00");
    const dayOfWeek = targetDate.getDay();
    const todayStr = new Date().toISOString().split("T")[0];

    for (const rule of applicableRules) {
      let isMatched = false;

      if (rule.type === "FESTIVAL" || rule.type === "SEASONAL") {
        if (rule.startDate && rule.endDate) {
          if (date >= rule.startDate && date <= rule.endDate) {
            isMatched = true;
          }
        }
      } else if (rule.type === "DAY_OF_WEEK") {
        if (rule.daysOfWeek && rule.daysOfWeek.includes(dayOfWeek)) {
          isMatched = true;
        }
      } else if (rule.type === "OCCUPANCY") {
        if (rule.minOccupancyPercent && occupancyPercent >= rule.minOccupancyPercent) {
          isMatched = true;
        }
      } else if (rule.type === "LAST_MINUTE") {
        if (date === todayStr) {
          isMatched = true;
        }
      }

      if (isMatched) {
        appliedRules.push(rule);
        let amount = 0;
        if (rule.adjustmentType === "PERCENT") {
          amount = Math.round(baseRate * (rule.adjustmentValue / 100));
        } else {
          amount = rule.adjustmentValue;
        }
        currentRate += amount;
        breakdown.push({ ruleName: rule.name, amount });
      }
    }

    return {
      finalRate: Math.max(0, currentRate),
      appliedRules,
      breakdown,
    };
  };

  const syncDynamicRatesToChannels = async (targetPropertyId: PropertyId | "all" = "all") => {
    const propsToSync: PropertyId[] = targetPropertyId === "all" ? ["bugaan", "thanawong"] : [targetPropertyId];
    let totalUpdated = 0;
    const newLogs: OTASyncLog[] = [];
    const nowTime = new Date().toLocaleTimeString("th-TH");

    propsToSync.forEach((propId) => {
      const propChannels = otaChannelsByProperty[propId] || [];
      const connected = propChannels.filter((c) => c.status === "connected");
      const propName = propId === "thanawong" ? "ธนวงศ์ พูลวิลล่า" : "Bu-Gaan Sukhothai Village";

      connected.forEach((ch) => {
        totalUpdated += 1;
        newLogs.push({
          id: `log-rate-${Date.now()}-${ch.id}-${Math.random().toString(36).slice(2, 6)}`,
          channelId: ch.id,
          channel: ch.name,
          type: "PRICE_SYNC",
          status: "SUCCESS",
          timestamp: nowTime,
          details: `อัปเดตราคา Dynamic Pricing อัตโนมัติ (${propName}) ส่งกฎราคาเทศกาลลอยกระทงและดีมานด์สำเร็จ`,
        });
      });
    });

    if (newLogs.length > 0) {
      setOtaSyncLogs((prev) => [...newLogs, ...prev.slice(0, 50 - newLogs.length)]);
    }

    addNotification({
      propertyId: targetPropertyId,
      title: "ซิงค์ราคา Dynamic Pricing อัตโนมัติสำเร็จ",
      message: `อัปเดตราคาตามช่วงเทศกาลและดีมานด์ไปยัง ${totalUpdated} แพลตฟอร์ม OTA เรียบร้อยแล้ว`,
      type: "OTA_BLOCK",
      audience: "ALL",
      priority: "NORMAL",
    });

    return { success: true, updatedChannels: totalUpdated, logsCount: newLogs.length };
  };

  const resetDatabase = () => {
    setRooms(initialRooms);
    setBookings(initialBookings);
    setMenuItems(initialMenuItems);
    setOrders(initialOrders);

    if (typeof window !== "undefined") {
      localStorage.removeItem("hotel_pms_db_rooms");
      localStorage.removeItem("hotel_pms_db_bookings");
      localStorage.removeItem("hotel_pms_db_menu");
      localStorage.removeItem("hotel_pms_db_orders");
    }
  };

  const filteredRooms = activePropertyId === "all" 
    ? rooms 
    : rooms.filter((r) => r.propertyId === activePropertyId);

  const filteredBookings = activePropertyId === "all"
    ? bookings
    : bookings.filter((b) => b.propertyId === activePropertyId);

  const filteredOrders = activePropertyId === "all"
    ? orders
    : orders.filter((o) => o.propertyId === activePropertyId);

  return (
    <PMSContext.Provider
      value={{
        activePropertyId,
        setActivePropertyId: setAuthorizedActivePropertyId,
        properties,
        rooms,
        bookings,
        menuItems,
        orders,
        isDarkMode,
        isMounted,
        toggleDarkMode,
        currentSession,
        currentUser,
        staffUsers,
        login,
        logout,
        addStaffUser,
        updateStaffUser,
        deleteStaffUser,
        addBooking,
        addMultipleBookings,
        updateBooking,
        updateGroupColorTag,
        cancelBooking,
        cancelMultipleBookings,
        deleteBooking,
        updateRoomStatus,
        addRoom,
        updateRoom,
        deleteRoom,
        addOrder,
        deleteOrder,
        transferOrderToRoom,
        checkInBooking,
        checkOutBooking,
        settleBookingAndCheckOut,
        quickWalkIn,
        requireCheckInDocuments,
        setRequireCheckInDocuments,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        addCustomChargeToBooking,
        promptPayConfigs,
        updatePromptPayConfig,
        getPromptPayConfig,
        backupDatabase,
        restoreDatabase,
        resetDatabase,
        isDatabaseInstalled,
        databaseConfig,
        installDatabase,
        resetDatabaseInstallation,
        syncStatus,
        lastSyncTime,
        otaChannels,
        otaChannelsByProperty,
        otaSyncLogs,
        roomMappings,
        connectOTAChannel,
        disconnectOTAChannel,
        syncAllOTAChannels,
        simulateIncomingOTABooking,
        toggleChannelAutoClose,
        clearSyncLogs,
        updateRoomMapping,
        autoMapAllRooms,
        telegramConfig,
        notifications,
        updateTelegramConfig,
        testTelegramNotification,
        sendTelegramNotification,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        roomBlocks,
        toggleDateBlock,
        toggleRoomTypeBlock,
        setRoomTypeAvailableCount,
        dynamicPricingRules,
        addDynamicPricingRule,
        updateDynamicPricingRule,
        deleteDynamicPricingRule,
        toggleDynamicPricingRule,
        calculateDynamicRate,
        syncDynamicRatesToChannels,
        filteredRooms,
        filteredBookings,
        filteredOrders,
      }}
    >
      {children}
    </PMSContext.Provider>
  );
}

export function usePMS() {
  const context = useContext(PMSContext);
  if (!context) {
    throw new Error("usePMS must be used within a PMSProvider");
  }
  return context;
}

