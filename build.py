#!/usr/bin/env python3
"""꿀 스튜디오 사이트 생성기: src/ 의 이미지 + 아래 내용 → docs/ (GitHub Pages가 docs/ 를 서빙).
사용: python3 build.py   (바꿀 값은 SITE 딕셔너리만)"""
import pathlib, shutil, html

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "docs"

SITE = {
    "domain": "ggule.shop",
    "email": "contact@ggule.shop",
    "name_ko": "꿀 스튜디오",
    "name_en": "STUDIO GGULE",
    "rep": "이규한",
    "rep_en": "Gyuhan Lee",
    "biz_no": "270-24-02767",
    "mail_order_no": "제2026-대구달서-1238호",  # 통신판매업 신고번호(10/16 달서구청)
    "addr_ko": "대구광역시 달서구 서당로7길 52, 4층 A006호",
    "addr_en": "4F A006, 52 Seodang-ro 7-gil, Dalseo-gu, Daegu, Republic of Korea",
    "tel": "070-8983-1793",
    "privacy_effective": "2026년 10월 16일",
    "privacy_effective_en": "October 16, 2026",
}

CSS = """
:root{--bg:#fffaf0;--fg:#2a2118;--muted:#6f6253;--card:#fff;--line:#eadfcb;--accent:#e8a317;--accent-ink:#8a5a00}
@media (prefers-color-scheme:dark){:root{--bg:#17130e;--fg:#f3ead9;--muted:#b4a68f;--card:#211b14;--line:#3a2f22;--accent:#f2b230;--accent-ink:#f6c55a}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.7 system-ui,-apple-system,"Segoe UI","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;word-break:keep-all}
a{color:var(--accent-ink)}a:hover{text-decoration-thickness:2px}
.wrap{max-width:960px;margin:0 auto;padding:0 20px}
header.top{border-bottom:1px solid var(--line)}
header.top .wrap{display:flex;align-items:center;justify-content:space-between;height:64px;gap:12px}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:19px;color:var(--fg);text-decoration:none}
.logo svg{width:30px;height:30px;flex:none}.logo span{white-space:nowrap}nav{white-space:nowrap}
nav a{margin-left:16px;color:var(--muted);text-decoration:none;font-size:15px}nav a:hover{color:var(--fg)}
.hero{padding:72px 0 40px}
.hero h1{font-size:clamp(30px,6vw,46px);line-height:1.25;margin:0 0 14px;letter-spacing:-.02em}
.hero p{color:var(--muted);font-size:18px;margin:0;max-width:640px}
h2{font-size:24px;margin:48px 0 18px;letter-spacing:-.01em}
.games{display:grid;gap:24px}
.game{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:grid;grid-template-columns:1fr 1fr}
.game img{width:100%;height:100%;object-fit:cover;display:block;aspect-ratio:920/430}
.game .body{padding:22px 24px}
.game h3{margin:0 0 4px;font-size:21px}
.tag{display:inline-block;font-size:12.5px;font-weight:700;color:var(--accent-ink);border:1px solid var(--accent);border-radius:99px;padding:1px 10px;margin:0 6px 10px 0}
.game p{margin:0 0 8px}.game .meta{color:var(--muted);font-size:14.5px}
@media (max-width:720px){.game{grid-template-columns:1fr}.game img{aspect-ratio:auto}nav a{margin-left:10px;font-size:14px}.logo{font-size:17px}}
@media (max-width:380px){nav a:first-child{display:none}}
.contact{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px 24px}
footer{margin-top:64px;border-top:1px solid var(--line);padding:28px 0 40px;color:var(--muted);font-size:13.5px;line-height:1.9}
footer b{color:var(--fg);font-weight:700}
.doc h1{font-size:30px;margin:48px 0 6px}.doc .lead{color:var(--muted);margin:0 0 28px}
.doc h2{font-size:19px;margin:34px 0 8px}.doc table{border-collapse:collapse;width:100%;font-size:15px;margin:8px 0}
.doc th,.doc td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}.doc th{background:var(--card)}
.doc .tbl{overflow-x:auto}
"""

