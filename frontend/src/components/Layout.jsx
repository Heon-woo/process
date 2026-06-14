import { Icon } from "./Icons";

const NAV_ITEMS = [
  { id: "home", label: "통합 홈", icon: "home" },
  { id: "pas", label: "PAS 협의 관리", icon: "sheet", badge: "12" },
  { id: "cpms", label: "CPMS 변경점 관리", icon: "chart", badge: "3" },
  { id: "admin", label: "시스템 관리", icon: "admin" },
];

export function Layout({ currentPage, onNavigate, children, connected }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => onNavigate("home")}>
          <span className="brand-mark">P</span>
          <span>
            <strong>PASS</strong>
            <small>Process Change Portal</small>
          </span>
        </button>

        <nav className="main-nav" aria-label="주 메뉴">
          <p className="nav-label">WORKSPACE</p>
          {NAV_ITEMS.slice(0, 3).map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? "active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <em>{item.badge}</em>}
            </button>
          ))}
          <p className="nav-label nav-label-spaced">MANAGEMENT</p>
          <button
            className={`nav-item ${currentPage === "admin" ? "active" : ""}`}
            onClick={() => onNavigate("admin")}
          >
            <Icon name="admin" />
            <span>시스템 관리</span>
          </button>
        </nav>

        <div className="sidebar-status">
          <div className="status-heading">
            <span className={`status-dot ${connected ? "online" : "offline"}`} />
            <strong>{connected ? "System Operational" : "Demo Mode"}</strong>
          </div>
          <small>{connected ? "모든 서비스 정상 작동 중" : "백엔드 연결을 확인하세요"}</small>
        </div>

        <div className="sidebar-profile">
          <span className="avatar">김</span>
          <span className="profile-copy">
            <strong>김하늘</strong>
            <small>System Admin</small>
          </span>
          <Icon name="dots" />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Manufacturing Excellence / PASS</p>
          </div>
          <div className="topbar-actions">
            <span className="sync-state">
              <Icon name="refresh" size={15} />
              PAS 09:00 · CPMS 01:05 갱신
            </span>
            <button className="icon-button" aria-label="알림">
              <Icon name="bell" />
              <span className="notification-dot" />
            </button>
            <span className="environment">PROTOTYPE</span>
          </div>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}

