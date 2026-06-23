import json
import os

log_path = '/Users/uxmagicman/.gemini/antigravity-ide/brain/80e3963b-9ef4-40cd-9a93-9374c6c40cfb/.system_generated/logs/transcript.jsonl'
output_path = '/Users/uxmagicman/Desktop/optical_illusions/extracted_chat_ui.tsx'

with open(log_path, 'r') as f:
    for line in f:
        if '"step_index":1420' in line:
            try:
                data = json.loads(line)
                for call in data.get('tool_calls', []):
                    if call.get('name') == 'write_to_file':
                        code = call['args']['CodeContent']
                        with open(output_path, 'w') as out:
                            out.write(code)
                        print(f"Successfully extracted CodeContent to {output_path}")
                        exit(0)
            except Exception as e:
                print("Error parsing:", e)

print("Failed to find step 1420")
