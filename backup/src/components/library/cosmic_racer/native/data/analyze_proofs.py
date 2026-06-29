
import json
import os
import sys

def analyze_proofs():
    proof_dir = '/Users/uxmagicman/Desktop/ARN/data/OUTPUTS/deciphered_proofs'
    
    print("--- DEEP PARAMETER ANALYSIS: VOYNICH PROOFS ---\n")
    print(f"SOURCE: {proof_dir}")
    print("="*60 + "\n")

    files = [f for f in os.listdir(proof_dir) if f.endswith('.json') and 'REAL' in f]
    files.sort()

    for filename in files:
        filepath = os.path.join(proof_dir, filename)
        
        with open(filepath, 'r') as f:
            data = json.load(f)

        print(f"📂 FILE: {filename}")
        print("-" * 40)

        # 1. High-Level Metadata
        meta = data.get('knowledge_graph_node', {})
        print(f"   ► NODE ID:     {meta.get('id', 'N/A')}")
        print(f"   ► LABEL:       {meta.get('label', 'N/A')}")
        print(f"   ► TYPE:        {meta.get('type', 'N/A')}")
        print(f"   ► TIMESTAMP:   {data.get('timestamp', 'N/A')}")

        # 2. Geometric Identity
        geo = data.get('geometric_archetype', {}).get('layer_1', {})
        print("\n   [GEOMETRY]")
        print(f"     • Archetype:   {geo.get('archetype', 'Unknown')}")
        print(f"     • Element:     {geo.get('element', 'Unknown')}")
        print(f"     • Complexity:  {geo.get('complexity_score', 0)}/10")
        print(f"     • Pattern:     {geo.get('pattern_type', 'None')}")

        # 3. Mathematical Validation
        consts = data.get('constants', [])
        print("\n   [CONSTANTS]")
        if consts:
            for c in consts:
                val = c.get('value')
                val_str = f"{val:.5f}" if val is not None else "N/A"
                print(f"     • MATCH:       {c.get('constant')} (Value: {val_str})")
                print(f"     • ERROR:       {c.get('error')}")
                print(f"     • CONFIDENCE:  {c.get('confidence')}")
        else:
            print("     • No constants detected.")

        # 4. Engineering Specs
        tech = data.get('technological_data', {})
        print("\n   [BLUEPRINT SPECS]")
        print(f"     • ID:          {tech.get('schematic_id', 'N/A')}")
        print(f"     • FUNCTION:    {tech.get('primary_function', 'N/A')}")
        print(f"     • POWER:       {tech.get('power_requirement', 'N/A')}")
        print(f"     • FREQUENCY:   {tech.get('frequency', 'N/A')}")
        
        comps = tech.get('components', [])
        if comps:
            print(f"     • COMPONENTS:  {len(comps)} Items")
            for i, comp in enumerate(comps[:3]): # Show first 3
                print(f"       - {comp}")
            if len(comps) > 3: print(f"       - ... (+{len(comps)-3} more)")

        # 5. Process Instructions
        proc = data.get('process_data', {})
        print("\n   [PROCESS PROTOCOL]")
        print(f"     • ENVIRONMENT: {proc.get('environment', 'N/A')}")
        print(f"     • SEASON:      {proc.get('season', 'N/A')}")
        print(f"     • STEPS:       {proc.get('step_count', 0)} Phases")
        print(f"     • INSTRUCTION: \"{proc.get('process_instruction', 'N/A')}\"")
        print(f"     • SUMMARY:     \"{proc.get('summary_sentence', 'N/A')}\"")

        # 6. Logic Trace (Why did it decide this?)
        trace = data.get('logic_trace', [])
        print("\n   [LOGIC TRACE]")
        for step in trace[:4]: # Show first 4 steps
            print(f"     ► {step}")
            
        print("\n" + "="*60 + "\n")

    print(f"COMPLETE. Analyzed {len(files)} files.")

if __name__ == "__main__":
    analyze_proofs()
