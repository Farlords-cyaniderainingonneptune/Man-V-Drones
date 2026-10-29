import { UserAccount, WeaponId, EnvironmentType } from '../types';

const STORAGE_KEY_PROFILES = 'man_vs_drones_profiles_v1';
const STORAGE_KEY_ACTIVE_PROFILE_ID = 'man_vs_drones_active_id_v1';
const STORAGE_KEY_LEADERBOARD = 'man_vs_drones_leaderboard_v1';

export interface LeaderboardEntry {
  id: string;
  username: string;
  callsign: string;
  avatar: string;
  score: number;
  wave: number;
  environment: EnvironmentType;
  date: string;
  isCurrentPlayer?: boolean;
}

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'bot-1', username: 'Taras', callsign: 'Thunder-1', avatar: '🦅', score: 14200, wave: 11, environment: 'trench_defense', date: '2026-08-20' },
  { id: 'bot-2', username: 'Olena', callsign: 'Valkyrie', avatar: '⚡', score: 11800, wave: 9, environment: 'truck_forest', date: '2026-08-22' },
  { id: 'bot-3', username: 'Bohdan', callsign: 'Ironclad', avatar: '🛡️', score: 9500, wave: 8, environment: 'trench_defense', date: '2026-09-01' },
  { id: 'bot-4', username: 'Maksym', callsign: 'Falcon Eye', avatar: '🎯', score: 8200, wave: 7, environment: 'truck_forest', date: '2026-09-05' },
  { id: 'bot-5', username: 'Yaroslav', callsign: 'Ghost Hunter', avatar: '💀', score: 6800, wave: 6, environment: 'trench_defense', date: '2026-09-10' },
];

export class ProfileManager {
  private static instance: ProfileManager;

  private constructor() {
    this.ensureDefaultAccount();
  }

  public static getInstance(): ProfileManager {
    if (!ProfileManager.instance) {
      ProfileManager.instance = new ProfileManager();
    }
    return ProfileManager.instance;
  }

