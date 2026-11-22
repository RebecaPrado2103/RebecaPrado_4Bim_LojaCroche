const express = require('express');
const router = express.Router();

const formaPagamentoController = require('../controllers/formaPagamentoController');

const verificarFuncionario = require('../middlewares/verificarFuncionario');
const verificarPermissao = require('../middlewares/verificarPermissao');

// LISTAR TODAS AS FORMAS DE PAGAMENTO
router.get(
    '/gerenciar/listar',
    verificarFuncionario,
    verificarPermissao('formas_pagamento_visualizar'),
    formaPagamentoController.listarFormasPagamento
);

// CADASTRAR UMA FORMA DE PAGAMENTO
router.post(
    '/gerenciar/cadastrar',
    verificarFuncionario,
    verificarPermissao('formas_pagamento_cadastrar'),
    formaPagamentoController.cadastrarFormaPagamento
);

// ALTERAR UMA FORMA DE PAGAMENTO
router.put(
    '/gerenciar/:id',
    verificarFuncionario,
    verificarPermissao('formas_pagamento_editar'),
    formaPagamentoController.alterarFormaPagamento
);

// DESATIVAR UMA FORMA DE PAGAMENTO
router.patch(
    '/gerenciar/:id/desativar',
    verificarFuncionario,
    verificarPermissao('formas_pagamento_desativar'),
    formaPagamentoController.desativarFormaPagamento
);

// REATIVAR UMA FORMA DE PAGAMENTO
router.patch(
    '/gerenciar/:id/reativar',
    verificarFuncionario,
    verificarPermissao('formas_pagamento_editar'),
    formaPagamentoController.reativarFormaPagamento
);

// LISTAR FORMAS ATIVAS PARA O CHECKOUT DO CLIENTE
router.get(
    '/cliente/ativas',
    formaPagamentoController.listarFormasAtivas
);

module.exports = router;
