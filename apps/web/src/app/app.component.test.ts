import { render, screen } from '@testing-library/angular'
import { AppComponent } from './app.component'
import { routes } from './app.routes'

describe('AppComponent', () => {
  it('renderiza a rota inicial com o título SkillQuest', async () => {
    await render(AppComponent, { routes })

    expect(await screen.findByRole('heading', { name: 'SkillQuest' })).toBeTruthy()
  })
})
