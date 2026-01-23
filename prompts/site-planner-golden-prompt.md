# Site Planner Golden Prompt

> **Single Job:** Create an actionable blueprint that tells content generators exactly what pages to build and what to put on them.

---

## 2026 Context: Why This Matters

Google's 2024-2025 updates fundamentally changed local lead generation:

- **March 2024 Core Update** — 45% reduction in "low-quality, unoriginal content"
- **August 2025 Spam Update** — Hit lead-gen sites hard; only quality survivors remain
- **AI Overviews** — Only 0.01% of local queries trigger them (down from 0.14%)
- **Aggregator fatigue** — Thumbtack: 1.7 stars; HomeAdvisor: FTC violations for deceptive practices

**What still works:** Genuinely helpful local sites with E-E-A-T signals, real reviews, and unique local value. The Site Planner must ensure every page brief includes requirements that satisfy these quality standards.

---

## What Site Planner Does

The Site Planner transforms upstream research into a concrete work order:

1. **Pages to build** — Complete inventory with URLs and types
2. **Content requirements** — Word counts, required sections, local mentions
3. **Internal linking** — How pages connect to each other
4. **Build order** — Which pages to create first

## What Site Planner Does NOT Do

| Responsibility | Where It Lives | Why |
|---------------|----------------|-----|
| Market viability assessment | Deep Research Node | Upstream already validated this market |
| Monetization strategy | Project settings | Same model applies to all sites |
| FCC/FTC compliance | Project settings | Requirements don't change per site |
| LSA vs organic strategy | Project settings | Business decision, not per-site |
| Backlink strategy | Post-launch phase | Off-page SEO happens after build |
| Algorithm compliance checks | Quality Check Node | Validates output, not planning |
| Detailed competitive analysis | Deep Research Node | Already done upstream |

---

## Node Architecture

### Input Ports

| Port | Source Node | Data Type | Description |
|------|-------------|-----------|-------------|
| `location` | Location Node | `LocationData` | City, state, coordinates, demographics |
| `serp` | Deep Research Node | `SerpAnalysis` | Keyword difficulty, competition level |
| `providers` | Provider Enrichment Node | `EnrichedProvider[]` | Verified providers with credentials |
| `localKnowledge` | Local Knowledge Node | `LocalKnowledge` | Regional terminology, landmarks, climate |

### Output Port

| Port | Data Type | Description |
|------|-----------|-------------|
| `sitePlan` | `SitePlannerOutput` | Complete site blueprint for content generators |

---

## Output Schema

```typescript
interface SitePlannerOutput {
  // 1. BRAND IDENTITY
  brand: {
    name: string;                    // "Phoenix Garage Door Guide"
    tagline: string;                 // "Your trusted local resource"
    domain: string;                  // "phoenixgaragedoorguide.com"
    voiceTone: {
      personality: string[];         // ["helpful", "local", "straightforward"]
      dos: string[];                 // ["Use neighborhood names", "Be specific"]
      donts: string[];               // ["No hype", "No fake urgency"]
    };
  };

  // 2. SITE STRUCTURE
  structure: {
    baseUrl: string;                 // "https://phoenixgaragedoorguide.com"
    urlPatterns: Record<string, string>;  // Templates for each page type
  };

  // 3. PAGE INVENTORY (The core deliverable)
  pages: PageBrief[];

  // 4. CONTENT ORGANIZATION
  contentClusters: Array<{
    name: string;                    // "Garage Door Repair"
    pillarPageId: string;            // "service-garage-door-repair"
    supportingPageIds: string[];     // Related pages
  }>;

  // 5. INTERNAL LINKING RULES
  internalLinking: {
    rules: Array<{
      fromType: string;              // "city_service"
      toType: string;                // "provider_listing"
      anchorPattern: string;         // "top providers in [City]"
      required: boolean;
    }>;
  };

  // 6. BUILD ORDER
  launchPhases: Array<{
    phase: number;                   // 1, 2, 3
    name: string;                    // "Foundation"
    pageIds: string[];               // Pages in this phase
  }>;
}
```

### Page Brief Schema

