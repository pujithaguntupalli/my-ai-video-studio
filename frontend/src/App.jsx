import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Film,
  Sparkles,
  Users,
  FolderKanban,
  Settings,
  Lock,
  Play,
  Pause,
  Download,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Mic,
  MessageSquare,
  Music,
  Subtitles,
  RefreshCw,
  CheckCircle2,
  Wifi,
  WifiOff,
  Sliders,
  Video,
  Wand2,
  ArrowUp,
  ArrowDown,
  Clock,
  Layers
} from 'lucide-react';

const STYLES = [
  'Realistic Cinematic',
  'Anime',
  '3D Animation',
  'Cyberpunk',
  'Fantasy',
  '2D Cartoon',
  'Watercolor',
  'Oil Painting',
  'Educational',
  'Minimalist'
];

const ASPECT_RATIOS = ['16:9', '9:16', '1:1'];
const RESOLUTIONS = ['480p', '720p', '1080p'];
const FPS_OPTIONS = [8, 12, 24, 30];
const DURATION_PRESETS = [
  { label: '6s (1 Clip)', value: 6 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '3m', value: 180 },
  { label: '5m', value: 300 },
  { label: '10m', value: 600 }
];
const SCENE_COUNT_OPTIONS = ['auto', '1', '3', '5', '8', '12'];

const VOICES = [
  { id: 'kokoro_af_bella', name: 'Bella (Warm Female)' },
  { id: 'kokoro_am_adam', name: 'Adam (Deep Male)' },
  { id: 'edge_en_aria', name: 'Aria (Expressive)' },
  { id: 'edge_en_guy', name: 'Guy (Documentary)' },
  { id: 'bark_storyteller', name: 'Sonia (Storyteller)' }
];

const BGM_TRACKS = [
  { id: 'ambient_cosmos', name: 'Ambient Cosmos', freq: 174 },
  { id: 'cinematic_rise', name: 'Cinematic Rise', freq: 220 },
  { id: 'lofi_study', name: 'Lo-Fi Chill', freq: 196 },
  { id: 'fantasy_harp', name: 'Mystic Ether', freq: 261.63 }
];

function estimateAutoPlanClient(prompt, durationMode, targetDuration, sceneCountMode) {
  const clean = (prompt || '').trim();
  const sentences = clean.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
  const words = clean ? clean.split(/\s+/).length : 0;

  if (sceneCountMode !== 'auto') {
    const count = Math.max(1, parseInt(sceneCountMode, 10) || 1);
    const dur = durationMode === 'manual' ? targetDuration : Math.min(600, count * 6);
    return { duration: dur, scenes: count };
  }

  if (durationMode === 'manual') {
    const dur = Math.max(4, Math.min(600, targetDuration));
    const scenes = dur <= 8 ? 1 : Math.max(2, Math.min(100, Math.round(dur / 6)));
    return { duration: dur, scenes };
  }

  if (sentences.length <= 1 && clean.length <= 140) {
    return { duration: 6, scenes: 1 };
  } else if (sentences.length <= 4 && words <= 80) {
    const count = Math.max(2, Math.min(5, sentences.length));
    return { duration: count * 6, scenes: count };
  } else {
    const est = Math.min(600, Math.max(24, Math.round(words * 0.45)));
    const count = Math.max(4, Math.min(100, Math.round(est / 6)));
    return { duration: count * 6, scenes: count };
  }
}

