export default function KpiTile({ label, value, detail }) {
  return (
    <div className="kpi-tile">
      <div className="kpi-tile__label">{label}</div>
      <div className="kpi-tile__value">{value}</div>
      <div className="kpi-tile__detail">{detail}</div>
    </div>
  )
}