```typescript
interface PageBrief {
  id: string;                        // "city-phoenix-garage-door-repair"
  type: PageType;                    // "city_service"
  url: string;                       // "/phoenix/garage-door-repair"
  priority: 1 | 2 | 3;               // Launch phase priority

  // SEO targets
  seo: {
    titleTemplate: string;           // "[City] Garage Door Repair | [Brand]"
    descriptionTemplate: string;     // "Find trusted garage door repair..."
    primaryKeyword: string;          // "phoenix garage door repair"
    secondaryKeywords: string[];     // ["garage door service phoenix", ...]
  };

  // Content requirements (what content generator needs)
  content: {
    purpose: string;                 // "Help homeowners find repair services"
    targetWordCount: number;         // 1500
    requiredSections: string[];      // ["Service overview", "Pricing", "FAQ"]
    localMentionsMin: number;        // 5
    
    // E-E-A-T requirements (CRITICAL for 2026)
    eeat: {
      experienceSignals: string[];   // ["Real project examples", "Before/after scenarios"]
      expertiseSignals: string[];    // ["Industry terminology", "Technical accuracy"]
      authoritySignals: string[];    // ["Cite sources", "Reference standards"]
      trustSignals: string[];        // ["Verified credentials", "Real reviews"]
    };
    
    // Anti-thin content requirements
    uniqueValue: {
      dataPointsMin: number;         // Minimum unique facts/stats
      requiresOriginalAnalysis: boolean;
      differentiatorVsAggregators: string;  // What makes this better than Yelp/Thumbtack
    };
  };

  // Review integration (where applicable)
  reviews?: {
    required: boolean;
    minimumCount: number;
    sources: string[];               // ["google", "yelp", "direct"]
  };

  // Data this page needs
  data: {
    providers?: string[];            // Provider IDs to feature
    services?: string[];             // Service types to cover
    city?: string;                   // City for local content
  };

  // Linking requirements
  internalLinks: {
    required: Array<{
      toPageId: string;              // "provider-listing-phoenix"
      anchorPattern: string;         // "view all Phoenix providers"
    }>;
  };

  // Schema types to generate
  schema: string[];                  // ["LocalBusiness", "FAQPage"]
}

type PageType =
  | 'homepage'
  | 'service_hub'
  | 'service_detail'
  | 'city_service'
  | 'provider_listing'
  | 'provider_profile'
  | 'comparison'
  | 'cost_guide'
  | 'troubleshooting'
  | 'about'
  | 'methodology'
  | 'contact'
  | 'legal';
```

---

## Input Schemas

```typescript
// FROM: Location Node
interface LocationData {
  name: string;                      // City name
  county?: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  demographics?: {
    population: number | null;
    medianHouseholdIncome: number | null;
    homeownershipRate: number | null;
    medianHomeValue: number | null;
  };
}

// FROM: Deep Research Node
interface SerpAnalysis {
  keyword_difficulty: number;        // 0-100, simplified from full analysis
  competition: 'low' | 'medium' | 'high';
  monthly_search_volume: number;
}

// FROM: Provider Enrichment Node
interface EnrichedProvider {
  id: string;
  name: string;
  city: string;
  state: string;
  services: string[];
  credentials: {
    licenses: string[];
    certifications: string[];
    yearsInBusiness: number;
  };
  reviews: {
    averageRating: number;
    totalCount: number;
  };
  serviceArea: string[];
  verified: boolean;
}

// FROM: Local Knowledge Node
interface LocalKnowledge {
  regional_terminology: string[];    // Local phrases
  local_landmarks: string[];         // Notable places
  climate_considerations: string[];  // Weather factors
  housing_stock_age: string;         // "1960s-1980s ranch homes"
  common_housing_types: string[];
  community_references: string[];    // Neighborhoods
  seasonal_factors: string[];
}
```

---

## Brand Generation

### Naming Patterns by Competition

| Competition | Pattern | Example |
|-------------|---------|---------|
| Low | `[City] [Service]` | "Phoenix Plumbing" |
| Medium | `[City] [Service] [Modifier]` | "Austin Garage Doors Co" |
| High | `[Brandable] [Service] of [City]` | "Allied Plumbing of Denver" |

### Trust Modifiers

| Modifier | Best For |
|----------|----------|
| **Pros** | Trade services (plumbing, HVAC) |
| **Co** | Any service, business-like |
| **Guide** | Directory-style sites |
| **Experts** | Technical services |
| **Solutions** | Restoration, complex services |

### Names to NEVER Generate

