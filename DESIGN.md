---
name: "PATH / FIELD"
description: "An adaptive fitness growth system with calm operating surfaces and honest field-report milestones."
colors:
  paper: "#f1e2b8"
  paper-low: "#e3cfa0"
  ink: "#1c2a23"
  forest: "#205a3e"
  lake: "#087b7d"
  sun: "#eca93d"
  clay: "#be6038"
  deep: "#142b27"
  deep-2: "#223e35"
  line: "rgba(28, 42, 35, .28)"
  light-line: "rgba(241, 226, 184, .29)"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', sans-serif"
    fontSize: "42px"
    fontWeight: 820
    lineHeight: 1
    letterSpacing: "0"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', sans-serif"
    fontSize: "35px"
    fontWeight: 820
    lineHeight: 1.08
    letterSpacing: "0"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "'Avenir Next Condensed', 'DIN Condensed', -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 760
    lineHeight: 1.2
    letterSpacing: "0.06em"
rounded:
  marker-round: "50%"
  surface: "0"
spacing:
  micro: "7px"
  compact: "11px"
  control: "14px"
  screen-top: "25px"
  screen-inset: "27px"
  stage: "24px"
  poster-gutter: "52px"
components:
  button-primary-paper:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.surface}"
    padding: "16px"
  button-primary-deep:
    backgroundColor: "{colors.sun}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.surface}"
    padding: "16px"
  button-variant:
    backgroundColor: "{colors.paper-low}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.surface}"
    padding: "14px 11px"
  chip-selected:
    backgroundColor: "{colors.sun}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.surface}"
    padding: "10px 11px"
---

# Design System: PATH / FIELD

## Overview

**Creative North Star: "The Honest Field Record"**

PATH / FIELD translates the user's chosen national-park route-poster world into a fitness product without turning the product into travel advertising. The visual language has the calm order and proportion of a focused Apple-like tool, but its warmth comes from paper, printed field marks, fir silhouettes, terrain and a restrained four-colour landscape rather than gloss, gradients or artificial game rewards.

It has two deliberately different modes. Daily fitness work is an **Operate** surface: quiet paper or deep-green work mode, stable controls, short reading paths and clear evidence labels. A completed Mission may become an **Experience** surface: a stage field report with an original silkscreen-like landscape, broadside typography and a shareable composition. The latter is earned by review evidence and must never be used as a decorative shell around a dashboard.

The intended feeling is grounded, legible and companionable. It gives a user a direction without pretending to know more than the record supports.

**Key Characteristics:**

- A warm paper field log for decisions, not a KPI dashboard.
- Deep green training mode for focus under gym lighting.
- Routes and landscape are wayfinding devices, not levels, streaks or conquest imagery.
- Facts, observations and open questions are visibly different before any recommendation appears.
- The poster is an honest phase dispatch: it can be beautiful and shareable without turning uncertainty into a claim.

## Colors

The palette behaves like a field print: warm paper carries reading, fir and lake orient action and terrain, sun marks attention sparingly, and deep green creates a focused training environment.

### Primary

- **Fir Action:** The primary action and stable progress colour. Use it for the single next action on paper surfaces, Mission stamps, route labels and the structural outline of evidence markers.

### Secondary

- **Lake Terrain:** The cool field colour. Use it behind small route maps, stage seals and the landscape half of a milestone broadside. It is environmental context, not an interactive accent.

### Tertiary

- **Sun Signal:** The controlled highlight. Use it for the current route point, selected state, observed-evidence dot and the primary action in deep training mode. It should make a meaningful state easy to find, never blanket a screen.
- **Clay Boundary:** The restrained caution edge. Use it for the top edge of a safety sheet and quiet risk-adjacent emphasis; pair it with explicit text and a non-colour cue.

### Neutral

- **Paper and Lower Paper:** Reading surfaces and secondary choices. They preserve warmth and a printed-material character without competing with training data.
- **Ink:** Primary text and the hover state of primary actions on paper. It gives the system authority without using pure black.
- **Deep and Deep Two:** Training and safety-support environments. The secondary deep tone separates controls from the background while retaining a quiet, low-glare field palette.
- **Field Lines:** Low-contrast separators and inset print frames. They organise reading; they must not multiply into dashboard chrome.

