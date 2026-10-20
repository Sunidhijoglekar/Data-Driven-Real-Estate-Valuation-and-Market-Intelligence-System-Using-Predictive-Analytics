# Explicit auction publication and immediate launch

## Result

Property creation/import no longer creates an auction. Normal listings stay visible, with no bidding action until a real auction is explicitly published and active. **Launch Live Auction** now publishes as LIVE immediately using server time. Duration still controls the calculated end time. There is no start-date input or client-time requirement.

## Root causes

- `initData`, `addProperty` and `updateProperty` could create auction records from the property's `auctionEnabled` flag. The current saved data contained 134 legacy auction records but no explicit launch/publication markers or seller-created auction events.
- The buyer dashboard filtered out only COMPLETED/CLOSED records; unpublished, ended and other inactive records could still look available.
- `PropertyCard` always rendered Bid Now, and property/detail/valuation badges trusted the legacy property flag rather than an actual active auction.
- Creation returned REGISTRATION_OPEN, while the button said Launch Live Auction. The seller also had to supply a local start date, adding a separate manual start step and client-clock ambiguity.
- The separate auction catalogue said live registration was closed even when the backend allowed requests.

## Behavior and compatibility

- Only explicit creation/launch sets `published_at` and status LIVE. `auction_start` is the backend's current time; `auction_end = auction_start + duration_hours * 3,600,000`. Submitted legacy start fields are ignored. Duration, increment, price and capacity are still validated.
- An existing **unpublished, nonterminal** auction for that property is published in place, preserving its ID, requests and history. A second launch of a currently published nonterminal auction is rejected. Ended/closed/cancelled records remain historical; a new auction may be created for the same property rather than reopening a terminal record.
- Existing unmarked auto-created records are retained and treated as unpublished. They are visible to their authorized seller/manager for Configure & Launch, but unavailable for buyer participation. No records were bulk-deleted, reset or auto-published.
- Capability fields (`is_published`, `is_visible_live`, `can_request_access`, `can_bid`, `is_upcoming`) are derived on the server from publication, property availability, status and server time. Requests, approval and bids are independently validated. Paused/frozen/expired/terminal auctions do not accept new participation.
- New launches are immediate. A previously stored, explicitly published future auction can appear as Upcoming with no requests/bids until active under its lifecycle rules. This does not reintroduce a seller scheduling field.
- Live views fetch real eligible auction records with `GET /api/bids/auctions?view=live`. Unpublished/inactive records are excluded. `view=history` retains the signed-in buyer's prior registrations, participation and results; the seller management view retains their authorized records.
- Property responses derive auction flags from the real active published auction. Cards/details/valuation pages and old notification actions cannot expose a bidding request based only on a stale property flag. Existing catalogue filters/listings remain unchanged.
- Bob's existing management grants, original seller ownership, Alice's account and prior requests remain intact. No account authentication code or passwords changed.

## Files modified for this request

| File | Change |
| --- | --- |
| `backend/database/db.js` | Remove property-triggered auction creation; explicit immediate publication/reuse; participation capabilities and validation; computed property flags; correct highest/reserve floor; current notification capabilities. |
| `backend/controllers/bidController.js` | Filter live/history views server-side; remove start-time payload dependency; return successful live-launch message. |
| `backend/controllers/propertyController.js` | Project active-auction fields into public property responses; property creation returns an ordinary non-auction listing. |
| `frontend/src/services/api.js` | Support live/history auction-query options. |
| `frontend/src/pages/SellerDashboard.jsx` | Remove start-date state/input/payload; keep duration; immediate launch messaging; distinguish unpublished legacy records and published active auctions; disable premature approval; count published auctions. |
| `frontend/src/pages/BuyerDashboard.jsx` | Fetch eligible live records, gate request/entry actions on server capabilities, and hide stale notification requests. |
| `frontend/src/pages/LiveAuctionsDashboard.jsx` | Use live query; request passes for active open auctions; upcoming participation disabled. |
| `frontend/src/pages/MyAuctions.jsx` | Fetch buyer-specific historical records without mixing them into live discovery. |
| `frontend/src/pages/JoinAuction.jsx` | Server-derived request/live gating. |
| `frontend/src/pages/LiveAuction.jsx` | Require server capability as well as existing approval/time checks. Countdown remains. |
| `frontend/src/components/PropertyCard.jsx` | Hide bidding badge/button and stale top-bid banner without active server-confirmed auction; two-button layout for ordinary listings. |
| `frontend/src/pages/PropertyDetail.jsx` | Gate bidding actions on actual participation availability. |
| `frontend/src/pages/PropertyValuation.jsx` | Gate bidding actions on actual participation availability. |
| `frontend/src/components/DashboardLayout.jsx` | Hide stale auction-created request actions when no longer eligible. |
| `backend/tests/bidding.test.js` | Verify no automatic creation, immediate launch/duration, live/history filtering, unavailable requests, client-time independence, scheduled compatibility and expiry. |
| `backend/tests/bob-alice.test.js` | Existing-account replay explicitly publishes the existing legacy record before approval; verifies no duplicate and preserves its IDs. |
| `backend/tests/auction-visibility.test.js` | New rendered-card/form checks and fresh-import regression. |
| `docs/AUCTION_PUBLICATION_REPORT.md` | This report. |

