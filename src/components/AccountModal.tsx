import React, { useState } from 'react';
import { profileManager } from '../storage/profileManager';
import { UserAccount } from '../types';
import { User, Shield, Trophy, Award, UserPlus, CheckCircle2, ChevronRight, Crosshair, Zap, Activity, Trees } from 'lucide-react';

interface AccountModalProps {
  onClose: () => void;
  onProfileChanged: () => void;
}

const AVATAR_OPTIONS = ['🛡️', '🦅', '🎯', '⚡', '💀', '🐺', '🚀', '⚔️', '🌲', '🔥'];

const CALLSIGN_SUGGESTIONS = [
  'Vampire-1',
  'Cossack-7',
  'Falcon Eye',
  'Sky Shield',
  'Ghost Hunter',
  'Ironclad',
  'Storm Bringer',
  'Nomad-4',
];

export const AccountModal: React.FC<AccountModalProps> = ({ onClose, onProfileChanged }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'switch' | 'create'>('profile');
  const [profiles, setProfiles] = useState<UserAccount[]>(profileManager.getProfiles());
  const [activeProfile, setActiveProfile] = useState<UserAccount>(profileManager.getActiveProfile());

  // Form fields for creating account
  const [newUsername, setNewUsername] = useState('');
  const [newCallsign, setNewCallsign] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [formError, setFormError] = useState('');

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setFormError('Please enter an operator name');
      return;
    }

    const created = profileManager.createAccount(
      newUsername.trim(),
      newCallsign.trim() || 'Defender-1',
      selectedAvatar
    );

    setProfiles(profileManager.getProfiles());
    setActiveProfile(created);
    setActiveTab('profile');
    setNewUsername('');
    setNewCallsign('');
    setFormError('');
    onProfileChanged();
  };

  const handleSwitch = (id: string) => {
    profileManager.setActiveProfile(id);
    const updated = profileManager.getActiveProfile();
    setActiveProfile(updated);
    setActiveTab('profile');
    onProfileChanged();
  };

  const accuracy =
    activeProfile.careerStats.shotsFired > 0
      ? Math.round((activeProfile.careerStats.shotsHit / activeProfile.careerStats.shotsFired) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              {activeProfile.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wider text-zinc-100 uppercase font-mono">
                  {activeProfile.username} [{activeProfile.callsign}]
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Operator ID: {activeProfile.id} • Enlisted: {new Date(activeProfile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors border border-zinc-700"
          >
            Close
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-6 pt-2 gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition-all ${
              activeTab === 'profile'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Career Progression & Stats
          </button>
          <button
            onClick={() => setActiveTab('switch')}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition-all ${
              activeTab === 'switch'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Switch Account ({profiles.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition-all ${
              activeTab === 'create'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            + Create New Account
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'profile' && (
            <>
              {/* High Scores summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono mb-1">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Overall High Score</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-zinc-100">
                    {activeProfile.highScores.overall.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-1">Total Points Scored</div>
                </div>

                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono mb-1">
                    <Trees className="w-4 h-4 text-emerald-400" />
                    <span>Forest Convoy (Truck)</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {activeProfile.highScores.truck_forest.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-1">
                    Highest Wave: {activeProfile.highestWave.truck_forest}
                  </div>
                </div>

                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono mb-1">
                    <Shield className="w-4 h-4 text-orange-400" />
                    <span>Trench Defense</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-orange-400">
                    {activeProfile.highScores.trench_defense.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-1">
                    Highest Wave: {activeProfile.highestWave.trench_defense}
                  </div>
                </div>
              </div>

              {/* Combat Breakdown */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-zinc-200 uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-amber-500" />
                  Detailed Target Downings (Career)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] text-red-400 font-mono uppercase block">FPV Kamikazes</span>
                    <span className="text-xl font-bold font-mono text-zinc-100">
                      {activeProfile.careerStats.fpvKills}
                    </span>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] text-amber-400 font-mono uppercase block">Baba Yagas</span>
                    <span className="text-xl font-bold font-mono text-zinc-100">
                      {activeProfile.careerStats.babaYagaKills}
                    </span>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] text-blue-400 font-mono uppercase block">Mavic Scouts</span>
                    <span className="text-xl font-bold font-mono text-zinc-100">
                      {activeProfile.careerStats.scoutKills}
                    </span>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] text-emerald-400 font-mono uppercase block">Ground UGVs</span>
                    <span className="text-xl font-bold font-mono text-zinc-100">
                      {activeProfile.careerStats.ugvKills}
                    </span>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] text-orange-400 font-mono uppercase block">Lancets</span>
                    <span className="text-xl font-bold font-mono text-zinc-100">
                      {activeProfile.careerStats.lancetKills}
                    </span>
                  </div>
                </div>

                {/* Accuracy & Shots */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-800/80 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block">Total Kills:</span>
                    <span className="text-zinc-200 font-bold text-sm">
                      {activeProfile.careerStats.totalKills}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Shots Fired:</span>
                    <span className="text-zinc-200 font-bold text-sm">
                      {activeProfile.careerStats.shotsFired.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Marksman Accuracy:</span>
                    <span className="text-amber-400 font-bold text-sm">{accuracy}%</span>
                  </div>
                </div>
              </div>

              {/* Badges / Achievements */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-zinc-200 uppercase font-mono tracking-wider mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Decorations & Milestones
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeProfile.achievements.map((ach) => (
                    <span
                      key={ach}
                      className="px-3 py-1.5 bg-zinc-950 border border-amber-500/40 text-amber-400 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      {ach}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'switch' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 font-mono">
                Select an existing operator account to switch career progress and armory unlocks:
              </p>
              {profiles.map((p) => {
                const isActive = p.id === activeProfile.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'border-amber-500 bg-zinc-900/90'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg">
                        {p.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-200 font-mono">{p.username}</span>
                          <span className="text-xs text-amber-400 font-mono">[{p.callsign}]</span>
                        </div>
                        <span className="text-xs text-zinc-500 font-mono">
                          Best Score: {p.highScores.overall.toLocaleString()} • Kills: {p.careerStats.totalKills}
                        </span>
                      </div>
                    </div>

                    {isActive ? (
                      <span className="flex items-center gap-1 text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSwitch(p.id)}
                        className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 font-mono transition-colors"
                      >
                        Switch Account
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateAccount} className="space-y-4 max-w-lg mx-auto">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Operator Name (Username)
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. Bohdan, Taras, Sarah"
                  maxLength={18}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Tactical Callsign
                </label>
                <input
                  type="text"
                  value={newCallsign}
                  onChange={(e) => setNewCallsign(e.target.value)}
                  placeholder="e.g. Cossack-7, Vampire, Sky Shield"
                  maxLength={18}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {CALLSIGN_SUGGESTIONS.map((cs) => (
                    <button
                      type="button"
                      key={cs}
                      onClick={() => setNewCallsign(cs)}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 transition-colors"
                    >
                      {cs}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Unit Insignia / Avatar
                </label>
                <div className="flex gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      type="button"
                      key={av}
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border transition-all ${
                        selectedAvatar === av
                          ? 'border-amber-500 bg-amber-500/20 scale-105'
                          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {formError && <p className="text-xs text-red-400 font-mono">{formError}</p>}

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono rounded-lg transition-colors shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center gap-2 mt-4"
              >
                <UserPlus className="w-4 h-4" /> Create Account & Start Progression
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
