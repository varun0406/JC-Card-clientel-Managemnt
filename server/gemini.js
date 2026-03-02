import { GoogleGenAI, createPartFromBase64, createPartFromText } from '@google/genai';

const EXTRACTION_PROMPT = `Extract business card information from these image(s). They may be front and back of the same card — merge all information into one result.

Return ONLY a valid JSON object with:
1. Fixed fields (use "" if not found): firmName, personName, phone, email, address
2. metadata: array of { name, value } for any OTHER fields you find (e.g. Title, Website, LinkedIn, Fax)

Example:
{
  "firmName": "Acme Inc",
  "personName": "Jane Doe",
  "phone": "+1 555-1234",
  "email": "jane@acme.com",
  "address": "123 Main St",
  "metadata": [
    { "name": "Title", "value": "CEO" },
    { "name": "Website", "value": "https://acme.com" }
  ]
}

Return nothing else—no markdown, no code blocks, just the raw JSON object.`;

function parseJsonResponse(text) {
  const trimmed = text?.trim() || '';
  let jsonStr = trimmed;
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Extract business card from 1–N images (merged extraction).
 * @param {Array<{ base64: string, mimeType: string }>} images
 * @returns {Promise<{ firmName, personName, phone, email, address, metadata }>}
 */
export async function extractBusinessCardMultiImage(images) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error('Set GEMINI_API_KEY or VITE_GEMINI_API_KEY in .env');
  }

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  const parts = [createPartFromText(EXTRACTION_PROMPT)];
  for (const img of images) {
    parts.push(createPartFromBase64(img.base64, img.mimeType || 'image/jpeg'));
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: parts,
  });

  const text = response?.text ?? '';
  const parsed = parseJsonResponse(text);

  if (!parsed) {
    throw new Error('Could not parse extracted data from Gemini response');
  }

  const metadata = Array.isArray(parsed.metadata)
    ? parsed.metadata.filter((m) => m && m.name != null)
    : [];

  return {
    firmName: String(parsed.firmName ?? '').trim(),
    personName: String(parsed.personName ?? '').trim(),
    phone: String(parsed.phone ?? '').trim(),
    email: String(parsed.email ?? '').trim(),
    address: String(parsed.address ?? '').trim(),
    metadata: metadata.map((m) => ({ name: String(m.name), value: String(m.value ?? '') })),
  };
}
