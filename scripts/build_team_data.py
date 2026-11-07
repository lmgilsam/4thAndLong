"""
Builds the per-team answer lists for the "Name a QB / RB / defensive player /
WR or TE who has played for <team>" prompts.

Source: nflverse open data (https://github.com/nflverse/nflverse-data), rosters
1920-present and season stats 1999-present. Download into a folder and run:

    python3 scripts/build_team_data.py /path/to/nfldata            # every group
    python3 scripts/build_team_data.py /path/to/nfldata --groups rec  # just these groups

Writes public/teams/<TEAM>-<qb|rb|def|rec>.json, plus src/data/team-index.json.
With --groups, only those groups are rebuilt and every other index entry is kept
exactly as it is. The index is always ordered by wave (qb/rb/def first, then rec),
team by team inside a wave, so adding a group never moves the existing prompts.
A later wave goes live on its LIVE_FROM date and has its own shuffle (schedule.ts).
Tiers are a popularity estimate (seasons with the team, stats with the team,
career fame); they get replaced by real answer frequencies once people play.
"""
import glob
import json
import os
import re
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from legends import LEGENDS  # noqa: E402

ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
SRC = ARGS[0] if ARGS else '/home/claude/nfldata'
ONLY = set(sys.argv[sys.argv.index('--groups') + 1].split(',')) if '--groups' in sys.argv else None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'teams')

# Franchise -> (display name, prompt label, [(roster code, first season, last season)])
FRANCHISES = {
    'ARI': ('Arizona Cardinals', 'the Cardinals (any city)', [('CHC', 1920, 1959), ('STL', 1960, 1987), ('PHO', 1988, 1993), ('ARI', 1994, 2100), ('ARZ', 2002, 2015), ('C-P', 1944, 1944)]),
    'ATL': ('Atlanta Falcons', 'the Atlanta Falcons', [('ATL', 1966, 2100)]),
    'BAL': ('Baltimore Ravens', 'the Baltimore Ravens', [('BAL', 1996, 2100), ('BLT', 2002, 2015)]),
    'BUF': ('Buffalo Bills', 'the Buffalo Bills', [('BUF', 1960, 2100)]),
    'CAR': ('Carolina Panthers', 'the Carolina Panthers', [('CAR', 1995, 2100)]),
    'CHI': ('Chicago Bears', 'the Chicago Bears', [('DEC', 1920, 1920), ('CHS', 1921, 1921), ('CHB', 1922, 1959), ('CHI', 1960, 2100)]),
    'CIN': ('Cincinnati Bengals', 'the Cincinnati Bengals', [('CIN', 1968, 2100)]),
    'CLE': ('Cleveland Browns', 'the Cleveland Browns', [('CLE', 1946, 1995), ('CLE', 1999, 2100), ('CLV', 2002, 2015)]),
    'DAL': ('Dallas Cowboys', 'the Dallas Cowboys', [('COW', 1960, 1962), ('DAL', 1960, 2100)]),
    'DEN': ('Denver Broncos', 'the Denver Broncos', [('DEN', 1960, 2100)]),
    'DET': ('Detroit Lions', 'the Detroit Lions', [('POR', 1930, 1933), ('DET', 1934, 2100)]),
    'GB': ('Green Bay Packers', 'the Green Bay Packers', [('GB', 1921, 2100)]),
    'HOU': ('Houston Texans', 'the Houston Texans', [('HOU', 2002, 2100), ('HST', 2002, 2015)]),
    'IND': ('Indianapolis Colts', 'the Colts (Baltimore or Indianapolis)', [('BAL', 1953, 1983), ('IND', 1984, 2100)]),
    'JAX': ('Jacksonville Jaguars', 'the Jacksonville Jaguars', [('JAX', 1995, 2100)]),
    'KC': ('Kansas City Chiefs', 'the Kansas City Chiefs', [('TEX', 1960, 1962), ('KC', 1963, 2100)]),
    'LV': ('Las Vegas Raiders', 'the Raiders (Oakland, LA or Las Vegas)', [('OAK', 1960, 2019), ('RAI', 1982, 1994), ('LV', 2020, 2100)]),
    'LAC': ('Los Angeles Chargers', 'the Chargers (San Diego or LA)', [('CHR', 1960, 1960), ('SD', 1961, 2016), ('LAC', 2017, 2100)]),
    'LAR': ('Los Angeles Rams', 'the Rams (any city)', [('CLE', 1937, 1945), ('RAM', 1946, 1994), ('LA', 1950, 1981), ('LA', 2016, 2100), ('STL', 1995, 2001), ('SL', 2002, 2015)]),
    'MIA': ('Miami Dolphins', 'the Miami Dolphins', [('MIA', 1966, 2100)]),
    'MIN': ('Minnesota Vikings', 'the Minnesota Vikings', [('MIN', 1961, 2100)]),
    'NE': ('New England Patriots', 'the Patriots (Boston or New England)', [('BOS', 1960, 1970), ('NE', 1971, 2100)]),
    'NO': ('New Orleans Saints', 'the New Orleans Saints', [('NO', 1967, 2100)]),
    'NYG': ('New York Giants', 'the New York Giants', [('NY', 1925, 1959), ('NYG', 1925, 2100)]),
    'NYJ': ('New York Jets', 'the New York Jets', [('NYT', 1960, 1962), ('NYJ', 1963, 2100)]),
    'PHI': ('Philadelphia Eagles', 'the Philadelphia Eagles', [('PHI', 1933, 2100), ('P-P', 1943, 1943)]),
    'PIT': ('Pittsburgh Steelers', 'the Pittsburgh Steelers', [('PIT', 1933, 2100), ('P-P', 1943, 1943), ('C-P', 1944, 1944)]),
    'SF': ('San Francisco 49ers', 'the San Francisco 49ers', [('SF', 1946, 2100)]),
    'SEA': ('Seattle Seahawks', 'the Seattle Seahawks', [('SEA', 1976, 2100)]),
    'TB': ('Tampa Bay Buccaneers', 'the Tampa Bay Buccaneers', [('TB', 1976, 2100)]),
    'TEN': ('Tennessee Titans', 'the Titans or Houston Oilers', [('HOU', 1960, 1996), ('TEN', 1997, 2100)]),
    'WAS': ('Washington Commanders', 'Washington (Commanders / Redskins)', [('BOS', 1932, 1936), ('WAS', 1937, 2100)]),
}

