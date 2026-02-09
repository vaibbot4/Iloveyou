# Valentine – Face-verified surprise

Next.js (App Router) + Tailwind + Framer Motion + face-api.js + Supabase (pgvector).

## Quick start

1. **Environment**  
   Copy `.env.local.example` to `.env.local` and set your Supabase URL and anon key.

2. **Models**  
   Run once:
   ```bash
   npm run download-models
   ```
   This fills `public/models/` with face-api.js weights.

3. **Assets**  
   See **ASSETS.md** for what to put in each folder:
   - `public/vishmish/` – photos of Vishmish (face recognition + floating bubbles)
   - `public/valentine/` – `heart-bg.jpg` or `heart-bg.png`
   - `public/proposal/` – `us.jpg` or `us.png`

4. **Supabase**  
   You already created the `vector` extension, `identities` table, and `match_face` function.  
   If the **setup** page fails with “permission denied”, in Supabase go to **Table Editor → identities → Policies** and add:
   - **Insert**: allow `anon` to insert.
   - **Select**: allow `anon` to select.  
   Or temporarily disable RLS for `identities` for this project.

5. **One-time setup**  
   After adding photos to `public/vishmish/`, open:
   ```
   http://localhost:3000/setup
   ```
   Wait until it finishes. This stores face descriptors in `identities`.

6. **Run the app**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Use the camera, capture to verify, then enjoy the flow.

## Routes

- `/` – Landing: webcam + “Capture and verify you’re Vishmish”
- `/setup` – One-time: process `public/vishmish/` images and insert into Supabase
- `/valentine` – Heart experience (2 min) then proposal; “Yes” → popup with confetti + “us” image; close popup → back to landing
