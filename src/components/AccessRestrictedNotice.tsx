"use client";

import React from "react";
import { usePMS } from "@/context/PMSContext";
import { 
  ShieldAlert, 
  Lock, 
  ArrowLeft, 
  UserCheck, 
  KeyRound, 
  ShieldCheck,
  XCircle 
} from "lucide-react";

interface AccessRestrictedNoticeProps {
  onGoBack: () => void;
  onOpenLogin: () => void;
}

export function AccessRestrictedNotice({ onGoBack, onOpenLogin }: AccessRestrictedNoticeProps) {
  const { currentUser } = usePMS();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-8 text-center animate-in fade-in">
      <div className="max-w-lg w-full bg-white dark:bg-[#0c132c] rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-300/40 dark:border-amber-800/40 space-y-5">
        
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center font-bold shadow-md border border-amber-500/20">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-400/30 text-[11px] font-bold mb-2">
            <Lock className="w-3 h-3" />
            <span>สิทธิ์การเข้าถึงจำกัด (Role-Based Restriction)</span>
          </div>

          <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-white tracking-tight">
            พื้นที่เฉพาะ General Manager หรือ Admin
          </h3>
          
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
            หน้าระบบหลังบ้าน (Backoffice) สำหรับจัดการผังห้องพัก, ตั้งราคา, เมนูอาหาร, ฐานข้อมูล และแก้ไขข้อมูลทางการเงิน สงวนสิทธิ์เฉพาะผู้บริหารระดับ <strong className="text-amber-600">General Manager (GM)</strong> หรือ <strong className="text-amber-600">Admin</strong> เท่านั้น
          </p>
        </div>

        {/* Current User Info Card */}
        {currentUser && (
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#111a3d] border border-stone-200 dark:border-stone-800 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-stone-400">บัญชีผู้ใช้ปัจจุบัน:</span>
              <span className="font-bold text-stone-900 dark:text-white">{currentUser.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">ตำแหน่ง / สิทธิ์:</span>
              <span className="font-semibold text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded bg-stone-200/80 dark:bg-stone-800">
                {currentUser.role}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">สถานะการอนุญาต:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>ไม่มีสิทธิ์จัดการระบบหลังบ้าน</span>
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onGoBack}
            className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-semibold hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าสถานะห้องพัก</span>
          </button>

          <button
            type="button"
            onClick={onOpenLogin}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <KeyRound className="w-4 h-4" />
            <span>สลับบัญชีผู้ใช้เป็น GM/Admin</span>
          </button>
        </div>

      </div>
    </div>
  );
}
