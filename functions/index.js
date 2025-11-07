const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configurar transporter de email (usando Gmail ou outro serviço)
// IMPORTANTE: Configure variáveis de ambiente com suas credenciais
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "seu-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "sua-senha-app", // Use App Password do Google
  },
});

/**
 * Monitora alterações em produtos
 * Quando a quantidade chega a ≤5 e há fornecedores com autoEmail ativo,
 * envia email automaticamente
 */
exports.onProductStockCritical = functions.firestore
  .document("tenants/{uid}/products/{productId}")
  .onWrite(async (change, context) => {
    const { uid, productId } = context.params;
    const newData = change.after.data();
    const oldData = change.before.data();

    // Verificar se é uma criação, atualização, ou exclusão
    if (!change.after.exists) {
      console.log(`Produto ${productId} foi deletado`);
      return;
    }

    // Verificar se a quantidade mudou e chegou ao crítico (≤5)
    const oldQuantity = oldData?.quantity ?? 999;
    const newQuantity = newData?.quantity ?? 0;

    // Se já estava crítico, não enviar novamente (para evitar spam)
    if (oldQuantity <= 5 && newQuantity <= 5) {
      console.log(
        `Produto ${productId} já estava em estoque crítico, pulando notificação`
      );
      return;
    }

    // Só enviar email se chegou ao crítico AGORA
    if (newQuantity > 5) {
      console.log(
        `Quantidade ${newQuantity} ainda não é crítica para ${productId}`
      );
      return;
    }

    console.log(
      `Produto ${productId} atingiu estoque crítico: ${newQuantity} unidades`
    );

    try {
      // Buscar fornecedores que monitoram este produto e têm autoEmail ativo
      const suppliersRef = admin
        .firestore()
        .collection("tenants")
        .doc(uid)
        .collection("suppliers");

      const suppliersSnapshot = await suppliersRef.get();
      const emailsToSend = [];

      for (const supplierDoc of suppliersSnapshot.docs) {
        const supplier = supplierDoc.data();

        // Verificar se este fornecedor monitora este produto
        const isMonitoring =
          supplier.selectedProducts &&
          supplier.selectedProducts.includes(productId);
        const hasAutoEmailEnabled = supplier.autoEmail === true;

        if (isMonitoring && hasAutoEmailEnabled && supplier.email) {
          emailsToSend.push({
            supplierName: supplier.name,
            email: supplier.email,
            productName: newData.name,
            currentQuantity: newQuantity,
            sku: newData.sku || "N/A",
          });
        }
      }

      // Enviar emails para todos os fornecedores aplicáveis
      if (emailsToSend.length > 0) {
        for (const emailData of emailsToSend) {
          await sendCriticalStockEmail(emailData);
        }
        console.log(`${emailsToSend.length} email(s) enviado(s) para fornecedores`);
      }

      return;
    } catch (error) {
      console.error("Erro ao processar estoque crítico:", error);
      throw error;
    }
  });

/**
 * Função auxiliar para enviar email de estoque crítico
 */
async function sendCriticalStockEmail(emailData) {
  const { supplierName, email, productName, currentQuantity, sku } = emailData;

  const subject = `⚠️ ALERTA: Estoque Crítico - ${productName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ef4444; color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { padding: 20px; background-color: #f5f5f5; margin-top: 20px; border-radius: 8px; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ef4444; }
          .footer { text-align: center; padding-top: 20px; color: #666; font-size: 12px; }
          .button { 
            display: inline-block; 
            background-color: #0ea5e9; 
            color: white; 
            padding: 10px 20px; 
            border-radius: 4px; 
            text-decoration: none; 
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Alerta de Estoque Crítico</h1>
          </div>
          
          <div class="content">
            <p>Olá <strong>${supplierName}</strong>,</p>
            
            <p>Um produto que você monitora atingiu o nível de estoque crítico!</p>
            
            <div class="info-box">
              <p><strong>Produto:</strong> ${productName}</p>
              <p><strong>SKU:</strong> ${sku}</p>
              <p><strong>Quantidade Atual:</strong> <span style="color: #ef4444; font-weight: bold;">${currentQuantity} unidade(s)</span></p>
            </div>
            
            <p>Por favor, entre em contato conosco o quanto antes para repor o estoque.</p>
            
            <p style="text-align: center;">
              <a href="https://same-app.com" class="button">Abrir SAME</a>
            </p>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Este é um alerta automático enviado pela plataforma SAME.
            </p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 SAME - Sistema de Análise e Monitoramento Empresarial</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Alerta de Estoque Crítico

Olá ${supplierName},

Um produto que você monitora atingiu o nível de estoque crítico!

Produto: ${productName}
SKU: ${sku}
Quantidade Atual: ${currentQuantity} unidade(s)

Por favor, entre em contato conosco o quanto antes para repor o estoque.

---
Este é um alerta automático enviado pela plataforma SAME.
  `;

  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER || "noreply@same-app.com",
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Email enviado para ${email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error(`Erro ao enviar email para ${email}:`, error);
    throw error;
  }
}

