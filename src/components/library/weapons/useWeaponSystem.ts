import { useState, useRef, useEffect } from 'react';

import { WeaponType } from '../../data/progression';

export const WEAPON_COOLDOWNS: Record<string, number> = {
  scatter: 560,
  artillery: 900,
  flyover: 1460,
  laser: 2360,
  seismic: 3820,
  carpet: 6180,
  blackhole: 10000
};

export const DEFAULT_WEAPON_SETTINGS = {
  scatterCount: 8,
  scatterRadius: 3,
  scatterDepth: 3,
  scatterDelay: 0,
  scatterProjectiles: 8,
  scatterSpread: 2,
  scatterPartSpeed: 2,

  artilleryRadius: 3,
  artilleryDepth: 4,
  artilleryDelay: 0,
  artilleryPartSpeed: 2,

  flyoverRadius: 5,
  flyoverDepth: 5,
  flyoverDelay: 2500,
  flyoverLength: 10,
  flyoverSpacing: 1.5,
  flyoverPartSpeed: 2,

  laserRadius: 4,
  laserDepth: 10,
  laserDuration: 1500,
  laserDelay: 0,
  laserPartSpeed: 6,

  seismicRadius: 8,
  seismicSpeed: 40,
  seismicDelay: 0,
  seismicDepth: 3,
  seismicCount: 5,
  seismicPartSpeed: 1,

  carpetCount: 12,
  carpetDelay: 150,
  carpetRadius: 4,
  carpetDepth: 4,
  carpetRows: 3,
  carpetCols: 3,
  carpetSpacing: 2,
  carpetPartSpeed: 2,

  blackholeDepth: 10,
  blackholeRadius: 8,
  blackholeDuration: 3000,
  blackholeDelay: 0,
  blackholePartSpeed: 1
};

