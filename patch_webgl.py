import os
import glob

def patch_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Simple check to see if the file has WebGLRenderer and dispose
        if 'WebGLRenderer' in content and 'renderer.dispose()' in content:
            if 'renderer.forceContextLoss()' not in content:
                print(f"Patching {filepath}")
                new_content = content.replace('renderer.dispose()', 'renderer.dispose();\n      renderer.forceContextLoss()')
                with open(filepath, 'w') as f:
                    f.write(new_content)
            else:
                print(f"Already patched {filepath}")
        
    except Exception as e:
        print(f"Error {filepath}: {e}")

# Find all TSX files in the environments folders
dirs_to_check = [
    'src/components/library/cosmic_racer/native/state/components/environments/**/*.tsx',
    'src/components/library/cosmic_racer/native/components/dashboard/environments/**/*.tsx'
]

for d in dirs_to_check:
    for filepath in glob.glob(d, recursive=True):
        patch_file(filepath)
