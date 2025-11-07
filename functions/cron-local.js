#!/usr/bin/env node

/**
 * Script para monitorar produtos localmente a cada hora
 * Use com: node cron-local.js
 */

const cron = require("node-cron");
const axios = require("axios");
require("dotenv").config();

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";

console.log("⏰ Iniciando agendador de tarefas...");
console.log(`📍 Servidor: ${SERVER_URL}`);

// Executar a cada 1 hora
cron.schedule("0 * * * *", async () => {
  console.log(`[${new Date().toLocaleString()}] 🔍 Verificando produtos...`);

  try {
    const response = await axios.post(`${SERVER_URL}/monitor-products`);
    console.log(`✅ ${response.data.message}`);
  } catch (error) {
    console.error(`❌ Erro:`, error.message);
  }
});

console.log("✅ Agendador rodando. O monitoramento ocorrerá a cada hora.");
console.log("Pressione Ctrl+C para parar.");

// Manter processo rodando
process.stdin.resume();
