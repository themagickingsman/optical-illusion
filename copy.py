import shutil
import os

src_dir = "/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers"
dest_dir = "/Users/uxmagicman/Desktop/optical_illusions"

files = [
    ("src/lib/FlockEngine.ts", "src/lib/FlockEngine.ts"),
    ("src/lib/TerrainMath.ts", "src/lib/TerrainMath.ts"),
    ("src/app/(cms)/cosmic_racers/TerrainGenerator.tsx", "src/components/library/TerrainGenerator.tsx"),
    ("src/app/(cms)/cosmic_racers/PCSSHelper.ts", "src/components/library/PCSSHelper.ts"),
    (".data/arn_terrain_v1.json", "public/terrain_config.json")
]

for src, dest in files:
    src_path = os.path.join(src_dir, src)
    dest_path = os.path.join(dest_dir, dest)
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dest_path)
        print(f"Copied {src} to {dest}")
    else:
        print(f"Missing {src}")
