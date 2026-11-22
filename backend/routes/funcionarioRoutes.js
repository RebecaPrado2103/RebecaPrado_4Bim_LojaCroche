const express = require('express');
const router = express.Router();

const funcionarioController = require('../controllers/funcionarioController');

const verificarFuncionario = require('../middlewares/verificarFuncionario');
const verificarPermissao = require('../middlewares/verificarPermissao');

// LISTAR TODOS OS FUNCIONÁRIOS
router.get(
    '/gerenciar/listar',
    verificarFuncionario,
    verificarPermissao('funcionarios_visualizar'),
    funcionarioController.listarFuncionarios
);

// CADASTRAR FUNCIONÁRIO
router.post(
    '/gerenciar/cadastrar',
    verificarFuncionario,
    verificarPermissao('funcionarios_cadastrar'),
    funcionarioController.cadastrarFuncionario
);

// EDITAR FUNCIONÁRIO
router.put(
    '/gerenciar/:cpf',
    verificarFuncionario,
    verificarPermissao('funcionarios_editar'),
    funcionarioController.editarFuncionario
);

// DESATIVAR FUNCIONÁRIO
router.patch(
    '/gerenciar/:cpf/desativar',
    verificarFuncionario,
    verificarPermissao('funcionarios_editar'),
    funcionarioController.desativarFuncionario
);

// REATIVAR FUNCIONÁRIO
router.patch(
    '/gerenciar/:cpf/reativar',
    verificarFuncionario,
    verificarPermissao('funcionarios_editar'),
    funcionarioController.reativarFuncionario
);

// LISTAR CARGOS DISPONÍVEIS
router.get(
    '/gerenciar/cargos',
    verificarFuncionario,
    verificarPermissao('funcionarios_cadastrar'),
    funcionarioController.listarCargos
);

// VISUALIZAR DETALHES DE UM FUNCIONÁRIO
router.get(
    '/gerenciar/:cpf',
    verificarFuncionario,
    verificarPermissao('funcionarios_visualizar'),
    funcionarioController.buscarDetalhesFuncionario
);

module.exports = router;