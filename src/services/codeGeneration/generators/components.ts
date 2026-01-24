// Component Generator
// Generates UI components, sections, and entity components

import { CodeGenInputs, GeneratedFile } from '@/types/codeGeneration';

export interface GeneratorOptions {
	onFile?: (file: GeneratedFile) => void;
	abortSignal?: AbortSignal;
}

/**
 * Generate all component files
 */
export async function generateComponentFiles(
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

	// Generate UI components
	await generateUIComponents(emit, inputs, abortSignal);

	// Generate section components
	await generateSectionComponents(emit, inputs, abortSignal);

	// Generate entity components
	await generateEntityComponents(emit, inputs, abortSignal);

	// Generate content components
	await generateContentComponents(emit, inputs, abortSignal);

	return files;
}

/**
 * Generate base UI components
 */
async function generateUIComponents(
	emit: (file: GeneratedFile) => void,
	inputs: CodeGenInputs,
	abortSignal?: AbortSignal
): Promise<void> {
	if (abortSignal?.aborted) return;

	// Button component
	emit({
		path: 'src/components/ui/Button.tsx',
		content: `import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors rounded-button',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-primary text-white hover:bg-primary-dark': variant === 'primary',
            'bg-secondary text-white hover:opacity-90': variant === 'secondary',
            'border-2 border-primary text-primary hover:bg-primary hover:text-white': variant === 'outline',
            'text-primary hover:bg-gray-100': variant === 'ghost',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
export default Button;
`,
		type: 'component',
		encoding: 'utf-8',
	});

	// Card component
	emit({
		path: 'src/components/ui/Card.tsx',
		content: `import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-bg-card rounded-card overflow-hidden',
          {
            'border border-gray-200': variant === 'default',
            'shadow-lg': variant === 'elevated',
            'border-2 border-gray-300': variant === 'outlined',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 border-b border-gray-100', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 border-t border-gray-100', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export default Card;
`,
		type: 'component',
		encoding: 'utf-8',
	});

	// Badge component
	emit({
		path: 'src/components/ui/Badge.tsx',
		content: `import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          {
            'bg-gray-100 text-gray-800': variant === 'default',
            'bg-green-100 text-green-800': variant === 'success',
            'bg-yellow-100 text-yellow-800': variant === 'warning',
            'bg-red-100 text-red-800': variant === 'error',
            'bg-blue-100 text-blue-800': variant === 'info',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
export default Badge;
`,
		type: 'component',
		encoding: 'utf-8',
	});

	// UI index export
	emit({
		path: 'src/components/ui/index.ts',
		content: `export { Button } from './Button';
export { Card, CardHeader, CardContent, CardFooter } from './Card';
export { Badge } from './Badge';
`,
		type: 'component',
		encoding: 'utf-8',
	});

	// Utils
	emit({
		path: 'src/lib/utils.ts',
		content: `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,
		type: 'lib',
		encoding: 'utf-8',
	});
}

/**
 * Generate section components for homepage
 */
async function generateSectionComponents(
	emit: (file: GeneratedFile) => void,
	inputs: CodeGenInputs,
	abortSignal?: AbortSignal
): Promise<void> {
	if (abortSignal?.aborted) return;

	// Hero Section
	emit({
		path: 'src/components/sections/HeroSection.tsx',
		content: generateHeroSection(inputs),
		type: 'component',
		encoding: 'utf-8',
	});

	// Services Section
	emit({
		path: 'src/components/sections/ServicesSection.tsx',
		content: generateServicesSection(inputs),
		type: 'component',
		encoding: 'utf-8',
	});

	// Trust Indicators Section
	emit({
		path: 'src/components/sections/TrustIndicatorsSection.tsx',
		content: generateTrustIndicatorsSection(),
		type: 'component',
		encoding: 'utf-8',
	});

	// CTA Section
	emit({
		path: 'src/components/sections/CTASection.tsx',
		content: generateCTASection(inputs),
		type: 'component',
		encoding: 'utf-8',
	});

	// Sections index
	emit({
		path: 'src/components/sections/index.ts',
		content: `export { HeroSection } from './HeroSection';
export { ServicesSection } from './ServicesSection';
export { TrustIndicatorsSection } from './TrustIndicatorsSection';
export { CTASection } from './CTASection';
`,
		type: 'component',
		encoding: 'utf-8',
	});
}

/**
 * Generate entity components
 */
async function generateEntityComponents(
	emit: (file: GeneratedFile) => void,
	inputs: CodeGenInputs,
	abortSignal?: AbortSignal
): Promise<void> {
	if (abortSignal?.aborted) return;

	// Provider Card
	emit({
		path: 'src/components/entities/ProviderCard.tsx',
		content: generateProviderCard(),
		type: 'component',
		encoding: 'utf-8',
	});

	// Provider List
	emit({
		path: 'src/components/entities/ProviderList.tsx',
		content: `import { ProviderCard, ProviderCardProps } from './ProviderCard';

interface ProviderListProps {
  providers: ProviderCardProps[];
}

export function ProviderList({ providers }: ProviderListProps) {
  if (!providers || providers.length === 0) {
    return (
      <p className="text-text-muted text-center py-8">
        No providers found for this area.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {providers.map((provider) => (
        <ProviderCard key={provider.id} {...provider} />
      ))}
    </div>
  );
}

export default ProviderList;
`,
		type: 'component',
		encoding: 'utf-8',
	});

	// Comparison Table
	emit({
		path: 'src/components/entities/ComparisonTable.tsx',
		content: generateComparisonTable(),
		type: 'component',
		encoding: 'utf-8',
	});

	// Entities index
	emit({
		path: 'src/components/entities/index.ts',
		content: `export { ProviderCard } from './ProviderCard';
export { ProviderList } from './ProviderList';
export { ComparisonTable } from './ComparisonTable';
`,
		type: 'component',
		encoding: 'utf-8',
	});
}

/**
 * Generate content components
 */
async function generateContentComponents(
	emit: (file: GeneratedFile) => void,
	inputs: CodeGenInputs,
	abortSignal?: AbortSignal
): Promise<void> {
	if (abortSignal?.aborted) return;

	// Article Content
	emit({
		path: 'src/components/content/ArticleContent.tsx',
		content: `interface ArticleContentProps {
  content: {
    headline: string;
    introduction: string;
    sections: Array<{
      heading: string;
      content: string;
    }>;
  };
}

export function ArticleContent({ content }: ArticleContentProps) {
  return (
    <article className="prose prose-lg max-w-none">
      <h1>{content.headline}</h1>
      <p className="lead text-text-secondary text-xl">{content.introduction}</p>
      
      {content.sections.map((section, index) => (
        <section key={index}>
          <h2>{section.heading}</h2>
          <div dangerouslySetInnerHTML={{ __html: section.content }} />
        </section>
      ))}
    </article>
  );
}

export default ArticleContent;
`,
		type: 'component',
		encoding: 'utf-8',
	});

	// FAQ Section
	emit({
		path: 'src/components/content/FAQSection.tsx',
		content: `'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  title?: string;
}

export function FAQSection({ faqs, title = 'Frequently Asked Questions' }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="text-2xl font-heading font-bold mb-6">{title}</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg">
            <button
              className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              aria-expanded={openIndex === index}
            >
              <span className="font-medium">{faq.question}</span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-gray-500 transition-transform',
                  openIndex === index && 'rotate-180'
                )}
              />
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 text-text-secondary">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default FAQSection;
`,
		type: 'component',
		encoding: 'utf-8',
	});

	// Content index
	emit({
		path: 'src/components/content/index.ts',
		content: `export { ArticleContent } from './ArticleContent';
export { FAQSection } from './FAQSection';
`,
		type: 'component',
		encoding: 'utf-8',
	});

	// Main components index
	emit({
		path: 'src/components/index.ts',
		content: `export * from './ui';
export * from './layout';
export * from './sections';
export * from './entities';
export * from './content';
`,
		type: 'component',
		encoding: 'utf-8',
	});
}

// Helper functions to generate specific components

function generateHeroSection(inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;

	return `import Link from 'next/link';
import { Button } from '@/components/ui';

interface HeroSectionProps {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaHref?: string;
}

export function HeroSection({
  headline = '${sitePlan.brand.tagline || 'Find Trusted Local Providers'}',
  subheadline = 'We research, vet, and compare local service providers so you don\\'t have to.',
  ctaText = 'Find Providers',
  ctaHref = '/contact',
}: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-primary to-primary-dark text-white section-padding">
      <div className="container-content">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
            {headline}
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            {subheadline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={ctaHref}>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                {ctaText}
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
`;
}

function generateServicesSection(inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;

	// Get service hub pages
	const servicePages = sitePlan.pages
		.filter((p) => p.type === 'service_hub')
		.slice(0, 6);

	return `import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import { Wrench, Shield, Clock, Star, CheckCircle, Phone } from 'lucide-react';

const services = ${JSON.stringify(
		servicePages.map((p) => ({
			title: formatServiceTitle(p.url),
			href: p.url,
			description: p.content?.purpose || 'Find trusted providers for this service.',
		})),
		null,
		2
	)};

const icons = [Wrench, Shield, Clock, Star, CheckCircle, Phone];

export function ServicesSection() {
  return (
    <section className="section-padding bg-bg-section">
      <div className="container-content">
        <h2 className="text-3xl font-heading font-bold text-center mb-4">
          Our Services
        </h2>
        <p className="text-text-secondary text-center max-w-2xl mx-auto mb-12">
          We help you find and compare the best local providers for all your needs.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = icons[index % icons.length];
            return (
              <Link key={service.href} href={service.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg mb-2">
                      {service.title}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
`;
}

function generateTrustIndicatorsSection(): string {
	return `import { Shield, Star, Users, Clock } from 'lucide-react';

const indicators = [
  { icon: Shield, label: 'Vetted Providers', value: 'Background Checked' },
  { icon: Star, label: 'Review Verified', value: 'Real Customer Reviews' },
  { icon: Users, label: 'Local Experts', value: 'In Your Community' },
  { icon: Clock, label: 'Quick Response', value: 'Same-Day Quotes' },
];

export function TrustIndicatorsSection() {
  return (
    <section className="section-padding">
      <div className="container-content">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {indicators.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <div className="font-semibold text-text-primary">{item.label}</div>
                <div className="text-sm text-text-muted">{item.value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default TrustIndicatorsSection;
`;
}

function generateCTASection(inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;

	return `import Link from 'next/link';
import { Button } from '@/components/ui';
import { Phone } from 'lucide-react';

export function CTASection() {
  return (
    <section className="section-padding bg-primary text-white">
      <div className="container-content text-center">
        <h2 className="text-3xl font-heading font-bold mb-4">
          Ready to Find Your Perfect Provider?
        </h2>
        <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
          Get free quotes from vetted local professionals in ${sitePlan.meta.city}. 
          No obligation, no hassle.
        </p>
        <Link href="/contact">
          <Button size="lg" variant="secondary" className="inline-flex items-center gap-2">
            <Phone size={20} />
            Get Free Quotes
          </Button>
        </Link>
      </div>
    </section>
  );
}

export default CTASection;
`;
}

function generateProviderCard(): string {
	return `import Link from 'next/link';
import { Star, Phone, MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui';

export interface ProviderCardProps {
  id: string;
  name: string;
  slug: string;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  address?: string;
  services?: string[];
  verified?: boolean;
}

export function ProviderCard({
  id,
  name,
  slug,
  rating,
  reviewCount,
  phone,
  address,
  services,
  verified,
}: ProviderCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-heading font-semibold text-lg">{name}</h3>
          {verified && <Badge variant="success">Verified</Badge>}
        </div>

        {rating && (
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            {reviewCount && (
              <span className="text-text-muted text-sm">({reviewCount} reviews)</span>
            )}
          </div>
        )}

        {address && (
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
            <MapPin className="w-4 h-4" />
            <span>{address}</span>
          </div>
        )}

        {phone && (
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
            <Phone className="w-4 h-4" />
            <a href={\`tel:\${phone}\`} className="hover:text-primary">{phone}</a>
          </div>
        )}

        {services && services.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {services.slice(0, 3).map((service) => (
              <Badge key={service} variant="default">{service}</Badge>
            ))}
          </div>
        )}

        <Link
          href={\`/providers/\${slug}\`}
          className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
        >
          View Profile <ExternalLink className="w-3 h-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

export default ProviderCard;
`;
}

function generateComparisonTable(): string {
	return `import { Check, X, Minus } from 'lucide-react';
import { Badge } from '@/components/ui';

interface ComparisonRow {
  provider: string;
  rating: number;
  reviews: number;
  pricing: string;
  response: string;
  features: Record<string, boolean | null>;
  winner?: string;
}

interface ComparisonTableProps {
  rows: ComparisonRow[];
  features: string[];
}

export function ComparisonTable({ rows, features }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bg-section">
            <th className="p-4 text-left font-heading font-semibold">Provider</th>
            <th className="p-4 text-center font-heading font-semibold">Rating</th>
            <th className="p-4 text-center font-heading font-semibold">Pricing</th>
            {features.map((feature) => (
              <th key={feature} className="p-4 text-center font-heading font-semibold">
                {feature}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{row.provider}</span>
                  {row.winner && <Badge variant="success">{row.winner}</Badge>}
                </div>
              </td>
              <td className="p-4 text-center">
                {row.rating.toFixed(1)} ({row.reviews})
              </td>
              <td className="p-4 text-center">{row.pricing}</td>
              {features.map((feature) => (
                <td key={feature} className="p-4 text-center">
                  {row.features[feature] === true ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : row.features[feature] === false ? (
                    <X className="w-5 h-5 text-red-500 mx-auto" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-400 mx-auto" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ComparisonTable;
`;
}

function formatServiceTitle(url: string): string {
	const segments = url.split('/').filter(Boolean);
	if (segments.length === 0) return 'Services';

	return segments[0]
		.split('-')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');
}
