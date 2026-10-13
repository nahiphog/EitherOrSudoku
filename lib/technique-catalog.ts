// Concrete GPL-3.0 implementations are imported from sudokUI in lib/sudokui.
export const techniqueFamilies = {
  Singles: ['Full House', 'Naked Single', 'Hidden Single'],
  Intersections: ['Locked Pair', 'Locked Triple', 'Pointing', 'Claiming'],
  Subsets: ['Naked Pair', 'Hidden Pair', 'Naked Triple', 'Hidden Triple', 'Naked Quadruple', 'Hidden Quadruple'],
  'Basic Fish': ['X-Wing', 'Swordfish', 'Jellyfish', 'Squirmbag', 'Whale', 'Leviathan'],
  'Finned Fish': ['Finned X-Wing', 'Sashimi X-Wing', 'Finned Swordfish', 'Sashimi Swordfish', 'Finned Jellyfish', 'Sashimi Jellyfish'],
  'Complex Fish': ['Franken X-Wing', 'Franken Swordfish'],
  'Single-digit patterns': ['Skyscraper', '2-String Kite', 'Turbot Fish', 'Empty Rectangle'],
  Wings: ['XY-Wing', 'XYZ-Wing', 'W-Wing', 'WXYZ-Wing'],
} as const;
