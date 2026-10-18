"""Builds index.html (EN) and no.html (NO).

Long-form prose is moved verbatim from the current pages (../index.html, ../no.html),
with two systematic changes: inline wiki links are unwrapped to plain text, and
Norwegian "formålsrett-" becomes "målrett-". Framework formulations and terms are
then marked for highlighting (see FORM / TERMS).

Usage (from anywhere):  python3 teleosofisk/build.py
  reads   teleosofisk/source/index.html, source/no.html   (the prose)
  writes  teleosofisk/public/index.html, public/no.html   (what is published)
Optional: python3 build.py <source-dir> <out-dir>
"""
import copy, os, re, sys
from bs4 import BeautifulSoup, NavigableString

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1] if len(sys.argv) > 2 else os.path.join(HERE, "source")
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "public")

# --------------------------------------------------------------- highlighting

FORM = {
 "en": [r"Sum et Cogito, ergo Ago", r"Sum, Cogito, Ago", r"I am\. I think\. I act\.",
        r"\bI am\b", r"\bI think\b", r"\bI act\b", r"\b[Yy]ou act\b", r"(?<=merely )there is",
        r"(?<=\bas )(?:I|you)\b", r"(?<=\ban )I\b", r"\bergo\b", r"\b(?:Sum|Cogito|Ago)\b", r"“X exists”"],
 "no": [r"Sum et Cogito, ergo Ago", r"Sum, Cogito, Ago", r"Jeg er\. Jeg tenker\. Jeg handler\.",
        r"\b[Jj]eg er\b", r"\b[Jj]eg tenker\b", r"\b[Jj]eg handler\b", r"\b[Dd]u handler\b",
        r"(?<=bare )det er", r"(?<=\bsom )(?:jeg|du)\b", r"(?<=\bet )jeg\b", r"\bergo\b",
        r"\b(?:Sum|Cogito|Ago)\b", r"«X eksisterer»"],
}
TERMS = {
 "en": [r"narratively mediated metacognitive self-awareness actualized", r"distinction is relation",
        r"relational actuality", r"being-in-action", r"purposeful being", r"narrative structures?",
        r"subject pole", r"alter[- ]ego", r"first[- ]person", r"second[- ]person", r"third[- ]person",
        r"meta-epistemolog\w*", r"teleosophy", r"ontonomy", r"noonomy", r"teleonomy", r"noesis",
        r"ontology", r"teleolog\w*", r"telos", r"substantialism", r"discretiz\w*", r"continuity",
        r"actuali[sz]\w*", r"distinctions?", r"relations?", r"efficacy", r"action axiom"],
 "no": [r"narrativt formidlet metakognitiv selvbevissthet aktualisert", r"distinksjon er relasjon",
        r"relasjonell aktualitet", r"væren-i-handling", r"målrettet væren", r"narrative? struktur\w*",
        r"subjektpol\w*", r"alter[- ]ego", r"første ?person\w*", r"andre person", r"tredje ?person\w*",
        r"meta-epistemologi\w*", r"teleosofi\w*", r"ontonomi", r"noonomi", r"teleonomi", r"noesis",
        r"ontologi\w*", r"teleologi\w*", r"telos", r"substansialisme", r"diskretiser\w*",
        r"kontinuitet\w*", r"aktualiser\w*", r"distinksjon\w*", r"relasjon\w*", r"effektivitet",
        r"handlingsaksiomet"],
}
BLOCKS = ("p", "li", "dd", "dt", "td", "th", "div")
HITS = []


