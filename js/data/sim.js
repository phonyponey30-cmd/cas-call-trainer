/* Radio sim: you are JTAC "Axeman 21" controlling a flight of two A-10Cs ("Hawg 11").
 * Each step shows what you just heard, asks for your next transmission, and
 * explains why the best option is best. FICTIONAL scenario for training.
 *
 * step = { heard: [[speaker, text], ...], context?, ask, options: [{ text, correct?, why }] }
 */
(function () {
  const CAS = (window.CAS = window.CAS || {});

  CAS.sim = {
    title: 'Convoy ambush: full CAS control',
    brief: 'You are JTAC Axeman 21 with a convoy 900 m south of an enemy compound. Hawg 11, a flight of two A-10Cs, is about to check in. Control the engagement from check-in to BDA.',
    steps: [
      {
        heard: [['Hawg 11', 'Axeman 21, Hawg 11, flight of two A-10C, checking in. Angels one-two, ten miles south of Hammer. Each two GBU-12 and eleven hundred rounds thirty millimeter. Playtime thirty minutes. Litening, SADL, NVG. Laser code one-six-eight-eight.']],
        ask: 'Reply to the check-in.',
        options: [
          { text: 'Hawg 11, Axeman 21, roger. Situation update follows.', correct: true, why: 'Callsign of the station you are calling first, then yours; "roger" acknowledges; then you move on.' },
          { text: 'Axeman 21 copies all, affirmative, over and out.', why: '"Over and out" is never correct, and "affirmative" answers a question nobody asked.' },
          { text: 'Hawg 11, repeat your playtime.', why: 'Use "say again," never "repeat" — and nothing was missed, so there is nothing to repeat.' },
          { text: 'Hawg 11, cleared hot.', why: 'Far too early: no situation update, game plan, 9-line or readback has happened yet.' },
        ],
      },
      {
        heard: [['Hawg 11', 'Axeman 21, Hawg 11, ready for situation update.']],
        ask: 'Which order is the standard situation update?',
        options: [
          { text: 'Threats, targets, friendlies, artillery, clearance, ordnance, remarks.', correct: true, why: 'Threats first so the aircrew know what can hurt them, then the target, friendlies, artillery, who clears, what you want, and any restrictions.' },
          { text: 'Ordnance, targets, remarks, friendlies, threats, clearance, artillery.', why: 'Not the standard order — the aircrew need threats and the target picture before ordnance.' },
          { text: 'Friendlies, ordnance, clearance, targets, remarks, artillery, threats.', why: 'Out of order and it buries the threats.' },
          { text: 'Targets, clearance, ordnance, threats, friendlies, remarks, artillery.', why: 'Threats come first. Friendlies need to be briefed right after the target.' },
        ],
      },
      {
        heard: [['Hawg 11', 'Axeman 21, Hawg 11, copy situation update. Ready for game plan.']],
        ask: 'What belongs in the game plan?',
        options: [
          { text: 'Type 1 control, bomb on target, one GBU-12 per aircraft, single attack.', correct: true, why: 'The game plan states the control type, method of attack and ordnance/number of attacks — before the 9-line.' },
          { text: 'Line 1 Hammer, line 2 one-three-zero, line 3 six miles.', why: 'That is the 9-line itself, not the game plan.' },
          { text: 'Readback lines 4, 6, 7 and restrictions.', why: 'The readback request comes after the 9-line and remarks.' },
          { text: 'Cleared hot, Type 1.', why: 'Clearance is never part of the game plan; it is given only during the attack.' },
        ],
      },
      {
        heard: [['Axeman 21', 'Line 1: Hammer. Line 2: one-three-zero. Line 3: six miles. Line 4: one-two-four-zero. Line 5: two BMP-2 and dismounted infantry in the open. Line 6: three-eight-Tango Mike-November, four-five-two-one, three-three-six-seven. Line 7: laser, code one-six-eight-eight. Line 8: friendlies south, nine hundred meters. Line 9: egress north. Remarks: laser-to-target line three-six-zero. Not danger close.']],
        context: 'You have just passed the 9-line and remarks.',
        ask: 'What do you say next?',
        options: [
          { text: 'Hawg 11, readback lines 4, 6, 7 and restrictions.', correct: true, why: 'Those are the lines where an error is most dangerous: elevation, location and mark, plus restrictions.' },
          { text: 'Hawg 11, say all back.', why: 'Reading back everything wastes time and is not the standard readback.' },
          { text: 'Hawg 11, did you get that?', why: 'It invites "yes" without proof. A readback is proof.' },
          { text: 'Hawg 11, confirm.', why: '"Confirm" is ambiguous; name the lines you want read back.' },
        ],
      },
      {
        heard: [['Hawg 11', 'Line 4: one-two-four-zero. Line 6: three-eight-Tango Mike-November, four-five-two-one, three-six-three-seven. Line 7: laser, one-six-eight-eight. Remarks: laser-to-target line three-six-zero, not danger close.']],
        context: 'Compare against what you sent. Line 6 northing was three-three-six-seven.',
        ask: 'Reply to the readback.',
        options: [
          { text: 'Hawg 11, negative line 6. Correction: four-five-two-one, three-three-six-seven.', correct: true, why: 'Name the wrong line and pass the corrected data — the fastest, least ambiguous fix.' },
          { text: 'Hawg 11, good readback.', why: 'The northing was transposed (3637 vs 3367). Accepting it could put weapons 300 m off.' },
          { text: 'Hawg 11, roger, standby for clearance.', why: '"Roger" would accept a wrong grid.' },
          { text: 'Hawg 11, negative, say everything again.', why: 'Only line 6 was wrong; naming it saves time and prevents new errors.' },
        ],
      },
      {
        heard: [['Hawg 11', 'Axeman 21, Hawg 11, in hot from the northwest.']],
        context: 'You have the target and aircraft in sight; friendlies are clear of the run-in; ROE satisfied; the laser is on the target.',
        ask: 'Reply.',
        options: [
          { text: 'Hawg 11, Axeman 21, cleared hot.', correct: true, why: 'Clearance is explicit, includes both callsigns, and cannot be confused with an acknowledgement.' },
          { text: 'Hawg 11, roger.', why: '"Roger" only means received — the pilot may interpret silence as consent, or not release at all.' },
          { text: 'Hawg 11, continue dry.', why: 'You are ready to clear, so withholding the clearance serves no purpose.' },
          { text: 'Hawg 11, standby.', why: 'The aircraft is on the run — "standby" can cause a late call or a missed pass.' },
        ],
      },
      {
        heard: [['Hawg 11', 'Hawg 11, pickle.'], ['Hawg 11', 'Splash.']],
        ask: 'What does "splash" tell you?',
        options: [
          { text: 'Weapon impact in 5 seconds.', correct: true, why: '"Splash" is the 5-seconds-to-impact call: keep the laser on and eyes on the target.' },
          { text: 'The weapon has already hit.', why: 'Impact is about 5 seconds away.' },
          { text: 'The aircraft is out of ordnance.', why: 'That is "winchester."' },
          { text: 'The aircraft is off target.', why: 'That is "off."' },
        ],
      },
      {
        heard: [['Hawg 11', 'Hawg 11, in hot, second pass.']],
        context: 'You have already cleared this aircraft hot. A friendly vehicle suddenly drives into the target area.',
        ask: 'Reply.',
        options: [
          { text: 'Hawg 11, abort, abort, abort.', correct: true, why: 'Once clearance has been given, "abort" is the call that stops the attack. Repeating it ensures it is heard.' },
          { text: 'Hawg 11, standby.', why: '"Standby" does not cancel a clearance.' },
          { text: 'Hawg 11, continue dry.', why: '"Continue dry" is for withholding an uncleared run. For a revoked clearance, say "abort."' },
          { text: 'Hawg 11, negative.', why: '"Negative" is not an attack call and is ambiguous.' },
        ],
      },
      {
        heard: [['Hawg 11', 'Hawg 11, off north. Request BDA.']],
        ask: 'Which BDA is best?',
        options: [
          { text: 'Hawg 11, Axeman 21: good hits. BDA: two BMP-2 destroyed, six dismounts KIA, remainder fleeing east. No re-attack required.', correct: true, why: 'What was hit, the effect, the numbers, the enemy status and whether another attack is needed.' },
          { text: 'Hawg 11, nice job, they are all probably dead.', why: '"Probably" is an assessment without data. Report what you observed.' },
          { text: 'Hawg 11, BDA good.', why: 'Contains no information the aircrew or command can use.' },
          { text: 'Hawg 11, repeat attack.', why: '"Repeat" means "fire again" and no data supports that call.' },
        ],
      },
      {
        heard: [['Hawg 11', 'Axeman 21, Hawg 11, Bingo in five minutes.']],
        ask: 'Release the flight.',
        options: [
          { text: 'Hawg 11, Axeman 21, no further tasking. Good work. Out.', correct: true, why: 'Clear, final, and "out" means no reply is expected.' },
          { text: 'Hawg 11, roger, over and out.', why: '"Over" and "out" contradict each other.' },
          { text: 'Hawg 11, standby.', why: 'They are at bingo — do not leave them hanging.' },
          { text: 'Hawg 11, negative.', why: 'Meaningless here; give them an explicit release.' },
        ],
      },
    ],
  };
})();
