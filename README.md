# nit-ferramentas

Repositório **público**, sem credenciais — hospeda o gerador do PDF do SIPAC
usado no processo de submissão de software do NIT/UFCIMG, publicado via
GitHub Pages.

## O que tem aqui

| Ferramenta | Arquivo | Para quê |
|---|---|---|
| Gerador do PDF do SIPAC — wizard em etapas | [`index.html`](index.html) (shell + biblioteca vendorizada) + [`app.js`](app.js) (lógica) + [`dados.js`](dados.js) (tabelas do INPI, qualificações, campi, constantes) + [`estilos.css`](estilos.css) | O docente preenche em etapas — identificação, instituições parceiras, autores, classificação, artefato a proteger, declarações — e recebe o PDF pronto para anexar ao processo no SIPAC |

Substituiu o script Python que antes vivia no repositório template e precisava
ser instalado na máquina do docente. Navegador todo mundo já tem.

## Público, processando dado sensível — como isso se sustenta

O formulário coleta **CPF, endereço e telefone** dos autores. Isso não é
contradição com o repositório ser público, mas exige que uma propriedade seja
verdadeira e continue verdadeira: **nada do que é digitado sai do navegador.**

Não há backend. Não há chamada de rede. A biblioteca de geração de PDF está
*vendorizada* — colada dentro do próprio `index.html`, entre os marcadores
`BEGIN VENDOR` / `END VENDOR` — em vez de carregada de um CDN, justamente para
que nenhum terceiro possa trocar o código debaixo de nós. `app.js`,
`dados.js` e `estilos.css` são carregados só do próprio repositório
(`script-src`/`style-src 'self'` no CSP) — nunca de CDN. O PDF é montado
localmente e baixado direto.

Ser público é o que permite usar Pages em qualquer plano do GitHub (Pages a
partir de repositório privado exige plano pago) e não expõe nada de ninguém: o
que está publicado é o formulário vazio, não dado de submissão.

### Três travas, verificadas a cada push

| Trava | Onde |
|---|---|
| `Content-Security-Policy` com `connect-src 'none'` e `script-src`/`style-src 'self'` | meta tag no topo do `index.html` |
| Nenhuma referência externa fora do bloco vendorizado, em nenhum dos quatro arquivos | [`sem-rede.yml`](.github/workflows/sem-rede.yml) |
| Bloco vendorizado íntegro | hash fixado em [`vendor-pdf-lib.sha256`](.github/vendor-pdf-lib.sha256) |

**Nunca acrescente a estes arquivos:** `<script src>` de CDN, link de webfont,
analytics, ou qualquer `fetch`. `'self'` no CSP libera carregar `app.js`,
`dados.js` e `estilos.css` do próprio repositório — não abre a porta para nada
externo. O CI rejeita qualquer referência de rede fora do bloco vendorizado, e
a rejeição é o ponto.

O hash fixado existe porque ninguém revisa 500 KB de código minificado num
diff — uma linha maliciosa enfiada ali passaria batida. Com o hash, atualizar a
biblioteca exige trocar código **e** hash no mesmo commit, o que torna a
intenção visível na revisão.

## Publicar no GitHub Pages

`Settings → Pages → Source: Deploy from a branch → main → / (root)`.

Sem build. Editou `index.html`, `app.js`, `dados.js` ou
`estilos.css`, é só dar push.

## Atualizar a biblioteca de PDF

1. Baixe a versão nova do `pdf-lib`.
2. **Remova a linha `sourceMappingURL` do fim** — senão o navegador tenta
   buscar o mapa de origem, que é exatamente a chamada de rede que não pode
   existir.
3. Cole entre os marcadores `BEGIN VENDOR` / `END VENDOR`, dentro de
   `index.html`.
4. Recalcule o hash de referência, no mesmo commit:

```bash
sed -n '/BEGIN VENDOR/,/END VENDOR/p' index.html \
  | sha256sum | awk '{print $1"  index.html.vendor-block"}' > .github/vendor-pdf-lib.sha256
```

## Testar

A suíte do repositório `nit-softwares` abre esta página num Chromium de
verdade, preenche o formulário inteiro, gera o PDF e confere o anexo embutido,
o bloco sentinela e a ausência de qualquer requisição de rede:

```bash
testes/rodar.sh
```

## Manutenção

O formulário é a fonte dos dados que vão ao SIPAC e ao INPI, e não é gerado a
partir de schema nenhum — se as exigências do processo mudarem (campo novo,
validação diferente), é edição à mão aqui. O `metadata.json` do repositório de
submissão ficou propositalmente mínimo e **não** espelha este formulário; os
dois respondem perguntas diferentes.

Dados constantes e de autocomplete (tabelas de Área de Aplicação/Tipo de
Programa do INPI, qualificações profissionais, campi da UFCIMG, o prefixo
`GITHUB_ORG`, a versão do formato `VERSAO_FLUXO`) ficam isolados em
`dados.js` — é o único arquivo a mexer para atualizar essas listas. A lógica do wizard (etapas, validação por campo,
geração do PDF) fica em `app.js`.

### Versão do formato (`VERSAO_FLUXO`)

O JSON embutido no PDF (`submissao.json` + bloco sentinela) e o do "Salvar
rascunho" carregam `versao_fluxo`, cujo valor vem da constante `VERSAO_FLUXO`
em `dados.js`. Ela existe para a **interoperabilidade entre versões**: um PDF
fica décadas no SIPAC, então a extensão do NIT (que lê esse PDF do lado do
SIPAC) e o "Carregar rascunho" vão receber JSON de versões antigas e precisam
saber qual formato têm nas mãos.

A regra, a partir da primeira publicação (hoje ainda é ensaio, e o formato
mudou várias vezes sem trocar o número):

- **Mudança aditiva** (chave nova e opcional): mantém o número. Leitor antigo
  ignora a chave; leitor novo trata a ausência dela.
- **Mudança incompatível** (remover, renomear ou mudar o tipo de uma chave):
  sobe o número maior, e os dois leitores passam a aceitar as duas versões.
- Qualquer alteração de campo precisa ser avisada a quem mantém a extensão
  antes de PDFs novos começarem a circular.

Hoje nenhum leitor consulta o número: o "Carregar rascunho" aceita qualquer
JSON sem olhar `versao_fluxo`, e a extensão ainda não lê esta parte. Isso basta
enquanto só existe um formato em circulação; o primeiro corte incompatível
depois da publicação é a hora de fazer os leitores ramificarem pela versão.

## Licenças de terceiros

- **pdf-lib** (MIT), embutida em `index.html` entre `BEGIN VENDOR` e `END VENDOR`, com hash fixado em `.github/vendor-pdf-lib.sha256`.
- **Ícones do Font Awesome Free** (CC BY 4.0), embutidos como SVG nos botões de rascunho. Atribuição e alterações em [`licencas/font-awesome.txt`](licencas/font-awesome.txt).
