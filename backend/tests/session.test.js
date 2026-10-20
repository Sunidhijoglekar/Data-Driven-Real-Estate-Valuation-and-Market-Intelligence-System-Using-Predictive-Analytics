import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionStore } from '../../frontend/src/services/session.js';
import { createApiClient } from '../../frontend/src/services/api.js';

function tabStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}
const seller = { email: 'seller@test.example', role: 'Seller', token: 'seller-session' };
const buyer = { email: 'buyer@test.example', role: 'Buyer', token: 'buyer-session' };

test('buyer and seller tabs keep independent identities and authorization headers', async () => {
  const sellerTab = createSessionStore(tabStorage());
  const buyerTab = createSessionStore(tabStorage());
  sellerTab.write(seller);
  const sellerApi = createApiClient(sellerTab);
  const buyerApi = createApiClient(buyerTab);
  buyerTab.write(buyer);
  const capture = async config => ({ data: config.headers.Authorization, status: 200, statusText: 'OK', headers: {}, config });
  assert.equal((await sellerApi.put('/bids/registrations/request/status', { status: 'APPROVED' }, { adapter: capture })).data, 'Bearer seller-session');
  assert.equal((await buyerApi.get('/auth/me', { adapter: capture })).data, 'Bearer buyer-session');
  buyerTab.clear();
  assert.deepEqual(sellerTab.read(), seller);
});

test('invalid stored sessions clear safely instead of crashing the app', () => {
  const storage = tabStorage();
  const store = createSessionStore(storage);
  for (const value of ['invalid json', '{}', JSON.stringify({ ...seller, role: 'Admin' }), JSON.stringify({ ...seller, token: '' })]) {
    storage.setItem('realestate_ai_user', value);
    assert.equal(store.read(), null);
    assert.equal(storage.getItem('realestate_ai_user'), null);
  }
  store.write(seller);
  assert.deepEqual(createSessionStore(storage).read(), seller);
});

test('a delayed 401 for an old token cannot sign out a newly logged-in account', async () => {
  const store = createSessionStore(tabStorage()); store.write(seller);
  let redirects = 0;
  const api = createApiClient(store, () => redirects++);
  await assert.rejects(api.get('/bids/auctions', { adapter: async config => {
    store.write(buyer);
    throw { config, response: { status: 401 } };
  } }));
  assert.deepEqual(store.read(), buyer); assert.equal(redirects, 0);
});

test('an expired session clears only its own tab; wrong login leaves current session intact', async () => {
  const sellerTab = createSessionStore(tabStorage()); sellerTab.write(seller);
  const buyerTab = createSessionStore(tabStorage()); buyerTab.write(buyer);
  let redirects = 0;
  const api = createApiClient(buyerTab, () => redirects++);
  const fail = async config => { throw { config, response: { status: 401 } }; };
  await assert.rejects(api.post('/auth/login', {}, { adapter: fail }));
  assert.deepEqual(buyerTab.read(), buyer); assert.equal(redirects, 0);
  await assert.rejects(api.get('/bids/auctions', { adapter: fail }));
  assert.equal(buyerTab.read(), null); assert.equal(redirects, 1);
  assert.deepEqual(sellerTab.read(), seller);
});
