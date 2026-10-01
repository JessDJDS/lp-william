/* ============================================================
   Simulador do primeiro milhão por engenharia — /milionario/completo
   Salários: mediana da RAIS 2025 por família CBO e idade
   (02H/Recorte_RAIS2025/rais2025_engenheiros_filtrado_v3_horas.csv +
   Skills Claude/Analistas de dados/RAIS/depara_cbo_engenharias.csv,
   medianas no DuckDB). Idade exata quando N >= 30 em todas as idades de
   24 a 50; senão, faixa de 5 anos. Pontos com N < 30 = null (sem dado).
   ============================================================ */

// [mediana bruta, N] por idade, de 24 a 68 anos
const DATA={"Agrimensura/cartografia":{"modo":"faixa","d":[[3984.33,52],[3984.33,52],[3984.33,52],[3984.33,52],[3984.33,52],[9226.06,140],[9226.06,140],[9226.06,140],[9226.06,140],[9226.06,140],[10075.04,155],[10075.04,155],[10075.04,155],[10075.04,155],[10075.04,155],[11397.25,159],[11397.25,159],[11397.25,159],[11397.25,159],[11397.25,159],[12933.72,105],[12933.72,105],[12933.72,105],[12933.72,105],[12933.72,105],[11564.13,100],[11564.13,100],[11564.13,100],[11564.13,100],[11564.13,100],[11695.09,60],[11695.09,60],[11695.09,60],[11695.09,60],[11695.09,60],[10782.22,71],[10782.22,71],[10782.22,71],[10782.22,71],[10782.22,71],[13004.6,49],[13004.6,49],[13004.6,49],[13004.6,49],[13004.6,49]]},"Agronômica/agrícola/florestal/pesca":{"modo":"idade","d":[[4968.32,242],[6156.5,395],[6937.98,513],[7940.32,595],[8355.56,737],[9249.14,813],[9286.42,823],[9680.01,874],[10286.89,834],[9954.43,837],[10971.86,871],[10982.63,817],[11049.54,820],[11691.65,810],[11567.86,866],[11575.77,713],[12154.91,726],[11734.35,660],[12309.37,614],[12204.39,606],[12925.39,601],[13072.55,568],[12693.79,492],[12499.83,447],[13261.42,425],[13196.35,358],[13252.87,331],[12395.83,321],[13052.42,291],[11948.84,279],[12921.96,268],[12984.09,299],[13511.52,262],[14041.5,283],[13140.99,264],[13357.61,252],[13296.2,248],[13728.13,267],[12972.77,198],[14454.21,177],[15394.4,178],[14258.27,167],[15229.13,157],[14920.73,131],[16417.8,139]]},"Alimentos":{"modo":"faixa","d":[[5488.94,102],[5488.94,102],[5488.94,102],[5488.94,102],[5488.94,102],[6730.03,127],[6730.03,127],[6730.03,127],[6730.03,127],[6730.03,127],[7640.16,137],[7640.16,137],[7640.16,137],[7640.16,137],[7640.16,137],[9328.35,107],[9328.35,107],[9328.35,107],[9328.35,107],[9328.35,107],[9613.08,56],[9613.08,56],[9613.08,56],[9613.08,56],[9613.08,56],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},"Ambiental":{"modo":"idade","d":[[3807.07,37],[4442.97,61],[4543.25,81],[6667.38,132],[6605.98,187],[6988.36,211],[7672.82,235],[7965.23,261],[9122.47,286],[9475.05,292],[9275.63,288],[9954.43,299],[10351.87,262],[10897.61,264],[11357.7,237],[12562.62,248],[12156.89,197],[12672.3,190],[12773.07,185],[12683.73,153],[12432.42,152],[13991.33,119],[11652.61,90],[14031.43,72],[14345.33,74],[13965.6,54],[23308.72,45],[16451.68,39],[18575.55,38],[14940.55,31],[19848.11,31],null,null,null,null,null,null,null,null,null,null,null,null,null,null]},"Bioengenharia":{"modo":"faixa","d":[null]},"Civil":{"modo":"idade","d":[[4864.46,616],[5597.03,1075],[6324.61,1645],[7276,2137],[7769.58,2824],[8347.59,3386],[8741.96,3440],[9361,3435],[9858.52,3287],[10157.48,3060],[10768.29,3040],[11016.24,2635],[11505.99,2496],[11954.38,2182],[12151.53,2049],[12559.22,1928],[12566.54,1860],[12733.89,1658],[12971.19,1651],[13363.21,1802],[13607.5,1751],[13868.26,1546],[13833.19,1523],[14364.64,1423],[14122.93,1332],[14083.74,1192],[14298.63,1112],[14543.41,1065],[14986.58,966],[15039.88,933],[14648.99,880],[14415.28,790],[14575.97,755],[15110.95,701],[15316.17,624],[15565.53,651],[15930.05,665],[16148.58,645],[16924.38,625],[15327.81,608],[15956.46,573],[15456.44,539],[16790.75,544],[16899.58,522],[15945.19,535]]},"Computação (TI)":{"modo":"idade","d":[[7132.99,806],[8416.59,1021],[9471.62,1168],[10524.19,1233],[11320.01,1386],[12375,1451],[13261.88,1425],[13686.59,1269],[13983.66,1263],[15039.68,1117],[15402.51,1185],[15828.7,1128],[16267.78,1034],[16453.61,929],[17009.52,855],[17790.54,757],[18000,709],[17178.21,625],[19352.77,539],[18571.43,563],[18494.06,563],[17984.47,469],[17973.97,388],[19150.17,309],[18820,267],[19299.56,219],[19053.66,204],[20027.74,175],[19567.58,140],[19285.43,118],[18049.56,110],[21266.67,103],[20602.94,65],[19709.8,55],[17695.01,50],[18806.57,70],[19934.36,46],[19011.67,43],null,null,null,null,null,null,null]},"Elétrica/eletrônica/telecom":{"modo":"idade","d":[[6053.6,193],[7380.48,312],[7865.35,479],[9783.64,559],[10538.8,775],[11750.83,875],[12013.9,941],[12425.6,943],[12898.54,1007],[13224.92,995],[13761.15,1021],[13893.92,1046],[14686.62,1077],[14552.32,1044],[15198.4,1108],[15567.62,1061],[16004.86,1035],[16023.19,1018],[16403.33,1031],[16646.99,1076],[16769.3,1137],[17082.57,950],[17197.05,923],[18042.41,806],[18069.79,724],[18997.31,676],[17947.24,549],[18704.28,461],[18688.77,463],[18952.31,443],[17882.37,386],[18884.62,363],[18958.31,314],[17946.65,269],[16746.5,263],[19859.09,258],[17556.52,255],[20169.59,239],[19977.92,162],[20678.48,193],[20665.36,162],[18372,124],[18683.68,136],[19265.99,101],[15745.81,100]]},"Materiais/metalurgia":{"modo":"faixa","d":[[8247.97,219],[8247.97,219],[8247.97,219],[8247.97,219],[8247.97,219],[12051.55,405],[12051.55,405],[12051.55,405],[12051.55,405],[12051.55,405],[14016,458],[14016,458],[14016,458],[14016,458],[14016,458],[15612.27,513],[15612.27,513],[15612.27,513],[15612.27,513],[15612.27,513],[17703.83,440],[17703.83,440],[17703.83,440],[17703.83,440],[17703.83,440],[19710.39,246],[19710.39,246],[19710.39,246],[19710.39,246],[19710.39,246],[19231.5,143],[19231.5,143],[19231.5,143],[19231.5,143],[19231.5,143],[25098.93,90],[25098.93,90],[25098.93,90],[25098.93,90],[25098.93,90],[29119.6,54],[29119.6,54],[29119.6,54],[29119.6,54],[29119.6,54]]},"Mecatrônica e automação":{"modo":"idade","d":[[5875.7,41],[6586.89,63],[7534.63,83],[9128.11,120],[9757.45,152],[10677.15,178],[11143.84,177],[11020.42,213],[12043.86,232],[11909.8,225],[13251.42,257],[13572.73,305],[13517.15,299],[13858.67,306],[14514.86,266],[14647.68,259],[14482.86,278],[14797.13,270],[15273.11,238],[15642.87,228],[14961.88,244],[15419.93,202],[15591,171],[15586.15,155],[16172.46,127],[16377.69,117],[15772.59,81],[15196.59,90],[15696.17,75],[15992.95,68],[16687.91,65],[16132.65,60],[15692.68,45],[15550.29,56],[15538.53,45],[17245.09,53],[16153.1,36],[17560.45,42],[16514.31,49],[17367.06,57],[18692.14,52],[18339.04,63],[17593.94,57],[16673.94,47],[18106.27,53]]},"Mecânica/aeronáutica/naval":{"modo":"idade","d":[[7542.41,254],[8844.21,494],[10187.92,683],[11155.75,832],[11524.07,1024],[12071.36,1084],[12233.71,1092],[12931.59,1136],[13115.15,1093],[13687.54,1081],[13700.83,1133],[14186.38,1208],[14618.21,1136],[15074.5,1191],[15359.52,1235],[15540.98,1190],[15873.82,1175],[16236.19,1102],[16280.59,1051],[16672.44,1069],[17432.38,1120],[17955.96,951],[17852.2,861],[17882.6,755],[18787.83,743],[18497.01,645],[18737.86,606],[18702.14,521],[18723.2,478],[19219.11,440],[18424.29,388],[18675.92,310],[18718.14,283],[19359.22,271],[19433.25,223],[19796.27,244],[21028.49,224],[20015.54,201],[22261.7,226],[23857.63,198],[21794.3,161],[24864.23,151],[19945.98,110],[18706.37,89],[19200.02,93]]},"Minas":{"modo":"faixa","d":[[12493.77,487],[12493.77,487],[12493.77,487],[12493.77,487],[12493.77,487],[13903.91,1418],[13903.91,1418],[13903.91,1418],[13903.91,1418],[13903.91,1418],[15236.29,1418],[15236.29,1418],[15236.29,1418],[15236.29,1418],[15236.29,1418],[16501.74,1262],[16501.74,1262],[16501.74,1262],[16501.74,1262],[16501.74,1262],[18067.55,883],[18067.55,883],[18067.55,883],[18067.55,883],[18067.55,883],[20710.93,421],[20710.93,421],[20710.93,421],[20710.93,421],[20710.93,421],[21903,213],[21903,213],[21903,213],[21903,213],[21903,213],[24541.54,106],[24541.54,106],[24541.54,106],[24541.54,106],[24541.54,106],[27803.12,64],[27803.12,64],[27803.12,64],[27803.12,64],[27803.12,64]]},"Produção/qualidade/segurança":{"modo":"idade","d":[[5848.98,374],[6951.81,628],[7744.42,840],[8982.15,1103],[9795.03,1384],[10289.13,1617],[10963.45,1773],[11091.98,1852],[11415.53,1803],[11815.75,1845],[12147.88,2057],[12599.87,1970],[12708.33,2131],[13223.33,2189],[13261.42,2158],[13366.61,2186],[13497.69,2108],[13700.79,2038],[13515.11,2054],[13933.18,2150],[14118.77,1899],[14181.71,1733],[14208.46,1534],[14442.04,1418],[14698.45,1192],[14591.84,1095],[14758.95,932],[15319.61,818],[15389.73,727],[15813.32,668],[15335.89,611],[15725.27,494],[15091.73,441],[15712.43,402],[16225.27,331],[15849.39,294],[16216.08,269],[15566.89,232],[16509.77,192],[15310.48,194],[17415.47,149],[16364.16,158],[14868.86,111],[13840.11,100],[13440.88,74]]},"Química":{"modo":"idade","d":[[6628.29,41],[8451.19,83],[9461.92,132],[10368.71,160],[11379.27,221],[12857.06,250],[13355.97,270],[13745.15,273],[14054.47,279],[14375.27,246],[15111.38,272],[15590.19,322],[15779.24,298],[21441.1,375],[22019.41,371],[26650.61,390],[27883.37,386],[29352.68,405],[27999.62,360],[29248.14,343],[30264.34,373],[32024.99,306],[29825.95,310],[32435.39,251],[30707.79,243],[31329.25,254],[32893.38,205],[30855.15,197],[31652.04,185],[31470.1,154],[32177.65,130],[27301.31,114],[27539.28,91],[26368.72,70],[24152.82,69],[30600.64,85],[31197.25,77],[39975.96,94],[39982.04,84],[33441.94,97],[28082.01,60],[32664.33,56],[26376.65,58],[26678.7,51],[25315.39,40]]},"Todas as engenharias":{"modo":"idade","d":[[6032.58,2665],[7198.89,4235],[7896.13,5802],[8949.79,7094],[9600.87,8996],[10353.85,10244],[10837.43,10605],[11158.35,10698],[11602.35,10503],[11924.5,10133],[12410.25,10571],[12814.04,10174],[13192.41,9950],[13607.22,9757],[13838.96,9585],[14214.6,9202],[14416.96,8882],[14507.29,8379],[14673.6,8096],[14959.19,8386],[15332.31,8186],[15474.9,7172],[15490.99,6604],[15863.04,5904],[16108.11,5371],[16186.09,4818],[16119.96,4239],[16286.55,3845],[16633.36,3514],[16561.26,3247],[16098.53,2975],[16227.81,2639],[16154.27,2349],[16292.45,2217],[16258.64,1972],[16971.72,1992],[16864.58,1886],[16960.39,1827],[17680.78,1611],[17206.65,1618],[17499.22,1418],[16599.24,1322],[17090.67,1229],[17254.75,1073],[16876.48,1074]]}};
const TODAS = 'Todas as engenharias';
const INI = 24, IDADE_MAX = 65, META = 1e6, I = Math.pow(1.06, 1 / 12) - 1;
// simulação até os 65 anos, como na página geral
for (const k in DATA) DATA[k].d = DATA[k].d.slice(0, IDADE_MAX - INI + 1);

// INSS e IRPF 2026 (Lei 15.270/2025: isento até 5 mil, redução até 7.350)
const INSS = [[1621.00, .075], [2902.84, .09], [4354.27, .12], [8475.55, .14]];
const IRPF = [[2428.80, 0, 0], [2826.65, .075, 182.16], [3751.05, .15, 394.16], [4664.68, .225, 675.49], [Infinity, .275, 908.73]];
function inss(b) { let c = 0, p = 0; for (const [t, a] of INSS) { if (b > p) { c += (Math.min(b, t) - p) * a; p = t; } } return c; }
function irpf(b) {
  const base = b - inss(b); let imp = 0;
  for (const [l, a, d] of IRPF) { if (base <= l) { imp = base * a - d; break; } }
  if (b <= 5000) return 0;
  if (b <= 7350) imp -= Math.max(0, 978.62 - 0.133145 * b);
  return Math.max(imp, 0);
}
const liq = b => b - inss(b) - irpf(b);

// d: [[bruto, N] | null] por idade; para no primeiro null (sem dado)
function simula(d, pS, p13, pf, neg) {
  let saldo = 0, juros = 0, apSal = 0, apExt = 0, apNeg = 0, meses = 0; const anos = [];
  for (let y = 0; y < d.length && d[y] && saldo < META; y++) {
    const [b, n] = d[y], ap = pS * liq(b), e13 = p13 * liq(b);
    const eF = y > 0 ? pf * (liq(b * 4 / 3) - liq(b)) : 0;
    const nm = neg && INI + y >= neg.idade ? neg.lucro * b * neg.inv : 0;
    let extAno = 0;
    for (let m = 1; m <= 12; m++) {
      const j = saldo * I; juros += j; saldo += j + ap + nm; apSal += ap; apNeg += nm;
      if (m === 6 && eF) { saldo += eF; apExt += eF; extAno += eF; }
      if (m === 12 && e13) { saldo += e13; apExt += e13; extAno += e13; }
      meses++; if (saldo >= META) break;
    }
    anos.push({ idade: INI + y, b, n, ap, extAno, nm, apSal, apExt, apNeg, juros, saldo, fim: INI + meses / 12 });
  }
  return { meses, apSal, apExt, apNeg, juros, anos, saldo, ok: saldo >= META };
}

const $ = id => document.getElementById(id);
const brl = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');
const mil = n => 'R$ ' + Math.round(n / 1000).toLocaleString('pt-BR') + ' mil';
const tempo = m => { const a = Math.floor(m / 12), r = m % 12; return a + ' anos' + (r ? ' e ' + r + (r > 1 ? ' meses' : ' mês') : ''); };

// seletor: ordenado pela mediana aos 30 anos; Bioengenharia desabilitada
const nomes = Object.keys(DATA).filter(k => k !== TODAS);
nomes.sort((a, b) => ((DATA[b].d[6] || [0])[0]) - ((DATA[a].d[6] || [0])[0]));
$('fam').innerHTML = `<option value="${TODAS}">${TODAS} (referência)</option>` +
  nomes.map(k => DATA[k].d[0] ? `<option value="${k}">${k}</option>` : `<option value="${k}" disabled>${k} (amostra insuficiente)</option>`).join('');
$('fam').value = 'Civil';

/* ---- gráfico ---- */
const W = 880, H = 420, L = 70, R = 24, T = 16, B = 40, y1 = 1100000;
const svg = $('chart'), ns = 'http://www.w3.org/2000/svg';
const el = (t, a, txt) => { const e = document.createElementNS(ns, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; };

function desenha(r, ref) {
  svg.textContent = '';
  const fimMax = Math.max(r.anos.at(-1).fim, ref ? ref.fim : 0);
  const x0 = 24, x1 = Math.max(39, Math.ceil(fimMax) + 1), passo = x1 - x0 <= 16 ? 2 : x1 - x0 <= 30 ? 4 : 5;
  const X = v => L + (v - x0) / (x1 - x0) * (W - L - R), Y = v => H - B - v / y1 * (H - T - B);
  for (let v = 0; v <= 1000000; v += 200000) {
    el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: 'rgba(22,19,14,.10)', 'stroke-width': 1 });
    el('text', { x: L - 8, y: Y(v) + 4, 'text-anchor': 'end' }, v === 0 ? '0' : (v / 1000) + ' mil');
  }
  for (let a = 24; a < x1; a += passo) el('text', { x: X(a), y: H - B + 20, 'text-anchor': 'middle' }, a + ' anos');
  const P = [{ fim: INI, apSal: 0, apExt: 0, apNeg: 0, juros: 0, saldo: 0 }, ...r.anos];
  const area = (top, bot, fill) => el('path', { fill, d: 'M' + P.map(d => X(d.fim) + ',' + Y(top(d))).join('L') + 'L' + P.slice().reverse().map(d => X(d.fim) + ',' + Y(bot(d))).join('L') + 'Z' });
  area(d => d.apSal, () => 0, 'var(--m-sal)');
  area(d => d.apSal + d.apExt, d => d.apSal, 'var(--m-ext)');
  area(d => d.apSal + d.apExt + d.apNeg, d => d.apSal + d.apExt, 'var(--m-neg)');
  area(d => d.saldo, d => d.apSal + d.apExt + d.apNeg, 'var(--m-jur)');
  if (ref) {
    const bx = X(ref.fim);
    el('line', { x1: bx, x2: bx, y1: Y(1e6), y2: H - B, stroke: 'var(--grafite)', 'stroke-width': 1, 'stroke-dasharray': '2 3', opacity: .5 });
    el('text', { x: bx + 6, y: H - B - 8, style: 'font-size:10px' }, 'todas');
  }
  el('line', { x1: L, x2: W - R, y1: Y(1e6), y2: Y(1e6), stroke: 'var(--m-meta)', 'stroke-width': 2, 'stroke-dasharray': '6 4' });
  const e = P[P.length - 1];
  el('rect', { x: X(e.fim) - 6, y: Y(e.saldo) - 6, width: 12, height: 12, fill: r.ok ? 'var(--m-meta)' : 'var(--cinza)', stroke: 'var(--grafite)', 'stroke-width': 1.5 });
  el('text', { x: Math.max(X(e.fim) - 12, L + 320), y: Y(1e6) - 12, 'text-anchor': 'end', style: 'fill:var(--grafite);font-weight:700;font-size:13px' },
    r.ok ? 'R$ 1 milhão aos ' + tempo(Math.round(e.fim * 12)) : `Aos ${r.anos.at(-1).idade + 1}: ${mil(e.saldo)}, sem chegar à meta`);
}

