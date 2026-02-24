import { z } from "zod";

// --- Schemas ---

export const StatusSchema = z.object({
  code: z.string(),
  label: z.string(),
});

export const DelegasiItemSchema = z.object({
  id: z.string(),
  start_date: z.string(),
  end_date: z.string(),

  // --- PENERIMA DELEGASI (as_*) ---
  as_name: z.string().nullish(),
  as_persnum: z.string().nullish(),
  as_position: z.string().nullish(),
  as_position_text: z.string().nullish(),
  as_organization: z.string().nullish(),
  as_organization_text: z.string().nullish(),
  as_area: z.string().nullish(),
  as_area_text: z.string().nullish(),
  as_sub_area: z.string().nullish(),
  as_sub_area_text: z.string().nullish(),

  // --- PEMBERI DELEGASI (Delegator) ---
  name: z.string().nullish(),
  persnum: z.string().nullish(),
  position: z.string().nullish(),
  position_text: z.string().nullish(),
  organization: z.string().nullish(),
  organization_text: z.string().nullish(),
  area: z.string().nullish(),
  area_text: z.string().nullish(),
  sub_area: z.string().nullish(),
  sub_area_text: z.string().nullish(),

  // --- UMUM & STATUS ---
  company: z.string().nullish(),
  company_text: z.string().nullish(),
  position_status: z.string().nullish(), // cth: "PT", "VI", "PH"
  create_at: z.string().nullish(),
  update_at: z.string().nullish(),
  status: StatusSchema,
});

export const DelegasiResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    data: z.array(DelegasiItemSchema),
    meta: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }),
  }),
});

// ... (Sisa kode ke bawah tidak ada yang diubah)
export const PersonilSchema = z.object({
  persnum: z.string(),
  name: z.string(),
  currentPosition: z.number(),
  currentPositionText: z.string(),
  displayText: z.string(),
});

export const PositionStatusSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const JabatanItemSchema = z.object({
  id: z.string(),
  position: z.number(),
  shortText: z.string(),
  longText: z.string(),
  abbreviation: z.string().nullish(),
  company: z.number(),
  companyText: z.string(),
  organization: z.number(),
  organizationText: z.string(),
  area: z.string(),
  areaText: z.string(),
  subArea: z.number(),
  subAreaText: z.string(),
  bodTag: z.string().nullish(),
  isChief: z.boolean(),
  persnum: z.union([z.string(), z.number()]).nullish(),

  persnumText: z.string().nullish(),
  divisiId: z.number().nullish(),
  divisiName: z.string().nullish(),
  direktoratId: z.number().nullish(),
  direktoratName: z.string().nullish(),

  displayText: z.string(),
});

// Schema untuk Response Wrapper (success: true, data: [...])
export const JabatanResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(JabatanItemSchema),
});

// --- Type Inference ---
export type JabatanItem = z.infer<typeof JabatanItemSchema>;
export type DelegasiItem = z.infer<typeof DelegasiItemSchema>;
export type DelegasiResponse = z.infer<typeof DelegasiResponseSchema>;
export type PersonilItem = z.infer<typeof PersonilSchema>;
export type PositionStatusItem = z.infer<typeof PositionStatusSchema>;

export interface DelegasiPayload {
  start_date: string;
  end_date: string;
  position_status: string;
  as_persnum?: string;
  as_name?: string;
  as_position?: string;
}
