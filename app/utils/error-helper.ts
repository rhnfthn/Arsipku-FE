/**
 * Ekstrak pesan error dari AxiosError / response BE.
 * BE kadang mengembalikan { message: string[] | string }.
 */
export function extractErrorMessage(err: any): string {
  const beMessage = err?.response?.data?.message;
  if (Array.isArray(beMessage) && beMessage.length > 0) {
    return beMessage.join(', ');
  }
  if (typeof beMessage === 'string' && beMessage.trim()) {
    return beMessage;
  }
  return err?.message || 'Terjadi kesalahan';
}
