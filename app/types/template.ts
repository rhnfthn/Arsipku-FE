// types/template.ts

export interface Template {
  id: string;
  tanggal: string | null;
  nama_template: string;
  file: string;
  file_url?: string;
  create_at: string;
  update_at: string;
}

export interface TemplateListResponse {
  success: boolean;
  total: number;
  data: Template[];
}

export interface TemplateDetailResponse {
  success: boolean;
  data: Template;
}

export interface TemplateCreatePayload {
  nama_template: string;
  file: File;
  tanggal?: string;
}

export interface TemplateUpdatePayload {
  nama_template: string;
  file?: File | string;
}

export interface TemplateDeleteResponse {
  success: boolean;
  message: string;
}
