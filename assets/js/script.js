/* ============ DADOS ============
   As vagas NÃO ficam mais neste arquivo. Elas são carregadas de
   vagas.json (na raiz do projeto) via fetch(), logo no fim deste
   arquivo. Pra adicionar/remover/editar uma vaga, edite só o
   vagas.json — nunca precisa tocar neste script. */
let VAGAS = [];

const KALUNDBORG = { lat:55.6867, lon:11.0879 };

/* ============ ESTADO ============ */
const filtro = { pais:null, senioridade:null, visto:false };
let vagaAtiva = null;
const reduzMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function vagasFiltradas(){
  return VAGAS.filter(v =>
    (!filtro.pais || v.pais === filtro.pais) &&
    (!filtro.senioridade || v.senioridade === filtro.senioridade) &&
    (!filtro.visto || v.visto)
  );
}
function fmtData(iso){
  const [a,m,d] = iso.split("-");
  return `${d}.${m}.${a}`;
}

/* ============ PAINEL ============ */
function renderPainel(){
  const lista = vagasFiltradas();
  const painel = document.getElementById("painel");
  if(!lista.length){ painel.innerHTML = ""; painel.style.display = "none"; return; }
  painel.style.display = "";
  if(!lista.some(v => v.id === vagaAtiva)) vagaAtiva = lista[0].id;
  const v = lista.find(x => x.id === vagaAtiva);
  const idx = lista.findIndex(x => x.id === vagaAtiva) + 1;
  const pad = n => String(n).padStart(2,"0");
  painel.innerHTML = `
    <p class="veyebrow">Vaga ${pad(idx)} / ${pad(lista.length)}</p>
    <h3>${v.cargo}</h3>
    <p class="empresa">${v.empresa}</p>
    <ul class="metas">
      <li>${v.cidade} · ${v.pais}</li>
      <li>${v.senioridade}</li>
      <li>${v.idioma}</li>
      <li>${v.visto ? "Patrocina visto" : "Não patrocina visto"}</li>
    </ul>
    <p class="resumo">${v.resumo}</p>
    <ul class="reqs">${v.requisitos.map(r => `<li>${r}</li>`).join("")}</ul>
    <a class="btn-vaga" href="${v.url}" target="_blank" rel="noopener" data-analytics="vaga-${v.id}">Ver vaga original ↗</a>
    <div class="carimbo"><span>Fonte · ${v.fonte}</span><span>Publicada ${fmtData(v.publicado)}</span></div>
  `;
}

/* ============ LISTA ============ */
function renderLista(){
  const lista = vagasFiltradas();
  const box = document.getElementById("lista-vagas");
  const vazio = document.getElementById("estado-vazio");
  document.getElementById("contagem-vagas").textContent = lista.length;
  vazio.style.display = lista.length ? "none" : "block";
  box.style.display = lista.length ? "" : "none";
  box.innerHTML = lista.map(v => `
    <button class="linha-vaga" role="listitem" data-id="${v.id}"
      aria-current="${v.id === vagaAtiva}"
      aria-label="${v.cargo}, ${v.empresa}, ${v.cidade}, ${v.pais}">
      <span>
        <span class="cargo">${v.cargo}</span><br>
        <span class="meta">${v.empresa} · ${v.cidade}</span>
      </span>
      <span class="pais">${v.pais}</span>
    </button>
  `).join("");
  box.querySelectorAll(".linha-vaga").forEach(btn => {
    btn.addEventListener("click", () => selecionarVaga(btn.dataset.id, true));
  });
}

