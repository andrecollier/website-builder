import { FAQ } from '@/components/FAQ';
import { Features } from '@/components/Features';
import { Header } from '@/components/Header';
import { Pricing } from '@/components/Pricing';
import { Testimonials } from '@/components/Testimonials';

export default function Home() {
  return (
    <main className="min-h-screen">
      <FAQ />
      <Features />
      <Header />
      <Pricing />
      <Testimonials />
    </main>
  );
}