```
❌ "Best [City] [Service]"
❌ "#1 [Service] in [City]"
❌ "Cheap [Service] [City]"
❌ "Get 3 Free Quotes"
❌ "[Service] Near Me"
❌ Keyword-stuffed names (4+ terms)
```

---

## Page Inventory Generation

### Phase 1: Foundation (Priority 1)

Always create these pages first:

| Page Type | Purpose | Word Count | Required Sections |
|-----------|---------|------------|-------------------|
| Homepage | Value proposition + local authority | 1500 | Hero, services, area, trust indicators |
| About | Establish local credibility | 800 | Team story, mission, local connection |
| Methodology | How we vet providers (E-E-A-T critical) | 1200 | Criteria, verification, ongoing monitoring |
| Contact | Easy access to help | 300 | Form, phone, hours |
| Legal pages | Privacy, terms, disclosure | 500 each | Standard legal requirements |

### Phase 2: Core Pages (Priority 1-2)

| Page Type | Generates For | Word Count | Local Mentions Min |
|-----------|---------------|------------|-------------------|
| Service Hub | Each service category | 2000 | 8 |
| City+Service | Each city × service combo | 1500 | 10 |
| Provider Listing | Each city | 1000 | 5 |
| Provider Profile | Each provider | 800 | 3 |

### Phase 3: Authority Content (Priority 2-3)

| Page Type | Count | Word Count | Purpose |
|-----------|-------|------------|---------|
| Cost Guide | 1 per service | 1500 | Answer pricing questions |
| Comparison | 1 per city | 1200 | Help users choose |
| Troubleshooting | 5-8 articles | 1000 | Capture informational queries |

### Page Count Estimate

For a site with 1 category, 3 cities, and 10 providers:

| Depth | Approximate Pages |
|-------|-------------------|
| MVP | 30-35 |
| Standard | 50-60 |
| Comprehensive | 75-90 |

---

## URL Patterns

```typescript
const URL_PATTERNS = {
  homepage: '/',
  about: '/about',
  methodology: '/how-we-vet-providers',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  disclosure: '/disclosure',
  
  service_hub: '/[service-slug]',
  city_service: '/[city]/[service-slug]',
  provider_listing: '/[city]/providers',
  provider_profile: '/providers/[provider-slug]',
  comparison: '/[city]/compare-providers',
  cost_guide: '/[service-slug]/cost-guide',
  troubleshooting: '/guides/[topic-slug]'
};
```

---

## Content Requirements by Page Type

### Homepage

```typescript
{
  purpose: "Establish value proposition and local authority",
  targetWordCount: 1500,
  requiredSections: [
    "Hero with clear value proposition",
    "Service categories overview",
    "Service area with specific cities",
    "Trust indicators (reviews, years, providers)",
    "Featured providers preview",
    "Why choose us vs aggregators"
  ],
  localMentionsMin: 8
}
```

### Methodology Page

```typescript
{
  purpose: "Build trust by showing rigorous vetting process",
  targetWordCount: 1200,
  requiredSections: [
    "Our vetting criteria",
    "License and insurance verification",
    "Background check process",
    "Review verification",
    "Why we reject some providers",
    "Ongoing monitoring",
    "Our local expertise"
  ],
  localMentionsMin: 5
}
```

### City+Service Page

```typescript
{
  purpose: "Help homeowners find [service] in [city]",
  targetWordCount: 1500,
  requiredSections: [
    "Service overview for this area",
    "Common problems in [city]",
    "Cost factors and typical pricing",
    "How to choose a provider",
    "Featured local providers",
    "FAQ specific to area"
  ],
  localMentionsMin: 10
}
```

### Provider Profile

```typescript
{
  purpose: "Help users evaluate this specific provider",
  targetWordCount: 800,
  requiredSections: [
    "Provider overview",
    "Services offered",
    "Service area",
    "Credentials and certifications",
    "Customer reviews",
    "Contact information"
  ],
  localMentionsMin: 3
}
```

### Cost Guide

```typescript
{
  purpose: "Answer pricing questions with local data",
  targetWordCount: 1500,
  requiredSections: [
    "Typical price ranges",
    "Factors that affect cost",
    "Cost by project type",
    "Questions for accurate quotes",
    "Red flags in pricing",
    "When to spend more vs save"
  ],
  localMentionsMin: 5
}
```

---

## E-E-A-T Requirements by Page Type

Every page must demonstrate Experience, Expertise, Authoritativeness, and Trustworthiness. Here's what content generators must include:

### Experience Signals (First-Hand Knowledge)

| Page Type | Required Experience Signals |
|-----------|----------------------------|
| Homepage | Founder story with local connection; years serving this area |
| About | Team bios with relevant background; "why we started this" narrative |
| Methodology | Specific examples of providers we've rejected and why |
| City+Service | Common problems specific to this city's homes (housing age, climate) |
| Provider Profile | Real project photos; verified customer testimonials |
| Cost Guide | Actual quotes gathered from local providers (with permission) |
| Troubleshooting | Step-by-step from someone who's done this work |

### Expertise Signals (Subject Matter Knowledge)

| Page Type | Required Expertise Signals |
|-----------|---------------------------|
| Service Hub | Industry terminology used correctly; technical accuracy |
| City+Service | Knowledge of local codes, permit requirements, climate factors |
| Provider Profile | Explanation of credentials (what certifications mean) |
| Cost Guide | Breakdown of labor vs materials; understanding of pricing factors |
| Troubleshooting | Safety warnings where appropriate; when to call a pro |

### Authority Signals (Recognition by Others)

| Page Type | Required Authority Signals |
|-----------|---------------------------|
| Homepage | Aggregate review count; provider network size; years operating |
| About | Industry affiliations; local business partnerships |
| Methodology | Third-party verification partnerships; standards we follow |
| Provider Listing | Clear criteria for inclusion; rejection rate |

### Trust Signals (Reliability and Transparency)

| Page Type | Required Trust Signals |
|-----------|----------------------|
| All Pages | Clear contact info in footer; link to methodology |
| Homepage | Real reviews with attribution; verified provider count |
| Provider Profile | License numbers displayed; insurance confirmation |
| Provider Listing | Disclaimer: "Rankings based on our criteria" |
| Cost Guide | Disclaimer: "Prices are estimates; get actual quotes" |
| Legal | Clear disclosure of lead generation business model |

---

## Anti-Thin Content Requirements

Google penalizes "scaled content abuse" — mass-produced pages without unique value. Every page must pass these checks:

### Minimum Unique Value by Page Type

| Page Type | Min Unique Data Points | Original Analysis Required | Aggregator Differentiator |
|-----------|----------------------|---------------------------|--------------------------|
| Homepage | 5 | No | Clear value prop vs Thumbtack/Yelp |
| City+Service | 8 | Yes | City-specific problems, not templated |
| Provider Profile | 6 | No | Deeper than Yelp (credentials, service area map) |
| Cost Guide | 12 | Yes | Local pricing data, not national averages |
| Comparison | 10 | Yes | Objective criteria, not pay-to-play rankings |
| Troubleshooting | 8 | Yes | Practical steps, not generic advice |

### What Makes Content "Thin" (Avoid These)

```
❌ Same template with city name swapped
❌ Generic service descriptions copied across pages
❌ Pricing data from national sources without local validation
❌ Provider profiles with only name + phone + rating
❌ FAQ sections with obvious questions and generic answers
❌ "Why choose us" sections without specific differentiators
```

### What Makes Content "Thick" (Do These)

```
✓ City pages mention specific neighborhoods, landmarks, housing types
✓ Provider profiles include verified credentials, service area specifics
✓ Cost guides include local labor rates, permit costs for this jurisdiction
✓ FAQs answer questions specific to this service area
✓ Comparison pages use objective, transparent criteria
✓ Every page passes the "would this help a real person?" test
```

---

## Review Integration Requirements

Real reviews are critical trust signals. Research shows aggregator frustration (Thumbtack: 1.7 stars) creates opportunity for sites that surface genuine reviews.

### Requirements by Page Type

| Page Type | Reviews Required | Minimum Count | Display Format |
|-----------|-----------------|---------------|----------------|
| Homepage | Yes | 3 aggregate | Summary with link to sources |
| Provider Listing | Yes | 1 per provider | Star rating + count + source |
| Provider Profile | Yes | 3 | Full review text with attribution |
| City+Service | Optional | 2 | Testimonial highlights |
| Comparison | Yes | 1 per provider | Side-by-side ratings |

### Review Sources (Priority Order)

1. **Google Business Profile** — Most trusted, verifiable
2. **Direct/First-party** — Collected through your site with verification
3. **Yelp** — Well-known but verify authenticity
4. **Industry-specific** — Angi, HomeAdvisor (note: disclose source reputation issues)

