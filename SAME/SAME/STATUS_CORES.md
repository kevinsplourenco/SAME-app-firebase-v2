# Status da Padronização de Cores

## ✅ Completado

1. **colors.js criado** com 20 constantes:
   - Backgrounds: darkest, dark
   - Primary: purple, purpleLight
   - Secondary: blue
   - Status: green, red, orange, yellow
   - Text: white, whiteOpacity60, whiteOpacity80
   - Overlays: blackOpacity70
   - UI: border, borderStrong, cardBg, cardBgStrong, headerBg

2. **SuppliersScreen.js** - Snackbar corrigido (#1F2937 → #0F172A)

## 🔄 Em Progresso

### Substituir `rgba(255, 255, 255, 0.7)` por `whiteOpacity60`

**Arquivos afetados (14 ocorrências totais):**
- [ ] HomeScreen.js - 6 ocorrências (linhas 586, 621, 698, 790, 827, 864)
- [ ] SuppliersScreen.js - 2 ocorrências (linhas 272, 283)
- [ ] SalesScreen.js - 1 ocorrência (linha 542) + overlay (linha 728)
- [ ] CashFlowScreen.js - 4 ocorrências (linhas 312, 344, 368, 392)
- [ ] NotificationsScreen.js - 1 ocorrência (linha 164)

## 📋 Próximos Passos

1. Importar `import { colors } from '../colors';` em cada arquivo
2. Substituir todas as cores hardcoded por constantes
3. Testar visualmente cada tela após as mudanças
