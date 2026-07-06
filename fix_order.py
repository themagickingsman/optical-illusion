import os
import glob

def patch_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Replace dispose() then forceContextLoss() with forceContextLoss() then dispose()
        new_content = content.replace("renderer.dispose();\n        renderer.forceContextLoss();", "renderer.forceContextLoss();\n        renderer.dispose();")
        new_content = new_content.replace("renderer.dispose();\n      renderer.forceContextLoss();", "renderer.forceContextLoss();\n      renderer.dispose();")
        new_content = new_content.replace("renderer?.dispose();\n      renderer?.forceContextLoss();", "renderer?.forceContextLoss();\n      renderer?.dispose();")
        
        # Also handle specific variable names
        import re
        def repl(match):
            var_name = match.group(1)
            return f"{var_name}.forceContextLoss();\n        {var_name}.dispose();"
            
        new_content = re.sub(r'([a-zA-Z0-9_\.]+)\.dispose\(\);\n\s+\1\.forceContextLoss\(\);', repl, new_content)
        
        if new_content != content:
            print(f"Fixed order in {filepath}")
            with open(filepath, 'w') as f:
                f.write(new_content)
                
    except Exception as e:
        print(f"Error {filepath}: {e}")

dirs_to_check = [
    'src/components/**/*.tsx',
    'src/components/library/cosmic_racer/**/*.tsx'
]

for d in dirs_to_check:
    for filepath in glob.glob(d, recursive=True):
        patch_file(filepath)
