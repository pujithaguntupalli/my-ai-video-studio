import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Sparkles,
  Play,
  Pause,
  Download,
  Settings,
  Users,
  FolderOpen,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  Key,
  Cpu,
  Wand2,
  Clock,
  Layers,
  Image as ImageIcon,
  Video as VideoIcon,
  Maximize2,
  Music,
  Mic,
  Subtitles,
  Gauge
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

const DURATIONS = [
  { label: '6s (1 Clip)', seconds: 6 },
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 }
];

const SCENE_COUNTS = ['Auto', 1, 3, 5, 8, 12];

const ASPECT_RATIOS = [
  { label: '16:9 Landscape (YouTube)', value: '16:9', width: 960, height: 540 },
  { label: '9:16 Vertical (Reels/Shorts)', value: '9:16', width: 540, height: 960 },
  { label: '1:1 Square (Instagram)', value: '1:1', width: 720, height: 720 },
  { label: '4:3 Classic Cinema', value: '4:3', width: 800, height: 600 }
];

const FRAME_RATE_PRESETS = [
  {
    fps: 8,
    label: '8 FPS',
    badge: 'Anime / 3x Faster',
    description: 'Stylized hand-drawn anime feel. Generates 3x fewer frames for fast rendering and low GPU/memory load.'
  },
  {
    fps: 12,
    label: '12 FPS',
    badge: 'Stop-Motion / 2D',
    description: 'Classic 2D animation & stop-motion cadence with crisp, expressive movement.'
  },
  {
    fps: 16,
    label: '16 FPS',
    badge: 'Wan2.1 / CogVideoX Native',
    description: 'Native output rate for Wan 2.1 & CogVideoX open-source AI video models.'
  },
  {
    fps: 24,
    label: '24 FPS',
    badge: 'Cinematic Film',
    description: 'Standard cinema film rate. Delivers natural motion and a movie-like look for storytelling.'
  },
  {
    fps: 30,
    label: '30 FPS',
    badge: 'Smooth YouTube / Reels',
    description: 'Smooth, crisp motion ideal for YouTube, 9:16 social media, and educational videos.'
  },
  {
    fps: 60,
    label: '60 FPS',
    badge: 'Ultra-Fluid',
    description: 'Maximum smoothness for fast camera pans and high-frame-rate playback.'
  }
];

const RESOLUTIONS = [
  { label: '720p HD', scale: 0.75 },
  { label: '1080p Full HD', scale: 1.0 },
  { label: '4K Ultra HD', scale: 1.5 }
];

const CAMERA_MOTIONS = [
  'Auto / Dynamic',
  'Slow Zoom In',
  'Slow Zoom Out',
  'Pan Left to Right',
  'Pan Right to Left',
  'Static Tripod'
];

const TRANSITIONS = ['Crossfade', 'Smooth Cut', 'Dip to Black', 'Slide Left'];

const COLOR_FILTERS = [
  { label: 'Natural', css: 'none' },
  { label: 'Warm Golden', css: 'sepia(0.22) saturate(1.25) brightness(1.04)' },
  { label: 'Cool Teal', css: 'hue-rotate(15deg) saturate(1.15) contrast(1.06)' },
  { label: 'Vintage Film', css: 'sepia(0.35) contrast(1.12) brightness(0.95)' },
  { label: 'Noir B&W', css: 'grayscale(1) contrast(1.25)' }
];

const SUBTITLE_STYLES = [
  { id: 'cinematic-box', label: 'Cinematic Box' },
  { id: 'yellow-classic', label: 'Classic Yellow' },
  { id: 'neon-glow', label: 'Neon Pop' },
  { id: 'minimal-shadow', label: 'Minimal Shadow' }
];

const SUBTITLE_POSITIONS = [
  { id: 'bottom', label: 'Bottom' },
  { id: 'center', label: 'Center' },
  { id: 'top', label: 'Top' }
];

