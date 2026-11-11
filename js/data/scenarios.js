/* 9-line drill scenarios.
 *
 * Everything here is FICTIONAL: grids, units, names and terrain are invented
 * for training. Each scenario carries the raw "JTAC notes" a controller would
 * have, plus the expected answer the grader checks against.
 *
 * expected = {
 *   control: '1'|'2'|'3',  method: 'BOT'|'BOC',  ip: 'HAMMER',
 *   heading: 130 (magnetic),  distance: {value, unit:'nm'|'m'},  elevation: feet MSL,
 *   description: { groups: [[synonyms...], ...], text },   // every group must be hit
 *   location: 'MGRS without spaces',  mark: {type, code},
 *   friendlies: {dir, meters},  egress: dir,  dangerClose: bool,
 *   restrictions: ['fah'|'ltl'|'tot'|'hazard', ...]
 * }
 */
(function () {
  const CAS = (window.CAS = window.CAS || {});

  CAS.dirs = {
    N: { label: 'North', brg: 0, say: 'north' },
    NE: { label: 'Northeast', brg: 45, say: 'northeast' },
    E: { label: 'East', brg: 90, say: 'east' },
    SE: { label: 'Southeast', brg: 135, say: 'southeast' },
    S: { label: 'South', brg: 180, say: 'south' },
    SW: { label: 'Southwest', brg: 225, say: 'southwest' },
    W: { label: 'West', brg: 270, say: 'west' },
    NW: { label: 'Northwest', brg: 315, say: 'northwest' },
  };

  CAS.ipNames = ['HAMMER', 'ANVIL', 'COBRA', 'MUSTANG', 'RAZOR', 'FALCON', 'GRANITE', 'SABRE'];

  CAS.markTypes = {
    laser: { label: 'Laser', needsCode: true, codeLabel: 'Code (4 digits)' },
    ir: { label: 'IR pointer', needsCode: false },
    smoke: { label: 'Smoke', needsCode: true, codeLabel: 'Color' },
    none: { label: 'None', needsCode: false },
  };

  CAS.restrictionOptions = {
    fah: 'Final attack heading restriction',
    ltl: 'Laser-to-target line',
    tot: 'Time on target / time to target',
    hazard: 'Hazard to flight (wires, towers, terrain)',
  };

  CAS.drillRules = [
    'Danger close: for this drill, friendlies within 300 m of the target with 500-lb-class weapons. Real MSD comes from current doctrine tables.',
    'If you are lasing from the ground, the remarks need a laser-to-target line. If the aircraft self-lases, they do not.',
    'Brief a final attack heading restriction, a time on target, or a hazard only when the notes call for one.',
    'Heading is MAGNETIC. Elevation is feet MSL. Fixed-wing distance is nautical miles; rotary-wing is meters.',
    'Line 8 is the direction and distance FROM THE TARGET TO the friendlies.',
  ];

  CAS.scenarios = [
    {
      id: 'convoy', level: 1, title: 'Convoy ambush on Route Copper',
      aircraft: '2× A-10C "Hawg 11" · each 2× GBU-12, 1,100 rds 30 mm',
      narrative: 'The lead vehicle of a resupply convoy has been hit by RPG fire from a compound on a ridge. You are with the convoy, eyes on both the compound and the aircraft orbiting overhead. Clear day, 12 km visibility.',
      notes: [
        ['IP', 'HAMMER, 6.0 NM from target'],
        ['IP → target', '130° magnetic'],
        ['Target elevation', '1,240 ft MSL'],
        ['Target', '2× BMP-2 and approx. 8 dismounted infantry in the open at the compound'],
        ['Target grid', '38T MN 4521 3367'],
        ['Marking', 'You will designate with a ground laser, code 1688'],
        ['Friendlies', 'Convoy, 900 m south of the target'],
        ['Threats / egress', 'SA-18 reported to the south. Briefed egress corridor: north.'],
      ],
      map: { ipName: 'HAMMER', ipBrg: 310, friendlies: [{ brg: 180, m: 900, label: 'CONVOY' }], threats: [{ brg: 190, m: 2200, label: 'SA-18' }] },
      expected: {
        control: '1', method: 'BOT', ip: 'HAMMER', heading: 130,
        distance: { value: 6, unit: 'nm' }, elevation: 1240,
        description: { groups: [['bmp'], ['infantry', 'dismount', 'troops', 'personnel', 'troop']], text: 'two BMP-2 and dismounted infantry in the open' },
        location: '38TMN45213367', mark: { type: 'laser', code: '1688' },
        friendlies: { dir: 'S', meters: 900 }, egress: 'N',
        dangerClose: false, restrictions: ['ltl'],
      },
    },
    {
      id: 'checkpoint', level: 1, title: 'Technical at the checkpoint',
      aircraft: '2× F/A-18C "Rattler 21" · each 2× Mk-82, 20 mm',
      narrative: 'An armed pickup with a 12.7 mm machine gun has set up a hasty checkpoint on Route Emerald, blocking your patrol. A mortar will mark the target with red smoke. You can see the target and the aircraft.',
      notes: [
        ['IP', 'ANVIL, 8.0 NM from target'],
        ['IP → target', '270° magnetic'],
        ['Target elevation', '2,060 ft MSL'],
        ['Target', '1× pickup truck with mounted 12.7 mm machine gun at the checkpoint'],
        ['Target grid', '38T LN 7134 8820'],
        ['Marking', 'Mortar-delivered red smoke'],
        ['Friendlies', 'Patrol, 1,500 m east of the target'],
        ['Hazard', 'High-tension wires run north–south, 800 m west of the target'],
        ['Threats / egress', 'SA-18 team suspected to the south. Briefed egress corridor: north.'],
      ],
      map: { ipName: 'ANVIL', ipBrg: 90, friendlies: [{ brg: 90, m: 1500, label: 'PATROL' }], threats: [{ brg: 170, m: 2600, label: 'SA-18?' }], hazards: [{ brg: 270, m: 800, label: 'WIRES' }] },
      expected: {
        control: '1', method: 'BOT', ip: 'ANVIL', heading: 270,
        distance: { value: 8, unit: 'nm' }, elevation: 2060,
        description: { groups: [['pickup', 'truck', 'technical', 'vehicle'], ['12.7', 'machine gun', 'mg', 'dshk', 'hmg']], text: 'one pickup with a mounted 12.7 mm machine gun' },
        location: '38TLN71348820', mark: { type: 'smoke', code: 'red' },
        friendlies: { dir: 'E', meters: 1500 }, egress: 'N',
        dangerClose: false, restrictions: ['hazard'],
        detail: { hazard: 'wires running north to south, eight hundred meters west of the target' },
      },
    },
    {
      id: 'tic-wadi', level: 2, title: 'TIC — danger close at the wadi',
      aircraft: '2× F-16C "Viper 21" · each 2× GBU-12, 500 rds 20 mm',
      narrative: 'Your patrol is pinned in a dry wadi by a machine gun and a mortar team in a treeline. You can see the treeline and the aircraft overhead. Command wants rounds on target now but the enemy is very close.',
      notes: [
        ['IP', 'COBRA, 4.5 NM from target'],
        ['IP → target', '220° magnetic'],
        ['Target elevation (map)', '412 m MSL'],
        ['Target', 'Machine-gun nest and 2-man mortar team in a treeline'],
        ['Target grid', '38T MN 5032 4175'],
        ['Marking', 'You will designate with a ground laser, code 1511'],
        ['Friendlies', 'Your patrol, 250 m northwest of the target'],
        ['Restriction', 'Keep run-ins and impacts off the friendly (northwest) side'],
        ['Threats / egress', 'Enemy reinforcement route from the east. Briefed egress corridor: south.'],
      ],
      map: { ipName: 'COBRA', ipBrg: 40, friendlies: [{ brg: 315, m: 250, label: 'PATROL' }], threats: [{ brg: 90, m: 1200, label: 'REINF' }] },
      expected: {
        control: '1', method: 'BOT', ip: 'COBRA', heading: 220,
        distance: { value: 4.5, unit: 'nm' }, elevation: 1352,
        description: { groups: [['machine gun', 'mg', 'hmg', 'nest'], ['mortar']], text: 'machine-gun nest and mortar team in a treeline' },
        location: '38TMN50324175', mark: { type: 'laser', code: '1511' },
        friendlies: { dir: 'NW', meters: 250 }, egress: 'S',
        dangerClose: true, restrictions: ['fah', 'ltl'],
        detail: { fah: 'keep run-ins and impacts off the northwest side' },
      },
      tol: { elevation: 5 },
    },
    {
      id: 'night-armor', level: 2, title: 'Night — armor in a staging area',
      aircraft: '2× F/A-18C "Knight 11" · each 2× GBU-12 · NVG-equipped',
      narrative: 'Night, no illumination. Using NVG and an IR pointer you can see the target clearly. The aircraft are at 22,000 ft with lights off, so you cannot see them. Friendly armor attacks at 2315Z.',
      notes: [
        ['IP', 'RAZOR, 9.5 NM from target'],
        ['IP → target', '075° magnetic'],
        ['Target elevation', '1,780 ft MSL'],
        ['Target', '3× T-72 tanks and 1× BTR parked in an open staging area'],
        ['Target grid', '38T LN 9902 1546'],
        ['Marking', 'IR pointer'],
        ['Friendlies', 'Alpha Company, 2,000 m north of the target'],
        ['Timing', 'Ordnance must impact by 2310Z so the assault can move at 2315Z'],
        ['Threats / egress', 'No air defense reported. Briefed egress corridor: south.'],
      ],
      map: { ipName: 'RAZOR', ipBrg: 255, friendlies: [{ brg: 0, m: 2000, label: 'ALPHA CO' }], threats: [] },
      expected: {
        control: '2', method: 'BOT', ip: 'RAZOR', heading: 75,
        distance: { value: 9.5, unit: 'nm' }, elevation: 1780,
        description: { groups: [['t-72', 't72', 'tank', 'armor'], ['btr']], text: 'three T-72 and one BTR in the open' },
        location: '38TLN99021546', mark: { type: 'ir', code: '' },
        friendlies: { dir: 'N', meters: 2000 }, egress: 'S',
        dangerClose: false, restrictions: ['tot'],
        detail: { tot: 'time on target two-three-one-zero Zulu' },
      },
    },
    {
      id: 'rotary-bp', level: 2, title: 'Rotary-wing attack from a battle position',
      aircraft: '2× AH-64D "Gunslinger 21" · each 8× AGM-114K, 300 rds 30 mm',
      narrative: 'Two BTR-80s and a command truck sit at the north edge of a village. The attack helicopters are holding at a battle position. You have eyes on the target and the aircraft.',
      notes: [
        ['BP', 'FALCON, 2,800 m from target'],
        ['BP → target', '310° magnetic'],
        ['Target elevation', '3,100 ft MSL'],
        ['Target', '2× BTR-80 and 1× command truck at the north edge of the village'],
        ['Target grid', '38T LN 6120 5503'],
        ['Marking', 'White smoke from a mortar'],
        ['Friendlies', 'Company command post, 1,200 m east of the target'],
        ['Hazard', 'Wires strung across the valley 500 m south of the target'],
        ['Threats / egress', 'Small-arms threat only. Briefed egress: west.'],
      ],
      map: { ipName: 'BP FALCON', ipBrg: 130, friendlies: [{ brg: 90, m: 1200, label: 'CP' }], threats: [], hazards: [{ brg: 180, m: 500, label: 'WIRES' }] },
      expected: {
        control: '1', method: 'BOT', ip: 'FALCON', heading: 310,
        distance: { value: 2800, unit: 'm' }, elevation: 3100,
        description: { groups: [['btr'], ['truck', 'command', 'vehicle']], text: 'two BTR-80 and a command truck' },
        location: '38TLN61205503', mark: { type: 'smoke', code: 'white' },
        friendlies: { dir: 'E', meters: 1200 }, egress: 'W',
        dangerClose: false, restrictions: ['hazard'],
        detail: { hazard: 'wires across the valley, five hundred meters south of the target' },
      },
    },
    {
      id: 'unseen', level: 3, title: 'Unseen target — coordinate attack',
      aircraft: '2× F-15E "Strike 71" · each 4× GBU-38, 20 mm',
      narrative: 'A UAV has seen four trucks under tree cover that the JTAC cannot observe, and the aircraft are beyond sight. The ground commander approves an attack on the coordinates. No mark is possible and you will clear multiple attacks within the brief.',
      notes: [
        ['IP', 'GRANITE, 11.0 NM from target'],
        ['IP → target', '200° magnetic'],
        ['Target elevation (map)', '905 m MSL'],
        ['Target', '4 trucks (suspected SAM reloads) under tree cover'],
        ['Target grid', '38T MM 3388 9045'],
        ['Marking', 'None possible'],
        ['Friendlies', 'Nearest friendly element is 3,500 m southwest of the target'],
        ['Hazard', 'Cell tower 1 km northeast of the target'],
        ['Threats / egress', 'Egress corridor: north.'],
      ],
      map: { ipName: 'GRANITE', ipBrg: 20, friendlies: [{ brg: 225, m: 3500, label: 'NEAREST FRND' }], threats: [], hazards: [{ brg: 45, m: 1000, label: 'TOWER' }] },
      expected: {
        control: '3', method: 'BOC', ip: 'GRANITE', heading: 200,
        distance: { value: 11, unit: 'nm' }, elevation: 2969,
        description: { groups: [['truck', 'vehicle'], ['tree', 'wood', 'forest', 'cover', 'canopy']], text: 'four trucks under tree cover' },
        location: '38TMM33889045', mark: { type: 'none', code: '' },
        friendlies: { dir: 'SW', meters: 3500 }, egress: 'N',
        dangerClose: false, restrictions: ['hazard'],
        detail: { hazard: 'cell tower one thousand meters northeast of the target' },
      },
      tol: { elevation: 5 },
    },
    {
      id: 'declination', level: 3, title: 'True bearing, magnetic heading',
      aircraft: '2× F-16CJ "Cobra 51" · each 2× GBU-12',
      narrative: 'Your only data comes from a paper map. The IP-to-target bearing you measured is TRUE, and the aircraft navigate in MAGNETIC. Remember: east is least, west is best. You can see target and aircraft.',
      notes: [
        ['IP', 'MUSTANG'],
        ['IP → target (map)', '095° TRUE · local magnetic variation 7° EAST'],
        ['IP → target distance (map)', '12.3 km'],
        ['Target elevation (map)', '1,005 m MSL'],
        ['Target', '5 armed technical vehicles dispersed in an orchard'],
        ['Target grid', '38T MM 7741 2208'],
        ['Marking', 'You will designate with a ground laser, code 2688'],
        ['Friendlies', 'Platoon, 700 m southeast of the target'],
        ['Restriction', 'Keep run-ins and impacts off the southeast side'],
        ['Threats / egress', 'No air defense reported. Briefed egress corridor: north.'],
      ],
      map: { ipName: 'MUSTANG', ipBrg: 275, friendlies: [{ brg: 135, m: 700, label: 'PLATOON' }], threats: [] },
      expected: {
        control: '1', method: 'BOT', ip: 'MUSTANG', heading: 88, trapHeading: 95,
        distance: { value: 6.6, unit: 'nm' }, elevation: 3297,
        description: { groups: [['technical', 'pickup', 'vehicle'], ['orchard', 'tree', 'grove']], text: 'five armed technicals dispersed in an orchard' },
        location: '38TMM77412208', mark: { type: 'laser', code: '2688' },
        friendlies: { dir: 'SE', meters: 700 }, egress: 'N',
        dangerClose: false, restrictions: ['fah', 'ltl'],
        detail: { fah: 'keep run-ins and impacts off the southeast side' },
      },
      tol: { elevation: 5, distance: 0.3, heading: 1 },
    },
    {
      id: 'dusk-dc', level: 3, title: 'Dusk — smoke mark, danger close',
      aircraft: '2× A-10C "Hawg 31" · each 4× Mk-82, 1,150 rds 30 mm',
      narrative: 'Light is fading and you have no laser. An ATGM team and a heavy machine gun are in ruined buildings and your platoon is very close. Mortar smoke will mark the target. You see target and aircraft.',
      notes: [
        ['IP', 'SABRE, 5.0 NM from target'],
        ['IP → target', '010° magnetic'],
        ['Target elevation', '560 ft MSL'],
        ['Target', 'ATGM team and 12.7 mm machine gun in ruined buildings'],
        ['Target grid', '38T LN 2210 7714'],
        ['Marking', 'Mortar-delivered red smoke'],
        ['Friendlies', 'Your platoon, 200 m southeast of the target'],
        ['Restriction', 'Keep run-ins and impacts off the southeast side'],
        ['Hazard', 'Construction crane 400 m north of the target'],
        ['Threats / egress', 'Briefed egress: west.'],
      ],
      map: { ipName: 'SABRE', ipBrg: 190, friendlies: [{ brg: 135, m: 200, label: 'PLATOON' }], threats: [], hazards: [{ brg: 0, m: 400, label: 'CRANE' }] },
      expected: {
        control: '1', method: 'BOT', ip: 'SABRE', heading: 10,
        distance: { value: 5, unit: 'nm' }, elevation: 560,
        description: { groups: [['atgm', 'anti-tank', 'antitank'], ['machine gun', 'mg', 'hmg', '12.7']], text: 'ATGM team and 12.7 mm machine gun in ruined buildings' },
        location: '38TLN22107714', mark: { type: 'smoke', code: 'red' },
        friendlies: { dir: 'SE', meters: 200 }, egress: 'W',
        dangerClose: true, restrictions: ['fah', 'hazard'],
        detail: { fah: 'keep run-ins and impacts off the southeast side', hazard: 'construction crane four hundred meters north of the target' },
      },
    },
  ];
})();
