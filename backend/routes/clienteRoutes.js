
const express = require('express');
const router = express.Router();

const clienteController = require('../controllers/clienteController');

const verificarFuncionario = require('../middlewares/verificarFuncionario');
const verificarPermissao = require('../middlewares/verificarPermissao');
const cadastroController = require('../controllers/cadastroController');

// CADASTRAR CLIENTE PELA VISÃO DO GERENTE
router.post(
    '/gerenciar/cadastrar',
    verificarFuncionario,
    verificarPermissao('clientes_visualizar'),
    cadastroController.cadastrarCliente
);

// LISTAR TODOS OS CLIENTES
router.get(
    '/gerenciar/listar',
    verificarFuncionario,
    verificarPermissao('clientes_visualizar'),
    clienteController.listarClientes
);

// VISUALIZAR DETALHES DE UM CLIENTE
router.get(
    '/gerenciar/:cpf',
    verificarFuncionario,
    verificarPermissao('clientes_visualizar'),
    clienteController.buscarDetalhesCliente
);

module.exports = router;
