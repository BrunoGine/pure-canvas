## Problema confirmado

`https://source.unsplash.com/...` foi descontinuado pelo Unsplash em 2024 — todas as imagens de metas retornam 404. Vou implementar a **Opção A** (presets de ícone + gradiente), sem dependências externas e sem migração de banco.

## Implementação

### 1. Criar `src/components/goals/goalPresets.ts`
Lista de 12 presets (Viagem, Casa, Carro, Presente, Estudos, Casamento, Eletrônico, Férias, Reserva, Saúde, Pet, Outro), cada um com:
- `key` (string)
- `label` (PT-BR)
- `icon` (componente do `lucide-react`)
- `gradient` (classes Tailwind, ex.: `from-sky-500 to-blue-700`)

Helpers:
- `getGoalPreset(image_url)` — interpreta `"preset:<key>"`; qualquer outro valor (URL antiga ou nulo) cai no preset `Outro`. Mantém compatibilidade com metas já criadas sem precisar de migração.
- `presetToImageUrl(key)` → `"preset:<key>"`.

### 2. Editar `src/components/goals/GoalFormDialog.tsx`
- Remover input de URL, função `buildImageUrl`, botão "Sugerir" e prévia de imagem (tudo ligado ao Unsplash).
- Adicionar estado `selectedPresetKey` (default: `"other"`).
- Renderizar grade 4 colunas com os 12 presets: cada item é um botão quadrado com `bg-gradient-to-br <gradient>`, ícone branco centralizado e label abaixo. O selecionado ganha `ring-2 ring-primary ring-offset-2 ring-offset-background`.
- No `handleSubmit`, gravar `image_url: presetToImageUrl(selectedPresetKey)`.

### 3. Editar `src/components/goals/GoalCard.tsx`
- Remover bloco `<img>` e fallback atual.
- Substituir o header (`h-28`) por:
  ```tsx
  const preset = getGoalPreset(goal.image_url);
  const Icon = preset.icon;
  <div className={cn("relative h-28 bg-gradient-to-br flex items-center justify-center", preset.gradient)}>
    <Icon size={40} className="text-white/95 drop-shadow" />
    {/* mantém badge "Concluída" e DropdownMenu existentes por cima */}
  </div>
  ```
- Manter overlay escuro inferior, badge de concluída e menu de ações inalterados.

### 4. Sem outras alterações
- `GoalCompletedDialog.tsx` não usa imagem — não precisa mudar.
- `useGoals.ts`, schema do banco, edge functions — sem alterações.

## Arquivos
- **Novo:** `src/components/goals/goalPresets.ts`
- **Editado:** `src/components/goals/GoalFormDialog.tsx`
- **Editado:** `src/components/goals/GoalCard.tsx`

## Resultado esperado
Ao criar uma meta, o usuário escolhe visualmente uma categoria (ex.: ✈️ Viagem em gradiente azul). O card na home mostra o ícone no gradiente — sempre carrega instantaneamente, nunca quebra, e combina com a estética do app. Metas antigas com URL Unsplash quebrada passam a exibir o preset "Outro" automaticamente.