# Stats files use modern codes; map them to franchises.
STAT_TEAM = {'LA': 'LAR', 'STL': 'LAR', 'SL': 'LAR', 'OAK': 'LV', 'SD': 'LAC', 'ARZ': 'ARI', 'BLT': 'BAL',
             'HST': 'HOU', 'CLV': 'CLE'}

GROUPS = {
    'qb': {'pos': {'QB'}, 'label': 'quarterback', 'cuts': [3, 10, 25, 50]},
    'rb': {'pos': {'RB', 'FB', 'HB'}, 'label': 'running back', 'cuts': [3, 12, 35, 80]},
    'def': {'pos': {'DB', 'DL', 'LB', 'CB', 'DE', 'OLB', 'DT', 'SS', 'FS', 'MLB', 'ILB', 'NT', 'S'},
            'label': 'defensive player', 'cuts': [5, 20, 60, 150]},
    'rec': {'pos': {'WR', 'TE'}, 'label': 'wide receiver or tight end', 'cuts': [5, 15, 40, 90]},
}
# Groups added after launch: (wave, go-live date). Wave 0 shipped with the game.
WAVE = {'qb': 0, 'rb': 0, 'def': 0, 'rec': 1}
LIVE_FROM = {'rec': '2026-11-08'}


def era_weight(season: int) -> float:
    if season >= 2000: return 1.0
    if season >= 1980: return 0.85
    if season >= 1960: return 0.65
    if season >= 1940: return 0.45
    return 0.3


def status_weight(season: int, status) -> float:
    if season < 2002 or not isinstance(status, str):
        return 1.0
    return {'ACT': 1.0, 'RES': 0.5}.get(status, 0.1)  # practice squad, cut, inactive barely count


def clean_name(n: str) -> str:
    return re.sub(r'\s+', ' ', str(n)).strip()


