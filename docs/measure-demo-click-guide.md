# Brief for Codex — make a "where to click" guide image for the takeoff demo

**Goal:** produce ONE annotated image that shows a first-time user exactly where to click in the
takeoff prototype (`/measure-demo`). The user has never read a construction plan before, so the image
must be obvious and friendly.

## Source image to annotate
- **File:** `public/measure-demo/duplex-a21.jpg`
- **Size:** `6120 × 3960` px (coordinates below are in these pixels; origin = top-left)
- **What it is:** architectural sheet **A2.1**, a small duplex. It has **two floor plans stacked**:
  the **TOP** drawing is the **2nd floor (upstairs)**, the **BOTTOM** drawing is the **1st floor
  (downstairs)**. Drawn at scale **1/4" = 1'-0"**. Rooms are labeled boxes; the small numbers along
  the edges (e.g. `23'-0"`) are wall lengths (feet'-inches").

## What to draw (two annotations)

### ① CALIBRATION — use CYAN
- **Target:** the `23'-0"` **overall** dimension on the **far-left edge of the TOP (2nd-floor)** plan.
  - The number text sits near **(859, 1080)**.
  - It's a **vertical line**; its two endpoints (tick marks) are about **(859, 700)** top and
    **(859, 1490)** bottom — please nudge the markers onto the actual tick marks by eye.
- **Draw:** a cyan ring around the `23'-0"` number + a cyan dot on each of the two line ends, with a
  short arrow to each.
- **Caption:** **"① SET SCALE — click these two ends, then type 23"**

### ② TRACE A ROOM — use AMBER/ORANGE
- **Target:** **BEDROOM 02** on the **TOP (2nd-floor)** plan. Its label text is near **(1148, 662)**.
  (It's a clean rectangular room in the upper-left.)
- **Draw:** an amber outline tracing that room's 4 walls, with **numbered dots 1→2→3→4** at the four
  corners (place them on the actual wall corners by eye).
- **Caption:** **"② MEASURE — click each corner (1,2,3,4), then click dot 1 again to close"**

### Title / legend
- Top of image: **"Takeoff demo — where to click"**
- Small legend: **cyan = set the scale · amber = measure a room**

## Coordinate reference (pixel positions already extracted from the plan)
Use these to locate features; refine placement visually.

| Feature | ~pixel (x,y) | Notes |
|---|---|---|
| `23'-0"` overall dim (2nd-floor, left) | 859, 1080 | **calibration target**; line ends ≈ (859,700)–(859,1490) |
| `23'-8"` dim (2nd-floor, top edge) | 1506, 304 | alternate calibration dimension |
| `86'-0 1/4"` overall length (1st-floor) | 2888, 2039 | longest dim, most accurate calibration |
| BEDROOM 02 (2nd floor) | 1148, 662 | **room-to-trace target** |
| BEDROOM 03 (2nd floor) | 1130, 1354 | alternate room |
| MASTER BEDROOM (2nd floor) | 2153, 853 | alternate room |
| KITCHEN (1st floor) | 4174, 2590 | — |
| LIVING / DINING ROOM (1st floor) | 4425, 2543 | — |

## The walkthrough this image supports (for caption/context)

The tool has two steps:

**Step 1 — Set the scale (once).** The computer only sees pixels and doesn't know the building's real
size. You teach it: click the two ends of a wall whose length is printed on the plan (e.g. the
`23'-0"` line), then type `23`. Now it knows how many real feet each pixel is.

**Step 2 — Measure a room.** Click around a room's corners; click the first dot again to close it; the
big number on the right is that room's square footage (floor area). That's a "takeoff."

**Step 3 — Check it.** Read the room's two printed wall numbers, multiply them, and confirm the app's
square footage is close.
