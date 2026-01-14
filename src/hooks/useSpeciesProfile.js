import { useState, useEffect, useMemo } from 'react';
import speciesProfilesMock from '../data/speciesProfiles.mock.json';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Compute intersection of multiple ranges
 * @param {Array<[number, number]>} ranges - Array of [min, max] tuples
 * @returns {[number, number] | null} Intersection range or null if empty
 */
function intersectRanges(ranges) {
  if (ranges.length === 0) return null;
  if (ranges.length === 1) return ranges[0];

  const maxMin = Math.max(...ranges.map(r => r[0]));
  const minMax = Math.min(...ranges.map(r => r[1]));

  if (maxMin > minMax) return null; // No intersection
  return [maxMin, minMax];
}

/**
 * Compute median of array
 */
function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Hook to fetch species profiles and compute merged ranges
 * @param {string[]} selectedSpeciesIds - Array of selected species IDs
 * @param {Object} options - Options object
 * @returns {Object} Merged ranges, conflicts, recommendations, etc.
 */
export function useSpeciesProfile(selectedSpeciesIds = [], options = {}) {
  const [speciesProfiles, setSpeciesProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch species profiles from API or fallback to mock
  useEffect(() => {
    let mounted = true;

    async function fetchSpecies() {
      try {
        const response = await fetch(`${API_BASE}/api/v1/species`);
        if (!response.ok) throw new Error('API unavailable');
        const data = await response.json();
        if (mounted) {
          setSpeciesProfiles(data);
          setLoading(false);
        }
      } catch (err) {
        // Fallback to mock data
        if (mounted) {
          setSpeciesProfiles(speciesProfilesMock);
          setLoading(false);
          if (options.logErrors) {
            console.warn('Using mock species data:', err);
          }
        }
      }
    }

    fetchSpecies();
    return () => { mounted = false; };
  }, [options.logErrors]);

  // Compute merged ranges and conflicts
  const { mergedRanges, conflicts, recommendations, calibrationPresets } = useMemo(() => {
    if (selectedSpeciesIds.length === 0) {
      return {
        mergedRanges: {
          ph: null,
          temp: null,
          do: null,
          tds: null,
          ntu: null,
        },
        conflicts: [],
        recommendations: [],
        calibrationPresets: {
          ph_offset: 0,
          temp_offset: 0,
          do_calibration: 1.0,
        },
      };
    }

    const selected = speciesProfiles.filter(p => selectedSpeciesIds.includes(p.id));
    if (selected.length === 0) {
      return {
        mergedRanges: {
          ph: null,
          temp: null,
          do: null,
          tds: null,
          ntu: null,
        },
        conflicts: [],
        recommendations: [],
        calibrationPresets: {
          ph_offset: 0,
          temp_offset: 0,
          do_calibration: 1.0,
        },
      };
    }

    const metrics = ['ph', 'temp', 'do', 'tds', 'ntu'];
    const merged = {};
    const conflictsList = [];
    const recommendationsList = [];

    metrics.forEach(metric => {
      const ranges = selected.map(s => s.ranges[metric]);
      const intersection = intersectRanges(ranges);

      merged[metric] = intersection;

      if (!intersection) {
        // Conflict detected
        const conflict = {
          metric,
          species: selected.map(s => s.name),
          ranges,
          intersection: null,
        };
        conflictsList.push(conflict);

        // Generate recommendation
        const mins = ranges.map(r => r[0]);
        const maxs = ranges.map(r => r[1]);
        const suggestedMin = median(mins);
        const suggestedMax = median(maxs);

        recommendationsList.push({
          metric,
          suggested_range: [suggestedMin, suggestedMax],
          reasoning: `Compromise range based on median of ${selected.length} species requirements`,
        });
      }
    });

    // Compute merged calibration presets (average)
    const calPresets = {
      ph_offset: selected.reduce((sum, s) => sum + s.calibration_presets.ph_offset, 0) / selected.length,
      temp_offset: selected.reduce((sum, s) => sum + s.calibration_presets.temp_offset, 0) / selected.length,
      do_calibration: selected.reduce((sum, s) => sum + s.calibration_presets.do_calibration, 0) / selected.length,
    };

    return {
      mergedRanges: merged,
      conflicts: conflictsList,
      recommendations: recommendationsList,
      calibrationPresets: calPresets,
    };
  }, [selectedSpeciesIds, speciesProfiles]);

  /**
   * Get severity for a metric value
   * @param {number} value - Current sensor value
   * @param {string} metric - Metric name (ph, temp, do, tds, ntu)
   * @param {string} speciesId - Optional species ID for species-specific check
   * @returns {'ok' | 'warning' | 'critical'} Severity level
   */
  const getSeverity = (value, metric, speciesId = null) => {
    if (!value || value === null || value === undefined) return 'ok';

    let range = null;
    let criticalRange = null;

    if (speciesId) {
      const species = speciesProfiles.find(s => s.id === speciesId);
      if (species) {
        range = species.ranges[metric];
        criticalRange = species.critical_ranges[metric];
      }
    } else if (mergedRanges[metric]) {
      range = mergedRanges[metric];
      // Use widest critical range from selected species
      const selected = speciesProfiles.filter(s => selectedSpeciesIds.includes(s.id));
      const criticalRanges = selected
        .map(s => s.critical_ranges[metric])
        .filter(r => r != null);
      if (criticalRanges.length > 0) {
        const mins = criticalRanges.map(r => r[0]);
        const maxs = criticalRanges.map(r => r[1]);
        criticalRange = [Math.min(...mins), Math.max(...maxs)];
      }
    }

    if (!range) return 'ok';

    // Check critical range first
    if (criticalRange) {
      if (value < criticalRange[0] || value > criticalRange[1]) {
        return 'critical';
      }
    }

    // Check normal range
    if (value < range[0] || value > range[1]) {
      return 'warning';
    }

    return 'ok';
  };

  return {
    speciesProfiles,
    mergedRanges,
    conflicts,
    recommendations,
    calibrationPresets,
    getSeverity,
    loading,
    error,
  };
}

