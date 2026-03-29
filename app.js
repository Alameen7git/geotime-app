// State
let workspace = JSON.parse(localStorage.getItem('workspace')) || null;
let timesheet = JSON.parse(localStorage.getItem('timesheet')) || [];
let currentShift = JSON.parse(localStorage.getItem('currentShift')) || null;

// Settings
const radiusInput = document.getElementById('workspace-radius');
const devModeToggle = document.getElementById('dev-mode-toggle');

// DOM Elements
const statusHeading = document.getElementById('status-heading');
const distanceText = document.getElementById('distance-text');
const radarContainer = document.getElementById('radar-visual').parentElement;
const statusIcon = document.getElementById('current-status-icon');
const coordInfo = document.getElementById('coord-info');
const shiftDetailsBox = document.querySelector('.current-shift-details');
const shiftTimeLabel = document.getElementById('current-shift-time');
const shiftLabelInfo = document.getElementById('current-shift-label');

let watchId = null;
let isOutside = true;

// Initialize
function init() {
    loadUI();
    initGeo();
    
    // Register Service Worker for Offline PWA Support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
          .then(() => console.log('Service Worker Registered!'))
          .catch(err => console.error('Service Worker Error:', err));
    }
}

function loadUI() {
    if (workspace) {
        coordInfo.innerText = `Workspace: ${workspace.lat.toFixed(5)}, ${workspace.lng.toFixed(5)}`;
    } else {
        coordInfo.innerText = "Workspace lat/lng: Not set";
    }
    renderTimesheet();
}

function saveState() {
    localStorage.setItem('workspace', JSON.stringify(workspace));
    localStorage.setItem('timesheet', JSON.stringify(timesheet));
    localStorage.setItem('currentShift', JSON.stringify(currentShift));
}

function getTimeoutDuration() {
    // 10 seconds for dev mode, 1 hour (3600000 ms) for normal
    return devModeToggle.checked ? 10_000 : 3_600_000;
}

// Haversine Formula for Distance Calculation
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radius of the earth in m
    const dLat = deg2rad(lat2-lat1); 
    const dLon = deg2rad(lon2-lon1); 
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; 
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Shift Logic
function startShift() {
    currentShift = {
        start: Date.now(),
        lastSeenInside: Date.now()
    };
    saveState();
}

function updateShift() {
    if (currentShift) {
        currentShift.lastSeenInside = Date.now();
        saveState();
    }
}

function endShift() {
    if (currentShift) {
        // End time is when they actually left the radius
        const endTime = currentShift.lastSeenInside;
        timesheet.push({
            start: currentShift.start,
            end: endTime
        });
        currentShift = null;
        saveState();
        renderTimesheet();
    }
}

// Main Time Loop
setInterval(() => {
    if (currentShift) {
        const activeMs = Date.now() - currentShift.start;
        // render HH:MM:SS
        const h = Math.floor(activeMs/3600000).toString().padStart(2,'0');
        const m = Math.floor((activeMs%3600000)/60000).toString().padStart(2,'0');
        const s = Math.floor((activeMs%60000)/1000).toString().padStart(2,'0');
        shiftTimeLabel.innerText = `${h}:${m}:${s}`;
        
        shiftDetailsBox.classList.add('active');
        
        if (isOutside) {
            const timeOut = Date.now() - currentShift.lastSeenInside;
            const threshold = getTimeoutDuration();
            const left = Math.max(0, Math.ceil((threshold - timeOut)/1000));
            
            shiftLabelInfo.innerText = `Exited. Auto-clockout in ${left}s`;
            
            if (timeOut >= threshold) {
                endShift();
            }
        } else {
            shiftLabelInfo.innerText = "Currently Clocked In";
        }
    } else {
        shiftTimeLabel.innerText = "--:--:--";
        shiftLabelInfo.innerText = "Not Clocked In";
        shiftDetailsBox.classList.remove('active');
    }
}, 1000);

