"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select } from "./Select";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import { DataTableMobile } from "./DataTableMobile";

export type ColumnDef<T = any> = {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  width?: string;
  render?: (value: any, row: T) => ReactNode;
  filterOptions?: Array<{ value: string; label: string }>;
};

export type DataTableProps<T = any> = {
  data: T[];
  columns: ColumnDef<T>[];
  keyField?: string;
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  pageSize?: number;
  showPagination?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  bulkActions?: Array<{
    label: string;
    action: (selectedRows: T[]) => void;
    variant?: "primary" | "secondary" | "danger";
  }>;
  mobileView?: "table" | "cards";
  renderMobileCard?: (row: T, columns: ColumnDef<T>[]) => ReactNode;
};

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField = "id",
  isLoading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  onRowClick,
  emptyState,
  pageSize = 10,
  showPagination = true,
  selectable = false,
  onSelectionChange,
  bulkActions = [],
  mobileView = "cards",
  renderMobileCard,
}: DataTableProps<T>) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: !col.hidden }), {})
  );

  // Visible columns
  const visibleColumns = useMemo(
    () => columns.filter((col) => columnVisibility[col.key]),
    [columns, columnVisibility]
  );

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm) {
      result = result.filter((row) =>
        visibleColumns.some((col) => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((row) => row[key]?.toString() === value);
      }
    });

    return result;
  }, [data, searchTerm, filters, visibleColumns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(paginatedData.map((row) => row[keyField]));
      setSelectedRows(allKeys);
      onSelectionChange?.(paginatedData);
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    const rowKey = row[keyField];

    if (checked) {
      newSelected.add(rowKey);
    } else {
      newSelected.delete(rowKey);
    }

    setSelectedRows(newSelected);
    onSelectionChange?.(data.filter((r) => newSelected.has(r[keyField])));
  };

  const isAllSelected = paginatedData.length > 0 && paginatedData.every((row) => selectedRows.has(row[keyField]));
  const isSomeSelected = paginatedData.some((row) => selectedRows.has(row[keyField]));

  if (isLoading) {
    return (
      <div className="datatable">
        <Skeleton height={40} />
        <Skeleton height={400} />
      </div>
    );
  }

  return (
    <div className="datatable">
      {/* Toolbar */}
      <div className="datatable-toolbar">
        <div className="datatable-toolbar__left">
          {searchable && (
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              inputSize="sm"
              leftIcon={<span>🔍</span>}
            />
          )}

          {/* Column filters */}
          {visibleColumns
            .filter((col) => col.filterable && col.filterOptions)
            .map((col) => (
              <Select
                key={col.key}
                options={[{ value: "", label: `All ${col.label}` }, ...(col.filterOptions || [])]}
                value={filters[col.key] || ""}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, [col.key]: e.target.value }));
                  setCurrentPage(1);
                }}
                inputSize="sm"
              />
            ))}
        </div>

        <div className="datatable-toolbar__right">
          {selectedRows.size > 0 && bulkActions.length > 0 && (
            <div className="datatable-bulk-actions">
              <Badge variant="primary">{selectedRows.size} selected</Badge>
              {bulkActions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant || "secondary"}
                  onClick={() => {
                    const selected = data.filter((r) => selectedRows.has(r[keyField]));
                    action.action(selected);
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          <span className="datatable-count">
            {sortedData.length} {sortedData.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      {/* Table or Cards */}
      {isMobile && mobileView === "cards" ? (
        <DataTableMobile
          data={paginatedData}
          columns={visibleColumns}
          keyField={keyField}
          onRowClick={onRowClick}
          renderCard={renderMobileCard}
          selectable={selectable}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
        />
      ) : (
        <div className="datatable-wrapper">
          <table className="datatable-table">
          <thead>
            <tr>
              {selectable && (
                <th className="datatable-th datatable-th--checkbox">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isSomeSelected && !isAllSelected;
                      }
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={`datatable-th ${col.sortable ? "datatable-th--sortable" : ""}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="datatable-th__content">
                    <span>{col.label}</span>
                    {col.sortable && sortKey === col.key && (
                      <span className="datatable-sort-icon">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (selectable ? 1 : 0)} className="datatable-empty">
                  {emptyState || <div className="empty-state">No data found</div>}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const rowKey = row[keyField];
                const isSelected = selectedRows.has(rowKey);

                return (
                  <tr
                    key={rowKey}
                    className={`datatable-tr ${onRowClick ? "datatable-tr--clickable" : ""} ${
                      isSelected ? "datatable-tr--selected" : ""
                    }`}
                    onClick={() => !selectable && onRowClick?.(row)}
                  >
                    {selectable && (
                      <td className="datatable-td datatable-td--checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectRow(row, e.target.checked);
                          }}
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td key={col.key} className="datatable-td">
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="datatable-pagination">
          <div className="datatable-pagination__info">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
            {sortedData.length}
          </div>
          <div className="datatable-pagination__controls">
            <Button size="sm" variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
              First
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </Button>

            <div className="datatable-pagination__pages">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={currentPage === pageNum ? "primary" : "ghost"}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
