import { useCallback, useEffect, useState } from "react";

import { DataTable } from "../components/DataTable";
import { ScopeFilters } from "../components/Filters";
import { Icon } from "../components/Icons";
import { Loading } from "../components/Loading";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";

const INITIAL_FILTERS = {
  product: "DRAM",
  tech: "1a",
  search: "",
  date_from: "",
  date_to: "",
};

function InlineChart({ points, discriminator }) {
  const width = 720;
  const height = 250;
  const pad = { left: 44, right: 18, top: 20, bottom: 32 };
  const allValues = points.flatMap((point) => [point.target_value, point.others_value]);
  const min = Math.min(...allValues) - 2;
  const max = Math.max(...allValues) + 2;
  const x = (index) => pad.left + (index / Math.max(points.length - 1, 1)) * (width - pad.left - pad.right);
  const y = (value) => pad.top + ((max - value) / (max - min)) * (height - pad.top - pad.bottom);
  const line = (key) => points.map((point, index) => `${x(index)},${y(point[key])}`).join(" ");

  return (
    <div className="inline-chart">
      <div className="chart-legend">
        <span><i className="target" /> {discriminator}</span>
        <span><i className="others" /> Others</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Inline 시계열 추이">
        {[0, 1, 2, 3, 4].map((step) => {
          const lineY = pad.top + (step / 4) * (height - pad.top - pad.bottom);
          const value = max - (step / 4) * (max - min);
          return (
            <g key={step}>
              <line x1={pad.left} x2={width - pad.right} y1={lineY} y2={lineY} className="grid-line" />
              <text x={pad.left - 8} y={lineY + 4} textAnchor="end">{value.toFixed(0)}</text>
            </g>
          );
        })}
        <polyline points={line("others_value")} className="series others" />
        <polyline points={line("target_value")} className="series target" />
        {points.map((point, index) => (
          <circle key={point.measured_at} cx={x(index)} cy={y(point.target_value)} r="2.5" className="target-point">
            <title>{point.measured_at}: {point.target_value}</title>
          </circle>
        ))}
        {[0, Math.floor(points.length / 2), points.length - 1].map((index) => (
          <text key={index} x={x(index)} y={height - 8} textAnchor="middle">
            {points[index]?.measured_at.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function DetailPanel({ detail, onClose, onDiscriminatorChange, notify }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(detail.discriminator);

  const save = async () => {
    try {
      await onDiscriminatorChange(detail.id, value);
      setEditing(false);
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const fields = [
    ["기안 번호", detail.document_no],
    ["제품 / Tech", `${detail.product} / ${detail.tech}`],
    ["공정 / Device", `${detail.process} / ${detail.device}`],
    ["기안자", detail.requester],
    ["승인일", detail.approved_at],
    ["실제 적용일", detail.applied_at || "적용 대기"],
  ];

  return (
    <aside className="detail-panel">
      <div className="panel-header detail-heading">
        <div>
          <p className="eyebrow">CHANGE POINT DETAIL</p>
          <h3>{detail.title}</h3>
          <div className="detail-statuses">
            <StatusBadge value={detail.status} />
            <StatusBadge value={detail.monitoring_result} />
          </div>
        </div>
        <button className="icon-button" onClick={onClose}><Icon name="close" /></button>
      </div>

      <div className="detail-scroll">
        <section className="detail-section">
          <h4>기본 정보</h4>
          <div className="detail-fields">
            {fields.map(([label, fieldValue]) => (
              <div key={label}><span>{label}</span><strong>{fieldValue}</strong></div>
            ))}
          </div>
          <div className="comment-box">
            <span>HiQ1 Comment</span>
            <p>{detail.hiq1_comment}</p>
          </div>
        </section>

        <section className="detail-section chart-section">
          <div className="section-heading-row">
            <div>
              <h4>Inline Data Trend</h4>
              <small>변경 적용 전후 공정 지표 비교</small>
            </div>
            <div className="discriminator-edit">
              {editing ? (
                <>
                  <input value={value} onChange={(event) => setValue(event.target.value)} />
                  <button className="mini-button primary" onClick={save}>저장</button>
                </>
              ) : (
                <button className="mini-button" onClick={() => setEditing(true)}>
                  <Icon name="edit" size={13} /> 구분자 수정
                </button>
              )}
            </div>
          </div>
          <InlineChart points={detail.inline_data} discriminator={detail.discriminator} />
          <div className="chart-summary">
            <div><span>최근 측정값</span><strong>{detail.inline_data.at(-1)?.target_value}</strong></div>
            <div><span>Others 평균</span><strong>{(detail.inline_data.reduce((sum, p) => sum + p.others_value, 0) / detail.inline_data.length).toFixed(2)}</strong></div>
            <div><span>모니터링 판정</span><StatusBadge value={detail.monitoring_result} /></div>
          </div>
        </section>

        <section className="detail-section ai-section">
          <div>
            <span className="ai-mark">AI</span>
            <div>
              <h4>AI Model 판정</h4>
              <p>향후 누적 데이터를 활용한 이상 감지 및 판정 근거가 연결됩니다.</p>
            </div>
          </div>
          {detail.ai_status ? (
            <button className="secondary-button">
              결과 보기 <Icon name="external" size={14} />
            </button>
          ) : (
            <span className="coming-soon">MODEL READY</span>
          )}
        </section>
      </div>
    </aside>
  );
}

export function CpmsPage({ products, notify }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.cpmsRecords(filters);
      setRows(result.items);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filters, notify]);

  useEffect(() => {
    const timer = setTimeout(loadRecords, 180);
    return () => clearTimeout(timer);
  }, [loadRecords]);

  useEffect(() => {
    if (filters.product === "ALL" || filters.tech === "ALL") return;
    api.columnConfig("CPMS", filters.product, filters.tech)
      .then((result) => setColumns(result.columns))
      .catch((error) => notify(error.message, "error"));
  }, [filters.product, filters.tech, notify]);

  const openDetail = async (row) => {
    try {
      const result = await api.cpmsDetail(row.id);
      setDetail(result);
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const updateDiscriminator = async (id, discriminator) => {
    const updated = await api.updateCpms(id, { discriminator });
    setRows((current) => current.map((row) => (row.id === id ? updated : row)));
    setDetail((current) => ({ ...current, discriminator }));
    notify("담당자 권한으로 구분자를 수정했습니다.");
  };

  return (
    <div className="page sheet-page">
      <section className="page-heading compact-heading">
        <div>
          <div className="title-line">
            <span className="module-symbol cpms">C</span>
            <div>
              <p className="eyebrow">CHANGE POINT MANAGEMENT SYSTEM</p>
              <h1>공정 변경점 후속 관리</h1>
            </div>
          </div>
          <p>승인 이후 실제 적용 여부와 Inline Data 이상 유무를 추적합니다.</p>
        </div>
        <div className="heading-actions">
          <span className="daily-batch"><Icon name="clock" size={15} /> 매일 01:05 자동 갱신</span>
          <button className="secondary-button" onClick={loadRecords}>
            <Icon name="refresh" size={16} /> 데이터 갱신
          </button>
        </div>
      </section>

      <ScopeFilters
        products={products}
        filters={filters}
        onChange={setFilters}
        onRefresh={loadRecords}
        dateLabel="승인일"
      />

      <section className="sheet-card">
        <div className="sheet-toolbar">
          <div>
            <strong>{filters.product} / {filters.tech}</strong>
            <span>총 {rows.length}건</span>
            <span className="attention-count">
              <span /> 확인 필요 {rows.filter((row) => row.monitoring_result === "주의").length}건
            </span>
          </div>
          <div><span className="edit-hint">행을 클릭하면 상세 Trend를 확인할 수 있습니다.</span></div>
        </div>
        {loading || !columns.length ? (
          <Loading />
        ) : (
          <DataTable
            rows={rows}
            columns={columns}
            onColumnsChange={setColumns}
            editableFields={["discriminator"]}
            onCellChange={(id, field, value) => updateDiscriminator(id, value)}
            onRowClick={openDetail}
            selectedId={detail?.id}
          />
        )}
        <div className="sheet-footer">
          <span>행 추가 및 삭제는 승인 데이터 배치에 의해 자동 처리됩니다.</span>
          <span>마지막 동기화 2026-06-11 01:05 · Inline Data</span>
        </div>
      </section>

      {detail && (
        <>
          <div className="panel-backdrop detail-backdrop" onClick={() => setDetail(null)} />
          <DetailPanel
            key={detail.id}
            detail={detail}
            onClose={() => setDetail(null)}
            onDiscriminatorChange={updateDiscriminator}
            notify={notify}
          />
        </>
      )}
    </div>
  );
}