const AMBIENT_TRACKS = [
  { id: 'none', label: 'No Background Music' },
  { id: 'spring-breeze', label: 'Gentle Spring Breeze (Ambient Synth)' },
  { id: 'cinematic-pad', label: 'Cinematic Emotional Pad' },
  { id: 'lofi-calm', label: 'Calm Lo-Fi Piano Chords' }
];

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(() => localStorage.getItem('studio_unlocked') === 'true');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [ownerPin, setOwnerPin] = useState(() => localStorage.getItem('studio_pin') || '2026');

  const [activeTab, setActiveTab] = useState('create');
  const [projectTitle, setProjectTitle] = useState('');
  const [prompt, setPrompt] = useState(
    'a girl is walking in a park full of cherry blossom trees. the flowers are falling due to fine breeze'
  );
  const [selectedStyle, setSelectedStyle] = useState('Anime');
  const [durationMode, setDurationMode] = useState('Manual');
  const [selectedDuration, setSelectedDuration] = useState(6);
  const [sceneCountMode, setSceneCountMode] = useState('Auto');

  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [fps, setFps] = useState(24);
  const [resolution, setResolution] = useState('1080p Full HD');
  const [cameraMotion, setCameraMotion] = useState('Auto / Dynamic');
  const [transitionType, setTransitionType] = useState('Crossfade');
  const [colorFilter, setColorFilter] = useState('Natural');
  const [letterboxBars, setLetterboxBars] = useState(false);

  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [subtitleStyle, setSubtitleStyle] = useState('cinematic-box');
  const [subtitlePosition, setSubtitlePosition] = useState('bottom');
  const [subtitleSize, setSubtitleSize] = useState(22);

  const [voiceoverEnabled, setVoiceoverEnabled] = useState(false);
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [ambientMusic, setAmbientMusic] = useState('spring-breeze');

  const [engineMode, setEngineMode] = useState(() => localStorage.getItem('studio_engine_mode') || 'built-in');
  const [pollinationsKey, setPollinationsKey] = useState(() => localStorage.getItem('studio_polli_key') || '');
  const [pollinationsModel, setPollinationsModel] = useState(() => localStorage.getItem('studio_polli_model') || 'flux');
  const [falApiKey, setFalApiKey] = useState(() => localStorage.getItem('studio_fal_key') || '');
  const [falModel, setFalModel] = useState(() => localStorage.getItem('studio_fal_model') || 'fal-ai/wan-t2v');

  const [characters, setCharacters] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem('studio_characters')) || [
          { id: 1, name: 'Aoi', description: 'young anime girl with dark hair, pastel spring coat, gentle smile' }
        ]
      );
    } catch {
      return [];
    }
  });
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');

  const [savedProjects, setSavedProjects] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studio_projects')) || [];
    } catch {
      return [];
    }
  });

  const [scenes, setScenes] = useState([]);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState(null);
  const [renderExtension, setRenderExtension] = useState('webm');

  const canvasRef = useRef(null);
  const loadedImagesRef = useRef({});
  const animFrameRef = useRef(null);
  const playStartTimeRef = useRef(0);
  const audioCtxRef = useRef(null);
  const lastSpokenSceneRef = useRef(-1);

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const list = window.speechSynthesis.getVoices();
        setAvailableVoices(list);
        if (list.length > 0 && !selectedVoiceName) {
          const preferred = list.find((v) => /en/i.test(v.lang)) || list[0];
          setSelectedVoiceName(preferred.name);
        }
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('studio_engine_mode', engineMode);
    localStorage.setItem('studio_polli_key', pollinationsKey);
    localStorage.setItem('studio_polli_model', pollinationsModel);
    localStorage.setItem('studio_fal_key', falApiKey);
    localStorage.setItem('studio_fal_model', falModel);
    localStorage.setItem('studio_characters', JSON.stringify(characters));
    localStorage.setItem('studio_projects', JSON.stringify(savedProjects));
  }, [engineMode, pollinationsKey, pollinationsModel, falApiKey, falModel, characters, savedProjects]);

  const currentAspectObj = ASPECT_RATIOS.find((a) => a.value === aspectRatio) || ASPECT_RATIOS[0];
  const currentResObj = RESOLUTIONS.find((r) => r.label === resolution) || RESOLUTIONS[1];
  const currentFpsPreset = FRAME_RATE_PRESETS.find((f) => f.fps === fps) || FRAME_RATE_PRESETS[3];
  const canvasWidth = Math.round(currentAspectObj.width * currentResObj.scale);
  const canvasHeight = Math.round(currentAspectObj.height * currentResObj.scale);

  const buildPollinationsImageUrl = (scenePrompt, style, seed) => {
    const key = pollinationsKey.trim();
    if (!key) return null;
    const cleanPrompt = encodeURIComponent(
      `${scenePrompt}, ${style} style, masterpiece, highly detailed, cinematic lighting`
    );
    return `https://gen.pollinations.ai/image/${cleanPrompt}?model=${encodeURIComponent(
      pollinationsModel
    )}&width=${canvasWidth}&height=${canvasHeight}&seed=${seed}&nologo=true&key=${encodeURIComponent(key)}`;
  };

  const preloadSafeBlobImage = async (url) => {
    if (!url) return null;
    if (loadedImagesRef.current[url]) return loadedImagesRef.current[url];
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const blob = await resp.blob();
      if (!blob.type.startsWith('image/')) return null;
      const objUrl = URL.createObjectURL(blob);
      return await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedImagesRef.current[url] = img;
          resolve(img);
        };
        img.onerror = () => resolve(null);
        img.src = objUrl;
      });
    } catch {
      return null;
    }
  };

  const parseScenesFromPrompt = (rawPrompt, style, durMode, manualSecs, countMode) => {
    let text = rawPrompt.trim();
    characters.forEach((c) => {
      const regex = new RegExp(`\\b${c.name}\\b`, 'gi');
      if (regex.test(text)) {
        text = `${text} (${c.name}: ${c.description})`;
      }
    });

    const rawSentences = rawPrompt
      .trim()
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    let targetCount = 1;
    if (countMode === 'Auto') {
      targetCount = rawSentences.length > 1 ? Math.min(rawSentences.length, 8) : 1;
    } else {
      targetCount = Number(countMode);
    }

    const totalSeconds = durMode === 'Auto' ? targetCount * 6 : manualSecs;
    const perSceneSec = Math.max(3, Math.round(totalSeconds / targetCount));

    const generated = [];
    for (let i = 0; i < targetCount; i++) {
      const cleanSubtitle = rawSentences[i % rawSentences.length] || rawPrompt.trim();
      const cameraHint =
        i % 3 === 0 ? 'wide establishing shot' : i % 3 === 1 ? 'medium tracking shot' : 'close-up cinematic angle';
      const fullScenePrompt =
        targetCount > 1 && rawSentences.length === 1
          ? `${cleanSubtitle}, ${cameraHint}, ${style} style`
          : `${cleanSubtitle}, ${style} style`;
      const seed = Math.floor(Math.random() * 999999) + i * 17;
      const imageUrl =
        engineMode === 'pollinations' && pollinationsKey.trim()
          ? buildPollinationsImageUrl(fullScenePrompt, style, seed)
          : null;

      generated.push({
        id: Date.now() + i,
        duration: perSceneSec,
        prompt: fullScenePrompt,
        subtitle: cleanSubtitle.charAt(0).toUpperCase() + cleanSubtitle.slice(1),
        camera: cameraMotion,
        imageUrl,
        videoUrl: null,
        seed
      });
    }
    return generated;
  };

  useEffect(() => {
    if (scenes.length === 0) {
      const initial = parseScenesFromPrompt(prompt, selectedStyle, durationMode, selectedDuration, sceneCountMode);
      setScenes(initial);
      if (initial[0]?.imageUrl) {
        preloadSafeBlobImage(initial[0].imageUrl);
      }
    }
  }, []);

  const startAmbientSynth = (trackId, destinationNode = null) => {
    if (trackId === 'none') return null;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioContextClass();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.08;
      masterGain.connect(ctx.destination);
      if (destinationNode) masterGain.connect(destinationNode);

      const freqs =
        trackId === 'cinematic-pad'
          ? [220, 261.63, 329.63]
          : trackId === 'lofi-calm'
          ? [174.61, 220, 261.63, 329.63]
          : [261.63, 329.63, 392.0];

      const oscs = freqs.map((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = f;
        osc.connect(masterGain);
        osc.start();
        return osc;
      });

      return () => {
        oscs.forEach((o) => {
          try {
            o.stop();
            o.disconnect();
          } catch {}
        });
      };
    } catch {
      return null;
    }
  };

  const speakSceneSubtitle = (text) => {
    if (!voiceoverEnabled || !text || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const chosen = availableVoices.find((v) => v.name === selectedVoiceName);
    if (chosen) utter.voice = chosen;
    utter.rate = voiceRate;
    utter.pitch = voicePitch;
    window.speechSynthesis.speak(utter);
  };

  const handleGenerateScenes = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setIsPlaying(false);
    setRenderedVideoUrl(null);
    setGenerationStatus(`Building storyboard (${fps} FPS • ${totalDurationSeconds * fps} total frames)...`);

    const newScenes = parseScenesFromPrompt(prompt, selectedStyle, durationMode, selectedDuration, sceneCountMode);
    setScenes(newScenes);
    setActiveSceneIdx(0);

    try {
      if (engineMode === 'fal-video' && falApiKey.trim()) {
        for (let i = 0; i < newScenes.length; i++) {
          setGenerationStatus(`Generating AI video clip ${i + 1} of ${newScenes.length} via Fal.ai...`);
          try {
            const resp = await fetch(`https://fal.run/${falModel}`, {
              method: 'POST',
              headers: {
                Authorization: `Key ${falApiKey.trim()}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                prompt: newScenes[i].prompt,
                aspect_ratio: aspectRatio
              })
            });
            if (resp.ok) {
              const data = await resp.json();
              const vid = data?.video?.url || data?.output?.url || data?.data?.video?.url;
              if (vid) {
                newScenes[i].videoUrl = vid;
                setScenes([...newScenes]);
              }
            }
          } catch (err) {
            console.warn('Fal.ai request fallback to built-in canvas:', err);
          }
        }
      } else if (engineMode === 'pollinations' && pollinationsKey.trim()) {
        for (let i = 0; i < newScenes.length; i++) {
          setGenerationStatus(`Rendering AI artwork for Scene ${i + 1} of ${newScenes.length}...`);
          await preloadSafeBlobImage(newScenes[i].imageUrl);
        }
      }
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
      lastSpokenSceneRef.current = -1;
      setIsPlaying(true);
      playStartTimeRef.current = performance.now();
    }
  };

  const handleRegenerateScene = async (index) => {
    const updated = [...scenes];
    const newSeed = Math.floor(Math.random() * 999999);
    const newUrl =
      engineMode === 'pollinations' && pollinationsKey.trim()
        ? buildPollinationsImageUrl(updated[index].prompt, selectedStyle, newSeed)
        : null;
    updated[index] = { ...updated[index], seed: newSeed, imageUrl: newUrl, videoUrl: null };
    setScenes(updated);
    if (newUrl) {
      setGenerationStatus(`Refreshing artwork for Scene ${index + 1}...`);
      await preloadSafeBlobImage(newUrl);
      setGenerationStatus('');
    }
  };

  // Quantizes time to the selected FPS (8/12/16/24/30/60) so 8-12 FPS truly looks like stylized anime/stop-motion!
  const drawBuiltInAnimatedScene = (ctx, width, height, scene, rawLocalTimeSec) => {
    const quantizedTimeSec = Math.floor(rawLocalTimeSec * fps) / fps;
    const pText = (scene?.prompt || prompt || '').toLowerCase();
    const isBlossom = /cherry|blossom|flower|petal|spring|sakura|park|garden/i.test(pText);
    const hasPerson = /girl|woman|boy|man|person|walk|character|hero|child/i.test(pText);
    const isNightOrCyber = /cyberpunk|night|neon|space|moon|dark|city/i.test(pText + ' ' + selectedStyle);
    const progress = Math.min(1, Math.max(0, quantizedTimeSec / Math.max(1, scene?.duration || 6)));

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    if (isNightOrCyber) {
      sky.addColorStop(0, '#090d16');
      sky.addColorStop(0.55, '#1e1b4b');
      sky.addColorStop(1, '#311042');
    } else if (isBlossom) {
      sky.addColorStop(0, '#fbcfe8');
      sky.addColorStop(0.45, '#fde68a');
      sky.addColorStop(1, '#fed7aa');
    } else {
      sky.addColorStop(0, '#1e3a8a');
      sky.addColorStop(0.55, '#6d28d9');
      sky.addColorStop(1, '#f97316');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const sunX = width * 0.68 - progress * (width * 0.02);
    const sunY = height * 0.28 + Math.sin(quantizedTimeSec * 0.5) * 4;
    const sunR = Math.min(width, height) * 0.3;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunR);
    sunGlow.addColorStop(0, 'rgba(255, 251, 235, 0.95)');
    sunGlow.addColorStop(0.35, isBlossom ? 'rgba(251, 207, 232, 0.55)' : 'rgba(251, 146, 60, 0.45)');
    sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isNightOrCyber ? '#111827' : isBlossom ? '#86efac' : '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height * 0.68);
    ctx.quadraticCurveTo(width * 0.3, height * 0.56, width * 0.62, height * 0.67);
    ctx.quadraticCurveTo(width * 0.85, height * 0.6, width, height * 0.68);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isNightOrCyber ? '#0f172a' : isBlossom ? '#4ade80' : '#0f172a';
    ctx.fillRect(0, height * 0.72, width, height * 0.28);

    ctx.fillStyle = isBlossom ? '#fef3c7' : '#334155';
    ctx.beginPath();
    ctx.moveTo(width * 0.15, height);
    ctx.quadraticCurveTo(width * 0.48, height * 0.82, width * 0.62, height * 0.72);
    ctx.lineTo(width * 0.72, height * 0.72);
    ctx.quadraticCurveTo(width * 0.65, height * 0.84, width * 0.48, height);
    ctx.closePath();
    ctx.fill();

    const sway = Math.sin(quantizedTimeSec * 1.8) * 6;
    const baseScale = height / 540;
    const drawTree = (tx, ty, scale, canopyColor) => {
      const s = scale * baseScale;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.fillStyle = '#4a2c2a';
      ctx.fillRect(-8 * s, -130 * s, 16 * s, 130 * s);
      ctx.strokeStyle = '#4a2c2a';
      ctx.lineWidth = 6 * s;
      ctx.beginPath();
      ctx.moveTo(0, -90 * s);
      ctx.lineTo(-42 * s + sway * 0.4, -145 * s);
      ctx.moveTo(0, -100 * s);
      ctx.lineTo(45 * s + sway * 0.4, -150 * s);
      ctx.stroke();

      const clusters = [
        [-45 * s + sway, -155 * s, 52 * s],
        [42 * s + sway, -150 * s, 56 * s],
        [0 + sway, -185 * s, 64 * s],
        [-20 * s + sway, -135 * s, 44 * s],
        [26 * s + sway, -132 * s, 46 * s]
      ];
      clusters.forEach(([cx, cy, r], idx) => {
        ctx.fillStyle = idx % 2 === 0 ? canopyColor : '#fbcfe8';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    };

    if (isBlossom || !isNightOrCyber) {
      const leafColor = isBlossom ? '#f472b6' : '#10b981';
      drawTree(width * 0.16, height * 0.75, 1.15, leafColor);
      drawTree(width * 0.84, height * 0.76, 1.25, leafColor);
      drawTree(width * 0.48, height * 0.72, 0.65, leafColor);
    }

    if (hasPerson) {
      const walkX = width * 0.34 + progress * (width * 0.28);
      const bobY = Math.abs(Math.sin(quantizedTimeSec * 5.2)) * 5 * baseScale;
      const walkY = height * 0.83 - bobY;
      const stride = Math.sin(quantizedTimeSec * 5.2) * 10 * baseScale;

      ctx.save();
      ctx.translate(walkX, walkY);
      ctx.scale(baseScale, baseScale);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 26, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4, 2);
      ctx.lineTo(-4 + stride / baseScale, 24);
      ctx.moveTo(4, 2);
      ctx.lineTo(4 - stride / baseScale, 24);
      ctx.stroke();

      ctx.fillStyle = isBlossom ? '#ec4899' : '#6366f1';
      ctx.beginPath();
      ctx.moveTo(-9, -24);
      ctx.lineTo(9, -24);
      ctx.lineTo(16 + sway * 0.3, 6);
      ctx.lineTo(-16 + sway * 0.3, 6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(0, -34, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(-2, -35, 10, Math.PI * 0.75, Math.PI * 2.15);
      ctx.lineTo(-14 + sway * 0.5, -16);
      ctx.lineTo(-5, -26);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    const particleCount = isBlossom ? 38 : 20;
    for (let p = 0; p < particleCount; p++) {
      const speedY = (26 + (p % 5) * 10) * baseScale;
      const driftX = (24 + (p % 4) * 12) * baseScale;
      const px =
        ((p * 97 + quantizedTimeSec * driftX + Math.sin(quantizedTimeSec * 1.7 + p) * 28) % (width + 40)) - 20;
      const py = ((p * 61 + quantizedTimeSec * speedY) % (height + 40)) - 20;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(quantizedTimeSec * 1.6 + p);
      ctx.fillStyle = isBlossom ? 'rgba(255, 228, 238, 0.9)' : 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        (isBlossom ? 5.5 : 3) * baseScale,
        (isBlossom ? 3.2 : 3) * baseScale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  };

  const drawSubtitlesOverlay = (ctx, width, height, text) => {
    if (!subtitlesEnabled || !text || !text.trim()) return;

    const scaledFontSize = Math.round(subtitleSize * (height / 540));
    ctx.save();
    ctx.font = `700 ${scaledFontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxWidth = width * 0.84;
    const words = text.trim().split(/\s+/);
    const lines = [];
    let currentLine = words[0] || '';
    for (let i = 1; i < words.length; i++) {
      const testLine = `${currentLine} ${words[i]}`;
      if (ctx.measureText(testLine).width < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = scaledFontSize * 1.35;
    const totalBlockHeight = lines.length * lineHeight;
    const barOffset = letterboxBars ? height * 0.08 : 0;

    let baseY = height - totalBlockHeight / 2 - 28 * (height / 540) - barOffset;
    if (subtitlePosition === 'top') {
      baseY = totalBlockHeight / 2 + 34 * (height / 540) + barOffset;
    } else if (subtitlePosition === 'center') {
      baseY = height / 2;
    }

    lines.forEach((line, idx) => {
      const ly = baseY + (idx - (lines.length - 1) / 2) * lineHeight;
      const metrics = ctx.measureText(line);
      const padX = 16 * (height / 540);
      const padY = 6 * (height / 540);

      if (subtitleStyle === 'cinematic-box') {
        ctx.fillStyle = 'rgba(9, 13, 22, 0.76)';
        ctx.beginPath();
        ctx.roundRect(
          width / 2 - metrics.width / 2 - padX,
          ly - scaledFontSize / 2 - padY,
          metrics.width + padX * 2,
          scaledFontSize + padY * 2,
          8
        );
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, width / 2, ly);
      } else if (subtitleStyle === 'yellow-classic') {
        ctx.lineWidth = 4 * (height / 540);
        ctx.strokeStyle = '#000000';
        ctx.strokeText(line, width / 2, ly);
        ctx.fillStyle = '#facc15';
        ctx.fillText(line, width / 2, ly);
      } else if (subtitleStyle === 'neon-glow') {
        ctx.shadowColor = '#6366f1';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#e0e7ff';
        ctx.fillText(line, width / 2, ly);
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(line, width / 2, ly);
      }
    });

    ctx.restore();
  };

  const drawFrameToCanvas = (ctx, width, height, scene, localTimeSec, sceneIndex) => {
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const filterObj = COLOR_FILTERS.find((f) => f.label === colorFilter);
    ctx.filter = filterObj ? filterObj.css : 'none';

    const dur = Math.max(1, scene?.duration || 6);
    const quantizedLocalSec = Math.floor(localTimeSec * fps) / fps;
    const progress = Math.min(1, Math.max(0, quantizedLocalSec / dur));
    const activeMotion = scene?.camera && scene.camera !== 'Auto / Dynamic' ? scene.camera : cameraMotion;

    ctx.save();
    let scale = 1.0;
    let offsetX = 0;
    let offsetY = 0;

    if (activeMotion === 'Slow Zoom In' || (activeMotion === 'Auto / Dynamic' && sceneIndex % 2 === 0)) {
      scale = 1.0 + progress * 0.1;
    } else if (activeMotion === 'Slow Zoom Out') {
      scale = 1.1 - progress * 0.1;
    } else if (activeMotion === 'Pan Left to Right' || (activeMotion === 'Auto / Dynamic' && sceneIndex % 2 === 1)) {
      scale = 1.08;
      offsetX = (progress - 0.5) * width * 0.06;
    } else if (activeMotion === 'Pan Right to Left') {
      scale = 1.08;
      offsetX = (0.5 - progress) * width * 0.06;
    }

    ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    const img = scene?.imageUrl ? loadedImagesRef.current[scene.imageUrl] : null;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, width, height);
    } else {
      drawBuiltInAnimatedScene(ctx, width, height, scene, localTimeSec);
    }
    ctx.restore();

    ctx.filter = 'none';

    if (localTimeSec < 0.45 && transitionType !== 'Smooth Cut') {
      const tAlpha = 1 - localTimeSec / 0.45;
      if (transitionType === 'Dip to Black' || transitionType === 'Crossfade') {
        ctx.fillStyle = `rgba(9, 13, 22, ${tAlpha * 0.85})`;
        ctx.fillRect(0, 0, width, height);
      }
    }

    if (letterboxBars) {
      const barH = Math.round(height * 0.085);
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, width, barH);
      ctx.fillRect(0, height - barH, width, barH);
    }

    const hudY = letterboxBars ? Math.round(height * 0.085) + 12 : 14;
    const currentFrameNum = Math.min(dur * fps, Math.floor(localTimeSec * fps) + 1);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(14, hudY, 275, 26);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.fillText(
      `SCENE ${sceneIndex + 1} • ${fps} FPS • FRAME ${currentFrameNum}/${dur * fps}`,
      24,
      hudY + 17
    );

    drawSubtitlesOverlay(ctx, width, height, scene?.subtitle || '');

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || scenes.length === 0) return;
    const ctx = canvas.getContext('2d');

    if (!isPlaying) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      drawFrameToCanvas(ctx, canvas.width, canvas.height, scenes[activeSceneIdx] || scenes[0], 1.2, activeSceneIdx);
      return;
    }

    playStartTimeRef.current = performance.now();
    lastSpokenSceneRef.current = -1;
    const stopAudio = startAmbientSynth(ambientMusic);
    const totalDur = scenes.reduce((acc, s) => acc + (s.duration || 6), 0);

    const tick = (now) => {
      const elapsed = (now - playStartTimeRef.current) / 1000;
      if (elapsed >= totalDur) {
        setIsPlaying(false);
        setActiveSceneIdx(0);
        return;
      }

      let acc = 0;
      let currentIdx = 0;
      let localSec = 0;
      for (let i = 0; i < scenes.length; i++) {
        const d = scenes[i].duration || 6;
        if (elapsed < acc + d) {
          currentIdx = i;
          localSec = elapsed - acc;
          break;
        }
        acc += d;
      }

      if (currentIdx !== activeSceneIdx) {
        setActiveSceneIdx(currentIdx);
      }

      if (lastSpokenSceneRef.current !== currentIdx) {
        lastSpokenSceneRef.current = currentIdx;
        speakSceneSubtitle(scenes[currentIdx]?.subtitle);
      }

      drawFrameToCanvas(ctx, canvas.width, canvas.height, scenes[currentIdx], localSec, currentIdx);
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (stopAudio) stopAudio();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [
    isPlaying,
    scenes,
    activeSceneIdx,
    selectedStyle,
    aspectRatio,
    fps,
    resolution,
    cameraMotion,
    transitionType,
    colorFilter,
    letterboxBars,
    subtitlesEnabled,
    subtitleStyle,
    subtitlePosition,
    subtitleSize
  ]);

  const handleCombineAndRender = async () => {
    const canvas = canvasRef.current;
    if (!canvas || scenes.length === 0) return;

    setIsPlaying(false);
    setIsRendering(true);
    setRenderProgress(0);
    setRenderedVideoUrl(null);

    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].imageUrl && !loadedImagesRef.current[scenes[i].imageUrl]) {
        await preloadSafeBlobImage(scenes[i].imageUrl);
      }
    }

    const ctx = canvas.getContext('2d');
    const videoStream = canvas.captureStream(fps);

    let stopExportAudio = null;
    if (ambientMusic !== 'none') {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const aCtx = audioCtxRef.current || new AudioContextClass();
        audioCtxRef.current = aCtx;
        const dest = aCtx.createMediaStreamDestination();
        stopExportAudio = startAmbientSynth(ambientMusic, dest);
        dest.stream.getAudioTracks().forEach((t) => videoStream.addTrack(t));
      } catch {}
    }

    const mimeType = MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    setRenderExtension(mimeType.includes('mp4') ? 'mp4' : 'webm');

    const recorder = new MediaRecorder(videoStream, { mimeType, videoBitsPerSecond: 4500000 });
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      if (stopExportAudio) stopExportAudio();
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRenderedVideoUrl(url);
      setIsRendering(false);
      setRenderProgress(100);
    };

    recorder.start();

    const rawTotal = scenes.reduce((sum, s) => sum + (s.duration || 6), 0);
    const scaleFactor = rawTotal > 30 ? 30 / rawTotal : 1;
    const renderTotalSec = rawTotal * scaleFactor;
    const startMs = performance.now();

    const recordStep = (now) => {
      const elapsedSec = (now - startMs) / 1000;
      if (elapsedSec >= renderTotalSec) {
        recorder.stop();
        return;
      }

      setRenderProgress(Math.min(99, Math.round((elapsedSec / renderTotalSec) * 100)));

      const virtualSec = elapsedSec / scaleFactor;
      let acc = 0;
      let idx = 0;
      let localSec = 0;
      for (let i = 0; i < scenes.length; i++) {
        const d = scenes[i].duration || 6;
        if (virtualSec < acc + d) {
          idx = i;
          localSec = virtualSec - acc;
          break;
        }
        acc += d;
      }

      drawFrameToCanvas(ctx, canvas.width, canvas.height, scenes[idx], localSec, idx);
      requestAnimationFrame(recordStep);
    };

    requestAnimationFrame(recordStep);
  };

  const handleSaveProject = () => {
    const title = projectTitle.trim() || prompt.slice(0, 36) || 'Untitled Video';
    const item = {
      id: Date.now(),
      title,
      prompt,
      style: selectedStyle,
      aspectRatio,
      fps,
      scenes,
      createdAt: new Date().toLocaleDateString()
    };
    setSavedProjects([item, ...savedProjects]);
    alert(`Saved "${title}" to My Projects!`);
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mx-auto mb-5">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2">My AI Video Studio</h1>
          <p className="text-sm text-slate-400 text-center mb-6">
            Enter your Owner PIN to unlock video generation (Default PIN:{' '}
            <span className="text-indigo-400 font-mono">2026</span>)
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pinInput === ownerPin) {
                setIsUnlocked(true);
                localStorage.setItem('studio_unlocked', 'true');
                setPinError('');
              } else {
                setPinError('Incorrect PIN. Try 2026.');
              }
            }}
            className="space-y-4"
          >
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN (2026)"
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-3 text-center text-lg tracking-widest text-white focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            {pinError && <p className="text-xs text-rose-400 text-center">{pinError}</p>}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" /> Unlock Studio
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalDurationSeconds = scenes.reduce((acc, s) => acc + (s.duration || 6), 0);
  const totalFramesCount = totalDurationSeconds * fps;
  const speedMultiplier = (24 / fps).toFixed(1);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-[#0f1524] border-b md:border-b-0 md:border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">My AI Video Studio</span>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('create')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Create Video
            </button>
            <button
              onClick={() => setActiveTab('characters')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'characters'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" /> Characters
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'projects'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <FolderOpen className="w-4 h-4" /> My Projects
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" /> Settings & API
            </button>
          </nav>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
          <div className="bg-[#131b2e] border border-slate-800 rounded-xl p-3 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>Active Engine</span>
              <span className="text-emerald-400 font-medium">Ready</span>
            </div>
            <p className="text-slate-200 font-medium truncate">
              {engineMode === 'fal-video' && falApiKey
                ? 'Fal.ai Cloud Video'
                : engineMode === 'pollinations' && pollinationsKey
                ? 'Pollinations AI (gen)'
                : 'Built-In Scene Studio'}
            </p>
          </div>
          <button
            onClick={() => {
              setIsUnlocked(false);
              localStorage.removeItem('studio_unlocked');
            }}
            className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-200 py-2"
          >
            <Lock className="w-3.5 h-3.5" /> Lock Studio
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            <div className="lg:col-span-5 bg-[#111827] border border-slate-800/90 rounded-2xl p-5 space-y-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-indigo-400" /> Prompt & Studio Controls
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure your prompt, frame rate, aspect ratio, subtitles, and visual style.
                </p>
              </div>

              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Project Title (optional)"
                className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what happens in your video..."
                className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />

              {/* Visual Style */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Visual Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStyle(st)}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-medium border transition ${
                        selectedStyle === st
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                          : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Rate (FPS), Frame Budget & Style Guide */}
              <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5" /> Frame Rate (FPS) & Render Load
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {totalFramesCount} frames ({totalDurationSeconds}s × {fps})
                  </span>
                </div>

                {/* FPS Presets Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {FRAME_RATE_PRESETS.map((preset) => (
                    <button
                      key={preset.fps}
                      onClick={() => setFps(preset.fps)}
                      className={`p-2 rounded-lg border text-left transition ${
                        fps === preset.fps
                          ? 'bg-indigo-600/25 border-indigo-500 text-white'
                          : 'bg-[#111827] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{preset.label}</div>
                      <div className="text-[10px] text-indigo-300/90 truncate">{preset.badge}</div>
                    </button>
                  ))}
                </div>

                {/* Live Frame Calculation & Model Compatibility Callout */}
                <div className="p-2.5 rounded-lg bg-[#111827] border border-slate-800/90 text-[11px] space-y-1">
                  <p className="text-slate-200 font-medium">{currentFpsPreset.description}</p>
                  <p className="text-slate-400">
                    <span className="text-emerald-400 font-semibold">Frame Budget:</span>{' '}
                    {totalDurationSeconds}s × {fps} FPS ={' '}
                    <span className="text-white font-mono">{totalFramesCount} individual frames</span>
                    {fps < 24 && (
                      <span className="text-amber-300"> ({speedMultiplier}× faster render & lower GPU/RAM load)</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Frame Aspect Ratio, Resolution & Camera Settings */}
              <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5" /> Frame Dimensions & Camera
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={letterboxBars}
                      onChange={(e) => setLetterboxBars(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                    />
                    Cinema Bars
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5">Frame Aspect Ratio</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ASPECT_RATIOS.map((ar) => (
                      <button
                        key={ar.value}
                        onClick={() => setAspectRatio(ar.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left transition ${
                          aspectRatio === ar.value
                            ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200'
                            : 'bg-[#111827] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Resolution</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      {RESOLUTIONS.map((r) => (
                        <option key={r.label} value={r.label}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Camera Motion</label>
                    <select
                      value={cameraMotion}
                      onChange={(e) => setCameraMotion(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      {CAMERA_MOTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Scene Transition</label>
                    <select
                      value={transitionType}
                      onChange={(e) => setTransitionType(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                    >
                      {TRANSITIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Color Filter</label>
                    <select
                      value={colorFilter}
                      onChange={(e) => setColorFilter(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                    >
                      {COLOR_FILTERS.map((cf) => (
                        <option key={cf.label} value={cf.label}>
                          {cf.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Subtitles & Captions Settings */}
              <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Subtitles className="w-3.5 h-3.5" /> Subtitles & Captions
                  </span>
                  <button
                    onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      subtitlesEnabled
                        ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {subtitlesEnabled ? 'Subtitles ON' : 'Subtitles OFF'}
                  </button>
                </div>

                {subtitlesEnabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Caption Style</label>
                      <select
                        value={subtitleStyle}
                        onChange={(e) => setSubtitleStyle(e.target.value)}
                        className="w-full bg-[#111827] border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                      >
                        {SUBTITLE_STYLES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Position</label>
                      <select
                        value={subtitlePosition}
                        onChange={(e) => setSubtitlePosition(e.target.value)}
                        className="w-full bg-[#111827] border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                      >
                        {SUBTITLE_POSITIONS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Font Size ({subtitleSize}px)</label>
                      <input
                        type="range"
                        min={14}
                        max={36}
                        value={subtitleSize}
                        onChange={(e) => setSubtitleSize(Number(e.target.value))}
                        className="w-full accent-indigo-500 mt-1.5"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Voiceover & Background Audio Settings */}
              <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" /> Voiceover & Background Music
                  </span>
                  <button
                    onClick={() => setVoiceoverEnabled(!voiceoverEnabled)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      voiceoverEnabled
                        ? 'bg-indigo-600/25 border border-indigo-500/40 text-indigo-200'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {voiceoverEnabled ? 'AI Narrator ON' : 'Narrator OFF'}
                  </button>
                </div>

                {voiceoverEnabled && availableVoices.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedVoiceName}
                      onChange={(e) => setSelectedVoiceName(e.target.value)}
                      className="bg-[#111827] border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                    >
                      {availableVoices.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Speed {voiceRate}x</span>
                      <input
                        type="range"
                        min={0.7}
                        max={1.4}
                        step={0.1}
                        value={voiceRate}
                        onChange={(e) => setVoiceRate(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <Music className="w-3 h-3" /> Background Ambient Track
                  </label>
                  <select
                    value={ambientMusic}
                    onChange={(e) => setAmbientMusic(e.target.value)}
                    className="w-full bg-[#111827] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    {AMBIENT_TRACKS.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration Mode & Scene Count */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> Duration Mode
                  </span>
                  <div className="flex bg-[#0b0f19] p-0.5 rounded-lg border border-slate-800">
                    {['Auto', 'Manual'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setDurationMode(mode)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                          durationMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {durationMode === 'Manual' && (
                  <div className="grid grid-cols-3 gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d.seconds}
                        onClick={() => setSelectedDuration(d.seconds)}
                        className={`py-2 rounded-xl text-xs font-medium border transition ${
                          selectedDuration === d.seconds
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> Scene Count
                  </span>
                  <div className="flex gap-1 bg-[#0b0f19] p-1 rounded-xl border border-slate-800">
                    {SCENE_COUNTS.map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => setSceneCountMode(cnt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                          sceneCountMode === cnt ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateScenes}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{generationStatus || 'Generating AI Visuals...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Video & Scenes</span>
                  </>
                )}
              </button>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-200 truncate max-w-md">
                    <Film className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{prompt || 'Untitled Video'}</span>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {scenes.length} {scenes.length === 1 ? 'Scene' : 'Scenes'} • {totalDurationSeconds}s • {fps} FPS (
                    {totalFramesCount} frames)
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center max-h-[520px]">
                  {scenes[activeSceneIdx]?.videoUrl ? (
                    <video
                      src={scenes[activeSceneIdx].videoUrl}
                      controls
                      autoPlay
                      loop
                      className="max-h-[520px] w-auto object-contain"
                    />
                  ) : (
                    <canvas
                      ref={canvasRef}
                      width={canvasWidth}
                      height={canvasHeight}
                      className="max-h-[520px] w-auto max-w-full object-contain block"
                    />
                  )}

                  {isGenerating && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                      <p className="text-sm font-semibold text-white">{generationStatus}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center gap-2 transition"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isPlaying ? 'Pause Preview' : 'Play Animated Preview'}
                    </button>
                    <button
                      onClick={handleSaveProject}
                      className="px-3.5 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                    >
                      Save Project
                    </button>
                  </div>

                  <button
                    onClick={handleCombineAndRender}
                    disabled={isRendering || scenes.length === 0}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                  >
                    <VideoIcon className="w-3.5 h-3.5" />
                    {isRendering ? `Rendering ${fps} FPS (${renderProgress}%)...` : 'Combine & Render Video'}
                  </button>
                </div>

                {renderedVideoUrl && (
                  <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-200">
                          Your {resolution} ({aspectRatio} • {fps} FPS) video is ready!
                        </p>
                        <p className="text-[11px] text-emerald-400/80">
                          Rendered {totalFramesCount} frames with subtitles & audio track.
                        </p>
                      </div>
                    </div>
                    <a
                      href={renderedVideoUrl}
                      download={`${(projectTitle || 'ai-video-studio')
                        .toLowerCase()
                        .replace(/\s+/g, '-')}.${renderExtension}`}
                      className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Video (.{renderExtension.toUpperCase()})
                    </a>
                  </div>
                )}
              </div>

              <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Scene Storyboard & Subtitle Editor</h3>
                  <button
                    onClick={() => {
                      const seed = Math.floor(Math.random() * 999999);
                      const imageUrl =
                        engineMode === 'pollinations' && pollinationsKey.trim()
                          ? buildPollinationsImageUrl(prompt, selectedStyle, seed)
                          : null;
                      const newScene = {
                        id: Date.now(),
                        duration: 6,
                        prompt: `${prompt}, ${selectedStyle} style`,
                        subtitle: prompt,
                        camera: cameraMotion,
                        imageUrl,
                        videoUrl: null,
                        seed
                      };
                      setScenes([...scenes, newScene]);
                      if (imageUrl) preloadSafeBlobImage(imageUrl);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Scene
                  </button>
                </div>

                <div className="space-y-3">
                  {scenes.map((scene, idx) => (
                    <div
                      key={scene.id}
                      onClick={() => setActiveSceneIdx(idx)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2.5 ${
                        activeSceneIdx === idx
                          ? 'bg-[#161f33] border-indigo-500/70'
                          : 'bg-[#0b0f19] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-indigo-400">
                          Scene {idx + 1} ({scene.duration}s • {scene.duration * fps} frames)
                        </span>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleRegenerateScene(idx)}
                            title="Regenerate Scene"
                            className="p-1 text-slate-400 hover:text-indigo-400"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={idx === 0}
                            onClick={() => {
                              const copy = [...scenes];
                              [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                              setScenes(copy);
                            }}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={idx === scenes.length - 1}
                            onClick={() => {
                              const copy = [...scenes];
                              [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                              setScenes(copy);
                            }}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={scenes.length <= 1}
                            onClick={() => {
                              const filtered = scenes.filter((_, i) => i !== idx);
                              setScenes(filtered);
                              setActiveSceneIdx(0);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                          Visual Prompt
                        </label>
                        <input
                          type="text"
                          value={scene.prompt}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const copy = [...scenes];
                            copy[idx].prompt = e.target.value;
                            setScenes(copy);
                          }}
                          className="w-full bg-[#111827] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                          <Subtitles className="w-3 h-3 text-indigo-400" /> Subtitle & Voiceover Text
                        </label>
                        <input
                          type="text"
                          value={scene.subtitle || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const copy = [...scenes];
                            copy[idx].subtitle = e.target.value;
                            setScenes(copy);
                          }}
                          placeholder="Enter on-screen subtitle text for this scene..."
                          className="w-full bg-[#111827] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="max-w-3xl mx-auto bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Consistent Character Library</h2>
              <p className="text-xs text-slate-400 mt-1">
                Mention any saved character name in your prompt and their visual traits are automatically injected into every scene.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={newCharName}
                onChange={(e) => setNewCharName(e.target.value)}
                placeholder="Character Name (e.g., Hana)"
                className="bg-[#0b0f19] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
              <input
                type="text"
                value={newCharDesc}
                onChange={(e) => setNewCharDesc(e.target.value)}
                placeholder="Appearance (e.g., silver hair, blue kimono)"
                className="md:col-span-2 bg-[#0b0f19] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <button
              onClick={() => {
                if (!newCharName.trim() || !newCharDesc.trim()) return;
                setCharacters([
                  ...characters,
                  { id: Date.now(), name: newCharName.trim(), description: newCharDesc.trim() }
                ]);
                setNewCharName('');
                setNewCharDesc('');
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Save Character
            </button>

            <div className="space-y-2.5">
              {characters.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-[#0b0f19] border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-indigo-300">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.description}</p>
                  </div>
                  <button
                    onClick={() => setCharacters(characters.filter((item) => item.id !== c.id))}
                    className="p-1.5 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="max-w-4xl mx-auto bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">Saved Video Projects</h2>
            {savedProjects.length === 0 ? (
              <p className="text-sm text-slate-400">
                No saved projects yet. Click "Save Project" in Create Video to store your storyboards.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedProjects.map((proj) => (
                  <div key={proj.id} className="p-4 rounded-xl bg-[#0b0f19] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">{proj.title}</h3>
                      <span className="text-[11px] text-slate-500">{proj.createdAt}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{proj.prompt}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-indigo-400">
                        {proj.scenes.length} Scenes • {proj.style} • {proj.fps || 24} FPS
                      </span>
                      <button
                        onClick={() => {
                          setProjectTitle(proj.title);
                          setPrompt(proj.prompt);
                          setSelectedStyle(proj.style);
                          if (proj.aspectRatio) setAspectRatio(proj.aspectRatio);
                          if (proj.fps) setFps(proj.fps);
                          setScenes(proj.scenes);
                          proj.scenes.forEach((s) => {
                            if (s.imageUrl) preloadSafeBlobImage(s.imageUrl);
                          });
                          setActiveTab('create');
                        }}
                        className="px-3 py-1 rounded-lg bg-indigo-600 text-xs font-semibold text-white"
                      >
                        Load Studio
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" /> AI Video & Scene Generation Engine
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Use the built-in CORS-safe animated scene studio (no API key required) or connect a Pollinations / Fal.ai key for cloud AI diffusion.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setEngineMode('built-in')}
                className={`p-4 rounded-xl border text-left transition ${
                  engineMode === 'built-in' ? 'bg-indigo-600/15 border-indigo-500' : 'bg-[#0b0f19] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-white mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Built-In Animated Studio
                </div>
                <p className="text-[11px] text-slate-400">
                  100% browser-rendered animated scenes with walking character, trees & petals. Renders smoothly at 8–60 FPS.
                </p>
              </button>

              <button
                onClick={() => setEngineMode('pollinations')}
                className={`p-4 rounded-xl border text-left transition ${
                  engineMode === 'pollinations'
                    ? 'bg-indigo-600/15 border-indigo-500'
                    : 'bg-[#0b0f19] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-white mb-1">
                  <ImageIcon className="w-4 h-4 text-sky-400" /> Pollinations API (gen)
                </div>
                <p className="text-[11px] text-slate-400">
                  Connect your key from enter.pollinations.ai to generate custom Flux / Z-Image AI artwork per scene.
                </p>
              </button>

              <button
                onClick={() => setEngineMode('fal-video')}
                className={`p-4 rounded-xl border text-left transition ${
                  engineMode === 'fal-video' ? 'bg-indigo-600/15 border-indigo-500' : 'bg-[#0b0f19] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-white mb-1">
                  <VideoIcon className="w-4 h-4 text-emerald-400" /> Fal.ai Cloud Video
                </div>
                <p className="text-[11px] text-slate-400">
                  Connect a Fal.ai API key for full neural text-to-video clips (Wan 2.1, MiniMax, Luma).
                </p>
              </button>
            </div>

            {engineMode === 'pollinations' && (
              <div className="p-4 rounded-xl bg-[#0b0f19] border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-sky-400" /> Pollinations API Key (from enter.pollinations.ai)
                  </label>
                  <input
                    type="password"
                    value={pollinationsKey}
                    onChange={(e) => setPollinationsKey(e.target.value)}
                    placeholder="sk_..."
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Image Model</label>
                  <select
                    value={pollinationsModel}
                    onChange={(e) => setPollinationsModel(e.target.value)}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  >
                    <option value="flux">FLUX Schnell (Fast)</option>
                    <option value="tongyi-mai/z-image-turbo">Z-Image Turbo</option>
                    <option value="seedream">Seedream</option>
                  </select>
                </div>
              </div>
            )}

            {engineMode === 'fal-video' && (
              <div className="p-4 rounded-xl bg-[#0b0f19] border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-400" /> Fal.ai API Key
                  </label>
                  <input
                    type="password"
                    value={falApiKey}
                    onChange={(e) => setFalApiKey(e.target.value)}
                    placeholder="fal_key_..."
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Video Diffusion Model</label>
                  <select
                    value={falModel}
                    onChange={(e) => setFalModel(e.target.value)}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  >
                    <option value="fal-ai/wan-t2v">Wan 2.1 Text-to-Video (16 FPS Native)</option>
                    <option value="fal-ai/minimax-video">MiniMax Hailuo Video-01</option>
                    <option value="fal-ai/luma-dream-machine">Luma Dream Machine</option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Update Owner PIN</label>
              <div className="flex gap-3 max-w-xs">
                <input
                  type="text"
                  value={ownerPin}
                  onChange={(e) => {
                    setOwnerPin(e.target.value);
                    localStorage.setItem('studio_pin', e.target.value);
                  }}
                  className="bg-[#0b0f19] border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
