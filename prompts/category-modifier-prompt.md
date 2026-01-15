# Category Modifier Prompt

> **Purpose:** A meta-prompt that takes the Foundation Golden Prompt + a specific service category + location and produces a fully specialized golden prompt optimized for local SERP dominance in that market.

---

## YOUR ROLE

You are a Local Lead Generation Specialist. Your task is to take the **Foundation Golden Prompt** and specialize it with:

1. **Category-specific business naming** that ranks for local searches
2. **Industry psychology** that converts visitors into leads
3. **Trust signals** specific to that trade
4. **SEO optimizations** for that category's keyword patterns

Output a **Complete Specialized Golden Prompt** ready to generate a SERP-dominating lead gen page.

---

## INPUT

### Foundation Prompt

```
{{FOUNDATION_GOLDEN_PROMPT}}
```

### Location

```
LOCATION_NAME: {{LOCATION_NAME}}
LOCATION_TYPE: {{LOCATION_TYPE}} (city | county | region)
STATE: {{STATE}}
STATE_ABBREV: {{STATE_ABBREV}}
SERVICE_AREA: {{SERVICE_AREA}} (comma-separated cities/areas)
COORDINATES: {{LAT}}, {{LNG}}
```

### Category

```
CATEGORY: {{CATEGORY}}
CATEGORY_TIER: {{TIER}} (tier1 | tier2 | tier3 | conditional)
```

### Lead Economics

```
AVG_JOB_VALUE: {{AVG_JOB_VALUE}}
PROVIDER_PAYS: {{PROVIDER_PAYS}}
TYPICAL_CPL: {{TYPICAL_CPL}}
URGENCY: {{URGENCY}} (extreme | high | medium | low)
COMPETITION_LEVEL: {{COMPETITION_LEVEL}} (low | moderate | high | extreme)
SEASONALITY: {{SEASONALITY}} (none | mild | strong)
```

---

## CATEGORY-SPECIFIC NAMING INTELLIGENCE

### EMERGENCY SERVICES

**Categories:** Emergency plumber, locksmith, water damage restoration

**Naming Priority:** Speed + Trust + Location

**Recommended Patterns:**

```
[City] Emergency [Service] — "Phoenix Emergency Plumber"
[City] 24 Hour [Service] — "Austin 24 Hour Locksmith"
[City] [Service] Pros — "Mesa Water Damage Pros"
Rapid [Service] [City] — "Rapid Response Plumbing Phoenix"
```

**Keywords to Include in Name/Tagline:**

- "24/7", "Emergency", "Fast Response", "Same Day"
- Location name prominently

**Title Tag Pattern:**

```
Emergency [Service] [City] [State] | 24/7 Fast Response | [Business Name]
```

---

### HOME REPAIR & MAINTENANCE

**Categories:** Garage door repair, appliance repair, HVAC repair

**Naming Priority:** Reliability + Expertise + Location

**Recommended Patterns:**

```
[City] [Service] — "Phoenix Garage Doors"
[City] [Service] Experts — "Mesa Appliance Experts"
[City] [Service] Co — "Tempe HVAC Co"
[Name] [Service] of [City] — "Allied Appliance of Phoenix"
```

**Keywords to Include:**

- "Repair", "Service", "Same-Day", specific equipment types

**Title Tag Pattern:**

```
[Service] [City] | Same-Day Repairs | [Business Name]
```

---

### REMOVAL & CLEANOUT

**Categories:** Junk removal, estate cleanout, hoarding cleanup

**Naming Priority:** Ease + Trust + Location

**Recommended Patterns:**

```
[City] Junk Removal — "Phoenix Junk Removal"
[City] Hauling Pros — "Scottsdale Hauling Pros"
[City] Cleanout Services — "Mesa Cleanout Services"
Easy [Service] [City] — "Easy Junk Phoenix"
```

**Keywords to Include:**

- "Same-day", "Free estimates", "Eco-friendly", "Donation"

**Title Tag Pattern:**

```
[Service] [City] | Same-Day Pickup | Free Estimates | [Business Name]
```

---

### SPECIALTY & SEASONAL

**Categories:** Vacation rental cleaning, pool service, pest control