LOGO = """<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5 27.7 9.25v13.5L16 29.5 4.3 22.75V9.25z" fill="#e8a317"/><path d="M11 12.5h10M11 16.5h10M13 20.5h6" stroke="#5a3a00" stroke-width="2.2" stroke-linecap="round"/></svg>"""


def page(lang, title, desc, body, path_depth):
    up = "../" * path_depth
    s = SITE
    if lang == "ko":
        nav = f'<a href="{up}#games">게임</a><a href="{up}privacy/">개인정보처리방침</a><a href="{up}en/" lang="en">English</a>'
        home = up or "./"
        mo = f" · 통신판매업 신고 {s['mail_order_no']}" if s["mail_order_no"] else ""
        foot = (f"<b>{s['name_ko']}</b> ({s['name_en']}) · 대표 {s['rep']} · 사업자등록번호 {s['biz_no']}{mo}<br>"
                f"{s['addr_ko']} · 전화 {s['tel']} · <a href=\"mailto:{s['email']}\">{s['email']}</a><br>"
                f"<a href=\"{up}privacy/\"><b>개인정보처리방침</b></a> · © 2026 {s['name_ko']}")
        brand = s["name_ko"]
    else:
        nav = f'<a href="{up}en/#games">Games</a><a href="{up}en/privacy/">Privacy</a><a href="{up}" lang="ko">한국어</a>'
        home = f"{up}en/"
        mo = f" · Mail-order Business Reg. No. {s['mail_order_no'][1:-1]} (Dalseo-gu, Daegu)" if s["mail_order_no"] else ""
        foot = (f"<b>{s['name_en']}</b> (꿀 스튜디오) · Representative {s['rep_en']} · Business Reg. No. {s['biz_no']}{mo}<br>"
                f"{s['addr_en']} · Tel +82-70-8983-1793 · <a href=\"mailto:{s['email']}\">{s['email']}</a><br>"
                f"<a href=\"{up}en/privacy/\"><b>Privacy Policy</b></a> · © 2026 {s['name_en']}")
        brand = s["name_en"]
    return f"""<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:image" content="https://{s['domain']}/img/ramen.webp">
<link rel="icon" href="{up}favicon.svg" type="image/svg+xml">
<style>{CSS}</style>
</head>
<body>
<header class="top"><div class="wrap"><a class="logo" href="{home}">{LOGO}<span>{brand}</span></a><nav>{nav}</nav></div></header>
<main class="wrap">
{body}
</main>
<footer><div class="wrap">{foot}</div></footer>
</body>
</html>
"""


def game(img, alt, title, tags, text, meta):
    t = "".join(f'<span class="tag">{x}</span>' for x in tags)
    return (f'<article class="game"><img src="{img}" alt="{html.escape(alt)}" width="920" height="430" loading="lazy">'
            f'<div class="body"><h3>{title}</h3>{t}<p>{text}</p><p class="meta">{meta}</p></div></article>')


# ---------- 한국어 홈 (세컨즈 아웃은 국내 판매 제외라 싣지 않음) ----------
HOME_KO = f"""
<section class="hero"><h1>작고 단단한 게임을 만듭니다.</h1>
<p>{SITE['name_ko']}는 대구의 1인 게임 개발 스튜디오입니다. 손에 금방 붙고, 한 판이 짧고, 다시 하고 싶어지는 게임을 만듭니다.</p></section>
<h2 id="games">게임</h2>
<div class="games">
{game("img/ramen.webp", "라면 식는다 대표 그림", "라면 식는다", ["PC", "개발 중"],
      "괴수 영화의 주인공이 됐다. 그런데 아주 작다. 컵라면이 불기 전에 촬영을 끝내야 하는 괴수 특촬 복싱 액션.",
      "Steam · itch.io 출시 준비 중")}
{game("img/hanpan.webp", "한판 맞고 타이틀 화면", "한판 맞고", ["모바일", "개발 중"],
      "맞고와 3인 고스톱, 기초 연습까지. 컴퓨터 상대와 짧게 한 판 즐기는 화투 카드 게임.",
      "Google Play · 원스토어 출시 준비 중")}
</div>
<h2 id="contact">연락</h2>
<div class="contact">게임 문의, 버그 제보, 제휴 제안은 <a href="mailto:{SITE['email']}">{SITE['email']}</a> 로 보내 주세요.</div>
"""

