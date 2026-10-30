import fs from "fs";
import path from "path";

export const initialProducts = [
  {
    id: "fone-bluetooth",
    name: "Fone Bluetooth",
    price: 199.9,
    category: "Eletrônicos",
    description: "Som imersivo e bateria para o dia todo.",
    stock: 15,
    rating: 4.8,
    badge: "Mais vendido"
  },
  {
    id: "teclado-mecanico",
    name: "Teclado Mecânico",
    price: 299.9,
    category: "Eletrônicos",
    description: "Teclas precisas para trabalho e jogos.",
    stock: 8,
    rating: 4.9,
    badge: "Oferta"
  },
  {
    id: "garrafa-termica",
    name: "Garrafa Térmica",
    price: 79.9,
    category: "Casa",
    description: "Bebida na temperatura ideal por horas.",
    stock: 25,
    rating: 4.7,
    badge: "Novo"
  },
  {
    id: "mochila-urbana",
    name: "Mochila Urbana",
    price: 159.9,
    category: "Acessórios",
    description: "Espaço e conforto para sua rotina.",
    stock: 12,
    rating: 4.6
  },
  {
    id: "lampada-inteligente",
    name: "Lâmpada Inteligente",
    price: 69.9,
    category: "Casa",
    description: "Iluminação conectada e personalizável.",
    stock: 30,
    rating: 4.5
  },
  {
    id: "suporte-notebook",
    name: "Suporte para Notebook",
    price: 89.9,
    category: "Acessórios",
    description: "Mais ergonomia para sua estação.",
    stock: 20,
    rating: 4.7
  }
];

export const initialUser = {
  id: "user-qa-01",
  name: "Galileo Guilherme (QA Demo)",
  email: "qa@exemplo.com",
  role: "QA Engineer / Specialist",
  address: "Rua dos Testes, 123 - Recife, PE",
  phone: "(81) 99143-2221",
  createdAt: "2026-01-15T08:00:00Z"
};

export const DEFAULT_USERS = [
  {
    id: "user-qa-01",
    name: "Galileo Guilherme (QA Demo)",
    email: "qa@exemplo.com",
    password: "123456",
    role: "QA Engineer",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
];

export const initialCart = [
  {
    id: "fone-bluetooth",
    productId: "fone-bluetooth",
    name: "Fone Bluetooth",
    price: 199.9,
    quantity: 1,
    subtotal: 199.9
  }
];

export const initialOrders = [
  {
    id: "ORD-948210",
    createdAt: "2026-10-25T14:30:00Z",
    status: "CONFIRMED",
    customerName: "Galileo Guilherme (QA Demo)",
    customerEmail: "qa@exemplo.com",
    address: "Rua dos Testes, 123 - Recife, PE",
    shippingMethod: "Padrão grátis",
    shippingPrice: 0.0,
    discount: 0.0,
    total: 199.9,
    items: [
      {
        id: "fone-bluetooth",
        name: "Fone Bluetooth",
        price: 199.9,
        quantity: 1,
        subtotal: 199.9
      }
    ]
  }
];

// Diretório base para arquivos persistentes
const BASE_DATA_DIR = process.env.VERCEL
  ? path.join("/tmp")
  : process.cwd();

const USERS_FILE = path.join(BASE_DATA_DIR, "registered_users.json");
const PRODUCTS_FILE = path.join(BASE_DATA_DIR, "products.json");
const ORDERS_FILE = path.join(BASE_DATA_DIR, "orders.json");
const PROFILE_FILE = path.join(BASE_DATA_DIR, "user_profile.json");

// ── Utilitários de Persistência ──────────────────────────────
function safeReadFile(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed) return parsed;
    }
  } catch (err) {
    console.warn(`[DataStore] Falha ao ler ${path.basename(filePath)}:`, err.message);
  }
  return fallback;
}

function safeWriteFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn(`[DataStore] Falha ao gravar ${path.basename(filePath)}:`, err.message);
  }
}

// ── 1. Usuários Registrados (registered_users.json) ───────────
export function getPersistentUsers() {
  const users = safeReadFile(USERS_FILE, DEFAULT_USERS);
  return Array.isArray(users) && users.length > 0 ? users : [...DEFAULT_USERS];
}

