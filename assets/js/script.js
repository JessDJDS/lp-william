/* ============================================================
   William Moura — script principal da landing page
   As vagas NÃO ficam neste arquivo: elas são carregadas de
   ../../vagas.json (na raiz do projeto) via fetch(), logo
   abaixo. Para adicionar/remover/editar uma vaga, edite só
   o vagas.json — nunca precisa tocar neste arquivo.
   ============================================================ */

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
    <a class="btn-vaga" href="${v.url}" target="_blank" rel="noopener">Ver vaga original ↗</a>
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
  const paises = [...new Set(VAGAS.map(v => v.pais))];
  const sens = ["Júnior","Pleno","Sênior"];
  const gp = document.getElementById("grupo-pais");
  const gs = document.getElementById("grupo-senioridade");
  paises.forEach(p => {
    const b = document.createElement("button");
    b.className = "chip"; b.textContent = p; b.setAttribute("aria-pressed","false");
    b.addEventListener("click", () => {
      filtro.pais = (filtro.pais === p) ? null : p;
      gp.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(c.textContent === filtro.pais)));
      atualizar();
    });
    gp.appendChild(b);
  });
  sens.forEach(s => {
    const b = document.createElement("button");
    b.className = "chip"; b.textContent = s; b.setAttribute("aria-pressed","false");
    b.addEventListener("click", () => {
      filtro.senioridade = (filtro.senioridade === s) ? null : s;
      gs.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(c.textContent === filtro.senioridade)));
      atualizar();
    });
    gs.appendChild(b);
  });
  document.getElementById("chip-visto").addEventListener("click", e => {
    filtro.visto = !filtro.visto;
    e.currentTarget.setAttribute("aria-pressed", String(filtro.visto));
    atualizar();
  });
}

/* ============ GLOBO ============ */
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
    .attr("fill","none").attr("stroke","#008EAC").attr("stroke-width",1);

  // graticule 15°
  svgG.append("path").datum(d3.geoGraticule().step([15,15])())
    .attr("class","graticule")
    .attr("fill","none").attr("stroke","#008EAC")
    .attr("stroke-width",0.4).attr("opacity",0.35);

  // países (preenchido quando o topojson chegar)
  svgG.append("path").attr("class","paises")
    .attr("fill","none").attr("stroke","#008EAC").attr("stroke-width",0.6);

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

  // Kalundborg — círculo vazado no acento sky, único marcador azul da seção
  if(visivel(KALUNDBORG.lon, KALUNDBORG.lat)){
    const [x,y] = projection([KALUNDBORG.lon, KALUNDBORG.lat]);
    g.append("circle")
      .attr("cx",x).attr("cy",y).attr("r",6)
      .attr("fill","none").attr("stroke","#7AC2DB").attr("stroke-width",1.5);
    g.append("text")
      .attr("x", x + 12).attr("y", y - 8)
      .attr("font-family","'Space Grotesk',sans-serif").attr("font-size","9px")
      .attr("letter-spacing",".12em").attr("fill","#7AC2DB")
      .text("VOCÊ ESTÁ AQUI · EU TAMBÉM");
  }

  lista.forEach(v => {
    if(!visivel(v.lon, v.lat)) return;
    const [x,y] = projection([v.lon, v.lat]);
    const ativo = v.id === vagaAtiva;
    g.append("rect")
      .attr("class","pin-globo")
      .attr("x", x-4.5).attr("y", y-4.5)
      .attr("width",9).attr("height",9)
      .attr("fill","#00E67F").attr("stroke","#013D4A").attr("stroke-width",1.5)
      .attr("tabindex",0)
      .attr("role","button")
      .attr("aria-label",`${v.cargo} em ${v.cidade}, ${v.pais}`)
      .on("click", () => selecionarVaga(v.id, true))
      .on("keydown", ev => {
        if(ev.key === "Enter" || ev.key === " "){ ev.preventDefault(); selecionarVaga(v.id, true); }
      });

    // linha de chamada tracejada no pin ativo
    if(ativo){
      const dx = x < TAM/2 ? -46 : 46;
      const lx = x + dx, ly = y - 34;
      gc.append("line")
        .attr("x1",x).attr("y1",y).attr("x2",lx).attr("y2",ly)
        .attr("stroke","#013D4A").attr("stroke-width",1)
        .attr("stroke-dasharray","4 3");
      gc.append("text")
        .attr("x", lx).attr("y", ly - 5)
        .attr("text-anchor", dx < 0 ? "end" : "start")
        .attr("font-family","'Space Grotesk',sans-serif").attr("font-size","10px")
        .attr("letter-spacing",".12em").attr("fill","#013D4A")
        .text(v.cidade.toUpperCase());
    }
  });
}

function girarAte(lon, lat){
  if(reduzMotion){
    projection.rotate([-lon, -lat > 60 ? 60 : (-lat < -60 ? -60 : -lat)]);
    desenhar();
    return;
  }
  const alvo = [-lon, Math.max(-60, Math.min(60, -lat))];
  const interp = d3.interpolate(projection.rotate(), alvo);
  rotacaoAnimada = d3.timer(t => {
    const p = Math.min(1, t / 700);
    projection.rotate(interp(d3.easeCubicInOut(p)));
    desenhar();
    if(p >= 1){ rotacaoAnimada.stop(); rotacaoAnimada = null; }
  });
}

function selecionarVaga(id, girar){
  vagaAtiva = id;
  const v = VAGAS.find(x => x.id === id);
  renderPainel();
  renderLista();
  if(girar && projection) girarAte(v.lon, v.lat);
  else desenharPins();
}

function atualizar(){
  renderPainel();
  renderLista();
  if(projection) desenharPins();
}

/* ============ NUVEM DE REVISÃO (marco Chevening) ============ */
function montarNuvem(){
  const p = document.getElementById("nuvem-path");
  if(!p) return;
  // elipse recortada em arcos — contorno de nuvem de revisão de prancha
  const cx = 140, cy = 165, rx = 128, ry = 152, n = 18;
  let d = "";
  for(let i = 0; i < n; i++){
    const a1 = (i / n) * 2 * Math.PI;
    const a2 = ((i + 1) / n) * 2 * Math.PI;
    const x1 = cx + rx * Math.cos(a1), y1 = cy + ry * Math.sin(a1);
    const x2 = cx + rx * Math.cos(a2), y2 = cy + ry * Math.sin(a2);
    if(i === 0) d += `M ${x1.toFixed(1)} ${y1.toFixed(1)} `;
    // arco pequeno pra fora entre os dois pontos
    d += `A 30 30 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} `;
  }
  d += "Z";
  p.setAttribute("d", d);
}

/* ============ INIT ============ */
function iniciar(){
  montarFiltros();
  renderPainel();
  renderLista();
  montarGlobo();
  montarNuvem();
}

fetch("vagas.json")
  .then(r => {
    if(!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then(data => {
    VAGAS = data;
    vagaAtiva = VAGAS[0] ? VAGAS[0].id : null;
    iniciar();
  })
  .catch(err => {
    console.error("Não foi possível carregar vagas.json:", err);
    const vazio = document.getElementById("estado-vazio");
    if(vazio){
      vazio.style.display = "block";
      vazio.textContent = "Não foi possível carregar as vagas agora. Tenta recarregar a página.";
    }
  });
