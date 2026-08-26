/**
 * Auth Controller - Login authentication for Buyer, Seller, Investor
 */

const DEMO_USERS = {
  Buyer: {
    name: "Rohan Sharma",
    email: "buyer@example.com",
    role: "Buyer"
  },
  Seller: {
    name: "Apex Realty Developers",
    email: "seller@apexrealty.com",
    role: "Seller"
  },
  Investor: {
    name: "Anand Mehta",
    email: "investor@example.com",
    role: "Investor"
  }
};

export const loginUser = (req, res) => {
  const { role, email, password } = req.body;

  if (!role || !['Buyer', 'Seller', 'Investor'].includes(role)) {
    return res.status(400).json({ error: "Please select a valid role (Buyer, Seller, or Investor)" });
  }

  if (!email || !password) {
    return res.status(400).json({ error: "Email and Password are required" });
  }

  // Demo user matching or dynamic login
  const defaultProfile = DEMO_USERS[role];
  const user = {
    id: `usr-${role.toLowerCase()}-${Date.now().toString().slice(-4)}`,
    name: email.includes('@') ? (email.split('@')[0].replace('.', ' ').toUpperCase()) : defaultProfile.name,
    email: email,
    role: role,
    token: `jwt-token-${role.toLowerCase()}-${Date.now()}`
  };

  return res.json({
    message: `Successfully logged in as ${role}`,
    user
  });
};
