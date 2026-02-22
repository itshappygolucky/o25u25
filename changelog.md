# Changelog

## [Unreleased]

## [1.0.0] - 2025-02-22

### Added
- Settings: "Connect a HR sensor" area with explanation (no system Bluetooth pairing needed); BLE unavailable message when not in a dev build
- Run detail: splits table with km, pace, visual pace bar, and avg HR per km
- Run detail: pace line chart (pace on X, km on Y) with elapsed time, avg pace, and fastest split below
- Run detail: heart rate line chart (bpm on X, km on Y) with avg HR and max HR below
- Run detail screen: tap a run to see summary, route map, per-km splits table, pace chart, and heart rate chart
- Start run: single "Start run" button before a run; play/pause and stop appear after start, "Start run" returns after stop

### Changed
- Timer notification: single **Play/Pause** action instead of separate Pause and Resume buttons; notification actions now call the same playPause/stop as in-app and dedupe so one tap is not handled twice
- Run detail: always show Splits table, Pace chart, and Heart rate chart below route; show "Data not available" when there aren't enough data points
- Map: switch to react-native-maps-osmdroid; Android uses OSM (osmdroid), no Google Maps SDK or API key; iOS uses Apple Maps (SDK init), restored app.config.js

### Removed
- Map: remove react-native-maps-osmdroid and native map UI; RunMap is now a placeholder ("Map (coming back later)"). Removed withSupportLibVersion Expo plugin and lib/run-map-native.native.tsx. Map can be re-added later.

### Fixed
- Dev build (New Architecture): guard react-native-maps-osmdroid for null UIManager so app loads (fix "Cannot read property 'getViewManagerConfig' of null"); map still uses OsmMap native view
- Dev build: fix react-native-maps-osmdroid MapView when ViewPropTypes is undefined (RN 0.81+ / React 19), fix "Cannot read property 'style' of undefined"
- Dev build (React 19): replace legacy childContextTypes/getChildContext in react-native-maps-osmdroid with MapProviderContext (React.createContext) so MapView loads
- EAS Android build: add supportLibVersion via Expo config plugin so react-native-maps-osmdroid Gradle build succeeds (fix "Could not get unknown property 'supportLibVersion'")
- EAS Android build: enable New Architecture (required by react-native-reanimated and react-native-worklets)
- Index: use `seconds` from timer context so "Start run" visibility works (fix "seconds is not defined")
- Show map placeholder in Expo Go on Android instead of blank/grey map (Google Maps tiles require a dev build)
