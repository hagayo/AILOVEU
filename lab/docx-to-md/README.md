# DOCX to Markdown V1.0

Offline browser application for converting `.docx` files to editable Markdown.

## Architecture

```text
DOCX ArrayBuffer
    -> Mammoth (local vendor file)
    -> HTML
    -> local sanitizer
        -> Word Preview
        -> Turndown (local vendor file)
            -> editable Markdown
```

The document never leaves the browser. No backend, framework, CDN, telemetry or remote service is used at runtime.

## Features

- Drag & Drop `.docx`
- Open `.docx`
- Word Preview on the right and Markdown on the left on desktop
- Download `.md`
- Copy Markdown
- Editable Markdown
- Independent RTL/LTR for each pane
- Hebrew support
- Light / Dark / Sepia themes
- Word + character count
- Reset / open another document
- Source filename in the header
- `Ctrl+S` / `Cmd+S` downloads Markdown
- Mammoth conversion warnings
- Sanitized HTML before rendering
- Offline runtime

## Local dependencies

Pinned browser builds:

- Mammoth `1.12.2` -> `vendor/mammoth.browser.min.js`
- Turndown `7.2.4` -> `vendor/turndown.js`

Run `setup-vendor.ps1` once while online if these two files are missing. After that, the project works fully offline.

## Run

After the two vendor files are present, open `index.html` directly in a modern browser. No server or build step is required.

## Security

Mammoth output is not inserted directly into the page. `app.js` removes executable/embedded elements, event-handler attributes, `srcdoc`, and unsafe URL schemes before the HTML is used for either preview or Markdown conversion.

## Tables

Turndown core does not provide rich table-to-Markdown conversion. V1 preserves tables as HTML inside the Markdown instead of losing structure. HTML tables are valid in common Markdown implementations.
