require('dotenv').config();
const express = require('express');
const fs = require('fs');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const PAG_EMAIL = process.env.PAG_EMAIL;
const PAG_TOKEN = process.env.PAG_TOKEN;
const RANK_FILE = './ranking.json';

// Funções para salvar e carregar ranking
function salvarRanking(ranking){
  fs.writeFileSync(RANK_FILE, JSON.stringify(ranking, null, 2));
}
function carregarRanking(){
  if(!fs.existsSync(RANK_FILE)) return [];
  return JSON.parse(fs.readFileSync(RANK_FILE));
}

// Criar sessão de checkout PagSeguro
app.post('/criar-sessao', async (req, res)=>{
  const { nome, email, valor, mensagem } = req.body;
  if(!valor || valor < 1) return res.status(400).json({erro:'Valor mínimo R$1'});

  const dados = new URLSearchParams();
  dados.append('email', PAG_EMAIL);
  dados.append('token', PAG_TOKEN);
  dados.append('currency', 'BRL');
  dados.append('itemId1', '1');
  dados.append('itemDescription1', 'Doação');
  dados.append('itemAmount1', valor.toFixed(2));
  dados.append('itemQuantity1', '1');
  dados.append('senderName', nome);
  dados.append('senderEmail', email);
  dados.append('shippingAddressRequired', 'false');
  dados.append('reference', JSON.stringify({nome,email,mensagem}));

  try{
    const resp = await axios.post('https://ws.pagseguro.uol.com.br/v2/checkout', dados.toString(), {
      headers:{'Content-Type':'application/x-www-form-urlencoded; charset=ISO-8859-1'}
    });
    const xml = resp.data;
    const match = xml.match(/<code>(.*?)<\/code>/);
    if(match && match[1]){
      return res.json({checkoutCode: match[1]});
    }else{
      return res.status(500).json({erro:'Não foi possível gerar checkout'});
    }
  }catch(err){
    console.error(err);
    return res.status(500).json({erro:'Erro ao conectar PagSeguro'});
  }
});

// Webhook para registrar pagamento (simulado)
app.post('/webhook', bodyParser.text({type:'*/*'}), (req,res)=>{
  const ref = JSON.parse(req.query.reference || '{"nome":"Desconhecido","email":"none","mensagem":""}');
  const ranking = carregarRanking();
  ranking.push({nome: ref.nome, email: ref.email, mensagem: ref.mensagem, valor: parseFloat(req.query.valor || 1)});
  ranking.sort((a,b)=>b.valor-a.valor);
  salvarRanking(ranking);
  return res.send('OK');
});

// Retornar ranking
app.get('/ranking', (req,res)=>{
  const ranking = carregarRanking();
  res.json(ranking.slice(0,20));
});

// Iniciar servidor
app.listen(PORT, ()=>console.log(`Servidor rodando na porta ${PORT}`));
