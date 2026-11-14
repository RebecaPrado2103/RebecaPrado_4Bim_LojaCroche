const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);

// Importa a função de consulta do banco
const { query, pool } = require('./database');

// Importa as rotas
const produtoRoutes = require('./routes/produtoRoutes');
const cadastroRoutes = require('./routes/cadastroRoutes');
const loginRoutes = require('./routes/loginRoutes');
const carrinhoRoutes = require('./routes/carrinhoRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');

const app = express();

// Configurações do servidor
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true
}));
app.use(express.json());

// Configuração das sessões dos usuários
app.use(session({
    store: new PgSession({
        pool: pool,
        tableName: 'sessoes',
        createTableIfMissing: true
    }),

    secret: process.env.SESSION_SECRET,

    resave: false,
    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 2
    }
}));

// Servir imagens estáticas
app.use('/imagens', express.static(path.join(__dirname, '../imagens')));
// Servir os arquivos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Definir rotas
app.use('/api/produtos', produtoRoutes);
app.use('/api/cadastro', cadastroRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/carrinho', carrinhoRoutes);
app.use('/api/pedidos', pedidoRoutes);

// Rota inicial de teste
app.get('/', (req, res) => {
    res.send('Servidor da Loja de Crochê funcionando!');
});

// Porta do servidor
const PORT = process.env.PORT || 3001;

// Inicializa o servidor e testa o PostgreSQL
app.listen(PORT, async () => {
    console.log('\n=================================');
    console.log(`🚀 Servidor executando na porta ${PORT}`);

    try {
        await query('SELECT 1');
        console.log('✅ Banco de Dados conectado com sucesso!');
    } catch (error) {
        console.error('❌ FALHA NA CONEXÃO COM O BANCO DE DADOS:');
        console.error(`   Motivo: ${error.message}`);
        console.error('👉 Confira as configurações do arquivo .env.');
    }

    console.log('=================================\n');
});