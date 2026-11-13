const express = require('express');
const router = express.Router();

const cadastroController = require('../controllers/cadastroController');

// Rota para cadastrar um novo cliente
router.post('/', cadastroController.cadastrarCliente);

module.exports = router;