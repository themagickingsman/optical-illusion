import shutil
import sys

src = "/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers_website/public/game_assets"
dst = "/Users/uxmagicman/Desktop/optical_illusions/public/game_assets"

try:
    shutil.copytree(src, dst, dirs_exist_ok=True)
    print("Copied successfully!")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
