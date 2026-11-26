// Conventional Commits (CLAUDE.md). Mensagens em pt-BR: sem regra de caixa no assunto.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
}
