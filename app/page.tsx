import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      {/* Sections below the fold — feature grid, template marketplace teaser,
          explorer preview — get added as separate components under
          components/landing/ once copy is ready, to keep this file scannable. */}
    </main>
  );
}
