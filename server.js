const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração para proxies reversos (Render / Vercel)
app.set('trust proxy', 1);

app.use(express.json());

// CORS permissivo para chamadas locais e do Render
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ── Rate Limiter Global ──────────────────────────────────────────
// Máximo de 50 requisições por janela de 1 minuto por IP
const qaRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 50, // Máximo de 50 requisições por IP na janela
  standardHeaders: true, // Inclui headers padrão RateLimit-* (Draft RFC 6585)
  legacyHeaders: false, // Desabilita headers legados X-RateLimit-*
  statusCode: 429,
  message: {
    status: 429,
    error: "Too Many Requests",
    message: "⚠️ Limite de requisições do laboratório de QA atingido (máximo de 50 req/min por IP). Por favor, aguarde 1 minuto antes de enviar novos testes."
  }
});

// Aplica o Rate Limiting a todas as rotas da API
app.use(qaRateLimiter);

// Health check do Render (não consome cota pesada)
app.get('/health', (req, res) => {
  res.json({ status: "ok", service: "qa-lab-api", timestamp: new Date().toISOString() });
});

// Mock de Usuários
const mockUsers = [
  { id: 1, name: "Galileo Guilherme", email: "qa@exemplo.com", role: "QA Lead", status: "active" },
  { id: 2, name: "Maria QA", email: "maria.qa@exemplo.com", role: "QA Analyst", status: "active" },
  { id: 3, name: "João Tester", email: "joao.tester@exemplo.com", role: "Automation Engineer", status: "inactive" }
];

// Rota POST /auth/login (e /api/auth/login)
const handleLogin = (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({
      error: "Bad Request",
      message: "E-mail e senha são obrigatórios."
    });
  }

  return res.status(200).json({
    success: true,
    token: "mock-jwt-token-render-backend-12345",
    user: {
      id: 1,
      name: "Galileo Guilherme",
      email: email,
      role: "QA Lead"
    },
    expiresIn: 3600
  });
};

app.post('/auth/login', handleLogin);
app.post('/api/auth/login', handleLogin);

// Rota GET /users (e /api/users)
const handleUsers = (req, res) => {
  res.status(200).json({
    total: mockUsers.length,
    users: mockUsers
  });
};

app.get('/users', handleUsers);
app.get('/api/users', handleUsers);

// Rotas legadas simuladas
app.get('/api-docs/status', (req, res) => {
  res.json({ status: "ok", message: "API do laboratório online!" });
});

app.get('/automation/users', (req, res) => {
  res.json(mockUsers);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT} com Rate Limit ativo (50 req/min)`);
});
