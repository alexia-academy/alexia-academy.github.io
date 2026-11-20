#!/usr/bin/env python3
"""Verification complete d'un site (disponibilite, securite, fuites de secrets, paiement, base de donnees).
Usage : python verif_site.py [--site https://alexia-academy.github.io] [--repo CHEMIN_DU_DEPOT]
Sortie : un rapport OK / ATTENTION / ECHEC. Code de sortie 1 s'il y a au moins un ECHEC (utilisable en automatique)."""
import argparse, json, os, re, sys, posixpath, urllib.request, urllib.error, concurrent.futures as cf

sys.stdout.reconfigure(encoding="utf-8")
ap = argparse.ArgumentParser()
ap.add_argument("--site", default="https://alexia-academy.github.io")
ap.add_argument("--repo", default="")
ap.add_argument("--supabase", default="https://phqfpqzrpdfvpewkvqdh.supabase.co")
ap.add_argument("--anon", default="sb_publishable_W-z46a0Mhkojf2X8YkTJ8A_QJNKWmHA")
A = ap.parse_args()
SITE = A.site.rstrip("/")
R = []  # (niveau, rubrique, message)

def add(n, r, m): R.append((n, r, m))

def get(url, method="GET", headers=None, data=None, timeout=25):
    req = urllib.request.Request(url, method=method, headers=headers or {"User-Agent": "verif-site"}, data=data)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read(), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read() if hasattr(e, "read") else b"", dict(e.headers or {})
    except Exception as e:
        return 0, str(e).encode(), {}

# ---------- 1. pages et plan du site ----------
PAGES = ["", "espace", "pourquoi-ia", "cgv", "mentions-legales", "confidentialite"]
st, body, _ = get(SITE + "/sitemap.xml")
if st == 200:
    PAGES = sorted(set(PAGES + [u.replace(SITE + "/", "") for u in re.findall(r"<loc>([^<]+)</loc>", body.decode("utf-8", "ignore"))]))
    add("OK", "Referencement", f"sitemap.xml present ({len(PAGES)} pages)")
else:
    add("ATTENTION", "Referencement", "sitemap.xml absent")
st, body, _ = get(SITE + "/robots.txt")
add("OK" if st == 200 and b"Disallow: /admin" in body else "ATTENTION", "Referencement", "robots.txt present et bloque /admin" if st == 200 else "robots.txt absent")
st, _, _ = get(SITE + "/page-qui-nexiste-pas-xyz")
add("OK" if st == 404 else "ATTENTION", "Disponibilite", f"page 404 personnalisee (code {st})")

html = {}
def fetch_page(p):
    return p, get(f"{SITE}/{p}")
with cf.ThreadPoolExecutor(8) as ex:
    for p, (st, body, h) in ex.map(fetch_page, PAGES + ["admin"]):
        if st == 200:
            html[p] = body.decode("utf-8", "ignore")
        else:
            add("ECHEC", "Disponibilite", f"/{p} repond {st}")
add("OK", "Disponibilite", f"{len(html)} pages repondent 200")

# ---------- 2. fichiers references (images, scripts, liens internes) ----------
refs = set()
for p, t in html.items():
    base = p.rsplit("/", 1)[0] + "/" if "/" in p else ""
    for m in re.findall(r'(?:src|href)="([^"#?]+)', t):
        if m.startswith(("http", "mailto:", "tel:", "javascript:", "data:", "//")) or m.startswith("{") or re.search(r"['+{}$]", m):
            continue
        refs.add(m.lstrip("/") if m.startswith("/") else posixpath.normpath(base + m))
def head_ok(u):
    st, _, h = get(f"{SITE}/{u}", method="HEAD")
    return u, st, h
bad = []
with cf.ThreadPoolExecutor(10) as ex:
    for u, st, h in ex.map(head_ok, sorted(r for r in refs if r)):
        if st not in (200, 301, 302):
            bad.append((u, st))
add("ECHEC" if bad else "OK", "Fichiers", f"{len(refs)} fichiers references, {len(bad)} introuvables" + ("".join(f"\n      - {u} ({s})" for u, s in bad[:15])))

# ---------- 3. securite du contenu public ----------
SECRETS = {"cle secrete Stripe": r"sk_live_[A-Za-z0-9]{10,}|rk_live_[A-Za-z0-9]{10,}|sk_test_[A-Za-z0-9]{10,}|rk_test_[A-Za-z0-9]{10,}",
           "secret webhook": r"whsec_[A-Za-z0-9]{10,}", "cle secrete Supabase": r"sb_secret_[A-Za-z0-9_-]{10,}|service_role",
           "IBAN": r"\bES\d{22}\b|\bFR\d{12}[A-Z0-9]{11}\d{2}\b", "cle Resend": r"re_[A-Za-z0-9]{20,}"}
leak = []
for p, t in html.items():
    for nom, rx in SECRETS.items():
        if re.search(rx, t):
            leak.append(f"{nom} dans /{p}")
if A.repo:
    for root, dirs, files in os.walk(A.repo):
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "videos")]
        for f in files:
            if f.endswith((".html", ".js", ".json", ".md", ".yml", ".txt", ".xml")):
                try:
                    t = open(os.path.join(root, f), encoding="utf-8", errors="ignore").read()
                except Exception:
                    continue
                for nom, rx in SECRETS.items():
                    if re.search(rx, t) and "verif_site" not in f and not (f == "surveillance.yml"):
                        leak.append(f"{nom} dans {os.path.relpath(os.path.join(root, f), A.repo)}")
