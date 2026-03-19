import React, { useEffect, useState } from "react";

interface NotificationProps {
  message: string;
  type: "added" | "updated" | "deleted";
  duration?: number;
}

const DataNotification: React.FC<NotificationProps> = ({
  message,
  type,
  duration = 4000,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const bgColor =
    type === "added" ? "#e8f5e9" : type === "updated" ? "#e3f2fd" : "#ffebee";
  const borderColor =
    type === "added" ? "#66bb6a" : type === "updated" ? "#42a5f5" : "#ef5350";
  const textColor =
    type === "added" ? "#2e7d32" : type === "updated" ? "#1565c0" : "#c62828";

  return (
    <div
      className="data-notification"
      style={{
        background: bgColor,
        borderLeft: `4px solid ${borderColor}`,
        color: textColor,
      }}
    >
      <div className="notification-icon">
        {type === "added" ? "✓" : type === "updated" ? "↻" : "−"}
      </div>
      <div className="notification-content">
        <strong>
          {type === "added"
            ? "Data Added"
            : type === "updated"
              ? "Updated"
              : "Removed"}
        </strong>
        <p>{message}</p>
      </div>
      <div className="notification-time">Just now</div>
    </div>
  );
};

export default DataNotification;
