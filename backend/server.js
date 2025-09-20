const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json());

// seus dados do PagSeguro (⚠️ visíveis no código)
const PAG_EMAIL = 'carlossquena44@gmail.com';
const PAG_TOKEN = 'efab15ac-889c-4965-b3fb-362b0c2e151a648a96934a4c95e54c5415d99721fde7c587-bc38-4006-a684-74b3ab35e4ce';

app.post('/create-checkout-session', async (req, res) => {
  const {amountBRL} = req.body;
  // Aqui normalmente você chamaria a API do PagSeguro para criar um pagamento.
  // Para teste, vamos redirecionar para o sandbox do PagSeguro:
  res.json({url: 'https://sandbox.pagseguro.uol.com.br'});
});

const PORT = 3000;
app.listen(PORT, () => console.log('Servidor rodando em http://localhost:' + PORT));
