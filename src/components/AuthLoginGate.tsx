"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { 
  Lock, 
  KeyRound, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  Building2, 
  Palmtree, 
  Sparkles, 
  Sun, 
  Moon,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";

export function AuthLoginGate() {
  const { login, isDarkMode, toggleDarkMode, isMounted } = usePMS();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    const success = login(username, password, rememberMe);
    if (!success) {
      setErrorMsg("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (รหัสผ่านเริ่มต้นสำหรับทดสอบ: 1234)");
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (roleUser: string) => {
    setUsername(roleUser);
    setPassword("1234");
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#faf8f5] dark:bg-[#060b1c] text-stone-900 dark:text-stone-100 transition-colors relative overflow-hidden select-none">
      
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-400/15 dark:bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-400/15 dark:bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleDarkMode}
          title="สลับธีม สว่าง / มืด"
          className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md hover:bg-stone-100 text-stone-600 dark:text-amber-300 transition-colors cursor-pointer shadow-xs"
        >
          {isMounted && isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-stone-600" />
          )}
        </button>
      </div>

      {/* Central Login Card */}
      <div className="relative z-10 max-w-md w-full bg-white dark:bg-[#0c132c] rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-300/40 dark:border-amber-800/40">
        
        {/* Logos Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* Bu-Gaan Logo */}
            <div className="w-14 h-14 rounded-2xl bg-white p-1 border border-stone-200 shadow-sm flex items-center justify-center">
              <img
                src="/logos/bugaan-logo.jpg"
                alt="Bu-Gaan Logo"
                className="w-full h-full object-contain"
              />
            </div>
            {/* Divider */}
            <div className="h-8 w-px bg-stone-300 dark:bg-stone-700" />
            {/* Thanawong Logo */}
            <div className="w-14 h-14 rounded-2xl bg-white p-1 border border-stone-200 shadow-sm flex items-center justify-center">
              <img
                src="/logos/thanawong-logo.jpg"
                alt="Thanawong Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/30 text-[11px] font-bold mb-2">
            <Lock className="w-3 h-3 text-amber-600" />
            <span>ระบบความปลอดภัย Hotel PMS</span>
          </div>

          <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-white tracking-tight">
            เข้าสู่ระบบจัดการโรงแรม
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Bu-Gaan Sukhothai Village & Thanawong Pool Villa
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Role Fill Presets */}
        <div className="mb-5 p-3 rounded-2xl bg-stone-50 dark:bg-[#111a3d] border border-stone-200/80 dark:border-stone-800">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
            เลือกตำแหน่งทดสอบสิทธิ์สาขา (Quick Test Accounts):
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin")}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                username === "admin"
                  ? "border-amber-500 bg-amber-500/15"
                  : "border-amber-300/60 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50"
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-[11px] text-amber-800 dark:text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">GM Admin</span>
              </div>
              <div className="text-[9px] text-stone-500 mt-0.5 truncate">ทุกโรงแรม</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("frontdesk_bg")}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                username === "frontdesk_bg" || username === "frontdesk"
                  ? "border-amber-500 bg-amber-500/15"
                  : "border-stone-200 dark:border-stone-800 bg-white dark:bg-slate-800/60 hover:bg-stone-100"
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-[11px] text-stone-800 dark:text-stone-200">
                <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">บูก้าน (Bu-Gaan)</span>
              </div>
              <div className="text-[9px] text-stone-500 mt-0.5 truncate">เฉพาะสาขาบูก้าน</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("frontdesk_tw")}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                username === "frontdesk_tw"
                  ? "border-emerald-500 bg-emerald-500/15"
                  : "border-stone-200 dark:border-stone-800 bg-white dark:bg-slate-800/60 hover:bg-stone-100"
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-[11px] text-stone-800 dark:text-stone-200">
                <Palmtree className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">ธนวงศ์ (Villa)</span>
              </div>
              <div className="text-[9px] text-stone-500 mt-0.5 truncate">เฉพาะสาขาธนวงศ์</div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              ชื่อผู้ใช้งาน (Username) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="เช่น admin หรือ frontdesk"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              รหัสผ่าน (Password) *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="รหัสผ่าน (ค่าทดสอบ: 1234)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs text-stone-600 dark:text-stone-400">
                จดจำเซสชั่น 7 วัน (Remember session)
              </span>
            </label>
            <span className="text-[10px] text-stone-400">
              {rememberMe ? "อายุ 7 วัน" : "อายุ 24 ชม."}
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !username || !password}
              className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:opacity-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/25 min-h-[44px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>เข้าสู่ระบบ (Sign In to PMS)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <p className="text-[11px] text-stone-400 text-center mt-5">
          ระบบสงวนสิทธิ์เฉพาะพนักงานและผู้บริหารที่ได้รับอนุญาตเท่านั้น
        </p>

      </div>
    </div>
  );
}
