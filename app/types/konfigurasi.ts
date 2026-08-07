// ==========================================
//   DIGSIG
// ==========================================
export interface KonfigurasiDigsigItem {
  id: string;
  jenisNaskah: string; // ND, SDI, SDE, DI, KA
  enabled: boolean;
  description: string;
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
export type MessageType = "info" | "warning" | "success";

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
export type SearchEngineMode = "v3" | "meili";

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
