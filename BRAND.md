# TODOPOP brand ledger

The rules for TODOPOP's look, feel and words, across the desktop app, phone app, website, Tubby and the promo video. Read this before changing anything visual; add every new visual decision to the Decisions log. Last checked against the code: 2026-11-08.

## Essence
Calm, playful, hand-made. A sheet of dotted paper with bubbles on it, drawn in one ink. Not: corporate, gamified, loud.

## Color
| token | value | role |
|---|---|---|
| --bg | #F7F7F5 | the paper; carries a 28px dot grid of --ink-faint |
| --paper | #FFFFFF | panels, pop-ups, bars |
| --ink | #1A419E (navy, default tint) | text, outlines, solid buttons, the mascot |
| --ink-soft | color-mix(ink 60%, bg) | secondary text, time, captions |
| --rule | color-mix(ink 22%, transparent) | hairlines, quiet button borders |
| --ink-faint | color-mix(ink 12%, transparent) | dot grid |
| --ink-wash | color-mix(ink 5%, transparent) | hover fills |
Tints: the person picks the ink; every derived token, the icons, the bubbles' rings and the mascot follow it. Bubble fills are the only other colors (a pastel per group).
Shadow: one ink rgba(16,24,48) at .35/.4/.45 (see drift).

## Typography
One family, Unbounded (variable on the website). Roles: Regular for the wordmark and anything you scan; Light for reading; Regular in small spaced capitals for captions and chips. Buttons 400.
Chinese: WDXL Lubrifont SC at size-adjust 133%, CJK glyphs widened to double spacing, lines and fields given extra height, pills and dotted circles grow to fit either language. Small Chinese type is bigger than the English equivalent.

## Shape
Radii: pill (999px) for buttons, chips, bars, toasts; circle for icon buttons, bubbles and the O's; ~18 to 28px for panels and cards.
Strokes: 1.4px ink for buttons; 1px --rule for quiet controls; 1.4px icon strokes on a 13px glyph; the mascot 4px outline, 2.6px detail lines.
Line styles: solid = a control; dashed --rule = a divider between sections; dotted = a hint or a container that something can leave (hint circles on the website, the mascot's display box).
Motifs: the filled O's of the wordmark (they are also buttons on the website); the dot grid; things leaning 15° (the mascot on the logo, the phone mockup, sticky notes).

## Layers
bubble field < toast (8) < focus bar and mascot (9); in focus mode the toast is raised to 10.
Lesson: a toast added later sat under the focus bar for several versions, hiding Undo. New overlays get checked against everything that can be on screen at once.

## Components
- `.btn`: pill, 1.4px ink outline. Hover fills ink. Pressed scale .96. Focus 2px ink outline, offset 3px. Disabled 40% opacity. Variants `.small`, `.solid` (hover darkens 15%).
- `.tool`: quiet pill or circle (`.arrow`) with a 1px --rule border, 8px spaced-caps label or a 13px icon. Hover --ink-wash with ink border. Pressed scale .92.
- `.close`: 30 to 34px circle, 1px --rule border, an X of two strokes.
- Segmented control `.seg`: buttons styled by the parent, 10.5px spaced caps, the selected one filled.
- Toast: ink pill, paper text, an outlined spaced-caps action (UNDO).

## Motion
Appear and press: a springy overshoot, cubic-bezier(.3,1.6,.5,1). Moves: cubic-bezier(.2,.9,.3,1). Fades .2 to .4s.
At rest the app draws as little as possible: full frame rate only while something moves, 15fps while bubbles drift, nothing when there is nothing to draw, 1fps when the computer is idle. The mascot animates only when something happens.

## Gestures
Pop: press and hold (with a growing ring and a recorded pop sound). Get into a bubble (focus mode): click. Drag: anywhere, bubbles push each other. Leave: Esc or the X. The focus bar snaps to the bottom or either side edge. The same gestures on the website's live demo.

## Voice
Sentence case, plain everyday words, short. Actions are verbs in the product's world ("Done, pop it!", "+ Step", "Get back in the bubble"). Captions in spaced capitals. No real people's names in examples ("Reply to emails", not "Reply to Melody"). Every string has a Chinese version written as everyday Chinese, not a literal translation.

## Characters
Tubby, a bubble bottle: drawn in the current ink with the UI's line logic (4px outline, 2.6px details, round caps). Leans 15° on the panel's logo; size scales with the screen (78 to 140px). Moods: watching, on task, cheering, sleepy, suspicious, nudging, each with a trigger. Its eyes move; the body never mirrors.

## Twins (when one changes, change the others)
- Default tint or icon outline → desktop icon, phone app icon, Android icon, website favicon and logo, phone screenshot on the website.
- Bubble look or behavior → the website's bubbles run the app's own engine.
- Any string → Chinese, on every surface.
- Mascot → app, website, the artifact demos, the promo video.

## Decisions log (from the project's history)
- Navy #1A419E is the default tint again (a red default was tried and reverted).
- App icon outline thickened from 22 to 35 units, on every surface.
- Chinese a third smaller with double spacing between characters.
- The website's bubbles must be the app's real bubbles, and its ripple the app's ripple.
- The first-run tour's button must be styled like the other buttons.
- No hover effects in the Privacy section.
- The mascot takes the TODOPOP color and can be switched off.
- Step aside (hide everything for screen sharing) uses the panel's quiet `.tool` and `.seg` styles: a tab hanging under the TODOPOP pill, shown while pointing at the panel, plus a row at the top of the third O's popup. The panel shortcut works like a drawer: once opens or tucks, twice steps aside, once more brings everything back.
- The focus-timer reset uses the bar's round icon button (`.tool.arrow`), like the steps button beside it. A first version had its own borderless style and stood out.

## Known drift (found by style_inventory.py, to collapse when touched)
- 26 font sizes (8 to 44px, 9 of them half-pixels) → a scale of about 7.
- 7 nudged copies of the overshoot curve (.3,1.2 to .3,1.8) → one --ease-pop, maybe one softer one.
- 4 shadow inks (16,24,48 / 16,24,60 / black / 18,28,64) → one.
- Uppercase captions in 19 size/tracking/weight combinations → one caption class with 2 sizes.
- The website's `.btn` lifts on hover while the app's fills with ink → pick one.
- Token names differ between the app (--ink-faint) and the site (--faint).
