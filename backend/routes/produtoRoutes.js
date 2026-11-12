const express = require('express');
const router = express.Router();

const produtoController = require('../controllers/produtoController');

// Rota para listar os produtos
router.get('/listar', produtoController.listarProdutos);
// Rota para listar os produtos em destaque
router.get('/destaques', produtoController.listarDestaques);
// Rota para buscar um produto específico pelo ID
router.get('/:id', produtoController.buscarProdutoPorId);

module.exports = router;