add("ECHEC" if leak else "OK", "Secrets", "aucune cle secrete ni IBAN dans le site" if not leak else "FUITE POSSIBLE : " + " ; ".join(sorted(set(leak))[:10]))
mixed = [p for p, t in html.items() if re.search(r'(?:src|href)="http://(?!localhost)', t)]
add("ECHEC" if mixed else "OK", "Securite", "aucun contenu non securise (http://)" if not mixed else f"http:// dans {mixed}")
blank = [p for p, t in html.items() if re.search(r'target="_blank"(?![^>]*rel=)', t)]
add("ATTENTION" if blank else "OK", "Securite", "liens target=_blank sans rel=noopener : " + ", ".join(blank) if blank else "liens externes proteges (rel)")
for p in ("espace", "admin"):
    if p in html:
        add("OK" if 'name="robots"' in html[p] and "noindex" in html[p] else "ECHEC", "Securite", f"/{p} non indexable (noindex)")
add("OK" if "alex-monitor.js" in html.get("", "") else "ATTENTION", "Surveillance", "script d'erreurs et d'audience charge sur l'accueil")
no_vp = [p for p, t in html.items() if 'name="viewport"' not in t]
add("ATTENTION" if no_vp else "OK", "Mobile", "pages sans balise viewport : " + ", ".join(no_vp) if no_vp else "toutes les pages ont la balise viewport (mobile)")

# ---------- 4. contenu a completer ----------
marks = {p: len(re.findall(r"<mark>", t)) for p, t in html.items() if "<mark>" in t}
add("ATTENTION" if marks else "OK", "Legal", f"champs jaunes a completer : {marks}" if marks else "pages legales completes")
todo = sum(t.count('data-todo="lien-reseau"') for t in html.values())
add("ATTENTION" if todo else "OK", "Contenu", f"{todo} icones de reseaux sociaux sans lien" if todo else "reseaux sociaux relies")

# ---------- 5. paiement ----------
links = sorted(set(l for t in html.values() for l in re.findall(r"https://buy\.stripe\.com/[A-Za-z0-9_]+", t)))
test_links = [l for l in links if "test_" in l]
add("ECHEC" if test_links else "OK", "Paiement", f"{len(links)} liens Stripe, aucun en mode test" if not test_links else f"liens de TEST en ligne : {test_links[:3]}")
def lk(l): return l, get(l, timeout=30)[0]
with cf.ThreadPoolExecutor(6) as ex:
    deads = [(l, s) for l, s in ex.map(lk, links) if s != 200]
add("ECHEC" if deads else "OK", "Paiement", "tous les liens de paiement repondent" if not deads else f"liens morts : {deads[:5]}")
st, body, _ = get(A.supabase + "/functions/v1/stripe-webhook", method="POST", data=b"{}", headers={"Content-Type": "application/json"})
add("OK" if st == 400 else "ECHEC", "Paiement", "reception des paiements active (signature exigee)" if st == 400 else f"webhook Stripe : secret STRIPE_WEBHOOK_SECRET non colle (code {st}) : un paiement n'ouvre PAS l'acces")
st, _, _ = get(A.supabase + "/functions/v1/notifier-demande", method="POST", data=b"{}", headers={"Content-Type": "application/json"})
add("OK" if st == 403 else "ATTENTION", "Alertes", "notification des demandes protegee par jeton" if st == 403 else f"fonction de notification : reponse inattendue ({st})")

st, _, _ = get(A.supabase + "/functions/v1/offre-flash", method="POST", data=b"{}", headers={"Content-Type": "application/json"})
add("OK" if st == 401 else "ATTENTION", "Offres", "offres reservees aux comptes connectes" if st == 401 else f"fonction d'offres : reponse inattendue ({st})")
# ---------- 6. base de donnees ----------
H = {"apikey": A.anon, "Authorization": "Bearer " + A.anon}
for t in ("alex_leads", "alex_purchases", "alex_pending_purchases", "alex_errors", "alex_events", "alex_admins", "alex_profiles"):
    st, body, _ = get(f"{A.supabase}/rest/v1/{t}?select=*&limit=1", headers=H)
    txt = body.decode("utf-8", "ignore").strip()
    lisible = st == 200 and txt not in ("[]", "")
    add("ECHEC" if lisible else "OK", "Base de donnees", f"{t} : lecture publique INTERDITE" if not lisible else f"{t} : LISIBLE par n'importe qui !")
st, body, _ = get(A.supabase + "/auth/v1/settings", headers={"apikey": A.anon})
try:
    ext = json.loads(body).get("external", {})
except Exception:
    ext = {}
add("OK" if ext.get("google") else "ECHEC", "Connexion", "connexion Google active" if ext.get("google") else "connexion Google DESACTIVEE")
add("OK" if ext.get("email") else "ECHEC", "Connexion", "connexion e-mail active" if ext.get("email") else "connexion e-mail DESACTIVEE")
try:
    auto = json.loads(body).get("mailer_autoconfirm")
    add("OK" if auto is False else "ATTENTION", "Connexion", "confirmation e-mail exigee a l'inscription")
except Exception:
    pass

# ---------- rapport ----------
ordre = {"ECHEC": 0, "ATTENTION": 1, "OK": 2}
R.sort(key=lambda x: ordre[x[0]])
sym = {"ECHEC": "[ECHEC]    ", "ATTENTION": "[ATTENTION]", "OK": "[OK]       "}
print(f"=== Verification de {SITE} ===")
for n, r, m in R:
    print(f"{sym[n]} {r} : {m}")
nb = {k: sum(1 for x in R if x[0] == k) for k in ordre}
print(f"\nRESULTAT : {nb['ECHEC']} echec(s), {nb['ATTENTION']} attention(s), {nb['OK']} ok")
print("Contrôles a faire en plus par Claude (outils Supabase) : get_advisors(security), lecture de alex_errors, derniers achats.")
sys.exit(1 if nb["ECHEC"] else 0)