**The Evidence Has More Than One Channel Rule.** Colour may reinforce a content class, but evidence meaning must also be named in text and carried by its geometry: a ring for fact, a ring with a sun point for observation, and a diamond for an open question or user choice.

## Typography

**Display Font:** System sans stack for mobile display and operational headings.

**Body Font:** The same system sans stack for Chinese reading, ensuring direct, reliable text under time pressure.

**Label Font:** Condensed system-adjacent stack for uppercase field labels, navigation traces and poster metadata.

**Character:** Operational typography is compact and direct. The stage-report surface gets scale through a condensed, heavy label face and composition, not through decorative type or imported pseudo-historical lettering.

### Hierarchy

- **Display:** Used for the live exercise name in deep training mode. It must remain short, high contrast and immediately scannable.
- **Headline:** Used for screen-level decisions such as today's route, review and commitment. It leads with a concrete present-tense decision, not a motivational slogan.
- **Title:** Used for Mission names, selected plan names and stage-report subheads. It should fit in one or two deliberate lines.
- **Body:** Used for rationale, evidence statements and boundaries. Keep it calm, direct and readable; it should never imitate a coach's certainty when data is incomplete.
- **Label:** Used for `PATH / ...`, facts, observations, field metadata and numerical headers. The uppercase / condensed treatment is a locator, not a paragraph style.
- **Numeric:** Training values use tabular figures where supported so weight, reps and duration do not jitter when they change.

**The Field Label Rule.** Condensed uppercase type is reserved for wayfinding and metadata. Chinese explanatory copy stays in the system reading face; do not make every sentence look like a poster caption.

## Layout

Daily operate screens are a mobile-first field log: a fixed-width prototype canvas, a quiet top line, a single current Mission or action, then a fixed bottom decision area. Screen content uses the observed inner inset; the bottom navigation has reserved space so it cannot cover the action. Short stacked rows and thin dividers are preferred to floating cards.

The “Today” route field may bleed horizontally beyond the text inset as a compact terrain window. It is an orientation device with one label and one route, not a hero image. Training uses the deep surface, with the exercise, target, previous comparable performance, numeric controls and discomfort escape hatch in stable positions. At narrow widths, the canvas becomes full viewport height and retains its fixed action zone.

The milestone field report is intentionally different. On wide screens it uses a textual left column and an original landscape right column, then a three-part evidence rail below. Under the existing responsive breakpoint it collapses to a vertical reading sequence: report heading, landscape, evidence, route note. Its reading order remains `what happened -> what can be observed -> what remains open -> what the user chooses next`.

**The Two-Lane Rule.** Do not import broadside poster composition into a daily logging task. Do not flatten a milestone report into a card with a decorative thumbnail. Each mode gets its own layout because the user is doing different work.

## Elevation & Depth

The system is flat by default. Daily depth comes from paper-versus-deep surface contrast, one-pixel field lines and the inset print frame, not rounded cards or layered shadows. The desktop prototype shell and the safety sheet use the existing diffuse shadow vocabulary only to establish physical separation from the surrounding dark stage; controls themselves stay flush.

The stage report feels tactile through warm paper, hard print rules, large colour fields and the canvas landscape. This is material depth, not glass, blur, neon glow or 3D extrusion. Motion, when implemented, should be short and quiet: a state confirmation or route point can settle into place, while risk communication must be immediate and un-dramatic.

**The Flat Work Surface Rule.** A training control earns elevation only when it is modal or must be separated from the active task. No stacked floating cards, glass panels or decorative shadows in the training flow.

## Shapes

Surfaces, buttons, chips and navigation are square-edged. The system does not use generic pill controls or softened cards; the rigid edge belongs to map legends and printed wayfinding. Thin borders, split grids and inset frames create structure.

