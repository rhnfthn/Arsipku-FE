// types/template.ts

export interface TemplateSurat {
  id: string;
  id_position: string;
  nama_template: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface TemplatePayload {
  id_position: string;
  nama_template: string;
  content: string;
}
