# Proxy Toggle

Toggle SOCKS5 proxy through an SSH tunnel. For Chrome, Brave, Edge, and other Chromium browsers.

## What it does

Routes your browser traffic through a remote machine via an SSH SOCKS5 tunnel. The extension provides a one-click toggle to enable or disable the proxy, and detects whether your tunnel is running.

## Requirements

- A Chromium-based browser (Chrome, Brave, Edge, Vivaldi, Arc, etc.)
- SSH access to a remote machine

## Install

1. Clone or download this repository
2. Open your browser and navigate to the extensions page:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the project folder

## Usage

### 1. Configure your connection

Click the extension icon, then the gear icon. Enter your SSH host (e.g. `user@hostname`) and local port (default `1080`). Click Save.

### 2. Start your SSH tunnel

Open a terminal and run the command shown in the extension popup:

```
ssh -D 1080 -N user@hostname
```

Keep this terminal session open while using the proxy.

### 3. Toggle the proxy

Once the extension detects the tunnel is running, a toggle switch appears. Flip it on to route browser traffic through the tunnel. Flip it off to return to direct connections.

## How it works

- Uses the `chrome.proxy` API with a PAC script to route traffic through `SOCKS5 localhost:<port>`
- Detects the tunnel by sending a test request through the configured SOCKS proxy
- Persists settings and proxy state in `chrome.storage.local`
- The toolbar icon changes color to indicate proxy status (gray = off, blue = on)

## Files

```
manifest.json    Manifest V3 configuration
background.js    Service worker: proxy toggle, icon state, tunnel detection
popup.html       Popup structure with three adaptive views
popup.css        Styles
popup.js         Popup logic and event handling
icons/           Toolbar icons (active and inactive states)
```

## Permissions

| Permission | Reason |
|---|---|
| `proxy` | Set and clear browser proxy configuration |
| `storage` | Persist user settings and proxy state |
| `*://localhost/*` | Test tunnel connectivity on the configured port |

## Notes

- The SSH tunnel must be started manually in a terminal. The extension does not manage the SSH connection.
- If the tunnel drops while the proxy is active, web requests will fail. Toggle the proxy off to restore direct connections.
- Each browser profile maintains its own proxy settings and extension storage independently.

## License

MIT