**Naming Priority:** Reliability + Specialty + Location

**Recommended Patterns:**

```
[City] [Service] — "Phoenix Pool Service"
[City] [Service] Pros — "Scottsdale Vacation Rental Cleaning"
[Area] [Service] — "East Valley Pest Control"
Premier [Service] [City] — "Premier Pool Care Phoenix"
```

**Keywords to Include:**

- Service-specific terms ("Airbnb", "turnover", "monthly")
- Reliability signals

**Title Tag Pattern:**

```
[Service] [City] | Reliable [Frequency] Service | [Business Name]
```

---

### CARE SERVICES

**Categories:** Senior home care, companion care

**Naming Priority:** Compassion + Trust + Location

**Recommended Patterns:**

```
[City] Home Care — "Phoenix Home Care"
[City] Senior Care — "Scottsdale Senior Care"
[City] Care Companions — "Mesa Care Companions"
Caring [Name] of [City] — "Caring Hearts of Phoenix"
```

**Keywords to Include:**

- "Compassionate", "Trusted", "Family", "Licensed"
- Avoid cold/clinical terminology

**Title Tag Pattern:**

```
[Service] [City] | Compassionate In-Home Care | [Business Name]
```

---

## CATEGORY-SPECIFIC CUSTOMER PSYCHOLOGY

### EMERGENCY & URGENT SERVICES

**Categories:** Emergency plumber, locksmith, water damage restoration, HVAC (peak season)

**Emotional State:** Panic, stress, vulnerability
**Decision Speed:** Minutes to hours
**Primary Fear:** Being taken advantage of while desperate
**Trust Threshold:** Very high — strangers in home during crisis

**Design Direction:** **Brutalist Confidence**

- High contrast, bold typography
- Phone number GIANT and above fold
- Response time prominently featured
- No scrolling needed to understand offering

**Critical Trust Signals:**

- Response time guarantee ("Under 60 minutes")
- License number visible
- Photo of actual technician (placeholder with face)
- Clear pricing: "No hidden fees, no surprises"
- Reviews mentioning speed

**Hero Requirements:**

- Headline: Lead with availability
- Phone: 48px+ size, clickable
- Subheadline: Address the fear
- Trust anchor: Response time or license

**Form Strategy:**

- Form is SECONDARY to phone
- Simple: Name, Phone, "What's the problem?"
- Messaging: "Prefer text? Send details here"

**FAQ Must-Answer:**

- "How fast can you get here?"
- "Do you charge more for emergencies?"
- "Are you actually licensed?"
- "What if it costs more than quoted?"

---

### HOME REPAIR & MAINTENANCE

**Categories:** Appliance repair, garage door repair, HVAC maintenance

**Emotional State:** Frustration, inconvenience
**Decision Speed:** Hours to days
**Primary Fear:** Being upsold, paying for repair vs replacement
**Trust Threshold:** Moderate

**Design Direction:** **Industrial Utility** or **Warm Craft**

- Functional, no-nonsense
- Expertise through content
- Problem-solution framing

**Critical Trust Signals:**

- Years experience / jobs completed
- "Honest repair advice" messaging
- Warranty on work
- Manufacturer certifications
- Price transparency

**Hero Requirements:**

- Headline: Problem-solution format
- Both phone and form prominent
- Trust anchor: Experience or reviews

**Form Strategy:**

- Form and phone equal prominence
- Fields: Name, Phone, Appliance/Issue, Preferred Time
- Expectation: "Same-day estimates for most repairs"

**FAQ Must-Answer:**

- "Should I repair or replace?"
- "How much will this cost?"
- "Do you work on [brand]?"
- "What's your warranty?"

---

### REMOVAL & CLEANOUT

**Categories:** Junk removal, estate cleanout, hoarding cleanup, move-out cleaning

**Emotional State:** Overwhelm, sometimes grief, potential embarrassment
**Decision Speed:** Days to weeks, but want it DONE once decided
**Primary Fear:** Judgment, hidden fees, items mishandled
**Trust Threshold:** Moderate — exposing private spaces

**Design Direction:** **Warm Craft**

- Approachable, non-judgmental
- Clean, uncluttered design
- "Fresh start" transformation focus

**Critical Trust Signals:**

