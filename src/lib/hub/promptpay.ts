// Thai PromptPay EMVCo QR payload builder — ported from SMA08
// client/src/lib/promptpay.js so both apps generate byte-identical payloads.
const tlv = (id: string, value: string) => id + String(value.length).padStart(2, "0") + value;

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// target: phone ("0812345678", also accepts +66 / dashes) or 13-digit id.
// amount: optional number; when present the QR is amount-locked (dynamic).
export function promptpayPayload(target: string, amount?: number | null): string {
  const digits = String(target || "").replace(/\D/g, "");
  let accountTlv: string;
  if (digits.length === 13) {
    accountTlv = tlv("02", digits); // national id / tax id
  } else {
    const local = digits.startsWith("66") ? digits.slice(2) : digits.replace(/^0/, "");
    accountTlv = tlv("01", "0066" + local);
  }
  const merchant = tlv("00", "A000000677010111") + accountTlv;
  const hasAmount = amount != null && Number(amount) > 0;
  let payload =
    tlv("00", "01") +
    tlv("01", hasAmount ? "12" : "11") +
    tlv("29", merchant) +
    tlv("53", "764") +
    (hasAmount ? tlv("54", Number(amount).toFixed(2)) : "") +
    tlv("58", "TH");
  payload += "6304";
  return payload + crc16(payload);
}
