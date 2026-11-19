const express = require('express');
const router = express.Router();

const loginController = require('../controllers/loginController');

// Rota para realizar login
router.post('/', loginController.entrar);

// Selecionar o tipo de acesso
router.post('/acesso', loginController.selecionarAcesso);

// Verificar sessão
router.get('/sessao', loginController.verificarSessao);

// Encerrar sessão
router.post('/sair', loginController.sair);

module.exports = router;