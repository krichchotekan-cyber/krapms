"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { usePMS } from "@/context/PMSContext";
import { PropertyId } from "@/types/pms";
import { 
  generatePromptPayPayload, 
  DEFAULT_PROMPTPAY_CONFIGS 
} from "@/lib/promptpay";
import { formatCurrency } from "@/lib/utils";
import { 
  QrCode, 
  Camera, 
  Upload, 
  CheckCircle2, 
  X, 
  Download, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  RotateCcw,
  Sparkles,
  AlertCircle,
  Eye
} from "lucide-react";

interface PromptPayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  title?: string;
  bookingNumber?: string;
  roomNumber?: string;
  guestName?: string;
  propertyId?: PropertyId;
  onPaymentSuccess: (slipDataUrl?: string) => void;
}

export function PromptPayPaymentModal({
  isOpen,
  onClose,
  amount,
  title,
  bookingNumber,
  roomNumber,
  guestName,
  propertyId,
  onPaymentSuccess,
}: PromptPayPaymentModalProps) {
  const { getPromptPayConfig } = usePMS();
  const config = getPromptPayConfig(propertyId);

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrPayload, setQrPayload] = useState<string>("");
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [previewSlipModal, setPreviewSlipModal] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(amount);
  const [showCustomQrImage, setShowCustomQrImage] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize initial amount
  useEffect(() => {
    setCustomAmount(amount);
  }, [amount]);

  // Generate QR Code data URL dynamically based on amount
  useEffect(() => {
    if (!isOpen) return;

    try {
      const payload = generatePromptPayPayload(config, customAmount > 0 ? customAmount : undefined);
      setQrPayload(payload);

      QRCode.toDataURL(payload, {
        width: 320,
        margin: 1.5,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch((err) => {
          console.error("QR Code generation error:", err);
        });
    } catch (err) {
      console.error("Payload error:", err);
    }
  }, [isOpen, customAmount, config]);

  // Handle direct file upload or camera capture via file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSlipImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Live Webcam / Device Camera handling (Optional in-modal webcam stream)
  const startLiveCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Live camera stream error, falling back to camera input:", err);
      setIsCameraActive(false);
      // Trigger mobile camera input fallback
      cameraInputRef.current?.click();
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhotoFromLiveCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setSlipImage(dataUrl);
      stopLiveCamera();
    }
  };

  // Clean up camera stream when modal unmounts or closes
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Download QR code image
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `PromptPay-${config.propertyId}-${customAmount || "open"}-THB.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess(slipImage || undefined);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-[#0c142e] rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-amber-300/40 dark:border-amber-800/40 max-h-[95vh] overflow-y-auto my-auto relative">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>{title || "ชำระเงินผ่าน PromptPay QR"}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">
                  {config.propertyId === "bugaan" ? "Bu-Gaan Sukhothai" : "Thanawong Pool Villa"}
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                {roomNumber ? `ห้อง ${roomNumber}` : ""} {guestName ? `• ผู้เข้าพัก: ${guestName}` : ""}{" "}
                {bookingNumber ? `(${bookingNumber})` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopLiveCamera();
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Grid Layout (QR on left, Slip Capture on right) */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          
          {/* LEFT: Authentic Thai QR Payment Card */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[290px] rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-white shadow-lg text-stone-900 text-center">
              
              {/* Thai QR Payment Top Navy Banner */}
              <div className="bg-[#0b3864] text-white py-2.5 px-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-left">
                  <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black tracking-wider leading-none">THAI QR</div>
                    <div className="text-[9px] font-semibold text-stone-300 tracking-wider">PAYMENT</div>
                  </div>
                </div>

                <div className="bg-white text-[#0b3864] px-2 py-0.5 rounded text-[10px] font-black tracking-tight flex items-center gap-1 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logos/promptpay-logo.png"
                    alt="PromptPay"
                    className="w-3.5 h-3.5 object-contain"
                  />
                  <span>PromptPay</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-white flex flex-col items-center justify-center">
                {showCustomQrImage && config.customQrImage ? (
                  <div className="relative p-1.5 bg-white rounded-xl border border-stone-200 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={config.customQrImage} 
                      alt={`${config.propertyName} Official QR`} 
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                    />
                  </div>
                ) : qrDataUrl ? (
                  <div className="relative p-1.5 bg-white rounded-xl border border-stone-200 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={qrDataUrl} 
                      alt={`${config.propertyName} PromptPay QR Code`} 
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                    />
                    {/* PromptPay Center Emblem */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white p-0.5 shadow-md flex items-center justify-center border border-white overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/logos/promptpay-logo.png"
                          alt="PromptPay Logo"
                          className="w-full h-full object-contain rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-stone-400">
                    กำลังสร้าง QR Code...
                  </div>
                )}

                {/* Account Details */}
                <div className="mt-3 space-y-0.5 text-xs text-stone-700">
                  <p className="font-semibold text-emerald-700">สแกน QR เพื่อโอนเข้าบัญชีโรงแรม</p>
                  <p className="font-bold text-sm text-stone-900">
                    ชื่อ: {config.merchantName}
                  </p>
                  <p className="text-[11px] text-stone-600">
                    บัญชี: <span className="font-mono font-semibold">{config.accountNumberMasked}</span> ({config.bankName})
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono">
                    {config.type === "PHONE" 
                      ? `เบอร์พร้อมเพย์: ${config.promptPayId}` 
                      : config.type === "TAX_ID" 
                      ? `เลขประจำตัวผู้เสียภาษี: ${config.promptPayId}` 
                      : `Biller ID: ${config.promptPayId}`}
                  </p>
                  {config.note && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md mt-1">
                      {config.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Amount Display */}
              <div className="py-2.5 px-4 bg-stone-50 border-t border-b border-stone-200 flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">ยอดชำระ:</span>
                <span className="text-lg font-black text-emerald-700 font-serif">
                  {formatCurrency(customAmount)}
                </span>
              </div>

              {/* Bottom Footer: PromptPay Banner */}
              <div className="py-2 px-3 bg-[#0a5839] text-white flex items-center justify-center gap-1.5 text-[10px] font-medium">
                <span className="font-black bg-white text-[#0a5839] px-1 rounded text-[9px]">PromptPay</span>
                <span>Accepts all banks | รับเงินได้จากทุกธนาคาร</span>
              </div>

            </div>

            {/* Quick Actions for QR */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>บันทึกรูป QR</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Slip Capture & Upload Section */}
          <div className="space-y-4 flex flex-col justify-between h-full">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  หลักฐานการโอนเงิน (Slip Verification)
                </h4>
                {slipImage && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    แนบสลิปแล้ว
                  </span>
                )}
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Live Camera Stream if active */}
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 bg-black aspect-3/4 max-h-[300px] flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3 px-4">
                    <button
                      type="button"
                      onClick={capturePhotoFromLiveCamera}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg"
                    >
                      <Camera className="w-4 h-4" />
                      <span>กดถ่ายภาพ</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopLiveCamera}
                      className="px-3 py-2 bg-stone-800/80 hover:bg-stone-800 text-stone-200 font-semibold rounded-xl text-xs"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : slipImage ? (
                /* Slip Image Preview Card */
                <div className="p-3 rounded-2xl border-2 border-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2.5">
                  <div className="relative rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800 aspect-3/4 max-h-[220px] bg-stone-900 group">
                    <img
                      src={slipImage}
                      alt="Uploaded Payment Slip"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewSlipModal(true)}
                        className="p-2 bg-white/90 text-stone-900 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md"
                      >
                        <Eye className="w-4 h-4" /> ดูรูปเต็ม
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-stone-500 truncate text-[11px]">
                      เวลาแนบ: {new Date().toLocaleTimeString("th-TH")} น.
                    </span>
                    <button
                      type="button"
                      onClick={() => setSlipImage(null)}
                      className="text-rose-600 hover:text-rose-700 font-semibold underline text-xs cursor-pointer"
                    >
                      ลบ/ถ่ายใหม่
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Slip Upload Box with Camera & Gallery options */
                <div className="p-5 text-center rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-slate-900/40 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      ถ่ายรูปสลิป หรือ อัปโหลดหลักฐานการโอน
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      เมื่อแขกสแกนและโอนเงินแล้ว สามารถใช้กล้องถ่ายสลิปยืนยันได้ทันที
                    </p>
                  </div>

                  {/* Camera & Upload Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={startLiveCamera}
                      className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all min-h-[44px]"
                    >
                      <Camera className="w-4 h-4" />
                      <span>ถ่ายรูปสลิป</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all min-h-[44px]"
                    >
                      <Upload className="w-4 h-4" />
                      <span>เลือกไฟล์ภาพ</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Adjust custom amount option */}
              <div className="p-3 rounded-xl bg-stone-100/70 dark:bg-slate-800/60 border border-stone-200 dark:border-stone-700 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-600 dark:text-stone-400">ปรับยอดตามบิล:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-500 text-xs">฿</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Number(e.target.value))}
                      className="w-24 px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-900 text-right font-bold text-stone-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  stopLiveCamera();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-slate-800 min-h-[44px]"
              >
                ปิดหน้าต่าง
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmPayment}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
                  slipImage
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
                }`}
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>
                  {slipImage ? "ยืนยันรับเงินพร้อมสลิป" : "ยืนยันรับชำระเงิน"}
                </span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Fullscreen Slip Preview Modal */}
      {previewSlipModal && slipImage && (
        <div className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setPreviewSlipModal(false)}
            className="absolute top-4 right-4 p-2 text-white bg-stone-800/80 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={slipImage}
            alt="Full Slip Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}

    </div>
  );
}