### Review Display Rules

- Always show source attribution
- Include review date
- Never fabricate or incentivize reviews (FTC violation)
- Link to original source where possible
- Show both positive and representative negative (builds trust)

---

## Internal Linking Rules

### Standard Link Rules

| From Type | To Type | Anchor Pattern | Required |
|-----------|---------|----------------|----------|
| homepage | service_hub | `[Service] in [Region]` | Yes |
| service_hub | city_service | `[Service] in [City]` | Yes |
| city_service | provider_listing | `Top providers in [City]` | Yes |
| city_service | cost_guide | `[Service] cost guide` | Yes |
| provider_listing | provider_profile | `[Provider Name]` | Yes |
| provider_listing | comparison | `Compare [City] providers` | Yes |
| cost_guide | provider_listing | `Get quotes from verified providers` | Yes |
| troubleshooting | provider_listing | `Find a professional` | Yes |
| * | methodology | `How we vet providers` | No |

### Orphan Prevention

Every page must have at least 2 inbound links. The Site Planner tracks link counts and suggests additional links for pages that would otherwise be orphaned.

---

## Content Clusters

Group related pages into topical clusters:

```typescript
// Example cluster structure
{
  name: "Garage Door Repair",
  pillarPageId: "service-garage-door-repair",
  supportingPageIds: [
    "city-phoenix-garage-door-repair",
    "city-scottsdale-garage-door-repair",
    "cost-guide-garage-door-repair",
    "troubleshooting-garage-door-wont-open"
  ]
}
```

Each cluster has:
- **Pillar page** — Comprehensive service hub
- **Supporting pages** — City pages, guides, troubleshooting
- **Internal links** — Supporting pages link to pillar

---

## Launch Phases

### Ranking Timeline Reality (2026)

Research shows new domains require patience:

| Competition Level | Expected Timeline to Rank |
|------------------|--------------------------|
| Low | 3-6 months |
| Medium | 6-12 months |
| High | 12-18 months |

The phased launch prioritizes E-E-A-T foundation pages that must exist before Google will trust the site.

### Phase 1: Foundation

**Goal:** Core pages that establish trust and E-E-A-T

**Includes:**
- Homepage
- About, Methodology, Contact
- Legal pages (Privacy, Terms, Disclosure)
- Primary service hub pages
- Main city+service pages
- Provider listing pages

**Success criteria:**
- All pages indexed
- Schema validated
- Core internal links working

### Phase 2: Expansion

**Goal:** Complete service coverage

**Includes:**
- All city+service pages
- All provider profile pages
- Cost guides
- Comparison pages

**Success criteria:**
- Full page inventory published
- Review integration working
- Cross-linking complete

### Phase 3: Authority

**Goal:** Build topical authority

**Includes:**
- Troubleshooting articles
- DIY guides (if comprehensive depth)
- Local expertise articles

**Success criteria:**
- Content clusters complete
- Long-tail keyword coverage

---

## Schema Types by Page

| Page Type | Schema Types |
|-----------|-------------|
| Homepage | `WebSite`, `LocalBusiness`, `Organization` |
| About | `AboutPage`, `Organization` |
| Service Hub | `Service`, `FAQPage` |
| City+Service | `Service`, `LocalBusiness`, `FAQPage` |
| Provider Listing | `ItemList`, `LocalBusiness` |
| Provider Profile | `LocalBusiness`, `AggregateRating`, `Review` |
| Cost Guide | `Article`, `FAQPage` |
| Comparison | `Article`, `ItemList` |
| Troubleshooting | `HowTo`, `Article`, `FAQPage` |

---

## Generation Logic

