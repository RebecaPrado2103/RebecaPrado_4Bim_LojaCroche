const express = require('express');
const router = express.Router();

const produtoController = require('../controllers/produtoController');

const verificarFuncionario = require('../middlewares/verificarFuncionario');
const verificarPermissao = require('../middlewares/verificarPermissao');
const uploadProduto = require('../middlewares/uploadProduto');

// ROTA ADMINISTRATIVA: LISTAR TODOS OS PRODUTOS
router.get(
    '/gerenciar/listar',
    verificarFuncionario,
    verificarPermissao('produtos_visualizar'),
    produtoController.listarTodosProdutos
);

// ROTA ADMINISTRATIVA: CADASTRAR PRODUTO
router.post(
    '/gerenciar/cadastrar',
    verificarFuncionario,
    verificarPermissao('produtos_cadastrar'),
    uploadProduto.single('imagem'),
    produtoController.cadastrarProduto
);

// Rota para listar os produtos
router.get('/listar', produtoController.listarProdutos);
// Rota para listar os produtos em destaque
router.get('/destaques', produtoController.listarDestaques);
// Rota para buscar um produto específico pelo ID
router.get('/:id', produtoController.buscarProdutoPorId);

module.exports = router;