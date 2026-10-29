import React, { useState } from 'react';
import { EnvironmentType } from '../types';
import { profileManager, LeaderboardEntry } from '../storage/profileManager';
import { Trophy, Shield, Medal, Calendar } from 'lucide-react';

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const [filter, setFilter] = useState<'all' | EnvironmentType>('all');
  const entries: LeaderboardEntry[] = profileManager.getLeaderboard(filter === 'all' ? undefined : filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold tracking-wider text-zinc-100 uppercase font-mono">
              Top Air Defense High Scores
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors border border-zinc-700"
          >
            Close
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-6 py-2 gap-2 text-xs font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              filter === 'all'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Deployments
          </button>
          <button
            onClick={() => setFilter('truck_forest')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              filter === 'truck_forest'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Forest Convoy (Truck)
          </button>
          <button
            onClick={() => setFilter('trench_defense')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              filter === 'trench_defense'
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Trench Defense
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="p-6 overflow-y-auto space-y-2">
          {entries.map((item, idx) => {
            const isTop3 = idx < 3;
            return (
              <div
                key={item.id + idx}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all font-mono ${
                  item.isCurrentPlayer
                    ? 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30'
                    : 'border-zinc-800/80 bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 text-center font-bold text-sm ${
                      idx === 0
                        ? 'text-amber-400'
                        : idx === 1
                        ? 'text-zinc-300'
                        : idx === 2
                        ? 'text-amber-600'
                        : 'text-zinc-500'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm">
                    {item.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-100 text-sm">{item.username}</span>
                      <span className="text-xs text-zinc-400">[{item.callsign}]</span>
                      {item.isCurrentPlayer && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/40">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      {item.environment === 'truck_forest' ? 'Forest Convoy' : 'Trench Defense'} • Wave {item.wave}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-amber-400">{item.score.toLocaleString()} PTS</div>
                  <div className="text-[10px] text-zinc-500 flex items-center justify-end gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
