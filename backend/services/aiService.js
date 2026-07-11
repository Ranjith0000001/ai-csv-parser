/**
 * AI Service – uses Groq's Llama model for CRM field mapping.
 *
 * Replaced the previous Gemini implementation. The external interface
 * (mapToCrmSchema function) remains identical so consuming services
 * do not need changes.
 */
const Groq = require('groq-sdk');
const CRM_SYSTEM_PROMPT = require('../prompts/crmPrompt');

// ── Groq Client Initialization ─────────────────────────────────────────
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error('GROQ_API_KEY is not set in environment variables.');
}

const groq = new Groq({ apiKey });

const MODEL = 'llama-3.3-70b-versatile';

/**
 * Send parsed CSV records to Groq and receive mapped CRM JSON.
 *
 * @param {object[]} rows - Array of row objects from the parsed CSV.
 * @returns {Promise<object[]>} Array of CRM-mapped record objects.
 * @throws {Error} If the API call fails or response cannot be parsed.
 */
async function mapToCrmSchema(rows) {
  if (!rows || rows.length === 0) {
    return [];
  }

  // Build the user message containing the CSV data
  const csvDataJson = JSON.stringify(rows, null, 2);
  const userMessage = `Map the following CSV records to the CRM schema:\n\n${csvDataJson}`;

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: CRM_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1, // low temperature for consistent, deterministic output
    });

    // Extract the text response
    const text = response?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new Error('Groq returned an empty response.');
    }

    // Parse the JSON response
    let mappedRecords;
    try {
      mappedRecords = JSON.parse(text);
    } catch (parseError) {
      // Attempt to extract JSON from the response if wrapped in markdown
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        mappedRecords = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse Groq response as JSON: ${parseError.message}`);
      }
    }

    // Validate that the response is an array
    if (!Array.isArray(mappedRecords)) {
      throw new Error('Groq response is not an array of records.');
    }

    return mappedRecords;
  } catch (error) {
    // Wrap the error with context
    throw new Error(`Groq CRM mapping failed: ${error.message}`);
  }
}

module.exports = { mapToCrmSchema };