/**
 * Função BACKUP: Monitora alterações em fornecedores
 * Se um fornecedor ligar um produto novo com autoEmail ativo,
 * verifica se já está crítico
 */
exports.onSupplierAutoEmailEnabled = functions.firestore
  .document("tenants/{uid}/suppliers/{supplierId}")
  .onWrite(async (change, context) => {
    const { uid, supplierId } = context.params;
    const newData = change.after.data();
    const oldData = change.before.data();

    if (!change.after.exists) {
      return; // Fornecedor foi deletado
    }

    // Verificar se autoEmail foi ativado
    const wasAutoEmailEnabled = oldData?.autoEmail === true;
    const isAutoEmailEnabled = newData?.autoEmail === true;

    // Se não acabou de ser ativado, pular
    if (wasAutoEmailEnabled === isAutoEmailEnabled) {
      return;
    }

    if (!isAutoEmailEnabled) {
      console.log(`AutoEmail foi desativado para fornecedor ${supplierId}`);
      return;
    }

    console.log(
      `AutoEmail foi ativado para fornecedor ${supplierId}, verificando produtos críticos...`
    );

    try {
      const productsRef = admin
        .firestore()
        .collection("tenants")
        .doc(uid)
        .collection("products");

      const productsSnapshot = await productsRef.where("quantity", "<=", 5).get();

      if (productsSnapshot.empty) {
        console.log(`Nenhum produto em estoque crítico para enviar email`);
        return;
      }

      // Verificar quais produtos este fornecedor monitora
      const monitoredProducts = newData.selectedProducts || [];
      const criticalProducts = [];

      for (const productDoc of productsSnapshot.docs) {
        if (monitoredProducts.includes(productDoc.id)) {
          criticalProducts.push(productDoc.data());
        }
      }

      // Enviar um email compilado com todos os produtos críticos
      if (criticalProducts.length > 0 && newData.email) {
        await sendMultipleProductsEmail(
          newData.name,
          newData.email,
          criticalProducts
        );
      }

      return;
    } catch (error) {
      console.error("Erro ao verificar produtos críticos:", error);
      throw error;
    }
  });

/**
 * Função auxiliar para enviar email com múltiplos produtos críticos
 */
async function sendMultipleProductsEmail(
  supplierName,
  email,
  criticalProducts
) {
  const productsList = criticalProducts
    .map(
      (p) => `
    <div class="info-box">
      <p><strong>${p.name}</strong></p>
      <p>SKU: ${p.sku || "N/A"} | Quantidade: <strong style="color: #ef4444;">${p.quantity} un.</strong></p>
    </div>
  `
    )
    .join("");

  const subject = `⚠️ ALERTA: ${criticalProducts.length} Produto(s) em Estoque Crítico`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ef4444; color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { padding: 20px; background-color: #f5f5f5; margin-top: 20px; border-radius: 8px; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ef4444; }
          .footer { text-align: center; padding-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Produtos em Estoque Crítico</h1>
          </div>
          
          <div class="content">
            <p>Olá <strong>${supplierName}</strong>,</p>
            <p>Os seguintes produtos estão em estoque crítico:</p>
            
            ${productsList}
            
            <p>Por favor, entre em contato conosco o quanto antes para repor o estoque.</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 SAME</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || "noreply@same-app.com",
      to: email,
      subject: subject,
      html: htmlContent,
    });

    console.log(`Email com múltiplos produtos enviado para ${email}`);
  } catch (error) {
    console.error(`Erro ao enviar email para ${email}:`, error);
    throw error;
  }
}