def highlight(container, lang):
    form = re.compile("|".join(f"(?:{p})" for p in FORM[lang]))
    term = re.compile("|".join(f"(?:{p})" for p in TERMS[lang]) + r"|\bEgo\b", re.I)
    seen = {}
    for node in list(container.find_all(string=True)):
        if not node.strip() or node.find_parent(["h2", "h3", "script"]) or node.find_parent(class_=["f", "t", "chain", "card-k"]):
            continue
        block = node.find_parent(BLOCKS) or container
        used = seen.setdefault(id(block), set())
        text, out, pos = str(node), [], 0
        spans = [(m.start(), m.end(), "f") for m in form.finditer(text)]
        for m in term.finditer(text):
            if any(a < m.end() and m.start() < b for a, b, _ in spans):
                continue
            key = m.group(0).lower()
            if key in used:
                continue
            used.add(key)
            spans.append((m.start(), m.end(), "t"))
        if not spans:
            continue
        spans.sort()
        soup = container if hasattr(container, "new_tag") else None
        for a, b, kind in spans:
            if a < pos:
                continue
            out.append(text[pos:a])
            out.append((kind, text[a:b]))
            pos = b
            if kind == "f":
                HITS.append((lang, text[a:b]))
        out.append(text[pos:])
        doc = node.find_parent("html") or node.find_parent()
        new = []
        for piece in out:
            if isinstance(piece, tuple):
                tag = BeautifulSoup("", "html.parser").new_tag("em" if piece[0] == "f" else "span")
                tag["class"] = piece[0]
                tag.string = piece[1]
                new.append(tag)
            elif piece:
                new.append(NavigableString(piece))
        for n in new:
            node.insert_before(n)
        node.extract()


# --------------------------------------------------------------- content

def T(en, no):
    return {"en": en, "no": no}

PART_NAMES = {
 1: T("Meta-epistemology", "Meta-epistemologi"),
 2: T("Teleosophy", "Teleosofi"),
 3: T("The Institute", "Instituttet"),
}

