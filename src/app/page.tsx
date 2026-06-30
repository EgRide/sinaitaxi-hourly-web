import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { Hero, HeroSpacer } from '@/components/sections/Hero';
import { TrustStrip } from '@/components/sections/TrustStrip';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { VehicleClasses } from '@/components/sections/VehicleClasses';
import { FeaturedDestinations } from '@/components/sections/FeaturedDestinations';
import { WhyHourly } from '@/components/sections/WhyHourly';
import { ExamplePrice } from '@/components/sections/ExamplePrice';
import { Vetting } from '@/components/sections/Vetting';
import { Faq } from '@/components/sections/Faq';
import { CtaBanner } from '@/components/sections/CtaBanner';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[#070912]">
        <Hero />
        <HeroSpacer />
        <TrustStrip />
        <HowItWorks />
        <VehicleClasses />
        <FeaturedDestinations />
        <WhyHourly />
        <ExamplePrice />
        <Vetting />
        <Faq />
        <CtaBanner />
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
