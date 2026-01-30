"use client";

import { Button } from "./Button";

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  size?: "sm" | "md" | "lg";
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  size = "md",
}: PaginationProps) {
  const generatePages = (): (number | string)[] => {
    const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
    const totalBlocks = totalNumbers + 2; // + 2 dots

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
      return [1, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, "...", ...middleRange, "...", totalPages];
    }

    return [];
  };

  const pages = generatePages();

  return (
    <nav className="pagination" aria-label="Pagination">
      <div className={`pagination-list pagination-list--${size}`}>
        {showFirstLast && (
          <Button
            variant="ghost"
            size={size}
            disabled={currentPage === 1}
            onClick={() => onPageChange(1)}
            aria-label="First page"
          >
            «
          </Button>
        )}

        <Button
          variant="ghost"
          size={size}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          ‹
        </Button>

        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <span key={`dots-${index}`} className="pagination-dots">
                ...
              </span>
            );
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? "primary" : "ghost"}
              size={size}
              onClick={() => onPageChange(page as number)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          );
        })}

        <Button
          variant="ghost"
          size={size}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          ›
        </Button>

        {showFirstLast && (
          <Button
            variant="ghost"
            size={size}
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="Last page"
          >
            »
          </Button>
        )}
      </div>

      <div className="pagination-info">
        Page {currentPage} of {totalPages}
      </div>
    </nav>
  );
}