# body / details items: ("src", section, idx) | ("card", n) | ("html", T) | ("comp", name)
S = [
 # ---------------------------------------------------------------- I
 dict(id="meta-epistemology", part=1, chapter="I", rail=T("Meta-epistemology", "Meta-epistemologi"),
      title=T("Meta-epistemology", "Meta-epistemologi"), sub=T("The analytical lens", "Den analytiske linsen"),
      head=T("There is a common formal ground shared by all knowledge.", "Det finnes en felles formell grunn som all kunnskap deler."),
      lead=T("Disciplines differ in content, method and object. They do not differ in whether knowing requires distinctions, relations, conceptual articulation, perspective and actualization.",
             "Fagene skiller seg fra hverandre i innhold, metode og objekt. De skiller seg ikke i om det å vite krever distinksjoner, relasjoner, begrepslig artikulering, perspektiv og aktualisering."),
      body=[("src", "meta-epistemology", 2)], more=[("src", "meta-epistemology", 3)]),
 dict(id="metaphysics", part=1, rail=T("Speculative metaphysics", "Spekulativ metafysikk"),
      label=T("The epistemological reset", "Den epistemologiske nullstillingen"),
      head=T("Speculative metaphysics cannot serve as ground.", "Spekulativ metafysikk kan ikke tjene som grunn."),
      body=[("src", "meta-epistemology", 5), ("src", "meta-epistemology", 6)]),
 dict(id="distinction", part=1, rail=T("Distinction is relation", "Distinksjon er relasjon"),
      label=T("The analytical instrument · the continuity axiom", "Det analytiske instrumentet · kontinuitetsaksiomet"),
      head=T("Distinction is relation.", "Distinksjon er relasjon."),
      lead=T("To distinguish is already to relate.", "Å skille er allerede å relatere."),
      body=[("card", 0)]),
 dict(id="discretization", part=1, rail=T("Discretization and substantialism", "Diskretisering og substansialisme"),
      label=T("Discretization, continuity, substantialism", "Diskretisering, kontinuitet, substansialisme"),
      head="strong:foundation:6:-1", small=True,
      body=[("src", "foundation", 5), ("src", "foundation", 6), ("comp", "chain"),
            ("src", "foundation", 8), ("src", "foundation", 9)]),
 dict(id="objectivity", part=1, rail=T("Objectivity", "Objektivitet"),
      label=T("Objectivity", "Objektivitet"),
      head=T("Objectivity, in three modes.", "Objektivitet, i tre modi."),
      body=[("comp", "objectivity")],
      more=[("src", "foundation", 11), ("src", "foundation", 12), ("src", "foundation", 13)]),
 # ---------------------------------------------------------------- II
 dict(id="teleosophy", part=2, chapter="II", rail=T("Teleosophy", "Teleosofi"),
      title=T("Teleosophy", "Teleosofi"), sub=T("Wisdom of purposefulness", "Visdom om målrettethet"),
      head=T("The analytical instrument turned toward the fact: I am.", "Det analytiske instrumentet vendt mot faktumet: jeg er."),
      body=[("src", "teleosophy", 2), ("src", "teleosophy", 6)]),
 dict(id="i-am", part=2, rail=T("I am", "Jeg er"),
      label=T("The fact · the being axiom", "Faktumet · værensaksiomet"),
      head=T("I am.", "Jeg er."),
      body=[("card", 1)]),
 dict(id="ontology", part=2, rail=T("Ontology recovered", "Ontologien gjenvunnet"),
      label=T("Ontology recovered", "Ontologien gjenvunnet"),
      head=T("The human being is the human who is.", "Den menneskelige væren er mennesket som er."),
      lead=T("Ontology is the study of being — being as relational actuality, not a hidden substance behind appearances.",
             "Ontologi er studiet av væren — væren som relasjonell aktualitet, ikke en skjult substans bak fenomenene."),
      body=[("src", "meta-epistemology", 8), ("src", "meta-epistemology", 9),
            ("html", T("<p>Being and existence are not interchangeable. I am is first-person actualization without a predicate. “X exists” is a predication made within conceptual distinction, and an existence claim can be mistaken in a way the immediate first-person actualization I am cannot.</p>",
                       "<p>Væren og eksistens er ikke ombyttelige. Jeg er er førstepersons aktualisering uten predikat. «X eksisterer» er en predikasjon gjort innenfor begrepslig distinksjon, og en eksistenspåstand kan ta feil på en måte den umiddelbare førstepersons aktualiseringen jeg er ikke kan.</p>"))]),
 dict(id="human-form", part=2, rail=T("Self-awareness actualized", "Selvbevissthet aktualisert"),
      label=T("The distinctly human form of being", "Den særegent menneskelige formen for væren"),
      head="strong:teleosophy:3:0", small=True,
      body=[("src", "teleosophy", 3), ("comp", "facets")]),
 dict(id="sum-cogito-ago", part=2, rail=T("Sum, Cogito, Ago", "Sum, Cogito, Ago"),
      label=T("Being · thinking · acting", "Væren · tenkning · handling"),
      head=T("Sum. Cogito. Ago.", "Sum. Cogito. Ago."),
      body=[("card", 2),
            ("html", T("<p>The historical formulation Sum et Cogito, ergo Ago was productive but insufficiently precise, because ergo introduced priority and causality. The mature form removes the arrow.</p>",
                       "<p>Den historiske formuleringen Sum et Cogito, ergo Ago var produktiv, men ikke presis nok, fordi ergo innførte prioritet og kausalitet. Den modne formen fjerner pilen.</p>"))]),
 dict(id="purposeful-being", part=2, rail=T("Purposeful being", "Målrettet væren"),
      label=T("Narrative structure is telos", "Narrativ struktur er telos"),
      head=T("Human being is purposeful being.", "Menneskelig væren er målrettet væren."),
      body=[("src", "teleosophy", 5)]),
 dict(id="persons", part=2, rail=T("The persons", "Personene"),
      label=T("The persons", "Personene"),
      head=T("First, second and third person.", "Første, andre og tredje person."),
      lead=T("Analytically distinct perspectives, not separate realms. First and second person are the subject pole, third person the object pole, of the relational distinction self/non-self.",
             "Analytisk atskilte perspektiver, ikke separate sfærer. Første og andre person er subjektpolen, tredje person objektpolen, i den relasjonelle distinksjonen selv/ikke-selv."),
      body=[("comp", "persons"),
            ("html", T("<p>A system can function as an alter ego in a relation without thereby being established as an Ego or teleological agent.</p>",
                       "<p>Et system kan fungere som alter ego i en relasjon uten dermed å være etablert som et Ego eller en teleologisk aktør.</p>"))],
      more=[("src", "teleosophy", 15)]),
 dict(id="borrowed-language", part=2, rail=T("Ontonomy, noonomy, teleonomy", "Ontonomi, noonomi, teleonomi"),
      label=T("Genuine and borrowed language", "Genuint og lånt språk"),
      head=T("Ontonomy. Noonomy. Teleonomy.", "Ontonomi. Noonomi. Teleonomi."),
      body=[("src", "teleosophy", 17), ("comp", "onomies"),
            ("html", T("<p>Borrowing is often indispensable. The analytical task is to distinguish functional descriptive use from grammatical reification.</p>",
                       "<p>Lån er ofte uunnværlig. Den analytiske oppgaven er å skille funksjonell beskrivende bruk fra grammatisk tingliggjøring.</p>"))]),
 dict(id="action", part=2, rail=T("The action axiom", "Handlingsaksiomet"),
      label=T("The action axiom", "Handlingsaksiomet"),
      head=T("Human action is purposeful behavior.", "Menneskelig handling er målrettet adferd."),
      lead=T("Ago recognized in the second person.", "Ago gjenkjent i andre person."),
      body=[("card", 3), ("src", "teleosophy", 8), ("src", "teleosophy", 9)],
      more=[("src", "teleosophy", 10), ("src", "teleosophy", 11), ("src", "teleosophy", 12), ("src", "teleosophy", 13)]),
 dict(id="social", part=2, rail=T("Social reality", "Sosial virkelighet"),
      label=T("Social reality", "Sosial virkelighet"),
      head=T("Converging narrative structures.", "Konvergerende narrative strukturer."),
      body=[("src", "teleosophy", 16)]),
 # ---------------------------------------------------------------- III
 dict(id="institute", part=3, rail=T("The Institute", "Instituttet"),
      label=T("The Institute", "Instituttet"), head="h2:institute",
      small=True, body=[("src", "institute", i) for i in range(2, 8)]),
]

