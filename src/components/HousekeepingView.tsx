"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { initialHousekeepingTasks } from "@/lib/mockData";
import { HousekeepingTask, HousekeepingStatus, PropertyId } from "@/types/pms";
import { 
  Building2, 
  Palmtree, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  User, 
  Search, 
  Filter, 
  Edit3, 
  Check, 
  X,
  BedDouble,
  ShieldAlert
} from "lucide-react";

export function HousekeepingView() {
  const { activePropertyId, setActivePropertyId, properties } = usePMS();

  const currentPropId: PropertyId = activePropertyId === "all" ? "bugaan" : activePropertyId;
  const currentProperty = properties.find((p) => p.id === currentPropId) || properties[0];

  const [tasks, setTasks] = useState<HousekeepingTask[]>(initialHousekeepingTasks);
  const [statusFilter, setStatusFilter] = useState<HousekeepingStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<HousekeepingTask | null>(null);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (t.propertyId !== currentPropId) return false;
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (searchTerm) {
      const matchRoom = t.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = t.roomType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStaff = t.assignedStaff?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchRoom && !matchType && !matchStaff) return false;
    }
    return true;
  });

  // Summary counts
  const propertyTasks = tasks.filter((t) => t.propertyId === currentPropId);
  const cleanCount = propertyTasks.filter((t) => t.status === "CLEAN").length;
  const dirtyCount = propertyTasks.filter((t) => t.status === "DIRTY").length;
  const inspectingCount = propertyTasks.filter((t) => t.status === "INSPECTING").length;
  const outOfOrderCount = propertyTasks.filter((t) => t.status === "OUT_OF_ORDER").length;

  // Quick status update
  const handleQuickStatus = (id: string, newStatus: HousekeepingStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: newStatus,
              lastCleanedAt: newStatus === "CLEAN" ? new Date().toISOString().replace("T", " ").substring(0, 19) : t.lastCleanedAt,
            }
          : t
      )
    );
  };

  // Save edit modal
  const handleSaveEdit = () => {
    if (!editingTask) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === editingTask.id ? editingTask : t))
    );
    setEditingTask(null);
  };

  return (
    <div className="space-y-6">
      {/* Header and Property Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#0c142e] p-5 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100">
              ตารางทำความสะอาด (Housekeeping)
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900/40">
              {currentProperty.nameTh}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            ติดตามสถานะความสะอาด มอบหมายงานแม่บ้าน และจัดการคิวทำความสะอาดห้องพัก
          </p>
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
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setStatusFilter(statusFilter === "CLEAN" ? "ALL" : "CLEAN")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "CLEAN"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-sm"
              : "bg-white dark:bg-[#0c142e] border-stone-200 dark:border-slate-800 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">สะอาดพร้อมขาย</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {cleanCount}
          </div>
          <span className="text-[10px] text-stone-400">Clean & Ready</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "DIRTY" ? "ALL" : "DIRTY")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "DIRTY"
              ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500 shadow-sm"
              : "bg-white dark:bg-[#0c142e] border-stone-200 dark:border-slate-800 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">รอทำความสะอาด</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {dirtyCount}
          </div>
          <span className="text-[10px] text-stone-400">Dirty / In Queue</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "INSPECTING" ? "ALL" : "INSPECTING")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "INSPECTING"
              ? "bg-blue-50 dark:bg-blue-950/30 border-blue-500 shadow-sm"
              : "bg-white dark:bg-[#0c142e] border-stone-200 dark:border-slate-800 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">กำลังตรวจเช็ค</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {inspectingCount}
          </div>
          <span className="text-[10px] text-stone-400">Inspecting</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "OUT_OF_ORDER" ? "ALL" : "OUT_OF_ORDER")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "OUT_OF_ORDER"
              ? "bg-red-50 dark:bg-red-950/30 border-red-500 shadow-sm"
              : "bg-white dark:bg-[#0c142e] border-stone-200 dark:border-slate-800 hover:border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">ชำรุด/ปิดซ่อม</span>
            <Wrench className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-2">
            {outOfOrderCount}
          </div>
          <span className="text-[10px] text-stone-400">Out of Order</span>
        </div>
      </div>

      {/* Task List / Table */}
      <div className="bg-white dark:bg-[#0c142e] rounded-2xl border border-stone-200 dark:border-slate-800 shadow-md p-5 space-y-4">
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาห้องพัก, ประเภทห้อง หรือชื่อแม่บ้าน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-800 dark:text-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-500">สถานะ:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-800 dark:text-stone-200 font-semibold"
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="DIRTY">รอทำความสะอาด (Dirty)</option>
              <option value="CLEAN">สะอาด (Clean)</option>
              <option value="INSPECTING">กำลังตรวจเช็ค (Inspecting)</option>
              <option value="OUT_OF_ORDER">ชำรุด/ปิดซ่อม (OOO)</option>
            </select>
          </div>
        </div>

        {/* Housekeeping Tasks Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-slate-800 font-bold text-stone-600 dark:text-stone-400">
                <th className="py-3 px-3">ห้องพัก</th>
                <th className="py-3 px-3">สถานะความสะอาด</th>
                <th className="py-3 px-3">สถานะแขก</th>
                <th className="py-3 px-3">ความสำคัญ</th>
                <th className="py-3 px-3">ผู้รับผิดชอบ</th>
                <th className="py-3 px-3">หมายเหตุ</th>
                <th className="py-3 px-3 text-right">ปรับสถานะด่วน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
              {filteredTasks.map((t) => {
                return (
                  <tr key={t.id} className="hover:bg-amber-50/20 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Room */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-sm text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                          {t.roomNumber}
                        </span>
                        <div>
                          <span className="font-bold text-stone-800 dark:text-stone-200 block">
                            {t.roomType}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            ชั้น {t.floor}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          t.status === "CLEAN"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                            : t.status === "DIRTY"
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                            : t.status === "INSPECTING"
                            ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                            : "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>
                          {t.status === "CLEAN" ? "สะอาดพร้อมขาย" :
                           t.status === "DIRTY" ? "รอทำความสะอาด" :
                           t.status === "INSPECTING" ? "กำลังตรวจเช็ค" : "ชำรุด/ปิดซ่อม"}
                        </span>
                      </span>
                    </td>

                    {/* Guest Status */}
                    <td className="py-3.5 px-3 font-semibold text-stone-700 dark:text-stone-300">
                      {t.guestStatus === "CHECK_IN_TODAY" ? (
                        <span className="text-amber-600 font-bold">เช็คอินวันนี้</span>
                      ) : t.guestStatus === "CHECK_OUT_TODAY" ? (
                        <span className="text-rose-600 font-bold">เช็คเอาต์วันนี้</span>
                      ) : t.guestStatus === "STAY_OVER" ? (
                        <span className="text-blue-600">พักต่อ (Stay Over)</span>
                      ) : (
                        <span className="text-stone-400">ห้องว่าง</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          t.priority === "URGENT"
                            ? "bg-red-500 text-white"
                            : t.priority === "HIGH"
                            ? "bg-amber-500 text-white"
                            : "bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>

                    {/* Assigned Staff */}
                    <td className="py-3.5 px-3 font-medium text-stone-800 dark:text-stone-200">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-stone-400" />
                        <span>{t.assignedStaff || "ยังไม่ระบุ"}</span>
                      </div>
                    </td>

                    {/* Note */}
                    <td className="py-3.5 px-3 text-stone-500 max-w-xs truncate" title={t.note}>
                      {t.note || "-"}
                    </td>

                    {/* Quick Status Buttons */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleQuickStatus(t.id, "CLEAN")}
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 font-bold text-[10px]"
                          title="ทำความสะอาดเรียบร้อย"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleQuickStatus(t.id, "DIRTY")}
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 hover:bg-amber-100 font-bold text-[10px]"
                          title="เปลี่ยนเป็นรอทำความสะอาด"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingTask(t)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800"
                          title="แก้ไขรายละเอียด"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0c142e] rounded-2xl max-w-md w-full p-6 border border-stone-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                แก้ไขงานทำความสะอาดห้อง {editingTask.roomNumber}
              </h3>
              <button onClick={() => setEditingTask(null)} className="text-stone-400 hover:text-stone-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  สถานะความสะอาด:
                </label>
                <select
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-800 dark:text-stone-200 font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  <option value="CLEAN">สะอาดพร้อมขาย (Clean)</option>
                  <option value="DIRTY">รอทำความสะอาด (Dirty)</option>
                  <option value="INSPECTING">กำลังตรวจเช็ค (Inspecting)</option>
                  <option value="OUT_OF_ORDER">ชำรุด/ปิดซ่อม (Out of Order)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  ผู้รับผิดชอบ (แม่บ้าน / ช่าง):
                </label>
                <input
                  type="text"
                  value={editingTask.assignedStaff || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, assignedStaff: e.target.value })}
                  placeholder="เช่น แม่บ้าน สมศรี, ช่างวิรัช..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-800 dark:text-stone-200 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  ระดับความสำคัญ:
                </label>
                <select
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-800 dark:text-stone-200 font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  <option value="NORMAL">ปกติ (Normal)</option>
                  <option value="HIGH">ด่วน (High)</option>
                  <option value="URGENT">ด่วนที่สุด (Urgent - แขกเข้าวันนี้)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  หมายเหตุ / อาการชำรุด:
                </label>
                <textarea
                  rows={2}
                  value={editingTask.note || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, note: e.target.value })}
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-800 dark:text-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-slate-800">
              <button
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
