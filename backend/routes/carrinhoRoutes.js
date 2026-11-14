const express = require('express');
const router = express.Router();

const carrinhoController = require('../controllers/carrinhoController');
const verificarAutenticacao = require('../middlewares/verificarAutenticacao');

// Todas as rotas deste arquivo exigem um cliente conectado
router.use(verificarAutenticacao);

// Buscar o carrinho do cliente
router.get('/', carrinhoController.buscarCarrinho);
// Adicionar produto ao carrinho
router.post('/itens', carrinhoController.adicionarItem);
// Atualizar quantidade de um produto
router.put('/itens/:idProduto', carrinhoController.atualizarQuantidade);
// Remover um produto do carrinho
router.delete('/itens/:idProduto', carrinhoController.removerItem);

module.exports = router;