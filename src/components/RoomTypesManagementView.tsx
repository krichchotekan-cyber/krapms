"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { RoomTypeConfig, PropertyId } from "@/types/pms";
import { initialRoomTypeConfigs } from "@/lib/mockData";
import { 
  Building2, 
  Palmtree, 
  Plus, 
  CalendarDays, 
  Settings, 
  Users, 
  User, 
  Baby, 
  BedDouble, 
  Edit, 
  Trash2, 
  Check, 
  X,
  AlertCircle
} from "lucide-react";

interface RoomTypesManagementViewProps {
  onGoToRateGrid?: () => void;
}

export function RoomTypesManagementView({ onGoToRateGrid }: RoomTypesManagementViewProps = {}) {
  const { activePropertyId, setActivePropertyId, properties } = usePMS();

  const currentPropId: PropertyId = activePropertyId === "all" ? "bugaan" : activePropertyId;
  const currentProperty = properties.find((p) => p.id === currentPropId) || properties[0];

  const [roomTypes, setRoomTypes] = useState<RoomTypeConfig[]>(initialRoomTypeConfigs);
  const [hideInactive, setHideInactive] = useState<boolean>(true);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingType, setEditingType] = useState<RoomTypeConfig | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    totalRooms: 4,
    maxOccupancy: 3,
    maxAdults: 2,
    maxKids: 1,
    basePrice: 2000,
    description: "",
    isActive: true,
  });

  // Filtered room types by property
  const filteredTypes = roomTypes.filter((rt) => {
    if (rt.propertyId !== currentPropId) return false;
    if (hideInactive && !rt.isActive) return false;
    return true;
  });

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingType(null);
    setFormData({
      name: "",
      totalRooms: 4,
      maxOccupancy: 3,
      maxAdults: 2,
      maxKids: 1,
      basePrice: 2000,
      description: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (rt: RoomTypeConfig) => {
    setEditingType(rt);
    setFormData({
      name: rt.name,
      totalRooms: rt.totalRooms,
      maxOccupancy: rt.maxOccupancy,
      maxAdults: rt.maxAdults,
      maxKids: rt.maxKids,
      basePrice: rt.basePrice,
      description: rt.description || "",
      isActive: rt.isActive,
    });
    setIsModalOpen(true);
  };

  // Save room type
  const handleSave = () => {
    if (!formData.name.trim()) {
      alert("กรุณากรอกชื่อประเภทห้องพัก");
      return;
    }

    if (editingType) {
      setRoomTypes((prev) =>
        prev.map((item) =>
          item.id === editingType.id
            ? {
                ...item,
                name: formData.name,
                totalRooms: formData.totalRooms,
                maxOccupancy: formData.maxOccupancy,
                maxAdults: formData.maxAdults,
                maxKids: formData.maxKids,
                basePrice: formData.basePrice,
                description: formData.description,
                isActive: formData.isActive,
              }
            : item
        )
      );
    } else {
      const newType: RoomTypeConfig = {
        id: `rt-${Date.now()}`,
        propertyId: currentPropId,
        name: formData.name,
        totalRooms: formData.totalRooms,
        maxOccupancy: formData.maxOccupancy,
        maxAdults: formData.maxAdults,
        maxKids: formData.maxKids,
        basePrice: formData.basePrice,
        description: formData.description,
        isActive: formData.isActive,
      };
      setRoomTypes((prev) => [...prev, newType]);
    }
    setIsModalOpen(false);
  };

  // Delete room type
  const handleDelete = (id: string, name: string) => {
    if (confirm(`คุณต้องการลบประเภทห้องพัก "${name}" ใช่หรือไม่?`)) {
      setRoomTypes((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls (Matching Images 4 & 5) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0c142e] p-5 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100">
              ห้องพัก
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900/40">
              {currentProperty.nameTh}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            กำหนดโครงสร้างประเภทห้องพัก จำนวนห้อง และขีดความสามารถในการรองรับผู้เข้าพัก (Capacity Setup)
          </p>
        </div>

        {/* Action Buttons & Property Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
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

          {/* Quick link button to Rate Allotment Grid (Orange button in screenshot) */}
          {onGoToRateGrid && (
            <button
              onClick={onGoToRateGrid}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>ปฏิทินห้องที่เปิดให้จอง</span>
            </button>
          )}

          {/* Add Room Type button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่ม</span>
          </button>
        </div>
      </div>

      {/* Checkbox filter */}
      <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 px-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideInactive}
            onChange={(e) => setHideInactive(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-stone-300 dark:border-slate-700 focus:ring-emerald-500"
          />
          <span>ซ่อนห้องที่ไม่เปิดให้จอง</span>
        </label>
        <span className="text-[11px] text-stone-400">
          แสดง {filteredTypes.length} ประเภทห้องพัก
        </span>
      </div>

      {/* Room Types Table (Exact replica of Images 4 & 5) */}
      <div className="bg-white dark:bg-[#0c142e] rounded-2xl border border-stone-200 dark:border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-stone-50 dark:bg-slate-900 border-b border-stone-200 dark:border-slate-800 text-xs text-stone-600 dark:text-stone-400">
                <th className="p-3.5 font-bold">ประเภทห้อง</th>
                <th className="p-3.5 font-bold text-center">จำนวนห้อง</th>
                <th className="p-3.5 font-bold text-center">จำนวนที่เข้าพักได้สูงสุด</th>
                <th className="p-3.5 font-bold text-center">จำนวนผู้ใหญ่ที่เข้าพักได้สูงสุด</th>
                <th className="p-3.5 font-bold text-center">จำนวนเด็กที่เข้าพักได้</th>
                <th className="p-3.5 font-bold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-slate-800 text-xs">
              {filteredTypes.map((rt) => (
                <tr key={rt.id} className="hover:bg-amber-50/20 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                          {rt.name}
                        </span>
                        {rt.description && (
                          <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                            {rt.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-center font-bold text-stone-800 dark:text-stone-200">
                    {rt.totalRooms}
                  </td>
                  <td className="p-3.5 text-center font-semibold text-stone-700 dark:text-stone-300">
                    {rt.maxOccupancy}
                  </td>
                  <td className="p-3.5 text-center font-semibold text-stone-700 dark:text-stone-300">
                    {rt.maxAdults}
                  </td>
                  <td className="p-3.5 text-center font-semibold text-stone-700 dark:text-stone-300">
                    {rt.maxKids}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(rt)}
                        className="p-1.5 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="แก้ไขประเภทห้อง"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rt.id, rt.name)}
                        className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        title="ลบประเภทห้อง"
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
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0c142e] rounded-2xl max-w-lg w-full p-6 border border-stone-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {editingType ? "แก้ไขประเภทห้องพัก" : "เพิ่มประเภทห้องพักใหม่"}
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
                  ชื่อประเภทห้องพัก:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น Deluxe Double Room, Suite Room..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    จำนวนห้องทั้งหมด:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalRooms}
                    onChange={(e) => setFormData({ ...formData, totalRooms: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    ผู้เข้าพักสูงสุด (รวม):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxOccupancy}
                    onChange={(e) => setFormData({ ...formData, maxOccupancy: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    ผู้ใหญ่สูงสุด:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxAdults}
                    onChange={(e) => setFormData({ ...formData, maxAdults: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    เด็กสูงสุด:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxKids}
                    onChange={(e) => setFormData({ ...formData, maxKids: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  คำอธิบายหรือจุดเด่นห้อง:
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ระบุสิ่งอำนวยความสะดวก หรือขนาดห้อง..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-stone-300 dark:border-slate-700"
                />
                <label htmlFor="isActiveCheck" className="text-stone-700 dark:text-stone-300 font-medium">
                  เปิดให้จองในระบบ (Active)
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
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
