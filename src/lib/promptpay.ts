// Utility for Thai QR Payment (PromptPay) generation for Hotel Branches (Multi-Property)
import { PropertyId, PromptPayTargetType, PropertyPromptPayConfig } from "@/types/pms";

export interface PromptPayMerchantInfo {
  merchantName: string;
  bankName: string;
  accountNumberMasked: string;
  referenceNumber: string;
  aid: string;
}

export const BUGAAN_MERCHANT_INFO: PromptPayMerchantInfo = {
  merchantName: "บูก้านสุโขทัยวิลเลจ",
  bankName: "ธนาคารกสิกรไทย (KBANK)",
  accountNumberMasked: "xxx-x-x1419-x",
  referenceNumber: "004999209279107",
  aid: "A000000677010111",
};

export const DEFAULT_PROMPTPAY_CONFIGS: Record<PropertyId, PropertyPromptPayConfig> = {
  bugaan: {
    propertyId: "bugaan",
    propertyName: "Bu-Gaan Sukhothai Village (บูก้าน สุโขทัย วิลเลจ)",
    isActive: true,
    type: "BILLER_ID",
    promptPayId: "004999209279107",
    merchantName: "บูก้านสุโขทัยวิลเลจ",
    bankName: "ธนาคารกสิกรไทย (KBANK)",
    accountNumberMasked: "049-9-92092-7",
    autoFillAmount: true,
    note: "กรุณาตรวจสอบชื่อบัญชีและยอดเงินก่อนกดยืนยันการโอนเงิน",
  },
  thanawong: {
    propertyId: "thanawong",
    propertyName: "Thanawong Pool Villa (ธนะวงษ์ พูล วิลลา)",
    isActive: true,
    type: "TAX_ID",
    promptPayId: "0645564000188",
    merchantName: "บจก. ธนะวงษ์ พูล วิลล่า",
    bankName: "ธนาคารไทยพาณิชย์ (SCB)",
    accountNumberMasked: "408-5-98892-1",
    autoFillAmount: true,
    note: "กรุณาตรวจสอบชื่อบัญชีและแนบหลักฐานสลิปการโอนเงินทุกครั้ง",
  },
};

/**
 * Standard CRC16-CCITT (polynomial 0x1021, initial value 0xFFFF)
 * Used across EMVCo QR Code specifications and Bank of Thailand Thai QR standard.
 */
export function calculateCRC16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    const c = data.charCodeAt(i);
    crc ^= (c << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Normalizes PromptPay target identifier into Bank of Thailand EMVCo subtag format.
 * - Phone: Subtag 01 (0066 + 9 digits without leading 0) -> Length 13
 * - Tax / Citizen ID: Subtag 02 (13 digits) -> Length 13
 * - Biller ID / e-Wallet: Subtag 03 (15 digits) -> Length 15
 */
export function formatPromptPayTarget(target: string, type: PromptPayTargetType): { subtag: string; normalized: string } {
  const digits = (target || "").replace(/[^0-9]/g, "");

  if (type === "PHONE") {
    let phone = digits;
    if (phone.startsWith("66") && phone.length === 11) {
      phone = "0" + phone.slice(2);
    }
    if (phone.startsWith("0066") && phone.length === 13) {
      return {
        subtag: `0113${phone}`,
        normalized: "0" + phone.slice(4),
      };
    }
    if (phone.startsWith("0") && phone.length === 10) {
      const formatted = "0066" + phone.slice(1);
      return {
        subtag: `0113${formatted}`,
        normalized: phone,
      };
    }
    if (digits.length === 9) {
      const formatted = "0066" + digits;
      return {
        subtag: `0113${formatted}`,
        normalized: "0" + digits,
      };
    }
  } else if (type === "TAX_ID") {
    const taxId = digits.padStart(13, "0").slice(-13);
    return {
      subtag: `0213${taxId}`,
      normalized: taxId,
    };
  } else if (type === "BILLER_ID") {
    const biller = digits.padStart(15, "0").slice(-15);
    return {
      subtag: `0315${biller}`,
      normalized: biller,
    };
  }

  // Fallback detection based on length
  if (digits.length === 15) {
    return { subtag: `0315${digits}`, normalized: digits };
  } else if (digits.length === 13) {
    return { subtag: `0213${digits}`, normalized: digits };
  } else if (digits.length === 10 && digits.startsWith("0")) {
    return { subtag: `01130066${digits.slice(1)}`, normalized: digits };
  }

  // Generic 15-digit fallback
  const fallback = digits.padStart(15, "0").slice(-15);
  return { subtag: `0315${fallback}`, normalized: fallback };
}

/**
 * Generates an official Thai QR Payment (PromptPay) payload based on property configuration.
 * If amount is specified (> 0) and autoFillAmount is enabled, it generates a Dynamic QR code (Tag 01 = 12).
 * Otherwise, it produces a Static QR code (Tag 01 = 11).
 */
export function generatePromptPayPayload(config: PropertyPromptPayConfig, amount?: number): string {
  const isDynamic = typeof amount === "number" && amount > 0 && config.autoFillAmount !== false;

  // Tag 00: Payload Format Indicator (01)
  const tag00 = "000201";

  // Tag 01: Point of Initiation Method (12 = Dynamic with Amount, 11 = Static)
  const tag01 = isDynamic ? "010212" : "010211";

  // Tag 29: PromptPay Merchant Account Information
  const aid = "A000000677010111";
  const tag29Sub00 = `0016${aid}`;
  const targetInfo = formatPromptPayTarget(config.promptPayId, config.type);
  const tag29Content = tag29Sub00 + targetInfo.subtag;
  const tag29 = "29" + String(tag29Content.length).padStart(2, "0") + tag29Content;

  // Tag 53: Transaction Currency (764 = THB)
  const tag53 = "5303764";

  // Tag 54: Transaction Amount
  let tag54 = "";
  if (isDynamic) {
    const amountStr = amount.toFixed(2);
    tag54 = "54" + String(amountStr.length).padStart(2, "0") + amountStr;
  }

  // Tag 58: Country Code (TH)
  const tag58 = "5802TH";

  // Tag 63: Checksum container
  const rawWithoutCrc = tag00 + tag01 + tag29 + tag53 + tag54 + tag58 + "6304";
  const checksum = calculateCRC16(rawWithoutCrc);

  return rawWithoutCrc + checksum;
}

/**
 * Backward compatibility wrapper for Bu-Gaan Sukhothai Village
 */
export function generateBuGaanPromptPayPayload(amount?: number): string {
  return generatePromptPayPayload(DEFAULT_PROMPTPAY_CONFIGS.bugaan, amount);
}