HOME_EN = f"""
<section class="hero"><h1>Small games, built to hit hard.</h1>
<p>{SITE['name_en']} is a one-person game studio in Daegu, Korea. We make games that are quick to learn, short to play and hard to put down.</p></section>
<h2 id="games">Games</h2>
<div class="games">
{game("../img/seconds-out.webp", "Seconds Out key art", "Seconds Out", ["PC", "Coming soon"],
      "Box with your mouse and fight with your feet. A boxing roguelike career where every round is read, timed and earned.",
      "Steam · Windows / Linux")}
{game("../img/ramen.webp", "Ramen's Getting Cold key art", "Ramen's Getting Cold", ["PC", "In development"],
      "Kaiju-movie boxing. One take = one cup of instant ramen. You are the monster — a very small one.",
      "Steam · itch.io")}
{game("../img/hanpan.webp", "Hanpan Matgo title screen", "Hanpan Matgo", ["Mobile", "In development"],
      "The Korean flower-card game Matgo and three-player Go-Stop against computer opponents, with a beginner's practice mode.",
      "Google Play · ONE store")}
</div>
<h2 id="contact">Contact</h2>
<div class="contact">For support, bug reports or business inquiries, email <a href="mailto:{SITE['email']}">{SITE['email']}</a>.</div>
"""

