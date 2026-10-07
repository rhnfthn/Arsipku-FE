/** Satukan metadata naskah dengan langkah terakhir dari naskah asal yang sama. */
export function mergeSentConceptFlow(flows: any[]): any[] {
  const merged = new Map<any, any>();
  const consumed = new Set<any>();
  for (const document of flows.filter(flow => flow.jenis === 'KN')) {
    const originalId = String(document.id_naskah_asli || document.id || '');
    if (!originalId) continue;
    const history = flows.find(flow =>
      flow.jenis === 'K' && String(flow.id_naskah_asli || '') === originalId,
    );
    if (!history) continue;
    merged.set(history, {
      ...history,
      perihal: document.perihal || history.perihal,
      konten: document.konten ?? history.konten,
      final_pdf: document.final_pdf || history.final_pdf,
      final_pdf_url: document.final_pdf_url || history.final_pdf_url,
      lampiran_files: document.lampiran_files || history.lampiran_files,
      konsepNaskah: document,
    });
    consumed.add(document);
  }
  return flows.filter(flow => !consumed.has(flow)).map(flow => merged.get(flow) || flow);
}

/** Gabungkan hanya aksi finalisasi dengan dokumen hasilnya; langkah lain tetap tampil. */
export function mergeFinalizedConceptFlow(flows: any[]): any[] {
  const consumed = new Set<any>();
  const merged = new Map<any, any>();
  for (const event of flows) {
    if (event.jenis !== 'K' || event.aksi !== 'finalize' || !event.id_naskah_asli) continue;
    const document = flows.find(flow =>
      !['K', 'KO', 'KN'].includes(flow.jenis) &&
      String(flow.id) === String(event.id_naskah_asli),
    );
    if (!document) continue;
    const previous = merged.get(document)?.conceptFinalization;
    if (!previous || Number(event.konsep_sequence || 0) > Number(previous.konsep_sequence || 0)) {
      merged.set(document, { ...document, conceptFinalization: event });
    }
    consumed.add(event);
  }
  return flows.filter(flow => !consumed.has(flow)).map(flow => merged.get(flow) || flow);
}

/** Nomor dapat terbit sebelum TTE selesai; status final mengikuti status naskah. */
export function sentConceptDocumentStatus(document: any) {
  const status = String(document?.status || '').toLowerCase();
  const isFinal = ['final', 'final_tte', 'selesai', 'terkirim'].includes(status);
  return {
    isFinal,
    label: isFinal ? 'Final' : 'Pending',
    description: isFinal
      ? 'Konsep sudah menjadi naskah final.'
      : status === 'pending_tte'
        ? 'Naskah menunggu penyelesaian tanda tangan elektronik.'
        : 'Konsep masih dalam proses dan belum menjadi naskah final.',
    badgeClass: isFinal
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  };
}
