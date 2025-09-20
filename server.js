const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const PAG_EMAIL = process.env.PAG_EMAIL; // coloque no Render
const PAG_TOKEN = process.env.PAG_TOKEN; // coloque no Render

// rota para criar checkout PagSeguro
app.post("/doar", async (req, res) => {
  const { nome, email, valor } = req.body;
  if (!valor || valor < 1) return res.status(400).json({ error: "Valor mínimo R$1" });

  // aqui você faria a requisição para API do PagSeguro
  // exemplo: axios.post('https://api.pagseguro.com/checkout', { ... })

  // simulação: grava no ranking.json e responde link fictício
  let ranking = [];
  try {
    ranking = JSON.parse(await fs.readFile("ranking.json", "utf8"));
  } catch (e) {}

  ranking.push({ nome, email, valor, data: new Date().toISOString() });
  ranking.sort((a, b) => b.valor - a.valor);
  await fs.writeFile("ranking.json", JSON.stringify(ranking, null, 2));

  res.json({
    message: "Doação registrada (simulação).",
    url: "https://pagseguro.uol.com.br/checkout?valor=" + valor // link fictício
  });
});

// rota para ranking
app.get("/ranking", async (req, res) => {
  try {
    const ranking = JSON.parse(await fs.readFile("ranking.json", "utf8"));
    res.json(ranking);
  } catch (e) {
    res.json([]);
  }
});

// servir index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));
