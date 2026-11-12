const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Importa a função de consulta do banco
const { query } = require('./database');

// Importa as rotas
const produtoRoutes = require('./routes/produtoRoutes');

const app = express();

// Configurações do servidor
app.use(cors());
app.use(express.json());

// Servir imagens estáticas
app.use('/imagens', express.static(path.join(__dirname, '../imagens')));
// Servir os arquivos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Definir rotas
app.use('/api/produtos', produtoRoutes);

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