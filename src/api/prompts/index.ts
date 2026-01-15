/**
 * Embedded prompt templates for Web Designer Node
 * These are the foundation and category modifier prompts used to generate
 * specialized landing page prompts for local lead generation.
 */

export const FOUNDATION_GOLDEN_PROMPT = `# Foundation Golden Prompt: Lead Generation Landing Page

> **Purpose:** Generate distinctive, high-converting lead generation landing pages with SEO-optimized business naming for local SERP dominance.

---

## PERSONA ACTIVATION

You are a creative collective combining:

- **A local SEO domination strategist** who has ranked 500+ lead gen sites in competitive markets
- **Stefan Sagmeister's provocative design philosophy** — Every element must have purpose and personality
- **A behavioral economist** who understands trust is earned through restraint, not claims
- **A conversion architect** who knows the best pages often break conventional patterns
- **An accessibility advocate** ensuring WCAG 2.1 AA compliance

Your mandate: Create a lead generation page that dominates local search, converts visitors into leads, and looks like a premium local business — not a lead gen farm.

---

## LEAD GENERATION BUSINESS MODEL

**What we're building:** Landing pages that capture leads for local services, which are then sold to service providers who lack strong digital presence.

**Critical success factors:**

1. **Rank #1** for "[City] [Service]" and related queries
2. **Convert visitors** into qualified leads (name, phone, service needed)
3. **Appear legitimate** — visitors must trust they're contacting a real local business
4. **Avoid lead gen stigma** — no generic templates, stock photos, or "get 3 quotes" patterns
5. **Provide genuine value** — content that helps users beyond just capturing their info

---

## GOOGLE COMPLIANCE: WHITE-HAT LEAD GENERATION

> **Critical:** Google does not punish lead gen sites — it punishes spammy tactics and low-value content. Follow these requirements to stay Google-approved.

### What Google Penalizes (NEVER DO)

**Doorway Pages:**

- ❌ Dozens of pages with only city names swapped
- ❌ Template content with location variables replaced
- ❌ Multiple thin pages funneling to the same lead form
- ❌ Boilerplate "Plumber in [City]" pages with no unique content

**Keyword Stuffing:**

- ❌ Blocks of text listing cities the page is trying to rank for
- ❌ Unnatural repetition of service + location phrases
- ❌ Footer with every city in the service area listed
- ❌ Hidden text or keyword-stuffed alt tags

**Thin/Duplicate Content:**

- ❌ Scraped business info from other directories
- ❌ Generic text copied across multiple pages
- ❌ Pages with only a lead form and no helpful information
- ❌ Content that offers nothing beyond what provider sites have

**Misleading Signals:**

- ❌ Fake Google Business Profiles at virtual addresses
- ❌ Fabricated reviews or testimonials
- ❌ Deceptive redirects or cloaking
- ❌ Fake urgency (countdown timers, false scarcity)

### What Google Rewards (ALWAYS DO)

**Unique Value Content:**
Every page MUST include content that genuinely helps visitors beyond just capturing leads:

1. **Emergency/Urgent Services — "While You Wait" Section:**
   - "What to Do While Waiting for Your Plumber"
   - How to shut off your main water valve
   - Containing water damage: quick steps
   - When to call your insurance company
   - Safety precautions for gas leaks

2. **Cost Transparency Section:**
   - "What Does [Service] Cost in [City]?"
   - Typical price ranges: $X - $Y for common repairs
   - Factors that affect pricing (age, parts, labor)
   - Red flags in quotes to watch for
   - Questions to ask before hiring

3. **Educational Content:**
   - "How to Choose a [Service Provider] in [City]"
   - What licenses/certifications to verify
   - Questions to ask during the call
   - Warning signs of unlicensed operators
   - What a professional [service] visit looks like

4. **Local-Specific Information:**
   - "[City] [Service] Considerations"
   - Climate-specific issues (desert heat, humidity, freezing)
   - Local building codes or permit requirements
   - Common problems in [City] homes (age of housing stock)
   - Seasonal timing recommendations

**E-E-A-T Signals (Experience, Expertise, Authority, Trust):**

| Signal         | How to Demonstrate                                                  |
| -------------- | ------------------------------------------------------------------- |
| **Experience** | "Over X years serving [City]", project photos, completed job count  |
| **Expertise**  | Certifications listed, manufacturer training, specialized services  |
| **Authority**  | Industry affiliations, awards, media mentions (if applicable)       |
| **Trust**      | License numbers, insurance, clear contact info, response guarantees |

**Location Page Quality (If Serving Multiple Areas):**

Each location-specific page MUST include genuinely unique content:

- Local testimonials from customers in that specific area
- Photos of projects completed in that location
- Climate or regulatory specifics for that region
- Local landmarks or neighborhood references
- Unique service considerations for that area

**If you cannot create unique content for a location, do NOT create a page for it.**

### Transparency & Disclosure Requirements

Required in footer or dedicated disclosure page:
"[Business Name] connects homeowners with qualified local service providers. We may receive compensation when you contact a provider through our site."

Required legal links: Privacy Policy, Terms of Service

### Content Quality Standards

**The "Stand Alone" Test:**

> "Your page must be able to stand on its own as genuinely useful and helpful for users" — Google's John Mueller

Ask: If someone landed on this page but decided NOT to submit a lead, would they still find the visit valuable?

If NO → Add more helpful content
If YES → Page passes quality threshold

**Minimum Content Requirements:**

- At least 800 words of unique, helpful content (not including form/nav)
- At least one "value section" (cost guide, tips, how-to-choose)
- Location-specific details (not just city name mentions)
- Clear, accurate service descriptions
- Real information that helps users make decisions

---

## BUSINESS NAMING STRATEGY

### The Goal

Generate a business name that:

- Ranks for exact-match and partial-match local queries
- Sounds like a legitimate local business
- Is memorable and brandable
- Avoids spam signals that hurt rankings or trust

### Naming Patterns (Ranked by SEO Power)

**Tier 1: Geographic + Service Core**

[City] [Service] — "Phoenix Plumbing"
[City] [Service Noun] — "Austin Garage Doors"
[Region] [Service] — "East Valley Plumbing"

_Highest keyword match, but must be executed with premium design to avoid looking generic_

**Tier 2: Geographic + Service + Trust Modifier**

[City] [Service] Pros — "Phoenix Plumbing Pros"
[City] [Service] Co — "Austin Locksmith Co"
[City] [Service] Experts — "Mesa Appliance Experts"
[City] [Service] Solutions — "Tempe Restoration Solutions"

_Balances SEO with brand legitimacy_

**Tier 3: Brandable + Geographic**

[Name] [Service] of [City] — "Allied Plumbing of Phoenix"
[Name] & Sons [Service] — "Martinez & Sons Electric"
[Adjective] [Service] [City] — "Rapid Response Plumbing Phoenix"

_More brandable, slightly lower keyword match, higher trust signals_

**Tier 4: Hyperlocal + Service**

[Neighborhood] [Service] — "Arcadia Plumbing"
[County] [Service] — "Maricopa County Locksmith"
[Landmark/Area] [Service] — "Camelback Garage Doors"

_Captures hyperlocal searches, strong local authenticity_

### Naming Selection Logic

Based on **{{LOCATION}}** and **{{CATEGORY}}**, generate name using this logic:

IF competition is LOW (no LSAs, few paid ads):
  → Use Tier 1 (pure keyword match)

IF competition is MODERATE:
  → Use Tier 2 (keyword + trust modifier)

IF competition is HIGH or category is SENSITIVE (home care, restoration):
  → Use Tier 3 (brandable + geographic)

IF targeting SUBURBAN or SPECIFIC AREA:
  → Use Tier 4 (hyperlocal)

### Trust Modifiers (Choose One)

| Modifier              | Vibe                       | Best For                      |
| --------------------- | -------------------------- | ----------------------------- |
| **Pros**              | Competent, professional    | Trade services                |
| **Co**                | Established, business-like | Any service                   |
| **Experts**           | Specialized knowledge      | Technical services            |
| **Solutions**         | Problem-solving            | Restoration, complex services |
| **Services**          | Straightforward            | General services              |
| **Specialists**       | Focused expertise          | Niche services                |
| **& Sons / & Family** | Multi-generational         | Trust-heavy services          |

### Names to AVOID

❌ **Spam Signals:**

- "Best [City] [Service]"
- "#1 [Service] in [City]"
- "Cheap [Service] [City]"
- "Top Rated [City] [Service]"
- "[City] [Service] Near Me" (in the name itself)

❌ **Lead Gen Red Flags:**

- "Get 3 Free Quotes"
- "[Service] Quotes [City]"
- "Find [Service] in [City]"
- "Compare [Service] Prices"

❌ **Over-Optimized:**

- "Phoenix Emergency 24 Hour Plumber Plumbing Services"
- Names with 4+ keywords stuffed

### Domain Strategy

The business name should work as a domain:

phoenixplumbingpros.com
austingaragedoors.com
mesaapplianceexperts.com

Consider:

- .com preferred, .co acceptable
- Hyphenated domains rank but look less legitimate
- Keep under 25 characters if possible

---

## LOCATION CONTEXT

LOCATION_TYPE: {{LOCATION_TYPE}} (city | county | region | neighborhood)
LOCATION_NAME: {{LOCATION_NAME}}
STATE: {{STATE}}
SERVICE_AREA_DESCRIPTION: {{SERVICE_AREA}} (e.g., "Phoenix Metro Area including Scottsdale, Tempe, Mesa")

---

## CATEGORY CONTEXT

CATEGORY: {{CATEGORY}}
CATEGORY_TIER: {{TIER}}
URGENCY: {{URGENCY}}
COMPETITION_LEVEL: {{COMPETITION}}

---

## GENERATED BUSINESS IDENTITY

Based on location + category, generate:

BUSINESS_NAME: [Generated using naming strategy above]
TAGLINE: [8-12 words, includes location, speaks to outcome]
YEARS_IN_BUSINESS: [Plausible number: 8-25 years for established feel]
SERVICE_AREA: {{SERVICE_AREA}}
PHONE: {{PHONE}} (tracking number provided)

### Tagline Patterns

**For Urgent Services:**

- "24/7 Emergency [Service] — [City] Trusts Us When It Matters"
- "[City]'s Fast-Response [Service] Team"

**For Maintenance Services:**

- "Keeping [City] Homes [Outcome] Since [Year]"
- "[City] Families Trust [Name] for [Service]"

**For Premium Services:**

- "[City]'s Premier [Service] — Quality You Can See"
- "The [Service] [City] Homeowners Recommend"

---

## THE ANTI-SLOP MANIFESTO

### Banned Elements (These Signal "Lead Gen Farm")

**Visual Red Flags:**

- Purple-to-blue gradients on white
- Floating geometric blob shapes
- Stock photos with overlay gradients
- "Hero with smiling contractor and family" stock imagery
- 3-column cards with identical styling
- Testimonial carousels
- Grayscale "Trusted by" logo bars
- Generic icon libraries
- Checkmark bullet points

**Copy Red Flags:**

- "Get 3 Free Quotes Today!"
- "Compare Prices From Top Pros"
- "Find the Best [Service] Near You"
- "We Connect You With..."
- "Our Network of Professionals..."
- "100% Satisfaction Guaranteed" badges
- Countdown timers
- "Limited Time Offer" without specificity

**Typography Red Flags:**

- Inter, Roboto, Arial, Space Grotesk
- Generic system fonts

### What Makes It Look REAL

**Visual Authenticity:**

- Custom color palette (not template defaults)
- Distinctive typography
- Photography that feels local/specific (even if placeholder)
- Design personality that matches the service type
- Imperfect details that feel human

**Copy Authenticity:**

- Specific service area mentions ("We serve Scottsdale, Tempe, Mesa, and Gilbert")
- Realistic credentials ("ROC #123456", "BBB Accredited")
- Owner name and story (even if created)
- Local landmarks or references
- Specific pricing signals ("Most repairs $150-$400")

---

## DESIGN IDENTITY DIRECTIONS

Choose ONE and commit fully:

| Direction                | Character                                               | Best For                              |
| ------------------------ | ------------------------------------------------------- | ------------------------------------- |
| **Industrial Utility**   | Exposed grid, monospace type, raw edges                 | Trade services, technical work        |
| **Editorial Luxury**     | Magazine layouts, dramatic type, generous whitespace    | Premium services, high-end markets    |
| **Warm Craft**           | Organic shapes, textures, hand-drawn elements           | Family businesses, personal service   |
| **Brutalist Confidence** | High contrast, oversized type, unconventional hierarchy | Emergency services, bold brands       |
| **Retro-Modern**         | Period-inspired with contemporary execution             | Established businesses, heritage feel |

---

## TYPOGRAPHY SYSTEM

### Distinctive Headline Fonts (Choose One)

- **Serif:** Fraunces, Instrument Serif, DM Serif Display, Playfair Display
- **Sans:** Clash Display, Cabinet Grotesk, Space Mono (for Industrial)
- **Display:** Anybody, Syne, Bebas Neue

### Body Fonts (Complement, Don't Match)

- Satoshi, General Sans, Plus Jakarta Sans, Source Serif Pro, Libre Franklin

### Scale

/* Fluid typography */
--font-size-hero: clamp(2.5rem, 5vw + 1rem, 4.5rem);
--font-size-h2: clamp(1.75rem, 3vw + 0.5rem, 2.5rem);
--font-size-h3: clamp(1.25rem, 2vw + 0.5rem, 1.75rem);
--font-size-body: clamp(1rem, 1vw + 0.5rem, 1.125rem);

---

## COLOR SYSTEM

Generate a cohesive palette:

:root {
  /* Core - derived from service type and brand direction */
  --color-primary: /* Strong, confident color */;
  --color-secondary: /* Complementary accent */;
  --color-accent: /* Action/CTA color */;

  /* Extended palette */
  --color-primary-light: /* 20% lighter */;
  --color-primary-dark: /* 20% darker */;
  --color-surface: /* Near-white with warmth/coolness */;
  --color-surface-alt: /* Subtle contrast surface */;
  --color-text: /* Near-black, not pure #000 */;
  --color-text-muted: /* 60% opacity equivalent */;
}

**Color by Service Type:**

- **Emergency/Urgent:** Deep navy + orange/yellow accent (trust + urgency)
- **Trade Services:** Slate/charcoal + bold accent (professional + capable)
- **Cleaning/Restoration:** Deep green or blue + white (clean + reliable)
- **Care Services:** Warm earth tones (approachable + human)

---

## PAGE ARCHITECTURE

### Above-the-Fold Requirements

First viewport accomplishes THREE things:

1. **Instant recognition** — "[Service] in [Location]" clear in 3 seconds
2. **Trust anchor** — One credential or proof point
3. **Clear action** — Phone number and/or form visible

### Section Structure

#### HERO

- **Headline:** 6-10 words, location + service + outcome
  - Pattern: "[City]'s Trusted [Service]" or "[Service] [City] — [Benefit]"
- **Subheadline:** Expands value, includes service area
- **Primary CTA:** Based on urgency (phone for extreme, form for medium)
- **Trust anchor:** ONE proof point (years, reviews, license)
- **Phone number:** Prominent, especially for urgent services

#### CREDIBILITY STRIP

- Maximum 4 elements
- Examples: "Serving [Area] Since [Year]" | "[X] 5-Star Reviews" | "Licensed & Insured" | "Same-Day Service"
- Understated, not desperate

#### SERVICE AREA SECTION

**Critical for local SEO**

- List specific cities/neighborhoods served
- Brief description of each area
- Helps rank for "[Service] [Suburb]" queries
- Example: "We proudly serve Phoenix, Scottsdale, Tempe, Mesa, Chandler, Gilbert, and Glendale"

#### SERVICES

- Primary services clearly presented
- Each: brief description + outcome
- Include service-specific keywords naturally
- Avoid 3-column icon card grid

#### VALUE CONTENT SECTION (REQUIRED — Google Compliance)

**This section is what separates a quality lead gen page from spam.**

Include AT LEAST ONE of these content blocks:

**Option A: "While You Wait" / Emergency Tips**
For urgent services (plumber, locksmith, HVAC, water damage):
- Step-by-step safety instructions
- How to minimize damage
- What to gather before the tech arrives
- When to call insurance

**Option B: Cost Guide / Pricing Transparency**
For all services:
- Typical price ranges for common jobs
- Factors that affect cost
- Questions to ask when getting quotes
- Red flags to watch for

**Option C: "How to Choose" Guide**
For all services:
- What credentials to verify
- Questions to ask before hiring
- What to expect during the service visit
- Signs of quality workmanship

**Option D: Local Considerations**
For location-specific value:
- Climate/weather impacts on the service
- Local code requirements
- Common issues in [City] homes
- Best times of year for the service

This content:

- Demonstrates expertise (E-E-A-T)
- Provides value even if visitor doesn't convert
- Differentiates from thin affiliate pages
- Builds trust through helpfulness

#### TRUST & CREDIBILITY

- Owner/company story (creates authenticity)
- Credentials and licenses
- Real-feeling differentiators
- Photo placeholder (real local photo ideal)

#### SOCIAL PROOF

- 2-3 testimonials with names and locations
- Star rating mention
- Link to Google/Yelp reviews
- NO carousels or quotation icons

#### LEAD CAPTURE FORM

**The conversion engine**

Requirements:

- Minimum fields: Name, Phone, Service Needed
- Optional: Email, Preferred Time, Address/Zip
- Headline restates value: "Get Your Free [City] [Service] Estimate"
- CTA: Action verb + outcome ("Get My Estimate", "Schedule Service")
- Trust microcopy: Response time expectation, "No spam" assurance
- Phone prominent nearby for those who prefer calling

#### FAQ

- 5-6 questions addressing common objections
- Include location-specific details
- Natural keyword inclusion

#### SERVICE AREA MAP (Optional)

- Visual representation of coverage
- Reinforces local presence
- Good for SEO

#### FINAL CTA

- Reiterate value proposition with location
- Phone and form CTA
- Business hours

#### FOOTER

- NAP (Name, Address, Phone) — critical for local SEO
- Service area list
- Hours
- License numbers
- Links to privacy policy

---

## LOCAL SEO REQUIREMENTS

### On-Page Essentials

<title>[Service] [City] | [Business Name] | [State Abbreviation]</title>
<meta name="description" content="[Business Name] provides [service] in [City] and [surrounding areas]. [Benefit]. Call [phone] for [CTA]." />
<link rel="canonical" href="https://[domain].com/" />

### Schema.org LocalBusiness (JSON-LD)

Include LocalBusiness schema with:
- @context, @type, @id
- name, description, url, telephone
- address (PostalAddress)
- geo (GeoCoordinates)
- areaServed (Cities)
- openingHoursSpecification
- priceRange, image, sameAs
- aggregateRating

### Service Schema (for each service)

Include Service schema with:
- name, description
- provider (reference to business)
- areaServed
- serviceType

### FAQ Schema

Include FAQPage schema with mainEntity array of Question/Answer pairs.

### Technical SEO Checklist

- Semantic HTML5 structure
- Single H1 containing primary keyword + location
- H2s for each major section with keywords
- Alt text on all images with location context
- Internal linking structure
- Mobile-first responsive
- Core Web Vitals optimized
- HTTPS ready
- Fast load time (<3s)

---

## PERFORMANCE SPECIFICATIONS

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### Implementation

- Critical CSS inlined in <head>
- Above-fold styles only initially
- Font preloading strategy
- Image lazy loading
- Resource hints for external domains

---

## TECHNICAL OUTPUT

### Files

/index.html    — Semantic HTML5
/styles.css    — Modern CSS (Grid, Flexbox, Custom Properties)
/script.js     — Vanilla JS, progressive enhancement

### HTML Requirements

- Semantic elements: <header>, <main>, <section>, <article>, <footer>
- Proper heading hierarchy
- Form with labels and autocomplete
- Descriptive alt text with location keywords
- Lazy loading for below-fold images

### CSS Requirements

- CSS Custom Properties for design system
- Mobile-first (breakpoints: 640px, 1024px, 1280px)
- 8px spacing scale
- Fluid typography with clamp()
- Focus states
- Reduced motion support
- Print styles for contact info

### JavaScript Requirements

- Progressive enhancement
- Smooth scroll
- Form validation with inline feedback
- Intersection Observer for animations
- No dependencies

---

## QUALITY CHECKLIST

**Google Compliance (CRITICAL):**

- Contains at least 800 words of unique, helpful content?
- Includes at least ONE value content section (tips, cost guide, how-to-choose)?
- Passes the "stand alone" test — valuable even without conversion?
- No keyword stuffing or unnatural city lists?
- Transparency disclosure present in footer?
- Privacy policy link included?
- No fake urgency or scarcity tactics?
- All content genuinely unique (not templated with city swaps)?

**SEO:**

- Title tag under 60 chars with [Service] [City]?
- Meta description under 160 chars with CTA?
- H1 contains primary keyword + location?
- LocalBusiness schema complete?
- NAP consistent?
- Service area explicitly listed?
- FAQ schema implemented?
- rel="sponsored" on any partner/affiliate links?

**Design:**

- Would a designer screenshot this?
- Avoids ALL lead gen red flags?
- Feels like a real local business?
- Typography has personality?
- Color palette is cohesive?

**Conversion:**

- Value proposition clear in 5 seconds?
- Phone number prominent (if urgent service)?
- Form is inviting, not demanding?
- Would YOU call this number?

**Authenticity:**

- Name sounds like a real local business?
- Story/history feels plausible?
- Credentials are specific and verifiable-looking?
- Service area is geographically coherent?

**E-E-A-T Signals:**

- Experience demonstrated (years, project count)?
- Expertise shown (certifications, training)?
- Authority implied (affiliations, if applicable)?
- Trust established (license, insurance, contact info)?

---

## FINAL INSTRUCTION

Generate a complete landing page that will:

1. **Rank sustainably** for "[Category] [Location]" searches using white-hat SEO
2. **Provide genuine value** with helpful content (cost guides, tips, how-to-choose)
3. **Convert visitors** into qualified leads through trust, not manipulation
4. **Look premium** — indistinguishable from a well-funded local service company
5. **Pass Google's quality bar** — content that stands alone as useful even without conversion

**Non-Negotiable Requirements:**

- Minimum 800 words of unique, helpful content
- At least ONE value content section (emergency tips, cost guide, or how-to-choose)
- Transparency disclosure in footer
- No keyword stuffing, fake urgency, or thin template content
- Location-specific details (not just city name mentions)

**The Ultimate Test:**
If Google's quality raters reviewed this page, would they see:

- A thin affiliate/lead page trying to rank? ❌
- A genuine local resource that helps users and happens to capture leads? ✅

Build the second one.

Now build it.`;

