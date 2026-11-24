const express = require('express');
const router = express.Router();

const devolucaoController = require('../controllers/devolucaoController');

const verificarFuncionario = require('../middlewares/verificarFuncionario');
const verificarPermissao = require('../middlewares/verificarPermissao');

// LISTAR PEDIDOS DISPONÍVEIS PARA DEVOLUÇÃO
router.get(
    '/pedidos-disponiveis',
    verificarFuncionario,
    verificarPermissao('devolucoes_visualizar'),
    devolucaoController.listarPedidosDisponiveis
);

// CONSULTAR PRODUTOS DE UM PEDIDO
router.get(
    '/pedido/:id',
    verificarFuncionario,
    verificarPermissao('devolucoes_visualizar'),
    devolucaoController.listarItensPedido
);

 // REGISTRAR UMA DEVOLUÇÃO
router.post(
    '/',
    verificarFuncionario,
    verificarPermissao('devolucoes_atualizar'),
    devolucaoController.registrarDevolucao
);

// CONSULTAR HISTÓRICO DE DEVOLUÇÕES
router.get(
    '/historico',
    verificarFuncionario,
    verificarPermissao('devolucoes_visualizar'),
    devolucaoController.listarHistoricoDevolucoes
);

module.exports = router;
