# 🔑 Como Obter Credenciais do Firebase

## Passo 1: Ir para o Console Firebase

Acesse: https://console.firebase.google.com/project/same-40d0e/settings/serviceaccounts/adminsdk

## Passo 2: Gerar Chave Privada

1. Clique em **"Gerar nova chave privada"**
2. Um JSON será baixado automaticamente
3. Copie TODO o conteúdo do JSON

## Passo 3: Criar arquivo firebase-key.json

Na pasta `functions/`, crie um arquivo chamado `firebase-key.json` e cole o conteúdo JSON.

Seu diretório deve ficar assim:
```
functions/
├── server.js
├── cron-local.js
├── package.json
├── .env.local              ← Credenciais de email
├── firebase-key.json       ← Credenciais do Firebase (NÃO COMMITAR!)
└── .gitignore
```

## ⚠️ IMPORTANTE: Segurança

- **NUNCA** faça commit do `firebase-key.json`
- Verifique se `.gitignore` contém `firebase-key.json` (já está lá)
- Não compartilhe essa chave com ninguém

## Como seu .gitignore já protege:

```
*.json      ← Bloqueia todos os JSONs (incluindo firebase-key.json)
.env.local  ← Bloqueia suas credenciais de email
```

---

## Próximos Passos:

1. Acesse: https://console.firebase.google.com/project/same-40d0e/settings/serviceaccounts/adminsdk
2. Clique "Gerar nova chave privada"
3. Copie o JSON para `functions/firebase-key.json`
4. Reinicie o servidor: `node server.js`
5. Teste: `node test.js`
