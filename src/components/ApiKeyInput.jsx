import { useState, useEffect } from 'react';

const STORAGE_KEY = 'gemini_api_key';

export function ApiKeyInput({ onApiKeyChange, disabled }) {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setValue(stored);
      setSaved(true);
      onApiKeyChange(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    setSaved(false);
    if (v) onApiKeyChange(v);
    else onApiKeyChange('');
  };

  const handleSave = () => {
    if (value.trim()) {
      localStorage.setItem(STORAGE_KEY, value.trim());
      setSaved(true);
    }
  };

  return (
    <div className="api-key-input">
      <label htmlFor="api-key">Google AI Studio API Key</label>
      <div className="api-key-row">
        <input
          id="api-key"
          type="password"
          value={value}
          onChange={handleChange}
          placeholder="Enter your API key from aistudio.google.com"
          disabled={disabled}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || !value.trim()}
          title="Save to browser (stored locally only)"
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
      <p className="api-key-hint">
        Get a free API key at{' '}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
        >
          aistudio.google.com/apikey
        </a>
      </p>
    </div>
  );
}
