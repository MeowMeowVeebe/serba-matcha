"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode, type KeyboardEvent } from "react";

interface EditHistory {
  value: string;
  timestamp: number;
}

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void | Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  type?: "text" | "number" | "email" | "url" | "textarea";
  validation?: (value: string) => string | null; // Returns error message or null
  formatDisplay?: (value: string) => ReactNode;
  disabled?: boolean;
  className?: string;
}

export function InlineEdit({
  value,
  onSave,
  onCancel,
  placeholder = "Click to edit",
  type = "text",
  validation,
  formatDisplay,
  disabled = false,
  className = "",
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // History for undo
  const [history, setHistory] = useState<EditHistory[]>([{ value, timestamp: Date.now() }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value);
    setError(null);
  };

  const handleSave = async () => {
    if (validation) {
      const validationError = validation(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setHistory(prev => [...prev.slice(0, historyIndex + 1), { value: editValue, timestamp: Date.now() }]);
      setHistoryIndex(prev => prev + 1);
      setIsEditing(false);
    } catch (e) {
      setError("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError(null);
    onCancel?.();
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setEditValue(history[historyIndex - 1].value);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setEditValue(history[historyIndex + 1].value);
    }
  }, [historyIndex, history]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && type !== "textarea") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    } else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    }
  };

  if (!isEditing) {
    return (
      <div
        className={`inline-edit inline-edit--display ${disabled ? "inline-edit--disabled" : ""} ${className}`}
        onClick={handleStartEdit}
        onKeyDown={e => e.key === "Enter" && handleStartEdit()}
        tabIndex={disabled ? -1 : 0}
        role="button"
      >
        {formatDisplay ? formatDisplay(value) : value || <span className="inline-edit__placeholder">{placeholder}</span>}
        {!disabled && <span className="inline-edit__icon">✏️</span>}
      </div>
    );
  }

  const InputComponent = type === "textarea" ? "textarea" : "input";

  return (
    <div className={`inline-edit inline-edit--editing ${className}`}>
      <InputComponent
        ref={inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>}
        type={type === "textarea" ? undefined : type}
        value={editValue}
        onChange={e => {
          setEditValue(e.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className={`inline-edit__input ${error ? "inline-edit__input--error" : ""}`}
        disabled={isSaving}
        placeholder={placeholder}
      />
      {error && <span className="inline-edit__error">{error}</span>}
      <div className="inline-edit__actions">
        <button
          className="inline-edit__btn inline-edit__btn--save"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "..." : "✓"}
        </button>
        <button
          className="inline-edit__btn inline-edit__btn--cancel"
          onClick={handleCancel}
          disabled={isSaving}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Editable Table Row
interface EditableRowProps {
  data: Record<string, string | number>;
  columns: { key: string; label: string; editable?: boolean; type?: InlineEditProps["type"] }[];
  onSave: (data: Record<string, string | number>) => void | Promise<void>;
  className?: string;
}

export function EditableRow({ data, columns, onSave, className = "" }: EditableRowProps) {
  const [rowData, setRowData] = useState(data);
  const [isDirty, setIsDirty] = useState(false);

  const handleFieldSave = (key: string, value: string) => {
    const newData = { ...rowData, [key]: value };
    setRowData(newData);
    setIsDirty(true);
  };

  const handleRowSave = async () => {
    await onSave(rowData);
    setIsDirty(false);
  };

  return (
    <tr className={`editable-row ${isDirty ? "editable-row--dirty" : ""} ${className}`}>
      {columns.map(col => (
        <td key={col.key}>
          {col.editable !== false ? (
            <InlineEdit
              value={String(rowData[col.key] || "")}
              onSave={value => handleFieldSave(col.key, value)}
              type={col.type}
            />
          ) : (
            rowData[col.key]
          )}
        </td>
      ))}
      {isDirty && (
        <td>
          <button className="editable-row__save" onClick={handleRowSave}>
            Save Row
          </button>
        </td>
      )}
    </tr>
  );
}

// Batch Editor
interface BatchEditorProps {
  items: { id: string; [key: string]: string | number }[];
  columns: { key: string; label: string; editable?: boolean }[];
  onBatchSave: (items: { id: string; [key: string]: string | number }[]) => void | Promise<void>;
  className?: string;
}

export function BatchEditor({ items, columns, onBatchSave, className = "" }: BatchEditorProps) {
  const [editedItems, setEditedItems] = useState(items);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchValue, setBatchValue] = useState("");
  const [batchColumn, setBatchColumn] = useState(columns[0]?.key || "");

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const handleBatchApply = () => {
    if (!batchColumn || !batchValue || selectedIds.size === 0) return;

    setEditedItems(prev =>
      prev.map(item =>
        selectedIds.has(item.id) ? { ...item, [batchColumn]: batchValue } : item
      )
    );
  };

  const handleSaveAll = async () => {
    await onBatchSave(editedItems);
  };

  const hasChanges = JSON.stringify(items) !== JSON.stringify(editedItems);

  return (
    <div className={`batch-editor ${className}`}>
      <div className="batch-editor__toolbar">
        <div className="batch-editor__selection">
          <input
            type="checkbox"
            checked={selectedIds.size === items.length}
            onChange={handleSelectAll}
          />
          <span>{selectedIds.size} selected</span>
        </div>

        {selectedIds.size > 0 && (
          <div className="batch-editor__batch-controls">
            <select value={batchColumn} onChange={e => setBatchColumn(e.target.value)}>
              {columns.filter(c => c.editable !== false).map(col => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={batchValue}
              onChange={e => setBatchValue(e.target.value)}
              placeholder="New value..."
            />
            <button onClick={handleBatchApply}>Apply to Selected</button>
          </div>
        )}

        {hasChanges && (
          <button className="batch-editor__save-all" onClick={handleSaveAll}>
            Save All Changes
          </button>
        )}
      </div>

      <table className="batch-editor__table">
        <thead>
          <tr>
            <th></th>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {editedItems.map(item => (
            <tr key={item.id} className={selectedIds.has(item.id) ? "selected" : ""}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => handleSelect(item.id)}
                />
              </td>
              {columns.map(col => (
                <td key={col.key}>
                  {col.editable !== false ? (
                    <InlineEdit
                      value={String(item[col.key] || "")}
                      onSave={value => {
                        setEditedItems(prev =>
                          prev.map(i => (i.id === item.id ? { ...i, [col.key]: value } : i))
                        );
                      }}
                    />
                  ) : (
                    item[col.key]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Auto-save indicator
interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved?: Date;
  isDirty?: boolean;
}

export function AutoSaveIndicator({ isSaving, lastSaved, isDirty }: AutoSaveIndicatorProps) {
  return (
    <div className={`autosave-indicator ${isSaving ? "autosave-indicator--saving" : ""} ${isDirty ? "autosave-indicator--dirty" : ""}`}>
      {isSaving && <span className="autosave-indicator__spinner">⟳</span>}
      {isDirty && !isSaving && <span className="autosave-indicator__dot" />}
      <span className="autosave-indicator__text">
        {isSaving ? "Saving..." : isDirty ? "Unsaved changes" : lastSaved ? `Saved ${formatTimeAgo(lastSaved)}` : ""}
      </span>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