Three small geometric markers form a reusable evidence grammar: a circle for a direct fact, a circle with a small sun point for a limited observation, and a rotated square for an open question or explicit decision. The fir-tree mark is a simple clipped silhouette used only as a compact path identifier. The stage poster may use the same geometry in a larger, print-like form but should not introduce badges, trophies or achievement medallions.

## Components

### Buttons

- **Character:** Clear commands printed onto the surface, not raised app-store controls.
- **Primary on paper:** Fir background with paper text. It takes the full available action width and sits last in the reading path.
- **Primary in deep training mode:** Sun background with ink text, preserving immediate visibility in gym lighting.
- **Variant actions:** Lower-paper split controls for short, recovery and rationale paths. They must be visible alternatives, never links hidden behind an overflow menu.
- **Hover / focus:** Primary actions become ink or a lighter sun state; keyboard focus receives a visible sun outline. Do not rely on colour shifts alone.

### Chips

- **Character:** Square segmented time or readiness choices.
- **Default:** Deep-two background and pale line on deep screens.
- **Selected:** Sun fill with ink text and increased weight. Use `aria-pressed` to expose the selected state in the prototype and preserve an equivalent semantic state in production.

### Evidence Rows and Decision Options

- **Evidence row:** A field marker, a compact category label and a plain-language statement divided by a single field line. Always retain the order fact, observation, then still-open question.
- **Decision option:** A full-width, border-separated choice with a radio-like marker. The selected marker receives a sun point; the label and consequence remain visible even when not selected.
- **Content constraint:** The system recommendation is visually distinct from a fact and never consumes the open-question row.

### Training Measurements

- **Character:** Stable instrument rows, not an animated score panel.
- **Structure:** Label, decrement control, tabular value and increment control stay in fixed grid columns. The current set uses the sun state; completed sets use fir; future sets remain outlined.
- **Safety:** “Replace action” and “mark discomfort” remain adjacent to the completion command. Never hide the latter behind a secondary sheet or celebratory completion state.

### Navigation and Sheets

- **Navigation:** Four equal bottom destinations with a paper surface in normal mode and deep surface in training mode. The active label switches to fir or sun; it is not an achievement counter.
- **Safety sheet:** A paper bottom sheet with a clay top rule, direct language and one acknowledgement action. It pauses the high-intensity recommendation and explains the product boundary without diagnosing the user.

### Stage Field Report

- **Character:** An original national-park broadside composed from a report heading, landscape canvas, evidence rail and next-route note.
- **Eligibility:** Use only after a session or Mission review has evidence sufficient for the stated scope. A single session can create a training receipt; it cannot create a transformation story.
- **Share rule:** The shareable artifact may contain verified facts and explicitly labeled limited observations. It must retain a statement of what remains unconfirmed and omit comparison pressure, body transformation claims, conquest language and invented certainty.

## Do's and Don'ts

### Do:

- **Do** give the next safe, understandable action more prominence than charts, totals or historical data.
- **Do** retain the fact -> observation -> still-open question -> user decision order in every review, plan explanation and stage report.
- **Do** use the route field, tree mark and terrain art as orientation and atmosphere, with a clear text label beside them.
- **Do** keep daily controls large, stable and high contrast in deep training mode; use real text, marker shape and state together.
- **Do** make short, recovery, modify and pause paths first-class choices, with no visual penalty for selecting them.
- **Do** let the field-report composition carry a real record of a completed stage, then invite the user to share only what the evidence can honestly support.

### Don't:

- **Don't** use the stage poster as a default home-screen hero, a generic background, or a way to make weak evidence look significant.
- **Don't** turn bodies, body weight, completion counts or a single training set into a score, badge, rank, level or visual verdict.
- **Don't** replace the printed field world with black-gold gym tropes, neon cyber surfaces, glassmorphism, flames, lightning or metallic hardware decoration.
- **Don't** mimic game characters, scenes, typography, logos or identifiable assets from the user's references; the landscape and symbols must remain original.
- **Don't** use risk colour, celebratory animation or motivational copy to pressure a user through pain, fatigue or an interrupted routine.
- **Don't** make a recommendation look like a fact or hide the user's ability to decline, edit or defer it.
