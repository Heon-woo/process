import { useEffect, useState } from "react";

import { Icon } from "../components/Icons";
import { Loading } from "../components/Loading";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";

export function AdminPage({ notify }) {
  const [logs, setLogs] = useState(null);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    Promise.all([api.logs(), api.batches()])
      .then(([logResult, batchResult]) => {
        setLogs(logResult);
        setBatches(batchResult.items);
      })
      .catch((error) => notify(error.message, "error"));
  }, [notify]);

  const changeSchedule = async (module, schedule) => {
    try {
      const updated = await api.updateBatch(module, schedule);
      setBatches((current) => current.map((batch) => (batch.module === module ? updated : batch)));
      notify(`${module} 배치 주기를 변경했습니다.`);
    } catch (error) {
      notify(error.message, "error");
    }
  };

  if (!logs) return <Loading label="시스템 운영 현황을 불러오고 있습니다." />;

  const moduleTotal = logs.module_counts.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="page admin-page">
      <section className="page-heading compact-heading">
        <div>
          <p className="eyebrow">SYSTEM ADMINISTRATION</p>
          <h1>시스템 관리</h1>
          <p>사용 이력, 데이터 배치, 서비스 상태를 한 공간에서 관리합니다.</p>
        </div>
        <button className="secondary-button"><Icon name="external" size={15} /> API 문서</button>
      </section>

      <section className="admin-metrics">
        <article>
          <span className="admin-metric-icon"><Icon name="users" /></span>
          <div><small>금일 활성 사용자</small><strong>38명</strong><em>+12% vs. 어제</em></div>
        </article>
        <article>
          <span className="admin-metric-icon purple"><Icon name="sheet" /></span>
          <div><small>금일 사용자 Activity</small><strong>{moduleTotal}건</strong><em>실시간 집계</em></div>
        </article>
        <article>
          <span className="admin-metric-icon teal"><Icon name="refresh" /></span>
          <div><small>배치 성공률</small><strong>99.8%</strong><em>최근 30일</em></div>
        </article>
        <article>
          <span className="admin-metric-icon amber"><Icon name="clock" /></span>
          <div><small>API 평균 응답</small><strong>184<small>ms</small></strong><em>정상 범위</em></div>
        </article>
      </section>

      <section className="admin-grid">
        <article className="card activity-chart-card">
          <div className="card-heading">
            <div><p className="eyebrow">USAGE ANALYTICS</p><h2>모듈별 사용 현황</h2></div>
            <span className="period-chip">최근 7일</span>
          </div>
          <div className="bar-chart">
            {[
              { day: "06/05", pas: 38, cpms: 20 },
              { day: "06/06", pas: 52, cpms: 31 },
              { day: "06/07", pas: 31, cpms: 17 },
              { day: "06/08", pas: 65, cpms: 39 },
              { day: "06/09", pas: 72, cpms: 44 },
              { day: "06/10", pas: 58, cpms: 34 },
              { day: "06/11", pas: 82, cpms: 48 },
            ].map((item) => (
              <div className="bar-group" key={item.day}>
                <div className="bars">
                  <span className="bar pas" style={{ height: `${item.pas}%` }} />
                  <span className="bar cpms" style={{ height: `${item.cpms}%` }} />
                </div>
                <small>{item.day}</small>
              </div>
            ))}
          </div>
          <div className="bar-legend"><span><i className="pas" /> PAS</span><span><i className="cpms" /> CPMS</span></div>
        </article>

        <article className="card batch-card">
          <div className="card-heading">
            <div><p className="eyebrow">DATA PIPELINE</p><h2>배치 운영 설정</h2></div>
            <span className="live-label"><span /> HEALTHY</span>
          </div>
          <div className="batch-list">
            {batches.map((batch) => (
              <div className="batch-item" key={batch.module}>
                <span className={`module-symbol ${batch.module.toLowerCase()}`}>{batch.module[0]}</span>
                <div className="batch-copy">
                  <div><strong>{batch.module} Data Refresh</strong><StatusBadge value={batch.status} /></div>
                  <p>{batch.description}</p>
                  <small>최근 {batch.last_run_at} · 다음 {batch.next_run_at}</small>
                </div>
                <select
                  value={batch.schedule}
                  onChange={(event) => changeSchedule(batch.module, event.target.value)}
                >
                  {batch.module === "PAS" ? (
                    <>
                      <option value="0 * * * *">매시간</option>
                      <option value="0 */2 * * *">2시간</option>
                      <option value="0 */4 * * *">4시간</option>
                    </>
                  ) : (
                    <>
                      <option value="5 1 * * *">매일 01:05</option>
                      <option value="5 */12 * * *">12시간</option>
                      <option value="5 */6 * * *">6시간</option>
                    </>
                  )}
                </select>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card log-card">
        <div className="card-heading">
          <div><p className="eyebrow">AUDIT LOG</p><h2>최근 사용자 활동</h2></div>
          <div className="log-tools">
            <label className="search-field small"><Icon name="search" size={15} /><input placeholder="사용자 또는 작업 검색" /></label>
            <button className="secondary-button"><Icon name="filter" size={14} /> 필터</button>
          </div>
        </div>
        <div className="log-table">
          <div className="log-row header">
            <span>시간</span><span>사용자</span><span>소속</span><span>모듈</span><span>활동</span><span>대상</span>
          </div>
          {logs.items.map((log) => (
            <div className="log-row" key={log.id}>
              <span>{log.created_at}</span>
              <strong><i className="mini-avatar">{log.user_name[0]}</i>{log.user_name}</strong>
              <span>{log.user_team}</span>
              <span className={`module-pill ${log.module.toLowerCase()}`}>{log.module}</span>
              <span>{log.action}</span>
              <span>{log.target}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

