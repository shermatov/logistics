import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SKU, Warehouse, TariffConfig } from "../data/types";
import { skus as staticSkus, warehouses as staticWarehouses, dailyHistory as staticDailyHistory, type DailyMetric } from "../data/sampleData";
import { wbTariffs as staticWbTariffs, cargoTariffs as staticCargoTariffs } from "../data/tariffs";
import { fetchSkus, fetchWarehouses, fetchTariffs, fetchDailyMetrics, API_URL, type CargoTariffConfig } from "../lib/api";

type Source = "live" | "fallback" | "loading";

interface DataStoreState {
  skus: SKU[];
  warehouses: Warehouse[];
  wbTariffs: TariffConfig;
  cargoTariffs: CargoTariffConfig;
  dailyHistory: DailyMetric[];
  sources: {
    skus: Source;
    warehouses: Source;
    tariffs: Source;
    dailyMetrics: Source;
  };
  backendConfigured: boolean;
  refetch: () => void;
}

const DataStoreContext = createContext<DataStoreState | null>(null);

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [skus, setSkus] = useState<SKU[]>(staticSkus);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(staticWarehouses);
  const [wbTariffs, setWbTariffs] = useState<TariffConfig>(staticWbTariffs);
  const [cargoTariffs, setCargoTariffs] = useState<CargoTariffConfig>(staticCargoTariffs);
  const [dailyHistory, setDailyHistory] = useState<DailyMetric[]>(staticDailyHistory);
  const [sources, setSources] = useState<DataStoreState["sources"]>({
    skus: "loading",
    warehouses: "loading",
    tariffs: "loading",
    dailyMetrics: "loading",
  });
  const [reloadKey, setReloadKey] = useState(0);

  const backendConfigured = Boolean(API_URL);

  useEffect(() => {
    if (!backendConfigured) {
      setSources({ skus: "fallback", warehouses: "fallback", tariffs: "fallback", dailyMetrics: "fallback" });
      return;
    }

    let cancelled = false;

    fetchSkus()
      .then((data) => {
        if (cancelled) return;
        setSkus(data);
        setSources((s) => ({ ...s, skus: "live" }));
      })
      .catch(() => {
        if (cancelled) return;
        setSources((s) => ({ ...s, skus: "fallback" }));
      });

    fetchWarehouses()
      .then((data) => {
        if (cancelled) return;
        setWarehouses(data);
        setSources((s) => ({ ...s, warehouses: "live" }));
      })
      .catch(() => {
        if (cancelled) return;
        setSources((s) => ({ ...s, warehouses: "fallback" }));
      });

    fetchTariffs()
      .then((data) => {
        if (cancelled) return;
        setWbTariffs(data.wb);
        setCargoTariffs(data.cargo);
        setSources((s) => ({ ...s, tariffs: "live" }));
      })
      .catch(() => {
        if (cancelled) return;
        setSources((s) => ({ ...s, tariffs: "fallback" }));
      });

    fetchDailyMetrics()
      .then((data) => {
        if (cancelled) return;
        if (data.length > 0) setDailyHistory(data);
        setSources((s) => ({ ...s, dailyMetrics: "live" }));
      })
      .catch(() => {
        if (cancelled) return;
        setSources((s) => ({ ...s, dailyMetrics: "fallback" }));
      });

    return () => {
      cancelled = true;
    };
  }, [backendConfigured, reloadKey]);

  const value = useMemo<DataStoreState>(
    () => ({
      skus,
      warehouses,
      wbTariffs,
      cargoTariffs,
      dailyHistory,
      sources,
      backendConfigured,
      refetch: () => setReloadKey((k) => k + 1),
    }),
    [skus, warehouses, wbTariffs, cargoTariffs, dailyHistory, sources, backendConfigured]
  );

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error("useDataStore must be used within DataStoreProvider");
  return ctx;
}
