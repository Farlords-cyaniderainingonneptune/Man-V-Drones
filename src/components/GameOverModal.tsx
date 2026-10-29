import React from 'react';
import { EnvironmentType, GameStats } from '../types';
import { RotateCcw, Compass, ArrowUpCircle, Trophy, Crosshair, Target } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  env: EnvironmentType;
  killBreakdown: Record<string, number>;
  onRestart: () => void;
  onChangeEnv: () => void;
  onOpenArmory: () => void;
  onOpenLeaderboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  env,
  killBreakdown,
  onRestart,
  onChangeEnv,
  onOpenArmory,
  onOpenLeaderboard,
}) => {
  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-zinc-950 border border-red-900/60 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="bg-gradient-to-b from-red-950/60 to-zinc-900 border-b border-red-900/40 px-6 py-5 text-center">
          <span className="text-red-500 font-mono text-xs tracking-widest uppercase font-bold block mb-1">
            POSITION OVERRUN • COMBAT DEBRIEF
          </span>
          <h2 className="text-2xl font-black text-zinc-100 tracking-wider font-mono">MISSION TERMINATED</h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            {env === 'truck_forest' ? 'Forest Convoy Ambush' : 'Trench Perimeter Breach'}
          </p>
        </div>

        {/* Score and Stats */}
        <div className="p-6 space-y-4">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
            <span className="text-xs text-zinc-400 font-mono uppercase block">Total Points Earned</span>
            <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">
              {stats.score.toLocaleString()} PTS
            </span>
            <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-zinc-800/80 text-xs font-mono">
              <div>
                <span className="text-zinc-500 block">Waves Defended:</span>
                <span className="text-zinc-200 font-bold">{stats.wave}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Total Drones Downed:</span>
                <span className="text-zinc-200 font-bold">{stats.kills}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Accuracy:</span>
                <span className="text-amber-400 font-bold">{accuracy}%</span>
              </div>
            </div>
          </div>

          {/* Kill Breakdown */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 text-xs font-mono">
            <span className="text-zinc-400 uppercase font-semibold block mb-2">Hostile Target Breakdown:</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-800/80">
                <span className="text-red-400">FPV Kamikaze:</span>
                <span className="font-bold text-zinc-200">{killBreakdown.fpv_kamikaze || 0}</span>
              </div>
              <div className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-800/80">
                <span className="text-amber-400">Baba Yaga Bomber:</span>
                <span className="font-bold text-zinc-200">{killBreakdown.baba_yaga || 0}</span>
              </div>
              <div className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-800/80">
                <span className="text-blue-400">Mavic Scout:</span>
                <span className="font-bold text-zinc-200">{killBreakdown.scout_quad || 0}</span>
              </div>
              <div className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-800/80">
                <span className="text-emerald-400">Tracked UGV:</span>
                <span className="font-bold text-zinc-200">{killBreakdown.ground_ugv || 0}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={onRestart}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono rounded-lg transition-colors shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Redeploy Immediately
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onOpenArmory}
                className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400" /> Armory
              </button>
              <button
                onClick={onChangeEnv}
                className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" /> Map Select
              </button>
              <button
                onClick={onOpenLeaderboard}
                className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Scores
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
