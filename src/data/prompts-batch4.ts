import { prompt, type PromptDef } from './types'
import { NFL as T, CFB as C } from './teams'

// Batch 4 (added Nov 4, 2026). Facts checked through the 2025 season, Super Bowl LX
// (Seahawks 29, Patriots 13; MVP Kenneth Walker III), the 2025 AP MVP (Matthew Stafford),
// the Hall of Fame Class of 2026 (Brees, Fitzgerald, Kuechly, Vinatieri, Roger Craig),
// the 2025-26 CFP (Indiana champion) and the 2026 international games.

export const BATCH_4: PromptDef[] = [
  // ---------- Hall of Fame ----------
  prompt('hof-te', 'Hall of Fame', 'Name a Hall of Fame tight end', {
    1: ['Tony Gonzalez', 'Shannon Sharpe', 'Mike Ditka|Iron Mike'],
    2: ['Antonio Gates', 'Kellen Winslow', 'Ozzie Newsome|The Wizard of Oz'],
    3: ['John Mackey', 'Dave Casper|The Ghost'],
    4: ['Jackie Smith', 'Charlie Sanders'],
  }),

  prompt('hof-db', 'Hall of Fame', 'Name a Hall of Fame cornerback or safety', {
    1: ['Deion Sanders|Prime Time|Neon Deion', 'Ed Reed', 'Troy Polamalu', 'Charles Woodson', 'Ronnie Lott',
        'Champ Bailey'],
    2: ['Darrelle Revis|Revis Island', 'Rod Woodson', 'Brian Dawkins', 'Ty Law', 'Mel Blount', 'Darrell Green',
        'John Lynch', "Dick 'Night Train' Lane|Night Train Lane|Dick Lane|Night Train"],
    3: ['Ronde Barber', 'Aeneas Williams', 'Mike Haynes', 'Herb Adderley', 'Willie Brown', 'Steve Atwater',
        'LeRoy Butler', 'Ken Houston', 'Paul Krause', 'Mel Renfro', 'Lem Barney', 'Kenny Easley'],
    4: ['Larry Wilson', 'Emlen Tunnell', 'Willie Wood', 'Jimmy Johnson', 'Cliff Harris', 'Donnie Shell',
        'Eric Allen', 'Ken Riley', 'Dick LeBeau', 'Roger Wehrli', 'Emmitt Thomas', 'Johnny Robinson', 'Yale Lary',
        'Jack Christiansen'],
    5: ['Jack Butler', 'Bobby Dillon'],
  }),

  prompt('hof-dl', 'Hall of Fame', 'Name a Hall of Fame defensive lineman', {
    1: ['Reggie White|Minister of Defense', 'Bruce Smith', 'Deacon Jones', 'Michael Strahan', 'Warren Sapp',
        "Joe Greene|Mean Joe Greene|Mean Joe"],
    2: ['Howie Long', 'Merlin Olsen', 'Alan Page', 'Bob Lilly', 'Randy White', 'John Randle', 'Julius Peppers',
        'Jason Taylor', 'Charles Haley', 'Lee Roy Selmon', 'Cortez Kennedy', 'Richard Seymour', 'Dwight Freeney',
        'Jared Allen'],
    3: ['Chris Doleman', 'Richard Dent', 'Jack Youngblood', 'Dan Hampton', 'Bryant Young', 'Gino Marchetti',
        'Carl Eller', 'Fred Dean', 'Steve McMichael|Mongo', 'Joe Klecko', 'Elvin Bethea', 'Curley Culp'],
    4: ['Claude Humphrey', 'Buck Buchanan', 'Willie Davis', 'Doug Atkins', 'Art Donovan', 'Henry Jordan',
        'Ernie Stautner', 'Leo Nomellini', 'Andy Robustelli', 'Len Ford'],
    5: ['Arnie Weinmeister', 'Ed Sprinkle'],
  }),

  prompt('hof-coach', 'Hall of Fame', 'Name a head coach in the Hall of Fame', {
    1: ['Vince Lombardi', 'Don Shula', 'Tom Landry', 'Bill Walsh', 'John Madden'],
    2: ['Bill Parcells|The Big Tuna', 'Joe Gibbs', 'Chuck Noll', 'Tony Dungy', 'Bill Cowher', 'Jimmy Johnson',
        'Marv Levy', 'George Halas|Papa Bear', 'Paul Brown'],
    3: ['Bud Grant', 'Hank Stram', 'Dick Vermeil', 'Tom Flores', 'Curly Lambeau', 'Don Coryell', 'George Allen',
        'Sid Gillman', 'Weeb Ewbank'],
    4: ['Steve Owen', 'Greasy Neale|Earle Neale', 'Ray Flaherty', 'Jimmy Conzelman'],
  }),

  prompt('hof-hbcu', 'Hall of Fame', 'Name a Hall of Famer who played college football at an HBCU', {
    1: ['Jerry Rice', 'Walter Payton|Sweetness', 'Michael Strahan'],
    2: ['Shannon Sharpe', 'Deacon Jones', 'Mel Blount', 'Art Shell', 'Aeneas Williams'],
    3: ['Richard Dent', 'Harry Carson', 'Willie Lanier', 'Ken Houston', 'John Stallworth', 'Charlie Joiner',
        'Bob Hayes|Bullet Bob', 'Donnie Shell', 'Jackie Slater'],
    4: ['Lem Barney', 'Willie Brown', 'Buck Buchanan', 'Willie Davis', 'Larry Little', 'Leroy Kelly',
        'Elvin Bethea', 'Claude Humphrey', 'Rayfield Wright', 'Robert Brazile', 'Ken Riley', 'Emmitt Thomas'],
    5: ['Roosevelt Brown|Rosey Brown'],
  }),

  // ---------- Super Bowl ----------
  prompt('sb-losing-qb', 'Super Bowl', 'Name a quarterback who started a Super Bowl and lost it', {
    1: ['Tom Brady', 'Peyton Manning', 'Patrick Mahomes', 'Dan Marino', 'Jim Kelly', 'John Elway', 'Brett Favre'],
    2: ['Cam Newton', 'Russell Wilson', 'Kurt Warner', 'Matt Ryan|Matty Ice', 'Jared Goff', 'Joe Burrow',
        'Jalen Hurts', 'Brock Purdy', 'Colin Kaepernick', 'Drake Maye', 'Donovan McNabb',
        'Ben Roethlisberger|Big Ben', 'Roger Staubach', 'Fran Tarkenton', 'Jimmy Garoppolo|Jimmy G'],
    3: ['Drew Bledsoe', 'Steve McNair|Air McNair', 'Rich Gannon', 'Rex Grossman', 'Matt Hasselbeck',
        'Jake Delhomme', 'Kerry Collins', 'Boomer Esiason', 'Joe Theismann', 'Bob Griese', 'Len Dawson'],
    4: ['Chris Chandler', "Neil O'Donnell", 'Stan Humphries', 'Tony Eason', 'Ken Anderson', 'Ron Jaworski|Jaws',
        'Vince Ferragamo', 'Craig Morton', 'Earl Morrall', 'Joe Kapp', 'Billy Kilmer', 'Daryle Lamonica'],
    5: ['David Woodley'],
  }),

  prompt('sb-mvp-defense', 'Super Bowl', 'Name a defensive player who won Super Bowl MVP', {
    1: ['Ray Lewis', 'Von Miller'],
    2: ['Malcolm Smith', 'Richard Dent'],
    3: ['Larry Brown', 'Dexter Jackson', 'Randy White'],
    4: ['Harvey Martin', 'Chuck Howley', 'Jake Scott'],
  }),

  prompt('sb-mvp-wr', 'Super Bowl', 'Name a wide receiver who won Super Bowl MVP', {
    1: ['Jerry Rice', 'Julian Edelman', 'Cooper Kupp'],
    2: ['Hines Ward', 'Lynn Swann', 'Santonio Holmes', 'Deion Branch'],
    3: ['Fred Biletnikoff', 'Desmond Howard'],
  }),

  prompt('sb-qb-two-teams', 'Super Bowl', 'Name a quarterback who started a Super Bowl for two different teams', {
    1: ['Tom Brady', 'Peyton Manning'],
    3: ['Kurt Warner'],
    5: ['Craig Morton'],
  }),

  prompt('sb-coach-two-teams', 'Super Bowl', 'Name a head coach who took two different teams to the Super Bowl', {
    1: ['Andy Reid|Big Red', 'Bill Parcells|The Big Tuna'],
    2: ['Don Shula', 'Mike Holmgren', 'Dick Vermeil'],
    3: ['Dan Reeves', 'John Fox'],
  }),

  prompt('wild-card-sb', 'Super Bowl', 'Name a team that won the Super Bowl as a wild card (since the 1970 merger)', {
    1: [T.NYG, T.GB, T.PIT],
    2: [T.BAL, T.TB],
    3: [T.DEN, T.LV],
  }),

  // ---------- Awards / Records ----------
  prompt('non-qb-mvp', 'Awards', 'Name a non-quarterback who won AP NFL MVP (1970 or later)', {
    1: ['Adrian Peterson|AP|All Day', 'LaDainian Tomlinson|LT', 'Barry Sanders', 'Lawrence Taylor'],
    2: ['Emmitt Smith', 'Marshall Faulk', 'Walter Payton|Sweetness', 'Terrell Davis|TD', 'Shaun Alexander',
        'Marcus Allen', 'Earl Campbell|The Tyler Rose'],
    3: ['O.J. Simpson|OJ Simpson|The Juice', 'Thurman Thomas'],
    4: ['Alan Page', 'Mark Moseley'],
    5: ['Larry Brown'],
  }),

  prompt('mvp-and-sb-mvp', 'Awards', 'Name a player who won NFL MVP and Super Bowl MVP in the same season', {
    1: ['Patrick Mahomes', 'Joe Montana|Joe Cool'],
    2: ['Steve Young', 'Kurt Warner', 'Emmitt Smith'],
    3: ['Terry Bradshaw', 'Bart Starr'],
  }),

  prompt('seven-td-game', 'Records', 'Name a quarterback who threw 7 touchdown passes in one game', {
    1: ['Peyton Manning', 'Drew Brees'],
    2: ['Nick Foles'],
    3: ['Y.A. Tittle|YA Tittle', 'George Blanda', 'Sid Luckman'],
    4: ['Joe Kapp'],
    5: ['Adrian Burk'],
  }),

  // ---------- History ----------
  prompt('pre-sb-champ', 'History', 'Name a team that won an NFL championship before the Super Bowl era (1920-1965)', {
    1: [T.GB, T.CHI],
    2: [T.NYG, T.CLE, T.DET, T.IND + '|Baltimore Colts'],
    3: [T.PHI, T.LAR + '|Cleveland Rams', T.WAS + '|Boston Redskins'],
    4: [T.ARI + '|Chicago Cardinals|St. Louis Cardinals'],
    5: ['Canton Bulldogs', 'Akron Pros', 'Cleveland Bulldogs', 'Frankford Yellow Jackets',
        'Providence Steam Roller|Providence Steamroller'],
  }),

  prompt('afl-champ', 'History', 'Name a team that won an AFL championship (1960-1969)', {
    1: [T.NYJ, T.KC + '|Dallas Texans'],
    2: [T.LV],
    3: [T.BUF, T.TEN + '|Houston Oilers|Oilers'],
    4: [T.LAC],
  }),

  prompt('former-team-name', 'History', 'Name a former name of a current NFL franchise', {
    1: ['Oakland Raiders', 'St. Louis Rams', 'San Diego Chargers', 'Houston Oilers|Oilers',
        'Washington Redskins|Redskins', 'Baltimore Colts'],
    2: ['Los Angeles Raiders|LA Raiders', 'St. Louis Cardinals', 'Washington Football Team|WFT|Football Team',
        'Boston Patriots', 'Tennessee Oilers', 'Phoenix Cardinals'],
    3: ['Dallas Texans', 'New York Titans|NY Titans', 'Cleveland Rams', 'Chicago Cardinals', 'Decatur Staleys'],
    4: ['Steagles|Phil-Pitt Combine|Phil-Pitt', 'Portsmouth Spartans', 'Boston Redskins', 'Pittsburgh Pirates',
        'Chicago Staleys'],
    5: ['Boston Braves', 'Racine Cardinals', 'Card-Pitt|Carpets'],
  }),

  prompt('other-leagues', 'History', 'Name a pro football league other than the NFL, past or present', {
    1: ['XFL', 'United States Football League|USFL', 'Canadian Football League|CFL',
        'American Football League|AFL'],
    2: ['Arena Football League|Arena League|Arena Football', 'United Football League|UFL',
        'NFL Europe|NFL Europa'],
    3: ['All-America Football Conference|AAFC|All America Football Conference', 'World Football League|WFL',
        'Alliance of American Football|AAF|The Alliance', 'World League of American Football|WLAF|World League'],
    4: ['Indoor Football League|IFL', 'Fan Controlled Football|FCF', 'European League of Football|ELF',
        'Continental Football League'],
    5: ['The Spring League|Spring League'],
  }, { ignore: ['league'] }),

  // ---------- NFL ----------
  prompt('intl-city', 'NFL', 'Name a city outside the U.S. that has hosted a regular-season NFL game', {
    1: ['London', 'Mexico City'],
    2: ['Munich|Munchen|München', 'Frankfurt', 'Toronto', 'São Paulo|Sao Paulo'],
    3: ['Berlin', 'Madrid', 'Dublin', 'Melbourne'],
    4: ['Rio de Janeiro|Rio'],
    5: ['Paris'],
  }),

  prompt('mascots', 'NFL', 'Name an NFL team mascot, past or present', {
    1: ['K.C. Wolf|KC Wolf', 'Sir Purr', 'Swoop', 'Blitz', 'Billy Buffalo'],
    2: ['Rowdy', 'Miles', 'Poe', 'Freddie Falcon', 'Rampage', 'T-Rac|TRac', 'Who Dey', 'Toro',
        'Staley Da Bear|Staley the Bear|Staley'],
    3: ['Jaxson de Ville|Jaxson', 'Captain Fear', 'Pat Patriot|Pat the Patriot', 'Steely McBeam',
        'Sourdough Sam', 'Big Red', 'Gumbo', 'Roary', 'Viktor the Viking|Viktor', 'Chomps', 'T.D.|TD'],
    4: ['Blue', 'Swagger', 'Sir Saint', 'Major Tuddy|Tuddy', 'Taima', 'Boom'],
    5: ['Ragnar', 'Thunder', 'Warpaint', 'Rise', 'Conquer'],
  }),

  prompt('nfl-brothers', 'NFL', 'Name a family with brothers who both played in the NFL (last name)', {
    1: ['Watt|Watts|J.J. Watt|JJ Watt|T.J. Watt|TJ Watt|Derek Watt',
        'Kelce|Kelces|Travis Kelce|Jason Kelce',
        'Manning|Mannings|Peyton Manning|Eli Manning',
        'Bosa|Bosas|Nick Bosa|Joey Bosa',
        'Barber|Barbers|Tiki Barber|Ronde Barber'],
    2: ['Sharpe|Sharpes|Shannon Sharpe|Sterling Sharpe',
        'Gronkowski|Gronkowskis|Gronk|Rob Gronkowski|Chris Gronkowski|Dan Gronkowski',
        'Pouncey|Pounceys|Maurkice Pouncey|Mike Pouncey',
        'McCourty|McCourtys|Devin McCourty|Jason McCourty',
        'Hasselbeck|Hasselbecks|Matt Hasselbeck|Tim Hasselbeck',
        'Matthews|Clay Matthews|Casey Matthews|Bruce Matthews'],
    3: ['St. Brown|Amon-Ra St. Brown|Equanimeous St. Brown',
        'Long|Longs|Chris Long|Kyle Long',
        'Bennett|Bennetts|Michael Bennett|Martellus Bennett',
        'Selmon|Selmons|Lee Roy Selmon|Dewey Selmon',
        'Griffin|Shaquill Griffin|Shaquem Griffin',
        'Edmunds|Tremaine Edmunds|Terrell Edmunds|Trey Edmunds'],
    4: ['Kalil|Ryan Kalil|Matt Kalil',
        'Golic|Golics|Mike Golic|Bob Golic',
        'Detmer|Detmers|Ty Detmer|Koy Detmer',
        'Cunningham|Randall Cunningham|Sam Cunningham',
        'Gramatica|Martin Gramatica|Bill Gramatica'],
  }, { ignore: ['brothers', 'brother', 'family', 'twins'] }),

  // ---------- Playbook ----------
  prompt('pass-rush', 'Playbook', 'Name a pass rush move', {
    1: ['Spin Move|Spin', 'Swim Move|Swim', 'Bull Rush|Bull'],
    2: ['Rip Move|Rip', 'Speed Rush|Speed', 'Club Move|Club', 'Long Arm'],
    3: ['Chop', 'Dip|Dip and Rip', 'Cross Chop', 'Hump Move|Hump', 'Euro Step|Euro'],
    4: ['Push-Pull|Push Pull', 'Ghost Move|Ghost', 'Double Swipe|Swipe', 'Hand Slap|Slap'],
  }, { ignore: ['move'] }),

  // ---------- College ----------
  prompt('cfp-team', 'College', 'Name a school that has played in the College Football Playoff (2014-2025 seasons)', {
    1: [C.ALA, C.OSU, C.UGA, C.CLEM, C.MICH],
    2: [C.ORE, C.OU, 'Notre Dame|ND|Fighting Irish|Irish', C.TEX, C.LSU, C.FSU, C.PSU, C.IND],
    3: [C.UW, C.TCU, C.TENN, C.TAMU, C.MISS, C.MIA, C.MSU, C.CIN, 'Boise State|Boise|Broncos', C.TTU],
    4: [C.SMU, C.ASU, 'Tulane|Green Wave', 'James Madison|JMU|Dukes'],
  }),

  prompt('pac12-exodus', 'College', 'Name a school that left the Pac-12 in 2024', {
    1: [C.USC, C.UCLA, C.ORE, C.UW],
    2: [C.COLO, C.UTAH, C.ARIZ, C.ASU],
    3: [C.STAN, C.CAL],
  }),

  prompt('wildcats', 'College', 'Name a Division I college football program nicknamed the Wildcats', {
    1: ['Kentucky|UK', 'Arizona'],
    2: ['Kansas State|K-State|Kansas St', 'Northwestern'],
    3: ['Villanova|Nova', 'New Hampshire|UNH'],
    4: ['Weber State', 'Bethune-Cookman|Bethune Cookman', 'Abilene Christian|ACU'],
    5: ['Davidson'],
  }, { ignore: ['wildcats', 'wildcat'] }),

  prompt('bulldogs', 'College', 'Name a Division I college football program nicknamed the Bulldogs', {
    1: ['Georgia|UGA|Dawgs'],
    2: ['Mississippi State|Miss State|Mississippi St', 'Fresno State|Fresno'],
    3: ['Louisiana Tech|La Tech', 'Yale'],
    4: ['The Citadel|Citadel', 'Samford', 'South Carolina State|SC State', 'Alabama A&M|AAMU'],
    5: ['Gardner-Webb|Gardner Webb', 'Bryant', 'Drake', 'Butler'],
  }, { ignore: ['bulldogs', 'bulldog', 'runnin'] }),

  prompt('big-stadium', 'College', 'Name a college football stadium that seats 100,000 or more', {
    1: ['Michigan Stadium|The Big House|Big House|Michigan', 'Ohio Stadium|The Horseshoe|Horseshoe|The Shoe|Ohio State',
        'Beaver Stadium|Happy Valley|Penn State'],
    2: ['Kyle Field|Texas A&M|A&M', 'Tiger Stadium|Death Valley|LSU', 'Neyland Stadium|Neyland|Tennessee'],
    3: ['Bryant-Denny Stadium|Bryant Denny|Alabama'],
    4: ['Darrell K Royal-Texas Memorial Stadium|DKR|Texas Memorial Stadium|Darrell K Royal Stadium|Royal-Memorial Stadium|Texas'],
  }, { ignore: ['stadium'] }),

  // ---------- Draft ----------
  prompt('qb-class-1999', 'Draft', 'Name a quarterback taken in the first round of the 1999 draft', {
    1: ['Donovan McNabb', 'Tim Couch'],
    2: ['Daunte Culpepper'],
    3: ['Akili Smith'],
    4: ['Cade McNown'],
  }),

  prompt('qb-class-2012', 'Draft', 'Name a quarterback taken in the first round of the 2012 draft', {
    1: ['Andrew Luck', 'Robert Griffin III|RG3|RGIII|Robert Griffin'],
    2: ['Ryan Tannehill'],
    4: ['Brandon Weeden'],
  }),

  prompt('qb-class-2020', 'Draft', 'Name a quarterback taken in the first round of the 2020 draft', {
    1: ['Joe Burrow', 'Justin Herbert', 'Tua Tagovailoa|Tua'],
    2: ['Jordan Love'],
  }),
]
