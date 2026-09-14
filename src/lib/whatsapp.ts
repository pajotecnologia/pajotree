/**
 * Utilitários para tratamento e normalização de números e links do WhatsApp
 */

export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  
  // Se tem 10 ou 11 dígitos (DDD + 8 ou 9 dígitos), adiciona o DDI do Brasil (55)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  
  return digits;
}

export function formatWhatsAppUrl(phone: string, text?: string): string {
  const fullPhone = normalizeWhatsAppPhone(phone);
  const encodedText = text?.trim() ? `?text=${encodeURIComponent(text.trim())}` : "";
  return `https://wa.me/${fullPhone}${encodedText}`;
}

export function normalizeWhatsAppDestinationUrl(url: string): string {
  if (!url) return url;

  // Corrige links no formato wa.me/<numero>
  const waMatch = url.match(/^(https?:\/\/)?wa\.me\/(\d+)(.*)$/i);
  if (waMatch) {
    let phone = waMatch[2];
    const rest = waMatch[3] || "";
    if (phone.length === 10 || phone.length === 11) {
      phone = `55${phone}`;
    }
    return `https://wa.me/${phone}${rest}`;
  }

  // Corrige links no formato api.whatsapp.com/send?phone=<numero>
  const apiMatch = url.match(/^(https?:\/\/)?api\.whatsapp\.com\/send\?phone=(\d+)(.*)$/i);
  if (apiMatch) {
    let phone = apiMatch[2];
    const rest = apiMatch[3] || "";
    if (phone.length === 10 || phone.length === 11) {
      phone = `55${phone}`;
    }
    return `https://api.whatsapp.com/send?phone=${phone}${rest}`;
  }

  return url;
}
