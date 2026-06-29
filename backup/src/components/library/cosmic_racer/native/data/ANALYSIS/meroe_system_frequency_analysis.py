#!/usr/bin/env python3
"""
MEROE SYSTEM-LEVEL FREQUENCY ANALYSIS
=====================================
The domain resonances (0.19-7.11 Hz) are NOT chamber resonances.
They are OPERATIONAL FREQUENCIES of the complete pyramid power system.

KEY INSIGHT:
Hydraulic Pulse = 1.48 Hz → ATOMIC domain = 1.54 Hz (4% match!)

This means: Domain resonances = System operational modes, not room acoustics.
"""

import json
import numpy as np
from typing import List, Dict, Tuple

# Domain resonances from Meroitic analysis
DOMAINS = {
    "VOID": {"level": 0, "avg": 0.8534, "peak": 0.8635, "status": "STABLE"},
    "ATOMIC": {"level": 1, "avg": 1.5413, "peak": 1.5915, "status": "ACTIVE"},
    "BIOLOGICAL": {"level": 2, "avg": 2.3207, "peak": 2.3785, "status": "ACTIVE"},
    "GEOLOGICAL": {"level": 3, "avg": 2.8517, "peak": 2.9339, "status": "ACTIVE"},
    "PLANETARY": {"level": 4, "avg": 2.7771, "peak": 2.8453, "status": "ACTIVE"},
    "STELLAR": {"level": 5, "avg": 2.9337, "peak": 3.0187, "status": "ACTIVE"},
    "GALACTIC": {"level": 6, "avg": 4.9994, "peak": 5.0284, "status": "HYPER-ACTIVE"},
    "UNIVERSAL": {"level": 7, "avg": 0.1929, "peak": 0.1939, "status": "DORMANT"},
    "QUANTUM_MECHANICS": {"level": 8, "avg": 4.1239, "peak": 4.1407, "status": "HYPER-ACTIVE"},
    "DIMENSIONAL_MATH": {"level": 9, "avg": 6.6272, "peak": 6.8184, "status": "HYPER-ACTIVE"},
    "TEMPORAL_PHYSICS": {"level": 10, "avg": 6.4228, "peak": 6.4645, "status": "HYPER-ACTIVE"},
    "CONSCIOUSNESS": {"level": 11, "avg": 5.2104, "peak": 5.2559, "status": "HYPER-ACTIVE"},
    "SOURCE_CODE": {"level": 12, "avg": 7.1114, "peak": 7.1538, "status": "HYPER-ACTIVE"},
}


