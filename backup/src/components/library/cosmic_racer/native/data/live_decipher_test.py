
import json
import sys
import os
import random

# Path setup
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(os.path.join(root_dir, 'src/features/decoding'))
sys.path.append(os.path.join(root_dir, 'src/features/knowledge'))

from logic_engine import ISBE_IntegratedCore_v8_3

def run_live_test():
    print("--- INITIATING LIVE DECIPHERMENT SEQUENCE ---\n")
    
    # 1. Load Data
    # [USER REQ] Use REAL RAW FILE from INPUTS
    target_path = '/Users/uxmagicman/Desktop/ARN/data/INPUTS/voynich_scripts/test/voynich_stream_level7_page_013.json'
    
    print(f"LOADING RAW ASSET: {target_path}")
    try:
        with open(target_path, 'r') as f:
            target = json.load(f)
            # Ensure filename is set if missing in raw data
            if 'filename' not in target:
                target['filename'] = os.path.basename(target_path)
                
    except Exception as e:
        print(f"CRITICAL ERROR: Could not load raw file. {e}")
        return

    # 2. Extract Data directly
    print(f"TARGET ACQUIRED: {target['filename']}")
    # Raw files might have complexity embedded or we calculate it? 
    # Usually the raw 'stream' file has 'layers', 'vectors' etc.
    # Let's inspect the keys if possible or just assume standard structure.
    
    # We'll print keys to be safe in output
    # print(f"Keys: {target.keys()}")
    
    # 3. Decipher
    engine = ISBE_IntegratedCore_v8_3()
    
    # Raw stream files usually have 'level_7_vectors' or similar. 
    # Let's try to find the vector data.
    vectors = []
    if 'vectors' in target:
        vectors = target['vectors']
    elif 'level7_13d' in target:
        vectors = target['level7_13d']
    elif 'layers' in target and '7' in target['layers']:
         vectors = target['layers']['7']
    elif 'data' in target: # Some formats
         vectors = target['data']
         
    # If vectors is still empty, we might need to debug structure.
    # But let's assume 'vectors' key exists as seen in analysis_data.json provenance.
    
    print(f"VECTOR PAYLOAD: {len(vectors)} items found.")
    
    print(">>> ACCESSING LOGIC ENGINE CORE...")
    result = engine.process_input(target['filename'], vectors)
    
    if not result:
        print("Decipherment Failed.")
        return
        
    # 4. Present Confirmation Data
    geo = result['geometric_archetype']['layer_1']
    tech = result['technological_data']
    proc = result['process_data']
    sem = result['semantic_decipherment']
    consts = result['constants']
    
    print("\n=== DECIPHERMENT COMPLETE. OUTPUT STREAM BELOW ===\n")
    
    print(f"[GEOMETRIC IDENTITY]")
    print(f"  Archetype: {geo['archetype']}")
    print(f"  Element:   {geo['element']}")
    print(f"  Vectors:   {len(geo['vectors'])} Active Nodes")
    
    print(f"\n[MATHEMATICAL VALIDATION]")
    if consts:
        for c in consts:
            print(f"  - MATCH: {c['constant']} (Error: {c.get('error','0%')})")
    else:
        print("  - No Universal Constants detected (Anomalous Geometry)")
        
    print(f"\n[ENGINEERING BLUEPRINT]")
    print(f"  ID:          {tech['schematic_id']}")
    print(f"  Function:    {tech['primary_function']}")
    print(f"  Specs:       {tech['voltage_rating']} @ {tech['operating_frequency']}")
    print(f"  Components:  {len(tech['components'])} Items")
    for comp in tech['components']:
        print(f"    * {comp['ref']}: {comp['component']} ({comp['spec']})")
        
    print(f"\n[PROCESS INSTRUCTIONS]")
    print(f"  Environment: {proc['environment']}")
    print(f"  Season:      {proc['season']}")
    print(f"  Steps:       {proc['step_count']} Phases")
    print("\n  \"" + proc['summary_sentence'] + "\"")
    
    print(f"\n[SEMANTIC CONCEPTS]")
    for s in sem:
        print(f"  - {s['voynich'].upper()}: {s['translation']} ({s.get('resonance','N/A')})")

    print("\n--- END OF TRANSMISSION ---")

if __name__ == "__main__":
    run_live_test()
