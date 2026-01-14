import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeciesProfile } from '../hooks/useSpeciesProfile';
import './FishSelector.css';

/**
 * FishSelector - Floating cursor-triggered selector UI
 * Triggered by header icon or keyboard shortcut (F key)
 */
export default function FishSelector({ 
  selectedSpeciesIds = [], 
  onSelectionChange, 
  onApply,
  onCancel,
  triggerElement = null,
  isOpen: externalIsOpen = null,
  onOpenChange = null
}) {
  const [isOpen, setIsOpen] = useState(externalIsOpen !== null ? externalIsOpen : false);
  const [localSelection, setLocalSelection] = useState(selectedSpeciesIds);
  const [previewMode, setPreviewMode] = useState(false);
  const containerRef = useRef(null);
  const { speciesProfiles, loading } = useSpeciesProfile([], { logErrors: true });

  // Sync with external open state
  useEffect(() => {
    if (externalIsOpen !== null) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  // Notify parent of open state changes
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  // Sync local selection with props
  useEffect(() => {
    setLocalSelection(selectedSpeciesIds);
  }, [selectedSpeciesIds]);

  // Keyboard shortcut: F key to open/close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          const newState = !isOpen;
          setIsOpen(newState);
          if (onOpenChange) onOpenChange(newState);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        if (onOpenChange) onOpenChange(false);
        if (onCancel) onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onOpenChange]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (triggerElement && triggerElement.contains(e.target)) {
          return; // Don't close if clicking trigger
        }
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, triggerElement]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleToggleSpecies = (speciesId) => {
    setLocalSelection(prev => 
      prev.includes(speciesId)
        ? prev.filter(id => id !== speciesId)
        : [...prev, speciesId]
    );
  };

  const handleApply = async () => {
    if (onSelectionChange) {
      onSelectionChange(localSelection);
    }
    if (onApply) {
      // Call onApply with the selection, it may be async
      const result = await onApply(localSelection);
      if (result && !result.error) {
        setIsOpen(false);
        if (onOpenChange) onOpenChange(false);
      }
    } else {
      setIsOpen(false);
      if (onOpenChange) onOpenChange(false);
    }
  };

  const handlePreview = () => {
    setPreviewMode(true);
    if (onSelectionChange) {
      onSelectionChange(localSelection);
    }
  };

  const handleCancel = () => {
    setLocalSelection(selectedSpeciesIds);
    setIsOpen(false);
    if (onOpenChange) onOpenChange(false);
    if (onCancel) onCancel();
  };

  return (
    <>
      {/* Trigger button - only render if not controlled externally and no triggerElement provided */}
      {!triggerElement && externalIsOpen === null && (
        <button
          className="fish-selector-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Select fish species"
          aria-haspopup="dialog"
        >
          <span className="text-2xl">🐠</span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fish-selector-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Modal */}
            <div
              className="fish-selector-container"
              role="dialog"
              aria-modal="true"
              aria-labelledby="fish-selector-title"
              ref={containerRef}
            >
              <motion.div
                className="fish-selector-card"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                {/* Header */}
                <div className="fish-selector-header">
                  <h2 id="fish-selector-title" className="fish-selector-title">
                    Select Fish Species
                  </h2>
                  <button
                    className="fish-selector-close"
                    onClick={handleCancel}
                    aria-label="Close fish selector"
                  >
                    ×
                  </button>
                </div>

                {/* Content */}
                <div className="fish-selector-content">
                  {loading ? (
                    <div className="fish-selector-loading">Loading species...</div>
                  ) : (
                    <div className="fish-selector-list" role="listbox" aria-multiselectable="true">
                      {speciesProfiles.map((species) => (
                        <motion.div
                          key={species.id}
                          className={`fish-selector-item ${
                            localSelection.includes(species.id) ? 'selected' : ''
                          }`}
                          onClick={() => handleToggleSpecies(species.id)}
                          role="option"
                          aria-selected={localSelection.includes(species.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <input
                            type="checkbox"
                            checked={localSelection.includes(species.id)}
                            onChange={() => handleToggleSpecies(species.id)}
                            className="fish-selector-checkbox"
                            aria-label={`Select ${species.name}`}
                          />
                          <span className="fish-selector-icon">{species.icon}</span>
                          <div className="fish-selector-info">
                            <div className="fish-selector-name">{species.name}</div>
                            <div className="fish-selector-description">{species.description}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="fish-selector-footer">
                  <div className="fish-selector-selection-info">
                    {localSelection.length > 0 && (
                      <span>{localSelection.length} species selected</span>
                    )}
                  </div>
                  <div className="fish-selector-actions">
                    <button
                      className="fish-selector-btn fish-selector-btn-secondary"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button
                      className="fish-selector-btn fish-selector-btn-secondary"
                      onClick={handlePreview}
                      disabled={localSelection.length === 0}
                    >
                      Preview
                    </button>
                    <button
                      className="fish-selector-btn fish-selector-btn-primary"
                      onClick={handleApply}
                      disabled={localSelection.length === 0}
                    >
                      Apply Presets
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

