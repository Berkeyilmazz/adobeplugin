# Adobe Photoshop – Levels Gamma 0.99 Batch Script

A Photoshop ExtendScript (`.jsx`) that batch-processes every JPEG in a folder,
applying a **Levels** adjustment with the middle slider (gamma / midtone) set
from the default `1.00` to **`0.99`**.

## Files
- `LevelsGamma099.jsx` — the batch script.

## Usage
1. In Photoshop: **File → Scripts → Browse…** and select `LevelsGamma099.jsx`
   (or drag the file onto the Photoshop window).
2. Pick the **input folder** of photos when prompted.
3. Processed copies are written to a `processed/` subfolder — originals are
   left untouched.

## Settings (top of the script)
- `GAMMA = 0.99` — the middle Levels value.
- `JPEG_QUALITY = 12` — re-save quality for JPEGs (0–12).
- `INCLUDE_SUBFOLDERS = true` — recurse into subfolders (skips the `processed/` output folder).
- `FILE_TYPES` — only JPEG files (`.jpg` / `.jpeg`); everything else is ignored.

## Behaviour
- Originals are never overwritten — output goes to a `processed/` subfolder.
- Subfolder structure is mirrored under `processed/` so same-named files in different folders do not collide.
- Non-JPEG files (including `_z` PNGs) are skipped.
- Hidden/system files (e.g. `.DS_Store`) are skipped.
- Failures report a count plus the first error message; top-level errors are shown in an alert instead of failing silently.
