const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rota 1 simulada
app.get('/api-docs/status', (req, res) => {
  res.json({ status: "ok", message: "API do laboratório online!" });
});

// Rota 2 simulada
app.get('/automation/users', (req, res) => {
  res.json([{ id: 1, name: "Galileo Guilherme", role: "QA Engineer" }]);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});