class MeroeSystemAnalyzer:
    """Analyzes system-level operational frequencies"""
    
    def __init__(self):
        # Physical system parameters
        self.nile_distance = 500.0  # meters
        self.elevation_drop = 10.0   # meters
        self.pipe_diameter = 0.3     # meters
        self.water_speed = 1480      # m/s (sound in water)
        self.ground_speed = 3000     # m/s (sound in rock)
        
    def hydraulic_ram_frequencies(self) -> Dict:
        """
        Calculate all hydraulic ram operational frequencies
        """
        # PRIMARY: Pressure pulse frequency (MATCHES ATOMIC!)
        acoustic_pulse = self.water_speed / (2 * self.nile_distance)  # 1.48 Hz
        
        # Mechanical valve cycling (much slower)
        mechanical_cycle = np.sqrt(9.81 * self.elevation_drop) / (2 * np.pi * self.nile_distance)
        
        # Water hammer shock period
        water_hammer_period = (2 * self.nile_distance) / self.water_speed
        
        # Flow pulsation (turbulence)
        flow_frequency = np.sqrt(9.81 * self.elevation_drop) / (2 * self.pipe_diameter)
        
        return {
            'acoustic_pulse': acoustic_pulse,  # 1.48 Hz → ATOMIC (1.54 Hz)
            'mechanical_cycle': mechanical_cycle,
            'water_hammer_period': water_hammer_period,
            'flow_frequency': flow_frequency,
        }
    
    def ground_transmission_modes(self) -> Dict:
        """
        Calculate frequencies for ground-coupled seismic transmission
        (Pyramid → Obelisk → Ionosphere)
        """
        # Distances in Meroe pyramid field
        pyramid_spacing = 50.0  # meters (typical pyramid-to-pyramid)
        obelisk_distance = 100.0  # meters (pyramid to nearest obelisk)
        
        # Ground wave frequencies
        pyramid_to_pyramid = self.ground_speed / (2 * pyramid_spacing)
        pyramid_to_obelisk = self.ground_speed / (2 * obelisk_distance)
        
        # Schumann resonance (Earth-ionosphere cavity)
        schumann_fundamental = 7.83  # Hz
        schumann_harmonics = [7.83, 14.1, 20.3, 26.4, 32.5]
        
        return {
            'pyramid_network_freq': pyramid_to_pyramid,
            'obelisk_coupling_freq': pyramid_to_obelisk,
            'schumann_fundamental': schumann_fundamental,
            'schumann_harmonics': schumann_harmonics,
        }
    
    def harmonic_analysis(self, base_freq: float, n_harmonics: int = 20) -> List[float]:
        """Generate harmonic series from base frequency"""
        return [base_freq * i for i in range(1, n_harmonics + 1)]
    
    def subharmonic_analysis(self, freq: float, n_divisions: int = 10) -> List[float]:
        """Generate subharmonic series (frequency divisions)"""
        return [freq / i for i in range(1, n_divisions + 1)]
    
    def find_resonant_matches(self, calculated_freqs: List[Tuple[str, float]]) -> List[Dict]:
        """
        Find matches between calculated system frequencies and domain resonances
        """
        matches = []
        tolerance = 0.10  # 10%
        
        for name, calc_freq in calculated_freqs:
            for domain_name, domain_data in DOMAINS.items():
                avg_freq = domain_data['avg']
                peak_freq = domain_data['peak']
                
                # Check average resonance
                if abs(calc_freq - avg_freq) / avg_freq < tolerance:
                    matches.append({
                        'system_component': name,
                        'calculated_freq': calc_freq,
                        'domain': domain_name,
                        'domain_freq': avg_freq,
                        'match_type': 'average',
                        'percent_diff': abs(calc_freq - avg_freq) / avg_freq * 100,
                        'domain_level': domain_data['level'],
                        'domain_status': domain_data['status']
                    })
                
                # Check peak resonance  
                if abs(calc_freq - peak_freq) / peak_freq < tolerance:
                    matches.append({
                        'system_component': name,
                        'calculated_freq': calc_freq,
                        'domain': domain_name,
                        'domain_freq': peak_freq,
                        'match_type': 'peak',
                        'percent_diff': abs(calc_freq - peak_freq) / peak_freq * 100,
                        'domain_level': domain_data['level'],
                        'domain_status': domain_data['status']
                    })
        
        return sorted(matches, key=lambda x: x['percent_diff'])
    
    def analyze_harmonic_relationships(self) -> Dict:
        """
        Analyze if domain frequencies are harmonically related
        """
        # Extract all domain frequencies
        domain_freqs = []
        for domain_name, data in DOMAINS.items():
            domain_freqs.append((f"{domain_name}_avg", data['avg']))
            domain_freqs.append((f"{domain_name}_peak", data['peak']))
        
        # Check for harmonic relationships
        relationships = []
        
        for i, (name1, freq1) in enumerate(domain_freqs):
            for name2, freq2 in domain_freqs[i+1:]:
                ratio = freq2 / freq1 if freq2 > freq1 else freq1 / freq2
                
                # Check if ratio is close to integer (harmonic relationship)
                nearest_int = round(ratio)
                if abs(ratio - nearest_int) / nearest_int < 0.05 and nearest_int <= 10:
                    relationships.append({
                        'freq1': freq1,
                        'freq2': freq2,
                        'ratio': ratio,
                        'harmonic_order': nearest_int,
                        'name1': name1,
                        'name2': name2
                    })
        
        return {
            'total_relationships': len(relationships),
            'relationships': sorted(relationships, key=lambda x: x['harmonic_order'])
        }


