---
name: react-component
description: Modelo e checklist para criar componentes React no SkillQuest - estrutura de arquivos, tipagem, acessibilidade, estados e teste. Use ao criar ou refatorar componentes em apps/web.
---
# Componentes React do SkillQuest

## Onde fica
- Específico de uma feature: apps/web/src/features/<feature>/components/
- Reutilizável em várias telas: apps/web/src/components/
- Um componente por arquivo, PascalCase, teste ao lado: AnswerOption.tsx + AnswerOption.test.tsx

## Modelo
```tsx
import type { Question } from '@skillquest/shared'

type AnswerOptionProps = {
  index: number                 // 0-3, também define o atalho de teclado (1-4)
  text: string
  state: 'idle' | 'correct' | 'wrong' | 'disabled'
  onSelect: (index: number) => void
}

export function AnswerOption({ index, text, state, onSelect }: AnswerOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      disabled={state === 'disabled'}
      aria-keyshortcuts={String(index + 1)}
      className="..."
    >
      <span aria-hidden="true">{index + 1}</span>
      <span>{text}</span>
      {state === 'correct' && <span className="sr-only">Resposta correta</span>}
      {state === 'wrong' && <span className="sr-only">Resposta incorreta</span>}
    </button>
  )
}
```

## Checklist
- [ ] Props tipadas com `type`, sem `any`; tipos de domínio vêm de packages/shared.
- [ ] Elemento semântico certo (button, a, form, ul/li); nada de div clicável.
- [ ] Foco visível e operável só com teclado.
- [ ] Estado certo/errado não depende só de cor (ícone ou texto também).
- [ ] Estados de carregando, erro e vazio, se o componente busca dados.
- [ ] Animações respeitam prefers-reduced-motion.
- [ ] Teste cobrindo: renderização, interação principal, acessibilidade básica (getByRole).

## Modelo de teste
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnswerOption } from './AnswerOption'

it('chama onSelect com o índice ao clicar', async () => {
  const onSelect = vi.fn()
  render(<AnswerOption index={2} text="useState" state="idle" onSelect={onSelect} />)
  await userEvent.click(screen.getByRole('button', { name: /useState/ }))
  expect(onSelect).toHaveBeenCalledWith(2)
})
```