COMP = {
 "chain": T(["operation", "distinction", "stabilization", "name", "apparent thing"],
            ["operasjon", "distinksjon", "stabilisering", "navn", "tilsynelatende ting"]),
 "persons": T(
   [("First person", "Ego", "Direct actualization: I am. I think. I act."),
    ("Second person", "alter ego", "The relational category under which another is met as you — a counterpart, a subject pole. Derived from Ego; not empirical proof of another hidden interior. Here the action axiom applies: I act — you act."),
    ("Third person", "No Ego", "Description that abstracts away the first-person perspective, so that descriptions can be stabilized and compared intersubjectively. The mistake is not the abstraction, but treating it as prior to the actualization it abstracts from.")],
   [("Første person", "Ego", "Direkte aktualisering: jeg er. Jeg tenker. Jeg handler."),
    ("Andre person", "alter ego", "Den relasjonelle kategorien under hvilken en annen møtes som du — en motpart, en subjektpol. Avledet fra Ego; ikke et empirisk bevis for et annet skjult indre. Her gjelder handlingsaksiomet: jeg handler — du handler."),
    ("Tredje person", "Ingen Ego", "Beskrivelse som abstraherer bort førstepersonsperspektivet, slik at beskrivelser kan stabiliseres og sammenlignes intersubjektivt. Feilen er ikke abstraksjonen, men å behandle den som forut for aktualiseringen den abstraherer fra.")]),
 "onomies": T(
   {"cols": [("Sum", "being"), ("Cogito", "meaning"), ("Ago", "purpose")],
    "rows": [("First person", "actualized", ["Ontology", "Noesis", "Teleology"]),
             ("Third person", "borrowed in description", ["Ontonomy", "Noonomy", "Teleonomy"])]},
   {"cols": [("Sum", "væren"), ("Cogito", "mening"), ("Ago", "formål")],
    "rows": [("Første person", "aktualisert", ["Ontologi", "Noesis", "Teleologi"]),
             ("Tredje person", "lånt i beskrivelse", ["Ontonomi", "Noonomi", "Teleonomi"])]}),
 "timeline": T(
   [("Childhood", "Two fingertips brought ever closer: there is no smallest unit. Everything doubling in size together, undetectably: size is relational."),
    ("2008", "Ludwig von Mises, Human Action: the action axiom as analytical foundation."),
    ("2013", "That values are subjective is itself an objective fact available for further analysis."),
    ("2022", "What we call social reality is a thin veil of narrative structuring."),
    ("2023–2024", "Reciprocal Ethics – The Formal Science of Ethics. In retrospect an unwitting application of meta-epistemology to ethics."),
    ("2024", "Sum et Cogito, ergo Ago. Productive, but ergo introduced causality. The arrow was later removed."),
    ("2025", "Distinction is relation: the continuity intuition condenses into the analytical instrument. The Institute is established."),
    ("Late 2025", "Sum rediscovered as the zero point for the analysis of the human being as being."),
    ("2026", "Alter ego made explicit: the action axiom is Ago lifted into the second person.")],
   [("Barndom", "To fingertupper ført stadig nærmere: det finnes ingen minste enhet. Alt dobles i størrelse samtidig, umerkelig: størrelse er relasjonell."),
    ("2008", "Ludwig von Mises, Human Action: handlingsaksiomet som analytisk fundament."),
    ("2013", "At verdier er subjektive, er i seg selv et objektivt faktum tilgjengelig for videre analyse."),
    ("2022", "Det vi kaller sosial virkelighet, er et tynt slør av narrativ strukturering."),
    ("2023–2024", "Reciprocal Ethics – The Formal Science of Ethics. I ettertid en ubevisst anvendelse av meta-epistemologi på etikk."),
    ("2024", "Sum et Cogito, ergo Ago. Produktivt, men ergo innførte kausalitet. Pilen ble senere fjernet."),
    ("2025", "Distinksjon er relasjon: kontinuitetsintuisjonen kondenseres til det analytiske instrumentet. Instituttet etableres."),
    ("Sent 2025", "Sum gjenoppdaget som nullpunktet for analysen av mennesket som væren."),
    ("2026", "Alter ego gjort eksplisitt: handlingsaksiomet er Ago løftet til andre person.")]),
}

