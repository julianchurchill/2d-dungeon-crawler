# /devserver

Start the Vite dev server, handling port conflicts automatically.

Follow these steps in order:

## 1. Kill any existing Vite processes

Stale Vite instances may be running on any port, so check by process name rather than port:

```bash
pgrep -f vite
```

- If any PIDs are returned: kill them all with `pkill -f vite`, wait 1 second, then confirm
  they are gone: `pgrep -f vite` should return nothing.
- If no PIDs are returned: proceed to step 2.

## 2. Check port availability

Run: `fuser 3000/tcp 2>/dev/null && echo "in use" || echo "free"`

- If the port is **free**: proceed to step 3.
- If **still in use** by an unrelated process: find a free alternate port starting from 3001
  (`fuser 3001/tcp 2>/dev/null && echo "in use" || echo "free"`, increment until free).
  Proceed to step 3 using that port.

## 3. Start the dev server

Run the server in the background and capture its output to a temp file:

```bash
npm run dev -- --port <PORT> > /tmp/vite-dev.log 2>&1 &
```

(Use `--port 3000` unless an alternate was chosen in step 2.)

Wait up to 10 seconds for Vite to print its ready message, polling every second:

```bash
for i in $(seq 1 10); do grep -q "ready in" /tmp/vite-dev.log && break || sleep 1; done
```

## 4. Confirm the actual port and accessibility

Vite may auto-switch ports if there is still a conflict. Read the log to find the real port:

```bash
grep "Local:" /tmp/vite-dev.log
```

Extract the port number from that line (e.g. `http://localhost:3001/` → `3001`).

Then confirm accessibility on that exact port:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:<actual-port>/
```

- If the response is **200**: report success — state the URL the server is running on.
- If the response is **not 200**: wait 3 more seconds, retry once. If it still fails, show the
  full contents of `/tmp/vite-dev.log` and report the error.
