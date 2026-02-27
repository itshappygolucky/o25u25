# Changelog

## [Unreleased]

## [1.3.0] - 2025-02-27

### Added
- Run detail: "Export for Strava (GPX)" button — exports the run as a GPX file (download on web, share/save on device) for upload at strava.com/upload/select
- Settings: Strava sync — connect Strava account to auto-upload runs when you stop; runs under 200 m and under 1 minute are not uploaded (avoids accidental/short runs)
- Strava: OAuth connect/disconnect in Settings; token exchange via backend (EXPO_PUBLIC_STRAVA_CLIENT_ID and EXPO_PUBLIC_STRAVA_TOKEN_EXCHANGE_URL); GPX upload for runs with path, manual activity for runs without path
- Stats: new Stats screen with key stats (runs, total distance, time running), distance-per-run and pace-trend charts, and weekly progress
- Index: Stats button next to Previous runs linking to Stats screen
- Stats: Pie charts under Progress – "Distance by run length" (share of total km in &lt;1km, 1–3km, 3–5km, 5+ km) and "Runs by weekday"
- PieChart component (react-native-svg) for stats screen
 - Index: after ending a run, automatically open that run’s detail stats page so you can review it immediately
- Index (web): "End run?" confirmation shown in an in-app modal popup instead of the browser confirm dialog
- Index: when ending a run without a saved run (e.g. web), navigate to the last run’s detail instead of the runs list; only show runs list if there are no runs

### Changed
- Stats: Pie charts moved to bottom of page in a "Distribution" section; charts converted to donut style (inner radius 55%)
- Stats: Progress section moved to top (below key stats); added monthly and yearly distance with comparison to previous period
- Stats: Bar charts layout fixed so labels sit in a separate row below bars and no longer overlap section titles

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
