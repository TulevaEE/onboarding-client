#!/usr/bin/env python3
"""Safely edit src/components/translations/translations.{en,et}.json.

These files contain NBSPs (U+00A0) used to prevent undesired line breaks in
the rendered UI ("II pillar", "1000 €"). Most editors render NBSP as
an ordinary space, so round-tripping NBSP content through generic edit tools
is error-prone. This script performs key-level edits that preserve the rest
of the file byte-for-byte, including blank lines and unrelated NBSPs.

Values accept the literal escape \\u00A0 for NBSP — it is converted on write
and rendered back as \\u00A0 on read, making NBSPs visible when you inspect.

Usage:
  scripts/edit-translation.py get <lang> <key>
  scripts/edit-translation.py set <lang> <key> <value>
  scripts/edit-translation.py delete <lang> <key>
  scripts/edit-translation.py list <lang> [<prefix>]

  <lang> is 'en' or 'et'.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = {
    "en": ROOT / "src/components/translations/translations.en.json",
    "et": ROOT / "src/components/translations/translations.et.json",
}


def _load_lines(lang: str) -> list[bytes]:
    path = FILES[lang]
    return path.read_bytes().splitlines(keepends=True)


def _save_lines(lang: str, lines: list[bytes]) -> None:
    FILES[lang].write_bytes(b"".join(lines))


def _key_regex(key: str) -> re.Pattern[bytes]:
    escaped = re.escape(key).encode()
    return re.compile(rb'^(\s*)"' + escaped + rb'"\s*:\s*"(.*)"(,?)\s*$')


def _decode_value(b: bytes) -> str:
    # JSON-decode the quoted form so escape sequences like   resolve to NBSP.
    return json.loads(b'"' + b + b'"')


def _encode_value(s: str) -> bytes:
    # Emit the minimal JSON-escaped form; ensure_ascii=False keeps NBSPs as raw bytes.
    return json.dumps(s, ensure_ascii=False).encode()[1:-1]


def _visible(s: str) -> str:
    # Render NBSPs as   so they're visible on stdout.
    return s.replace(" ", "\\u00A0")


def _resolve_input(s: str) -> str:
    # Accept literal   from the command line and resolve to NBSP.
    return s.encode("utf-8").decode("unicode_escape") if "\\u" in s else s


def cmd_get(args: argparse.Namespace) -> int:
    pattern = _key_regex(args.key)
    for raw in _load_lines(args.lang):
        m = pattern.match(raw)
        if m:
            print(_visible(_decode_value(m.group(2))))
            return 0
    print(f"key not found: {args.key}", file=sys.stderr)
    return 1


def cmd_set(args: argparse.Namespace) -> int:
    value = _resolve_input(args.value)
    pattern = _key_regex(args.key)
    lines = _load_lines(args.lang)
    for i, raw in enumerate(lines):
        m = pattern.match(raw)
        if m:
            indent, _, trailing_comma = m.group(1).decode(), m.group(2), m.group(3).decode()
            eol = b"\r\n" if raw.endswith(b"\r\n") else b"\n"
            lines[i] = (
                f'{indent}"{args.key}": "'.encode()
                + _encode_value(value)
                + f'"{trailing_comma}'.encode()
                + eol
            )
            _save_lines(args.lang, lines)
            print(f"set {args.lang}:{args.key} = {_visible(value)}")
            return 0
    print(f"key not found: {args.key} (use append if adding new keys manually)", file=sys.stderr)
    return 1


def cmd_delete(args: argparse.Namespace) -> int:
    pattern = _key_regex(args.key)
    lines = _load_lines(args.lang)
    for i, raw in enumerate(lines):
        if pattern.match(raw):
            del lines[i]
            _save_lines(args.lang, lines)
            print(f"deleted {args.lang}:{args.key}")
            return 0
    print(f"key not found: {args.key}", file=sys.stderr)
    return 1


def cmd_list(args: argparse.Namespace) -> int:
    prefix = (args.prefix or "").encode()
    line_pattern = re.compile(rb'^\s*"([^"]+)"\s*:\s*"(.*)"(,?)\s*$')
    for raw in _load_lines(args.lang):
        m = line_pattern.match(raw)
        if m and (not prefix or m.group(1).startswith(prefix)):
            key = m.group(1).decode()
            print(f"{key}\t{_visible(_decode_value(m.group(2)))}")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    g = sub.add_parser("get", help="print a key's value (NBSPs shown as \\u00A0)")
    g.add_argument("lang", choices=FILES.keys())
    g.add_argument("key")
    g.set_defaults(func=cmd_get)

    s = sub.add_parser("set", help="update a key's value (\\u00A0 in value becomes NBSP)")
    s.add_argument("lang", choices=FILES.keys())
    s.add_argument("key")
    s.add_argument("value")
    s.set_defaults(func=cmd_set)

    d = sub.add_parser("delete", help="remove a key")
    d.add_argument("lang", choices=FILES.keys())
    d.add_argument("key")
    d.set_defaults(func=cmd_delete)

    l = sub.add_parser("list", help="list keys (optionally filtered by prefix)")
    l.add_argument("lang", choices=FILES.keys())
    l.add_argument("prefix", nargs="?")
    l.set_defaults(func=cmd_list)

    args = p.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
