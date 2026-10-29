import { DroneType } from '../types';

export interface DroneProfile {
  type: DroneType;
  name: string;
  category: 'Aerial Kamikaze' | 'Aerial Recon' | 'Heavy Bomber' | 'Loitering Munition' | 'Ground Combat';
  description: string;
  hp: number;
  speed: number;
  points: number;
  threatLevel: 'HIGH' | 'MEDIUM' | 'EXTREME' | 'CRITICAL';
  color: string;
  width: number;
  height: number;
  hitRadius: number;
  isAerial: boolean;
}

export const DRONE_PROFILES: Record<DroneType, DroneProfile> = {
  fpv_kamikaze: {
    type: 'fpv_kamikaze',
    name: 'FPV Kamikaze Drone',
    category: 'Aerial Kamikaze',
    description: 'Modified racing quadcopter strapped with an RPG-7 warhead. Extremely nimble, fast, and buzzes erratically during terminal dive.',
    hp: 45,
    speed: 0.0035, // z-approach speed
    points: 100,
    threatLevel: 'HIGH',
    color: '#ef4444',
    width: 32,
    height: 24,
    hitRadius: 28,
    isAerial: true,
  },
  scout_quad: {
    type: 'scout_quad',
    name: 'Mavic Recon Scout',
    category: 'Aerial Recon',
    description: 'Commercial quadcopter with thermal optics and grenade drop servo. Hovers at mid-range to release fragmentation bomblets.',
    hp: 55,
    speed: 0.0018,
    points: 150,
    threatLevel: 'MEDIUM',
    color: '#3b82f6',
    width: 36,
    height: 26,
    hitRadius: 30,
    isAerial: true,
  },
  baba_yaga: {
    type: 'baba_yaga',
    name: 'Baba Yaga Heavy Octocopter',
    category: 'Heavy Bomber',
    description: 'Massive agricultural multi-rotor drone retrofitted with armor plating and automated 82mm mortar bomb release racks.',
    hp: 220,
    speed: 0.0012,
    points: 400,
    threatLevel: 'EXTREME',
    color: '#eab308',
    width: 72,
    height: 48,
    hitRadius: 52,
    isAerial: true,
  },
  lancet_dive: {
    type: 'lancet_dive',
    name: 'Lancet Loitering Munition',
    category: 'Loitering Munition',
    description: 'Fixed cross-wing drone that glides smoothly before entering an ultra-high-speed terminal dive straight into the vehicle or trench.',
    hp: 90,
    speed: 0.0042,
    points: 300,
    threatLevel: 'CRITICAL',
    color: '#f97316',
    width: 48,
    height: 32,
    hitRadius: 36,
    isAerial: true,
  },
  ground_ugv: {
    type: 'ground_ugv',
    name: 'Tracked Combat UGV',
    category: 'Ground Combat',
    description: 'Unmanned ground vehicle crawling through mud craters or alongside the roadway. Armored chassis equipped with a burst-fire machine gun.',
    hp: 160,
    speed: 0.0022,
    points: 250,
    threatLevel: 'HIGH',
    color: '#10b981',
    width: 58,
    height: 38,
    hitRadius: 42,
    isAerial: false,
  },
};
