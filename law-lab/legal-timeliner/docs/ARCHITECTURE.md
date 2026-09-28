# Architecture - Investor V1

## Pipeline

```text
File selections (multiple rounds)
        |
        v
CaseFileStore
        |
        | first DOCX -> lazy preload officeParser
        |
        v
User clicks Build Timeline
        |
        v
Sequential processing, one file at a time
        |
        | file selection/removal locked during the batch
        |
        +-- TXT  -> File.text() -> blank-line-separated paragraphs
        |
        +-- DOCX -> officeParser AST -> body/table paragraphs + footnotes/endnotes/comments
        |
        v
DateEngine - deterministic explicit-date matching (Israeli DMY numeric rule)
        |
        v
TimelineBuilder - skip date-only blocks, no deduplication, chronological sort
        |
        +--> RelatedDocumentMatcher - source document + same-date documents/content filenames
        |
        v
Grouped timeline UI with full paragraph + provenance + document links
```

## Isolation boundaries

`DocumentExtractor` is the only component that knows about officeParser.

`DateEngine` receives plain text only.

`TimelineBuilder` receives normalized blocks and knows nothing about DOCX parsing.

`RelatedDocumentMatcher` works only from normalized timeline dates and filenames. It does not perform semantic event matching and does not use AI.

This boundary is deliberate so a future Python service can replace browser DOCX parsing without rewriting the date engine or UI contract.

## officeParser loading

The 5MB-class parser bundle is vendored under `vendor/officeparser/` and is not referenced by the initial HTML. `script-loader.js` injects the local IIFE bundle only after the first DOCX enters the case. The vendored file is pinned to the official v8.0.0 release SHA-256 and is verified by `npm run verify:vendor`. If the case contains TXT only, the bundle is never loaded.

## Data preservation

A block that contains a date but no meaningful non-date text does not create a timeline entry. The builder does not attach neighboring paragraphs and does not infer whether such a date is a document date, creation date, or anything else. A single stray alphanumeric character outside the matched date is not treated as meaningful context.

No surviving timeline entry is deduplicated. Every date occurrence in a block with meaningful context survives independently, including repeated dates across different documents and repeated dates in the same paragraph. Footnotes, endnotes and comments are scanned as separate evidence blocks. Their metadata timestamps are never fed to `DateEngine`; only annotation text is scanned.

## Scope deliberately excluded

- PDF
- OCR execution
- AI / LLM
- server storage
- authentication
- semantic event extraction
- contradiction inference
- automatic fact/allegation classification

## Numeric date policy

Numeric dates use the Israeli `DD/MM/YYYY` order. Two-digit years use a fixed pivot: `00-49` -> `2000-2049`, `50-99` -> `1950-1999`. No user-selectable US numeric mode exists in Investor V1.


## Filename provenance

The UI always displays the original full filename, including its extension. Filenames are never normalized, shortened semantically, or rewritten for presentation. Visual truncation is not used in timeline/source links because suffixes such as dates, V1/V2, or Final may carry evidentiary meaning.
