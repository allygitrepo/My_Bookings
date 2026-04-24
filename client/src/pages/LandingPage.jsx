import React, { useEffect } from 'react';
import LandingNavbar from '../components/LandingPage/LandingNavbar';
import HeroSection from '../components/LandingPage/HeroSection';
import StatsStrip from '../components/LandingPage/StatsStrip';
import FeaturesSection from '../components/LandingPage/FeaturesSection';
import PricingSection from '../components/LandingPage/PricingSection';
import FAQSection from '../components/LandingPage/FAQSection';
import CTASection from '../components/LandingPage/CTASection';
import LandingFooter from '../components/LandingPage/LandingFooter';

/**
 * LandingPage — The public-facing marketing page for MyBookings.
 *
 * Structure:
 *  1. LandingNavbar  — sticky, glassmorphic, smooth-scroll
 *  2. HeroSection    — headline, CTA, animated dashboard preview
 *  3. StatsStrip     — social proof numbers
 *  4. FeaturesSection — 8 feature cards from real system modules
 *  5. PricingSection  — live packages from /api/packages/active
 *  6. FAQSection      — accordion with 8 business-relevant FAQs
 *  7. CTASection      — final conversion nudge
 *  8. LandingFooter   — logo, links, "Developed by Allysoft Solutions"
 *
 * Theme: Matches login page — dark navy/indigo/violet gradients,
 *        primary #6366f1, secondary #a855f7, gradient #c084fc → #818cf8.
 * Font: Inter (matches theme/index.js)
 */
const LandingPage = () => {
    // Scroll to top when landing page mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    return (
        <div style={{
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            background: '#0f172a',
            overflowX: 'hidden',
            minHeight: '100vh',
        }}>
            {/* SEO meta is handled via index.html; component is SPA-level */}

            {/* ── 1. Navigation ── */}
            <LandingNavbar />

            {/* ── 2. Hero ── */}
            <main>
                <HeroSection />

                {/* ── 3. Stats ── */}
                <StatsStrip />

                {/* ── 4. Features ── */}
                <FeaturesSection />

                {/* ── 5. Pricing (live from DB) ── */}
                <PricingSection />

                {/* ── 6. FAQ ── */}
                <FAQSection />

                {/* ── 7. Final CTA ── */}
                <CTASection />
            </main>

            {/* ── 8. Footer ── */}
            <LandingFooter />
        </div>
    );
};

export default LandingPage;
