# 📧 Email Automático - SAME (Solução Alternativa - SEM CUSTOS)

## ✅ O que foi criado

Como seu projeto Firebase está no **plano Spark** (gratuito) que não suporta Cloud Functions, criei uma **solução alternativa** com 3 opções:

### Opção A: Servidor Local (Recomendado para Desenvolvimento)
- Roda na sua máquina
- Monitora produtos a cada hora
- Envia emails automaticamente

### Opção B: Hospedar Gratuitamente no Render
- Servidor rodando 24/7 em nuvem
- Sem custos adicionais
- Ideal para produção

### Opção C: Fazer Upgrade para Blaze (Pago)
- Cloud Functions automáticas
- Sem servidor para manter
- $0-$3/mês típico

---

## 🎯 Opção A: Rodando Localmente (Mais Fácil)

### Passo 1: Configurar Email (Gmail)

1. Ative 2FA: https://myaccount.google.com/security
2. Gere App Password: https://myaccount.google.com/apppasswords
3. Edite `functions/.env.local`:

```
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=AbCdEfGhIjKlMnOp
```

### Passo 2: Iniciar o Servidor

```powershell
cd C:\Users\kevin\OneDrive\Documentos\GitHub\same-project-firebase\functions
npm run server
```

Você deve ver:
```
🚀 Servidor SAME Email rodando em porta 3000
```

### Passo 3: Iniciar o Agendador (em outro terminal)

```powershell
cd C:\Users\kevin\OneDrive\Documentos\GitHub\same-project-firebase\functions
npm run cron
```

Você deve ver:
```
⏰ Iniciando agendador de tarefas...
✅ Agendador rodando. O monitoramento ocorrerá a cada hora.
```

### 🧪 Testar Manualmente

Abra outro terminal e execute:

```powershell
curl -X POST http://localhost:3000/monitor-products
```

Ou use Postman/Insomnia:
- **URL**: `http://localhost:3000/monitor-products`
- **Método**: POST
- **Headers**: Content-Type: application/json

Resposta esperada:
```json
{
  "success": true,
  "message": "✅ Monitoramento concluído. 2 email(s) enviado(s)",
  "emailsSent": 2
}
```

---

## 🌐 Opção B: Hospedar no Render (Sem Custos)

### Passo 1: Criar conta no Render
- Acesse: https://render.com
- Faça login com GitHub

### Passo 2: Criar variáveis de ambiente

No Render, defina:
```
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-app-password
FIREBASE_PROJECT_ID=same-40d0e
FIREBASE_PRIVATE_KEY=sua-chave-privada
FIREBASE_CLIENT_EMAIL=seu-email-firebase
```

**Para obter as credenciais do Firebase:**
1. Vá a: https://console.firebase.google.com/project/same-40d0e/settings/serviceaccounts/adminsdk
2. Clique em "Gerar chave privada"
3. Copie os valores do JSON gerado

### Passo 3: Deploy

```powershell
# Na raiz do projeto
git add .
git commit -m "Add email functions"
git push origin main

# No Render:
# 1. Clique em "+ New"
# 2. Selecione "Web Service"
# 3. Conecte seu GitHub
# 4. Selecione o repositório
# 5. Configure:
#    - Build Command: cd functions && npm install
#    - Start Command: cd functions && npm run server
# 6. Adicione as Environment Variables
# 7. Clique "Create Web Service"
```

Após deploy, você terá uma URL como:
```
https://same-email-service.onrender.com
```

### Passo 4: Agendar Cron Job

Para executar o monitoramento a cada hora no Render:
1. Acesse: https://cron-job.org/en/
2. Crie novo cron job:
   - **URL**: `https://seu-dominio.onrender.com/monitor-products`
   - **Método**: POST
   - **Frequência**: A cada hora

---

## 🔧 Opção C: Upgrade para Blaze (Cloud Functions Nativas)

Se quiser usar Cloud Functions nativas do Firebase:

1. Vá a: https://console.firebase.google.com/project/same-40d0e/usage/details
2. Clique "Fazer Upgrade para Blaze"
3. Configure seu plano de pagamento
4. Execute:

```powershell
cd C:\Users\kevin\OneDrive\Documentos\GitHub\same-project-firebase
firebase deploy --only functions
```

---

## 📊 Como Funciona

### Fluxo de Funcionamento

```
1. Você adiciona/edita um produto em SuppliersScreen
2. Você define um Fornecedor com "autoEmail" ativado
3. Você liga o Fornecedor para monitorar aquele produto

4. Quando estoque chega a ≤5:
   ↓
   Servidor verifica todos os fornecedores
   ↓
   Encontra quem monitora aquele produto com autoEmail ativo
   ↓
   Envia email formatado
```

### Exemplos de Emails Enviados

**Email Singular:**
```
De: seu-email@gmail.com
Para: fornecedor@email.com
Assunto: ⚠️ ALERTA: Estoque Crítico - Açúcar

Corpo com:
- Nome do produto
- SKU
- Quantidade (destacada em vermelho)
- Botão "Abrir SAME"
```

**Email Múltiplo (vários produtos):**
```
Assunto: ⚠️ ALERTA: 3 Produto(s) em Estoque Crítico

Lista todos com:
- Nome, SKU, Quantidade
```

---

## 🔍 Troubleshooting

### Erro: "ENOENT: no such file or directory"
Certifique-se de estar na pasta correta:
```powershell
cd C:\Users\kevin\OneDrive\Documentos\GitHub\same-project-firebase\functions
```

### Erro: "Email não está sendo enviado"

1. **Verifique as credenciais:**
   - Gmail: Use "App Password", não a senha normal
   - 2FA deve estar ativado

2. **Verifique os logs:**
   ```powershell
   # Na pasta functions
   npm run cron  # Mostra erros do agendador
   ```

3. **Teste manualmente:**
   ```powershell
   curl -X GET http://localhost:3000/health
   ```

### Erro: "Porta 3000 já está em uso"
```powershell
# Use outra porta
set PORT=3001
npm run server
```

---

## 📋 Checklist de Setup

### Opção A (Local) ✅
- [ ] Email 2FA habilitado
- [ ] App Password gerado
- [ ] `.env.local` preenchido
- [ ] `npm run server` rodando
- [ ] `npm run cron` rodando em outro terminal
- [ ] Testado com `curl -X POST http://localhost:3000/monitor-products`

### Opção B (Render) ✅
- [ ] Conta Render criada
- [ ] Repositório GitHub conectado
- [ ] Web Service criado
- [ ] Environment variables configuradas
- [ ] Cron job agendado (cron-job.org)

### Opção C (Blaze) ✅
- [ ] Plano Blaze ativado
- [ ] `firebase deploy --only functions` executado
- [ ] Funções visíveis em: https://console.firebase.google.com

---

## 📚 Próximos Passos

1. **Escolha uma opção** (Local, Render ou Blaze)
2. **Configure o email**
3. **Teste o monitoramento**
4. **Valide com seus dados reais**

---

## 💡 Dicas

- **Desenvolvimento**: Use Opção A (Local)
- **Produção Sem Custos**: Use Opção B (Render)
- **Produção Escalável**: Use Opção C (Blaze)

---

**Precisa de ajuda?** Confira os logs com:
```powershell
# Local
npm run cron

# Render
# Vá a: https://render.com/project/[projeto]/logs
```