/* ============ FILTROS ============ */
function montarFiltros(){
  // slicers: opções derivadas dos dados — vaga nova cria opção nova sozinha
  const selPais = document.getElementById("sel-pais");
  const selSen = document.getElementById("sel-senioridade");
  const selVisto = document.getElementById("sel-visto");
  [...new Set(VAGAS.map(v => v.pais))].forEach(p => selPais.add(new Option(p, p)));
  [...new Set(VAGAS.map(v => v.senioridade))].forEach(s => selSen.add(new Option(s, s)));
  selPais.addEventListener("change", () => { filtro.pais = selPais.value || null; atualizar(); });
  selSen.addEventListener("change", () => { filtro.senioridade = selSen.value || null; atualizar(); });
  selVisto.addEventListener("change", () => { filtro.visto = selVisto.value === "sim"; atualizar(); });
}

/* ============ GLOBO ============ */
/* o globo vive no hero (base grafite): traço ciano clareado pra ler no escuro */
const COR_TRACO   = "#6FA9BD";  // esfera, grade, países — ciano clareado pro fundo grafite
const COR_CHAMADA = "#F1EDE2";  // linha de chamada e rótulo da cidade
const COR_KAL     = "#B23A1E";  // tijolo — marcador Kalundborg, único tijolo da seção
const TAM = 560;
let projection, path, svgG, paises110, girando = true, arrastando = false;
let rotacaoAnimada = null;

function montarGlobo(){
  const svg = d3.select("#globo-box").append("svg")
    .attr("viewBox", `0 0 ${TAM} ${TAM}`)
    .attr("aria-label", "Globo com a localização das vagas");

  projection = d3.geoOrthographic()
    .scale(TAM/2 - 16)
    .translate([TAM/2, TAM/2])
    .rotate([50, -30])
    .clipAngle(90);
  path = d3.geoPath(projection);

  svgG = svg.append("g");

  // esfera
  svgG.append("path").datum({type:"Sphere"})
    .attr("class","esfera")
    .attr("fill","none").attr("stroke",COR_TRACO).attr("stroke-width",1);

  // graticule 15°
  svgG.append("path").datum(d3.geoGraticule().step([15,15])())
    .attr("class","graticule")
    .attr("fill","none").attr("stroke",COR_TRACO)
    .attr("stroke-width",0.4).attr("opacity",0.35);

  // países (preenchido quando o topojson chegar)
  svgG.append("path").attr("class","paises")
    .attr("fill","none").attr("stroke",COR_TRACO).attr("stroke-width",0.6);

  // grupo de pins
  svgG.append("g").attr("class","pins");
  // linha de chamada
  svgG.append("g").attr("class","chamada");

  fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then(r => r.json())
    .then(world => {
      paises110 = topojson.feature(world, world.objects.countries);
      desenhar();
    })
    .catch(() => { /* sem mapa, globo segue com esfera + grade + pins */ });

  // arraste
  const drag = d3.drag()
    .on("start", () => { arrastando = true; svg.classed("arrastando", true); })
    .on("drag", ev => {
      const r = projection.rotate();
      const k = 0.35;
      projection.rotate([
        r[0] + ev.dx * k,
        Math.max(-60, Math.min(60, r[1] - ev.dy * k))
      ]);
      desenhar();
    })
    .on("end", () => { arrastando = false; svg.classed("arrastando", false); });
  svg.call(drag);

  svg.on("mouseenter", () => girando = false);
  svg.on("mouseleave", () => girando = true);

  if(!reduzMotion){
    d3.timer(() => {
      if(girando && !arrastando && !rotacaoAnimada){
        const r = projection.rotate();
        projection.rotate([r[0] + 0.14, r[1]]);
        desenhar();
      }
    });
  }
  desenhar();
}

function desenhar(){
  svgG.select(".esfera").attr("d", path);
  svgG.select(".graticule").attr("d", path);
  if(paises110) svgG.select(".paises").datum(paises110).attr("d", path);
  desenharPins();
}

function visivel(lon, lat){
  const r = projection.rotate();
  const centro = [-r[0], -r[1]];
  return d3.geoDistance([lon, lat], centro) <= Math.PI / 2;
}

