/**
 * fragmentLoader.js
 * Loads and validates story fragment JSON following the schema in docs/story-fragment-schema.md
 */

export function validateFragment(frag) {
  const errors = [];
  if (typeof frag.id !== 'number' || frag.id <= 0) {
    errors.push(`id must be a positive integer, got: ${JSON.stringify(frag.id)}`);
  }
  if (typeof frag.text !== 'string' || frag.text.trim() === '') {
    errors.push('text must be a non-empty string');
  }
  if (!Array.isArray(frag.choices)) {
    errors.push('choices must be an array');
  } else {
    frag.choices.forEach((c, i) => {
      if (typeof c.text !== 'string' || c.text.trim() === '') {
        errors.push(`choices[${i}].text must be non-empty`);
      }
      if (typeof c.targetId !== 'number' || c.targetId <= 0) {
        errors.push(`choices[${i}].targetId must be a positive integer`);
      }
    });
  }
  if (!frag.metadata || typeof frag.metadata !== 'object') {
    errors.push('metadata is required');
  } else {
    const m = frag.metadata;
    if (typeof m.source !== 'string' || m.source.trim() === '') {
      errors.push('metadata.source is required');
    }
    if (typeof m.revision !== 'number' || m.revision < 1) {
      errors.push('metadata.revision must be >= 1');
    }
    if (!m.createdAt || isNaN(Date.parse(m.createdAt))) {
      errors.push('metadata.createdAt must be a valid ISO 8601 timestamp');
    }
    if (!m.updatedAt || isNaN(Date.parse(m.updatedAt))) {
      errors.push('metadata.updatedAt must be a valid ISO 8601 timestamp');
    }
  }
  return errors;
}

/**
 * Load and validate an array of fragment objects.
 * Returns { fragments, errors } where errors is a map of id -> [error strings].
 */
export function loadFragments(jsonArray) {
  if (!Array.isArray(jsonArray)) {
    throw new Error('Fragment data must be a JSON array');
  }

  const fragments = [];
  const errors = {};
  const seenIds = new Set();

  for (const raw of jsonArray) {
    const fragErrors = validateFragment(raw);
    const id = raw.id;

    if (seenIds.has(id)) {
      fragErrors.push(`Duplicate id: ${id}`);
    }
    seenIds.add(id);

    if (fragErrors.length > 0) {
      errors[id ?? 'unknown'] = fragErrors;
    } else {
      fragments.push({
        id: raw.id,
        title: raw.title || `Fragment ${raw.id}`,
        text: raw.text.trim(),
        choices: raw.choices.map(c => ({
          text: c.text.trim(),
          targetId: c.targetId,
          condition: c.condition || null,
        })),
        metadata: { ...raw.metadata },
        tags: Array.isArray(raw.tags) ? raw.tags : [],
      });
    }
  }

  return { fragments, errors };
}

/**
 * Fetch fragment JSON from a URL and load it.
 */
export async function loadFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  const json = await response.json();
  return loadFragments(json);
}

/**
 * Parse fragment JSON from a string and load it.
 */
export function loadFromString(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e.message}`);
  }
  return loadFragments(json);
}
