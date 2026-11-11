/* The CAS call sequence and the 9-line, line by line.
 * Based on publicly available joint doctrine (JP 3-09.3, ATP 3-09.32).
 * Training aid only: follow your current publication and theater SPINS.
 */
(function () {
  const CAS = (window.CAS = window.CAS || {});

  /* ---------- The overall call sequence ---------- */
  CAS.sequence = [
    {
      id: 'checkin', title: 'CAS check-in', who: 'Aircrew → JTAC',
      summary: 'The aircrew tell you who they are and what they can do.',
      points: [
        'Callsign and mission number',
        'Number and type of aircraft',
        'Position and altitude',
        'Ordnance (type and quantity)',
        'Playtime (time on station)',
        'Capabilities (sensors, NVG, data link, video downlink)',
        'Laser code, if applicable',
      ],
      transcript: [
        ['Hawg 11', 'Axeman 21, Hawg 11, flight of two A-10C, checking in. Angels one-two, ten miles south of Hammer. Each two GBU-12 and eleven hundred rounds of thirty millimeter. Playtime thirty minutes. Litening, SADL, NVG. Laser code one-six-eight-eight.'],
        ['Axeman 21', 'Hawg 11, Axeman 21, roger. Situation update follows.'],
      ],
    },
    {
      id: 'sitrep', title: 'Situation update', who: 'JTAC → Aircrew',
      summary: 'You paint the picture: what is out there, who is where, and what you want.',
      points: [
        'Threats — air defense and other threats to aircraft',
        'Targets — description, location, mark',
        'Friendlies — location and mark',
        'Artillery — gun positions, gun-target lines and activity',
        'Clearance — who holds clearance authority',
        'Ordnance — what you want delivered',
        'Remarks / restrictions',
      ],
      transcript: [
        ['Axeman 21', 'Hawg 11, Axeman 21. Situation update. Threats: SA-18 reported to the south, no other air defense. Targets: two BMP-2 and dismounted infantry in the open, northeast of the crossroads. Friendlies: convoy nine hundred meters south of the target. Artillery: none active. Clearance: Axeman 21. Ordnance: GBU-12. Break.'],
        ['Hawg 11', 'Hawg 11, copy.'],
      ],
    },
    {
      id: 'gameplan', title: 'Game plan', who: 'JTAC → Aircrew',
      summary: 'Before the 9-line you brief how you intend to control the attack.',
      points: [
        'Ground commander\'s intent / desired effect',
        'Type of control (Type 1, 2 or 3)',
        'Method of attack (BOT or BOC)',
        'Ordnance and number of attacks',
      ],
      transcript: [
        ['Axeman 21', 'Hawg 11, game plan: Type 1 control, bomb on target, one GBU-12 per aircraft, single attack. Nine-line follows.'],
      ],
    },
    {
      id: 'nineline', title: 'The 9-line', who: 'JTAC → Aircrew',
      summary: 'Nine standardized lines, in order, plus remarks and restrictions.',
      points: [
        'Pass each line by number, in order, at a copyable pace',
        'Pass numbers digit by digit ("niner," "zero")',
        'Finish with remarks/restrictions',
        'Then request readback of lines 4, 6, 7 and restrictions',
      ],
      transcript: [
        ['Axeman 21', 'Line 1: Hammer. Line 2: one-three-zero. Line 3: six miles. Line 4: one-two-four-zero. Line 5: two BMP-2 and dismounted infantry in the open. Line 6: three-eight-Tango Mike-November, four-five-two-one, three-three-six-seven. Line 7: laser, code one-six-eight-eight. Line 8: friendlies south, nine hundred meters. Line 9: egress north. Remarks: laser-to-target line three-six-zero. Not danger close. Readback lines 4, 6, 7 and remarks.'],
      ],
    },
    {
      id: 'readback', title: 'Readback', who: 'Aircrew → JTAC',
      summary: 'The aircrew prove they copied the lines where an error costs lives.',
      points: [
        'Aircrew read back lines 4, 6, 7 and restrictions',
        'Check every digit against what you sent',
        'Say "good readback," or "negative," name the line and correct it',
        'Never accept a bad readback with "roger"',
      ],
      transcript: [
        ['Hawg 11', 'Line 4: one-two-four-zero. Line 6: three-eight-Tango Mike-November, four-five-two-one, three-three-six-seven. Line 7: laser, one-six-eight-eight. Remarks: laser-to-target line three-six-zero.'],
        ['Axeman 21', 'Hawg 11, good readback.'],
      ],
    },
    {
      id: 'attack', title: 'Attack & clearance', who: 'Aircrew ↔ JTAC',
      summary: 'The aircrew report their run; you explicitly authorize (or withhold) release.',
      points: [
        'Aircrew: "in hot" or "in dry"',
        'JTAC: "cleared hot," "continue dry," or "abort"',
        'Aircrew: weapons call (pickle / rifle / guns), then "splash" 5 seconds before impact',
        'Aircrew: "off" and egress direction',
      ],
      transcript: [
        ['Hawg 11', 'Axeman 21, Hawg 11, in hot from the northwest.'],
        ['Axeman 21', 'Hawg 11, Axeman 21, cleared hot.'],
        ['Hawg 11', 'Hawg 11, pickle. … Splash. … Off north.'],
      ],
    },
    {
      id: 'bda', title: 'BDA & next steps', who: 'JTAC → Aircrew',
      summary: 'You report what happened and decide: re-attack, new target, or release the flight.',
      points: [
        'What was hit and the effect (destroyed / damaged / no effect)',
        'Numbers and enemy status (fleeing, regrouping)',
        'Whether a re-attack is needed',
        'Any change to the situation',
      ],
      transcript: [
        ['Axeman 21', 'Hawg 11, Axeman 21: good hits. BDA: two BMP-2 destroyed, six dismounts KIA, remainder fleeing east. No re-attack required. Standby for further tasking.'],
      ],
    },
  ];

  /* ---------- The nine lines ---------- */
  CAS.lines = [
    {
      key: 'gameplan', n: 'GP', name: 'Game plan', short: 'Control type, method of attack, ordnance',
      meaning: 'Briefed before the 9-line so the aircrew know how the attack will be controlled and what effect you want.',
      format: 'Type [1/2/3] control, [bomb on target / bomb on coordinate], [ordnance], [number of attacks]',
      say: 'Game plan: Type 1 control, bomb on target, one GBU-12 per aircraft, single attack.',
      mistakes: [
        'Skipping the game plan and starting at Line 1',
        'Choosing a control type you cannot actually achieve (Type 1 needs eyes on both target and aircraft)',
        'Forgetting to state the method of attack',
      ],
    },
    {
      key: 'ip', n: 1, name: 'IP / BP', short: 'Initial point or battle position',
      meaning: 'The reference point the aircraft flies from to start the final run. Fixed-wing use an IP; rotary-wing use a BP.',
      format: 'A named point, e.g. "Hammer" or "BP Falcon"',
      say: 'Line 1: Hammer.',
      mistakes: [
        'Naming a point the aircrew do not have on their map or data card',
        'Choosing an IP whose run-in goes over friendlies',
      ],
    },
    {
      key: 'heading', n: 2, name: 'Heading', short: 'IP to target, magnetic',
      meaning: 'Magnetic heading from the IP/BP to the target. If an offset is used, state left or right.',
      format: 'Three digits, degrees magnetic (e.g. 090). Offset: "left" or "right" when used.',
      say: 'Line 2: one-three-zero.',
      mistakes: [
        'Passing a true bearing instead of magnetic (apply declination: "east is least, west is best")',
        'Dropping the leading zero, so 90 sounds like 9-0 vs 0-9-0',
        'Using the reciprocal (target to IP)',
      ],
    },
    {
      key: 'distance', n: 3, name: 'Distance', short: 'IP to target',
      meaning: 'Distance from the IP/BP to the target. Fixed-wing: nautical miles. Rotary-wing: meters from the BP.',
      format: 'Number and units, e.g. "six miles" (fixed-wing) or "two-eight-zero-zero meters" (rotary-wing)',
      say: 'Line 3: six miles.',
      mistakes: [
        'Wrong units (kilometers or statute miles)',
        'Measuring from the wrong point',
      ],
    },
    {
      key: 'elevation', n: 4, name: 'Target elevation', short: 'Feet MSL', readback: true,
      meaning: 'Elevation of the target above mean sea level, in feet. Weapons are fused and aimed using it. A readback line.',
      format: 'Feet MSL, e.g. "one-two-four-zero"',
      say: 'Line 4: one-two-four-zero.',
      mistakes: [
        'Giving meters from the map instead of feet (1 m ≈ 3.28 ft)',
        'Giving AGL instead of MSL',
        'Giving the elevation of the JTAC rather than of the target',
      ],
    },
    {
      key: 'description', n: 5, name: 'Target description', short: 'What the aircrew will see',
      meaning: 'Number, type and posture of the target, so the aircrew can confirm they have the right one.',
      format: 'Quantity + type + posture/location cue, e.g. "two BMP-2 and dismounted infantry in the open"',
      say: 'Line 5: two BMP-2 and dismounted infantry in the open.',
      mistakes: [
        'Vague descriptions ("some vehicles")',
        'Omitting posture or features that help the aircrew find it',
        'Describing something other than what is at the Line 6 location',
      ],
    },
    {
      key: 'location', n: 6, name: 'Target location', short: 'MGRS grid or lat/long', readback: true,
      meaning: 'Where the target is. Normally an MGRS grid to 8 or 10 digits. A readback line.',
      format: 'Grid zone + square + easting + northing, e.g. "38T MN 4521 3367"',
      say: 'Line 6: three-eight-Tango Mike-November, four-five-two-one, three-three-six-seven.',
      mistakes: [
        'Transposed digits',
        'Mixing up easting and northing (read right, then up)',
        'Wrong grid zone designator or 100 km square',
      ],
    },
    {
      key: 'mark', n: 7, name: 'Mark type / code', short: 'How the target will be marked', readback: true,
      meaning: 'How the aircrew will recognize the target: laser (with 4-digit code), IR pointer, smoke, etc. A readback line.',
      format: 'Type + code, e.g. "laser, code 1688," "IR pointer," "red smoke," or "none"',
      say: 'Line 7: laser, code one-six-eight-eight.',
      mistakes: [
        'Wrong or invalid laser code (1 or 2, then digits 1–8)',
        'Saying "mark" without a type',
        'Not telling the aircrew when the mark will be on',
      ],
    },
    {
      key: 'friendlies', n: 8, name: 'Location of friendlies', short: 'Direction and distance from target',
      meaning: 'Where friendly forces are relative to the target: cardinal direction and distance in meters (and their mark, if used).',
      format: 'Cardinal direction + meters FROM the target, e.g. "south, nine hundred meters"',
      say: 'Line 8: friendlies south, nine hundred meters.',
      mistakes: [
        'Giving direction from the friendlies to the target instead of from the target to the friendlies',
        'Using miles or feet',
        'Not stating the mark if friendlies are close',
      ],
    },
    {
      key: 'egress', n: 9, name: 'Egress', short: 'Direction to leave the target area',
      meaning: 'The direction (or route) the aircraft should use after weapon release. It keeps aircraft away from friendlies and threats.',
      format: 'A direction or named route, e.g. "north"',
      say: 'Line 9: egress north.',
      mistakes: [
        'Egress that flies over friendlies or into a known threat',
        'Forgetting that egress is where the aircraft goes, not where the threat is',
      ],
    },
    {
      key: 'remarks', n: 'R', name: 'Remarks / restrictions', short: 'Safety and timing limits',
      meaning: 'Anything the aircrew must know that the nine lines do not carry. Always read back.',
      format: 'Danger close (with ground commander\'s initials), final attack heading, laser-to-target line, time on target, hazards',
      say: 'Remarks: laser-to-target line three-six-zero. Not danger close.',
      mistakes: [
        'Omitting "danger close" when friendlies are inside the weapon\'s MSD',
        'Forgetting a laser-to-target line when lasing from the ground',
        'Leaving out hazards such as wires, towers or terrain',
      ],
    },
  ];
})();
