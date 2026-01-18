"use client";

export type HeatmapData = {
  hour: number;
  day: number;
  value: number;
};

export type HeatmapChartProps = {
  data: HeatmapData[];
  title?: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function HeatmapChart({ data, title }: HeatmapChartProps) {
  // Find max value for color scaling
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const getColor = (value: number) => {
    const intensity = value / maxValue;
    if (intensity === 0) return "var(--color-gray-100)";
    const hue = 10; // Red-orange hue
    const saturation = 70;
    const lightness = 95 - intensity * 50; // From light to dark
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const getValue = (hour: number, day: number) => {
    const item = data.find((d) => d.hour === hour && d.day === day);
    return item?.value || 0;
  };

  return (
    <div className="heatmap-chart">
      {title && <h4 className="heatmap-chart__title">{title}</h4>}
      <div className="heatmap-chart__container">
        <div className="heatmap-chart__y-axis">
          {DAYS.map((day, index) => (
            <div key={index} className="heatmap-chart__y-label">
              {day}
            </div>
          ))}
        </div>
        <div className="heatmap-chart__grid">
          <div className="heatmap-chart__x-axis">
            {HOURS.filter((h) => h % 3 === 0).map((hour) => (
              <div key={hour} className="heatmap-chart__x-label" style={{ gridColumn: hour + 1 }}>
                {hour}h
              </div>
            ))}
          </div>
          {DAYS.map((day, dayIndex) => (
            <div key={dayIndex} className="heatmap-chart__row">
              {HOURS.map((hour) => {
                const value = getValue(hour, dayIndex);
                return (
                  <div
                    key={hour}
                    className="heatmap-chart__cell"
                    style={{ backgroundColor: getColor(value) }}
                    title={`${day} ${hour}:00 - ${value} activities`}
                  >
                    {value > 0 && <span className="heatmap-chart__value">{value}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap-chart__legend">
        <span className="heatmap-chart__legend-label">Less</span>
        <div className="heatmap-chart__legend-scale">
          {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
            <div
              key={intensity}
              className="heatmap-chart__legend-item"
              style={{ backgroundColor: getColor(intensity * maxValue) }}
            />
          ))}
        </div>
        <span className="heatmap-chart__legend-label">More</span>
      </div>
    </div>
  );
}
