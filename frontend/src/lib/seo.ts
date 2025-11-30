// src/lib/seo.ts
import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export const useSEO = ({
  title = 'NACOS ABUAD - Computing Innovation at ABUAD',
  description = 'Showcasing student talent, connecting opportunities, and powering community events at ABUAD University.',
  image = '/assets/nacos-og-image.jpg',
  url = window.location.href
}: SEOProps = {}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    const updateOGTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    updateMetaTag('description', description);
    updateOGTag('og:title', title);
    updateOGTag('og:description', description);
    updateOGTag('og:image', image);
    updateOGTag('og:url', url);
    updateOGTag('og:type', 'website');

    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Add JSON-LD structured data
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'NACOS ABUAD',
      url: 'https://nacos-abuad.edu.ng',
      logo: 'https://nacos-abuad.edu.ng/assets/nacos-logo.png',
      description: 'NACOS ABUAD - Computing Innovation at ABUAD University',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'NG',
        addressRegion: 'Ekiti',
        addressLocality: 'Ado-Ekiti'
      }
    };

    // Remove existing JSON-LD if any
    const existingJsonLd = document.getElementById('json-ld-organization');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    const script = document.createElement('script');
    script.id = 'json-ld-organization';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [title, description, image, url]);
};