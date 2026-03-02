const API = '/api/cards';

export async function fetchCards(q = '') {
  const url = q ? `${API}?q=${encodeURIComponent(q)}` : API;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch cards');
  return res.json();
}

export async function fetchCard(id) {
  const res = await fetch(`${API}/${id}`);
  if (!res.ok) throw new Error('Card not found');
  return res.json();
}

export async function createCard(images) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create card');
  }
  return res.json();
}

export async function updateCard(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update card');
  return res.json();
}

export async function deleteCard(id) {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete card');
}

export async function fetchExportData() {
  const res = await fetch(`${API}/export`);
  if (!res.ok) throw new Error('Failed to fetch export data');
  return res.json();
}
