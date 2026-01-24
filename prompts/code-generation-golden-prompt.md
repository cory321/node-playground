# Code Generation Node Golden Prompt

> **Single Job:** Transform upstream workflow outputs into a complete, deployable Next.js (App Router) website — fully schema-driven, production-quality, and deterministic.

---

## Mission

The Code Generation Node produces a **complete Next.js codebase** from upstream node outputs. It is the final step in the workflow pipeline, taking structured data and generating actual files that can be deployed to Vercel.

### Core Principles

1. **Schema-Driven** — All routing, content, and styling come from upstream nodes
2. **Planner-First** — Site Planner output is the sole source of routing truth
3. **Production-Quality** — No TODOs, no placeholders, `next build` must pass
4. **Deterministic** — Same inputs always produce identical output file trees
5. **Category-Agnostic** — Never hardcode cities, services, or business types

---

## 2026 Context: Why This Matters

The generated sites must satisfy Google's quality standards:

- **Helpful Content Update** — Every page must have genuine value, not templated filler
- **E-E-A-T Compliance** — Experience, Expertise, Authority, Trust signals baked into components
- **Anti-Thin Content** — Local context injection, unique data points, not city-name-swapped templates
- **Schema.org Markup** — JSON-LD structured data for every page type

The generator doesn't create content — it assembles pre-generated, validated content into a working website.

---

## Node Architecture

### Input Ports

| Port               | Source Node                 | Type                         | Description                                                        |
| ------------------ | --------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| `sitePlan`         | Site Planner Node           | `SitePlannerOutput`          | Routes, brand identity, page inventory, local knowledge, providers |
| `seoPackage`       | SEO Optimization Node       | `SEOOptimizedPackage`        | Meta tags, schema markup, internal links per page                  |
| `brandDesign`      | Brand Design Node           | `BrandDesignOutput`          | Design tokens, section composition, component styles               |
| `editorialContent` | Editorial Content Generator | `GeneratedEditorialContent`  | Service pages, guides, about content                               |
| `providerProfiles` | Provider Profile Generator  | `GeneratedProviderProfile[]` | Individual provider profile content                                |
| `comparisonData`   | Comparison Data Node        | `GeneratedComparisonData`    | Comparison tables, pricing pages, market stats                     |

### Output Port

| Port                | Type                | Description                             |
| ------------------- | ------------------- | --------------------------------------- |
| `generatedCodebase` | `GeneratedCodebase` | Complete file tree ready for deployment |

---

## Input Type Definitions

All types are defined in `src/types/`. The generator must import and use these exact interfaces.

### SitePlannerOutput (from `src/types/sitePlanner.ts`)

```typescript
interface SitePlannerOutput {
	// Brand Identity
	brand: {
		name: string; // "Phoenix Garage Door Guide"
		tagline: string; // "Your trusted local resource"
		domain: string; // "phoenixgaragedoorguide.com"
		voiceTone: {
			personality: string[]; // ["helpful", "local", "straightforward"]
			dos: string[]; // ["Use neighborhood names", "Be specific"]
			donts: string[]; // ["No hype", "No fake urgency"]
		};
	};

	// Site Structure
	structure: {
		baseUrl: string; // "https://phoenixgaragedoorguide.com"
		urlPatterns: Record<PageType, string>;
	};

	// Page Inventory (Core deliverable - routing source of truth)
	pages: PageBrief[];

	// Content Organization
	contentClusters: ContentCluster[];

	// Internal Linking Rules
	internalLinking: { rules: InternalLinkingRule[] };

	// Build Order
	launchPhases: LaunchPhase[];

	// PASS-THROUGH DATA (critical for generation)
	localKnowledge: LocalKnowledgeOutput; // Regional context for content injection
	providers: EnrichedProvider[]; // Provider data for profile pages

	// Metadata
	meta: {
		generatedAt: string;
		depth: 'mvp' | 'standard' | 'comprehensive';
		pageCount: number;
		city: string;
		state: string;
		category: string;
	};
}

// PageBrief - defines each page to generate
interface PageBrief {
	id: string; // "city-phoenix-garage-door-repair"
	type: PageType; // "city_service"
	url: string; // "/phoenix/garage-door-repair"
	priority: 1 | 2 | 3; // Launch phase

	seo: {
		titleTemplate: string;
		descriptionTemplate: string;
		primaryKeyword: string;
		secondaryKeywords: string[];
	};

	content: {
		purpose: string;
		targetWordCount: number;
		requiredSections: string[];
		localMentionsMin: number;
		eeat: EEATRequirements;
		uniqueValue: UniqueValueRequirements;
	};

	reviews?: ReviewRequirements;
	data: PageDataRequirements;
	internalLinks: { required: InternalLinkRequirement[] };
	schema: string[]; // ["LocalBusiness", "FAQPage"]
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

### SEOOptimizedPackage (from `src/types/seoPackage.ts`)

```typescript
interface SEOOptimizedPackage {
	pages: SEOOptimizedPage[]; // Per-page SEO data

