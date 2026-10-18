"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { initialPromotions, initialRateChangeLogs } from "@/lib/mockData";
import { PromotionItem, RateChangeLog, PropertyId } from "@/types/pms";
import { 
  Building2, 
  Palmtree, 
  Plus, 
  Filter, 
  Check, 
  X, 
  CheckCircle2, 
  Tag, 
  History, 
  Clock, 
  Search, 
  Trash2, 
  Edit2, 
  ArrowRight,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { formatCurrency, formatDateThai } from "@/lib/utils";

export function PromotionsManagementView() {
  const { activePropertyId, setActivePropertyId, properties, currentUser } = usePMS();

  const currentPropId: PropertyId = activePropertyId === "all" ? "bugaan" : activePropertyId;
  const currentProperty = properties.find((p) => p.id === currentPropId) || properties[0];

  // Active view: "promotions" or "rate_logs"
  const [activeTab, setActiveTab] = useState<"promotions" | "rate_logs">("promotions");

  // Promotions State
  const [promotions, setPromotions] = useState<PromotionItem[]>(initialPromotions);
  const [rateLogs, setRateLogs] = useState<RateChangeLog[]>(initialRateChangeLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState<number>(50);

  // Modal State for New Promotion
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    details: "",
    otaChannels: "AffiliatesPrepay, AgodaPostpay, Booking.com",
    roomTypes: "Deluxe Double Room, Deluxe Twin Room",
    ratePlans: "Breakfast Included Free Cancellation",
    isAutoPromoEligible: false,
    isActive: true,
    discountValue: 15,
  });

  // Filtered promotions
  const filteredPromos = promotions.filter((p) => {
    if (p.propertyId !== "all" && p.propertyId !== currentPropId) return false;
    if (searchTerm) {
      const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDetails = p.details.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchName && !matchDetails) return false;
    }
    return true;
  });

  // Toggle promo active state
  const togglePromoActive = (id: string) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  // Add new promotion
  const handleCreatePromo = () => {
    if (!formData.name.trim()) {
      alert("กรุณากรอกชื่อโปรโมชั่น");
      return;
    }

    const newPromo: PromotionItem = {
      id: `promo-${Date.now()}`,
      propertyId: currentPropId,
      name: formData.name,
      details: formData.details || formData.name,
      otaChannels: formData.otaChannels.split(",").map((s) => s.trim()),
      roomTypes: formData.roomTypes.split(",").map((s) => s.trim()),
      ratePlans: formData.ratePlans.split(",").map((s) => s.trim()),
      isAutoPromoEligible: formData.isAutoPromoEligible,
      isActive: formData.isActive,
      discountType: "PERCENT",
      discountValue: formData.discountValue,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 19),
    };

    setPromotions([newPromo, ...promotions]);
    setIsModalOpen(false);
    setFormData({
      name: "",
      details: "",
      otaChannels: "AffiliatesPrepay, AgodaPostpay, Booking.com",
      roomTypes: "Deluxe Double Room, Deluxe Twin Room",
      ratePlans: "Breakfast Included Free Cancellation",
      isAutoPromoEligible: false,
      isActive: true,
      discountValue: 15,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Property Selector (Matching Image 2) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#0c142e] p-5 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100">
              {activeTab === "promotions" ? "โปรโมชั่น" : "บันทึกการเปลี่ยนแปลงราคา"}
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900/40">
              {currentProperty.nameTh}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            บริหารจัดการแคมเปญส่วนลด โปรโมชั่น OTA และตรวจสอบประวัติการปรับราคา (Audit Trail)
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subtab Toggle (Promotions vs Rate Change Logs) */}
          <div className="flex items-center bg-stone-100 dark:bg-slate-900 p-1 rounded-xl border border-stone-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("promotions")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "promotions"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>โปรโมชั่น</span>
            </button>
            <button
              onClick={() => setActiveTab("rate_logs")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "rate_logs"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>บันทึกการเปลี่ยนแปลงราคา</span>
            </button>
          </div>

          {/* Property Selector */}
          <div className="flex items-center bg-stone-100 dark:bg-slate-900 p-1 rounded-xl border border-stone-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setActivePropertyId("bugaan")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentPropId === "bugaan"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>บูก้าน</span>
            </button>
            <button
              onClick={() => setActivePropertyId("thanawong")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentPropId === "thanawong"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
              }`}
            >
              <Palmtree className="w-3.5 h-3.5" />
              <span>ธนวงศ์</span>
            </button>
          </div>

          {/* Add Promo Button (Image 2 top right) */}
          {activeTab === "promotions" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มโปรโมชั่น</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === "promotions" ? (
        /* Promotions Table (Matching Image 2) */
        <div className="bg-white dark:bg-[#0c142e] rounded-2xl border border-stone-200 dark:border-slate-800 shadow-md p-5 space-y-4">
          {/* Table Controls (Showing 50, Search, Filter) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-500">แสดง</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-800 dark:text-stone-200 font-bold"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาโปรโมชั่น..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-800 dark:text-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
              <button className="p-2 border border-stone-300 dark:border-slate-700 rounded-xl hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-600 dark:text-stone-300">
                <Filter className="w-3.5 h-3.5 text-orange-500" />
              </button>
            </div>
          </div>

          {/* Main Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px] text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-800 font-bold text-stone-600 dark:text-stone-400">
                  <th className="py-3 px-3">ชื่อ</th>
                  <th className="py-3 px-3">รายละเอียด</th>
                  <th className="py-3 px-3">OTA</th>
                  <th className="py-3 px-3">ประเภทห้อง</th>
                  <th className="py-3 px-3">ประเภทราคา</th>
                  <th className="py-3 px-3 text-center">Eligible for Auto promos</th>
                  <th className="py-3 px-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
                {filteredPromos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-amber-50/20 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-3 font-semibold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                      {promo.name}
                    </td>

                    {/* Details */}
                    <td className="py-3.5 px-3 text-stone-600 dark:text-stone-300">
                      {promo.details}
                    </td>

                    {/* OTA */}
                    <td className="py-3.5 px-3 text-stone-600 dark:text-stone-300 text-[11px]">
                      {promo.otaChannels.join(", ")}
                    </td>

                    {/* Room Types */}
                    <td className="py-3.5 px-3 text-stone-600 dark:text-stone-300 text-[11px]">
                      {promo.roomTypes.join(", ")}
                    </td>

                    {/* Rate Plans */}
                    <td className="py-3.5 px-3 text-stone-600 dark:text-stone-300 text-[11px]">
                      {promo.ratePlans.join(", ")}
                    </td>

                    {/* Eligible for Auto Promos */}
                    <td className="py-3.5 px-3 text-center">
                      {promo.isAutoPromoEligible ? (
                        <span className="inline-flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <Check className="w-4 h-4 font-bold stroke-3" />
                        </span>
                      ) : (
                        <span className="text-stone-300 dark:text-stone-600">-</span>
                      )}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => togglePromoActive(promo.id)}
                        className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                          promo.isActive
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                            : "bg-stone-200 dark:bg-slate-800 text-stone-500"
                        }`}
                      >
                        {promo.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-end gap-1 pt-3 border-t border-stone-100 dark:border-slate-800 text-xs">
            <button className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-slate-800 text-stone-400 cursor-not-allowed">
              Previous
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-orange-500 text-white font-bold">
              1
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-slate-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50">
              Next
            </button>
          </div>
        </div>
      ) : (
        /* Rate Change Logs Table (Image 2 Sub-feature) */
        <div className="bg-white dark:bg-[#0c142e] rounded-2xl border border-stone-200 dark:border-slate-800 shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-100 dark:border-slate-800">
            <h3 className="font-bold text-stone-800 dark:text-stone-200">
              ประวัติการแก้ไขและปรับราคาห้องพักย้อนหลัง (Audit Log)
            </h3>
            <span className="text-stone-400">ทั้งหมด {rateLogs.length} รายการ</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px] text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-800 font-bold text-stone-600 dark:text-stone-400">
                  <th className="py-3 px-3">วันและเวลา</th>
                  <th className="py-3 px-3">ผู้ดำเนินการ</th>
                  <th className="py-3 px-3">ประเภทห้อง & แผนราคา</th>
                  <th className="py-3 px-3 text-center">ราคาเดิม</th>
                  <th className="py-3 px-3 text-center">ราคาใหม่</th>
                  <th className="py-3 px-3">เหตุผล / บันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
                {rateLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-amber-50/20 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-3 text-stone-500 font-mono whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-stone-800 dark:text-stone-200">
                      {log.userName}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-stone-800 dark:text-stone-100 block">
                        {log.roomType}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {log.ratePlan}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-stone-500 line-through">
                      {formatCurrency(log.oldRate)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(log.newRate)}
                    </td>
                    <td className="py-3.5 px-3 text-stone-600 dark:text-stone-400">
                      {log.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Promotion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0c142e] rounded-2xl max-w-lg w-full p-6 border border-stone-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                เพิ่มโปรโมชั่นใหม่
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  ชื่อโปรโมชั่น:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น +15% Special Deal, Flash Sale..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  รายละเอียดโปรโมชั่น:
                </label>
                <input
                  type="text"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="ระบุเงื่อนไขการรับสิทธิ์..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  ช่องทาง OTA ที่เข้าร่วม:
                </label>
                <input
                  type="text"
                  value={formData.otaChannels}
                  onChange={(e) => setFormData({ ...formData, otaChannels: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    ประเภทห้อง:
                  </label>
                  <input
                    type="text"
                    value={formData.roomTypes}
                    onChange={(e) => setFormData({ ...formData, roomTypes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    ส่วนลด (%):
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoPromoCheck"
                  checked={formData.isAutoPromoEligible}
                  onChange={(e) => setFormData({ ...formData, isAutoPromoEligible: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-stone-300 dark:border-slate-700"
                />
                <label htmlFor="autoPromoCheck" className="text-stone-700 dark:text-stone-300 font-medium">
                  Eligible for Auto promos (เข้าร่วมโปรโมชั่นอัตโนมัติ)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreatePromo}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
              >
                สร้างโปรโมชั่น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
