# Correções: Certificado e botão "Próxima aula"

## 1. Certificado mostra "Harp" em vez de "Harpy"

**Arquivo:** `src/components/courses/CertificateView.tsx` (linha 67)

Trocar o título exibido no certificado:
```tsx
<h1 className="font-display text-2xl md:text-3xl font-bold mb-3">Harp</h1>
```
para:
```tsx
<h1 className="font-display text-2xl md:text-3xl font-bold mb-3">Harpy</h1>
```

Isso corrige tanto a visualização do certificado quanto o PDF gerado (que usa o mesmo componente via `html2canvas`).

## 2. Botão "Próxima aula" não funciona

**Causa raiz:** Em `src/components/courses/LessonPlayer.tsx`, ao clicar em "Próxima aula" o `navigate(/cursos/aula/<nextId>)` muda apenas o parâmetro `lessonId` da rota — o componente `LessonPlayer` não é remontado. Como o `useEffect` de inicialização do `step` só roda quando `step === -1`, o estado permanece em `step = 5` (tela de resultados) com os dados da aula anterior. O usuário vê a "próxima aula" preso na tela de resultados antiga.

Estados que ficam contaminados entre aulas: `step`, `reviewMode`, `lastResults`, `lastScore`, `lastPassed`, `quizResetKey`, `worldCertificate`.

**Correção:** Adicionar um `useEffect` que reseta esses estados sempre que `lessonId` mudar, devolvendo `step` a `-1` para que a lógica de inicialização baseada em `progress` rode novamente para a nova aula.

```tsx
useEffect(() => {
  setStep(-1);
  setReviewMode(false);
  setLastResults([]);
  setLastScore(0);
  setLastPassed(false);
  setWorldCertificate(null);
  setQuizResetKey((k) => k + 1);
}, [lessonId]);
```

Inserido logo após as declarações de `useState`, antes dos demais effects. Isso garante que ao navegar para a próxima aula o player recomece do passo correto (vídeo/resumo/quiz) conforme o progresso já existente.

## Resumo
- 1 linha alterada em `CertificateView.tsx` (Harp → Harpy)
- 1 `useEffect` adicionado em `LessonPlayer.tsx` para resetar estado ao trocar de aula
