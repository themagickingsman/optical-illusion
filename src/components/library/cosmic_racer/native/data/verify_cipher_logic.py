
import json
import os
import sys

# Path setup
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(os.path.join(root_dir, 'src/features/decoding'))

from logic_engine import ISBE_IntegratedCore_v8_3

def verify_cipher_logic():
    print("--- CIPHER LOGIC VERIFICATION ---\n")
    
    # 1. Load Raw Source
    input_path = '/Users/uxmagicman/Desktop/ARN/data/INPUTS/voynich_scripts/test/voynich_stream_level7_page_013.json'
    
    with open(input_path, 'r') as f:
        raw_data = json.load(f)
        
    vectors = raw_data.get('level7_13d', [])
    
    # 2. Run Engine
    engine = ISBE_IntegratedCore_v8_3()
    result = engine.process_input("Page 013", vectors)
    
    # 3. Analyze Cipher Output
    proc = result.get('process_data', {})
    cipher = proc.get('cipher_data', {})
    
    print("MULTI-LAYER DECODING REPORT")
    print("=" * 40)
    
    print(f"[LAYER 1] GEOMETRIC CONSTANT")
    const = cipher.get('layer_1_constant')
    if const:
        print(f"   ► MATCH: {const.get('const')} ({const.get('val')})")
        print(f"   ► MEANING: {const.get('meaning')}")
    else:
        print("   ► No geometric archetype match.")
        
    print(f"\n[LAYER 2] PHYSICAL LAWS (Numeric Gematria)")
    laws = cipher.get('layer_2_physics', [])
    if laws:
        for law in laws:
            print(f"   ► VALUE: {law.get('val')} => {law.get('law')}")
    else:
        print("   ► No physical law resonance found.")

    print(f"\n[LAYER 3] MATERIAL ISOTOPES")
    print(f"   ► DETECTED: {cipher.get('layer_3_material')}")
    
    print("-" * 40)
    print("VERIFICATION COMPLETE.")

if __name__ == "__main__":
    verify_cipher_logic()
