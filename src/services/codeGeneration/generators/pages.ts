// Page Generator
// Generates page.tsx files for each route defined in Site Plan

import { CodeGenInputs, GeneratedFile, urlToFilePath } from '@/types/codeGeneration';
import { PageBrief, PageType } from '@/types/sitePlanner';

export interface GeneratorOptions {
	onFile?: (file: GeneratedFile) => void;
	abortSignal?: AbortSignal;
}

/**
 * Generate all page files from site plan
 */
export async function generatePageFiles(
	inputs: CodeGenInputs,
	options: GeneratorOptions = {}
): Promise<GeneratedFile[]> {
	const { onFile, abortSignal } = options;
	const files: GeneratedFile[] = [];

	const emit = (file: GeneratedFile) => {
		files.push(file);
		onFile?.(file);
	};

	if (abortSignal?.aborted) return files;

	const { sitePlan, seoPackage, editorialContent, providerProfiles, comparisonData } = inputs;

	// Generate each page based on its type
	for (const page of sitePlan.pages) {
		if (abortSignal?.aborted) break;

		const filePath = urlToFilePath(page.url);
		const content = generatePageContent(page, inputs);

		emit({
			path: filePath,
			content,
			type: 'page',
			encoding: 'utf-8',
		});
	}

	return files;
}

/**
 * Generate page content based on page type
 */
function generatePageContent(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan, seoPackage } = inputs;

	// Find SEO data for this page
	const seoData = seoPackage.pages.find((p) => p.pageId === page.id);

	switch (page.type) {
		case 'homepage':
			return generateHomepage(page, inputs);
		case 'about':
			return generateAboutPage(page, inputs);
		case 'contact':
			return generateContactPage(page, inputs);
		case 'methodology':
			return generateMethodologyPage(page, inputs);
		case 'legal':
			return generateLegalPage(page, inputs);
		case 'service_hub':
			return generateServiceHubPage(page, inputs);
		case 'service_detail':
			return generateServiceDetailPage(page, inputs);
		case 'city_service':
			return generateCityServicePage(page, inputs);
		case 'provider_listing':
			return generateProviderListingPage(page, inputs);
		case 'provider_profile':
			return generateProviderProfilePage(page, inputs);
		case 'comparison':
			return generateComparisonPage(page, inputs);
		case 'cost_guide':
			return generateCostGuidePage(page, inputs);
		case 'troubleshooting':
			return generateTroubleshootingPage(page, inputs);
		default:
			return generateGenericPage(page, inputs);
	}
}

/**
 * Generate homepage
 */
function generateHomepage(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan, brandDesign } = inputs;

	return `import { Metadata } from 'next';
import { HeroSection, ServicesSection, TrustIndicatorsSection, CTASection } from '@/components/sections';
import { getSEOForPage } from '@/lib/data/seo';

export const metadata: Metadata = {
  title: '${sitePlan.brand.name} - ${sitePlan.brand.tagline || 'Your Trusted Local Resource'}',
  description: 'Find and compare vetted local service providers in ${sitePlan.meta.city}. Read reviews, compare prices, and get free quotes.',
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustIndicatorsSection />
      <ServicesSection />
      <CTASection />
    </>
  );
}
`;
}

/**
 * Generate about page
 */
function generateAboutPage(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan, editorialContent } = inputs;

	// Find editorial content for this page
	const content = editorialContent?.pages.find((p) => p.pageId === page.id);

	return `import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout';
import { getEditorialPage } from '@/lib/data/editorial';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about ${sitePlan.brand.name} and our mission to help you find trusted local service providers.',
};

export default function AboutPage() {
  const content = getEditorialPage('${page.id}');

  return (
    <div className="container-content section-padding">
      <Breadcrumbs items={[{ label: 'About Us' }]} />
      
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-heading font-bold mb-6">
          About ${sitePlan.brand.name}
        </h1>
        
        <div className="prose prose-lg">
          <p className="lead text-xl text-text-secondary mb-8">
            We're dedicated to helping homeowners find trusted, vetted service providers 
            in ${sitePlan.meta.city} and surrounding areas.
          </p>
          
          <h2>Our Mission</h2>
          <p>
            Finding reliable service providers shouldn't be a gamble. That's why we 
            research, vet, and compare local professionals so you can make informed 
            decisions with confidence.
          </p>
          
          <h2>How We Help</h2>
          <ul>
            <li>We research local providers extensively</li>
            <li>We verify credentials and licenses</li>
            <li>We analyze real customer reviews</li>
            <li>We compare pricing and services</li>
            <li>We provide unbiased recommendations</li>
          </ul>
          
          <h2>Our Commitment</h2>
          <p>
            We're committed to transparency and honesty. We don't accept payment 
            for rankings, and our recommendations are based solely on our research 
            and analysis.
          </p>
        </div>
      </article>
    </div>
  );
}
`;
}

