import { ref } from "vue";
import { useApi } from "~/composables/useApi";

const toWibDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  // Input dari BE adalah UTC (suffix Z). Tambahkan 7 jam untuk WIB.
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
};

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit", month: "long", year: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false,
  timeZone: "UTC",
});

const formatDateTime = (value: string | null | undefined) => {
  const d = toWibDate(value);
  if (!d) return "-";
  return dateTimeFormatter.format(d);
};

export interface InboxParams {
  page?: number;
  limit?: number;
  jenis?: string;
  status_baca?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  favorite?: boolean;
  tinjut?: string;
  lock?: boolean;
  note?: boolean;
  arsip?: boolean;
  priority?: boolean;
  sort?: string;
}

export function useInbox() {
  const { apiGet, apiPut, apiPatch, clearApiCache } = useApi();

  // State dipindahkan ke dalam fungsi agar setiap consumer punya instance sendiri
  const items = ref<any[]>([]);
  const pending = ref(false);
  const error = ref<any>(null);
  const pagination = ref({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const summary = ref({
    total_semua: 0,
    total_belum_dibaca: 0,
    total_per_jenis: {} as Record<string, number>,
  });

  const fetchInbox = async (params: InboxParams = {}) => {
    pending.value = true;
    error.value = null;

    try {
      const query = new URLSearchParams();
      if (params.page)   query.append("page", params.page.toString());
      if (params.limit)  query.append("limit", params.limit.toString());
      if (params.jenis && !["ALL", "Semua"].includes(params.jenis)) query.append("jenis", params.jenis);
      if (params.status_baca)  query.append("status_baca", params.status_baca);
      if (params.search)       query.append("search", params.search);
      if (params.start_date)   query.append("start_date", params.start_date);
      if (params.end_date)     query.append("end_date", params.end_date);
      if (params.sort)         query.append("sort", params.sort);
      if (params.tinjut)       query.append("tinjut", params.tinjut);
      if (params.favorite !== undefined) query.append("favorite", String(params.favorite));
      if (params.lock     !== undefined) query.append("lock",     String(params.lock));
      if (params.note     !== undefined) query.append("note",     String(params.note));
      if (params.arsip    !== undefined) query.append("arsip",    String(params.arsip));
      if (params.priority !== undefined) query.append("priority", String(params.priority));

      const res = await apiGet(`/naskah_sirkulasi/inbox/?${query.toString()}`, {}, { skipCache: params.search ? true : false });

      const responseBody = res?.data?.pagination ? res.data : res;
      const rawItems = Array.isArray(responseBody?.data) ? responseBody.data : [];

      if (responseBody?.pagination) pagination.value = responseBody.pagination;
      if (responseBody?.summary)    summary.value    = responseBody.summary;

      items.value = rawItems.map((it: any) => {
        const pengirimName = it.pengirim?.nama || "-";
        const pengirimPos  = it.pengirim?.position_text || "-";
        const listKepada   = it.kepada || [];
        const isSDE = ["SDE", "EXTERNAL", "EKSTERNAL"].includes((it.jenis || "").toUpperCase());

        const fullRecipientList = listKepada.length > 0
          ? listKepada.map((p: any, idx: number) => `${idx + 1}. ${isSDE ? p.nama : p.position_text || p.nama}`).join("\n")
          : "Tanpa Penerima";

        return {
          id:             it.id_sirkulasi || it.id,
          sirkulasiId:    it.id_sirkulasi,
          // Fallback chain: kadang backend pakai id_naskah / naskah_id / id
          naskahId:       it.id_naskah || it.naskah_id || it.id || null,
          jenis:          it.jenis,
          category:       it.jenis || it.jenis_label || 'ND',
          category_label: it.jenis_label,
          nomor:          it.nomor,
          date:           formatDateTime(it.created_at),
          subject:        (it.perihal || "").toString().trim(),
          is_priority:    it.is_priority,
          fullRecipients: fullRecipientList,
          from:           pengirimPos,
          fromPosition:   pengirimPos,
          fromName:       pengirimName,
          initial:        pengirimName !== "-"
            ? pengirimName.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
            : "?",
          isRead:    it.status_baca === "terbaca",
          isStarred: it.is_favorit,
          isArsip:   it.is_arsip,
          isNote:    it.is_note,
          noteText:  it.note_text || '',
          isTinjut:  it.is_tindak_lanjut,
          isLocked:  it.is_locked,
          labels:    it.labels || [],
          pengirim:  it.pengirim,
          kepada:    listKepada,
          penerimaAktif: it.penerima || null,
          raw: it,
        };
      });

    } catch (err: any) {
      console.error("useInbox error:", err);
      error.value = err.message || "Terjadi kesalahan";
      items.value = [];
    } finally {
      pending.value = false;
    }
  };

  const markAsRead = async (mail: any, positionId: string) => {
    if (mail.isRead) return;
    try {
      await apiPut("/naskah_sirkulasi/update-read-status", {
        id_naskah: mail.naskahId,
        position_id: positionId,
      });
      mail.isRead = true;
      if (mail.raw) {
        mail.raw.status_baca = "terbaca";
        mail.raw.read_time = new Date().toISOString();
      }
      if (summary.value.total_belum_dibaca > 0) summary.value.total_belum_dibaca--;
    } catch (err) {
      console.error("Gagal update status baca:", err);
    }
  };

  const markNaskahAsRead = async (idNaskah: string, positionId: string) => {
    if (!idNaskah || !positionId) return;
    try {
      await apiPut("/naskah_sirkulasi/update-read-status", {
        id_naskah: idNaskah,
        position_id: positionId,
      });
      if (summary.value.total_belum_dibaca > 0) summary.value.total_belum_dibaca--;
      clearApiCache();
    } catch (err) {
      console.error("Gagal update status baca (nav):", err);
    }
  };

  const toggleFlag = async (
    mail: any,
    flagType: "favorit" | "arsip" | "note" | "tindak_lanjut" | "lock",
    noteText?: string,
  ) => {
    const oldValMap: Record<string, any> = {
      favorit: mail.isStarred, arsip: mail.isArsip,
      note: mail.isNote, tindak_lanjut: mail.isTinjut, lock: mail.isLocked,
    };
    const oldVal = oldValMap[flagType];

    try {
      const idToSend = mail.sirkulasiId || mail.raw?.id_sirkulasi;
      if (!idToSend) throw new Error("ID Sirkulasi tidak ditemukan");
      const payload: any = { id_sirkulasi: idToSend, flag_type: flagType };
      if (flagType === "note" && noteText !== undefined) {
        payload.note_text = noteText;
      }
      await apiPatch("/naskah_sirkulasi/toggle-flag", payload);
    } catch (err) {
      console.error("Gagal toggle flag:", flagType, err);
      if (flagType === "favorit")       mail.isStarred = oldVal;
      else if (flagType === "arsip")    mail.isArsip   = oldVal;
      else if (flagType === "note")     mail.isNote    = oldVal;
      else if (flagType === "tindak_lanjut") mail.isTinjut = oldVal;
      else if (flagType === "lock")     mail.isLocked  = oldVal;
      throw err;
    }
  };

  const unsetPriority = async (mail: any) => {
    const idNaskah = mail.naskahId;
    if (!idNaskah) throw new Error("ID Naskah tidak ditemukan");
    return await apiPatch(`/DI/${idNaskah}/unset-priority`);
  };

  const JENIS_LABEL_MAP: Record<string, string> = {
    ND: "Nota Dinas", DI: "Disposisi",
    SDI: "Surat Dinas Internal", SDE: "Surat Dinas Eksternal",
  };

  const fetchInboxDetail = async (idNaskah: string, jenis?: string) => {
    pending.value = true;
    error.value = null;

    const processGrouping = (individuals: any[], groups: any[]) => {
      if (!Array.isArray(individuals) || individuals.length === 0) return [];
      if (!Array.isArray(groups) || groups.length === 0) return individuals;

      const individualIds = new Set(individuals.map((item) => String(item.position_id)));
      const matchedIds = new Set<string>();
      const result: any[] = [];

      for (const group of groups) {
        const reqIds = group.position_ids || [];
        const isComplete = reqIds.length > 0 && reqIds.every((id: any) => individualIds.has(String(id)));
        if (isComplete) {
          result.push({ nama: group.nama, position_text: group.nama, organization_text: "Grup Penerima", is_group: true });
          reqIds.forEach((id: any) => matchedIds.add(String(id)));
        }
      }
      for (const indiv of individuals) {
        if (!matchedIds.has(String(indiv.position_id))) result.push(indiv);
      }
      return result;
    };

    try {
      const res = await apiGet(`/persuratan/naskah/${encodeURIComponent(idNaskah)}`, {}, { skipCache: true });

      const dataArray = res?.data && Array.isArray(res.data) ? res.data : res?.data ? [res.data] : [];
      if (dataArray.length === 0) return null;

      const userSirkulasi = res?.user_sirkulasi || null;

      const mapped = dataArray.map((d: any) => {
        const rawPenerima = Array.isArray(d.penerima) ? d.penerima : d.kepada || [];
        const groupedPenerima = processGrouping(rawPenerima, d.penerima_grup || []);
        const groupedTembusan = processGrouping(d.tembusan || [], d.tembusan_grup || []);

        return {
          id:             d.id,
          ttd:            d.label_ttd,
          jenis:          d.jenis,
          jenis_label:    d.jenis_label || JENIS_LABEL_MAP[d.jenis] || d.jenis,
          nomor:          d.nomor,
          tanggal:        d.tanggal,
          perihal:        d.perihal,
          sifat:          d.sifat,
          status:         d.status,
          pengirim:       d.pengirim,
          kepada:         groupedPenerima,
          penerima:       groupedPenerima,
          tembusan:       groupedTembusan,
          kepada_yth:     d.detail?.kepada_yth || d.kepada_yth,
          disposisi:      d.detail?.disposisi  || d.disposisi,
          catatan:        d.detail?.catatan    || d.catatan,
          konten:         d.konten,
          lampiran_files: d.lampiran_files || [],
          final_pdf_url:  d.final_pdf_url  || d.final_pdf,
          referensi:      d.referensi || null,
          flow:           d.flow || [],
          created_at:     d.createdAt || d.created_at,
          raw: d,
          user_sirkulasi: userSirkulasi,
          isStarred:      userSirkulasi?.is_favorit ?? false,
          isTinjut:       userSirkulasi?.is_tindak_lanjut ?? false,
          isLocked:       userSirkulasi?.is_locked ?? false,
          isNote:         userSirkulasi?.is_note ?? false,
          isArsip:        userSirkulasi?.is_arsip ?? false,
          sirkulasiId:    userSirkulasi?.id_sirkulasi ?? null,
          noteText:       userSirkulasi?.note_text ?? '',
        };
      });

      return mapped.length === 1 ? mapped[0] : mapped;
    } catch (err: any) {
      console.error("fetchInboxDetail error:", err);
      error.value = err;
      return null;
    } finally {
      pending.value = false;
    }
  };

  const fetchKonsepDetail = async (idKonsep: string) => {
    pending.value = true;
    error.value = null;
    try {
      const res = await apiGet(`/konsep/${idKonsep}`, {}, { skipCache: true });
      if (!res?.data) return null;

      const flows = Array.isArray(res.data) ? res.data : [res.data];
      const sortedFlows = [...flows].sort(
        (a, b) => new Date(b.created_at || b.tanggal).getTime() - new Date(a.created_at || a.tanggal).getTime(),
      );

      const lastFlow  = sortedFlows[0] ?? null;
      const firstFlow = sortedFlows[sortedFlows.length - 1];
      const catatanReject   = lastFlow?.detail?.aksi === "reject" ? lastFlow.detail.catatan : null;
      const lastFlowWithPdf = sortedFlows.find((f) => f.final_pdf_url);

      const fromPositionId = lastFlow?.pengirim?.position_id;
      const fromPositionText = lastFlow?.pengirim?.position_text;
      const fromNama = lastFlow?.pengirim?.nama;

      const toPositionId = lastFlow?.penerima[0]?.position_id;
      const toPositionText = lastFlow?.penerima[0]?.position_text;
      const toNama = lastFlow?.penerima[0]?.nama;

      return {
        id:             idKonsep,
        nomor:          lastFlow?.nomor || "-",
        perihal:        lastFlow?.perihal || firstFlow?.perihal || "",
        status:         lastFlow?.status,
        last_action:    lastFlow?.detail?.aksi,
        from_position_id: fromPositionId ? String(fromPositionId) : null,
        from_position_text: fromPositionText,
        from_nama: fromNama,
        to_position_id: toPositionId ? String(toPositionId) : null,
        to_position_text: toPositionText,
        to_nama: toNama,
        pengirim:       lastFlow?.detail?.naskah_pengirim || lastFlow?.pengirim,
        to_konsep:       lastFlow?.penerima[0] || {},
        kepada:         lastFlow?.detail?.naskah_penerima || lastFlow?.penerima || [],
        tembusan:       lastFlow?.detail?.naskah_tembusan || lastFlow?.tembusan || [],
        final_pdf_url:  lastFlowWithPdf?.final_pdf_url ?? null,
        catatan_reject: catatanReject,
        flow:           sortedFlows,
      };
    } catch (err: any) {
      console.error("fetchKonsepDetail error:", err);
      error.value = err;
      return null;
    } finally {
      pending.value = false;
    }
  };

  const fetchInboxNavigation = async (idNaskah: string, jenis?: string) => {
    try {
      const query = new URLSearchParams();
      if (jenis && !["ALL", "Semua"].includes(jenis)) query.append("jenis", jenis);
      const res: any = await apiGet(
        `/naskah_sirkulasi/inbox/${encodeURIComponent(idNaskah)}/navigation${query.toString() ? `?${query.toString()}` : ""}`,
        {},
        { skipCache: true },
      );

      // Backend mengembalikan { success, message, data: { current, previous, next } }
      // apiGet sudah me-return res.data (axios), jadi res = { success, data: {...} }
      const navData = res?.data ?? res;
      return {
        current: navData?.current ?? null,
        previous: navData?.previous ?? null,
        next: navData?.next ?? null,
      };
    } catch (err) {
      console.error("fetchInboxNavigation error:", err);
      return { current: null, previous: null, next: null };
    }
  };

  return {
    items, pagination, summary, pending, error,
    fetchInbox, markAsRead, markNaskahAsRead, toggleFlag,
    fetchInboxDetail, unsetPriority, fetchKonsepDetail,
    fetchInboxNavigation,
  };
}
