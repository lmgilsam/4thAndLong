import { prompt, type PromptDef } from './types'

// Batch 6 (added Nov 6, 2026): AP awards from 2000 on, plus famous nicknames.
// Award winners checked against the AP winner lists through the 2025 season
// (NFL Honors, Feb 5, 2026).

export const BATCH_6: PromptDef[] = [
  // AP OPOY 2000-2025 (Faulk 2000-01, Brady 2007/2010, Brees 2008/2011, Manning 2004/2013)
  prompt('opoy-2000', 'Awards', 'Name an Offensive Player of the Year from 2000 or later', {
    1: ['Patrick Mahomes', 'Tom Brady', 'Peyton Manning', 'Drew Brees', 'Christian McCaffrey|CMC',
        'Saquon Barkley|Saquon', 'Derrick Henry|King Henry', 'Justin Jefferson|JJettas'],
    2: ['Adrian Peterson|AP|All Day', 'LaDainian Tomlinson|LT', 'Marshall Faulk', 'Cam Newton', 'Cooper Kupp',
        'Jaxon Smith-Njigba|JSN|Jaxon Smith Njigba|Smith-Njigba', 'Chris Johnson|CJ2K'],
    3: ['Matt Ryan|Matty Ice', 'Todd Gurley', 'Michael Thomas', 'Shaun Alexander', 'Priest Holmes',
        'DeMarco Murray'],
    4: ['Jamal Lewis'],
  }),

  // AP DROY 2000-2025
  prompt('droy-2000', 'Awards', 'Name a Defensive Rookie of the Year from 2000 or later', {
    1: ['Aaron Donald', 'Micah Parsons', 'Von Miller', 'Brian Urlacher', 'Nick Bosa', 'Luke Kuechly',
        'Sauce Gardner|Ahmad Gardner|Sauce'],
    2: ['Julius Peppers', 'Terrell Suggs', 'Joey Bosa', 'Patrick Willis', 'Ndamukong Suh',
        'Will Anderson Jr.|Will Anderson', 'Chase Young', 'Marcus Peters'],
    3: ['Shawne Merriman', 'DeMeco Ryans', 'Jared Verse', 'Marshon Lattimore',
        'Shaquille Leonard|Shaq Leonard|Darius Leonard', 'Jerod Mayo', 'Brian Cushing'],
    4: ['Jonathan Vilma', 'Sheldon Richardson', 'Carson Schwesinger'],
    5: ['Kendrell Bell'],
  }),

  // AP Comeback Player of the Year 2000-2025 (2005 had co-winners; Pennington and Burrow won twice)
  prompt('cpoy-2000', 'Awards', 'Name a Comeback Player of the Year from 2000 or later', {
    1: ['Joe Burrow', 'Peyton Manning', 'Tom Brady', 'Christian McCaffrey|CMC', 'Rob Gronkowski|Gronk'],
    2: ['Drew Brees', 'Michael Vick', 'Matthew Stafford', 'Joe Flacco', 'Geno Smith', 'Andrew Luck',
        'Alex Smith', 'Philip Rivers'],
    3: ['Keenan Allen', 'Eric Berry', 'Jordy Nelson', 'Ryan Tannehill', 'Tedy Bruschi',
        'Steve Smith Sr.|Steve Smith', 'Chad Pennington'],
    4: ['Tommy Maddox', 'Jon Kitna', 'Garrison Hearst'],
    5: ['Greg Ellis', 'Joe Johnson'],
  }),

  // AP Coach of the Year 2000-2025 plus AP Assistant Coach of the Year (first given for 2014).
  // Brian Daboll won both (assistant 2020, head coach 2022).
  prompt('coy-2000', 'Awards', 'Name a Coach of the Year or Assistant Coach of the Year from 2000 or later', {
    1: ['Andy Reid', 'Bill Belichick', 'Sean McVay', 'Sean Payton', 'John Harbaugh', 'Kyle Shanahan',
        'Mike Vrabel', 'Ben Johnson'],
    2: ['Jim Harbaugh', 'Bruce Arians', 'Ron Rivera', 'Kevin Stefanski', 'Brian Daboll', "Kevin O'Connell",
        'Dan Quinn', 'Josh McDaniels', 'Wade Phillips', 'Lovie Smith', 'Todd Bowles', 'Jason Garrett',
        'Vic Fangio', 'DeMeco Ryans'],
    3: ['Matt Nagy', 'Marvin Lewis', 'Marty Schottenheimer', 'Jim Schwartz', 'Mike Smith', 'Pat Shurmur',
        'Greg Roman'],
    4: ['Dick Jauron', 'Jim Haslett'],
  }),

  // The nickname is the answer; the person's real name doesn't count. Where people
  // say the nickname and surname together ("Mean Joe Greene") that form counts too.
  prompt('player-nicknames', 'NFL', 'Name a famous nickname of an NFL player or coach (the nickname, not the name)', {
    1: ['Prime Time|Primetime|Neon Deion|Coach Prime', 'Beast Mode|Beastmode', 'Megatron', 'Sweetness',
        'The Bus|Bus', 'Broadway Joe', 'Gronk', 'Big Ben', 'The Fridge|Refrigerator|The Refrigerator'],
    2: ['Joe Cool', 'Matty Ice', 'Mean Joe|Mean Joe Greene', 'Minister of Defense|The Minister of Defense',
        'Honey Badger', 'Ochocinco|Ocho Cinco|Chad Ochocinco|Ocho', 'The Sheriff|Sheriff', 'Zeke',
        'Big Tuna|The Tuna|Tuna', 'Jimmy G', 'The Hoodie|Hoodie'],
    3: ['Night Train|Night Train Lane', 'The Snake|Snake|Kenny the Snake', 'The Galloping Ghost|Galloping Ghost',
        'Too Tall|Too Tall Jones', 'Captain Comeback|Roger the Dodger', 'Slash|Kordell Slash Stewart',
        'Iron Mike', 'Papa Bear', 'The Diesel|Diesel', 'The Playmaker|Playmaker', 'Superman',
        'The Red Rifle|Red Rifle', 'Joe Shiesty|Joe Brrr|Joe Brr'],
    4: ['Crazylegs|Crazy Legs|Crazylegs Hirsch', 'Bambi', "Slingin' Sammy|Slinging Sammy|Slingin Sammy",
        'The Mad Bomber|Mad Bomber', 'A-Train|A Train', 'The Edge|Edge', 'The Assassin|Assassin',
        'The Golden Boy|Golden Boy', 'Bullet Bob|Bullet Bob Hayes', 'Moose', 'The Freak|Freak',
        'Ickey|Ickey Woods', 'Riverboat Ron'],
    5: ['Dr. Death|Doctor Death', 'Concrete Charlie', 'The Mad Stork|Mad Stork', 'Hacksaw|Hacksaw Reynolds',
        'White Shoes|White Shoes Johnson', 'Bad Moon|Bad Moon Rison', 'The Human Joystick|Human Joystick',
        "The Throwin' Samoan|Throwin Samoan|Throwing Samoan"],
  }),
]
