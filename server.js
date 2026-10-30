/**
 * server.js — QA Automation Lab Backend (Render)
 * ─────────────────────────────────────────────────────────────
 * Backend Express.js nativo para o laboratório de automação de testes.
 * Suporta testes de API (Swagger, Bruno, Cypress, Playwright).
 * Inclui Rate Limiting, CORS aberto, Mock State e tratamento 404.
 * ─────────────────────────────────────────────────────────────
 */

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { getStore } from "./_data.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração para proxies reversos (Render / Vercel / Cloudflare)
app.set("trust proxy", 1);

// ── Middlewares Globais ──────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ── Rate Limiter de Proteção (50 req/min por IP) ─────────────
const qaRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 50, // Máximo de 50 requisições por IP na janela
  standardHeaders: true, // Inclui headers RFC RateLimit-*
  legacyHeaders: false, // Desativa X-RateLimit-* legados
  statusCode: 429,
  message: {
    status: 429,
    error: "Too Many Requests",
    message:
      "Aviso: Este é um ambiente de laboratório para estudos e demonstração. A infraestrutura atual  não está preparada para testes de carga, stress ou picos de acesso. Por favor, não realize este tipo de teste."
  }
});

app.use(qaRateLimiter);

// ── Helpers & Constantes de Domínio ──────────────────────────
const calcCartTotal = (items) =>
  Number(items.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(2));

const VALID_COUPONS = {
  CYPRESS10: { discountPercent: 10, description: "10% de desconto especial Cypress Lab" },
  PLAYWRIGHT15: { discountPercent: 15, description: "15% de desconto Playwright Master" },
  QALAB20: { discountPercent: 20, description: "20% de desconto QA Automation Lab" }
};

// ── 1. Monitoramento (Health Check) ──────────────────────────
app.get(["/health", "/api/health"], (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "production",
    service: "qa-lab-render-backend",
    version: "1.0.0"
  });
});

// ── 2. Autenticação & Sessão ─────────────────────────────────
app.post(["/auth/login", "/api/auth/login"], (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "E-mail e senha são obrigatórios."
    });
  }

  const isValid =
    email.toLowerCase().trim() === "qa@exemplo.com" &&
    (password === "123456" || password === "LabQA!Run-7kV2pX9m");

  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: "Credenciais inválidas. Utilize qa@exemplo.com e 123456."
    });
  }

  return res.status(200).json({
    success: true,
    message: "Autenticação realizada com sucesso.",
    token: `mock-jwt-token.${Buffer.from(JSON.stringify({ sub: "user-qa-01", email })).toString("base64")}.${Date.now()}`,
    user: {
      id: "user-qa-01",
      email: "qa@exemplo.com",
      name: "Galileo Guilherme (QA Demo)",
      role: "QA Engineer"
    }
  });
});

app.post(["/auth/logout", "/api/auth/logout"], (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Sessão invalidada com sucesso. Token revogado."
  });
});

app.post(["/auth/register", "/api/auth/register"], (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: "Campos obrigatórios: name, email e password."
    });
  }

  return res.status(201).json({
    success: true,
    message: "Usuário registrado com sucesso.",
    user: {
      id: `user-${Date.now()}`,
      name,
      email,
      role: "Tester / Student",
      createdAt: new Date().toISOString()
    }
  });
});

// ── 3. Usuários ──────────────────────────────────────────────
app.get(["/users/me", "/api/users/me"], (req, res) => {
  const store = getStore();
  return res.status(200).json({ success: true, user: store.user });
});

app.put(["/users/me", "/api/users/me"], (req, res) => {
  const store = getStore();
  const updates = req.body || {};
  store.user = { ...store.user, ...updates, updatedAt: new Date().toISOString() };
  return res.status(200).json({
    success: true,
    message: "Perfil atualizado com sucesso.",
    user: store.user
  });
});

app.get(["/users", "/api/users"], (req, res) => {
  const mockUsers = [
    { id: "usr-1", name: "Galileo Guilherme", email: "qa@exemplo.com", role: "QA Lead", status: "active" },
    { id: "usr-2", name: "Maria QA", email: "maria.qa@exemplo.com", role: "QA Analyst", status: "active" },
    { id: "usr-3", name: "João Tester", email: "joao.tester@exemplo.com", role: "Automation Engineer", status: "inactive" }
  ];
  return res.status(200).json({ success: true, total: mockUsers.length, users: mockUsers });
});

