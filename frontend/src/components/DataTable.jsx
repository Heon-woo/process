import { useMemo, useRef, useState } from "react";

import { Icon } from "./Icons";
import { StatusBadge } from "./StatusBadge";

const BADGE_FIELDS = new Set(["status", "priority", "monitoring_result", "ai_status"]);

function displayValue(value) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

export function DataTable({
  rows,
  columns,
  onColumnsChange,
  editableFields = [],
  onCellChange,
  onDelete,
  onRowClick,
  selectedId,
  emptyMessage = "조건에 맞는 데이터가 없습니다.",
}) {
  const [columnFilters, setColumnFilters] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [draftValue, setDraftValue] = useState("");
  const resizeRef = useRef(null);

  const visibleColumns = columns.filter((column) => column.visible !== false);
  const pinnedOffsets = useMemo(() => {
    let left = 0;
    const offsets = {};
    visibleColumns.forEach((column) => {
      if (column.pinned) {
        offsets[column.key] = left;
        left += column.width;
      }
    });
    return offsets;
  }, [visibleColumns]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        Object.entries(columnFilters).every(([key, query]) =>
          String(row[key] ?? "")
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
      ),
    [rows, columnFilters],
  );

  const moveColumn = (sourceKey, targetKey) => {
    if (!sourceKey || sourceKey === targetKey) return;
    const next = [...columns];
    const sourceIndex = next.findIndex((column) => column.key === sourceKey);
    const targetIndex = next.findIndex((column) => column.key === targetKey);
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    onColumnsChange(next);
  };

  const togglePin = (key) => {
    onColumnsChange(
      columns.map((column) =>
        column.key === key ? { ...column, pinned: !column.pinned } : column,
      ),
    );
  };

  const startResize = (event, column) => {
    event.preventDefault();
    event.stopPropagation();
    resizeRef.current = { key: column.key, startX: event.clientX, startWidth: column.width };
    const onMove = (moveEvent) => {
      if (!resizeRef.current) return;
      const width = Math.max(
        72,
        resizeRef.current.startWidth + moveEvent.clientX - resizeRef.current.startX,
      );
      onColumnsChange(
        columns.map((item) => (item.key === column.key ? { ...item, width } : item)),
      );
    };
    const onUp = () => {
      resizeRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const beginEdit = (row, column) => {
    if (!editableFields.includes(column.key)) return;
    setEditingCell(`${row.id}-${column.key}`);
    setDraftValue(row[column.key] ?? "");
  };

  const commitEdit = async (row, column) => {
    setEditingCell(null);
    if (String(row[column.key] ?? "") === draftValue) return;
    await onCellChange(row.id, column.key, draftValue);
  };

  return (
    <div className="sheet-wrap">
      <table className="data-sheet">
        <thead>
          <tr>
            {visibleColumns.map((column) => (
              <th
                key={column.key}
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", column.key)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => moveColumn(event.dataTransfer.getData("text/plain"), column.key)}
                className={column.pinned ? "pinned" : ""}
                style={{
                  width: column.width,
                  minWidth: column.width,
                  left: column.pinned ? pinnedOffsets[column.key] : undefined,
                }}
              >
                <div className="column-heading">
                  <span>{column.label}</span>
                  <button
                    className={`pin-button ${column.pinned ? "active" : ""}`}
                    onClick={() => togglePin(column.key)}
                    title={column.pinned ? "고정 해제" : "컬럼 고정"}
                  >
                    <Icon name="pin" size={13} />
                  </button>
                </div>
                <span className="resize-handle" onMouseDown={(event) => startResize(event, column)} />
              </th>
            ))}
            {onDelete && <th className="action-column">관리</th>}
          </tr>
          <tr className="column-filter-row">
            {visibleColumns.map((column) => (
              <th
                key={column.key}
                className={column.pinned ? "pinned" : ""}
                style={{
                  width: column.width,
                  minWidth: column.width,
                  left: column.pinned ? pinnedOffsets[column.key] : undefined,
                }}
              >
                <label className="column-filter">
                  <Icon name="filter" size={12} />
                  <input
                    value={columnFilters[column.key] || ""}
                    onChange={(event) =>
                      setColumnFilters({ ...columnFilters, [column.key]: event.target.value })
                    }
                    placeholder="필터"
                  />
                </label>
              </th>
            ))}
            {onDelete && <th className="action-column" />}
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row) => (
            <tr
              key={row.id}
              className={`${onRowClick ? "clickable" : ""} ${selectedId === row.id ? "selected" : ""}`}
              onClick={() => onRowClick?.(row)}
            >
              {visibleColumns.map((column) => {
                const editing = editingCell === `${row.id}-${column.key}`;
                const editable = editableFields.includes(column.key);
                return (
                  <td
                    key={column.key}
                    className={`${column.pinned ? "pinned" : ""} ${editable ? "editable" : ""}`}
                    style={{
                      width: column.width,
                      minWidth: column.width,
                      maxWidth: column.width,
                      left: column.pinned ? pinnedOffsets[column.key] : undefined,
                    }}
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      beginEdit(row, column);
                    }}
                  >
                    {editing ? (
                      <input
                        className="cell-editor"
                        autoFocus
                        value={draftValue}
                        onChange={(event) => setDraftValue(event.target.value)}
                        onBlur={() => commitEdit(row, column)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                          if (event.key === "Escape") setEditingCell(null);
                        }}
                      />
                    ) : BADGE_FIELDS.has(column.key) ? (
                      <StatusBadge value={row[column.key]} />
                    ) : (
                      <span title={String(row[column.key] ?? "")}>{displayValue(row[column.key])}</span>
                    )}
                  </td>
                );
              })}
              {onDelete && (
                <td className="action-column">
                  <button
                    className="row-action danger"
                    title="행 삭제"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(row);
                    }}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </td>
              )}
            </tr>
          ))}
          {!filteredRows.length && (
            <tr>
              <td colSpan={visibleColumns.length + (onDelete ? 1 : 0)} className="empty-cell">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

