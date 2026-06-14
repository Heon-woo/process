import { Icon } from "./Icons";

export function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type || "success"}`}>
      <span className="toast-icon">
        <Icon name={toast.type === "error" ? "close" : "check"} size={15} />
      </span>
      <span>{toast.message}</span>
      <button onClick={onClose}><Icon name="close" size={15} /></button>
    </div>
  );
}

