# My AI Video Studio

## Option A: Deploy Frontend Directly to Vercel (Zero Backend Needed)
1. Upload the `frontend/` folder to a GitHub repository (or set Root Directory to `frontend` in Vercel).
2. Vercel will automatically run `npm run build` (`vite build`) and deploy your studio.
3. Log in with the default Owner PIN **`2026`**. The built-in HTML5 Canvas + MediaRecorder engine generates animated visual scenes and downloadable videos directly in the browser.

## Option B: Run Full-Stack Locally (With Python + FFmpeg)
- **Windows:** Double-click `start_studio.bat`
- **macOS / Linux:** Run `chmod +x start_studio.sh && ./start_studio.sh`