function desenharPins(){
  const lista = vagasFiltradas();
  const g = svgG.select(".pins");
  g.selectAll("*").remove();
  const gc = svgG.select(".chamada");
  gc.selectAll("*").remove();

  // Kalundborg — círculo vazado em tijolo, único tijolo da seção
  if(visivel(KALUNDBORG.lon, KALUNDBORG.lat)){
    const [x,y] = projection([KALUNDBORG.lon, KALUNDBORG.lat]);
    g.append("circle")
      .attr("cx",x).attr("cy",y).attr("r",6)
      .attr("fill","none").attr("stroke",COR_KAL).attr("stroke-width",1.5);
    // rótulo abaixo do pin: ≥18px de folga do rótulo de Copenhagen (que fica acima)
    g.append("text")
      .attr("x", x + 12).attr("y", y + 20)
      .attr("font-family","'Space Mono',monospace").attr("font-size","10px")
      .attr("letter-spacing",".12em").attr("fill",COR_KAL)
      .text("KALUNDBORG · EU");
  }

  lista.forEach(v => {
    if(!visivel(v.lon, v.lat)) return;
    const [x,y] = projection([v.lon, v.lat]);
    const ativo = v.id === vagaAtiva;
    g.append("rect")
      .attr("class","pin-globo")
      .attr("x", x-5.5).attr("y", y-5.5)
      .attr("width",11).attr("height",11)
      .attr("fill","#F4C70F").attr("stroke","#16130E").attr("stroke-width",1.5)
      .attr("tabindex",0)
      .attr("role","button")
      .attr("aria-label",`${v.cargo} em ${v.cidade}, ${v.pais}`)
      .on("click", () => selecionarVaga(v.id, true, true))
      .on("keydown", ev => {
        if(ev.key === "Enter" || ev.key === " "){ ev.preventDefault(); selecionarVaga(v.id, true, true); }
      });

    // linha de chamada tracejada no pin ativo
    if(ativo){
      const dx = x < TAM/2 ? -46 : 46;
      const lx = x + dx, ly = y - 34;
      gc.append("line")
        .attr("x1",x).attr("y1",y).attr("x2",lx).attr("y2",ly)
        .attr("stroke",COR_CHAMADA).attr("stroke-width",1)
        .attr("stroke-dasharray","4 3");
      gc.append("text")
        .attr("x", lx).attr("y", ly - 5)
        .attr("text-anchor", dx < 0 ? "end" : "start")
        .attr("font-family","'Space Mono',monospace").attr("font-size","10px")
        .attr("letter-spacing",".12em").attr("fill",COR_CHAMADA)
        .text(v.cidade.toUpperCase());
    }
  });
}

function girarAte(lon, lat){
  if(reduzMotion){
    projection.rotate([-lon, Math.max(-60, Math.min(60, -lat))]);
    desenhar();
    return;
  }
  if(rotacaoAnimada){ rotacaoAnimada.stop(); rotacaoAnimada = null; }
  const alvo = [-lon, Math.max(-60, Math.min(60, -lat))];
  const interp = d3.interpolate(projection.rotate(), alvo);
  const timer = d3.timer(t => {
    const p = Math.min(1, t / 700);
    projection.rotate(interp(d3.easeCubicInOut(p)));
    desenhar();
    if(p >= 1){
      timer.stop();
      if(rotacaoAnimada === timer) rotacaoAnimada = null;
    }
  });
  rotacaoAnimada = timer;
}

function selecionarVaga(id, girar, rolarAtePainel){
  vagaAtiva = id;
  const v = VAGAS.find(x => x.id === id);
  renderPainel();
  renderLista();
  if(girar && projection) girarAte(v.lon, v.lat);
  else desenharPins();
  // pin clicado no hero: painel fica abaixo da dobra — rola até ele se não estiver visível
  if(rolarAtePainel){
    const painel = document.getElementById("painel");
    const r = painel.getBoundingClientRect();
    const visivelNaTela = r.top >= 0 && r.top < window.innerHeight * 0.7;
    if(!visivelNaTela) painel.scrollIntoView({behavior: reduzMotion ? "auto" : "smooth", block: "center"});
  }
}

