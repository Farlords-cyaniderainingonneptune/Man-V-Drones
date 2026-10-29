import {
  Drone,
  DroneType,
  DroppedBomb,
  EnvironmentType,
  FloatingText,
  GameStats,
  Particle,
  Projectile,
  WeaponConfig,
  WeaponId,
} from '../types';
import { DRONE_PROFILES } from '../data/drones';
import { INITIAL_WEAPONS } from '../data/weapons';
import { soundManager } from '../audio/soundManager';
import { profileManager } from '../storage/profileManager';

export interface WaveConfig {
  waveNumber: number;
  totalDrones: number;
  maxSimultaneous: number;
  spawnInterval: number; // ms
  types: { type: DroneType; weight: number }[];
  isSwarmWave: boolean;
  alertMessage?: string;
}

export class GameEngine {
  public env: EnvironmentType;
  public width: number = 800;
  public height: number = 600;

  // Game objects
  public drones: Drone[] = [];
  public droppedBombs: DroppedBomb[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  // Weapons & Inventory
  public weapons: Record<string, WeaponConfig>;
  public activeWeaponId: WeaponId = 'rifle';
  public isReloading: boolean = false;
  public reloadTimer: number = 0;
  public reloadDuration: number = 0;

  // Player state & stats
  public stats: GameStats = {
    score: 0,
    points: 0,
    wave: 1,
    playerHp: 100,
    playerMaxHp: 100,
    kills: 0,
    accuracy: 100,
    shotsFired: 0,
    shotsHit: 0,
    streak: 0,
    maxStreak: 0,
    countermeasureCooldown: 100, // 0 to 100%
    isCrouching: false,
    leanOffset: 0,
    adsZoom: false,
  };

  public killBreakdown: Record<string, number> = {
    fpv_kamikaze: 0,
    scout_quad: 0,
    baba_yaga: 0,
    lancet_dive: 0,
    ground_ugv: 0,
  };

  // Wave manager state
  public waveStatus: 'briefing' | 'active' | 'cleared' | 'gameover' = 'active';
  public waveDronesRemainingToSpawn: number = 0;
  public nextSpawnTime: number = 0;
  public waveIntermissionTimer: number = 0;
  public currentWaveConfig: WaveConfig | null = null;
  public waveAlertText: string | null = null;
  public waveAlertAlpha: number = 0;

  // Input & Recoil
  public aimX: number = 400;
  public aimY: number = 300;
  public isMouseDown: boolean = false;
  public recoilY: number = 0;
  public recoilX: number = 0;
  private lastFireTime: number = 0;

  // Callback hooks for UI state updates
  public onWaveComplete?: (wave: number) => void;
  public onGameOver?: () => void;
  public onStateChange?: () => void;

  constructor(env: EnvironmentType, initialWidth: number = 800, initialHeight: number = 600) {
    this.env = env;
    this.width = initialWidth;
    this.height = initialHeight;

    // Clone weapons from definitions
    this.weapons = JSON.parse(JSON.stringify(INITIAL_WEAPONS));

    // Sync weapon unlocks with active profile
    const activeProfile = profileManager.getActiveProfile();
    for (const [wId, lvl] of Object.entries(activeProfile.weaponUnlocks)) {
      if (this.weapons[wId]) {
        if (lvl > 0) {
          this.weapons[wId].unlocked = true;
          this.weapons[wId].currentLevel = lvl;
          this.applyWeaponLevelStats(this.weapons[wId], lvl);
        }
      }
    }

    this.startWave(1);
  }

  public setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public getActiveWeapon(): WeaponConfig {
    return this.weapons[this.activeWeaponId];
  }

  public switchWeapon(weaponId: WeaponId): boolean {
    if (!this.weapons[weaponId] || !this.weapons[weaponId].unlocked) return false;
    this.activeWeaponId = weaponId;
    this.isReloading = false;
    this.reloadTimer = 0;
    soundManager.playReload();
    this.onStateChange?.();
    return true;
  }

  private applyWeaponLevelStats(weapon: WeaponConfig, level: number) {
    const stats = weapon.statsLevels.find((s) => s.level === level) || weapon.statsLevels[0];
    weapon.damage = stats.damage;
    weapon.fireRate = stats.fireRate;
    weapon.maxAmmo = stats.magazineSize;
    weapon.ammo = stats.magazineSize;
    weapon.reloadTime = stats.reloadTime;
    weapon.spread = stats.spread;
    if (stats.pelletCount) weapon.pelletCount = stats.pelletCount;
    if (stats.blastRadius) weapon.blastRadius = stats.blastRadius;
    if (stats.heatDissipation) weapon.heatDissipation = stats.heatDissipation;
  }

  public upgradeWeapon(weaponId: WeaponId): boolean {
    const weapon = this.weapons[weaponId];
    if (!weapon) return false;

    // Check if unlocking
    if (!weapon.unlocked) {
      if (this.stats.points >= weapon.unlockCost) {
        this.stats.points -= weapon.unlockCost;
        weapon.unlocked = true;
        weapon.currentLevel = 1;
        this.applyWeaponLevelStats(weapon, 1);
        profileManager.updateWeaponUnlock(weaponId, 1);
        soundManager.playUpgradeBuy();
        this.onStateChange?.();
        return true;
      }
      return false;
    }

    // Check level upgrade
    if (weapon.currentLevel < weapon.maxLevel) {
      const costIndex = weapon.currentLevel - 1;
      const cost = weapon.upgradeCosts[costIndex];
      if (this.stats.points >= cost) {
        this.stats.points -= cost;
        weapon.currentLevel += 1;
        this.applyWeaponLevelStats(weapon, weapon.currentLevel);
        profileManager.updateWeaponUnlock(weaponId, weapon.currentLevel);
        soundManager.playUpgradeBuy();
        this.onStateChange?.();
        return true;
      }
    }
    return false;
  }

  // --- WAVE GENERATOR ---
  public startWave(waveNum: number) {
    this.stats.wave = waveNum;
    this.waveStatus = 'active';

    const isSwarm = waveNum >= 5;
    const baseCount = waveNum === 1 ? 4 : waveNum === 2 ? 7 : waveNum === 3 ? 11 : waveNum === 4 ? 16 : 22 + (waveNum - 5) * 8;
    const interval = isSwarm ? 450 : waveNum === 1 ? 2200 : waveNum === 2 ? 1600 : 1100;
    const maxSimul = isSwarm ? Math.min(18, 6 + waveNum * 2) : Math.min(8, 2 + waveNum * 2);

    // Drone spawn type weighted pool based on environment and wave
    const types: { type: DroneType; weight: number }[] = [];
    types.push({ type: 'fpv_kamikaze', weight: 45 });

    if (waveNum >= 2) {
      types.push({ type: 'scout_quad', weight: 30 });
    }
    if (waveNum >= 3) {
      types.push({ type: 'baba_yaga', weight: 15 });
    }
    if (waveNum >= 4) {
      types.push({ type: 'lancet_dive', weight: 20 });
    }
    if (this.env === 'trench_defense' && waveNum >= 2) {
      types.push({ type: 'ground_ugv', weight: 25 });
    } else if (this.env === 'truck_forest' && waveNum >= 3) {
      types.push({ type: 'ground_ugv', weight: 15 });
    }

    this.currentWaveConfig = {
      waveNumber: waveNum,
      totalDrones: baseCount,
      maxSimultaneous: maxSimul,
      spawnInterval: interval,
      types,
      isSwarmWave: isSwarm,
      alertMessage: isSwarm
        ? `ALERT: DRONE SWARM DETECTED! (${baseCount} TARGETS)`
        : waveNum === 1
        ? 'WAVE 1: INITIAL HOSTILE PROBES'
        : `WAVE ${waveNum}: AIR SPACE CONTESTED`,
    };

    this.waveDronesRemainingToSpawn = baseCount;
    this.nextSpawnTime = performance.now() + 800;

    this.waveAlertText = this.currentWaveConfig.alertMessage || `WAVE ${waveNum}`;
    this.waveAlertAlpha = 1.0;
    soundManager.playWaveAlert();
    this.onStateChange?.();
  }

  // --- SPAWN DRONE ---
  private spawnDrone() {
    if (!this.currentWaveConfig || this.waveDronesRemainingToSpawn <= 0) return;

    // Pick weighted type
    const types = this.currentWaveConfig.types;
    const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
    let r = Math.random() * totalWeight;
    let chosenType: DroneType = 'fpv_kamikaze';
    for (const item of types) {
      if (r < item.weight) {
        chosenType = item.type;
        break;
      }
      r -= item.weight;
    }

    const profile = DRONE_PROFILES[chosenType];

    // Spawn origin based on type
    let x = 0.1 + Math.random() * 0.8;
    let y = 0.2 + Math.random() * 0.3;
    let z = 1.0; // Starts far in distance

    if (chosenType === 'ground_ugv') {
      y = 0.72 + Math.random() * 0.12; // Ground level
      x = Math.random() > 0.5 ? 0.25 + Math.random() * 0.15 : 0.6 + Math.random() * 0.15;
    } else if (chosenType === 'fpv_kamikaze') {
      // Come in from varying angles (left tree line, high clouds, right road edge)
      const dir = Math.floor(Math.random() * 3);
      if (dir === 0) x = 0.05 + Math.random() * 0.2; // left
      else if (dir === 1) x = 0.75 + Math.random() * 0.2; // right
      else y = 0.1 + Math.random() * 0.15; // high dive
    }

    const newDrone: Drone = {
      id: 'd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: chosenType,
      x,
      y,
      z,
      vx: (Math.random() - 0.5) * 0.001,
      vy: (Math.random() - 0.5) * 0.0006,
      vz: -profile.speed * (0.85 + Math.random() * 0.3),
      hp: profile.hp,
      maxHp: profile.hp,
      points: profile.points,
      speed: profile.speed,
      state: 'approaching',
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 4 + Math.random() * 5,
      dropTimer: chosenType === 'baba_yaga' ? 3.5 : chosenType === 'scout_quad' ? 5.0 : undefined,
      rotation: 0,
      width: profile.width,
      height: profile.height,
      hitRadius: profile.hitRadius,
    };

    this.drones.push(newDrone);
    this.waveDronesRemainingToSpawn -= 1;
  }

  // --- RELOAD LOGIC ---
  public reloadActiveWeapon() {
    const weapon = this.getActiveWeapon();
    if (this.isReloading || weapon.ammo >= weapon.maxAmmo) return;
    if (weapon.id === 'laser') return; // Laser cools automatically

    this.isReloading = true;
    this.reloadTimer = 0;
    this.reloadDuration = weapon.reloadTime;
    soundManager.playReload();
    this.addFloatingText('RELOADING...', this.aimX, this.aimY - 30, '#f59e0b', 14);
  }

  // --- WEAPON FIRE LOGIC ---
  public fireWeapon() {
    if (this.waveStatus !== 'active' || this.stats.playerHp <= 0) return;
    const weapon = this.getActiveWeapon();
    const now = performance.now();

    // Check fire rate delay
    const fireInterval = 1000 / weapon.fireRate;
    if (now - this.lastFireTime < fireInterval) return;

    // Laser cooling check
    if (weapon.id === 'laser') {
      if (weapon.isOverheating) {
        soundManager.playEmptyClick();
        return;
      }
    } else {
      // Kinetic reload / empty check
      if (this.isReloading) return;
      if (weapon.ammo <= 0) {
        soundManager.playEmptyClick();
        this.reloadActiveWeapon();
        return;
      }
    }

    this.lastFireTime = now;
    this.stats.shotsFired += 1;

    // Consume Ammo / Heat
    if (weapon.id === 'laser') {
      weapon.heat = Math.min(100, (weapon.heat || 0) + 4);
      if (weapon.heat >= 100) {
        weapon.isOverheating = true;
        this.addFloatingText('LASER OVERHEAT!', this.width / 2, this.height * 0.4, '#ef4444', 18);
      }
      soundManager.playLaserHum();
    } else {
      weapon.ammo -= 1;
    }

    // Apply Recoil Kick
    const kickY = weapon.id === 'shotgun' ? -22 : weapon.id === 'flak' ? -28 : -12;
    const kickX = (Math.random() - 0.5) * (weapon.id === 'flak' ? 14 : 6);
    this.recoilY = kickY;
    this.recoilX = kickX;

    // Gun specific sound & firing rays
    if (weapon.id === 'rifle') {
      soundManager.playRifleShot();
      this.fireBulletRay(this.aimX, this.aimY, weapon.damage, weapon.spread, 'rifle');
    } else if (weapon.id === 'shotgun') {
      soundManager.playShotgun();
      const pellets = weapon.pelletCount || 9;
      for (let i = 0; i < pellets; i++) {
        this.fireBulletRay(this.aimX, this.aimY, weapon.damage, weapon.spread, 'shotgun');
      }
    } else if (weapon.id === 'laser') {
      this.fireLaserBeam(this.aimX, this.aimY, weapon.damage / 30);
    } else if (weapon.id === 'flak') {
      soundManager.playFlakShot();
      this.fireFlakShell(this.aimX, this.aimY, weapon.damage, weapon.blastRadius || 90);
    }

    this.onStateChange?.();
  }

  // Kinetic Bullet Raycast with 3D perspective hit detection
  private fireBulletRay(targetX: number, targetY: number, damage: number, spread: number, weaponId: WeaponId) {
    const spreadX = (Math.random() - 0.5) * spread * this.width * (this.stats.adsZoom ? 0.4 : 1.0);
    const spreadY = (Math.random() - 0.5) * spread * this.height * (this.stats.adsZoom ? 0.4 : 1.0);
    const hitX = targetX + spreadX;
    const hitY = targetY + spreadY;

    // Create visual projectile tracer
    const startX = this.stats.adsZoom ? this.width * 0.5 : this.width * 0.68;
    const startY = this.height * 0.88;

    this.projectiles.push({
      id: 'p_' + Math.random(),
      startX,
      startY,
      targetX: hitX,
      targetY: hitY,
      currentX: startX,
      currentY: startY,
      currentZ: 0,
      targetZ: 1.0,
      speed: 0.2,
      damage,
      weaponId,
      color: weaponId === 'shotgun' ? '#fde047' : '#f97316',
      radius: weaponId === 'shotgun' ? 2 : 3,
    });

    // Check hit on Dropped Bombs in air
    for (const bomb of this.droppedBombs) {
      const bCoords = this.getScreenCoords(bomb.x, bomb.y, bomb.z);
      const dist = Math.hypot(hitX - bCoords.x, hitY - bCoords.y);
      if (dist < 26) {
        bomb.hp -= damage;
        if (bomb.hp <= 0) {
          this.destroyBomb(bomb, true);
        } else {
          soundManager.playHitPing();
        }
        return;
      }
    }

    // Check hit on Drones (sorted closest first)
    const sorted = [...this.drones].sort((a, b) => a.z - b.z);
    for (const drone of sorted) {
      const dCoords = this.getScreenCoords(drone.x, drone.y, drone.z);
      const scale = 1 / Math.max(0.04, drone.z);
      const scaledHitR = drone.hitRadius * (scale * 0.08);
      const dist = Math.hypot(hitX - dCoords.x, hitY - dCoords.y);

      if (dist <= scaledHitR) {
        this.stats.shotsHit += 1;
        // Motor / battery critical hit bonus
        const isCritical = dist < scaledHitR * 0.35;
        const dealt = isCritical ? damage * 1.5 : damage;

        drone.hp -= dealt;
        soundManager.playHitPing();

        // Hit spark particles
        for (let i = 0; i < 4; i++) {
          this.particles.push({
            x: hitX,
            y: hitY,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 15,
            maxLife: 15,
            color: '#fde047',
            size: 2.5,
            decay: 1,
            type: 'spark',
          });
        }

        if (isCritical) {
          this.addFloatingText('CRITICAL!', hitX, hitY - 15, '#ef4444', 14);
        }

        if (drone.hp <= 0) {
          this.destroyDrone(drone, isCritical);
        }
        break; // Bullet hits first drone along ray
      }
    }
  }

  // Continuous Laser Beam Hitscan
  private fireLaserBeam(targetX: number, targetY: number, tickDamage: number) {
    const startX = this.stats.adsZoom ? this.width * 0.5 : this.width * 0.68;
    const startY = this.height * 0.88;

    this.projectiles.push({
      id: 'beam_' + Math.random(),
      startX,
      startY,
      targetX,
      targetY,
      currentX: targetX,
      currentY: targetY,
      currentZ: 0,
      targetZ: 1.0,
      speed: 1.0,
      damage: tickDamage,
      weaponId: 'laser',
      color: '#06b6d4',
      radius: 4,
    });

    // Check laser contact with drones
    for (const drone of this.drones) {
      const dCoords = this.getScreenCoords(drone.x, drone.y, drone.z);
      const scale = 1 / Math.max(0.04, drone.z);
      const scaledHitR = drone.hitRadius * (scale * 0.08);
      const dist = Math.hypot(targetX - dCoords.x, targetY - dCoords.y);

      if (dist <= scaledHitR) {
        this.stats.shotsHit += 1;
        drone.hp -= tickDamage;

        // Molten burn particles
        this.particles.push({
          x: targetX + (Math.random() - 0.5) * 8,
          y: targetY + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 5,
          life: 12,
          maxLife: 12,
          color: '#22d3ee',
          size: 3,
          decay: 1,
          type: 'spark',
        });

        if (drone.hp <= 0) {
          this.destroyDrone(drone, false);
        }
      }
    }
  }

  // 23mm Air Defense Flak Airburst Shell
  private fireFlakShell(targetX: number, targetY: number, damage: number, blastRadius: number) {
    const startX = this.stats.adsZoom ? this.width * 0.5 : this.width * 0.68;
    const startY = this.height * 0.88;

    this.projectiles.push({
      id: 'flak_' + Math.random(),
      startX,
      startY,
      targetX,
      targetY,
      currentX: startX,
      currentY: startY,
      currentZ: 0,
      targetZ: 0.6,
      speed: 0.14,
      damage,
      weaponId: 'flak',
      blastRadius,
      color: '#f97316',
      radius: 5,
    });
  }

  // Trigger Flak Airburst Detonation (Explosive proximity flak cloud)
  private detonateFlak(x: number, y: number, damage: number, blastRadius: number) {
    soundManager.playFlakBurst();

    // Spawn expanding black smoke & fiery flak cloud particle
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: -0.5,
      life: 35,
      maxLife: 35,
      color: '#f97316',
      size: blastRadius,
      decay: 1,
      type: 'flak_cloud',
    });

