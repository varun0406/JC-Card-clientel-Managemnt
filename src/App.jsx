import { useState, useCallback, useEffect } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { ExtractionProgress } from './components/ExtractionProgress';
import { CardList } from './components/CardList';
import * as api from './api/cards';
import { exportToExcel } from './utils/excelExport';
import './App.css';

function filesToImages(files) {
  return Promise.all(
    Array.from(files).map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          const base64 = dataUrl.split(',')[1];
          resolve({
            base64,
            mimeType: file.type || 'image/jpeg',
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    })
  );
}

function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, value: 0.5 });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadCards = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const data = await api.fetchCards(q);
      setCards(data);
    } catch (err) {
      setError(err?.message || 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards(searchQuery);
  }, [loadCards, searchQuery]);

  const handleFilesSelected = useCallback(async (files) => {
    const imageFiles = Array.from(files).filter((f) => f.type?.startsWith('image/'));
    if (imageFiles.length === 0) {
      setError('Please select image files');
      return;
    }

    setError('');
    setProcessing(true);
    setProgress({ current: 1, total: 1, value: 0.5 });

    try {
      const images = await filesToImages(imageFiles);
      const card = await api.createCard(images);
      setCards((prev) => [card, ...prev.filter((c) => c.id !== card.id)]);
    } catch (err) {
      setError(err?.message || 'Extraction failed');
    } finally {
      setProcessing(false);
      setProgress({ current: 0, total: 0, value: 1 });
    }
  }, []);

  const handleCardUpdate = useCallback(async (updated) => {
    try {
      const saved = await api.updateCard(updated.id, {
        firmName: updated.firmName,
        personName: updated.personName,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        metadata: updated.metadata,
      });
      setCards((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
    } catch (err) {
      setError(err?.message || 'Failed to update');
    }
  }, []);

  const handleCardDelete = useCallback(async (id) => {
    try {
      await api.deleteCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err?.message || 'Failed to delete');
    }
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const { cards: exportCards, metadataKeys } = await api.fetchExportData();
      exportToExcel(exportCards, metadataKeys);
    } catch (err) {
      setError(err?.message || 'Export failed');
    }
  }, []);

  const handleSearchChange = useCallback((q) => {
    setSearchQuery(q);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Business Card to Excel</h1>
        <p>Upload 1 or more images per card (front + back) — powered by Google AI Studio</p>
      </header>

      <main className="app-main">
        <ImageUpload
          onFilesSelected={handleFilesSelected}
          disabled={processing}
        />

        <div className="upload-hint">
          Select multiple images for one card (e.g. front and back) — they will be merged into a single extraction.
        </div>

        {error && <p className="error-msg">{error}</p>}

        {processing && (
          <ExtractionProgress
            current={progress.current}
            total={progress.total}
            progress={progress.value}
          />
        )}

        {loading ? (
          <p className="loading-msg">Loading cards...</p>
        ) : (
          <CardList
            cards={cards}
            onUpdate={handleCardUpdate}
            onDelete={handleCardDelete}
            onExport={handleExport}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
        )}
      </main>
    </div>
  );
}

export default App;
