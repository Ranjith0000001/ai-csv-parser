/**
 * AI Service – uses Groq's Llama model for CRM field mapping.
 */
import CRM_SYSTEM_PROMPT from '../prompts/crmPrompt.js';
import logger from '../utils/logger.js';

const MODEL = 'llama-3.3-70b-versatile';
const REQUEST_TIMEOUT = 60000;

let groqClient = null;

async function getGroqClient() {
  if (!groqClient) {
    const { default: Groq } = await import('groq-sdk');
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      logger.error('GROQ_API_KEY is not set in environment variables.');
      throw new Error('GROQ_API_KEY is not configured');
    }

    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

/**
 * Send parsed CSV records to Groq and receive mapped CRM JSON.
 *
 * @param {object[]} rows - Array of row objects from the parsed CSV.
 * @returns {Promise<object[]>} Array of CRM-mapped record objects.
 */
async function mapToCrmSchema(rows) {
  if (!rows || rows.length === 0) {
    return [];
  }

  const csvDataJson = JSON.stringify(rows, null, 2);
  const userMessage = `Map the following CSV records to the CRM schema:\n\n${csvDataJson}`;

  try {
    const groq = await getGroqClient();

    logger.info('Requesting CRM mapping from Groq AI', { recordCount: rows.length, model: MODEL });

    const response = await Promise.race([
      groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: CRM_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Groq API request timeout')), REQUEST_TIMEOUT)
      ),
    ]);

    const text = response?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new Error('Groq returned an empty response.');
    }

    let mappedRecords;
    try {
      mappedRecords = JSON.parse(text);
    } catch (parseError) {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          mappedRecords = JSON.parse(jsonMatch[0]);
        } catch (e) {
          logger.error('Failed to parse Groq response as JSON', { text: text.substring(0, 200) });
          throw new Error('Invalid JSON response from AI service');
        }
      } else {
        logger.error('Failed to parse Groq response as JSON', { text: text.substring(0, 200) });
        throw new Error('Invalid JSON response from AI service');
      }
    }

    if (!Array.isArray(mappedRecords)) {
      throw new Error('AI response is not in the expected format');
    }

    logger.info('CRM mapping completed successfully', { recordCount: mappedRecords.length });
    return mappedRecords;
  } catch (error) {
    logger.error('Groq CRM mapping failed', { error: error.message });
    throw new Error(`AI mapping failed: ${error.message}`);
  }
}

export { mapToCrmSchema };