function atualizar(){
  renderPainel();
  renderLista();
  if(projection) desenharPins();
}

/* ============ TRAJETÓRIA — carrossel em laço infinito ============ */
function montarTrajetoria(){
  const sec = document.querySelector(".sec-traj");
  if(!sec) return;
  const vp = document.getElementById("traj-vp");
  const track = document.getElementById("traj-track");
  const conjunto = document.getElementById("traj-conjunto");
  const escala = document.getElementById("traj-escala");
  const janela = document.getElementById("esc-janela");
  const GAP = 20;

  // flip do CARD INTEIRO: frente = conteúdo atual; verso = clone com foto -b
  // (ou padrão sem-registro) e título B. Card com texto B vira mesmo sem foto.
  // (montado ANTES da clonagem pra estrutura existir nas três cópias)
  conjunto.querySelectorAll(".card").forEach(card => {
    const slot = card.querySelector(".slot");
    const img = slot ? slot.querySelector("img") : null;
    const temB = !!card.dataset.tituloB;
    if(!img && !temB) return; // nada pra virar

    const flip = document.createElement("div");
    flip.className = "card-flip";
    const frente = document.createElement("div");
    frente.className = "card-face frente";
    while(card.firstChild) frente.appendChild(card.firstChild);

    const verso = frente.cloneNode(true);
    verso.className = "card-face verso";
    verso.setAttribute("aria-hidden", "true");
    const vslot = verso.querySelector(".slot");
    // verso: padrão sem-registro por baixo; foto -b por cima quando o arquivo existir
    vslot.className = "slot vazio";
    vslot.innerHTML = '<span class="cruz"></span><span class="sr-rotulo">Sem registro</span>';
    if(img){
      const imgV = document.createElement("img");
      imgV.alt = "";
      imgV.className = "verso-img";
      imgV.dataset.base = img.getAttribute("src").replace(/\.\w+$/, "").replace(/-a$/, "") + "-b";
      vslot.appendChild(imgV);

      // --- Início da melhoria de pré-carregamento ---
      const exts = [".jpg", ".jpeg", ".png", ".webp"];
      let tentativa = 0;
      const preCarregarVerso = () => {
        if(tentativa >= exts.length){
          if(card.dataset.tituloB){
            imgV.dataset.falhou = "1";
            imgV.remove();
          } else {
            card.classList.add("sem-verso");
          }
          return;
        }
        const testeImg = new Image();
        testeImg.onload = () => { 
          imgV.src = imgV.dataset.base + exts[tentativa];
          imgV.dataset.ok = "1"; 
        };
        testeImg.onerror = () => { tentativa++; preCarregarVerso(); };
        testeImg.src = imgV.dataset.base + exts[tentativa];
      };
      preCarregarVerso();
      // --- Fim da melhoria de pré-carregamento ---
    }

    if(temB) verso.querySelector(".titulo").innerHTML = card.dataset.tituloB;
    if(card.dataset.etiquetaB) verso.querySelector(".etiqueta").textContent = card.dataset.etiquetaB;

    flip.appendChild(frente);
    flip.appendChild(verso);
    card.appendChild(flip);
    card.classList.add("flipavel");
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", "Virar o card");
    card.setAttribute("aria-expanded", "false");
    // affordance: marca de corte A—A + rótulo de instrução — só em card com verso de texto
    if(temB){
      card.insertAdjacentHTML("beforeend",
        '<span class="mk-corte" aria-hidden="true">' +
          '<svg width="34" height="30" viewBox="0 0 34 30" fill="none">' +
            '<rect width="34" height="30" class="mk-placa"/>' +
            '<path class="mk-seta" d="M26 8v14M26 22l-4-4M26 22l4-4" stroke-width="1.5"/>' +
            '<text class="mk-letra" x="12" y="20" text-anchor="middle" font-family="\'Space Mono\',monospace" font-size="13" font-weight="700">B</text>' +
          '</svg>' +
        '</span>');
    }
  });

  // track triplicado: [A][B][C], scroll vive no B
  const copiaA = conjunto.cloneNode(true);
  const copiaC = conjunto.cloneNode(true);
  [copiaA, copiaC].forEach(c => {
    c.removeAttribute("id");
    c.setAttribute("aria-hidden", "true");
    c.classList.add("copia");
    c.querySelectorAll("a,button,[tabindex]").forEach(el => el.setAttribute("tabindex", "-1"));
    // lazy nunca carrega fora da tela → cópia não dispararia o fallback de slot vazio
    c.querySelectorAll(".slot img").forEach(img => img.loading = "eager");
  });
  track.insertBefore(copiaA, conjunto);
  track.appendChild(copiaC);

  // foto de FRENTE ausente vira slot vazio — é conteúdo, não erro
  track.querySelectorAll(".card-face.frente .slot img, .card:not(.flipavel) .slot img").forEach(img => {
    const troca = () => {
      const s = img.closest(".slot");
      img.remove();
      s.classList.add("vazio");
      s.setAttribute("aria-hidden", "true");
      s.insertAdjacentHTML("beforeend", '<span class="cruz"></span><span class="sr-rotulo">Sem registro</span>');
    };
    if(img.complete && img.naturalWidth === 0) troca();
    else img.addEventListener("error", troca);
  });

  // aplica o lado ao card + acessibilidade das faces + notação da marca de corte
  function aplicaVirado(card, alvo){
    card.classList.toggle("virado", alvo);
    card.setAttribute("aria-expanded", String(alvo));
    card.querySelector(".card-face.frente")?.setAttribute("aria-hidden", String(alvo));
    card.querySelector(".card-face.verso")?.setAttribute("aria-hidden", String(!alvo));
    // virado: seta aponta de volta e a letra vira A — retorno ao corte de origem
    const seta = card.querySelector(".mk-seta");
    const letra = card.querySelector(".mk-letra");
    if(seta) seta.setAttribute("d", alvo ? "M26 22V8M26 8l-4 4M26 8l4 4" : "M26 8v14M26 22l-4-4M26 22l4-4");
    if(letra) letra.textContent = alvo ? "A" : "B";
  }

  // vira o card clicado instantaneamente (gêmeos inclusos)
  function alternaFlip(cardClicado){
    if(cardClicado.classList.contains("sem-verso")) return;
    const i = [...cardClicado.parentElement.children].indexOf(cardClicado);
    const alvo = !cardClicado.classList.contains("virado");
    track.querySelectorAll(".cj-row").forEach(row => {
      const card = row.children[i];
      if(!card || !card.classList.contains("flipavel")) return;
      
      // Vira na hora, sem testar nada no clique!
      aplicaVirado(card, alvo);
    });
  }

  track.addEventListener("click", e => {
    const card = e.target.closest(".card.flipavel");
    if(card) alternaFlip(card);
  });
  track.addEventListener("keydown", e => {
    if(e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".card.flipavel");
    if(card){ e.preventDefault(); alternaFlip(card); }
  });

  let trackW = 0, passoCard = 0;

  function medir(){
    trackW = conjunto.offsetWidth + GAP;
    passoCard = conjunto.querySelector(".card").offsetWidth + GAP;
    vp.scrollLeft = trackW;
    atualizaEscala();
  }

  // cruzou pra cópia lateral → reposiciona na equivalente do B, sem animação
  function normaliza(){
    const sl = vp.scrollLeft;
    if(sl < trackW * 0.5) vp.scrollLeft = sl + trackW;
    else if(sl > trackW * 1.5) vp.scrollLeft = sl - trackW;
  }
  let normalizaTimer = null;

  // escala: um tick por card, trecho tijolo cobre os cards do intervalo 2016–2021
  const nCards = conjunto.querySelectorAll(".card").length;
  const nIntervalo = conjunto.querySelectorAll(".card.intervalo").length;
  for(let i = 0; i < nCards; i++){
    const t = document.createElement("span");
    t.className = "esc-tick";
    t.style.left = (i / (nCards - 1) * 100) + "%";
    escala.appendChild(t);
  }
  escala.querySelector(".esc-intervalo").style.width =
    ((nIntervalo - 1) / (nCards - 1) * 100) + "%";

  function atualizaEscala(){
    if(!trackW) return;
    const frac = ((vp.scrollLeft % trackW) + trackW) % trackW / trackW;
    const escW = escala.clientWidth;
    janela.style.width = Math.min(1, vp.clientWidth / trackW) * escW + "px";
    janela.style.transform = `translateX(${frac * escW}px)`;
  }

  vp.addEventListener("scroll", () => {
    atualizaEscala();
    // normaliza() reposiciona scrollLeft de forma abrupta (sem animação).
    // Fazer isso a cada tick de scroll briga com a inércia/momentum nativo
    // do toque no celular — sensação de delay entre os cards e, em alguns
    // aparelhos, o gesto de scroll da página fica "preso" dentro do
    // carrossel. Adiar pro fim do gesto (debounce) resolve os dois.
    clearTimeout(normalizaTimer);
    normalizaTimer = setTimeout(normaliza, 120);
  }, {passive: true});

  // arraste com mouse (toque usa o scroll nativo).
  // a captura do ponteiro só começa depois do limiar de 6px: capturar já no
  // pointerdown re-endereça o clique pro viewport e o flip do slot nunca dispara
  let arrastando = false, pendente = false, x0 = 0, sl0 = 0, moveu = false;
  vp.addEventListener("pointerdown", e => {
    if(e.pointerType !== "mouse" || e.button !== 0) return;
    pendente = true; moveu = false; x0 = e.clientX; sl0 = vp.scrollLeft;
  });
  vp.addEventListener("pointermove", e => {
    if(!pendente && !arrastando) return;
    const dx = e.clientX - x0;
    if(!arrastando){
      if(Math.abs(dx) <= 6) return;
      arrastando = true; moveu = true;
      try{ vp.setPointerCapture(e.pointerId); }catch(_){}
      vp.classList.add("arrastando");
    }
    e.preventDefault();
    vp.scrollLeft = sl0 - dx;
  });
  ["pointerup", "pointercancel"].forEach(ev =>
    vp.addEventListener(ev, () => {
      pendente = false; arrastando = false;
      vp.classList.remove("arrastando");
    })
  );
  // arraste não pode terminar em flip acidental
  vp.addEventListener("click", e => {
    if(moveu){ e.stopPropagation(); e.preventDefault(); moveu = false; }
  }, true);
  // arrasto nativo de imagem sequestraria o gesto
  vp.addEventListener("dragstart", e => e.preventDefault());

  // um card por vez: setas do teclado e botões
  function passo(dir){
    vp.scrollBy({left: dir * passoCard, behavior: reduzMotion ? "auto" : "smooth"});
  }
  vp.addEventListener("keydown", e => {
    if(e.key === "ArrowRight"){ e.preventDefault(); passo(1); }
    if(e.key === "ArrowLeft"){ e.preventDefault(); passo(-1); }
  });
  sec.querySelector(".seta-esq").addEventListener("click", () => passo(-1));
  sec.querySelector(".seta-dir").addEventListener("click", () => passo(1));

  // entrada única: fade + 20px, stagger 60ms, uma vez só
  if(!reduzMotion){
    sec.classList.add("anim");
    track.querySelectorAll(".cj-row").forEach(row => {
      row.querySelectorAll(".card").forEach((c, i) => c.style.transitionDelay = (i * 60) + "ms");
    });
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if(e.isIntersecting){
          sec.classList.add("entrou");
          io.disconnect();
          // dica única: primeira dobra cresce e volta, 1,2s depois da entrada
          setTimeout(() => {
            const cardDica = conjunto.querySelector(".card .dobra")?.closest(".card");
            if(cardDica){
              cardDica.classList.add("dica");
              setTimeout(() => cardDica.classList.remove("dica"), 600);
            }
          }, 1200);
        }
      });
    }, {threshold: 0.15});
    io.observe(vp);
  }

  medir();
  window.addEventListener("resize", medir);
  window.addEventListener("load", medir);
}

