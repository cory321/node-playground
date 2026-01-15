# Node Builder: Local Service Lead Generation Platform

## Executive Summary

This is a **visual node-based workflow builder** designed specifically for **local service market research and lead generation**. It allows users to analyze geographic markets (cities/regions), identify lucrative home service niches (like garage door repair, appliance repair, etc.), discover local providers who could become clients, and route data through a flexible node-based canvas system.

The application is built with React, TypeScript, Vite, Tailwind CSS, and integrates with multiple APIs including Supabase (for persistence/caching/edge functions), SerpAPI (for Google search data), the US Census Bureau (for demographics), and LLM providers (Anthropic Claude, Google Gemini, OpenAI).

---

## Core Architecture

### 1. Visual Node-Based Canvas System

The application implements an **infinite canvas** with pan/zoom capabilities where users can place, connect, resize, and manipulate specialized nodes. Key architectural components:

- **Canvas Transform**: Pan (x, y) and zoom (scale) with scroll/trackpad gestures
- **Node Connections**: Visual connection lines between nodes with support for single-port and multi-port connections
- **Drag & Resize**: Interactive node positioning and resizing with minimum size constraints
- **Persistence**: Save/load workflows to Supabase cloud or export/import as JSON files

### 2. Node Type Registry

Six node types are registered in `src/components/nodes/registry.ts`:

| Node Type | Purpose | Ports |
|-----------|---------|-------|
| **LLM Node** | Send prompts to AI models (Claude, GPT, Gemini) | Input + Output |
| **Output Node** | Display results from upstream nodes | Input only |
| **Location Node** | Geographic picker with interactive map | Output only |
| **Deep Research Node** | Analyze market opportunities via SERP data | Input + Output |
| **Category Selector Node** | Fan-out categories to multiple providers | Input + Multi-Output |
| **Provider Discovery Node** | Find and score local service providers | Input + Output |

---

## Domain-Specific Functionality

### 1. Location Node (`LocationNode.tsx`)

An interactive location picker with:
- **OpenStreetMap Integration**: Leaflet-based map with search (Nominatim API)
- **Geographic Selection**: Two tool modes - pan/move or click-to-select regions
- **GeoJSON Boundaries**: Visual region outlines when a location is selected
- **US Census Integration**: Automatic demographic data fetch for US locations
  - Population
  - Median household income
  - Homeownership rate
  - Median home value
- **Scorecard System**: Market quality scoring based on demographics
- **Suburb Suggestions**: For major metros, suggests nearby suburbs with better economics
- **Location Comparison**: Add locations to a comparison panel for side-by-side analysis

### 2. Deep Research Node (`DeepResearchNode.tsx` + `useDeepResearch.ts`)

The heart of the market research functionality:

#### Scan Modes
- **Triage Scan**: Single "home services near me" search to quickly assess market viability
- **Full Scan**: Multi-category analysis based on city profile

#### Category Tiers System (`src/api/serp/tiers.ts`)

A sophisticated tiered category system with ~800 lines of market intelligence:

**Tier 1 (Always Scan):**
- Garage door repair
- Appliance repair
- Junk removal
- Emergency plumber
- Locksmith
- Water damage restoration

**Tier 2 (Market-Conditional):**
- Based on city profile detection (coastal, retirement community, high income, college town, tourism hub)
- Examples: vacation rental cleaning (coastal), senior home care (retirement), pool service (high income)

**Tier 3 (Deep Dive Expansions):**
- Sub-categories for high-scoring Tier 1 categories
- Example: "appliance repair" expands to refrigerator, washer, dryer, dishwasher, oven, freezer repair

**Conditional Categories:**
- HVAC repair, roofing, house cleaning - only viable when market signals indicate low competition

#### SERP Analysis

For each category search, the system extracts and analyzes:
- **LSA Presence**: Google Local Services Ads indicate proven market
- **Ad Count**: Competition signal
- **Local Pack**: Number of map pack results
- **Aggregator Dominance**: Yelp, Angi, Thumbtack positions in organic results
- **Top Organic Domains**: Quality of ranking sites

Results are analyzed by Claude (with heuristic fallback) to produce:
- SERP Quality score (Weak/Medium/Strong)
- Competition level
- Lead value estimate
- Urgency assessment
- Final verdict (✅ strong, ⚠️ maybe, ❌ skip)

#### City Profile Detection

Analyzes demographics to detect market characteristics:
- High income ($100K+ median)
- Coastal location (by lat/lng proximity)
- Retirement community (population size + high homeownership)
- College town, tourism hub (heuristics)

### 3. Category Selector Node (`CategorySelectorNode.tsx`)

Acts as a **fan-out router** for research results:
- Receives category analysis from upstream Research Node
- Sorts categories by opportunity score (best first)
- Allows toggling visibility of each category
- Exposes each visible category as an independent output port
- Enables connecting multiple Provider Discovery nodes in parallel

### 4. Provider Discovery Node (`ProviderDiscoveryNode.tsx` + `useProviderDiscovery.ts`)

Discovers and scores local service providers:

#### Data Sources
- Google Local Pack results via SerpAPI proxy

#### Provider Scoring (5 factors, max 25 points)
From `src/api/providers/scoring.ts`:

