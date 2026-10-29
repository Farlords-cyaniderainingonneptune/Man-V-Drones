import React from 'react';
import { WeaponConfig, WeaponId } from '../types';
import { Crosshair, ShieldAlert, Zap, Target, ArrowUpCircle, Lock, Check } from 'lucide-react';

interface WeaponShopModalProps {
  weapons: Record<string, WeaponConfig>;
  points: number;
  activeWeaponId: WeaponId;
  onUpgrade: (weaponId: WeaponId) => void;
  onSwitch: (weaponId: WeaponId) => void;
  onClose: () => void;
}

export const WeaponShopModal: React.FC<WeaponShopModalProps> = ({
  weapons,
  points,
  activeWeaponId,
  onUpgrade,
  onSwitch,
  onClose,
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'rifle':
        return <Crosshair className="w-5 h-5 text-amber-400" />;
      case 'shotgun':
        return <ShieldAlert className="w-5 h-5 text-orange-400" />;
      case 'laser':
        return <Zap className="w-5 h-5 text-cyan-400" />;
      case 'flak':
        return <Target className="w-5 h-5 text-red-400" />;
      default:
        return <Crosshair className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-xl font-bold tracking-wider text-zinc-100 uppercase font-mono">
                Armory & Weapon Upgrades
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Down drones to earn points and upgrade tactical kinetic, energy, and flak weapons.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-zinc-900 border border-amber-500/40 px-4 py-1.5 rounded-lg flex items-center gap-2">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">Available Points:</span>
              <span className="text-lg font-bold text-amber-400 font-mono">{points.toLocaleString()} PTS</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors border border-zinc-700"
            >
              Resume Game
            </button>
          </div>
        </div>

        {/* Weapons List */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
          {(Object.values(weapons) as WeaponConfig[]).map((w) => {
            const isUnlocked = w.unlocked;
            const isMax = w.currentLevel >= w.maxLevel;
            const upgradeCost = !isUnlocked ? w.unlockCost : isMax ? 0 : w.upgradeCosts[w.currentLevel - 1];
            const canAfford = points >= upgradeCost;
            const isActive = activeWeaponId === w.id;

            return (
              <div
                key={w.id}
                className={`border rounded-xl p-5 flex flex-col justify-between transition-all ${
                  isActive
                    ? 'border-amber-500/80 bg-zinc-900/90 ring-1 ring-amber-500/30'
                    : isUnlocked
                    ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                    : 'border-zinc-800/60 bg-zinc-950/60 opacity-85'
                }`}
              >
                <div>
                  {/* Title Bar */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-zinc-800 rounded-lg border border-zinc-700">{getIcon(w.id)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-zinc-100 font-mono text-base">{w.name}</h3>
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                              EQUIPPED
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400 font-mono">{w.category}</span>
                      </div>
                    </div>

                    {isUnlocked ? (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((lvl) => (
                          <div
                            key={lvl}
                            className={`w-2.5 h-6 rounded-sm border ${
                              lvl <= w.currentLevel
                                ? 'bg-amber-500 border-amber-400'
                                : 'bg-zinc-800 border-zinc-700'
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">{w.description}</p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-950/70 p-3 rounded-lg border border-zinc-800/80 mb-4 text-xs font-mono">
                    <div>
                      <span className="text-zinc-500 block">Firepower / DMG:</span>
                      <span className="text-zinc-200 font-semibold">{w.damage}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Magazine:</span>
                      <span className="text-zinc-200 font-semibold">{w.maxAmmo} rounds</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Fire Rate:</span>
                      <span className="text-zinc-200 font-semibold">{w.fireRate}/s</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">{w.id === 'laser' ? 'Cooling Rate:' : 'Reload Speed:'}</span>
                      <span className="text-zinc-200 font-semibold">{w.reloadTime}s</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                  {isUnlocked && !isActive && (
                    <button
                      onClick={() => onSwitch(w.id as WeaponId)}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors border border-zinc-700"
                    >
                      Equip
                    </button>
                  )}

                  {!isUnlocked ? (
                    <button
                      onClick={() => onUpgrade(w.id as WeaponId)}
                      disabled={!canAfford}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold font-mono transition-all ${
                        canAfford
                          ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg shadow-amber-600/20'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" /> Unlock Weapon ({upgradeCost} PTS)
                    </button>
                  ) : isMax ? (
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg">
                      <Check className="w-4 h-4" /> MAX LEVEL REACHED
                    </div>
                  ) : (
                    <button
                      onClick={() => onUpgrade(w.id as WeaponId)}
                      disabled={!canAfford}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold font-mono transition-all ${
                        canAfford
                          ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg shadow-amber-600/20'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      }`}
                    >
                      <ArrowUpCircle className="w-4 h-4" /> Upgrade to Level {w.currentLevel + 1} ({upgradeCost} PTS)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