// Geolocation Tracking
function initGeo() {
    if (!navigator.geolocation) {
        statusHeading.innerText = "Geolocation not supported by browser.";
        return;
    }
    
    statusHeading.innerText = "Locating GPS...";
    
    watchId = navigator.geolocation.watchPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        
        if (!workspace) {
            statusHeading.innerText = "Location Found. Set Workspace above.";
            distanceText.innerText = `Accuracy: ±${Math.round(accuracy)}m`;
            radarContainer.className = 'radar-container';
            statusIcon.innerText = "📍";
            return;
        }
        
        const dist = getDistanceFromLatLonInM(lat, lng, workspace.lat, workspace.lng);
        distanceText.innerText = `Distance: ${Math.round(dist)}m (Accuracy: ±${Math.round(accuracy)}m)`;
        
        const radius = parseInt(radiusInput.value) || 100;
        
        if (dist <= radius) {
            // Inside Geo-fence
            isOutside = false;
            statusHeading.innerText = "At Workspace";
            radarContainer.className = 'radar-container active';
            statusIcon.innerText = "🏢";
            
            if (!currentShift) {
                startShift();
            } else {
                updateShift();
            }
        } else {
            // Outside Geo-fence
            isOutside = true;
            statusHeading.innerText = "Away from Workspace";
            radarContainer.className = 'radar-container outside';
            statusIcon.innerText = "🚶";
        }
    }, (err) => {
        statusHeading.innerText = `GPS Error: ${err.message}`;
        distanceText.innerText = "Please ensure Location permissions are granted.";
    }, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 27000
    });
}

// Event Listeners
document.getElementById('set-workspace-btn').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition((pos) => {
        workspace = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
        };
        saveState();
        loadUI();
        alert('Workspace location fixed. You are now tracking distance relative to this point!');
    }, err => {
        alert('Could not obtain current location: ' + err.message);
    }, { enableHighAccuracy: true });
});

document.getElementById('clear-logs-btn').addEventListener('click', () => {
    if(confirm("Are you sure you want to delete all timesheet logs?")) {
        timesheet = [];
        saveState();
        renderTimesheet();
    }
});

document.getElementById('export-excel-btn').addEventListener('click', () => {
    if (timesheet.length === 0) {
        alert("No logs to export!");
        return;
    }
    
    // Create CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Clock In,Clock Out,Duration\n";
    
    // Add rows
    [...timesheet].reverse().forEach(shift => {
        const date = formatDate(shift.start);
        const start = formatTime(shift.start);
        const end = formatTime(shift.end);
        const dur = formatDuration(shift.start, shift.end);
        csvContent += `"${date}","${start}","${end}","${dur}"\n`;
    });
    
    // Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // iOS and Android will automatically download this file
    link.setAttribute("download", `TimeSheet_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Formatting Utilities
function formatTime(ms) {
    const d = new Date(ms);
    return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}
function formatDate(ms) {
    const d = new Date(ms);
    return d.toLocaleDateString();
}
function formatDuration(start, end) {
    const totalMs = end - start;
    const hrs = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
}

function renderTimesheet() {
    const tbody = document.getElementById('timesheet-body');
    const emptyState = document.getElementById('empty-state');
    const tbCont = document.getElementById('timesheet-table');
    
    tbody.innerHTML = '';
    
    if (timesheet.length === 0) {
        emptyState.style.display = 'block';
        tbCont.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        tbCont.style.display = 'table';
        
        // Render in reverse chronological order
        [...timesheet].reverse().forEach(shift => {
            const tr = document.createElement('tr');
            
            const tdDate = document.createElement('td');
            tdDate.innerText = formatDate(shift.start);
            
            const tdIn = document.createElement('td');
            tdIn.innerText = formatTime(shift.start);
            
            const tdOut = document.createElement('td');
            tdOut.innerText = formatTime(shift.end);
            
            const tdDur = document.createElement('td');
            tdDur.innerText = formatDuration(shift.start, shift.end);
            
            tr.appendChild(tdDate);
            tr.appendChild(tdIn);
            tr.appendChild(tdOut);
            tr.appendChild(tdDur);
            
            tbody.appendChild(tr);
        });
    }
}

// Start
init();
