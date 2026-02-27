# Changelog

## [Unreleased]

## [1.3.0] - 2025-02-27

### Added
- Android: live lockscreen timer using system chronometer (NotificationCompat.setUsesChronometer + setWhen); when the run is active the notification time updates on the lockscreen without reopening the app (patch on expo-notifications)
- Settings: "Forget sensor" button in Connect a HR sensor section to clear the saved device
- Settings: "Connect a sensor" button in HR section; BLE-unavailable message only appears after tapping the button
- Settings > Data: "Export backup (JSON)" and "Import backup (JSON)" buttons for round-tripping runs between devices or restoring from backups
- Settings > Data: "Import from GPX (Strava / others)" button using file picker to import a .gpx file into a run
 - Index: after ending a run, automatically open that run’s detail stats page so you can review it immediately
- Index (web): "End run?" confirmation shown in an in-app modal popup instead of the browser confirm dialog
- Index: when ending a run without a saved run (e.g. web), navigate to the last run’s detail instead of the runs list; only show runs list if there are no runs

### Changed
- Settings: content now scrolls vertically so all sections are reachable on smaller screens

### Fixed
- Settings (web): fix "ScrollView is not defined" crash by importing ScrollView from react-native

### Technical
- Settings: action buttons (connect sensor, export CSV, Strava) restyled as pill-shaped buttons for clearer affordance and consistency

## [1.2.0] - 2025-02-26

### Changed
- Notification bar: show "Run" instead of "Timer" when a run is in progress (title and channel name)
- Notification body: show per-km split pace and heart rate when available (e.g. "02:35 • 5:30/km • 142 bpm")
- Lockscreen: Android channel importance set to DEFAULT (was LOW) so run notifications appear on lock screen; iOS interruptionLevel set to "active" for prominent presentation
- Notification: when app goes to background, push one final update so the lockscreen shows the freshest time/stats (when phone is locked the OS suspends the app so the notification cannot update again until the app is reopened; true live-updating on lockscreen would require an Android foreground service or iOS Live Activities)

### Fixed
- Timer: compute elapsed time from wall-clock instead of interval ticks so it stays correct when the app is backgrounded or throttled

### Technical
- EAS build: add `ios.bundleIdentifier` in app.json so `eas build --platform all` succeeds (was "ios.bundleIdentifier is not defined")

### Added
- Settings > Data: "Export runs (CSV)" with Summary and Detailed options; Summary = one row per run; Detailed = path points (elapsed_sec, distance_km, lat, lng), heart rate samples (elapsed_sec, bpm), and per-km splits (km, pace, avg HR)
- Run detail: "Heart rate over time" chart showing continuous HR curve from raw samples (bpm vs elapsed minutes)
- Heart icon next to HR everywhere (index stats, run detail summary and splits, runs list); heart uses a soft red (#c45c5c)
- Live HR on index: when an HR sensor is connected in settings, show live BPM on the main screen before and during runs; samples are only recorded after the user taps "Start run"
- Index: data bar under timer enlarged (font 19, more padding/gap) and "avg hr" removed for easier reading
- Index: confirm before ending run ("End run?" with Keep running / End run)
- Pace chart: X axis = distance (0 to total km), Y axis = time per km (slower at bottom, faster at top); section title "Pace (time/km along run)"
- Charts: add X and Y axis lines to Pace chart, Heart rate by km, Heart rate over time, and live run HR bar graph (subtle hairline, 50% opacity)
- Run detail: remove "Heart rate by km" chart; add Time/Distance toggle on "Heart rate over time" to switch X axis between elapsed time (min) and distance (km) when path is available
- Heart rate over time chart: smaller dots; slide with finger/cursor to show crosshair and values at a point (time or distance + bpm)
- Pace chart: slide with finger/cursor to show crosshair and values at a point (km + pace); on web, click-and-drag to inspect
- Previous runs: sample runs at the bottom of the list (3 runs with path, HR, splits) so you can see run list and run detail without recording a run; tap a sample to open full detail with map, pace chart, and HR chart
- Pace chart: plot inset so line/points stay inside axes; more evenly spaced X (distance) and Y (pace) axis ticks and labels for easier reading
- Heart rate over time chart: more ticks along X and Y axes; faint background grid aligned to axis values for easier reading
- Pace chart: faint background grid aligned to axis ticks; line clamped to plot bounds so it never draws under the x-axis (same fix on Heart rate over time)
- Pace and Heart rate over time charts: full-width and ~30% taller for easier reading
- Pace chart: 0 km tick and grid line aligned with Y axis; bottom Y (slowest pace) tick and grid line aligned with X axis; Y-axis scale is data-driven (clean 0.5 steps, no 0) so bottom = clean value at/above slowest split and top = at/below fastest; scale extends to include all splits (e.g. above 5 min/km)
- Run detail: remove bottom border from splits table (last row has no line)
- Pace chart: Y-axis uses tight bounds (floorToHalf(dataMin), ceilToHalf(dataMax)) so no extra empty grid band at bottom and all data points lie within graph bounds
- Charts: guard PanResponder for web (evt.nativeEvent can be undefined); only use locationX when present so clicking graphs on web no longer throws
- Pace chart: use toX(km) for all distance grid lines and labels (including 0) so X-axis spacing is even; previously 0 was drawn at the Y axis and made the first interval longer
- Pace chart: when path is available, show pace from 0 km at 0.25 km steps (getPacePoints) so data between 0 and 1 km is visible; chart still falls back to per-km splits when no path
- Pace and Heart rate charts: stats under the graph use larger font (16), bold figures, and more spacing (gap 24, marginTop 16)
- Pace chart: Y-axis grid and ticks use even spacing from minPace to maxPace (evenPaceTicks) so first and last align with axes and lines are evenly spaced
- Pace chart: graph starts at 0 km on X (Y axis and X axis drawn at 0 km; plot from plotLeft with width plotW); Y scale uses full height (minPace at top, maxPace at bottom on the axes)
- Heart rate over time: Time/Distance toggle shown as two side-by-side segments; selected segment has darker background and shadow, unselected is flat and lighter
- Pace and Heart rate charts: axis labels, tick labels, and stats under the graph use white text
- Heart rate over time chart: remove "bpm" from Y-axis labels

### Changed
- Stats: Pie charts moved to bottom of page in a "Distribution" section; charts converted to donut style (inner radius 55%)
- Stats: Progress section moved to top (below key stats); added monthly and yearly distance with comparison to previous period
- Stats: Bar charts layout fixed so labels sit in a separate row below bars and no longer overlap section titles
- Index: increase spacing and centering for "Previous runs" and "Stats" links so they aren't cramped on Android

## [1.1.0] - 2025-02-22

### Changed
- Default theme set to Night (was Light)

### Added
- Settings HR sensor: show "Available sensors" list below when scanning; tap a sensor to connect, show "Connecting..." on that row, then "Connected: [name]" badge when done

### Fixed
- Scan for sensors: request location and (on Android 12+) BLUETOOTH_SCAN/BLUETOOTH_CONNECT before scanning so the available-sensors list is populated; show permission error message if denied
- Android: fix BLE crash (PromiseImpl.reject parameter code null) by passing "UNKNOWN" instead of null in react-native-ble-plx BlePlxModule and SafePromise; add patch-package so the fix persists after npm install

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
