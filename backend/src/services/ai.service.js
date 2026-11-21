import { env } from '../config/env.js';
import { aiResponseSchema } from '../validators/ai.schemas.js';

const AI_TIMEOUT_MS = 30000;

/**
 * Builds system prompt instructing AI to parse events strictly as structured JSON
 */
const buildSystemPrompt = (activeResources, currentDraft) => {
  const resourceCatalog = activeResources.map((r) => ({
    name: r.name,
    category: r.category,
    resourceMode: r.resourceMode,
    capacity: r.capacity || null,
    totalQuantity: r.totalQuantity || null,
  }));

  const now = new Date();

  return `You are CampusFlow's AI event coordinator for university students.
Your job is to talk with the student, understand their event requirements, extract structured event information, and guide them with friendly, professional follow-up questions.

CURRENT CONTEXT:
- Current Server Timestamp: ${now.toISOString()}
- Campus Timezone: ${env.CAMPUS_TIMEZONE}
- Available Campus Resources:
${JSON.stringify(resourceCatalog, null, 2)}

CURRENT ACCUMULATED DRAFT:
${JSON.stringify(currentDraft || {}, null, 2)}

YOUR RESPONSIBILITIES:
1. Understand the student's natural language messages.
2. Extract or update event details:
   - title: Clear event title (string or null)
   - description: Brief description of the event purpose and schedule (string or null)
   - eventType: Workshop, Seminar, Hackathon, Cultural, Technical, etc. (string or null)
   - startAt: ISO-8601 date-time string (e.g. YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm). Interpret relative days (tomorrow, next Friday) relative to the Current Server Timestamp in ${env.CAMPUS_TIMEZONE}.
   - endAt: ISO-8601 date-time string (must be after startAt).
   - attendeeCount: Expected number of students/attendees (integer > 0 or null).
   - resourceMentions: Array of resources mentioned by the student with name and requestedQuantity. For capacity-based venues (Seminar Hall, Auditorium), requestedQuantity can be 1 or null. For equipment (Microphone, Projector), extract the requested count.
3. Keep missing or unspecified fields as null.
4. Compose a helpful, natural conversation response in "assistantMessage". If information is missing (such as start time, end time, venue, or expected attendance), politely ask for it in assistantMessage.

STRICT RESTRICTIONS:
- NEVER decide if a resource is available or free.
- NEVER approve, reject, or confirm a final booking.
- NEVER invent MongoDB ObjectIDs for resources.
- Output MUST be valid JSON adhering strictly to this schema:
{
  "assistantMessage": "Natural language response to the student",
  "eventDraft": {
    "title": null,
    "description": null,
    "eventType": null,
    "startAt": null,
    "endAt": null,
    "attendeeCount": null,
    "resourceMentions": [
      {
        "name": "Exact or mentioned resource name",
        "requestedQuantity": 1
      }
    ]
  }
}`;
};

/**
 * Call the OpenAI-compatible AI provider
 */
export const extractEventDetails = async ({ messages, newMessage, activeResources, currentDraft }) => {
  // Check AI credentials
  if (!env.AI_API_KEY || !env.AI_BASE_URL || !env.AI_MODEL) {
    const error = new Error('AI service is not configured on this server.');
    error.statusCode = 503;
    throw error;
  }

  const systemPrompt = buildSystemPrompt(activeResources, currentDraft);

  // Format message history
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: newMessage },
  ];

  const endpoint = `${env.AI_BASE_URL.replace(/\/+$/, '')}/chat/completions`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        messages: formattedMessages,
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      const timeoutError = new Error('AI service request timed out. Please try again.');
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    const networkError = new Error('Failed to reach AI service provider.');
    networkError.statusCode = 502;
    throw networkError;
  }

  if (!response.ok) {
    let errorDetail = 'Unknown provider error';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }
    console.error(`AI Provider HTTP Error (${response.status}): ${errorDetail}`);
    const serviceError = new Error('AI service encountered an upstream error.');
    serviceError.statusCode = 502;
    throw serviceError;
  }

  const rawData = await response.json();
  const rawContent = rawData.choices?.[0]?.message?.content;

  if (!rawContent) {
    const invalidError = new Error('Received empty response from AI service.');
    invalidError.statusCode = 502;
    throw invalidError;
  }

  // Parse JSON, stripping markdown code block if present
  let parsedContent;
  try {
    const cleaned = rawContent.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    parsedContent = JSON.parse(cleaned);
  } catch {
    const jsonError = new Error('AI service returned non-JSON content.');
    jsonError.statusCode = 502;
    throw jsonError;
  }

  // Validate with Zod schema
  const validationResult = aiResponseSchema.safeParse(parsedContent);
  if (!validationResult.success) {
    console.error('AI response validation failed:', validationResult.error.format());
    const schemaError = new Error('AI output did not match expected schema.');
    schemaError.statusCode = 502;
    throw schemaError;
  }

  return validationResult.data;
};
