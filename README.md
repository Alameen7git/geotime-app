# 📍 GeoTime (Progressive Web App)
A privacy-first, autonomous, and location-based timesheet tracking application that installs natively on your iOS or Android device directly from the browser.

## 🚀 Features
- **Zero-Touch Geofence Tracking:** Automatically clocks you in when you enter your designated workspace and automatically clocks you out when you leave.
- **Top-Level Privacy:** Unlike traditional tracking apps, **no data ever leaves your device**. Your GPS coordinates, calculations, and shift logs are strictly maintained inside your phone's isolated `localStorage`. Zero server connections.
- **Retroactive Offline Sync:** If you put your phone in your pocket and drive away, the background freeze is resolved gracefully. The next time you open the app, it looks at the *last second* you were inside the building and retroactively logs your precise exit time!
- **Excel (.CSV) Exports:** A one-tap button generates a `.csv` file format containing your historical shifts which downloads directly to your device and natively opens in Microsoft Excel or Google Sheets.
- **Locally Cached (Offline Mode):** Uses a Service Worker (`sw.js`). You could operate this app in the middle of a desert without cell service or Wi-Fi.

## 📱 How to Install on iOS (iPhone)
Because this app utilizes strict modern web APIs (like Geolocation and Service Workers), it must be hosted via a secure `https://` connection.

1. Navigate to the hosted website (e.g., via GitHub Pages) using **Safari** on your iPhone.
2. Tap the **Share** button at the bottom of the screen (the square with an arrow pointing up).
3. Scroll down the menu and select **"Add to Home Screen"**.
4. Tap **"Add"** in the top right corner. The GeoTime icon will now be on your home screen ready for immersive full-screen operation!

## 🤖 How to Install on Android
1. Navigate to the website using **Google Chrome**.
2. Chrome should automatically show a banner at the bottom saying **"Add to Home screen"**. Tap it! (If it doesn't appear, tap the three dots **Menu** in the top right, and select **"Install app"**).

## 🛠 Usage
1. Open the app at your place of work.
2. Wait for the GPS tracker to find you.
3. Tap **"Set Current Location as Workspace"**. 
4. Everything is now automatic. You can safely lock your phone and put it in your pocket. The app will log your shifts every time you enter and leave the radius.

## 📝 Technologies Built With
- **Vanilla HTML5, CSS3, ES6 JavaScript:** No heavy frameworks to weigh down the battery.
- **Browser Geolocation API:** For hyper-accurate coordinate fetching.
- **Progressive Web App Manifest:** Permitting native iOS & Android home screen installation.
- **Service Workers:** To cache files aggressively for network-free offline use.
