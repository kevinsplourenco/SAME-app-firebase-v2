#!/usr/bin/env node

/**
 * Script de teste do servidor SAME Email
 * Use com: node test.js
 */

const http = require('http');

console.log('🧪 Testando servidor SAME Email...\n');

// Testar /health
console.log('1️⃣  Testando GET /health');
http.get('http://localhost:3000/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Resposta: ${data}\n`);
    
    // Testar /monitor-products
    console.log('2️⃣  Testando POST /monitor-products');
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/monitor-products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': 0
      }
    };
    
    const req = http.request(options, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log(`   Status: ${res2.statusCode}`);
        try {
          const json = JSON.parse(data2);
          console.log(`   Resposta: ${JSON.stringify(json, null, 2)}\n`);
          console.log('✅ Testes concluídos!');
        } catch(e) {
          console.log(`   Resposta: ${data2}\n`);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`❌ Erro no POST: ${e.message}`);
    });
    
    req.end();
  });
}).on('error', (e) => {
  console.error(`❌ Erro no GET /health: ${e.message}`);
  console.error('   O servidor está rodando em http://localhost:3000?');
});
