
import os
import sys
import pdf2image
import json
import io

# Path setup
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, '../../..'))

# 1. Import Logic Engine (Consumer)
sys.path.append(os.path.join(root_dir, 'src/features/decoding'))
from logic_engine import ISBE_IntegratedCore_v8_3

# 2. Import Real Processing Engine (Producer)
processing_dir = '/Users/uxmagicman/Desktop/ARN/PROCESSING'
sys.path.append(processing_dir)
from universal_stream_processor import UniversalStreamProcessor

def run_real_engine_test():
    print("--- INITIATING REAL ENGINE PRECISION TEST ---\n")
    print(f"ENGINE SOURCE: {processing_dir}/universal_stream_processor.py")
    
    # Initialize Engines
    producer = UniversalStreamProcessor()
    consumer = ISBE_IntegratedCore_v8_3()
    
    pdf_path = '/Users/uxmagicman/Desktop/ARN/data/INPUTS/voynich_scripts/pdf/Voynich-Manuscript.pdf'
    
    # 1. Extract 4 Pages (Data Source)
    print(f"LOADING SOURCE: {pdf_path}")
    try:
        # Extract pages 10, 50, 100, 150 (indices 9, 49, 99, 149)
        pages = [9, 49, 99, 149]
        page_labels = ["Page 010", "Page 050", "Page 100", "Page 150"]
        
        images = pdf2image.convert_from_path(pdf_path, first_page=1, last_page=150)
        selected_images = {label: images[idx] for label, idx in zip(page_labels, pages)}
        
        print("SUCCESS: 4 Test Pages Extracted (High-Res Images)\n")
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        return

    # 2. Process and Validate
    results = []
    
    for page_name, img in selected_images.items():
        print(f">>> PROCESSING {page_name}...")
        
        # A. Convert Image to Raw Bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        raw_bytes = img_byte_arr.getvalue()
        
        # B. Run Real Engine (UniversalStreamProcessor)
        # This converts Pixels -> 13D Vectors via Grid 1728 logic
        print("   [REAL ENGINE] Converting Pixels -> 13D Vectors...")
        stream_data = producer.process_raw_stream(
            raw_bytes, 
            stream_id=page_name.replace(" ", "_").lower(),
            data_type="voynich_image"
        )
        
        vectors = stream_data['level7_13d']
        vector_count = len(vectors)
        conf = stream_data['confidence']
        
        print(f"   [OUTPUT] Generated {vector_count} Vectors (Confidence: {conf:.1%})")
        
        # C. Run Logic Core (Validation)
        # This interprets the Vectors -> Meaning
        print("   [LOGIC CORE] Deciphering semantics...")
        deciphered = consumer.process_input(page_name, vectors)
        
        # D. Capture Results
        geo = deciphered['geometric_archetype']['layer_1']
        consts = deciphered['constants']
        
        const_str = consts[0]['constant'] if consts else "None"
        err_str = consts[0]['error'] if consts else "N/A"
        
        print(f"   [IDENTITY] {geo['archetype']}")
        print(f"   [CONSTANT] {const_str} (Error: {err_str})")
        print("   ------------------------------------------------")
        
        # Save individual proof
        # [FIX] Output directly to ARN/data (root_dir is ARN)
        output_dir = os.path.join(root_dir, 'data', 'OUTPUTS', 'deciphered_proofs')
        os.makedirs(output_dir, exist_ok=True)
        filename = f"voynich_REAL_{page_name.replace(' ', '')}_13D.json"
        with open(os.path.join(output_dir, filename), 'w') as f:
            json.dump(deciphered, f, indent=2)
            
    print(f"\n--- TEST COMPLETE: 4 Real Artifacts Saved to {output_dir} ---")

if __name__ == "__main__":
    run_real_engine_test()
