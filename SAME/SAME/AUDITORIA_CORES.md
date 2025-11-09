# Auditoria de Cores - SAME App

## Cores Encontradas nas Telas:

### Backgrounds:
- `#050F1B` - Darkest (background principal) ✅
- `#0F172A` - Dark (cards, modals) ✅
- `#1F2937` - Snackbar em SuppliersScreen ❌ (deveria ser #0F172A)

### Primary:
- `#6E56CF` - Purple ✅ (consistente)

### Secondary:
- `#0EA5E9` - Blue ✅ (consistente)

### Status:
- `#25D366` - Green ✅ (WhatsApp green)
- `#EF4444` - Red ✅ (errors, delete)
- `#F59E0B` - Orange ✅ (warnings)

### Text:
- `#FFFFFF` - White ✅
- `rgba(255, 255, 255, 0.6)` - White 60% ✅
- `rgba(255, 255, 255, 0.7)` - White 70% ❌ (deveria ser 0.6 ou 0.8)
- `rgba(255, 255, 255, 0.8)` - White 80% ✅

### Borders:
- `rgba(255, 255, 255, 0.1)` - Border light ✅
- `rgba(255, 255, 255, 0.12)` - Border strong ✅

### Backgrounds UI:
- `rgba(255, 255, 255, 0.05)` - Card background ✅
- `rgba(255, 255, 255, 0.06)` - Header background ✅
- `rgba(255, 255, 255, 0.08)` - Card background strong ✅

## Inconsistências Encontradas:

1. **SuppliersScreen.js** linha 619:
   - Usando: `#1F2937` (cinza diferente)
   - Deveria ser: `#0F172A`

2. **Algumas telas** usando `rgba(255, 255, 255, 0.7)`:
   - Deveria padronizar para 0.6 ou 0.8

## Recomendações:

1. Importar `colors.js` em todas as telas
2. Substituir hardcoded colors pelas constantes
3. Corrigir inconsistências
