"use client";

import React, { useState } from "react";
import { usePMS } from "@/context/PMSContext";
import { 
  Hotel, 
  KeyRound, 
  User, 
  ShieldCheck, 
  AlertCircle
} from "lucide-react";

export function LoginModal({ 
  isOpen, 
  onClose,
  onLoginSuccess,
  onOpenPropertySelect
}: { 
  isOpen: boolean; 
  onClose?: () => void;
  onLoginSuccess?: () => void;
  onOpenPropertySelect?: () => void;
}) {
  const { login, currentUser, currentSession, logout, activePropertyId } = usePMS();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const success = login(username, password, rememberMe);
    if (success) {
      setSuccessMsg("เข้าสู่ระบบสำเร็จ! บันทึกเซสชั่นเรียบร้อย กำลังเปิดหน้าต่าง...");
      setTimeout(() => {
        if (onClose) onClose();
        if (onLoginSuccess) onLoginSuccess();
      }, 600);
    } else {
      setErrorMsg("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (รหัสผ่านทดสอบเริ่มต้น: 1234)");
    }
  };

  const handleQuickSelect = (roleUser: string) => {
    setUsername(roleUser);
    setPassword("1234");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-[#0e1738] rounded-3xl max-w-md w-full p-5 sm:p-8 shadow-2xl border border-amber-300/40 dark:border-amber-800/40 relative overflow-y-auto max-h-[90vh] my-auto">
        
        {/* Subtle decorative gold glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {currentUser ? (
          /* User Profile & Active Session View */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center font-bold text-xl">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-white">
                เซสชั่นการใช้งาน (Active Session)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                เซสชั่นถูกบันทึกและเชื่อมโยงอย่างปลอดภัย
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#131f47] border border-stone-200 dark:border-stone-800 text-left space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-stone-200/60 dark:border-stone-700/60">
                <span className="text-stone-400">สถานะเซสชั่น:</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ใช้งานอยู่ (Active)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">ชื่อพนักงาน:</span>
                <span className="font-bold text-stone-900 dark:text-white">{currentUser.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">ตำแหน่ง / สิทธิ์:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{currentUser.role}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">โรงแรมที่จัดการอยู่:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {activePropertyId === "bugaan" 
                    ? "Bu-Gaan Sukhothai Village" 
                    : activePropertyId === "thanawong" 
                    ? "Thanawong Pool Villa" 
                    : "ภาพรวมทั้ง 2 โรงแรม"}
                </span>
              </div>

              {currentSession && (
                <>
                  <div className="pt-1.5 border-t border-stone-200/60 dark:border-stone-700/60 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-stone-500">
                      <span>รหัสเซสชั่น (Token):</span>
                      <code className="text-[10px] font-mono text-amber-600 dark:text-amber-400 truncate max-w-[170px]" title={currentSession.token}>
                        {currentSession.token.slice(0, 16)}...
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-stone-500">
                      <span>เข้าสู่ระบบเมื่อ:</span>
                      <span className="text-stone-700 dark:text-stone-300">
                        {new Date(currentSession.loginAt).toLocaleDateString("th-TH")} {new Date(currentSession.loginAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-stone-500">
                      <span>เซสชั่นหมดอายุ:</span>
                      <span className="text-stone-700 dark:text-stone-300 font-medium">
                        {new Date(currentSession.expiresAt).toLocaleDateString("th-TH")} (จดจำ {currentSession.rememberMe ? "7 วัน" : "24 ชม."})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-stone-500">
                      <span>อุปกรณ์ที่เชื่อมต่อ:</span>
                      <span className="text-stone-600 dark:text-stone-400 truncate max-w-[160px]">
                        {currentSession.device}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {onOpenPropertySelect && (
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  onOpenPropertySelect();
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-amber-400/80 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Hotel className="w-4 h-4" />
                <span>เปลี่ยนโรงแรมที่ต้องการจัดการ (Switch Property)</span>
              </button>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-slate-800 min-h-[44px]"
              >
                กลับสู่ระบบ
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setUsername("");
                  setPassword("");
                  setErrorMsg("");
                  setSuccessMsg("");
                  if (onClose) onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 min-h-[44px] cursor-pointer"
              >
                ออกจากระบบ (Logout)
              </button>
            </div>
          </div>
        ) : (
          /* Login Form */
          <div>
            {/* Header */}
            <div className="text-center pb-4 border-b border-stone-100 dark:border-stone-800/80">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-white mx-auto flex items-center justify-center shadow-md shadow-amber-500/20 mb-3">
                <Hotel className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-white">
                เข้าสู่ระบบพนักงาน (Staff Login)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Bu-Gaan Sukhothai Village & Thanawong Pool Villa
              </p>
            </div>

            {/* Error / Success alert */}
            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Quick Demo Switcher */}
            <div className="mt-4 pt-1">
              <span className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                เลือกบทบาททดสอบสิทธิ์สาขา (Quick Fill):
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSelect("admin")}
                  className="p-2 rounded-xl border border-amber-300/60 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30 text-left hover:bg-amber-100/60 transition-colors"
                >
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 truncate">GM Admin</div>
                  <div className="text-[9px] text-stone-500 truncate">ทุกโรงแรม</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect("frontdesk_bg")}
                  className="p-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-[#131f47] text-left hover:bg-amber-100/40 transition-colors"
                >
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 truncate">สาขาบูก้าน</div>
                  <div className="text-[9px] text-stone-500 truncate">เฉพาะ Bu-Gaan</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect("frontdesk_tw")}
                  className="p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-[#131f47] text-left hover:bg-emerald-100/40 transition-colors"
                >
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 truncate">สาขาธนวงศ์</div>
                  <div className="text-[9px] text-stone-500 truncate">เฉพาะ Thanawong</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3.5">
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
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
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
                    type="password"
                    required
                    placeholder="รหัสผ่าน (ค่าเริ่มต้น: 1234)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
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
                  className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:opacity-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/25 min-h-[44px] transition-all"
                >
                  เข้าสู่ระบบ (Sign In)
                </button>
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs text-center"
                >
                  ยกเลิก / ปิดหน้าต่าง
                </button>
              )}
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
