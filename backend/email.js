const nodemailer = require('nodemailer');

// CONFIGURAÇÃO DO ENVIO DE E-MAIL
const transporter = nodemailer.createTransport({
    service: 'gmail',

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

module.exports = transporter;