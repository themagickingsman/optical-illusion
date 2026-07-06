import os
import glob
import re

def patch_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        if 'dispose()' in content and 'WebGLRenderer' in content:
            if 'forceContextLoss()' not in content:
                # Find all patterns like "something.dispose()" where "something" has "renderer" (case insensitive)
                # and replace it with "something.dispose();\n      something.forceContextLoss();"
                
                def repl(match):
                    var_name = match.group(1)
                    if 'renderer' in var_name.lower():
                        return f"{var_name}.dispose();\n      {var_name}.forceContextLoss();"
                    return match.group(0)

                new_content = re.sub(r'([a-zA-Z0-9_\.]+)\.dispose\(\);', repl, content)
                
                if new_content != content:
                    print(f"Patching {filepath}")
                    with open(filepath, 'w') as f:
                        f.write(new_content)
    except Exception as e:
        print(f"Error {filepath}: {e}")

dirs_to_check = [
    'src/components/library/cosmic_racer/native/state/components/environments/**/*.tsx',
    'src/components/library/cosmic_racer/native/components/dashboard/environments/**/*.tsx'
]

for d in dirs_to_check:
    for filepath in glob.glob(d, recursive=True):
        patch_file(filepath)
