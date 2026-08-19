# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

Delegated. The first functional product is mobile-led, with an iOS-first training experience and a supporting web surface for planning and review. The implementation stack is intentionally open until the framework prototype validates the workflows.

## Users

People who want to improve their fitness over time and may enter at different states: beginning, returning after interruption, building a routine, following a plan, or self-directed progression. They need help translating their real state, constraints, training evidence, and changing goals into a safe next action.

The product must not assume every user is a disciplined lifter. It must also not flatten more experienced users into beginners once they need deeper planning, evidence, and adjustment support.

## Product Purpose

Help people understand their current training state, take a safe and achievable next step, see meaningful progress, and return after life interrupts training. Success is a user who can explain their current stage, understands why a plan changes, and retains agency over what to do next.

## Positioning

An adaptive fitness growth system that turns fragmented training, body, and life signals into explainable stage decisions. It treats plans as revisable hypotheses, not commands; progress as accumulated evidence, not a single weight, calorie, or streak metric.

## Operating Context

The mobile product is used immediately before, during, and after a workout, often in a gym and under time pressure. The web product is used for deliberate planning, reviewing evidence, and changing a training stage. Users may connect wearables, record sets and perceived effort, and optionally capture body observations, but data collection must not become the product's main burden.

## Capabilities and Constraints

- State selection, safety screening, stage Mission, adaptive program, session logging, evidence review, and interruption/re-entry are core concepts.
- The system distinguishes facts, inferences, recommendations, and user decisions.
- Plans provide full, short, and recovery alternatives when appropriate.
- User-selected goals, data permissions, and final plan decisions remain under user control.
- The product does not diagnose injury, illness, technique quality, or the cause of body-weight changes.
- High-risk or persistent pain signals must suppress high-intensity recommendations and direct users to suitable professional support.
- Nutrition, movement vision, coach collaboration, social features, and generative AI are modular extensions, not v1 dependencies.

## Brand Commitments

The product should feel simple and spacious in the way the user admires in Apple products, while carrying original warmth, material depth, and an exploratory sense of progression. The user referenced the craft and atmosphere of Black Myth: Wukong and The Legend of Zelda as inspiration, not as assets or styles to copy.

## Evidence on Hand

- [PRODUCT_FRAMEWORK_V0_1.md](PRODUCT_FRAMEWORK_V0_1.md): confirmed product architecture, user state model, core loop, and safety boundaries.
- [MARKET_AND_USER_RESEARCH_V0_1.md](MARKET_AND_USER_RESEARCH_V0_1.md): dated market scan and public-feedback synthesis; separates evidence from product inference.
- [05-decisions/ADR-001-launch-wedge-and-mvp-scope.md](05-decisions/ADR-001-launch-wedge-and-mvp-scope.md): proposed first-launch audience, P0 boundary, validation gates, and deferred scope.
- [04-task-playbooks/USER_TEST_EXECUTION_PACK_V0_1.md](04-task-playbooks/USER_TEST_EXECUTION_PACK_V0_1.md): ready-to-run recruitment, session, recording, privacy, and synthesis materials for the v1 prototype test.
- [EXPERIENCE_VISUAL_DIRECTION_V0_1.md](EXPERIENCE_VISUAL_DIRECTION_V0_1.md): discarded first-pass visual direction; retain only as anti-reference where it conflicts with the current redesign request.
- [visual-direction-v0-1.html](visual-direction-v0-1.html): incumbent concept board. It is intentionally being replaced because it reads as generic rather than materially distinctive.
- Real user journey evidence and a sample lower-body training record were discussed in this thread. No verified customer testimonials, clinical claims, performance benchmarks, or production training content exist yet.

## Product Principles

1. Give a safe, understandable next action before showing a dashboard.
2. Make evidence and uncertainty visible; never fake certainty.
3. Reward understanding, capability, and re-entry rather than obedience or comparison.
4. Design for changing lives, interrupted routines, and user agency.
5. Let visual expression deepen the training ritual without obscuring operational clarity.

## Accessibility & Inclusion

The product must work under gym lighting, reduced attention, and varied physical capabilities. All state meaning requires text and non-color cues; training interactions must remain readable, stable, and reachable on a phone. Body and health information is sensitive, optional where possible, and never used for shame-based feedback.