```typescript
function generateSitePlan(
  location: LocationData,
  serp: SerpAnalysis,
  providers: EnrichedProvider[],
  localKnowledge: LocalKnowledge,
  config: { depth: 'mvp' | 'standard' | 'comprehensive' }
): SitePlannerOutput {
  
  // 1. Generate brand
  const brand = generateBrand(location, serp.competition);
  
  // 2. Build page inventory
  const pages: PageBrief[] = [];
  
  // Foundation pages (always)
  pages.push(
    createHomepage(location, brand),
    createAboutPage(brand),
    createMethodologyPage(),
    createContactPage(),
    ...createLegalPages()
  );
  
  // Service pages
  const services = extractServices(providers);
  const cities = extractCities(providers);
  
  for (const service of services) {
    pages.push(createServiceHub(service, location));
    
    for (const city of cities) {
      pages.push(createCityServicePage(service, city, localKnowledge));
    }
  }
  
  // Provider pages
  for (const city of cities) {
    pages.push(createProviderListing(city, providers));
    
    const cityProviders = providers.filter(p => p.city === city);
    for (const provider of cityProviders) {
      pages.push(createProviderProfile(provider));
    }
  }
  
  // Depth-dependent pages
  if (config.depth !== 'mvp') {
    for (const service of services) {
      pages.push(createCostGuide(service, location));
    }
    pages.push(...createTroubleshootingArticles(services, 5));
  }
  
  if (config.depth === 'comprehensive') {
    pages.push(...createTroubleshootingArticles(services, 3)); // Additional
    pages.push(...createLocalExpertiseArticles(localKnowledge, 5));
  }
  
  // 3. Build content clusters
  const contentClusters = buildClusters(pages, services);
  
  // 4. Plan internal linking
  const internalLinking = planInternalLinks(pages);
  
  // 5. Assign launch phases
  const launchPhases = assignPhases(pages);
  
  // 6. Build structure
  const structure = {
    baseUrl: `https://${brand.domain}`,
    urlPatterns: URL_PATTERNS
  };
  
  return {
    brand,
    structure,
    pages,
    contentClusters,
    internalLinking,
    launchPhases
  };
}
```

---

## Example Output

For "Garage Door Repair in Phoenix, AZ" with 10 providers across 3 cities:

```json
{
  "brand": {
    "name": "Phoenix Garage Door Guide",
    "tagline": "Your trusted resource for garage door services",
    "domain": "phoenixgaragedoorguide.com",
    "voiceTone": {
      "personality": ["helpful", "local", "straightforward"],
      "dos": ["Use neighborhood names", "Mention local landmarks", "Be specific about pricing"],
      "donts": ["No hype language", "No fake urgency", "No 'best in city' claims"]
    }
  },
  
  "structure": {
    "baseUrl": "https://phoenixgaragedoorguide.com",
    "urlPatterns": {
      "service_hub": "/[service-slug]",
      "city_service": "/[city]/[service-slug]"
    }
  },
  
  "pages": [
    {
      "id": "homepage",
      "type": "homepage",
      "url": "/",
      "priority": 1,
      "seo": {
        "titleTemplate": "Phoenix Garage Door Guide | Trusted Local Repair & Installation",
        "descriptionTemplate": "Find vetted garage door professionals in Phoenix. Compare verified pros, read real reviews, get fair pricing.",
        "primaryKeyword": "phoenix garage door",
        "secondaryKeywords": ["garage door repair phoenix", "phoenix garage door companies"]
      },
      "content": {
        "purpose": "Establish as the trusted local resource for garage door services",
        "targetWordCount": 1500,
        "requiredSections": ["Hero", "Services overview", "Service area", "Trust indicators", "Featured providers", "Why choose us vs aggregators"],
        "localMentionsMin": 8,
        "eeat": {
          "experienceSignals": ["Founder story with Phoenix connection", "Years serving the Valley"],
          "expertiseSignals": ["Knowledge of desert climate impact on garage doors"],
          "authoritySignals": ["Total verified reviews across network", "Number of vetted providers"],
          "trustSignals": ["Clear contact info", "Link to methodology page"]
        },
        "uniqueValue": {
          "dataPointsMin": 5,
          "requiresOriginalAnalysis": false,
          "differentiatorVsAggregators": "Personally vetted local pros vs Thumbtack's anyone-can-list model"
        }
      },
      "reviews": {
        "required": true,
        "minimumCount": 3,
        "sources": ["google", "direct"]
      },
      "data": {
        "providers": ["provider-1", "provider-2", "provider-3"],
        "city": "Phoenix"
      },
      "internalLinks": {
        "required": [
          { "toPageId": "service-repair", "anchorPattern": "garage door repair" },
          { "toPageId": "service-installation", "anchorPattern": "garage door installation" },
          { "toPageId": "methodology", "anchorPattern": "how we vet providers" }
        ]
      },
      "schema": ["WebSite", "LocalBusiness", "Organization"]
    },
    {
      "id": "city-phoenix-repair",
      "type": "city_service",
      "url": "/phoenix/garage-door-repair",
      "priority": 1,
      "seo": {
        "titleTemplate": "Garage Door Repair in Phoenix, AZ | Phoenix Garage Door Guide",
        "descriptionTemplate": "Need garage door repair in Phoenix? Compare vetted local pros, see pricing, read verified reviews.",
        "primaryKeyword": "garage door repair phoenix",
        "secondaryKeywords": ["phoenix garage door repair", "garage door service phoenix az"]
      },
      "content": {
        "purpose": "Help Phoenix homeowners find reliable garage door repair",
        "targetWordCount": 1500,
        "requiredSections": ["Service overview", "Common issues in Phoenix", "Pricing factors", "How to choose", "Local providers", "FAQ"],
        "localMentionsMin": 10,
        "eeat": {
          "experienceSignals": ["Common Phoenix garage door problems (heat warping, sun damage)", "Real repair scenarios from local homes"],
          "expertiseSignals": ["Desert climate considerations", "Arizona licensing requirements"],
          "authoritySignals": ["Number of Phoenix providers in network", "Total Phoenix area reviews"],
          "trustSignals": ["Verified license numbers", "Insurance confirmation for each provider"]
        },
        "uniqueValue": {
          "dataPointsMin": 8,
          "requiresOriginalAnalysis": true,
          "differentiatorVsAggregators": "Phoenix-specific problems and solutions vs generic national content"
        }
      },
      "reviews": {
        "required": true,
        "minimumCount": 2,
        "sources": ["google"]
      },
      "data": {
        "providers": ["provider-1", "provider-2"],
        "services": ["repair"],
        "city": "Phoenix"
      },
      "internalLinks": {
        "required": [
          { "toPageId": "provider-listing-phoenix", "anchorPattern": "view all Phoenix providers" },
          { "toPageId": "cost-guide-repair", "anchorPattern": "garage door repair costs" }
        ]
      },
      "schema": ["Service", "LocalBusiness", "FAQPage"]
    }
  ],
  
  "contentClusters": [
    {
      "name": "Garage Door Repair",
      "pillarPageId": "service-repair",
      "supportingPageIds": ["city-phoenix-repair", "city-scottsdale-repair", "cost-guide-repair"]
    }
  ],
  
  "internalLinking": {
    "rules": [
      { "fromType": "city_service", "toType": "provider_listing", "anchorPattern": "top providers in [City]", "required": true },
      { "fromType": "city_service", "toType": "cost_guide", "anchorPattern": "[Service] cost guide", "required": true }
    ]
  },
  
  "launchPhases": [
    { "phase": 1, "name": "Foundation", "pageIds": ["homepage", "about", "methodology", "contact", "privacy", "terms", "disclosure"] },
    { "phase": 2, "name": "Core Pages", "pageIds": ["service-repair", "city-phoenix-repair", "provider-listing-phoenix"] },
    { "phase": 3, "name": "Authority", "pageIds": ["cost-guide-repair", "troubleshooting-1"] }
  ]
}
```

---

## Summary

**Site Planner answers one question: "What exactly should we build?"**

The output is a work order for content generators:

1. ✅ Here are the pages
2. ✅ Here's what goes on each page
3. ✅ Here's the word count and sections needed
4. ✅ Here's the E-E-A-T signals to include
5. ✅ Here's the unique value requirements (anti-thin content)
6. ✅ Here's the local context to inject
7. ✅ Here's review integration requirements
8. ✅ Here's how pages link together
9. ✅ Here's what order to build them

Everything else lives elsewhere:
- Viability → Deep Research Node (upstream)
- Monetization → Project settings
- Compliance → Project settings
- Channel strategy → Project settings
- Competitive analysis → Deep Research Node (upstream)
- Algorithm compliance validation → Quality Check Node (downstream)

---

## The 2026 Quality Bar

Every page brief includes requirements that ensure the content will:

1. **Pass Google's Helpful Content standards** — Original analysis, not templated
2. **Satisfy E-E-A-T quality raters** — Real experience, verifiable expertise
3. **Differentiate from aggregators** — Deeper than Yelp, more trustworthy than Thumbtack
4. **Survive algorithm updates** — Built on genuine value, not SEO tricks
5. **Convert visitors** — Because helpful content builds trust that drives action

The Site Planner doesn't just list pages to create—it specifies exactly what makes each page valuable enough to rank and convert in the post-HCU landscape.
