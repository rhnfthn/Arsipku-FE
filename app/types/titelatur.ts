export interface TitelaturItem {
  id: string;
  company: string | null;
  start_date: string | null;
  end_date: string | null;
  object_type: string | null;
  long_text: string | null;
  long_text_en: string | null;
  create_at: string;
  update_at: string;
}

export interface TitelaturListResponse {
  success: boolean;
  data: TitelaturItem[];
  total: number;
}

export interface TitelaturSingleResponse {
  success: boolean;
  data: TitelaturItem;
}

export interface TitelaturDeleteResponse {
  success: boolean;
}

export interface CreateTitelaturPayload {
  company: string;
  start_date: string;
  end_date: string;
  object_type: string;
  long_text: string;
  long_text_en: string;
}

export interface UpdateTitelaturPayload {
  company?: string;
  start_date?: string;
  end_date?: string;
  object_type?: string;
  long_text?: string;
  long_text_en?: string;
}