def main():
    cols = ['season', 'team', 'position', 'status', 'full_name', 'gsis_id']
    ros = pd.concat([pd.read_csv(f, low_memory=False, usecols=lambda c: c in cols)
                     for f in sorted(glob.glob(os.path.join(SRC, 'roster_*.csv')))])
    ros = ros.dropna(subset=['full_name'])
    ros['full_name'] = ros['full_name'].map(clean_name)
    ros['w'] = [era_weight(s) * status_weight(s, st) for s, st in zip(ros.season, ros.status)]

    # franchise per roster row
    fr = []
    for t, s in zip(ros.team, ros.season):
        hit = None
        for key, (_, _, codes) in FRANCHISES.items():
            if any(t == c and a <= s <= b for c, a, b in codes):
                hit = key
                break
        fr.append(hit)
    ros['fr'] = fr

    # season stats 1999+ (regular season)
    st = pd.read_csv(os.path.join(SRC, 'player_stats_season.csv'), low_memory=False)
    ycols = ['player_id', 'player_display_name', 'season', 'recent_team', 'passing_yards', 'rushing_yards', 'receiving_yards']
    st = st[st.season_type == 'REG'][ycols]
    s25 = pd.read_csv(os.path.join(SRC, 'stats_player_reg_2025.csv'), low_memory=False)
    s25 = s25[ycols]
    st = pd.concat([st, s25]).fillna(0)
    st['fr'] = st.recent_team.map(lambda t: STAT_TEAM.get(t, t))
    team_yds = st.groupby(['player_id', 'fr'])[['passing_yards', 'rushing_yards', 'receiving_yards']].sum()
    car_yds = st.groupby('player_id')[['passing_yards', 'rushing_yards', 'receiving_yards']].sum()

    # defensive season stats 1999+
    dcols = ['player_id', 'season', 'team', 'def_sacks', 'def_interceptions', 'def_fumbles_forced', 'def_tackles']
    dd = pd.read_csv(os.path.join(SRC, 'player_stats_def_season.csv'), low_memory=False)
    if 'season_type' in dd:
        dd = dd[dd.season_type == 'REG']
    dd = dd.rename(columns={'recent_team': 'team'})
    dd = dd[[c for c in dcols if c in dd]]
    d25 = pd.read_csv(os.path.join(SRC, 'stats_player_reg_2025.csv'), low_memory=False).rename(columns={'recent_team': 'team', 'def_tackles_solo': 'def_tackles'})
    d25 = d25[[c for c in dcols if c in d25]]
    dd = pd.concat([dd, d25]).fillna(0)
    dd['fr'] = dd.team.map(lambda t: STAT_TEAM.get(t, t))
    dd['impact'] = dd.def_sacks * 0.6 + dd.def_interceptions * 0.9 + dd.def_fumbles_forced * 0.5 + dd.def_tackles / 45
    def_team = dd.groupby(['player_id', 'fr']).impact.sum()
    def_car = dd.groupby('player_id').impact.sum()

    # career fame: weighted seasons across the whole league
    car_seasons = ros.groupby('full_name').apply(lambda d: (d.drop_duplicates('season').w).sum(), include_groups=False)

    os.makedirs(OUT, exist_ok=True)
    index = []
    for key, (team_name, label, _) in FRANCHISES.items():
        for g, cfg in GROUPS.items():
            if ONLY is not None and g not in ONLY:
                continue
            d = ros[(ros.fr == key) & (ros.position.isin(cfg['pos']))]
            if d.empty:
                continue
            per = {}
            legend_set = set(LEGENDS.get(key, {}).get(g, []))
            missing = legend_set - set(d.full_name)
            if missing and g == 'rec':
                # Two-way-era ends sit at other positions in the rosters; a legend counts
                # at any position he held for this franchise.
                d = pd.concat([d, ros[(ros.fr == key) & ros.full_name.isin(missing)]])
                missing = legend_set - set(d.full_name)
            if missing:
                print('legend not found', key, g, sorted(missing))
            for name, grp in d.groupby('full_name'):
                seasons = grp.sort_values('w', ascending=False).drop_duplicates('season')
                score = seasons.w.sum()
                gid = next((x for x in grp.gsis_id if isinstance(x, str)), None)
                if gid:
                    if g == 'qb':
                        ty = team_yds.passing_yards.get((gid, key), 0)
                        cy = car_yds.passing_yards.get(gid, 0)
                        score += ty / 2500 + cy / 12000
                    elif g == 'rb':
                        ty = team_yds.rushing_yards.get((gid, key), 0)
                        cy = car_yds.rushing_yards.get(gid, 0)
                        score += ty / 800 + cy / 4000
                    elif g == 'rec':
                        ty = team_yds.receiving_yards.get((gid, key), 0)
                        cy = car_yds.receiving_yards.get(gid, 0)
                        score += ty / 500 + cy / 3000
                    else:
                        score += def_team.get((gid, key), 0) / 3 + def_car.get(gid, 0) / 12
                if name in legend_set:
                    score += 8 if g == 'rec' else 12  # receivers' yards already lift modern stars
                score += 0.25 * car_seasons.get(name, 0)
                per[name] = max(per.get(name, 0), score)
            ranked = sorted(per.items(), key=lambda kv: -kv[1])
            cuts = cfg['cuts']
            tiers = {1: [], 2: [], 3: [], 4: [], 5: []}
            for i, (name, _) in enumerate(ranked):
                tier = 1 if i < cuts[0] else 2 if i < cuts[1] else 3 if i < cuts[2] else 4 if i < cuts[3] else 5
                tiers[tier].append(name)
            pid = f'team-{key.lower()}-{g}'
            with open(os.path.join(OUT, f'{key}-{g}.json'), 'w') as f:
                json.dump({'id': pid, 'tiers': tiers}, f, separators=(',', ':'))
            entry = {'id': pid, 'team': key, 'group': g, 'teamName': team_name,
                     'text': f"Name a {cfg['label']} who has played for {label}", 'file': f'teams/{key}-{g}.json',
                     'count': len(ranked)}
            if g in LIVE_FROM:
                entry['from'] = LIVE_FROM[g]
            entry['preview'] = {t: tiers[t][:4] for t in tiers}
            index.append(entry)
    previews = [dict(e) for e in index]
    for e in index:
        e.pop('preview')
    index_path = os.path.join(ROOT, 'src', 'data', 'team-index.json')
    if ONLY is not None:
        with open(index_path) as f:
            kept = [e for e in json.load(f) if e['group'] not in ONLY]
        index = kept + index
    # Stable sort: wave first, then the order entries were already in (team by team).
    index.sort(key=lambda e: WAVE[e['group']])
    with open(index_path, 'w') as f:
        json.dump(index, f, indent=1)
    with open(os.path.join(SRC, 'team-preview.json'), 'w') as f:
        json.dump(previews, f, indent=1)
    print(f'{len(index)} prompts written')


if __name__ == '__main__':
    main()