PRIV_KO = f"""
<article class="doc">
<h1>개인정보처리방침</h1>
<p class="lead">{SITE['name_ko']}(이하 "스튜디오")는 「개인정보 보호법」 제30조에 따라 이용자의 개인정보를 보호하고 관련 고충을 신속하게 처리하기 위해 다음과 같이 개인정보처리방침을 공개합니다. 시행일: {SITE['privacy_effective']}</p>

<h2>1. 요약</h2>
<p>스튜디오는 게임 안에서 회원가입·로그인을 받지 않으며 이름, 연락처 같은 개인정보를 직접 수집하지 않습니다. 게임 설정과 진행 기록은 이용자의 기기(웹 게임은 브라우저 저장소)에만 저장되고 스튜디오로 전송되지 않습니다. 예외는 아래 두 가지입니다.</p>
<ul><li>광고가 들어간 모바일 게임(한판 맞고): 광고 제공을 Google에 맡기며, Google이 광고 ID 등을 처리합니다(4항).</li>
<li>이용자가 이메일로 문의한 경우: 답변에 필요한 범위에서 이메일 주소와 문의 내용을 처리합니다(3항).</li></ul>

<h2>2. 게임별 처리 현황</h2>
<div class="tbl"><table>
<tr><th>게임</th><th>스튜디오가 받는 정보</th><th>기기에 저장되는 정보</th><th>외부 서비스</th></tr>
<tr><td>라면 식는다 (PC)</td><td>없음</td><td>설정, 기록</td><td>배포 스토어(Steam, itch.io)</td></tr>
<tr><td>Seconds Out (PC)</td><td>없음</td><td>설정, 커리어 진행, 기록</td><td>Steam (클라우드 저장·도전 과제를 쓰는 경우 Valve가 처리)</td></tr>
<tr><td>한판 맞고 (Android)</td><td>없음</td><td>설정, 프로필(레벨·기록)</td><td>Google AdMob (광고), 배포 스토어(Google Play, 원스토어)</td></tr>
</table></div>
<p>게임을 지우거나 브라우저 데이터를 지우면 기기에 저장된 정보도 함께 지워집니다. 스토어에서 구매·결제할 때의 정보는 각 스토어(Valve, itch.io, Google, 원스토어)가 자신의 방침에 따라 처리하며 스튜디오는 이용자의 결제 정보를 받지 않습니다.</p>

<h2>3. 문의 처리</h2>
<div class="tbl"><table>
<tr><th>목적</th><th>항목</th><th>보유 기간</th></tr>
<tr><td>문의·버그 제보 답변, 환불 등 소비자 분쟁 처리</td><td>이메일 주소, 이름(적은 경우), 문의 내용과 첨부 파일</td><td>답변 완료 후 1년 뒤 파기. 단 「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 소비자 불만·분쟁 처리 기록은 3년</td></tr>
</table></div>

<h2>4. 광고 (한판 맞고)</h2>
<p>한판 맞고는 무료 게임 운영을 위해 판이 끝난 뒤 전면 광고를 보여 주며, 광고 게재를 아래와 같이 위탁합니다.</p>
<div class="tbl"><table>
<tr><th>수탁자</th><th>위탁 업무</th><th>처리 항목</th><th>보유 기간</th></tr>
<tr><td>Google LLC (AdMob) · 미국</td><td>광고 게재·측정, 부정 클릭 방지</td><td>광고 ID, 기기·앱 정보, IP 주소, 광고 노출·클릭 정보</td><td>Google 개인정보처리방침에 따름</td></tr>
</table></div>
<p>처음 실행할 때 광고 개인정보 동의 창이 나오며, 맞춤형 광고 동의는 게임 설정의 [광고 개인정보 설정]에서 언제든 바꿀 수 있습니다. 기기 설정(설정 → 개인정보 보호 → 광고)에서 광고 ID를 재설정하거나 삭제할 수 있습니다. 이 정보는 정보통신망을 통해 앱 실행 중 Google 서버로 전송됩니다. 자세한 내용: <a href="https://policies.google.com/privacy?hl=ko">Google 개인정보처리방침</a>, <a href="https://policies.google.com/technologies/partner-sites?hl=ko">Google이 파트너 앱의 정보를 사용하는 방법</a>.</p>

<h2>5. 제3자 제공</h2>
<p>스튜디오는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 법령에 따라 수사기관 등이 요구하는 경우는 예외입니다.</p>

<h2>6. 파기</h2>
<p>보유 기간이 끝나거나 처리 목적을 이루면 지체 없이 파기합니다. 전자 파일은 복구할 수 없는 방법으로 지우고, 종이 문서는 분쇄합니다.</p>

<h2>7. 이용자의 권리</h2>
<p>이용자는 언제든 자신의 개인정보 열람, 정정, 삭제, 처리 정지를 요구할 수 있습니다. 아래 연락처로 요청하면 지체 없이 조치합니다. 만 14세 미만 아동의 법정대리인도 같은 권리를 행사할 수 있습니다.</p>

<h2>8. 안전성 확보 조치</h2>
<p>문의 메일은 2단계 인증을 켠 계정에서만 열람하고, 열람할 수 있는 사람을 대표자로 한정합니다.</p>

<h2>9. 개인정보 보호책임자</h2>
<p>성명: {SITE['rep']} (대표) · 이메일: <a href="mailto:{SITE['email']}">{SITE['email']}</a> · 전화: {SITE['tel']}</p>
<p>개인정보 침해 신고·상담: 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118), 개인정보분쟁조정위원회(www.kopico.go.kr, 1833-6972), 대검찰청(www.spo.go.kr, 1301), 경찰청(ecrm.police.go.kr, 182).</p>

<h2>10. 변경</h2>
<p>이 방침을 바꾸면 시행 7일 전에 이 페이지에 알립니다. 시행일: {SITE['privacy_effective']}</p>
</article>
"""

