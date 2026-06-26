import os

chunks = [
    'chunk1.tsx',
    'chunk2.tsx',
    'chunk3.tsx',
    'chunk4.tsx',
    'chunk5.tsx',
    'chunk6.tsx',
    'chunk7.tsx',
    'chunk8.tsx'
]

full_content = ""
for chunk in chunks:
    with open(chunk, 'r', encoding='utf-8') as f:
        full_content += f.read()

with open('temp_terrain.tsx', 'w', encoding='utf-8') as f:
    f.write(full_content)

print("Concatenated successfully via python.")
