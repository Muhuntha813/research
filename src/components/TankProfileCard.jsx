import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSpeciesProfile } from '../hooks/useSpeciesProfile';
import './TankProfileCard.css';

/**
 * TankProfileCard - Shows merged ranges, conflicts, and Apply Presets button
 * Displays visual overlap chart for each metric
 */
export default function TankProfileCard({ 
  selectedSpeciesIds = [], 
  onApplyPresets,
  tankId = 'default'
}) {
  const { mergedRanges, conflicts, recommendations, calibrationPresets, speciesProfiles } = useSpeciesProfile(selectedSpeciesIds);
  const [showPreview, setShowPreview] = useState(false);
  const [applying, setApplying] = useState(false);

  if (selectedSpeciesIds.length === 0) {
    return (
      <div className="tank-profile-card">
        <div className="tank-profile-empty">
          <span className="text-4xl mb-2">🐠</span>
          <p>No species selected. Select fish to see tank profile.</p>
        </div>
      </div>
    );
  }

  const selectedSpecies = speciesProfiles.filter(s => selectedSpeciesIds.includes(s.id));

  const handleApplyPresets = async () => {
    setApplying(true);
    try {
      const response = await fetch(`/api/v1/user/tank/${tankId}/species`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedSpecies: selectedSpeciesIds,
          overrides: {},
          calibrationPresets,
        }),
      });

      if (!response.ok) throw new Error('Failed to apply presets');

      const data = await response.json();
      setShowPreview(true);

      if (onApplyPresets) {
        onApplyPresets(data);
      }
    } catch (error) {
      console.error('Error applying presets:', error);
      // Fallback: just call callback
      if (onApplyPresets) {
        onApplyPresets({ suggestedRules: [], conflicts: conflicts.length > 0 });
      }
    } finally {
      setApplying(false);
    }
  };

  const metrics = [
    { key: 'ph', label: 'pH', unit: '', color: '#3b82f6' },
    { key: 'temp', label: 'Temperature', unit: '°C', color: '#f59e0b' },
    { key: 'do', label: 'Dissolved Oxygen', unit: 'mg/L', color: '#10b981' },
    { key: 'tds', label: 'TDS', unit: 'ppm', color: '#6366f1' },
    { key: 'ntu', label: 'Turbidity', unit: 'NTU', color: '#8b5cf6' },
  ];

  return (
    <div className="tank-profile-card">
      <div className="tank-profile-header">
        <h3 className="tank-profile-title">Tank Profile</h3>
        <div className="tank-profile-species-count">
          {selectedSpeciesIds.length} species selected
        </div>
      </div>

      {/* Merged Ranges Visualization */}
      <div className="tank-profile-ranges">
        {metrics.map((metric) => {
          const range = mergedRanges[metric.key];
          const conflict = conflicts.find(c => c.metric === metric.key);
          const recommendation = recommendations.find(r => r.metric === metric.key);

          return (
            <div key={metric.key} className="tank-profile-metric">
              <div className="tank-profile-metric-header">
                <span className="tank-profile-metric-label">{metric.label}</span>
                {range ? (
                  <span className="tank-profile-metric-range">
                    {range[0].toFixed(1)} - {range[1].toFixed(1)} {metric.unit}
                  </span>
                ) : (
                  <span className="tank-profile-metric-conflict">Conflict!</span>
                )}
              </div>

              {/* Range Visualization */}
              <div className="tank-profile-range-visualization">
                {/* Background scale */}
                <div className="tank-profile-scale">
                  {(() => {
                    // Calculate overall min/max for scaling
                    const allMins = selectedSpecies.map(s => s.ranges[metric.key][0]);
                    const allMaxs = selectedSpecies.map(s => s.ranges[metric.key][1]);
                    const scaleMin = Math.min(...allMins);
                    const scaleMax = Math.max(...allMaxs);
                    const scaleRange = scaleMax - scaleMin;

                    return (
                      <>
                        {selectedSpecies.map((species, idx) => {
                          const speciesRange = species.ranges[metric.key];
                          if (!speciesRange) return null;

                          const left = scaleRange > 0 ? ((speciesRange[0] - scaleMin) / scaleRange) * 100 : 0;
                          const width = scaleRange > 0 ? ((speciesRange[1] - speciesRange[0]) / scaleRange) * 100 : 0;

                          return (
                            <div
                              key={species.id}
                              className="tank-profile-species-band"
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                backgroundColor: `${metric.color}${Math.floor(20 + idx * 30).toString(16)}`,
                              }}
                              title={`${species.name}: ${speciesRange[0]}-${speciesRange[1]}`}
                            />
                          );
                        })}

                        {/* Merged range indicator */}
                        {range && scaleRange > 0 && (
                          <div
                            className="tank-profile-merged-band"
                            style={{
                              left: `${((range[0] - scaleMin) / scaleRange) * 100}%`,
                              width: `${((range[1] - range[0]) / scaleRange) * 100}%`,
                              borderColor: metric.color,
                            }}
                            title={`Merged: ${range[0]}-${range[1]}`}
                          />
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Conflict indicator */}
                {conflict && (
                  <div className="tank-profile-conflict-indicator">
                    ⚠️ Range conflict detected
                  </div>
                )}
              </div>

              {/* Recommendation */}
              {recommendation && (
                <div className="tank-profile-recommendation">
                  <span className="tank-profile-recommendation-label">Suggested:</span>
                  <span className="tank-profile-recommendation-range">
                    {recommendation.suggested_range[0].toFixed(1)} - {recommendation.suggested_range[1].toFixed(1)} {metric.unit}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Conflicts Section */}
      {conflicts.length > 0 && (
        <div className="tank-profile-conflicts">
          <h4 className="tank-profile-conflicts-title">⚠️ Range Conflicts</h4>
          {conflicts.map((conflict) => (
            <div key={conflict.metric} className="tank-profile-conflict-item">
              <div className="tank-profile-conflict-metric">{conflict.metric.toUpperCase()}</div>
              <div className="tank-profile-conflict-species">
                Conflicting species: {conflict.species.join(', ')}
              </div>
              <div className="tank-profile-conflict-ranges">
                {conflict.ranges.map((range, idx) => (
                  <span key={idx} className="tank-profile-conflict-range">
                    {range[0]}-{range[1]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply Presets Button */}
      <div className="tank-profile-actions">
        <button
          className="tank-profile-apply-btn"
          onClick={handleApplyPresets}
          disabled={applying}
        >
          {applying ? 'Applying...' : 'Apply Presets'}
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <motion.div
          className="tank-profile-preview-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="tank-profile-preview-content">
            <h4>Preview Suggested Rules</h4>
            <p>Rules will be applied to your tank configuration.</p>
            <div className="tank-profile-preview-actions">
              <button onClick={() => setShowPreview(false)}>Close</button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