PRIV_EN = f"""
<article class="doc">
<h1>Privacy Policy</h1>
<p class="lead">This policy explains how {SITE['name_en']} ("we") handles personal information in our games and on this website. Effective {SITE['privacy_effective_en']}.</p>

<h2>1. Summary</h2>
<p>Our games have no accounts or logins, and we do not collect your name, contact details or other personal information. Settings and progress are stored only on your device (or in your browser for web games) and are never sent to us. There are two exceptions:</p>
<ul><li>Our ad-supported mobile game (Hanpan Matgo) uses Google AdMob, which processes your advertising ID and related data (section 4).</li>
<li>If you email us, we use your email address and message to reply (section 3).</li></ul>

<h2>2. Per game</h2>
<div class="tbl"><table>
<tr><th>Game</th><th>Data we receive</th><th>Stored on your device</th><th>Third-party services</th></tr>
<tr><td>Seconds Out (PC)</td><td>None</td><td>Settings, career progress, records</td><td>Steam (Valve processes cloud saves and achievements if used)</td></tr>
<tr><td>Ramen's Getting Cold (PC)</td><td>None</td><td>Settings, records</td><td>Store you bought it from (Steam, itch.io)</td></tr>
<tr><td>Hanpan Matgo (Android)</td><td>None</td><td>Settings, profile (level, records)</td><td>Google AdMob (ads), Google Play, ONE store</td></tr>
</table></div>
<p>Uninstalling a game or clearing browser data deletes this local data. Purchases are handled by each store (Valve, itch.io, Google, ONE store) under their own policies; we never receive your payment details.</p>

<h2>3. Support emails</h2>
<p>When you contact us we process your email address, name (if given), message and attachments to answer you and to handle refunds or disputes. We delete them one year after the conversation ends, except records of consumer complaints and disputes, which Korean law requires us to keep for three years.</p>

<h2>4. Advertising (Hanpan Matgo)</h2>
<p>Hanpan Matgo shows full-screen ads between rounds, served by Google LLC (AdMob, USA). Google processes your advertising ID, device and app information, IP address and ad interaction data to serve and measure ads and prevent fraud, and retains it under its own policy. A consent form appears on first launch; you can change your choice at any time under Settings → Ad privacy settings in the game, and you can reset or delete your advertising ID in your device settings. See <a href="https://policies.google.com/privacy">Google's Privacy Policy</a> and <a href="https://policies.google.com/technologies/partner-sites">how Google uses information from partner apps</a>.</p>

<h2>5. Sharing</h2>
<p>We do not sell or share your personal information with anyone else, except when required by law.</p>

<h2>6. Your rights</h2>
<p>You can ask us to access, correct, delete or stop processing your personal information at any time. Parents or guardians of children under 14 may make the same requests.</p>

<h2>7. Contact</h2>
<p>Privacy officer: {SITE['rep_en']} (Representative) · <a href="mailto:{SITE['email']}">{SITE['email']}</a> · {SITE['addr_en']}</p>

<h2>8. Changes</h2>
<p>We will post any changes on this page at least 7 days before they take effect. Effective {SITE['privacy_effective_en']}.</p>
</article>
"""

FAVICON = LOGO.replace('aria-hidden="true"', 'xmlns="http://www.w3.org/2000/svg"')

NOT_FOUND = """<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>페이지를 찾을 수 없습니다</title><style>body{font:16px/1.7 system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#fffaf0;color:#2a2118}@media (prefers-color-scheme:dark){body{background:#17130e;color:#f3ead9}}a{color:#e8a317}</style>
<p>페이지를 찾을 수 없습니다. <a href="/">처음으로</a> · Page not found. <a href="/en/">Home</a></p></html>"""


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "img").mkdir(parents=True)
    for f in (ROOT / "src" / "img").iterdir():
        shutil.copy(f, OUT / "img" / f.name)
    w = lambda p, s: ((OUT / p).parent.mkdir(parents=True, exist_ok=True), (OUT / p).write_text(s))
    w("index.html", page("ko", f"{SITE['name_ko']} — 1인 게임 개발 스튜디오", "대구의 1인 게임 개발 스튜디오. 라면 식는다, 한판 맞고.", HOME_KO, 0))
    w("en/index.html", page("en", f"{SITE['name_en']} — indie game studio", "A one-person game studio in Korea. Seconds Out, Ramen's Getting Cold, Hanpan Matgo.", HOME_EN, 1))
    w("privacy/index.html", page("ko", f"개인정보처리방침 — {SITE['name_ko']}", "꿀 스튜디오 게임의 개인정보처리방침", PRIV_KO, 1))
    w("en/privacy/index.html", page("en", f"Privacy Policy — {SITE['name_en']}", "Privacy policy for STUDIO GGULE games", PRIV_EN, 2))
    w("404.html", NOT_FOUND)
    w("favicon.svg", FAVICON)
    w("CNAME", SITE["domain"] + "\n")
    w(".nojekyll", "")
    w("robots.txt", f"User-agent: *\nAllow: /\nSitemap: https://{SITE['domain']}/sitemap.xml\n")
    urls = ["", "en/", "privacy/", "en/privacy/"]
    w("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + "".join(f"<url><loc>https://{SITE['domain']}/{u}</loc></url>\n" for u in urls) + "</urlset>\n")
    print("built", sorted(str(p.relative_to(OUT)) for p in OUT.rglob("*") if p.is_file()))


if __name__ == "__main__":
    main()
