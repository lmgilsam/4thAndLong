// Player and coach nicknames, accepted in every prompt where that person is an answer
// (general prompts and the generated team prompts alike). Keys are the name as it
// appears in the answer lists; match.ts attaches the nicknames when it indexes a prompt.
//
// Rules:
// - Only add nicknames that are widely used. A nickname is an exact match, not a typo fix.
// - If two answers in the same prompt would share a nickname ("LT"), it's dropped for
//   both in that prompt, so it can never score the wrong player.
// - Same-name players: use `only` to list the team prompt ids where the nickname applies.
//   Team prompts not listed are skipped; general prompts always get it.
//   (There are two Adrian Petersons, several Chris Johnsons and Michael Thomases.)
// - validate-data.ts checks every attached nickname matches back to its own player.

export interface NicknameEntry {
  nicks: string[]
  /** Team prompt ids this applies to (general prompts always apply). Omit for "all". */
  only?: string[]
}

const n = (nicks: string[], only?: string[]): NicknameEntry => ({ nicks, only })

export const NICKNAMES: Record<string, NicknameEntry> = {
  // Quarterbacks
  'Tom Brady': n(['TB12', 'The GOAT']),
  'Peyton Manning': n(['The Sheriff']),
  'Ben Roethlisberger': n(['Big Ben']),
  'Joe Montana': n(['Joe Cool']),
  'Joe Namath': n(['Broadway Joe']),
  'Ken Stabler': n(['The Snake', 'Snake Stabler']),
  'Johnny Unitas': n(['Johnny U']),
  'Roger Staubach': n(['Roger the Dodger', 'Captain America']),
  'Aaron Rodgers': n(['A-Rod']),
  'Johnny Manziel': n(['Johnny Football']),
  'Robert Griffin III': n(['RG3', 'RGIII', 'RG III']),
  // nflverse lists him as plain "Robert Griffin" on the Washington roster
  'Robert Griffin': n(['RG3', 'RGIII', 'RG III', 'Robert Griffin III'], ['team-was-qb']),
  'Ryan Fitzpatrick': n(['Fitzmagic', 'Fitz']),
  'Joe Burrow': n(['Joe Brrr', 'Joe Shiesty']),
  'Brock Purdy': n(['Mr. Irrelevant']),
  'Cam Newton': n(['Superman']),
  'Steve McNair': n(['Air McNair']),
  'Russell Wilson': n(['DangerRuss']),
  'Fran Tarkenton': n(['Fran the Scram']),
  'Daryle Lamonica': n(['The Mad Bomber']),
  'Kirk Cousins': n(['Kirko Chainz']),
  'Dan Marino': n(['Dan the Man']),
  'Vince Young': n(['VY']),
  'Jay Cutler': n(['Smokin Jay']),
  'Matt Ryan': n(['Matty Ice']),
  'Otto Graham': n(['Automatic Otto']),
  'Sammy Baugh': n(['Slingin Sammy']),
  'Norm Van Brocklin': n(['The Dutchman']),

  // Running backs
  'Jerome Bettis': n(['The Bus']),
  'Adrian Peterson': n(['All Day', 'AD', 'AP', 'Purple Jesus'],
    ['team-min-rb', 'team-ari-rb', 'team-det-rb', 'team-sea-rb', 'team-was-rb', 'team-no-rb', 'team-ten-rb']),
  'Marshawn Lynch': n(['Beast Mode']),
  'LaDainian Tomlinson': n(['LT']),
  'Walter Payton': n(['Sweetness']),
  'Earl Campbell': n(['The Tyler Rose']),
  'Chris Johnson': n(['CJ2K'], ['team-ten-rb', 'team-nyj-rb', 'team-ari-rb']),
  'Christian McCaffrey': n(['CMC']),
  'Maurice Jones-Drew': n(['MJD', 'Pocket Hercules']),
  'Derrick Henry': n(['King Henry']),
  'Edgerrin James': n(['Edge']),
  'Red Grange': n(['The Galloping Ghost']),
  'Ron Dayne': n(['The Great Dayne']),
  'Terrell Davis': n(['TD'], ['team-den-rb']),
  'Craig Heyward': n(['Ironhead', 'Ironhead Heyward']),
  'Christian Okoye': n(['The Nigerian Nightmare']),
  'Larry Csonka': n(['Zonk']),
  'Mike Alstott': n(['A-Train']),
  'BenJarvus Green-Ellis': n(['The Law Firm']),
  'Ezekiel Elliott': n(['Zeke']),
  'Leonard Fournette': n(['Playoff Lenny']),
  'O.J. Simpson': n(['The Juice']),
  'Gale Sayers': n(['The Kansas Comet']),
  'Elroy Hirsch': n(['Crazylegs', 'Crazy Legs']),
  'John Riggins': n(['Riggo']),
  'Devin Singletary': n(['Motor']),

  // Receivers and tight ends
  'Calvin Johnson': n(['Megatron']),
  'Terrell Owens': n(['T.O.']),
  'Chad Johnson': n(['Ochocinco', 'Chad Ochocinco']),
  'Larry Fitzgerald': n(['Fitz']),
  'Odell Beckham Jr.': n(['OBJ']),
  'DeAndre Hopkins': n(['Nuk']),
  'Tyreek Hill': n(['Cheetah']),
  'Amon-Ra St. Brown': n(['Sun God']),
  'Rob Gronkowski': n(['Gronk']),
  'Antonio Brown': n(['AB']),
  'Michael Irvin': n(['The Playmaker']),
  'Deion Sanders': n(['Prime Time', 'Primetime', 'Neon Deion', 'Coach Prime']),
  'Lance Alworth': n(['Bambi']),
  'Paul Hornung': n(['The Golden Boy']),
  'Julian Edelman': n(['Jules']),
  'Plaxico Burress': n(['Plax']),
  'Tony Gonzalez': n(['Tony G']),
  'Michael Thomas': n(["Can't Guard Mike"], []),
  'Josh Gordon': n(['Flash Gordon']),
  'Bob Hayes': n(['Bullet Bob']),
  'Don Hutson': n(['The Alabama Antelope']),
  'DeSean Jackson': n(['DJax']),
  'Ozzie Newsome': n(['The Wizard of Oz']),

  // Defense
  'Lawrence Taylor': n(['LT']),
  'Joe Greene': n(['Mean Joe Greene', 'Mean Joe']),
  'Reggie White': n(['The Minister of Defense']),
  'Deacon Jones': n(['The Secretary of Defense']),
  'Darrelle Revis': n(['Revis Island']),
  'Mike Singletary': n(['Samurai Mike']),
  'William Perry': n(['The Refrigerator', 'Fridge'], ['team-chi-def']),
  'Night Train Lane': n(['Night Train', 'Dick Lane']),
  'Jack Tatum': n(['The Assassin']),
  'Jevon Kearse': n(['The Freak']),
  'Brian Dawkins': n(['Weapon X']),
  'Ted Hendricks': n(['The Mad Stork']),
  'Shawne Merriman': n(['Lights Out']),
  'Tyrann Mathieu': n(['Honey Badger']),
  'Chuck Bednarik': n(['Concrete Charlie']),
  'Patrick Peterson': n(['P2']),
  'Kam Chancellor': n(['Bam Bam Kam']),
  'James Harrison': n(['Deebo']),
  'Thomas Henderson': n(['Hollywood Henderson']),
  'Aaron Donald': n(['AD'], ['team-lar-def']),
  'Sean Taylor': n(['Meast']),
  'Steve Atwater': n(['The Smiling Assassin']),
  'Brian Bosworth': n(['The Boz']),
  'Lester Hayes': n(['The Judge']),
  'Carl Eller': n(['Moose']),
  'Bob Sanders': n(['The Eraser']),
  'L.C. Greenwood': n(['Hollywood Bags']),
  'Ahmad Gardner': n(['Sauce Gardner', 'Sauce']),
  'Sauce Gardner': n(['Ahmad Gardner', 'Sauce']),
  'Adam Jones': n(['Pacman Jones', 'Pacman'], ['team-ten-def', 'team-cin-def', 'team-dal-def']),
  'Too Tall Jones': n(['Too Tall', 'Ed Jones', 'Ed Too Tall Jones'], ['team-dal-def']),

  // Coaches
  'Bill Belichick': n(['The Hoodie']),
  'Bill Parcells': n(['The Big Tuna', 'Tuna']),
  'Mike Ditka': n(['Iron Mike', 'Da Coach']),
  'Jon Gruden': n(['Chucky']),
  'Andy Reid': n(['Big Red']),
  'Bill Cowher': n(['The Chin']),
  'Bear Bryant': n(['Paul Bryant']),
  'Steve Spurrier': n(['The Head Ball Coach', 'The Ol Ball Coach', 'HBC']),
  'Les Miles': n(['The Mad Hatter']),
  'Ed Orgeron': n(['Coach O']),
}

