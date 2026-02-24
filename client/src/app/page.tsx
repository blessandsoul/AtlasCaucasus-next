import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedToursSection } from "@/components/home/FeaturedToursSection";
import { FeaturedCompaniesSection } from "@/components/home/FeaturedCompaniesSection";
import { FeaturedGuidesSection } from "@/components/home/FeaturedGuidesSection";
import { LocationsSection } from "@/components/home/LocationsSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedToursSection />
      <FeaturedCompaniesSection />
      <FeaturedGuidesSection />
      <LocationsSection />
    </>
  );
}
