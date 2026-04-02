const ICONS_INACTIVE = {
  16: "icons/icon-16.png",
  32: "icons/icon-32.png",
  48: "icons/icon-48.png",
  128: "icons/icon-128.png",
};

const ICONS_ACTIVE = {
  16: "icons/icon-active-16.png",
  32: "icons/icon-active-32.png",
  48: "icons/icon-active-48.png",
  128: "icons/icon-active-128.png",
};

function updateIcon(active) {
  chrome.action.setIcon({ path: active ? ICONS_ACTIVE : ICONS_INACTIVE });
}

async function getSettings() {
  const data = await chrome.storage.local.get({ host: "", port: 1080, proxyActive: false });
  return data;
}

async function enableProxy(port) {
  port = Number.isInteger(port) && port >= 1 && port <= 65535 ? port : 1080;
  const pac = `function FindProxyForURL(url, host) {
    return "SOCKS5 localhost:${port}; DIRECT";
  }`;
  await chrome.proxy.settings.set({
    value: { mode: "pac_script", pacScript: { data: pac } },
    scope: "regular",
  });
  await chrome.storage.local.set({ proxyActive: true });
  updateIcon(true);
}

async function disableProxy() {
  await chrome.proxy.settings.clear({ scope: "regular" });
  await chrome.storage.local.set({ proxyActive: false });
  updateIcon(false);
}

async function testTunnel(port) {
  port = Number.isInteger(port) && port >= 1 && port <= 65535 ? port : 1080;
  // Route only the test host through SOCKS5, everything else stays DIRECT
  const pac = `function FindProxyForURL(url, host) {
    if (host === "1.1.1.1") return "SOCKS5 localhost:${port}";
    return "DIRECT";
  }`;
  await chrome.proxy.settings.set({
    value: { mode: "pac_script", pacScript: { data: pac } },
    scope: "regular",
  });
  try {
    await fetch("http://1.1.1.1/", {
      signal: AbortSignal.timeout(4000),
      mode: "no-cors",
    });
    // If fetch resolved (even with opaque response), the request went through the tunnel
    return true;
  } catch {
    return false;
  } finally {
    // Restore: if proxy was active, re-enable it; otherwise clear
    const settings = await getSettings();
    if (settings.proxyActive) {
      await enableProxy(settings.port);
    } else {
      await chrome.proxy.settings.clear({ scope: "regular" });
    }
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "getStatus") {
    getSettings().then((settings) => {
      sendResponse({ active: settings.proxyActive, host: settings.host, port: settings.port });
    });
    return true;
  }

  if (message.action === "toggleProxy") {
    getSettings().then(async (settings) => {
      if (settings.proxyActive) {
        await disableProxy();
        sendResponse({ active: false });
      } else {
        await enableProxy(settings.port);
        sendResponse({ active: true });
      }
    });
    return true;
  }

  if (message.action === "testTunnel") {
    testTunnel(message.port).then((up) => {
      sendResponse({ tunnelUp: up });
    });
    return true;
  }

  if (message.action === "saveSettings") {
    chrome.storage.local.set({ host: message.host, port: message.port }).then(() => {
      sendResponse({ saved: true });
    });
    return true;
  }
});

// Restore icon state on service worker startup
getSettings().then((settings) => {
  updateIcon(settings.proxyActive);
});
