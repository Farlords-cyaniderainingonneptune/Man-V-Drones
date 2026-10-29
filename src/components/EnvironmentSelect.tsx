import React from 'react';
import { EnvironmentType, UserAccount } from '../types';
import { Truck, Shield, Trophy, Play, User, Award, ArrowUpCircle } from 'lucide-react';

interface EnvironmentSelectProps {
  activeProfile: UserAccount;
  onSelect: (env: EnvironmentType) => void;
  onOpenArmory: () => void;
  onOpenAccount: () => void;
  onOpenLeaderboard: () => void;
}

export const EnvironmentSelect: React.FC<EnvironmentSelectProps> = ({
  activeProfile,
  onSelect,
  onOpenArmory,
  onOpenAccount,
  onOpenLeaderboard,
}) => {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-lg shadow-amber-500/10">
            {activeProfile.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-100 font-mono tracking-wide">
                {activeProfile.username} [{activeProfile.callsign}]
              </span>
              <button
                onClick={onOpenAccount}
                className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded hover:bg-amber-500/20 transition-colors"
              >
                PROFILE / ACCOUNTS
              </button>
            </div>
            <div className="text-xs text-zinc-400 font-mono flex items-center gap-3 mt-0.5">
              <span>High Score: {activeProfile.highScores.overall.toLocaleString()} PTS</span>
              <span>•</span>
              <span>Drones Downed: {activeProfile.careerStats.totalKills}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenArmory}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-mono font-bold transition-all shadow-md shadow-amber-500/5"
          >
            <ArrowUpCircle className="w-4 h-4" /> ARMORY UPGRADES
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-mono font-semibold transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" /> LEADERBOARD
          </button>
        </div>
      </header>

      {/* Main Selection Area */}
      <main className="relative z-10 max-w-5xl mx-auto w-full my-auto py-8">
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-500 font-bold block mb-1">
            2D FIRST-PERSON AIR DEFENSE COMBAT
          </span>
          <h1 className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-zinc-100">
            MAN VS DRONES
          </h1>
          <p className="text-sm text-zinc-400 font-mono max-w-xl mx-auto mt-2">
            Engage hostile aerial FPVs, loitering munitions, heavy Baba Yaga bombers, and ground combat UGVs. Select your combat theater:
          </p>
        </div>

        {/* Environment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Environment 1: Back of Truck (Forest) */}
          <div
            onClick={() => onSelect('truck_forest')}
            className="group relative bg-zinc-900/70 border border-zinc-800 hover:border-emerald-500/80 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-2xl hover:shadow-emerald-950/40 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div className="absolute top-4 right-4 text-xs font-mono bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
              OPERATIONAL THEATER 1
            </div>

            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold font-mono text-zinc-100 group-hover:text-emerald-400 transition-colors">
                Forest Convoy (Back of Truck)
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-1 mb-4 leading-relaxed">
                Stationed on the flatbed of a military transport truck speeding down rutted dirt roads through dense Ukrainian pine and birch forests. Drones swoop through tree gaps and dive from high cloud cover.
              </p>

              {/* Combat Specs */}
              <div className="space-y-1.5 text-xs font-mono bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 mb-4">
                <div className="flex justify-between text-zinc-400">
                  <span>Combat Dynamic:</span>
                  <span className="text-zinc-200">Mobile Parallax Escort</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Threat Profile:</span>
                  <span className="text-red-400">FPV Kamikazes & Lancets</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Your Record Score:</span>
                  <span className="text-emerald-400 font-bold">
                    {activeProfile.highScores.truck_forest.toLocaleString()} PTS (Wave {activeProfile.highestWave.truck_forest})
                  </span>
                </div>
              </div>
            </div>

            <button className="w-full py-3 bg-zinc-800 group-hover:bg-emerald-600 text-zinc-200 group-hover:text-black font-bold font-mono text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg">
              <Play className="w-4 h-4 fill-current" /> DEPLOY TO FOREST CONVOY
            </button>
          </div>

          {/* Environment 2: Frontline Trench */}
          <div
            onClick={() => onSelect('trench_defense')}
            className="group relative bg-zinc-900/70 border border-zinc-800 hover:border-orange-500/80 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-2xl hover:shadow-orange-950/40 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div className="absolute top-4 right-4 text-xs font-mono bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded-full border border-orange-500/30">
              OPERATIONAL THEATER 2
            </div>

            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-950/60 border border-orange-700/50 flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold font-mono text-zinc-100 group-hover:text-orange-400 transition-colors">
                Frontline Trench Defense
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-1 mb-4 leading-relaxed">
                Fortified muddy trench parapet reinforced with sandbags and log revetments. Face incoming waves of aerial loitering munitions, heavy Baba Yaga bombers dropping 82mm mortars, and crawling tracked ground UGVs.
              </p>

              {/* Combat Specs */}
              <div className="space-y-1.5 text-xs font-mono bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 mb-4">
                <div className="flex justify-between text-zinc-400">
                  <span>Combat Dynamic:</span>
                  <span className="text-zinc-200">Perimeter Entrenchment</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Threat Profile:</span>
                  <span className="text-amber-400">Baba Yagas & Ground UGVs</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Your Record Score:</span>
                  <span className="text-orange-400 font-bold">
                    {activeProfile.highScores.trench_defense.toLocaleString()} PTS (Wave {activeProfile.highestWave.trench_defense})
                  </span>
                </div>
              </div>
            </div>

            <button className="w-full py-3 bg-zinc-800 group-hover:bg-orange-500 text-zinc-200 group-hover:text-black font-bold font-mono text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg">
              <Play className="w-4 h-4 fill-current" /> DEPLOY TO TRENCH DEFENSE
            </button>
          </div>
        </div>

        {/* Controls Quick Reference Banner */}
        <div className="mt-8 bg-zinc-900/50 border border-zinc-800/90 rounded-xl p-4 flex flex-wrap items-center justify-around gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-200">MOUSE</span>
            <span>Aim & Left-Click Fire</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-200">RIGHT CLICK / SHIFT</span>
            <span>Aim Down Sights (ADS Zoom)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-200">W / S</span>
            <span>Stand / Crouch Behind Cover</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-200">A / D</span>
            <span>Lean Vantage</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-200">1 - 4</span>
            <span>Switch Weapon</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-200">SPACE</span>
            <span>Jammer Pulse</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs font-mono text-zinc-500 border-t border-zinc-900 pt-4">
        Man vs Drones • 2D First-Person Air Defense Simulator
      </footer>
    </div>
  );
};