/* ============ ANALYTICS (cliques em links marcados) ============ */
function montarAnalytics(){
  document.addEventListener("click", ev => {
    const el = ev.target.closest("[data-analytics]");
    if(!el || typeof gtag !== "function") return;
    gtag("event", "click_link", {
      link_id: el.dataset.analytics,
      link_url: el.href || ""
    });
  });
}

/* ============ O ARQUIVO — embeds do Instagram sob demanda ============ */
function montarArquivo(){
  const sec = document.getElementById("arquivo");
  if(!sec || !sec.querySelector(".instagram-media")) return;

  // um único embed.js pros três, injetado quando a seção se aproxima
  const obs = new IntersectionObserver(entries => {
    if(!entries[0].isIntersecting) return;
    obs.disconnect();
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.instagram.com/embed.js";
    s.onload = () => window.instgrm?.Embeds?.process();
    document.body.appendChild(s);
  }, {rootMargin: "400px"});
  obs.observe(sec);

  // placeholder some quando o iframe do embed entra no DOM
  sec.querySelectorAll(".embed-corpo").forEach(corpo => {
    const mo = new MutationObserver(() => {
      if(corpo.querySelector("iframe")){
        corpo.classList.add("carregado");
        mo.disconnect();
      }
    });
    mo.observe(corpo, {childList: true, subtree: true});
  });
}

