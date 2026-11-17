"""
Servidor do jogo "A Masmorra do Pythonildo".

- Serve os arquivos do jogo (index.html, style.css, *.js)
- Guarda o RANKING DA TURMA no arquivo ranking.json

Como usar (só biblioteca padrão do Python, nada para instalar):
    python servidor.py
Depois os alunos abrem no navegador o endereço que aparecer no terminal,
por exemplo  http://192.168.0.10:8080   (todos na mesma rede/Wi-Fi).

Para zerar o ranking: apague o arquivo ranking.json.
"""
import json
import os
import re
import socket
import threading
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

PORTA = 8080
PASTA = os.path.dirname(os.path.abspath(__file__))
ARQUIVO = os.path.join(PASTA, "ranking.json")
CLASSES_OK = {"guerreiro", "ladino", "mago", "clerigo", "barbaro"}
RACAS_OK = {"humano", "elfo", "anao", "halfling", "orc", "goblin", "draconato", "morto_vivo", "vampiro"}   # mesmas de racas.js
trava = threading.Lock()  # evita dois alunos gravando ao mesmo tempo


def ler_ranking():
    try:
        with open(ARQUIVO, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def salvar_ranking(lista):
    lista.sort(key=lambda e: (-e["score"], -e["andar"], e["data"]))  # maior pontuação primeiro
    with open(ARQUIVO, "w", encoding="utf-8") as f:
        json.dump(lista[:300], f, ensure_ascii=False, indent=2)


def limpar(dados):
    """Valida e limpa os dados vindos do navegador (nunca confie no cliente!)."""
    if dados.get("classe") not in CLASSES_OK:
        raise ValueError("classe inválida")
    inteiro = lambda k, maximo=10**6: max(0, min(int(dados.get(k, 0)), maximo))
    item = dados.get("item")
    if isinstance(item, dict):
        item = {"nome": str(item.get("nome", ""))[:60], "raridade": max(0, min(int(item.get("raridade", 0)), 4))}
    else:
        item = None
    # listas de "códigos" (ids de conquistas e modificadores): só letras minúsculas e _
    def codigos(k, maximo):
        lista = dados.get(k)
        if not isinstance(lista, list):
            return []
        validos = [c for c in lista if isinstance(c, str) and re.fullmatch(r"[a-z_0-9]{1,24}", c)]
        return validos[:maximo]   # primeiro filtra, depois limita (um código ruim não pode ocupar a vaga de um bom)
    dia = str(dados.get("dia", ""))
    return {
        "id": str(dados.get("id", ""))[:20],
        "epitafio": str(dados.get("epitafio", ""))[:200],
        "titulo": str(dados.get("titulo", ""))[:40],
        "conq": codigos("conq", 60),
        "mods": codigos("mods", 5),
        "aliados": codigos("aliados", 2),
        "mult": inteiro("mult", 1000),
        "modo": "diario" if dados.get("modo") == "diario" else "normal",
        "dia": dia if re.fullmatch(r"\d{4}-\d{2}-\d{2}", dia) else "",
        "nome": str(dados.get("nome", "Anônimo")).strip()[:20] or "Anônimo",
        "classe": dados["classe"],
        "raca": dados.get("raca") if dados.get("raca") in RACAS_OK else "",
        "andar": inteiro("andar", 500),
        "score": inteiro("score"),
        "nivel": inteiro("nivel", 200),
        "kills": inteiro("kills", 5000),
        "chefes": inteiro("chefes", 200),
        "item": item,
        "causa": str(dados.get("causa", ""))[:80],
        "data": datetime.now().isoformat(timespec="seconds"),
    }


""" ---------- Oficina do Aprendiz: criações da turma (inimigos e itens) ----------
O navegador manda os dados do inimigo/item. O servidor NUNCA guarda código: só números e textos
curtos, depois de checar cada campo. Cada criação tem um "token" secreto do autor, usado para retirá-la.
Para apagar tudo (ou uma criação ofensiva): edite ou apague o arquivo oficina.json. """
OFICINA = os.path.join(PASTA, "oficina.json")
TRACOS_OK = {"", "veneno", "rouba_ouro", "rouba_vida", "esquiva"}
SLOTS_OK = {"arma", "armadura", "amuleto"}
TAGS_OK = {"", "cozinha", "familia", "sorte", "arcano", "sombra", "ouro", "fogo", "pesado", "sagrado", "noite"}
MODS_OK = {"for", "des", "int", "vit", "sor", "hp", "en", "crit", "esq", "acerto", "ca", "ouro", "roubaVida"}
# mesmo equilíbrio da Oficina (oficina.js): máximo de "cliques" por bônus, custo de cada clique e orçamento por raridade
MAX_PASSOS = {"for": 6, "des": 6, "int": 6, "vit": 6, "sor": 6, "hp": 10, "en": 5, "crit": 7, "esq": 7, "acerto": 4, "ca": 3, "ouro": 5, "roubaVida": 4}
CUSTO_PASSO = {"acerto": 2, "ca": 3}   # os outros custam 1
ORCAMENTO = [2, 5, 8, 12, 18]
MAX_OFICINA = 400


def ler_oficina():
    try:
        with open(OFICINA, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def salvar_oficina(lista):
    with open(OFICINA, "w", encoding="utf-8") as f:
        json.dump(lista[-MAX_OFICINA:], f, ensure_ascii=False, indent=2)


def texto(v, n):
    return re.sub(r"[\x00-\x1f<>]", "", str(v if v is not None else "")).strip()[:n]


def numero(v, minimo, maximo, padrao):
    try:
        x = float(v)
    except (TypeError, ValueError):
        return padrao
    return max(minimo, min(maximo, round(x, 2)))


def limpar_criacao(tipo, d):
    """Valida os campos de um inimigo ou item. Levanta ValueError se algo estiver errado."""
    if not isinstance(d, dict):
        raise ValueError("dados inválidos")
    nome = texto(d.get("nome"), 40)
    if not nome:
        raise ValueError("falta o nome")
    if tipo == "inimigo":
        icone = "".join(c for c in str(d.get("icone", "")) if c not in "<>&\"'`\\")[:12] or "👹"
        traco = d.get("traco") or ""
        ritmo = int(numero(d.get("ritmo"), 0, 3, 0))
        return {
            "nome": nome, "icone": icone, "min": int(numero(d.get("min"), 1, 9, 1)),
            "hp": numero(d.get("hp"), 0.5, 2.5, 1), "atk": numero(d.get("atk"), 0.5, 2, 1), "def": numero(d.get("def"), 0.5, 2, 1),
            "traco": traco if traco in TRACOS_OK else "", "ritmo": ritmo if ritmo in (0, 2, 3) else 0, "fala": texto(d.get("fala"), 80),
        }
    slot = d.get("slot")
    if slot not in SLOTS_OK:
        raise ValueError("tipo de item inválido")
    passos = {}
    if isinstance(d.get("passos"), dict):
        for k, v in d["passos"].items():
            if k in MODS_OK:
                n = int(numero(v, 0, MAX_PASSOS[k], 0))
                if n:
                    passos[k] = n
    raridade = int(numero(d.get("raridade"), 0, 4, 0))
    if sum(n * CUSTO_PASSO.get(k, 1) for k, n in passos.items()) > ORCAMENTO[raridade]:
        raise ValueError("bônus além do orçamento da raridade")
    tag = d.get("tag") or ""
    return {
        "nome": nome, "slot": slot, "raridade": raridade,
        "classe": d.get("classe") if slot == "arma" and d.get("classe") in CLASSES_OK else ("guerreiro" if slot == "arma" else ""),
        "passos": passos, "tag": tag if tag in TAGS_OK else "", "flavor": texto(d.get("flavor"), 100),
    }


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PASTA, **kwargs)

    def responder_json(self, codigo, obj):
        corpo = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corpo)

    def eh_professor(self):
        """Só o computador que roda o servidor (localhost ou o próprio IP dele) pode apagar coisas."""
        ip = self.client_address[0]
        try:
            meu = self.connection.getsockname()[0]
        except OSError:
            meu = ""
        return ip in ("127.0.0.1", "::1", "::ffff:127.0.0.1") or (ip == meu and ip != "")

    def do_GET(self):
        if self.path.split("?")[0] == "/api/professor":
            self.responder_json(200, {"admin": self.eh_professor()})
        elif self.path.split("?")[0] == "/api/rank":
            with trava:
                self.responder_json(200, ler_ranking())
        elif self.path.split("?")[0] == "/api/oficina":
            with trava:
                lista = ler_oficina()
            publico = lambda e: {k: e[k] for k in ("id", "tipo", "autor", "data", "dados") if k in e}   # nunca devolve o token
            self.responder_json(200, {
                "inimigos": [publico(e) for e in lista if e.get("tipo") == "inimigo"],
                "itens": [publico(e) for e in lista if e.get("tipo") == "item"],
            })
        elif self.path.split("?")[0] in ("/ranking.json", "/servidor.py", "/oficina.json"):
            self.send_error(404)  # não expõe esses arquivos
        else:
            super().do_GET()

    def do_DELETE(self):
        """Retira uma criação da turma (só quem tem o token do autor consegue)."""
        url = urlparse(self.path)
        q = parse_qs(url.query)
        cid, token = (q.get("id") or [""])[0], (q.get("token") or [""])[0]
        if url.path == "/api/rank":                      # MODO PROFESSOR: apagar uma partida ou zerar o ranking
            if not self.eh_professor():
                return self.responder_json(403, {"erro": "só no computador do professor"})
            with trava:
                if (q.get("todos") or [""])[0] == "1":
                    salvar_ranking([])
                else:
                    lista = ler_ranking()
                    nova = [e for e in lista if e.get("id") != cid]
                    if len(nova) == len(lista):
                        return self.responder_json(404, {"erro": "não encontrada"})
                    salvar_ranking(nova)
            return self.responder_json(200, {"ok": True})
        if url.path != "/api/oficina":
            return self.send_error(404)
        admin = (q.get("admin") or [""])[0] == "1"
        if admin and not self.eh_professor():
            return self.responder_json(403, {"erro": "só no computador do professor"})
        with trava:
            if admin and (q.get("todos") or [""])[0] == "1":   # professor zera a Oficina
                salvar_oficina([])
                return self.responder_json(200, {"ok": True})
            lista = ler_oficina()
            alvo = next((e for e in lista if e.get("id") == cid), None)
            if alvo is None:
                return self.responder_json(404, {"erro": "não encontrada"})
            if not admin and (not token or alvo.get("token") != token):
                return self.responder_json(403, {"erro": "token errado"})
            lista.remove(alvo)
            salvar_oficina(lista)
        self.responder_json(200, {"ok": True})

    def do_POST(self):
        if self.path == "/api/oficina":
            return self.publicar_oficina()
        if self.path != "/api/rank":
            return self.send_error(404)
        try:
            tamanho = int(self.headers.get("Content-Length", 0))
            if tamanho > 6000:
                raise ValueError("pedido grande demais")
            entrada = limpar(json.loads(self.rfile.read(tamanho)))
        except (ValueError, TypeError, json.JSONDecodeError) as erro:
            return self.responder_json(400, {"erro": str(erro)})
        with trava:
            lista = ler_ranking()
            if not any(e.get("id") == entrada["id"] for e in lista):
                lista.append(entrada)
                salvar_ranking(lista)
        self.responder_json(201, {"ok": True})

    def publicar_oficina(self):
        try:
            tamanho = int(self.headers.get("Content-Length", 0))
            if tamanho > 4000:
                raise ValueError("pedido grande demais")
            corpo = json.loads(self.rfile.read(tamanho))
            tipo, cid, token = corpo.get("tipo"), str(corpo.get("id", "")), str(corpo.get("token", ""))
            if tipo not in ("inimigo", "item"):
                raise ValueError("tipo inválido")
            if not re.fullmatch(r"c_[a-z0-9]{4,10}", cid):
                raise ValueError("id inválido")
            if not 8 <= len(token) <= 40:
                raise ValueError("token inválido")
            autor = texto(corpo.get("autor"), 20)
            if not autor:
                raise ValueError("falta o autor")
            dados = limpar_criacao(tipo, corpo.get("dados"))
        except (ValueError, TypeError, AttributeError, json.JSONDecodeError) as erro:
            return self.responder_json(400, {"erro": str(erro)})
        with trava:
            lista = ler_oficina()
            antigo = next((e for e in lista if e.get("id") == cid), None)
            if antigo is not None and antigo.get("token") != token:
                return self.responder_json(403, {"erro": "essa criação é de outra pessoa"})
            if antigo is not None:
                lista.remove(antigo)
            lista.append({"id": cid, "tipo": tipo, "autor": autor, "token": token, "dados": dados, "data": datetime.now().isoformat(timespec="seconds")})
            salvar_oficina(lista)
        self.responder_json(201, {"ok": True})

    def log_message(self, formato, *args):
        pass  # terminal limpo


def meu_ip():
    try:
        return socket.gethostbyname(socket.gethostname())
    except OSError:
        return "SEU-IP"


if __name__ == "__main__":
    servidor = ThreadingHTTPServer(("0.0.0.0", PORTA), Handler)
    print("=" * 56)
    print("  A Masmorra do Pythonildo — servidor no ar!")
    print(f"  Neste computador:  http://localhost:{PORTA}")
    print(f"  Alunos na rede:    http://{meu_ip()}:{PORTA}")
    print("  Ctrl+C para encerrar.")
    print("=" * 56)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
