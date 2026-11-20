
const multer = require('multer');
const path = require('path');

// CONFIGURA ONDE AS IMAGENS SERÃO SALVAS
const armazenamento = multer.diskStorage({

    destination: function (req, file, callback) {
        callback(null, path.join(__dirname, '../../imagens/produto'));
    },

    filename: function (req, file, callback) {
        const nomeArquivo = `${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;

        callback(null, nomeArquivo);
    }

});

// ACEITA SOMENTE IMAGENS PNG
function verificarImagem(req, file, callback) {

    if (file.mimetype !== 'image/png') {
        return callback(new Error('Envie somente imagens no formato PNG.'));
    }

    callback(null, true);
}

// CRIA A CONFIGURAÇÃO DO MULTER
const uploadProduto = multer({
    storage: armazenamento,
    fileFilter: verificarImagem,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = uploadProduto;
