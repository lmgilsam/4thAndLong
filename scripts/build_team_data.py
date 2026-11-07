"""
Builds the per-team answer lists for the "Name a QB / RB / defensive player who
has played for <team>" prompts.

Source: nflverse open data (https://github.com/nflverse/nflverse-data), rosters
1920-present and season stats 1999-present. Download into a folder and run:

    python3 scripts/build_team_data.py /path/to/nfldata

Writes public/teams/<TEAM>-<qb|rb|def>.json, plus src/data/team-index.json.
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

SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nfldata'
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
}

# Current players (latest depth chart): starters are at most a Slant (tier 2), everyone
# else on the depth chart at most a Chunk Play (tier 3). Players already rated more
# common (e.g. Mahomes, a Checkdown) keep their tier. Leo's call, Nov 7, 2026.
# Depth chart slots per group; a slot listed under 'backup_only' never counts as a start.
DEPTH = {
    'qb': {'slots': {'QB'}, 'backup_only': set()},
    'rb': {'slots': {'RB', 'FB'}, 'backup_only': {'FB'}},
    'def': {'slots': {'LDE', 'RDE', 'LDT', 'RDT', 'NT', 'WLB', 'MLB', 'SLB', 'LILB', 'RILB',
                      'LCB', 'RCB', 'NB', 'SS', 'FS'}, 'backup_only': set()},
}
STARTER_TIER, BACKUP_TIER = 2, 3


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
    st = st[st.season_type == 'REG'][['player_id', 'player_display_name', 'season', 'recent_team', 'passing_yards', 'rushing_yards']]
    # newer seasons ship as stats_player_reg_<year>.csv (2025, 2026, ...)
    recent = [pd.read_csv(f, low_memory=False) for f in sorted(glob.glob(os.path.join(SRC, 'stats_player_reg_*.csv')))]
    recent = [r[r.season > st.season.max()] for r in recent]
    s25 = pd.concat([r[['player_id', 'player_display_name', 'season', 'recent_team', 'passing_yards', 'rushing_yards']] for r in recent])
    st = pd.concat([st, s25]).fillna(0)
    st['fr'] = st.recent_team.map(lambda t: STAT_TEAM.get(t, t))
    team_yds = st.groupby(['player_id', 'fr'])[['passing_yards', 'rushing_yards']].sum()
    car_yds = st.groupby('player_id')[['passing_yards', 'rushing_yards']].sum()

    # defensive season stats 1999+
    dcols = ['player_id', 'season', 'team', 'def_sacks', 'def_interceptions', 'def_fumbles_forced', 'def_tackles']
    dd = pd.read_csv(os.path.join(SRC, 'player_stats_def_season.csv'), low_memory=False)
    if 'season_type' in dd:
        dd = dd[dd.season_type == 'REG']
    dd = dd.rename(columns={'recent_team': 'team'})
    dd = dd[[c for c in dcols if c in dd]]
    d25 = pd.concat(recent).rename(columns={'recent_team': 'team', 'def_tackles_solo': 'def_tackles'})
    d25 = d25[d25.season > dd.season.max()]
    d25 = d25[[c for c in dcols if c in d25]]
    dd = pd.concat([dd, d25]).fillna(0)
    dd['fr'] = dd.team.map(lambda t: STAT_TEAM.get(t, t))
    dd['impact'] = dd.def_sacks * 0.6 + dd.def_interceptions * 0.9 + dd.def_fumbles_forced * 0.5 + dd.def_tackles / 45
    def_team = dd.groupby(['player_id', 'fr']).impact.sum()
    def_car = dd.groupby('player_id').impact.sum()

    # latest depth chart of the newest season, if downloaded (depth_charts_<year>.csv)
    depth = None
    dfiles = sorted(glob.glob(os.path.join(SRC, 'depth_charts_*.csv')))
    if dfiles:
        depth = pd.read_csv(dfiles[-1], low_memory=False)
        dseason = int(re.search(r'(\d{4})', os.path.basename(dfiles[-1])).group(1))
        depth = depth[depth.dt == depth.groupby('team').dt.transform('max')]
        def depth_fr(t):
            return next((k for k, (_, _, codes) in FRANCHISES.items() if any(t == c and a <= dseason <= b for c, a, b in codes)), None)
        depth['fr'] = depth.team.map(depth_fr)
        print(f'depth chart: {os.path.basename(dfiles[-1])}, latest snapshot {depth.dt.max()}, {depth.fr.nunique()} teams')

    # display name per player id: the spelling used most seasons league-wide (ties: most recent)
    nc = ros.dropna(subset=['gsis_id']).drop_duplicates(['gsis_id', 'full_name', 'season'])
    nc = nc.groupby(['gsis_id', 'full_name']).season.agg(['count', 'max']).reset_index()
    nc = nc.sort_values(['count', 'max'], ascending=False).drop_duplicates('gsis_id')
    id_name = dict(zip(nc.gsis_id, nc.full_name))

    # career fame: weighted seasons across the whole league
    car_seasons = ros.groupby('full_name').apply(lambda d: (d.drop_duplicates('season').w).sum(), include_groups=False)

    os.makedirs(OUT, exist_ok=True)
    index = []
    for key, (team_name, label, _) in FRANCHISES.items():
        for g, cfg in GROUPS.items():
            d = ros[(ros.fr == key) & (ros.position.isin(cfg['pos']))]
            if d.empty:
                continue
            per = {}
            spellings = {}
            name_of_id = {}
            legend_set = set(LEGENDS.get(key, {}).get(g, []))
            missing = legend_set - set(d.full_name)
            if missing:
                print('legend not found', key, g, sorted(missing))
            # One entry per player, not per spelling: rosters list the same player as
            # "Kenneth Walker" and "Kenneth Walker III", or "Kenneth" then "Kenny" Gainwell.
            # Rows without an id join the id their name belongs to (if only one).
            d = d.copy()
            ids_by_name = d.dropna(subset=['gsis_id']).groupby('full_name').gsis_id.unique()
            d['pkey'] = [g_ if isinstance(g_, str) else (ids_by_name[n][0] if n in ids_by_name and len(ids_by_name[n]) == 1 else 'name:' + n)
                         for g_, n in zip(d.gsis_id, d.full_name)]
            for _, grp in d.groupby('pkey'):
                # display name: the spelling used most seasons (ties go to the most recent)
                counts = grp.drop_duplicates(['full_name', 'season']).groupby('full_name').season.agg(['count', 'max'])
                name = counts.sort_values(['count', 'max'], ascending=False).index[0]
                gid0 = next((x for x in grp.gsis_id if isinstance(x, str)), None)
                if gid0 in id_name:
                    name = id_name[gid0]
                if name not in legend_set:
                    name = next((n for n in counts.index if n in legend_set), name)
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
                    else:
                        score += def_team.get((gid, key), 0) / 3 + def_car.get(gid, 0) / 12
                if name in legend_set:
                    score += 12
                score += 0.25 * max(car_seasons.get(n, 0) for n in counts.index)
                per[name] = max(per.get(name, 0), score)
                spellings.setdefault(name, set()).update(counts.index)
                for x in grp.gsis_id:
                    if isinstance(x, str):
                        name_of_id[x] = name
            ranked = sorted(per.items(), key=lambda kv: -kv[1])
            cuts = cfg['cuts']
            tiers = {1: [], 2: [], 3: [], 4: [], 5: []}
            for i, (name, _) in enumerate(ranked):
                tier = 1 if i < cuts[0] else 2 if i < cuts[1] else 3 if i < cuts[2] else 4 if i < cuts[3] else 5
                tiers[tier].append(name)
            # Other roster spellings of a player are accepted too ("Cameron Wake" / "Derek Wake"),
            # unless the spelling is another answer's name. Kept in a separate field so older
            # cached app versions, which only read `tiers`, still work.
            def base(n):
                w = re.sub(r"[^a-z ]", '', n.lower()).split()
                return ' '.join(x for x in w if x not in ('jr', 'sr', 'ii', 'iii', 'iv'))
            taken = {base(n) for n in per}
            aliases = {}
            for name, alts in spellings.items():
                extra = sorted({a for a in alts if base(a) != base(name) and base(a) not in taken})
                if extra:
                    aliases[name] = extra
            # current starters and backups (see DEPTH)
            if depth is not None and g in DEPTH:
                dc = depth[(depth.fr == key) & depth.pos_abb.isin(DEPTH[g]['slots'])].dropna(subset=['player_name'])
                start, bench, added = set(), set(), set()
                for x, dn, r, pos in zip(dc.gsis_id, dc.player_name, dc.pos_rank, dc.pos_abb):
                    dn = clean_name(dn)
                    name = name_of_id.get(x) or (dn if dn in per else None)
                    if name is None:
                        # on the depth chart but not in this list (new signing, or a roster
                        # spot at another position, like Travis Hunter at CB): add him
                        name = dn
                        per[name] = 0
                        added.add(name)
                    (start if r == 1 and pos not in DEPTH[g]['backup_only'] else bench).add(name)
                bench -= start
                for name in sorted(added):
                    tiers[STARTER_TIER if name in start else BACKUP_TIER].append(name)
                if added:
                    print('added from depth chart', key, g, sorted(added))
                for t in range(1, 6):
                    for name in list(tiers[t]):
                        cap = STARTER_TIER if name in start else BACKUP_TIER if name in bench else None
                        if cap is not None and t > cap:
                            tiers[t].remove(name)
                            tiers[cap].append(name)
            pid = f'team-{key.lower()}-{g}'
            with open(os.path.join(OUT, f'{key}-{g}.json'), 'w') as f:
                json.dump({'id': pid, 'tiers': tiers, **({'aliases': aliases} if aliases else {})}, f, separators=(',', ':'))
            index.append({'id': pid, 'team': key, 'group': g, 'teamName': team_name,
                          'text': f"Name a {cfg['label']} who has played for {label}", 'file': f'teams/{key}-{g}.json',
                          'count': sum(len(v) for v in tiers.values()), 'preview': {t: tiers[t][:4] for t in tiers}})
    previews = [dict(e) for e in index]
    for e in index:
        e.pop('preview')
    with open(os.path.join(ROOT, 'src', 'data', 'team-index.json'), 'w') as f:
        json.dump(index, f, indent=1)
    with open(os.path.join(SRC, 'team-preview.json'), 'w') as f:
        json.dump(previews, f, indent=1)
    print(f'{len(index)} prompts written')


if __name__ == '__main__':
    main()
