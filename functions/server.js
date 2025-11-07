/**
 * Servidor alternativo para monitorar estoque crítico e enviar emails
 * Pode ser rodado localmente ou hospedado em Render/Railway gratuitamente
 * 
 * Usar se não quiser pagar pelo Blaze plan do Firebase
 */

const express = require("express");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(express.json());

// Tentar inicializar Firebase Admin, mas não falhar se não conseguir
let db = null;
try {
  const serviceAccount = require("./firebase-key.json");
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  db = admin.firestore();
  console.log("✅ Firebase Admin inicializado");
} catch (error) {
  console.warn("⚠️  Firebase não inicializou (arquivo firebase-key.json não encontrado)");
  console.warn("📝 Modo demo ativado - endpoints funcionam mas sem conexão Firestore");
  db = null;
}

// Configurar transporter de email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "seu-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "sua-senha-app",
  },
});

/**
 * Endpoint: GET /health
 * Verificar se o servidor está rodando
 */
app.get("/health", (req, res) => {
  res.json({ status: "✅ Servidor SAME Email funcionando" });
});

/**
 * Endpoint: POST /monitor-products
 * Monitora todos os produtos e envia emails para fornecedores
 * Pode ser chamado por um cron job a cada hora
 */
app.post("/monitor-products", async (req, res) => {
  try {
    if (!db) {
      return res.json({
        success: false,
        message: "Firebase não está configurado",
        hint: "Configure credenciais do Firebase em .env.local",
      });
    }

    console.log("Iniciando monitoramento de produtos...");

    // Buscar todos os usuários (tenants)
    const tenantsSnapshot = await db.collection("tenants").get();
    let emailsSent = 0;

    for (const tenantDoc of tenantsSnapshot.docs) {
      const uid = tenantDoc.id;

      // Buscar produtos críticos deste usuário
      const productsSnapshot = await db
        .collection("tenants")
        .doc(uid)
        .collection("products")
        .where("quantity", "<=", 5)
        .get();

      if (productsSnapshot.empty) {
        continue; // Nenhum produto crítico para este usuário
      }

      // Buscar fornecedores deste usuário
      const suppliersSnapshot = await db
        .collection("tenants")
        .doc(uid)
        .collection("suppliers")
        .where("autoEmail", "==", true)
        .get();

      // Para cada fornecedor com autoEmail ativo
      for (const supplierDoc of suppliersSnapshot.docs) {
        const supplier = supplierDoc.data();

        // Encontrar produtos críticos que este fornecedor monitora
        const criticalProducts = [];
        for (const productDoc of productsSnapshot.docs) {
          if (
            supplier.selectedProducts &&
            supplier.selectedProducts.includes(productDoc.id)
          ) {
            criticalProducts.push(productDoc.data());
          }
        }

        // Se houver produtos críticos, enviar email
        if (criticalProducts.length > 0 && supplier.email) {
          try {
            await sendCriticalStockEmail(supplier, criticalProducts);
            emailsSent++;
          } catch (error) {
            console.error(
              `Erro ao enviar email para ${supplier.email}:`,
              error
            );
          }
        }
      }
    }

    res.json({
      success: true,
      message: `✅ Monitoramento concluído. ${emailsSent} email(s) enviado(s)`,
      emailsSent,
    });
  } catch (error) {
    console.error("Erro no monitoramento:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint: POST /check-product/:uid/:productId
 * Verifica um produto específico (pode ser chamado quando o produto é atualizado)
 */
app.post("/check-product/:uid/:productId", async (req, res) => {
  try {
    if (!db) {
      return res.json({
        success: false,
        message: "Firebase não está configurado",
      });
    }

    const { uid, productId } = req.params;

    // Buscar produto
    const productDoc = await db
      .collection("tenants")
      .doc(uid)
      .collection("products")
      .doc(productId)
      .get();

    if (!productDoc.exists) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const product = productDoc.data();

    // Se não está crítico, não fazer nada
    if (product.quantity > 5) {
      return res.json({
        success: true,
        message: "Produto não está em estoque crítico",
      });
    }

    // Buscar fornecedores que monitoram este produto
    const suppliersSnapshot = await db
      .collection("tenants")
      .doc(uid)
      .collection("suppliers")
      .where("autoEmail", "==", true)
      .get();

    let emailsSent = 0;
    for (const supplierDoc of suppliersSnapshot.docs) {
      const supplier = supplierDoc.data();

      if (
        supplier.selectedProducts &&
        supplier.selectedProducts.includes(productId) &&
        supplier.email
      ) {
        await sendCriticalStockEmail(supplier, [product]);
        emailsSent++;
      }
    }

    res.json({
      success: true,
      message: `${emailsSent} email(s) enviado(s)`,
      emailsSent,
    });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint: GET /health
 * Verificar se o servidor está rodando
 */
app.get("/health", (req, res) => {
  res.json({ status: "✅ Servidor SAME Email funcionando" });
});

/**
 * Enviar email de estoque crítico
 */
async function sendCriticalStockEmail(supplier, criticalProducts) {
  const productsList = criticalProducts
    .map(
      (p) => `
    <div style="background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ef4444;">
      <p style="margin: 0 0 10px 0;"><strong>${p.name}</strong></p>
      <p style="margin: 0; color: #666; font-size: 12px;">SKU: ${p.sku || "N/A"}</p>
      <p style="margin: 5px 0 0 0; color: #ef4444; font-weight: bold;">
        Quantidade: ${p.quantity} unidade(s)
      </p>
    </div>
  `
    )
    .join("");

  const subject =
    criticalProducts.length === 1
      ? `⚠️ ALERTA: Estoque Crítico - ${criticalProducts[0].name}`
      : `⚠️ ALERTA: ${criticalProducts.length} Produto(s) em Estoque Crítico`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 8px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px 0; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ef4444; }
          .footer { text-align: center; padding-top: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
          .button { display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin-top: 15px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Alerta de Estoque Crítico</h1>
          </div>
          
          <div class="content">
            <p>Olá <strong>${supplier.name}</strong>,</p>
            
            <p>Um ou mais produtos que você monitora atingiram o nível de estoque crítico! Por favor, entre em contato conosco o quanto antes para repor o estoque.</p>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <strong style="color: #856404;">⚠️ Produtos em Crítico:</strong>
              ${productsList}
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="https://same-app.com" class="button">Abrir SAME</a>
            </p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 SAME - Sistema de Análise e Monitoramento Empresarial</p>
            <p>Este é um alerta automático enviado pela plataforma SAME.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const result = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: supplier.email,
    subject: subject,
    html: htmlContent,
  });

  console.log(`✉️ Email enviado para ${supplier.email}: ${result.messageId}`);
  return result;
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor SAME Email rodando em porta ${PORT}`);
  console.log(`📊 POST http://localhost:${PORT}/monitor-products`);
  console.log(`✅ GET http://localhost:${PORT}/health`);
});
