import { useState, useEffect, useCallback } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type InteractionType = 'mouse' | 'keyboard' | 'gamepad';

interface UseGamepadNavigationProps {
  totalItems: number; // 13 (0 for hero, 1-12 for grid)
  columns: number; // 4
  onSelect?: (index: number) => void;
}

export function useGamepadNavigation({ totalItems, columns, onSelect }: UseGamepadNavigationProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [interactionType, setInteractionType] = useState<InteractionType>('mouse');

  const setMouseActiveIndex = useCallback((index: number) => {
    setInteractionType('mouse');
    setActiveIndex(index);
  }, []);

  const move = useCallback((direction: Direction, source: InteractionType) => {
    setInteractionType(source);
    setActiveIndex((current) => {
      switch (direction) {
        case 'LEFT':
          return current === 0 ? totalItems - 1 : current - 1;
        case 'RIGHT':
          return current === totalItems - 1 ? 0 : current + 1;
        case 'UP':
          return Math.max(0, current - columns);
        case 'DOWN':
          return Math.min(totalItems - 1, current + columns);
        default:
          return current;
      }
    });
  }, [totalItems]);

  const selectCurrent = useCallback(() => {
    if (onSelect) {
      onSelect(activeIndex);
    }
  }, [activeIndex, onSelect]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          move('UP', 'keyboard');
          break;
        case 'ArrowDown':
          e.preventDefault();
          move('DOWN', 'keyboard');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          move('LEFT', 'keyboard');
          break;
        case 'ArrowRight':
          e.preventDefault();
          move('RIGHT', 'keyboard');
          break;
        case 'Enter':
          e.preventDefault();
          selectCurrent();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, selectCurrent]);

  // Gamepad navigation (Polling)
  useEffect(() => {
    let animationFrameId: number;
    let lastDir: Direction | null = null;
    let lastActionTime = 0;
    const cooldown = 200; // ms cooldown between gamepad moves

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0]; // grab first controller

      if (gp) {
        const now = performance.now();
        if (now - lastActionTime > cooldown) {
          let moved = false;
          // D-PAD: Up(12), Down(13), Left(14), Right(15)
          // Axes: Left Stick X(0), Y(1)
          const threshold = 0.5;
          const up = gp.buttons[12]?.pressed || gp.axes[1] < -threshold;
          const down = gp.buttons[13]?.pressed || gp.axes[1] > threshold;
          const left = gp.buttons[14]?.pressed || gp.axes[0] < -threshold;
          const right = gp.buttons[15]?.pressed || gp.axes[0] > threshold;
          const cross = gp.buttons[0]?.pressed; // PS5 Cross / Xbox A

          if (up) { move('UP', 'gamepad'); moved = true; }
          else if (down) { move('DOWN', 'gamepad'); moved = true; }
          else if (left) { move('LEFT', 'gamepad'); moved = true; }
          else if (right) { move('RIGHT', 'gamepad'); moved = true; }
          
          if (cross) { selectCurrent(); moved = true; }

          if (moved) {
            lastActionTime = now;
          }
        }
      }

      animationFrameId = requestAnimationFrame(pollGamepad);
    };

    animationFrameId = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(animationFrameId);
  }, [move, selectCurrent]);

  return { activeIndex, setMouseActiveIndex, interactionType };
}
