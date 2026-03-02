import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db.js';
import { extractBusinessCardMultiImage } from '../gemini.js';

const prepare = (sql) => db.prepare(sql);

const router = Router();

// GET /api/cards/export - must be before /:id
router.get('/export', (req, res) => {
  const rows = prepare('SELECT * FROM cards ORDER BY created_at DESC').all();
  const cards = rows.map((row) => ({
    id: row.id,
    firmName: row.firm_name || '',
    personName: row.person_name || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    metadata: row.metadata ? JSON.parse(row.metadata) : [],
  }));

  const allMetadataKeys = new Set();
  cards.forEach((c) => c.metadata.forEach((m) => allMetadataKeys.add(m.name)));
  const metadataKeys = [...allMetadataKeys].sort();

  res.json({ cards, metadataKeys });
});

// GET /api/cards?q=...
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  let rows;

  if (q) {
    const pattern = `%${q}%`;
    rows = prepare(
        `SELECT c.*,
          (SELECT json_group_array(json_object('id', id, 'image_data', image_data, 'mime_type', mime_type, 'position', position))
           FROM card_images WHERE card_id = c.id ORDER BY position) AS images
        FROM cards c
        WHERE c.firm_name LIKE ? OR c.person_name LIKE ? OR c.phone LIKE ?
          OR c.email LIKE ? OR c.address LIKE ? OR c.metadata LIKE ?
        ORDER BY c.created_at DESC`
      )
      .all(pattern, pattern, pattern, pattern, pattern, pattern);
  } else {
    rows = prepare(
        `SELECT c.*,
          (SELECT json_group_array(json_object('id', id, 'image_data', image_data, 'mime_type', mime_type, 'position', position))
           FROM card_images WHERE card_id = c.id ORDER BY position) AS images
        FROM cards c
        ORDER BY c.created_at DESC`
      )
      .all();
  }

  const cards = rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    firmName: row.firm_name || '',
    personName: row.person_name || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    metadata: row.metadata ? JSON.parse(row.metadata) : [],
    thumbnails: parseImages(row.images),
  }));

  res.json(cards);
});

function parseImages(imagesJson) {
  if (!imagesJson) return [];
  try {
    const arr = JSON.parse(imagesJson);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// GET /api/cards/:id
router.get('/:id', (req, res) => {
  const row = prepare(
      `SELECT c.*,
        (SELECT json_group_array(json_object('id', id, 'image_data', image_data, 'mime_type', mime_type, 'position', position))
         FROM card_images WHERE card_id = c.id ORDER BY position) AS images
      FROM cards c WHERE c.id = ?`
    )
    .get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Card not found' });

  res.json({
    id: row.id,
    createdAt: row.created_at,
    firmName: row.firm_name || '',
    personName: row.person_name || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    metadata: row.metadata ? JSON.parse(row.metadata) : [],
    thumbnails: parseImages(row.images),
  });
});

// POST /api/cards
router.post('/', async (req, res) => {
  const { images } = req.body;
  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'images array required with at least one base64 image' });
  }

  const imagePayloads = images.map((img) => ({
    base64: img.base64 || img.data || '',
    mimeType: img.mimeType || img.mime_type || 'image/jpeg',
  })).filter((img) => img.base64);

  if (imagePayloads.length === 0) {
    return res.status(400).json({ error: 'No valid image data' });
  }

  try {
    const extracted = await extractBusinessCardMultiImage(imagePayloads);
    const id = randomUUID();
    const now = Date.now();

    prepare(
      `INSERT INTO cards (id, created_at, firm_name, person_name, phone, email, address, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      now,
      extracted.firmName,
      extracted.personName,
      extracted.phone,
      extracted.email,
      extracted.address,
      JSON.stringify(extracted.metadata || [])
    );

    for (let i = 0; i < imagePayloads.length; i++) {
      prepare(
        `INSERT INTO card_images (id, card_id, image_data, mime_type, position)
         VALUES (?, ?, ?, ?, ?)`
      ).run(randomUUID(), id, imagePayloads[i].base64, imagePayloads[i].mimeType, i);
    }

    const row = prepare('SELECT * FROM cards WHERE id = ?').get(id);
    const imgRows = prepare('SELECT id, image_data, mime_type, position FROM card_images WHERE card_id = ? ORDER BY position').all(id);

    res.status(201).json({
      id: row.id,
      createdAt: row.created_at,
      firmName: row.firm_name || '',
      personName: row.person_name || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
      metadata: row.metadata ? JSON.parse(row.metadata) : [],
      thumbnails: imgRows.map((r) => ({
        id: r.id,
        image_data: r.image_data,
        mime_type: r.mime_type,
        position: r.position,
      })),
    });
  } catch (err) {
    console.error('Extraction error:', err);
    res.status(500).json({ error: err.message || 'Extraction failed' });
  }
});

// PATCH /api/cards/:id
router.patch('/:id', (req, res) => {
  const { firmName, personName, phone, email, address, metadata } = req.body;
  const id = req.params.id;

  const existing = prepare('SELECT id FROM cards WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Card not found' });

  const updates = [];
  const values = [];

  if (firmName !== undefined) {
    updates.push('firm_name = ?');
    values.push(firmName);
  }
  if (personName !== undefined) {
    updates.push('person_name = ?');
    values.push(personName);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    values.push(phone);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  if (address !== undefined) {
    updates.push('address = ?');
    values.push(address);
  }
  if (metadata !== undefined) {
    updates.push('metadata = ?');
    values.push(JSON.stringify(Array.isArray(metadata) ? metadata : []));
  }

  if (updates.length === 0) return res.json(existing);

  values.push(id);
  prepare(`UPDATE cards SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const row = prepare('SELECT * FROM cards WHERE id = ?').get(id);
  const imgRows = prepare('SELECT id, image_data, mime_type, position FROM card_images WHERE card_id = ? ORDER BY position').all(id);

  res.json({
    id: row.id,
    createdAt: row.created_at,
    firmName: row.firm_name || '',
    personName: row.person_name || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    metadata: row.metadata ? JSON.parse(row.metadata) : [],
    thumbnails: imgRows.map((r) => ({
      id: r.id,
      image_data: r.image_data,
      mime_type: r.mime_type,
      position: r.position,
    })),
  });
});

// DELETE /api/cards/:id
router.delete('/:id', (req, res) => {
  const result = prepare('DELETE FROM cards WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Card not found' });
  res.status(204).send();
});

export default router;
