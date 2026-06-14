import { Icon } from "./Icons";

export function ColumnPanel({ columns, onChange, onClose, onSave, scope }) {
  const update = (key, changes) =>
    onChange(columns.map((column) => (column.key === key ? { ...column, ...changes } : column)));

  return (
    <aside className="side-panel column-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">SHEET CONFIGURATION</p>
          <h3>컬럼 설정</h3>
          <small>{scope} 담당자 전용 설정</small>
        </div>
        <button className="icon-button" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <div className="panel-note">
        <Icon name="pin" size={16} />
        컬럼 순서는 Sheet 헤더를 드래그해 변경할 수 있습니다.
      </div>
      <div className="column-list">
        {columns.map((column) => (
          <div className="column-setting" key={column.key}>
            <span className="drag-grip">⠿</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={column.visible !== false}
                onChange={(event) => update(column.key, { visible: event.target.checked })}
              />
              <span />
            </label>
            <input
              className="column-name-input"
              value={column.label}
              onChange={(event) => update(column.key, { label: event.target.value })}
            />
            <button
              className={`pin-button ${column.pinned ? "active" : ""}`}
              onClick={() => update(column.key, { pinned: !column.pinned })}
            >
              <Icon name="pin" size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className="panel-footer">
        <button className="secondary-button" onClick={onClose}>취소</button>
        <button className="primary-button" onClick={onSave}>
          <Icon name="check" size={16} />
          설정 저장
        </button>
      </div>
    </aside>
  );
}

