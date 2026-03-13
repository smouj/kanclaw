# KanClaw Screenshots

Curated visual assets used by the root README files.

## Current assets

| File | Purpose | Resolution |
|---|---|---|
| `01-dashboard.png` | Main dashboard view | 1920x1080 |
| `02-workspace.png` | Project workspace view | 1920x1080 |

## Regeneration workflow

From `frontend/`:

```bash
node screenshot-fresh.js
```

This script captures fresh screenshots from `http://localhost:3020` and writes directly to `../screenshots`.

## Quality checklist

- 1920×1080 minimum
- No broken UI states
- Fully loaded page before capture
- Consistent dark cinematic theme
- README references must match real filenames
