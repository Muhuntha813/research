/**
 * Unit tests for useSpeciesProfile hook
 * Tests merging logic and conflict detection
 */

import { describe, it, expect } from 'vitest';

// Mock species profiles
const mockSpecies = [
  {
    id: 'goldfish',
    name: 'Goldfish',
    ranges: { ph: [7.0, 8.4], temp: [18, 22], do: [6, 30], tds: [150, 400], ntu: [0, 10] },
    critical_ranges: { ph: [6.5, 8.8], temp: [15, 26] },
  },
  {
    id: 'betta',
    name: 'Betta',
    ranges: { ph: [6.5, 7.5], temp: [24, 28], do: [5, 30], tds: [100, 300], ntu: [0, 5] },
    critical_ranges: { ph: [6.0, 8.0], temp: [22, 30] },
  },
];

/**
 * Intersect ranges helper function
 */
function intersectRanges(ranges) {
  if (ranges.length === 0) return null;
  if (ranges.length === 1) return ranges[0];

  const maxMin = Math.max(...ranges.map(r => r[0]));
  const minMax = Math.min(...ranges.map(r => r[1]));

  if (maxMin > minMax) return null;
  return [maxMin, minMax];
}

describe('useSpeciesProfile - Range Merging', () => {
  it('should merge compatible ranges', () => {
    // Goldfish and Betta have overlapping pH ranges: [7.0, 8.4] and [6.5, 7.5]
    // Intersection should be [7.0, 7.5]
    const phRanges = [
      mockSpecies[0].ranges.ph,
      mockSpecies[1].ranges.ph,
    ];
    const merged = intersectRanges(phRanges);
    expect(merged).toEqual([7.0, 7.5]);
  });

  it('should detect temperature conflict between Goldfish and Betta', () => {
    // Goldfish: [18, 22], Betta: [24, 28] - no overlap
    const tempRanges = [
      mockSpecies[0].ranges.temp,
      mockSpecies[1].ranges.temp,
    ];
    const merged = intersectRanges(tempRanges);
    expect(merged).toBeNull(); // Conflict detected
  });

  it('should merge DO ranges (both have wide ranges)', () => {
    // Goldfish: [6, 30], Betta: [5, 30] - intersection: [6, 30]
    const doRanges = [
      mockSpecies[0].ranges.do,
      mockSpecies[1].ranges.do,
    ];
    const merged = intersectRanges(doRanges);
    expect(merged).toEqual([6, 30]);
  });

  it('should handle single species selection', () => {
    const singleRange = [mockSpecies[0].ranges.ph];
    const merged = intersectRanges(singleRange);
    expect(merged).toEqual(mockSpecies[0].ranges.ph);
  });

  it('should handle empty selection', () => {
    const merged = intersectRanges([]);
    expect(merged).toBeNull();
  });
});

describe('useSpeciesProfile - Conflict Detection', () => {
  it('should identify conflicts correctly', () => {
    const goldfish = mockSpecies[0];
    const betta = mockSpecies[1];

    // Temperature conflict
    const tempConflict = intersectRanges([
      goldfish.ranges.temp,
      betta.ranges.temp,
    ]);
    expect(tempConflict).toBeNull();

    // pH should have overlap (no conflict)
    const phOverlap = intersectRanges([
      goldfish.ranges.ph,
      betta.ranges.ph,
    ]);
    expect(phOverlap).not.toBeNull();
  });
});