function drawSceneVisualFrame(ctx, width, height, scene, style, progress, sceneIdx) {
  ctx.save();
  const t = progress * Math.PI * 2;
  const zoom = 1 + progress * 0.08;
  const panX = (progress - 0.5) * 28;

  ctx.translate(width / 2 + panX, height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-width / 2, -height / 2);

  // Style-aware sky & atmosphere gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  if (style === 'Anime') {
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.55, '#9d174d');
    grad.addColorStop(1, '#f97316');
  } else if (style === 'Cyberpunk') {
    grad.addColorStop(0, '#050814');
    grad.addColorStop(0.6, '#0f172a');
    grad.addColorStop(1, '#0891b2');
  } else if (style === 'Fantasy') {
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(0.5, '#1e3a8a');
    grad.addColorStop(1, '#d97706');
  } else if (style === 'Watercolor' || style === 'Oil Painting') {
    grad.addColorStop(0, '#312e81');
    grad.addColorStop(0.5, '#be185d');
    grad.addColorStop(1, '#fde047');
  } else if (style === 'Educational' || style === 'Minimalist') {
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
  } else {
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.55, '#1e293b');
    grad.addColorStop(1, '#0284c7');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(-40, -40, width + 80, height + 80);

  // Sun / Moon / Volumetric Orb
  const orbX = width * (0.25 + ((sceneIdx * 0.23) % 0.5)) + Math.sin(t * 0.5) * 18;
  const orbY = height * 0.34 + Math.cos(t * 0.5) * 10;
  const orbRadius = Math.min(width, height) * (style === 'Anime' ? 0.16 : 0.12);
  const orbGrad = ctx.createRadialGradient(orbX, orbY, 4, orbX, orbY, orbRadius * 2.2);
  orbGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
  orbGrad.addColorStop(0.35, style === 'Cyberpunk' ? 'rgba(34,211,238,0.55)' : 'rgba(251,191,36,0.55)');
  orbGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(orbX, orbY, orbRadius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Style-specific architectural / landscape layers
  if (style === 'Cyberpunk') {
    // Neon perspective grid
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.28)';
    ctx.lineWidth = 1.5;
    const horizon = height * 0.64;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(width / 2 + i * 24, horizon);
      ctx.lineTo(width / 2 + i * 110, height);
      ctx.stroke();
    }
    for (let r = 0; r < 6; r++) {
      const y = horizon + Math.pow((r + (progress * 2) % 1) / 6, 1.7) * (height - horizon);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    // Skyline towers
    ctx.fillStyle = '#030712';
    for (let b = 0; b < 14; b++) {
      const bw = width / 13;
      const bh = height * (0.18 + ((b * 37 + sceneIdx * 19) % 32) / 100);
      const bx = b * bw - 10;
      ctx.fillRect(bx, horizon - bh, bw - 6, bh);
      ctx.fillStyle = b % 2 === 0 ? 'rgba(236,72,153,0.65)' : 'rgba(34,211,238,0.65)';
      ctx.fillRect(bx + 8, horizon - bh + 12, 4, bh - 20);
      ctx.fillStyle = '#030712';
    }
  } else if (style === 'Educational' || style === 'Minimalist') {
    // Animated wave & geometric telemetry
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 12) {
      const y = height * 0.55 + Math.sin(x * 0.015 + t * 2) * 42;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else {
    // Layered mountain / horizon silhouettes
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width + 40; x += 40) {
      const peak = height * 0.62 - Math.abs(Math.sin(x * 0.006 + sceneIdx)) * height * 0.22;
      ctx.lineTo(x, peak);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(9, 13, 22, 0.88)';
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width + 40; x += 30) {
      const ridge = height * 0.74 - Math.abs(Math.cos(x * 0.009 + sceneIdx * 1.4)) * height * 0.14;
      ctx.lineTo(x, ridge);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  }

  // Animated particles (petals, embers, rain, or dust motes)
  const particleCount = 26;
  for (let p = 0; p < particleCount; p++) {
    const px = ((p * 97 + progress * (style === 'Cyberpunk' ? 90 : 180)) % (width + 40)) - 20;
    const py = ((p * 61 + progress * (style === 'Cyberpunk' ? 380 : 120)) % (height + 40)) - 20;
    if (style === 'Anime') {
      ctx.fillStyle = 'rgba(251, 207, 232, 0.75)';
      ctx.beginPath();
      ctx.ellipse(px, py, 5, 2.5, t + p, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'Cyberpunk') {
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 3, py + 14);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(253, 224, 71, 0.55)';
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  // Scene & Visual Prompt HUD Banner
  ctx.fillStyle = 'rgba(9, 13, 22, 0.52)';
  ctx.fillRect(18, 16, Math.min(width - 36, 460), 34);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 13px Inter, system-ui, sans-serif';
  const label = `SCENE ${sceneIdx + 1} • ${style.toUpperCase()}`;
  ctx.fillText(label, 30, 38);
}

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [authToken, setAuthToken] = useState('');

  const [apiUrl, setApiUrl] = useState('http://127.0.0.1:8000');
  const [backendConnected, setBackendConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  // Video Generation Controls
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Realistic Cinematic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('720p');
  const [fps, setFps] = useState(24);
  const [durationMode, setDurationMode] = useState('auto');
  const [targetDuration, setTargetDuration] = useState(6);
  const [sceneCountMode, setSceneCountMode] = useState('auto');

  // Optional Voice & Audio Controls
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [characterVoicesEnabled, setCharacterVoicesEnabled] = useState(true);
  const [narratorVoice, setNarratorVoice] = useState('kokoro_af_bella');
  const [speakingSpeed, setSpeakingSpeed] = useState(1.0);
  const [bgmTrack, setBgmTrack] = useState('ambient_cosmos');
  const [narratorVol, setNarratorVol] = useState(0.9);
  const [dialogueVol, setDialogueVol] = useState(1.0);
  const [musicVol, setMusicVol] = useState(0.25);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);

  // Projects & Characters State
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [characters, setCharacters] = useState([
    {
      id: 'char-1',
      name: 'Kael',
      description: 'Cyberpunk courier with glowing visor and dark coat',
      voice_id: 'kokoro_am_adam'
    }
  ]);
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [newCharVoice, setNewCharVoice] = useState('kokoro_af_bella');

  // Playback & Rendering State
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewSceneIdx, setPreviewSceneIdx] = useState(0);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState(null);
  const [renderedFileExt, setRenderedFileExt] = useState('webm');

  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);

  const activeProject = useMemo(
    () => projects.find(p => p.id === activeProjectId) || projects[0] || null,
    [projects, activeProjectId]
  );

  const autoEstimate = useMemo(
    () => estimateAutoPlanClient(prompt, durationMode, targetDuration, sceneCountMode),
    [prompt, durationMode, targetDuration, sceneCountMode]
  );

  // Check backend health silently
  useEffect(() => {
    let cancelled = false;
    const checkServer = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/health`, { signal: AbortSignal.timeout(1500) });
        if (!cancelled && res.ok) {
          setBackendConnected(true);
          return;
        }
      } catch (_) {}
      if (!cancelled) setBackendConnected(false);
    };
    checkServer();
    const timer = setInterval(checkServer, 8000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [apiUrl]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setPinError('');
    const cleanPin = pinInput.trim();
    if (backendConnected) {
      try {
        const res = await fetch(`${apiUrl}/api/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: cleanPin })
        });
        if (!res.ok) {
          setPinError('Invalid Owner PIN (Default: 2026)');
          return;
        }
        const data = await res.json();
        setAuthToken(data.token);
        setIsUnlocked(true);
        return;
      } catch (_) {}
    }
    if (cleanPin === '2026' || cleanPin.length >= 4) {
      setIsUnlocked(true);
    } else {
      setPinError('Enter your 4-digit Owner PIN (Default: 2026)');
    }
  };

  // Live animated canvas loop for preview
  useEffect(() => {
    if (!activeProject || !activeProject.scenes?.length) return;
    let animId;
    let lastTime = performance.now();

    const tick = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const scenes = activeProject.scenes;
      const safeIdx = Math.min(previewSceneIdx, scenes.length - 1);
      const currentScene = scenes[safeIdx];

      if (isPlayingPreview) {
        const dur = Math.max(3, currentScene?.duration || 6);
        setPreviewProgress(prev => {
          const next = prev + dt / dur;
          if (next >= 1) {
            if (safeIdx + 1 < scenes.length) {
              setPreviewSceneIdx(safeIdx + 1);
              return 0;
            } else {
              setIsPlayingPreview(false);
              return 0;
            }
          }
          return next;
        });
      }

      const canvas = canvasRef.current;
      if (canvas && currentScene) {
        const ctx = canvas.getContext('2d');
        drawSceneVisualFrame(
          ctx,
          canvas.width,
          canvas.height,
          currentScene,
          activeProject.style || style,
          previewProgress,
          safeIdx
        );

        if (activeProject.subtitles_enabled && (currentScene.narration || currentScene.dialogue)) {
          const caption = currentScene.dialogue || currentScene.narration;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
          ctx.fillRect(40, canvas.height - 64, canvas.width - 80, 44);
          ctx.fillStyle = '#ffffff';
          ctx.font = '500 15px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(caption.slice(0, 88), canvas.width / 2, canvas.height - 36);
          ctx.textAlign = 'left';
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [activeProject, isPlayingPreview, previewSceneIdx, previewProgress, style]);

  // Browser Web Speech Narration when playing preview
  useEffect(() => {
    if (!isPlayingPreview || !activeProject || !activeProject.narration_enabled) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return;
    }
    const scene = activeProject.scenes?.[previewSceneIdx];
    const line = scene?.narration || (activeProject.character_voices_enabled ? scene?.dialogue : '');
    if (line && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(line);
      utter.rate = activeProject.speaking_speed || 1.0;
      utter.volume = activeProject.narrator_volume ?? 0.9;
      window.speechSynthesis.speak(utter);
    }
  }, [isPlayingPreview, previewSceneIdx, activeProject]);

  const handleGenerateScript = async () => {
    if (!prompt.trim()) return;
    setIsGeneratingScript(true);
    setRenderedBlobUrl(null);

    try {
      if (backendConnected) {
        const res = await fetch(`${apiUrl}/api/scripts/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            title: title.trim() || null,
            prompt,
            style,
            aspect_ratio: aspectRatio,
            resolution,
            fps,
            duration_mode: durationMode,
            target_duration: targetDuration,
            scene_count_mode: sceneCountMode,
            narration_enabled: narrationEnabled,
            character_voices_enabled: characterVoicesEnabled,
            narrator_voice: narratorVoice,
            speaking_speed: speakingSpeed,
            bgm_track: bgmTrack,
            subtitles_enabled: subtitlesEnabled
          })
        });
        if (res.ok) {
          const created = await res.json();
          setProjects(prev => [created, ...prev]);
          setActiveProjectId(created.id);
          setPreviewSceneIdx(0);
          setPreviewProgress(0);
          setIsPlayingPreview(true);
          setIsGeneratingScript(false);
          return;
        }
      }

      // Standalone In-Browser Generation
      const plan = estimateAutoPlanClient(prompt, durationMode, targetDuration, sceneCountMode);
      const clean = prompt.trim();
      const parts = clean.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
      const perScene = Math.max(4, Math.min(10, Math.round(plan.duration / plan.scenes)));

      const generatedScenes = Array.from({ length: plan.scenes }, (_, idx) => {
        const seg = plan.scenes === 1 ? clean : parts[idx % Math.max(1, parts.length)] || clean;
        return {
          id: `scene-${Date.now()}-${idx}`,
          scene_index: idx,
          duration: perScene,
          visual_prompt:
            plan.scenes === 1
              ? `${clean}, ${style} style, cinematic lighting`
              : `${seg} — Shot ${idx + 1} (${style})`,
          narration: narrationEnabled ? seg : '',
          dialogue: ''
        };
      });

      const newProj = {
        id: `proj-${Date.now()}`,
        title: title.trim() || clean.slice(0, 42),
        prompt: clean,
        style,
        aspect_ratio: aspectRatio,
        resolution,
        fps,
        duration_mode: durationMode,
        target_duration: plan.duration,
        scene_count_mode: sceneCountMode,
        narration_enabled: narrationEnabled,
        character_voices_enabled: characterVoicesEnabled,
        narrator_voice: narratorVoice,
        speaking_speed: speakingSpeed,
        bgm_track: bgmTrack,
        narrator_volume: narratorVol,
        dialogue_volume: dialogueVol,
        music_volume: musicVol,
        subtitles_enabled: subtitlesEnabled,
        status: 'script_ready',
        scenes: generatedScenes
      };

      setProjects(prev => [newProj, ...prev]);
      setActiveProjectId(newProj.id);
      setPreviewSceneIdx(0);
      setPreviewProgress(0);
      setIsPlayingPreview(true);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const updateSceneField = (sceneId, field, value) => {
    setProjects(prev =>
      prev.map(p =>
        p.id !== activeProject?.id
          ? p
          : {
              ...p,
              scenes: p.scenes.map(s => (s.id === sceneId ? { ...s, [field]: value } : s))
            }
      )
    );
  };

  const moveScene = (index, direction) => {
    if (!activeProject) return;
    const nextIdx = index + direction;
    if (nextIdx < 0 || nextIdx >= activeProject.scenes.length) return;
    const copy = [...activeProject.scenes];
    const [item] = copy.splice(index, 1);
    copy.splice(nextIdx, 0, item);
    setProjects(prev =>
      prev.map(p => (p.id === activeProject.id ? { ...p, scenes: copy } : p))
    );
  };

  const deleteScene = (sceneId) => {
    if (!activeProject || activeProject.scenes.length <= 1) return;
    setProjects(prev =>
      prev.map(p =>
        p.id === activeProject.id
          ? { ...p, scenes: p.scenes.filter(s => s.id !== sceneId) }
          : p
      )
    );
    setPreviewSceneIdx(0);
  };

  const addBlankScene = () => {
    if (!activeProject) return;
    const newScene = {
      id: `scene-${Date.now()}`,
      scene_index: activeProject.scenes.length,
      duration: 6,
      visual_prompt: `${activeProject.prompt} — New Scene (${activeProject.style})`,
      narration: activeProject.narration_enabled ? 'Continuing the story...' : '',
      dialogue: ''
    };
    setProjects(prev =>
      prev.map(p =>
        p.id === activeProject.id ? { ...p, scenes: [...p.scenes, newScene] } : p
      )
    );
  };

  const regenerateSingleScene = (sceneId) => {
    if (!activeProject) return;
    setProjects(prev =>
      prev.map(p =>
        p.id !== activeProject.id
          ? p
          : {
              ...p,
              scenes: p.scenes.map(s =>
                s.id === sceneId
                  ? { ...s, visual_prompt: `${s.visual_prompt} [Refined lighting & camera angle]` }
                  : s
              )
            }
      )
    );
  };

  // Render full playable video blob directly in browser (or via FastAPI when online)
  const handleRenderFullVideo = async () => {
    if (!activeProject) return;
    setIsRendering(true);
    setRenderProgress(5);
    setIsPlayingPreview(false);

    if (backendConnected) {
      try {
        await fetch(`${apiUrl}/api/projects/${activeProject.id}/render`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` }
        });
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const listRes = await fetch(`${apiUrl}/api/projects`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          if (listRes.ok) {
            const updatedList = await listRes.json();
            const found = updatedList.find(p => p.id === activeProject.id);
            if (found) {
              setRenderProgress(found.progress || 50);
              if (found.status === 'completed') {
                setRenderedBlobUrl(`${apiUrl}/api/projects/${activeProject.id}/download`);
                setRenderedFileExt('mp4');
                setIsRendering(false);
                return;
              }
            }
          }
        }
      } catch (_) {}
    }

    // Zero-Backend Browser MediaRecorder Rendering Engine
    try {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = activeProject.aspect_ratio === '9:16' ? 540 : activeProject.aspect_ratio === '1:1' ? 720 : 960;
      offCanvas.height = activeProject.aspect_ratio === '9:16' ? 960 : activeProject.aspect_ratio === '1:1' ? 720 : 540;
      const ctx = offCanvas.getContext('2d');

      const stream = offCanvas.captureStream(activeProject.fps || 24);

      // Add subtle Web Audio ambient score to stream
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioCtxRef.current = audioCtx;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const trackObj = BGM_TRACKS.find(t => t.id === activeProject.bgm_track) || BGM_TRACKS[0];
        osc.type = 'sine';
        osc.frequency.value = trackObj.freq;
        gain.gain.value = (activeProject.music_volume ?? 0.25) * 0.12;
        const dest = audioCtx.createMediaStreamDestination();
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        dest.stream.getAudioTracks().forEach(track => stream.addTrack(track));
      } catch (_) {}

      const mimeType = MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const recordingDone = new Promise(resolve => {
        recorder.onstop = () => resolve();
      });

      recorder.start();

      const scenes = activeProject.scenes;
      const renderFps = Math.min(24, activeProject.fps || 24);
      const frameIntervalMs = 1000 / renderFps;

      for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
        const sc = scenes[sIdx];
        const previewSec = Math.min(4, Math.max(2, sc.duration || 4));
        const totalFrames = Math.round(previewSec * renderFps);

        for (let f = 0; f < totalFrames; f++) {
          const prog = f / Math.max(1, totalFrames - 1);
          drawSceneVisualFrame(ctx, offCanvas.width, offCanvas.height, sc, activeProject.style, prog, sIdx);

          if (activeProject.subtitles_enabled && (sc.narration || sc.dialogue)) {
            const cap = sc.dialogue || sc.narration;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
            ctx.fillRect(36, offCanvas.height - 64, offCanvas.width - 72, 42);
            ctx.fillStyle = '#ffffff';
            ctx.font = '500 16px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(cap.slice(0, 84), offCanvas.width / 2, offCanvas.height - 37);
            ctx.textAlign = 'left';
          }

          const overall = Math.round(((sIdx + prog) / scenes.length) * 95);
          setRenderProgress(overall);
          await new Promise(r => setTimeout(r, frameIntervalMs));
        }
      }

      recorder.stop();
      await recordingDone;
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRenderedBlobUrl(url);
      setRenderedFileExt(mimeType.includes('mp4') ? 'mp4' : 'webm');
      setRenderProgress(100);
    } finally {
      setIsRendering(false);
    }
  };

  const handleAddCharacter = (e) => {
    e.preventDefault();
    if (!newCharName.trim()) return;
    setCharacters(prev => [
      {
        id: `char-${Date.now()}`,
        name: newCharName.trim(),
        description: newCharDesc.trim(),
        voice_id: newCharVoice
      },
      ...prev
    ]);
    setNewCharName('');
    setNewCharDesc('');
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <form
          onSubmit={handleUnlock}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">My AI Video Studio</h1>
              <p className="text-xs text-slate-400">Private Single-Owner Workspace</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Owner Access PIN</label>
            <input
              type="password"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="Enter PIN (Default: 2026)"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-center tracking-widest text-lg"
            />
            {pinError && <p className="text-xs text-rose-400">{pinError}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold transition"
          >
            Unlock Private Studio
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <Film className="w-6 h-6 text-indigo-400" />
            <span className="font-bold text-base tracking-tight">My AI Video Studio</span>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'create', label: 'Create Video', icon: Sparkles },
              { id: 'characters', label: 'Characters', icon: Users },
              { id: 'projects', label: 'My Projects', icon: FolderKanban },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              backendConnected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}
          >
            {backendConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{backendConnected ? 'FastAPI Connected' : 'Browser Studio Mode'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {activeTab === 'create' && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Prompt & Controls */}
            <div className="lg:col-span-5 space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-indigo-400" />
                  Prompt & Generation Settings
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Single-line prompts auto-generate 1 focused clip; longer stories expand automatically.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Project Title (optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                />

                <textarea
                  rows={4}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe your video scene or full story (e.g., A lone samurai standing under glowing cherry blossoms in a cyberpunk rainstorm)..."
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Style Grid */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Visual Style</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STYLES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStyle(s)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition ${
                        style === s
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Mode (Auto vs Manual) & Scene Count */}
              <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Duration Mode
                  </span>
                  <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                    {['auto', 'manual'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDurationMode(m)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition ${
                          durationMode === m ? 'bg-indigo-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {durationMode === 'auto' ? (
                  <div className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
                    Smart Estimate: <strong>{autoEstimate.scenes} Scene{autoEstimate.scenes > 1 ? 's' : ''}</strong> •{' '}
                    <strong>{autoEstimate.duration}s</strong> total
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {DURATION_PRESETS.map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setTargetDuration(d.value)}
                        className={`py-1.5 rounded-lg text-xs font-medium border ${
                          targetDuration === d.value
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    Scene Count
                  </span>
                  <div className="flex gap-1">
                    {SCENE_COUNT_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSceneCountMode(opt)}
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          sceneCountMode === opt
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {opt === 'auto' ? 'Auto' : opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Aspect Ratio, Resolution & FPS */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={e => setAspectRatio(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                  >
                    {ASPECT_RATIOS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Resolution</label>
                  <select
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                  >
                    {RESOLUTIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Frame Rate</label>
                  <select
                    value={fps}
                    onChange={e => setFps(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                  >
                    {FPS_OPTIONS.map(f => (
                      <option key={f} value={f}>{f} FPS</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Independent Optional Audio Toggles */}
              <div className="space-y-2.5 bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Optional Voice & Audio Stems
                </div>

                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Mic className="w-3.5 h-3.5 text-indigo-400" />
                    AI Narration Voiceover
                  </span>
                  <input
                    type="checkbox"
                    checked={narrationEnabled}
                    onChange={e => setNarrationEnabled(e.target.checked)}
                    className="accent-indigo-600 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="flex items-center gap-2 text-slate-300">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    Character Dialogue Voices
                  </span>
                  <input
                    type="checkbox"
                    checked={characterVoicesEnabled}
                    onChange={e => setCharacterVoicesEnabled(e.target.checked)}
                    className="accent-indigo-600 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Subtitles className="w-3.5 h-3.5 text-amber-400" />
                    Synchronized Subtitles
                  </span>
                  <input
                    type="checkbox"
                    checked={subtitlesEnabled}
                    onChange={e => setSubtitlesEnabled(e.target.checked)}
                    className="accent-indigo-600 w-4 h-4"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <select
                    value={narratorVoice}
                    onChange={e => setNarratorVoice(e.target.value)}
                    disabled={!narrationEnabled}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs disabled:opacity-40"
                  >
                    {VOICES.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>

                  <select
                    value={bgmTrack}
                    onChange={e => setBgmTrack(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    {BGM_TRACKS.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateScript}
                disabled={isGeneratingScript || !prompt.trim()}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-semibold text-sm flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingScript ? 'Generating Scenes...' : 'Generate Script & Visuals'}
              </button>
            </div>

            {/* Right Column: Live Visual Preview & Scene Storyboard */}
            <div className="lg:col-span-7 space-y-5">
              {/* Video Preview Player */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Video className="w-4 h-4 text-indigo-400" />
                    {activeProject ? activeProject.title : 'Live Visual Preview'}
                  </h3>
                  {activeProject && (
                    <span className="text-xs text-slate-400">
                      {activeProject.scenes.length} Scene{activeProject.scenes.length > 1 ? 's' : ''} •{' '}
                      {activeProject.aspect_ratio} • {activeProject.fps} FPS
                    </span>
                  )}
                </div>

                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                  {renderedBlobUrl ? (
                    <video
                      src={renderedBlobUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : activeProject ? (
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={450}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-8 space-y-2">
                      <Film className="w-10 h-10 text-slate-700 mx-auto" />
                      <p className="text-sm text-slate-400">
                        Enter a prompt on the left and click <strong>Generate Script & Visuals</strong>
                      </p>
                    </div>
                  )}
                </div>

                {activeProject && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRenderedBlobUrl(null);
                          setIsPlayingPreview(p => !p);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5"
                      >
                        {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {isPlayingPreview ? 'Pause Preview' : 'Play Animated Preview'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRenderFullVideo}
                        disabled={isRendering}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Film className="w-3.5 h-3.5" />
                        {isRendering ? `Rendering (${renderProgress}%)...` : 'Combine & Render Video'}
                      </button>

                      {renderedBlobUrl && (
                        <a
                          href={renderedBlobUrl}
                          download={`${activeProject.title || 'ai-video'}.${renderedFileExt}`}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Video
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Scene Timeline Editor */}
              {activeProject && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm">Scene Storyboard Editor</h3>
                    <button
                      type="button"
                      onClick={addBlankScene}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Scene
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activeProject.scenes.map((scene, idx) => (
                      <div
                        key={scene.id}
                        onClick={() => {
                          setRenderedBlobUrl(null);
                          setPreviewSceneIdx(idx);
                          setPreviewProgress(0.25);
                        }}
                        className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2.5 ${
                          previewSceneIdx === idx
                            ? 'bg-slate-950 border-indigo-500/60'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400">
                            Scene {idx + 1} ({scene.duration}s)
                          </span>
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => regenerateSingleScene(scene.id)}
                              title="Refine Scene"
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-400"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveScene(idx, -1)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveScene(idx, 1)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteScene(scene.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={scene.visual_prompt}
                          onChange={e => updateSceneField(scene.id, 'visual_prompt', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          placeholder="Visual description..."
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                        />

                        {activeProject.narration_enabled && (
                          <input
                            type="text"
                            value={scene.narration}
                            onChange={e => updateSceneField(scene.id, 'narration', e.target.value)}
                            onClick={e => e.stopPropagation()}
                            placeholder="Narrator voiceover line..."
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                          />
                        )}

                        {activeProject.character_voices_enabled && (
                          <input
                            type="text"
                            value={scene.dialogue}
                            onChange={e => updateSceneField(scene.id, 'dialogue', e.target.value)}
                            onClick={e => e.stopPropagation()}
                            placeholder='Character dialogue (e.g., Kael: "We move at dawn.")'
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-300"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <form
              onSubmit={handleAddCharacter}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
            >
              <h2 className="font-bold text-base">Add Consistent Character</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newCharName}
                  onChange={e => setNewCharName(e.target.value)}
                  placeholder="Character Name (e.g., Aria)"
                  className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
                />
                <select
                  value={newCharVoice}
                  onChange={e => setNewCharVoice(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
                >
                  {VOICES.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={newCharDesc}
                onChange={e => setNewCharDesc(e.target.value)}
                placeholder="Visual appearance traits for consistency across scenes..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold"
              >
                Save Character
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {characters.map(c => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <div className="font-bold text-sm text-indigo-300">{c.name}</div>
                  <p className="text-xs text-slate-400">{c.description || 'No visual notes'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="font-bold text-lg">Saved Video Projects</h2>
            {projects.length === 0 ? (
              <p className="text-sm text-slate-400">No projects generated yet.</p>
            ) : (
              projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    setActiveProjectId(p.id);
                    setActiveTab('create');
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl p-4 flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-sm">{p.title}</div>
                    <div className="text-xs text-slate-400">
                      {p.style} • {p.scenes.length} scene(s) • {p.resolution}
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-base">Studio & Backend Connection Settings</h2>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Local FastAPI Backend URL (Optional)</label>
              <input
                type="text"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm"
              />
            </div>
            <p className="text-xs text-slate-400">
              Works standalone in any browser or on Vercel using the built-in HTML5 Canvas + MediaRecorder engine, and automatically upgrades to local GPU/FFmpeg rendering whenever your Python backend is running.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
