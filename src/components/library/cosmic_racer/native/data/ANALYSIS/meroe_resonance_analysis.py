#!/usr/bin/env python3
"""
MEROE PYRAMID ACOUSTIC RESONANCE ANALYSIS
=========================================
Calculates natural resonance frequencies of Meroe pyramid chambers
and compares to Meroitic Domain Analysis data.

MEROE PYRAMID SPECIFICATIONS (Archaeological Data):
- Location: Meroe, Sudan (16.9°N, 33.7°E)
- Period: 300 BCE - 350 CE
- Count: ~200 pyramids (royal necropolis)
- Characteristics: STEEP angle (~70°), SMALL size, UNDERGROUND chambers

KEY DIFFERENCES from Giza:
- Much smaller (typical base: 7-8m vs Giza 230m)
- Much steeper (70° vs Giza 51°)
- Focus on UNDERGROUND chambers (burial + potentially functional)
- Located near Nile (water access for hydraulic systems)
"""

import json
import numpy as np
from dataclasses import dataclass
from typing import List, Dict

# Physical Constants
SPEED_OF_SOUND_AIR = 343  # m/s at 20°C
SPEED_OF_SOUND_WATER = 1480  # m/s
SPEED_OF_SOUND_STONE = 3000  # m/s (limestone average)

@dataclass
class Chamber:
    """Acoustic chamber specification"""
    name: str
    length: float  # meters
    width: float   # meters
    height: float  # meters
    medium: str    # air, water, stone
    
    def volume(self) -> float:
        return self.length * self.width * self.height
    
    def fundamental_frequency(self) -> float:
        """Calculate fundamental resonance (longest dimension mode)"""
        speed = {
            'air': SPEED_OF_SOUND_AIR,
            'water': SPEED_OF_SOUND_WATER,
            'stone': SPEED_OF_SOUND_STONE
        }[self.medium]
        
        # Fundamental = c / (2 * L) where L is longest dimension
        longest = max(self.length, self.width, self.height)
        return speed / (2 * longest)
    
    def harmonic_series(self, n_harmonics: int = 10) -> List[float]:
        """Calculate first n harmonics"""
        fundamental = self.fundamental_frequency()
        return [fundamental * i for i in range(1, n_harmonics + 1)]
    
    def cavity_modes(self) -> Dict[str, float]:
        """Calculate resonance modes for 3D cavity"""
        speed = {
            'air': SPEED_OF_SOUND_AIR,
            'water': SPEED_OF_SOUND_WATER,
            'stone': SPEED_OF_SOUND_STONE
        }[self.medium]
        
        # Cavity modes: f(n,m,p) = (c/2) * sqrt((n/Lx)² + (m/Ly)² + (p/Lz)²)
        modes = {}
        
        # Fundamental modes (1,0,0), (0,1,0), (0,0,1)
        modes['length_mode'] = speed / (2 * self.length)
        modes['width_mode'] = speed / (2 * self.width)
        modes['height_mode'] = speed / (2 * self.height)
        
        # Diagonal modes (1,1,0), (1,0,1), (0,1,1)
        modes['LW_diagonal'] = (speed / 2) * np.sqrt(
            (1/self.length)**2 + (1/self.width)**2
        )
        modes['LH_diagonal'] = (speed / 2) * np.sqrt(
            (1/self.length)**2 + (1/self.height)**2
        )
        modes['WH_diagonal'] = (speed / 2) * np.sqrt(
            (1/self.width)**2 + (1/self.height)**2
        )
        
        # Body diagonal (1,1,1)
        modes['body_diagonal'] = (speed / 2) * np.sqrt(
            (1/self.length)**2 + (1/self.width)**2 + (1/self.height)**2
        )
        
        return modes


