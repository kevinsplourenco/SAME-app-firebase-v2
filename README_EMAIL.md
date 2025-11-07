# 🚀 MESMO EMAIL - Guia Rápido

## ✅ Status Atual

Seu servidor de monitoramento **está RODANDO** em `http://localhost:3000` 🎉

```
🚀 Servidor SAME Email rodando em porta 3000
📊 POST http://localhost:3000/monitor-products
✅ GET http://localhost:3000/health
```

---

## 🎯 Próximos 5 Minutos

### 1️⃣ Configure o Email

Edite `functions/.env.local`:
```
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-app-password-do-google
```

**Como gerar App Password:**
1. https://myaccount.google.com/security (ative 2FA)
2. https://myaccount.google.com/apppasswords
3. Selecione: Mail + Windows
4. Copie a senha gerada

### 2️⃣ Teste Rápido

Terminal 1 (servidor já está rodando):
```powershell
cd C:\Users\kevin\OneDrive\Documentos\GitHub\same-project-firebase\functions
npm run server
```

Terminal 2 (agendador):
```powershell
cd C:\Users\kevin\OneDrive\Documentos\GitHub\same-project-firebase\functions
npm run cron
```

### 3️⃣ Teste com curl

Terminal 3:
```powershell
curl -X POST http://localhost:3000/monitor-products
```

Esperado: Email enviado se houver produtos críticos! ✉️

---

## 📊 Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    SAME APP (React Native)              │
│  User cria Fornecedor com autoEmail = true              │
│  User vincula produtos a monitora                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 └──→ Firestore: suppliers/{id}
                      └── selectedProducts: [...]
                      └── autoEmail: true
                      └── email: fornecedor@email.com
                      
┌─────────────────────────────────────────────────────────┐
│         SAME EMAIL SERVER (Node.js Express)             │
│  POST /monitor-products                                  │
│  └─→ Busca produtos com quantity ≤ 5                   │
│  └─→ Busca fornecedores com autoEmail = true           │
│  └─→ Encontra produtos monitorados                      │
│  └─→ Envia emails com Nodemailer                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 └──→ Gmail SMTP → Email do Fornecedor
                     
┌─────────────────────────────────────────────────────────┐
│         AGENDADOR (Node-Cron)                           │
│  Executa POST /monitor-products a cada 1 hora           │
│  Exemplo: 10:00, 11:00, 12:00, ...                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🎬 Fluxo Completo

1. **Você em SuppliersScreen:**
   - Cria Fornecedor "João"
   - Email: joao@email.com
   - Monitora produto "Açúcar"
   - Ativa "autoEmail"

2. **Você em ProductFormScreen:**
   - "Açúcar" tem 10 unidades
   - Você vende 6 unidades
   - Agora tem 4 unidades

3. **Servidor Monitora (a cada hora):**
   ```
   ✓ Encontra "Açúcar" com 4 unidades
   ✓ Encontra "João" monitorando "Açúcar"
   ✓ João tem autoEmail = true
   ✓ Envia email para joao@email.com
   ```

4. **João recebe:**
   ```
   De: seu-email@gmail.com
   Para: joao@email.com
   Assunto: ⚠️ ALERTA: Estoque Crítico - Açúcar
   
   Corpo HTML com:
   - Produto: Açúcar
   - SKU: ABC123
   - Quantidade: 4 unidades (em vermelho!)
   - Botão "Abrir SAME"
   ```

---

## 🌐 3 Opções de Deployment

| Opção | Custo | Setup | Uptime | Melhor para |
|-------|-------|-------|--------|-------------|
| **A. Local** | $0 | 5min | Enquanto PC está ligado | Desenvolvimento |
| **B. Render** | $0 | 10min | 24/7 | Produção sem custos |
| **C. Blaze** | ~$1 | 5min | 99.95% SLA | Escala com confiabilidade |

**Recomendação:** Comece com **Opção A (Local)** para testar. Depois migre para **B ou C**.

---

## 📁 Arquivos Criados

```
same-project-firebase/
├── functions/
│   ├── index.js              ← Cloud Functions (Opção C)
│   ├── server.js             ← Express Server (Opção A/B)
│   ├── cron-local.js         ← Agendador (Opção A)
│   ├── package.json          ← Dependências
│   ├── .env.local            ← Suas credenciais (NUNCA fazer commit!)
│   └── .gitignore
│
├── firebase.json             ← Config Firebase
├── firestore.rules           ← Regras Firestore
├── IMPLEMENTACAO_EMAIL.md            ← Guia Cloud Functions (pago)
└── IMPLEMENTACAO_EMAIL_ALTERNATIVA.md ← Guia Servidor (grátis)
```

---

## 🔧 Comandos Úteis

```powershell
# Iniciar servidor local
npm run server

# Iniciar agendador local (a cada hora)
npm run cron

# Deploy no Firebase (requer plano Blaze)
npm run deploy

# Ver logs
firebase functions:log

# Testar endpoint
curl -X GET http://localhost:3000/health
curl -X POST http://localhost:3000/monitor-products

# Testar produto específico
curl -X POST http://localhost:3000/check-product/USER_ID/PRODUCT_ID
```

---

## ❓ Dúvidas Comuns

**P: Email não está sendo enviado?**
R: Certifique-se de usar "App Password" (não a senha normal do Gmail)

**P: Posso testar sem ter produtos críticos?**
R: Sim, edite um produto para ter quantidade ≤ 5 e execute `curl -X POST http://localhost:3000/monitor-products`

**P: Quando os emails serão enviados?**
R: A cada 1 hora, automaticamente (se há produtos críticos)

**P: Posso mudar a frequência?**
R: Sim, em `cron-local.js` mude `"0 * * * *"` para outro padrão (crontab.guru)

---

## 📞 Suporte

- **Documentação completa**: [`IMPLEMENTACAO_EMAIL_ALTERNATIVA.md`](./IMPLEMENTACAO_EMAIL_ALTERNATIVA.md)
- **Solução Cloud Functions**: [`IMPLEMENTACAO_EMAIL.md`](./IMPLEMENTACAO_EMAIL.md)
- **Status do servidor**: `curl http://localhost:3000/health`

---

**Você está pronto! 🎉** Comece testando com a Opção A (Local) e depois considere Render para produção.
