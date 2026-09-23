// ==========================================
//   DIGSIG
// ==========================================
export interface KonfigurasiDigsigItem {
  id: string;
  jenisNaskah: string; // ND, SDI, SDE, DI, KA, NL (naskah umum ikut NL)
  enabled: boolean;
  description: string;
  /** Jalur TTE digsig: bsre_direct (BSrE v2 langsung) | portal (redirect Portal TTE) */
  tteMode?: 'bsre_direct' | 'portal';
  digsig?: boolean;
  ttdQr?: boolean;
  ttdBasah?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KonfigurasiDigsigResponse {
  success: boolean;
  data: KonfigurasiDigsigItem[];
}

export interface ToggleKonfigurasiDigsigResponse {
  success: boolean;
  data: KonfigurasiDigsigItem;
}

// ==========================================
//   PENGUMUMAN / MESSAGE
// ==========================================
export type MessageType = 'info' | 'warning' | 'success';

export interface KonfigurasiMessageItem {
  id: string;
  title: string;
  message: string;
  type: MessageType;
  showBanner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KonfigurasiMessageResponse {
  success: boolean;
  data: KonfigurasiMessageItem[];
}

export interface KonfigurasiMessageSingleResponse {
  success: boolean;
  data: KonfigurasiMessageItem;
}

export interface CreateMessagePayload {
  title: string;
  message: string;
  type: MessageType;
  show_banner: boolean;
}

export interface UpdateMessagePayload {
  title: string;
  message: string;
  type: MessageType;
  show_banner: boolean;
}

// ==========================================
//   SEARCH ENGINE
// ==========================================
export type SearchEngineMode = 'v3' | 'meili';

export interface KonfigurasiSearchItem {
  id: string;
  mode: SearchEngineMode;
  meiliEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KonfigurasiSearchResponse {
  success: boolean;
  data: KonfigurasiSearchItem;
}

export interface UpdateSearchConfigPayload {
  mode?: SearchEngineMode;
  meili_enabled?: boolean;
}

// ==========================================
//   TEMA BERANDA
// ==========================================
export interface KonfigurasiThemeItem {
  id: string;
  name: string;
  slug: string;
  imageKey: string;
  imageUrl: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  repeatYearly: boolean;
  isEnabled: boolean;
  manualOverride: boolean | null;
  priority: number;
  source: 'manual' | 'scheduled';
  createdAt: string;
  updatedAt: string;
}

export interface KonfigurasiThemePayload {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  repeat_yearly: boolean;
  is_enabled: boolean;
  priority: number;
  image?: File;
}

export interface KonfigurasiThemeListResponse {
  success: boolean;
  data: KonfigurasiThemeItem[];
}

export interface KonfigurasiThemeResponse {
  success: boolean;
  data: KonfigurasiThemeItem | null;
}
