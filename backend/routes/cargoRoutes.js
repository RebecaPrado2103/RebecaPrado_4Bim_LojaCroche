const express = require('express');
const router = express.Router();

const cargoController = require('../controllers/cargoController');

const verificarFuncionario = require('../middlewares/verificarFuncionario');
const verificarPermissao = require('../middlewares/verificarPermissao');

// LISTAR TODOS OS CARGOS
router.get(
    '/gerenciar/listar',
    verificarFuncionario,
    verificarPermissao('cargos_visualizar'),
    cargoController.listarCargos
);

// CADASTRAR NOVO CARGO
router.post(
    '/gerenciar/cadastrar',
    verificarFuncionario,
    verificarPermissao('cargos_cadastrar'),
    cargoController.cadastrarCargo
);

 // EDITAR NOME DE UM CARGO
router.put(
    '/gerenciar/:id',
    verificarFuncionario,
    verificarPermissao('cargos_editar'),
    cargoController.editarCargo
);

// DESATIVAR UM CARGO
router.patch(
    '/gerenciar/:id/desativar',
    verificarFuncionario,
    verificarPermissao('cargos_desativar'),
    cargoController.desativarCargo
);

// REATIVAR UM CARGO
router.patch(
    '/gerenciar/:id/reativar',
    verificarFuncionario,
    verificarPermissao('cargos_reativar'),
    cargoController.reativarCargo
);

// LISTAR PERMISSÕES DE UM CARGO
router.get(
    '/gerenciar/:id/permissoes',
    verificarFuncionario,
    verificarPermissao('cargos_visualizar'),
    cargoController.listarPermissoesCargo
);

// ATUALIZAR PERMISSÕES DE UM CARGO
router.put(
    '/gerenciar/:id/permissoes',
    verificarFuncionario,
    verificarPermissao('cargos_permissoes_editar'),
    cargoController.atualizarPermissoesCargo
);

module.exports = router;