/**
 * Generate contact page
 */
function generateContactPage(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;

	return `import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Phone, Mail, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with ${sitePlan.brand.name}. We\\'re here to help you find the right service provider.',
};

export default function ContactPage() {
  return (
    <div className="container-content section-padding">
      <Breadcrumbs items={[{ label: 'Contact' }]} />
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-center mb-4">
          Get In Touch
        </h1>
        <p className="text-text-secondary text-center text-lg mb-12">
          Have questions or need help finding a provider? We're here to help.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-heading font-semibold mb-4">Send Us a Message</h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Send Message</Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-text-secondary">Serving ${sitePlan.meta.city}, ${sitePlan.meta.state} and surrounding areas</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-text-secondary">contact@${sitePlan.brand.domain}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
}

/**
 * Generate methodology page
 */
function generateMethodologyPage(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;

	return `import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout';
import { Shield, Search, Star, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How We Vet Providers',
  description: 'Learn about our rigorous process for researching and vetting local service providers.',
};

const steps = [
  {
    icon: Search,
    title: 'Research',
    description: 'We identify all service providers in the area through multiple sources including business registries, industry databases, and local directories.',
  },
  {
    icon: Shield,
    title: 'Verification',
    description: 'We verify licenses, insurance, and credentials. We check for any complaints, violations, or legal issues.',
  },
  {
    icon: Star,
    title: 'Review Analysis',
    description: 'We analyze reviews across multiple platforms, looking for patterns in customer feedback and identifying fake or suspicious reviews.',
  },
  {
    icon: CheckCircle,
    title: 'Ranking',
    description: 'Based on our research, we rank providers objectively. We don\\'t accept payment for rankings - our recommendations are based solely on merit.',
  },
];

export default function MethodologyPage() {
  return (
    <div className="container-content section-padding">
      <Breadcrumbs items={[{ label: 'How We Vet Providers' }]} />
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-center mb-4">
          How We Vet Providers
        </h1>
        <p className="text-text-secondary text-center text-lg mb-12">
          Our rigorous research process ensures you get accurate, unbiased information.
        </p>
        
        <div className="space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex gap-6">
                <div className="shrink-0">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-heading font-semibold mb-2">
                    {index + 1}. {step.title}
                  </h2>
                  <p className="text-text-secondary">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-12 p-6 bg-bg-section rounded-lg">
          <h2 className="text-xl font-heading font-semibold mb-4">Our Commitment to Transparency</h2>
          <p className="text-text-secondary">
            We believe in complete transparency. We disclose any affiliate relationships, 
            and we never accept payment to influence our rankings. Our recommendations are 
            based solely on our independent research and analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
`;
}

/**
 * Generate legal pages (privacy, terms, disclosure)
 */
function generateLegalPage(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;
	const pageType = page.url.includes('privacy')
		? 'privacy'
		: page.url.includes('terms')
			? 'terms'
			: 'disclosure';

	const titles: Record<string, string> = {
		privacy: 'Privacy Policy',
		terms: 'Terms of Service',
		disclosure: 'Disclosure',
	};

	return `import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout';

export const metadata: Metadata = {
  title: '${titles[pageType]}',
  description: '${titles[pageType]} for ${sitePlan.brand.name}',
};

export default function ${pageType.charAt(0).toUpperCase() + pageType.slice(1)}Page() {
  return (
    <div className="container-content section-padding">
      <Breadcrumbs items={[{ label: '${titles[pageType]}' }]} />
      
      <article className="max-w-3xl mx-auto prose prose-lg">
        <h1>${titles[pageType]}</h1>
        <p className="text-text-muted">Last updated: ${new Date().toLocaleDateString()}</p>
        
        <p>
          This ${titles[pageType].toLowerCase()} governs your use of ${sitePlan.brand.name} 
          (${sitePlan.brand.domain}).
        </p>
        
        {/* Add appropriate legal content based on page type */}
        <h2>Information We Collect</h2>
        <p>
          We collect information you provide directly to us, such as when you 
          fill out a contact form or request a quote.
        </p>
        
        <h2>How We Use Your Information</h2>
        <p>
          We use the information we collect to provide, maintain, and improve 
          our services, and to connect you with local service providers.
        </p>
        
        <h2>Contact Us</h2>
        <p>
          If you have questions about this ${titles[pageType].toLowerCase()}, please 
          contact us at contact@${sitePlan.brand.domain}.
        </p>
      </article>
    </div>
  );
}
`;
}

/**
 * Generate service hub page
 */
function generateServiceHubPage(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan, editorialContent } = inputs;
	const serviceName = formatServiceName(page.url);

	return `import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { getEditorialPage } from '@/lib/data/editorial';

export const metadata: Metadata = {
  title: '${serviceName} Services',
  description: 'Find trusted ${serviceName.toLowerCase()} providers in ${sitePlan.meta.city}. Compare reviews, prices, and get free quotes.',
};

export default function ServiceHubPage() {
  const content = getEditorialPage('${page.id}');

  return (
    <div className="container-content section-padding">
      <Breadcrumbs items={[{ label: '${serviceName}' }]} />
      
      <h1 className="text-4xl font-heading font-bold mb-4">
        ${serviceName} Services in ${sitePlan.meta.city}
      </h1>
      
      <p className="text-text-secondary text-lg mb-8">
        Find vetted ${serviceName.toLowerCase()} professionals in your area. 
        Compare reviews, check credentials, and get free quotes.
      </p>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-heading font-semibold mb-4">Find Providers</h2>
            <p className="text-text-secondary mb-4">
              Browse our directory of vetted ${serviceName.toLowerCase()} providers 
              serving ${sitePlan.meta.city} and surrounding areas.
            </p>
            <Link href="/${page.url.split('/')[1]}/providers">
              <Button>View All Providers</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-heading font-semibold mb-4">Compare & Save</h2>
            <p className="text-text-secondary mb-4">
              See how providers stack up against each other. Compare ratings, 
              prices, and services.
            </p>
            <Link href="/${page.url.split('/')[1]}/compare-providers">
              <Button variant="outline">Compare Providers</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`;
}

/**
 * Generate service detail page
 */
function generateServiceDetailPage(page: PageBrief, inputs: CodeGenInputs): string {
	return generateServiceHubPage(page, inputs);
}

/**
 * Generate city service page
 */
function generateCityServicePage(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan, editorialContent } = inputs;
	const segments = page.url.split('/').filter(Boolean);
	const city = formatCityName(segments[0] || sitePlan.meta.city);
	const service = formatServiceName(segments[1] || '');

	return `import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout';
import { ProviderList } from '@/components/entities';
import { FAQSection } from '@/components/content';
import { getProviders } from '@/lib/data/providers';
import { getEditorialPage } from '@/lib/data/editorial';

export const metadata: Metadata = {
  title: '${service} in ${city}',
  description: 'Find the best ${service.toLowerCase()} providers in ${city}. Read reviews, compare prices, and get free quotes.',
};

export default function CityServicePage() {
  const providers = getProviders().slice(0, 6);
  const content = getEditorialPage('${page.id}');

  return (
    <div className="container-content section-padding">
      <Breadcrumbs 
        items={[
          { label: '${service}', href: '/${segments[1]}' },
          { label: '${city}' },
        ]} 
      />
      
      <h1 className="text-4xl font-heading font-bold mb-4">
        ${service} in ${city}
      </h1>
      
      <p className="text-text-secondary text-lg mb-8">
        Looking for reliable ${service.toLowerCase()} in ${city}? We've researched 
        and vetted the top providers so you can choose with confidence.
      </p>
      
      <section className="mb-12">
        <h2 className="text-2xl font-heading font-semibold mb-6">
          Top Rated Providers
        </h2>
        <ProviderList providers={providers.map(p => ({
          id: p.id || '',
          name: p.name || '',
          slug: p.name?.toLowerCase().replace(/\\s+/g, '-') || '',
          rating: p.googleRating || undefined,
          reviewCount: p.googleReviewCount || undefined,
          phone: p.phone || undefined,
          address: p.address || undefined,
        }))} />
      </section>
      
      <FAQSection 
        faqs={[
          { question: 'How much does ${service.toLowerCase()} cost in ${city}?', answer: 'Costs vary based on the specific service needed. Contact providers for free quotes.' },
          { question: 'How do I choose the right provider?', answer: 'Consider ratings, reviews, credentials, and get multiple quotes before deciding.' },
          { question: 'Are these providers licensed and insured?', answer: 'All providers in our directory are verified for proper licensing and insurance.' },
        ]}
      />
    </div>
  );
}
`;
}

/**
 * Generate provider listing page
 */
function generateProviderListingPage(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;
	const segments = page.url.split('/').filter(Boolean);
	const city = formatCityName(segments[0] || sitePlan.meta.city);

	return `import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout';
import { ProviderList } from '@/components/entities';
import { getProviders } from '@/lib/data/providers';

export const metadata: Metadata = {
  title: 'Service Providers in ${city}',
  description: 'Browse vetted service providers in ${city}. Read reviews, compare ratings, and find the right provider for your needs.',
};

export default function ProviderListingPage() {
  const providers = getProviders();

  return (
    <div className="container-content section-padding">
      <Breadcrumbs 
        items={[
          { label: '${city}', href: '/${segments[0]}' },
          { label: 'Providers' },
        ]} 
      />
      
      <h1 className="text-4xl font-heading font-bold mb-4">
        Service Providers in ${city}
      </h1>
      
      <p className="text-text-secondary text-lg mb-8">
        Browse our directory of vetted service providers serving ${city} and surrounding areas.
      </p>
      
      <ProviderList providers={providers.map(p => ({
        id: p.id || '',
        name: p.name || '',
        slug: p.name?.toLowerCase().replace(/\\s+/g, '-') || '',
        rating: p.googleRating || undefined,
        reviewCount: p.googleReviewCount || undefined,
        phone: p.phone || undefined,
        address: p.address || undefined,
        services: p.enrichment?.services || [],
      }))} />
    </div>
  );
}
`;
}

/**
 * Generate provider profile page
 */
function generateProviderProfilePage(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan, providerProfiles } = inputs;

	return `import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { FAQSection } from '@/components/content';
import { Star, Phone, MapPin, Globe, Shield, Clock } from 'lucide-react';
import { getProviderProfile } from '@/lib/data/providers';

export const metadata: Metadata = {
  title: 'Provider Profile',
  description: 'View detailed information about this service provider including reviews, services, and contact information.',
};

export default function ProviderProfilePage() {
  const profile = getProviderProfile('${page.id}');

  return (
    <div className="container-content section-padding">
      <Breadcrumbs 
        items={[
          { label: 'Providers', href: '/providers' },
          { label: 'Profile' },
        ]} 
      />
      
      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2">
              Provider Profile
            </h1>
            <div className="flex items-center gap-4 text-text-secondary">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span>Rated 4.8 (45 reviews)</span>
              </div>
              <Badge variant="success">Verified</Badge>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-heading font-semibold mb-4">About</h2>
              <p className="text-text-secondary">
                This provider serves the ${sitePlan.meta.city} area with professional 
                service and competitive pricing.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-heading font-semibold mb-4">Our Take</h2>
              <p className="text-text-secondary mb-4">
                Based on our research, this provider offers reliable service with 
                strong customer reviews and proper credentials.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-text-muted mb-2">Strengths</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Responsive communication</li>
                    <li>• Competitive pricing</li>
                    <li>• Licensed and insured</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-text-muted mb-2">Best For</h3>
                  <p className="text-sm">Homeowners looking for reliable service at fair prices.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <FAQSection 
            faqs={[
              { question: 'What areas do they serve?', answer: '${sitePlan.meta.city} and surrounding areas.' },
              { question: 'Are they licensed?', answer: 'Yes, fully licensed and insured.' },
              { question: 'Do they offer free estimates?', answer: 'Contact them directly to inquire about estimates.' },
            ]}
            title="Common Questions"
          />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-heading font-semibold mb-4">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>${sitePlan.meta.city}, ${sitePlan.meta.state}</span>
                </div>
              </div>
              <Button className="w-full mt-4">Get a Quote</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="font-heading font-semibold mb-4">Quick Facts</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Same-Day Service Available</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
`;
}

/**
 * Generate comparison page
 */
function generateComparisonPage(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan, comparisonData } = inputs;
	const city = sitePlan.meta.city;

	return `import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout';
import { ComparisonTable } from '@/components/entities';
import { getComparisonData } from '@/lib/data/comparisons';

export const metadata: Metadata = {
  title: 'Compare Providers in ${city}',
  description: 'Compare top-rated service providers in ${city}. See ratings, pricing, and features side-by-side.',
};

export default function ComparisonPage() {
  const data = getComparisonData('${page.id}');

  return (
    <div className="container-content section-padding">
      <Breadcrumbs 
        items={[
          { label: '${city}', href: '/${city.toLowerCase().replace(/\\s+/g, '-')}' },
          { label: 'Compare Providers' },
        ]} 
      />
      
      <h1 className="text-4xl font-heading font-bold mb-4">
        Compare Service Providers in ${city}
      </h1>
      
      <p className="text-text-secondary text-lg mb-8">
        See how the top providers in ${city} stack up against each other.
      </p>
      
      <ComparisonTable 
        rows={[]}
        features={['Free Estimates', 'Same-Day Service', 'Warranty']}
      />
      
      <div className="mt-12 p-6 bg-bg-section rounded-lg">
        <h2 className="text-xl font-heading font-semibold mb-4">How We Compare</h2>
        <p className="text-text-secondary">
          Our comparison is based on verified customer reviews, credential verification, 
          and transparent pricing information. We don't accept payment to influence rankings.
        </p>
      </div>
    </div>
  );
}
`;
}

/**
 * Generate cost guide page
 */
function generateCostGuidePage(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan, comparisonData } = inputs;
	const serviceName = formatServiceName(page.url);

	return `import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout';
import { Card, CardContent } from '@/components/ui';
import { FAQSection } from '@/components/content';
import { getPricingData } from '@/lib/data/comparisons';

export const metadata: Metadata = {
  title: '${serviceName} Cost Guide - ${sitePlan.meta.city}',
  description: 'How much does ${serviceName.toLowerCase()} cost in ${sitePlan.meta.city}? See average prices, factors that affect cost, and money-saving tips.',
};

export default function CostGuidePage() {
  const pricing = getPricingData('${page.id}');

  return (
    <div className="container-content section-padding">
      <Breadcrumbs 
        items={[
          { label: 'Guides', href: '/guides' },
          { label: '${serviceName} Costs' },
        ]} 
      />
      
      <h1 className="text-4xl font-heading font-bold mb-4">
        ${serviceName} Cost Guide for ${sitePlan.meta.city}
      </h1>
      
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">$150-$300</div>
            <div className="text-sm text-text-muted">Average Cost</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">$100</div>
            <div className="text-sm text-text-muted">Low End</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-orange-500 mb-2">$500+</div>
            <div className="text-sm text-text-muted">High End</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="prose prose-lg max-w-none">
        <h2>Factors That Affect Cost</h2>
        <ul>
          <li>Type and complexity of service needed</li>
          <li>Materials and parts required</li>
          <li>Time of day and urgency</li>
          <li>Provider experience and reputation</li>
        </ul>
        
        <h2>How to Save Money</h2>
        <ul>
          <li>Get multiple quotes from different providers</li>
          <li>Ask about discounts for bundled services</li>
          <li>Schedule during regular business hours when possible</li>
          <li>Maintain equipment regularly to prevent costly repairs</li>
        </ul>
      </div>
      
      <FAQSection 
        faqs={[
          { question: 'How much should I budget?', answer: 'Plan for $150-$300 for standard service. Complex issues may cost more.' },
          { question: 'Should I get multiple quotes?', answer: 'Yes, we recommend getting at least 3 quotes before making a decision.' },
          { question: 'Do providers offer financing?', answer: 'Many providers offer payment plans. Ask when getting your quote.' },
        ]}
      />
    </div>
  );
}
`;
}

/**
 * Generate troubleshooting page
 */
function generateTroubleshootingPage(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;

	return `import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout';
import { Card, CardContent } from '@/components/ui';
import { FAQSection } from '@/components/content';
import { AlertTriangle, CheckCircle, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Troubleshooting Guide',
  description: 'Common problems and solutions. Learn when to DIY and when to call a professional.',
};

export default function TroubleshootingPage() {
  return (
    <div className="container-content section-padding">
      <Breadcrumbs 
        items={[
          { label: 'Guides', href: '/guides' },
          { label: 'Troubleshooting' },
        ]} 
      />
      
      <h1 className="text-4xl font-heading font-bold mb-4">
        Troubleshooting Guide
      </h1>
      
      <p className="text-text-secondary text-lg mb-8">
        Having issues? Here's how to diagnose common problems and when to call a professional.
      </p>
      
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h2 className="text-lg font-heading font-semibold">DIY Fixes</h2>
            </div>
            <ul className="space-y-2 text-text-secondary">
              <li>• Basic maintenance tasks</li>
              <li>• Simple adjustments</li>
              <li>• Cleaning and lubrication</li>
              <li>• Minor troubleshooting</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-heading font-semibold">Call a Pro</h2>
            </div>
            <ul className="space-y-2 text-text-secondary">
              <li>• Safety-related issues</li>
              <li>• Complex repairs</li>
              <li>• Electrical problems</li>
              <li>• Warranty concerns</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-yellow-200 bg-yellow-50 mb-12">
        <CardContent className="p-6 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0" />
          <div>
            <h3 className="font-heading font-semibold text-yellow-800 mb-2">Safety First</h3>
            <p className="text-yellow-700">
              If you're unsure about a repair or it involves electrical components, 
              always consult a licensed professional. Safety should never be compromised.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <FAQSection 
        faqs={[
          { question: 'When should I call a professional?', answer: 'If the issue involves safety, electrical components, or you\\'re not confident in the repair, call a pro.' },
          { question: 'How do I find a reliable provider?', answer: 'Check our provider directory for vetted professionals in your area.' },
          { question: 'Will DIY void my warranty?', answer: 'It depends on the manufacturer. Check your warranty terms before attempting repairs.' },
        ]}
      />
    </div>
  );
}
`;
}

/**
 * Generate generic page for unknown types
 */
function generateGenericPage(page: PageBrief, inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;

	return `import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout';

export const metadata: Metadata = {
  title: '${formatServiceName(page.url)}',
  description: 'Information about ${formatServiceName(page.url).toLowerCase()} from ${sitePlan.brand.name}.',
};

export default function Page() {
  return (
    <div className="container-content section-padding">
      <Breadcrumbs items={[{ label: '${formatServiceName(page.url)}' }]} />
      
      <h1 className="text-4xl font-heading font-bold mb-4">
        ${formatServiceName(page.url)}
      </h1>
      
      <div className="prose prose-lg max-w-none">
        <p>
          Welcome to the ${formatServiceName(page.url)} page of ${sitePlan.brand.name}.
        </p>
      </div>
    </div>
  );
}
`;
}

// Helper functions

function formatServiceName(url: string): string {
	const segments = url.split('/').filter(Boolean);
	const name = segments[segments.length - 1] || segments[0] || 'Service';

	return name
		.split('-')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');
}

function formatCityName(slug: string): string {
	return slug
		.split('-')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');
}
