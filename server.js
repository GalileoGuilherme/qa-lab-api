/**
 * server.js — QA Automation Lab Backend (Express / Render)
 * ─────────────────────────────────────────────────────────────
 * Servidor Express configurado para hospedagem no Render, com:
 * - CORS habilitado para integrações e testes web
 * - Rate Limiting de 50 requisições/minuto por IP
 * - Gerenciamento de estado em memória integrado com _data.js
 * - Todas as rotas RESTful para testes de QA automatizados
 * ─────────────────────────────────────────────────────────────
 */

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { getStore } from "./_data.js";

const app = express();

// ── 1. Configuração para Proxy Reverso (Render / Cloudflare) ─
app.set("trust proxy", 1);

// ── 2. Middlewares Globais ───────────────────────────────────
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);

app.use(express.json());

// Tratamento para JSON malformado no corpo da requisição
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: "JSON inválido fornecido no corpo da requisição."
    });
  }
  next();
});

// ── 3. Rate Limiter de Proteção (50 req/min por IP) ──────────
const qaRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // Janela de 1 minuto
  max: 50, // Limite de 50 requisições por IP
  standardHeaders: true, // Retorna os cabeçalhos RateLimit-* (RFC)
  legacyHeaders: false, // Desativa cabeçalhos X-RateLimit-* obsoletos
  statusCode: 429,
  message: {
    status: 429,
    error: "Too Many Requests",
    message:
      "Aviso: Este é um ambiente de laboratório para estudos e demonstração. A infraestrutura atual não está preparada para testes de carga, stress ou picos de acesso. Por favor, não realize este tipo de teste."
  }
});

app.use(qaRateLimiter);

// ── 4. Constantes e Funções Auxiliares ───────────────────────
const VALID_COUPONS = {
  CYPRESS10: {
    discountPercent: 10,
    description: "10% de desconto especial Cypress Lab"
  },
  PLAYWRIGHT15: {
    discountPercent: 15,
    description: "15% de desconto Playwright Master"
  },
  QALAB20: {
    discountPercent: 20,
    description: "20% de desconto QA Automation Lab"
  }
};

const calcCartTotal = (items) =>
  Number(items.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2));

// ── 5. Rota de Health Check ──────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "production",
    service: "qa-lab-api",
    version: "1.0.0"
  });
});

// ── 6. Rotas de Autenticação (/auth) ─────────────────────────
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "E-mail e senha são obrigatórios."
    });
  }

  const isValidUser =
    email.toLowerCase().trim() === "qa@exemplo.com" &&
    (password === "123456" || password === "LabQA!Run-7kV2pX9m");

  if (!isValidUser) {
    return res.status(401).json({
      success: false,
      error: "Credenciais inválidas. Utilize qa@exemplo.com e 123456."
    });
  }

  const tokenPayload = {
    sub: "user-qa-01",
    email: "qa@exemplo.com",
    role: "QA Engineer"
  };
  const token = `mock-jwt-token.${Buffer.from(JSON.stringify(tokenPayload)).toString("base64")}.${Date.now()}`;

  return res.status(200).json({
    success: true,
    message: "Autenticação realizada com sucesso.",
    token,
    user: {
      id: "user-qa-01",
      email: "qa@exemplo.com",
      name: "Galileo Guilherme (QA Demo)",
      role: "QA Engineer"
    }
  });
});

app.post("/auth/register", (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: "Campos obrigatórios: name, email e password."
    });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    role: "Tester / Student",
    createdAt: new Date().toISOString()
  };

  return res.status(201).json({
    success: true,
    message: "Usuário registrado com sucesso.",
    user: newUser
  });
});

app.post("/auth/logout", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Sessão invalidada com sucesso. Token revogado."
  });
});

// ── 7. Rotas de Usuários (/users) ────────────────────────────
app.get("/users/me", (req, res) => {
  const store = getStore();
  return res.status(200).json({
    success: true,
    user: store.user
  });
});

