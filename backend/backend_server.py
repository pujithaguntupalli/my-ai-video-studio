import os
import re
import hmac
import time
import json
import uuid
import shutil
import sqlite3
import hashlib
import subprocess
from pathlib import Path
from typing import List, Optional, Literal

from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "studio_data"
IMAGES_DIR = DATA_DIR / "images"
CLIPS_DIR = DATA_DIR / "clips"
AUDIO_DIR = DATA_DIR / "audio"
EXPORTS_DIR = DATA_DIR / "exports"
CHARS_DIR = DATA_DIR / "characters"
DB_PATH = DATA_DIR / "studio.db"

for d in [DATA_DIR, IMAGES_DIR, CLIPS_DIR, AUDIO_DIR, EXPORTS_DIR, CHARS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

OWNER_PIN = os.environ.get("STUDIO_OWNER_PIN", "2026")
SECRET_KEY = os.environ.get("STUDIO_SECRET_KEY", "my-ai-video-studio-private-key-2026").encode()
FAILED_ATTEMPTS = {}

app = FastAPI(title="My AI Video Studio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()
    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            prompt TEXT NOT NULL,
            style TEXT NOT NULL,
            aspect_ratio TEXT NOT NULL,
            resolution TEXT NOT NULL,
            fps INTEGER DEFAULT 24,
            duration_mode TEXT DEFAULT 'auto',
            target_duration INTEGER DEFAULT 6,
            scene_count_mode TEXT DEFAULT 'auto',
            narration_enabled INTEGER DEFAULT 1,
            character_voices_enabled INTEGER DEFAULT 1,
            narrator_voice TEXT DEFAULT 'kokoro_af_bella',
            speaking_speed REAL DEFAULT 1.0,
            bgm_track TEXT DEFAULT 'ambient_cosmos',
            narrator_volume REAL DEFAULT 0.9,
            dialogue_volume REAL DEFAULT 1.0,
            music_volume REAL DEFAULT 0.25,
            subtitles_enabled INTEGER DEFAULT 1,
            status TEXT DEFAULT 'draft',
            progress INTEGER DEFAULT 0,
            export_path TEXT,
            created_at REAL
        );

        CREATE TABLE IF NOT EXISTS scenes (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            scene_index INTEGER NOT NULL,
            duration INTEGER DEFAULT 6,
            visual_prompt TEXT NOT NULL,
            narration TEXT DEFAULT '',
            dialogue TEXT DEFAULT '',
            image_path TEXT,
            clip_path TEXT,
            narrator_audio_path TEXT,
            dialogue_audio_path TEXT,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS characters (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            voice_id TEXT DEFAULT 'kokoro_af_bella',
            reference_image TEXT,
            created_at REAL
        );
        """
    )
    conn.commit()
    conn.close()


init_db()


def sign_token(pin: str) -> str:
    exp = int(time.time()) + 86400 * 7
    payload = f"owner:{exp}".encode()
    sig = hmac.new(SECRET_KEY, payload, hashlib.sha256).hexdigest()
    return f"{exp}.{sig}"


def verify_token(token: str) -> bool:
    try:
        exp_str, sig = token.split(".", 1)
        if int(exp_str) < int(time.time()):
            return False
        expected = hmac.new(SECRET_KEY, f"owner:{exp_str}".encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(sig, expected)
    except Exception:
        return False


def require_owner(
    authorization: Optional[str] = Header(None),
    x_owner_pin: Optional[str] = Header(None),
):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        if verify_token(token):
            return True
    if x_owner_pin and hmac.compare_digest(x_owner_pin, OWNER_PIN):
        return True
    raise HTTPException(status_code=401, detail="Unauthorized owner session")


class AuthRequest(BaseModel):
    pin: str


class ScriptGenerateRequest(BaseModel):
    title: Optional[str] = None
    prompt: str
    style: str = "Realistic Cinematic"
    aspect_ratio: str = "16:9"
    resolution: str = "720p"
    fps: int = 24
    duration_mode: Literal["auto", "manual"] = "auto"
    target_duration: int = Field(default=6, ge=4, le=600)
    scene_count_mode: str = "auto"
    narration_enabled: bool = True
    character_voices_enabled: bool = True
    narrator_voice: str = "kokoro_af_bella"
    speaking_speed: float = 1.0
    bgm_track: str = "ambient_cosmos"
    subtitles_enabled: bool = True


class SceneUpdate(BaseModel):
    visual_prompt: Optional[str] = None
    narration: Optional[str] = None
    dialogue: Optional[str] = None
    duration: Optional[int] = None


def estimate_auto_plan(prompt: str, duration_mode: str, target_duration: int, scene_count_mode: str):
    clean = prompt.strip()
    sentences = [s.strip() for s in re.split(r"[.!?\n]+", clean) if s.strip()]
    words = len(clean.split())

    if scene_count_mode != "auto" and scene_count_mode.isdigit():
        num_scenes = max(1, min(100, int(scene_count_mode)))
        dur = target_duration if duration_mode == "manual" else min(600, num_scenes * 6)
        return dur, num_scenes

    if duration_mode == "manual":
        dur = max(4, min(600, target_duration))
        num_scenes = 1 if dur <= 8 else max(2, min(100, round(dur / 6)))
        return dur, num_scenes

    # Auto mode: single short line -> 1 scene (6s) directly without forced splitting
    if len(sentences) <= 1 and len(clean) <= 140:
        return 6, 1
    elif len(sentences) <= 4 and words <= 80:
        num_scenes = max(2, min(5, len(sentences)))
        return num_scenes * 6, num_scenes
    else:
        est_dur = min(600, max(24, int(words * 0.45)))
        num_scenes = max(4, min(100, round(est_dur / 6)))
        return num_scenes * 6, num_scenes


def generate_scenes_from_prompt(prompt: str, style: str, num_scenes: int, total_duration: int, narration_enabled: bool):
    clean = prompt.strip()
    if num_scenes == 1:
        return [
            {
                "scene_index": 0,
                "duration": total_duration,
                "visual_prompt": f"{clean}, {style} style, cinematic lighting, high detail, smooth camera motion",
                "narration": clean if narration_enabled else "",
                "dialogue": "",
            }
        ]

    per_scene = max(4, min(10, round(total_duration / num_scenes)))
    beats = [
        "Establishing wide shot introducing the setting and atmosphere",
        "Medium tracking shot focusing on the main subject in motion",
        "Dramatic close-up capturing fine visual details and emotion",
        "Dynamic angle shift revealing rising action and depth",
        "Cinematic concluding shot with atmospheric lighting",
    ]
    raw_parts = [p.strip() for p in re.split(r"[.!?\n]+", clean) if p.strip()]
    scenes = []
    for i in range(num_scenes):
        part = raw_parts[i % len(raw_parts)] if raw_parts else clean
        beat = beats[i % len(beats)]
        scenes.append(
            {
                "scene_index": i,
                "duration": per_scene,
                "visual_prompt": f"{part}. {beat}, {style} aesthetic, crisp composition",
                "narration": part if narration_enabled else "",
                "dialogue": "",
            }
        )
    return scenes


def resolution_dimensions(aspect_ratio: str, resolution: str):
    heights = {"480p": 480, "720p": 720, "1080p": 1080}
    h = heights.get(resolution, 720)
    if aspect_ratio == "9:16":
        w = int(h * 9 / 16)
        w, h = h, int(h * 16 / 9)
    elif aspect_ratio == "1:1":
        w = h
    else:
        w = int(h * 16 / 9)
    return (w // 2) * 2, (h // 2) * 2


def render_scene_clip_ffmpeg(scene_row: dict, style: str, aspect_ratio: str, resolution: str, fps: int) -> str:
    w, h = resolution_dimensions(aspect_ratio, resolution)
    dur = max(3, int(scene_row["duration"]))
    out_clip = CLIPS_DIR / f"{scene_row['id']}.mp4"

    palette = {
        "Anime": ("0x1e1b4b", "0xec4899"),
        "Cyberpunk": ("0x090d16", "0x06b6d4"),
        "Fantasy": ("0x14261c", "0xf59e0b"),
        "Realistic Cinematic": ("0x0f172a", "0x38bdf8"),
        "3D Animation": ("0x1e293b", "0x818cf8"),
    }
    c1, _ = palette.get(style, ("0x111827", "0x6366f1"))

    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "lavfi",
        "-i",
        f"color=c={c1}:s={w}x{h}:r={fps}:d={dur}",
        "-vf",
        "geq=r='p(X,Y)+20*sin(2*PI*T/4)':g='p(X,Y)+15*cos(2*PI*T/5)':b='p(X,Y)+30*sin(2*PI*T/3)'",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        str(out_clip),
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        fallback_cmd = [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c={c1}:s={w}x{h}:r={fps}:d={dur}",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(out_clip),
        ]
        subprocess.run(fallback_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return str(out_clip)


async def synthesize_tts_audio(text: str, voice_id: str, speed: float, out_path: Path):
    if not text.strip():
        return None
    voice_map = {
        "kokoro_af_bella": "en-US-AvaNeural",
        "kokoro_am_adam": "en-US-AndrewNeural",
        "edge_en_aria": "en-US-AriaNeural",
        "edge_en_guy": "en-US-GuyNeural",
        "bark_storyteller": "en-GB-SoniaNeural",
    }
    edge_voice = voice_map.get(voice_id, "en-US-AvaNeural")
    rate_pct = int((speed - 1.0) * 100)
    rate_str = f"{rate_pct:+d}%"
    try:
        import edge_tts

        communicate = edge_tts.Communicate(text, edge_voice, rate=rate_str)
        await communicate.save(str(out_path))
        return str(out_path)
    except Exception:
        return None


def assemble_final_mp4(project: dict, scenes: List[dict]) -> str:
    proj_id = project["id"]
    concat_list = DATA_DIR / f"{proj_id}_concat.txt"
    clip_paths = []
    for s in scenes:
        cp = s.get("clip_path")
        if not cp or not Path(cp).exists():
            cp = render_scene_clip_ffmpeg(
                s, project["style"], project["aspect_ratio"], project["resolution"], project["fps"]
            )
        if Path(cp).exists():
            clip_paths.append(cp)

    if not clip_paths:
        raise RuntimeError("No scene clips available to merge")

    with open(concat_list, "w", encoding="utf-8") as f:
        for cp in clip_paths:
            safe = str(Path(cp).resolve()).replace("'", "'\''")
            f.write(f"file '{safe}'\n")

    merged_video = EXPORTS_DIR / f"{proj_id}_video_only.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list), "-c", "copy", str(merged_video)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    total_dur = sum(max(3, int(s["duration"])) for s in scenes)
    bgm_wav = AUDIO_DIR / f"{proj_id}_bgm.wav"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=174:duration={total_dur}",
            "-af",
            f"volume={project.get('music_volume', 0.2)}",
            str(bgm_wav),
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    final_out = EXPORTS_DIR / f"{proj_id}_final.mp4"
    if bgm_wav.exists() and merged_video.exists():
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(merged_video),
                "-i",
                str(bgm_wav),
                "-c:v",
                "copy",
                "-c:a",
                "aac",
                "-shortest",
                str(final_out),
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    elif merged_video.exists():
        shutil.copyfile(merged_video, final_out)

    return str(final_out)


@app.get("/api/health")
def health():
    ffmpeg_ok = shutil.which("ffmpeg") is not None
    return {"status": "ok", "ffmpeg": ffmpeg_ok, "version": "1.0.0"}


@app.post("/api/auth/verify")
def verify_pin(req: AuthRequest):
    now = time.time()
    attempts = [t for t in FAILED_ATTEMPTS.get("owner", []) if now - t < 300]
    if len(attempts) >= 5:
        raise HTTPException(status_code=429, detail="Too many failed PIN attempts. Wait 5 minutes.")
    if not hmac.compare_digest(req.pin.strip(), OWNER_PIN):
        attempts.append(now)
        FAILED_ATTEMPTS["owner"] = attempts
        raise HTTPException(status_code=401, detail="Invalid Owner PIN")
    FAILED_ATTEMPTS["owner"] = []
    return {"token": sign_token(req.pin.strip()), "expires_in": 86400 * 7}


@app.get("/api/projects")
def list_projects(_: bool = Depends(require_owner), db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT * FROM projects ORDER BY created_at DESC").fetchall()
    result = []
    for r in rows:
        p = dict(r)
        sc = db.execute(
            "SELECT * FROM scenes WHERE project_id = ? ORDER BY scene_index ASC", (p["id"],)
        ).fetchall()
        p["scenes"] = [dict(s) for s in sc]
        result.append(p)
    return result


@app.post("/api/scripts/generate")
def create_script_project(
    req: ScriptGenerateRequest,
    _: bool = Depends(require_owner),
    db: sqlite3.Connection = Depends(get_db),
):
    dur, num_scenes = estimate_auto_plan(
        req.prompt, req.duration_mode, req.target_duration, req.scene_count_mode
    )
    proj_id = str(uuid.uuid4())
    title = req.title.strip() if req.title else (req.prompt.strip()[:42] or "Untitled Video")
    now = time.time()

    db.execute(
        """
        INSERT INTO projects (
            id, title, prompt, style, aspect_ratio, resolution, fps,
            duration_mode, target_duration, scene_count_mode,
            narration_enabled, character_voices_enabled, narrator_voice,
            speaking_speed, bgm_track, subtitles_enabled, status, progress, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'script_ready', 15, ?)
        """,
        (
            proj_id,
            title,
            req.prompt,
            req.style,
            req.aspect_ratio,
            req.resolution,
            req.fps,
            req.duration_mode,
            dur,
            req.scene_count_mode,
            int(req.narration_enabled),
            int(req.character_voices_enabled),
            req.narrator_voice,
            req.speaking_speed,
            req.bgm_track,
            int(req.subtitles_enabled),
            now,
        ),
    )

    generated_scenes = generate_scenes_from_prompt(
        req.prompt, req.style, num_scenes, dur, req.narration_enabled
    )
    scene_objs = []
    for s in generated_scenes:
        sid = str(uuid.uuid4())
        db.execute(
            """
            INSERT INTO scenes (id, project_id, scene_index, duration, visual_prompt, narration, dialogue, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ready')
            """,
            (sid, proj_id, s["scene_index"], s["duration"], s["visual_prompt"], s["narration"], s["dialogue"]),
        )
        scene_objs.append({"id": sid, "project_id": proj_id, **s, "status": "ready"})

    db.commit()
    proj = dict(db.execute("SELECT * FROM projects WHERE id = ?", (proj_id,)).fetchone())
    proj["scenes"] = scene_objs
    return proj


@app.patch("/api/scenes/{scene_id}")
def update_scene(
    scene_id: str,
    patch: SceneUpdate,
    _: bool = Depends(require_owner),
    db: sqlite3.Connection = Depends(get_db),
):
    row = db.execute("SELECT * FROM scenes WHERE id = ?", (scene_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Scene not found")
    current = dict(row)
    vp = patch.visual_prompt if patch.visual_prompt is not None else current["visual_prompt"]
    nar = patch.narration if patch.narration is not None else current["narration"]
    dia = patch.dialogue if patch.dialogue is not None else current["dialogue"]
    dur = patch.duration if patch.duration is not None else current["duration"]
    db.execute(
        "UPDATE scenes SET visual_prompt=?, narration=?, dialogue=?, duration=? WHERE id=?",
        (vp, nar, dia, dur, scene_id),
    )
    db.commit()
    return dict(db.execute("SELECT * FROM scenes WHERE id = ?", (scene_id,)).fetchone())


def run_render_job(project_id: str):
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        proj = dict(conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone())
        scenes = [
            dict(r)
            for r in conn.execute(
                "SELECT * FROM scenes WHERE project_id = ? ORDER BY scene_index ASC", (project_id,)
            ).fetchall()
        ]
        conn.execute("UPDATE projects SET status='rendering', progress=20 WHERE id=?", (project_id,))
        conn.commit()

        for idx, s in enumerate(scenes):
            clip_path = render_scene_clip_ffmpeg(
                s, proj["style"], proj["aspect_ratio"], proj["resolution"], proj["fps"]
            )
            pct = 20 + int(((idx + 1) / max(1, len(scenes))) * 60)
            conn.execute(
                "UPDATE scenes SET clip_path=?, status='rendered' WHERE id=?", (clip_path, s["id"])
            )
            conn.execute("UPDATE projects SET progress=? WHERE id=?", (pct, project_id))
            conn.commit()
            s["clip_path"] = clip_path

        final_mp4 = assemble_final_mp4(proj, scenes)
        conn.execute(
            "UPDATE projects SET status='completed', progress=100, export_path=? WHERE id=?",
            (final_mp4, project_id),
        )
        conn.commit()
    except Exception as e:
        conn.execute("UPDATE projects SET status=? WHERE id=?", (f"error: {e}", project_id))
        conn.commit()
    finally:
        conn.close()


@app.post("/api/projects/{project_id}/render")
def start_project_render(
    project_id: str,
    background_tasks: BackgroundTasks,
    _: bool = Depends(require_owner),
    db: sqlite3.Connection = Depends(get_db),
):
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    background_tasks.add_task(run_render_job, project_id)
    return {"status": "rendering", "project_id": project_id}


@app.get("/api/projects/{project_id}/download")
def download_project_video(
    project_id: str,
    _: bool = Depends(require_owner),
    db: sqlite3.Connection = Depends(get_db),
):
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    export_path = row["export_path"]
    if not export_path or not Path(export_path).exists():
        raise HTTPException(status_code=404, detail="Rendered MP4 not ready yet")
    return FileResponse(export_path, media_type="video/mp4", filename=f"{row['title']}.mp4")


@app.get("/api/characters")
def list_characters(_: bool = Depends(require_owner), db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT * FROM characters ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]


@app.post("/api/characters")
async def create_character(
    name: str,
    description: str = "",
    voice_id: str = "kokoro_af_bella",
    image: Optional[UploadFile] = File(None),
    _: bool = Depends(require_owner),
    db: sqlite3.Connection = Depends(get_db),
):
    cid = str(uuid.uuid4())
    img_path = ""
    if image and image.filename:
        ext = Path(image.filename).suffix or ".png"
        dest = CHARS_DIR / f"{cid}{ext}"
        with open(dest, "wb") as f:
            f.write(await image.read())
        img_path = str(dest)
    db.execute(
        "INSERT INTO characters (id, name, description, voice_id, reference_image, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (cid, name, description, voice_id, img_path, time.time()),
    )
    db.commit()
    return dict(db.execute("SELECT * FROM characters WHERE id = ?", (cid,)).fetchone())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend_server:app", host="127.0.0.1", port=8000, reload=True)
