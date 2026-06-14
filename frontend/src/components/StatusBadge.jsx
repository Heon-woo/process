const toneMap = {
  검토중: "blue",
  협의중: "violet",
  승인대기: "amber",
  승인완료: "green",
  완료: "green",
  반려: "red",
  확인필요: "red",
  모니터링중: "blue",
  적용대기: "gray",
  정상: "green",
  주의: "amber",
  대기: "gray",
  검토필요: "red",
  긴급: "red",
  높음: "amber",
  보통: "blue",
  낮음: "gray",
};

export function StatusBadge({ value }) {
  return <span className={`status-badge ${toneMap[value] || "gray"}`}>{value || "-"}</span>;
}