app.put("/users/me", (req, res) => {
  const store = getStore();
  const updates = req.body || {};

  store.user = {
    ...store.user,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  return res.status(200).json({
    success: true,
    message: "Perfil de usuário atualizado com sucesso.",
    user: store.user
  });
});

app.get("/users", (req, res) => {
  const store = getStore();
  const usersList = [
    store.user,
    {
      id: "usr-02",
      name: "Maria QA",
      email: "maria.qa@exemplo.com",
      role: "QA Analyst",
      status: "active"
    },
    {
      id: "usr-03",
      name: "João Tester",
      email: "joao.tester@exemplo.com",
      role: "Automation Engineer",
      status: "active"
    }
  ];

  return res.status(200).json({
    success: true,
    total: usersList.length,
    users: usersList
  });
});

app.post("/users", (req, res) => {
  const { name, email, role } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: "Campos obrigatórios: name e email."
    });
  }

  const createdUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    role: role || "QA Tester",
    createdAt: new Date().toISOString()
  };

  return res.status(201).json({
    success: true,
    message: "Usuário cadastrado com sucesso.",
    user: createdUser
  });
});

// ── 8. Rotas de Produtos (/products) ─────────────────────────
// Rota de busca por texto (declarada ANTES de /products/:id para evitar conflito)
app.get("/products/search", (req, res) => {
  const store = getStore();
  const query = (req.query?.q || "").trim().toLowerCase();

  const results = query
    ? store.products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      )
    : store.products;

  return res.status(200).json({
    success: true,
    query,
    total: results.length,
    products: results
  });
});

app.get("/products/:id", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const product = store.products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: `Produto "${id}" não encontrado no catálogo.`
    });
  }

  return res.status(200).json({
    success: true,
    product
  });
});

app.put("/products/:id", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const index = store.products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: `Produto "${id}" não encontrado para atualização.`
    });
  }

  const updates = req.body || {};
  store.products[index] = {
    ...store.products[index],
    ...updates,
    id, // Preserva o ID original
    updatedAt: new Date().toISOString()
  };

  return res.status(200).json({
    success: true,
    message: `Produto "${store.products[index].name}" atualizado com sucesso.`,
    product: store.products[index]
  });
});

app.delete("/products/:id", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const index = store.products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: `Produto "${id}" não encontrado para exclusão.`
    });
  }

  const [removed] = store.products.splice(index, 1);
  return res.status(200).json({
    success: true,
    message: `Produto "${removed.name}" (id: ${id}) excluído com sucesso.`
  });
});

app.get("/products", (req, res) => {
  const store = getStore();
  const { category } = req.query || {};
  let list = store.products;

  if (category && category !== "Todas") {
    list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  return res.status(200).json({
    success: true,
    total: list.length,
    products: list
  });
});

app.post("/products", (req, res) => {
  const store = getStore();
  const { name, price, category, description, stock } = req.body || {};

  if (!name || price === undefined) {
    return res.status(400).json({
      success: false,
      error: "Campos obrigatórios: name e price."
    });
  }

  const newProduct = {
    id: req.body.id || `prod-${Date.now()}`,
    name,
    price: Number(price),
    category: category || "Diversos",
    description: description || "Produto cadastrado no laboratório QA.",
    stock: stock !== undefined ? Number(stock) : 10,
    rating: 5.0,
    createdAt: new Date().toISOString()
  };

  store.products.push(newProduct);

  return res.status(201).json({
    success: true,
    message: "Produto adicionado com sucesso ao catálogo.",
    product: newProduct
  });
});

// ── 9. Rotas do Carrinho de Compras (/cart) ───────────────────
app.get("/cart", (req, res) => {
  const store = getStore();
  return res.status(200).json({
    success: true,
    items: store.cart,
    total: calcCartTotal(store.cart),
    count: store.cart.reduce((acc, item) => acc + item.quantity, 0)
  });
});

app.post("/cart", (req, res) => {
  const store = getStore();
  const { productId, quantity = 1 } = req.body || {};

  if (!productId) {
    return res.status(400).json({
      success: false,
      error: "Campo obrigatório: productId."
    });
  }

  const product = store.products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      error: `Produto "${productId}" não encontrado no catálogo.`
    });
  }

  const qty = Math.max(1, Number(quantity) || 1);
  const existingIndex = store.cart.findIndex((item) => item.productId === productId);

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

