# Bob and Alice: existing-account bidding repair

## Accounts and stored IDs

The active app uses `backend/database/db.js`, with persistent JSON state in `database/runtime/auction-state.json`. Login credentials are in `database/runtime/accounts.json`; authentication IDs are the normalized account email keys, not separate numeric user IDs.

| Existing account | Exact ID/email | Role |
| --- | --- | --- |
| Bob | `bob@gmail.com` | Seller |
| Alice | `alice@gmail.com` | Buyer |

`bob@gamil.com` is a different existing Seller account with the same display name. It was not merged, deleted or granted access. No accounts/passwords/roles were created, reset or changed in the live store.

## Properties and original ownership

There are **1,062 stored properties, 1,057 unsold catalogue listings**, 134 existing auctions and four existing auction bids at migration time. Alice's buyer dashboard fetches the public catalogue with `page=1&limit=12`, then supports filters and infinite scrolling. It does not own those properties. The entire available catalogue and original owner/auction relationships are listed in [ALICE_PROPERTY_INVENTORY.md](ALICE_PROPERTY_INVENTORY.md). This is the server-side catalogue and default first page; Alice's current private browser filters were not inspected.

Unsold catalogue references: seller@apexrealty.com (266), seller2@apexrealty.com (264), seller3@apexrealty.com (263), seller4@apexrealty.com (264). These are existing owner references from the dataset. Only seller@apexrealty.com currently has a registered account among those four references; no missing owner accounts were invented.

Bob is now an **auction manager** for these existing first-page properties:

| Property ID | Existing property | Original owner ID |
| --- | --- | --- |
| prop-4 | Sobha Limited Skyline Villas | seller@apexrealty.com |
| prop-7 | Lodha Group Urban Court | seller4@apexrealty.com |
| prop-8 | Aparna Constructions Central Gardens | seller@apexrealty.com |
| prop-9 | Brigade Group Valley Haven | seller2@apexrealty.com |
| prop-10 | Puravankara Heights Enclave | seller3@apexrealty.com |
| prop-11 | Rustomjee Palms Square | seller4@apexrealty.com |
| prop-12 | Tata Housing Vista Plaza | seller@apexrealty.com |
| prop-13 | Mahindra Lifespaces Avenue Terraces | seller2@apexrealty.com |
| prop-14 | Casagrand Oasis Residences | seller3@apexrealty.com |
| prop-15 | Kolte-Patil Solitaire Greens | seller4@apexrealty.com |
| prop-16 | Piramal Realty Signature Estate | seller@apexrealty.com |
| prop-17 | Prestige Group Crown Heights | seller2@apexrealty.com |

Alice already had a PENDING request `reg-0c7f8570-ec07-44d8-b215-927233aa1199` for property `prop-4`, auction `auc-prop-4`. That same request remains pending in the live data for Bob to review. It was not replaced with a new request or approved as a side effect of migration.

## Root cause and repair

Bob's account was valid but owned no properties. The imported catalogue belonged to the four original owner IDs. Both seller inventory/auction filtering and backend approval checks required direct owner equality, so Bob could neither see the listings nor approve Alice's existing request. This was a missing management relationship, not a missing property or a reason to replace accounts.

Added audited, property-scoped delegation rather than changing sellerEmail or auction seller_id. Bob can discover those 12 listings, create auctions where no active one exists, start/control their auctions, review requests and inspect bidding history. Original owners retain ownership and final sale authority. Bob cannot edit/delete their listings or finalize sales. His similarly named alternate account and unrelated properties remain unauthorized.

New auctions created by a delegated manager retain the original owner in `seller_id` and record the acting manager in `created_by`. Existing auctions retain their IDs and owner IDs. New/pending request and bid notifications go once to each authorized manager and original owner. Existing pending requests were surfaced to Bob once. Grants are idempotent, survive restart and can be explicitly revoked; revocation removes effective permission and new notices without transferring ownership.

The frontend now fetches an authenticated auction-management inventory instead of filtering the public list by Bob's ownership. The server scopes auction summaries and returns explicit `can_manage_auction`, `can_sell`, and management-access fields. Managed properties identify the original owner. Active auctions offer **Manage Existing Auction**, avoiding duplicate creation; unscheduled properties can be auctioned normally.

## Files changed for this request

| File | Change |
| --- | --- |
| `backend/database/db.js` | Add management-grant state, owner-preserving manager checks, grant/revoke operations, management inventory, original-owner auction creation, and deduplicated owner/manager notifications. Owner-only sale check remains. |
| `backend/controllers/bidController.js` | Include authorized managers in seller lists/detail responses; expose management/sale capability flags. |
| `backend/routes/propertyRoutes.js` | Add authenticated Seller-only `GET /api/properties/auction-inventory` before the property-ID route. Property edit/delete remain owner-only. |
| `frontend/src/services/api.js` | Call management inventory endpoint. |
| `frontend/src/pages/SellerDashboard.jsx` | Display owned and delegated properties/auctions, show original owner, disable manager sales, open existing auctions. |
| `scripts/connect-bob-alice.js` | Offline preview/apply/revoke migration using exact existing account/property IDs, backup, record/credential integrity checks and exclusive server lock. No public permission-grant endpoint. |
| `backend/tests/bob-alice.test.js` | Primary replay with copies of Bob/Alice's real saved account IDs, actual properties and Alice's existing request; no new live users or live bids. |
| `docs/BOB_ALICE_BIDDING_REPORT.md` | This report. |
| `docs/ALICE_PROPERTY_INVENTORY.md` | All 1,057 available properties with owner and auction IDs and Bob's exact scope. |

