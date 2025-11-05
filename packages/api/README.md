Here’s the clean breakdown — minimal, complete, and practical.

---

## CLIENT-SIDE (Browser or App)

Goal: **Collect identifying signals and send a normalized payload**.

### 1. Browser/System Info

* `navigator.userAgent` or `userAgentData`
* `navigator.platform`
* `navigator.language`, `navigator.languages`
* `navigator.hardwareConcurrency`, `navigator.deviceMemory`
* `navigator.maxTouchPoints`

### 2. Display Info

* `screen.width`, `screen.height`, `screen.availWidth`, `screen.availHeight`
* `window.devicePixelRatio`
* `colorDepth`, `orientation.type`

### 3. Environment Info

* `Intl.DateTimeFormat().resolvedOptions().timeZone`
* `new Date().getTimezoneOffset()`
* `window.matchMedia('(prefers-color-scheme: dark)')`
* `document.visibilityState`, `navigator.onLine`

### 4. Browser Capabilities

* Enabled features: cookies, localStorage, sessionStorage, IndexedDB, serviceWorker
* Installed fonts (use font detection or canvas text measurement)
* Plugins and MIME types
* Touch events availability

### 5. Hardware-related Hashes

* **Canvas fingerprint** — render small scene → hash pixel data
* **WebGL fingerprint** — renderer/vendor info from `gl.getParameter()`
* **Audio fingerprint** — hash from AudioContext rendering
* **Battery info** (if available)
* **MediaDevices** (enumerate device IDs hashed)

### 6. Network Info

* IP from WebRTC (optional, privacy sensitive)
* Connection type (`navigator.connection.effectiveType`, `rtt`, `downlink`)

### 7. Browser Behavior Signals

* Header order in initial request (handled implicitly by browser)
* Execution timing (micro jitter detection for headless browsers)
* Random challenge/response test to detect automation

### 8. Local Identifiers (optional)

* Persistent random ID stored in `localStorage` / cookie (for linking sessions)

### 9. Final Payload Example

```json
{
  "ua": "Mozilla/5.0 ...",
  "lang": "en-US",
  "tz": "Asia/Kolkata",
  "screen": "1920x1080",
  "dpr": 2,
  "fonts_hash": "d4e93b...",
  "canvas_hash": "e8b7c3...",
  "webgl_hash": "0aaf12...",
  "audio_hash": "91d0bb...",
  "plugins": ["PDF Viewer", "Widevine"],
  "conn_type": "wifi",
  "storage": { "local": true, "indexedDB": true },
  "touch": true,
  "hw": { "cpu": 8, "mem": 8 },
  "version": 1
}
```

Send this JSON via `POST /fingerprint` to the server.

---

## SERVER-SIDE

Goal: **Generate persistent device ID, store, match, and score**.

### 1. Capture Data

* All headers (exact order + case).
* Source IP + subnet (hashed or anonymized).
* TLS JA3 fingerprint (ClientHello hash).
* Request timing (TTFB, jitter).
* Any cookies or session tokens.

### 2. Process Payload

* Normalize JSON (fixed order, lowercase).
* Hash feature strings individually (SHA-256).
* Concatenate canonical string → compute HMAC(deviceId).
* Calculate confidence score based on previous records.

### 3. Database Storage

* Store:

  ```json
  {
    "device_id": "hex_hmac",
    "features": { "ua_hash": "...", "canvas_hash": "...", ... },
    "ip_cidr": "172.21.0.0/16",
    "ja3": "hash",
    "created_at": "2025-11-04",
    "last_seen": "2025-11-04"
  }
  ```

### 4. Matching & Scoring

* Compare incoming hashes with stored fingerprints.
* Compute weighted similarity score.
* Return classification:

  * `known_device` (score ≥ 0.85)
  * `likely_device_variant` (0.6–0.85)
  * `new_device` (< 0.6)

### 5. Security Layer

* Sign responses with server secret to avoid spoofing.
* Rate-limit new device creation per IP.
* Add tamper detection for client payload (HMAC token).

### 6. Privacy & Control

* Provide delete endpoint `/fingerprint/delete`.
* Never store raw PII (hash or HMAC).
* Allow user opt-out flag.

---

### Summary Table

| Layer                  | Client                                  | Server                           |
| ---------------------- | --------------------------------------- | -------------------------------- |
| Identification signals | Hardware, browser, OS, display, network | IP, headers, TLS                 |
| Hashing                | Local (optional)                        | Primary canonical hashing + HMAC |
| Storage                | localStorage / cookie for persistent ID | Database for all fingerprints    |
| Matching               | —                                       | Weighted similarity algorithm    |
| Privacy                | Anonymize before send                   | No raw data, HMAC store          |
| Security               | Sign payload, anti-bot                  | Verify signature, rate limit     |

---

Do you want me to generate a ready **client collector script** that gathers and sends all these properties to an API endpoint next?
