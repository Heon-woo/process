import { useCallback, useEffect, useState } from "react";

import { ColumnPanel } from "../components/ColumnPanel";
import { DataTable } from "../components/DataTable";
import { ScopeFilters } from "../components/Filters";
import { Icon } from "../components/Icons";
import { Loading } from "../components/Loading";
import { api, pasSocketUrl } from "../services/api";

const INITIAL_FILTERS = {
  product: "DRAM",
  tech: "1a",
  search: "",
  date_from: "",
  date_to: "",
};

const EDITABLE_FIELDS = [
  "process", "device", "title", "requester", "owner_team", "status", "priority",
  "target_date", "change_type", "equipment", "recipe", "comment",
];

export function PasPage({ products, notify }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [columnPanelOpen, setColumnPanelOpen] = useState(false);
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [collaborators, setCollaborators] = useState(1);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.pasRecords(filters);
      setRows(result.items);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filters, notify]);

  const loadConfig = useCallback(async () => {
    if (filters.product === "ALL" || filters.tech === "ALL") return;
    try {
      const result = await api.columnConfig("PAS", filters.product, filters.tech);
      setColumns(result.columns);
    } catch (error) {
      notify(error.message, "error");
    }
  }, [filters.product, filters.tech, notify]);

  useEffect(() => {
    const timer = setTimeout(loadRecords, 180);
    return () => clearTimeout(timer);
  }, [loadRecords]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    let socket;
    let retryTimer;
    let disposed = false;

    const connect = () => {
      socket = new WebSocket(pasSocketUrl());
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "presence") {
          setCollaborators(Math.max(1, message.count));
          return;
        }
        loadRecords();
      };
      socket.onclose = () => {
        if (!disposed) retryTimer = window.setTimeout(connect, 1000);
      };
    };

    connect();
    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, [loadRecords]);

  const addRow = async () => {
    if (filters.product === "ALL" || filters.tech === "ALL") {
      notify("행을 추가하려면 Product와 Tech를 선택하세요.", "error");
      return;
    }
    const target = new Date();
    target.setDate(target.getDate() + 7);
    try {
      const created = await api.createPas({
        product: filters.product,
        tech: filters.tech,
        target_date: target.toISOString().slice(0, 10),
      });
      setRows((current) =>
        current.some((row) => row.id === created.id) ? current : [created, ...current],
      );
      notify("새 공정 변경 행을 추가했습니다. 셀을 더블 클릭해 편집하세요.");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const updateCell = async (id, field, value) => {
    try {
      const updated = await api.updatePas(id, { [field]: value });
      setRows((current) => current.map((row) => (row.id === id ? updated : row)));
      notify("변경 내용이 즉시 반영되었습니다.");
    } catch (error) {
      notify(error.message, "error");
      loadRecords();
    }
  };

  const deleteRow = async (row) => {
    if (!window.confirm(`${row.document_no} 행을 삭제하시겠습니까?`)) return;
    try {
      await api.deletePas(row.id);
      setRows((current) => current.filter((item) => item.id !== row.id));
      notify("행을 삭제했습니다.");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const saveColumns = async () => {
    try {
      await api.saveColumnConfig("PAS", filters.product, filters.tech, columns);
      setColumnPanelOpen(false);
      notify(`${filters.product}/${filters.tech} 컬럼 설정을 저장했습니다.`);
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const openUploads = async () => {
    setUploadPanelOpen(true);
    try {
      const result = await api.uploads(filters);
      setUploads(result.items);
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("product", filters.product);
    form.append("tech", filters.tech);
    form.append("uploaded_by", "김하늘");
    try {
      const uploaded = await api.uploadPas(form);
      setUploads((current) => [uploaded, ...current]);
      notify(`${file.name} 파일을 업로드했습니다.`);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="page sheet-page">
      <section className="page-heading compact-heading">
        <div>
          <div className="title-line">
            <span className="module-symbol pas">P</span>
            <div>
              <p className="eyebrow">PCCB AUTOMATION SYSTEM</p>
              <h1>공정 변경 협의 관리</h1>
            </div>
          </div>
          <p>다부서 협의부터 승인까지 실시간으로 공동 편집합니다.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={openUploads}>
            <Icon name="upload" size={16} /> 파일 관리
          </button>
          <button
            className="secondary-button"
            onClick={() => setColumnPanelOpen(true)}
            disabled={filters.product === "ALL" || filters.tech === "ALL"}
          >
            <Icon name="columns" size={16} /> 컬럼 설정
          </button>
          <button className="primary-button" onClick={addRow}>
            <Icon name="plus" size={16} /> 행 추가
          </button>
        </div>
      </section>

      <ScopeFilters
        products={products}
        filters={filters}
        onChange={setFilters}
        onRefresh={loadRecords}
      />

      <section className="sheet-card">
        <div className="sheet-toolbar">
          <div>
            <strong>{filters.product} / {filters.tech}</strong>
            <span>총 {rows.length}건</span>
            <span className="collaboration"><span className="pulse-dot" /> {collaborators}명 접속 중</span>
          </div>
          <div>
            <span className="edit-hint"><Icon name="edit" size={14} /> 셀 더블 클릭 시 편집</span>
            <span className="autosave"><Icon name="check" size={14} /> 자동 저장</span>
          </div>
        </div>
        {loading || !columns.length ? (
          <Loading />
        ) : (
          <DataTable
            rows={rows}
            columns={columns}
            onColumnsChange={setColumns}
            editableFields={EDITABLE_FIELDS}
            onCellChange={updateCell}
            onDelete={deleteRow}
          />
        )}
        <div className="sheet-footer">
          <span>표시 {rows.length} / {rows.length}건</span>
          <span>마지막 동기화 2026-06-11 09:00 · Data Lake hq1</span>
        </div>
      </section>

      {columnPanelOpen && (
        <>
          <div className="panel-backdrop" onClick={() => setColumnPanelOpen(false)} />
          <ColumnPanel
            columns={columns}
            onChange={setColumns}
            onClose={() => setColumnPanelOpen(false)}
            onSave={saveColumns}
            scope={`${filters.product} / ${filters.tech}`}
          />
        </>
      )}

      {uploadPanelOpen && (
        <>
          <div className="panel-backdrop" onClick={() => setUploadPanelOpen(false)} />
          <aside className="side-panel upload-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">ATTACHMENTS</p>
                <h3>파일 관리</h3>
                <small>{filters.product} / {filters.tech} 공유 파일</small>
              </div>
              <button className="icon-button" onClick={() => setUploadPanelOpen(false)}>
                <Icon name="close" />
              </button>
            </div>
            <label className="upload-dropzone">
              <input type="file" onChange={uploadFile} accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg" />
              <span className="upload-icon"><Icon name="upload" size={24} /></span>
              <strong>파일을 선택해 업로드</strong>
              <small>Excel, CSV, PDF, 이미지 · 최대 20MB</small>
            </label>
            <div className="upload-list-heading">
              <strong>최근 파일</strong><span>{uploads.length}개</span>
            </div>
            <div className="upload-list">
              {uploads.map((file) => (
                <div className="upload-item" key={file.id}>
                  <span className="file-icon"><Icon name="file" /></span>
                  <span>
                    <strong>{file.original_name}</strong>
                    <small>{file.uploaded_by} · {file.uploaded_at}</small>
                  </span>
                  <span className={`source-badge ${file.source.toLowerCase()}`}>
                    {file.source === "SYSTEM" ? "자동" : "사용자"}
                  </span>
                  <em>{Math.max(1, Math.round(file.size / 1024))} KB</em>
                </div>
              ))}
              {!uploads.length && <p className="panel-empty">등록된 파일이 없습니다.</p>}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
