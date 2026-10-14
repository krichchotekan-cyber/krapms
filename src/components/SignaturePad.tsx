"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { RotateCcw, PenLine, Check } from "lucide-react";

interface SignaturePadProps {
  initialSignature?: string;
  onChange?: (signatureDataUrl: string | null) => void;
  height?: number;
  className?: string;
}

export function SignaturePad({
  initialSignature,
  onChange,
  height = 180,
  className = "",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [hasPoints, setHasPoints] = useState(false);

  // Initialize and resize canvas with High-DPI support
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = rect.width || 400;
    const displayHeight = height;

    // Save existing drawing if any before resizing
    let existingData: string | null = null;
    if (hasPoints) {
      try {
        existingData = canvas.toDataURL();
      } catch (e) {
        // ignore
      }
    }

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#1e3a8a"; // Classic blue signature pen ink

      if (initialSignature && !hasDrawn) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
          setHasPoints(true);
        };
        img.src = initialSignature;
      } else if (existingData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
        };
        img.src = existingData;
      }
    }
  }, [height, initialSignature, hasDrawn, hasPoints]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasPoints(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      onChange?.(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    setHasPoints(false);
    setHasDrawn(false);
    onChange?.(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-600 bg-stone-50/90 dark:bg-stone-100 overflow-hidden shadow-inner touch-none select-none"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair w-full h-full block"
        />

        {/* Baseline guideline */}
        <div className="absolute inset-x-8 bottom-7 border-b border-stone-300/80 pointer-events-none flex items-center justify-between text-[11px] text-stone-400 font-mono">
          <span className="flex items-center gap-1 text-stone-500">
            <PenLine className="w-3.5 h-3.5 text-stone-500" />
            <span>เซ็นชื่อบนเส้นนี้ (Sign on this line)</span>
          </span>
          <span className="text-[10px] text-stone-400">X</span>
        </div>

        {/* Empty state hint */}
        {!hasPoints && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-stone-400">
            <p className="text-xs font-medium">ใช้นิ้วหรือปากกา Stylus / เมาส์ เซ็นชื่อในกรอบนี้</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-stone-400 text-[11px]">
          {hasPoints ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>บันทึกลายเซ็นเรียบร้อย</span>
            </span>
          ) : (
            <span>กรุณาให้ลูกค้าเซ็นชื่อเพื่อยืนยันการเข้าพัก</span>
          )}
        </span>

        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-stone-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
          <span>ล้างลายเซ็น</span>
        </button>
      </div>
    </div>
  );
}
