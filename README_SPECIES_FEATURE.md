# Fish Selector Feature Documentation

## Overview

The Fish Selector feature allows users to select one or more fish species for their aquarium. The system automatically loads species profiles (safe ranges & calibration presets) from the backend, computes merged recommendations, highlights conflicts, and raises species-specific warnings in real-time against live sensor data.

## Features

### 1. Fish Selector Component
- **Trigger**: Click the 🐠 icon in the header or press `F` key
- **Functionality**:
  - Multi-select species from a list
  - Preview selection before applying
  - Apply presets to save configuration
  - Keyboard navigable with focus trap
  - Accessible with ARIA roles

### 2. Species Profiles
Each species profile contains:
- `id`: Unique identifier
- `name`: Display name
- `icon`: Emoji icon
- `description`: Short description
- `ranges`: Safe ranges for ph, temp, do, tds, ntu
- `critical_ranges`: Tighter bounds for critical warnings
- `feed_schedule`: Feeding times and portions
- `calibration_presets`: Calibration offsets

### 3. Tank Profile Card
- Shows merged ranges for all selected species
- Visual overlap chart for each metric
- Conflict detection and resolution suggestions
- Apply Presets button to save configuration

### 4. Species Warning Bar
- Real-time warnings based on live sensor data
- Per-species status computation (OK/Warning/Critical)
- Animated warning chips
- Accept recommendation or Ignore actions

## API Endpoints

### Backend Routes

#### GET `/api/v1/species`
Returns list of all available species profiles.

**Response:**
```json
[
  {
    "id": "goldfish",
    "name": "Goldfish",
    "icon": "🐟",
    "description": "Cold-tolerant ornamental fish.",
    "ranges": {
      "ph": [7.0, 8.4],
      "temp": [18, 22],
      "do": [6, 30],
      "tds": [150, 400],
      "ntu": [0, 10]
    },
    "critical_ranges": {
      "ph": [6.5, 8.8],
      "temp": [15, 26]
    },
    "feed_schedule": {
      "times": ["09:00", "18:00"],
      "portions": "1-2"
    },
    "calibration_presets": {
      "ph_offset": 0.0,
      "temp_offset": 0.0,
      "do_calibration": 1.0
    }
  }
]
```

#### GET `/api/v1/species/:id`
Returns a specific species profile by ID.

#### GET `/api/v1/user/tank/:tankId/profile`
Returns computed merged profile for a tank.

**Response:**
```json
{
  "selectedSpecies": ["goldfish", "betta"],
  "mergedRanges": {
    "ph": [7.0, 7.5],
    "temp": null,
    "do": [6, 30],
    "tds": [150, 300],
    "ntu": [0, 5]
  },
  "conflicts": [
    {
      "metric": "temp",
      "species": ["Goldfish", "Betta"],
      "ranges": [[18, 22], [24, 28]],
      "intersection": null
    }
  ],
  "recommendations": [
    {
      "metric": "temp",
      "suggested_range": [20, 25],
      "reasoning": "Compromise range based on median of 2 species requirements"
    }
  ],
  "overrides": {}
}
```

#### POST `/api/v1/user/tank/:tankId/species`
Saves selected species and returns suggested rules.

**Request:**
```json
{
  "selectedSpecies": ["goldfish", "betta"],
  "overrides": {},
  "calibrationPresets": {
    "ph_offset": -0.1,
    "temp_offset": 0.0,
    "do_calibration": 1.0
  }
}
```

**Response:**
```json
{
  "ok": true,
  "conflict": true,
  "conflicts": [...],
  "recommendations": [...],
  "suggestedRules": [
    {
      "type": "ph",
      "condition": "ph < 7.0 || ph > 7.5",
      "action": "alert"
    }
  ],
  "calibrationPresets": {...},
  "mergedRanges": {...}
}
```

## Conflict Resolution Algorithm

1. **For each metric**, compute intersection of all ranges:
   - `intersection = [max(mins), min(maxs)]`
   - If `max(mins) > min(maxs)` → empty (conflict)

2. **Suggest compromise**:
   - Choose median of all mins and median of all maxs
   - Or propose prioritization if user selects

## Mock Fallback

If the backend `/api/v1/species` endpoint is unreachable, the frontend automatically falls back to `src/data/speciesProfiles.mock.json`.

## Development

### Keyboard Shortcuts
- `F` - Open/close Fish Selector
- `Escape` - Close Fish Selector
- `Tab` - Navigate through species list
- `Enter` / `Space` - Toggle species selection

### Testing

Run unit tests for species merge logic:
```bash
npm test useSpeciesProfile.test.js
```

### Integration Test Example
1. Select Goldfish + Betta
2. Expect conflict for temperature (Goldfish: 18-22°C, Betta: 24-28°C)
3. Expect API returns `conflict: true`
4. Verify recommendation suggests compromise range

## Files Created

### Frontend
- `src/data/speciesProfiles.mock.json` - Mock species data
- `src/components/FishSelector.jsx` - Selector UI component
- `src/components/FishSelector.css` - Selector styles
- `src/components/TankProfileCard.jsx` - Profile display component
- `src/components/TankProfileCard.css` - Profile card styles
- `src/components/SpeciesWarningBar.jsx` - Warning alerts component
- `src/components/SpeciesWarningBar.css` - Warning bar styles
- `src/hooks/useSpeciesProfile.js` - Species profile hook
- `src/hooks/useSpeciesProfile.test.js` - Unit tests
- `src/types/species.ts` - TypeScript type definitions

### Backend
- `backend/src/data/species_profiles.json` - Seed species data
- Updated `backend/src/api.ts` - Added species and tank routes
- Updated `backend/src/db.ts` - Added user_tank_profiles table

## Integration

The feature is integrated into `src/App.jsx`:
- Fish Selector trigger button in header
- Tank Profile Card shown on dashboard when species selected
- Species Warning Bar displays real-time warnings
- All components use sea blue theme matching the existing design

## Accessibility

- Keyboard navigable with focus trap
- Proper ARIA roles and labels
- Screen reader announcements for warnings
- Focus management in modal dialogs

