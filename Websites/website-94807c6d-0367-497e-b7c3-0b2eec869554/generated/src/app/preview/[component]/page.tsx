'use client';

import dynamic from 'next/dynamic';
import { use } from 'react';

// Component mapping - dynamically import components based on URL param
const componentMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
  'header': dynamic(() => import('@/components/Header').then(mod => mod.Header), { ssr: false }),
  'hero': dynamic(() => import('@/components/Hero').then(mod => mod.Hero), { ssr: false }),
  'features': dynamic(() => import('@/components/Features').then(mod => mod.Features), { ssr: false }),
  'howitworks': dynamic(() => import('@/components/HowItWorks').then(mod => mod.HowItWorks), { ssr: false }),
  'testimonials': dynamic(() => import('@/components/Testimonials').then(mod => mod.Testimonials), { ssr: false }),
  'pricing': dynamic(() => import('@/components/Pricing').then(mod => mod.Pricing), { ssr: false }),
  'features2': dynamic(() => import('@/components/Features2').then(mod => mod.Features2), { ssr: false }),
  'testimonials2': dynamic(() => import('@/components/Testimonials2').then(mod => mod.Testimonials2), { ssr: false }),
  'pricing2': dynamic(() => import('@/components/Pricing2').then(mod => mod.Pricing2), { ssr: false }),
  'blog': dynamic(() => import('@/components/Blog').then(mod => mod.Blog), { ssr: false }),
  'calltoaction': dynamic(() => import('@/components/CallToAction').then(mod => mod.CallToAction), { ssr: false }),
  'footer': dynamic(() => import('@/components/Footer').then(mod => mod.Footer), { ssr: false }),
};

// Get all available component names for the 404 message
const availableComponents = Object.keys(componentMap);

interface PreviewPageProps {
  params: Promise<{ component: string }>;
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const { component } = use(params);
  const componentKey = component.toLowerCase();
  const Component = componentMap[componentKey];

  if (!Component) {
    return (
      <div style={{
        padding: '40px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h1 style={{ color: '#e53e3e', marginBottom: '16px' }}>
          Component Not Found
        </h1>
        <p style={{ marginBottom: '16px' }}>
          The component <code style={{
            backgroundColor: '#f0f0f0',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>{component}</code> was not found.
        </p>
        <p style={{ marginBottom: '8px' }}>Available components:</p>
        <ul style={{ listStyle: 'disc', paddingLeft: '24px' }}>
          {availableComponents.map(name => (
            <li key={name}>
              <a
                href={`/preview/${name}`}
                style={{ color: '#3182ce', textDecoration: 'underline' }}
              >
                {name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div style={{
      width: '1440px',
      margin: '0 auto',
      backgroundColor: '#ffffff'
    }}>
      <Component />
    </div>
  );
}
