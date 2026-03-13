import { ref } from "vue";
import { useApi } from "~/composables/useApi";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

// ✅ Interface lengkap sesuai dokumentasi API
export interface InboxParams {
  page?: number;
  limit?: number;
  jenis?: string; // ND | SDI | SDE | DI | KA | K
  status_baca?: string; // terbaca | belum_terbaca
  search?: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  preset?: string; // 7_hari | 30_hari | 60_hari | 1_tahun | semua
  // ✅ Filter tambahan dari API docs
  favorite?: boolean; // true | false
  tinjut?: string; // sudah_tinjut | belum_tinjut
  lock?: boolean; // true | false
  note?: boolean; // true | false
  arsip?: boolean; // true | false — default false (exclude archived)
  priority?: boolean; // true — khusus jenis=DI
  sort?: string; // asc | desc (opsional, default desc)
}

export function useInbox() {
  const { apiGet, apiPut, apiPatch } = useApi();

  const items = ref<any[]>([]);
  const pending = ref(false);
  const error = ref<any>(null);

  const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

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

      // Pagination
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());

      // Jenis naskah
      if (params.jenis && !["ALL", "Semua"].includes(params.jenis)) {
        query.append("jenis", params.jenis);
      }

      // Status baca
      if (params.status_baca) {
        query.append("status_baca", params.status_baca);
      }

      // Search
      if (params.search) {
        query.append("search", params.search);
      }

      // Date preset
      if (params.preset) {
        query.append("preset", params.preset);
      }

      // Custom date range
      if (params.start_date) query.append("start_date", params.start_date);
      if (params.end_date) query.append("end_date", params.end_date);

      // Sort
      if (params.sort) query.append("sort", params.sort);

      // ✅ Filter flags — hanya dikirim jika terdefinisi (boolean)
      if (params.favorite !== undefined) {
        query.append("favorite", String(params.favorite));
      }
      if (params.tinjut) {
        query.append("tinjut", params.tinjut);
      }
      if (params.lock !== undefined) {
        query.append("lock", String(params.lock));
      }
      if (params.note !== undefined) {
        query.append("note", String(params.note));
      }
      if (params.arsip !== undefined) {
        // Hanya kirim arsip=true saat memang ingin melihat arsip
        // Default backend adalah false (exclude archived), tidak perlu dikirim
        query.append("arsip", String(params.arsip));
      }
      if (params.priority !== undefined) {
        query.append("priority", String(params.priority));
      }

      const res = await apiGet(`/naskah_sirkulasi/inbox/?${query.toString()}`);

      const responseBody = res?.data?.pagination ? res.data : res;
      const rawItems = Array.isArray(responseBody?.data)
        ? responseBody.data
        : [];

      items.value = rawItems.map((it: any) => {
        const pengirimName = it.pengirim?.nama || "-";
        const pengirimPos = it.pengirim?.position_text || "-";
        const listKepada = it.kepada || [];
        const isSDE = ["SDE", "EXTERNAL", "EKSTERNAL"].includes(
          (it.jenis || "").toUpperCase(),
        );

        const fullRecipientList =
          listKepada.length > 0
            ? listKepada
                .map((p: any, idx: number) => {
                  const pName = isSDE ? p.nama : p.position_text || p.nama;
                  return `${idx + 1}. ${pName}`;
                })
                .join("\n")
            : "Tanpa Penerima";

        return {
          id: it.id_sirkulasi || it.id,
          sirkulasiId: it.id_sirkulasi,
          naskahId: it.id_naskah,
          jenis: it.jenis,
          category: it.jenis,
          category_label: it.jenis_label,
          nomor: it.nomor,
          date: formatDateTime(it.created_at),
          subject: (it.perihal || "").toString().trim(),
          is_priority: it.is_priority,
          fullRecipients: fullRecipientList,
          from: pengirimPos,
          fromPosition: pengirimPos,
          fromName: pengirimName,
          initial:
            pengirimName !== "-"
              ? pengirimName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()
              : "?",
          isRead: it.status_baca === "terbaca",
          isStarred: it.is_favorit,
          isArsip: it.is_arsip,
          isNote: it.is_note,
          isTinjut: it.is_tindak_lanjut,
          isLocked: it.is_locked,
          labels: it.labels || [],
          pengirim: it.pengirim,
          kepada: listKepada,
          penerimaAktif: it.penerima || null,
          raw: it,
        };
      });

      if (responseBody?.pagination) pagination.value = responseBody.pagination;
      if (responseBody?.summary) summary.value = responseBody.summary;
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
      if (summary.value.total_belum_dibaca > 0) {
        summary.value.total_belum_dibaca--;
      }
    } catch (err) {
      console.error("Gagal update status baca:", err);
    }
  };

  const toggleFlag = async (
    mail: any,
    flagType: "favorit" | "arsip" | "note" | "tindak_lanjut" | "lock",
  ) => {
    const getOldVal = () => {
      if (flagType === "favorit") return mail.isStarred;
      if (flagType === "arsip") return mail.isArsip;
      if (flagType === "note") return mail.isNote;
      if (flagType === "tindak_lanjut") return mail.isTinjut;
      if (flagType === "lock") return mail.isLocked;
      return false;
    };

    const oldVal = getOldVal();

    try {
      const idToSend = mail.sirkulasiId || mail.raw?.id_sirkulasi;
      if (!idToSend) throw new Error("ID Sirkulasi tidak ditemukan");

      await apiPatch("/naskah_sirkulasi/toggle-flag", {
        id_sirkulasi: idToSend,
        flag_type: flagType,
      });
    } catch (err) {
      console.error("Gagal toggle flag:", flagType, err);
      // Revert ke nilai lama jika API gagal
      if (flagType === "favorit") mail.isStarred = oldVal;
      else if (flagType === "arsip") mail.isArsip = oldVal;
      else if (flagType === "note") mail.isNote = oldVal;
      else if (flagType === "tindak_lanjut") mail.isTinjut = oldVal;
      else if (flagType === "lock") mail.isLocked = oldVal;
      throw err;
    }
  };

  const unsetPriority = async (mail: any) => {
    const idNaskah = mail.naskahId;
    if (!idNaskah) throw new Error("ID Naskah tidak ditemukan");
    return await apiPatch(`/DI/${idNaskah}/unset-priority`);
  };

  const JENIS_LABEL_MAP: Record<string, string> = {
    ND: "Nota Dinas",
    DI: "Disposisi",
    SDI: "Surat Dinas Internal",
    SDE: "Surat Dinas Eksternal",
  };

  const fetchInboxDetail = async (idNaskah: string, jenis?: string) => {
    pending.value = true;
    error.value = null;

    const processGrouping = (individuals: any[], groups: any[]) => {
      if (!Array.isArray(individuals) || individuals.length === 0) return [];
      if (!Array.isArray(groups) || groups.length === 0) return individuals;

      const individualIds = new Set(
        individuals.map((item) => String(item.position_id)),
      );
      const matchedIds = new Set<string>();
      const result: any[] = [];

      for (const group of groups) {
        const reqIds = group.position_ids || [];
        const isComplete =
          reqIds.length > 0 &&
          reqIds.every((id: any) => individualIds.has(String(id)));

        if (isComplete) {
          result.push({
            nama: group.nama,
            position_text: group.nama,
            organization_text: "Grup Penerima",
            is_group: true,
          });
          reqIds.forEach((id: any) => matchedIds.add(String(id)));
        }
      }

      for (const indiv of individuals) {
        if (!matchedIds.has(String(indiv.position_id))) {
          result.push(indiv);
        }
      }

      return result;
    };

    try {
      const res = await apiGet(
        `/persuratan/naskah/${encodeURIComponent(idNaskah)}`,
      );

      const dataArray =
        res?.data && Array.isArray(res.data)
          ? res.data
          : res?.data
            ? [res.data]
            : [];
      if (dataArray.length === 0) return null;

      const mapped = dataArray.map((d: any) => {
        const rawPenerima = Array.isArray(d.penerima)
          ? d.penerima
          : d.kepada || [];
        const rawTembusan = d.tembusan || [];

        const groupedPenerima = processGrouping(
          rawPenerima,
          d.penerima_grup || [],
        );
        const groupedTembusan = processGrouping(
          rawTembusan,
          d.tembusan_grup || [],
        );

        return {
          id: d.id,
          ttd: d.label_ttd,
          jenis: d.jenis,
          jenis_label: d.jenis_label || JENIS_LABEL_MAP[d.jenis] || d.jenis,
          nomor: d.nomor,
          tanggal: d.tanggal,
          perihal: d.perihal,
          sifat: d.sifat,
          status: d.status,
          pengirim: d.pengirim,
          kepada: groupedPenerima,
          penerima: groupedPenerima,
          tembusan: groupedTembusan,
          kepada_yth: d.detail?.kepada_yth || d.kepada_yth,
          disposisi: d.detail?.disposisi || d.disposisi,
          catatan: d.detail?.catatan || d.catatan,
          konten: d.konten,
          lampiran_files: d.lampiran_files || [],
          final_pdf_url: d.final_pdf_url || d.final_pdf,
          referensi: d.referensi || null,
          raw: d,
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
      const res = await apiGet(`/konsep/${idKonsep}`);
      if (!res || !res.data) return null;

      const flows = Array.isArray(res.data) ? res.data : [res.data];
      const sortedFlows = [...flows].sort(
        (a, b) =>
          new Date(b.created_at || b.tanggal).getTime() -
          new Date(a.created_at || a.tanggal).getTime(),
      );

      const lastFlow = sortedFlows.length > 0 ? sortedFlows[0] : null;
      const firstFlow = sortedFlows[sortedFlows.length - 1];
      const catatanReject =
        lastFlow?.detail?.aksi === "reject" ? lastFlow.detail.catatan : null;
      const lastFlowWithPdf = sortedFlows.find((f) => f.final_pdf_url);
      const finalPdf = lastFlowWithPdf ? lastFlowWithPdf.final_pdf_url : null;

      return {
        id: idKonsep,
        nomor: lastFlow?.nomor || "-",
        perihal: lastFlow?.perihal || firstFlow?.perihal || "",
        status: lastFlow?.status,
        last_action: lastFlow?.detail?.aksi,
        pengirim: lastFlow?.detail?.naskah_pengirim || lastFlow?.pengirim,
        kepada: lastFlow?.detail?.naskah_penerima || lastFlow?.penerima || [],
        tembusan: lastFlow?.detail?.naskah_tembusan || lastFlow?.tembusan || [],
        final_pdf_url: finalPdf,
        catatan_reject: catatanReject,
        flow: sortedFlows,
      };
    } catch (err: any) {
      console.error("fetchKonsepDetail error:", err);
      error.value = err;
      return null;
    } finally {
      pending.value = false;
    }
  };

  return {
    items,
    pagination,
    summary,
    pending,
    error,
    fetchInbox,
    markAsRead,
    toggleFlag,
    fetchInboxDetail,
    unsetPriority,
    fetchKonsepDetail,
  };
}