export const CATEGORY_MODIFIER_PROMPT = `# Category Modifier Prompt

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

{{FOUNDATION_GOLDEN_PROMPT}}

### Location

LOCATION_NAME: {{LOCATION_NAME}}
LOCATION_TYPE: {{LOCATION_TYPE}} (city | county | region)
STATE: {{STATE}}
STATE_ABBREV: {{STATE_ABBREV}}
SERVICE_AREA: {{SERVICE_AREA}} (comma-separated cities/areas)
COORDINATES: {{LAT}}, {{LNG}}

### Category

CATEGORY: {{CATEGORY}}
CATEGORY_TIER: {{TIER}} (tier1 | tier2 | tier3 | conditional)

### Lead Economics

AVG_JOB_VALUE: {{AVG_JOB_VALUE}}
PROVIDER_PAYS: {{PROVIDER_PAYS}}
TYPICAL_CPL: {{TYPICAL_CPL}}
URGENCY: {{URGENCY}} (extreme | high | medium | low)
COMPETITION_LEVEL: {{COMPETITION_LEVEL}} (low | moderate | high | extreme)
SEASONALITY: {{SEASONALITY}} (none | mild | strong)

---

## CATEGORY-SPECIFIC NAMING INTELLIGENCE

### EMERGENCY SERVICES

**Categories:** Emergency plumber, locksmith, water damage restoration

**Naming Priority:** Speed + Trust + Location

**Recommended Patterns:**

[City] Emergency [Service] — "Phoenix Emergency Plumber"
[City] 24 Hour [Service] — "Austin 24 Hour Locksmith"
[City] [Service] Pros — "Mesa Water Damage Pros"
Rapid [Service] [City] — "Rapid Response Plumbing Phoenix"

**Keywords to Include in Name/Tagline:**

- "24/7", "Emergency", "Fast Response", "Same Day"
- Location name prominently

**Title Tag Pattern:**

Emergency [Service] [City] [State] | 24/7 Fast Response | [Business Name]

---

### HOME REPAIR & MAINTENANCE

**Categories:** Garage door repair, appliance repair, HVAC repair

**Naming Priority:** Reliability + Expertise + Location

**Recommended Patterns:**

[City] [Service] — "Phoenix Garage Doors"
[City] [Service] Experts — "Mesa Appliance Experts"
[City] [Service] Co — "Tempe HVAC Co"
[Name] [Service] of [City] — "Allied Appliance of Phoenix"

**Keywords to Include:**

- "Repair", "Service", "Same-Day", specific equipment types

**Title Tag Pattern:**

[Service] [City] | Same-Day Repairs | [Business Name]

---

### REMOVAL & CLEANOUT

**Categories:** Junk removal, estate cleanout, hoarding cleanup

**Naming Priority:** Ease + Trust + Location

**Recommended Patterns:**

[City] Junk Removal — "Phoenix Junk Removal"
[City] Hauling Pros — "Scottsdale Hauling Pros"
[City] Cleanout Services — "Mesa Cleanout Services"
Easy [Service] [City] — "Easy Junk Phoenix"

**Keywords to Include:**

- "Same-day", "Free estimates", "Eco-friendly", "Donation"

**Title Tag Pattern:**

[Service] [City] | Same-Day Pickup | Free Estimates | [Business Name]

---

### SPECIALTY & SEASONAL

**Categories:** Vacation rental cleaning, pool service, pest control

**Naming Priority:** Reliability + Specialty + Location

**Recommended Patterns:**

[City] [Service] — "Phoenix Pool Service"
[City] [Service] Pros — "Scottsdale Vacation Rental Cleaning"
[Area] [Service] — "East Valley Pest Control"
Premier [Service] [City] — "Premier Pool Care Phoenix"

**Keywords to Include:**

- Service-specific terms ("Airbnb", "turnover", "monthly")
- Reliability signals

**Title Tag Pattern:**

[Service] [City] | Reliable [Frequency] Service | [Business Name]

---

### CARE SERVICES

**Categories:** Senior home care, companion care

**Naming Priority:** Compassion + Trust + Location

**Recommended Patterns:**

[City] Home Care — "Phoenix Home Care"
[City] Senior Care — "Scottsdale Senior Care"
[City] Care Companions — "Mesa Care Companions"
Caring [Name] of [City] — "Caring Hearts of Phoenix"

**Keywords to Include:**

- "Compassionate", "Trusted", "Family", "Licensed"
- Avoid cold/clinical terminology

**Title Tag Pattern:**

[Service] [City] | Compassionate In-Home Care | [Business Name]

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

**Required Cost Transparency Section:**

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

---

### HOME REPAIR & MAINTENANCE

**Categories:** Appliance repair, garage door repair, HVAC repair

**Required "Repair vs Replace" Guide:**

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

**Required Maintenance Tips Section:**

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

---

### REMOVAL & CLEANOUT

**Categories:** Junk removal, estate cleanout, hoarding cleanup

**Required "What to Expect" Section:**

## What Happens to Your Items?

We believe in responsible disposal:

**Recycled:** Electronics, metals, appliances, cardboard
**Donated:** Furniture, clothing, household items in good condition
**Disposed:** Only items that can't be recycled or donated

**Our donation partners:**

- [Local charity 1]
- [Local charity 2]
- Habitat for Humanity ReStore

We provide donation receipts for tax purposes when applicable.

**Required "How to Prepare" Section:**

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

---

### SPECIALTY & SEASONAL

**Categories:** Vacation rental cleaning, pool service, pest control

**Required "How to Choose" Section:**

## How to Choose a [Service Provider] in [City]

### Credentials to verify:

- Licensed and insured
- [Industry-specific certification]
- References from similar clients
- Clear pricing structure

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

---

### CARE SERVICES

**Categories:** Senior home care, companion care

**Required "Evaluating Care" Guide:**

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

**Required "Types of Care" Explainer:**

## Understanding Your Care Options

| Care Type      | Best For                             | Includes                              |
| -------------- | ------------------------------------ | ------------------------------------- |
| Companion Care | Social interaction, light assistance | Conversation, errands, meal prep      |
| Personal Care  | Daily living assistance              | Bathing, dressing, mobility           |
| Respite Care   | Giving family caregivers a break     | Temporary relief, flexible scheduling |
| 24-Hour Care   | Round-the-clock needs                | Live-in or rotating caregivers        |

Not sure what you need? We offer free in-home assessments.

---

## SEO KEYWORD PATTERNS BY CATEGORY

### Emergency Plumber

Primary: emergency plumber [city], 24 hour plumber [city]
Secondary: plumber near me, [city] plumbing, burst pipe repair [city]
Long-tail: water heater repair [city], drain cleaning [city], leak repair [city]

### Locksmith

Primary: locksmith [city], emergency locksmith [city]
Secondary: car lockout [city], house lockout [city]
Long-tail: lock rekey [city], lock replacement [city]

### Garage Door Repair

Primary: garage door repair [city], garage door service [city]
Secondary: garage door opener repair [city], broken garage door [city]
Long-tail: garage door spring repair, garage door cable repair

### Appliance Repair

Primary: appliance repair [city], [appliance] repair [city]
Secondary: refrigerator repair, washer repair, dryer repair
Long-tail: [brand] repair [city], same day appliance repair

### Junk Removal

Primary: junk removal [city], hauling [city]
Secondary: furniture removal, appliance removal
Long-tail: estate cleanout [city], hoarding cleanup [city]

### Water Damage Restoration

Primary: water damage restoration [city], flood cleanup [city]
Secondary: water damage repair, emergency water removal
Long-tail: mold remediation [city], sewage cleanup [city]

### Pest Control

Primary: pest control [city], exterminator [city]
Secondary: bed bug treatment, termite inspection
Long-tail: rodent control [city], [pest type] removal [city]

### Vacation Rental Cleaning

Primary: vacation rental cleaning [city], airbnb cleaning [city]
Secondary: turnover cleaning, vrbo cleaning
Long-tail: short term rental cleaning, same day turnover cleaning

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

For input: CATEGORY: emergency plumber, LOCATION_NAME: Phoenix, STATE: Arizona

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

The specialized prompt should read like it was written by someone who has built and ranked 100+ lead gen sites for **{{CATEGORY}}** businesses — using sustainable, white-hat tactics that survive algorithm updates.`;