/* ---- estado da página ---- */
const NEG_IDS = ['nIdade', 'nLucro', 'nInv'];
function atualiza() {
  const fam = $('fam').value, D = DATA[fam].d, modo = DATA[fam].modo;
  const pS = +$('pSal').value / 100, p13 = +$('p13').value / 100, pf = +$('pf').value / 100, temNeg = $('neg').checked;
  $('oSal').textContent = $('pSal').value + '%'; $('o13').textContent = $('p13').value + '%'; $('of').textContent = $('pf').value + '%';
  const b0 = D[0][0], b1 = D[1][0], terco25 = liq(b1 * 4 / 3) - liq(b1);
  $('sSal').textContent = `Do líquido mensal. Aos 24: ${brl(pS * liq(b0))} de ${brl(liq(b0))} por mês.`;
  $('s13').textContent = `13º líquido aos 24: ${brl(liq(b0))} · investe ${brl(p13 * liq(b0))} por ano.`;
  $('sf').textContent = `⅓ de férias líquido aos 25: ${brl(terco25)} · investe ${brl(pf * terco25)} por ano.`;

  NEG_IDS.forEach(id => $(id).disabled = !temNeg);
  const nIdade = +$('nIdade').value, nLucro = +$('nLucro').value / 100, nInv = +$('nInv').value / 100;
  $('oIdade').textContent = nIdade + ' anos'; $('oLucro').textContent = $('nLucro').value + '%'; $('oInv').textContent = $('nInv').value + '%';
  const bN = D[nIdade - INI] ? D[nIdade - INI][0] : null;
  $('sLucro').textContent = bN ? `Em % do salário bruto da idade. Aos ${nIdade}: ${brl(nLucro * bN)} de lucro por mês.` : `Sem mediana da RAIS para ${nIdade} anos nesta engenharia.`;
  $('sInv').textContent = bN ? `Aos ${nIdade}: investe ${brl(nLucro * bN * nInv)} por mês do negócio.` : '';
  const neg = temNeg && nLucro > 0 && nInv > 0 ? { idade: nIdade, lucro: nLucro, inv: nInv } : null;

  const r = simula(D, pS, p13, pf, neg);
  const ref = fam === TODAS ? null : simula(DATA[TODAS].d, pS, p13, pf, neg);
  const kNull = D.findIndex(x => !x), ultIdade = kNull < 0 ? INI + D.length - 1 : INI + kNull - 1;

  $('famInfo').textContent = (modo === 'idade' ? 'Mediana de cada idade exata' : 'Mediana por faixa de 5 anos (amostra pequena por idade)') +
    ` · aos 24: ${brl(D[0][0])} (N = ${D[0][1].toLocaleString('pt-BR')}) · aos 30: ${brl(D[6][0])} (N = ${D[6][1].toLocaleString('pt-BR')})` +
    (ultIdade < IDADE_MAX ? ` · dados até ${ultIdade} anos` : '');
  $('origem').textContent = `Simulador · RAIS 2025 · ${fam}`;

  const extras = [];
  if (p13 || pf) extras.push(`investe ${$('p13').value}% do 13º e ${$('pf').value}% do ⅓ de férias`);
  if (neg) extras.push(`a partir dos ${nIdade} investe ${$('nInv').value}% do lucro de um negócio paralelo que rende ${$('nLucro').value}% do salário`);
  const quem = fam === TODAS ? 'Engenheiro CLT' : `Engenheiro CLT de ${fam}`;
  const base = `${quem} que começa a poupar aos 24, ganha a mediana salarial da sua idade, guarda ${$('pSal').value}% do líquido mensal` +
    (extras.length ? ', ' + extras.join(', ') : '') + ' e rende 6% ao ano acima da inflação. ';
  const idadeFim = r.anos.at(-1).idade + 1;

  $('aviso').hidden = r.ok || ultIdade >= IDADE_MAX;
  if (r.ok) {
    $('lede').innerHTML = base + `<strong>Chega a R$ 1 milhão (em reais de setembro de 2026) em ${tempo(r.meses)}.</strong>`;
    $('t-k').textContent = 'Milionário aos';
    $('t-idade').textContent = Math.floor((INI * 12 + r.meses) / 12) + ' anos';
    $('t-tempo').textContent = (r.meses / 12).toFixed(1).replace('.', ',') + ' anos';
    $('t-meses').textContent = r.meses + ' meses de aportes';
  } else {
    $('lede').innerHTML = base + '<strong>' + (ultIdade < IDADE_MAX
      ? `Não chega a R$ 1 milhão enquanto há dado da RAIS para esta engenharia: aos ${idadeFim} tem ${brl(r.saldo)}.`
      : `Trabalhando até os 65 anos, não chega a R$ 1 milhão: aos 66 tem ${brl(r.saldo)} em reais de setembro de 2026.`) + '</strong>';
    $('aviso').textContent = `A RAIS tem menos de 30 vínculos de ${fam} a partir dos ${ultIdade + 1} anos. A simulação para aí em vez de supor um salário. Aumente os aportes para ver a meta dentro do período com dado.`;
    $('t-k').textContent = `Aos ${idadeFim} anos tem`;
    $('t-idade').textContent = mil(r.saldo);
    $('t-tempo').textContent = 'Não atinge';
    $('t-meses').textContent = ultIdade < IDADE_MAX ? 'no período com dado da RAIS' : 'trabalhando até os 65';
  }
  if (ref && r.ok && ref.ok) {
    const d = ref.meses - r.meses;
    const ms = n => n + (n > 1 ? ' meses' : ' mês');
    $('t-delta').textContent = d > 0 ? `${ms(d)} antes da mediana geral` : d < 0 ? `${ms(-d)} depois da mediana geral` : 'igual à mediana geral';
  } else $('t-delta').textContent = fam === TODAS ? 'referência geral' : r.ok ? 'mediana geral não chega' : 'meta não atingida';

  $('t-sal').textContent = mil(r.apSal); $('t-ext').textContent = mil(r.apExt); $('t-jur').textContent = mil(r.juros);
  $('t-jurp').textContent = `${Math.round(r.juros / r.saldo * 100)}% do patrimônio final`;
  $('t-negbox').hidden = !neg; $('lg-neg').hidden = !neg; $('t-neg').textContent = mil(r.apNeg);
  $('lg-ref').hidden = !ref || !ref.ok;

  $('rows').innerHTML = r.anos.map((a, i) => {
    const last = i === r.anos.length - 1 && r.ok, parc = last && r.meses % 12;
    return `<tr${last ? ' class="fim"' : ''}><td>${a.idade}${parc ? ' (' + parc + (parc > 1 ? ' meses)' : ' mês)') : ''}</td><td>${brl(a.b)}</td><td>${a.n.toLocaleString('pt-BR')}</td><td>${brl(a.ap)}</td>` +
      `<td>${a.extAno ? brl(a.extAno) : '–'}</td><td>${a.nm ? brl(a.nm) : '–'}</td><td>${brl(a.apSal + a.apExt + a.apNeg)}</td><td>${brl(a.juros)}</td><td>${brl(a.saldo)}</td></tr>`;
  }).join('');
  desenha(r, ref && ref.ok ? { fim: INI + ref.meses / 12 } : null);
}

['fam', 'pSal', 'p13', 'pf', 'neg', ...NEG_IDS].forEach(id => $(id).addEventListener('input', atualiza));
['fam', 'neg'].forEach(id => $(id).addEventListener('change', atualiza));
$('reset').addEventListener('click', () => { $('pSal').value = 50; $('p13').value = 0; $('pf').value = 0; $('neg').checked = false; atualiza(); });
atualiza();