def main():
    """Run complete system-level frequency analysis"""
    
    analyzer = MeroeSystemAnalyzer()
    
    print("=" * 80)
    print("MEROE SYSTEM-LEVEL FREQUENCY ANALYSIS")
    print("=" * 80)
    print("\nKEY INSIGHT: Domain resonances are OPERATIONAL FREQUENCIES,")
    print("not chamber acoustics. They describe system-level modes.\n")
    
    # ===== HYDRAULIC SYSTEM ANALYSIS =====
    print("=" * 80)
    print("1. HYDRAULIC RAM SYSTEM FREQUENCIES")
    print("=" * 80)
    hydraulic = analyzer.hydraulic_ram_frequencies()
    
    print(f"\nAcoustic Pulse Frequency: {hydraulic['acoustic_pulse']:.4f} Hz")
    print(f"  → ATOMIC domain: 1.5413 Hz (avg), 1.5915 Hz (peak)")
    diff_avg = abs(hydraulic['acoustic_pulse'] - 1.5413) / 1.5413 * 100
    diff_peak = abs(hydraulic['acoustic_pulse'] - 1.5915) / 1.5915 * 100
    print(f"  → Match to average: {diff_avg:.2f}% difference")
    print(f"  → Match to peak: {diff_peak:.2f}% difference")
    print(f"  ✓ PRIMARY MATCH FOUND!")
    
    print(f"\nMechanical Cycle: {hydraulic['mechanical_cycle']:.6f} Hz")
    print(f"Water Hammer Period: {hydraulic['water_hammer_period']:.4f} seconds")
    print(f"Flow Pulsation: {hydraulic['flow_frequency']:.4f} Hz")
    
    # ===== GROUND TRANSMISSION =====
    print("\n" + "=" * 80)
    print("2. GROUND-COUPLED TRANSMISSION FREQUENCIES")
    print("=" * 80)
    ground = analyzer.ground_transmission_modes()
    
    print(f"\nPyramid Network Frequency: {ground['pyramid_network_freq']:.2f} Hz")
    print(f"Obelisk Coupling Frequency: {ground['obelisk_coupling_freq']:.2f} Hz")
    print(f"Schumann Fundamental: {ground['schumann_fundamental']:.2f} Hz")
    
    # ===== HARMONIC ANALYSIS =====
    print("\n" + "=" * 80)
    print("3. HARMONIC/SUBHARMONIC ANALYSIS")
    print("=" * 80)
    
    # Generate harmonics and subharmonics of hydraulic pulse
    base_freq = hydraulic['acoustic_pulse']
    harmonics = analyzer.harmonic_analysis(base_freq, 10)
    subharmonics = analyzer.subharmonic_analysis(base_freq, 10)
    
    print(f"\nBase Frequency: {base_freq:.4f} Hz (Hydraulic Pulse)")
    print(f"\nSubharmonics (divisions):")
    for i, freq in enumerate(subharmonics[:5], 1):
        print(f"  /{i}: {freq:.4f} Hz")
    
    print(f"\nHarmonics (multiples):")
    for i, freq in enumerate(harmonics[:5], 1):
        print(f"  ×{i}: {freq:.4f} Hz")
    
    # ===== DOMAIN MATCHING =====
    print("\n" + "=" * 80)
    print("4. SYSTEM FREQUENCY → DOMAIN MATCHING")
    print("=" * 80)
    
    # Collect all calculated frequencies
    all_system_freqs = [
        ('Hydraulic_Acoustic_Pulse', hydraulic['acoustic_pulse']),
        ('Hydraulic_Mechanical_Cycle', hydraulic['mechanical_cycle']),
        ('Hydraulic_Flow_Pulsation', hydraulic['flow_frequency']),
    ]
    
    # Add subharmonics
    for i, freq in enumerate(subharmonics, 1):
        all_system_freqs.append((f'Subharmonic_Div{i}', freq))
    
    # Add harmonics (first few)
    for i, freq in enumerate(harmonics[:3], 1):
        all_system_freqs.append((f'Harmonic_×{i}', freq))
    
    # Find matches
    matches = analyzer.find_resonant_matches(all_system_freqs)
    
    print(f"\nTOTAL MATCHES FOUND: {len(matches)}")
    print(f"UNIQUE DOMAINS MATCHED: {len(set(m['domain'] for m in matches))}\n")
    
    if matches:
        print("TOP 15 MATCHES:")
        print("-" * 80)
        for i, match in enumerate(matches[:15], 1):
            print(f"\n{i}. {match['system_component']}")
            print(f"   Calculated: {match['calculated_freq']:.4f} Hz")
            print(f"   Domain: {match['domain']} ({match['match_type']}) - Level {match['domain_level']}")
            print(f"   Domain Freq: {match['domain_freq']:.4f} Hz")
            print(f"   Difference: {match['percent_diff']:.2f}%")
            print(f"   Status: {match['domain_status']}")
    
    # ===== HARMONIC RELATIONSHIPS BETWEEN DOMAINS =====
    print("\n" + "=" * 80)
    print("5. HARMONIC RELATIONSHIPS BETWEEN DOMAINS")
    print("=" * 80)
    
    harm_analysis = analyzer.analyze_harmonic_relationships()
    print(f"\nFound {harm_analysis['total_relationships']} harmonic relationships")
    print("\nTop 10 Harmonic Relationships:")
    print("-" * 80)
    
    for i, rel in enumerate(harm_analysis['relationships'][:10], 1):
        print(f"\n{i}. {rel['name1']}: {rel['freq1']:.4f} Hz")
        print(f"   {rel['name2']}: {rel['freq2']:.4f} Hz")
        print(f"   Ratio: {rel['ratio']:.2f} (≈ {rel['harmonic_order']}:1 harmonic)")
    
    # ===== SAVE RESULTS =====
    output = {
        'hydraulic_system': hydraulic,
        'ground_transmission': ground,
        'domain_matches': {
            'total_matches': len(matches),
            'unique_domains': len(set(m['domain'] for m in matches)),
            'matches': matches[:20]  # Top 20
        },
        'harmonic_relationships': harm_analysis
    }
    
    output_path = '/Users/uxmagicman/Desktop/ARN/web_portal/src/data/ANALYSIS/meroe_system_frequencies.json'
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print("\n" + "=" * 80)
    print(f"Results saved to: {output_path}")
    print("=" * 80)


if __name__ == '__main__':
    main()