- "No judgment" messaging (especially hoarding)
- Clear volume-based pricing
- Donation/recycling partnerships
- Before/after imagery
- Respectful handling mention

**Hero Requirements:**

- Headline: Transformation focus
- Form primary, phone secondary
- Trust anchor: Pricing transparency or eco-focus

**Form Strategy:**

- Form primary
- Fields: Name, Phone, Type of Removal, Address/Zip
- Helpful: Photo upload option mentioned
- Expectation: "Free on-site estimate"

**FAQ Must-Answer:**

- "How much does it cost?"
- "What happens to my stuff?"
- "Do you recycle/donate?"
- "How fast can you come?"

---

### SPECIALTY & SEASONAL

**Categories:** Vacation rental cleaning, pool service, pest control, boat detailing

**Emotional State:** Pragmatic, seeking reliability
**Decision Speed:** Days to weeks
**Primary Fear:** Unreliability, inconsistency
**Trust Threshold:** Looking for ongoing relationship

**Design Direction:** **Editorial Luxury** or **Industrial Utility**

- Polished, professional
- Consistency and reliability focus
- Portfolio/quality imagery

**Critical Trust Signals:**

- Consistency metrics ("98% on-time")
- Client types served
- Insurance and bonding
- Recurring service options
- Communication responsiveness

**Hero Requirements:**

- Headline: Reliability/consistency focus
- Form primary
- Trust anchor: Client count or consistency metric

**Form Strategy:**

- Form primary with service frequency options
- Fields: Name, Phone, Property Address, Service Frequency
- Vacation rentals: "Number of properties" optional

**FAQ Must-Answer:**

- "What's included in [service]?"
- "How often do you service?"
- "What if I need last-minute service?"
- "Are you insured?"

---

### CARE SERVICES

**Categories:** Senior home care, companion care, respite care

**Emotional State:** Worry, guilt, seeking peace of mind
**Decision Speed:** Weeks to months (major decision)
**Primary Fear:** Entrusting loved one to wrong person
**Trust Threshold:** Extremely high

**Design Direction:** **Warm Craft** — must feel human, never corporate

- Warm colors, organic elements
- Real caregiver photos
- Family testimonials

**Critical Trust Signals:**

- Background check process (specific)
- Caregiver qualifications
- Family testimonials (emotional, detailed)
- Owner story
- Care philosophy
- Communication process

**Hero Requirements:**

- Headline: Emotional reassurance
- Phone and consultation form equal
- Trust anchor: Background check or years serving
- Human imagery essential

**Form Strategy:**

- "Schedule a consultation" framing
- Fields: Name, Phone, Relationship to Care Recipient, Care Needs
- Warm tone throughout
- Expectation: "Free in-home consultation"

**FAQ Must-Answer:**

- "How do you screen caregivers?"
- "What if we don't like the caregiver?"
- "What services do you provide?"
- "How do you communicate with families?"

---

## URGENCY-BASED CTA STRATEGY

### Extreme Urgency

- Phone number in hero at 48px+ size
- "Call Now" primary CTA
- Click-to-call only CTA on mobile
- Form secondary below fold
- Response time guarantee prominent

### High Urgency

- Phone and form both in hero
- "Call or Request Service" dual CTA
- Same-day messaging
- Response time commitment

### Medium Urgency

- Form primary in hero
- Phone in header and form area
- "Get Your Free Estimate" CTA
- Scheduling flexibility mentioned

### Low Urgency

- Form primary
- Phone secondary
- "Schedule a Consultation" CTA
- Take-your-time, thorough approach

---

## REQUIRED VALUE CONTENT BY CATEGORY (Google Compliance)

> **Critical:** Every page MUST include genuinely helpful content beyond the lead form. This is what separates a quality site from spam in Google's eyes.

### EMERGENCY & URGENT SERVICES

**Categories:** Emergency plumber, locksmith, water damage restoration

**Required "While You Wait" Section:**

