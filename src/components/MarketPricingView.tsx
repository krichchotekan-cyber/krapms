"use client";

import React, { useState, useMemo } from "react";
import { usePMS } from "@/context/PMSContext";
import { initialMarketCompetitors } from "@/lib/mockData";
import { MarketCompetitor, PropertyId } from "@/types/pms";
import { 
  Building2, 
  Palmtree, 
  TrendingUp, 
  SlidersHorizontal, 
  AlertCircle, 
  Info, 
  Check, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Calendar
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function MarketPricingView() {
  const { activePropertyId, setActivePropertyId, properties } = usePMS();

  const currentPropId: PropertyId = activePropertyId === "all" ? "bugaan" : activePropertyId;
  const currentProperty = properties.find((p) => p.id === currentPropId) || properties[0];

  const [competitors, setCompetitors] = useState<MarketCompetitor[]>(initialMarketCompetitors);
  const [zoomRange, setZoomRange] = useState<"1m" | "3m" | "6m" | "1y" | "all">("1m");
  const [activeDateIndex, setActiveDateIndex] = useState<number | null>(18); // Default active tooltip

  // Floor price (THB)
  const floorPrice = 1000;

  // Toggle competitor selection
  const toggleCompetitor = (id: string) => {
    setCompetitors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isSelected: !c.isSelected } : c))
    );
  };

  const selectAllCompetitors = (select: boolean) => {
    setCompetitors((prev) => prev.map((c) => ({ ...c, isSelected: select })));
  };

  // Generate 32 days of market data (from 18 Oct to 18 Nov 2026, matching Image 1)
  const chartData = useMemo(() => {
    const data = [];
    const baseDate = new Date("2026-10-18T00:00:00");

    for (let i = 0; i <= 31; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);

      const day = d.getDate();
      const month = d.getMonth() + 1; // 10 = Oct, 11 = Nov
      const dateStr = `${day} ${month === 10 ? "Oct" : "Nov"}`;
      const isPeakOctober = month === 10 && day === 23; // Chulalongkorn Day / Long weekend
      const isLoyKrathong = month === 11 && (day >= 14 && day <= 17); // Loy Krathong Sukhothai Peak

      // Raw Occupancy %
      let occupancy = 18 + Math.sin(i * 0.4) * 12;
      if (isPeakOctober) occupancy = 90;
      if (isLoyKrathong) occupancy = 75 + (day - 14) * 6;
      if (month === 11 && day === 1) occupancy = 45;
      if (month === 11 && day === 7) occupancy = 35;
      occupancy = Math.max(8, Math.min(100, Math.round(occupancy)));

      // Our Price (OTA)
      let ourPrice = 1100 + Math.sin(i * 0.3) * 150;
      if (isPeakOctober) ourPrice = 1950;
      if (month === 11 && day >= 14) ourPrice = 2700 + (day - 14) * 80;

      // Market Average
      let marketAvg = 1250 + Math.cos(i * 0.3) * 180;
      if (isPeakOctober) marketAvg = 2300;
      if (month === 11 && day >= 14) marketAvg = 3100 + (day - 14) * 120;

      // Competitor prices
      const compPrices: Record<string, number> = {
        "comp-midtown": ourPrice + (Math.sin(i + 1) * 200),
        "comp-scent": marketAvg + 150 + (Math.cos(i) * 150),
        "comp-foresto": marketAvg - 120 + (Math.sin(i * 2) * 100),
        "comp-sawasdee": isLoyKrathong ? 4200 : 2400 + (Math.sin(i) * 250),
        "comp-thaithai": isLoyKrathong ? 3800 : 2100 + (Math.cos(i) * 200),
        "comp-aenguy": 1500 + (Math.sin(i) * 150),
        "comp-nasukhothai": 1400 + (Math.cos(i) * 100),
        "comp-dorm": 1150 + (Math.sin(i * 0.5) * 80),
      };

      data.push({
        index: i,
        dateStr,
        day,
        month,
        ourPrice: Math.round(ourPrice),
        marketAvg: Math.round(marketAvg),
        occupancy,
        isHighlight: isPeakOctober || isLoyKrathong,
        compPrices,
      });
    }
    return data;
  }, []);

  const activePoint = chartData[activeDateIndex ?? 18];

  return (
    <div className="space-y-6">
      {/* Header and Property Selector (Matching Image 1) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#0c142e] p-5 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100">
              การตั้งราคาอิงตลาด (Rate Intelligence)
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900/40">
              {currentProperty.nameTh}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            วิเคราะห์เปรียบเทียบราคาขายของเรากับค่าเฉลี่ยตลาดและโรงแรมคู่แข่งในพื้นที่สุโขทัย
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

      {/* Main Analysis Card */}
      <div className="bg-white dark:bg-[#0c142e] rounded-2xl border border-stone-200 dark:border-slate-800 shadow-md p-5 sm:p-6 space-y-6">
        {/* Top Indicators & Legend (Exactly matching Image 1) */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-stone-100 dark:border-slate-800 pb-5">
          {/* Main Indicators Legend */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
              ต.ค. 2026
            </span>

            {/* Our Price */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 border-t-2 border-dashed border-[#ea580c]" />
              <span className="text-stone-700 dark:text-stone-300">
                ราคาขายของเรา (จาก OTA)
              </span>
            </div>

            {/* Market Average */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 border-t-2 border-dashed border-[#1e3a8a]" />
              <span className="text-stone-700 dark:text-stone-300">
                ราคาเฉลี่ยตลาด
              </span>
            </div>

            {/* Floor Price */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 border-t-2 border-dotted border-stone-400" />
              <span className="text-stone-500">
                Floor price (1,000.-)
              </span>
            </div>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center bg-stone-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-medium">
            <span className="text-stone-400 px-2 text-[11px]">Zoom</span>
            {(["1m", "3m", "6m", "1y", "all"] as const).map((z) => (
              <button
                key={z}
                onClick={() => setZoomRange(z)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  zoomRange === z
                    ? "bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 font-bold shadow-xs"
                    : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        {/* Competitor Hotel Pills (Matching Image 1) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {competitors.map((comp) => {
            return (
              <button
                key={comp.id}
                onClick={() => toggleCompetitor(comp.id)}
                style={{ borderBottomColor: comp.isSelected ? comp.color : "transparent" }}
                className={`px-3 py-1.5 rounded-lg border-b-2 text-[11px] font-medium transition-all ${
                  comp.isSelected
                    ? "bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-200 shadow-xs"
                    : "bg-transparent text-stone-400 hover:text-stone-600 line-through"
                }`}
              >
                {comp.name}
              </button>
            );
          })}

          <button
            onClick={() => selectAllCompetitors(false)}
            className="px-2.5 py-1 text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold"
          >
            ไม่เลือก
          </button>
          <button
            onClick={() => selectAllCompetitors(true)}
            className="px-2.5 py-1 text-[11px] text-stone-500 hover:underline"
          >
            เลือกทั้งหมด
          </button>
        </div>

        {/* Chart Viewport (SVG High-Precision Chart) */}
        <div className="relative w-full h-80 sm:h-96 pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 320" preserveAspectRatio="none">
            {/* Grid Lines Left Y (Prices: 1k to 5k) */}
            {[1000, 2000, 3000, 4000, 5000].map((price, idx) => {
              const y = 280 - (price / 5000) * 240;
              return (
                <g key={price}>
                  <line x1="50" y1={y} x2="950" y2={y} stroke="currentColor" className="text-stone-100 dark:text-slate-800" strokeWidth="1" />
                  <text x="35" y={y + 4} textAnchor="end" className="fill-stone-400 text-[10px] font-mono">
                    {price / 1000}k
                  </text>
                </g>
              );
            })}

            {/* Right Y Axis: Occupancy % (0% to 100%) */}
            {[0, 20, 40, 60, 80, 100].map((occ) => {
              const y = 280 - (occ / 100) * 240;
              return (
                <text key={occ} x="965" y={y + 4} textAnchor="start" className="fill-stone-400 text-[10px] font-mono">
                  {occ}%
                </text>
              );
            })}

            {/* Floor Price Line (Gray Dotted) */}
            <line
              x1="50"
              y1={280 - (floorPrice / 5000) * 240}
              x2="950"
              y2={280 - (floorPrice / 5000) * 240}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

            {/* Occupancy Bars (Light Orange / Gold Bars as shown in Image 1) */}
            {chartData.map((d, idx) => {
              const x = 50 + (idx / (chartData.length - 1)) * 900;
              const barHeight = (d.occupancy / 100) * 240;
              const y = 280 - barHeight;
              const isSelected = activeDateIndex === idx;

              return (
                <g key={`bar-${idx}`} className="cursor-pointer" onClick={() => setActiveDateIndex(idx)}>
                  <rect
                    x={x - 6}
                    y={y}
                    width="12"
                    height={barHeight}
                    className={`transition-all ${
                      d.isHighlight
                        ? "fill-amber-400/50 dark:fill-amber-500/40"
                        : "fill-stone-200/70 dark:fill-slate-800/80 hover:fill-amber-300/40"
                    }`}
                    rx="2"
                  />
                  {isSelected && (
                    <line x1={x} y1="40" x2={x} y2="280" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                  )}
                </g>
              );
            })}

            {/* Competitor Price Curves (Smooth lines) */}
            {competitors.filter((c) => c.isSelected).map((comp) => {
              const pathD = chartData.map((d, idx) => {
                const x = 50 + (idx / (chartData.length - 1)) * 900;
                const price = d.compPrices[comp.id] || d.marketAvg;
                const y = 280 - (Math.min(5000, price) / 5000) * 240;
                return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
              }).join(" ");

              return (
                <path
                  key={`comp-line-${comp.id}`}
                  d={pathD}
                  fill="none"
                  stroke={comp.color}
                  strokeWidth="1.2"
                  strokeOpacity="0.6"
                />
              );
            })}

            {/* Market Average Line (Blue Dashed) */}
            <path
              d={chartData.map((d, idx) => {
                const x = 50 + (idx / (chartData.length - 1)) * 900;
                const y = 280 - (Math.min(5000, d.marketAvg) / 5000) * 240;
                return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
              }).join(" ")}
              fill="none"
              stroke="#1e3a8a"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />

            {/* Our Price Line (Orange Dashed with Points) */}
            <path
              d={chartData.map((d, idx) => {
                const x = 50 + (idx / (chartData.length - 1)) * 900;
                const y = 280 - (Math.min(5000, d.ourPrice) / 5000) * 240;
                return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
              }).join(" ")}
              fill="none"
              stroke="#ea580c"
              strokeWidth="2.5"
              strokeDasharray="5 3"
            />

            {/* Interactive Data Nodes on Our Price */}
            {chartData.map((d, idx) => {
              const x = 50 + (idx / (chartData.length - 1)) * 900;
              const y = 280 - (Math.min(5000, d.ourPrice) / 5000) * 240;
              const isSelected = activeDateIndex === idx;

              return (
                <circle
                  key={`pt-${idx}`}
                  cx={x}
                  cy={y}
                  r={isSelected ? "5" : "3"}
                  className="fill-[#ea580c] stroke-white dark:stroke-[#0c142e] stroke-2 cursor-pointer transition-all"
                  onClick={() => setActiveDateIndex(idx)}
                />
              );
            })}

            {/* Bottom X-Axis Date Labels (18 Oct, 21 Oct, ..., 18 Nov) */}
            {chartData.filter((_, idx) => idx % 3 === 0 || idx === chartData.length - 1).map((d) => {
              const x = 50 + (d.index / (chartData.length - 1)) * 900;
              return (
                <text
                  key={`lbl-${d.index}`}
                  x={x}
                  y="305"
                  textAnchor="middle"
                  className="fill-stone-400 text-[9px] font-mono select-none"
                >
                  {d.dateStr}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Active Point Hover Info Card */}
        {activePoint && (
          <div className="bg-stone-50 dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-stone-500">วันที่เลือกวิเคราะห์:</span>
                <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                  {activePoint.dateStr} 2026 {activePoint.isHighlight && "(ช่วงเทศกาล/ไฮซีซั่น)"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-stone-200 dark:border-slate-700">
                <span className="text-stone-500 block text-[10px]">ราคาของเรา:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {formatCurrency(activePoint.ourPrice)}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-stone-200 dark:border-slate-700">
                <span className="text-stone-500 block text-[10px]">ราคาเฉลี่ยตลาด:</span>
                <span className="font-bold text-blue-900 dark:text-blue-400 text-sm">
                  {formatCurrency(activePoint.marketAvg)}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-stone-200 dark:border-slate-700">
                <span className="text-stone-500 block text-[10px]">Occupancy คาดการณ์:</span>
                <span className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                  {activePoint.occupancy}%
                </span>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-stone-200 dark:border-slate-700">
                <span className="text-stone-500 block text-[10px]">Floor Price:</span>
                <span className="font-semibold text-stone-600 dark:text-stone-400 text-sm">
                  {formatCurrency(floorPrice)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* AI Rate Intelligence Recommendations */}
        <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 flex items-start gap-3 text-xs">
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 dark:text-amber-300">
              ข้อเสนอแนะในการปรับราคาอิงตลาด (Rate Recommendation)
            </h4>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              ช่วงวันที่ 14 - 17 พ.ย. 2026 เป็นช่วงงานประเพณีลอยกระทง เผาเทียน เล่นไฟ มรดกโลกสุโขทัย โรงแรมคู่แข่ง (Sawasdee Sukhothai, Thai Thai Sukhothai) ปรับราคาเฉลี่ยขึ้นแตะ 3,800 - 4,200 บาท แนะนำให้ปรับราคาขายของเราขึ้นเป็น 2,800 - 3,200 บาท สำหรับประเภทห้อง Deluxe และ Family Room เพื่อเพิ่มค่าห้องเฉลี่ย (ADR) และ RevPAR สูงสุด
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
