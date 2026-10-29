import {
  Drone,
  DroppedBomb,
  EnvironmentType,
  FloatingText,
  Particle,
  Projectile,
  WeaponConfig,
} from '../types';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 800;
  private height: number = 600;
  private roadOffset: number = 0;
  private treeSeeds: Array<{ x: number; height: number; type: 'pine' | 'birch'; side: 'left' | 'right' }> = [];
  private craterSeeds: Array<{ x: number; y: number; r: number }> = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.initWorldSeeds();
  }

  private initWorldSeeds() {
    // Generate persistent forest landmarks
    this.treeSeeds = [];
    for (let i = 0; i < 40; i++) {
      this.treeSeeds.push({
        x: Math.random(),
        height: 60 + Math.random() * 90,
        type: Math.random() > 0.4 ? 'pine' : 'birch',
        side: Math.random() > 0.5 ? 'left' : 'right',
      });
    }

    // Trench field craters
    this.craterSeeds = [];
    for (let i = 0; i < 25; i++) {
      this.craterSeeds.push({
        x: 0.1 + Math.random() * 0.8,
        y: 0.45 + Math.random() * 0.25,
        r: 15 + Math.random() * 35,
      });
    }
  }

  public setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public renderScene(
    env: EnvironmentType,
    drones: Drone[],
    bombs: DroppedBomb[],
    projectiles: Projectile[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    activeWeapon: WeaponConfig,
    aimX: number,
    aimY: number,
    isFiring: boolean,
    recoilY: number,
    recoilX: number,
    isCrouching: boolean,
    leanOffset: number,
    adsZoom: boolean,
    playerHp: number,
    playerMaxHp: number,
    truckSpeed: number,
    time: number
  ) {
    const ctx = this.ctx;
    ctx.save();

    // ADS Zoom transform
    if (adsZoom) {
      ctx.translate(this.width / 2, this.height / 2);
      ctx.scale(1.25, 1.25);
      ctx.translate(-this.width / 2, -this.height / 2);
    }

    // Camera recoil & shake
    ctx.translate(recoilX, recoilY);

    // Render Environment Background
    if (env === 'truck_forest') {
      this.roadOffset = (this.roadOffset + truckSpeed) % 1000;
      this.renderTruckForest(truckSpeed, time, isCrouching, leanOffset);
    } else {
      this.renderTrenchDefense(time, isCrouching, leanOffset);
    }

    // Render Dropped Bombs (mortars, grenades)
    this.renderBombs(bombs, leanOffset, isCrouching);

    // Render Drones sorted by distance (z descending: furthest drawn first)
    const sortedDrones = [...drones].sort((a, b) => b.z - a.z);
    for (const drone of sortedDrones) {
      this.renderDrone(drone, leanOffset, isCrouching, time);
    }

    // Render In-Flight Projectiles & Flak Bursts
    this.renderProjectiles(projectiles);

    // Render Particles (smoke, sparks, flak puffs, debris)
    this.renderParticles(particles);

    // Foreground Environment / Cockpit Cover (Truck bed rails or Trench sandbags)
    if (env === 'truck_forest') {
      this.renderTruckForeground(time, isCrouching, leanOffset);
    } else {
      this.renderTrenchForeground(time, isCrouching, leanOffset);
    }

    // Floating combat texts
    this.renderFloatingTexts(floatingTexts);

    // Render Player Weapon Hands/Gun Barrel
    this.renderPlayerWeapon(activeWeapon, aimX, aimY, isFiring, recoilY, isCrouching, adsZoom, time);

    // Damage vignette if wounded
    if (playerHp < playerMaxHp * 0.4) {
      this.renderDamageVignette(playerHp, playerMaxHp, time);
    }

    // Crosshair & Targeting Reticle
    this.renderCrosshair(aimX, aimY, activeWeapon, adsZoom, isCrouching);

    ctx.restore();
  }

  // --- ENVIRONMENT: TRUCK CONVOY IN UKRAINE FOREST ---
  private renderTruckForest(truckSpeed: number, time: number, isCrouching: boolean, leanOffset: number) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const horizon = h * 0.48 + (isCrouching ? 50 : 0);
    const vpX = w * 0.5 + leanOffset * 60;

    // 1. Sky: Moody Slavic autumn/winter overcast
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, '#384351'); // Dark charcoal blue-gray
    skyGrad.addColorStop(0.6, '#6b7a8d'); // Muted overcast
    skyGrad.addColorStop(1, '#94a3b8'); // Horizon haze
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizon);

    // Distant cloud wisps
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(w * 0.3 + Math.sin(time * 0.2) * 40, horizon * 0.35, 120, 0, Math.PI * 2);
    ctx.arc(w * 0.75 + Math.cos(time * 0.2) * 50, horizon * 0.25, 160, 0, Math.PI * 2);
    ctx.fill();

    // 2. Distant tree line silhouette (Ukrainian pine forest)
    ctx.fillStyle = '#263328';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    for (let x = 0; x <= w; x += 15) {
      const treeH = 18 + Math.sin(x * 0.04 + time * 0.1) * 8 + Math.cos(x * 0.12) * 12;
      ctx.lineTo(x, horizon - treeH);
    }
    ctx.lineTo(w, horizon);
    ctx.closePath();
    ctx.fill();

    // 3. Ground / Forest Floor on sides of road
    const groundGrad = ctx.createLinearGradient(0, horizon, 0, h);
    groundGrad.addColorStop(0, '#3f4939');
    groundGrad.addColorStop(1, '#252e1f');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizon, w, h - horizon);

    // 4. Receding dirt road with rutted vehicle tracks
    ctx.fillStyle = '#4a443b';
    ctx.beginPath();
    ctx.moveTo(vpX - 8, horizon);
    ctx.lineTo(vpX + 8, horizon);
    ctx.lineTo(w * 0.85, h);
    ctx.lineTo(w * 0.15, h);
    ctx.closePath();
    ctx.fill();

    // Road ruts / muddy tyre tracks
    ctx.strokeStyle = '#312d27';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(vpX - 3, horizon);
    ctx.lineTo(w * 0.32, h);
    ctx.moveTo(vpX + 3, horizon);
    ctx.lineTo(w * 0.68, h);
    ctx.stroke();

    // Road texture dashes moving with speed
    const dashSpacing = 70;
    const offset = (this.roadOffset * 4) % dashSpacing;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 3;
    for (let yOffset = horizon + offset; yOffset < h; yOffset += dashSpacing) {
      const prog = (yOffset - horizon) / (h - horizon);
      const roadW = (w * 0.7) * prog;
      const rx1 = vpX - roadW * 0.3;
      const rx2 = vpX + roadW * 0.3;
      ctx.beginPath();
      ctx.moveTo(rx1, yOffset);
      ctx.lineTo(rx1 + 10 * prog, yOffset + 5);
      ctx.moveTo(rx2, yOffset);
      ctx.lineTo(rx2 + 10 * prog, yOffset + 5);
      ctx.stroke();
    }

    // 5. Parallax roadside Pine & Birch Trees rushing past
    const sideOffset = (this.roadOffset * 3) % 200;
    for (let i = 0; i < this.treeSeeds.length; i++) {
      const seed = this.treeSeeds[i];
      // compute z cycle based on truck speed
      const zPos = ((seed.x * 1000 + this.roadOffset * 8) % 1000) / 1000;
      if (zPos < 0.05) continue;
      const scale = 1 / zPos;
      const treeHeight = seed.height * (scale * 0.14);
      const isLeft = seed.side === 'left';
      const treeX = isLeft
        ? vpX - (w * 0.45 * scale * 0.22) - 40 * scale * 0.1
        : vpX + (w * 0.45 * scale * 0.22) + 40 * scale * 0.1;
      const treeY = horizon + (scale * 0.12 * 80);

      if (treeHeight > 2 && treeX > -100 && treeX < w + 100) {
        this.drawPineOrBirch(treeX, treeY, treeHeight, scale, seed.type);
      }
    }
  }

  private drawPineOrBirch(x: number, y: number, height: number, scale: number, type: 'pine' | 'birch') {
    const ctx = this.ctx;
    ctx.save();
    if (type === 'pine') {
      // Trunk
      ctx.fillStyle = '#2f2115';
      const trunkW = Math.max(2, 6 * (scale * 0.06));
      ctx.fillRect(x - trunkW / 2, y - height, trunkW, height);

      // Triangular pine branches layers
      ctx.fillStyle = '#1e3820';
      const tiers = 4;
      for (let t = 0; t < tiers; t++) {
        const tierY = y - height * (0.3 + (t / tiers) * 0.7);
        const tierW = (height * 0.38) * (1 - t / (tiers + 1));
        ctx.beginPath();
        ctx.moveTo(x, tierY - height * 0.2);
        ctx.lineTo(x - tierW, tierY);
        ctx.lineTo(x + tierW, tierY);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Birch (white trunk with dark notches)
      ctx.fillStyle = '#d1d5db';
      const trunkW = Math.max(2, 4 * (scale * 0.06));
      ctx.fillRect(x - trunkW / 2, y - height, trunkW, height);

      // Birch foliage canopy
      ctx.fillStyle = '#657739';
      ctx.beginPath();
      ctx.ellipse(x, y - height * 0.85, height * 0.25, height * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- ENVIRONMENT 2: TRENCH DEFENSE ---
  private renderTrenchDefense(time: number, isCrouching: boolean, leanOffset: number) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const horizon = h * 0.48 + (isCrouching ? 65 : 0);
    const vpX = w * 0.5 + leanOffset * 50;

    // 1. War-torn bleak sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, '#2d3748');
    skyGrad.addColorStop(0.5, '#4a5568');
    skyGrad.addColorStop(1, '#718096');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizon);

    // Distant artillery smoke plumes on horizon
    ctx.fillStyle = 'rgba(30, 30, 30, 0.45)';
    ctx.beginPath();
    ctx.moveTo(w * 0.22, horizon);
    ctx.quadraticCurveTo(w * 0.24, horizon - 50, w * 0.26 + Math.sin(time * 0.5) * 6, horizon - 75);
    ctx.quadraticCurveTo(w * 0.3, horizon - 40, w * 0.32, horizon);
    ctx.fill();

    ctx.fillStyle = 'rgba(40, 40, 40, 0.35)';
    ctx.beginPath();
    ctx.moveTo(w * 0.72, horizon);
    ctx.quadraticCurveTo(w * 0.75, horizon - 60, w * 0.78 + Math.cos(time * 0.4) * 8, horizon - 90);
    ctx.quadraticCurveTo(w * 0.82, horizon - 45, w * 0.84, horizon);
    ctx.fill();

    // 2. Muddy Steppe / No Man's Land
    const fieldGrad = ctx.createLinearGradient(0, horizon, 0, h);
    fieldGrad.addColorStop(0, '#4b433b');
    fieldGrad.addColorStop(0.6, '#38322c');
    fieldGrad.addColorStop(1, '#231e19');
    ctx.fillStyle = fieldGrad;
    ctx.fillRect(0, horizon, w, h - horizon);

    // Craters & Blast Holes in field
    for (const c of this.craterSeeds) {
      const cy = horizon + (c.y - 0.45) * (h - horizon);
      const cx = (c.x * w) + leanOffset * 20;
      const cr = c.r * ((cy - horizon) / (h - horizon) + 0.35);

      ctx.fillStyle = '#1c1712';
      ctx.beginPath();
      ctx.ellipse(cx, cy, cr, cr * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rim highlight
      ctx.strokeStyle = '#5a5046';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cr, cr * 0.45, 0, 0, Math.PI);
      ctx.stroke();
    }

    // Coils of razor / concertina wire across battlefield
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    const wireY = horizon + 35;
    for (let x = 0; x < w; x += 16) {
      const hoopOffset = Math.sin(x * 0.25) * 8;
      ctx.ellipse(x, wireY + hoopOffset, 12, 10, 0, 0, Math.PI * 2);
    }
    ctx.stroke();

    // Charred tree stakes
    ctx.fillStyle = '#18181b';
    ctx.fillRect(w * 0.18, horizon - 22, 6, 28);
    ctx.fillRect(w * 0.65, horizon - 16, 5, 22);
    ctx.fillRect(w * 0.82, horizon - 30, 7, 36);
  }

  // --- TRUCK FOREGROUND & COVER ---
  private renderTruckForeground(time: number, isCrouching: boolean, leanOffset: number) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const truckY = isCrouching ? h * 0.72 : h * 0.82;
    const bounce = Math.sin(time * 12) * 1.5;

    // Tailgate & Wooden Sideboards
    ctx.save();
    ctx.translate(leanOffset * -15, bounce);

    // Green olive metal truck cab roof / back window
    ctx.fillStyle = '#2d3b2d';
    ctx.fillRect(0, truckY + 30, w, h - truckY);

    // Cab border trim
    ctx.fillStyle = '#1c261c';
    ctx.fillRect(0, truckY + 26, w, 6);

    // Wooden sideboard planks
    ctx.fillStyle = '#5c4827';
    ctx.fillRect(w * 0.05, truckY, w * 0.9, 28);
    ctx.fillStyle = '#42341b';
    ctx.fillRect(w * 0.05, truckY + 12, w * 0.9, 3);

    // Iron corner brackets & rivets
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(w * 0.04, truckY - 4, 18, 38);
    ctx.fillRect(w * 0.92, truckY - 4, 18, 38);
    ctx.fillRect(w * 0.48, truckY - 4, 16, 38);

    // Rivets
    ctx.fillStyle = '#a1a1aa';
    ctx.beginPath();
    ctx.arc(w * 0.05, truckY + 8, 3, 0, Math.PI * 2);
    ctx.arc(w * 0.05, truckY + 22, 3, 0, Math.PI * 2);
    ctx.arc(w * 0.93, truckY + 8, 3, 0, Math.PI * 2);
    ctx.arc(w * 0.93, truckY + 22, 3, 0, Math.PI * 2);
    ctx.fill();

    // Sandbags stacked in the corner for cover
    this.drawSandbag(w * 0.12, truckY - 8, 85, 26);
    this.drawSandbag(w * 0.19, truckY - 22, 80, 24);
    this.drawSandbag(w * 0.78, truckY - 8, 90, 26);

    // Machine gun pintle / rail bar
    ctx.fillStyle = '#27272a';
    ctx.fillRect(w * 0.35, truckY - 14, w * 0.3, 8);
    ctx.fillRect(w * 0.49, truckY - 14, 10, 42);

    // If crouching, show player tucked behind truck cabin
    if (isCrouching) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[CROUCHED BEHIND TRUCK CABIN - INCOMING DAMAGE REDUCED]', w / 2, h * 0.35);
    }

    ctx.restore();
  }

  // --- TRENCH FOREGROUND & COVER ---
  private renderTrenchForeground(time: number, isCrouching: boolean, leanOffset: number) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const trenchY = isCrouching ? h * 0.65 : h * 0.80;

    ctx.save();
    ctx.translate(leanOffset * -15, 0);

    // Mud rampart / parapet wall
    ctx.fillStyle = '#382e24';
    ctx.beginPath();
    ctx.moveTo(0, trenchY + 40);
    ctx.lineTo(w, trenchY + 40);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // Log revetment bracing horizontal logs
    ctx.fillStyle = '#4a3721';
    ctx.fillRect(0, trenchY + 46, w, 22);
    ctx.fillStyle = '#2a1f12';
    ctx.fillRect(0, trenchY + 66, w, 4);

    // Rows of heavy Sandbags lining the trench lip
    const bagCount = 10;
    const bagW = w / (bagCount - 1);
    for (let i = 0; i < bagCount; i++) {
      const bx = i * bagW - 20;
      const by = trenchY + (i % 2 === 0 ? 0 : 6);
      this.drawSandbag(bx, by, bagW * 1.15, 30);
    }
    // Top layer of sandbags
    for (let i = 0; i < bagCount - 1; i++) {
      const bx = i * bagW + bagW * 0.5 - 20;
      const by = trenchY - 18 + ((i + 1) % 2 === 0 ? 0 : 4);
      this.drawSandbag(bx, by, bagW * 1.1, 28);
    }

    // Trench Periscope & Comms Antenna
    ctx.fillStyle = '#18181b';
    ctx.fillRect(w * 0.08, trenchY - 65, 8, 80);
    ctx.fillRect(w * 0.08, trenchY - 65, 20, 10);
    // Antenna
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.88, trenchY + 40);
    ctx.lineTo(w * 0.91, trenchY - 90);
    ctx.stroke();
    // Blinking antenna LED
    if (Math.floor(time * 3) % 2 === 0) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(w * 0.91, trenchY - 90, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isCrouching) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[TAKING COVER BEHIND SANDBAG BERM - BULLETPROOF SHELTER]', w / 2, h * 0.35);
    }

    ctx.restore();
  }

  private drawSandbag(x: number, y: number, w: number, h: number) {
    const ctx = this.ctx;
    ctx.save();
    // Burlap sandbag shape with rounded corners
    ctx.fillStyle = '#927954';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();

    // Texture stitches & fold lines
    ctx.strokeStyle = '#6d5635';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center seam
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, y + h * 0.5);
    ctx.lineTo(x + w * 0.9, y + h * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  // --- DRONES RENDERING ---
  private renderDrone(drone: Drone, leanOffset: number, isCrouching: boolean, time: number) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const horizon = h * 0.48 + (isCrouching ? 50 : 0);
    const vpX = w * 0.5 + leanOffset * 50;

    // Perspective projection calculation
    const clampedZ = Math.max(0.04, drone.z);
    const scale = 1 / clampedZ;
    const screenX = vpX + (drone.x - 0.5) * w * (scale * 0.45);
    const screenY = horizon + (drone.y - 0.45) * h * (scale * 0.45);

    // Size calculation
    const droneW = drone.width * (scale * 0.08);
    const droneH = drone.height * (scale * 0.08);

    if (screenX < -150 || screenX > w + 150 || screenY < -150 || screenY > h + 100) {
      return;
    }

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(drone.rotation + Math.sin(drone.wobblePhase) * 0.08);

    // Threat bounding box / HUD target bracket when close
    if (drone.z < 0.35) {
      ctx.strokeStyle = drone.type === 'fpv_kamikaze' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(234, 179, 8, 0.7)';
      ctx.lineWidth = 1.5;
      const bW = droneW * 0.9;
      const bH = droneH * 0.9;
      ctx.strokeRect(-bW / 2, -bH / 2, bW, bH);

      // Distance tag
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(drone.z * 150)}m`, 0, -bH / 2 - 5);
    }

    // Health bar above drone
    if (drone.hp < drone.maxHp) {
      const barW = Math.max(24, droneW * 0.8);
      const hpPercent = Math.max(0, drone.hp / drone.maxHp);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-barW / 2, -droneH / 2 - 12, barW, 4);
      ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillRect(-barW / 2, -droneH / 2 - 12, barW * hpPercent, 4);
    }

    // Render by drone archetype
    switch (drone.type) {
      case 'fpv_kamikaze':
        this.drawFpvDrone(droneW, droneH, time);
        break;
      case 'scout_quad':
        this.drawScoutQuad(droneW, droneH, time);
        break;
      case 'baba_yaga':
        this.drawBabaYaga(droneW, droneH, time);
        break;
      case 'lancet_dive':
        this.drawLancet(droneW, droneH, time);
        break;
      case 'ground_ugv':
        this.drawUgv(droneW, droneH, time);
        break;
    }

    ctx.restore();
  }

  // 1. FPV Racing Kamikaze Drone
  private drawFpvDrone(w: number, h: number, time: number) {
    const ctx = this.ctx;
    // Carbon X-frame
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = Math.max(2, w * 0.08);
    ctx.beginPath();
    ctx.moveTo(-w * 0.45, -h * 0.45);
    ctx.lineTo(w * 0.45, h * 0.45);
    ctx.moveTo(-w * 0.45, h * 0.45);
    ctx.lineTo(w * 0.45, -h * 0.45);
    ctx.stroke();

    // 4 Motors & Spinning Propeller Blurs
    const propR = w * 0.22;
    const motorCoords = [
      [-w * 0.45, -h * 0.45],
      [w * 0.45, -h * 0.45],
      [-w * 0.45, h * 0.45],
      [w * 0.45, h * 0.45],
    ];
    for (const [mx, my] of motorCoords) {
      // Motor Bell
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(mx, my, w * 0.07, 0, Math.PI * 2);
      ctx.fill();

      // Prop Blur Disc
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(mx, my, propR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central Body Stack
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-w * 0.16, -h * 0.2, w * 0.32, h * 0.4);

    // Front FPV RunCam lens
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, -h * 0.24, w * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Strapped RPG-7 PG-7VL shaped charge warhead (green cone protruding forward)
    ctx.fillStyle = '#15803d'; // OD Green
    ctx.beginPath();
    ctx.moveTo(0, h * 0.48);
    ctx.lineTo(-w * 0.14, h * 0.15);
    ctx.lineTo(w * 0.14, h * 0.15);
    ctx.closePath();
    ctx.fill();

    // Blinking VTX Antenna LED
    ctx.fillStyle = Math.floor(time * 10) % 2 === 0 ? '#ef4444' : '#22c55e';
    ctx.beginPath();
    ctx.arc(0, h * 0.1, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Mavic Recon Quad
  private drawScoutQuad(w: number, h: number, time: number) {
    const ctx = this.ctx;
    // Sleek light gray molded frame
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(-w * 0.2, -h * 0.3, w * 0.4, h * 0.6, 6);
    ctx.fill();

    // 4 Foldable arms
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = Math.max(2, w * 0.07);
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -h * 0.38);
    ctx.lineTo(0, 0);
    ctx.lineTo(w * 0.42, -h * 0.38);
    ctx.moveTo(-w * 0.42, h * 0.38);
    ctx.lineTo(0, 0);
    ctx.lineTo(w * 0.42, h * 0.38);
    ctx.stroke();

    // Spinning white rotors
    const propR = w * 0.24;
    const motors = [
      [-w * 0.42, -h * 0.38],
      [w * 0.42, -h * 0.38],
      [-w * 0.42, h * 0.38],
      [w * 0.42, h * 0.38],
    ];
    for (const [mx, my] of motors) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(mx, my, propR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3-axis optical gimbal lens
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -h * 0.1, w * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -h * 0.1, w * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Green strobe LED
    ctx.fillStyle = Math.floor(time * 6) % 2 === 0 ? '#10b981' : '#047857';
    ctx.beginPath();
    ctx.arc(-w * 0.2, h * 0.2, 3, 0, Math.PI * 2);
    ctx.arc(w * 0.2, h * 0.2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Baba Yaga Heavy Octocopter
  private drawBabaYaga(w: number, h: number, time: number) {
    const ctx = this.ctx;
    // 8-arm star structure
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = Math.max(3, w * 0.06);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const ax = Math.cos(angle) * (w * 0.46);
      const ay = Math.sin(angle) * (h * 0.46);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(ax, ay);
      ctx.stroke();

      // Large heavy rotor blur
      ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.beginPath();
      ctx.arc(ax, ay, w * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Orange motor mount
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(ax, ay, w * 0.04, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy central armored chassis
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.roundRect(-w * 0.22, -h * 0.22, w * 0.44, h * 0.44, 8);
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Suspended Mortar Shells (82mm) under the belly
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(-w * 0.14, h * 0.12, w * 0.1, h * 0.32);
    ctx.fillRect(w * 0.04, h * 0.12, w * 0.1, h * 0.32);
    // Fins
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-w * 0.16, h * 0.38, w * 0.14, h * 0.06);
    ctx.fillRect(w * 0.02, h * 0.38, w * 0.14, h * 0.06);

    // Red searching beacon
    ctx.fillStyle = Math.floor(time * 4) % 2 === 0 ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Lancet Loitering Munition
  private drawLancet(w: number, h: number, time: number) {
    const ctx = this.ctx;
    // Cruciform X-wings
    ctx.fillStyle = '#9ca3af';
    // Forward X-wings
    ctx.beginPath();
    ctx.moveTo(-w * 0.48, -h * 0.35);
    ctx.lineTo(w * 0.48, h * 0.35);
    ctx.lineTo(w * 0.42, h * 0.42);
    ctx.lineTo(-w * 0.42, -h * 0.28);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-w * 0.48, h * 0.35);
    ctx.lineTo(w * 0.48, -h * 0.35);
    ctx.lineTo(w * 0.42, -h * 0.42);
    ctx.lineTo(-w * 0.42, h * 0.28);
    ctx.closePath();
    ctx.fill();

    // Central cylindrical fuselage
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(-w * 0.1, -h * 0.45, w * 0.2, h * 0.9, 4);
    ctx.fill();

    // Optical glass dome nose seeker
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, h * 0.42, w * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Rear Pusher Propeller
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.45, w * 0.18, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Tracked Combat UGV (Ground drone)
  private drawUgv(w: number, h: number, time: number) {
    const ctx = this.ctx;
    // Left & Right Track assemblies
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-w * 0.48, -h * 0.4, w * 0.2, h * 0.8);
    ctx.fillRect(w * 0.28, -h * 0.4, w * 0.2, h * 0.8);

    // Tread links
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 1.5;
    for (let ty = -h * 0.35; ty <= h * 0.35; ty += h * 0.15) {
      ctx.beginPath();
      ctx.moveTo(-w * 0.48, ty);
      ctx.lineTo(-w * 0.28, ty);
      ctx.moveTo(w * 0.28, ty);
      ctx.lineTo(w * 0.48, ty);
      ctx.stroke();
    }

    // Armored hull
    ctx.fillStyle = '#365314'; // Camo green
    ctx.beginPath();
    ctx.roundRect(-w * 0.3, -h * 0.35, w * 0.6, h * 0.7, 6);
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Remote Machine Gun Turret
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // Dual gun barrels facing player
    ctx.fillStyle = '#71717a';
    ctx.fillRect(-w * 0.08, -h * 0.38, w * 0.05, h * 0.3);
    ctx.fillRect(w * 0.03, -h * 0.38, w * 0.05, h * 0.3);

    // Red optic sensor
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, h * 0.12, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- DROPPED BOMBS ---
  private renderBombs(bombs: DroppedBomb[], leanOffset: number, isCrouching: boolean) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const horizon = h * 0.48 + (isCrouching ? 50 : 0);
    const vpX = w * 0.5 + leanOffset * 50;

    for (const bomb of bombs) {
      const clampedZ = Math.max(0.04, bomb.z);
      const scale = 1 / clampedZ;
      const bx = vpX + (bomb.x - 0.5) * w * (scale * 0.45);
      const by = horizon + (bomb.y - 0.45) * h * (scale * 0.45);
      const size = Math.max(8, 26 * (scale * 0.08));

      ctx.save();
      ctx.translate(bx, by);

      // Warning ring pulse
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // Bomb body
      ctx.fillStyle = bomb.type === 'mortar' ? '#374151' : '#15803d';
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.5, size * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stabilization tail fins
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.moveTo(-size * 0.4, -size * 0.8);
      ctx.lineTo(size * 0.4, -size * 0.8);
      ctx.lineTo(0, -size * 0.2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  // --- PROJECTILES & FLAK ---
  private renderProjectiles(projectiles: Projectile[]) {
    const ctx = this.ctx;
    for (const p of projectiles) {
      ctx.save();
      if (p.weaponId === 'laser') {
        // High-energy laser beam
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(p.startX, p.startY);
        ctx.lineTo(p.targetX, p.targetY);
        ctx.stroke();

        // Core white beam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(p.startX, p.startY);
        ctx.lineTo(p.targetX, p.targetY);
        ctx.stroke();
      } else {
        // Kinetic tracer bullet or flak shell
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.currentX, p.currentY, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Tracer tail
        const dx = p.currentX - p.startX;
        const dy = p.currentY - p.startY;
        const len = Math.hypot(dx, dy);
        if (len > 5) {
          const tailLen = Math.min(25, len * 0.2);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.radius * 1.2;
          ctx.beginPath();
          ctx.moveTo(p.currentX, p.currentY);
          ctx.lineTo(p.currentX - (dx / len) * tailLen, p.currentY - (dy / len) * tailLen);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  // --- PARTICLES & FLAK CLOUDS ---
  private renderParticles(particles: Particle[]) {
    const ctx = this.ctx;
    for (const pt of particles) {
      const alpha = pt.life / pt.maxLife;
      ctx.save();
      if (pt.type === 'flak_cloud') {
        // Exploding airburst flak cloud (black smoke + burning orange core)
        const rad = pt.size * (1 - alpha * 0.3);
        const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, rad);
        grad.addColorStop(0, `rgba(249, 115, 22, ${alpha * 0.9})`);
        grad.addColorStop(0.4, `rgba(75, 85, 99, ${alpha * 0.7})`);
        grad.addColorStop(1, `rgba(17, 24, 39, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, rad, 0, Math.PI * 2);
        ctx.fill();
      } else if (pt.type === 'smoke') {
        ctx.fillStyle = `rgba(120, 120, 120, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sparks / Debris / Flash
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // --- FLOATING SCORES ---
  private renderFloatingTexts(texts: FloatingText[]) {
    const ctx = this.ctx;
    for (const t of texts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px monospace`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }

  // --- PLAYER WEAPON & HANDS ---
  private renderPlayerWeapon(
    weapon: WeaponConfig,
    aimX: number,
    aimY: number,
    isFiring: boolean,
    recoilY: number,
    isCrouching: boolean,
    adsZoom: boolean,
    time: number
  ) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Gun position: center-right in standard view, centered in ADS
    const originX = adsZoom ? w * 0.5 : w * 0.68;
    const originY = h * 0.88 + (isCrouching ? 35 : 0) + recoilY * 0.4;

    // Angle toward aim coordinates
    const angle = Math.atan2(aimY - originY, aimX - originX) * 0.25;

    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(angle);

    // Weapon rendering per weapon ID
    switch (weapon.id) {
      case 'rifle':
        this.drawRifleModel(ctx, isFiring, recoilY);
        break;
      case 'shotgun':
        this.drawShotgunModel(ctx, isFiring, recoilY);
        break;
      case 'laser':
        this.drawLaserModel(ctx, isFiring, weapon.heat || 0);
        break;
      case 'flak':
        this.drawFlakModel(ctx, isFiring, recoilY);
        break;
    }

    ctx.restore();
  }

  private drawRifleModel(ctx: CanvasRenderingContext2D, isFiring: boolean, recoil: number) {
    // AK / Tactical Rifle barrel & receiver
    ctx.fillStyle = '#27272a';
    ctx.fillRect(-12, -140, 24, 150);
    // Barrel
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-6, -210, 12, 75);
    // Flash hider
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(-8, -225, 16, 16);
    // Wooden / Poly handguard
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-14, -135, 28, 65);
    // Front sight post
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-3, -205, 6, 18);

    // Muzzle Flash when firing
    if (isFiring) {
      this.drawMuzzleFlash(ctx, 0, -235, 45);
    }
  }

  private drawShotgunModel(ctx: CanvasRenderingContext2D, isFiring: boolean, recoil: number) {
    // Heavy 12-gauge barrel
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-16, -150, 32, 160);
    // Extended magazine tube
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-12, -215, 24, 75);
    // Thick barrel
    ctx.fillStyle = '#334155';
    ctx.fillRect(-9, -235, 18, 90);

    if (isFiring) {
      this.drawMuzzleFlash(ctx, 0, -245, 65);
    }
  }

  private drawLaserModel(ctx: CanvasRenderingContext2D, isFiring: boolean, heat: number) {
    // Futuristic Directed Energy Emitter
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-22, -140, 44, 150);
    // Heat radiator fins (glows orange/red when hot)
    const heatColor = heat > 75 ? '#ef4444' : heat > 40 ? '#f59e0b' : '#38bdf8';
    ctx.fillStyle = heatColor;
    for (let fy = -120; fy < -40; fy += 18) {
      ctx.fillRect(-28, fy, 56, 6);
    }
    // Emitter focal lens
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(0, -155, 16, 0, Math.PI * 2);
    ctx.fill();

    if (isFiring) {
      ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(0, -158, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawFlakModel(ctx: CanvasRenderingContext2D, isFiring: boolean, recoil: number) {
    // Twin 23mm heavy autocannon barrels
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-30, -120, 60, 130);
    // Left barrel
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(-22, -220, 14, 110);
    ctx.fillRect(-24, -235, 18, 16); // Muzzle brake
    // Right barrel
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(8, -220, 14, 110);
    ctx.fillRect(6, -235, 18, 16); // Muzzle brake

    if (isFiring) {
      this.drawMuzzleFlash(ctx, -15, -245, 55);
      this.drawMuzzleFlash(ctx, 15, -245, 55);
    }
  }

  private drawMuzzleFlash(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    // Starburst flash
    const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#fef08a');
    grad.addColorStop(0.7, '#f97316');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- DAMAGE VIGNETTE ---
  private renderDamageVignette(hp: number, maxHp: number, time: number) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const intensity = (1 - hp / maxHp) * 0.7 + Math.sin(time * 6) * 0.1;

    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
    grad.addColorStop(1, `rgba(220, 38, 38, ${Math.min(0.85, intensity)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // --- CROSSHAIR & ADS RETICLE ---
  private renderCrosshair(aimX: number, aimY: number, weapon: WeaponConfig, adsZoom: boolean, isCrouching: boolean) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(aimX, aimY);

    const baseSpread = adsZoom ? 8 : 16;
    const spread = baseSpread + (weapon.id === 'shotgun' ? 14 : weapon.id === 'flak' ? 10 : 4);

    if (adsZoom) {
      // Precision Tactical Scope Reticle
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      // Outer ring
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();

      // Mil-dots
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.arc(-15, 0, 1.5, 0, Math.PI * 2);
      ctx.arc(15, 0, 1.5, 0, Math.PI * 2);
      ctx.arc(0, -15, 1.5, 0, Math.PI * 2);
      ctx.arc(0, 15, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Cross lines
      ctx.beginPath();
      ctx.moveTo(-50, 0);
      ctx.lineTo(-20, 0);
      ctx.moveTo(20, 0);
      ctx.lineTo(50, 0);
      ctx.moveTo(0, -50);
      ctx.lineTo(0, -20);
      ctx.moveTo(0, 20);
      ctx.lineTo(0, 50);
      ctx.stroke();
    } else {
      // Standard dynamic combat crosshair
      ctx.strokeStyle = weapon.id === 'laser' ? '#06b6d4' : '#ef4444';
      ctx.lineWidth = 2;

      // 4 Chevrons/Notches
      ctx.beginPath();
      // Top
      ctx.moveTo(0, -spread - 10);
      ctx.lineTo(0, -spread);
      // Bottom
      ctx.moveTo(0, spread);
      ctx.lineTo(0, spread + 10);
      // Left
      ctx.moveTo(-spread - 10, 0);
      ctx.lineTo(-spread, 0);
      // Right
      ctx.moveTo(spread, 0);
      ctx.lineTo(spread + 10, 0);
      ctx.stroke();

      // Center red dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