/**
 * Common first-name forms treated as the same name, so "Pat Mahomes", "Mike Vick" and
 * "Matt Stafford" match exactly. Only applied to the first word of a multi-word name.
 */
export const FIRST_NAME_GROUPS: string[][] = [
  ['michael', 'mike'],
  ['matthew', 'matt'],
  ['christopher', 'chris'],
  ['joseph', 'joe', 'joey'],
  ['james', 'jim', 'jimmy'],
  ['robert', 'rob', 'bob', 'bobby', 'robbie'],
  ['william', 'bill', 'billy'],
  ['daniel', 'dan', 'danny'],
  ['thomas', 'tom', 'tommy'],
  ['benjamin', 'ben'],
  ['nicholas', 'nick'],
  ['anthony', 'tony'],
  ['david', 'dave'],
  ['steven', 'stephen', 'steve'],
  ['kenneth', 'ken', 'kenny'],
  ['joshua', 'josh'],
  ['samuel', 'sam', 'sammy'],
  ['zachary', 'zach', 'zack'],
  ['alexander', 'alex'],
  ['patrick', 'pat'],
  ['edward', 'ed', 'eddie'],
  ['gregory', 'greg'],
  ['richard', 'rich', 'rick', 'ricky'],
  ['jonathan', 'jon'],
  ['timothy', 'tim'],
  ['jeffrey', 'jeff'],
  ['andrew', 'andy'],
  ['charles', 'charlie', 'chuck'],
  ['frederick', 'fred', 'freddie'],
  ['lawrence', 'larry'],
  ['ronald', 'ron', 'ronnie'],
  ['donald', 'don', 'donnie'],
  ['gerald', 'jerry'],
  ['leonard', 'lenny'],
  ['cameron', 'cam'],
  ['jacob', 'jake'],
  ['nathaniel', 'nathan', 'nate'],
  ['philip', 'phillip', 'phil'],
  ['raymond', 'ray'],
  ['terrance', 'terrence', 'terry'],
  ['douglas', 'doug'],
]
