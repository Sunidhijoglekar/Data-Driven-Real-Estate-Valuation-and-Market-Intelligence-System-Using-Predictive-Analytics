# Real Estate Project — Auction Flow Fixes

## Active frontend
The Vite application uses `frontend/src`.

## Corrected seller -> buyer -> auction flow

1. Seller creates an auction for an unsold property.
2. Registration opens immediately.
3. Buyer requests an Auction Token.
4. Seller can approve/reject the request.
5. Approval creates an authorized participant and active auction token.
6. Seller closes registration and starts live bidding.
7. Only an authorized token holder can place a bid.
8. Minimum bid/increment is validated on the server.
9. Bids are rejected after the auction end time.
10. Seller can pause/freeze/end bidding.
11. Seller can select only an authorized participant for the final sale.
12. Final price cannot be lower than the current highest bid.
13. Sale marks the property as SOLD and deactivates auction tokens.
14. Buyer gets the auction result/sale summary.

## Important implementation fixes

- Seller ownership is enforced server-side for auction creation, status changes, registration decisions, and final sale.
- Registration capacity is enforced.
- Duplicate registration/approval is handled safely.
- The old frontend registration fields (`registration_id`, `deposit_amount`) were corrected to match the actual backend model.
- The live bidding screen now respects non-LIVE, paused, frozen, and expired states.
- Production API startup no longer imports Vite/Rollup eagerly.
- `frontend/src/pages/SellerDashboard.jsx` was rebuilt so all seller controls match the backend state machine.

## Run

```bash
npm install
npm run dev
```

For a production frontend build:

```bash
npm run build
NODE_ENV=production npm start
```