    // Shrapnel sparks
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const spd = 4 + Math.random() * 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 20,
        maxLife: 20,
        color: '#fde047',
        size: 3,
        decay: 1,
        type: 'spark',
      });
    }

    // Damage all drones within proximity blast radius
    let hitAny = false;
    for (const drone of this.drones) {
      const dCoords = this.getScreenCoords(drone.x, drone.y, drone.z);
      const dist = Math.hypot(x - dCoords.x, y - dCoords.y);
      if (dist <= blastRadius) {
        hitAny = true;
        this.stats.shotsHit += 1;
        const falloff = 1 - dist / blastRadius;
        const flakDamage = damage * (0.5 + falloff * 0.5);
        drone.hp -= flakDamage;

        if (drone.hp <= 0) {
          this.destroyDrone(drone, false);
        }
      }
    }

    // Destroy falling bombs caught in blast
    for (const bomb of [...this.droppedBombs]) {
      const bCoords = this.getScreenCoords(bomb.x, bomb.y, bomb.z);
      const dist = Math.hypot(x - bCoords.x, y - bCoords.y);
      if (dist <= blastRadius) {
        this.destroyBomb(bomb, true);
      }
    }

    if (hitAny) {
      this.addFloatingText('FLAK BURST!', x, y - 20, '#f97316', 15);
    }
  }

  // --- DESTROY DRONE & SCORING ---
  private destroyDrone(drone: Drone, isCritical: boolean) {
    drone.state = 'destroyed';
    soundManager.playExplosion(drone.type === 'baba_yaga');

    const dCoords = this.getScreenCoords(drone.x, drone.y, drone.z);

    // Multiplier streak
    this.stats.streak += 1;
    if (this.stats.streak > this.stats.maxStreak) {
      this.stats.maxStreak = this.stats.streak;
    }
    const streakMult = this.stats.streak >= 15 ? 3.0 : this.stats.streak >= 8 ? 2.0 : this.stats.streak >= 4 ? 1.5 : 1.0;
    const earnedPoints = Math.round(drone.points * (isCritical ? 1.5 : 1.0) * streakMult);

    this.stats.score += earnedPoints;
    this.stats.points += earnedPoints;
    this.stats.kills += 1;
    this.killBreakdown[drone.type] = (this.killBreakdown[drone.type] || 0) + 1;

    // Floating score tag
    const streakTag = streakMult > 1.0 ? ` (x${streakMult})` : '';
    this.addFloatingText(`+${earnedPoints}${streakTag}`, dCoords.x, dCoords.y - 10, '#22c55e', 18);

    // Explosion debris & smoke
    const count = drone.type === 'baba_yaga' ? 35 : 18;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 9;
      this.particles.push({
        x: dCoords.x,
        y: dCoords.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd + 1,
        life: 25 + Math.random() * 20,
        maxLife: 45,
        color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
        size: 3 + Math.random() * 4,
        decay: 1,
        type: 'debris',
      });
      // Smoke
      this.particles.push({
        x: dCoords.x + (Math.random() - 0.5) * 20,
        y: dCoords.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3,
        life: 40,
        maxLife: 40,
        color: '#4b5563',
        size: 12 + Math.random() * 10,
        decay: 1,
        type: 'smoke',
      });
    }

    // Remove from array
    this.drones = this.drones.filter((d) => d.id !== drone.id);
  }

  // Destroy Dropped Bomb in air
  private destroyBomb(bomb: DroppedBomb, fromPlayer: boolean) {
    soundManager.playExplosion(false);
    const bCoords = this.getScreenCoords(bomb.x, bomb.y, bomb.z);

    if (fromPlayer) {
      const bonus = 150;
      this.stats.score += bonus;
      this.stats.points += bonus;
      this.addFloatingText(`INTERCEPT! +${bonus}`, bCoords.x, bCoords.y, '#38bdf8', 16);
    }

    // Particles
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: bCoords.x,
        y: bCoords.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 20,
        maxLife: 20,
        color: '#f97316',
        size: 3,
        decay: 1,
        type: 'spark',
      });
    }

    this.droppedBombs = this.droppedBombs.filter((b) => b.id !== bomb.id);
  }

  // --- COUNTERMEASURE: EW JAMMER / FLARE SALVO ---
  public triggerCountermeasure(): boolean {
    if (this.stats.countermeasureCooldown < 100) return false;
    this.stats.countermeasureCooldown = 0;
    soundManager.playCountermeasure();

    this.addFloatingText('ELECTRONIC WARFARE JAMMER ACTIVE!', this.width / 2, this.height * 0.35, '#38bdf8', 22);

    // Blast all close drones: disrupt flight or push back
    for (const drone of [...this.drones]) {
      if (drone.z < 0.5) {
        drone.hp -= 80;
        drone.z = Math.min(0.9, drone.z + 0.3); // knock back
        if (drone.hp <= 0) {
          this.destroyDrone(drone, false);
        }
      }
    }

    // Neutralize all falling bombs
    this.droppedBombs = [];

    // EMP screen shockwave particles
    for (let i = 0; i < 40; i++) {
      const ang = (i / 40) * Math.PI * 2;
      this.particles.push({
        x: this.width / 2,
        y: this.height / 2,
        vx: Math.cos(ang) * 14,
        vy: Math.sin(ang) * 14,
        life: 25,
        maxLife: 25,
        color: '#38bdf8',
        size: 4,
        decay: 1,
        type: 'spark',
      });
    }

    this.onStateChange?.();
    return true;
  }

  // --- MAIN SIMULATION TICK ---
  public update(dt: number) {
    if (this.waveStatus === 'gameover') return;

    const now = performance.now();

    // 1. Recoil recovery
    this.recoilY *= 0.82;
    this.recoilX *= 0.82;

    // 2. Weapon Reload Timer
    if (this.isReloading) {
      this.reloadTimer += dt;
      if (this.reloadTimer >= this.reloadDuration) {
        this.isReloading = false;
        const weapon = this.getActiveWeapon();
        weapon.ammo = weapon.maxAmmo;
        this.onStateChange?.();
      }
    }

    // 3. Laser heat dissipation
    const laser = this.weapons.laser;
    if (laser && laser.heat !== undefined && laser.heat > 0) {
      const dissipation = (laser.heatDissipation || 28) * dt;
      laser.heat = Math.max(0, laser.heat - dissipation);
      if (laser.heat <= 15 && laser.isOverheating) {
        laser.isOverheating = false;
      }
    }

    // 4. Countermeasure recharge
    if (this.stats.countermeasureCooldown < 100) {
      this.stats.countermeasureCooldown = Math.min(100, this.stats.countermeasureCooldown + dt * 4.0); // 25s recharge
    }

    // 5. Automatic fire when mouse held down
    if (this.isMouseDown && (this.activeWeaponId === 'rifle' || this.activeWeaponId === 'laser' || this.activeWeaponId === 'flak')) {
      this.fireWeapon();
    }

    // 6. Wave alert fade
    if (this.waveAlertAlpha > 0) {
      this.waveAlertAlpha = Math.max(0, this.waveAlertAlpha - dt * 0.4);
    }

    // 7. Wave Spawner
    if (this.waveStatus === 'active') {
      if (this.waveDronesRemainingToSpawn > 0 && now >= this.nextSpawnTime) {
        if (this.drones.length < (this.currentWaveConfig?.maxSimultaneous || 8)) {
          this.spawnDrone();
          this.nextSpawnTime = now + (this.currentWaveConfig?.spawnInterval || 1000);
        }
      }

      // Check wave clear
      if (this.waveDronesRemainingToSpawn <= 0 && this.drones.length === 0 && this.droppedBombs.length === 0) {
        this.waveStatus = 'cleared';
        this.waveIntermissionTimer = 3.5;
        this.addFloatingText(`WAVE ${this.stats.wave} SECURED!`, this.width / 2, this.height * 0.38, '#22c55e', 26);
        this.onWaveComplete?.(this.stats.wave);
        this.onStateChange?.();
      }
    } else if (this.waveStatus === 'cleared') {
      this.waveIntermissionTimer -= dt;
      if (this.waveIntermissionTimer <= 0) {
        this.startWave(this.stats.wave + 1);
      }
    }

    // 8. Update Drone Behaviors & Movement
    for (const drone of [...this.drones]) {
      drone.wobblePhase += drone.wobbleSpeed * dt;

      // Z-depth progression
      drone.z += drone.vz;

      // Type-specific flight patterns
      if (drone.type === 'fpv_kamikaze') {
        // Erratic zigzag towards screen center
        drone.x += Math.sin(drone.wobblePhase) * 0.003 + (0.5 - drone.x) * 0.002;
        drone.y += Math.cos(drone.wobblePhase * 0.7) * 0.002 + (0.48 - drone.y) * 0.002;
        drone.rotation = Math.sin(drone.wobblePhase) * 0.35;

        // Terminal dive Doppler alert sound when close
        if (drone.z < 0.28 && !drone.diveProgress) {
          drone.diveProgress = 1;
          soundManager.playFpvDive();
        }
      } else if (drone.type === 'scout_quad') {
        // Hovers and drops bomblets
        if (drone.z > 0.45) {
          drone.z += drone.vz;
        } else {
          drone.vz = 0; // stop & hover
          drone.x += Math.sin(drone.wobblePhase * 0.5) * 0.0015;
        }
        if (drone.dropTimer !== undefined) {
          drone.dropTimer -= dt;
          if (drone.dropTimer <= 0) {
            drone.dropTimer = 4.5;
            this.dropBomb(drone.x, drone.y, drone.z, 'grenade', 25);
          }
        }
      } else if (drone.type === 'baba_yaga') {
        // Slow lumbering flight, heavy mortar drops
        drone.x += Math.sin(drone.wobblePhase * 0.3) * 0.0008;
        if (drone.dropTimer !== undefined) {
          drone.dropTimer -= dt;
          if (drone.dropTimer <= 0) {
            drone.dropTimer = 4.0;
            this.dropBomb(drone.x, drone.y + 0.05, drone.z, 'mortar', 50);
          }
        }
      } else if (drone.type === 'lancet_dive') {
        // High speed cruising then steep terminal dive
        drone.rotation = 0.2;
      } else if (drone.type === 'ground_ugv') {
        // Crawls along ground, fires burst rounds
        drone.y = 0.72 + (1 - drone.z) * 0.1;
        if (Math.random() < 0.02) {
          // UGV burst gunfire at player
          this.applyPlayerDamage(this.stats.isCrouching ? 3 : 8, 'UGV Machine Gun Burst');
        }
      }

      // Check Impact with player (z <= 0.06)
      if (drone.z <= 0.06) {
        let impactDamage = drone.type === 'fpv_kamikaze' ? 40 : drone.type === 'lancet_dive' ? 50 : 25;
        if (this.stats.isCrouching) {
          impactDamage = Math.round(impactDamage * 0.3); // 70% reduction in cover
          this.addFloatingText('COVER BLUNTED BLAST!', this.width / 2, this.height * 0.45, '#10b981', 16);
        }
        soundManager.playExplosion(true);
        this.applyPlayerDamage(impactDamage, `${drone.type.toUpperCase()} IMPACT`);
        this.destroyDrone(drone, false);
      }
    }

    // 9. Update Dropped Bombs
    for (const bomb of [...this.droppedBombs]) {
      bomb.y += bomb.vy * dt;
      bomb.z += bomb.vz * dt;
      bomb.vy += 0.08 * dt; // Gravity

      // Bomb hits vehicle / trench ground
      if (bomb.y >= 0.78 || bomb.z <= 0.06) {
        soundManager.playExplosion(bomb.type === 'mortar');
        let bombDmg = bomb.damage;
        if (this.stats.isCrouching) {
          bombDmg = Math.round(bombDmg * 0.3);
          this.addFloatingText('COVER BLUNTED SHRAPNEL!', this.width / 2, this.height * 0.45, '#10b981', 16);
        }
        this.applyPlayerDamage(bombDmg, `${bomb.type.toUpperCase()} DETONATION`);
        this.destroyBomb(bomb, false);
      }
    }

    // 10. Update Projectiles
    for (const p of [...this.projectiles]) {
      if (p.weaponId === 'laser') {
        // Lasers expire immediately after drawing frame
        this.projectiles = this.projectiles.filter((item) => item.id !== p.id);
        continue;
      }

      const dx = p.targetX - p.currentX;
      const dy = p.targetY - p.currentY;
      const dist = Math.hypot(dx, dy);

      if (dist <= 15) {
        if (p.weaponId === 'flak') {
          this.detonateFlak(p.targetX, p.targetY, p.damage, p.blastRadius || 90);
        }
        this.projectiles = this.projectiles.filter((item) => item.id !== p.id);
      } else {
        p.currentX += (dx / dist) * p.speed * 1200 * dt;
        p.currentY += (dy / dist) * p.speed * 1200 * dt;
      }
    }

    // 11. Update Particles
    for (const pt of [...this.particles]) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= pt.decay;
      if (pt.life <= 0) {
        this.particles = this.particles.filter((item) => item !== pt);
      }
    }

    // 12. Update Floating Combat Texts
    for (const ft of [...this.floatingTexts]) {
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 0.9;
      if (ft.alpha <= 0) {
        this.floatingTexts = this.floatingTexts.filter((item) => item.id !== ft.id);
      }
    }

    // 13. Update sound ambience
    soundManager.updateAmbience(this.env, this.drones.length);
  }

  private dropBomb(x: number, y: number, z: number, type: 'mortar' | 'grenade', damage: number) {
    this.droppedBombs.push({
      id: 'bomb_' + Math.random(),
      x,
      y,
      z,
      vy: 0.04,
      vz: -0.001,
      damage,
      hp: 20,
      type,
    });
  }

  // Apply damage to player
  private applyPlayerDamage(amount: number, reason: string) {
    this.stats.playerHp = Math.max(0, this.stats.playerHp - amount);
    this.stats.streak = 0; // reset streak on hit
    this.recoilY = 18;
    this.recoilX = (Math.random() - 0.5) * 16;
    this.addFloatingText(`-${amount} HP`, this.width / 2, this.height * 0.55, '#ef4444', 24);

    if (this.stats.playerHp <= 0) {
      this.handleGameOver();
    }
    this.onStateChange?.();
  }

  private handleGameOver() {
    this.waveStatus = 'gameover';
    soundManager.playExplosion(true);
    soundManager.stopAll();

    // Record high scores and stats into active user profile
    profileManager.recordGameResult({
      environment: this.env,
      score: this.stats.score,
      wave: this.stats.wave,
      kills: this.stats.kills,
      shotsFired: this.stats.shotsFired,
      shotsHit: this.stats.shotsHit,
      killBreakdown: this.killBreakdown,
    });

    this.onGameOver?.();
    this.onStateChange?.();
  }

  public addFloatingText(text: string, x: number, y: number, color: string, size: number = 16) {
    this.floatingTexts.push({
      id: 'ft_' + Math.random(),
      x,
      y,
      text,
      color,
      size,
      alpha: 1.0,
      vy: -35,
    });
  }

  private getScreenCoords(normX: number, normY: number, z: number): { x: number; y: number } {
    const horizon = this.height * 0.48 + (this.stats.isCrouching ? 50 : 0);
    const vpX = this.width * 0.5 + this.stats.leanOffset * 50;
    const clampedZ = Math.max(0.04, z);
    const scale = 1 / clampedZ;
    return {
      x: vpX + (normX - 0.5) * this.width * (scale * 0.45),
      y: horizon + (normY - 0.45) * this.height * (scale * 0.45),
    };
  }
}