export function useWeaponSystem() {
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('scatter');
  const [settingsWeapon, setSettingsWeapon] = useState<WeaponType>(null);
  const selectedWeaponRef = useRef<WeaponType>('scatter');
  useEffect(() => { selectedWeaponRef.current = selectedWeapon; }, [selectedWeapon]);

  const [unlockedWeapons, setUnlockedWeapons] = useState<WeaponType[]>(['scatter']);
  const unlockedWeaponsRef = useRef<WeaponType[]>(['scatter']);
  useEffect(() => { unlockedWeaponsRef.current = unlockedWeapons; }, [unlockedWeapons]);

  // Parameters
  const [scatterCount, setScatterCount] = useState(8);
  const scatterCountRef = useRef(scatterCount);
  useEffect(() => { scatterCountRef.current = scatterCount; }, [scatterCount]);

  const [scatterRadius, setScatterRadius] = useState(3);
  const scatterRadiusRef = useRef(scatterRadius);
  useEffect(() => { scatterRadiusRef.current = scatterRadius; }, [scatterRadius]);

  const [scatterDepth, setScatterDepth] = useState(3);
  const scatterDepthRef = useRef(scatterDepth);
  useEffect(() => { scatterDepthRef.current = scatterDepth; }, [scatterDepth]);

  const [scatterDelay, setScatterDelay] = useState(0);
  const scatterDelayRef = useRef(scatterDelay);
  useEffect(() => { scatterDelayRef.current = scatterDelay; }, [scatterDelay]);

  const [artilleryRadius, setArtilleryRadius] = useState(3);
  const artilleryRadiusRef = useRef(artilleryRadius);
  useEffect(() => { artilleryRadiusRef.current = artilleryRadius; }, [artilleryRadius]);

  const [artilleryDepth, setArtilleryDepth] = useState(4);
  const artilleryDepthRef = useRef(artilleryDepth);
  useEffect(() => { artilleryDepthRef.current = artilleryDepth; }, [artilleryDepth]);

  const [artilleryDelay, setArtilleryDelay] = useState(0);
  const artilleryDelayRef = useRef(artilleryDelay);
  useEffect(() => { artilleryDelayRef.current = artilleryDelay; }, [artilleryDelay]);

  const [flyoverRadius, setFlyoverRadius] = useState(5);
  const flyoverRadiusRef = useRef(flyoverRadius);
  useEffect(() => { flyoverRadiusRef.current = flyoverRadius; }, [flyoverRadius]);

  const [flyoverDepth, setFlyoverDepth] = useState(5);
  const flyoverDepthRef = useRef(flyoverDepth);
  useEffect(() => { flyoverDepthRef.current = flyoverDepth; }, [flyoverDepth]);

  const [flyoverDelay, setFlyoverDelay] = useState(2500);
  const flyoverDelayRef = useRef(flyoverDelay);
  useEffect(() => { flyoverDelayRef.current = flyoverDelay; }, [flyoverDelay]);

  const [laserRadius, setLaserRadius] = useState(4);
  const laserRadiusRef = useRef(laserRadius);
  useEffect(() => { laserRadiusRef.current = laserRadius; }, [laserRadius]);

  const [laserDepth, setLaserDepth] = useState(10);
  const laserDepthRef = useRef(laserDepth);
  useEffect(() => { laserDepthRef.current = laserDepth; }, [laserDepth]);

  const [laserDuration, setLaserDuration] = useState(1500);
  const laserDurationRef = useRef(laserDuration);
  useEffect(() => { laserDurationRef.current = laserDuration; }, [laserDuration]);

  const [laserDelay, setLaserDelay] = useState(0);
  const laserDelayRef = useRef(laserDelay);
  useEffect(() => { laserDelayRef.current = laserDelay; }, [laserDelay]);

  const [seismicRadius, setSeismicRadius] = useState(8);
  const seismicRadiusRef = useRef(seismicRadius);
  useEffect(() => { seismicRadiusRef.current = seismicRadius; }, [seismicRadius]);

  const [seismicSpeed, setSeismicSpeed] = useState(40);
  const seismicSpeedRef = useRef(seismicSpeed);
  useEffect(() => { seismicSpeedRef.current = seismicSpeed; }, [seismicSpeed]);

  const [seismicDelay, setSeismicDelay] = useState(0);
  const seismicDelayRef = useRef(seismicDelay);
  useEffect(() => { seismicDelayRef.current = seismicDelay; }, [seismicDelay]);

  const [carpetCount, setCarpetCount] = useState(12);
  const carpetCountRef = useRef(carpetCount);
  useEffect(() => { carpetCountRef.current = carpetCount; }, [carpetCount]);

  const [carpetDelay, setCarpetDelay] = useState(150);
  const carpetDelayRef = useRef(carpetDelay);
  useEffect(() => { carpetDelayRef.current = carpetDelay; }, [carpetDelay]);

  const [seismicDepth, setSeismicDepth] = useState(3);
  const seismicDepthRef = useRef(seismicDepth);
  useEffect(() => { seismicDepthRef.current = seismicDepth; }, [seismicDepth]);

  const [carpetRadius, setCarpetRadius] = useState(4);
  const carpetRadiusRef = useRef(carpetRadius);
  useEffect(() => { carpetRadiusRef.current = carpetRadius; }, [carpetRadius]);

  const [carpetDepth, setCarpetDepth] = useState(4);
  const carpetDepthRef = useRef(carpetDepth);
  useEffect(() => { carpetDepthRef.current = carpetDepth; }, [carpetDepth]);

  const [blackholeDepth, setBlackholeDepth] = useState(10);
  const blackholeDepthRef = useRef(blackholeDepth);
  useEffect(() => { blackholeDepthRef.current = blackholeDepth; }, [blackholeDepth]);

  const [blackholeRadius, setBlackholeRadius] = useState(8);
  const blackholeRadiusRef = useRef(blackholeRadius);
  useEffect(() => { blackholeRadiusRef.current = blackholeRadius; }, [blackholeRadius]);

  const [blackholeDuration, setBlackholeDuration] = useState(3000);
  const blackholeDurationRef = useRef(blackholeDuration);
  useEffect(() => { blackholeDurationRef.current = blackholeDuration; }, [blackholeDuration]);

  const [blackholeDelay, setBlackholeDelay] = useState(0);
  const blackholeDelayRef = useRef(blackholeDelay);
  useEffect(() => { blackholeDelayRef.current = blackholeDelay; }, [blackholeDelay]);

  // Missing Payload configs
  const [scatterProjectiles, setScatterProjectiles] = useState(8);
  const [scatterSpread, setScatterSpread] = useState(2);
  const [flyoverLength, setFlyoverLength] = useState(10);
  const [flyoverSpacing, setFlyoverSpacing] = useState(1.5);
  const [seismicCount, setSeismicCount] = useState(5);
  const seismicCountRef = useRef(seismicCount);
  useEffect(() => { seismicCountRef.current = seismicCount; }, [seismicCount]);
  const [carpetRows, setCarpetRows] = useState(3);
  const [carpetCols, setCarpetCols] = useState(3);
  const [carpetSpacing, setCarpetSpacing] = useState(2);

  const [scatterPartSpeed, setScatterPartSpeed] = useState(2);
  const scatterPartSpeedRef = useRef(scatterPartSpeed);
  useEffect(() => { scatterPartSpeedRef.current = scatterPartSpeed; }, [scatterPartSpeed]);

  const [artilleryPartSpeed, setArtilleryPartSpeed] = useState(2);
  const artilleryPartSpeedRef = useRef(artilleryPartSpeed);
  useEffect(() => { artilleryPartSpeedRef.current = artilleryPartSpeed; }, [artilleryPartSpeed]);

  const [flyoverPartSpeed, setFlyoverPartSpeed] = useState(2);
  const flyoverPartSpeedRef = useRef(flyoverPartSpeed);
  useEffect(() => { flyoverPartSpeedRef.current = flyoverPartSpeed; }, [flyoverPartSpeed]);

  const [seismicPartSpeed, setSeismicPartSpeed] = useState(1);
  const seismicPartSpeedRef = useRef(seismicPartSpeed);
  useEffect(() => { seismicPartSpeedRef.current = seismicPartSpeed; }, [seismicPartSpeed]);

  const [carpetPartSpeed, setCarpetPartSpeed] = useState(2);
  const carpetPartSpeedRef = useRef(carpetPartSpeed);
  useEffect(() => { carpetPartSpeedRef.current = carpetPartSpeed; }, [carpetPartSpeed]);

  const [laserPartSpeed, setLaserPartSpeed] = useState(DEFAULT_WEAPON_SETTINGS.laserPartSpeed);
  const laserPartSpeedRef = useRef(laserPartSpeed);
  useEffect(() => { laserPartSpeedRef.current = laserPartSpeed; }, [laserPartSpeed]);

  const [blackholePartSpeed, setBlackholePartSpeed] = useState(DEFAULT_WEAPON_SETTINGS.blackholePartSpeed);
  const blackholePartSpeedRef = useRef(blackholePartSpeed);
  useEffect(() => { blackholePartSpeedRef.current = blackholePartSpeed; }, [blackholePartSpeed]);

  // Load / Save Logic
  const isLoadedRef = useRef(false);
  
  useEffect(() => {
    fetch('/api/weapon-settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.scatterCount !== undefined) setScatterCount(data.scatterCount);
          if (data.scatterRadius !== undefined) setScatterRadius(data.scatterRadius);
          if (data.scatterDepth !== undefined) setScatterDepth(data.scatterDepth);
          if (data.scatterDelay !== undefined) setScatterDelay(data.scatterDelay);
          if (data.scatterProjectiles !== undefined) setScatterProjectiles(data.scatterProjectiles);
          if (data.scatterSpread !== undefined) setScatterSpread(data.scatterSpread);
          if (data.scatterPartSpeed !== undefined) setScatterPartSpeed(data.scatterPartSpeed);

          if (data.artilleryRadius !== undefined) setArtilleryRadius(data.artilleryRadius);
          if (data.artilleryDepth !== undefined) setArtilleryDepth(data.artilleryDepth);
          if (data.artilleryDelay !== undefined) setArtilleryDelay(data.artilleryDelay);
          if (data.artilleryPartSpeed !== undefined) setArtilleryPartSpeed(data.artilleryPartSpeed);

          if (data.flyoverRadius !== undefined) setFlyoverRadius(data.flyoverRadius);
          if (data.flyoverDepth !== undefined) setFlyoverDepth(data.flyoverDepth);
          if (data.flyoverDelay !== undefined) setFlyoverDelay(data.flyoverDelay);
          if (data.flyoverLength !== undefined) setFlyoverLength(data.flyoverLength);
          if (data.flyoverSpacing !== undefined) setFlyoverSpacing(data.flyoverSpacing);
          if (data.flyoverPartSpeed !== undefined) setFlyoverPartSpeed(data.flyoverPartSpeed);

          if (data.laserRadius !== undefined) setLaserRadius(data.laserRadius);
          if (data.laserDepth !== undefined) setLaserDepth(data.laserDepth);
          if (data.laserDuration !== undefined) setLaserDuration(data.laserDuration);
          if (data.laserDelay !== undefined) setLaserDelay(data.laserDelay);
          if (data.laserPartSpeed !== undefined) setLaserPartSpeed(data.laserPartSpeed);

          if (data.seismicRadius !== undefined) setSeismicRadius(data.seismicRadius);
          if (data.seismicSpeed !== undefined) setSeismicSpeed(data.seismicSpeed);
          if (data.seismicDelay !== undefined) setSeismicDelay(data.seismicDelay);
          if (data.seismicDepth !== undefined) setSeismicDepth(data.seismicDepth);
          if (data.seismicCount !== undefined) setSeismicCount(data.seismicCount);
          if (data.seismicPartSpeed !== undefined) setSeismicPartSpeed(data.seismicPartSpeed);

          if (data.carpetCount !== undefined) setCarpetCount(data.carpetCount);
          if (data.carpetDelay !== undefined) setCarpetDelay(data.carpetDelay);
          if (data.carpetRadius !== undefined) setCarpetRadius(data.carpetRadius);
          if (data.carpetDepth !== undefined) setCarpetDepth(data.carpetDepth);
          if (data.carpetRows !== undefined) setCarpetRows(data.carpetRows);
          if (data.carpetCols !== undefined) setCarpetCols(data.carpetCols);
          if (data.carpetSpacing !== undefined) setCarpetSpacing(data.carpetSpacing);
          if (data.carpetPartSpeed !== undefined) setCarpetPartSpeed(data.carpetPartSpeed);

          if (data.blackholeDepth !== undefined) setBlackholeDepth(data.blackholeDepth);
          if (data.blackholeRadius !== undefined) setBlackholeRadius(data.blackholeRadius);
          if (data.blackholeDuration !== undefined) setBlackholeDuration(data.blackholeDuration);
          if (data.blackholeDelay !== undefined) setBlackholeDelay(data.blackholeDelay);
          if (data.blackholePartSpeed !== undefined) setBlackholePartSpeed(data.blackholePartSpeed);
        }
        isLoadedRef.current = true;
      });
  }, []);

  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isLoadedRef.current) return;
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      fetch('/api/weapon-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scatterCount, scatterRadius, scatterDepth, scatterDelay, scatterProjectiles, scatterSpread, scatterPartSpeed,
          artilleryRadius, artilleryDepth, artilleryDelay, artilleryPartSpeed,
          flyoverRadius, flyoverDepth, flyoverDelay, flyoverLength, flyoverSpacing, flyoverPartSpeed,
          laserRadius, laserDepth, laserDuration, laserDelay, laserPartSpeed,
          seismicRadius, seismicSpeed, seismicDelay, seismicDepth, seismicCount, seismicPartSpeed,
          carpetCount, carpetDelay, carpetRadius, carpetDepth, carpetRows, carpetCols, carpetSpacing, carpetPartSpeed,
          blackholeDepth, blackholeRadius, blackholeDuration, blackholeDelay, blackholePartSpeed
        })
      });
    }, 1000); // 1s debounce
  }, [
    scatterCount, scatterRadius, scatterDepth, scatterDelay, scatterProjectiles, scatterSpread, scatterPartSpeed,
    artilleryRadius, artilleryDepth, artilleryDelay, artilleryPartSpeed,
    flyoverRadius, flyoverDepth, flyoverDelay, flyoverLength, flyoverSpacing, flyoverPartSpeed,
    laserRadius, laserDepth, laserDuration, laserDelay, laserPartSpeed,
    seismicRadius, seismicSpeed, seismicDelay, seismicDepth, seismicCount, seismicPartSpeed,
    carpetCount, carpetDelay, carpetRadius, carpetDepth, carpetRows, carpetCols, carpetSpacing, carpetPartSpeed,
    blackholeDepth, blackholeRadius, blackholeDuration, blackholeDelay, blackholePartSpeed
  ]);

  const weaponCooldownsRef = useRef<Record<string, number>>({});
  const shotsFiredRef = useRef(0);

  const canFire = (wpType: WeaponType) => {
    if (!wpType) return false;
    const now = Date.now();
    const lastFired = weaponCooldownsRef.current[wpType] || 0;
    const cd = WEAPON_COOLDOWNS[wpType];
    if (now - lastFired < cd) return false;
    
    weaponCooldownsRef.current[wpType] = now;
    shotsFiredRef.current += 1;
    return true;
  };

  return {
    selectedWeapon, setSelectedWeapon, selectedWeaponRef,
    settingsWeapon, setSettingsWeapon,
    unlockedWeapons, setUnlockedWeapons, unlockedWeaponsRef,
    
    scatterPartSpeed, setScatterPartSpeed, scatterPartSpeedRef,
    artilleryPartSpeed, setArtilleryPartSpeed, artilleryPartSpeedRef,
    flyoverPartSpeed, setFlyoverPartSpeed, flyoverPartSpeedRef,
    seismicPartSpeed, setSeismicPartSpeed, seismicPartSpeedRef,
    carpetPartSpeed, setCarpetPartSpeed, carpetPartSpeedRef,
    laserPartSpeed, setLaserPartSpeed, laserPartSpeedRef,
    blackholePartSpeed, setBlackholePartSpeed, blackholePartSpeedRef,
    
    scatterCount, setScatterCount, scatterCountRef,
    scatterRadius, setScatterRadius, scatterRadiusRef,
    scatterDepth, setScatterDepth, scatterDepthRef,
    scatterDelay, setScatterDelay, scatterDelayRef,
    scatterProjectiles, setScatterProjectiles,
    scatterSpread, setScatterSpread,

    artilleryRadius, setArtilleryRadius, artilleryRadiusRef,
    artilleryDepth, setArtilleryDepth, artilleryDepthRef,
    artilleryDelay, setArtilleryDelay, artilleryDelayRef,

    flyoverRadius, setFlyoverRadius, flyoverRadiusRef,
    flyoverDepth, setFlyoverDepth, flyoverDepthRef,
    flyoverDelay, setFlyoverDelay, flyoverDelayRef,
    flyoverLength, setFlyoverLength,
    flyoverSpacing, setFlyoverSpacing,

    laserRadius, setLaserRadius, laserRadiusRef,
    laserDepth, setLaserDepth, laserDepthRef,
    laserDuration, setLaserDuration, laserDurationRef,
    laserDelay, setLaserDelay, laserDelayRef,

    seismicRadius, setSeismicRadius, seismicRadiusRef,
    seismicDepth, setSeismicDepth, seismicDepthRef,
    seismicSpeed, setSeismicSpeed, seismicSpeedRef,
    seismicDelay, setSeismicDelay, seismicDelayRef,
    seismicCount, setSeismicCount, seismicCountRef,

    carpetRadius, setCarpetRadius, carpetRadiusRef,
    carpetDepth, setCarpetDepth, carpetDepthRef,
    carpetCount, setCarpetCount, carpetCountRef,
    carpetDelay, setCarpetDelay, carpetDelayRef,
    carpetRows, setCarpetRows,
    carpetCols, setCarpetCols,
    carpetSpacing, setCarpetSpacing,

    blackholeRadius, setBlackholeRadius, blackholeRadiusRef,
    blackholeDepth, setBlackholeDepth, blackholeDepthRef,
    blackholeDuration, setBlackholeDuration, blackholeDurationRef,
    blackholeDelay, setBlackholeDelay, blackholeDelayRef,

    weaponCooldownsRef, shotsFiredRef, canFire
  };
}
