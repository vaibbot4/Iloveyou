# Assets – What to Put Where

Add your files to these folders. The app uses them as follows.

---

## 1. `public/models/` (face recognition)

**You don’t need to add anything here.**

Run this once to download the face-api.js models:

```bash
npm run download-models
```

That will fill `public/models/` with the required weight files. If you prefer to download manually, get the weights from the [face-api.js weights](https://github.com/justadudewhohacks/face-api.js/tree/master/weights) repo and put them in `public/models/`.

---

## 2. `public/vishmish/` (Vishmish photos)

**Put here: all photos of Vishmish** (JPG or PNG).

- Used for **face recognition**: the app extracts face descriptors from these and stores them in the database (when you run the one-time setup).
- Used for **floating bubbles** on the Valentine heart screen.

Any filenames work (e.g. `photo1.jpg`, `WhatsApp Image 2026-02-07.jpeg`). More variety = better recognition and nicer bubbles.

---

## 3. `public/valentine/` (heart background)

**Put here: one or more images** – the full-screen “anatomical interior of a human heart” background.

- The app uses the **first image** in this folder (alphabetically) as the full-screen background.
- Any filename is fine (e.g. `heart-bg.jpg`, `WhatsApp Image 2026-02-08.jpeg`).

Use a high-quality image; it will be shown full-screen behind the floating bubbles and message.

---

## 4. `public/proposal/` (“us” image)

**Put here: one or more images** – the “us” photo(s) shown after she clicks “Yes”.

- The app uses the **first image** in this folder (alphabetically) in the “yuuuhuuu!” popup.
- Any filename is fine (e.g. `us.jpg`, `WhatsApp Image 2026-02-07 (1).jpeg`).

This image is shown in the popup with the “yuuuhuuu!” animation after the confetti.

---

## Summary

| Folder           | What to add                                      | Required? |
|------------------|---------------------------------------------------|-----------|
| `public/models/` | Nothing (run `npm run download-models`)           | Yes       |
| `public/vishmish/` | All Vishmish photos (JPG/PNG, any filenames)   | Yes       |
| `public/valentine/` | One heart background image (any filename)      | Yes       |
| `public/proposal/`  | One “us” image (any filename); first is used  | Yes       |

After adding the assets, run the one-time setup (open `/setup` in the browser), then use the main site.