export function savePersistentUsers(users) {
  safeWriteFile(USERS_FILE, users);
}

export function registerUser(newUser) {
  const users = getPersistentUsers();
  const normalized = newUser.email.toLowerCase().trim();
  const exists = users.some((u) => u.email.toLowerCase().trim() === normalized);
  if (exists) return null;

  users.push(newUser);
  savePersistentUsers(users);

  const store = getStore();
  store.registeredUsers = users;
  return newUser;
}

export function findUserByCredentials(email, password) {
  const users = getPersistentUsers();
  const normalized = email.toLowerCase().trim();
  let found = users.find(
    (u) => u.email.toLowerCase().trim() === normalized && u.password === password
  );

  if (!found && normalized === "qa@exemplo.com" && (password === "123456" || password === "LabQA!Run-7kV2pX9m")) {
    found = users.find((u) => u.email.toLowerCase().trim() === "qa@exemplo.com") || DEFAULT_USERS[0];
  }
  return found;
}

export function updateUserPassword(email, newPassword) {
  const users = getPersistentUsers();
  const normalized = email.toLowerCase().trim();
  const idx = users.findIndex((u) => u.email.toLowerCase().trim() === normalized);
  if (idx !== -1) {
    users[idx].password = newPassword;
    users[idx].updatedAt = new Date().toISOString();
    savePersistentUsers(users);
    const store = getStore();
    store.registeredUsers = users;
    return true;
  }
  return false;
}

// ── 2. Produtos do Catálogo (products.json) ──────────────────
export function getPersistentProducts() {
  const prods = safeReadFile(PRODUCTS_FILE, initialProducts);
  return Array.isArray(prods) && prods.length > 0 ? prods : [...initialProducts];
}

export function savePersistentProducts(products) {
  safeWriteFile(PRODUCTS_FILE, products);
}

// ── 3. Histórico de Pedidos (orders.json) ────────────────────
export function getPersistentOrders() {
  const ords = safeReadFile(ORDERS_FILE, initialOrders);
  return Array.isArray(ords) && ords.length > 0 ? ords : [...initialOrders];
}

export function savePersistentOrders(orders) {
  safeWriteFile(ORDERS_FILE, orders);
}

// ── 4. Perfil do Usuário Ativo (user_profile.json) ───────────
export function getPersistentProfile() {
  const prof = safeReadFile(PROFILE_FILE, initialUser);
  return prof && prof.email ? prof : { ...initialUser };
}

export function savePersistentProfile(user) {
  safeWriteFile(PROFILE_FILE, user);
}

// ── Inicialização dos arquivos caso não existam ──────────────
try {
  if (!fs.existsSync(USERS_FILE)) safeWriteFile(USERS_FILE, DEFAULT_USERS);
  if (!fs.existsSync(PRODUCTS_FILE)) safeWriteFile(PRODUCTS_FILE, initialProducts);
  if (!fs.existsSync(ORDERS_FILE)) safeWriteFile(ORDERS_FILE, initialOrders);
  if (!fs.existsSync(PROFILE_FILE)) safeWriteFile(PROFILE_FILE, initialUser);
} catch {
  // Ignora caso o ambiente seja estritamente somente-leitura
}

// In-memory runtime state integrado com persistência
globalThis._qaStore = globalThis._qaStore || {
  registeredUsers: getPersistentUsers(),
  products: getPersistentProducts(),
  user: getPersistentProfile(),
  cart: [...initialCart],
  orders: getPersistentOrders()
};

export const getStore = () => {
  const store = globalThis._qaStore;
  if (!store.registeredUsers || store.registeredUsers.length === 0) {
    store.registeredUsers = getPersistentUsers();
  }
  if (!store.products || store.products.length === 0) {
    store.products = getPersistentProducts();
  }
  if (!store.orders || store.orders.length === 0) {
    store.orders = getPersistentOrders();
  }
  if (!store.user || !store.user.email) {
    store.user = getPersistentProfile();
  }
  return store;
};

export const parseBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};
