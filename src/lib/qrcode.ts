import "server-only";
import QRCode from "qrcode";

export function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 640,
    margin: 2,
    color: { dark: "#1A1730", light: "#FFFFFF" },
  });
}
