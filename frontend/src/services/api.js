const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "요청 처리 중 오류가 발생했습니다." }));
    throw new Error(error.detail || "요청 처리 중 오류가 발생했습니다.");
  }

  if (response.status === 204) return null;
  return response.json();
}

function queryString(params) {
  const values = Object.entries(params).filter(([, value]) => value && value !== "ALL");
  return values.length ? `?${new URLSearchParams(values).toString()}` : "";
}

export const api = {
  health: () => request("/health"),
  meta: () => request("/meta/options"),
  dashboard: () => request("/dashboard"),
  pasRecords: (filters) => request(`/pas/records${queryString(filters)}`),
  createPas: (payload) => request("/pas/records", { method: "POST", body: JSON.stringify(payload) }),
  updatePas: (id, payload) =>
    request(`/pas/records/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deletePas: (id) => request(`/pas/records/${id}`, { method: "DELETE" }),
  uploads: (filters) => request(`/pas/uploads${queryString(filters)}`),
  uploadPas: (formData) => request("/pas/uploads", { method: "POST", body: formData }),
  cpmsRecords: (filters) => request(`/cpms/records${queryString(filters)}`),
  cpmsDetail: (id) => request(`/cpms/records/${id}`),
  updateCpms: (id, payload) =>
    request(`/cpms/records/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: { "X-User-Role": "SYSTEM_ADMIN" },
    }),
  columnConfig: (module, product, tech) =>
    request(`/column-configs${queryString({ module, product, tech })}`),
  saveColumnConfig: (module, product, tech, columns) =>
    request(`/column-configs${queryString({ module, product, tech })}`, {
      method: "PUT",
      body: JSON.stringify({ columns, updated_by: "김하늘" }),
    }),
  logs: () => request("/admin/logs"),
  batches: () => request("/admin/batches"),
  updateBatch: (module, schedule) =>
    request(`/admin/batches/${module}`, {
      method: "PATCH",
      body: JSON.stringify({ schedule }),
    }),
};

export function pasSocketUrl() {
  if (import.meta.env.VITE_PAS_WS_URL) return import.meta.env.VITE_PAS_WS_URL;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:8000/ws/pas`;
}