/* ============ MENU MOBILE ============ */
function montarMenuMobile(){
  const btn = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-mobile");
  if(!btn || !nav) return;

  function fechar(){
    nav.classList.remove("aberto");
    btn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
  }
  function abrir(){
    nav.classList.add("aberto");
    btn.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
  }

  btn.addEventListener("click", () => {
    nav.classList.contains("aberto") ? fechar() : abrir();
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", fechar));
  document.addEventListener("keydown", e => { if(e.key === "Escape") fechar(); });
  window.addEventListener("resize", () => { if(window.innerWidth > 980) fechar(); });
}

/* ============ INIT ============ */
// Essas quatro NÃO dependem de VAGAS — rodam sempre, mesmo se o
// vagas.json falhar em carregar (rede instável, path errado no
// deploy, etc.). Antes estavam todas presas atrás do fetch abaixo:
// se vagas.json falhasse por qualquer motivo, a trajetória (cards
// e setas) e os embeds do Instagram simplesmente nunca ganhavam
// os listeners de clique — o que parecia "nada no site reage".
montarMenuMobile();
montarTrajetoria();
montarArquivo();
montarAnalytics();

// Só isso aqui de fato precisa de VAGAS.
function iniciarVagas(){
  montarFiltros();
  renderPainel();
  renderLista();
  montarGlobo();
}

fetch("vagas.json")
  .then(r => {
    if(!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then(data => {
    VAGAS = data;
    vagaAtiva = VAGAS[0] ? VAGAS[0].id : null;
    iniciarVagas();
  })
  .catch(err => {
    console.error("Não foi possível carregar vagas.json:", err);
    const vazio = document.getElementById("estado-vazio");
    if(vazio){
      vazio.style.display = "block";
      vazio.textContent = "Não foi possível carregar as vagas agora. Tenta recarregar a página.";
    }
  });
