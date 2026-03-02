export function MetadataEditor({ metadata, onChange }) {
  const handleAdd = () => {
    onChange([...(metadata || []), { name: '', value: '' }]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...(metadata || [])];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemove = (index) => {
    const updated = [...(metadata || [])];
    updated.splice(index, 1);
    onChange(updated);
  };

  const items = metadata || [];

  return (
    <div className="metadata-editor">
      <div className="metadata-header">
        <span>Additional fields</span>
        <button type="button" className="metadata-add-btn" onClick={handleAdd}>
          + Add
        </button>
      </div>
      {items.length === 0 ? (
        <p className="metadata-empty">No custom fields. Click Add to add one.</p>
      ) : (
        <div className="metadata-list">
          {items.map((item, i) => (
            <div key={i} className="metadata-row">
              <input
                value={item.name || ''}
                onChange={(e) => handleChange(i, 'name', e.target.value)}
                placeholder="Name (e.g. Title, LinkedIn)"
              />
              <input
                value={item.value || ''}
                onChange={(e) => handleChange(i, 'value', e.target.value)}
                placeholder="Value"
              />
              <button
                type="button"
                className="metadata-remove-btn"
                onClick={() => handleRemove(i)}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
