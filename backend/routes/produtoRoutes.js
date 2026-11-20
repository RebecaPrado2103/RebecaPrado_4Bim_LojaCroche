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

// ALTERAR UM PRODUTO
router.put(
    '/gerenciar/alterar/:id',
    verificarFuncionario,
    verificarPermissao('produtos_editar'),
    uploadProduto.single('imagem'),
    produtoController.alterarProduto
);

// ADMIN: REATIVAR
router.patch(
    '/gerenciar/reativar/:id',
    verificarFuncionario,
    verificarPermissao('produtos_desativar'),
    produtoController.reativarProduto
);

// Rota para listar os produtos
router.get('/listar', produtoController.listarProdutos);
// Rota para listar os produtos em destaque
router.get('/destaques', produtoController.listarDestaques);
// Rota para buscar um produto específico pelo ID
router.get('/:id', produtoController.buscarProdutoPorId);

// DESATIVAR UM PRODUTO
router.patch(
    '/gerenciar/desativar/:id',
    verificarFuncionario,
    verificarPermissao('produtos_desativar'),
    produtoController.desativarProduto
);

module.exports = router;