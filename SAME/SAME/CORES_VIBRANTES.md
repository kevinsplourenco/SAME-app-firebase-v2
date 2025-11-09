# Atualização de Cores - Paleta Fria e Vibrante

## Mudanças Aplicadas

### 🎨 Nova Paleta de Cores

#### Backgrounds (Tons Azulados)
- **darkest**: `#050F1B` → `#0A0E1A` (mais azulado)
- **dark**: `#0F172A` → `#0F1419` (tom mais neutro/frio)

#### Primary (Roxo/Azul Vibrante)
- **purple**: `#6E56CF` → `#7C3AED` (roxo mais saturado e vibrante)
- **purpleLight**: Ajustado para nova tonalidade

#### Secondary (Azul Ciano)
- **blue**: `#0EA5E9` → `#06B6D4` (cyan/turquesa mais vibrante)
- **blueLight**: Nova cor adicionada `rgba(6, 182, 212, 0.2)`

#### Status (Mais Saturadas)
- **green**: `#25D366` → `#10B981` (verde esmeralda)
- **red**: `#EF4444` → `#F43F5E` (vermelho rose mais vibrante)
- **orange**: Mantido `#F59E0B`
- **yellow**: `#FFC107` → `#FCD34D` (amarelo mais suave)

#### UI Elements (Bordas com Roxo)
- **border**: `rgba(255, 255, 255, 0.1)` → `rgba(124, 58, 237, 0.15)` (bordas com toque roxo)
- **borderStrong**: `rgba(255, 255, 255, 0.12)` → `rgba(124, 58, 237, 0.25)`
- **cardBg**: `rgba(255, 255, 255, 0.05)` → `rgba(124, 58, 237, 0.08)` (cards com glow roxo)
- **cardBgStrong**: `rgba(255, 255, 255, 0.08)` → `rgba(124, 58, 237, 0.12)`
- **headerBg**: `rgba(255, 255, 255, 0.06)` → `rgba(6, 182, 212, 0.08)` (header com toque azul)

## Resultado Visual

### Antes (Paleta Apagada)
- Tons acinzentados neutros
- Bordas brancas sutis
- Cards transparentes sem destaque
- Roxo e azul menos saturados

### Depois (Paleta Fria e Vibrante)
- ✨ Tons azulados mais frios
- 💜 Roxo vibrante (#7C3AED) mais saturado
- 🌊 Azul cyan (#06B6D4) mais energético
- 🟢 Verde esmeralda moderno
- 💗 Vermelho rose mais impactante
- ✨ Bordas e cards com glow roxo/azul
- 🎯 Mais contraste e profundidade

## Aplicação

As cores estão centralizadas em:
- **colors.js** - Constantes de cores
- **theme.js** - Tema do React Native Paper + estilos adicionais

Para usar:
```javascript
import { colors } from './colors';
import { theme, themeStyles } from './theme';

// Usar cores
backgroundColor: colors.purple

// Usar estilos do tema
backgroundColor: themeStyles.card.background
```

## Próximos Passos

1. ✅ colors.js atualizado
2. ✅ theme.js expandido
3. ⏳ Aplicar nas telas (substituir valores hardcoded)
4. ⏳ Testar visualmente

## Comparação Lado a Lado

| Elemento | Antes | Depois | Mudança |
|----------|-------|--------|---------|
| Purple | `#6E56CF` | `#7C3AED` | Mais saturado |
| Blue | `#0EA5E9` | `#06B6D4` | Cyan vibrante |
| Green | `#25D366` | `#10B981` | Esmeralda |
| Red | `#EF4444` | `#F43F5E` | Rose vibrante |
| Borders | White 10% | Purple 15% | Glow roxo |
| Cards | White 5-8% | Purple 8-12% | Glow roxo |
