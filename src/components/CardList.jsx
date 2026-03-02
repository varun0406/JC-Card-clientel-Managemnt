import { useState } from 'react';
import { CardEditor } from './CardEditor';

export function CardList({
  cards,
  onUpdate,
  onDelete,
  onExport,
  searchQuery,
  onSearchChange,
}) {
  const [editingId, setEditingId] = useState(null);

  const handleCardUpdate = async (updated) => {
    await onUpdate(updated);
    setEditingId(null);
  };

  const getThumbnailUrl = (card) => {
    const thumbs = card.thumbnails || card.images;
    if (!thumbs?.length) return null;
    const first = thumbs[0];
    const data = first.image_data || first.imageData;
    const mime = first.mime_type || first.mimeType || 'image/jpeg';
    if (data) return `data:${mime};base64,${data}`;
    return null;
  };

  return (
    <div className="card-list-wrap">
      <div className="card-list-header">
        <h3>Your cards</h3>
        <div className="card-list-actions">
          <input
            type="search"
            className="search-input"
            placeholder="Search cards..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button
            className="export-btn"
            onClick={onExport}
            disabled={cards.length === 0}
          >
            Export to Excel
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="empty-hint">Upload images to extract and save business cards.</p>
      ) : (
        <div className="card-list">
          {cards.map((card) => (
            <div key={card.id} className="card-item">
              <div className="card-item-preview">
                {getThumbnailUrl(card) ? (
                  <img
                    src={getThumbnailUrl(card)}
                    alt=""
                    className="card-thumbnail"
                  />
                ) : (
                  <div className="card-thumbnail-placeholder">No image</div>
                )}
                <div className="card-item-summary">
                  <strong>{card.personName || 'Unknown'}</strong>
                  <span>{card.firmName || ''}</span>
                  <span className="card-email">{card.email || ''}</span>
                </div>
              </div>

              {editingId === card.id ? (
                <CardEditor
                  card={card}
                  onSave={handleCardUpdate}
                  onClose={() => setEditingId(null)}
                />
              ) : (
                <div className="card-item-actions">
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => setEditingId(card.id)}
                  >
                    Edit
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => onDelete(card.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
