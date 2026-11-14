# DiffTool

A client-side text comparison tool: side-by-side and unified views, word-level highlights inside changed line pairs, diff stats, and one-click patch copying.

## Features

- Side-by-side view aligns deleted/added line runs into pairs and highlights the changed words within them (not just whole lines)
- Unified view with `−`/`+` gutters and old/new line numbers
- Live stats: additions, deletions, unchanged count
- "Copy patch" produces a unified-style patch on the clipboard
- Sample texts preloaded; everything runs locally via the `diff` library

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

## Motion

Rows cascade in with a subtle 200ms slide (staggered 8ms/row, capped) — openmotion-style easing. `prefers-reduced-motion` respected.

## License

MIT
