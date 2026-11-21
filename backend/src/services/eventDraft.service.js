import { env } from '../config/env.js';

/**
 * Parses and interprets date strings in the configured campus timezone, returning a UTC Date
 */
export const parseCampusDateTime = (dateString, timeZone = env.CAMPUS_TIMEZONE || 'Asia/Kolkata') => {
  if (!dateString || typeof dateString !== 'string') return null;

  const trimmed = dateString.trim();

  // If already contains offset (Z or +HH:MM or -HH:MM at the end)
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  // Matches YYYY-MM-DDTHH:mm(:ss)? or YYYY-MM-DD HH:mm(:ss)?
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  const [_, year, month, day, hour, minute, second = '00'] = match;

  try {
    const tempUtc = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, +second));
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(tempUtc);
    const getPart = (type) => parts.find((p) => p.type === type)?.value;
    const tzYear = +getPart('year');
    const tzMonth = +getPart('month');
    const tzDay = +getPart('day');
    const tzHour = +getPart('hour');
    const tzMin = +getPart('minute');
    const tzSec = +getPart('second');

    const tzTime = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMin, tzSec);
    const offsetMs = tzTime - tempUtc.getTime();

    const resolvedUtc = new Date(tempUtc.getTime() - offsetMs);
    return isNaN(resolvedUtc.getTime()) ? null : resolvedUtc;
  } catch {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
};

/**
 * Normalizes and resolves event draft from AI extraction against active MongoDB resources
 */
export const normalizeEventDraft = ({ currentDraft = {}, aiDraft = {}, activeResources = [] }) => {
  const missingFields = [];
  const clarificationsNeeded = [];

  // 1. Merge title
  const rawTitle = aiDraft.title || currentDraft.title || null;
  const title = typeof rawTitle === 'string' && rawTitle.trim().length >= 2 ? rawTitle.trim() : null;
  if (!title) {
    missingFields.push('title');
  }

  // 2. Merge description
  const rawDesc = aiDraft.description || currentDraft.description || null;
  const description = typeof rawDesc === 'string' && rawDesc.trim().length >= 5 ? rawDesc.trim() : null;
  if (!description) {
    missingFields.push('description');
  }

  // 3. Event Type
  const eventType = (aiDraft.eventType || currentDraft.eventType || '').trim() || null;

  // 4. Dates
  const rawStartAt = aiDraft.startAt || currentDraft.startAt || null;
  const rawEndAt = aiDraft.endAt || currentDraft.endAt || null;

  const startAt = parseCampusDateTime(rawStartAt);
  const endAt = parseCampusDateTime(rawEndAt);

  if (!startAt) {
    missingFields.push('startAt');
  }
  if (!endAt) {
    missingFields.push('endAt');
  }

  let validDates = false;
  if (startAt && endAt) {
    if (endAt.getTime() <= startAt.getTime()) {
      clarificationsNeeded.push('Event end time must be later than start time.');
    } else {
      validDates = true;
    }
  }

  // 5. Attendee Count
  const rawAttendee = aiDraft.attendeeCount ?? currentDraft.attendeeCount ?? null;
  let attendeeCount = null;
  if (rawAttendee !== null && Number.isInteger(rawAttendee) && rawAttendee > 0) {
    attendeeCount = rawAttendee;
  } else {
    missingFields.push('attendeeCount');
  }

  // 6. Resource Resolution
  // Combine mentions from AI draft with any existing previously resolved resources
  const mentionsToResolve = [...(aiDraft.resourceMentions || [])];

  // If no new mentions from AI, preserve previously resolved resources from currentDraft
  if (mentionsToResolve.length === 0 && Array.isArray(currentDraft.resources)) {
    currentDraft.resources.forEach((r) => {
      mentionsToResolve.push({
        name: r.name,
        requestedQuantity: r.requestedQuantity,
      });
    });
  }

  const resolvedMap = new Map(); // resourceId -> resource entry
  const unknownMentions = [];
  const ambiguousMentions = [];

  for (const mention of mentionsToResolve) {
    if (!mention.name || typeof mention.name !== 'string') continue;

    const query = mention.name.trim().toLowerCase();

    // 1. Exact match on resource name
    let matches = activeResources.filter((r) => r.name.toLowerCase() === query);

    // 2. If no exact match, try token or substring match
    if (matches.length === 0) {
      matches = activeResources.filter(
        (r) => r.name.toLowerCase().includes(query) || query.includes(r.name.toLowerCase())
      );
    }

    if (matches.length === 0) {
      unknownMentions.push(mention.name);
    } else if (matches.length > 1) {
      ambiguousMentions.push({
        mention: mention.name,
        candidates: matches.map((m) => m.name),
      });
    } else {
      const matched = matches[0];
      const resourceIdStr = matched._id.toString();

      let quantity = null;
      if (matched.resourceMode === 'quantity') {
        const parsedQty = Number(mention.requestedQuantity);
        quantity = Number.isInteger(parsedQty) && parsedQty > 0 ? parsedQty : 1;
      }

      if (resolvedMap.has(resourceIdStr)) {
        // Combine duplicate mentions
        const existing = resolvedMap.get(resourceIdStr);
        if (matched.resourceMode === 'quantity') {
          existing.requestedQuantity = (existing.requestedQuantity || 0) + (quantity || 0);
        }
      } else {
        resolvedMap.set(resourceIdStr, {
          resourceId: matched._id,
          name: matched.name,
          category: matched.category,
          resourceMode: matched.resourceMode,
          requestedQuantity: quantity,
        });
      }
    }
  }

  const resolvedResources = Array.from(resolvedMap.values());

  if (resolvedResources.length === 0) {
    missingFields.push('resources');
  }

  if (unknownMentions.length > 0) {
    clarificationsNeeded.push(
      `Unrecognized resource: "${unknownMentions.join(', ')}". Please select from active campus resources.`
    );
  }

  if (ambiguousMentions.length > 0) {
    ambiguousMentions.forEach((amb) => {
      clarificationsNeeded.push(
        `Ambiguous resource "${amb.mention}". Did you mean: ${amb.candidates.join(' or ')}?`
      );
    });
  }

  // 7. Stage Determination
  const isReadyForReview =
    Boolean(title) &&
    Boolean(description) &&
    validDates &&
    attendeeCount !== null &&
    resolvedResources.length > 0 &&
    missingFields.length === 0 &&
    clarificationsNeeded.length === 0;

  const conversationStage = isReadyForReview ? 'ready_for_review' : 'collecting_details';

  return {
    title,
    description,
    eventType,
    startAt: startAt ? startAt.toISOString() : null,
    endAt: endAt ? endAt.toISOString() : null,
    attendeeCount,
    resources: resolvedResources,
    missingFields,
    clarificationsNeeded,
    conversationStage,
    isReadyForReview,
  };
};
