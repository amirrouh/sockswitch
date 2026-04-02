const wizardView = document.getElementById("wizard-view");
const toggleView = document.getElementById("toggle-view");
const settingsView = document.getElementById("settings-view");
const settingsBtn = document.getElementById("settings-btn");
const backBtn = document.getElementById("back-btn");
const copyBtn = document.getElementById("copy-btn");
const checkBtn = document.getElementById("check-btn");
const proxyToggle = document.getElementById("proxy-toggle");
const saveBtn = document.getElementById("save-btn");
const sshCommand = document.getElementById("ssh-command");
const toggleStatus = document.getElementById("toggle-status");
const toggleDestination = document.getElementById("toggle-destination");
const inputHost = document.getElementById("input-host");
const inputPort = document.getElementById("input-port");
const toggleSshCommand = document.getElementById("toggle-ssh-command");

let currentView = "wizard";
let previousView = "wizard";

function showView(name) {
  previousView = currentView;
  currentView = name;

  if (name === "settings") {
    wizardView.classList.add("hidden");
    toggleView.classList.add("hidden");
    settingsView.classList.remove("hidden");
    // Trigger reflow then animate
    settingsView.offsetHeight;
    settingsView.classList.add("slide-in");
  } else {
    settingsView.classList.remove("slide-in");
    settingsView.classList.add("hidden");
    wizardView.classList.toggle("hidden", name !== "wizard");
    toggleView.classList.toggle("hidden", name !== "toggle");
  }
  settingsBtn.classList.toggle("hidden", name === "settings");
}

async function getSettings() {
  return chrome.storage.local.get({ host: "", port: 1080 });
}

async function detectTunnel(port) {
  const response = await chrome.runtime.sendMessage({ action: "testTunnel", port });
  return response.tunnelUp;
}

function updateSshCommand(host, port) {
  const h = host || "user@hostname";
  const p = port || 1080;
  const cmd = `ssh -D ${p} -N ${h}`;
  sshCommand.textContent = cmd;
  toggleSshCommand.textContent = cmd;
}

function updateToggleUI(active) {
  proxyToggle.checked = active;
  toggleStatus.textContent = active ? "Proxy active" : "Proxy inactive";
  toggleStatus.classList.toggle("status-active", active);
}

async function initialize() {
  const settings = await getSettings();
  updateSshCommand(settings.host, settings.port);
  toggleDestination.textContent = `SOCKS5 localhost:${settings.port}`;
  inputHost.value = settings.host;
  inputPort.value = settings.port;

  // Get proxy status from background
  const status = await chrome.runtime.sendMessage({ action: "getStatus" });
  updateToggleUI(status.active);

  // Detect tunnel
  const tunnelUp = await detectTunnel(settings.port);
  showView(tunnelUp ? "toggle" : "wizard");
}

// Event listeners
settingsBtn.addEventListener("click", () => showView("settings"));

backBtn.addEventListener("click", () => showView(previousView));

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(sshCommand.textContent);
  copyBtn.title = "Copied!";
  setTimeout(() => (copyBtn.title = "Copy command"), 1500);
});

checkBtn.addEventListener("click", async () => {
  checkBtn.textContent = "Checking...";
  checkBtn.disabled = true;
  const settings = await getSettings();
  const tunnelUp = await detectTunnel(settings.port);
  if (tunnelUp) {
    const status = await chrome.runtime.sendMessage({ action: "getStatus" });
    updateToggleUI(status.active);
    showView("toggle");
  } else {
    checkBtn.textContent = "Check again";
    checkBtn.disabled = false;
  }
});

proxyToggle.addEventListener("change", async () => {
  const wasChecked = !proxyToggle.checked;
  proxyToggle.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({ action: "toggleProxy" });
    updateToggleUI(response.active);
  } catch {
    proxyToggle.checked = wasChecked;
  }
  proxyToggle.disabled = false;
});

saveBtn.addEventListener("click", async () => {
  const host = inputHost.value.trim();
  const port = parseInt(inputPort.value, 10) || 1080;
  await chrome.runtime.sendMessage({ action: "saveSettings", host, port });
  updateSshCommand(host, port);
  toggleDestination.textContent = `SOCKS5 localhost:${port}`;
  showView(previousView);
});

// Initialize on popup open
initialize();