	siteWide: {
		organizationSchema: Record<string, unknown>;
		websiteSchema: Record<string, unknown>;
		sitemap: { xml: string; urls: SitemapUrl[] };
		robotsTxt: string;
	};

	validation: PageValidation;
	stats: SEOPackageStats;
	generatedAt: string;
}

interface SEOOptimizedPage {
	pageId: string; // Matches PageBrief.id
	url: string;
	type: string;

	meta: {
		title: string;
		titleLength: number;
		description: string;
		descriptionLength: number;
		canonical: string;
		robots: string;
		openGraph: OpenGraphMeta;
		twitter: TwitterMeta;
		geo?: GeoMeta;
	};

	schema: SchemaMarkup[]; // JSON-LD schemas to inject
	headings: HeadingStructure;
	internalLinks: InternalLink[];
	externalLinks: ExternalLink[];
	breadcrumbs: Breadcrumb[];

	seoScore: number;
	issues: SEOIssue[];
	suggestions: string[];
}
```

### BrandDesignOutput (from `src/types/brandDesign.ts`)

```typescript
interface BrandDesignOutput {
	screenshot: {
		url: string;
		aspectRatio?: string;
	};

	designSystem: {
		colors: ColorPalette;
		typography: Typography;
		spacing: Spacing;
		components: ComponentStyles;
		sections: SectionStyle[]; // Homepage section composition
		effects?: VisualEffects;
	};

	tailwindConfig: TailwindConfig; // Generated Tailwind configuration
	meta: ExtractionMeta;
}

// Section composition for homepage (ORDER MATTERS)
interface SectionStyle {
	name: string; // "Hero", "Services", "Testimonials"
	index: number; // Render order
	background: string;
	padding?: string;
	layout?: string;
	textAlignment?: 'left' | 'center' | 'right';
	hasPattern?: boolean;
	patternDescription?: string;
}

interface ColorPalette {
	primary: ColorToken;
	secondary?: ColorToken;
	accent?: ColorToken;
	backgrounds: {
		main: string;
		section?: string;
		card?: string;
		footer?: string;
	};
	text: {
		primary: string;
		secondary?: string;
		muted?: string;
		inverse?: string;
	};
	semantic?: {
		success?: string;
		warning?: string;
		error?: string;
		info?: string;
	};
}

interface Typography {
	fontFamily: {
		heading: FontFamily;
		body: FontFamily;
	};
	scale: {
		h1: string;
		h2: string;
		h3: string;
		h4?: string;
		body: string;
		small?: string;
	};
	lineHeight?: { tight?: string; normal?: string; relaxed?: string };
}
```

### GeneratedEditorialContent (from `src/types/editorialContent.ts`)

```typescript
interface GeneratedEditorialContent {
	pages: GeneratedContentPage[];
	totalWordCount: number;
	totalLocalReferences: number;
	generatedAt: string;
}

interface GeneratedContentPage {
	pageId: string; // Matches PageBrief.id
	type: EditorialPageType;
	url: string;

	seo: EditorialSEO;

	content: {
		headline: string; // H1
		author: ContentAuthor;
		metadata: ContentMetadata;
		tableOfContents: string[];
		introduction: string; // 100-200 words
		sections: ContentSection[];
		keyTakeaways: string[]; // 3-5 bullet summary
		faq: FAQItem[];
		callToAction: CallToAction;
		sources?: ContentSource[];
	};

	schema: EditorialSchema;
	internalLinks: EditorialInternalLink[];
	images: EditorialImage[];

	wordCount: number;
	localReferences: string[];
	qualityScore: number;
}

type EditorialPageType =
	| 'service_page'
	| 'city_service_page'
	| 'cost_guide'
	| 'troubleshooting'
	| 'buying_guide'
	| 'diy_guide'
	| 'local_expertise'
	| 'about'
	| 'methodology';
```

### GeneratedProviderProfile (from `src/types/generatedProfile.ts`)

```typescript
interface GeneratedProviderProfile {
	providerId: string;
	pageId: string; // Matches PageBrief.id
	url: string;

	seo: ProfileSEO;

