# /devserver

Start the Vite dev server, handling port conflicts automatically.

Follow these steps in order:

## 1. Check port availability

The default port is **3000** (set in `vite.config.js`).

Run: `lsof -i :3000`

- If the port is **free**: proceed to step 3.
- If the port is **in use**: proceed to step 2.

## 2. Resolve the port conflict

Inspect the `lsof` output:

- If the process is a **stale or orphaned Vite process** (command contains `vite` or `node`):
  - Kill it: `lsof -ti :3000 | xargs kill -9`
  - Wait a moment, then verify the port is now free: `lsof -i :3000`
  - If now free, proceed to step 3 using port 3000.
- If the process is something **unrelated** (e.g. another app):
  - Use port **3001** as the alternate. Check that too: `lsof -i :3001`
  - If 3001 is also in use, increment to 3002, and so on until a free port is found.
  - Proceed to step 3 using the free alternate port.

## 3. Start the dev server

- If using the default port 3000: run `npm run dev` in the background.
- If using an alternate port N: run `npm run dev -- --port N` in the background.

Wait 5 seconds for the server to initialise.

## 4. Confirm accessibility

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/`

- If the response is **200**: report success — include the URL the server is running on.
- If the response is **not 200**: wait 3 more seconds and retry once. If it still fails, report the error and show the last few lines of server output.
