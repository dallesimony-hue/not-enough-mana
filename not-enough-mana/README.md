# Not Enough Mana — online multiplayer

A browser-based, server-authoritative fantasy card game for 2–6 players. Danish UI. Original cards and rules inspired by the fantasy dueling genre, **not an exact digital edition of the commercial board game**.

## Run locally

1. Install Node.js 20 or later.
2. Run `npm install` and `npm start`.
3. Open http://localhost:3000. For remote players you **must deploy the Node server**; sharing a local file or using static hosting like Netlify Drop will not work.

## Put online

1. Create a GitHub repository and upload the project files (including `server.js`, `game.js`, `package.json`, `public/index.html`, `render.yaml`).
2. Create a **Web Service** at https://dashboard.render.com and connect the GitHub repository. Build: `npm install`; Start: `npm start`.
3. Use the Render HTTPS URL. Host creates a room; friends join by link or room code. All must use the **same deployed URL**.

Free hosting availability and sleeping behavior depend on the provider. In-memory rooms reset if the server restarts or sleeps. For durable rooms and production-grade scaling, add a persistent datastore. One running server instance is required (do not enable horizontal scaling).

## Game rules (this fan version)

2–6 players; start with 10 health, 3 mana, and 5 cards. Draw 1 card and gain 2 mana at the start of each subsequent turn. Each player may use one optional +3 mana potion per turn. Play any affordable cards, target an opponent when needed, and end turn. Shield absorbs damage first. Last surviving player wins. Mana cap 12; health cap 10. Artefacts remain active. Drinking real alcohol is not necessary.

## Reliability

- Server validates turn ownership, mana costs, card ownership, targets, and room capacity.
- Private hands are transmitted only to their owners.
- Room tokens stored in browser local storage support reconnects and refreshes.
- Disconnects are shown to all players; turn state persists while server stays up.
- Idle rooms expire after eight hours; server process restart clears rooms.
- The host can start only when 2+ players are ready.
