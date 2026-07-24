// utils/mail-helpers.ts
// Shared helpers untuk halaman korespondensi (kotak masuk, terkirim, label, dll)

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const monthShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const monthLong = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export const formatShortDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const now = new Date();
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  const isThisYear = date.getFullYear() === now.getFullYear();

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const time = `${hours}.${minutes}`;
  const day = date.getDate();
  const month = monthShort[date.getMonth()];

  if (isToday) return time;
  if (isThisYear) return `${day} ${month} ${time}`;
  return `${day} ${month} ${date.getFullYear()} ${time}`;
};

export const formatFullDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthLong[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${dayName}, ${day} ${month} ${year} ${hours}.${minutes}`;
};

export const getCategoryStyle = (cat: string): string => {
  const c = (cat || "").toUpperCase();
  // Existing types
  if (["ND", "NOTA DINAS"].includes(c)) return "bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300";
  if (["DI", "DISPOSISI"].includes(c)) return "bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-300";
  if (["SDI", "INTERNAL"].includes(c)) return "bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-300";
  if (["SDE", "EXTERNAL", "EKSTERNAL"].includes(c)) return "bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300";
  if (["KAJIAN", "KA"].includes(c)) return "bg-cyan-50 text-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-300";
  // URS poin 6 - Pengaturan dan Penetapan
  if (["PER"].includes(c)) return "bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-300";
  if (["KEP"].includes(c)) return "bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-300";
  if (["INS"].includes(c)) return "bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-300";
  if (["SPR"].includes(c)) return "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400";
  if (["SOP"].includes(c)) return "bg-lime-50 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400";
  if (["SE"].includes(c)) return "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400";
  // URS poin 6 - Khusus (Surat Perjanjian & lainnya)
  if (["NK", "PKS", "LOA", "LOCA", "KTR", "PLN", "ADN", "SPK", "ASP", "SK"].includes(c))
    return "bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300";
  if (["BA", "UND", "KET", "PGN", "RIS", "PUM", "SRT", "PGA", "LAP", "BVB"].includes(c))
    return "bg-fuchsia-50 text-fuchsia-500 dark:bg-fuchsia-900/30 dark:text-fuchsia-300";
  return "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300";
};

export const getCategoryLabel = (cat: string): string => {
  const c = (cat || "").toUpperCase();
  // Existing types (preserve original short labels)
  if (["KA"].includes(c)) return "KA";
  if (["SDI", "INTERNAL"].includes(c)) return "SDI";
  if (["SDE", "EXTERNAL", "EKSTERNAL"].includes(c)) return "SDE";
  if (["ND", "NOTA DINAS"].includes(c)) return "ND";
  if (["DI", "DISPOSISI"].includes(c)) return "DI";
  // URS poin 6 - new types: return code as-is
  if (c) return c;
  return "K";
};

/** Nama lengkap jenis surat untuk tooltip/keterangan */
export const getCategoryFullName = (cat: string): string => {
  const c = (cat || "").toUpperCase();
  if (["KA"].includes(c)) return "Kajian";
  if (["SDI", "INTERNAL"].includes(c)) return "Surat Dinas Internal";
  if (["SDE", "EXTERNAL", "EKSTERNAL"].includes(c)) return "Surat Dinas Eksternal";
  if (["ND", "NOTA DINAS"].includes(c)) return "Nota Dinas";
  if (["DI", "DISPOSISI"].includes(c)) return "Disposisi";
  if (["K", "KONSEP"].includes(c)) return "Konsep";
  if (c) return c;
  return "Konsep";
};

export const getInitials = (name: string): string => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

/** Format tanggal + waktu (id-ID, 2-digit) */
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Format tanggal id-ID dengan day 2-digit (tanpa waktu) */
export const formatDate2Digit = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

/** Format tanggal dd/mm/yyyy */
export const formatDateSlash = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
};

/** Format tanggal panjang: dd Month yyyy */
export const formatDateLong = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  return `${day} ${monthLong[date.getMonth()]} ${date.getFullYear()}`;
};

/** Format tanggal id-ID dengan day 2-digit + month long (mis. "09 Juni 2025") */
export const formatDateLong2Digit = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const local = typeof dateString === "string" ? dateString.replace("Z", "").replace("+00:00", "") : dateString;
  const date = new Date(local);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
};

/** Format tanggal dd/mm/yyyy dengan opsi strip timezone (WIB) sebelum parsing */
export const formatDateNumeric = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const local = typeof dateString === "string" ? dateString.replace("Z", "").replace("+00:00", "") : dateString;
  const date = new Date(local);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
};

/** Format waktu HH:mm (id-ID) */
export const formatTimeShort = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const local = typeof dateString === "string" ? dateString.replace("Z", "").replace("+00:00", "") : dateString;
  const date = new Date(local);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

/** Format tanggal + waktu dd 2-digit mm 2-digit yyyy HH:mm (id-ID), dengan strip timezone opsional */
export const formatDateTimeNumeric = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const local = typeof dateString === "string" ? dateString.replace("Z", "").replace("+00:00", "") : dateString;
  const date = new Date(local);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Format "dd MMM yyyy, HH:mm" (dengan koma) - umum dipakai pada list korespondensi */
export const formatDateWithTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  const d = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const t = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${d}, ${t}`;
};

/**
 * Build full URL untuk file dari backend.
 * Jika url sudah absolute (http/https/blob), return apa adanya.
 * Jika url adalah relative path (e.g. /preview-file/xxx), tambahkan apiBaseUrl.
 */
export const buildFileUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl as string;
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

/**
 * Fetch file dari backend dengan Authorization header (JWT token).
 * Mengembalikan Blob URL yang bisa langsung dipakai di <iframe> atau <img>.
 *
 * - Jika URL sudah absolute (presigned MinIO, blob, data URI), langsung return tanpa fetch.
 * - Jika URL adalah relative path backend, fetch dengan token lalu buat Blob URL.
 *
 * @param url - URL file (bisa relative path atau absolute URL)
 * @param contentType - MIME type untuk Blob (default: 'application/pdf')
 * @returns Blob URL string, atau URL asli jika fetch gagal/bukan relative path
 */
export const fetchFileWithAuth = async (
  url: string | null | undefined,
  contentType: string = "application/pdf",
): Promise<string> => {
  if (!url) return "";

  // Jika sudah absolute URL (http/https), blob, atau data URI → langsung pakai
  if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  // Relative path → fetch dari backend dengan token
  const fullUrl = buildFileUrl(url);
  const token = process.client ? localStorage.getItem("token") : null;

  try {
    const response = await fetch(fullUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      console.warn(`[fetchFileWithAuth] HTTP ${response.status} for ${fullUrl}`);
      return fullUrl;
    }

    const blob = new Blob([await response.arrayBuffer()], { type: contentType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("[fetchFileWithAuth] Error:", error);
    return fullUrl;
  }
};
