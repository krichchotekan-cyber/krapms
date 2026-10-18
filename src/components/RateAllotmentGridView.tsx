"use client";

import React, { useState, useMemo } from "react";
import { usePMS } from "@/context/PMSContext";
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Unlock, 
  Download, 
  Edit3, 
  Filter, 
  Check, 
  X, 
  Building2, 
  Palmtree, 
  AlertCircle,
  Sparkles,
  CalendarDays,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { PropertyId } from "@/types/pms";
import { formatCurrency } from "@/lib/utils";

interface RatePlanRow {
  id: string;
  name: string;
  planType: string;
  prices: Record<string, number>; // dateStr -> price
}

interface RoomTypeRateData {
  id: string;
  name: string;
  totalRooms: number;
  availableCount: Record<string, number>; // dateStr -> count
  isClosed: Record<string, boolean>; // dateStr -> boolean
  ratePlans: RatePlanRow[];
}

export function RateAllotmentGridView() {
  const { activePropertyId, setActivePropertyId, properties } = usePMS();

  const currentPropId: PropertyId = activePropertyId === "all" ? "bugaan" : activePropertyId;
  const currentProperty = properties.find((p) => p.id === currentPropId) || properties[0];

  // Selected date range (Week window)
  const [currentWeekStart, setCurrentWeekStart] = useState<string>("2026-10-18"); // Sunday 18 Oct 2026
  const [hideClosedRooms, setHideClosedRooms] = useState<boolean>(false);
  const [hideInactivePlans, setHideInactivePlans] = useState<boolean>(false);
  const [collapsedTypes, setCollapsedTypes] = useState<Record<string, boolean>>({});

  // Editing price modal state
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    roomTypeName: string;
    ratePlanName: string;
    date: string;
    price: number;
  }>({
    isOpen: false,
    roomTypeName: "",
    ratePlanName: "",
    date: "",
    price: 0,
  });

  // Locked dates (Master stop sell)
  const [lockedDates, setLockedDates] = useState<Record<string, boolean>>({
    "2026-10-23": true, // Exactly as in screenshot: Friday 23 Oct is red locked stop sell
  });

  // Dates in the 8-day window (Sunday to Sunday as shown in ZUZU screenshot)
  const dateList = useMemo(() => {
    const list: { dateStr: string; dayNameTh: string; dayNum: number; monthNameTh: string }[] = [];
    const base = new Date(currentWeekStart + "T00:00:00");
    const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    
    for (let i = 0; i < 8; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;
      
      list.push({
        dateStr,
        dayNameTh: dayNames[d.getDay()],
        dayNum: d.getDate(),
        monthNameTh: "ตุลาคม",
      });
    }
    return list;
  }, [currentWeekStart]);

  // Mock Grid Matrix Data (Exactly matching Image 3)
  const [matrixData, setMatrixData] = useState<RoomTypeRateData[]>([
    {
      id: "std-double",
      name: "Standard Double Room",
      totalRooms: 2,
      availableCount: {
        "2026-10-18": 1,
        "2026-10-19": 1,
        "2026-10-20": 0,
        "2026-10-21": 2,
        "2026-10-22": 2,
        "2026-10-23": 0,
        "2026-10-24": 2,
        "2026-10-25": 2,
      },
      isClosed: {
        "2026-10-23": true,
      },
      ratePlans: [
        {
          id: "bar-breakfast",
          name: "Breakfast Included",
          planType: "ราคา BAR รายวัน",
          prices: {
            "2026-10-18": 1970.00,
            "2026-10-19": 2145.55,
            "2026-10-20": 1989.00,
            "2026-10-21": 1970.00,
            "2026-10-22": 1987.85,
            "2026-10-23": 2913.52,
            "2026-10-24": 1970.00,
            "2026-10-25": 1971.25,
          },
        },
        {
          id: "non-ref-breakfast",
          name: "Breakfast Included (Non-Ref)",
          planType: "ราคา BAR Non-Refundable",
          prices: {
            "2026-10-18": 1871.50,
            "2026-10-19": 2038.27,
            "2026-10-20": 1889.55,
            "2026-10-21": 1871.50,
            "2026-10-22": 1888.46,
            "2026-10-23": 2767.84,
            "2026-10-24": 1871.50,
            "2026-10-25": 1872.69,
          },
        },
      ],
    },
    {
      id: "deluxe-double",
      name: "Deluxe Double Room",
      totalRooms: 4,
      availableCount: {
        "2026-10-18": 3,
        "2026-10-19": 4,
        "2026-10-20": 4,
        "2026-10-21": 4,
        "2026-10-22": 3,
        "2026-10-23": 0,
        "2026-10-24": 4,
        "2026-10-25": 4,
      },
      isClosed: {
        "2026-10-23": true,
      },
      ratePlans: [
        {
          id: "bar-breakfast-dx",
          name: "Breakfast Included",
          planType: "ราคา BAR รายวัน",
          prices: {
            "2026-10-18": 2377.79,
            "2026-10-19": 2589.68,
            "2026-10-20": 2400.72,
            "2026-10-21": 2377.79,
            "2026-10-22": 2399.33,
            "2026-10-23": 3516.61,
            "2026-10-24": 2377.79,
            "2026-10-25": 2379.30,
          },
        },
        {
          id: "non-ref-breakfast-dx",
          name: "Breakfast Included (Non-Ref)",
          planType: "ราคา BAR Non-Refundable",
          prices: {
            "2026-10-18": 2258.90,
            "2026-10-19": 2460.19,
            "2026-10-20": 2280.69,
            "2026-10-21": 2258.90,
            "2026-10-22": 2279.37,
            "2026-10-23": 3340.78,
            "2026-10-24": 2258.90,
            "2026-10-25": 2260.33,
          },
        },
      ],
    },
    {
      id: "deluxe-twin",
      name: "Deluxe Twin Room",
      totalRooms: 4,
      availableCount: {
        "2026-10-18": 4,
        "2026-10-19": 4,
        "2026-10-20": 4,
        "2026-10-21": 4,
        "2026-10-22": 4,
        "2026-10-23": 0,
        "2026-10-24": 4,
        "2026-10-25": 3,
      },
      isClosed: {
        "2026-10-23": true,
      },
      ratePlans: [
        {
          id: "bar-breakfast-dt",
          name: "Breakfast Included",
          planType: "ราคา BAR รายวัน",
          prices: {
            "2026-10-18": 2377.79,
            "2026-10-19": 2589.68,
            "2026-10-20": 2400.72,
            "2026-10-21": 2377.79,
            "2026-10-22": 2399.33,
            "2026-10-23": 3516.61,
            "2026-10-24": 2377.79,
            "2026-10-25": 2379.30,
          },
        },
        {
          id: "non-ref-breakfast-dt",
          name: "Breakfast Included (Non-Ref)",
          planType: "ราคา BAR Non-Refundable",
          prices: {
            "2026-10-18": 2258.90,
            "2026-10-19": 2460.19,
            "2026-10-20": 2280.69,
            "2026-10-21": 2258.90,
            "2026-10-22": 2279.37,
            "2026-10-23": 3340.78,
            "2026-10-24": 2258.90,
            "2026-10-25": 2260.33,
          },
        },
      ],
    },
    {
      id: "family-room",
      name: "Family Room",
      totalRooms: 4,
      availableCount: {
        "2026-10-18": 4,
        "2026-10-19": 4,
        "2026-10-20": 4,
        "2026-10-21": 3,
        "2026-10-22": 4,
        "2026-10-23": 0,
        "2026-10-24": 4,
        "2026-10-25": 3,
      },
      isClosed: {
        "2026-10-23": true,
      },
      ratePlans: [
        {
          id: "bar-breakfast-fm",
          name: "Breakfast Included",
          planType: "ราคา BAR รายวัน",
          prices: {
            "2026-10-18": 5893.06,
            "2026-10-19": 6418.20,
            "2026-10-20": 5949.89,
            "2026-10-21": 5893.06,
            "2026-10-22": 5946.45,
            "2026-10-23": 8715.49,
            "2026-10-24": 5893.06,
            "2026-10-25": 5896.88,
          },
        },
        {
          id: "non-ref-breakfast-fm",
          name: "Breakfast Included (Non-Ref)",
          planType: "ราคา BAR Non-Refundable",
          prices: {
            "2026-10-18": 5598.40,
            "2026-10-19": 6097.29,
            "2026-10-20": 5652.40,
            "2026-10-21": 5598.40,
            "2026-10-22": 5649.13,
            "2026-10-23": 8279.72,
            "2026-10-24": 5598.40,
            "2026-10-25": 5602.04,
          },
        },
      ],
    },
  ]);

  // Compute total available rooms across all room types for each day
  const totalAvailablePerDay = useMemo(() => {
    const totals: Record<string, number> = {};
    dateList.forEach(({ dateStr }) => {
      if (lockedDates[dateStr]) {
        totals[dateStr] = 0;
        return;
      }
      let sum = 0;
      matrixData.forEach((rt) => {
        if (!rt.isClosed[dateStr]) {
          sum += (rt.availableCount[dateStr] ?? 0);
        }
      });
      totals[dateStr] = sum;
    });
    return totals;
  }, [dateList, matrixData, lockedDates]);

  // Toggle Lock/Unlock for an entire date
  const toggleDateLock = (dateStr: string) => {
    setLockedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  // Toggle Accordion collapse
  const toggleTypeCollapse = (id: string) => {
    setCollapsedTypes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Open Edit Price modal
  const handleOpenEditPrice = (roomTypeName: string, ratePlanName: string, date: string, currentPrice: number) => {
    setEditModal({
      isOpen: true,
      roomTypeName,
      ratePlanName,
      date,
      price: currentPrice,
    });
  };

  // Save new price
  const handleSavePrice = () => {
    setMatrixData((prev) =>
      prev.map((rt) => {
        if (rt.name !== editModal.roomTypeName) return rt;
        return {
          ...rt,
          ratePlans: rt.ratePlans.map((rp) => {
            if (rp.name !== editModal.ratePlanName) return rp;
            return {
              ...rp,
              prices: {
                ...rp.prices,
                [editModal.date]: editModal.price,
              },
            };
          }),
        };
      })
    );
    setEditModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Navigate week
  const navigateWeek = (days: number) => {
    const base = new Date(currentWeekStart + "T00:00:00");
    base.setDate(base.getDate() + days);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, "0");
    const d = String(base.getDate()).padStart(2, "0");
    setCurrentWeekStart(`${y}-${m}-${d}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header (Matching Image 3) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#0c142e] p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100">
              ปฏิทินห้องที่เปิดให้จอง
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900/40">
              {currentProperty.nameTh}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            ตารางบริหารจำนวนห้องว่าง (Allotment) และราคาขายรายวันแยกตามแผนราคา (Rate Plans)
          </p>
        </div>

        {/* Property Selector & Month Picker */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Property Switcher */}
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

          {/* Month / Date Navigator */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
            <button
              onClick={() => navigateWeek(-7)}
              className="p-2 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-stone-400 transition-colors"
              title="สัปดาห์ก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-slate-800/50 border-x border-stone-200 dark:border-slate-700">
              2026 ตุลาคม
            </div>
            <button
              onClick={() => navigateWeek(7)}
              className="p-2 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-stone-400 transition-colors"
              title="สัปดาห์ถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Export Button */}
          <button 
            onClick={() => alert("ระบบได้ส่งออกข้อมูลตารางห้องว่างและราคาเป็นไฟล์ Excel เรียบร้อยแล้ว")}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-medium border border-stone-300 dark:border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 dark:text-stone-400 px-1">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideClosedRooms}
              onChange={(e) => setHideClosedRooms(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-stone-300 dark:border-slate-700 focus:ring-emerald-500"
            />
            <span>ซ่อนห้องที่ไม่เปิดให้จอง</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideInactivePlans}
              onChange={(e) => setHideInactivePlans(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-stone-300 dark:border-slate-700 focus:ring-emerald-500"
            />
            <span>ซ่อนแผนราคาที่ไม่เปิดใช้งาน</span>
          </label>
        </div>

        {/* Date navigation arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateWeek(-7)}
            className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xs transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateWeek(7)}
            className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xs transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid Table (2D Matrix matching Image 3) */}
      <div className="bg-white dark:bg-[#0c142e] rounded-2xl border border-stone-200 dark:border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            {/* Table Header */}
            <thead>
              <tr className="bg-stone-100 dark:bg-slate-900/80 border-b border-stone-200 dark:border-slate-800 text-xs">
                <th className="p-3.5 font-bold text-stone-700 dark:text-stone-300 w-64 sticky left-0 bg-stone-100 dark:bg-slate-900 z-10 shadow-r">
                  ประเภทห้อง / แผนราคา
                </th>
                {dateList.map(({ dateStr, dayNameTh, dayNum }) => {
                  const isLocked = !!lockedDates[dateStr];
                  const isFridayOrSaturday = dayNameTh === "ศุกร์" || dayNameTh === "เสาร์";
                  return (
                    <th
                      key={dateStr}
                      className={`p-3 text-center border-l border-stone-200 dark:border-slate-800 ${
                        isLocked ? "bg-red-50/70 dark:bg-red-950/20" : ""
                      }`}
                    >
                      <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                        {dayNameTh}
                      </div>
                      <div className={`text-sm font-bold mt-0.5 ${
                        isFridayOrSaturday ? "text-amber-600 dark:text-amber-400" : "text-stone-800 dark:text-stone-200"
                      }`}>
                        {dayNum}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        ตุลาคม
                      </div>

                      {/* Lock / Unlock Toggle Button */}
                      <div className="mt-1 flex justify-center">
                        <button
                          onClick={() => toggleDateLock(dateStr)}
                          title={isLocked ? "ปลดล็อกเปิดการขาย" : "ล็อกปิดการขายทั้งวัน"}
                          className={`p-1 rounded-md transition-colors ${
                            isLocked
                              ? "bg-red-600 text-white shadow-xs"
                              : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-slate-800"
                          }`}
                        >
                          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>

              {/* Total Available Rooms Summary Row */}
              <tr className="bg-stone-50/90 dark:bg-slate-800/40 border-b border-stone-200 dark:border-slate-800 font-bold text-xs">
                <td className="p-3 sticky left-0 bg-stone-50/95 dark:bg-slate-800/95 text-stone-700 dark:text-stone-300 z-10 shadow-r">
                  ห้องที่เปิดให้จองทั้งหมด
                </td>
                {dateList.map(({ dateStr }) => {
                  const total = totalAvailablePerDay[dateStr] ?? 0;
                  const isLocked = !!lockedDates[dateStr];
                  return (
                    <td
                      key={dateStr}
                      className={`p-3 text-center border-l border-stone-200 dark:border-slate-800 ${
                        isLocked 
                          ? "text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20 font-black" 
                          : "text-stone-800 dark:text-stone-200 font-bold"
                      }`}
                    >
                      {total}
                    </td>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body - Room Types and Rates */}
            <tbody className="divide-y divide-stone-200 dark:divide-slate-800 text-xs">
              {matrixData.map((roomType) => {
                const isCollapsed = !!collapsedTypes[roomType.id];
                return (
                  <React.Fragment key={roomType.id}>
                    {/* Room Type Header Row */}
                    <tr className="bg-stone-100/60 dark:bg-slate-800/60 font-semibold">
                      <td className="p-3 sticky left-0 bg-stone-100 dark:bg-slate-800 z-10 shadow-r">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleTypeCollapse(roomType.id)}
                            className="flex items-center gap-2 text-stone-900 dark:text-stone-100 hover:text-amber-600 transition-colors"
                          >
                            {isCollapsed ? <ChevronRight className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                            <span>{roomType.name}</span>
                          </button>
                          <span className="text-[10px] text-stone-500 font-normal">
                            ว่าง
                          </span>
                        </div>
                      </td>

                      {/* Available count per date */}
                      {dateList.map(({ dateStr }) => {
                        const count = roomType.availableCount[dateStr] ?? 0;
                        const isStopSell = !!roomType.isClosed[dateStr] || !!lockedDates[dateStr];
                        const isLowInventory = count <= 1 && !isStopSell;

                        return (
                          <td
                            key={dateStr}
                            className={`p-2.5 text-center border-l border-stone-200 dark:border-slate-800 transition-colors ${
                              isStopSell
                                ? "bg-red-600 text-white font-bold"
                                : isLowInventory
                                ? "bg-amber-500 text-white font-bold"
                                : "text-stone-800 dark:text-stone-200 font-semibold"
                            }`}
                          >
                            {isStopSell ? (
                              <span className="text-[11px] tracking-tight">ปิดการขาย</span>
                            ) : (
                              <span>{count}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Sub-Rows: Rate Plans under this room type */}
                    {!isCollapsed &&
                      roomType.ratePlans.map((plan) => (
                        <tr key={plan.id} className="hover:bg-amber-50/30 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-2.5 pl-8 sticky left-0 bg-white dark:bg-[#0c142e] z-10 border-r border-stone-200 dark:border-slate-800">
                            <div className="flex flex-col">
                              <span className="text-stone-800 dark:text-stone-200 font-medium text-[11px]">
                                {plan.name}
                              </span>
                              <span className="text-[10px] text-stone-400">
                                {plan.planType}
                              </span>
                            </div>
                          </td>

                          {/* Prices per date */}
                          {dateList.map(({ dateStr }) => {
                            const price = plan.prices[dateStr] ?? 0;
                            const isStopSell = !!roomType.isClosed[dateStr] || !!lockedDates[dateStr];

                            return (
                              <td
                                key={dateStr}
                                onClick={() => handleOpenEditPrice(roomType.name, plan.name, dateStr, price)}
                                className={`p-2.5 text-center border-l border-stone-200 dark:border-slate-800 cursor-pointer group hover:bg-amber-100/50 dark:hover:bg-slate-700/50 transition-colors ${
                                  isStopSell ? "bg-red-50/50 dark:bg-red-950/10 text-red-700 dark:text-red-400 font-semibold" : "text-stone-700 dark:text-stone-300"
                                }`}
                                title="คลิกเพื่อปรับแก้ราคาเฉพาะวันนี้"
                              >
                                <div className="flex items-center justify-center gap-1 font-mono text-[11px]">
                                  <span>{formatCurrency(price).replace("฿", "")}</span>
                                  <Edit3 className="w-2.5 h-2.5 text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Price Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0c142e] rounded-2xl max-w-md w-full p-6 border border-stone-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                ปรับราคาขายรายวัน
              </h3>
              <button
                onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-stone-500">ประเภทห้อง:</span>
                <p className="font-semibold text-stone-800 dark:text-stone-200 text-sm mt-0.5">
                  {editModal.roomTypeName}
                </p>
              </div>

              <div>
                <span className="text-stone-500">แผนราคา:</span>
                <p className="font-medium text-stone-700 dark:text-stone-300">
                  {editModal.ratePlanName}
                </p>
              </div>

              <div>
                <span className="text-stone-500">วันที่:</span>
                <p className="font-semibold text-amber-600 dark:text-amber-400">
                  {editModal.date}
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  ราคาต่อคืน (บาท):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editModal.price}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 text-base font-bold font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-slate-800">
              <button
                onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSavePrice}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
              >
                บันทึกราคา
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
