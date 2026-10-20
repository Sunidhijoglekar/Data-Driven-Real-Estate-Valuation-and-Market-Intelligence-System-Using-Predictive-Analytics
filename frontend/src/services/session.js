const SESSION_KEY = 'realestate_ai_user';
const roles = ['Buyer', 'Seller', 'Investor'];

// sessionStorage belongs to this tab. A buyer tab cannot replace a seller's token.
export function createSessionStore(storage) {
  return {
    read() {
      try {
        const user = JSON.parse(storage.getItem(SESSION_KEY) || 'null');
        if (!user || typeof user.email !== 'string' || typeof user.token !== 'string' || !user.token || !roles.includes(user.role)) {
          storage.removeItem(SESSION_KEY);
          return null;
        }
        return user;
      } catch {
        storage.removeItem(SESSION_KEY);
        return null;
      }
    },
    write(user) { storage.setItem(SESSION_KEY, JSON.stringify(user)); },
    clear() { storage.removeItem(SESSION_KEY); }
  };
}

export const sessionStore = {
  read: () => createSessionStore(window.sessionStorage).read(),
  write: user => createSessionStore(window.sessionStorage).write(user),
  clear: () => createSessionStore(window.sessionStorage).clear()
};