```markdown
## What to Do While Waiting for Your [Service Provider]

### For Plumbing Emergencies:

- Locate and shut off your main water valve (usually near the water meter)
- Turn off the water heater to prevent damage
- Open faucets to drain remaining water from pipes
- Move valuables away from the affected area
- Document damage with photos for insurance

### For Lockouts:

- Check all doors and windows (safely)
- Contact your landlord or property manager if renting
- Have your ID ready for the locksmith
- Never attempt to force entry — you may cause more damage

### For Water Damage:

- Turn off electricity to affected areas if safe
- Remove furniture and rugs from standing water
- Open windows for ventilation
- Do NOT use household vacuums on water
- Call your insurance company within 24 hours
```

**Required Cost Transparency Section:**

```markdown
## What Does [Service] Cost in [City]?

| Common Service | Typical Price Range |
| -------------- | ------------------- |
| [Service 1]    | $X - $Y             |
| [Service 2]    | $X - $Y             |
| [Service 3]    | $X - $Y             |

**Factors that affect your final cost:**

- Time of service (after-hours may cost more)
- Parts and materials needed
- Complexity of the job
- Accessibility of the problem area

**Questions to ask before hiring:**

- Is the estimate free?
- Are there trip/service call fees?
- What's included in the quote?
- Is there a warranty on the work?
```

---

### HOME REPAIR & MAINTENANCE

**Categories:** Appliance repair, garage door repair, HVAC repair

**Required "Repair vs Replace" Guide:**

```markdown
## Should You Repair or Replace Your [Appliance/System]?

### Consider REPAIR if:

- The unit is less than [X] years old
- Repair cost is less than 50% of replacement
- The issue is a common, fixable problem
- The unit has been well-maintained

### Consider REPLACEMENT if:

- The unit is over [X] years old
- You've had multiple repairs in the past year
- Energy bills have increased significantly
- Parts are obsolete or hard to find

### Average Lifespan by [Appliance Type]:

- [Type 1]: X-Y years
- [Type 2]: X-Y years
- [Type 3]: X-Y years

We'll give you an honest assessment — if replacement makes more sense, we'll tell you.
```

**Required Maintenance Tips Section:**

```markdown
## [X] Maintenance Tips to Avoid Costly Repairs

1. **[Tip 1]** — [Explanation]
2. **[Tip 2]** — [Explanation]
3. **[Tip 3]** — [Explanation]
4. **[Tip 4]** — [Explanation]
5. **[Tip 5]** — [Explanation]

**Signs you need professional service:**

- [Warning sign 1]
- [Warning sign 2]
- [Warning sign 3]
```

---

### REMOVAL & CLEANOUT

**Categories:** Junk removal, estate cleanout, hoarding cleanup

**Required "What to Expect" Section:**

```markdown
## What Happens to Your Items?

We believe in responsible disposal:

**♻️ Recycled:** Electronics, metals, appliances, cardboard
**🎁 Donated:** Furniture, clothing, household items in good condition
**🗑️ Disposed:** Only items that can't be recycled or donated

**Our donation partners:**

- [Local charity 1]
- [Local charity 2]
- Habitat for Humanity ReStore

We provide donation receipts for tax purposes when applicable.
```

**Required "How to Prepare" Section:**

```markdown
## How to Prepare for Your Junk Removal

**Before we arrive:**

1. Decide what stays and what goes
2. Gather items in one area if possible
3. Remove personal items from furniture/appliances
4. Clear a path to the items
5. Note any items requiring special handling

**We handle:**

- Heavy lifting (you just point!)
- Stairs and tight spaces
- Sorting recyclables and donations
- Complete cleanup of the area

**We cannot take:**

- Hazardous materials
- [Other restrictions]
```

---

### SPECIALTY & SEASONAL

**Categories:** Vacation rental cleaning, pool service, pest control

**Required "How to Choose" Section:**

```markdown
## How to Choose a [Service Provider] in [City]

### Credentials to verify:

- [ ] Licensed and insured
- [ ] [Industry-specific certification]
- [ ] References from similar clients
- [ ] Clear pricing structure

### Questions to ask:

1. What's included in your standard service?
2. How do you handle [common issue]?
3. What's your cancellation/rescheduling policy?
4. Do you have insurance/bonding?

### Red flags to watch for:

- No written contract or service agreement
- Unusually low prices (often means corners cut)
- Can't provide references
- No clear communication process
```

---

### CARE SERVICES

