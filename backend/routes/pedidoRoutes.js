const express = require('express');
const router = express.Router();

const pedidoController = require('../controllers/pedidoController');
const verificarAutenticacao = require('../middlewares/verificarAutenticacao');

// Todas as rotas exigem um cliente conectado
router.use(verificarAutenticacao);

// Confirmar uma compra
router.post('/confirmar', pedidoController.confirmarPedido);

module.exports = router;