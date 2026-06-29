import React from 'react';
import LiquidEther from './LiquidEther';
// @ts-ignore
import LightPillar from './LightPillar';
import ColorBends from './ColorBends';
import Plasma from './Plasma';
import PixelSnow from './PixelSnow';
import Iridescence from './Iridescence';
import LiquidChrome from './LiquidChrome';
import Balatro from './Balatro';
import Lightning from '../Lightning';

export const EnvironmentManager = ({ octave, config }: { octave: number, config: any }) => {
  switch (octave) {
    case 0: return <LiquidEther />;
    case 1: return <LightPillar />;
    case 2: return <ColorBends />;
    case 3: return <Plasma />;
    case 5: return <PixelSnow />;
    case 6: return <Iridescence />;
    case 7: return <LiquidChrome />;
    case 8: return <Balatro />;
    case 12: return <Lightning {...config} />;
    default: return null;
  }
};