Other working-tree edits predate this request. The launch instructions here supersede the earlier registration-first/manual-start steps in historical repair reports.

## Saved data and schema

The only new persisted publication field is `published_at`, written when a seller actually launches an auction. Older rows without it load compatibly as unpublished; their IDs and history remain available. Existing time/duration fields remain in use. Response capability flags are computed, not bulk-written onto properties. No migration or dependency installation is required.

Before restart, the saved state was backed up to `database/runtime/backups/before-auction-publication-1792511962830.json` (ignored by Git). Counts were 1,062 properties, 134 auction records, two existing requests, four bids and 12 management grants. The live catalogue check after restart still returned 1,057 unsold listings. A comparison with the backup confirmed property records, requests, bids, tokens, participants, sales, notifications and management grants unchanged; all 134 auction records remained present. Normal expiry evaluation may update an elapsed auction's status.

No live auctions were launched and no live bids were placed during testing. Bob/Alice tests write only isolated copies.

## Verification

`npm test`: **31 passed, 0 failed**, including:

- Creating a property, even with legacy auctionEnabled=true, creates no auction, has no access capability and is absent from the live API.
- Direct access-request/bid calls for that unlaunched property fail and do not provision an auction.
- Explicit launch publishes immediately and appears in the buyer live API; exact one-hour duration is verified.
- The property-card component renders no Bid Now/Live Auction UI for an unpublished property, even with the legacy flag true; the action appears with server-confirmed active access.
- The rendered seller form retains Duration (Hours) and Launch Live Auction, without datetime-local or the old start label.
- Client future start dates do not delay a new launch; server start/end and default duration are verified.
- A legacy published future record is discoverable as upcoming, with access and bids blocked.
- Expired/ended auctions reject access and bids, disappear from live discovery and remain in authorized history.
- Fresh dataset import does not synthesize auctions.
- Bob/Alice's saved-ID replay, approval, persistence, notifications, invalid/unauthorized/concurrent bids, rollback, reload and session checks still pass.

`npm run build`: passed, with the existing large-bundle warning. `git diff --check`: passed, with an informational existing dataset line-ending warning. Local startup and public catalogue checks passed on port 3000.

Tests use actual API/domain/file paths and rendered React components. This request did not run a credentialed browser walkthrough with Bob/Alice because their plaintext passwords were not supplied; their credentials were preserved. No external AI calls are needed for auctions.

## Verify in the app

1. Refresh [localhost:3000](http://localhost:3000); sign in again after the server restart.
2. Bob (`bob@gmail.com`, Seller) opens Create Auction and selects an owned or delegated existing property. Legacy unpublished records can also use Configure & Launch Auction.
3. Enter starting price, minimum increment, duration and maximum bidders. Click Launch Live Auction. No date entry or second Start Live action is required.
4. Alice (`alice@gmail.com`, Buyer), in another tab, sees it under Live Auctions and can request access. Ordinary unlaunched listings stay in the catalogue without a bidding button.
5. Bob approves the request. Alice can bid while published and LIVE, before the server-calculated end. Both dashboards refresh the saved highest bid/history.
6. An expired/closed auction remains unavailable. Create a fresh auction for an eligible existing property when appropriate; old records are preserved.
