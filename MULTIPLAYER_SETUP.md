# Everyday Life: Philippines — multiplayer upgrade

Copy the contents of this folder over your project root. `backend/` is new; everything under `src/` either
adds a file or replaces the file of the same name (see "Changed files"). Nothing else is touched.

## 1. Run it (Windows + XAMPP)

1. Start **MySQL** in XAMPP, then create the database (phpMyAdmin or CLI):
   `CREATE DATABASE everyday_life CHARACTER SET utf8mb4;`
2. Backend:
   ```
   cd backend
   copy .env.example .env        (edit JWT_SECRET; DATABASE_URL is already XAMPP's default)
   npm install
   npx prisma db push            (creates the tables)
   npm run dev                   (API + Socket.IO on :4000)
   npm test                      (optional: 12 tests, no database needed)
   ```
3. Frontend (project root): `npm install` then `npm run dev` (now `vite --host`).
4. **Two devices:** find your PC's LAN IP (`ipconfig`), open `http://<that-ip>:5173` on the phone/second PC.
   The game automatically talks to `http://<that-ip>:4000`. Allow ports 5173 and 4000 in Windows Firewall.

## 2. New files

| File | Purpose |
|---|---|
| `backend/**` | Express + Socket.IO + Prisma/MySQL + JWT + bcrypt server |
| `src/utils/api.js` | REST client (register, login, logout, load/save game) |
| `src/game/multiplayer.js` | Socket client: streams your transform, receives others, chat, reconnect |
| `src/game/RemotePlayers.jsx` | Renders every real remote player with your own `Character` component |
| `src/store/mpStore.js` | Connection status, roster, chat (tiny external store + `useMp` hook) |
| `src/store/useServerSave.js` | Autosave hook (debounced, flushes on tab hide/close) |
| `src/components/AuthScreen.jsx` | Login / register screen |
| `src/components/ChatPanel.jsx`, `OnlinePlayers.jsx` | Chat UI, online list |

## 3. Changed files (complete files provided)

- `src/game/Scene3D.jsx` — +20 lines: publishes your final transform on `bridge.me`, adds `bridge.setPos`
  (spawn / anti-cheat snap-back), name tag on your own character, renders `<RemotePlayers />`.
- `src/components/Hud.jsx` — online chip (click = list of players) and the chat button.
- `src/store/gameReducer.js` — new `RESET` action (clears state on logout).
- `src/store/storage.js` — token helpers + `API_URL`. Existing exports are unchanged.
- `package.json` — adds `socket.io-client`, `dev` = `vite --host`, `server` script.

`Joystick.jsx` needs no change: it already writes `bridge.vec`, which Scene3D turns into movement, and
that movement is what gets broadcast. Keyboard shortcuts are ignored while typing in chat.

## 4. How it works

- **Accounts:** bcrypt-hashed passwords, JWT (7d). Logout bumps `tokenVersion`, so tokens really die, and the
  player is removed from the world immediately. Login/register are rate-limited.
- **Save data:** `Character` (look, money, level, last position) + `InventoryItem` rows + a JSON blob for the
  rest of the reducer state. The server rebuilds exactly what `dispatch({ type: 'LOAD', state })` expects.
- **Realtime:** the client sends ~15 packets/s (1/s when idle). The server validates, rate-limits, and
  broadcasts batched snapshots at 15 Hz. Remote characters are interpolated at 60 fps and animated through the
  same `userData` fields your NPCs/player use (`walk`, `air`, `act`, `phase`), so gym, fishing, basketball, praying,
  jumping and riding a jeepney all show up on other screens.
- **Disconnects:** the player stays in the world for 10 s (shown as "reconnecting…"); a quick reconnect resumes
  the same entity. Past that they leave and their position is saved. Opening the account on a second device
  replaces the first session.
- **Anti-cheat on movement:** out-of-bounds, NaN, speed hacks and teleports are rejected and the client is snapped
  back (map travel to a known location is allowed).

## 5. Known limits (so nothing surprises you)

- **Economy is client-authoritative.** Saves are validated and clamped (money cap, inventory shape, look format),
  but a determined user could still edit their own money. Making it cheat-proof means running the reducer on the server.
- **NPCs, traffic and the rideable jeepneys are simulated on each client**, so two players do not see the same NPC
  positions. Players are fully shared; the world's ambient life is not.
- Logging out on one device logs out all devices. The token is kept in `localStorage`.
- The world lives in one Node process (fine for dozens of players). More than that needs the Socket.IO Redis adapter.
- InfinityFree cannot run Node. Deploy `backend/` on Render/Railway/Fly with a hosted MySQL, set `VITE_API_URL`
  in the frontend build and `CLIENT_ORIGINS` (+ `TRUST_PROXY=true`) on the backend. Use HTTPS on both: a Vercel (https)
  frontend cannot call an http backend.
