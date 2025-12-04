function StatCard({ title, value, className, icon }) {
  return (
    <div className={`md:p-3 p-2 rounded shadow text-white ${className}`}>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="shadow-2xl p-2 md:p-3 rounded">{icon}</div>
        <div className="">
          <p className="text-sm">{title}</p>
          <h2 className="text-2xl md:text-2xl font-bold">{value}</h2>
        </div>
      </div>
    </div>
  );
}

export default StatCard;