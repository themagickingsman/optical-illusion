export interface PeriodicElement {
    number: number;
    symbol: string;
    name: string;
    category: string;
    atomic_mass: number;
}

export const ELEMENTS: PeriodicElement[] = [
    { number: 1, symbol: 'H', name: 'Hydrogen', category: 'diatomic nonmetal', atomic_mass: 1.008 },
    { number: 2, symbol: 'He', name: 'Helium', category: 'noble gas', atomic_mass: 4.0026 },
    { number: 6, symbol: 'C', name: 'Carbon', category: 'polyatomic nonmetal', atomic_mass: 12.011 },
    { number: 7, symbol: 'N', name: 'Nitrogen', category: 'diatomic nonmetal', atomic_mass: 14.007 },
    { number: 8, symbol: 'O', name: 'Oxygen', category: 'diatomic nonmetal', atomic_mass: 15.999 },
    { number: 14, symbol: 'Si', name: 'Silicon', category: 'metalloid', atomic_mass: 28.085 },
    { number: 26, symbol: 'Fe', name: 'Iron', category: 'transition metal', atomic_mass: 55.845 },
    { number: 79, symbol: 'Au', name: 'Gold', category: 'transition metal', atomic_mass: 196.97 }
];

export const CATEGORY_COLORS: Record<string, string> = {
    'diatomic nonmetal': '#3b82f6',
    'noble gas': '#a855f7',
    'polyatomic nonmetal': '#10b981',
    'metalloid': '#f59e0b',
    'transition metal': '#ef4444'
};

export function calculateElementalFrequency(element: PeriodicElement): number {
    // Harmonic calculation mock based on atomic mass and proton count
    return element.atomic_mass * 144 + element.number * 432; 
}

export function formatFrequency(hz: number): string {
    if (hz >= 1e12) return `${(hz / 1e12).toFixed(2)} THz`;
    if (hz >= 1e9) return `${(hz / 1e9).toFixed(2)} GHz`;
    if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)} MHz`;
    if (hz >= 1e3) return `${(hz / 1e3).toFixed(2)} kHz`;
    return `${hz.toFixed(2)} Hz`;
}
