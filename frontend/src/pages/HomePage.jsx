import { useEffect, useState } from "react";

import { Icon } from "../components/Icons";
import { Loading } from "../components/Loading";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";

const metricCards = [
  { key: "pas_open", label: "진행 중 협의", icon: "sheet", tone: "navy", unit: "건", delta: "금주 +8" },
  { key: "approval_rate", label: "승인 완료율", icon: "check", tone: "teal", unit: "%", delta: "전주 +4.2%" },
  { key: "cpms_attention", label: "후속 확인 필요", icon: "chart", tone: "amber", unit: "건", delta: "즉시 확인" },
  { key: "avg_lead_time", label: "평균 협의 Lead Time", icon: "clock", tone: "blue", unit: "일", delta: "전월 -0.6일" },
];

export function HomePage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard().then(setData).catch((requestError) => setError(requestError.message));
  }, []);

  if (!data && !error) return <Loading label="PASS 현황을 준비하고 있습니다." />;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div className="page home-page">
      <section className="page-heading home-heading">
        <div>
          <p className="eyebrow">THURSDAY, JUNE 11</p>
          <h1>좋은 아침입니다, 김하늘님.</h1>
          <p>오늘의 공정 변경 협의와 적용 현황을 한눈에 확인하세요.</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate("pas")}>
          <Icon name="plus" size={17} />
          신규 공정 변경
        </button>
      </section>

      <section className="metrics-grid">
        {metricCards.map((card) => (
          <article className="metric-card" key={card.key}>
            <div className={`metric-icon ${card.tone}`}><Icon name={card.icon} /></div>
            <div className="metric-title">
              <span>{card.label}</span>
              <Icon name="dots" size={17} />
            </div>
            <strong>{data.metrics[card.key]}<small>{card.unit}</small></strong>
            <span className={`metric-delta ${card.tone}`}>{card.delta}</span>
          </article>
        ))}
      </section>

      <section className="home-grid">
        <article className="card workflow-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">PROCESS FLOW</p>
              <h2>공정 변경 통합 Workflow</h2>
            </div>
            <span className="live-label"><span /> LIVE</span>
          </div>
          <div className="workflow">
            <div className="workflow-step done">
              <span className="step-icon"><Icon name="edit" /></span>
              <strong>변경 신청</strong>
              <small>{data.metrics.pas_total}건 접수</small>
            </div>
            <span className="flow-line active" />
            <div className="workflow-step active">
              <span className="step-icon"><Icon name="users" /></span>
              <strong>부서 협의</strong>
              <small>{data.metrics.pas_open}건 진행 중</small>
            </div>
            <span className="flow-line active" />
            <div className="workflow-step">
              <span className="step-icon"><Icon name="check" /></span>
              <strong>승인 / 적용</strong>
              <small>승인율 {data.metrics.approval_rate}%</small>
            </div>
            <span className="flow-line" />
            <div className="workflow-step attention">
              <span className="step-icon"><Icon name="chart" /></span>
              <strong>변경점 관리</strong>
              <small>{data.metrics.cpms_attention}건 확인 필요</small>
            </div>
          </div>
          <div className="batch-strip">
            {data.batches.map((batch) => (
              <div key={batch.module}>
                <span className="status-dot online" />
                <strong>{batch.module}</strong>
                <span>최근 갱신 {batch.last_run_at}</span>
                <small>다음 {batch.next_run_at}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="card attention-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">ACTION REQUIRED</p>
              <h2>확인이 필요한 변경점</h2>
            </div>
            <button className="text-button" onClick={() => onNavigate("cpms")}>
              전체 보기 <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="attention-list">
            {data.recent_cpms.map((item) => (
              <button key={item.id} onClick={() => onNavigate("cpms")}>
                <span className={`process-chip ${item.monitoring_result === "주의" ? "warning" : ""}`}>
                  {item.process.slice(0, 2)}
                </span>
                <span className="attention-copy">
                  <strong>{item.title}</strong>
                  <small>{item.product} · {item.tech} · {item.device}</small>
                </span>
                <StatusBadge value={item.monitoring_result} />
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="card recent-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">RECENT ACTIVITY</p>
            <h2>최근 공정 변경 신청</h2>
          </div>
          <button className="text-button" onClick={() => onNavigate("pas")}>
            PAS 바로가기 <Icon name="arrow" size={15} />
          </button>
        </div>
        <div className="recent-table">
          <div className="recent-row header">
            <span>기안 번호</span><span>공정 / Device</span><span>변경 제목</span>
            <span>기안자</span><span>목표일</span><span>상태</span>
          </div>
          {data.recent_pas.map((item) => (
            <button className="recent-row" key={item.id} onClick={() => onNavigate("pas")}>
              <strong>{item.document_no}</strong>
              <span>{item.process} / {item.device}</span>
              <span className="truncate">{item.title}</span>
              <span>{item.requester}</span>
              <span>{item.target_date}</span>
              <StatusBadge value={item.status} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

