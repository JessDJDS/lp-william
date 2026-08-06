# William Moura — Landing Page

Site pessoal / linktree / mural de vagas. Estático, sem build step —
é só HTML, CSS e JS puro. Funciona abrindo o `index.html` direto ou
publicado em qualquer hospedagem de arquivo estático.

## Estrutura

```
.
├── index.html              → estrutura da página
├── vagas.json               → lista de vagas (edite este arquivo, nunca o HTML)
├── README.md
└── assets/
    ├── css/
    │   └── style.css        → todo o CSS do site
    ├── js/
    │   └── script.js        → toda a lógica (filtros, globo, timeline, etc.)
    ├── images/               → fotos usadas na página
    ├── icons/
    │   └── whatsapp.svg      → ícone do botão flutuante
    └── fonts/                → vazia por padrão (ver LEIA-ME.txt lá dentro)
```

Bibliotecas externas (D3.js e TopoJSON, usadas no globo da seção
"Vagas") continuam carregadas via CDN (cdnjs) nas duas tags
`<script src="https://cdnjs...">` no fim do `index.html` — não
precisam de arquivo local. As fontes (Space Grotesk e Montserrat)
também vêm do Google Fonts via CDN; veja `assets/fonts/LEIA-ME.txt`
se quiser hospedá-las localmente.

## Como editar as vagas

Toda vaga mostrada no globo e na lista vem do arquivo **`vagas.json`**,
na raiz do projeto. Para adicionar, remover ou atualizar uma vaga,
edite só esse arquivo — o HTML e o JS não precisam ser tocados.

Formato de cada vaga:

```json
{
  "id": "v010",
  "cargo": "Nome do cargo",
  "empresa": "Nome da empresa",
  "cidade": "Cidade",
  "pais": "País",
  "lat": 0.0,
  "lon": 0.0,
  "senioridade": "Júnior | Pleno | Sênior",
  "idioma": "Ex: Inglês obrigatório",
  "visto": true,
  "resumo": "Um parágrafo curto sobre a vaga.",
  "requisitos": ["Requisito 1", "Requisito 2", "Requisito 3"],
  "fonte": "LinkedIn | Empresa | etc.",
  "url": "https://link-da-vaga-original",
  "publicado": "2026-08-05"
}
```

- `id` precisa ser único (use `v010`, `v011`, ...).
- `lat`/`lon` são as coordenadas da cidade — usadas pra posicionar o
  pin no globo (basta buscar "[cidade] latitude longitude" no Google).
- `visto: false` faz aparecer "Não patrocina visto" no card.
- Pra remover uma vaga, é só apagar o objeto correspondente da lista.

Depois de editar, salve o arquivo e recarregue a página — não tem
build, não tem cache pra limpar.

⚠️ Como o site abre `vagas.json` via `fetch()`, abrir o `index.html`
direto no navegador (`file://`) pode ser bloqueado por CORS em alguns
navegadores. Pra testar localmente, rode um servidor simples na pasta:

```bash
python3 -m http.server 8000
# depois abra http://localhost:8000
```

Isso não afeta a versão publicada (GitHub Pages, Netlify, etc.) —
só o teste local direto do arquivo.

## Publicar no GitHub Pages

1. Crie um repositório novo no GitHub e suba todo o conteúdo desta
   pasta (incluindo `assets/` e `vagas.json`) pra raiz do repositório.
2. No repositório: **Settings → Pages**.
3. Em "Build and deployment", escolha **Deploy from a branch**,
   branch `main`, pasta `/ (root)`.
4. Salve. Em alguns minutos o site estará em
   `https://seu-usuario.github.io/nome-do-repositorio/`.

## Publicar no Netlify (alternativa)

1. Em [app.netlify.com](https://app.netlify.com), "Add new site" →
   "Deploy manually".
2. Arraste esta pasta inteira (com `assets/` e `vagas.json` dentro).
3. Pronto — URL gerada na hora. Dá pra conectar um domínio próprio
   depois em Site settings → Domain management.

## Editando vagas depois de publicado

Se o repositório estiver no GitHub, editar `vagas.json` direto pela
interface web do GitHub (ícone de lápis no arquivo) e commitar já
é suficiente — GitHub Pages e Netlify (se conectado via Git)
republicam automaticamente a cada commit.
