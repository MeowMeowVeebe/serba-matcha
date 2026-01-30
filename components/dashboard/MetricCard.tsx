"use client";

import { Card, CardBody } from "../ui/Card";
import { Badge } from "../ui/Badge";

export type MetricCardProps = {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  suffix?: string;
  isLoading?: boolean;
};

export function MetricCard({ title, value, icon, change, changeLabel, trend, suffix = "", isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <Card variant="bordered">
        <CardBody>
          <div className="metric-card metric-card--loading">
            <div className="ds-skeleton" style={{ width: "100px", height: "14px" }} />
            <div className="ds-skeleton" style={{ width: "80px", height: "32px", marginTop: "8px" }} />
            <div className="ds-skeleton" style={{ width: "60px", height: "12px", marginTop: "8px" }} />
          </div>
        </CardBody>
      </Card>
    );
  }

  const getTrendColor = (): "success" | "danger" | "default" => {
    if (trend === "up") return "success";
    if (trend === "down") return "danger";
    return "default";
  };

  const getTrendIcon = () => {
    if (trend === "up") return "↑";
    if (trend === "down") return "↓";
    return "→";
  };

  return (
    <Card variant="bordered" hoverable>
      <CardBody>
        <div className="metric-card">
          <div className="metric-card__header">
            <span className="metric-card__title">{title}</span>
            {icon && <span className="metric-card__icon">{icon}</span>}
          </div>
          <div className="metric-card__value">
            {value}
            {suffix && <span className="metric-card__suffix">{suffix}</span>}
          </div>
          {change !== undefined && (
            <div className="metric-card__footer">
              <Badge variant={getTrendColor()} size="sm">
                {getTrendIcon()} {change > 0 ? "+" : ""}
                {change}%
              </Badge>
              {changeLabel && <span className="metric-card__label">{changeLabel}</span>}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
