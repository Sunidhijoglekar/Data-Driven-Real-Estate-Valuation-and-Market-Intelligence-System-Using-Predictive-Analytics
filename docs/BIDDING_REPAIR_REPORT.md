# Bidding system repair report

## Architecture and root causes

`npm run dev` / `npm start` run `backend/server.js`. Express mounts authentication, property, auction, ML and Gemini routes. Vite builds **frontend/src**. Root `src` and `database/db.js` are older copies, unused by the running application. SQL files are legacy assets; the running app used JavaScript arrays populated from ML JSON files, with no SQL connection.

| Issue found in running code | Repair |
| --- | --- |
| Bids automatically created tokens/participants for unapproved buyers. | Require APPROVED registration, its ACTIVE token and matching participant. Rejection revokes access; approval is idempotent and capacity is enforced. |
| Login accepted any password and returned a fabricated JWT; routes trusted submitted buyer/seller IDs. | Persist salted scrypt password hashes; verify random expiring server sessions, roles and ownership on all mutation routes, including compatibility aliases. Actor IDs/names come from the session. |
| Bids could create auctions, promote them to LIVE and bypass some terminal statuses/expiry. | Reads/bids never create auctions; seller explicitly starts within scheduled times; enforce allowed transitions and reject non-LIVE, paused, frozen, ended, closed, cancelled, completed, future and expired bids. Expiry is persisted on API access. |
| Auctions, requests, tokens, bids, sales and notifications disappeared on restart. | Commit one atomic JSON business-state snapshot; roll back all changes on write failure. Serialize synchronous validation/commit in one Node process; reject another process using the same directory. Use UUIDs instead of timestamp IDs. |
| Server/UI disagreed on first bid; partial numeric strings were accepted. | Every bid must reach current highest/reserve plus increment. Validate positive finite amounts and at most six decimal places in Lakhs; compare integer units. Bids determine highest/history. |
| Clock-based UI treated registration as LIVE and hid access request form. | Stored status is authoritative. Show rejected requests, poll without full-page loading, and match approval to the exact auction rather than old auctions for the same property. |
| Seller had no Start Live button for new auctions; polling captured stale selection; inventory included other owners. | Owner-filtered inventory, functional selected-auction refresh, start/close-registration/reopen/pause/resume/freeze/end controls, bid history/highest buyer and local-time schedule converted to ISO. |
| Notifications leaked through hardcoded account aliases/email substring tests and produced duplicates; broadcasts shared read state. | Exact recipient checks, existing buyer broadcast once, recipient-specific read state, correct auction/property references, one seller BID_PLACED notice and one previous-leader OUTBID notice when applicable. Surface polling errors. |
| Eager Gemini client construction could prevent bidding startup without an AI key. | Initialize only on AI report request; return configuration error if absent. Bidding requires no AI service. |

## Files modified

| File | What changed |
| --- | --- |
| `backend/database/db.js` | Durable transactional business state, lifecycle, approval/token validation, bid rules/history, sale and notification isolation; preserves property/token/ML methods. |
| `backend/database/storage.js` | New atomic JSON writer, state reader and exclusive process lock. |
| `backend/middleware/authMiddleware.js` | New hashed accounts, verified sessions, role checks and logout. |
| `backend/controllers/authController.js`, `backend/routes/authRoutes.js` | Credential verification, registration and logout. |
| `backend/controllers/bidController.js` | Authenticated identities, strict payloads, scoped responses/notices, lazy optional AI. |
| `backend/routes/bidRoutes.js` | Authentication, role checks and actor identity validation for auction endpoints/aliases. |
| `backend/controllers/propertyController.js`, `backend/routes/propertyRoutes.js` | Authenticated listing ownership, numeric validation, protected fields and active-auction edit/delete restrictions; protects legacy bidding endpoint. |
| `backend/server.js` | Clean signal exit, startup failure handling and removal of automatic browser launch. |
| `frontend/src/services/api.js` | Bearer headers, account registration/logout, expired-session redirect and notification error propagation. |
| `frontend/src/App.jsx` | Server session invalidation on logout. |
| `frontend/src/pages/Login.jsx` | Create-account switch; removes prefilled demo password. |
| `frontend/src/pages/SellerDashboard.jsx` | Owner inventory, fresh selection, controls, history, scheduling, response/error handling. |
| `frontend/src/pages/JoinAuction.jsx` | Correct gating, rejection state and background polling. |
| `frontend/src/pages/LiveAuction.jsx` | Approval/status/time gating, decimal inputs, refreshed bid response and load errors. |
| `frontend/src/pages/LiveAuctionsDashboard.jsx`, `frontend/src/pages/MyAuctions.jsx` | Stored statuses and exact auction-registration matching. |
| `frontend/src/components/DashboardLayout.jsx` | Visible notification refresh errors. |
| `backend/tests/bidding.test.js`, `package.json` | Real HTTP integration coverage and `npm test` script. |
| `.gitignore`, `.env.example` | Ignore runtime data, document optional DATA_DIR. |
| `AUCTION_FLOW_FIXES.md`, `docs/BIDDING_REPAIR_REPORT.md` | Mark prior implementation notes superseded; provide this report. |

