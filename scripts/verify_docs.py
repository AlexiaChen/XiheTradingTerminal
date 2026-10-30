"""Check relative Markdown links in maintained docs without making network requests."""
from pathlib import Path
import re
from urllib.parse import unquote

root = Path(__file__).resolve().parent.parent
documents = [root / "README.md", root / "AGENTS.md", root / "CHANGELOG.md"]
documents += list((root / "doc").rglob("*.md"))
documents += [root / "third-party/tradingview-indicator/README.md"]
failures = []
count = 0
for document in documents:
    text = re.sub(r"```.*?```", "", document.read_text(), flags=re.DOTALL)
    for target in re.findall(r"!?\[[^\]\n]*\]\(([^\s)]+)(?:\s+\"[^\"]*\")?\)", text):
        if re.match(r"[a-z]+:", target) or target.startswith("#"):
            continue
        destination = unquote(target.strip("<>").split("#")[0])
        if not destination:
            continue
        count += 1
        if not (document.parent / destination).exists():
            failures.append(f"{document.relative_to(root)}: {target}")
if failures:
    raise SystemExit("Broken local documentation links:\n" + "\n".join(failures))
print(f"PASS: {count} local links across {len(documents)} maintained Markdown files")
