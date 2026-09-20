export function normalizeWhatsAppPhone(phone: string) {
  return phone.replace(/[\u0660-\u0669\u06f0-\u06f9]/g,
    (digit) => String(digit.charCodeAt(0) % 16)).replace(/\D/g, "");
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);

  if (!normalizedPhone) {
    throw new Error("WhatsApp phone number is required.");
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
