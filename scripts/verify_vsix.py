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
        "extension/media/xihe.png", "extension/media/icon.svg",
        "extension/doc/assets/gruvbox-dark.png",
        "extension/doc/assets/gruvbox-light.png",
        "extension.vsixmanifest", "[Content_Types].xml",
    }
    assert required <= names, f"Missing files: {required - names}"
    forbidden = ("extension/node_modules/", "extension/src/", "extension/test/",
                 "extension/.github/", "extension/doc/context/", "extension/.git/")
    assert not any(name.startswith(forbidden) or name.endswith((".vsix", ".map")) for name in names)
    packaged = json.loads(archive.read("extension/package.json"))
    for field in ("name", "displayName", "publisher", "version", "icon"):
        assert packaged[field] == manifest[field], field
    assert "extension/media/tw.png" not in names
    assert packaged["main"] == "./out/extension.js"
    for filename in (
        "out/extension.js", "out/webview.js", "out/webview.css",
        "media/xihe.png", "media/icon.svg",
        "doc/assets/gruvbox-dark.png", "doc/assets/gruvbox-light.png",
    ):
        assert archive.read(f"extension/{filename}") == (root / filename).read_bytes(), filename
print(f"PASS: {package.name}: identity, entry points, exact bundles/icons/screenshots, no dependencies/source/tests")
