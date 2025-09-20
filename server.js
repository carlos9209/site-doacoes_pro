const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Ranking
const rankingFile = 'ranking.json';

// Rota para receber doação
app.post('/doar', async (req, res) => {
    const { nome, email, valor } = req.body;

    if (!nome || !email || !valor || valor < 1) {
        return res.status(400).json({ message: 'Dados inválidos' });
    }

    try {
        // Montar os dados da requisição para PagSeguro
        const params = new URLSearchParams();
        params.append('email', process.env.PAG_EMAIL);
        params.append('token', process.env.PAG_TOKEN);
        params.append('currency', 'BRL');
        params.append('itemId1', '1');
        params.append('itemDescription1', `Doação de ${nome}`);
        params.append('itemAmount1', Number(valor).toFixed(2));
        params.append('itemQuantity1', '1');
        params.append('senderName', nome);
        params.append('senderEmail', email);
        params.append('paymentMode', 'default');
        params.append('paymentMethod', 'boleto'); // ou 'creditCard'
        params.append('redirectURL', 'https://seu-site-doacoes.onrender.com/');

        // Chamada real ao PagSeguro
        const response = await axios.post('https://ws.pagseguro.uol.com.br/v2/checkout', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
        });

        // Extrair link de pagamento do XML retornado
        const xml = response.data;
        const match = xml.match(/<checkout><code>(.*?)<\/code>/);
        const code = match ? match[1] : null;
        const url = code ? `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=${code}` : null;

        // Salvar no ranking
        const ranking = fs.existsSync(rankingFile) ? JSON.parse(fs.readFileSync(rankingFile)) : [];
        ranking.push({ nome, valor });
        ranking.sort((a,b)=>b.valor - a.valor);
        fs.writeFileSync(rankingFile, JSON.stringify(ranking, null, 2));

        res.json({ message: 'Clique no link abaixo para pagar:', url });
    } catch(err){
        console.error(err.response?.data || err.message);
        res.status(500).json({ message: 'Erro ao gerar pagamento' });
    }
});

// Ranking
app.get('/ranking', (req,res)=>{
    const ranking = fs.existsSync(rankingFile) ? JSON.parse(fs.readFileSync(rankingFile)) : [];
    res.json(ranking);
});

app.listen(PORT, ()=>console.log(`Servidor rodando na porta ${PORT}`));
