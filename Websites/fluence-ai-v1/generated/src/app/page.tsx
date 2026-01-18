import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Features2 } from '@/components/Features2';
import { Pricing } from '@/components/Pricing';
import { Testimonials } from '@/components/Testimonials';
import { HowItWorks } from '@/components/HowItWorks';
import { Pricing2 } from '@/components/Pricing2';
import { CallToAction } from '@/components/CallToAction';
import { Blog } from '@/components/Blog';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <div data-component-type="header" data-component-name="Header">
        <Header />
      </div>
      <div data-component-type="hero" data-component-name="Hero">
        <Hero />
      </div>
      <div data-component-type="features" data-component-name="Features">
        <Features />
      </div>
      <div data-component-type="about" data-component-name="About">
        <Pricing />
      </div>
      <div data-component-type="benefits" data-component-name="WhyChoose">
        <Features2 />
      </div>
      <div data-component-type="testimonials" data-component-name="Testimonials">
        <Testimonials />
      </div>
      <div data-component-type="how-it-works" data-component-name="HowItWorks">
        <HowItWorks />
      </div>
      <div data-component-type="pricing" data-component-name="Pricing">
        <Pricing2 />
      </div>
      <div data-component-type="faq" data-component-name="FAQ">
        <CallToAction />
      </div>
      <div data-component-type="blog" data-component-name="Blog">
        <Blog />
      </div>
      <div data-component-type="footer" data-component-name="Footer">
        <Footer />
      </div>
    </main>
  );
}
