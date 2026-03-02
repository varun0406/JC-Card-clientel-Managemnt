import { useCallback } from 'react';

const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';

export function ImageUpload({ onFilesSelected, disabled }) {
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length) onFilesSelected(files);
    },
    [onFilesSelected, disabled]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleChange = useCallback(
    (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length) onFilesSelected(files);
      e.target.value = '';
    },
    [onFilesSelected]
  );

  return (
    <div
      className="image-upload"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        type="file"
        accept={ACCEPT}
        multiple
        onChange={handleChange}
        disabled={disabled}
        id="file-input"
      />
      <label htmlFor="file-input" className="upload-label">
        Drop business card images here, or click to select
      </label>
    </div>
  );
}
