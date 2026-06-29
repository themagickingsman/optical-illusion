
import json
import os
import sys

# Path setup
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(os.path.join(root_dir, 'src/features/decoding'))

from logic_engine import ISBE_IntegratedCore_v8_3

def export_translations():
    print("--- EXPORTING TRANSLATION ARTIFACTS ---\n")
    
    # 1. Setup Output Directory
    output_dir = os.path.join(root_dir, '..', 'data', 'OUTPUTS', 'deciphered_proofs')
    os.makedirs(output_dir, exist_ok=True)
    print(f"TARGET DIRECTORY: {output_dir}")
    
    # 2. Define Inputs (The authenticated pages we verified)
    # [FIX] Use absolute path directly
    input_dir = '/Users/uxmagicman/Desktop/ARN/data/INPUTS/voynich_scripts/test'
    
    # Use the pages we know exist and verified
    target_files = [
        "voynich_stream_level7_page_013.json",
        "voynich_stream_level7_page_010.json",
        "voynich_stream_level7_page_011.json"
    ]
    
    engine = ISBE_IntegratedCore_v8_3()
    
    success_count = 0
    for filename in target_files:
        filepath = os.path.join(input_dir, filename)
        if not os.path.exists(filepath):
            print(f"Skipping {filename} (Not found at {filepath})")
            continue
            
        print(f"Processing {filename}...")
        
        # Load Raw
        with open(filepath, 'r') as f:
            raw_data = json.load(f)
            
        # Extract Vectors
        vectors = []
        if 'level7_13d' in raw_data:
            vectors = raw_data['level7_13d']
        elif 'vectors' in raw_data:
            vectors = raw_data['vectors']
            
        if not vectors:
            print(f"   [WARN] No vectors found in {filename}")
            continue

        # Decipher
        result = engine.process_input(filename, vectors)
        
        # Save Detailed Output
        output_filename = filename.replace("stream_level7_", "TRANSLATED_").replace(".json", "_verified.json")
        output_path = os.path.join(output_dir, output_filename)
        
        with open(output_path, 'w') as f:
            json.dump(result, f, indent=2)
            
        print(f"   [SAVED] {output_filename}")
        success_count += 1
        
    print(f"\nSUCCESS: Exported {success_count} translated files to {output_dir}")

if __name__ == "__main__":
    export_translations()
