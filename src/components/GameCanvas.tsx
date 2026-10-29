import React, { useEffect, useRef, useState } from 'react';
import { EnvironmentType, WeaponConfig, WeaponId } from '../types';
import { GameEngine } from '../game/gameEngine';
import { GameRenderer } from '../game/renderer';
import { soundManager } from '../audio/soundManager';
import {
  Volume2,
  VolumeX,
  Pause,
  ArrowUpCircle,
  Crosshair,
  ShieldAlert,
  Zap,
  Target,
  Compass,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface GameCanvasProps {
  environment: EnvironmentType;
  onOpenArmory: () => void;
  onGameOver: (stats: any, killBreakdown: any) => void;
  onExitToMenu: () => void;
  engineRef: React.MutableRefObject<GameEngine | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  environment,
  onOpenArmory,
  onGameOver,
  onExitToMenu,
  engineRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [soundOn, setSoundOn] = useState(soundManager.isEnabled());
  const [isPaused, setIsPaused] = useState(false);
  const [, setTick] = useState(0); // Force UI update
  const forceUpdate = () => setTick((t) => (t + 1) % 10000);

  // Initialize Game Engine & Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = new GameEngine(environment, width, height);
    const renderer = new GameRenderer(ctx);
    renderer.setDimensions(width, height);

    engineRef.current = engine;
    rendererRef.current = renderer;

    engine.onStateChange = forceUpdate;
    engine.onGameOver = () => {
      onGameOver(engine.stats, engine.killBreakdown);
    };

    // Handle Resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && canvas) {
          canvas.width = newW;
          canvas.height = newH;
          engine.setDimensions(newW, newH);
          renderer.setDimensions(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Main 60FPS Game Loop
    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      if (!isPaused) {
        engine.update(dt);
      }

      // Render Scene
      const activeWeapon = engine.getActiveWeapon();
      renderer.renderScene(
        engine.env,
        engine.drones,
        engine.droppedBombs,
        engine.projectiles,
        engine.particles,
        engine.floatingTexts,
        activeWeapon,
        engine.aimX,
        engine.aimY,
        engine.isMouseDown,
        engine.recoilY,
        engine.recoilX,
        engine.stats.isCrouching,
        engine.stats.leanOffset,
        engine.stats.adsZoom,
        engine.stats.playerHp,
        engine.stats.playerMaxHp,
        engine.env === 'truck_forest' ? 14 : 0,
        time / 1000
      );

      animationFrameId.current = requestAnimationFrame(loop);
    };
    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      resizeObserver.disconnect();
      soundManager.stopAll();
    };
  }, [environment]);

  // Keyboard & Mouse Listeners
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();

      if (key === 'a' || e.key === 'ArrowLeft') {
        engine.stats.leanOffset = -0.6;
      } else if (key === 'd' || e.key === 'ArrowRight') {
        engine.stats.leanOffset = 0.6;
      } else if (key === 's' || key === 'c' || e.key === 'ArrowDown') {
        engine.stats.isCrouching = true;
        engine.addFloatingText('CROUCHED IN COVER', engine.width / 2, engine.height * 0.45, '#10b981', 14);
      } else if (key === 'w' || e.key === 'ArrowUp') {
        engine.stats.isCrouching = false;
      } else if (key === 'r') {
        engine.reloadActiveWeapon();
      } else if (key === '1') {
        engine.switchWeapon('rifle');
      } else if (key === '2') {
        engine.switchWeapon('shotgun');
      } else if (key === '3') {
        engine.switchWeapon('laser');
      } else if (key === '4') {
        engine.switchWeapon('flak');
      } else if (key === ' ' || e.code === 'Space') {
        e.preventDefault();
        engine.triggerCountermeasure();
      } else if (key === 'tab' || key === 'b') {
        e.preventDefault();
        onOpenArmory();
      } else if (key === 'p' || key === 'escape') {
        setIsPaused((p) => !p);
      } else if (key === 'm') {
        const next = !soundManager.isEnabled();
        soundManager.setEnabled(next);
        setSoundOn(next);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'd' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        engine.stats.leanOffset = 0;
      } else if (key === 's' || key === 'c' || e.key === 'ArrowDown') {
        engine.stats.isCrouching = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engineRef.current, onOpenArmory]);

  // Mouse Input on Canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    if (!engine) return;
    const rect = e.currentTarget.getBoundingClientRect();
    engine.aimX = e.clientX - rect.left;
    engine.aimY = e.clientY - rect.top;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (e.button === 0) {
      // Left click fire
      engine.isMouseDown = true;
      engine.fireWeapon();
    } else if (e.button === 2) {
      // Right click ADS Zoom
      e.preventDefault();
      engine.stats.adsZoom = !engine.stats.adsZoom;
      forceUpdate();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (e.button === 0) {
      engine.isMouseDown = false;
    }
  };

  const toggleSound = () => {
    const next = !soundOn;
    soundManager.setEnabled(next);
    setSoundOn(next);
  };

  const engine = engineRef.current;
  const activeWeapon = engine ? engine.getActiveWeapon() : null;
  const hpPercent = engine ? Math.max(0, (engine.stats.playerHp / engine.stats.playerMaxHp) * 100) : 100;
  const jammerPercent = engine ? Math.round(engine.stats.countermeasureCooldown) : 100;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden select-none cursor-crosshair font-mono"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full block"
      />

      {/* --- HUD OVERLAYS --- */}

      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-start justify-between pointer-events-none z-20">
        {/* Left: Wave & Mission Status */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 backdrop-blur-md px-3.5 py-1.5 rounded-lg shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-sm font-black tracking-wider text-zinc-100 uppercase">
              WAVE {engine?.stats.wave || 1}
            </span>
            <span className="text-xs text-zinc-400">
              | {engine?.drones.length || 0} IN AIR
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 bg-zinc-950/70 border border-zinc-800/80 px-2.5 py-1 rounded">
            {environment === 'truck_forest' ? 'FOREST CONVOY' : 'TRENCH DEFENSE'}
          </div>
        </div>

        {/* Center: Threat Radar / Compass */}
        <div className="flex flex-col items-center pointer-events-auto">
          <div className="bg-zinc-950/85 border border-zinc-800 backdrop-blur-md px-5 py-2 rounded-xl shadow-xl flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-bold">
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span>Hostile Radar Azimuth</span>
            </div>

            {/* Radar Line Strip */}
            <div className="relative w-48 h-5 bg-zinc-900 rounded border border-zinc-800 flex items-center overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-zinc-700" />
              {engine?.drones.map((d) => {
                const normPos = Math.max(0.05, Math.min(0.95, d.x));
                const isVeryClose = d.z < 0.3;
                const dotColor =
                  d.type === 'fpv_kamikaze'
                    ? '#ef4444'
                    : d.type === 'baba_yaga'
                    ? '#eab308'
                    : d.type === 'ground_ugv'
                    ? '#10b981'
                    : '#38bdf8';

                return (
                  <div
                    key={d.id}
                    style={{ left: `${normPos * 100}%`, backgroundColor: dotColor }}
                    className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full -translate-x-1/2 ${
                      isVeryClose ? 'animate-ping' : ''
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Wave Alert Banner */}
          {engine && engine.waveAlertAlpha > 0 && (
            <div
              style={{ opacity: engine.waveAlertAlpha }}
              className="mt-3 bg-red-950/90 border border-red-600/80 px-6 py-2 rounded-xl text-center shadow-2xl animate-pulse"
            >
              <div className="text-red-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                {engine.waveAlertText}
              </div>
            </div>
          )}
        </div>

        {/* Right: Score, Points & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-zinc-950/85 border border-zinc-800 backdrop-blur-md px-4 py-1.5 rounded-lg text-right shadow-lg">
            <span className="text-[10px] text-zinc-400 block uppercase">Points / Scrap</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              {engine?.stats.points.toLocaleString() || 0} PTS
            </span>
          </div>

          {/* Combo Multiplier */}
          {engine && engine.stats.streak >= 4 && (
            <div className="bg-amber-500/20 border border-amber-500/50 px-2.5 py-1.5 rounded-lg text-amber-400 text-xs font-bold animate-pulse">
              STREAK x{engine.stats.streak >= 15 ? '3.0' : engine.stats.streak >= 8 ? '2.0' : '1.5'}
            </div>
          )}

          <button
            onClick={onOpenArmory}
            className="p-2 bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/40 text-amber-400 rounded-lg transition-colors"
            title="Armory & Upgrades (Tab)"
          >
            <ArrowUpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={toggleSound}
            className="p-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition-colors"
            title="Toggle Sound (M)"
          >
            {soundOn ? <Volume2 className="w-5 h-5 text-zinc-200" /> : <VolumeX className="w-5 h-5 text-zinc-500" />}
          </button>

          <button
            onClick={onExitToMenu}
            className="p-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition-colors"
            title="Exit to Briefing Menu"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Control Bar & Weapon HUD */}
      <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between pointer-events-none z-20">
        {/* Left: Health & Defensive Cover */}
        <div className="bg-zinc-950/85 border border-zinc-800 backdrop-blur-md p-4 rounded-xl shadow-xl w-64 pointer-events-auto space-y-2.5">
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-zinc-400 font-bold uppercase">Armor Integrity</span>
              <span
                className={`font-bold ${
                  hpPercent > 50 ? 'text-emerald-400' : hpPercent > 25 ? 'text-amber-400' : 'text-red-400'
                }`}
              >
                {Math.round(engine?.stats.playerHp || 0)} / {engine?.stats.playerMaxHp || 100}
              </span>
            </div>
            {/* Health Bar */}
            <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                style={{ width: `${hpPercent}%` }}
                className={`h-full transition-all duration-150 ${
                  hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
                }`}
              />
            </div>
          </div>

          {/* EW Jammer Bar */}
          <div>
            <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-0.5">
              <span>EW JAMMER [SPACE]</span>
              <span className={jammerPercent >= 100 ? 'text-cyan-400 font-bold' : 'text-zinc-500'}>
                {jammerPercent >= 100 ? 'READY' : `${jammerPercent}%`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                style={{ width: `${jammerPercent}%` }}
                className={`h-full ${jammerPercent >= 100 ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-zinc-600'}`}
              />
            </div>
          </div>

          {/* Cover Stance */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[11px]">
            <span className="text-zinc-500">STANCE [W / S]:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[10px] border ${
                engine?.stats.isCrouching
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              {engine?.stats.isCrouching ? 'CROUCH (IN COVER)' : 'STANDING (EXPOSED)'}
            </span>
          </div>
        </div>

        {/* Center: Weapons Selector (1-4) */}
        <div className="bg-zinc-950/85 border border-zinc-800 backdrop-blur-md p-2 rounded-xl shadow-xl flex items-center gap-2 pointer-events-auto">
          {engine &&
            (Object.values(engine.weapons) as WeaponConfig[]).map((w, idx) => {
              const hotkey = idx + 1;
              const isActive = engine.activeWeaponId === w.id;
              const isUnlocked = w.unlocked;

              return (
                <button
                  key={w.id}
                  onClick={() => engine.switchWeapon(w.id as WeaponId)}
                  disabled={!isUnlocked}
                  className={`relative px-3 py-2 rounded-lg border flex flex-col items-center min-w-[76px] transition-all ${
                    isActive
                      ? 'border-amber-500 bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40'
                      : isUnlocked
                      ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                      : 'border-zinc-800/50 bg-zinc-950/40 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[10px] font-bold text-zinc-500 absolute top-1 left-1.5">{hotkey}</span>
                  <div className="my-0.5">
                    {w.id === 'rifle' && <Crosshair className="w-4 h-4" />}
                    {w.id === 'shotgun' && <ShieldAlert className="w-4 h-4" />}
                    {w.id === 'laser' && <Zap className="w-4 h-4" />}
                    {w.id === 'flak' && <Target className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] font-bold truncate max-w-[68px]">
                    {isUnlocked ? w.name.split(' ')[0] : 'LOCKED'}
                  </span>
                  {isUnlocked && (
                    <span className="text-[9px] text-zinc-400">
                      L{w.currentLevel} • {w.id === 'laser' ? `${Math.round(w.heat || 0)}°` : `${w.ammo}`}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Right: Active Gun Ammo & Sights Status */}
        <div className="bg-zinc-950/85 border border-zinc-800 backdrop-blur-md p-4 rounded-xl shadow-xl w-60 pointer-events-auto text-right">
          <div className="text-xs text-zinc-400 font-bold uppercase">{activeWeapon?.name}</div>

          {activeWeapon?.id === 'laser' ? (
            <div className="mt-1">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Thermal Load:</span>
                <span
                  className={`font-bold ${
                    activeWeapon.isOverheating
                      ? 'text-red-500 animate-pulse'
                      : (activeWeapon.heat || 0) > 60
                      ? 'text-amber-400'
                      : 'text-cyan-400'
                  }`}
                >
                  {activeWeapon.isOverheating ? 'OVERHEATED' : `${Math.round(activeWeapon.heat || 0)}%`}
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded border border-zinc-800 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, activeWeapon.heat || 0)}%` }}
                  className={`h-full ${
                    activeWeapon.isOverheating
                      ? 'bg-red-500'
                      : (activeWeapon.heat || 0) > 60
                      ? 'bg-amber-500'
                      : 'bg-cyan-400'
                  }`}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-baseline justify-end gap-1.5 mt-1">
              <span
                className={`text-3xl font-black ${
                  (activeWeapon?.ammo || 0) <= 5 ? 'text-red-500 animate-pulse' : 'text-zinc-100'
                }`}
              >
                {activeWeapon?.ammo}
              </span>
              <span className="text-zinc-500 text-sm">/ {activeWeapon?.maxAmmo}</span>
            </div>
          )}

          {/* Reload Status or ADS Mode */}
          <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">SIGHTS [R-CLICK]:</span>
            <span
              className={`font-bold ${engine?.stats.adsZoom ? 'text-emerald-400' : 'text-zinc-400'}`}
            >
              {engine?.stats.adsZoom ? 'ADS ZOOM (ON)' : 'STANDARD'}
            </span>
          </div>

          {engine?.isReloading && (
            <div className="text-amber-400 text-xs font-bold animate-pulse mt-1">RELOADING...</div>
          )}
        </div>
      </div>
    </div>
  );
};