	content: {
		headline: string; // H1
		introduction: string; // 100-150 words

		trustScore: TrustScoreSection;
		contactSection: ContactSection;
		servicesSection: ServicesSection;
		credentialsSection: CredentialsSection;

		// KEY DIFFERENTIATOR - Editorial assessment
		ourTake: {
			heading: string; // "Our Assessment"
			assessment: string; // 150-200 words editorial
			strengths: string[]; // 2-3 bullet points
			considerations: string[]; // 1-2 bullet points (honest)
			bestFor: string; // "Best for homeowners who..."
			pricePosition: string; // "Mid-range pricing for the area"
			byline: EditorialByline;
		};

		serviceAreaSection: ServiceAreaSection;
		faq: FAQItem[]; // 3-5 provider-specific
		comparison: ComparisonSection;
	};

	schema: ProfileSchema;
	internalLinks: InternalLink[];
	wordCount: number;
	localReferences: string[];
	generatedAt: string;
}
```

### GeneratedComparisonData (from `src/types/comparisonPage.ts`)

```typescript
interface GeneratedComparisonData {
	comparisonPages: ComparisonPage[];
	pricingPages: PricingPage[];
	marketStats: MarketStatistics;
	generatedAt: string;
}

interface ComparisonPage {
	pageId: string;
	city: string;
	url: string;
	seo: ComparisonPageSEO;

	content: {
		headline: string;
		introduction: string;
		lastUpdated: string;
		methodology: string;
		comparisonTable: ComparisonTable;
		winners: Winner[]; // "Best Overall", "Best Value", etc.
		detailedComparisons: DetailedComparison[];
		howWeCompared: string; // 200-300 words methodology
		faq: FAQItem[];
	};

	schema: ComparisonPageSchema;
	internalLinks: InternalLink[];
}

interface PricingPage {
	pageId: string;
	serviceType: string;
	url: string;
	seo: PricingPageSEO;

	content: {
		headline: string;
		quickAnswer: QuickAnswerPricing;
		priceTable: PriceTable;
		cityComparison: CityPriceComparison[];
		costFactors: CostFactor[];
		realExamples: RealPriceExample[];
		savingTips: string[];
		redFlags: string[];
		methodology: string;
	};

	schema: Record<string, unknown>;
}
```

### LocalKnowledgeOutput (from `src/types/localKnowledge.ts`)

```typescript
interface LocalKnowledgeOutput {
	contentHooks: {
		localPhrases: string[]; // ["Valley", "Maricopa County", ...]
		neighborhoodNames: string[]; // Specific areas to reference
		climateContext: string[]; // "Arizona heat", "monsoon season"
		categorySpecificIssues: string[]; // Problems specific to this location
	};

	marketContext: {
		pricePosition: string; // "15% below Phoenix metro average"
		competitionLevel: string;
		seasonalPatterns: string[];
	};

	regionalIdentity: {
		region: string; // "Greater Phoenix", "Bay Area"
		characterization: string; // "desert community", "tech hub"
		nearbyReference: string; // "20 minutes from downtown Phoenix"
	};

	meta: {
		city: string;
		state: string;
		category: string;
		confidence: number;
		generatedAt: string;
		cached: boolean;
	};
}
```

### EnrichedProvider (from `src/types/enrichedProvider.ts`)

```typescript
interface EnrichedProvider extends ProviderData {
	enrichment: {
		services: string[];
		serviceDescriptions: Record<string, string>;
		pricing: {
			listed: Array<{ service: string; price: string }>;
			freeEstimates: boolean;
			financing: boolean;
		};
		about: {
			companyStory: string | null;
			yearEstablished: number | null;
			ownerName: string | null;
			teamSize: string | null;
		};
		credentials: {
			licenseNumbers: string[];
			certifications: string[];
			insuranceMentioned: boolean;
			associations: string[];
		};
		serviceArea: string[];
		hours: Record<string, string> | null;
		emergencyService: boolean;
		brands: string[];
		testimonials: Array<{ text: string; author?: string }>;
		images: {
			logo: string | null;
			teamPhotos: string[];
			workPhotos: string[];
		};
		socialLinks: Record<string, string>;
		lastScraped: string;
		scrapingConfidence: number;
		scrapingError: string | null;
	};
}
```

---

## Output Structure

### GeneratedCodebase Type

```typescript
interface GeneratedCodebase {
	files: GeneratedFile[];
	metadata: {
		generatedAt: string;
		totalFiles: number;
		totalBytes: number;
		buildCommand: string; // "npm run build"
		deployTarget: 'vercel';
	};
}

