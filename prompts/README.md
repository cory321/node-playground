# Golden Prompt System for Lead Generation Landing Pages

A two-stage prompt system for generating SEO-dominant, high-converting lead generation pages that capture leads for sale to local service providers.

---

## Business Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEAD GENERATION FLOW                        │
│                                                                 │
│   1. Select Location (City/County/Region)                      │
│   2. Select Category (from tiers.ts)                           │
│   3. Generate SEO-Optimized Business Name                      │
│   4. Create Landing Page that Dominates Local SERP             │
│   5. Capture Leads (Phone/Form)                                │
│   6. Sell Leads to Local Providers                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STAGE 1: Generate Specialized Golden Prompt                  │
│                                                                 │
│   ┌──────────────────┐                                         │
│   │   Foundation     │                                         │
│   │  Golden Prompt   │───┐                                     │
│   │  (naming, SEO,   │   │                                     │
│   │   anti-slop)     │   │                                     │
│   └──────────────────┘   │     ┌───────────────────────┐       │
│                          ├────▶│  Specialized Golden   │       │
│   ┌──────────────────┐   │     │       Prompt          │       │
│   │    Category      │   │     │                       │       │
│   │    Modifier      │───┘     │  "Emergency Plumber   │       │
│   │   (psychology,   │         │   Phoenix, AZ"        │       │
│   │    keywords)     │         └───────────┬───────────┘       │
│   └──────────────────┘                     │                   │
│                                            │                   │
│   + Location: Phoenix, AZ                  │                   │
│   + Category: emergency plumber            │                   │
│   + Lead Economics from tiers.ts           │                   │
│                                            │                   │
└────────────────────────────────────────────┼────────────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STAGE 2: Generate Landing Page                               │
│                                                                 │
│   ┌───────────────────────┐                                    │
│   │  Specialized Golden   │                                    │
│   │       Prompt          │                                    │
│   └───────────┬───────────┘                                    │
│               │                                                 │
│               ▼                                                 │
│   ┌───────────────────────┐                                    │
│   │   Complete Landing    │                                    │
│   │       Page Code       │                                    │
│   │                       │                                    │
│   │  • index.html         │                                    │
│   │  • styles.css         │                                    │
│   │  • script.js          │                                    │
│   │  • Schema markup      │                                    │
│   └───────────────────────┘                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files

| File | Purpose |
|------|---------|
| `foundation-golden-prompt.md` | Core prompt with business naming strategy, anti-slop design rules, SEO requirements, and page architecture |
| `category-modifier-prompt.md` | Meta-prompt that specializes the foundation for a specific category + location with industry psychology and keyword patterns |
| `site-planner-golden-prompt.md` | Strategic blueprint generator for multi-page lead generation sites with E-E-A-T compliance, market viability scoring, and 2026 algorithm awareness |
| `README.md` | This usage guide |

---

## Key Features

### SEO-First Business Naming

The Foundation prompt includes a naming strategy engine:

| Tier | Pattern | Example | Use When |
|------|---------|---------|----------|
| 1 | [City] [Service] | "Phoenix Plumbing" | Low competition |
| 2 | [City] [Service] [Modifier] | "Phoenix Plumbing Pros" | Moderate competition |
| 3 | [Brand] [Service] of [City] | "Allied Plumbing of Phoenix" | High competition |
| 4 | [Neighborhood] [Service] | "Arcadia Plumbing" | Hyperlocal targeting |

### Category-Specific Psychology

The Category Modifier includes deep knowledge of:

| Category Type | Emotional State | Design Direction | CTA Priority |
|---------------|-----------------|------------------|--------------|
| Emergency | Panic, urgency | Brutalist Confidence | Phone primary |
| Repair | Frustration | Industrial Utility | Phone + Form |
| Removal | Overwhelm | Warm Craft | Form primary |
| Specialty | Pragmatic | Editorial Luxury | Form primary |
| Care | Worry, guilt | Warm Craft | Consultation |

### Anti-Lead-Gen-Farm Design

Explicit rules to avoid looking like a lead gen operation:

**Banned:**
- "Get 3 Free Quotes"
- Stock photos with gradients
- Generic template styling
- "We connect you with..."
- Testimonial carousels

**Required:**
- Distinctive typography
- Custom color palette
- Specific local details
- Realistic credentials
- Owner story

---

## Usage Flow

### Step 1: Generate Specialized Golden Prompt

Pass to AI:

```markdown
[Paste category-modifier-prompt.md]

---

FOUNDATION_GOLDEN_PROMPT:
[Paste foundation-golden-prompt.md]

---

LOCATION_NAME: Phoenix
LOCATION_TYPE: city
STATE: Arizona
STATE_ABBREV: AZ
SERVICE_AREA: Phoenix, Scottsdale, Tempe, Mesa, Chandler, Gilbert
COORDINATES: 33.4484, -112.0740

CATEGORY: emergency plumber
CATEGORY_TIER: tier1
AVG_JOB_VALUE: $200-$500
PROVIDER_PAYS: $50-$100
TYPICAL_CPL: $40-$60
URGENCY: extreme
COMPETITION_LEVEL: moderate
SEASONALITY: none
```

**Output:** Specialized golden prompt for "Emergency Plumber — Phoenix, AZ"

---

### Step 2: Generate Landing Page

Pass the specialized prompt to AI with any additional business details:

```markdown
[Paste specialized golden prompt from Step 1]

---

PHONE: (602) 555-0187
TRACKING_PHONE: (602) 555-0188
```

**Output:** Complete HTML + CSS + JS ready to deploy

---

## Integration with Node Builder

When the Deep Research Node selects a category:

```typescript
import { getLeadEconomics, getCategoryTier } from '@/api/serp/tiers';

// Get category data
const economics = getLeadEconomics('emergency plumber');
const tier = getCategoryTier('emergency plumber', cityProfile);

// Build prompt inputs
const promptInputs = {
  CATEGORY: 'emergency plumber',
  CATEGORY_TIER: tier,
  URGENCY: economics.urgency,
  COMPETITION_LEVEL: economics.competitionLevel,
  LOCATION_NAME: selectedCity.name,
  STATE: selectedCity.state,
  SERVICE_AREA: selectedCity.serviceArea.join(', '),
  // ...
};

// Generate specialized prompt via LLM
// Then generate landing page via LLM
```

---

## Category Quick Reference

### Tier 1 (Always Viable)

| Category | Urgency | Naming Pattern | Design |
|----------|---------|----------------|--------|
| garage door repair | high | [City] Garage Doors | Industrial |
| appliance repair | high | [City] Appliance Experts | Industrial |
| junk removal | medium | [City] Junk Removal | Warm Craft |
| emergency plumber | extreme | [City] Emergency Plumber | Brutalist |
| locksmith | extreme | [City] Locksmith | Brutalist |
| water damage restoration | extreme | [City] Restoration Pros | Brutalist |

### Tier 2 (Conditional)

| Category | Condition | Naming Pattern | Design |
|----------|-----------|----------------|--------|
| vacation rental cleaning | Coastal/Tourism | [City] Vacation Rental Cleaning | Editorial |
| senior home care | Retirement | [City] Home Care | Warm Craft |
| pool service | High Income | [City] Pool Service | Editorial |
| pest control | Universal | [City] Pest Control | Industrial |
| estate cleanout | Retirement | [City] Cleanout Services | Warm Craft |

---

## Naming Examples by Market

### Low Competition Market
```
Input: Phoenix + garage door repair + low competition
Output: "Phoenix Garage Doors"
Domain: phoenixgaragedoors.com
```

### Moderate Competition Market
```
Input: Austin + emergency plumber + moderate competition
Output: "Austin Plumbing Pros"
Domain: austinplumbingpros.com
```

### High Competition Market
```
Input: Los Angeles + appliance repair + high competition
Output: "Allied Appliance of Los Angeles"
Domain: alliedappliancela.com
```

### Hyperlocal Targeting
```
Input: Scottsdale (suburb of Phoenix) + pool service
Output: "Scottsdale Pool Pros"
Domain: scottsdalepoolpros.com
```

---

## SEO Checklist per Page

- [ ] Business name contains [City] + [Service]
- [ ] Title tag: `[Service] [City] [State] | [Differentiator] | [Business Name]`
- [ ] H1 contains primary keyword + location
- [ ] Meta description includes phone number and CTA
- [ ] LocalBusiness schema with complete NAP
- [ ] Service schema for each service offered
- [ ] FAQPage schema for FAQ section
- [ ] Service area explicitly listed with city names
- [ ] Alt text includes location on relevant images
- [ ] Internal linking structure present
- [ ] Mobile-optimized with click-to-call
- [ ] Core Web Vitals passing

---

## Domain Strategy

