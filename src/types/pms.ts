export type PropertyId = "bugaan" | "thanawong";

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  role: "General Manager" | "Front Desk Receptionist" | "F&B Manager" | "Housekeeping Lead";
  propertyAccess: PropertyId | "all";
  avatar: string;
}

export interface UserSession {
  token: string;
  userId: string;
  user: StaffUser;
  loginAt: string;        // ISO timestamp
  expiresAt: string;      // ISO timestamp
  lastActiveAt: string;   // ISO timestamp
  device: string;         // Browser / OS description
  ip?: string;
  rememberMe: boolean;
}

export function isUserAdminOrGM(user: StaffUser | null): boolean {
  if (!user) return false;
  return user.role === "General Manager" || user.username.toLowerCase() === "admin";
}

export function canUserAccessProperty(user: StaffUser | null, propertyId: PropertyId | "all"): boolean {
  if (!user) return false;
  // General Manager or Admin has unrestricted access to all properties
  if (isUserAdminOrGM(user) || user.propertyAccess === "all") {
    return true;
  }
  // Branch-specific staff cannot access "all" or other branches
  return user.propertyAccess === propertyId;
}

export function canUserViewNotification(user: StaffUser | null, notif: NotificationItem): boolean {
  const isAdmin = isUserAdminOrGM(user);

  // ข้อมูลสำคัญเฉพาะแอดมิน (ADMIN_ONLY) หรือ priority URGENT ที่ระบุ ADMIN_ONLY
  if (notif.audience === "ADMIN_ONLY") {
    return isAdmin;
  }

  // หากเป็นแอดมิน/GM สามารถดูได้ทุกการแจ้งเตือน
  if (isAdmin) {
    return true;
  }

  // หากไม่ได้ล็อกอิน และข้อความไม่ได้ล็อก ADMIN_ONLY หรือ BRANCH_ONLY ให้ดูได้
  if (!user) {
    return notif.audience !== "BRANCH_ONLY";
  }

  // หากระบุเป็น BRANCH_ONLY หรือข้อความระบุสาขาเฉพาะ
  if (notif.audience === "BRANCH_ONLY" || notif.propertyId !== "all") {
    // ผู้ใช้เข้าถึงได้ทุกสาขา
    if (user.propertyAccess === "all") return true;
    // ผู้ใช้เข้าถึงเฉพาะสาขาที่ตรงกัน
    return notif.propertyId === "all" || user.propertyAccess === notif.propertyId;
  }

  // ข้อมูลทั่วไป (ALL)
  return true;
}

export interface Property {
  id: PropertyId;
  name: string;
  nameTh: string;
  tagline: string;
  location: string;
  phone: string;
  email: string;
  coverImage: string;
  totalRooms: number;
}

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";

export type RoomType = 
  | "Double Bed Room"
  | "Family Room"
  | "Deluxe Villa"
  | "Pool Villa Suite"
  | "Family Pool Villa"
  | "Executive Grand Villa"
  | "Meeting & Event Hall (ห้องประชุม/จัดเลี้ยง)"
  | string;

export interface Room {
  id: string;
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
  amenities: string[];
  currentBookingId?: string;
  guestName?: string;
}

export type BookingSource = 
  | "Booking.com"
  | "Agoda"
  | "Airbnb"
  | "Expedia"
  | "Trip.com"
  | "CentralReservationsCalls"
  | "CentralReservationsEmail"
  | "DirectWebsitePostpay"
  | "DirectWebsitePrepay"
  | "HotelOfflinePostpay"
  | "HotelOfflinePrepay"
  | "HotelWalk-in"
  | "Walk-in"
  | "Direct Call"
  | "Facebook / LINE";

export type BookingStatus = "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";

export interface RoomSegment {
  id: string;
  roomId: string;
  roomNumber: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  roomRate?: number;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  propertyId: PropertyId;
  roomId: string;
  roomNumber: string;
  roomSegments?: RoomSegment[];
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  source: BookingSource;
  status: BookingStatus;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  estimatedTime: string;
  adults: number;
  kids: number;
  hasExtraBed: boolean;
  extraBedCount: number;
  extraBedRate: number; // per night
  meetingSession?: "morning" | "afternoon" | "full_day";
  specialRequests?: string;
  colorTag?: string; // Hex or preset color (e.g., #f59e0b, #3b82f6, #8b5cf6, #ec4899, #10b981)
  companyName?: string; // Company / Organization or Group Booker name
  groupBookingId?: string; // Shared identifier for group/company bookings
  totalNights: number;
  roomRate: number;
  roomTotal: number;
  extraBedTotal: number;
  posChargesTotal: number;
  grandTotal: number;
  depositPaid: number;
  balanceDue: number;
  paymentMethod?: "PROMPTPAY_QR" | "CASH" | "CREDIT_CARD";
  slipImage?: string; // Base64 data URL or photo slip
  guestIdCardImage?: string; // ID card or passport photo (Base64)
  guestSignatureImage?: string; // E-signature (Base64 data URL)
  checkedInAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  cancellationFee?: number;
  cancellationReason?: string;
  createdAt: string;
}

