import os
import shutil

src_base = '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers_website/src'
dest_base = '/Users/uxmagicman/Desktop/optical_illusions/src/components/library/cosmic_racer/native'

def copy_folder(folder):
    src = os.path.join(src_base, folder)
    dest = os.path.join(dest_base, folder)
    if os.path.exists(dest):
        shutil.rmtree(dest)
    shutil.copytree(src, dest)
    print(f"✅ Copied {folder}/")

print("🚀 Starting engine migration...")
os.makedirs(dest_base, exist_ok=True)
copy_folder('engine')
copy_folder('state')
copy_folder('components')

shutil.copy2(os.path.join(src_base, 'app/page.tsx'), os.path.join(dest_base, 'NativeScreensaver.tsx'))
print("✅ Copied NativeScreensaver.tsx")
print("🎉 Migration successful!")
