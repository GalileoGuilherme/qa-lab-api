const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS permissivo para chamadas locais e do Render
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Health check do Render
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
  console.log(`Servidor rodando na porta ${PORT}`);
});
