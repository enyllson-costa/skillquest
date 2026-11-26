import { render, screen } from '@testing-library/angular'
import { HomeComponent } from './home.component'

describe('HomeComponent', () => {
  it('mostra o título SkillQuest como heading principal', async () => {
    await render(HomeComponent)

    expect(screen.getByRole('heading', { level: 1, name: 'SkillQuest' })).toBeTruthy()
  })
})