class MeroePyramidComplex:
    """Models the Meroe pyramid acoustic system"""
    
    def __init__(self):
        # TYPICAL MEROE PYRAMID (based on archaeological surveys)
        # Note: These are ESTIMATES based on published dimensions
        # Actual dimensions vary by specific pyramid
        
        self.chambers = {
            # Underground burial chamber (primary acoustic cavity)
            'burial_chamber': Chamber(
                name='Underground Burial Chamber',
                length=4.0,    # meters (typical small chamber)
                width=3.0,     # meters
                height=2.5,    # meters
                medium='air'   # Initially air, potentially water-filled
            ),
            
            # Descending passage (acoustic waveguide)
            'descending_passage': Chamber(
                name='Descending Passage',
                length=12.0,   # meters (steep descent at 70°)
                width=1.2,     # meters
                height=1.5,    # meters
                medium='air'
            ),
            
            # Pyramid internal cavity (if any - most solid)
            'pyramid_cavity': Chamber(
                name='Pyramid Internal Void',
                length=5.0,    # meters (estimated)
                width=5.0,     # meters
                height=8.0,    # meters (tall due to steep angle)
                medium='air'
            ),
            
            # Subterranean water chamber (HYPOTHESIZED - if hydraulic system existed)
            'water_chamber': Chamber(
                name='Subterranean Water Reservoir',
                length=6.0,    # meters
                width=4.0,     # meters
                height=3.0,    # meters
                medium='water'  # Water-filled for hydraulic ram
            ),
        }
        
        # MEROE-SPECIFIC FEATURES
        self.features = {
            'base_width': 8.0,        # meters (typical)
            'height': 15.0,           # meters (typical)
            'slope_angle': 70.0,      # degrees (STEEP - key characteristic)
            'chapel_present': True,   # East-facing offering chapel
            'nile_distance': 500.0,   # meters (approximate)
        }
    
    def calculate_all_resonances(self) -> Dict:
        """Calculate resonances for all chambers"""
        results = {}
        
        for chamber_name, chamber in self.chambers.items():
            results[chamber_name] = {
                'fundamental': chamber.fundamental_frequency(),
                'cavity_modes': chamber.cavity_modes(),
                'harmonics': chamber.harmonic_series(5),
                'volume': chamber.volume(),
                'medium': chamber.medium
            }
        
        return results
    
    def analyze_hydraulic_ram_frequency(self) -> Dict:
        """
        Calculate HYDRAULIC RAM pulse frequency
        (KEY to Meroe system - steep angle for focused pulse)
        """
        # Hydraulic ram parameters
        nile_elevation_drop = 10.0  # meters (estimated from Nile to chamber)
        pipe_length = self.features['nile_distance']
        
        # Pulse frequency depends on pressure wave travel time
        # f = c / (2 * L) where c = speed of sound in water, L = pipe length
        pulse_frequency = SPEED_OF_SOUND_WATER / (2 * pipe_length)
        
        # Mechanical pulse rate (valve cycling)
        # Based on water hammer effect
        mechanical_frequency = np.sqrt(9.81 * nile_elevation_drop) / (2 * np.pi * pipe_length)
        
        return {
            'acoustic_pulse_frequency': pulse_frequency,
            'mechanical_pulse_frequency': mechanical_frequency,
            'pressure_wave_period': 1 / pulse_frequency,
            'interpretation': 'DC PULSE INJECTOR - Hydraulic Ram System'
        }


def compare_to_meroitic_domains(resonances: Dict) -> Dict:
    """
    Compare calculated resonances to Meroitic Domain Analysis
    """
    # Load domain data
    domain_data = {
        "VOID": {"level": 0, "average_resonance": 0.8534, "peak_resonance": 0.8635},
        "ATOMIC": {"level": 1, "average_resonance": 1.5413, "peak_resonance": 1.5915},
        "BIOLOGICAL": {"level": 2, "average_resonance": 2.3207, "peak_resonance": 2.3785},
        "GEOLOGICAL": {"level": 3, "average_resonance": 2.8517, "peak_resonance": 2.9339},
        "PLANETARY": {"level": 4, "average_resonance": 2.7771, "peak_resonance": 2.8453},
        "STELLAR": {"level": 5, "average_resonance": 2.9337, "peak_resonance": 3.0187},
        "GALACTIC": {"level": 6, "average_resonance": 4.9994, "peak_resonance": 5.0284},
        "UNIVERSAL": {"level": 7, "average_resonance": 0.1929, "peak_resonance": 0.1939},
        "QUANTUM_MECHANICS": {"level": 8, "average_resonance": 4.1239, "peak_resonance": 4.1407},
        "DIMENSIONAL_MATH": {"level": 9, "average_resonance": 6.6272, "peak_resonance": 6.8184},
        "TEMPORAL_PHYSICS": {"level": 10, "average_resonance": 6.4228, "peak_resonance": 6.4645},
        "CONSCIOUSNESS": {"level": 11, "average_resonance": 5.2104, "peak_resonance": 5.2559},
        "SOURCE_CODE": {"level": 12, "average_resonance": 7.1114, "peak_resonance": 7.1538},
    }
    
    matches = []
    
    # Flatten all calculated frequencies
    all_frequencies = []
    for chamber_name, data in resonances.items():
        all_frequencies.append(('fundamental', chamber_name, data['fundamental']))
        for mode_name, freq in data['cavity_modes'].items():
            all_frequencies.append((f'cavity_{mode_name}', chamber_name, freq))
    
    # Find matches (within 10% tolerance)
    tolerance = 0.10
    
    for freq_type, chamber, calculated_freq in all_frequencies:
        for domain_name, domain_data_item in domain_data.items():
            avg_resonance = domain_data_item['average_resonance']
            peak_resonance = domain_data_item['peak_resonance']
            
            # Check if calculated frequency matches domain resonance
            if abs(calculated_freq - avg_resonance) / avg_resonance < tolerance:
                matches.append({
                    'chamber': chamber,
                    'calculated_frequency': calculated_freq,
                    'matched_domain': domain_name,
                    'domain_resonance': avg_resonance,
                    'match_type': 'average',
                    'percent_diff': abs(calculated_freq - avg_resonance) / avg_resonance * 100,
                    'interpretation': freq_type
                })
            
            if abs(calculated_freq - peak_resonance) / peak_resonance < tolerance:
                matches.append({
                    'chamber': chamber,
                    'calculated_frequency': calculated_freq,
                    'matched_domain': domain_name,
                    'domain_resonance': peak_resonance,
                    'match_type': 'peak',
                    'percent_diff': abs(calculated_freq - peak_resonance) / peak_resonance * 100,
                    'interpretation': freq_type
                })
    
    return {
        'matches': sorted(matches, key=lambda x: x['percent_diff']),
        'total_matches': len(matches),
        'domain_coverage': len(set(m['matched_domain'] for m in matches))
    }


