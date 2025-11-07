# 📧 Implementação de Email Automático - SAME

> ⚠️ **IMPORTANTE**: Este método usa **Cloud Functions**, que requer plano **Blaze** (pago). 
> 
> **Se você prefere SEM CUSTOS**, veja: [`IMPLEMENTACAO_EMAIL_ALTERNATIVA.md`](./IMPLEMENTACAO_EMAIL_ALTERNATIVA.md)

Uma **Cloud Function no Firebase** que:
1. **Monitora produtos** - Detecta quando a quantidade chega a ≤5 unidades
2. **Busca fornecedores** - Encontra fornecedores que:
   - Monitoram esse produto
   - Têm `autoEmail` ativado
3. **Envia emails** - Notifica automaticamente com HTML formatado

## 📋 Passo 1: Instalar Firebase Tools

```powershell
npm install -g firebase-tools
```

## 🔐 Passo 2: Autenticar no Firebase

```powershell
firebase login
```

## 📦 Passo 3: Instalar Dependências das Functions

```powershell
cd functions
npm install
cd ..
```

## 🔑 Passo 4: Configurar Email (Gmail)

### 4.1 Habilitar 2FA na sua conta Google
- Acesse: https://myaccount.google.com/security
- Ative "Verificação em duas etapas"

### 4.2 Gerar "App Password"
- Vá para: https://myaccount.google.com/apppasswords
- Selecione: Mail e Windows Computer
- Copie a senha gerada

### 4.3 Editar `.env.local` em `functions/`

```
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=AbCdEfGhIjKlMnOp
```

## 🚀 Passo 5: Fazer Deploy

```powershell
# Fazer deploy das functions
firebase deploy --only functions

# Ou fazer deploy de tudo (functions + firestore rules)
firebase deploy
```

## 🧪 Passo 6: Testar Localmente (Opcional)

```powershell
cd functions
npm run serve
```

Isso inicia um emulador local onde você pode testar as functions.

## 📊 Como Funciona

### Fluxo 1: Quando um Produto Atinge Estoque Crítico

```
Produto "Açúcar" tem 10 unidades
↓
Você vende 6 unidades → Resta 4
↓
Cloud Function `onProductStockCritical` é acionada
↓
Verifica: quais fornecedores monitoram "Açúcar" com autoEmail ativo?
↓
Encontra: Fornecedor "João Fornecedor" (email: joao@email.com, autoEmail: ✓)
↓
Envia email com:
   - Nome do produto
   - Quantidade atual
   - SKU
   - Link para abrir o app
```

### Fluxo 2: Quando autoEmail é Ativado para um Fornecedor

```
Fornecedor "João Fornecedor" ativa autoEmail
↓
Cloud Function `onSupplierAutoEmailEnabled` é acionada
↓
Busca: todos os produtos com quantidade ≤ 5
↓
Filtra: quais produtos João monitora?
↓
Se houver críticos: envia email compilado com todos
```

## 🎯 Checklist de Implementação

- [ ] Firebase Tools instalado
- [ ] Autenticado com `firebase login`
- [ ] 2FA habilitado na conta Google
- [ ] App Password gerado
- [ ] `functions/.env.local` preenchido
- [ ] Deploy realizado com `firebase deploy`
- [ ] Cloud Function ativa no Console Firebase

## 📧 Exemplos de Emails Enviados

### Email Single (Um Produto Crítico)
```
De: noreply@same-app.com
Para: joao@email.com
Assunto: ⚠️ ALERTA: Estoque Crítico - Açúcar

Corpo: HTML formatado com:
- Aviso em vermelho
- Nome do produto
- SKU
- Quantidade (em destaque vermelho)
- Botão "Abrir SAME"
```

### Email Multiple (Múltiplos Produtos Críticos)
```
Assunto: ⚠️ ALERTA: 3 Produto(s) em Estoque Crítico

Lista todos os produtos com:
- Nome
- SKU
- Quantidade em vermelho
```

## 🐛 Troubleshooting

### Email não está sendo enviado?

1. **Verificar logs:**
```powershell
firebase functions:log
```

2. **Comum: Gmail bloqueou a senha**
   - Use "App Password" (senha gerada pelo Google, não a senha normal)
   - Certifique-se de 2FA estar ativado

3. **Verificar se as functions foram deployadas:**
```powershell
firebase functions:list
```

### Erro: "Not authenticated"
- Certifique-se de que `requireUID()` está recebendo um usuário autenticado
- Verifique se o usuário está logado no app

## 💡 Próximas Melhorias

- [ ] Adicionar rastreamento de quando email foi enviado (campo `lastEmailSent`)
- [ ] Evitar reenviar email para o mesmo fornecedor no mesmo dia
- [ ] Suporte a Whatsapp/Telegram além de email
- [ ] Dashboard para histórico de notificações enviadas
- [ ] Webhooks para integrar com sistemas de CRM

## 📚 Referências

- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Nodemailer Docs](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

**Qualquer dúvida?** Entre em contato ou cheque os logs das functions com `firebase functions:log`
