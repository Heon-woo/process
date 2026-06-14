export function Loading({ label = "데이터를 불러오는 중입니다." }) {
  return (
    <div className="loading-state">
      <span className="spinner" />
      <p>{label}</p>
    </div>
  );
}

