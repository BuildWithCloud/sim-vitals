const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

// Operator-selected targets
let targetState = {
  spo2: 98,
  resp: 16,
  hr: 72,
  bpsys: 120,
  bpdia: 80,
  SpO2On: true,
  bpCuffOn: true,
  showColours: true,
  transitionTime: 20
};

// Authoritative live values streamed to every client
let liveState = {
  spo2: 98,
  resp: 16,
  hr: 72,
  bpsys: 120,
  bpdia: 80,
  SpO2On: true,
  bpCuffOn: true,
  showColours: true,
  transitionTime: 20
};

let transition = {
  startMs: Date.now(),
  endMs: Date.now(),
  from: { spo2: 98, resp: 16, hr: 72, bpsys: 120, bpdia: 80 },
  to: { spo2: 98, resp: 16, hr: 72, bpsys: 120, bpdia: 80 }
};

function clamp01(x) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function beginTransition({ immediate = false } = {}) {
  const now = Date.now();
  const durationSec = Math.max(0, Number(targetState.transitionTime) || 0);
  const durationMs = immediate ? 0 : durationSec * 1000;
  const targetValues = {
    spo2: targetState.spo2,
    resp: targetState.resp,
    hr: targetState.hr,
    bpsys: targetState.bpsys,
    bpdia: targetState.bpdia,
  };

  transition.startMs = now;
  transition.endMs = now + durationMs;
  transition.from = {
    spo2: liveState.spo2,
    resp: liveState.resp,
    hr: liveState.hr,
    bpsys: liveState.bpsys,
    bpdia: liveState.bpdia,
  };
  transition.to = targetValues;

  liveState.SpO2On = targetState.SpO2On;
  liveState.bpCuffOn = targetState.bpCuffOn;
  liveState.showColours = targetState.showColours;
  liveState.transitionTime = targetState.transitionTime;

  if (durationMs === 0) {
    liveState.spo2 = targetValues.spo2;
    liveState.resp = targetValues.resp;
    liveState.hr = targetValues.hr;
    liveState.bpsys = targetValues.bpsys;
    liveState.bpdia = targetValues.bpdia;
    transition.from = { ...targetValues };
    transition.to = { ...targetValues };
  }
}

function tickTransition() {
  const now = Date.now();
  const total = Math.max(1, transition.endMs - transition.startMs);
  const t = clamp01((now - transition.startMs) / total);

  liveState.spo2 = transition.from.spo2 + (transition.to.spo2 - transition.from.spo2) * t;
  liveState.resp = transition.from.resp + (transition.to.resp - transition.from.resp) * t;
  liveState.hr = transition.from.hr + (transition.to.hr - transition.from.hr) * t;
  liveState.bpsys = transition.from.bpsys + (transition.to.bpsys - transition.from.bpsys) * t;
  liveState.bpdia = transition.from.bpdia + (transition.to.bpdia - transition.from.bpdia) * t;

  emitState();
}

// 20 Hz authoritative timer for all clients
setInterval(tickTransition, 50);

function emitState() {
  io.emit('state', {
    ...liveState,
    target: { ...targetState }
  });
}

function emitStateToSocket(socket) {
  socket.emit('state', {
    ...liveState,
    target: { ...targetState }
  });
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  emitStateToSocket(socket);

  socket.on('setState', (patch) => {
    const { snap, ...cleanPatch } = patch;
    targetState = { ...targetState, ...cleanPatch };
    beginTransition({ immediate: snap === true });
    emitState();
  });

  socket.on('disconnect', () => console.log('Client left:', socket.id));
});

// Find a non-loopback IPv4 address to print for the display URL
function getLocalIP() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('\n🩺  SimOx is running!\n');
  console.log(`  If using locally, open http://localhost:${PORT} in your browser.`);
  console.log(`  If using other device, use ip: http://${ip}:${PORT}`);
  console.log('  Then use /controller.html on assessor and /display.html on pulse ox.\n');
});
