function formatDate(input) {
  if (!input) return "N/A";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleString();
}

function AlertCard({ alert, index = 0, isNew = false }) {
  const {
    symbol,
    signal,
    price,
    whatsappSent,
    messageSid,
    createdAt,
    updatedAt,
    _id,
    ...rest
  } = alert;

  return (
    <article
      className={`alert-card ${isNew ? "new-arrival" : ""}`}
      style={{ "--stagger-index": index }}
    >
      <div className="alert-top">
        <div className="alert-title-wrap">
          {!whatsappSent ? <span className="unread-dot" aria-label="Unread alert" /> : null}
          <h3>{symbol || "Unknown Symbol"}</h3>
        </div>
        <span className={`badge ${whatsappSent ? "sent" : "queued"}`}>
          {whatsappSent ? "WhatsApp Delivered" : "WhatsApp Queued"}
        </span>
      </div>

      <p className="alert-signal">Signal: {signal || "UNKNOWN"}</p>
      <p className="alert-price">Price: {price ?? "N/A"}</p>

      <div className="alert-meta">
        <span>Created: {formatDate(createdAt)}</span>
        <span>Updated: {formatDate(updatedAt)}</span>
      </div>

      <div className="alert-extra">
        {_id ? <p>Alert ID: {_id}</p> : null}
        {messageSid ? <p>Message SID: {messageSid}</p> : null}
        {Object.entries(rest).map(([key, value]) => (
          <p key={key}>
            {key}: {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </p>
        ))}
      </div>
    </article>
  );
}

export default AlertCard;
