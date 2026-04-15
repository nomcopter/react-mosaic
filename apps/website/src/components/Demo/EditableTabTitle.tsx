import React, { useState, useCallback } from 'react';
import type { EditableTabTitleProps } from './demo-types';

export const EditableTabTitle: React.FC<EditableTabTitleProps> = ({
  title,
  onUpdateTitle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);

  const beginEdit = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(title);
    },
    [title],
  );

  const save = useCallback(() => {
    onUpdateTitle(editValue);
    setIsEditing(false);
  }, [editValue, onUpdateTitle]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        save();
      } else if (e.key === 'Escape') {
        setEditValue(title);
        setIsEditing(false);
      }
    },
    [save, title],
  );

  if (isEditing) {
    return (
      <input
        type="text"
        className="editable-tab-title__input"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={save}
        onKeyDown={handleKey}
        aria-label="Tab title"
        autoFocus
      />
    );
  }

  return (
    <span
      className="editable-tab-title"
      role="button"
      tabIndex={0}
      title="Double-click to edit"
      aria-label={`Tab: ${title}. Double-click to rename.`}
      onDoubleClick={beginEdit}
    >
      📋 {title}
    </span>
  );
};