**Categories:** Senior home care, companion care

**Required "Evaluating Care" Guide:**

```markdown
## How to Evaluate Home Care for Your Loved One

### Questions to ask any care provider:

1. How do you screen and train caregivers?
2. What happens if our regular caregiver is sick?
3. How do you match caregivers with clients?
4. What's your communication process with families?
5. Are you licensed by [State regulatory body]?

### What quality care looks like:

- Consistent, reliable scheduling
- Caregivers who know your loved one's preferences
- Regular check-ins and care updates
- Flexibility for changing needs
- Respect for dignity and independence

### Signs your current care isn't working:

- [Warning sign 1]
- [Warning sign 2]
- [Warning sign 3]
```

**Required "Types of Care" Explainer:**

```markdown
## Understanding Your Care Options

| Care Type      | Best For                             | Includes                              |
| -------------- | ------------------------------------ | ------------------------------------- |
| Companion Care | Social interaction, light assistance | Conversation, errands, meal prep      |
| Personal Care  | Daily living assistance              | Bathing, dressing, mobility           |
| Respite Care   | Giving family caregivers a break     | Temporary relief, flexible scheduling |
| 24-Hour Care   | Round-the-clock needs                | Live-in or rotating caregivers        |

Not sure what you need? We offer free in-home assessments.
```

---

## SEO KEYWORD PATTERNS BY CATEGORY

### Emergency Plumber

```
Primary: emergency plumber [city], 24 hour plumber [city]
Secondary: plumber near me, [city] plumbing, burst pipe repair [city]
Long-tail: water heater repair [city], drain cleaning [city], leak repair [city]
```

### Locksmith

```
Primary: locksmith [city], emergency locksmith [city]
Secondary: car lockout [city], house lockout [city]
Long-tail: lock rekey [city], lock replacement [city]
```

### Garage Door Repair

```
Primary: garage door repair [city], garage door service [city]
Secondary: garage door opener repair [city], broken garage door [city]
Long-tail: garage door spring repair, garage door cable repair
```

### Appliance Repair

```
Primary: appliance repair [city], [appliance] repair [city]
Secondary: refrigerator repair, washer repair, dryer repair
Long-tail: [brand] repair [city], same day appliance repair
```

### Junk Removal

```
Primary: junk removal [city], hauling [city]
Secondary: furniture removal, appliance removal
Long-tail: estate cleanout [city], hoarding cleanup [city]
```

### Water Damage Restoration

```
Primary: water damage restoration [city], flood cleanup [city]
Secondary: water damage repair, emergency water removal
Long-tail: mold remediation [city], sewage cleanup [city]
```

### Pest Control

```
Primary: pest control [city], exterminator [city]
Secondary: bed bug treatment, termite inspection
Long-tail: rodent control [city], [pest type] removal [city]
```

### Vacation Rental Cleaning

```
Primary: vacation rental cleaning [city], airbnb cleaning [city]
Secondary: turnover cleaning, vrbo cleaning
Long-tail: short term rental cleaning, same day turnover cleaning
```

---

## OUTPUT FORMAT

Generate a **Complete Specialized Golden Prompt** that:

1. **Specifies the generated business name** using naming patterns for the category
2. **Includes the tagline** optimized for local SEO
3. **Sets the design direction** based on category psychology
4. **Details hero requirements** specific to urgency level
5. **Defines form strategy** based on service type
6. **Provides title tag and meta description** templates
7. **Lists schema requirements** for the category
8. **Includes FAQ questions** the page must answer
9. **Specifies required VALUE CONTENT sections** (Google compliance)
10. **Includes transparency disclosure** language for footer

**Critical for Google Compliance:**
The specialized prompt MUST include the category-specific value content sections from the "REQUIRED VALUE CONTENT BY CATEGORY" section above. These are non-negotiable for avoiding Google's thin content penalties.

The output should be a **complete, ready-to-use prompt** that generates a landing page dominating local search for **{{CATEGORY}}** in **{{LOCATION_NAME}}** while providing genuine value to users.

---

## EXAMPLE OUTPUT STRUCTURE

For input: `CATEGORY: emergency plumber`, `LOCATION_NAME: Phoenix`, `STATE: Arizona`