export type MenuCategory = "FOOD" | "BEVERAGE" | "MINIBAR" | "SPECIAL_SET";

export interface MenuItem {
  id: string;
  propertyId: PropertyId;
  name: string;
  category: MenuCategory;
  price: number;
  image: string;
  isAvailable: boolean;
  description: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialNote?: string;
}

export interface RoomOrder {
  id: string;
  orderNumber: string;
  propertyId: PropertyId;
  roomId: string;
  roomNumber: string;
  bookingId?: string;
  guestName?: string;
  items: OrderItem[];
  totalAmount: number;
  isRoomCharge: boolean;
  paymentMethod: "ROOM_CHARGE" | "CASH" | "PROMPTPAY";
  status: "COMPLETED" | "PREPARING";
  slipImage?: string;
  guestSignature?: string;
  guestConfirmed?: boolean;
  guestConfirmedAt?: string;
  orderNotes?: string;
  createdAt: string;
}

export interface PMSBackupData {
  version: string;
  timestamp: string;
  exportedBy?: string;
  properties: Property[];
  rooms: Room[];
  bookings: Booking[];
  menuItems: MenuItem[];
  orders: RoomOrder[];
  promptPayConfigs?: Record<PropertyId, PropertyPromptPayConfig>;
}

export type DatabaseProviderType = 
  | "POSTGRES_SUPABASE" 
  | "PRISMA_POSTGRES" 
  | "NEON_SERVERLESS" 
  | "REST_REALTIME_API" 
  | "LOCAL_OFFLINE";

export interface DatabaseConfig {
  provider: DatabaseProviderType;
  connectionString: string;
  host?: string;
  databaseName?: string;
  apiKey?: string;
  sslMode: boolean;
  installedAt: string;
  installedBy: string;
  isRealtimeSync: boolean;
  syncIntervalSeconds: number;
}

// ==========================================
// OTA Channel Manager, Room Mapping & 2-Way Sync Types
// ==========================================
export type OTAChannelId = "booking_com" | "agoda" | "expedia" | "airbnb" | "trip_com";

export interface OTARoomMapping {
  roomId: string;
  roomNumber: string;
  roomName: string;
  propertyId: PropertyId;
  channelRoomId: string;
  channelRoomName: string;
  ratePlanId: string;
  isSynced: boolean;
}

export interface OTAChannelConfig {
  id: OTAChannelId;
  name: string;
  codeName: string;
  status: "connected" | "disconnected" | "syncing" | "error";
  hotelId: string;
  username: string;
  apiKey: string;
  webhookUrl: string;
  autoCloseInventory: boolean;
  autoImportBookings: boolean;
  lastSyncTime: string | null;
  connectedAt: string | null;
  activeRatePlan?: string;
  mappedRoomCount?: number;
  roomMappings?: OTARoomMapping[];
}

export interface OTASyncLog {
  id: string;
  timestamp: string;
  channel: string;
  channelId?: OTAChannelId;
  type: "IMPORT_BOOKING" | "CLOSE_INVENTORY" | "OPEN_INVENTORY" | "PRICE_SYNC" | "CHANNEL_CONNECT" | "WEBHOOK_EVENT" | "TELEGRAM_NOTIFY";
  status: "SUCCESS" | "FAILED" | "WARNING";
  details: string;
  bookingNumber?: string;
  roomNumber?: string;
}

// ==========================================
// Telegram Bot & Notification Center Types
// ==========================================
export interface TelegramConfig {
  botToken: string;
  chatId: string;
  botUsername: string;
  isEnabled: boolean;
  notifyOnNewBooking: boolean;
  notifyOnCheckIn: boolean;
  notifyOnCheckOut: boolean;
  notifyOnOTABlock: boolean;
  lastTestedAt: string | null;
}

export type NotificationType = "BOOKING_NEW" | "BOOKING_UPDATE" | "OTA_BLOCK" | "CHECK_IN" | "CHECK_OUT" | "PAYMENT_RECEIVED" | "SYSTEM_ALERT";

