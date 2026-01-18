"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./Button";

export type DateRangeValue = {
  from: Date;
  to: Date;
};

export type DateRangePickerProps = {
  value?: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  minDate?: Date;
  maxDate?: Date;
};

export function DateRangePicker({ value, onChange, minDate, maxDate }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingFrom, setSelectingFrom] = useState(true);
  const [tempFrom, setTempFrom] = useState<Date | null>(value?.from || null);
  const [tempTo, setTempTo] = useState<Date | null>(value?.to || null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const isDateInRange = (date: Date) => {
    if (!tempFrom || !tempTo) return false;
    return date >= tempFrom && date <= tempTo;
  };

  const isDateSelected = (date: Date) => {
    if (!tempFrom && !tempTo) return false;
    const dateStr = date.toDateString();
    return dateStr === tempFrom?.toDateString() || dateStr === tempTo?.toDateString();
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (selectingFrom) {
      setTempFrom(selectedDate);
      setTempTo(null);
      setSelectingFrom(false);
    } else {
      if (selectedDate < tempFrom!) {
        setTempTo(tempFrom);
        setTempFrom(selectedDate);
      } else {
        setTempTo(selectedDate);
      }
      setSelectingFrom(true);
    }
  };

  const handleApply = () => {
    if (tempFrom && tempTo) {
      onChange({ from: tempFrom, to: tempTo });
      setIsOpen(false);
    }
  };

  const handleQuickSelect = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setTempFrom(from);
    setTempTo(to);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="date-range-picker" ref={containerRef}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        📅 {value ? `${formatDate(value.from)} - ${formatDate(value.to)}` : "Custom Range"}
      </Button>

      {isOpen && (
        <div className="date-range-picker__dropdown">
          <div className="date-range-picker__quick-select">
            <Button variant="secondary" size="sm" onClick={() => handleQuickSelect(7)}>
              Last 7 Days
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleQuickSelect(30)}>
              Last 30 Days
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleQuickSelect(90)}>
              Last 90 Days
            </Button>
          </div>

          <div className="date-range-picker__calendar">
            <div className="date-range-picker__header">
              <button onClick={handlePrevMonth} className="date-range-picker__nav-btn">
                ‹
              </button>
              <span className="date-range-picker__month">{monthName}</span>
              <button onClick={handleNextMonth} className="date-range-picker__nav-btn">
                ›
              </button>
            </div>

            <div className="date-range-picker__weekdays">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="date-range-picker__weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="date-range-picker__days">
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="date-range-picker__day date-range-picker__day--empty" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(year, month, day);
                const inRange = isDateInRange(date);
                const selected = isDateSelected(date);

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`date-range-picker__day ${inRange ? "date-range-picker__day--in-range" : ""} ${
                      selected ? "date-range-picker__day--selected" : ""
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="date-range-picker__footer">
            <div className="date-range-picker__selection">
              {tempFrom && <span>From: {formatDate(tempFrom)}</span>}
              {tempTo && <span>To: {formatDate(tempTo)}</span>}
            </div>
            <div className="date-range-picker__actions">
              <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApply}
                disabled={!tempFrom || !tempTo}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
