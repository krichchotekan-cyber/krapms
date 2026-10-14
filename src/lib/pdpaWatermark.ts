/**
 * PDPA Compliant ID Document Compression & Watermarking Utility
 * Automatically stamps a diagonal security watermark onto guest identity documents
 * ensuring they cannot be used for unauthorized purposes outside hotel registration.
 */

export function compressImageWithPdpaWatermark(
  file: File,
  hotelName: string = "โรงแรม",
  bookingNumber?: string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Draw original document
        ctx.drawImage(img, 0, 0, width, height);

        // Apply Security PDPA Watermark Overlay
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((-22 * Math.PI) / 180);

        // Semi-transparent dark ribbon for high contrast on light ID cards
        const ribbonWidth = width * 1.35;
        const ribbonHeight = Math.max(68, Math.round(height * 0.16));
        ctx.fillStyle = "rgba(15, 23, 42, 0.60)";
        ctx.fillRect(-ribbonWidth / 2, -ribbonHeight / 2, ribbonWidth, ribbonHeight);

        // White border lines for the security stamp ribbon
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = Math.max(1.5, Math.round(width * 0.0025));
        ctx.strokeRect(-ribbonWidth / 2, -ribbonHeight / 2, ribbonWidth, ribbonHeight);

        // Primary text
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const fontSize1 = Math.max(14, Math.round(width * 0.034));
        ctx.font = `bold ${fontSize1}px sans-serif`;
        ctx.fillText("สำหรับใช้ลงทะเบียนเข้าพักโรงแรมเท่านั้น (PDPA COMPLIANT)", 0, -ribbonHeight * 0.22);

        // Secondary text
        const fontSize2 = Math.max(11, Math.round(width * 0.022));
        ctx.font = `600 ${fontSize2}px sans-serif`;
        const todayStr = new Date().toISOString().split("T")[0];
        const subText = `${hotelName} ${bookingNumber ? `| เลขที่ #${bookingNumber} ` : ""}| วันที่ ${todayStr}`;
        ctx.fillText(subText, 0, ribbonHeight * 0.24);

        ctx.restore();

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
