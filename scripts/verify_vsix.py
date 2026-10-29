"""Check the actual ZIP archive rather than only the packaging configuration."""
import json
from pathlib import Path
from zipfile import ZipFile

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / "package.json").read_text())
package = root / "dist" / f"{manifest['name']}-{manifest['version']}.vsix"
with ZipFile(package) as archive:
    names = set(archive.namelist())
    required = {
        "extension/package.json", "extension/out/extension.js",
        "extension/out/webview.js", "extension/readme.md",
        "extension/out/webview.css",
        "extension/doc/assets/gruvbox-dark.png",
        "extension/doc/assets/gruvbox-light.png",
        "extension.vsixmanifest", "[Content_Types].xml",
    }
    assert required <= names, f"Missing files: {required - names}"
    forbidden = ("extension/node_modules/", "extension/src/", "extension/test/",
                 "extension/.github/", "extension/doc/context/", "extension/.git/")
    assert not any(name.startswith(forbidden) or name.endswith((".vsix", ".map")) for name in names)
    packaged = json.loads(archive.read("extension/package.json"))
    assert packaged["version"] == manifest["version"]
    assert packaged["main"] == "./out/extension.js"
    for filename in ("out/extension.js", "out/webview.js", "out/webview.css"):
        assert archive.read(f"extension/{filename}") == (root / filename).read_bytes(), filename
print(f"PASS: {package.name}: entry points, version, screenshots, exact bundles, no dependencies/source/tests")
