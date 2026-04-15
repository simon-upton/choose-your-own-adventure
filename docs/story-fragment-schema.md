# Story Fragment JSON Schema (MVP v0.1)

## Purpose

Defines the canonical JSON shape for authoring and reading CYOA story fragments in the web fork MVP.

## Design Notes

- Uses integer `id` values to stay compatible with current page-number-oriented script behavior.
- Keeps field names generic so ids can migrate to string/UUID later.
- Top-level required fields are intentionally small: `id`, `text`, `choices`, `metadata`.

## Fragment Object

### Required Fields

- `id` (integer)
- Unique fragment identifier.
- Must be a positive integer.

- `text` (string)
- Narrative text shown for this fragment.
- Must be non-empty after trimming whitespace.

- `choices` (array of choice objects)
- Outgoing choices for this fragment.
- Can be empty for terminal fragments.

- `metadata` (object)
- Bookkeeping fields for auditability and filtering.

### Optional Fields

- `title` (string)
- Optional short label for authoring UI.

- `tags` (array of strings)
- Optional categorization labels.

## Choice Object

### Required Fields

- `text` (string)
- Choice text shown to reader.
- Must be non-empty.

- `targetId` (integer)
- Destination fragment id.
- Must be a positive integer.

### Optional Fields

- `condition` (string)
- Optional rule expression for future conditional branching.

## Metadata Object

### Required Fields

- `source` (string)
- Origin of the fragment, for example `cot-seed`, `author`, or `import`.

- `revision` (integer)
- Revision number, starting at `1` and increasing on updates.

- `createdAt` (string, ISO 8601)
- Creation timestamp in UTC.

- `updatedAt` (string, ISO 8601)
- Last update timestamp in UTC.

### Optional Fields

- `author` (string)
- Author or editor identifier.

- `notes` (string)
- Internal notes for editing workflow.

## Validation Rules (MVP)

- `id` values are unique across all fragments.
- Every `choices[*].targetId` must exist in the fragment collection.
- A fragment with `choices: []` is treated as terminal.
- `createdAt` and `updatedAt` must parse as valid timestamps.
- `updatedAt` should not be earlier than `createdAt`.

## Valid Example

```json
{
  "id": 2,
  "title": "Snake Canyon Entrance",
  "text": "You've hiked through Snake Canyon once before, but this time the cave draws you in.",
  "choices": [
    {
      "text": "Enter the cave.",
      "targetId": 10
    },
    {
      "text": "Follow the stream instead.",
      "targetId": 14
    }
  ],
  "metadata": {
    "source": "cot-seed",
    "revision": 1,
    "createdAt": "2026-04-14T18:00:00Z",
    "updatedAt": "2026-04-14T18:00:00Z",
    "author": "system"
  },
  "tags": ["intro", "branch-point"]
}
```

## Invalid Example

```json
{
  "id": "2",
  "text": "",
  "choices": [
    {
      "text": "Go left",
      "targetId": "10"
    }
  ],
  "metadata": {
    "source": "cot-seed",
    "revision": 0,
    "createdAt": "not-a-date"
  }
}
```

Why invalid:

- `id` is a string, not an integer.
- `text` is empty.
- `choices[0].targetId` is a string, not an integer.
- `metadata.revision` must be >= 1.
- `metadata.updatedAt` is missing.
- `metadata.createdAt` is not a valid ISO 8601 timestamp.