UI = {
 "en": dict(src="index.html", out="index.html", lang="en",
   title="Institute of Teleosophy — formal meta-epistemology",
   canon="https://instituteofteleosophy.org/", brand="Institute of Teleosophy", brand2="Teleosofisk Institutt",
   kb="Knowledge base", more="Read more", less="Close", rail="Sections", skip="Skip to content",
   axioms=["Distinction is relation.", "I am."],
   sub="Two insights, and the analytical unpacking of what follows from them.", scroll="Scroll",
   other=("NO", "Norsk", "https://teleosofiskinstitutt.no/", "no"),
   locale="en_US", locale_alt="nb_NO", manifest="site.webmanifest",
   og_alt="The mark of the Institute of Teleosophy — a circle divided by one stroke, cream and navy — centred on the sun at the horizon.",
   footer=["A registered non-profit research institute in Norway.", "Wiki content at meta-epistemology.org is published under CC BY 4.0."]),
 "no": dict(src="no.html", out="no.html", lang="no",
   title="Teleosofisk Institutt — formell meta-epistemologi",
   canon="https://teleosofiskinstitutt.no/", brand="Teleosofisk Institutt", brand2="Institute of Teleosophy",
   kb="Kunnskapsbase", more="Les mer", less="Lukk", rail="Seksjoner", skip="Hopp til innholdet",
   axioms=["Distinksjon er relasjon.", "Jeg er."],
   sub="To innsikter, og den analytiske utpakkingen av det som følger av dem.", scroll="Bla",
   other=("EN", "English", "https://instituteofteleosophy.org/", "en"),
   locale="nb_NO", locale_alt="en_US", manifest="site-no.webmanifest",
   og_alt="Teleosofisk Institutts merke — en sirkel delt av én strek, krem og marine — med sentrum i solen ved horisonten.",
   footer=["En registrert ideell forskningsstiftelse i Norge.", "Innholdet i wikien på meta-epistemology.org er publisert under CC BY 4.0."]),
}


