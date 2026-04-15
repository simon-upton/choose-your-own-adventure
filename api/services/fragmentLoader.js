/**
 * Fragment Loader — P1-01
 * Validates raw JSON fragment data and returns a structured in-memory model.
 * Throws ValidationError with per-field details on any validation failure.
 */

export class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details; // array of { index, id, errors: string[] }
  }
}

/**
 * @param {unknown} rawData - raw parsed JSON, expected to be an array
 * @returns {Fragment[]} validated, structured fragment objects
 * @throws {ValidationError} if any fragment fails validation
 */
export function loadFragments(rawData) {
  if (!Array.isArray(rawData)) {
    throw new ValidationError('Fragment data must be a JSON array', []);
  }

  const errors = [];
  const fragments = [];
  const seenIds = new Set();

  for (const [index, raw] of rawData.entries()) {
    const fragErrors = validateFragment(raw, seenIds);

    if (fragErrors.length > 0) {
      errors.push({ index, id: raw?.id, errors: fragErrors });
    } else {
      seenIds.add(raw.id);
      fragments.push(normalizeFragment(raw));
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(
      `Fragment validation failed: ${errors.length} fragment(s) have errors`,
      errors
    );
  }

  return fragments;
}

function validateFragment(raw, seenIds) {
  const errors = [];

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return ['fragment must be a JSON object'];
  }

  // id
  if (typeof raw.id !== 'number' || !Number.isInteger(raw.id) || raw.id <= 0) {
    errors.push(`id must be a positive integer, got ${JSON.stringify(raw.id)}`);
  } else if (seenIds.has(raw.id)) {
    errors.push(`duplicate id ${raw.id}`);
  }

  // text
  if (typeof raw.text !== 'string' || raw.text.trim() === '') {
    errors.push('text must be a non-empty string');
  }

  // choices
  if (!Array.isArray(raw.choices)) {
    errors.push('choices must be an array');
  } else {
    for (const [ci, choice] of raw.choices.entries()) {
      if (choice === null || typeof choice !== 'object') {
        errors.push(`choices[${ci}] must be an object`);
        continue;
      }
      if (typeof choice.text !== 'string' || choice.text.trim() === '') {
        errors.push(`choices[${ci}].text must be a non-empty string`);
      }
      if (
        typeof choice.targetId !== 'number' ||
        !Number.isInteger(choice.targetId) ||
        choice.targetId <= 0
      ) {
        errors.push(
          `choices[${ci}].targetId must be a positive integer, got ${JSON.stringify(choice.targetId)}`
        );
      }
    }
  }

  // metadata
  if (!raw.metadata || typeof raw.metadata !== 'object' || Array.isArray(raw.metadata)) {
    errors.push('metadata must be an object');
  } else {
    const m = raw.metadata;
    if (typeof m.source !== 'string' || m.source.trim() === '') {
      errors.push('metadata.source must be a non-empty string');
    }
    if (typeof m.revision !== 'number' || !Number.isInteger(m.revision) || m.revision < 1) {
      errors.push('metadata.revision must be an integer >= 1');
    }
    if (!isValidISO8601(m.createdAt)) {
      errors.push('metadata.createdAt must be a valid ISO 8601 timestamp');
    }
    if (!isValidISO8601(m.updatedAt)) {
      errors.push('metadata.updatedAt must be a valid ISO 8601 timestamp');
    }
    if (isValidISO8601(m.createdAt) && isValidISO8601(m.updatedAt)) {
      if (new Date(m.updatedAt) < new Date(m.createdAt)) {
        errors.push('metadata.updatedAt must not be earlier than createdAt');
      }
    }
  }

  return errors;
}

function normalizeFragment(raw) {
  return {
    id: raw.id,
    title: typeof raw.title === 'string' ? raw.title : null,
    text: raw.text,
    choices: raw.choices.map((c, i) => ({
      text: c.text,
      targetId: c.targetId,
      condition: typeof c.condition === 'string' ? c.condition : null,
      order: i,
    })),
    metadata: {
      source: raw.metadata.source,
      revision: raw.metadata.revision,
      createdAt: raw.metadata.createdAt,
      updatedAt: raw.metadata.updatedAt,
      author: typeof raw.metadata.author === 'string' ? raw.metadata.author : null,
      notes: typeof raw.metadata.notes === 'string' ? raw.metadata.notes : null,
    },
    tags: Array.isArray(raw.tags) ? raw.tags.filter(t => typeof t === 'string') : [],
  };
}

function isValidISO8601(value) {
  if (typeof value !== 'string') return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}
