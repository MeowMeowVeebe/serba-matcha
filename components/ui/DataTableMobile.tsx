"use client";

import { type ReactNode } from "react";
import { Card, CardBody } from "./Card";
import { Badge } from "./Badge";
import type { ColumnDef } from "./DataTable";

export type DataTableMobileProps<T = any> = {
  data: T[];
  columns: ColumnDef<T>[];
  keyField?: string;
  onRowClick?: (row: T) => void;
  renderCard?: (row: T, columns: ColumnDef<T>[]) => ReactNode;
  selectable?: boolean;
  selectedRows?: Set<string>;
  onSelectRow?: (row: T, checked: boolean) => void;
};

export function DataTableMobile<T extends Record<string, any>>({
  data,
  columns,
  keyField = "id",
  onRowClick,
  renderCard,
  selectable = false,
  selectedRows = new Set(),
  onSelectRow,
}: DataTableMobileProps<T>) {
  if (renderCard) {
    return (
      <div className="datatable-cards">
        {data.map((row) => (
          <div key={row[keyField]}>{renderCard(row, columns)}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="datatable-cards">
      {data.map((row) => {
        const rowKey = row[keyField];
        const isSelected = selectedRows.has(rowKey);

        return (
          <Card
            key={rowKey}
            variant="bordered"
            hoverable={!!onRowClick}
            className={isSelected ? "datatable-card--selected" : ""}
          >
            <CardBody>
              <div
                className="datatable-card"
                onClick={() => !selectable && onRowClick?.(row)}
                style={{ cursor: onRowClick ? "pointer" : "default" }}
              >
                {selectable && (
                  <div className="datatable-card__checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectRow?.(row, e.target.checked);
                      }}
                    />
                  </div>
                )}

                <div className="datatable-card__content">
                  {columns
                    .filter((col) => !col.hidden)
                    .map((col) => {
                      const value = row[col.key];
                      const displayValue = col.render ? col.render(value, row) : value;

                      return (
                        <div key={col.key} className="datatable-card__field">
                          <span className="datatable-card__label">{col.label}</span>
                          <span className="datatable-card__value">{displayValue}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