// ── 4. Catálogo de Produtos ──────────────────────────────────
app.get(["/products/search", "/api/products/search"], (req, res) => {
  const store = getStore();
  const q = (req.query?.q || "").trim().toLowerCase();

  const results = q
    ? store.products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
    : store.products;

  return res.status(200).json({
    success: true,
    query: q,
    total: results.length,
    products: results
  });
});

app.get(["/products/:id", "/api/products/:id"], (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const product = store.products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({ success: false, error: `Produto "${id}" não encontrado.` });
  }

  return res.status(200).json({ success: true, product });
});

app.delete(["/products/:id", "/api/products/:id"], (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const idx = store.products.findIndex((p) => p.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: `Produto "${id}" não encontrado para exclusão.` });
  }

  const [deleted] = store.products.splice(idx, 1);
  return res.status(200).json({
    success: true,
    message: `Produto "${deleted.name}" (id: ${id}) excluído com sucesso.`
  });
});

app.get(["/products", "/api/products"], (req, res) => {
  const store = getStore();
  const { category } = req.query || {};
  let list = store.products;

  if (category && category !== "Todas") {
    list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  return res.status(200).json({ success: true, total: list.length, products: list });
});

app.post(["/products", "/api/products"], (req, res) => {
  const store = getStore();
  const { name, price, category, description, stock } = req.body || {};

  if (!name || price === undefined) {
    return res.status(400).json({ success: false, error: "Campos obrigatórios: name e price." });
  }

  const newProduct = {
    id: req.body.id || `prod-${Date.now()}`,
    name,
    price: Number(price),
    category: category || "Diversos",
    description: description || "Produto cadastrado via API de testes.",
    stock: stock !== undefined ? Number(stock) : 10,
    rating: 5.0,
    createdAt: new Date().toISOString()
  };

  store.products.push(newProduct);
  return res.status(201).json({
    success: true,
    message: "Produto criado com sucesso no catálogo.",
    product: newProduct
  });
});

// ── 5. Carrinho de Compras ───────────────────────────────────
app.get(["/cart", "/api/cart"], (req, res) => {
  const store = getStore();
  return res.status(200).json({
    success: true,
    items: store.cart,
    total: calcCartTotal(store.cart),
    count: store.cart.reduce((acc, i) => acc + i.quantity, 0)
  });
});

app.post(["/cart", "/api/cart"], (req, res) => {
  const store = getStore();
  const { productId, quantity = 1 } = req.body || {};

  if (!productId) {
    return res.status(400).json({ success: false, error: "Campo obrigatório: productId." });
  }

  const product = store.products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, error: `Produto "${productId}" não encontrado no catálogo.` });
  }

  const qty = Math.max(1, Number(quantity) || 1);
  const existingIndex = store.cart.findIndex((i) => i.productId === productId);

  if (existingIndex > -1) {
    store.cart[existingIndex].quantity += qty;
    store.cart[existingIndex].subtotal = Number(
      (store.cart[existingIndex].quantity * store.cart[existingIndex].price).toFixed(2)
    );
  } else {
    store.cart.push({
      id: productId,
      productId,
      name: product.name,
      price: product.price,
      quantity: qty,
      subtotal: Number((product.price * qty).toFixed(2))
    });
  }

  return res.status(201).json({
    success: true,
    message: "Item adicionado ao carrinho com sucesso.",
    items: store.cart,
    total: calcCartTotal(store.cart)
  });
});

app.put(["/cart/:id", "/api/cart/:id"], (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const itemIndex = store.cart.findIndex((i) => i.id === id || i.productId === id);

  if (itemIndex === -1) {
    return res.status(404).json({ success: false, error: `Item "${id}" não encontrado no carrinho.` });
  }

  const { quantity } = req.body || {};
  const newQty = Number(quantity);

  if (isNaN(newQty) || newQty < 1) {
    const [removed] = store.cart.splice(itemIndex, 1);
    return res.status(200).json({
      success: true,
      message: `Item "${removed.name}" removido por quantidade zero.`,
      items: store.cart,
      total: calcCartTotal(store.cart)
    });
  }

  store.cart[itemIndex].quantity = newQty;
  store.cart[itemIndex].subtotal = Number((newQty * store.cart[itemIndex].price).toFixed(2));

  return res.status(200).json({
    success: true,
    message: "Quantidade atualizada com sucesso.",
    item: store.cart[itemIndex],
    items: store.cart,
    total: calcCartTotal(store.cart)
  });
});

