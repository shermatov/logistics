import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./state/auth";
import { ProgressProvider } from "./state/progress";
import { DataStoreProvider } from "./state/dataStore";
import { Layout } from "./components/layout/Layout";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { ManagerModePage } from "./pages/ManagerModePage";
import { CapstonePage } from "./pages/CapstonePage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { AdminPage } from "./pages/AdminPage";
import { AccountPage } from "./pages/AccountPage";
import { M01Fundamentals } from "./modules/M01Fundamentals";
import { M02Wildberries } from "./modules/M02Wildberries";
import { M03FbsFbw } from "./modules/M03FbsFbw";
import { M04Economics } from "./modules/M04Economics";
import { M05Packaging } from "./modules/M05Packaging";
import { M06Warehouse } from "./modules/M06Warehouse";
import { M07Inventory } from "./modules/M07Inventory";
import { M08Distribution } from "./modules/M08Distribution";
import { M14DecisionEngine } from "./modules/M14DecisionEngine";
import { CargoModule } from "./modules/CargoModule";
import { M09Localization } from "./modules/M09Localization";
import { M10Returns } from "./modules/M10Returns";
import { M11FbsOps } from "./modules/M11FbsOps";
import { M12OwnWarehouse } from "./modules/M12OwnWarehouse";
import { M13Transportation } from "./modules/M13Transportation";
import { M16Alerts } from "./modules/M16Alerts";
import { M17Scenarios } from "./modules/M17Scenarios";
import { M18Crisis } from "./modules/M18Crisis";
import { M19Strategy } from "./modules/M19Strategy";
import { M20SystemMap } from "./modules/M20SystemMap";

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <DataStoreProvider>
          <HashRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/manager-mode" element={<ManagerModePage />} />
                <Route path="/capstone" element={<CapstonePage />} />
                <Route path="/roadmap" element={<RoadmapPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/modules/m01" element={<M01Fundamentals />} />
                <Route path="/modules/m02" element={<M02Wildberries />} />
                <Route path="/modules/m03" element={<M03FbsFbw />} />
                <Route path="/modules/m04" element={<M04Economics />} />
                <Route path="/modules/m05" element={<M05Packaging />} />
                <Route path="/modules/m06" element={<M06Warehouse />} />
                <Route path="/modules/m07" element={<M07Inventory />} />
                <Route path="/modules/m08" element={<M08Distribution />} />
                <Route path="/modules/m09" element={<M09Localization />} />
                <Route path="/modules/m10" element={<M10Returns />} />
                <Route path="/modules/m11" element={<M11FbsOps />} />
                <Route path="/modules/m12" element={<M12OwnWarehouse />} />
                <Route path="/modules/m13" element={<M13Transportation />} />
                <Route path="/modules/cargo" element={<CargoModule />} />
                <Route path="/modules/m14" element={<M14DecisionEngine />} />
                <Route path="/modules/m16" element={<M16Alerts />} />
                <Route path="/modules/m17" element={<M17Scenarios />} />
                <Route path="/modules/m18" element={<M18Crisis />} />
                <Route path="/modules/m19" element={<M19Strategy />} />
                <Route path="/modules/m20" element={<M20SystemMap />} />
              </Route>
            </Routes>
          </HashRouter>
        </DataStoreProvider>
      </ProgressProvider>
    </AuthProvider>
  );
}
