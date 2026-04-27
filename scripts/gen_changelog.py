#!/usr/bin/env python3
"""
Generates src/metadata/changelog.json from git log.
Commits by github-actions[bot] are excluded.
"""
import subprocess, json, re
from collections import OrderedDict

EXCLUDE_EMAILS = {
    '41898282+github-actions[bot]@users.noreply.github.com',
    'github-actions[bot]@users.noreply.github.com',
    'action@github.com',
}

FIELD_SEP  = '\x1e'
RECORD_SEP = '\x1f'

def git_log():
    fmt = FIELD_SEP.join(['%ae', '%ad', '%s', '%b']) + RECORD_SEP
    result = subprocess.run(
        ['git', 'log', f'--pretty=format:{fmt}', '--date=format:%d.%m.%Y'],
        capture_output=True, text=True, encoding='utf-8',
    )
    return result.stdout

def parse_type(subject):
    m = re.match(
        r'^(feat|fix|ci|chore|docs|refactor|test|style|perf|build|revert|init)'
        r'(\([^)]+\))?!?:\s*',
        subject,
    )
    if m:
        return m.group(1), subject[m.end():]
    return 'other', subject

def parse_details(body):
    lines = [re.sub(r'^[-*•]\s*', '', l).strip() for l in body.splitlines() if l.strip()]
    return [l for l in lines if l]

def main():
    raw = git_log()
    by_date = OrderedDict()

    for entry in raw.split(RECORD_SEP):
        entry = entry.strip()
        if not entry:
            continue
        fields = entry.split(FIELD_SEP)
        if len(fields) < 3:
            continue

        email   = fields[0].strip()
        date    = fields[1].strip()
        subject = fields[2].strip()
        body    = fields[3].strip() if len(fields) > 3 else ''

        if not date or not subject:
            continue
        if email in EXCLUDE_EMAILS or 'github-actions' in email:
            continue

        ctype, title = parse_type(subject)
        details = parse_details(body)

        if date not in by_date:
            by_date[date] = []

        commit = {'type': ctype, 'title': title}
        if details:
            commit['details'] = details
        by_date[date].append(commit)

    changelog = [{'date': d, 'commits': cs} for d, cs in by_date.items()]

    out = 'src/metadata/changelog.json'
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(changelog, f, ensure_ascii=False, indent=2)

    total = sum(len(d['commits']) for d in changelog)
    print(f'Written {out}: {len(changelog)} days, {total} commits')

if __name__ == '__main__':
    main()
