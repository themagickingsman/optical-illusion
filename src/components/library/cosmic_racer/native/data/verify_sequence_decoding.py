
import json
import os
import sys

# Path setup
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(os.path.join(root_dir, 'src/features/decoding'))

from logic_engine import ISBE_IntegratedCore_v8_3

def verify_sequence_decoding():
    print("--- SEQUENCE DECODING VERIFICATION ---\n")
    
    # 1. Load Raw Source (Known Good Data)
    input_path = '/Users/uxmagicman/Desktop/ARN/data/INPUTS/voynich_scripts/test/voynich_stream_level7_page_013.json'
    
    if not os.path.exists(input_path):
        print(f"ERROR: Input file not found at {input_path}")
        return

    with open(input_path, 'r') as f:
        raw_data = json.load(f)
        
    vectors = raw_data.get('level7_13d', [])
    print(f"LOADED: Page 013 ({len(vectors)} vectors)")
    
    # 2. Run Engine
    engine = ISBE_IntegratedCore_v8_3()
    result = engine.process_input("Page 013", vectors)
    
    # 3. Analyze Process Output
    proc = result.get('process_data', {})
    phases = proc.get('phases', [])
    
    print("\n[PROCESS SEQUENCE REPORT]")
    print(f"Total Steps: {proc.get('step_count')}")
    print(f"Unique Phases: {proc.get('phase_count')}")
    print(f"Environment: {proc.get('environment')}")
    print("-" * 40)
    
    if phases:
        for p in phases:
             print(f"   ► PHASE {p['phase_num']} ({p['type']})")
             print(f"      Range: {p['start']} - {p['end']}")
             print(f"      Duration: {p['duration']} vectors")
    else:
        print("   [FAIL] No phases detected.")

    print("-" * 40)
    print(f"[SUMMARY] {proc.get('summary_sentence')}")
    print("\nVERIFICATION COMPLETE.")

if __name__ == "__main__":
    verify_sequence_decoding()