def main():
    """Run complete Meroe resonance analysis"""
    
    print("=" * 80)
    print("MEROE PYRAMID ACOUSTIC RESONANCE ANALYSIS")
    print("=" * 80)
    print()
    
    # Initialize Meroe pyramid model
    meroe = MeroePyramidComplex()
    
    print("MEROE PYRAMID SPECIFICATIONS:")
    print(f"  Base Width: {meroe.features['base_width']}m")
    print(f"  Height: {meroe.features['height']}m")
    print(f"  Slope Angle: {meroe.features['slope_angle']}° (STEEP - vs Giza 51°)")
    print(f"  Distance to Nile: {meroe.features['nile_distance']}m")
    print()
    
    # Calculate all chamber resonances
    print("CHAMBER RESONANCE ANALYSIS:")
    print("-" * 80)
    resonances = meroe.calculate_all_resonances()
    
    for chamber_name, data in resonances.items():
        print(f"\n{chamber_name.upper().replace('_', ' ')}:")
        print(f"  Medium: {data['medium']}")
        print(f"  Volume: {data['volume']:.2f} m³")
        print(f"  Fundamental Frequency: {data['fundamental']:.2f} Hz")
        print(f"  Cavity Modes:")
        for mode_name, freq in data['cavity_modes'].items():
            print(f"    {mode_name}: {freq:.2f} Hz")
    
    print("\n" + "=" * 80)
    print("HYDRAULIC RAM SYSTEM ANALYSIS (KEY MEROE FEATURE):")
    print("-" * 80)
    hydraulic = meroe.analyze_hydraulic_ram_frequency()
    print(f"  Acoustic Pulse Frequency: {hydraulic['acoustic_pulse_frequency']:.4f} Hz")
    print(f"  Mechanical Pulse Frequency: {hydraulic['mechanical_pulse_frequency']:.4f} Hz")
    print(f"  Interpretation: {hydraulic['interpretation']}")
    print()
    
    # Compare to Meroitic domains
    print("=" * 80)
    print("COMPARISON TO MEROITIC DOMAIN ANALYSIS:")
    print("-" * 80)
    comparison = compare_to_meroitic_domains(resonances)
    
    print(f"\nTOTAL MATCHES FOUND: {comparison['total_matches']}")
    print(f"DOMAINS COVERED: {comparison['domain_coverage']} / 13")
    print()
    
    if comparison['matches']:
        print("BEST MATCHES (sorted by accuracy):")
        print()
        for i, match in enumerate(comparison['matches'][:10], 1):
            print(f"{i}. {match['chamber']}")
            print(f"   Calculated: {match['calculated_frequency']:.4f} Hz ({match['interpretation']})")
            print(f"   Domain: {match['matched_domain']}")
            print(f"   Domain Resonance: {match['domain_resonance']:.4f} Hz ({match['match_type']})")
            print(f"   Difference: {match['percent_diff']:.2f}%")
            print()
    
    # Save results
    output = {
        'pyramid_specs': meroe.features,
        'chamber_resonances': {
            k: {
                'fundamental': v['fundamental'],
                'volume': v['volume'],
                'medium': v['medium'],
                'cavity_modes': v['cavity_modes']
            }
            for k, v in resonances.items()
        },
        'hydraulic_system': hydraulic,
        'domain_comparison': {
            'total_matches': comparison['total_matches'],
            'domain_coverage': comparison['domain_coverage'],
            'top_matches': comparison['matches'][:20]
        }
    }
    
    output_path = '/Users/uxmagicman/Desktop/ARN/web_portal/src/data/ANALYSIS/meroe_resonance_results.json'
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print("=" * 80)
    print(f"Results saved to: {output_path}")
    print("=" * 80)


if __name__ == '__main__':
    main()
