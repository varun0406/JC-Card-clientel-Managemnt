import { useState, useCallback } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { ExtractionProgress } from './components/ExtractionProgress';
import { DataTable } from './components/DataTable';
import { extractBusinessCardWithGemini } from './utils/gemini';
import { exportToExcel } from './utils/excelExport';
import './App.css';

function createThumbnail(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function App() {
  const [rows, setRows] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, value: 1 });
  const [error, setError] = useState('');

  const handleFilesSelected = useCallback(async (files) => {
    setError('');
    setProcessing(true);
    const newRows = [];

    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length, value: 0.5 });

      const file = files[i];
      let parsed = {};
      try {
        parsed = await extractBusinessCardWithGemini(file);
      } catch (err) {
        console.error('Extraction failed:', err);
        setError(err?.message || 'Extraction failed');
      }

      const thumbnail = await createThumbnail(file);
      newRows.push({
        id: `${Date.now()}-${i}`,
        thumbnail,
        ...parsed,
      });
    }

    setRows((prev) => [...prev, ...newRows]);
    setProcessing(false);
    setProgress({ current: 0, total: 0, value: 1 });
  }, []);

  const handleExport = useCallback(() => {
    const data = rows.map(({ id, thumbnail, ...rest }) => rest);
    exportToExcel(data);
  }, [rows]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Business Card to Excel</h1>
        <p>Upload images of business cards — powered by Google AI Studio</p>
      </header>

      <main className="app-main">
        <ImageUpload
          onFilesSelected={handleFilesSelected}
          disabled={processing}
        />

        {error && <p className="error-msg">{error}</p>}

        {processing && (
          <ExtractionProgress
            current={progress.current}
            total={progress.total}
            progress={progress.value}
          />
        )}

        <DataTable
          rows={rows}
          onUpdate={setRows}
          onExport={handleExport}
        />
      </main>
    </div>
  );
}

export default App;
