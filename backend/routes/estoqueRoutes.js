const express = require('express');
const router = express.Router();

const estoqueController = require('../controllers/estoqueController');

const verificarFuncionario = require('../middlewares/verificarFuncionario');
const verificarPermissao = require('../middlewares/verificarPermissao');

// LISTAR HISTÓRICO DE MOVIMENTAÇÕES
router.get(
    '/movimentacoes',
    verificarFuncionario,
    verificarPermissao('estoque_visualizar'),
    estoqueController.listarMovimentacoes
);

// REGISTRAR ENTRADA DE PRODUTOS
router.post(
    '/entrada',
    verificarFuncionario,
    verificarPermissao('estoque_atualizar'),
    estoqueController.registrarEntrada
);

// REGISTRAR SAÍDA MANUAL DE PRODUTOS
router.post(
    '/saida',
    verificarFuncionario,
    verificarPermissao('estoque_atualizar'),
    estoqueController.registrarSaida
);

module.exports = router;