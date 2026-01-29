import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { FeaturedToursSection } from "@/components/home/FeaturedToursSection";
import { DestinationsSection } from "@/components/home/DestinationsSection";
import { PromotionalBanner } from "@/components/home/PromotionalBanner";
import { WhyChooseUsSection } from "@/components/home/WhyChooseUsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CTASection } from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <FeaturedToursSection />
      <DestinationsSection />
      <PromotionalBanner />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
