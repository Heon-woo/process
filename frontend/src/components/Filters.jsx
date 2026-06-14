import { Icon } from "./Icons";

export function ScopeFilters({
  products,
  filters,
  onChange,
  onRefresh,
  dateLabel = "신청일",
  searchPlaceholder = "공정, Device, 기안 번호 검색",
}) {
  const techs = filters.product === "ALL" ? [] : products[filters.product] || [];
  const update = (key, value) => {
    if (key === "product") onChange({ ...filters, product: value, tech: "ALL" });
    else onChange({ ...filters, [key]: value });
  };

  return (
    <div className="filter-bar">
      <label className="field compact">
        <span>Product</span>
        <select value={filters.product} onChange={(event) => update("product", event.target.value)}>
          <option value="ALL">전체 Product</option>
          {Object.keys(products).map((product) => (
            <option key={product}>{product}</option>
          ))}
        </select>
      </label>
      <label className="field compact">
        <span>Tech</span>
        <select value={filters.tech} onChange={(event) => update("tech", event.target.value)}>
          <option value="ALL">전체 Tech</option>
          {techs.map((tech) => (
            <option key={tech}>{tech}</option>
          ))}
        </select>
      </label>
      <label className="search-field">
        <Icon name="search" size={17} />
        <input
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
          placeholder={searchPlaceholder}
        />
      </label>
      <label className="date-field">
        <span>{dateLabel}</span>
        <input
          type="date"
          value={filters.date_from}
          onChange={(event) => update("date_from", event.target.value)}
        />
        <b>~</b>
        <input
          type="date"
          value={filters.date_to}
          onChange={(event) => update("date_to", event.target.value)}
        />
      </label>
      <button className="icon-button refresh-button" onClick={onRefresh} title="새로고침">
        <Icon name="refresh" />
      </button>
    </div>
  );
}