1. **Advertising** (1-5): LSAs, Google Ads, directories
2. **Digital Presence** (1-5): Website quality
3. **Review Velocity** (1-5): Recent review activity
4. **Size Signal** (1-5): Solo → small team → large company
5. **Reachability** (1-5): Phone/email availability

#### Priority Tiers
- **P1** (20-25): High-value targets, digitally weak but established
- **P2** (15-19): Strong potential
- **P3** (10-14): Moderate potential
- **P4** (5-9): Lower priority
- **Skip** (<5): Not worth pursuing

#### Contact Tracking
Simple "contacted" toggle for each provider in the list.

---

## API Integrations

### 1. SerpAPI (via Supabase Edge Function Proxy)

The app doesn't call SerpAPI directly due to CORS - it proxies through a Supabase Edge Function at `/functions/v1/serp-proxy`.

**Caching System** (`src/api/serp/cache.ts`):
- Results cached in Supabase with 7-day expiry
- Cache stats tracking for debugging
- City-based cache invalidation

### 2. US Census Bureau API (`src/api/census/index.ts`)

Fetches American Community Survey (ACS) 5-year estimates:
- State → County → Place FIPS code resolution
- Geographic hierarchy fallback (city → county → state data)
- Caches FIPS lookups in memory

### 3. LLM Providers (`src/api/llm/`)

Unified interface supporting:
- **Anthropic** (Claude Sonnet, Haiku)
- **OpenAI** (GPT-4, GPT-4 Turbo, o1, o3-mini)
- **Google** (Gemini Pro, Flash, 2.0)

Features:
- Extended thinking/reasoning mode support
- API key storage in localStorage with env fallback
- Streaming context support (prompt + previous output)

### 4. Supabase (`src/api/supabase/`)

Used for:
- **SERP Cache**: Storing search results to reduce API costs
- **Provider Cache**: Caching provider discovery results
- **Project Persistence**: Saving/loading workflow configurations
- **Edge Function Proxy**: Securely proxying SerpAPI calls

---

## State Management

The app uses React Context + Hooks pattern:

### Contexts (`src/contexts/`)
- **CanvasContext**: Transform state (pan/zoom)
- **NodesContext**: Node CRUD operations
- **ConnectionsContext**: Connection management
- **ComparisonContext**: Location comparison panel state

### Key Hooks (`src/hooks/`)
- `useChainExecution`: Data flow between connected nodes
- `useDeepResearch`: Research scan orchestration
- `useProviderDiscovery`: Provider lookup orchestration
- `useCityProfile`: City trait detection
- `useNodeDrag` / `useNodeResize`: Interaction handlers
- `usePersistence`: Cloud save/load with Supabase
- `useConnectionHandlers`: Port connection logic

---

## Data Flow Example

A typical workflow might be:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Location Node  │────▶│ Deep Research    │────▶│ Category Selector   │
│  (Tulare, CA)   │     │ (Full Scan)      │     │ (Fan-out categories)│
└─────────────────┘     └──────────────────┘     └──────────┬──────────┘
                                                           │
              ┌────────────────────────────────────────────┼────────────────┐
              ▼                                            ▼                ▼
    ┌──────────────────┐                      ┌──────────────────┐  ┌──────────────────┐
    │ Provider Discover│                      │ Provider Discover│  │ Provider Discover│
    │ (Garage Door)    │                      │ (Appliance Repair│  │ (Junk Removal)   │
    └──────────────────┘                      └──────────────────┘  └──────────────────┘
```

1. **Location Node**: User selects "Tulare, CA" - demographics auto-fetch shows population, income, homeownership
2. **Deep Research Node**: Receives city data, detects "High Income" trait, runs full scan on Tier 1 + conditional categories
3. **Category Selector Node**: Receives results sorted by opportunity, user toggles visibility on best 3 categories
4. **Provider Discovery Nodes**: Each connected to a category port, discovers and scores local providers in that category

---

## UI/UX Highlights

- **Dark Theme**: Slate/indigo color palette optimized for prolonged use
- **Node Color Coding**: Each node type has a distinct accent color (sky, orange, teal, violet, indigo, emerald)
- **Status Indicators**: Loading spinners, success/error states, progress tracking
- **Responsive Sizing**: Nodes are resizable with minimum constraints
- **Port Highlighting**: Visual feedback when dragging connections
- **Real-time Updates**: Results stream into nodes as scans progress

---

## Configuration Requirements

Environment variables needed for full functionality:

```env
VITE_SUPABASE_URL=         # Supabase project URL
VITE_SUPABASE_ANON_KEY=    # Supabase anon key
VITE_CENSUS_BUREAU_API_KEY= # Census Bureau API key (optional, falls back to localStorage)
```

LLM API keys are stored in localStorage via the Settings modal:
- Anthropic API key
- OpenAI API key  
- Google AI API key

SerpAPI key is configured in the Supabase Edge Function (server-side).

---

## Summary

This is a specialized market research tool for the local services lead generation industry. It combines geographic analysis, search engine result analysis, AI-powered opportunity scoring, and provider discovery into a visual workflow system. The node-based architecture allows users to build custom research pipelines, and the multi-port connection system enables efficient fan-out to analyze multiple categories in parallel.
