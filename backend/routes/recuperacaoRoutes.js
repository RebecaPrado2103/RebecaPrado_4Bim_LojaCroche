const express = require('express');
const router = express.Router();

const recuperacaoController = require('../controllers/recuperacaoController');

// Solicitar código de recuperação
router.post(
    '/solicitar',
    recuperacaoController.solicitarCodigo
);

 // Redefinir senha
router.post(
    '/redefinir',
    recuperacaoController.redefinirSenha
);

module.exports = router;