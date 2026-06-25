import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { Hero, HeroSpacer } from '@/components/sections/Hero';
import { TrustStrip } from '@/components/sections/TrustStrip';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { VehicleClasses } from '@/components/sections/VehicleClasses';
import { FeaturedDestinations } from '@/components/sections/FeaturedDestinations';
import { WhyHourly } from '@/components/sections/WhyHourly';
import { Testimonials } from '@/components/sections/Testimonials';
import { Faq } from '@/components/sections/Faq';
import { CtaBanner } from '@/components/sections/CtaBanner';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <HeroSpacer />
        <TrustStrip />
        <HowItWorks />
        <VehicleClasses />
        <FeaturedDestinations />
        <WhyHourly />
        <Testimonials />
        <Faq />
        <CtaBanner />
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
