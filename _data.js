// In-memory mock data store for Serverless API routes

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

// In-memory runtime state
globalThis._qaStore = globalThis._qaStore || {
  registeredUsers: [
    {
      id: "user-qa-01",
      name: "Galileo Guilherme (QA Demo)",
      email: "qa@exemplo.com",
      password: "123456",
      role: "QA Engineer"
    }
  ],
  products: [...initialProducts],
  user: { ...initialUser },
  cart: [...initialCart],
  orders: [...initialOrders]
};

export const getStore = () => globalThis._qaStore;

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

