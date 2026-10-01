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

  const renderedPositionLabel = computed(() => {
    const positionText = user.value?.positionText ?? "";
    const status = String(activePositionStatus.value ?? "").toUpperCase();
    if (!["PT", "PH", "PS"].includes(status)) return positionText;
    return new RegExp(`^${status}\\.\\s*`, "i").test(positionText)
      ? positionText
      : `${status}. ${positionText}`;
  });

  // Nama orang tetap ditampilkan tanpa prefix; prefix delegasi melekat pada jabatan.
  const renderedActorName = computed(() => user.value?.nama ?? "");

  return {
    activePositionStatus,
    isReadOnly,
    isViewer,
    activePositionStatusLabel,
    renderedPositionLabel,
    renderedActorName,
  };
};
