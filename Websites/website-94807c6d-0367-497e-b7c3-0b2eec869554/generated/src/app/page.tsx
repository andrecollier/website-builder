import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Pricing } from '@/components/Pricing';
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
      <div data-component-type="about" data-component-name="About">
        <Pricing />
      </div>
      <div data-component-type="faq" data-component-name="FAQ">
        <CallToAction />
      </div>
      <div data-component-type="footer" data-component-name="Footer">
        <Footer />
      </div>
    </main>
  );
}
