"""
Testes do servidor.py — só biblioteca padrão do Python (unittest), nada para instalar.

    python testes_servidor.py

Eles NÃO mexem no seu ranking.json nem no oficina.json de verdade: o servidor de teste
usa uma pasta temporária e uma porta livre qualquer.

Além de testar a API, conferem se as regras do SERVIDOR (orçamento de itens, classes, temas…)
batem com as do NAVEGADOR (oficina.js, dados.js, sinergias.js). Se um dia alguém mudar só um dos
lados, o teste avisa!
"""
import json
import os
import re
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

sys.dont_write_bytecode = True
PASTA = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PASTA)
import servidor  # noqa: E402  (importar não liga o servidor: ele só liga quando rodamos servidor.py)


def ler(nome):
    with open(os.path.join(PASTA, nome), encoding="utf-8") as f:
        return f.read()


class ServidorDeTeste(unittest.TestCase):
    """Liga um servidor de verdade numa porta livre, com arquivos de ranking/oficina temporários."""

    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        servidor.ARQUIVO = os.path.join(cls.tmp.name, "ranking.json")
        servidor.OFICINA = os.path.join(cls.tmp.name, "oficina.json")
        cls.http = ThreadingHTTPServer(("127.0.0.1", 0), servidor.Handler)
        cls.base = f"http://127.0.0.1:{cls.http.server_address[1]}"
        threading.Thread(target=cls.http.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        cls.tmp.cleanup()

    def setUp(self):  # cada teste começa com tudo vazio
        for arq in (servidor.ARQUIVO, servidor.OFICINA):
            if os.path.exists(arq):
                os.remove(arq)

    def pedido(self, metodo, caminho, corpo=None, bruto=None):
        dados = bruto if bruto is not None else (json.dumps(corpo, ensure_ascii=False).encode("utf-8") if corpo is not None else None)
        r = urllib.request.Request(self.base + caminho, data=dados, method=metodo, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(r) as x:
                texto = x.read()
                return x.status, (json.loads(texto) if texto[:1] in (b"{", b"[") else texto)
        except urllib.error.HTTPError as e:
            texto = e.read()
            return e.code, (json.loads(texto) if texto[:1] in (b"{", b"[") else texto)


def partida(i, **extra):
    d = {"id": f"p{i:03d}", "nome": f"Aluno{i}", "classe": "mago", "andar": 5 + i, "score": 500 + 100 * i, "nivel": 3, "kills": 5, "chefes": 1, "causa": "Derrotado por X"}
    d.update(extra)
    return d


class TestesDoRanking(ServidorDeTeste):
    def test_aceita_partida_valida_e_ordena_por_pontuacao(self):
        for i in (1, 3, 2):
            self.assertEqual(self.pedido("POST", "/api/rank", partida(i))[0], 201)
        _, lista = self.pedido("GET", "/api/rank")
        self.assertEqual([e["id"] for e in lista], ["p003", "p002", "p001"])

    def test_recusa_dados_ruins(self):
        self.assertEqual(self.pedido("POST", "/api/rank", partida(1, classe="hacker"))[0], 400)
        self.assertEqual(self.pedido("POST", "/api/rank", bruto=b"isso nao e json")[0], 400)
        self.assertEqual(self.pedido("POST", "/api/rank", bruto=b"x" * 7000)[0], 400, "corpo grande demais")

    def test_guarda_a_raca_so_se_ela_existir_e_aceita_muitas_conquistas(self):
        self.pedido("POST", "/api/rank", partida(1, raca="vampiro", conq=["c%d" % n for n in range(40)]))
        self.pedido("POST", "/api/rank", partida(2, raca="<script>"))
        self.pedido("POST", "/api/rank", partida(3))
        lista = {e["id"]: e for e in self.pedido("GET", "/api/rank")[1]}
        self.assertEqual(lista["p001"]["raca"], "vampiro")
        self.assertEqual(len(lista["p001"]["conq"]), 40)
        self.assertEqual(lista["p002"]["raca"], "", "raça inventada é descartada")
        self.assertEqual(lista["p003"]["raca"], "", "ranking antigo, sem raça")

    def test_racas_do_servidor_sao_as_mesmas_do_jogo(self):
        import re
        with open(os.path.join(servidor.PASTA, "racas.js"), encoding="utf-8") as f:
            js = f.read()
        ids = set(re.findall(r"^  ([a-z_]+): [{] nome: '[^']+', icone:", js, re.M))
        self.assertEqual(servidor.RACAS_OK, ids)

    def test_limita_numeros_e_limpa_textos(self):
        self.pedido("POST", "/api/rank", partida(1, andar=10**9, score=-5, nome="  " + "x" * 50, mods=["vidro", "<script>"], conq=["ok_1", "tem espaço"], modo="hack", dia="ontem"))
        e = self.pedido("GET", "/api/rank")[1][0]
        self.assertEqual((e["andar"], e["score"], len(e["nome"]), e["mods"], e["conq"], e["modo"], e["dia"]), (500, 0, 20, ["vidro"], ["ok_1"], "normal", ""))

    def test_ignora_o_mesmo_id_duas_vezes(self):
        self.pedido("POST", "/api/rank", partida(1))
        self.pedido("POST", "/api/rank", partida(1, score=99999))
        _, lista = self.pedido("GET", "/api/rank")
        self.assertEqual(len(lista), 1)
        self.assertEqual(lista[0]["score"], 600)

    def test_professor_apaga_uma_partida_e_zera_tudo(self):
        for i in (1, 2, 3):
            self.pedido("POST", "/api/rank", partida(i))
        self.assertEqual(self.pedido("DELETE", "/api/rank?id=p002")[0], 200)
        self.assertEqual(len(self.pedido("GET", "/api/rank")[1]), 2)
        self.assertEqual(self.pedido("DELETE", "/api/rank?id=nao-existe")[0], 404)
        self.assertEqual(self.pedido("DELETE", "/api/rank?todos=1")[0], 200)
        self.assertEqual(self.pedido("GET", "/api/rank")[1], [])

    def test_arquivos_sensiveis_nao_sao_servidos(self):
        for caminho in ("/ranking.json", "/oficina.json", "/servidor.py"):
            self.assertEqual(self.pedido("GET", caminho)[0], 404, caminho)

    def test_jogo_e_testes_sao_servidos(self):
        for caminho in ("/", "/index.html", "/testes.html", "/dados.js"):
            self.assertEqual(self.pedido("GET", caminho)[0], 200, caminho)


def criacao(tipo="inimigo", cid="c_abc123", token="tokenAna12345", autor="Ana", **dados):
    base = {"nome": "Pastel Zumbi", "icone": "🥟", "min": 2, "hp": 1.5, "atk": 1.2, "def": 1} if tipo == "inimigo" else {"nome": "Colher", "slot": "arma", "raridade": 2, "classe": "clerigo", "passos": {"vit": 2}}
    base.update(dados)
    return {"tipo": tipo, "id": cid, "autor": autor, "token": token, "dados": base}


class TestesDaOficina(ServidorDeTeste):
    def test_publicar_e_listar_sem_expor_token(self):
        self.assertEqual(self.pedido("POST", "/api/oficina", criacao())[0], 201)
        self.assertEqual(self.pedido("POST", "/api/oficina", criacao("item", "c_item01"))[0], 201)
        _, j = self.pedido("GET", "/api/oficina")
        self.assertEqual((len(j["inimigos"]), len(j["itens"])), (1, 1))
        self.assertFalse(any("token" in e for e in j["inimigos"] + j["itens"]), "o token nunca pode sair do servidor")

    def test_sanitiza_html_e_limita_valores(self):
        self.pedido("POST", "/api/oficina", criacao(cid="c_xss001", nome="<script>alert(1)</script>Boss", icone="<img src=x>", min=99, hp=999, atk=-5, traco="fogo", ritmo=7, fala="oi<b>"))
        d = self.pedido("GET", "/api/oficina")[1]["inimigos"][0]["dados"]
        self.assertNotIn("<", json.dumps(d))
        self.assertEqual((d["min"], d["hp"], d["atk"], d["traco"]), (9, 2.5, 0.5, ""))

    def test_recusa_pedidos_invalidos(self):
        casos = [(criacao(cid="../../x"), "id"), (criacao(token="abc"), "token curto"), (criacao(nome="   "), "sem nome"), (criacao(autor=""), "sem autor"),
                 (dict(criacao(), tipo="script"), "tipo"), (criacao("item", "c_item02", slot="capacete"), "slot"), (criacao("item", "c_item03", raridade=0, passos={"for": 6}), "além do orçamento"), (dict(criacao(), dados="texto"), "dados não-objeto")]
        for corpo, motivo in casos:
            self.assertEqual(self.pedido("POST", "/api/oficina", corpo)[0], 400, motivo)

    def test_so_o_dono_atualiza_ou_retira(self):
        self.pedido("POST", "/api/oficina", criacao())
        self.assertEqual(self.pedido("POST", "/api/oficina", criacao(token="tokenZe123456", autor="Zé"))[0], 403, "outro aluno tentando sobrescrever")
        self.assertEqual(self.pedido("POST", "/api/oficina", criacao(nome="Pastel v2"))[0], 201, "o dono atualiza")
        self.assertEqual(self.pedido("DELETE", "/api/oficina?id=c_abc123&token=errado")[0], 403)
        self.assertEqual(self.pedido("DELETE", "/api/oficina?id=c_abc123&token=tokenAna12345")[0], 200)
        self.assertEqual(self.pedido("DELETE", "/api/oficina?id=c_abc123&token=tokenAna12345")[0], 404)

    def test_professor_remove_sem_token_e_zera(self):
        self.pedido("POST", "/api/oficina", criacao())
        self.pedido("POST", "/api/oficina", criacao(cid="c_bbb222", token="tokenBBBBBB22"))
        self.assertEqual(self.pedido("DELETE", "/api/oficina?id=c_abc123&admin=1")[0], 200)
        self.assertEqual(self.pedido("DELETE", "/api/oficina?todos=1")[0], 404, "todos=1 só vale com admin=1")
        self.assertEqual(self.pedido("DELETE", "/api/oficina?todos=1&admin=1")[0], 200)
        self.assertEqual(self.pedido("GET", "/api/oficina")[1], {"inimigos": [], "itens": []})

    def test_quem_e_professor(self):
        self.assertEqual(self.pedido("GET", "/api/professor")[1], {"admin": True}, "o teste roda no próprio computador")


class TestesDeAcesso(unittest.TestCase):
    """eh_professor(): só o computador do servidor (localhost ou o próprio IP) pode apagar."""

    class FalsoSocket:
        def __init__(self, ip):
            self.ip = ip

        def getsockname(self):
            return (self.ip, 8080)

    class Falso:
        def __init__(self, cliente, meu_ip):
            self.client_address = (cliente, 5555)
            self.connection = TestesDeAcesso.FalsoSocket(meu_ip)

    def test_regra_de_acesso(self):
        casos = [("127.0.0.1", "10.1.0.41", True), ("::1", "10.1.0.41", True), ("10.1.0.41", "10.1.0.41", True),
                 ("10.1.0.77", "10.1.0.41", False), ("192.168.1.5", "10.1.0.41", False), ("", "", False)]
        for cliente, meu, esperado in casos:
            self.assertEqual(servidor.Handler.eh_professor(self.Falso(cliente, meu)), esperado, f"{cliente} no servidor {meu}")


class TestesDeValidacao(unittest.TestCase):
    def test_limpar_partida(self):
        self.assertEqual(servidor.limpar(partida(1))["classe"], "mago")
        with self.assertRaises(ValueError):
            servidor.limpar(partida(1, classe="x"))
        self.assertEqual(servidor.limpar(partida(1, aliados=["gato", "a b", 5, "caramelo", "zelia"]))["aliados"], ["gato", "caramelo"])

    def test_limpar_criacao_orcamento_por_raridade(self):
        item = lambda r, passos: servidor.limpar_criacao("item", {"nome": "X", "slot": "amuleto", "raridade": r, "passos": passos})
        self.assertEqual(item(0, {"for": 2})["passos"], {"for": 2})
        with self.assertRaises(ValueError):
            item(0, {"for": 3})
        with self.assertRaises(ValueError):
            item(1, {"ca": 2})          # CA custa 3 por ponto
        self.assertEqual(item(4, {"for": 6, "des": 6, "int": 6})["raridade"], 4)

    def test_texto_e_numero(self):
        self.assertEqual(servidor.texto("<b>oi</b>\x01", 10), "boi/b")
        self.assertEqual(servidor.numero("abc", 1, 5, 3), 3)
        self.assertEqual(servidor.numero(99, 1, 5, 3), 5)


class TestesDeParidadeComONavegador(unittest.TestCase):
    """As mesmas regras existem em Python (servidor.py) e em JavaScript. Elas têm de ser iguais."""

    def test_orcamento_por_raridade(self):
        m = re.search(r"const OF_ORCAMENTO = \[([^\]]+)\]", ler("oficina.js"))
        self.assertEqual([int(x) for x in m.group(1).split(",")], servidor.ORCAMENTO)

    def test_bonus_do_formulario_custo_e_limite_de_cliques(self):
        js = ler("oficina.js")
        bloco = js[js.index("const OF_MODS = ["): js.index("const OF_SLOTS")]
        mods = {}
        for m in re.finditer(r"\{ k: '(\w+)', nome: '[^']*', icone: '[^']*', passo: (\d+), max: (\d+), custo: (\d+)", bloco):
            k, passo, maximo, custo = m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4))
            mods[k] = (maximo // passo, custo)
        self.assertEqual(set(mods), servidor.MODS_OK, "bônus diferentes entre o formulário e o servidor")
        self.assertEqual({k: v[0] for k, v in mods.items()}, servidor.MAX_PASSOS, "limite de cliques por bônus")
        self.assertEqual({k: v[1] for k, v in mods.items() if v[1] != 1}, servidor.CUSTO_PASSO, "custo por clique")

    def test_tracos_dos_inimigos(self):
        js = ler("oficina.js")
        bloco = js[js.index("const OF_TRACOS = {"): js.index("const OF_RITMOS")]
        chaves = set(re.findall(r"(?:^|[{,]\s*)(?:'(\w*)'|(\w+)):\s*'", bloco))
        chaves = {a or b for a, b in chaves}
        self.assertEqual(chaves, servidor.TRACOS_OK)

    def test_classes_validas(self):
        dados = ler("dados.js")
        bloco = dados[dados.index("const CLASSES = {"): dados.index("const HABILIDADES")]
        self.assertEqual(set(re.findall(r"^  (\w+): \{$", bloco, re.M)), servidor.CLASSES_OK)

    def test_temas_das_sinergias(self):
        s = ler("sinergias.js")
        bloco = s[s.index("const TAGS = {"): s.index("/* Etiquetas de cada item")]
        self.assertEqual(set(re.findall(r"^  (\w+): \{ nome:", bloco, re.M)) | {""}, servidor.TAGS_OK)


if __name__ == "__main__":
    unittest.main(verbosity=2)