## Storage, migration and manual setup

No new dependencies or SQL migration are required. First launch imports existing properties and saved legacy bids from `ml/datasets/current_properties.json`. Auction-enabled listings enter registration without fabricated approved buyers. Thereafter **database/runtime/auction-state.json** is authoritative for properties, auctions, registrations, tokens, participants, bids, sales and notifications. Original datasets remain unchanged; historical price data is loaded on every startup.

**database/runtime/accounts.json** stores salted password hashes. Both runtime files are ignored by Git. Optional `DATA_DIR` selects another writable directory. Back up both files together while stopped. Old memory-only registrations/notices cannot be recovered from an already stopped server; saved property bids are imported. No manual migration command is needed. Do not delete the runtime directory to restart the app.

Create accounts because the previous login had no actual credential database. Each email has one role. Sessions expire after 12 hours and on server restart; sign in again afterward. Accounts use local registration, without email verification or external identity integration. Imported demo listing emails have no verified ownership provenance; use newly registered accounts and newly created listings for testing. Production identity verification/rate limiting remains outside this repair.

Run **one Node process per DATA_DIR**, on a local filesystem with atomic rename. A lock rejects competing processes; it reclaims a stale lock only if its recorded process no longer exists. If the PID was reused, verify the process before manually removing `server.lock`. Clustering/shared replicas require a transactional shared database. This repair preserves the JSON architecture.

## Endpoints

All auction endpoints require `Authorization: Bearer <user.token>`. Property GETs remain public.

| Method | Endpoint | Actor/payload |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | `{ email, password, role }`, password >=8 characters; returns user.token |
| POST | `/api/auth/logout` | Current token |
| POST | `/api/properties` | Seller; `{ name, city, price, area, ... }` |
| GET | `/api/bids/auctions` | Buyers: list; sellers: owned auctions |
| GET | `/api/bids/auctions/detail/:auctionId` | Summary including highest bid and history |
| GET | `/api/bids/auctions/property/:propertyId` | Existing auction only |
| POST | `/api/bids/auctions/create` | Owner; `{ property_id, starting_price, minimum_increment, duration_hours, max_participants, auction_start }` |
| POST | `/api/bids/auctions/:auctionId/register` | Buyer; optional buyer_phone |
| GET | `/api/bids/registrations/user/:buyerId` | Own registrations |
| PUT | `/api/bids/registrations/:registrationId/status` | Owner; `{ status: 'APPROVED' or 'REJECTED' }` |
| PUT | `/api/bids/auctions/:auctionId/status` | Owner; `{ status }` |
| POST | `/api/bids/auctions/:auctionId/bid` | Approved Buyer; `{ bidAmount }`; bid_amount/amount also supported |
| POST | `/api/bids/auctions/:auctionId/sell` | Owner; `{ buyerId, finalPrice }`; approved buyer required |
| GET | `/api/bids/notifications` | Current recipient |
| PUT | `/api/bids/notifications/:id/read` | Visible notification only |
| POST | `/api/bids/notifications/read-all` | Current recipient |

Protected compatibility routes remain: POST status updates, POST `/auctions/:auctionId/join`, PUT `/auctions/:auctionId/end` (freeze), `/cancel` (close); POST `/api/bids/auctions/property/:propertyId/bid`, `/api/bids/property/:propertyId/bid`, `/api/properties/:id/bid`. Own token retrieval/top-up and optional winner AI report remain available.

## Exact run/test steps

From project root, with Node 22:

```powershell
npm install
npm test
npm run build
npm run dev
```

