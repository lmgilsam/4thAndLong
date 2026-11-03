import { prompt, type PromptDef, type TierBuckets } from './types'

/** Merge extra answers into tier buckets (used to add 1980-1999 leaders). */
function merge(a: TierBuckets, b: TierBuckets): TierBuckets {
  const out: TierBuckets = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const t = Number(k) as keyof TierBuckets
    out[t] = [...(out[t] ?? []), ...(v ?? [])]
  }
  return out
}

// 1980-1999 leaders from the official NFL year-by-year leader tables (ties included).
// Sacks only became an official stat in 1982.
const L80 = {
  passTd: { 2: ['Dan Marino', 'Joe Montana|Joe Cool', 'Terry Bradshaw', 'Steve Young'], 3: ['Dan Fouts', 'Warren Moon', 'Jim Kelly'], 4: ['Steve Bartkowski', 'Lynn Dickey', 'Jim Everett'] },
  passYds: { 2: ['Dan Marino', 'John Elway', 'Brett Favre'], 3: ['Dan Fouts', 'Warren Moon', 'Drew Bledsoe'], 4: ['Lynn Dickey', 'Neil Lomax', 'Don Majkowski|Majik Man', 'Mark Brunell', 'Jeff George'], 5: ['Steve Beuerlein'] },
  rushYds: { 1: ['Barry Sanders', 'Emmitt Smith'], 2: ['Eric Dickerson', 'Earl Campbell'], 3: ['Marcus Allen', 'Christian Okoye|The Nigerian Nightmare', 'Terrell Davis|TD'], 4: ['George Rogers', 'Freeman McNeil', 'Charles White'] },
  rushTd: { 1: ['Emmitt Smith'], 2: ['Barry Sanders'], 3: ['Marcus Allen', 'John Riggins', 'Eric Dickerson', 'Terrell Davis|TD'], 4: ['Billy Sims', 'Chuck Muncie', 'Joe Morris', 'George Rogers', 'Charles White', 'Terry Allen', 'Stephen Davis'], 5: ['Greg Bell', 'Cleveland Gary', 'Abdul-Karim al-Jabbar|Karim Abdul-Jabbar'] },
  recYds: { 1: ['Jerry Rice'], 2: ['Michael Irvin|The Playmaker'], 3: ['Steve Largent', 'Sterling Sharpe', 'Isaac Bruce'], 4: ['John Jefferson', 'Wes Chandler', 'Mike Quick', 'Roy Green', 'Henry Ellard', 'Rob Moore', 'Antonio Freeman'], 5: ['Alfred Jenkins', 'J.T. Smith|JT Smith'] },
  recTd: { 1: ['Jerry Rice'], 2: ['Cris Carter'], 3: ['Sterling Sharpe'], 4: ['John Jefferson', 'Wes Chandler', 'Roy Green', 'Mark Clayton', 'Andre Rison|Bad Moon Rison', 'Carl Pickens', 'Michael Jackson', 'Tony Martin'], 5: ['Alfred Jenkins', 'Steve Watson', 'Daryl Turner'] },
  receptions: { 1: ['Jerry Rice'], 2: ['Cris Carter'], 3: ['Kellen Winslow', 'Dwight Clark', 'Art Monk', 'Roger Craig', 'Sterling Sharpe', 'Tim Brown'], 4: ['Todd Christensen', 'Al Toon', 'Haywood Jeffires', 'Herman Moore', 'O.J. McDuffie|OJ McDuffie', 'Jimmy Smith'], 5: ['J.T. Smith|JT Smith'] },
  int: { 2: ['Ronnie Lott'], 3: ['Lester Hayes', 'Everson Walls', 'Kenny Easley', 'Aeneas Williams'], 4: ['Mark Murphy', 'Mark Carrier', 'Eugene Robinson', 'Eric Turner', 'Sam Madison', 'Troy Vincent'], 5: ['Barry Wilburn', 'Scott Case', 'Felix Wright', 'Henry Jones', 'Audray McMillian', 'Nate Odomes', 'Orlando Thomas', 'Tyrone Braxton', 'Keith Lyle', 'Ryan McNeil', 'Donnie Abraham', 'James Hasty'] },
  sacks: { 2: ['Lawrence Taylor|LT', 'Reggie White|Minister of Defense'], 3: ['Mark Gastineau', 'Richard Dent', 'Derrick Thomas', 'Kevin Greene', 'John Randle'], 4: ['Chris Doleman', 'Pat Swilling', 'Clyde Simmons', 'Neil Smith'], 5: ['Doug Martin', 'Bryce Paup', 'Michael Sinclair', 'Kevin Carter'] },
} satisfies Record<string, TierBuckets>

