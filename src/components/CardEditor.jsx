import { useState, useEffect } from 'react';
import { MetadataEditor } from './MetadataEditor';

export function CardEditor({ card, onSave, onClose }) {
  const [draft, setDraft] = useState(card);

  useEffect(() => {
    setDraft(card);
  }, [card]);

  const handleChange = (field, value) => {
    setDraft((d) => ({ ...d, [field]: value }));
  };

  const handleMetadataChange = (metadata) => {
    setDraft((d) => ({ ...d, metadata }));
  };

  const handleSave = () => {
    onSave(draft);
  };

  return (
    <div className="card-editor">
      <div className="card-editor-header">
        <h4>Edit card</h4>
        <div className="card-editor-actions">
          <button type="button" className="save-btn" onClick={handleSave}>
            Save
          </button>
          {onClose && (
            <button type="button" className="card-editor-close" onClick={onClose}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="card-editor-fields">
        <div className="field-row">
          <label>Firm name</label>
          <input
            value={draft.firmName || ''}
            onChange={(e) => handleChange('firmName', e.target.value)}
            placeholder="Firm name"
          />
        </div>
        <div className="field-row">
          <label>Person name</label>
          <input
            value={draft.personName || ''}
            onChange={(e) => handleChange('personName', e.target.value)}
            placeholder="Person name"
          />
        </div>
        <div className="field-row">
          <label>Phone</label>
          <input
            value={draft.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Phone"
          />
        </div>
        <div className="field-row">
          <label>Email</label>
          <input
            value={draft.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Email"
          />
        </div>
        <div className="field-row">
          <label>Address</label>
          <input
            value={draft.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Address"
          />
        </div>

        <MetadataEditor metadata={draft.metadata} onChange={handleMetadataChange} />
      </div>
    </div>
  );
}
