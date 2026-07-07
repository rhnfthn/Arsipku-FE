import { z } from 'zod';

export const GenerateDraftSchema = z.object({
  naskahType: z.enum(['kajian', 'disposisi', 'ND', 'SDI', 'SDE']),
  brief: z.string().trim().min(5, 'Ringkasan maksud minimal 5 karakter'),
});

export type GenerateDraftPayload = z.infer<typeof GenerateDraftSchema>;

export interface DraftResult {
  draftHtml: string;
  draftPerihal: string;
  raw: boolean;
}

export const validateDraftPayload = (
  data: unknown
): {
  isValid: boolean;
  errors?: Record<string, string>;
  data?: GenerateDraftPayload;
} => {
  const result = GenerateDraftSchema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues?.[0] ?? null;
    const errorMessage = firstIssue?.message ?? 'Validasi gagal';
    const errorPath = firstIssue?.path?.[0] ? String(firstIssue.path[0]) : 'unknown';
    return { isValid: false, errors: { [errorPath]: errorMessage } };
  }
  return { isValid: true, data: result.data };
};
