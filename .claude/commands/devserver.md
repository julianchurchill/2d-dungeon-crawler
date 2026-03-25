# /devserver

Start the Vite dev server, handling port conflicts automatically.

Follow these steps in order:

## 1. Check port availability

The default port is **3000** (set in `vite.config.js`).

Run: `fuser 3000/tcp 2>/dev/null && echo "in use" || echo "free"`

- If the port is **free**: proceed to step 3.
- If the port is **in use**: proceed to step 2.

## 2. Resolve the port conflict

Get the PID holding the port: `fuser 3000/tcp 2>/dev/null`

Check what process it is: `ps -p <PID> -o comm=`

- If the process is a **stale or orphaned Vite/Node process** (command contains `vite` or `node`):
  - Kill it: `fuser -k 3000/tcp`
  - Verify the port is now free: `fuser 3000/tcp 2>/dev/null && echo "in use" || echo "free"`
  - If now free, proceed to step 3 using port 3000.
- If the process is something **unrelated** (e.g. another app):
  - Find a free alternate port starting from 3001:
    `fuser 3001/tcp 2>/dev/null && echo "in use" || echo "free"`
  - Increment until a free port is found (3001, 3002, …).
  - Proceed to step 3 using that port.

## 3. Start the dev server

Run the server in the background and capture its output to a temp file:

```bash
npm run dev -- --port <PORT> > /tmp/vite-dev.log 2>&1 &
```

(Use `--port 3000` even for the default port so the actual port is always explicit.)

Wait up to 10 seconds for Vite to print its ready message, polling every second:

```bash
for i in $(seq 1 10); do grep -q "ready in" /tmp/vite-dev.log && break || sleep 1; done
```

## 4. Confirm the actual port and accessibility

Vite may have auto-switched ports even if you passed `--port`. Read the log to find the real port:

```bash
grep "Local:" /tmp/vite-dev.log
```

Extract the port number from that line (e.g. `http://localhost:3001/` → `3001`).

Then confirm accessibility on that exact port:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:<actual-port>/
```

- If the response is **200**: report success — state the URL the server is running on.
- If the response is **not 200**: wait 3 more seconds, retry once. If it still fails, show the full contents of `/tmp/vite-dev.log` and report the error.
