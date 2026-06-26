import os
import sys

source = '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/src/app/(cms)/cosmic_racers/TerrainGenerator.tsx'
target = '/Users/uxmagicman/Desktop/optical_illusions/src/components/library/TerrainGenerator.tsx'

try:
    with open(source, 'r', encoding='utf-8') as f:
        content = f.read()
    with open(target, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Copied successfully.")
except Exception as e:
    print(f"Error: {e}")
