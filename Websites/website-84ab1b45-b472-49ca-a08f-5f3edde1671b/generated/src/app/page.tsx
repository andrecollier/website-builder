import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Features2 } from '@/components/Features2';
import { Testimonials } from '@/components/Testimonials';
import { Testimonials2 } from '@/components/Testimonials2';
import { Pricing } from '@/components/Pricing';
import { Pricing2 } from '@/components/Pricing2';
import { CallToAction } from '@/components/CallToAction';
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
      <div data-component-type="features" data-component-name="Features2">
        <Features2 />
      </div>
      <div data-component-type="testimonials" data-component-name="Testimonials">
        <Testimonials />
      </div>
      <div data-component-type="testimonials" data-component-name="Testimonials2">
        <Testimonials2 />
      </div>
      <div data-component-type="pricing" data-component-name="Pricing">
        <Pricing />
      </div>
      <div data-component-type="pricing" data-component-name="Pricing2">
        <Pricing2 />
      </div>
      <div data-component-type="calltoaction" data-component-name="CallToAction">
        <CallToAction />
      </div>
      <div data-component-type="footer" data-component-name="Footer">
        <Footer />
      </div>
    </main>
  );
}