app.put("/cart/:id", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const itemIndex = store.cart.findIndex((item) => item.id === id || item.productId === id);

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      error: `Item "${id}" não encontrado no carrinho.`
    });
  }

  const { quantity } = req.body || {};
  const newQty = Number(quantity);

  if (isNaN(newQty) || newQty < 1) {
    const [removed] = store.cart.splice(itemIndex, 1);
    return res.status(200).json({
      success: true,
      message: `Item "${removed.name}" removido por quantidade zero ou inválida.`,
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

app.delete("/cart/:id", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const itemIndex = store.cart.findIndex((item) => item.id === id || item.productId === id);

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      error: `Item "${id}" não encontrado no carrinho.`
    });
  }

  const [removed] = store.cart.splice(itemIndex, 1);
  return res.status(200).json({
    success: true,
    message: `Item "${removed.name}" removido do carrinho.`,
    items: store.cart,
    total: calcCartTotal(store.cart)
  });
});

app.delete("/cart", (req, res) => {
  const store = getStore();
  store.cart = [];
  return res.status(200).json({
    success: true,
    message: "Carrinho esvaziado com sucesso.",
    items: [],
    total: 0,
    count: 0
  });
});

// ── 10. Validação de Cupons (/coupons/validate) ───────────────
app.post("/coupons/validate", (req, res) => {
  const { code } = req.body || {};

  if (!code || typeof code !== "string") {
    return res.status(400).json({
      valid: false,
      error: "O campo 'code' é obrigatório."
    });
  }

  const normalizedCode = code.trim().toUpperCase();
  const coupon = VALID_COUPONS[normalizedCode];

  if (!coupon) {
    return res.status(400).json({
      valid: false,
      error: `Cupom "${code}" inválido ou expirado. Cupons válidos: CYPRESS10, PLAYWRIGHT15, QALAB20.`
    });
  }

  return res.status(200).json({
    valid: true,
    code: normalizedCode,
    discountPercent: coupon.discountPercent,
    description: coupon.description,
    message: `Cupom ${normalizedCode} aplicado: ${coupon.discountPercent}% de desconto.`
  });
});

// ── 11. Cálculo de Frete (/shipping/calculate) ────────────────
app.post("/shipping/calculate", (req, res) => {
  const { cep } = req.body || {};

  if (!cep) {
    return res.status(400).json({
      success: false,
      error: "O CEP é obrigatório para cálculo de frete."
    });
  }

  const cleanCep = String(cep).replace(/\D/g, "");
  if (cleanCep.length !== 8) {
    return res.status(400).json({
      success: false,
      error: "CEP inválido. Deve conter 8 dígitos numéricos (ex: 50000-000)."
    });
  }

  const formattedCep = `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;
  return res.status(200).json({
    success: true,
    cep: formattedCep,
    methods: [
      {
        id: "standard",
        name: "Padrão grátis",
        price: 0,
        deadlineDays: 5,
        deadline: "3 a 5 dias úteis"
      },
      {
        id: "express",
        name: "Expressa – Sedex",
        price: 15,
        deadlineDays: 2,
        deadline: "1 a 2 dias úteis"
      }
    ]
  });
});

// ── 12. Rotas de Pedidos (/orders) ───────────────────────────
app.get("/orders/:id", (req, res) => {
  const store = getStore();
  const { id } = req.params;
  const order = store.orders.find((o) => o.id === id);

  if (!order) {
    return res.status(404).json({
      success: false,
      error: `Pedido "${id}" não encontrado.`
    });
  }

  return res.status(200).json({
    success: true,
    order
  });
});

app.get("/orders", (req, res) => {
  const store = getStore();
  return res.status(200).json({
    success: true,
    total: store.orders.length,
    orders: store.orders
  });
});

app.post("/orders", (req, res) => {
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
      error: "Adicione ao menos um item antes de finalizar o pedido."
    });
  }

  const itemsSubtotal = orderItems.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );
  const finalTotal = Math.max(
    0,
    Number((itemsSubtotal + Number(shippingPrice) - Number(discount)).toFixed(2))
  );

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
  store.cart = []; // Esvazia o carrinho após fechar pedido

  return res.status(201).json({
    success: true,
    message: "Pedido realizado com sucesso!",
    order: newOrder
  });
});

// ── 13. Rota de Fallback (404) ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Rota não encontrada: [${req.method}] ${req.originalUrl}`
  });
});

// ── 14. Tratamento de Erros Internos (500) ───────────────────
app.use((err, req, res, next) => {
  console.error("Erro interno do servidor:", err);
  res.status(500).json({
    success: false,
    error: "Erro interno no servidor do laboratório QA."
  });
});

// ── 15. Inicialização do Servidor ────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor QA Lab em execução na porta ${PORT}`);
});
