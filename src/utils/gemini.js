import { GoogleGenAI, createPartFromBase64, createPartFromText } from '@google/genai';

// Embed your API key: paste directly here, or set VITE_GEMINI_API_KEY in .env
const EMBEDDED_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const EXTRACTION_PROMPT = `Extract business card information from this image. Return ONLY a valid JSON object with these exact keys (use empty string "" if not found):
{
  "firmName": "company or organization name",
  "personName": "person's full name",
  "phone": "phone number(s)",
  "email": "email address",
  "address": "full address"
}

Return nothing else—no markdown, no code blocks, just the raw JSON object.`;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
 * Extract business card fields from an image using Google AI Studio (Gemini).
 * @param {File} file - Image file
 * @param {string} apiKey - Google AI Studio API key
 * @returns {Promise<{firmName: string, personName: string, phone: string, email: string, address: string}>}
 */
export async function extractBusinessCardWithGemini(file, apiKey) {
  const key = (apiKey || EMBEDDED_API_KEY)?.trim();
  if (!key) {
    throw new Error(
      'No API key. Set VITE_GEMINI_API_KEY in .env or embed in src/utils/gemini.js'
    );
  }

  const { base64, mimeType } = await fileToBase64(file);
  const ai = new GoogleGenAI({ apiKey: key });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      createPartFromText(EXTRACTION_PROMPT),
      createPartFromBase64(base64, mimeType || 'image/jpeg'),
    ],
  });

  const text = response?.text ?? '';
  const parsed = parseJsonResponse(text);

  if (!parsed) {
    throw new Error('Could not parse extracted data from Gemini response');
  }

  return {
    firmName: String(parsed.firmName ?? '').trim(),
    personName: String(parsed.personName ?? '').trim(),
    phone: String(parsed.phone ?? '').trim(),
    email: String(parsed.email ?? '').trim(),
    address: String(parsed.address ?? '').trim(),
  };
}