export type NotificationAudience = "ALL" | "ADMIN_ONLY" | "BRANCH_ONLY";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface NotificationItem {
  id: string;
  propertyId: PropertyId | "all";
  title: string;
  message: string;
  type: NotificationType;
  audience?: NotificationAudience; // "ALL" = ทุกคน, "ADMIN_ONLY" = เฉพาะแอดมิน/GM, "BRANCH_ONLY" = ผู้ดูแลสาขานั้น
  priority?: NotificationPriority; // "URGENT" / "HIGH" / "NORMAL" / "LOW"
  source?: string;
  bookingNumber?: string;
  roomNumber?: string;
  amount?: number;
  timestamp: string;
  isRead: boolean;
  telegramSent: boolean;
}

// ==========================================
// Room Availability & Stop Sell / Block Rules
// ==========================================
export interface RoomBlockRule {
  id: string;
  propertyId: PropertyId;
  date: string; // YYYY-MM-DD
  targetType: "ALL" | "ROOM_TYPE" | "ROOM";
  roomType?: string;
  roomId?: string;
  isClosed: boolean;
  availableOverride?: number;
  reason?: string;
  updatedAt: string;
}

// ==========================================
// Dynamic Pricing & Seasonal Rate Rules
// ==========================================
export type PricingRuleType = 
  | "FESTIVAL"       // เทศกาลพิเศษ เช่น ลอยกระทงสุโขทัย, ปีใหม่, สงกรานต์
  | "DAY_OF_WEEK"    // วันในสัปดาห์ เช่น ศุกร์-เสาร์
  | "OCCUPANCY"      // อัตราการเข้าพัก เช่น ยอดจองเกิน 70% หรือ 85%
  | "LAST_MINUTE"    // จองวันเดียวกัน / กระตุ้นยอดขาย
  | "SEASONAL";      // ไฮซีซั่น / โลว์ซีซั่น

export interface DynamicPricingRule {
  id: string;
  name: string;
  type: PricingRuleType;
  propertyId: PropertyId | "all";
  roomType?: string | "all";
  adjustmentType: "PERCENT" | "FIXED_AMOUNT";
  adjustmentValue: number; // e.g. +50 for +50%, +500 for +500 THB, -15 for -15%
  startDate?: string;      // YYYY-MM-DD
  endDate?: string;        // YYYY-MM-DD
  daysOfWeek?: number[];   // [0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat]
  minOccupancyPercent?: number; // e.g. 70 for >70%
  minStayNights?: number;  // e.g. 2 nights
  channels: (OTAChannelId | "direct")[];
  isActive: boolean;
  priority: number;        // 1 (highest) to 10
  description: string;
  updatedAt: string;
}

// ==========================================
// PromptPay QR & Branch Payment Configuration
// ==========================================
export type PromptPayTargetType = "BILLER_ID" | "PHONE" | "TAX_ID";

export interface PropertyPromptPayConfig {
  propertyId: PropertyId;
  propertyName: string;
  isActive: boolean;
  type: PromptPayTargetType;
  promptPayId: string;
  merchantName: string;
  bankName: string;
  accountNumberMasked: string;
  customQrImage?: string;
  autoFillAmount: boolean;
  note?: string;
}

// ==========================================
// Room Types & Capacity Management (ZUZU-style)
// ==========================================
export interface RoomTypeConfig {
  id: string;
  propertyId: PropertyId;
  name: string;
  totalRooms: number;
  maxOccupancy: number;
  maxAdults: number;
  maxKids: number;
  basePrice: number;
  description?: string;
  isActive: boolean;
}

// ==========================================
// Promotions & Deals Management (ZUZU-style)
// ==========================================
export interface PromotionItem {
  id: string;
  propertyId: PropertyId | "all";
  name: string;
  details: string;
  otaChannels: string[];
  roomTypes: string[];
  ratePlans: string[];
  isAutoPromoEligible: boolean;
  isActive: boolean;
  discountType: "PERCENT" | "FIXED_AMOUNT";
  discountValue: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// ==========================================
// Rate Change Logs / Audit Trail
// ==========================================
export interface RateChangeLog {
  id: string;
  timestamp: string;
  userName: string;
  propertyId: PropertyId;
  roomType: string;
  ratePlan: string;
  oldRate: number;
  newRate: number;
  reason: string;
}

// ==========================================
// Market Pricing & Competitor Intelligence
// ==========================================
export interface MarketCompetitor {
  id: string;
  name: string;
  color: string;
  avgPrice: number;
  isSelected: boolean;
}

// ==========================================
// Housekeeping Management
// ==========================================
export type HousekeepingStatus = "CLEAN" | "DIRTY" | "INSPECTING" | "OUT_OF_ORDER";

export interface HousekeepingTask {
  id: string;
  propertyId: PropertyId;
  roomId: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  status: HousekeepingStatus;
  assignedStaff?: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  guestStatus: "VACANT" | "CHECK_IN_TODAY" | "STAY_OVER" | "CHECK_OUT_TODAY";
  note?: string;
  lastCleanedAt?: string;
}
