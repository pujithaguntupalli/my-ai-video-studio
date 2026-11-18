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
  AlertCircle,
  Key,
  Cpu,
  Wand2,
  Clock,
  Layers,
  Image as ImageIcon,
  Video as VideoIcon
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

export default function App() {
  // Authentication State (Default PIN: 2026)
  const [isUnlocked, setIsUnlocked] = useState(() => localStorage.getItem('studio_unlocked') === 'true');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [ownerPin, setOwnerPin] = useState(() => localStorage.getItem('studio_pin') || '2026');

  // Navigation & Projects
  const [activeTab, setActiveTab] = useState('create');
  const [projectTitle, setProjectTitle] = useState('');
  const [prompt, setPrompt] = useState('a girl is walking in a park full of cherry blossom trees. the flowers are falling due to fine breeze');
  const [selectedStyle, setSelectedStyle] = useState('Anime');
  const [durationMode, setDurationMode] = useState('Manual');
  const [selectedDuration, setSelectedDuration] = useState(6);
  const [sceneCountMode, setSceneCountMode] = useState('Auto');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  // AI Engine Settings (Cloud Video API + Free AI Image Storyboard + Procedural Fallback)
  const [engineMode, setEngineMode] = useState(() => localStorage.getItem('studio_engine_mode') || 'ai-storyboard');
  const [falApiKey, setFalApiKey] = useState(() => localStorage.getItem('studio_fal_key') || '');
  const [falModel, setFalModel] = useState(() => localStorage.getItem('studio_fal_model') || 'fal-ai/wan-t2v');
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem('studio_backend_url') || 'http://localhost:8000');

  // Saved Characters & Projects
  const [characters, setCharacters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studio_characters')) || [
        { id: 1, name: 'Aoi', description: 'young anime girl with dark hair, pastel spring coat, gentle smile' }
      ];
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

  // Scenes State
  const [scenes, setScenes] = useState([]);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  // Generation & Playback State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState(null);
  const [renderExtension, setRenderExtension] = useState('webm');

  // Refs for Canvas & MediaRecorder
  const canvasRef = useRef(null);
  const loadedImagesRef = useRef({});
  const animFrameRef = useRef(null);
  const playStartTimeRef = useRef(0);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('studio_engine_mode', engineMode);
    localStorage.setItem('studio_fal_key', falApiKey);
    localStorage.setItem('studio_fal_model', falModel);
    localStorage.setItem('studio_backend_url', backendUrl);
    localStorage.setItem('studio_characters', JSON.stringify(characters));
    localStorage.setItem('studio_projects', JSON.stringify(savedProjects));
  }, [engineMode, falApiKey, falModel, backendUrl, characters, savedProjects]);

  // Build Pollinations AI Image URL for a scene prompt
  const buildAiImageUrl = (scenePrompt, style, seed) => {
    const cleanPrompt = encodeURIComponent(`${scenePrompt}, ${style} style, masterpiece, highly detailed, cinematic lighting, 8k`);
    const dims = aspectRatio === '9:16' ? 'width=576&height=1024' : aspectRatio === '1:1' ? 'width=768&height=768' : 'width=1024&height=576';
    return `https://image.pollinations.ai/prompt/${cleanPrompt}?${dims}&seed=${seed}&nologo=true`;
  };

  // Preload image into memory with CORS support for Canvas recording
  const preloadImage = (url) => {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      if (loadedImagesRef.current[url]) return resolve(loadedImagesRef.current[url]);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedImagesRef.current[url] = img;
        resolve(img);
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = url;
    });
  };

  // Split prompt into scenes automatically or by user count
  const parseScenesFromPrompt = (rawPrompt, style, durMode, manualSecs, countMode) => {
    let text = rawPrompt.trim();
    characters.forEach((c) => {
      const regex = new RegExp(`\\b${c.name}\\b`, 'gi');
      if (regex.test(text)) {
        text = `${text} (${c.name}: ${c.description})`;
      }
    });

    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    let targetCount = 1;
    if (countMode === 'Auto') {
      targetCount = sentences.length > 1 ? Math.min(sentences.length, 8) : 1;
    } else {
      targetCount = Number(countMode);
    }

    const totalSeconds = durMode === 'Auto' ? targetCount * 6 : manualSecs;
    const perSceneSec = Math.max(3, Math.round(totalSeconds / targetCount));

    const generated = [];
    for (let i = 0; i < targetCount; i++) {
      const baseLine = sentences[i % sentences.length] || text;
      const cameraHint =
        i % 3 === 0 ? 'wide establishing shot' : i % 3 === 1 ? 'medium tracking shot' : 'close-up cinematic angle';
      const fullScenePrompt =
        targetCount > 1 && sentences.length === 1
          ? `${baseLine}, ${cameraHint}, ${style} style`
          : `${baseLine}, ${style} style`;
      const seed = Math.floor(Math.random() * 999999) + i * 17;
      generated.push({
        id: Date.now() + i,
        duration: perSceneSec,
        prompt: fullScenePrompt,
        imageUrl: buildAiImageUrl(fullScenePrompt, style, seed),
        videoUrl: null,
        seed
      });
    }
    return generated;
  };

  // Initialize default scene on first load
  useEffect(() => {
    if (scenes.length === 0) {
      const initial = parseScenesFromPrompt(prompt, selectedStyle, durationMode, selectedDuration, sceneCountMode);
      setScenes(initial);
      if (initial[0]?.imageUrl) {
        preloadImage(initial[0].imageUrl);
      }
    }
  }, []);

  // Generate Scenes & Media (AI Storyboard Image or Fal.ai Cloud Video)
  const handleGenerateScenes = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setIsPlaying(false);
    setRenderedVideoUrl(null);
    setGenerationStatus('Breaking prompt into cinematic storyboard scenes...');

    const newScenes = parseScenesFromPrompt(prompt, selectedStyle, durationMode, selectedDuration, sceneCountMode);
    setScenes(newScenes);
    setActiveSceneIdx(0);

    try {
      if (engineMode === 'fal-video' && falApiKey.trim()) {
        // Real Cloud AI Video Generation via Fal.ai Queue/Sync REST API
        for (let i = 0; i < newScenes.length; i++) {
          setGenerationStatus(`Generating real AI video clip ${i + 1} of ${newScenes.length} via Fal.ai...`);
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
                continue;
              }
            }
          } catch (err) {
            console.warn('Fal.ai request fallback to AI image:', err);
          }
          // Fallback to AI illustration if API call fails or credits exhausted
          await preloadImage(newScenes[i].imageUrl);
        }
      } else {
        // Free AI-Illustrated Storyboard Mode (Pollinations FLUX/Diffusion Image + Ken Burns Camera Motion)
        for (let i = 0; i < newScenes.length; i++) {
          setGenerationStatus(`Rendering AI artwork for Scene ${i + 1} of ${newScenes.length}...`);
          await preloadImage(newScenes[i].imageUrl);
        }
      }
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
      setIsPlaying(true);
      playStartTimeRef.current = performance.now();
    }
  };

  // Regenerate single scene artwork
  const handleRegenerateScene = async (index) => {
    const updated = [...scenes];
    const newSeed = Math.floor(Math.random() * 999999);
    const newUrl = buildAiImageUrl(updated[index].prompt, selectedStyle, newSeed);
    updated[index] = { ...updated[index], seed: newSeed, imageUrl: newUrl, videoUrl: null };
    setScenes(updated);
    setGenerationStatus(`Refreshing artwork for Scene ${index + 1}...`);
    await preloadImage(newUrl);
    setGenerationStatus('');
  };

  // Draw a single frame onto the HTML5 Canvas (supports AI Images with Ken Burns motion + Petals/Particles + Procedural Fallback)
  const drawFrameToCanvas = (ctx, width, height, scene, localTimeSec, sceneIndex) => {
    ctx.clearRect(0, 0, width, height);

    const img = scene?.imageUrl ? loadedImagesRef.current[scene.imageUrl] : null;
    const progress = Math.min(1, Math.max(0, localTimeSec / Math.max(1, scene?.duration || 6)));

    if (img && img.complete && img.naturalWidth > 0) {
      // Smooth Ken Burns cinematic pan & zoom over the AI-generated illustration
      const zoom = 1.0 + progress * 0.12;
      const panX = (sceneIndex % 2 === 0 ? -1 : 1) * progress * 24;
      const panY = -progress * 12;

      const drawW = width * zoom;
      const drawH = height * zoom;
      const offsetX = (width - drawW) / 2 + panX;
      const offsetY = (height - drawH) / 2 + panY;

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      // Subtle atmospheric particles (e.g., cherry blossom petals or dust motes)
      const isBlossom = /cherry|blossom|flower|petal|spring|sakura/i.test(scene.prompt);
      const particleCount = isBlossom ? 28 : 14;
      for (let p = 0; p < particleCount; p++) {
        const speed = 28 + (p % 5) * 11;
        const px = ((p * 97 + localTimeSec * (18 + (p % 4) * 9) + Math.sin(localTimeSec * 1.5 + p) * 25) % (width + 40)) - 20;
        const py = ((p * 61 + localTimeSec * speed) % (height + 40)) - 20;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(localTimeSec * 1.4 + p);
        ctx.fillStyle = isBlossom ? 'rgba(255, 214, 231, 0.82)' : 'rgba(255, 255, 255, 0.28)';
        ctx.beginPath();
        ctx.ellipse(0, 0, isBlossom ? 5 : 2.5, isBlossom ? 3 : 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      // Procedural gradient + landscape fallback while AI image loads
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#6b21a8');
      grad.addColorStop(1, '#ea580c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Sun / Moon glow
      const sunX = width * 0.32 + progress * 25;
      const sunY = height * 0.42 - progress * 10;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 130);
      sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      sunGlow.addColorStop(0.4, 'rgba(251, 146, 60, 0.45)');
      sunGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 130, 0, Math.PI * 2);
      ctx.fill();

      // Silhouetted hills
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height * 0.72);
      ctx.quadraticCurveTo(width * 0.28, height * 0.52, width * 0.55, height * 0.76);
      ctx.quadraticCurveTo(width * 0.8, height * 0.58, width, height * 0.74);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Falling petals
      for (let p = 0; p < 24; p++) {
        const px = ((p * 83 + localTimeSec * 32 + Math.sin(localTimeSec * 2 + p) * 18) % width);
        const py = ((p * 53 + localTimeSec * 45) % height);
        ctx.fillStyle = 'rgba(255, 228, 230, 0.75)';
        ctx.beginPath();
        ctx.ellipse(px, py, 4, 2.5, localTimeSec + p, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Subtle top badge overlay
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.fillRect(16, 16, 190, 28);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.fillText(`SCENE ${sceneIndex + 1} • ${selectedStyle.toUpperCase()}`, 26, 34);
  };

  // Animation loop for interactive preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || scenes.length === 0) return;
    const ctx = canvas.getContext('2d');

    if (!isPlaying) {
      drawFrameToCanvas(ctx, canvas.width, canvas.height, scenes[activeSceneIdx] || scenes[0], 0.5, activeSceneIdx);
      return;
    }

    playStartTimeRef.current = performance.now();
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
      drawFrameToCanvas(ctx, canvas.width, canvas.height, scenes[currentIdx], localSec, currentIdx);
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, scenes, activeSceneIdx, selectedStyle]);

  // Combine & Export Video File via MediaRecorder
  const handleCombineAndRender = async () => {
    const canvas = canvasRef.current;
    if (!canvas || scenes.length === 0) return;

    setIsPlaying(false);
    setIsRendering(true);
    setRenderProgress(0);
    setRenderedVideoUrl(null);

    // Ensure all scene images are preloaded before recording
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].imageUrl && !loadedImagesRef.current[scenes[i].imageUrl]) {
        await preloadImage(scenes[i].imageUrl);
      }
    }

    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(24);
    const mimeType = MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    setRenderExtension(mimeType.includes('mp4') ? 'mp4' : 'webm');

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3500000 });
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRenderedVideoUrl(url);
      setIsRendering(false);
      setRenderProgress(100);
    };

    recorder.start();

    // Cap real-time export duration to max 30s if user picked multi-minute storyboard so browser doesn't freeze
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

  // Save current project locally
  const handleSaveProject = () => {
    const title = projectTitle.trim() || prompt.slice(0, 36) || 'Untitled Video';
    const item = {
      id: Date.now(),
      title,
      prompt,
      style: selectedStyle,
      scenes,
      createdAt: new Date().toLocaleDateString()
    };
    setSavedProjects([item, ...savedProjects]);
    alert(`Saved "${title}" to My Projects!`);
  };

  // PIN Lock Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mx-auto mb-5">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2">My AI Video Studio</h1>
          <p className="text-sm text-slate-400 text-center mb-6">
            Enter your Owner PIN to unlock video generation (Default PIN: <span className="text-indigo-400 font-mono">2026</span>)
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

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0f1524] border-b md:border-b-0 md:border-r border-slate-800/80 p-4 flex flex-col justify-between">
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
                : 'AI Storyboard + Motion'}
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

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Left Column: Prompt & Controls */}
            <div className="lg:col-span-5 bg-[#111827] border border-slate-800/90 rounded-2xl p-5 space-y-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-indigo-400" /> Prompt & Generation Settings
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Describe your scene in detail. Click <strong className="text-indigo-300">Generate AI Visuals</strong> to create scene artwork or video clips.
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
                rows={4}
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

              {/* Duration Mode */}
              <div>
                <div className="flex items-center justify-between mb-2">
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
              </div>

              {/* Scene Count */}
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

              {/* Primary Generate Button */}
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

            {/* Right Column: Live Preview & Storyboard Editor */}
            <div className="lg:col-span-7 space-y-6">
              {/* Video Preview Card */}
              <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-200 truncate max-w-md">
                    <Film className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{prompt || 'Untitled Video'}</span>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {scenes.length} {scenes.length === 1 ? 'Scene' : 'Scenes'} • {totalDurationSeconds}s • 24 FPS
                  </span>
                </div>

                {/* Canvas or Real Cloud Video Player */}
                <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video">
                  {scenes[activeSceneIdx]?.videoUrl ? (
                    <video
                      src={scenes[activeSceneIdx].videoUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <canvas
                      ref={canvasRef}
                      width={960}
                      height={540}
                      className="w-full h-full object-cover block"
                    />
                  )}

                  {isGenerating && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                      <p className="text-sm font-semibold text-white">{generationStatus}</p>
                      <p className="text-xs text-slate-400 mt-1">Creating high-resolution visuals from your prompt...</p>
                    </div>
                  )}
                </div>

                {/* Preview & Export Controls */}
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
                    {isRendering ? `Rendering Video (${renderProgress}%)...` : 'Combine & Render Video'}
                  </button>
                </div>

                {/* Download Ready Banner */}
                {renderedVideoUrl && (
                  <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-200">Your video file is rendered and ready!</p>
                        <p className="text-[11px] text-emerald-400/80">Click download to save it directly to your device.</p>
                      </div>
                    </div>
                    <a
                      href={renderedVideoUrl}
                      download={`${(projectTitle || 'ai-video-studio').toLowerCase().replace(/\s+/g, '-')}.${renderExtension}`}
                      className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Video (.{renderExtension.toUpperCase()})
                    </a>
                  </div>
                )}
              </div>

              {/* Scene Storyboard Editor */}
              <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Scene Storyboard Editor</h3>
                  <button
                    onClick={() => {
                      const seed = Math.floor(Math.random() * 999999);
                      const newScene = {
                        id: Date.now(),
                        duration: 6,
                        prompt: `${prompt}, ${selectedStyle} style`,
                        imageUrl: buildAiImageUrl(prompt, selectedStyle, seed),
                        videoUrl: null,
                        seed
                      };
                      setScenes([...scenes, newScene]);
                      preloadImage(newScene.imageUrl);
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
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        activeSceneIdx === idx
                          ? 'bg-[#161f33] border-indigo-500/70'
                          : 'bg-[#0b0f19] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-indigo-400">
                          Scene {idx + 1} ({scene.duration}s)
                        </span>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleRegenerateScene(idx)}
                            title="Regenerate AI Image"
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

                      <div className="flex gap-3 items-center">
                        {scene.imageUrl && (
                          <img
                            src={scene.imageUrl}
                            alt={`Scene ${idx + 1}`}
                            className="w-20 h-12 object-cover rounded-lg border border-slate-700 shrink-0 bg-slate-900"
                          />
                        )}
                        <input
                          type="text"
                          value={scene.prompt}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const copy = [...scenes];
                            copy[idx].prompt = e.target.value;
                            setScenes(copy);
                          }}
                          className="w-full bg-[#111827] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Characters Tab */}
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
                setCharacters([...characters, { id: Date.now(), name: newCharName.trim(), description: newCharDesc.trim() }]);
                setNewCharName('');
                setNewCharDesc('');
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Save Character
            </button>

            <div className="space-y-2.5">
              {characters.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-[#0b0f19] border border-slate-800 flex items-center justify-between">
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

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="max-w-4xl mx-auto bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">Saved Video Projects</h2>
            {savedProjects.length === 0 ? (
              <p className="text-sm text-slate-400">No saved projects yet. Click "Save Project" in Create Video to store your storyboards.</p>
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
                      <span className="text-[11px] text-indigo-400">{proj.scenes.length} Scenes • {proj.style}</span>
                      <button
                        onClick={() => {
                          setProjectTitle(proj.title);
                          setPrompt(proj.prompt);
                          setSelectedStyle(proj.style);
                          setScenes(proj.scenes);
                          proj.scenes.forEach((s) => preloadImage(s.imageUrl));
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

        {/* Settings & AI Engine Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" /> AI Video & Image Generation Engine
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose between free built-in AI scene artwork with camera motion, or connect a Cloud Video API key for full text-to-video diffusion.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setEngineMode('ai-storyboard')}
                className={`p-4 rounded-xl border text-left transition ${
                  engineMode === 'ai-storyboard'
                    ? 'bg-indigo-600/15 border-indigo-500'
                    : 'bg-[#0b0f19] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-white mb-1">
                  <ImageIcon className="w-4 h-4 text-indigo-400" /> Free AI Artwork + Motion (Default)
                </div>
                <p className="text-xs text-slate-400">
                  Generates custom AI illustrations for every prompt scene with smooth Ken Burns camera motion & particle effects. No API key required.
                </p>
              </button>

              <button
                onClick={() => setEngineMode('fal-video')}
                className={`p-4 rounded-xl border text-left transition ${
                  engineMode === 'fal-video'
                    ? 'bg-indigo-600/15 border-indigo-500'
                    : 'bg-[#0b0f19] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-white mb-1">
                  <VideoIcon className="w-4 h-4 text-emerald-400" /> Cloud AI Video (Fal.ai API)
                </div>
                <p className="text-xs text-slate-400">
                  Connect your Fal.ai API key to generate true neural text-to-video clips (Wan 2.1, Minimax, Luma) directly from Vercel.
                </p>
              </button>
            </div>

            {engineMode === 'fal-video' && (
              <div className="p-4 rounded-xl bg-[#0b0f19] border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" /> Fal.ai API Key
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
                    <option value="fal-ai/wan-t2v">Wan 2.1 Text-to-Video (Fast & High Quality)</option>
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