// Batch 3 (added Nov 3, 2026). League-leader answer lists for 2000+ are computed from
// nflverse regular-season stats (2000-2025, grouped by player ID, ties included).
// Other facts checked through the 2025 season and the Hall of Fame Class of 2026.

export const BATCH_3: PromptDef[] = [
  prompt('lead-pass-td', 'League Leaders', 'Name a player who led the NFL in passing touchdowns (1980 or later)', merge(L80.passTd, {
    1: ['Tom Brady', 'Peyton Manning', 'Patrick Mahomes', 'Drew Brees'],
    2: ['Aaron Rodgers', 'Joe Burrow', 'Lamar Jackson', 'Matthew Stafford', 'Brett Favre', 'Russell Wilson'],
    3: ['Dak Prescott', 'Andrew Luck', 'Kurt Warner', 'Philip Rivers'],
    4: ['Carson Palmer', 'Daunte Culpepper'],
  })),

  prompt('lead-pass-yds', 'League Leaders', 'Name a player who led the NFL in passing yards (1980 or later)', merge(L80.passYds, {
    1: ['Drew Brees', 'Tom Brady', 'Peyton Manning', 'Patrick Mahomes'],
    2: ['Joe Burrow', 'Matthew Stafford', 'Ben Roethlisberger|Big Ben', 'Philip Rivers'],
    3: ['Jameis Winston', 'Deshaun Watson', 'Tua Tagovailoa|Tua', 'Kurt Warner'],
    4: ['Matt Schaub', 'Rich Gannon', 'Daunte Culpepper'],
  })),

  prompt('lead-rush-yds', 'League Leaders', 'Name a player who led the NFL in rushing yards (1980 or later)', merge(L80.rushYds, {
    1: ['Adrian Peterson|AP|All Day', 'Derrick Henry|King Henry', 'Saquon Barkley', 'LaDainian Tomlinson|LT'],
    2: ['Ezekiel Elliott|Zeke', 'Christian McCaffrey|CMC', 'Jonathan Taylor', 'Chris Johnson|CJ2K', 'Arian Foster',
        'LeSean McCoy|Shady McCoy', 'Shaun Alexander'],
    3: ['Edgerrin James|Edge', 'Priest Holmes', 'Ricky Williams', 'Jamal Lewis', 'Curtis Martin',
        'Maurice Jones-Drew|MJD', 'DeMarco Murray', 'Josh Jacobs', 'James Cook', 'Kareem Hunt'],
  })),

  prompt('lead-rush-td', 'League Leaders', 'Name a player who led the NFL in rushing touchdowns (1980 or later)', merge(L80.rushTd, {
    1: ['Derrick Henry|King Henry', 'LaDainian Tomlinson|LT', 'Adrian Peterson|AP|All Day', 'Marshawn Lynch|Beast Mode'],
    2: ['Todd Gurley', 'Jonathan Taylor', 'Shaun Alexander', 'Marshall Faulk', 'Priest Holmes', 'Arian Foster',
        'LeSean McCoy|Shady McCoy', 'Jahmyr Gibbs'],
    3: ['Jamaal Charles', 'DeMarco Murray', 'Aaron Jones', 'DeAngelo Williams', 'LeGarrette Blount', 'James Cook',
        'Devonta Freeman'],
    4: ['Jamaal Williams', 'Raheem Mostert', 'Jeremy Hill'],
  })),

  prompt('lead-rec-yds', 'League Leaders', 'Name a player who led the NFL in receiving yards (1980 or later)', merge(L80.recYds, {
    1: ['Calvin Johnson|Megatron', 'Justin Jefferson', 'Tyreek Hill', 'Julio Jones'],
    2: ['Antonio Brown|AB', "Ja'Marr Chase", 'Cooper Kupp', 'Andre Johnson', 'Steve Smith|Steve Smith Sr.',
        'Michael Thomas', 'Stefon Diggs', 'Jaxon Smith-Njigba|JSN'],
    3: ['Marvin Harrison', 'Reggie Wayne', 'Torry Holt', 'Josh Gordon', 'Chad Johnson|Chad Ochocinco|Ochocinco',
        'T.Y. Hilton|TY Hilton'],
    4: ['Muhsin Muhammad', 'David Boston', 'Brandon Lloyd'],
  })),

  prompt('lead-rec-td', 'League Leaders', 'Name a player who led the NFL in receiving touchdowns (1980 or later)', merge(L80.recTd, {
    1: ['Randy Moss', 'Terrell Owens|T.O.|TO', 'Davante Adams', 'Rob Gronkowski|Gronk'],
    2: ['Calvin Johnson|Megatron', 'Larry Fitzgerald', 'Dez Bryant', 'Tyreek Hill', 'Mike Evans', "Ja'Marr Chase",
        'Antonio Brown|AB', 'Cooper Kupp', 'DeAndre Hopkins|Nuk', 'Jimmy Graham'],
    3: ['Marvin Harrison', 'Steve Smith|Steve Smith Sr.', 'Brandon Marshall', 'Jordy Nelson', 'Vernon Davis',
        'Allen Robinson', 'Doug Baldwin', 'Kenny Golladay', 'Dwayne Bowe'],
    4: ['Muhsin Muhammad', 'James Jones'],
  })),

  prompt('lead-receptions', 'League Leaders', 'Name a player who led the NFL in receptions (1980 or later)', merge(L80.receptions, {
    1: ['Justin Jefferson', 'Calvin Johnson|Megatron', 'CeeDee Lamb', 'Wes Welker'],
    2: ['Larry Fitzgerald', 'Antonio Brown|AB', 'Julio Jones', "Ja'Marr Chase", 'Cooper Kupp', 'Michael Thomas',
        'Tony Gonzalez', 'Puka Nacua', 'Stefon Diggs', 'Andre Johnson'],
    3: ['Marvin Harrison', 'Jarvis Landry', 'Torry Holt', 'Steve Smith|Steve Smith Sr.', 'Roddy White'],
    4: ['T.J. Houshmandzadeh|TJ Houshmandzadeh|Housh', 'Pierre Garcon|Pierre Garçon', 'Rod Smith', 'Muhsin Muhammad'],
  })),

  prompt('lead-int', 'League Leaders', 'Name a player who led the NFL in interceptions (1980 or later)', merge(L80.int, {
    1: ['Ed Reed', 'Charles Woodson', 'Richard Sherman', 'Champ Bailey', 'Trevon Diggs'],
    2: ['Ty Law', 'Asante Samuel', 'Darius Slay|Big Play Slay', 'Xavien Howard', 'Stephon Gilmore', 'Marcus Peters',
        'Ronde Barber', 'Antonio Cromartie', 'Rod Woodson', 'Minkah Fitzpatrick'],
    3: ['Eric Weddle', 'Kevin Byard', 'Darren Sharper', 'Daron Bland|DaRon Bland', 'Kerby Joseph',
        "Tre'Davious White", 'Justin Simmons', 'Tariq Woolen', 'Glover Quin', 'Jairus Byrd', 'Casey Hayward',
        'Kyle Fuller', 'Chauncey Gardner-Johnson|CJGJ'],
    4: ['Tim Jennings', 'Reggie Nelson', 'Damontae Kazee', 'Anthony Harris', 'Kyle Arrington', "Deltha O'Neal",
        'Brian Kelly', 'Tony Parrish', 'Brian Russell', 'Anthony Henry', 'Dexter McCleon'],
  })),

  prompt('lead-sacks', 'League Leaders', 'Name a player who led the NFL in sacks (1982 or later)', merge(L80.sacks, {
    1: ['J.J. Watt|JJ Watt', 'T.J. Watt|TJ Watt', 'Myles Garrett', 'Aaron Donald'],
    2: ['Michael Strahan', 'DeMarcus Ware', 'Jared Allen', 'Nick Bosa', 'Jason Taylor', 'Dwight Freeney',
        'Justin Houston'],
    3: ['Chandler Jones', 'Trey Hendrickson', 'Shawne Merriman', 'Robert Mathis', 'Elvis Dumervil', 'Shaquil Barrett'],
    4: ['Vic Beasley', 'Derrick Burgess', "La'Roi Glover"],
  })),

  prompt('40-td-season', 'Records', 'Name a quarterback with a 40-touchdown passing season', {
    1: ['Tom Brady', 'Peyton Manning', 'Patrick Mahomes', 'Aaron Rodgers', 'Drew Brees'],
    2: ['Dan Marino', 'Matthew Stafford', 'Joe Burrow', 'Lamar Jackson'],
    3: ['Andrew Luck', 'Baker Mayfield', 'Russell Wilson', 'Kurt Warner'],
  }),

  prompt('rec-1500', 'Records', 'Name a player with a 1,500-yard receiving season (2000 or later)', {
    1: ['Calvin Johnson|Megatron', 'Justin Jefferson', 'Tyreek Hill', 'Julio Jones', "Ja'Marr Chase"],
    2: ['Antonio Brown|AB', 'Cooper Kupp', 'CeeDee Lamb', 'Davante Adams', 'Andre Johnson', 'Randy Moss',
        'DeAndre Hopkins|Nuk', 'Mike Evans', 'Puka Nacua', 'Amon-Ra St. Brown', 'Stefon Diggs',
        'Jaxon Smith-Njigba|JSN', 'Michael Thomas'],
    3: ['Marvin Harrison', 'Reggie Wayne', 'Torry Holt', 'Steve Smith|Steve Smith Sr.', 'Brandon Marshall',
        'Wes Welker', 'Jordy Nelson', 'Josh Gordon', 'Victor Cruz', 'Demaryius Thomas'],
    4: ['Rod Smith', 'David Boston'],
  }),

  prompt('player-coach-sb', 'Super Bowl', 'Name someone who won a Super Bowl as a player and as a head coach', {
    1: ['Mike Ditka'],
    2: ['Tony Dungy', 'Tom Flores'],
    3: ['Doug Pederson'],
  }),

  prompt('heisman-mvp', 'Awards', 'Name a Heisman winner who also won NFL MVP', {
    1: ['Lamar Jackson', 'Cam Newton', 'Barry Sanders'],
    2: ['Marcus Allen', 'O.J. Simpson|OJ', 'Earl Campbell'],
    3: ['Paul Hornung'],
  }),

  prompt('heisman-sb', 'Awards', 'Name a Heisman winner who won a Super Bowl', {
    1: ['Roger Staubach', 'Charles Woodson', 'Desmond Howard', 'Marcus Allen', 'Reggie Bush'],
    2: ['Tony Dorsett', 'Jim Plunkett', 'DeVonta Smith'],
    3: ['Mike Garrett'],
    4: ['Paul Hornung'],
  }),

  prompt('rule-named', 'Rules', 'Name an NFL rule nicknamed after a person', {
    1: ['Rooney Rule', 'Brady Rule|Tom Brady Rule', 'Calvin Johnson Rule'],
    2: ['Dez Bryant Rule', 'Mel Blount Rule', 'Emmitt Smith Rule'],
    3: ['Deacon Jones Rule', 'Hines Ward Rule', 'Lester Hayes Rule|Stickum Rule', 'Carson Palmer Rule'],
    4: ['Ken Stabler Rule|Holy Roller Rule', 'Bert Emanuel Rule'],
  }, { ignore: ['rule'] }),

  prompt('mlb-nfl', 'History', 'Name someone who played in both the NFL and Major League Baseball', {
    1: ['Bo Jackson', 'Deion Sanders|Prime Time'],
    2: ['Brian Jordan', 'Jim Thorpe'],
    3: ['Drew Henson', 'Chad Hutchinson', 'George Halas', 'D.J. Dozier|DJ Dozier'],
    4: ['Ernie Nevers', 'Paddy Driscoll', 'Ace Parker', 'Matt Kinzer', 'Tom Brown'],
  }),

  prompt('hof-rb', 'Hall of Fame', 'Name a Hall of Fame running back', {
    1: ['Barry Sanders', 'Walter Payton|Sweetness', 'Emmitt Smith', 'Jim Brown', 'LaDainian Tomlinson|LT'],
    2: ['Eric Dickerson', 'Marshall Faulk', 'Earl Campbell', 'Tony Dorsett', 'Marcus Allen', 'Jerome Bettis|The Bus',
        'Curtis Martin', 'Edgerrin James|Edge', 'Terrell Davis', 'Thurman Thomas', 'O.J. Simpson|OJ',
        'Franco Harris', 'Gale Sayers'],
    3: ['John Riggins', 'Larry Csonka', 'Roger Craig', 'Floyd Little', 'Leroy Kelly', 'Paul Hornung', 'Jim Taylor',
        'Lenny Moore', 'Joe Perry', 'Hugh McElhenny', 'Red Grange', 'Jim Thorpe', 'Bronko Nagurski'],
    4: ['Ollie Matson', 'John Henry Johnson', 'Marion Motley', 'Steve Van Buren', 'Frank Gifford', 'Doak Walker',
        'Charley Trippi|Charlie Trippi', 'Ernie Nevers', 'Bill Dudley'],
    5: ['Tony Canadeo', 'Clarke Hinkle', 'Cliff Battles', 'Tuffy Leemans', 'Joe Guyon', 'Fritz Pollard', 'Ken Strong',
        'Johnny Blood|John McNally'],
  }),

  prompt('hof-lb', 'Hall of Fame', 'Name a Hall of Fame linebacker', {
    1: ['Lawrence Taylor|LT', 'Ray Lewis', 'Dick Butkus', 'Brian Urlacher', 'Luke Kuechly'],
    2: ['Mike Singletary', 'Derrick Brooks', 'Junior Seau', 'Jack Lambert', 'Jack Ham', 'Derrick Thomas',
        'Ray Nitschke', 'Patrick Willis', 'Zach Thomas', 'DeMarcus Ware'],
    3: ['Kevin Greene', 'Rickey Jackson', 'Andre Tippett', 'Harry Carson', 'Sam Mills', 'Willie Lanier', 'Bobby Bell',
        'Ted Hendricks', 'Nick Buoniconti', 'Sam Huff', 'Chuck Bednarik', 'Randy Gradishar'],
    4: ['Chris Hanburger', 'Dave Robinson', 'Joe Schmidt', 'Bill George', 'Dave Wilcox', 'Les Richter'],
  }),

  prompt('hof-ol', 'Hall of Fame', 'Name a Hall of Fame offensive lineman', {
    1: ['Anthony Muñoz|Anthony Munoz', 'Joe Thomas', 'Jonathan Ogden', 'Larry Allen', 'Bruce Matthews'],
    2: ['Walter Jones', 'Orlando Pace', 'Gene Upshaw', 'Art Shell', 'Mike Webster', 'John Hannah', 'Mike Munchak',
        'Forrest Gregg', 'Jim Otto', 'Alan Faneca', 'Willie Roaf', 'Tony Boselli', 'Steve Hutchinson'],
    3: ['Dermontti Dawson', 'Dwight Stephenson', 'Jim Parker', 'Randall McDaniel', 'Will Shields', 'Kevin Mawae',
        'Gary Zimmerman', 'Russ Grimm', 'Jackie Slater', 'Ron Yary', 'Rayfield Wright', 'Jerry Kramer', 'Dan Dierdorf',
        'Joe DeLamielleure'],
    4: ['Ron Mix', 'Bob Brown', 'Tom Mack', 'Jim Ringo', 'Mike McCormack', 'Stan Jones', 'Bob St. Clair', 'Mel Hein',
        'Roosevelt Brown', 'Lou Creekmur'],
  }),

  prompt('celebrations', 'History', 'Name a famous NFL touchdown celebration', {
    1: ['Lambeau Leap', 'Griddy', 'Ickey Shuffle', 'Gronk Spike'],
    2: ['Mile High Salute', 'Dirty Bird', 'Discount Double Check', 'Superman', 'Dab', 'Spike',
        'Goalpost Dunk|Crossbar Dunk|Dunk'],
    3: ['Sharpie|Sharpie Signature', 'Fun Bunch', 'Sack Dance|New York Sack Dance', 'Popcorn', 'Riverdance'],
  }),

  prompt('no-nfl-state', 'Geography', 'Name a U.S. state with no NFL team', {
    1: ['Alabama', 'Oklahoma', 'Oregon', 'Utah', 'Kentucky', 'Iowa'],
    2: ['Arkansas', 'Nebraska', 'Kansas', 'South Carolina', 'Mississippi', 'Hawaii', 'Alaska', 'Virginia', 'Connecticut'],
    3: ['Idaho', 'Montana', 'New Mexico', 'West Virginia', 'Rhode Island', 'Delaware', 'Maine', 'New Hampshire',
        'Vermont', 'Wyoming', 'North Dakota', 'South Dakota'],
  }),

  prompt('qb-class-1983', 'Draft', 'Name a quarterback taken in the first round of the 1983 draft', {
    1: ['John Elway', 'Dan Marino', 'Jim Kelly'],
    3: ['Tony Eason', "Ken O'Brien"],
    4: ['Todd Blackledge'],
  }),

  prompt('qb-class-2004', 'Draft', 'Name a quarterback taken in the first round of the 2004 draft', {
    1: ['Eli Manning', 'Ben Roethlisberger|Big Ben', 'Philip Rivers'],
    4: ['J.P. Losman|JP Losman'],
  }),

  prompt('qb-class-2018', 'Draft', 'Name a quarterback taken in the first round of the 2018 draft', {
    1: ['Josh Allen', 'Lamar Jackson', 'Baker Mayfield'],
    2: ['Sam Darnold'],
    4: ['Josh Rosen'],
  }),

  prompt('qb-class-2021', 'Draft', 'Name a quarterback taken in the first round of the 2021 draft', {
    1: ['Trevor Lawrence', 'Justin Fields'],
    2: ['Zach Wilson', 'Mac Jones'],
    3: ['Trey Lance'],
  }),

  prompt('qb-class-2024', 'Draft', 'Name a quarterback taken in the first round of the 2024 draft', {
    1: ['Caleb Williams', 'Jayden Daniels', 'Drake Maye'],
    2: ['Bo Nix', 'J.J. McCarthy|JJ McCarthy', 'Michael Penix Jr.|Michael Penix'],
  }),
]