Preferred patterns:
```
[city][service].com         — phoenixplumber.com
[city][service]pros.com     — phoenixplumberpros.com  
[city][service]co.com       — phoenixplumberco.com
[adjective][service][city].com — rapidplumberphoenix.com
```

Considerations:
- `.com` preferred, `.co` acceptable
- Under 25 characters ideal
- Avoid hyphens (look less legitimate)
- Check availability before generating page

---

## Quality Signals

A successful page should:

1. **Rank** for "[Service] [City]" within 3-6 months
2. **Convert** at 5-15% of visitors to leads
3. **Pass** the "would you call?" test
4. **Look** indistinguishable from a real local business
5. **Feel** premium, not template-generated

---

## Site Planner Golden Prompt

The Site Planner is the strategic brain that creates comprehensive website blueprints for multi-page lead generation sites. It incorporates critical 2026 algorithm research.

### Key Features

| Feature | Description |
|---------|-------------|
| **Market Viability Scoring** | Scores markets 1-100 with proceed/reconsider/abort recommendations |
| **E-E-A-T Strategy** | Specific experience, expertise, authority, trust signals per page |
| **Algorithm Compliance** | Checks against August 2025 spam update vulnerabilities |
| **Channel Strategy** | LSAs as primary channel with organic as authority builder |
| **Multi-Model Revenue** | Lead gen + WaaS + productized SEO hybrid approach |
| **Cannibalization Prevention** | Exclusive vs. shared keyword assignment |
| **Orphan Page Prevention** | Minimum 2 inbound links per page requirement |

### 2026 Algorithm Context (Built-In)

The prompt incorporates these critical research findings:

- **45% reduction** in unhelpful content (March 2024 core update)
- **August 2025 spam update** hit lead-gen sites particularly hard
- **0.01% of local queries** trigger AI Overviews (down from 0.14%)
- **Expired domain abuse** now explicit spam policy violation
- **Site reputation abuse** penalties (even CNN, USA Today penalized)
- **LSAs now primary channel** for home services leads
- **6-12 month ranking timelines** for moderate competition

### Ranking Timeline Expectations

| Competition | Expected Timeline |
|-------------|-------------------|
| Low | 3-6 months |
| Moderate | 6-12 months |
| High | 12-18 months |

### Lead Value Benchmarks

| Category | Lead Value Range |
|----------|------------------|
| Water Damage Restoration | $150-300+ |
| Roofing | $100-350 |
| HVAC | $50-250 |
| Plumbing | $35-129 |
| Garage Door | $75-150 |
| Locksmith | $50-125 |

### Usage

The Site Planner Node has **four input ports** that receive data from upstream nodes:

| Input Port | Source Node | Data |
|------------|-------------|------|
| `location` | **Location Node** | City, state, demographics, climate |
| `serp` | **Deep Research Node** | SERP analysis, aggregator presence, competition |
| `providers` | **Provider Enrichment Node** | Verified providers with credentials, reviews |
| `localKnowledge` | **Local Knowledge Node** | Regional terminology, landmarks, community context |

```
┌─────────────────┐
│  Location Node  │──────┐
└─────────────────┘      │
                         │
┌─────────────────┐      │     ┌──────────────────┐
│ Deep Research   │──────┼────▶│ Site Planner     │──▶ SiteBlueprint
└─────────────────┘      │     │ Node             │
                         │     └──────────────────┘
┌─────────────────┐      │
│ Provider        │──────┤
│ Enrichment Node │      │
└─────────────────┘      │
                         │
┌─────────────────┐      │
│ Local Knowledge │──────┘
│ Node            │
└─────────────────┘
```

And outputs a complete `SiteBlueprint` containing:

- Market viability assessment
- Brand identity with aggregator differentiators
- Complete page inventory with E-E-A-T requirements
- Keyword mapping with cannibalization prevention
- Internal linking strategy
- Phased launch plan with realistic milestones
- Channel strategy (LSA + organic mix)
- Monetization plan (hybrid approach)
- Compliance requirements

### The "Minefield" Warning

Industry experts describe rank-and-rent in 2026 as "walking through a minefield blindfolded." The Site Planner addresses this by:

1. **Scoring viability honestly** — Markets below 40 get "abort" recommendation
2. **Building trust first** — Methodology page is non-negotiable
3. **Integrating LSAs** — Organic alone is too slow for most markets
4. **Strict compliance** — Every spam policy checked
5. **Multi-model revenue** — Pure lead-gen is dead; hybrid wins