# --------------------------------------------------------------- helpers

def kids(sec):
    return [k for k in sec.select_one(".section-inner").children if getattr(k, "name", None)]


# Corrections applied to moved prose before highlighting. The third person abstracts
# away the first-person perspective: first and second person are the subject pole,
# third person the object pole, of the relational distinction self/non-self.
FIXES = {
 "en": [("abstracts from the first-person pole", "abstracts away the first-person perspective")],
 "no": [("abstraherer fra førstepersonspolen", "abstraherer bort førstepersonsperspektivet")],
}


def clean(el, lang):
    el = copy.copy(el)
    for a in el.select("a.wl"):
        a.unwrap()
    el.smooth()
    for s in el.find_all(string=True):
        t = str(s)
        for x, y in FIXES[lang]:
            t = t.replace(x, y)
        if t != str(s):
            s.replace_with(t)
    for t in [el] + el.find_all(True):
        if t.get("class"):
            keep = [c for c in t["class"] if c != "reveal"]
            if keep:
                t["class"] = keep
            else:
                del t["class"]
        if t.has_attr("style"):
            del t["style"]
    if lang == "no":
        for s in el.find_all(string=True):
            if "ormålsrett" in s:
                s.replace_with(s.replace("Formålsrett", "Målrett").replace("formålsrett", "målrett"))
    if el.name == "p" and len(el.find_all(True, recursive=False)) == 1 and el.strong \
            and el.get_text(strip=True) == el.strong.get_text(strip=True) and len(el.get_text()) > 120:
        el.strong.unwrap()  # whole-paragraph bold in the institute section
    return el


def sentence(text):
    text = re.sub(r"\s+", " ", text).strip()
    m = re.match(r"(.+?\.)\s", text + " ")
    return m.group(1) if m else text


