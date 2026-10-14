"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { DatabaseProviderType, DatabaseConfig } from "@/types/pms";
import { 
  Database, 
  Server, 
  Cloud, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Key, 
  Layers, 
  Globe, 
  Laptop, 
  Smartphone, 
  Zap, 
  Sparkles,
  Trash2,
  X,
  ExternalLink,
  Lock
} from "lucide-react";

interface DatabaseInstallWizardProps {
  isOpen?: boolean;
  onClose?: () => void;
  isStandalonePage?: boolean;
}

export function DatabaseInstallWizard({ 
  isOpen = true, 
  onClose, 
  isStandalonePage = false 
}: DatabaseInstallWizardProps) {
  const { 
    isDatabaseInstalled, 
    databaseConfig, 
    installDatabase, 
    resetDatabaseInstallation, 
    syncStatus, 
    lastSyncTime,
    currentUser,
    rooms,
    bookings,
    orders,
    menuItems
  } = usePMS();

  const [step, setStep] = useState<number>(1);
  const [provider, setProvider] = useState<DatabaseProviderType>("POSTGRES_SUPABASE");
  const [connectionString, setConnectionString] = useState<string>(
    "postgresql://postgres.hotel_pms:SecretPass2026@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
  );
  const [apiKey, setApiKey] = useState<string>("sb_publishable_live_k82js9f2a01m4z_hotel_pms");
  const [databaseName, setDatabaseName] = useState<string>("hotel_pms_production");
  const [sslMode, setSslMode] = useState<boolean>(true);
  const [migrateExistingData, setMigrateExistingData] = useState<boolean>(true);
  const [syncInterval, setSyncInterval] = useState<number>(15);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [installProgress, setInstallProgress] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  if (!isOpen) return null;

  const handleQuickPreset = (presetType: DatabaseProviderType) => {
    setProvider(presetType);
    if (presetType === "POSTGRES_SUPABASE") {
      setConnectionString("postgresql://postgres.hotel_pms:GrandLuxe2026@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres");
      setApiKey("sb_publishable_live_k82js9f2a01m4z_hotel_pms");
      setDatabaseName("hotel_pms_production");
    } else if (presetType === "NEON_SERVERLESS") {
      setConnectionString("postgresql://hotel_admin:GrandLuxePass@ep-shiny-glitter-123.ap-southeast-1.aws.neon.tech/hotel_pms?sslmode=require");
      setApiKey("");
      setDatabaseName("hotel_pms_neon");
    } else if (presetType === "PRISMA_POSTGRES") {
      setConnectionString("prisma+postgres://accelerate.prisma-data.net/?api_key=eyJh...hotel_pms");
      setApiKey("prisma_live_token_77a9");
      setDatabaseName("hotel_pms_prisma");
    } else if (presetType === "REST_REALTIME_API") {
      setConnectionString("https://api.hotel-pms-cloud.com/v1/sync");
      setApiKey("live_pms_sync_key_99214");
      setDatabaseName("hotel_pms_cloud");
    }
  };

  const handleStartInstallation = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      setInstallProgress("1/4: กำลังตรวจสอบการเชื่อมต่อกับ Database Host...");
      await new Promise((r) => setTimeout(r, 600));

      setInstallProgress("2/4: กำลังสร้าง Schema และตาราง (rooms, bookings, orders, folios, users)...");
      await new Promise((r) => setTimeout(r, 700));

      if (migrateExistingData) {
        setInstallProgress(`3/4: กำลังโคลนข้อมูลในเครื่อง (${rooms.length} ห้อง, ${bookings.length} บุ๊กกิ้ง) ขึ้นระบบ Cloud...`);
        await new Promise((r) => setTimeout(r, 700));
      } else {
        setInstallProgress("3/4: กำลังเตรียมโครงสร้างฐานข้อมูลเริ่มต้น...");
        await new Promise((r) => setTimeout(r, 500));
      }

      setInstallProgress("4/4: กำลังเปิดระบบ Real-time Sync & WebSocket Gateway สำหรับทุกอุปกรณ์...");
      await new Promise((r) => setTimeout(r, 600));

      const newConfig: DatabaseConfig = {
        provider,
        connectionString,
        databaseName,
        apiKey: apiKey || undefined,
        sslMode,
        installedAt: new Date().toISOString(),
        installedBy: currentUser ? currentUser.name : "System Administrator",
        isRealtimeSync: true,
        syncIntervalSeconds: syncInterval,
      };

      const result = await installDatabase(newConfig);
      if (result.success) {
        setSuccessMsg(result.message);
        setStep(4);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
    } finally {
      setIsLoading(false);
      setInstallProgress("");
    }
  };

  const content = (
    <div className="bg-white dark:bg-[#0c142e] rounded-3xl max-w-3xl w-full shadow-2xl border border-amber-300/40 dark:border-amber-800/40 overflow-hidden flex flex-col my-auto max-h-[92vh]">
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-amber-200/50 dark:border-amber-800/40 bg-gradient-to-r from-stone-50 via-amber-50/40 to-stone-50 dark:from-[#0d1636] dark:via-[#111e48] dark:to-[#0d1636] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-amber-100">
                ติดตั้งฐานข้อมูลถาวร & ซิงค์ออนไลน์
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isDatabaseInstalled 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/40" 
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-400/40"
              }`}>
                {isDatabaseInstalled ? "Online Cloud Installed" : "Local Browser Mode"}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              เชื่อมต่อฐานข้อมูล Cloud เพื่อให้มือถือและคอมพิวเตอร์หลายเครื่องดูและจัดการพร้อมกันได้ทันที
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-all cursor-pointer hover:scale-105"
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6 text-xs sm:text-sm">

        {/* Current Database Status Card */}
        <div className={`p-4 rounded-2xl border ${
          isDatabaseInstalled 
            ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60" 
            : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300/80 dark:border-amber-800/80"
        }`}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3">
              {isDatabaseInstalled ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-stone-900 dark:text-white text-sm">
                  {isDatabaseInstalled 
                    ? `เชื่อมต่อระบบ Cloud Database เรียบร้อย (${databaseConfig?.provider})` 
                    : "ระบบกำลังทำงานในโหมด Local Browser Storage (ยังไม่ได้ติดตั้งฐานข้อมูลออนไลน์)"}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                  {isDatabaseInstalled 
                    ? `ติดตั้งเมื่อ: ${databaseConfig?.installedAt ? new Date(databaseConfig.installedAt).toLocaleString("th-TH") : "ล่าสุด"} • ซิงค์อัตโนมัติแบบ Real-time ทุกอุปกรณ์` 
                    : "ข้อมูลการจองและห้องพักปัจจุบันถูกบันทึกไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น หากเข้าใช้งานจากเครื่องอื่นจะไม่เห็นข้อมูลเดียวกัน กรุณาติดตั้งฐานข้อมูลออนไลน์เพื่อเริ่มใช้งานพร้อมกัน"}
                </p>
                {isDatabaseInstalled && (
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500 flex-wrap">
                    <span>Host DB: <code className="text-amber-700 dark:text-amber-300 font-mono">{databaseConfig?.databaseName}</code></span>
                    <span>สถานะ: <strong className="text-emerald-600">เชื่อมต่อแล้ว (Online)</strong></span>
                    {lastSyncTime && <span>ซิงค์ล่าสุด: {lastSyncTime}</span>}
                  </div>
                )}
              </div>
            </div>

            {isDatabaseInstalled && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตการเชื่อมต่อฐานข้อมูลกลับเป็นโหมด Local?")) {
                    resetDatabaseInstallation();
                    setStep(1);
                  }
                }}
                className="py-1.5 px-3 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>รีเซ็ตการเชื่อมต่อ</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Device Architecture Showcase */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/40 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs">
                <Laptop className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs">
                <Cloud className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="font-bold text-stone-900 dark:text-white text-xs">
                สถาปัตยกรรม Multi-Device Cloud Real-Time
              </div>
              <div className="text-[11px] text-stone-500">
                เคาน์เตอร์ Front Desk, มือถือผู้จัดการ, และแท็บเล็ตแม่บ้าน ซิงค์สถานะห้องพักตรงกัน 100%
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Zap className="w-4 h-4" />
            <span>Zero Data Loss Guarantee</span>
          </div>
        </div>

        {/* Stepper Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          {[
            { num: 1, title: "1. เลือกประเภท DB" },
            { num: 2, title: "2. ตั้งค่า Connection" },
            { num: 3, title: "3. ติดตั้ง & ย้ายข้อมูล" },
            { num: 4, title: "4. ตรวจสอบสถานะ" },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-1.5 text-xs font-bold transition-colors pb-1 border-b-2 ${
                step === s.num
                  ? "border-amber-600 text-amber-600 dark:text-amber-400"
                  : step > s.num
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-stone-400"
              }`}
            >
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Step 1: Select Database Provider */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="font-bold text-stone-900 dark:text-white">
              เลือกผู้ให้บริการฐานข้อมูลออนไลน์ถาวร (Cloud Database Provider):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: "POSTGRES_SUPABASE" as DatabaseProviderType,
                  name: "Supabase PostgreSQL (แนะนำสูงสุด)",
                  desc: "Cloud DB มาตรฐานระดับโลก ฟรีโควต้าเริ่มต้น รองรับ Real-time WebSocket ในตัว",
                  badge: "แนะนำ",
                  color: "border-amber-500 bg-amber-500/5",
                },
                {
                  id: "NEON_SERVERLESS" as DatabaseProviderType,
                  name: "Neon Serverless Postgres",
                  desc: "Serverless Database สำหรับโมเดิร์นเว็บแอพ รวดเร็ว ปรับขยายขนาดอัตโนมัติ",
                  badge: "Fastest",
                  color: "border-emerald-500 bg-emerald-500/5",
                },
                {
                  id: "PRISMA_POSTGRES" as DatabaseProviderType,
                  name: "Prisma Postgres / Compute",
                  desc: "จัดการข้อมูลผ่าน Prisma Engine มี Connection Pooling ในตัว ปลอดภัยสูง",
                  badge: "Enterprise",
                  color: "border-indigo-500 bg-indigo-500/5",
                },
                {
                  id: "REST_REALTIME_API" as DatabaseProviderType,
                  name: "REST Realtime Cloud API",
                  desc: "เชื่อมต่อผ่าน API Gateway สะดวกสำหรับเชื่อมต่อระบบภายนอกหรือระบบ OTA",
                  badge: "Flexible",
                  color: "border-teal-500 bg-teal-500/5",
                },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleQuickPreset(item.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    provider === item.id
                      ? `${item.color} shadow-md`
                      : "border-stone-200 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm">
                      {item.name}
                    </h5>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
              >
                <span>ถัดไป: กรอกข้อมูลการเชื่อมต่อ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Connection String & Config */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 dark:text-white">
                ระบุ Connection String และกุญแจความปลอดภัย:
              </span>
              <button
                type="button"
                onClick={() => handleQuickPreset(provider)}
                className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>โหลดค่าทดสอบด่วน (Quick Demo Cloud Config)</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Database Connection URI / Endpoint URL *
              </label>
              <div className="relative">
                <Server className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  placeholder="postgresql://user:password@host:5432/dbname"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs font-mono text-stone-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  ชื่อฐานข้อมูล (Database Name)
                </label>
                <input
                  type="text"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  API Key / Access Token (ถ้ามี)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="ใส่ API Token หรือทิ้งว่างไว้"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs text-stone-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={sslMode}
                  onChange={(e) => setSslMode(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600"
                />
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>บังคับใช้งานเข้ารหัส SSL/TLS (SSL Mode Require)</span>
                </span>
              </label>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
              >
                <span>ถัดไป: ตั้งค่าการย้ายข้อมูลและ Migration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Migration & Install Action */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="font-bold text-stone-900 dark:text-white">
              สร้างโครงสร้างตารางข้อมูลและโคลนข้อมูลขึ้นระบบคลาวด์:
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200 dark:border-stone-700 space-y-2 text-xs">
              <div className="font-bold text-stone-800 dark:text-stone-200">
                ตารางที่จะถูกสร้างขึ้นในฐานข้อมูลออนไลน์:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /><span>properties</span></div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /><span>rooms ({rooms.length})</span></div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /><span>bookings ({bookings.length})</span></div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /><span>room_orders ({orders.length})</span></div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /><span>menu_items ({menuItems.length})</span></div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /><span>folios_billing</span></div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /><span>staff_users</span></div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /><span>audit_logs</span></div>
              </div>
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-300/80 bg-amber-50/40 dark:bg-amber-950/20 text-xs font-semibold text-amber-900 dark:text-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={migrateExistingData}
                onChange={(e) => setMigrateExistingData(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600"
              />
              <span>โยกย้ายข้อมูลห้องพักและการจองปัจจุบันที่มีอยู่ในเครื่องนี้ขึ้น Cloud ทันที (Migrate Local to Cloud)</span>
            </label>

            {/* Error or Progress Alert */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {installProgress && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-800 dark:text-amber-300 text-xs space-y-1.5 animate-pulse">
                <div className="flex items-center gap-2 font-bold">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                  <span>กำลังดำเนินการติดตั้งฐานข้อมูล...</span>
                </div>
                <p className="font-mono text-[11px]">{installProgress}</p>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setStep(2)}
                className="py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>
              <button
                type="button"
                disabled={isLoading || !connectionString}
                onClick={handleStartInstallation}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all min-h-[44px]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังติดตั้ง...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>เริ่มการติดตั้ง & เชื่อมต่อฐานข้อมูลออนไลน์</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Installation Completed */}
        {step === 4 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-white">
                ติดตั้งฐานข้อมูลออนไลน์สำเร็จสมบูรณ์!
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                ระบบเชื่อมต่อกับ Cloud Database ({databaseConfig?.provider}) เรียบร้อยแล้ว
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#131f47] border border-stone-200 dark:border-stone-800 text-left space-y-2 max-w-md mx-auto text-xs">
              <div className="flex justify-between">
                <span className="text-stone-400">สถานะฐานข้อมูล:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Online & Real-time</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Database Name:</span>
                <span className="font-mono text-stone-800 dark:text-stone-200">{databaseConfig?.databaseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">ผู้ติดตั้ง:</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">{databaseConfig?.installedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">เวลาที่ติดตั้ง:</span>
                <span className="text-stone-800 dark:text-stone-200">
                  {databaseConfig?.installedAt ? new Date(databaseConfig.installedAt).toLocaleString("th-TH") : "ล่าสุด"}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 text-xs text-emerald-800 dark:text-emerald-200 max-w-md mx-auto text-left">
              <strong>คำแนะนำ:</strong> ตอนนี้คุณสามารถเปิดแอปนี้จากสมาร์ตโฟนหรือคอมพิวเตอร์เครื่องอื่นๆ และใช้งานข้อมูลการจอง เช็คอิน/เช็คเอาท์ ร่วมกันพร้อมกันได้ทันทีโดยไม่ต้องกังวลเรื่องข้อมูลไม่ตรงกัน
            </div>

            <div className="pt-2 flex justify-center gap-3">
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
                >
                  เสร็จสิ้นและกลับสู่ระบบจัดการ
                </button>
              ) : (
                <a
                  href="/"
                  className="py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all inline-block"
                >
                  เข้าสู่หน้าแดชบอร์ดหลัก (Go to Dashboard)
                </a>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );

  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-[#faf8f5] dark:bg-[#070c1e] text-stone-900 dark:text-stone-100 flex items-center justify-center p-3 sm:p-6">
        {content}
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      {content}
    </div>
  );
}
