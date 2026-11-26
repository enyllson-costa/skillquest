---
name: angular-component
description: Modelo e checklist para criar componentes Angular no SkillQuest - estrutura de arquivos, signals, acessibilidade com CDK, estados e teste. Use ao criar ou refatorar componentes em apps/web.
---
# Componentes Angular do SkillQuest

## Onde fica
- Específico de uma feature: apps/web/src/app/features/<feature>/components/
- Reutilizável em várias telas: apps/web/src/app/shared/ui/
- Um componente por pasta/arquivo, kebab-case, teste ao lado:
  answer-option.component.ts + answer-option.component.html + answer-option.component.test.ts

## Modelo
```ts
// answer-option.component.ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'

export type AnswerOptionState = 'idle' | 'correct' | 'wrong' | 'disabled'

@Component({
  selector: 'sq-answer-option',
  templateUrl: './answer-option.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnswerOptionComponent {
  readonly index = input.required<number>()   // 0-3, também define o atalho de teclado (1-4)
  readonly text = input.required<string>()
  readonly state = input<AnswerOptionState>('idle')
  readonly selected = output<number>()
}
```

```html
<!-- answer-option.component.html -->
<button
  type="button"
  (click)="selected.emit(index())"
  [disabled]="state() === 'disabled'"
  [attr.aria-keyshortcuts]="index() + 1"
  class="..."
>
  <span aria-hidden="true">{{ index() + 1 }}</span>
  <span>{{ text() }}</span>
  @if (state() === 'correct') { <span class="sr-only">Resposta correta</span> }
  @if (state() === 'wrong') { <span class="sr-only">Resposta incorreta</span> }
</button>
```

Os atalhos 1-4/Enter ficam no componente da pergunta (pai), com `host: { '(document:keydown)': 'onKey($event)' }`,
e o feedback é anunciado com `inject(LiveAnnouncer).announce(...)` (`@angular/cdk/a11y`).

## Checklist
- [ ] Standalone, `OnPush`, `input()`/`output()`, `inject()`; sem `any`; tipos de domínio vêm de packages/shared.
- [ ] Elemento semântico certo (button, a, form, ul/li); nada de div clicável.
- [ ] Foco visível e operável só com teclado; para overlay/diálogo use o Angular CDK.
- [ ] Estado certo/errado não depende só de cor (ícone ou texto também).
- [ ] Estados de carregando, erro e vazio, se o componente busca dados (`resource.isLoading()`, `.error()`, `.value()`).
- [ ] Estilo só com Tailwind (sem CSS inline e sem Angular Material).
- [ ] Animações respeitam prefers-reduced-motion.
- [ ] Teste cobrindo: renderização, interação principal, acessibilidade básica (getByRole).

## Modelo de teste
```ts
// answer-option.component.test.ts
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { AnswerOptionComponent } from './answer-option.component'

it('emite selected com o índice ao clicar', async () => {
  const selected = vi.fn()
  await render(AnswerOptionComponent, {
    inputs: { index: 2, text: 'signal()', state: 'idle' },
    on: { selected },
  })
  await userEvent.click(screen.getByRole('button', { name: /signal\(\)/ }))
  expect(selected).toHaveBeenCalledWith(2)
})
```
