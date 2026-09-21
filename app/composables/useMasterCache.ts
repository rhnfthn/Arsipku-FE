import type { Klasifikasi } from "./useKlasifikasi";
import type { JenisItem } from "./useJenis";

const KLASIFIKASI_KEY = "__master_klasifikasi";
const JENIS_KEY = "__master_jenis";

export const useMasterCache = () => {
  const klasifikasi = useState<Klasifikasi[] | null>(KLASIFIKASI_KEY, () => null);
  const jenis = useState<JenisItem[] | null>(JENIS_KEY, () => null);
  const isLoadingKlasifikasi = useState("__loading_klasifikasi", () => false);
  const isLoadingJenis = useState("__loading_jenis", () => false);

  return {
    klasifikasi,
    jenis,
    isLoadingKlasifikasi,
    isLoadingJenis,
  };
};
