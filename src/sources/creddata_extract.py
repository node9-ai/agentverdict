"""Runs Samsung CredData's own file selection and obfuscation on a filtered
snapshot, for fetch-creddata.ts.

Run only through `npm run sources:creddata`, with the Python of
external/creddata/venv (README, Sources). It expects the layout
external/MANIFEST.md describes: the CredData checkout at the pinned commit in
external/creddata/CredData, the chosen repositories in
external/creddata/selected.tsv, and each chosen repository fetched at its
labelled commit under external/creddata/CredData/tmp/<repo_id>/.

What it does, in external/creddata/work/ (git-ignored):

  1. writes a snapshot.json and a meta/ folder that hold only the chosen
     repositories, next to CredData's word_in_path.json and a `tmp` link;
  2. runs CredData's move_files (copies the labelled files under data/ with
     CredData's anonymised paths) and obfuscate_creds (replaces every value
     labelled T by a shape-preserving random value, keeping prefixes, JWT and
     PEM structure and CRC32 checksums), both unchanged, as download_data.py
     calls them;
  3. compares each labelled line range before and after obfuscation and
     writes index.json: one entry per meta row with positions, label,
     category, whether its lines changed, and whether obfuscate_creds
     rewrote its value (`obfuscated`: a T row outside the multi-pattern
     categories and the informational patterns it leaves alone, whose lines
     did change). No file content goes into the index.

Nothing from tmp/ is written anywhere except the obfuscated copies under
work/data/, which fetch-creddata.ts reads. Everything the CredData scripts log
goes to work/log.txt, because their warnings can quote a value; this script
prints counts only. A failure prints the exception class and points at the
log.
"""

import json
import logging
import os
import shutil
import sys
import traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
EXTERNAL = ROOT / "external" / "creddata"
CREDDATA = EXTERNAL / "CredData"
# The held-out draw (fetch-creddata.ts --held-extra) runs this on other
# repositories in another work folder, so the sample's own work/ is untouched.
WORK = Path(os.environ.get("CREDDATA_WORK", str(EXTERNAL / "work")))
SELECTED = Path(os.environ.get("CREDDATA_SELECTED", str(EXTERNAL / "selected.tsv")))


def read_selected():
    rows = []
    for line in SELECTED.read_text().strip().split("\n"):
        repo_id, url, crc, licence, size_kb = line.split("\t")
        rows.append({"repo_id": repo_id, "url": url, "crc": crc, "license": licence, "size_kb": int(size_kb)})
    return rows


def prepare_work(selected):
    if WORK.exists():
        shutil.rmtree(WORK)
    (WORK / "meta").mkdir(parents=True)
    snapshot = json.loads((CREDDATA / "snapshot.json").read_text())
    filtered = {}
    for s in selected:
        if s["repo_id"] not in snapshot:
            raise KeyError(f"repository {s['crc']} is not in CredData's snapshot.json")
        filtered[s["repo_id"]] = snapshot[s["repo_id"]]
        shutil.copy(CREDDATA / "meta" / f"{s['crc']}.csv", WORK / "meta" / f"{s['crc']}.csv")
        if not (CREDDATA / "tmp" / s["repo_id"]).is_dir():
            raise FileNotFoundError(f"repository {s['crc']} is not fetched under CredData/tmp")
    (WORK / "snapshot.json").write_text(json.dumps(filtered, indent=1) + "\n")
    shutil.copy(CREDDATA / "word_in_path.json", WORK / "word_in_path.json")
    os.symlink(CREDDATA / "tmp", WORK / "tmp")
    return filtered


def read_lines(path: Path):
    # The same normalisation obfuscate_creds applies before it rewrites a file.
    return path.read_bytes().decode().replace("\r\n", "\n").replace("\r", "\n").split("\n")


def main() -> int:
    selected = read_selected()
    filtered = prepare_work(selected)

    # CredData's scripts log through the root logger at INFO; send all of it to
    # a file so no quoted value reaches the terminal.
    log_path = WORK / "log.txt"
    root_logger = logging.getLogger()
    for h in list(root_logger.handlers):
        root_logger.removeHandler(h)
    root_logger.addHandler(logging.FileHandler(log_path))
    root_logger.setLevel(logging.INFO)

    sys.path.insert(0, str(CREDDATA))
    os.chdir(WORK)
    try:
        from constants import MULTI_PATTERN_RULES  # noqa: E402
        from download_data import move_files  # noqa: E402
        from meta_row import read_meta  # noqa: E402
        from obfuscate_creds import obfuscate_creds  # noqa: E402

        missing = move_files(filtered, "data")
        if missing:
            print(f"creddata: {len(missing)} repositories had files missing; see {log_path}", file=sys.stderr)
            return 1

        rows = read_meta("meta")
        before = {}
        for row in rows:
            if row.FilePath not in before:
                before[row.FilePath] = read_lines(WORK / row.FilePath)

        obfuscate_creds("meta", "data", 0)

        after = {p: read_lines(WORK / p) for p in before}
        index = []
        changed_t = 0
        for row in rows:
            old = before[row.FilePath][row.LineStart - 1 : row.LineEnd]
            new = after[row.FilePath][row.LineStart - 1 : row.LineEnd]
            changed = old != new
            # obfuscate_creds skips multi-pattern categories, and
            # get_obfuscated_value returns informational values unchanged.
            obfuscated = (
                row.GroundTruth == "T"
                and row.Category not in MULTI_PATTERN_RULES
                and row.PredefinedPattern != "Info"
                and changed
            )
            if obfuscated:
                changed_t += 1
            index.append(
                {
                    "id": row.Id,
                    "repo": row.RepoName,
                    "file_id": row.FileID,
                    "path": row.FilePath,
                    "line_start": row.LineStart,
                    "line_end": row.LineEnd,
                    "label": row.GroundTruth,
                    "category": row.Category,
                    "pattern": row.PredefinedPattern,
                    "changed": changed,
                    "obfuscated": obfuscated,
                }
            )
        repos = [
            {
                "repo": s["crc"],
                "url": s["url"],
                "commit": s["repo_id"][:40],
                "license": s["license"],
                "size_kb": s["size_kb"],
            }
            for s in selected
        ]
        (WORK / "index.json").write_text(json.dumps({"repos": repos, "rows": index}, indent=1) + "\n")
        labels = {}
        for e in index:
            labels[e["label"]] = labels.get(e["label"], 0) + 1
        print(
            f"creddata: {len(repos)} repositories, {len(before)} files, "
            f"{labels.get('T', 0)} T ({changed_t} obfuscated), {labels.get('F', 0)} F, {labels.get('X', 0)} X"
        )
        return 0
    except Exception as exc:  # noqa: BLE001
        logging.getLogger(__name__).error("extraction failed", exc_info=True)
        print(f"creddata: extraction failed with {type(exc).__name__}; see {log_path}", file=sys.stderr)
        traceback.print_exc(file=open(log_path, "a"))
        return 1


if __name__ == "__main__":
    sys.exit(main())
