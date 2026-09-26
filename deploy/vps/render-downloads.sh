#!/usr/bin/env bash
# Writes index.html for the walkMe downloads page from the builds/<run>/ folders
# that walkme-deploy.sh publishes. Usage: render-downloads.sh <downloads dir> <owner/repo>
set -euo pipefail
dir="$1"
repo="$2"

esc() { sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'; }

build_rows() {
  local first=1
  for b in $(ls -1d "$dir"/builds/*/ 2>/dev/null | xargs -r -n1 basename | sort -rn); do
    local info="$dir/builds/$b/BUILD_INFO"
    local sha date url
    sha="$(sed -n 1p "$info" 2>/dev/null || true)"
    date="$(sed -n 2p "$info" 2>/dev/null | esc || true)"
    url="$(sed -n 3p "$info" 2>/dev/null || true)"
    local apk ios
    apk="$(cd "$dir/builds/$b" && ls -1 *.apk 2>/dev/null | head -1 || true)"
    ios="$(cd "$dir/builds/$b" && ls -1 *.zip 2>/dev/null | head -1 || true)"
    local cls="build"; [ $first = 1 ] && cls="build latest"
    echo "<section class=\"$cls\">"
    echo "  <header><h2>Build $b</h2>$([ $first = 1 ] && echo '<span class="tag">Latest</span>')</header>"
    echo "  <p class=\"meta\">$date · <a href=\"https://github.com/$repo/commit/$sha\">${sha:0:7}</a> · <a href=\"$url\">CI run</a></p>"
    echo "  <div class=\"files\">"
    if [ -n "$apk" ]; then
      echo "    <a class=\"file\" href=\"builds/$b/$apk\"><strong>Android</strong><span>$apk · $(du -h "$dir/builds/$b/$apk" | cut -f1)</span></a>"
    else
      echo "    <span class=\"file missing\"><strong>Android</strong><span>not built</span></span>"
    fi
    if [ -n "$ios" ]; then
      echo "    <a class=\"file\" href=\"builds/$b/$ios\"><strong>iOS Simulator</strong><span>$ios · $(du -h "$dir/builds/$b/$ios" | cut -f1)</span></a>"
    else
      echo "    <span class=\"file missing\"><strong>iOS Simulator</strong><span>not built</span></span>"
    fi
    echo "  </div>"
    echo "</section>"
    first=0
  done
}

rows="$(build_rows)"
[ -n "$rows" ] || rows='<p class="meta">No builds published yet.</p>'

cat >"$dir/index.html.tmp" <<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>walkMe Downloads</title>
<style>
  :root { --bg:#f6f6f8; --card:#fff; --text:#17171c; --muted:#6b6b76; --line:#e3e3e8; --accent:#6d5dfc; }
  @media (prefers-color-scheme: dark) { :root { --bg:#111114; --card:#1b1b20; --text:#e9e9ed; --muted:#9a9aa6; --line:#2c2c33; --accent:#8f83ff; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  main { max-width:640px; margin:0 auto; padding:32px 16px 48px; }
  h1 { font-size:26px; margin:0 0 4px; }
  h2 { font-size:17px; margin:0; }
  a { color:var(--accent); }
  .intro, .meta { color:var(--muted); margin:0 0 16px; }
  .build { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px; margin:0 0 12px; }
  .build header { display:flex; align-items:center; gap:8px; margin-bottom:2px; }
  .build .meta { font-size:13px; margin:0 0 12px; }
  .tag { font-size:12px; background:var(--accent); color:#fff; border-radius:999px; padding:1px 8px; }
  .files { display:grid; gap:8px; }
  .file { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:12px 14px; border:1px solid var(--line); border-radius:10px; text-decoration:none; color:var(--text); }
  a.file:hover { border-color:var(--accent); }
  .file span { color:var(--muted); font-size:13px; overflow-wrap:anywhere; }
  .missing { opacity:.55; }
  details { margin-top:24px; color:var(--muted); font-size:14px; }
  summary { cursor:pointer; color:var(--text); }
</style>
</head>
<body>
<main>
  <h1>walkMe builds</h1>
  <p class="intro">Built and tested automatically from <a href="https://github.com/$repo">main</a>. The newest build is first.</p>
$rows
  <details>
    <summary>How to install</summary>
    <p><strong>Android:</strong> open this page on the phone, tap the Android file, and allow "Install unknown apps" for your browser when asked. Newer builds install as an update over older ones.</p>
    <p><strong>iOS:</strong> this is a Simulator build for a Mac (unzip, then drag <code>WalkMe.app</code> onto a running iOS Simulator). It can't be installed on an iPhone — that needs Apple code signing.</p>
  </details>
</main>
</body>
</html>
HTML
mv "$dir/index.html.tmp" "$dir/index.html"