  public getProfiles(): UserAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveProfiles(profiles: UserAccount[]) {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    } catch (e) {
      console.error('Failed to save profiles', e);
    }
  }

  public getActiveProfile(): UserAccount {
    const profiles = this.getProfiles();
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_PROFILE_ID);
    if (activeId) {
      const found = profiles.find((p) => p.id === activeId);
      if (found) return found;
    }
    if (profiles.length > 0) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE_ID, profiles[0].id);
      return profiles[0];
    }
    return this.ensureDefaultAccount();
  }

  public setActiveProfile(profileId: string): boolean {
    const profiles = this.getProfiles();
    const found = profiles.find((p) => p.id === profileId);
    if (found) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE_ID, profileId);
      return true;
    }
    return false;
  }

  public createAccount(username: string, callsign: string, avatar: string, pin?: string): UserAccount {
    const profiles = this.getProfiles();
    const newProfile: UserAccount = {
      id: 'acc_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      username: username.trim() || 'Operator',
      callsign: callsign.trim() || 'Defender-1',
      avatar: avatar || '🎯',
      pin: pin ? pin.trim() : undefined,
      createdAt: new Date().toISOString(),
      highScores: {
        truck_forest: 0,
        trench_defense: 0,
        overall: 0,
      },
      highestWave: {
        truck_forest: 0,
        trench_defense: 0,
      },
      careerStats: {
        totalKills: 0,
        fpvKills: 0,
        babaYagaKills: 0,
        scoutKills: 0,
        ugvKills: 0,
        lancetKills: 0,
        shotsFired: 0,
        shotsHit: 0,
        gamesPlayed: 0,
        pointsEarned: 0,
      },
      weaponUnlocks: {
        rifle: 1,
        shotgun: 0,
        laser: 0,
        flak: 0,
      },
      achievements: ['First Enlistment'],
    };

    profiles.push(newProfile);
    this.saveProfiles(profiles);
    localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE_ID, newProfile.id);
    return newProfile;
  }

  public updateWeaponUnlock(weaponId: WeaponId, level: number) {
    const active = this.getActiveProfile();
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === active.id);
    if (index !== -1) {
      profiles[index].weaponUnlocks[weaponId] = level;
      this.saveProfiles(profiles);
    }
  }

  public recordGameResult(data: {
    environment: EnvironmentType;
    score: number;
    wave: number;
    kills: number;
    shotsFired: number;
    shotsHit: number;
    killBreakdown: Record<string, number>;
  }) {
    const active = this.getActiveProfile();
    const profiles = this.getProfiles();
    const idx = profiles.findIndex((p) => p.id === active.id);
    if (idx === -1) return;

    const p = profiles[idx];
    p.careerStats.gamesPlayed += 1;
    p.careerStats.totalKills += data.kills;
    p.careerStats.shotsFired += data.shotsFired;
    p.careerStats.shotsHit += data.shotsHit;
    p.careerStats.pointsEarned += data.score;

    if (data.killBreakdown.fpv_kamikaze) p.careerStats.fpvKills += data.killBreakdown.fpv_kamikaze;
    if (data.killBreakdown.baba_yaga) p.careerStats.babaYagaKills += data.killBreakdown.baba_yaga;
    if (data.killBreakdown.scout_quad) p.careerStats.scoutKills += data.killBreakdown.scout_quad;
    if (data.killBreakdown.ground_ugv) p.careerStats.ugvKills += data.killBreakdown.ground_ugv;
    if (data.killBreakdown.lancet_dive) p.careerStats.lancetKills += data.killBreakdown.lancet_dive;

    // High score check
    if (data.score > p.highScores[data.environment]) {
      p.highScores[data.environment] = data.score;
    }
    if (data.score > p.highScores.overall) {
      p.highScores.overall = data.score;
    }

    // High wave check
    if (data.wave > p.highestWave[data.environment]) {
      p.highestWave[data.environment] = data.wave;
    }

    // Check achievements
    if (p.careerStats.totalKills >= 50 && !p.achievements.includes('Drone Ace')) {
      p.achievements.push('Drone Ace');
    }
    if (p.careerStats.babaYagaKills >= 5 && !p.achievements.includes('Giant Slayer')) {
      p.achievements.push('Giant Slayer');
    }
    if (p.careerStats.fpvKills >= 30 && !p.achievements.includes('Swarm Breaker')) {
      p.achievements.push('Swarm Breaker');
    }
    if (data.wave >= 10 && !p.achievements.includes('Frontline Legend')) {
      p.achievements.push('Frontline Legend');
    }

    this.saveProfiles(profiles);

    // Record to leaderboard
    this.addLeaderboardEntry({
      id: 'score_' + Date.now(),
      username: p.username,
      callsign: p.callsign,
      avatar: p.avatar,
      score: data.score,
      wave: data.wave,
      environment: data.environment,
      date: new Date().toISOString().split('T')[0],
      isCurrentPlayer: true,
    });
  }

  public getLeaderboard(environment?: EnvironmentType): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
      const list: LeaderboardEntry[] = raw ? JSON.parse(raw) : [...DEFAULT_LEADERBOARD];
      const activeId = this.getActiveProfile().username;
      const marked = list.map((entry) => ({
        ...entry,
        isCurrentPlayer: entry.username === activeId,
      }));

      const filtered = environment ? marked.filter((e) => e.environment === environment) : marked;
      return filtered.sort((a, b) => b.score - a.score).slice(0, 20);
    } catch {
      return DEFAULT_LEADERBOARD;
    }
  }

  private addLeaderboardEntry(entry: LeaderboardEntry) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
      const list: LeaderboardEntry[] = raw ? JSON.parse(raw) : [...DEFAULT_LEADERBOARD];
      list.push(entry);
      // keep top 40
      list.sort((a, b) => b.score - a.score);
      const trimmed = list.slice(0, 40);
      localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Leaderboard save failed', e);
    }
  }

  private ensureDefaultAccount(): UserAccount {
    const profiles = this.getProfiles();
    if (profiles.length === 0) {
      return this.createAccount('Defender', 'Cossack-7', '🛡️');
    }
    return profiles[0];
  }
}

export const profileManager = ProfileManager.getInstance();