app.delete(["/cart/:id", "/api/cart/:id"], (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const itemIndex = store.cart.findIndex((i) => i.id === id || i.productId === id);

  if (itemIndex === -1) {
    return res.status(404).json({ success: false, error: `Item "${id}" não encontrado no carrinho.` });
  }

  const [deleted] = store.cart.splice(itemIndex, 1);
  return res.status(200).json({
    success: true,
    message: `Item "${deleted.name}" removido do carrinho.`,
    items: store.cart,
    total: calcCartTotal(store.cart)
  });
});

app.delete(["/cart", "/api/cart"], (req, res) => {
  const store = getStore();
  store.cart = [];
  return res.status(200).json({
    success: true,
    message: "Carrinho limpo com sucesso.",
    items: [],
    total: 0,
    count: 0
  });
});

// ── 6. Cupons & Frete ────────────────────────────────────────
app.post(["/coupons/validate", "/api/coupons/validate"], (req, res) => {
  const { code } = req.body || {};

  if (!code || typeof code !== "string") {
    return res.status(400).json({ valid: false, error: "Código do cupom é obrigatório." });
  }

  const normalized = code.trim().toUpperCase();
  const coupon = VALID_COUPONS[normalized];

  if (!coupon) {
    return res.status(400).json({
      valid: false,
      error: `Cupom "${code}" inválido ou expirado. Tente CYPRESS10.`
    });
  }

  return res.status(200).json({
    valid: true,
    code: normalized,
    discountPercent: coupon.discountPercent,
    description: coupon.description,
    message: `Cupom ${normalized} aplicado: ${coupon.discountPercent}% de desconto.`
  });
});

app.post(["/shipping/calculate", "/api/shipping/calculate"], (req, res) => {
  const { cep } = req.body || {};

  if (!cep) {
    return res.status(400).json({ success: false, error: "O CEP é obrigatório para cálculo de frete." });
  }

  const clean = String(cep).replace(/\D/g, "");
  if (clean.length !== 8) {
    return res.status(400).json({
      success: false,
      error: "CEP inválido. Deve conter 8 dígitos numéricos (ex: 50000-000)."
    });
  }

  const formatted = `${clean.slice(0, 5)}-${clean.slice(5)}`;
  return res.status(200).json({
    success: true,
    cep: formatted,
    methods: [
      { id: "standard", name: "Padrão grátis", price: 0, deadlineDays: 5, deadline: "3 a 5 dias úteis" },
      { id: "express", name: "Expressa – Sedex", price: 15, deadlineDays: 2, deadline: "1 a 2 dias úteis" }
    ]
  });
});

// ── 7. Pedidos (Checkout) ────────────────────────────────────
app.get(["/orders/:id", "/api/orders/:id"], (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const order = store.orders.find((o) => o.id === id);

  if (!order) {
    return res.status(404).json({ success: false, error: `Pedido "${id}" não encontrado.` });
  }

  return res.status(200).json({ success: true, order });
});

app.get(["/orders", "/api/orders"], (req, res) => {
  const store = getStore();
  return res.status(200).json({ success: true, total: store.orders.length, orders: store.orders });
});

app.post(["/orders", "/api/orders"], (req, res) => {
  const store = getStore();
  const {
    items,
    shippingMethod = "Padrão grátis",
    shippingPrice = 0,
    discount = 0,
    customerName,
    customerEmail,
    address
  } = req.body || {};

  const orderItems = Array.isArray(items) && items.length > 0 ? items : store.cart;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Adicione ao menos um produto antes de finalizar o pedido."
    });
  }

  const itemsSubtotal = orderItems.reduce(
    (acc, i) => acc + (Number(i.price) || 0) * (Number(i.quantity) || 1),
    0
  );
  const finalTotal = Math.max(0, Number((itemsSubtotal + Number(shippingPrice) - Number(discount)).toFixed(2)));

  const newOrder = {
    id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
    status: "CONFIRMED",
    customerName: customerName || store.user.name,
    customerEmail: customerEmail || store.user.email,
    address: address || store.user.address,
    shippingMethod,
    shippingPrice: Number(shippingPrice),
    discount: Number(discount),
    total: finalTotal,
    items: [...orderItems]
  };

  store.orders.unshift(newOrder);
  store.cart = [];

  return res.status(201).json({
    success: true,
    message: "Pedido realizado com sucesso!",
    order: newOrder
  });
});

// ── 8. Middleware de Fallback (404) ──────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Rota de API não encontrada: [${req.method}] ${req.originalUrl}`
  });
});

// ── Inicialização do Servidor ────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 QA Lab Render Backend rodando na porta ${PORT}`);
});

export default app;