Open [localhost:3000](http://localhost:3000). Bidding needs no external credentials. Optional AI reports use GEMINI_API_KEY in `.env`. For production instead of dev:

```powershell
$env:NODE_ENV = 'production'
npm start
```

1. In one browser profile, open `/login`, select Seller and **New here? Create an account**. Register a unique account and add a property on the seller dashboard.
2. Create an auction for that listing: starting price 100 Lakhs, increment 1, duration 24 hours, capacity 10, start now or earlier. Confirm REGISTRATION_OPEN.
3. In a separate browser profile/private window, register a Buyer. Browse `/auctions`, select the property and request access. Confirm PENDING; bidding must fail before approval.
4. On the seller dashboard approve the request, then **Start Live**. Approval and start are separate. A future scheduled start must wait until its time.
5. Wait for buyer request polling (three seconds), enter the live room and bid 101. Check saved history/highest bid and seller BID_PLACED notice. Live room polls every two seconds, seller every three, notification bell every five.
6. Register a second Buyer in another profile, request access, approve from seller, and bid 102. Confirm first buyer's dashboard OUTBID notice and highest bid on both dashboards.
7. Try equal/lower/negative amounts, an unapproved third buyer and another seller's controls. They must fail. Pause/freeze/end bidding and confirm further bids fail. Expired auctions must also reject bids. Close registration to prevent new requests/approvals; approved participants can bid while LIVE.
8. Use Sell Property to choose an approved participant and positive final price. Verify sold listing, winner and sale summary. Highest bid alone does not finalize the sale; the seller chooses.
9. Restart, sign in again and verify saved requests, history, status and notifications.

## Test results and remaining limits

- `npm test`: **21 passed, 0 failed** (16 workflow subtests, parent and four session tests). Real Express HTTP handlers and file storage run against isolated temporary directories, without mock application responses.
- Covers credentials/roles/ownership, creation/retrieval, idempotent approval, all bidding aliases, invalid/equal bids, persistence/history, exact notification recipients/references, independent broadcast reads, 12 competing requests, failed-write rollback, rejection revocation, capacity/decimal increments, future/expired/paused/frozen/ended/closed/cancelled/completed auctions, sale result, reload, competing-server lock and logout.
- `npm run build`: passed with a >500 kB bundle warning. Sandbox blocked Vite config loading; successful builds ran with approved access outside the sandbox.
- `git diff --check`: whitespace checked. Existing `npm run lint` only prints a success message, so it is not meaningful validation; no separate type-check suite is configured for this JSX app.
- Production startup smoke check passed using isolated temporary state: `/api/health` returned 200, `/` served the built React shell with 200, and unauthenticated `/api/bids/auctions` returned 401. The temporary server was then stopped.
- Browser walkthrough passed on an isolated server: Seller, Buyer and Investor signed in in three tabs of the same browser; buyer requested access, seller approved, seller started LIVE, buyer bid 101 and both dashboards showed the bid. Seller reload retained the verified identity. No external Gemini call was run; Gemini requires a valid key. Single-process storage and local unverified account registration are the material deployment limits.


## Follow-up: role login and seller approval

The follow-up traced a same-browser-tab defect: the old frontend kept React user state per tab but read its Bearer token from shared localStorage on every request. Signing in as Buyer in another tab replaced the Seller tab's token, so seller actions went out with buyer authorization. Existing pending request ownership was intact.

- Added `frontend/src/services/session.js` to isolate accounts in sessionStorage per tab. App and API now use the same source. Login stores the session before navigation; logout affects only the current tab. Old shared localStorage sessions are discarded once and require a fresh sign-in; accounts/password hashes are unchanged.
- Added authenticated `GET /api/auth/me` and verify the saved session before rendering protected pages. A delayed 401 from an older token cannot sign out a newly logged-in account.
- Reworked Sign in / Create account UI: blank email, explicit role choice, full name and password confirmation for registration, password visibility control, proper autocomplete, and no default password. Routing uses the authenticated role returned by the server. Account roles remain enforced server-side.
- Seller approvals now use either registration ID field, disable repeated clicks while saving, update the request immediately and refresh afterward. Displayed access status replaces a blank unsupported deposit label.
- Added `backend/tests/session.test.js` for cross-tab credentials, corrupt saved sessions, stale 401 responses, and logout/expiry isolation. Expanded integration tests to sign in all three roles, verify `/auth/me` and deny investor approval.
- Browser acceptance used disposable test accounts/state in a separate temporary data directory; existing user accounts, properties and pending requests were not changed. For the main app, refresh existing tabs and sign in again, then open the seller's Auction Management to review their pending request. Buyer and seller can now use separate tabs of the same browser.


## Follow-up: first property for a new seller

New seller accounts have no owned properties, so showing an unexplained empty auction selector was confusing. Existing catalogue listings remain assigned to their original sellers.

- Create Auction now explains the empty inventory and provides Add Your First Property.
- Add Property validates the entered name/price/area, shows save errors and prevents repeat submission while saving.
- Saving a property immediately selects its ID and price in Create Auction and displays a success message. No fictional property is created for the user and no other seller's listing is reassigned.
- Browser verified with a fresh isolated seller: empty inventory -> Add Your First Property -> save name/locality/price -> saved property automatically selected in Create Auction with price 145.
- The integration test verifies that a fresh seller has zero owned listings, a saved listing belongs to that authenticated seller and another seller cannot auction it. All 21 tests and the production build pass. Tests needed approved execution outside the Windows sandbox after its temporary-file rename was blocked.
