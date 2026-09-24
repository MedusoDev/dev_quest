\# Guia de versionamento e commits

## Padrão de commits 

**TODOS** Devem seguir esse formato de commits para melhor visualizacao e qualidade de vida para todos

Use o formato:

```text
<emoji><tipo>: <descrição curta>
```

Exemplos:

- `🚧fix: corrige erro onde user nao conseguia selecionar card`
- `✨feat: adiciona sistema de dungeon`
- `📝docs: atualiza a documentação da API`
- `🎨style: ajuste no design`
- `♻️refactor: reorganiza o serviço de usuários`
- `⚡perf: melhora o tempo de carregamento`
- `✅test: adiciona testes para o login`
- `🔧chore: atualiza as dependências`
- `🔥remove: remove código obsoleto`
- `🚀ci: ajusta o pipeline de integração contínua`

### Atalho rápido (copiar e colar)

| Emoji | Tipo | Copiar |
|---|---|---|
| 🚧 | fix | `🚧fix: ` |
| ✨ | feat | `✨feat: ` |
| 📝 | docs | `📝docs: ` |
| 🎨 | style | `🎨style: ` |
| ♻️ | refactor | `♻️refactor: ` |
| ⚡ | perf | `⚡perf: ` |
| ✅ | test | `✅test: ` |
| 🔧 | chore | `🔧chore: ` |
| 🔥 | remove | `🔥remove: ` |
| 🚀 | ci | `🚀ci: ` |

### Regras

1. Escreva a mensagem no imperativo e em letras minúsculas.
2. Seja claro e objetivo; descreva o que mudou.
3. Faça um commit por alteração lógica.
4. Evite mensagens genéricas, como `alterações` ou `ajustes`.
5. Não misture funcionalidades, correções e formatação no mesmo commit.

### Como separar alterações misturadas em commits individuais

Se você fez o fix, o feat e o style tudo de uma vez (ainda **sem** commitar), não dê `git add .` direto. Separe por arquivo ou por trecho:

**Por arquivo**, quando cada alteração está em arquivos diferentes:

```bash
git status
git add src/services/user.ts
git commit -m "🚧fix: corrige erro onde user nao conseguia selecionar card"

git add src/features/dungeon
git commit -m "✨feat: adiciona sistema de dungeon"

git add src/styles/card.css
git commit -m "🎨style: ajuste no design"
```

**Por trecho (mesmo arquivo)**, use o modo interativo `-p`, que pergunta hunk por hunk se você quer incluir aquele pedaço no commit atual:

```bash
git add -p arquivo.ts
```

Responda `y` (sim) ou `n` (não) para cada trecho mostrado; `s` divide um trecho grande em partes menores. Depois de selecionar só o que pertence a uma alteração lógica, rode `git commit -m "..."` e repita o processo para as outras mudanças.

Se você **já commitou tudo junto** e quer desfazer para separar, use:

```bash
git reset HEAD~1
```

Isso desfaz o commit mas mantém as alterações no código (não commitadas), permitindo refazer com `git add -p` como acima.

Exemplo completo:

```bash
git add .
git commit -m "✨feat: adiciona recuperação de senha"
```

## Versionamento semântico

> Esta parte é responsabilidade exclusiva de quem cuida do release (build/patch). O time não precisa criar tags nem se preocupar com o número da versão — só seguir o padrão de commits acima; isso já é suficiente.

O projeto segue o formato `MAJOR.MINOR.PATCH`, por exemplo `1.4.2`:

- **MAJOR** (`2.0.0`): mudanças incompatíveis com a versão anterior.
- **MINOR** (`1.5.0`): novas funcionalidades compatíveis.
- **PATCH** (`1.4.3`): correções compatíveis.

Comece um projeto em `0.1.0` enquanto a API ainda estiver em desenvolvimento. A versão `1.0.0` indica uma primeira versão estável.

### Fluxo de uma nova versão (responsável pelo release)

```bash
git status
git add .
git commit -m "🚧fix: corrige cálculo de preços"
git tag -a v1.0.1 -m "Lançamento v1.0.1"
git push origin main --tags
```

Antes de criar a tag, execute os testes e confirme que a documentação e o arquivo de versão estão atualizados. Use tags no formato `vMAJOR.MINOR.PATCH` e mantenha o histórico do Git organizado.
