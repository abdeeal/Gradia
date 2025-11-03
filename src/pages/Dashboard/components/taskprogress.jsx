import React, { useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";

export default function TaskProgress({
  completed = 200,
  inProgress = 100,
  pending = 50,
  title = "Task Progress",
}) {
  const data = useMemo(
    () => [
      { name: "Completed", value: completed, color: "#673AB7" },
      { name: "In Progress", value: inProgress, color: "#341D5C" },
      { name: "Pending", value: pending, color: "#D9CEED" },
    ],
    [completed, inProgress, pending]
  );

  const total = Math.max(1, completed + inProgress + pending);
  const pct = Math.round((completed / total) * 100);
  const pctClamped = Math.max(0, Math.min(100, pct));

  return (
    <div
      className="relative rounded-2xl p-4 text-white"
      style={{
        width: 308,
        height: 347,
        backgroundImage: "linear-gradient(to right, #000000, #211832)",
      }}
    >
      {/* Title */}
      <div
        className="mb-2"
        style={{
          fontFamily: "Montserrat, ui-sans-serif",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      {/* Diagram area */}
      <div className="relative" style={{ width: "100%", height: 200 }}>
        {/* Chart - sedikit turun */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
            transform: "translateY(20px)",
          }}
        >
          <PieChart width={250} height={240}>
            <Pie
              data={data}
              dataKey="value"
              startAngle={190}
              endAngle={-10}
              innerRadius={65}
              outerRadius={110}
              cx="50%"
              cy="50%"
              paddingAngle={-25}
              cornerRadius={500}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={`cell-${d.name}`} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </div>

        {/* LABEL - center tepat di bawah tengah donut */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) translateY(50px)", // <- ini bener, turunin sedikit
            zIndex: 99,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 0,
            }}
          >
            <span
              style={{
                fontFamily: "Montserrat, ui-sans-serif",
                fontSize: 42,
                fontWeight: 600,
                lineHeight: 1.5,
                color: "#FFFFFF",
              }}
            >
              {pctClamped}
            </span>
            <span
              style={{
                fontFamily: "Montserrat, ui-sans-serif",
                fontSize: 42,
                fontWeight: 700,
                lineHeight: 1,
                color: "#FFFFFF",
                transform: "translateY(0px)",
              }}
            >
              %
            </span>
          </div>

          <div
            style={{
              fontFamily: "Inter, ui-sans-serif",
              fontSize: 14,
              marginTop: 8,
              color: "#C4B5FD",
            }}
          >
            Task Completed
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute left-4 right-4 text-sm" style={{ bottom: 20 }}>
        <div
          className="flex items-center justify-between"
          style={{ marginTop: 24 }}
        >
          {data.map((d) => (
            <div
              key={`legend-${d.name}`}
              className="flex items-center gap-2"
            >
              <span
                className="inline-block w-3.5 h-3.5 rounded-full"
                style={{ background: d.color }}
              />
              <span
                style={{ fontFamily: "Inter, ui-sans-serif" }}
                className="text-gray-200 text-xs"
              >
                {d.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
