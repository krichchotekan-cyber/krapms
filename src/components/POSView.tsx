"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { MenuItem, MenuCategory, OrderItem } from "@/types/pms";
import { formatCurrency } from "@/lib/utils";
import { 
  Utensils, 
  Coffee, 
  Wine, 
  Sparkles, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Receipt,
  QrCode,
  Banknote,
  Send,
  Hotel,
  ShoppingBag,
  ChevronUp,
  X,
  PenLine,
  ShieldCheck
} from "lucide-react";
import { PromptPayPaymentModal } from "@/components/PromptPayPaymentModal";
import { SignaturePad } from "@/components/SignaturePad";

export function POSView() {
  const { filteredRooms, menuItems, addOrder, activePropertyId } = usePMS();
  
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | "ALL">("ALL");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [targetRoomId, setTargetRoomId] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"ROOM_CHARGE" | "CASH" | "PROMPTPAY">("ROOM_CHARGE");
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [lastOrderNumber, setLastOrderNumber] = useState<string>("");
  const [lastPaymentMethod, setLastPaymentMethod] = useState<string>("ROOM_CHARGE");
  const [lastOrderAmount, setLastOrderAmount] = useState<number>(0);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // Mobile Shopping Cart Drawer / Sheet State
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);

  // Room Charge Confirmation & Digital Signature State
  const [isRoomChargeConfirmOpen, setIsRoomChargeConfirmOpen] = useState<boolean>(false);
  const [roomChargeSignature, setRoomChargeSignature] = useState<string | null>(null);
  const [guestAcknowledged, setGuestAcknowledged] = useState<boolean>(true);
  const [orderNotes, setOrderNotes] = useState<string>("");

  // Only occupied rooms can have room charge
  const occupiedRooms = filteredRooms.filter((r) => r.status === "OCCUPIED");
  
  // Available menu items for current property (or both)
  const displayMenuItems = menuItems.filter((item) => {
    const matchesProperty = activePropertyId === "all" || item.propertyId === activePropertyId;
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesProperty && matchesCat;
  });

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.menuItemId === menuItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const executeOrderCreation = (
    slipUrl?: string,
    signature?: string,
    confirmed?: boolean,
    notes?: string
  ) => {
    const selectedRoom = filteredRooms.find((r) => r.id === targetRoomId);

    const newOrderData = {
      propertyId: selectedRoom ? selectedRoom.propertyId : (activePropertyId === "all" ? "bugaan" : activePropertyId),
      roomId: targetRoomId || "DIRECT",
      roomNumber: selectedRoom ? selectedRoom.roomNumber : "หน้าเคาน์เตอร์",
      bookingId: selectedRoom?.currentBookingId,
      guestName: selectedRoom?.guestName || "ลูกค้าทั่วไป",
      items: cart,
      totalAmount: cartTotal,
      isRoomCharge: paymentType === "ROOM_CHARGE",
      paymentMethod: paymentType,
      status: "COMPLETED" as const,
      slipImage: slipUrl,
      guestSignature: signature || roomChargeSignature || undefined,
      guestConfirmed: confirmed !== undefined ? confirmed : (paymentType === "ROOM_CHARGE"),
      guestConfirmedAt: paymentType === "ROOM_CHARGE" ? new Date().toISOString() : undefined,
      orderNotes: notes || orderNotes || undefined,
    };

    const createdOrder = addOrder(newOrderData);
    setLastOrderNumber(createdOrder.orderNumber);
    setLastPaymentMethod(paymentType);
    setLastOrderAmount(cartTotal);
    setOrderSuccess(true);
    setCart([]);
    setIsMobileCartOpen(false);
    setIsRoomChargeConfirmOpen(false);
    setRoomChargeSignature(null);
    setOrderNotes("");
  };

  const handleCheckoutOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (paymentType === "ROOM_CHARGE") {
      if (!targetRoomId) {
        alert("กรุณาเลือกรหัสห้องพักที่ต้องการชาร์จค่าบริการ");
        return;
      }
      // Open the Room Charge Confirmation & Signature Dialog
      setIsRoomChargeConfirmOpen(true);
      return;
    }

    if (paymentType === "PROMPTPAY") {
      setIsQrModalOpen(true);
      return;
    }

    executeOrderCreation();
  };

  const renderCartContent = (isMobileSheet: boolean = false) => {
    return (
      <form onSubmit={handleCheckoutOrder} className="space-y-4">
        {/* Cart Item List */}
        <div className={`space-y-2.5 overflow-y-auto pr-1 ${isMobileSheet ? "max-h-60" : "max-h-[360px]"}`}>
          {cart.length === 0 ? (
            <div className="py-8 text-center text-stone-400">
              <ShoppingBag className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-xs">ยังไม่มีรายการในตะกร้า</p>
              <p className="text-[10px] text-stone-400 mt-1">
                คลิกเลือกเมนูอาหารหรือเครื่องดื่มเพื่อสั่งซื้อ
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.menuItemId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/60 dark:border-stone-800 gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-stone-900 dark:text-white truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
                    {formatCurrency(item.price)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.menuItemId, -1)}
                    className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 text-stone-600 dark:text-stone-300 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-stone-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.menuItemId, 1)}
                    className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 text-stone-600 dark:text-stone-300 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg cursor-pointer ml-1"
                    title="ลบรายการนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment & Room Selector */}
        {cart.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
            {/* Total Price Row */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-stone-500">ยอดรวมทั้งสิ้น (Total):</span>
              <span className="text-base font-bold text-stone-900 dark:text-white font-serif">
                {formatCurrency(cartTotal)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300">
                วิธีการชำระเงิน
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentType("ROOM_CHARGE")}
                  className={`p-2 rounded-xl text-center border text-[11px] font-bold flex flex-col items-center gap-1 transition-all min-h-[44px] cursor-pointer ${
                    paymentType === "ROOM_CHARGE"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-stone-400"
                  }`}
                >
                  <Hotel className="w-4 h-4" />
                  <span>ชาร์จเข้าห้อง</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("PROMPTPAY")}
                  className={`p-2 rounded-xl text-center border text-[11px] font-bold flex flex-col items-center gap-1 transition-all min-h-[44px] cursor-pointer ${
                    paymentType === "PROMPTPAY"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-stone-400"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>พร้อมเพย์ QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("CASH")}
                  className={`p-2 rounded-xl text-center border text-[11px] font-bold flex flex-col items-center gap-1 transition-all min-h-[44px] cursor-pointer ${
                    paymentType === "CASH"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-stone-400"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>เงินสด</span>
                </button>
              </div>
            </div>

            {/* If Room Charge: Select Occupied Room */}
            {paymentType === "ROOM_CHARGE" && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs">
                <label className="block font-bold text-amber-900 dark:text-amber-200">
                  เลือกห้องพักเป้าหมาย (Occupied Room) *
                </label>
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-900 text-xs font-semibold text-stone-900 dark:text-white"
                >
                  <option value="">-- กรุณาเลือกห้องพักที่มีผู้เข้าพัก --</option>
                  {occupiedRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      ห้อง {room.roomNumber} - {room.guestName || "ผู้เข้าพัก"} ({room.propertyId === "bugaan" ? "Bu-Gaan" : "Thanawong"})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                  เมื่อกดยืนยัน ระบบจะเปิดหน้าต่างบันทึกลายเซ็นเพื่อเป็นหลักฐานการชำระตอนเช็คเอาต์
                </p>
              </div>
            )}

            {/* Submit / Checkout Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]"
            >
              <Send className="w-4 h-4" />
              <span>
                {paymentType === "ROOM_CHARGE"
                  ? `ยืนยันและบันทึกชาร์จเข้าห้อง (${formatCurrency(cartTotal)})`
                  : `บันทึกคำสั่งซื้อ & ชำระเงิน (${formatCurrency(cartTotal)})`}
              </span>
            </button>
          </div>
        )}
      </form>
    );
  };

  return (
    <div className="space-y-4">
      {orderSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold">
                บันทึกคำสั่งซื้อ #{lastOrderNumber} เรียบร้อยแล้ว!
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                {lastPaymentMethod === "ROOM_CHARGE"
                  ? `ชาร์จยอด ${formatCurrency(lastOrderAmount)} เข้าบิลห้องพัก (Folio) พร้อมหลักฐานลายเซ็นเรียบร้อย`
                  : `บันทึกยอดชำระ ${formatCurrency(lastOrderAmount)} สำเร็จ`}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOrderSuccess(false)}
            className="p-1.5 text-emerald-700 hover:text-emerald-900 dark:hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left Column: Menu Items & Categories (8 Cols) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[44px] ${
              selectedCategory === "ALL"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white dark:bg-[#101c42] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800"
            }`}
          >
            ทั้งหมด (All Menus)
          </button>
          <button
            onClick={() => setSelectedCategory("FOOD")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[44px] ${
              selectedCategory === "FOOD"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white dark:bg-[#101c42] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>อาหารคาว (Food)</span>
          </button>
          <button
            onClick={() => setSelectedCategory("BEVERAGE")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[44px] ${
              selectedCategory === "BEVERAGE"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white dark:bg-[#101c42] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800"
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>เครื่องดื่ม (Beverages)</span>
          </button>
          <button
            onClick={() => setSelectedCategory("SPECIAL_SET")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[44px] ${
              selectedCategory === "SPECIAL_SET"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white dark:bg-[#101c42] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>เซ็ตพรีเมียม / Floating</span>
          </button>
          <button
            onClick={() => setSelectedCategory("MINIBAR")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[44px] ${
              selectedCategory === "MINIBAR"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white dark:bg-[#101c42] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800"
            }`}
          >
            <Wine className="w-3.5 h-3.5" />
            <span>มินิบาร์ (Minibar)</span>
          </button>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayMenuItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#101c42] rounded-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div>
                {/* Image */}
                <div className="relative h-36 w-full bg-stone-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-stone-900/80 backdrop-blur-xs text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                    {formatCurrency(item.price)}
                  </div>
                </div>

                <div className="p-3.5">
                  <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="p-3.5 pt-0">
                <button
                  onClick={() => addToCart(item)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มลงออเดอร์</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Right Column: Desktop POS Cart & Room Charge Action (>= lg) */}
      <div className="hidden lg:block lg:col-span-5 xl:col-span-4 bg-white dark:bg-[#101c42] rounded-3xl border border-amber-300/40 dark:border-amber-800/40 p-5 shadow-xl sticky top-24">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
              ใบเสร็จ / รายการสั่ง (POS Cart)
            </h3>
          </div>
          <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
            {cart.reduce((sum, i) => sum + i.quantity, 0)} รายการ
          </span>
        </div>

        {/* Shared Cart Content */}
        {renderCartContent(false)}
      </div>
      </div>

      {/* Mobile Floating / Hover Shopping Cart Bar (When items exist in cart) */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-20 left-3 right-3 sm:left-6 sm:right-6 z-40 max-w-lg mx-auto">
          <div 
            onClick={() => setIsMobileCartOpen(true)}
            className="bg-stone-900/95 dark:bg-[#070c1e]/95 text-white backdrop-blur-xl border border-amber-500/40 rounded-2xl p-3 shadow-2xl shadow-black/50 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-400 transition-all select-none ring-2 ring-amber-500/20"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30 shrink-0">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white whitespace-nowrap">
                    ตะกร้าสั่งอาหาร
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">
                    ({cart.reduce((sum, i) => sum + i.quantity, 0)} รายการ)
                  </span>
                </div>
                <div className="text-[11px] text-stone-300 truncate">
                  {paymentType === "ROOM_CHARGE" 
                    ? (targetRoomId ? `ชาร์จห้อง ${filteredRooms.find((r) => r.id === targetRoomId)?.roomNumber || ""}` : "แตะเพื่อเลือกห้องพัก")
                    : paymentType === "PROMPTPAY" ? "พร้อมเพย์ QR" : "เงินสด"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-stone-400 uppercase">ยอดรวม</div>
                <div className="text-sm font-bold text-amber-400 font-serif whitespace-nowrap">
                  {formatCurrency(cartTotal)}
                </div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs">
                <span>ดูบิล & สั่ง</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cart Bottom Sheet / Drawer */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="fixed inset-0 -z-10" 
            onClick={() => setIsMobileCartOpen(false)}
          />
          <div className="bg-white dark:bg-[#101c42] rounded-t-3xl border-t border-amber-500/30 p-5 max-h-[88vh] overflow-y-auto space-y-3 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Grab Bar */}
            <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mb-1" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                  ใบเสร็จ / ตะกร้าสั่งอาหาร (POS Cart)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)} รายการ
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Shared Cart Content inside Mobile Sheet */}
            {renderCartContent(true)}
          </div>
        </div>
      )}

      {/* Room Charge Confirmation Modal (Guest consent & digital signature) */}
      {isRoomChargeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-[#101c42] rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-amber-500/40 max-h-[92vh] overflow-y-auto my-auto space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Hotel className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                    ยืนยันชาร์จเข้าห้องพัก (Room Charge)
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    บันทึกยอดเข้าบิล Folio เพื่อเรียกเก็บตอนเช็คเอาต์ (Pay at Check-out)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRoomChargeConfirmOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room & Guest Info Card */}
            {(() => {
              const selectedRoom = filteredRooms.find((r) => r.id === targetRoomId);
              return (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 block">ห้องพักเป้าหมาย:</span>
                      <div className="font-serif font-bold text-base text-amber-900 dark:text-amber-200">
                        ห้อง {selectedRoom?.roomNumber || "-"} ({selectedRoom?.propertyId === "bugaan" ? "Bu-Gaan Sukhothai" : "Thanawong Pool Villa"})
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 block">ผู้เข้าพัก:</span>
                      <div className="font-bold text-stone-900 dark:text-white">
                        {selectedRoom?.guestName || "ผู้เข้าพัก"}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/50 flex justify-between text-[11px] text-stone-500 dark:text-stone-400">
                    <span>เวลาสั่งออเดอร์:</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })} {new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Order Items Summary */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-stone-700 dark:text-stone-300 block">
                รายการอาหาร / เครื่องดื่มที่สั่ง ({cart.reduce((s, i) => s + i.quantity, 0)} รายการ):
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-stone-700">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between items-center text-xs">
                    <span className="text-stone-800 dark:text-stone-200 truncate pr-2">
                      {item.name} <span className="text-stone-400 font-semibold">x{item.quantity}</span>
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-white shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-2.5 rounded-xl bg-amber-100/60 dark:bg-amber-950/50 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                <span>ยอดรวมที่บันทึกเข้าบิลห้องพัก (Folio Total):</span>
                <span className="text-base font-serif text-amber-700 dark:text-amber-400">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
            </div>

            {/* Acknowledgment Consent Checkbox */}
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-stone-700 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guestAcknowledged}
                  onChange={(e) => setGuestAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded-md border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                  ผู้เข้าพักรับทราบและยินยอมให้ชาร์จยอดค่าบริการอาหาร/มินิบาร์นี้เข้าบิลห้องพัก (Folio) และตกลงชำระยอดรวม ณ เวลาเช็คเอาต์
                </span>
              </label>
            </div>

            {/* Digital Signature Pad */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <PenLine className="w-3.5 h-3.5 text-amber-600" />
                  <span>ลายมือชื่อลูกค้ายืนยัน (Guest Digital Signature)</span>
                </span>
                <span className="text-[10px] text-stone-400">
                  ใช้นิ้วเซ็นเพื่อเป็นหลักฐาน
                </span>
              </div>
              <div className="border border-stone-300 dark:border-stone-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <SignaturePad
                  initialSignature={roomChargeSignature || undefined}
                  onChange={(sig) => setRoomChargeSignature(sig)}
                  height={130}
                />
              </div>
            </div>

            {/* Delivery / Server Note */}
            <div className="space-y-1 text-xs">
              <label className="block text-stone-600 dark:text-stone-400 font-medium">
                หมายเหตุการจัดส่ง / ผู้รับออเดอร์ (Optional Note):
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="เช่น เสิร์ฟที่ริมสระว่ายน้ำ, โทรสั่งจากโทรศัพท์ในห้อง..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Modal Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRoomChargeConfirmOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer transition-colors min-h-[44px]"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                disabled={!guestAcknowledged}
                onClick={() => executeOrderCreation(undefined, roomChargeSignature || undefined, guestAcknowledged, orderNotes)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-500/25 cursor-pointer transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันชาร์จเข้าห้อง ({formatCurrency(cartTotal)})</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PromptPay QR & Slip Verification Modal for POS Order */}
      <PromptPayPaymentModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        amount={cartTotal}
        title={`ชำระค่าอาหาร/เครื่องดื่ม POS (${activePropertyId === "thanawong" ? "Thanawong" : "Bu-Gaan"})`}
        roomNumber={filteredRooms.find((r) => r.id === targetRoomId)?.roomNumber || "หน้าเคาน์เตอร์"}
        guestName={filteredRooms.find((r) => r.id === targetRoomId)?.guestName || "ลูกค้าทั่วไป"}
        propertyId={activePropertyId !== "all" ? activePropertyId : "bugaan"}
        onPaymentSuccess={(slipUrl) => {
          executeOrderCreation(slipUrl);
        }}
      />

    </div>
  );
}
