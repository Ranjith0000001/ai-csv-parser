/**
 * AI Service – uses Groq's Llama model for CRM field mapping.
 */
import CRM_SYSTEM_PROMPT from '../prompts/crmPrompt.js';
import logger from '../utils/logger.js';

const MODEL = 'llama-3.3-70b-versatile';
const REQUEST_TIMEOUT = 60000;
const BATCH_SIZE = 50; // Process 50 records per batch to stay within token limits

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
 * Process a single batch of records through Groq AI.
 *
 * @param {object[]} batch - Array of row objects (max BATCH_SIZE)
 * @returns {Promise<object[]>} Array of CRM-mapped record objects
 */
async function processBatch(batch) {
  const csvDataJson = JSON.stringify(batch, null, 2);
  const userMessage = `Map the following CSV records to the CRM schema:\n\n${csvDataJson}`;

  const groq = await getGroqClient();

  logger.info('Requesting CRM mapping from Groq AI', { recordCount: batch.length, model: MODEL });

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

  logger.info('CRM mapping completed for batch', { recordCount: mappedRecords.length });
  return mappedRecords;
}

/**
 * Send parsed CSV records to Groq and receive mapped CRM JSON.
 * Processes large datasets in batches. Returns partial results if a batch fails.
 *
 * @param {object[]} rows - Array of row objects from the parsed CSV.
 * @returns {Promise<{
 *   success: boolean,
 *   partialSuccess: boolean,
 *   error: string | null,
 *   failedBatch: number | null,
 *   totalRecords: number,
 *   processedRecords: number,
 *   remainingRecords: number,
 *   data: object[]
 * }>}
 */
async function mapToCrmSchema(rows) {
  if (!rows || rows.length === 0) {
    return {
      success: true,
      partialSuccess: false,
      error: null,
      failedBatch: null,
      totalRecords: 0,
      processedRecords: 0,
      remainingRecords: 0,
      data: [],
    };
  }

  logger.info('Starting batch processing', { totalRecords: rows.length, batchSize: BATCH_SIZE });

  // Split rows into batches
  const batches = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }

  logger.info(`Processing ${batches.length} batches`);

  // Process batches sequentially
  const allMappedRecords = [];
  let failedBatch = null;
  let errorMessage = null;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const recordsProcessedSoFar = allMappedRecords.length;
    const remainingRecords = rows.length - recordsProcessedSoFar - batch.length;

    logger.info(`Processing batch ${i + 1}/${batches.length}`, { 
      recordCount: batch.length,
      remaining: remainingRecords 
    });

    try {
      const mappedBatch = await processBatch(batch);
      allMappedRecords.push(...mappedBatch);
    } catch (error) {
      logger.error(`Failed to process batch ${i + 1}`, { error: error.message });
      
      failedBatch = i + 1;
      errorMessage = `Rate limit exceeded at batch ${i + 1}/${batches.length}. ${recordsProcessedSoFar} records processed successfully. ${batch.length + remainingRecords} records remaining. Please retry.`;
      
      // Return partial results
      return {
        success: false,
        partialSuccess: true,
        error: errorMessage,
        failedBatch: failedBatch,
        totalRecords: rows.length,
        processedRecords: recordsProcessedSoFar,
        remainingRecords: batch.length + remainingRecords,
        data: allMappedRecords,
      };
    }
  }

  logger.info('All batches processed successfully', { totalMapped: allMappedRecords.length });
  return {
    success: true,
    partialSuccess: false,
    error: null,
    failedBatch: null,
    totalRecords: rows.length,
    processedRecords: allMappedRecords.length,
    remainingRecords: 0,
    data: allMappedRecords,
  };
}

export { mapToCrmSchema };