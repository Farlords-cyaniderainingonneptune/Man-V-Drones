import React, { useState, useRef } from 'react';
import { EnvironmentType, UserAccount, WeaponId } from './types';
import { profileManager } from './storage/profileManager';
import { GameEngine } from './game/gameEngine';
import { EnvironmentSelect } from './components/EnvironmentSelect';
import { GameCanvas } from './components/GameCanvas';
import { WeaponShopModal } from './components/WeaponShopModal';
import { AccountModal } from './components/AccountModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GameOverModal } from './components/GameOverModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'select' | 'playing' | 'gameover'>('select');
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentType>('truck_forest');
  const [activeProfile, setActiveProfile] = useState<UserAccount>(profileManager.getActiveProfile());

  // Modals
  const [showArmory, setShowArmory] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // End of round stats
  const [lastRoundStats, setLastRoundStats] = useState<any>(null);
  const [lastRoundKills, setLastRoundKills] = useState<any>(null);

  const engineRef = useRef<GameEngine | null>(null);

  const handleSelectEnvironment = (env: EnvironmentType) => {
    setSelectedEnv(env);
    setCurrentScreen('playing');
  };

  const handleGameOver = (stats: any, killBreakdown: any) => {
    setLastRoundStats(stats);
    setLastRoundKills(killBreakdown);
    setCurrentScreen('gameover');
    setActiveProfile(profileManager.getActiveProfile());
  };

  const handleRestart = () => {
    setCurrentScreen('playing');
  };

  const handleChangeEnv = () => {
    setCurrentScreen('select');
  };

  const handleProfileChanged = () => {
    setActiveProfile(profileManager.getActiveProfile());
  };

  const handleArmoryUpgrade = (weaponId: WeaponId) => {
    if (engineRef.current) {
      engineRef.current.upgradeWeapon(weaponId);
    }
  };

  const handleArmorySwitch = (weaponId: WeaponId) => {
    if (engineRef.current) {
      engineRef.current.switchWeapon(weaponId);
    }
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden font-sans select-none">
      {/* 1. Environment Briefing / Mode Selection */}
      {currentScreen === 'select' && (
        <EnvironmentSelect
          activeProfile={activeProfile}
          onSelect={handleSelectEnvironment}
          onOpenArmory={() => setShowArmory(true)}
          onOpenAccount={() => setShowAccount(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {/* 2. Active Game Screen */}
      {currentScreen === 'playing' && (
        <GameCanvas
          environment={selectedEnv}
          onOpenArmory={() => setShowArmory(true)}
          onGameOver={handleGameOver}
          onExitToMenu={() => setCurrentScreen('select')}
          engineRef={engineRef}
        />
      )}

      {/* 3. Game Over Debrief Modal */}
      {currentScreen === 'gameover' && lastRoundStats && (
        <GameOverModal
          stats={lastRoundStats}
          env={selectedEnv}
          killBreakdown={lastRoundKills}
          onRestart={handleRestart}
          onChangeEnv={handleChangeEnv}
          onOpenArmory={() => setShowArmory(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {/* Armory & Weapon Upgrade Modal */}
      {showArmory && (
        <WeaponShopModal
          weapons={engineRef.current ? engineRef.current.weapons : {}}
          points={engineRef.current ? engineRef.current.stats.points : activeProfile.careerStats.pointsEarned}
          activeWeaponId={engineRef.current ? engineRef.current.activeWeaponId : 'rifle'}
          onUpgrade={handleArmoryUpgrade}
          onSwitch={handleArmorySwitch}
          onClose={() => setShowArmory(false)}
        />
      )}

      {/* User Accounts & Career Progression Modal */}
      {showAccount && (
        <AccountModal
          onClose={() => setShowAccount(false)}
          onProfileChanged={handleProfileChanged}
        />
      )}

      {/* Leaderboard High Scores Modal */}
      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}