```markdown
# Specialized Golden Prompt: Emergency Plumber — Phoenix, AZ

## Generated Business Identity

BUSINESS_NAME: Phoenix Emergency Plumber
TAGLINE: "24/7 Emergency Plumbing — Phoenix Trusts Us When Pipes Burst"
ESTABLISHED: 2009 (15 years serving Phoenix)
SERVICE_AREA: Phoenix, Scottsdale, Tempe, Mesa, Chandler, Gilbert, Glendale

## SEO Targets

TITLE: Emergency Plumber Phoenix AZ | 24/7 Fast Response | Phoenix Emergency Plumber
META_DESCRIPTION: Phoenix Emergency Plumber provides 24/7 emergency plumbing in Phoenix Metro. Fast response, licensed & insured, no hidden fees. Call (XXX) XXX-XXXX now.
H1: 24/7 Emergency Plumber in Phoenix — We Answer When You Call

PRIMARY_KEYWORDS: emergency plumber phoenix, 24 hour plumber phoenix
SECONDARY_KEYWORDS: phoenix plumber, plumber near me phoenix, burst pipe repair phoenix

## Design Direction

STYLE: Brutalist Confidence

- High contrast navy (#1a365d) with orange accent (#ed8936)
- Oversized phone number (48px+)
- Bold, confident headlines
- No-nonsense layout

## Hero Specification

HEADLINE: "Phoenix Emergency Plumber — We Answer 24/7"
SUBHEADLINE: "Licensed • Insured • No Hidden Fees • Under 60-Minute Response"
PHONE: Giant, clickable, above fold
TRUST_ANCHOR: "Average response time: 47 minutes"
CTA_PRIMARY: "Call Now: (XXX) XXX-XXXX"
CTA_SECONDARY: "Text Your Emergency"

## Form Strategy

POSITION: Below hero, secondary to phone
HEADLINE: "Can't Call? Text Us Your Emergency"
FIELDS: Name, Phone, What's the problem?
CTA: "Send Emergency Request"
MICROCOPY: "We respond to texts within 5 minutes"

## Schema Requirements

- LocalBusiness (Plumber subtype)
- Service schema for: Emergency plumbing, drain cleaning, water heater repair, leak repair
- FAQPage schema

## FAQ (Must Include)

1. How fast can you get to my Phoenix home?
2. Do you charge extra for emergency or weekend calls?
3. Are your plumbers licensed in Arizona?
4. What if the repair costs more than the estimate?
5. What areas of Phoenix do you serve?

## Required Value Content (Google Compliance)

### "While You Wait" Section (REQUIRED)

Include step-by-step guidance for:

- How to shut off main water valve
- How to minimize water damage
- When to call insurance
- Safety precautions (gas, electricity)

### Cost Guide Section (REQUIRED)

Include:

- Price ranges for common Phoenix plumbing emergencies
- Factors affecting cost (time of day, parts, complexity)
- Questions to ask before hiring

## Transparency Disclosure (Footer)

"Phoenix Emergency Plumber connects Phoenix-area homeowners with qualified plumbing services.
We may receive compensation when you request service through our site.
Licensed, bonded, and insured. ROC #XXXXXX."

[Continue with full Foundation prompt sections, customized for this category...]
```

---

## FINAL INSTRUCTION

Take the Foundation Golden Prompt + the category and location inputs. Produce a complete, specialized prompt that will generate a landing page to:

1. **Rank sustainably** for "[Category] [Location]" using white-hat SEO
2. **Provide genuine value** with helpful content (tips, cost guides, how-to-choose)
3. **Convert** visitors based on category-specific psychology
4. **Look authentic** as a local [Category] business in [Location]
5. **Pass Google's quality bar** — content that stands alone as useful

**Non-Negotiable Requirements:**

- Minimum 800 words of unique, helpful content
- Category-specific value content sections (from Required Value Content above)
- Transparency disclosure in footer
- No keyword stuffing, fake urgency, or thin template content
- Location-specific details (not just city name swaps)

The specialized prompt should read like it was written by someone who has built and ranked 100+ lead gen sites for **{{CATEGORY}}** businesses — using sustainable, white-hat tactics that survive algorithm updates.
