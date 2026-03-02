export function DataTable({ rows, onUpdate, onExport }) {
  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate(updated);
  };

  return (
    <div className="data-table-wrap">
      <div className="table-header">
        <h3>Extracted Data</h3>
        <button
          className="export-btn"
          onClick={onExport}
          disabled={rows.length === 0}
        >
          Export to Excel
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="empty-hint">Upload images to extract business card data.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Firm Name</th>
                <th>Person Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id ?? i}>
                  <td>
                    {row.thumbnail && (
                      <img
                        src={row.thumbnail}
                        alt=""
                        className="row-thumbnail"
                      />
                    )}
                  </td>
                  <td>
                    <input
                      value={row.firmName || ''}
                      onChange={(e) =>
                        handleChange(i, 'firmName', e.target.value)
                      }
                      placeholder="Firm name"
                    />
                  </td>
                  <td>
                    <input
                      value={row.personName || ''}
                      onChange={(e) =>
                        handleChange(i, 'personName', e.target.value)
                      }
                      placeholder="Person name"
                    />
                  </td>
                  <td>
                    <input
                      value={row.phone || ''}
                      onChange={(e) =>
                        handleChange(i, 'phone', e.target.value)
                      }
                      placeholder="Phone"
                    />
                  </td>
                  <td>
                    <input
                      value={row.email || ''}
                      onChange={(e) =>
                        handleChange(i, 'email', e.target.value)
                      }
                      placeholder="Email"
                    />
                  </td>
                  <td>
                    <input
                      value={row.address || ''}
                      onChange={(e) =>
                        handleChange(i, 'address', e.target.value)
                      }
                      placeholder="Address"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
