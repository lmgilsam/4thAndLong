import { prompt, type PromptDef } from './types'
import { NFL as T, CFB as C } from './teams'

// Batch 2 (added Nov 3, 2026). Facts checked through the 2025 season,
// Super Bowl LX (Feb 2026) and the Hall of Fame Class of 2026.

export const BATCH_2: PromptDef[] = [
  prompt('animal-team', 'NFL', 'Name an NFL team named after an animal', {
    1: [T.PHI, T.CHI, T.DET, T.MIA, T.DEN],
    2: [T.ATL, T.BAL, T.SEA, T.LAR, T.IND, T.CAR],
    3: [T.CIN, T.JAX, T.ARI],
  }),

  prompt('sb-lost-only', 'Super Bowl', 'Name a team that has played in a Super Bowl but never won one', {
    1: [T.BUF, T.MIN],
    2: [T.CIN, T.ATL, T.CAR],
    3: [T.LAC, T.TEN, T.ARI],
  }),

  prompt('never-in-sb', 'Super Bowl', 'Name an NFL team that has never played in a Super Bowl', {
    1: [T.DET, T.CLE],
    2: [T.HOU],
    3: [T.JAX],
  }),

  prompt('back-to-back', 'Super Bowl', 'Name a team that won back-to-back Super Bowls', {
    1: [T.NE, T.KC, T.PIT],
    2: [T.GB, T.DAL, T.DEN, T.SF],
    3: [T.MIA],
  }),

  prompt('sb-mvp', 'Super Bowl', 'Name a Super Bowl MVP', {
    1: ['Tom Brady', 'Patrick Mahomes', 'Joe Montana', 'Peyton Manning', 'Eli Manning'],
    2: ['Jerry Rice', 'Terry Bradshaw', 'John Elway', 'Ray Lewis', 'Drew Brees', 'Aaron Rodgers',
        'Von Miller', 'Nick Foles', 'Jalen Hurts', 'Cooper Kupp', 'Steve Young', 'Troy Aikman',
        'Emmitt Smith', 'Kurt Warner', 'Joe Flacco', 'Julian Edelman', 'Bart Starr', 'Joe Namath',
        'Roger Staubach'],
    3: ['Hines Ward', 'Santonio Holmes', 'Desmond Howard', 'Terrell Davis', 'Marcus Allen', 'Lynn Swann',
        'Franco Harris', 'Kenneth Walker III|Kenneth Walker', 'Malcolm Smith', 'Deion Branch',
        'Richard Dent', 'John Riggins', 'Phil Simms', 'Doug Williams', 'Jim Plunkett', 'Larry Csonka',
        'Fred Biletnikoff'],
    4: ['Ottis Anderson|OJ Anderson', 'Mark Rypien', 'Dexter Jackson', 'Larry Brown', 'Len Dawson',
        'Chuck Howley', 'Jake Scott', 'Harvey Martin', 'Randy White'],
  }),

  prompt('mvp-2000', 'Awards', 'Name an NFL MVP from 2000 or later', {
    1: ['Patrick Mahomes', 'Tom Brady', 'Peyton Manning', 'Aaron Rodgers', 'Lamar Jackson', 'Josh Allen'],
    2: ['Matthew Stafford', 'Cam Newton', 'Matt Ryan|Matty Ice', 'Adrian Peterson|AP|All Day',
        'LaDainian Tomlinson|LT', 'Kurt Warner'],
    3: ['Shaun Alexander', 'Marshall Faulk', 'Rich Gannon', 'Steve McNair|Air McNair'],
  }),

  prompt('5000-yards', 'Records', 'Name a quarterback with a 5,000-yard passing season', {
    1: ['Tom Brady', 'Drew Brees', 'Peyton Manning', 'Patrick Mahomes'],
    2: ['Dan Marino', 'Matthew Stafford', 'Ben Roethlisberger|Big Ben'],
    3: ['Justin Herbert', 'Jameis Winston'],
  }),

  prompt('500-tds', 'Records', 'Name a quarterback with 500+ career touchdown passes', {
    1: ['Tom Brady', 'Peyton Manning'],
    2: ['Drew Brees', 'Brett Favre'],
    3: ['Aaron Rodgers'],
  }),

  prompt('20-sacks', 'Records', 'Name a player with a 20-sack season', {
    1: ['J.J. Watt|JJ Watt', 'T.J. Watt|TJ Watt', 'Michael Strahan', 'Myles Garrett'],
    2: ['Aaron Donald', 'Lawrence Taylor|LT', 'Reggie White', 'DeMarcus Ware', 'Jared Allen'],
    3: ['Justin Houston', 'Derrick Thomas', 'Mark Gastineau'],
    4: ['Chris Doleman'],
  }),

  prompt('dpoy-2000', 'Awards', 'Name a Defensive Player of the Year from 2000 or later', {
    1: ['J.J. Watt|JJ Watt', 'Aaron Donald', 'Myles Garrett', 'T.J. Watt|TJ Watt', 'Ray Lewis'],
    2: ['Ed Reed', 'Troy Polamalu', 'Luke Kuechly', 'Khalil Mack', 'Nick Bosa', 'Michael Strahan',
        'Brian Urlacher', 'Charles Woodson', 'Patrick Surtain II|Pat Surtain|Patrick Surtain'],
    3: ['Stephon Gilmore', 'Terrell Suggs', 'James Harrison', 'Jason Taylor', 'Derrick Brooks'],
    4: ['Bob Sanders'],
  }),

  prompt('oroy', 'Awards', 'Name an Offensive Rookie of the Year from 2010 to 2025', {
    1: ['Justin Herbert', 'Saquon Barkley', "Ja'Marr Chase", 'C.J. Stroud|CJ Stroud', 'Jayden Daniels',
        'Dak Prescott'],
    2: ['Cam Newton', 'Odell Beckham Jr.|OBJ|Odell Beckham', 'Alvin Kamara', 'Kyler Murray',
        'Robert Griffin III|RG3|RGIII', 'Todd Gurley', 'Tetairoa McMillan|Tet McMillan|Tet'],
    3: ['Garrett Wilson', 'Eddie Lacy', 'Sam Bradford'],
  }),

  prompt('hof-wr', 'Hall of Fame', 'Name a Hall of Fame wide receiver', {
    1: ['Jerry Rice', 'Randy Moss', 'Terrell Owens|T.O.|TO', 'Larry Fitzgerald', 'Calvin Johnson|Megatron'],
    2: ['Marvin Harrison', 'Cris Carter', 'Michael Irvin|The Playmaker', 'Tim Brown', 'Isaac Bruce',
        'Andre Johnson', 'Lynn Swann', 'Steve Largent'],
    3: ['Andre Reed', 'Art Monk', 'James Lofton', 'John Stallworth', 'Sterling Sharpe', 'Don Hutson',
        'Fred Biletnikoff', 'Paul Warfield', 'Lance Alworth', 'Raymond Berry', 'Bob Hayes',
        'Charlie Joiner', 'Drew Pearson'],
    4: ['Don Maynard', 'Charley Taylor', 'Tommy McDonald', 'Harold Carmichael', 'Cliff Branch',
        'Elroy Hirsch|Crazylegs Hirsch', 'Tom Fears', 'Dante Lavelli', 'Mac Speedie', 'Bobby Mitchell'],
    5: ['Pete Pihos', 'Bill Hewitt', 'Wayne Millner'],
  }),

  prompt('hof-kicker', 'Hall of Fame', 'Name a kicker or punter in the Hall of Fame', {
    1: ['Adam Vinatieri', 'Ray Guy'],
    2: ['Morten Andersen', 'Jan Stenerud'],
    3: ['Lou Groza|The Toe'],
    4: ['George Blanda'],
  }),

  prompt('hbcu', 'College', 'Name an HBCU that plays football', {
    1: ['Jackson State|JSU', 'Grambling State|Grambling', 'Southern|Southern University',
        'Florida A&M|FAMU', 'Howard'],
    2: ['Prairie View A&M|Prairie View|PVAMU', 'Texas Southern|TSU', 'Tennessee State',
        'North Carolina A&T|NC A&T|NCAT', 'Alabama State', 'Bethune-Cookman', 'Morgan State', 'Hampton',
        'Alcorn State|Alcorn'],
    3: ['Alabama A&M', 'South Carolina State|SC State', 'North Carolina Central|NC Central|NCCU',
        'Norfolk State', 'Delaware State', 'Mississippi Valley State|MVSU',
        'Arkansas-Pine Bluff|UAPB|Arkansas Pine Bluff', 'Morehouse', 'Tuskegee'],
    4: ['Fort Valley State', 'Albany State', 'Savannah State', 'Virginia State', 'Virginia Union',
        'Winston-Salem State', 'Bowie State', 'Miles', 'Benedict', 'Kentucky State', 'Langston', 'Lane',
        'Clark Atlanta', 'Central State', 'Fayetteville State', 'Johnson C. Smith|JCSU',
        'Livingstone', 'Elizabeth City State', 'Edward Waters'],
    5: ['Lincoln University|Lincoln', 'West Virginia State', 'Allen University|Allen', 'Texas College', 'Shaw'],
  }),

  prompt('tigers', 'College', 'Name a college football program nicknamed the Tigers', {
    1: [C.LSU, C.AUB, C.CLEM, C.MIZ],
    2: ['Memphis', 'Princeton'],
    3: ['Grambling State|Grambling', 'Jackson State', 'Texas Southern', 'Tennessee State', 'Towson'],
    4: ['Sewanee', 'DePauw', 'Hampden-Sydney', 'Trinity|Trinity Texas', 'Fort Hays State', 'Savannah State'],
  }),

  prompt('cfb-title-coach', 'College', 'Name a coach who won a college football national title since 2000', {
    1: ['Nick Saban', 'Kirby Smart', 'Dabo Swinney', 'Urban Meyer'],
    2: ['Jim Harbaugh', 'Ryan Day', 'Curt Cignetti', 'Pete Carroll', 'Jimbo Fisher', 'Mack Brown',
        'Ed Orgeron|Coach O', 'Les Miles'],
    3: ['Gene Chizik', 'Jim Tressel', 'Bob Stoops'],
    4: ['Larry Coker'],
  }),

  prompt('scoring', 'Rules', 'Name a way to score points in football', {
    1: ['Touchdown|TD', 'Field Goal|FG', 'Safety'],
    2: ['Extra Point|PAT|Point After|Point After Touchdown', 'Two-Point Conversion|Two Point Conversion|2 Point Conversion|Two Pointer'],
    3: ['Pick Six|Pick 6|Interception Return', 'Fumble Return|Scoop and Score', 'Kickoff Return|Kick Return',
        'Punt Return'],
    4: ['Defensive Two-Point Conversion|Defensive Conversion|Defensive Two Point'],
    5: ['Fair Catch Kick', 'Drop Kick', 'One-Point Safety|One Point Safety|Conversion Safety'],
  }),

  prompt('officials', 'Rules', 'Name a position on a football officiating crew', {
    1: ['Referee|Ref'],
    2: ['Umpire', 'Line Judge', 'Back Judge'],
    3: ['Side Judge', 'Field Judge', 'Down Judge|Head Linesman|Linesman'],
    4: ['Replay Official|Replay Assistant|Replay'],
    5: ['Center Judge', 'Chain Crew|Chain Gang'],
  }),

  prompt('equipment', 'Rules', 'Name a piece of football equipment', {
    1: ['Helmet', 'Shoulder Pads', 'Football|Ball|Pigskin', 'Cleats', 'Mouthguard|Mouth Guard|Mouthpiece'],
    2: ['Jersey', 'Gloves', 'Face Mask|Facemask', 'Chin Strap|Chinstrap', 'Knee Pads', 'Thigh Pads',
        'Kicking Tee|Tee', 'Pylon'],
    3: ['Hip Pads', 'Visor', 'Eye Black', 'Rib Protector|Flak Jacket', 'Neck Roll',
        'Wristband|Wrist Coach|Play Wristband', 'Headset', 'Goalpost|Goal Post|Uprights',
        'Down Marker|Down Box|Chains|First Down Chains|Sticks', 'Tailbone Pad', 'Guardian Cap', 'Girdle',
        'Elbow Pads', 'Arm Sleeve|Sleeves'],
    4: ['Back Plate', 'Cup|Protective Cup', 'Knee Brace', 'Hand Warmer', 'Sideline Cape|Cape', 'Towel',
        'Athletic Tape|Tape', 'Helmet Radio|Radio Helmet|Green Dot', 'Blocking Sled|Sled',
        'Tackling Dummy|Dummy', 'Jugs Machine|Jugs'],
    5: ['Spats', 'Hand Pads', 'Rain Gloves'],
  }),

  prompt('kick-types', 'Rules', 'Name a type of kick or punt', {
    1: ['Punt', 'Kickoff', 'Field Goal', 'Onside Kick'],
    2: ['Extra Point|PAT', 'Squib Kick', 'Pooch Punt|Pooch Kick', 'Free Kick'],
    3: ['Drop Kick', 'Rugby Punt|Rugby Kick', 'Coffin Corner', 'Quick Kick', 'Surprise Onside Kick|Surprise Onside'],
    4: ['Fair Catch Kick', 'Sky Kick|Pop Up Kick|Pop-Up Kick', 'Directional Punt', 'Australian Punt|Aussie Punt',
        'Mortar Kick'],
    5: ['End Over End', 'Spiral Punt|Spiral'],
  }, { ignore: ['kick', 'punt'] }),

  prompt('halftime', 'Super Bowl', 'Name a Super Bowl halftime show performer', {
    1: ['Beyoncé|Beyonce', 'Michael Jackson|MJ', 'Prince', 'Rihanna', 'Kendrick Lamar|Kendrick', 'Bad Bunny',
        'Usher', 'The Weeknd|Weeknd', 'Lady Gaga', 'Shakira', 'Jennifer Lopez|J.Lo|JLo'],
    2: ['Dr. Dre|Dre', 'Snoop Dogg|Snoop', 'Eminem', 'Katy Perry', 'Bruno Mars', 'Coldplay', 'Madonna',
        'Justin Timberlake', 'Janet Jackson', 'Maroon 5', 'Bruce Springsteen|Springsteen', 'Paul McCartney',
        'U2', 'The Rolling Stones|Rolling Stones', 'The Who', 'Tom Petty', '50 Cent'],
    3: ['Mary J. Blige', 'Travis Scott', 'Big Boi', 'Gloria Estefan', 'Aerosmith', 'NSYNC|N Sync',
        'Britney Spears', 'Diana Ross', 'Shania Twain', 'No Doubt|Gwen Stefani', 'Sting',
        'Black Eyed Peas', "Destiny's Child", 'Missy Elliott', 'Nelly', 'Diddy|P. Diddy|Puff Daddy',
        'Kid Rock', 'Stevie Wonder', 'Christina Aguilera', 'Phil Collins', 'Nicki Minaj', 'SZA',
        'Alicia Keys', 'Ludacris', 'Lil Jon', 'Lenny Kravitz', 'Red Hot Chili Peppers|RHCP'],
    4: ['Toni Braxton', 'Enrique Iglesias', 'M.I.A.|MIA', 'LMFAO', 'Cee Lo Green|CeeLo', 'Ricky Martin',
        'Anderson .Paak|Anderson Paak', 'will.i.am|Will I Am', 'H.E.R.|HER', 'Boyz II Men',
        'Smokey Robinson', 'Queen Latifah', 'Patti LaBelle', 'Tony Bennett'],
    5: ['New Kids on the Block|NKOTB', 'ZZ Top', 'James Brown', 'Martha Reeves', 'Savion Glover',
        'The Temptations|Temptations', 'The Judds|Judds', 'Clint Black', 'Travis Tritt', 'Tanya Tucker'],
  }),

  prompt('owners', 'NFL', 'Name an NFL team owner, past or present', {
    1: ['Jerry Jones', 'Robert Kraft', 'Al Davis', 'Mark Davis'],
    2: ['Arthur Blank', 'Stan Kroenke', 'Dan Snyder', 'Jimmy Haslam', 'Shad Khan', 'Jeffrey Lurie',
        'Art Rooney', 'Dan Rooney', 'Woody Johnson', 'John Mara', 'Clark Hunt', 'David Tepper',
        'Terry Pegula', 'Jim Irsay', 'Stephen Ross', 'Bob McNair', 'George Halas|Papa Bear'],
    3: ['Cal McNair', 'Jed York', 'Josh Harris', 'Steve Bisciotti', 'Michael Bidwill', 'Mike Brown',
        'Paul Brown', 'Gayle Benson', 'Tom Benson', 'Zygi Wilf', 'Sheila Ford Hamp', 'Dean Spanos',
        'Jody Allen', 'Paul Allen', 'Joel Glazer', 'Malcolm Glazer', 'Pat Bowlen', 'Art Modell',
        'Eddie DeBartolo|Edward DeBartolo', 'Lamar Hunt', 'Ralph Wilson', 'Wellington Mara',
        'Kim Pegula', 'Virginia McCaskey'],
    4: ['Greg Penner', 'Amy Adams Strunk', 'Bud Adams', 'Jerry Richardson', 'Steve Tisch',
        'Carlie Irsay-Gordon|Carlie Irsay', 'Carroll Rosenbloom', 'Georgia Frontiere', 'Jack Kent Cooke',
        'Wayne Huizenga', 'Joe Robbie', 'Tim Mara', 'William Clay Ford', 'Alex Spanos', 'Bill Bidwill',
        'Bryan Glazer'],
    5: ['Bert Bell', 'Green Bay Shareholders|Packers Shareholders|The Fans|Shareholders'],
  }),

  prompt('broadcasters', 'NFL', 'Name an NFL broadcaster (announcer, analyst, or studio host)', {
    1: ['John Madden', 'Tony Romo', 'Jim Nantz', 'Al Michaels', 'Troy Aikman', 'Joe Buck', 'Tom Brady',
        'Cris Collinsworth'],
    2: ['Pat Summerall', 'Mike Tirico', 'Kirk Herbstreit', 'Greg Olsen', 'Kevin Burkhardt', 'Phil Simms',
        'Chris Berman|Boomer', 'Frank Gifford', 'Howard Cosell', 'Erin Andrews', 'Terry Bradshaw',
        'Howie Long', 'Michael Strahan', 'Jimmy Johnson'],
    3: ['Ian Eagle', 'Kevin Harlan', 'Dan Dierdorf', 'Jon Gruden', 'Boomer Esiason', 'Dan Fouts',
        'Bob Costas', 'Jason Witten', 'Booger McFarland', 'Joe Tessitore', 'Michele Tafoya',
        'Tracy Wolfson', 'Dick Enberg', 'Brent Musburger', 'Gus Johnson', 'Charles Davis', 'Nate Burleson',
        'Rich Eisen', 'James Brown|JB', 'Curt Menefee', 'Ron Jaworski|Jaws', 'Kenny Albert', 'Chris Myers',
        'Joe Theismann', 'Adam Schefter', 'Ian Rapoport'],
    4: ['Spero Dedes', 'Noah Eagle', 'Andrew Catalon', 'Jonathan Vilma', 'Mark Schlereth', 'Trent Green',
        'Rich Gannon', 'Steve Tasker', 'Kurt Warner', 'Daryl Johnston|Moose Johnston', 'Dan Orlovsky',
        'Ryan Clark', 'Mina Kimes', 'Mike Golic', 'Dick Vermeil', 'Merril Hoge'],
  }),

  prompt('rivalries', 'College', 'Name a college football rivalry game or trophy', {
    1: ['Iron Bowl', 'The Game|Michigan Ohio State', 'Red River Rivalry|Red River Showdown|Red River Shootout|Red River',
        'Army-Navy|Army Navy Game|Army Navy', 'Egg Bowl'],
    2: ['Apple Cup', 'Holy War', 'Backyard Brawl', 'Bedlam', 'Lone Star Showdown', 'Civil War',
        'Old Oaken Bucket', 'Little Brown Jug', "Paul Bunyan's Axe|Paul Bunyans Axe", 'Floyd of Rosedale',
        "World's Largest Outdoor Cocktail Party|Florida Georgia", 'Third Saturday in October', 'Bayou Classic',
        'Territorial Cup', 'Big Game', 'Victory Bell', 'Palmetto Bowl', 'Sunshine Showdown',
        'Clean Old-Fashioned Hate', 'Border War'],
    3: ['Battle of the Brazos', 'Bayou Bucket', 'Commonwealth Cup', "Deep South's Oldest Rivalry",
        'Jeweled Shillelagh', 'Megaphone Trophy|Megaphone', 'Golden Boot|Battle for the Golden Boot',
        'Magnolia Bowl', 'Rocky Mountain Showdown', 'Paul Bunyan Trophy', 'Cy-Hawk Trophy|Cy-Hawk|Cy Hawk',
        'Sunflower Showdown', 'Old Brass Spittoon', "Commander-in-Chief's Trophy|Commander in Chief's Trophy"],
    4: ['Land of Lincoln Trophy', 'Heroes Game|Heroes Trophy', 'Governor’s Cup|Governors Cup'],
  }, { ignore: ['rivalry', 'trophy'] }),

  prompt('conferences', 'College', 'Name a college football conference, past or present', {
    1: ['SEC|Southeastern', 'Big Ten|Big 10', 'Big 12|Big Twelve', 'ACC|Atlantic Coast',
        'Pac-12|Pac 12|Pac-10|Pac 10|Pac Twelve'],
    2: ['Mountain West|MWC', 'American Athletic|AAC|American', 'Sun Belt', 'MAC|Mid-American',
        'Conference USA|C-USA|CUSA', 'Big East', 'Ivy League|Ivy', 'Southwest Conference|SWC',
        'Big Eight|Big 8'],
    3: ['WAC|Western Athletic', 'SWAC|Southwestern Athletic', 'MEAC|Mid-Eastern Athletic', 'Big Sky',
        'Missouri Valley|MVFC', 'CAA|Colonial Athletic|Coastal Athletic', 'Southland', 'Patriot League|Patriot'],
    4: ['Ohio Valley|OVC', 'Big South', 'Pioneer League|Pioneer', 'Southern Conference|SoCon',
        'Northeast Conference|NEC', 'United Athletic Conference|UAC', 'Big West', 'Pacific Coast Conference|PCC',
        'Pac-8|Pac 8', 'Skyline', 'Border'],
  }, { ignore: ['conference', 'football'] }),

  prompt('texas-fbs', 'College', 'Name a Texas school that plays FBS football', {
    1: [C.TEX, C.TAMU, C.TTU, C.BAY, C.TCU],
    2: [C.UH, C.SMU, 'Rice|Rice Owls|Owls', 'North Texas|UNT|Mean Green'],
    3: ['UTSA|UT San Antonio|Roadrunners', 'UTEP|UT El Paso|Miners', 'Texas State|Bobcats',
        'Sam Houston|Sam Houston State|Bearkats'],
  }),

  prompt('unit-nicknames', 'History', 'Name a famous NFL team, unit, or era nickname', {
    1: ['Legion of Boom|LOB', 'Steel Curtain', 'Greatest Show on Turf', 'Purple People Eaters'],
    2: ['Monsters of the Midway', 'Orange Crush', 'Fearsome Foursome', 'Doomsday Defense|Doomsday',
        'The Hogs|Hogs', 'No-Name Defense|No Name Defense', "Killer B's|Killer Bs", 'Air Coryell',
        'Luv Ya Blue|Love Ya Blue', "America's Team", 'Gang Green', 'The Triplets|Triplets'],
    3: ['New York Sack Exchange|Sack Exchange', 'House of Pain', 'The Fun Bunch|Fun Bunch', 'The Smurfs|Smurfs',
        'Big Blue Wrecking Crew', 'Gritz Blitz', 'K-Gun|K Gun', 'Dirty Birds', 'Kardiac Kids|Cardiac Kids',
        'The Marks Brothers|Marks Brothers'],
  }),

  prompt('winless', 'History', 'Name an NFL team that went winless in a season since 1970', {
    1: [T.DET, T.CLE],
    2: [T.TB],
    4: [T.IND + '|Baltimore Colts'],
  }),

  prompt('lost-team', 'History', 'Name a city that has lost an NFL team (moved or folded)', {
    1: ['Oakland', 'St. Louis|St Louis|Saint Louis', 'San Diego', 'Houston'],
    2: ['Baltimore', 'Los Angeles|LA', 'Cleveland'],
    3: ['Boston', 'Chicago', 'Dallas'],
    4: ['Portsmouth', 'Decatur'],
    5: ['Canton', 'Duluth', 'Pottsville', 'Providence', 'Brooklyn', 'Frankford'],
  }),

  prompt('stadium', 'Stadiums', 'Name an NFL stadium, past or present', {
    1: ['Lambeau Field|Lambeau', 'Arrowhead Stadium|Arrowhead|GEHA Field at Arrowhead|GEHA Field',
        'AT&T Stadium|Jerry World|Cowboys Stadium', 'SoFi Stadium|SoFi', 'Soldier Field',
        'MetLife Stadium|MetLife'],
    2: ['Gillette Stadium', 'Lincoln Financial Field|The Linc|Linc', 'NRG Stadium|Reliant Stadium',
        'Caesars Superdome|Superdome|Louisiana Superdome|Mercedes-Benz Superdome',
        'Allegiant Stadium', "Levi's Stadium|Levis Stadium", 'Lumen Field|CenturyLink Field|Qwest Field',
        'Highmark Stadium|Ralph Wilson Stadium|Rich Stadium|New Era Field|Bills Stadium',
        'Mercedes-Benz Stadium', 'Hard Rock Stadium|Joe Robbie Stadium|Pro Player Stadium|Dolphin Stadium|Sun Life Stadium',
        'Lucas Oil Stadium', 'Ford Field', 'U.S. Bank Stadium|US Bank Stadium',
        'Empower Field at Mile High|Mile High|Sports Authority Field|Invesco Field|Mile High Stadium',
        'Acrisure Stadium|Heinz Field', 'M&T Bank Stadium', 'Raymond James Stadium|Raymond James',
        'Candlestick Park|Candlestick|3Com Park', 'Astrodome|Houston Astrodome', 'Texas Stadium',
        'Metrodome|Hubert H. Humphrey Metrodome'],
    3: ['State Farm Stadium|University of Phoenix Stadium', 'Bank of America Stadium',
        'Paycor Stadium|Paul Brown Stadium', 'Huntington Bank Field|Cleveland Browns Stadium|FirstEnergy Stadium',
        'Nissan Stadium|LP Field', 'EverBank Stadium|TIAA Bank Field|EverBank Field|Jacksonville Municipal Stadium',
        'Northwest Stadium|FedExField|FedEx Field', 'RFK Stadium|RFK', 'Giants Stadium',
        'Veterans Stadium|The Vet', 'Three Rivers Stadium|Three Rivers', 'Georgia Dome', 'Kingdome',
        'Pontiac Silverdome|Silverdome', 'Orange Bowl|Miami Orange Bowl',
        'Qualcomm Stadium|Jack Murphy Stadium|San Diego Stadium',
        'Oakland Coliseum|Oakland-Alameda County Coliseum|RingCentral Coliseum',
        'Los Angeles Memorial Coliseum|LA Coliseum|Memorial Coliseum',
        'Edward Jones Dome|Trans World Dome|Dome at Americas Center', 'RCA Dome|Hoosier Dome',
        'Shea Stadium', 'Riverfront Stadium|Cinergy Field', 'Cleveland Municipal Stadium',
        'Foxboro Stadium|Schaefer Stadium|Sullivan Stadium', 'Tampa Stadium|Big Sombrero',
        'Busch Stadium', 'Fulton County Stadium', 'Yankee Stadium', 'Wrigley Field', 'Tulane Stadium',
        'Rice Stadium', 'Wembley Stadium|Wembley'],
    4: ['Kezar Stadium', 'Polo Grounds', 'Comiskey Park', 'Fenway Park', 'Franklin Field',
        'Metropolitan Stadium|The Met', 'Anaheim Stadium|Angel Stadium', 'Jeppesen Stadium', 'Pitt Stadium',
        'Forbes Field', 'Tiger Stadium|Briggs Stadium', 'Liberty Bowl Memorial Stadium|Liberty Bowl Stadium',
        'Vanderbilt Stadium', 'Husky Stadium', 'Sun Devil Stadium', 'TCF Bank Stadium|TCF Bank',
        'StubHub Center|Dignity Health Sports Park', 'Tottenham Hotspur Stadium|Tottenham',
        'Estadio Azteca|Azteca', 'Memorial Stadium'],
    5: ['Allianz Arena', 'Croke Park', 'Santiago Bernabeu|Bernabeu', 'Deutsche Bank Park',
        'Neo Quimica Arena|Corinthians Arena'],
  }, { ignore: ['stadium', 'field', 'park'] }),
]
