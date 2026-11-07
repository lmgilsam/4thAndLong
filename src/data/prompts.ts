import { liveFrom, prompt, type PromptDef } from './types'
import { NFL as T, CFB as C } from './teams'
import { BATCH_2 } from './prompts-batch2'
import { BATCH_3 } from './prompts-batch3'
import { BATCH_4 } from './prompts-batch4'
import { BATCH_5 } from './prompts-batch5'
import { BATCH_6 } from './prompts-batch6'

// Every prompt lists its accepted answers grouped by seeded rarity tier:
//   1 Checkdown (everyone says it) -> 5 Hail Mary (almost nobody says it)
// Tiers here are educated guesses. Once real players answer, rarity is
// recalculated from actual answer frequency (see supabase/schema.sql).
// Facts checked through the 2025 NFL season / Super Bowl LX (Feb 2026).

/** Batch 1: launch set (Nov 3, 2026). */
export const BATCH_1: PromptDef[] = [
  prompt('nfl-team', 'NFL', 'Name an NFL team', {
    1: [T.DAL, T.NE, T.KC, T.GB, T.PIT, T.PHI],
    2: [T.SF, T.CHI, T.NYG, T.LV, T.DEN, T.MIA, T.HOU, T.BAL, T.BUF, T.SEA],
    3: [T.NYJ, T.DET, T.LAR, T.MIN, T.NO, T.IND, T.TB, T.CIN, T.CLE, T.ATL, T.LAC, T.WAS],
    4: [T.CAR, T.ARI, T.TEN],
    5: [T.JAX],
  }),

  prompt('never-won-sb', 'NFL', 'Name an NFL team that has never won a Super Bowl', {
    1: [T.DET, T.CLE, T.BUF, T.MIN],
    2: [T.CIN, T.HOU, T.JAX, T.ATL],
    3: [T.CAR, T.LAC],
    4: [T.ARI, T.TEN + '|Houston Oilers|Oilers'],
  }),

  prompt('won-sb', 'NFL', 'Name a franchise that has won a Super Bowl', {
    1: [T.NE, T.PIT, T.DAL, T.SF, T.KC, T.GB],
    2: [T.NYG, T.PHI, T.DEN, T.LV, T.SEA, T.BAL],
    3: [T.TB, T.LAR, T.MIA, T.NO, T.IND + '|Baltimore Colts', T.CHI],
    4: [T.WAS, T.NYJ],
  }),

  prompt('sb-qb', 'Super Bowl', 'Name a quarterback who started and won a Super Bowl', {
    1: ['Tom Brady|TB12', 'Patrick Mahomes', 'Peyton Manning', 'Joe Montana|Joe Cool'],
    2: ['John Elway', 'Drew Brees', 'Aaron Rodgers', 'Brett Favre', 'Eli Manning', 'Troy Aikman',
        'Terry Bradshaw', 'Ben Roethlisberger|Big Ben', 'Jalen Hurts', 'Russell Wilson', 'Steve Young'],
    3: ['Matthew Stafford', 'Joe Flacco', 'Nick Foles', 'Kurt Warner', 'Joe Namath|Broadway Joe',
        'Roger Staubach', 'Sam Darnold', 'Bart Starr', 'Johnny Unitas'],
    4: ['Jim Plunkett', 'Joe Theismann', 'Phil Simms', 'Doug Williams', 'Trent Dilfer', 'Brad Johnson',
        'Jim McMahon', 'Bob Griese', 'Ken Stabler|The Snake'],
    5: ['Len Dawson', 'Jeff Hostetler', 'Mark Rypien'],
  }),

  prompt('sb-coach', 'Super Bowl', 'Name a head coach who won a Super Bowl', {
    1: ['Bill Belichick', 'Andy Reid', 'Vince Lombardi'],
    2: ['Mike Tomlin', 'Sean Payton', 'Pete Carroll', 'Sean McVay', 'John Harbaugh', 'Tom Landry',
        'Don Shula', 'Bill Parcells', 'Bill Walsh', 'Tom Coughlin', 'Nick Sirianni'],
    3: ['Jimmy Johnson', 'Jon Gruden|Chucky', 'Tony Dungy', 'Bill Cowher', 'Mike Ditka', 'John Madden',
        'Joe Gibbs', 'Chuck Noll', 'Doug Pederson', 'Bruce Arians', 'Mike Macdonald|Mike MacDonald',
        'Mike Shanahan', 'Mike McCarthy'],
    4: ['Mike Holmgren', 'Gary Kubiak', 'Dick Vermeil', 'Brian Billick', 'George Seifert',
        'Barry Switzer', 'Tom Flores'],
    5: ['Weeb Ewbank', 'Hank Stram', 'Don McCafferty'],
  }),

  prompt('heisman', 'College', 'Name a Heisman Trophy winner', {
    1: ['Tim Tebow', 'Reggie Bush', 'Cam Newton', 'Lamar Jackson', 'Barry Sanders', 'Bo Jackson',
        'Joe Burrow', 'Johnny Manziel|Johnny Football'],
    2: ['Baker Mayfield', 'Kyler Murray', 'Derrick Henry', 'Travis Hunter', 'Caleb Williams',
        'Bryce Young', 'Jayden Daniels', 'Herschel Walker', 'Charles Woodson', 'Desmond Howard',
        'Doug Flutie', 'Robert Griffin III|RG3|RGIII|Robert Griffin', 'Jameis Winston',
        'Marcus Mariota', 'Mark Ingram', 'DeVonta Smith', 'Fernando Mendoza', 'Ricky Williams',
        'Earl Campbell', 'Tony Dorsett', 'Archie Griffin'],
    3: ['Sam Bradford', 'Matt Leinart', 'Carson Palmer', 'Troy Smith', 'Eddie George', 'Marcus Allen',
        'Roger Staubach', 'O.J. Simpson|OJ|The Juice', 'Tim Brown', 'Vinny Testaverde',
        'Danny Wuerffel', 'Charlie Ward', 'Ron Dayne', 'Paul Hornung', 'Doak Walker',
        'Steve Spurrier', 'Jim Plunkett', 'Billy Sims', 'Andre Ware'],
    4: ['Ty Detmer', 'Gino Torretta', 'Rashaan Salaam', 'Chris Weinke', 'Eric Crouch', 'Jason White',
        'Mike Rozier', 'George Rogers', 'Charles White', 'Johnny Rodgers', 'Pat Sullivan',
        'John Cappelletti', 'Mike Garrett', 'Billy Cannon', 'Ernie Davis', 'Nile Kinnick',
        'Tom Harmon', 'Glenn Davis', 'Doc Blanchard', 'Steve Owens', 'Terry Baker', 'Pete Dawkins',
        'Alan Ameche', 'Howard Cassady|Hopalong Cassady'],
    5: ['Jay Berwanger', 'Larry Kelley', 'Clint Frank', "Davey O'Brien", 'Bruce Smith',
        'Frank Sinkwich', 'Angelo Bertelli', 'Les Horvath', 'Johnny Lujack|John Lujack', 'Leon Hart',
        'Vic Janowicz', 'Dick Kazmaier', 'Billy Vessels', 'Johnny Lattner|John Lattner',
        'John David Crow', 'Joe Bellino', 'John Huarte', 'Gary Beban'],
  }),

  prompt('qb-first-pick', 'Draft', 'Name a quarterback drafted No. 1 overall since 1970', {
    1: ['Peyton Manning', 'John Elway', 'Joe Burrow', 'Trevor Lawrence', 'Caleb Williams'],
    2: ['Cam Newton', 'Andrew Luck', 'Baker Mayfield', 'Matthew Stafford', 'Kyler Murray',
        'Bryce Young', 'Troy Aikman', 'Michael Vick', 'Jared Goff', 'Fernando Mendoza',
        'Terry Bradshaw', 'Cam Ward', 'Eli Manning'],
    3: ['Carson Palmer', 'Sam Bradford', 'Jameis Winston', 'Alex Smith', 'JaMarcus Russell',
        'David Carr', 'Drew Bledsoe'],
    4: ['Tim Couch', 'Vinny Testaverde', 'Jim Plunkett', 'Jeff George'],
    5: ['Steve Bartkowski'],
  }),

  prompt('non-qb-first-pick', 'Draft', 'Name a non-quarterback taken No. 1 overall since 2000', {
    1: ['Myles Garrett', 'Jadeveon Clowney', 'Mario Williams'],
    2: ['Travon Walker'],
    3: ['Jake Long', 'Eric Fisher'],
    4: ['Courtney Brown'],
  }),

  prompt('penalty', 'Rules', 'Name a football penalty', {
    1: ['Holding|Offensive Holding|Defensive Holding', 'False Start',
        'Pass Interference|Defensive Pass Interference|DPI|PI', 'Offsides|Offside',
        'Roughing the Passer', 'Delay of Game'],
    2: ['Unnecessary Roughness', 'Face Mask|Facemask|Grabbing the Face Mask',
        'Unsportsmanlike Conduct', 'Encroachment', 'Intentional Grounding', 'Illegal Formation',
        'Too Many Men on the Field|Too Many Men|12 Men on the Field|Twelve Men on the Field',
        'Taunting', 'Clipping', 'Horse Collar Tackle|Horse Collar', 'Personal Foul'],
    3: ['Neutral Zone Infraction', 'Illegal Motion', 'Illegal Block in the Back|Block in the Back',
        'Roughing the Kicker', 'Running into the Kicker', 'Illegal Contact', 'Chop Block',
        'Illegal Shift', 'Ineligible Receiver Downfield|Ineligible Man Downfield',
        'Illegal Use of Hands', 'Offensive Pass Interference|OPI', 'Illegal Forward Pass',
        'Tripping', 'Targeting'],
    4: ['Spearing|Use of Helmet|Lowering the Head', 'Illegal Substitution',
        'Fair Catch Interference', 'Kick Catch Interference', 'Leverage', 'Leaping',
        'Illegal Bat|Illegal Batting', 'Illegal Touching', 'Hands to the Face',
        'Illegal Crackback|Crackback Block', 'Illegal Snap', 'Twelve Men in the Huddle|12 Men in the Huddle'],
    5: ['Illegal Kick|Illegal Kicking', 'Sideline Interference', 'Roughing the Snapper',
        'Illegal Peel Back|Peel Back Block', 'Illegal Wedge', 'Illegal Low Block|Low Block'],
  }),

  prompt('position', 'Rules', 'Name a position on a football team', {
    1: ['Quarterback|QB', 'Running Back|RB', 'Wide Receiver|WR|Receiver', 'Tight End|TE'],
    2: ['Linebacker|LB', 'Cornerback|CB|Corner', 'Safety', 'Kicker|K|Placekicker', 'Center|C'],
    3: ['Defensive End|DE', 'Defensive Tackle|DT', 'Punter|P', 'Fullback|FB',
        'Offensive Tackle|OT|Tackle', 'Offensive Guard|OG|Guard', 'Halfback|HB',
        'Free Safety|FS', 'Strong Safety|SS', 'Kick Returner|KR', 'Punt Returner|PR',
        'Offensive Lineman|OL', 'Defensive Lineman|DL'],
    4: ['Nose Tackle|NT|Nose Guard', 'Middle Linebacker|MLB|Mike Linebacker|Mike',
        'Outside Linebacker|OLB', 'Inside Linebacker|ILB', 'Long Snapper|LS',
        'Slot Receiver|Slot', 'Edge Rusher|Edge', 'Nickelback|Nickel Back|Nickel Corner',
        'Left Tackle|LT', 'Right Tackle|RT', 'Left Guard|LG', 'Right Guard|RG', 'Holder',
        'Tailback|TB', 'Flanker', 'Split End'],
    5: ['Gunner', 'Dimeback|Dime Back', 'H-Back', 'Upback|Personal Protector',
        'Jammer|Vice', 'Wingback', 'Strongside Linebacker|Sam Linebacker|Sam',
        'Weakside Linebacker|Will Linebacker|Will', 'Rover'],
  }),

  prompt('formation', 'Playbook', 'Name an offensive formation', {
    1: ['Shotgun|Gun', 'I Formation|I Form', 'Wildcat', 'Pistol'],
    2: ['Spread', 'Singleback|Single Back', 'Empty|Empty Backfield', 'Goal Line|Jumbo|Heavy',
        'Victory Formation|Victory|Kneel Down', 'T Formation'],
    3: ['Wishbone', 'Pro Set|Pro Formation', 'Trips', 'Bunch', 'Ace', 'Single Wing', 'Wing T',
        'Split Back|Split Backs', 'Power I', 'Twins'],
    4: ['Strong I', 'Weak I', 'Diamond', 'Full House', 'Flexbone', 'Veer', 'Run and Shoot',
        'Offset I', 'Double Wing'],
    5: ['Notre Dame Box|Box Formation', 'A-11', 'Swinging Gate', 'Emory and Henry',
        'Maryland I', 'Tackle Over|Unbalanced Line'],
  }, { ignore: ['formation'] }),

  prompt('bowl', 'College', 'Name a college bowl game, past or present', {
    1: ['Rose Bowl', 'Sugar Bowl', 'Orange Bowl', 'Cotton Bowl', 'Fiesta Bowl', 'Peach Bowl'],
    2: ['Citrus Bowl|Tangerine Bowl', 'Gator Bowl', 'Sun Bowl', 'Liberty Bowl', 'Alamo Bowl',
        'Holiday Bowl', 'ReliaQuest Bowl|Outback Bowl|Hall of Fame Bowl', 'Music City Bowl',
        'Texas Bowl', 'Las Vegas Bowl'],
    3: ['Pinstripe Bowl', 'Independence Bowl', 'Armed Forces Bowl', 'Birmingham Bowl',
        "Duke's Mayo Bowl|Mayo Bowl", 'Pop-Tarts Bowl|Pop Tarts Bowl|Camping World Bowl|Champs Sports Bowl|Russell Athletic Bowl',
        'First Responder Bowl|Heart of Dallas Bowl', "Hawai'i Bowl|Hawaii Bowl", 'Military Bowl',
        'New Mexico Bowl', 'New Orleans Bowl', 'Famous Idaho Potato Bowl|Idaho Potato Bowl|Potato Bowl|Humanitarian Bowl'],
    4: ['Bahamas Bowl', 'Myrtle Beach Bowl', 'Cure Bowl', 'Camellia Bowl', 'Boca Raton Bowl',
        'LA Bowl|Los Angeles Bowl', 'Frisco Bowl', 'Gasparilla Bowl', 'Fenway Bowl', 'Arizona Bowl',
        'Rate Bowl|Guaranteed Rate Bowl', 'GameAbove Sports Bowl|Quick Lane Bowl', 'Celebration Bowl',
        'Mobile Bowl|GMAC Bowl|68 Ventures Bowl|LendingTree Bowl'],
    5: ['Bluebonnet Bowl|Astro-Bluebonnet Bowl', 'Aloha Bowl', 'Poinsettia Bowl', 'Motor City Bowl',
        'Copper Bowl', 'Oahu Bowl', 'Salad Bowl', 'Raisin Bowl', 'Bacardi Bowl', 'Emerald Bowl',
        'Houston Bowl', 'Silicon Valley Bowl', 'Freedom Bowl', 'Insight Bowl'],
  }, { ignore: ['bowl', 'game'] }),

  prompt('sec', 'College', 'Name a school in the SEC (2026)', {
    1: [C.ALA, C.UGA, C.LSU, C.TEX, C.UF],
    2: [C.TENN, C.AUB, C.TAMU, C.MISS, C.OU],
    3: [C.ARK, C.SC, C.MIZ, C.UK, C.MSST],
    4: [C.VAN],
  }),

  prompt('big-ten', 'College', 'Name a school in the Big Ten (2026)', {
    1: [C.OSU, C.MICH, C.PSU, C.ORE],
    2: [C.USC, C.WIS, C.IOWA, C.NEB, C.MSU, C.UW, C.UCLA, C.IND],
    3: [C.MINN, C.ILL, C.PUR, C.MD],
    4: [C.NW, C.RUT],
  }),

  prompt('big-12', 'College', 'Name a school in the Big 12 (2026)', {
    1: [C.BAY, C.COLO, C.TCU, C.TTU],
    2: [C.OKST, C.KSU, C.UTAH, C.BYU, C.UH, C.ISU, C.KU],
    3: [C.WVU, C.ARIZ, C.ASU, C.UCF, C.CIN],
  }),

  prompt('acc', 'College', 'Name a school that plays ACC football (2026)', {
    1: [C.CLEM, C.FSU, C.MIA, C.UNC],
    2: [C.DUKE, C.VT, C.LOU, C.NCSU, C.GT, C.PITT, C.SYR, C.STAN],
    3: [C.UVA, C.WAKE, C.BC, C.SMU, C.CAL],
  }),

  prompt('natty-since-1990', 'College', 'Name a school that won a national title since 1990', {
    1: [C.ALA, C.UGA, C.OSU, C.LSU, C.CLEM],
    2: [C.FSU, C.MICH, C.UF, C.TEX, C.IND, C.AUB, C.OU, C.USC, C.MIA],
    3: [C.TENN, C.NEB],
    4: [C.UW, C.COLO],
    5: [C.GT],
  }),

  prompt('roof', 'Stadiums', 'Name an NFL team whose home stadium has a roof', {
    1: [T.DAL, T.NO, T.HOU, T.DET],
    2: [T.IND, T.MIN, T.ATL, T.LV],
    3: [T.ARI, T.LAR, T.LAC],
  }),

  prompt('sb-host', 'Super Bowl', 'Name a city that has hosted a Super Bowl', {
    1: ['Miami', 'New Orleans|Nola', 'Los Angeles|LA', 'Las Vegas|Vegas'],
    2: ['Houston', 'Tampa', 'Atlanta', 'Phoenix|Arizona', 'Dallas', 'Minneapolis',
        'Indianapolis|Indy', 'San Diego'],
    3: ['Glendale', 'Pasadena', 'Detroit', 'Jacksonville', 'Santa Clara|San Francisco|Bay Area',
        'East Rutherford|New Jersey|New York|MetLife', 'Arlington', 'Inglewood', 'Miami Gardens'],
    4: ['Pontiac', 'Tempe', 'Palo Alto|Stanford'],
  }),

  prompt('2000-yards', 'Records', 'Name a player with a 2,000-yard rushing season', {
    1: ['Barry Sanders', 'Adrian Peterson|AP|All Day', 'Derrick Henry|King Henry', 'Saquon Barkley'],
    2: ['Eric Dickerson', 'Chris Johnson|CJ2K', 'Terrell Davis|TD'],
    3: ['O.J. Simpson|OJ|The Juice', 'Jamal Lewis'],
  }),

  prompt('hof-qb', 'Hall of Fame', 'Name a Hall of Fame quarterback', {
    1: ['Peyton Manning', 'Joe Montana|Joe Cool', 'Dan Marino', 'John Elway', 'Brett Favre'],
    2: ['Drew Brees', 'Steve Young', 'Troy Aikman', 'Terry Bradshaw', 'Johnny Unitas',
        'Joe Namath|Broadway Joe', 'Jim Kelly', 'Kurt Warner', 'Roger Staubach', 'Warren Moon'],
    3: ['Dan Fouts', 'Bart Starr', 'Fran Tarkenton', 'Ken Stabler|The Snake', 'Bob Griese',
        'Len Dawson', 'Sammy Baugh|Slingin Sammy', 'Otto Graham'],
    4: ['Sonny Jurgensen', 'Y.A. Tittle|YA Tittle', 'Bobby Layne', 'Sid Luckman',
        'Norm Van Brocklin', 'George Blanda', 'Bob Waterfield'],
    5: ['Benny Friedman', 'Arnie Herber', 'Dutch Clark', 'Paddy Driscoll', 'Ace Parker'],
  }),

  prompt('relocated', 'History', 'Name an NFL franchise that has relocated to a new city', {
    1: [T.LV, T.LAR + '|Cleveland Rams', T.LAC, T.IND + '|Baltimore Colts'],
    2: [T.TEN + '|Houston Oilers|Oilers', T.ARI + '|St. Louis Cardinals|Chicago Cardinals|Phoenix Cardinals', T.BAL],
    3: [T.KC + '|Dallas Texans', T.WAS + '|Boston Redskins|Boston Braves'],
    4: [T.DET + '|Portsmouth Spartans', T.CHI + '|Decatur Staleys|Staleys'],
  }),

  prompt('afc', 'NFL', 'Name an AFC team', {
    1: [T.KC, T.NE, T.PIT, T.BAL, T.BUF],
    2: [T.DEN, T.LV, T.MIA, T.HOU, T.CIN, T.LAC, T.NYJ],
    3: [T.IND, T.CLE, T.TEN, T.JAX],
  }),

  prompt('nfc', 'NFL', 'Name an NFC team', {
    1: [T.DAL, T.PHI, T.GB, T.SF],
    2: [T.CHI, T.NYG, T.DET, T.SEA, T.LAR, T.MIN, T.NO],
    3: [T.TB, T.ATL, T.WAS, T.CAR, T.ARI],
  }),

  prompt('trick-play', 'Playbook', 'Name a trick play', {
    1: ['Flea Flicker', 'Hail Mary', 'Fake Punt', 'Philly Special', 'Onside Kick|Surprise Onside Kick'],
    2: ['Hook and Lateral', 'Fake Field Goal|Fake FG', 'Statue of Liberty', 'Reverse',
        'Double Reverse', 'Halfback Pass|Halfback Option|Running Back Pass|RB Pass', 'Fumblerooski'],
    3: ['End Around', 'Quarterback Throwback|Throwback|QB Throwback', 'Fake Spike',
        'Double Pass', 'Fake Kneel', 'Wide Receiver Pass|WR Pass|Receiver Pass'],
    4: ['Hidden Ball Trick|Hidden Ball', 'Swinging Gate', 'Fake Reverse',
        'Home Run Throwback', 'Lateral Pass|Laterals'],
    5: ['Muddle Huddle', 'Fake Injury', 'Fake Kickoff'],
  }),

  prompt('famous-play', 'History', 'Name a famous football play or game with a nickname', {
    1: ['Immaculate Reception', 'The Catch', 'Helmet Catch', 'Minneapolis Miracle',
        'Music City Miracle', 'Philly Special'],
    2: ['Tuck Rule Game|Tuck Rule|Snow Bowl', 'Ice Bowl', 'Butt Fumble', 'Holy Roller',
        'Miracle at the Meadowlands', 'The Drive', 'The Fumble', 'Wide Right', 'Kick Six',
        'Double Doink', 'The Comeback', '28-3|28 to 3', 'Beast Quake|Beastquake', 'Fail Mary',
        'Monday Night Miracle', 'Hail Murray', '13 Seconds|Thirteen Seconds'],
    3: ['The Catch II|Catch II', 'Heidi Game', 'Freezer Bowl', 'Epic in Miami', 'The Play',
        'Prayer at Jordan-Hare', 'Bluegrass Miracle', 'Miami Miracle', 'Snow Plow Game|Snowplow Game',
        'Mile High Miracle', 'Dez Caught It', 'Fog Bowl', 'Miracle at Michigan', 'Hail Mary'],
    4: ['Ghost to the Post', 'Sea of Hands', 'Mud Bowl', 'River City Relay', 'Greatest Game Ever Played',
        'Immaculate Deflection'],
  }),

  prompt('texans-coach', 'Houston', 'Name a Houston Texans head coach (interim counts)', {
    1: ['DeMeco Ryans', 'Bill O’Brien|Bill OBrien|Bill O Brien', 'Gary Kubiak'],
    2: ['Lovie Smith', 'David Culley', 'Dom Capers'],
    3: ['Romeo Crennel', 'Wade Phillips'],
  }),

  prompt('manning', 'NFL', 'Name a member of the Manning football family', {
    1: ['Peyton Manning|Peyton', 'Eli Manning|Eli'],
    2: ['Archie Manning|Archie', 'Arch Manning|Arch'],
    4: ['Cooper Manning|Cooper'],
  }),

  prompt('route-run', 'Playbook', 'Name a pass route or run play', {
    1: ['Slant', 'Go Route|Go|Fly|Streak|Nine Route|9 Route', 'Post', 'Screen|Screen Pass', 'QB Sneak|Sneak|Quarterback Sneak'],
    2: ['Out|Out Route|Square Out', 'Curl|Hook', 'Corner|Flag Route', 'Fade', 'Draw', 'Sweep',
        'Dig|In Route|In', 'Comeback', 'Hitch', 'Wheel', 'Option|Read Option', 'RPO|Run Pass Option',
        'Bootleg|Boot', 'Play Action|Play Action Pass'],
    3: ['Counter', 'Dive', 'Toss|Pitch', 'Power', 'Trap', 'Inside Zone', 'Outside Zone|Stretch',
        'Seam', 'Post Corner', 'Bubble Screen', 'Jet Sweep', 'Drag|Shallow Cross|Shallow', 'Crossing Route|Cross',
        'Tush Push|Brotherly Shove', 'Swing|Swing Pass', 'Flat'],
    4: ['Smash', 'Mesh', 'Four Verticals|4 Verts|Verticals', 'Stick', 'Flood', 'Iso|Isolation',
        'Duo', 'Speed Option', 'Triple Option', 'Inverted Veer', 'Whip', 'Snag', 'Y Cross',
        'Sluggo|Slant and Go', 'Out and Up', 'Stop and Go'],
    5: ['Levels', 'Dagger', 'Spacing', 'Follow', 'Wham', 'Pin and Pull', 'Belly', 'Buck Sweep',
        'Student Body Right|Student Body Left', 'Angle Route|Texas Route'],
  }, { ignore: ['route', 'play'] }),

  prompt('defense', 'Playbook', 'Name a defensive scheme or coverage', {
    1: ['Cover 2|Cover Two', 'Man to Man|Man|Man Coverage', 'Zone|Zone Coverage', 'Blitz', '4-3|Four Three'],
    2: ['3-4|Three Four', 'Cover 3|Cover Three', 'Cover 1|Cover One', 'Cover 0|Cover Zero',
        'Nickel', 'Dime', 'Prevent|Prevent Defense', 'Tampa 2|Tampa Two'],
    3: ['Cover 4|Quarters|Cover Four', '46 Defense|46|Forty Six|Bear Defense', 'Zone Blitz|Fire Zone',
        '3-3-5|335', '4-2-5|425', 'Press|Press Coverage', 'Cover 6|Cover Six', 'Big Nickel'],
    4: ['Wide 9|Wide Nine', 'Dollar', '5-2|52|Five Two', 'Robber', 'Double Cover|Double Coverage',
        'Bracket|Bracket Coverage', 'Prevent Zone', 'Amoeba', 'Mug|Mugged Look'],
    5: ['Quarter Quarter Half|Cover 7', 'Psycho', 'Bend Dont Break|Bend But Dont Break', '6-2|Six Two',
        'Pattern Match|Pattern Matching'],
  }, { ignore: ['defense', 'coverage'] }),

  prompt('stat', 'Stats', 'Name a football stat category', {
    1: ['Touchdowns|TD|TDs', 'Passing Yards', 'Rushing Yards', 'Receiving Yards', 'Sacks',
        'Interceptions|INT|Picks', 'Tackles'],
    2: ['Receptions|Catches', 'Completions', 'Fumbles', 'Passer Rating|QB Rating',
        'Field Goals|FG', 'Completion Percentage', 'Yards per Carry|YPC', 'Targets',
        'Turnovers', 'Points'],
    3: ['QBR|Total QBR', 'Yards After Catch|YAC', 'Forced Fumbles', 'Pass Deflections|Passes Defended',
        'Safeties', 'First Downs', 'Time of Possession', 'Third Down Conversions|Third Down Percentage',
        'Red Zone Efficiency|Red Zone Percentage', 'Tackles for Loss|TFL', 'QB Hits',
        'Fumbles Recovered|Fumble Recoveries', 'Return Yards', 'Yards per Attempt|YPA', 'Air Yards',
        'Punting Average|Punt Average'],
    4: ['Extra Points|PAT', 'Touchbacks', 'Fair Catches', 'EPA|Expected Points Added',
        'CPOE|Completion Percentage Over Expected', 'Pressures|Pressure Rate', 'Drops|Dropped Passes',
        'Missed Tackles', 'ANY/A|Adjusted Net Yards per Attempt', 'Yards per Route Run|YPRR',
        'Snap Count|Snaps', 'Success Rate'],
    5: ['DVOA', 'Approximate Value|AV', 'Hurries|QB Hurries', 'Separation', 'Net Yards per Attempt|NY/A'],
  }),
]

/**
 * Prompts are added in batches. Append new batches to the END of this list,
 * each with a go-live date after today:
 *   export const BATCHES = [BATCH_1, BATCH_2, liveFrom('2026-11-12', BATCH_3)]
 * (import liveFrom from './types'). The date guarantees the batch can't change
 * any drive already played. Batches 1 and 2 count as live from launch.
 * New prompts debut first, then prompts recycle with a 7-day cooldown.
 * Never delete a prompt that has been played; it would change past drives.
 */
export const BATCHES: PromptDef[][] = [
  BATCH_1,
  BATCH_2,
  liveFrom('2026-11-04', BATCH_3),
  liveFrom('2026-11-06', BATCH_4),
  liveFrom('2026-11-07', BATCH_5),
  liveFrom('2026-11-08', BATCH_6),
]

export const PROMPTS: PromptDef[] = BATCHES.flat()
