export type EnvironmentType = 'truck_forest' | 'trench_defense';

export type WeaponId = 'rifle' | 'shotgun' | 'laser' | 'flak';

export interface WeaponUpgrade {
  level: number;
  damage: number;
  fireRate: number; // shots per sec
  magazineSize: number;
  reloadTime: number; // seconds
  pelletCount?: number; // for shotgun
  spread: number;
  blastRadius?: number; // for flak
  heatDissipation?: number; // for laser
}

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  category: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockCost: number;
  currentLevel: number;
  maxLevel: number;
  ammo: number;
  maxAmmo: number;
  damage: number;
  fireRate: number;
  reloadTime: number;
  spread: number;
  pelletCount?: number;
  blastRadius?: number;
  isOverheating?: boolean;
  heat?: number; // 0 to 100 for laser
  heatDissipation?: number;
  upgradeCosts: number[];
  statsLevels: WeaponUpgrade[];
}

export type DroneType = 'fpv_kamikaze' | 'scout_quad' | 'baba_yaga' | 'lancet_dive' | 'ground_ugv';

export interface Drone {
  id: string;
  type: DroneType;
  x: number; // screen coordinate or normalized
  y: number;
  z: number; // distance from player (1.0 = far horizon, 0.05 = right in your face)
  vx: number;
  vy: number;
  vz: number;
  hp: number;
  maxHp: number;
  points: number;
  speed: number;
  state: 'approaching' | 'hovering' | 'diving' | 'attacking' | 'destroyed';
  diveProgress?: number;
  wobblePhase: number;
  wobbleSpeed: number;
  dropTimer?: number; // for bombs
  groundLevel?: number; // for UGV
  rotation: number;
  width: number;
  height: number;
  hitRadius: number;
  isTargeted?: boolean;
}

export interface Projectile {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  currentZ: number;
  targetZ: number;
  speed: number;
  damage: number;
  weaponId: WeaponId;
  blastRadius?: number;
  color: string;
  radius: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  decay: number;
  type: 'spark' | 'smoke' | 'debris' | 'flash' | 'flak_cloud';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  alpha: number;
  vy: number;
}

export interface DroppedBomb {
  id: string;
  x: number;
  y: number;
  z: number; // distance
  vy: number;
  vz: number;
  damage: number;
  hp: number;
  type: 'mortar' | 'grenade' | 'c4';
}

export interface UserAccount {
  id: string;
  username: string;
  callsign: string;
  avatar: string;
  pin?: string;
  createdAt: string;
  highScores: {
    truck_forest: number;
    trench_defense: number;
    overall: number;
  };
  highestWave: {
    truck_forest: number;
    trench_defense: number;
  };
  careerStats: {
    totalKills: number;
    fpvKills: number;
    babaYagaKills: number;
    scoutKills: number;
    ugvKills: number;
    lancetKills: number;
    shotsFired: number;
    shotsHit: number;
    gamesPlayed: number;
    pointsEarned: number;
  };
  weaponUnlocks: Record<WeaponId, number>; // weaponId -> level
  achievements: string[];
}

export interface GameStats {
  score: number;
  points: number; // available currency for upgrades
  wave: number;
  playerHp: number;
  playerMaxHp: number;
  kills: number;
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
  streak: number;
  maxStreak: number;
  countermeasureCooldown: number; // 0 to 100
  isCrouching: boolean;
  leanOffset: number; // -1 to +1
  adsZoom: boolean;
}
