export function ExtractionProgress({ current, total, progress }) {
  if (total === 0) return null;

  return (
    <div className="extraction-progress">
      <p>
        Extracting from {total} image{total > 1 ? 's' : ''}...
      </p>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
