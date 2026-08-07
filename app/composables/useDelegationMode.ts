import { computed } from "vue";
import { useAuth } from "./useAuth";

const VIEW_ONLY_STATUSES = ["VI", "SE"] as const;
const LABELS: Record<string, string> = {
  VI: "Viewer",
  SE: "Sekretaris",
};

export const useDelegationMode = () => {
  const { user } = useAuth();

  const activePositionStatus = computed(() => user.value?.position_status ?? null);

  const isReadOnly = computed(() => {
    const s = activePositionStatus.value;
    return s ? (VIEW_ONLY_STATUSES as readonly string[]).includes(s) : false;
  });

  // Viewer (VI) saja — SE sudah bisa write pemberkasan (lihat @AllowViewerWrite),
  // jadi banner read-only hanya untuk VI yang betul-betul read-only.
  const isViewer = computed(() => activePositionStatus.value === "VI");

  const activePositionStatusLabel = computed(() => {
    const s = activePositionStatus.value;
    return s ? LABELS[s] ?? s : null;
  });

  // Jabatan ber-prefix actor saat delegated; mis. "PT. EVP of PMO - Interim Officer".
  // YBS (position_status null) -> positionText tanpa prefix (perilaku lama).
  const renderedPositionLabel = computed(() => {
    const s = user.value?.position_status;
    const pos = user.value?.positionText ?? "";
    return s ? `${s}. ${pos}` : pos;
  });

  return { activePositionStatus, isReadOnly, isViewer, activePositionStatusLabel, renderedPositionLabel };
};
