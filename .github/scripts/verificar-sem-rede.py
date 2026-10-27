#!/usr/bin/env python3
"""Garante que a página não carrega nem envia nada para fora.

Isto não é conveniência, é a fronteira de privacidade: o formulário digita CPF e endereço
de autores, então "roda só no navegador" precisa ser verificável, não só prometido.

O que é proibido (fora do bloco vendorizado do pdf-lib, que tem o seu próprio hash):
  - qualquer atributo HTML que faça o navegador BUSCAR ou ENVIAR algo para uma URL externa:
    <script src>, <link href>, <img src>, <iframe src>, <form action>, <meta refresh>...
  - qualquer endereço http(s) solto: em texto, comentário, JavaScript ou CSS;
  - fetch(, XMLHttpRequest, import(, sendBeacon, new Worker, WebSocket, EventSource.

O que é permitido: a ÂNCORA DE CITAÇÃO, <a href="https://..." rel="noopener noreferrer">.
Um link comum só leva a pessoa a outro lugar quando ela clica: não carrega nada, não envia
nada, e o noopener/noreferrer impede que o destino saiba de onde veio. É assim que a página
cita a Política de Inovação. Só vale https, e só em <a href>.

Nos arquivos de dados (dados.js), as linhas marcadas com ALLOW-REDE-LINK-CITACAO guardam
endereços de citação para o JavaScript colocar em âncoras, e ficam de fora da checagem.

Uso: python3 .github/scripts/verificar-sem-rede.py [diretório-do-site]
Chamado pelo workflow sem-rede.yml e por testes/rodar.sh (a mesma regra nos dois).
"""

import re
import sys
from html.parser import HTMLParser
from pathlib import Path

PADRAO_CODIGO = re.compile(
    r"https?://|fetch\(|XMLHttpRequest|import\(|sendBeacon|new Worker|WebSocket|EventSource"
)
URL_EXTERNA = re.compile(r"https?://", re.IGNORECASE)
MARCA_CITACAO = "ALLOW-REDE-LINK-CITACAO"


class VarreTags(HTMLParser):
    """Separa os atributos com endereço externo em permitidos (âncora de citação) e proibidos."""

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.permitidos = []
        self.proibidos = []

    def handle_starttag(self, tag, atributos):
        valores = dict(atributos)
        linha = self.getpos()[0]
        for nome, valor in atributos:
            if not valor or not URL_EXTERNA.search(valor):
                continue
            rel = set((valores.get("rel") or "").lower().split())
            if (tag == "a" and nome == "href" and re.match(r"https://", valor)
                    and {"noopener", "noreferrer"} <= rel):
                self.permitidos.append(valor)
            else:
                motivo = ("âncora externa sem rel=\"noopener noreferrer\" ou sem https"
                          if tag == "a" and nome == "href"
                          else f"<{tag} {nome}=...> faz o navegador buscar ou enviar algo")
                self.proibidos.append((linha, f"{motivo}: {valor[:80]}"))


def sem_bloco_vendorizado(texto):
    return re.sub(r"[^\n]*BEGIN VENDOR.*?END VENDOR[^\n]*", "", texto, flags=re.DOTALL)


def verificar_html(caminho):
    problemas = []
    texto = sem_bloco_vendorizado(caminho.read_text(encoding="utf-8"))
    varredura = VarreTags()
    varredura.feed(texto)
    problemas += [(caminho.name, linha, msg) for linha, msg in varredura.proibidos]
    # Tira só os href das âncoras de citação e olha o que sobra: qualquer outro endereço
    # (texto, comentário, outro atributo) ou chamada de rede é violação.
    restante = texto
    for url in varredura.permitidos:
        restante = restante.replace(f'"{url}"', '""').replace(f"'{url}'", "''")
    for numero, linha in enumerate(restante.splitlines(), 1):
        if PADRAO_CODIGO.search(linha):
            problemas.append((caminho.name, numero, "referência de rede: " + linha.strip()[:100]))
    return problemas


def verificar_codigo(caminho, ignorar_marca=False):
    problemas = []
    for numero, linha in enumerate(caminho.read_text(encoding="utf-8").splitlines(), 1):
        if ignorar_marca and MARCA_CITACAO in linha:
            continue
        if PADRAO_CODIGO.search(linha):
            problemas.append((caminho.name, numero, "referência de rede: " + linha.strip()[:100]))
    return problemas


def main():
    raiz = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    problemas = []
    problemas += verificar_html(raiz / "index.html")
    problemas += verificar_codigo(raiz / "dados.js", ignorar_marca=True)
    problemas += verificar_codigo(raiz / "app.js")
    problemas += verificar_codigo(raiz / "estilos.css")
    # url(...) no CSS busca recurso; só data: é aceito (a CSP também só deixa img-src data:)
    for numero, linha in enumerate((raiz / "estilos.css").read_text(encoding="utf-8").splitlines(), 1):
        for achado in re.findall(r"url\(\s*['\"]?([^'\")]+)", linha):
            if not achado.startswith("data:"):
                problemas.append(("estilos.css", numero, f"url({achado[:60]}) busca um recurso"))
    if problemas:
        for arquivo, linha, msg in problemas:
            print(f"{arquivo}:{linha}: {msg}", file=sys.stderr)
        print("\nReferência de rede encontrada: estes arquivos precisam continuar 100% offline,"
              "\nsalvo âncoras de citação <a href=\"https://...\" rel=\"noopener noreferrer\">.", file=sys.stderr)
        return 1
    print("Nenhuma referência de rede fora do bloco vendorizado (âncoras de citação com noopener noreferrer são permitidas).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