interface GeneratedFile {
	path: string; // "src/app/page.tsx"
	content: string; // File contents
	type: 'component' | 'page' | 'layout' | 'config' | 'style' | 'data' | 'lib';
	encoding: 'utf-8';
}
```

### File Tree Structure

```
generated-site/
├── src/
│   ├── app/                        # All routes from SitePlan.pages
│   │   ├── layout.tsx              # Root layout with SiteShell
│   │   ├── page.tsx                # Homepage
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── how-we-vet-providers/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── disclosure/page.tsx
│   │   ├── [service-slug]/
│   │   │   ├── page.tsx            # Service hub
│   │   │   └── cost-guide/page.tsx
│   │   ├── [city]/
│   │   │   ├── [service-slug]/page.tsx
│   │   │   ├── providers/page.tsx
│   │   │   └── compare-providers/page.tsx
│   │   ├── providers/
│   │   │   └── [provider-slug]/page.tsx
│   │   ├── guides/
│   │   │   └── [topic-slug]/page.tsx
│   │   ├── sitemap.ts              # Dynamic sitemap generation
│   │   └── robots.ts               # Dynamic robots.txt
│   │
│   ├── components/
│   │   ├── ui/                     # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Input.tsx
│   │   ├── layout/                 # Layout components
│   │   │   ├── SiteShell.tsx       # Header + Footer wrapper
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Breadcrumbs.tsx
│   │   ├── sections/               # Homepage section components
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ServicesSection.tsx
│   │   │   ├── TestimonialsSection.tsx
│   │   │   ├── TrustIndicatorsSection.tsx
│   │   │   ├── ServiceAreaSection.tsx
│   │   │   └── CTASection.tsx
│   │   ├── entities/               # Entity display components
│   │   │   ├── ProviderCard.tsx
│   │   │   ├── ProviderList.tsx
│   │   │   ├── ComparisonTable.tsx
│   │   │   └── PriceTable.tsx
│   │   └── content/                # Content display components
│   │       ├── ArticleContent.tsx
│   │       ├── FAQSection.tsx
│   │       ├── TableOfContents.tsx
│   │       └── AuthorByline.tsx
│   │
│   ├── lib/
│   │   ├── data/                   # Data accessors
│   │   │   ├── sitePlan.ts
│   │   │   ├── providers.ts
│   │   │   ├── editorial.ts
│   │   │   ├── comparisons.ts
│   │   │   └── seo.ts
│   │   ├── types/                  # TypeScript types
│   │   │   ├── index.ts
│   │   │   └── generated.ts
│   │   ├── seo/                    # SEO utilities
│   │   │   ├── generateMetadata.ts
│   │   │   └── jsonLd.ts
│   │   └── schema/                 # Schema.org generators
│   │       ├── localBusiness.ts
│   │       ├── article.ts
│   │       ├── faqPage.ts
│   │       └── breadcrumbList.ts
│   │
│   └── styles/
│       └── tokens.css              # CSS custom properties from brand tokens
│
├── public/
│   └── data/                       # Static JSON data files
│       ├── sitePlan.json
│       ├── providers.json
│       ├── editorial.json
│       ├── comparisons.json
│       └── seo.json
│
├── tailwind.config.js              # Generated from brandDesign.tailwindConfig
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## Generation Rules

### 1. Routing Rules (Planner-First)

The generator MUST:

- **Treat `sitePlan.pages` as the sole source of routing truth**
- **Never hardcode page paths** — derive from `PageBrief.url`
- **Generate filesystem paths from URL patterns** — `/phoenix/repair` → `src/app/phoenix/repair/page.tsx`
- **Use dynamic route segments** — `[city]`, `[provider-slug]`, etc.

```typescript
// CORRECT: Derive routes from sitePlan
function generateRoutes(sitePlan: SitePlannerOutput): GeneratedFile[] {
	return sitePlan.pages.map((page) => ({
		path: urlToFilePath(page.url), // "/phoenix/repair" → "src/app/phoenix/repair/page.tsx"
		content: generatePageContent(page),
		type: 'page',
	}));
}

// WRONG: Hardcoded routes
const routes = [
	'/phoenix/garage-door-repair', // ❌ Never hardcode
	'/scottsdale/garage-door-repair', // ❌ Comes from sitePlan.pages
];
```

### 2. Static Generation with generateStaticParams

For dynamic routes, generate `generateStaticParams()` from sitePlan data:

```typescript
// src/app/[city]/[service-slug]/page.tsx
export async function generateStaticParams() {
	const sitePlan = await getSitePlan();

	return sitePlan.pages
		.filter((page) => page.type === 'city_service')
		.map((page) => {
			const [city, service] = page.url.split('/').filter(Boolean);
			return { city, 'service-slug': service };
		});
}
```