The other working-tree edits predate this request and belong to the earlier bidding/login repairs. Authentication code and credential storage were not modified in this request.

## Live database change and rollback

Applied one compatible, additive JSON schema extension: `auctionManagersData`, defaulting to an empty array for older snapshots. Each grant records grant_id, property_id, manager_id, owner_id, scope, granted_by, reason and granted_at. Revocation records revoked_at/by/reason. Permission is effective only while not revoked and while its recorded original owner still matches the property.

The migration added **12 management grants and two notices for existing pending requests**. It left the existing property, auction, registration, token, participant, bid, sale and buyer-token arrays unchanged. It compared the account file byte-for-byte before/after to verify unchanged credentials. No live auctions were started and no live bids were placed. Alice's catalogue remains unchanged.

Backup: `database/runtime/backups/before-bob-access-1792510403554.json`. Runtime data/backup stay ignored by Git.

Migration was applied while the server was stopped to avoid overwriting its in-memory state. For inspection or deliberate reversal, stop the server first and use:

```powershell
node scripts/connect-bob-alice.js          # read-only preview
node scripts/connect-bob-alice.js --apply  # idempotent, already applied
node scripts/connect-bob-alice.js --revoke # revoke only these grants; do not restore old bids
```

Do not restore the whole backup over newer user activity. Revocation is the safe way to remove this access while retaining later bids and records. No dependency installation or SQL migration is required.

## Login and verify

Run `npm run dev` from the repository root and open [localhost:3000/login](http://localhost:3000/login). After the restart, sign in again using each account's **existing password**:

1. Seller, `bob@gmail.com`: open **My Properties** or **Manage Properties**. The 12 delegated listings show their original owners. Do not choose the separate typo account `bob@gamil.com`.
2. For Sobha Limited Skyline Villas (`prop-4`), choose **Manage Existing Auction**, or open **Auction Management** and select its existing auction `auc-prop-4`.
3. Review Alice's request, identified by buyer ID `alice@gmail.com`, and approve or reject it. Approval activates her pass but does not start the auction.
4. Start Live within the existing auction's time window. If the old auction has actually expired, the app correctly refuses to reopen it. Select a granted listing without an active auction (for example prop-7 when still unscheduled), create a fresh auction for that existing property, and have Alice request access to the new auction.
5. In a separate tab sign in as Buyer, `alice@gmail.com`, with her existing password. All original catalogue properties remain visible. Open **My Auctions** for her pending/approved request or find the listing in **Live Auctions**.
6. Once approved and LIVE, enter at least displayed highest/reserve plus minimum increment. Bob's view and Alice's view refresh to the saved highest bid/history. This is a manual development acceptance step, not a live bid placed by this repair.
7. Verify equal/lower/unapproved/paused/closed bids fail. A second already-existing approved buyer can exercise OUTBID; no extra account is needed. Owner/manager bid notices and Alice's outbid notice use the same notification system.

Existing endpoints continue to handle create, register, approve/reject, status and bidding under `/api/bids`; account IDs are always taken from the verified session. Management rights do not allow impersonating Alice or bypassing buyer approval.

## Test results and honest limits

- `npm test`: **28 passed, 0 failed**, including seven checks in the Bob/Alice replay (parent plus six subtests) and the earlier HTTP/authentication/session/concurrency regressions.
- Bob/Alice replay uses copies of their stored records. It replays the original auction window with a test clock and a status change confined to the copy; it never reopens a live ended auction. Covers exact scoped inventory, unchanged owners/credentials, controller summary visibility, existing request approval, idempotent notification backfill, Alice bid persistence, manager/owner notices, outbid by an already-existing secondary buyer, manager-created auction owner retention, invalid/unauthorized/ended bids, rejection, grant rollback/revocation and reload.
- The live migration was checked against its backup: all existing business-record arrays unchanged; 12 grants and two request notices were the only additions. No new account or property records were created in live data.
- `npm run build`: passed; existing >500 kB bundle warning remains. `git diff --check`: passed apart from an informational existing line-ending warning.
- **Credentialed sign-in/browser acceptance with Bob and Alice remains manual.** Their existing plaintext passwords were not supplied, their hashes were not cracked or replaced, and restarting invalidates old in-memory sessions. The Bob/Alice replay tests domain/controller behavior using their stored IDs; it does not claim to have authenticated as them with their passwords. The pre-existing HTTP regression suite independently checks normal password/session enforcement using temporary fixtures, never live accounts.
- No AI service calls were required. JSON persistence still supports one Node server process per data directory.
