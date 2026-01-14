import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeciesProfile } from '../hooks/useSpeciesProfile';
import './SpeciesWarningBar.css';

/**
 * SpeciesWarningBar - Animated alerts for species-specific warnings
 * Subscribes to live data and computes per-species status
 */
export default function SpeciesWarningBar({ 
  selectedSpeciesIds = [], 
  sensors = {},
  onAcceptRecommendation,
  onIgnore
}) {
  const { speciesProfiles, getSeverity } = useSpeciesProfile(selectedSpeciesIds);
  const [warnings, setWarnings] = useState([]);
  const [dismissedWarnings, setDismissedWarnings] = useState(new Set());

  // Compute warnings from live sensor data
  useEffect(() => {
    if (selectedSpeciesIds.length === 0 || !sensors) {
      setWarnings([]);
      return;
    }

    const newWarnings = [];

    selectedSpeciesIds.forEach(speciesId => {
      const species = speciesProfiles.find(s => s.id === speciesId);
      if (!species) return;

      const metrics = [
        { key: 'ph', value: sensors.ph, label: 'pH' },
        { key: 'temp', value: sensors.waterTemp, label: 'Temperature' },
        { key: 'do', value: sensors.do, label: 'Dissolved Oxygen' },
        { key: 'tds', value: sensors.tds, label: 'TDS' },
        { key: 'ntu', value: sensors.ntu, label: 'Turbidity' },
      ];

      metrics.forEach(metric => {
        if (metric.value == null) return;

        const severity = getSeverity(metric.value, metric.key, speciesId);
        
        if (severity !== 'ok') {
          const range = species.ranges[metric.key];
          const criticalRange = species.critical_ranges[metric.key];
          
          let message = '';
          let recommendedAction = '';

          if (severity === 'critical') {
            if (metric.key === 'temp') {
              if (metric.value > (criticalRange?.[1] || range[1])) {
                message = `Temperature ${metric.value.toFixed(1)}°C is too high`;
                recommendedAction = 'Reduce heater or increase cooling';
              } else {
                message = `Temperature ${metric.value.toFixed(1)}°C is too low`;
                recommendedAction = 'Increase heater or reduce cooling';
              }
            } else if (metric.key === 'ph') {
              if (metric.value > (criticalRange?.[1] || range[1])) {
                message = `pH ${metric.value.toFixed(1)} is too high`;
                recommendedAction = 'Add pH reducer or increase aeration';
              } else {
                message = `pH ${metric.value.toFixed(1)} is too low`;
                recommendedAction = 'Add pH increaser or reduce aeration';
              }
            } else {
              message = `${metric.label} ${metric.value.toFixed(1)} is out of critical range`;
              recommendedAction = `Adjust ${metric.label} to target range`;
            }
          } else {
            // warning
            if (metric.value > range[1]) {
              message = `${metric.label} ${metric.value.toFixed(1)} is above optimal range`;
            } else {
              message = `${metric.label} ${metric.value.toFixed(1)} is below optimal range`;
            }
            recommendedAction = `Monitor and adjust if needed`;
          }

          const warningId = `${speciesId}-${metric.key}-${severity}`;
          if (!dismissedWarnings.has(warningId)) {
            newWarnings.push({
              id: warningId,
              speciesId,
              speciesName: species.name,
              speciesIcon: species.icon,
              metric: metric.key,
              value: metric.value,
              severity,
              message,
              recommendedAction,
            });
          }
        }
      });
    });

    setWarnings(newWarnings);
  }, [selectedSpeciesIds, sensors, speciesProfiles, getSeverity, dismissedWarnings]);

  const handleDismiss = (warningId) => {
    setDismissedWarnings(prev => new Set([...prev, warningId]));
    if (onIgnore) {
      onIgnore(warningId);
    }
  };

  const handleAccept = (warning) => {
    handleDismiss(warning.id);
    if (onAcceptRecommendation) {
      onAcceptRecommendation(warning);
    }
  };

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="species-warning-bar" role="alert" aria-live="polite">
      <AnimatePresence>
        {warnings.map((warning) => (
          <motion.div
            key={warning.id}
            className={`species-warning-chip species-warning-chip-${warning.severity}`}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="species-warning-icon">{warning.speciesIcon}</div>
            <div className="species-warning-content">
              <div className="species-warning-header">
                <span className="species-warning-species">{warning.speciesName}</span>
                <span className="species-warning-severity-badge">{warning.severity}</span>
              </div>
              <div className="species-warning-message">{warning.message}</div>
              {warning.recommendedAction && (
                <div className="species-warning-action">{warning.recommendedAction}</div>
              )}
            </div>
            <div className="species-warning-actions">
              <button
                className="species-warning-btn species-warning-btn-accept"
                onClick={() => handleAccept(warning)}
                aria-label={`Accept recommendation for ${warning.speciesName}`}
              >
                Accept
              </button>
              <button
                className="species-warning-btn species-warning-btn-dismiss"
                onClick={() => handleDismiss(warning.id)}
                aria-label={`Dismiss warning for ${warning.speciesName}`}
              >
                Ignore
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

