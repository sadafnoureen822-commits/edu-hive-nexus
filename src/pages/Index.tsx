import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import ModulesSection from "@/components/sections/ModulesSection";
import ArchitectureSection from "@/components/sections/ArchitectureSection";
import PricingSection from "@/components/sections/PricingSection";
import FooterSection from "@/components/sections/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ModulesSection />
        <ArchitectureSection />
        <PricingSection />
      </main>
      <FooterSection />
    </div>
  );
};

export default Index;