def build(lang):
    u = UI[lang]
    src = BeautifulSoup(open(f"{SRC}/{u['src']}", encoding="utf-8"), "html.parser")
    secs = {s["id"]: kids(s) for s in src.select("section")}
    cards = secs["foundation"][3].select(".card dd")
    desc = src.find("meta", attrs={"name": "description"})["content"].replace("formålsrett", "målrett")

    def item(it):
        kind = it[0]
        if kind == "src":
            return str(clean(secs[it[1]][it[2]], lang))
        if kind == "card":
            return "".join(str(clean(c, lang)) for c in cards[it[1]].children if getattr(c, "name", None))
        if kind == "html":
            return it[1][lang]
        return comp(it[1])

    def comp(name):
        if name == "chain":
            words = COMP["chain"][lang]
            return '<p class="chain" aria-label="' + " → ".join(words) + '">' + \
                '<span class="arrow" aria-hidden="true">→</span>'.join(f"<span>{w}</span>" for w in words) + "</p>"
        if name == "objectivity":
            out = ['<div class="cards cards-3">']
            for i in (11, 12, 13):
                p = clean(secs["foundation"][i], lang)
                title = p.strong.get_text(" ", strip=True).split(",")[0]
                out.append(f'<div class="card"><p class="card-k">{title}</p><p class="card-body">{sentence(p.get_text(" ", strip=True))}</p></div>')
            out.append("</div>")
            return "".join(out)
        if name == "facets":
            dl = clean(secs["teleosophy"][4], lang)
            dl["class"] = "cards cards-2 facets"
            for d in dl.select(".card dd"):
                d["class"] = "card-body"
            return str(dl)
        if name == "persons":
            out = ['<div class="cards cards-3 persons">']
            for who, sub, txt in COMP["persons"][lang]:
                out.append(f'<div class="card"><p class="card-k">{who}<span>{sub}</span></p><p class="card-body">{txt}</p></div>')
            out.append("</div>")
            return "".join(out)
        if name == "onomies":
            d = COMP["onomies"][lang]
            head = "".join(f'<th scope="col"><span class="f">{a}</span><span>{b}</span></th>' for a, b in d["cols"])
            rows = "".join(
                f'<tr class="row-{i}"><th scope="row">{a}<span>{b}</span></th>' + "".join(f"<td>{c}</td>" for c in cells) + "</tr>"
                for i, (a, b, cells) in enumerate(d["rows"]))
            return f'<div class="onomies-wrap"><table class="onomies"><thead><tr><td></td>{head}</tr></thead><tbody>{rows}</tbody></table></div>'
        if name == "timeline":
            return '<ol class="timeline">' + "".join(
                f'<li><span class="tl-when">{w}</span><span class="tl-text">{t}</span></li>' for w, t in COMP["timeline"][lang]) + "</ol>"
        raise KeyError(name)

    def heading(spec):
        if isinstance(spec, dict):
            return spec[lang]
        kind, *rest = spec.split(":")
        if kind == "h2":
            return secs[rest[0]][1].get_text(" ", strip=True)
        el = clean(secs[rest[0]][int(rest[1])], lang)
        t = re.sub(r"\s+", " ", el.find_all("strong")[int(rest[2])].get_text(" ", strip=True)).strip()
        t = t[0].upper() + t[1:]
        return t if t.endswith(".") else t + "."

    o_short, o_long, o_href, o_lang = u["other"]
    GAP = ' class="gap"'
    GAPS = {i for i, s in enumerate(S, 1) if s.get("chapter") or (i > 1 and S[i - 2]["part"] != s["part"])}
    rail_items = [(f"top", u["brand"], 0)] + [(s["id"], s["rail"][lang], i) for i, s in enumerate(S, 1)]
    rail = "\n".join(
        f'      <li{GAP if i in GAPS else ""}><a href="#{sid}" data-i="{i}"><span class="tick"></span><span class="rail-label">{name}</span></a></li>'
        for sid, name, i in rail_items)

    sections = []
    for i, s in enumerate(S, 1):
        lead = f'<p class="lead hl">{s["lead"][lang]}</p>' if s.get("lead") else ""
        body = "\n".join(item(x) for x in s.get("body", []))
        more = ""
        if s.get("more"):
            more = f'''
    <details class="more">
      <summary><span class="more-open">{u["more"]}</span><span class="more-close">{u["less"]}</span><span class="more-icon" aria-hidden="true"></span></summary>
      <div class="prose hl">
{chr(10).join(item(x) for x in s["more"])}
      </div>
    </details>'''
        if s.get("chapter"):
            top = f'''<p class="chapter-num">{ {"en": "Part", "no": "Del"}[lang] } {s["chapter"]}</p>
    <h2 id="h-{s["id"]}" class="chapter-title">{s["title"][lang]}<span class="chapter-sub">{s["sub"][lang]}</span></h2>
    <p class="chapter-statement hl">{heading(s["head"])}</p>'''
            cls = "stage chapter"
        else:
            hcls = "statement statement-sm" if s.get("small") else "statement"
            top = f'''<p class="label">{s["label"][lang]}</p>
    <h2 id="h-{s["id"]}" class="{hcls}">{heading(s["head"])}</h2>'''
            cls = "stage"
        sections.append(f'''
<section class="{cls}" id="{s["id"]}" data-stage="{i}" data-part="{s["part"]}" aria-labelledby="h-{s["id"]}">
  <div class="stage-inner">
    {top}
    {lead}
    <div class="body prose hl">
{body}
    </div>{more}
  </div>
</section>''')

    html = f'''<!DOCTYPE html>
<html lang="{u["lang"]}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>{u["title"]}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#050b16">
<link rel="canonical" href="{u["canon"]}">
<link rel="icon" href="favicon.ico" sizes="48x48">
<link rel="icon" href="images/mark.svg" type="image/svg+xml">
<link rel="icon" href="images/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="images/apple-touch-icon.png">
<link rel="manifest" href="{u["manifest"]}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{u["brand"]}">
<meta property="og:title" content="{u["title"]}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{u["canon"]}">
<meta property="og:image" content="{u["canon"]}images/og.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{u["og_alt"]}">
<meta property="og:locale" content="{u["locale"]}">
<meta property="og:locale:alternate" content="{u["locale_alt"]}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{u["title"]}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{u["canon"]}images/og.jpg">
<link rel="alternate" hreflang="en" href="https://instituteofteleosophy.org/">
<link rel="alternate" hreflang="no" href="https://teleosofiskinstitutt.no/">
<link rel="alternate" hreflang="x-default" href="https://instituteofteleosophy.org/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&family=Jost:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap">
<link rel="stylesheet" href="styles.css">
<script>document.documentElement.className += " js";</script>
<script defer src="https://cloud.umami.is/script.js" data-website-id="b97d4ee5-205d-4a35-af86-c001f4d36a56" data-domains="instituteofteleosophy.org,teleosofiskinstitutt.no"></script>
</head>
<body>
<a class="skip" href="#meta-epistemology">{u["skip"]}</a>
<canvas id="field" aria-hidden="true"></canvas>
<div class="band-fade" aria-hidden="true"></div>
<div class="veil" aria-hidden="true"></div>

<header class="bar">
  <a href="/" class="brand" aria-label="{u["brand"]}">
    <img src="images/mark.svg" alt="" width="28" height="28">
    <span>{u["brand"]}</span>
  </a>
  <p class="partbar" aria-hidden="true"><span data-p="1"><b>I</b>{PART_NAMES[1][lang]}</span><span data-p="2"><b>II</b>{PART_NAMES[2][lang]}</span></p>
  <nav class="bar-links" aria-label="Site">
    <a href="https://meta-epistemology.org" class="kb">{u["kb"]} <span aria-hidden="true">↗</span></a>
    <a href="{o_href}" hreflang="{o_lang}" lang="{o_lang}" class="lang" title="{o_long}">{o_short}</a>
  </nav>
</header>

<nav class="rail" aria-label="{u["rail"]}">
  <ol>
{rail}
  </ol>
</nav>

<main>

<section class="stage hero" id="top" data-stage="0" data-part="0" aria-labelledby="h-top">
  <div class="hero-inner">
    <p class="hero-kicker">{u["brand2"]}</p>
    <h1 id="h-top">{u["brand"]}</h1>
    <p class="hero-axioms"><span>{u["axioms"][0]}</span> <span>{u["axioms"][1]}</span></p>
    <p class="hero-sub">{u["sub"]}</p>
  </div>
  <a class="scroll-cue" href="#meta-epistemology"><span>{u["scroll"]}</span><i aria-hidden="true"></i></a>
</section>
{"".join(sections)}

</main>

<footer class="foot">
  <img src="images/mark.svg" alt="" width="36" height="36">
  <p>{u["brand"]} · {u["brand2"]}<br>{u["footer"][0]}<br>{u["footer"][1]}</p>
  <p class="foot-links">
    <a href="https://meta-epistemology.org">{u["kb"]}</a>
    <a href="mailto:admin@instituteofteleosophy.org">admin@instituteofteleosophy.org</a>
    <a href="{o_href}" hreflang="{o_lang}" lang="{o_lang}">{o_long}</a>
  </p>
</footer>

<script src="site.js" defer></script>
</body>
</html>
'''
    doc = BeautifulSoup(html, "html.parser")
    for c in doc.select(".hl"):
        highlight(c, lang)
    # The table column heads are formulations by construction; keep them as marked.
    out = str(doc)
    # Ego and Alter Ego are always capitalized, also in hyphenated compounds
    out = re.sub(r"\b[Aa]lter([- ])[Ee]go\b", lambda m: "Alter" + m.group(1) + "Ego", out)
    if lang == "en":
        assert "purposive" not in out.lower(), "purposive found"
    else:
        assert "formålsrett" not in out.lower(), "formålsrett found"
    open(f"{OUT}/{u['out']}", "w", encoding="utf-8").write(out)


for lang in UI:
    build(lang)
from collections import Counter
for lang in UI:
    print(lang, Counter(h for l, h in HITS if l == lang).most_common())
print("ok")
