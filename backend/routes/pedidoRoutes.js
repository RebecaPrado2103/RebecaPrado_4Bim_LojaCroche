
const express = require('express');
const router = express.Router();

const pedidoController = require('../controllers/pedidoController');

const verificarAutenticacao = require('../middlewares/verificarAutenticacao');
const verificarFuncionario = require('../middlewares/verificarFuncionario');
const verificarPermissao = require('../middlewares/verificarPermissao');

// Confirmar uma compra (somente clientes)
router.post(
    '/confirmar',
    verificarAutenticacao,
    pedidoController.confirmarPedido
);

 // LISTAR PEDIDOS DO CLIENTE CONECTADO
router.get(
    '/meus',
    verificarAutenticacao,
    pedidoController.listarPedidosCliente
);

// BUSCAR DETALHES DE UM PEDIDO DO CLIENTE
router.get(
    '/meus/:id/detalhes',
    verificarAutenticacao,
    pedidoController.buscarDetalhesPedidoCliente
);

// CANCELAR PEDIDO DO CLIENTE
router.post(
    '/meus/:id/cancelar',
    verificarAutenticacao,
    pedidoController.cancelarPedidoCliente
);

// CONFIRMAR PAGAMENTO DE UM PEDIDO
router.post('/:id/pagar', verificarAutenticacao, pedidoController.confirmarPagamento);

// Atualizar status do pedido (somente funcionários autorizados)
router.patch(
    '/gerenciar/:id/status',
    verificarFuncionario,
    verificarPermissao('pedidos_atualizar'),
    pedidoController.atualizarStatusPedido
);

// CANCELAR PEDIDO (SOMENTE FUNCIONÁRIOS AUTORIZADOS)
router.patch(
    '/gerenciar/:id/cancelar',
    verificarFuncionario,
    verificarPermissao('pedidos_atualizar'),
    pedidoController.cancelarPedido
);

// Listar pedidos (somente funcionários autorizados)
router.get(
    '/gerenciar/listar',
    verificarFuncionario,
    verificarPermissao('pedidos_atualizar'),
    pedidoController.listarPedidos
);

// Buscar detalhes de um pedido
router.get(
    '/gerenciar/:id',
    verificarFuncionario,
    verificarPermissao('pedidos_atualizar'),
    pedidoController.buscarDetalhesPedido
);

module.exports = router;
