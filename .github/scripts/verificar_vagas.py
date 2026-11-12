"""Verificação diária do vagas.json: tira do ar as vagas que já fecharam.

Roda no GitHub Actions (.github/workflows/verificar-vagas.yml), todo dia.
Só biblioteca padrão do Python — nada para instalar.

Versão autônoma do comando `verificar-lp` do Radar (pasta Oportunidades,
radar/pipeline/verificar_lp.py). Se mudar uma regra aqui, mude lá também.

Por que checar ao vivo: o prazo gravado no vagas.json NÃO diz se a vaga
está no ar. Caso real (2026-11-11): SPL Engenharia com prazo 31/12 já
estava fechada na Gupy, enquanto SERENG seguia "publicada" com as
inscrições encerradas.

Regras, em ordem:
1. Vaga da Gupy: status != "published" => remover. Senão vale o prazo
   real de inscrição (registerEndDate), que substitui o do JSON.
2. Link responde 404/410 => remover.
3. Prazo (o da Gupy, se houver; senão o do JSON) já passou => remover.
4. Falha de rede/servidor => MANTER e relatar (instabilidade passageira não
   pode apagar vaga boa). A regra 3 continua valendo com o prazo do JSON.

Uso:
    python .github/scripts/verificar_vagas.py [vagas.json] [--simular]
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit

RAIZ = Path(__file__).resolve().parents[2]
HISTORICO = RAIZ / ".github" / "vagas_removidas.json"
USER_AGENT = "Mozilla/5.0 (verificador de vagas williammoura.com.br)"
_NEXT_DATA = re.compile(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.DOTALL)


@dataclass(frozen=True)
class Checagem:
    tipo: str  # "gupy" | "http" | "erro"
    aberta: bool | None = None
    prazo: date | None = None
    codigo_http: int | None = None
    detalhe: str = ""


@dataclass(frozen=True)
class Decisao:
    remover: bool
    motivo: str
    prazo_novo: date | None = None


def hoje_brasil() -> date:
    return datetime.now(timezone(timedelta(hours=-3))).date()


def eh_gupy(url: str) -> bool:
    partes = urlsplit(url)
    return partes.netloc.lower().endswith(".gupy.io") and "/job/" in partes.path


def parse_estado_gupy(html: str) -> tuple[bool, date | None]:
    """(aberta, prazo) a partir do JSON que a página da vaga embute."""
    m = _NEXT_DATA.search(html)
    if m is None:
        raise ValueError("página sem __NEXT_DATA__")
    job = json.loads(m.group(1))["props"]["pageProps"]["job"]
    fim = job.get("registerEndDate")
    prazo = date.fromisoformat(fim[:10]) if isinstance(fim, str) and fim else None
    return job["status"] == "published", prazo


def baixar(url: str) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status, resp.read().decode("utf-8", errors="replace")


def checar_url(url: str) -> Checagem:
    try:
        codigo, corpo = baixar(url)
    except urllib.error.HTTPError as exc:
        return Checagem("http", codigo_http=exc.code)
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return Checagem("erro", detalhe=type(exc).__name__)
    if eh_gupy(url):
        try:
            aberta, prazo = parse_estado_gupy(corpo)
        except (KeyError, TypeError, ValueError) as exc:
            return Checagem("erro", detalhe=f"página da Gupy mudou: {type(exc).__name__}")
        return Checagem("gupy", aberta=aberta, prazo=prazo)
    return Checagem("http", codigo_http=codigo)


def _prazo_json(vaga: dict) -> date | None:
    bruto = vaga.get("prazo")
    return date.fromisoformat(bruto[:10]) if isinstance(bruto, str) and bruto else None


def decidir(vaga: dict, checagem: Checagem, hoje: date) -> Decisao:
    prazo_atual = _prazo_json(vaga)

    if checagem.tipo == "gupy":
        if not checagem.aberta:
            return Decisao(True, "fechada na Gupy (candidaturas encerradas)")
        if checagem.prazo is not None and checagem.prazo < hoje:
            return Decisao(True, f"inscrições encerradas em {checagem.prazo.isoformat()}")
        novo = checagem.prazo if checagem.prazo != prazo_atual else None
        motivo = "aberta na Gupy" + (f" (prazo atualizado para {novo})" if novo else "")
        return Decisao(False, motivo, prazo_novo=novo)

    if checagem.tipo == "http" and checagem.codigo_http in (404, 410):
        return Decisao(True, f"link não existe mais (HTTP {checagem.codigo_http})")

    if prazo_atual is not None and prazo_atual < hoje:
        return Decisao(True, f"prazo vencido em {prazo_atual.isoformat()}")

    if checagem.tipo == "erro":
        return Decisao(False, f"não deu para verificar ({checagem.detalhe}) — mantida")
    return Decisao(False, f"link no ar (HTTP {checagem.codigo_http}); prazo não vencido")


def verificar(vagas: list[dict], checar, hoje: date):
    """Devolve (mantidas, removidas[(vaga, motivo)], mantidas_com_motivo, mudou)."""
    mantidas, removidas, notas = [], [], []
    mudou = False
    for vaga in vagas:
        url = vaga.get("url")
        checagem = checar(url) if isinstance(url, str) and url else Checagem("erro", detalhe="sem url")
        d = decidir(vaga, checagem, hoje)
        if d.remover:
            removidas.append((vaga, d.motivo))
            mudou = True
            continue
        if d.prazo_novo is not None:
            vaga = {**vaga, "prazo": d.prazo_novo.isoformat()}
            mudou = True
        mantidas.append(vaga)
        notas.append((vaga, d.motivo))
    return mantidas, removidas, notas, mudou


def relatorio(removidas, notas, hoje: date) -> str:
    linhas = [f"# Verificação do vagas.json — {hoje.isoformat()}", ""]
    linhas += [f"No ar: {len(notas)} · removidas: {len(removidas)}", ""]
    for titulo, itens in (("Removidas", removidas), ("Mantidas", notas)):
        if itens:
            linhas += [f"## {titulo}", ""]
            linhas += [f"- **{v.get('id')}** {v.get('cargo')} — {v.get('empresa')}: {m}" for v, m in itens]
            linhas.append("")
    return "\n".join(linhas) + "\n"


def main(argv: list[str]) -> int:
    simular = "--simular" in argv
    args = [a for a in argv if not a.startswith("--")]
    caminho = Path(args[0]) if args else RAIZ / "vagas.json"
    hoje = hoje_brasil()

    vagas = json.loads(caminho.read_text(encoding="utf-8"))

    def checar_com_pausa(url: str) -> Checagem:
        time.sleep(1)  # educado com os sites: 1 requisição por segundo
        return checar_url(url)

    mantidas, removidas, notas, mudou = verificar(vagas, checar_com_pausa, hoje)

    texto = relatorio(removidas, notas, hoje)
    print(texto)
    if resumo := os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(resumo, "a", encoding="utf-8") as f:
            f.write(texto)
    if saida := os.environ.get("GITHUB_OUTPUT"):
        ids = ", ".join(str(v.get("id")) for v, _ in removidas) or "nenhuma"
        with open(saida, "a", encoding="utf-8") as f:
            f.write(f"removidas={ids}\n")

    if not mudou or simular:
        print("Simulação: nada foi gravado." if simular else "Nada mudou no vagas.json.")
        return 0

    caminho.write_text(json.dumps(mantidas, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if removidas:
        historico = json.loads(HISTORICO.read_text(encoding="utf-8")) if HISTORICO.exists() else []
        historico += [
            {"removida_em": hoje.isoformat(), "motivo": m, "vaga": v} for v, m in removidas
        ]
        HISTORICO.write_text(
            json.dumps(historico, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    print(f"vagas.json atualizado ({len(removidas)} removida(s)).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
