import { useCallback, useEffect, useState } from "react";

import { Layout } from "./components/Layout";
import { Toast } from "./components/Toast";
import { AdminPage } from "./pages/AdminPage";
import { CpmsPage } from "./pages/CpmsPage";
import { HomePage } from "./pages/HomePage";
import { PasPage } from "./pages/PasPage";
import { api } from "./services/api";

export default function App() {
  const [page, setPage] = useState("home");
  const [products, setProducts] = useState({ DRAM: ["1a", "1b"], NAND: ["V8", "V9"] });
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    api.meta()
      .then((result) => {
        setProducts(result.products);
        setConnected(true);
      })
      .catch(() => setConnected(false));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const renderPage = () => {
    if (page === "pas") return <PasPage products={products} notify={notify} />;
    if (page === "cpms") return <CpmsPage products={products} notify={notify} />;
    if (page === "admin") return <AdminPage notify={notify} />;
    return <HomePage onNavigate={setPage} />;
  };

  return (
    <Layout currentPage={page} onNavigate={setPage} connected={connected}>
      {renderPage()}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  );
}

