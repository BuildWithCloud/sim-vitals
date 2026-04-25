# SimOx — Simulated Pulse Oximeter

A browser-based fake pulse oximeter for medical simulation training.
- **Display** runs on an iPhone (or any phone/tablet)
- **Controller** runs in a browser tab on the laptop
- **No internet required** — laptop creates its own WiFi hotspot

---

## Setup on Fedora Linux

### 1. Install Node.js (if not already installed)

```bash
sudo dnf install nodejs npm
```

Check it worked:
```bash
node --version   # should be v18 or higher
```

### 2. Install SimOx dependencies

```bash
cd simox
npm install
```

### 3. Create a WiFi hotspot on your laptop

**Using GNOME (most Fedora desktops):**
1. Click the top-right system menu
2. Click **Wi-Fi** → **Wi-Fi Settings**
3. Click the menu (⋮) → **Turn On Wi-Fi Hotspot**
4. Set a name (e.g. `SimOx`) and password

**Using the terminal (nmcli):**
```bash
nmcli device wifi hotspot ifname wlan0 ssid SimOx password "simtrain123"
```

### 4. Start the server

```bash
npm start
```

You'll see output like:
```
🩺  SimOx is running!

  Instructor panel → http://localhost:3000/controller.html
  Display (iPhone) → http://192.168.x.x:3000/display.html
```

Note the **Display URL** — you'll need this for the iPhone.

---

## Setup on iPhone 17

1. Connect to the **SimOx** hotspot (Settings → Wi-Fi)
2. Open Safari and go to the display URL printed in the terminal  
   e.g. `http://192.168.137.1:3000/display.html`
3. **Tap once** on the screen to start audio (iOS requires this)
4. Optional: tap the **Share** icon → **Add to Home Screen** for fullscreen mode

---

## Using the Controller

Open `http://localhost:3000/controller.html` in any browser on the laptop.

- **Scenario presets** — tap a scenario to start transitioning
- **Manual sliders** — fine-tune SpO₂, HR, and perfusion index
- **Transition speed** — controls how fast values change:
  - *Sudden* (2s) — for rapid deterioration scenarios
  - *Gradual* (20s) — default, values drift naturally
  - *Slow* (60s) — very subtle, hard to notice

---

## Scenarios included

| Scenario        | SpO₂ | HR  | Notes                     |
|-----------------|------|-----|---------------------------|
| Normal          | 98%  | 72  | Baseline healthy           |
| Exercise/Anxious| 97%  | 110 | Mildly elevated HR         |
| Mild Hypoxia    | 92%  | 96  | Below normal, watch closely|
| Moderate Hypoxia| 86%  | 115 | Clinically significant     |
| Severe Hypoxia  | 76%  | 130 | Urgent intervention needed |
| Critical        | 64%  | 142 | Near-fatal hypoxia         |
| Bradycardia     | 94%  | 36  | Low heart rate             |
| Tachycardia     | 93%  | 148 | Elevated heart rate        |
| Cardiac Arrest  | ---  | --- | Flat line, no signal       |

---

## Tips for simulation

- Use **Gradual (20s)** transitions during scenarios so changes aren't obvious
- The display alarm (red bar) activates when SpO₂ < 90 or HR is extreme
- The beep pitch drops as SpO₂ falls, just like real pulse oximeters
- Multiple iPhones/tablets can connect as displays simultaneously
- The controller can also be opened on a second laptop or phone

---

## Troubleshooting

**iPhone can't reach the server:**  
Make sure the iPhone is connected to the *laptop's* hotspot, not venue WiFi.  
Check the IP in the terminal output — it may change each time the hotspot starts.

**No beep sound on iPhone:**  
Tap the screen once to unlock audio. Make sure the iPhone is not on silent.

**"npm: command not found":**  
```bash
sudo dnf install nodejs npm
```

**Port already in use:**  
```bash
PORT=3001 npm start
# then use port 3001 in all URLs
```