### 3. Metadata Generation

Every page exports `generateMetadata()` using SEO package data:

```typescript
// src/app/[city]/providers/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
	const seoData = await getSEOForPage(`provider-listing-${params.city}`);

	return {
		title: seoData.meta.title,
		description: seoData.meta.description,
		alternates: { canonical: seoData.meta.canonical },
		openGraph: seoData.meta.openGraph,
		twitter: seoData.meta.twitter,
		robots: seoData.meta.robots,
	};
}
```

### 4. Brand Token Generation

Generate CSS custom properties and Tailwind config from `brandDesign`:

```css
/* src/styles/tokens.css */
:root {
	--color-primary: #2563eb;
	--color-secondary: #64748b;
	--color-background-main: #ffffff;
	--color-background-section: #f8fafc;
	--color-text-primary: #0f172a;
	--color-text-secondary: #475569;

	--font-heading: 'Inter', sans-serif;
	--font-body: 'Inter', sans-serif;

	--spacing-section-y: 5rem;
	--spacing-content-max: 1280px;

	--radius-sm: 0.25rem;
	--radius-md: 0.5rem;
	--radius-lg: 1rem;
}
```

```javascript
// tailwind.config.js
module.exports = {
	theme: {
		extend: {
			colors: {
				primary: 'var(--color-primary)',
				secondary: 'var(--color-secondary)',
				// ... from brandDesign.tailwindConfig
			},
			fontFamily: {
				heading: ['var(--font-heading)'],
				body: ['var(--font-body)'],
			},
		},
	},
};
```

### 5. Homepage Section Composition

Homepage sections render in order from `brandDesign.designSystem.sections`:

```typescript
// src/app/page.tsx
export default async function HomePage() {
  const brandDesign = await getBrandDesign();
  const sitePlan = await getSitePlan();
  const homepageContent = await getEditorialPage('homepage');

  return (
    <main>
      {brandDesign.designSystem.sections
        .sort((a, b) => a.index - b.index)
        .map(section => (
          <Section key={section.name} style={section}>
            {renderSectionContent(section.name, homepageContent)}
          </Section>
        ))}
    </main>
  );
}

function renderSectionContent(sectionName: string, content: GeneratedContentPage) {
  switch (sectionName) {
    case 'Hero':
      return <HeroSection content={content} />;
    case 'Services':
      return <ServicesSection content={content} />;
    case 'Testimonials':
      return <TestimonialsSection content={content} />;
    // ... map all section types
  }
}
```

### 6. Content Page Rendering

Each page type has a dedicated renderer that receives normalized data:

```typescript
// Page renderers receive typed content
interface PageRendererProps<T> {
  pageId: string;
  seo: SEOOptimizedPage;
  content: T;
  localKnowledge: LocalKnowledgeOutput;
  brandDesign: BrandDesignOutput;
}

// Example: Provider Profile Page
function ProviderProfilePage({
  pageId,
  seo,
  content,
  localKnowledge,
  brandDesign,
}: PageRendererProps<GeneratedProviderProfile>) {
  return (
    <>
      <JsonLd schema={seo.schema} />
      <Breadcrumbs items={seo.breadcrumbs} />

      <article>
        <h1>{content.content.headline}</h1>
        <TrustScoreBadge score={content.content.trustScore} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Introduction text={content.content.introduction} />
            <OurTakeSection ourTake={content.content.ourTake} />
            <ServicesSection services={content.content.servicesSection} />
            <CredentialsSection credentials={content.content.credentialsSection} />
          </div>

          <aside>
            <ContactCard contact={content.content.contactSection} />
            <ServiceAreaMap areas={content.content.serviceAreaSection} />
          </aside>
        </div>

        <FAQSection faqs={content.content.faq} />
        <ComparisonContext comparison={content.content.comparison} />
      </article>
    </>
  );
}
```

### 7. JSON-LD Schema Injection

Every page injects appropriate schema from SEO package:

```typescript
// src/lib/seo/jsonLd.tsx
export function JsonLd({ schemas }: { schemas: SchemaMarkup[] }) {
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema.json) }}
        />
      ))}
    </>
  );
}

// Usage in page
<JsonLd schemas={seoData.schema} />
```

### 8. Local Knowledge Injection

Content components inject local context from `localKnowledge.contentHooks`:

```typescript
// Components can reference local context
function ServiceAreaSection({ baseContent, localKnowledge }) {
  return (
    <section>
      <h2>Serving {localKnowledge.meta.city} and Surrounding Areas</h2>
      <p>
        Located in the {localKnowledge.regionalIdentity.region},
        {localKnowledge.regionalIdentity.nearbyReference}.
      </p>
      <ul>
        {localKnowledge.contentHooks.neighborhoodNames.map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </section>
  );
}
```

---

## Page Type to Renderer Mapping

| PageType           | Renderer Component        | Content Source                                      |
| ------------------ | ------------------------- | --------------------------------------------------- |
| `homepage`         | `HomePageRenderer`        | `editorialContent` + `brandDesign.sections`         |
| `about`            | `AboutPageRenderer`       | `editorialContent`                                  |
| `methodology`      | `MethodologyPageRenderer` | `editorialContent`                                  |
| `contact`          | `ContactPageRenderer`     | `sitePlan.brand`                                    |
| `legal`            | `LegalPageRenderer`       | Static templates                                    |
| `service_hub`      | `ServiceHubRenderer`      | `editorialContent`                                  |
| `service_detail`   | `ServiceDetailRenderer`   | `editorialContent`                                  |
| `city_service`     | `CityServiceRenderer`     | `editorialContent`                                  |
| `provider_listing` | `ProviderListingRenderer` | `providerProfiles` + `comparisonData`               |
| `provider_profile` | `ProviderProfileRenderer` | `providerProfiles`                                  |
| `comparison`       | `ComparisonPageRenderer`  | `comparisonData`                                    |
| `cost_guide`       | `CostGuideRenderer`       | `editorialContent` OR `comparisonData.pricingPages` |
| `troubleshooting`  | `TroubleshootingRenderer` | `editorialContent`                                  |

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CODE GENERATION NODE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────┐    ┌──────────────────────────────────────────┐  │
│  │   sitePlan    │───▶│  ROUTE GENERATOR                         │  │
│  │               │    │  - Parse sitePlan.pages                  │  │
│  │  (includes:   │    │  - Generate src/app/ structure           │  │
│  │   localKnow.  │    │  - Create generateStaticParams()         │  │
│  │   providers)  │    └──────────────────────────────────────────┘  │
│  └───────────────┘                                                   │
│                                                                      │
│  ┌───────────────┐    ┌──────────────────────────────────────────┐  │
│  │  seoPackage   │───▶│  SEO INJECTOR                            │  │
│  │               │    │  - Generate generateMetadata() per page  │  │
│  │               │    │  - Inject JSON-LD schemas                │  │
│  │               │    │  - Generate sitemap.ts, robots.ts        │  │
│  └───────────────┘    └──────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────┐    ┌──────────────────────────────────────────┐  │
│  │  brandDesign  │───▶│  STYLE GENERATOR                         │  │
│  │               │    │  - Generate tokens.css                   │  │
│  │               │    │  - Generate tailwind.config.js           │  │
│  │               │    │  - Generate UI components with styles    │  │
│  └───────────────┘    └──────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────┐                                                   │
│  │  editorial    │───▶│                                              │
│  ├───────────────┤    │  ┌──────────────────────────────────────┐  │
│  │  profiles     │───▶│  │  CONTENT ASSEMBLER                   │  │
│  ├───────────────┤    │  │  - Match content to pages by pageId  │  │
│  │  comparison   │───▶│  │  - Render through typed renderers    │  │
│  └───────────────┘    │  │  - Inject local knowledge hooks      │  │
│                       │  └──────────────────────────────────────┘  │
│                                                                      │
│                       ┌──────────────────────────────────────────┐  │
│                       │  FILE GENERATOR                          │  │
│                       │  - Combine all generators                │  │
│                       │  - Output GeneratedCodebase              │  │
│                       └──────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Files to Create

### 1. Node Component

Create: `src/components/nodes/CodeGenerationNode/CodeGenerationNode.tsx`

Follow the pattern from `ComparisonDataNode.tsx`:

- Multi-input ports for each input type
- Progress indicator showing files generated
- File tree preview
- Code preview with syntax highlighting
- Export options (files / zip / GitHub)

### 2. Node Data Type

Add to `src/types/nodes.ts`:

```typescript
export const NODE_TYPES = {
	// ... existing types
	CODE_GENERATION: 'code-generation',
} as const;

export interface CodeGenerationProgress {
	phase:
		| 'preparing'
		| 'routing'
		| 'styling'
		| 'content'
		| 'assembling'
		| 'validating'
		| 'complete';
	currentFile: string | null;
	filesGenerated: number;
	totalFiles: number;
	bytesGenerated: number;
}

export interface CodeGenerationNodeData extends BaseNodeData {
	type: 'code-generation';

	// Input tracking
	inputHasSitePlan: boolean;
	inputHasSEO: boolean;
	inputHasBrandDesign: boolean;
	inputHasEditorial: boolean;
	inputHasProfiles: boolean;
	inputHasComparison: boolean;

	// Configuration
	outputFormat: 'files' | 'zip';
	includeReadme: boolean;

	// Progress
	progress: CodeGenerationProgress;

	// Output
	output: GeneratedCodebase | null;
	lastGeneratedAt: number | null;

	// Status
	status: NodeStatus;
	error: string | null;
}
```

### 3. Generation Hook

Create: `src/hooks/useCodeGenerator.ts`

Follow the pattern from `useComparisonDataGenerator.ts`:

- Accept all inputs
- Provide progress callbacks
- Support abort/cancel
- Return generated codebase

### 4. Generation Service

Create: `src/services/codeGeneration/index.ts`

```typescript
export interface CodeGenInputs {
	sitePlan: SitePlannerOutput;
	seoPackage: SEOOptimizedPackage;
	brandDesign: BrandDesignOutput;
	editorialContent: GeneratedEditorialContent;
	providerProfiles: GeneratedProviderProfile[];
	comparisonData: GeneratedComparisonData;
}

export interface CodeGenOptions {
	onProgress?: (progress: CodeGenerationProgress) => void;
	abortSignal?: AbortSignal;
}

export async function generateNextjsSite(
	inputs: CodeGenInputs,
	options?: CodeGenOptions,
): Promise<GeneratedCodebase> {
	// 1. Validate inputs
	validateInputs(inputs);

	// 2. Generate routes from sitePlan
	const routes = await generateRoutes(inputs.sitePlan, options);

	// 3. Generate styles from brandDesign
	const styles = await generateStyles(inputs.brandDesign, options);

	// 4. Generate pages with content
	const pages = await generatePages(inputs, options);

	// 5. Generate config files
	const configs = await generateConfigs(inputs, options);

	// 6. Generate data files
	const data = await generateDataFiles(inputs, options);

	// 7. Assemble final codebase
	return assembleCodebase([
		...routes,
		...styles,
		...pages,
		...configs,
		...data,
	]);
}
```

### 5. Sub-Generators

Create in `src/services/codeGeneration/generators/`:

```
generators/
├── routes.ts           # File path generation from sitePlan.pages
├── styles.ts           # tokens.css and tailwind.config.js
├── layouts.ts          # Root layout, SiteShell, Header, Footer
├── pages/
│   ├── homepage.ts
│   ├── about.ts
│   ├── serviceHub.ts
│   ├── cityService.ts
│   ├── providerListing.ts
│   ├── providerProfile.ts
│   ├── comparison.ts
│   ├── costGuide.ts
│   ├── troubleshooting.ts
│   └── legal.ts
├── components/
│   ├── ui.ts           # Button, Card, Badge, etc.
│   ├── sections.ts     # Homepage sections
│   └── entities.ts     # ProviderCard, ComparisonTable, etc.
├── seo.ts              # sitemap.ts, robots.ts, metadata utilities
├── data.ts             # JSON data file generation
└── config.ts           # package.json, tsconfig.json, next.config.js
```

---

## Non-Negotiables

### Must Do

1. ✅ All routes derived from `sitePlan.pages` — never hardcode
2. ✅ All styles derived from `brandDesign` — no arbitrary colors
3. ✅ All SEO from `seoPackage` — generateMetadata() on every page
4. ✅ All content from upstream generators — no placeholder text
5. ✅ Deterministic output — same inputs = same file tree
6. ✅ TypeScript strict mode — no type errors
7. ✅ `next build` must pass — no runtime errors
8. ✅ Graceful handling of missing data — fallbacks, not crashes

### Must Not Do

1. ❌ Never hardcode city names, service types, or categories
2. ❌ Never generate TODO comments or placeholder content
3. ❌ Never create pages not in sitePlan.pages
4. ❌ Never use colors not in brandDesign.designSystem.colors
5. ❌ Never skip SEO metadata injection
6. ❌ Never omit JSON-LD schema on pages that require it

---

## UI Requirements for Node

### Input Status Display

Show connection and data status for each input port:

```
┌─────────────────────────────────────────┐
│  🔧 Code Generation                      │
├─────────────────────────────────────────┤
│                                          │
│  Inputs:                                 │
│  ● Site Plan ........... ✓ 45 pages     │
│  ● SEO Package ......... ✓ 45 pages     │
│  ● Brand Design ........ ✓ tokens ready │
│  ● Editorial ........... ✓ 12 articles  │
│  ● Provider Profiles ... ✓ 8 profiles   │
│  ● Comparison Data ..... ✓ 3 cities     │
│                                          │
│  [▶ Generate Site]                       │
│                                          │
└─────────────────────────────────────────┘
```

### Progress Display

During generation:

```
┌─────────────────────────────────────────┐
│  🔧 Code Generation                      │
├─────────────────────────────────────────┤
│                                          │
│  ████████████░░░░░░░░░░░ 52%            │
│                                          │
│  Phase: Generating pages                 │
│  Current: src/app/phoenix/repair/page   │
│  Files: 34 / 65                         │
│  Size: 124 KB                           │
│                                          │
│  [■ Cancel]                              │
│                                          │
└─────────────────────────────────────────┘
```

### Results Display

After generation:

```
┌─────────────────────────────────────────┐
│  🔧 Code Generation                      │
├─────────────────────────────────────────┤
│                                          │
│  ✓ Generation Complete                   │
│                                          │
│  65 files • 248 KB                      │
│                                          │
│  📁 File Tree          📄 Preview        │
│  ├── src/                               │
│  │   ├── app/                           │
│  │   │   ├── page.tsx                   │
│  │   │   ├── about/                     │
│  │   │   └── ...                        │
│  │   ├── components/                    │
│  │   └── lib/                           │
│  ├── tailwind.config.js                 │
│  └── package.json                       │
│                                          │
│  [📥 Download ZIP] [🐙 Push to GitHub]  │
│                                          │
└─────────────────────────────────────────┘
```

---

## Testing Requirements

### Build Validation

The generated site must pass:

```bash
cd generated-site
npm install
npm run build    # Must exit 0
npm run lint     # Must exit 0
```

### Content Validation

Every page must have:

- Non-empty `<title>`
- Non-empty meta description
- Exactly one `<h1>`
- At least one JSON-LD schema
- Breadcrumb navigation (except homepage)

### Route Validation

Every `sitePlan.pages[].url` must have a corresponding generated file.

---

## Example: Full Generation Flow

Given inputs for "Phoenix Garage Door" with 3 cities and 10 providers:

**Input Counts:**

- sitePlan.pages: 45 pages
- seoPackage.pages: 45 SEO configs
- brandDesign.designSystem.sections: 6 sections
- editorialContent.pages: 12 articles
- providerProfiles: 10 profiles
- comparisonData.comparisonPages: 3 pages

**Output:**

```
generated-site/
├── src/
│   ├── app/                    # 45 page files
│   ├── components/             # ~25 component files
│   └── lib/                    # ~15 utility files
├── public/data/                # 5 JSON files
├── tailwind.config.js
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md

Total: ~95 files, ~300 KB
Build time: < 30 seconds
```

---

## Summary

The Code Generation Node transforms upstream workflow outputs into a complete, deployable Next.js website:

1. **Routes** from Site Planner's page inventory
2. **Styles** from Brand Design's token system
3. **SEO** from SEO Optimization Package
4. **Content** from Editorial, Profile, and Comparison generators
5. **Local context** from Local Knowledge pass-through

The output is production-ready:

- No TODOs or placeholders
- TypeScript strict mode
- `next build` passes
- All SEO and schema requirements met
- Deterministic and reproducible

---

## Files to Implement

| Priority | File                                                             | Purpose                 |
| -------- | ---------------------------------------------------------------- | ----------------------- |
| 1        | `src/types/codeGeneration.ts`                                    | Type definitions        |
| 2        | `src/components/nodes/CodeGenerationNode/CodeGenerationNode.tsx` | Node UI                 |
| 3        | `src/components/nodes/CodeGenerationNode/MultiInputPort.tsx`     | Input port handling     |
| 4        | `src/components/nodes/CodeGenerationNode/FileTreePreview.tsx`    | Output preview          |
| 5        | `src/components/nodes/CodeGenerationNode/CodePreview.tsx`        | Syntax-highlighted code |
| 6        | `src/hooks/useCodeGenerator.ts`                                  | Generation hook         |
| 7        | `src/services/codeGeneration/index.ts`                           | Main generator          |
| 8        | `src/services/codeGeneration/generators/*.ts`                    | Sub-generators          |
| 9        | `src/services/codeGeneration/templates/*.ts`                     | File templates          |
| 10       | Update `src/types/nodes.ts`                                      | Add node type           |
| 11       | Update node registry and Canvas                                  | Register new node       |
