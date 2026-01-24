// Layout Generator
// Generates root layout, SiteShell, Header, Footer components

import { CodeGenInputs, GeneratedFile } from '@/types/codeGeneration';

export interface GeneratorOptions {
	onFile?: (file: GeneratedFile) => void;
	abortSignal?: AbortSignal;
}

/**
 * Generate layout-related files
 */
export async function generateLayoutFiles(
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

	const { sitePlan, brandDesign } = inputs;

	// Root layout
	emit({
		path: 'src/app/layout.tsx',
		content: generateRootLayout(inputs),
		type: 'layout',
		encoding: 'utf-8',
	});

	// SiteShell component
	emit({
		path: 'src/components/layout/SiteShell.tsx',
		content: generateSiteShell(inputs),
		type: 'component',
		encoding: 'utf-8',
	});

	// Header component
	emit({
		path: 'src/components/layout/Header.tsx',
		content: generateHeader(inputs),
		type: 'component',
		encoding: 'utf-8',
	});

	// Footer component
	emit({
		path: 'src/components/layout/Footer.tsx',
		content: generateFooter(inputs),
		type: 'component',
		encoding: 'utf-8',
	});

	// Breadcrumbs component
	emit({
		path: 'src/components/layout/Breadcrumbs.tsx',
		content: generateBreadcrumbs(),
		type: 'component',
		encoding: 'utf-8',
	});

	// Layout index export
	emit({
		path: 'src/components/layout/index.ts',
		content: `export { SiteShell } from './SiteShell';
export { Header } from './Header';
export { Footer } from './Footer';
export { Breadcrumbs } from './Breadcrumbs';
`,
		type: 'component',
		encoding: 'utf-8',
	});

	return files;
}

/**
 * Generate root layout.tsx
 */
function generateRootLayout(inputs: CodeGenInputs): string {
	const { sitePlan, seoPackage } = inputs;
	const brandName = sitePlan.brand.name;
	const domain = sitePlan.brand.domain;

	return `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { SiteShell } from '@/components/layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: '${brandName}',
    template: '%s | ${brandName}',
  },
  description: '${sitePlan.brand.tagline || `Your trusted local resource`}',
  metadataBase: new URL('https://${domain}'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-body antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
`;
}

/**
 * Generate SiteShell component
 */
function generateSiteShell(inputs: CodeGenInputs): string {
	return `'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface SiteShellProps {
  children: ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default SiteShell;
`;
}

/**
 * Generate Header component
 */
function generateHeader(inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;
	const brandName = sitePlan.brand.name;

	// Get main navigation pages
	const navPages = sitePlan.pages
		.filter((p) => p.priority === 1 && ['service_hub', 'about', 'contact'].includes(p.type))
		.slice(0, 5);

	const navItems = navPages.map((p) => ({
		label: getNavLabel(p.type, p.url),
		href: p.url,
	}));

	return `'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Phone } from 'lucide-react';

const navItems = ${JSON.stringify(navItems, null, 2)};

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="container-content">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl text-primary">
            ${brandName}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-button font-medium text-sm hover:bg-primary-dark transition-colors"
            >
              <Phone size={16} />
              Get Quotes
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="container-content py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2 text-gray-600 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="block mt-4 py-3 bg-primary text-white text-center rounded-button font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Quotes
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
`;
}

/**
 * Generate Footer component
 */
function generateFooter(inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;
	const brandName = sitePlan.brand.name;
	const currentYear = new Date().getFullYear();

	// Get footer link pages
	const legalPages = sitePlan.pages.filter((p) => p.type === 'legal');
	const aboutPages = sitePlan.pages.filter((p) =>
		['about', 'methodology', 'contact'].includes(p.type)
	);

	return `import Link from 'next/link';

const footerLinks = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'How We Vet Providers', href: '/how-we-vet-providers' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Disclosure', href: '/disclosure' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-bg-footer text-text-secondary border-t border-gray-200">
      <div className="container-content section-padding">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="font-heading font-bold text-xl text-text-primary">
              ${brandName}
            </Link>
            <p className="mt-2 text-sm max-w-md">
              ${sitePlan.brand.tagline || 'Your trusted local resource for finding quality service providers.'}
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-heading font-semibold text-text-primary mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-heading font-semibold text-text-primary mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm">
          <p>&copy; ${currentYear} ${brandName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
`;
}

/**
 * Generate Breadcrumbs component
 */
function generateBreadcrumbs(): string {
	return `'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-text-muted mb-4">
      <ol className="flex items-center gap-1 flex-wrap">
        <li>
          <Link href="/" className="hover:text-primary transition-colors">
            <Home size={14} />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <ChevronRight size={14} className="text-gray-400" />
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="hover:text-primary transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-text-primary">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
`;
}

/**
 * Get navigation label from page type
 */
function getNavLabel(type: string, url: string): string {
	const labels: Record<string, string> = {
		service_hub: 'Services',
		about: 'About',
		contact: 'Contact',
		methodology: 'How We Vet',
		comparison: 'Compare',
	};

	if (labels[type]) return labels[type];

	// Extract from URL as fallback
	const segments = url.split('/').filter(Boolean);
	if (segments.length > 0) {
		return segments[0]
			.split('-')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}

	return 'Page';
}
