import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, Zap } from 'lucide-react';

const NAV_LINKS = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
];

const LandingNavbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleNavClick = (href) => {
        setMenuOpen(false);
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                transition: 'all 0.35s ease',
                backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
                background: scrolled ? 'rgba(15, 23, 42, 0.88)' : 'transparent',
                borderBottom: scrolled ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent',
                boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.35)' : 'none',
            }}
        >
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>

                {/* Logo */}
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                        src="/logo.png"
                        alt="MyBookings"
                        style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)' }}
                    />
                    <span style={{
                        fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.5px',
                        background: 'linear-gradient(90deg, #c084fc, #818cf8)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        MyBookings
                    </span>
                </Link>

                {/* Desktop Nav Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="lp-desktop-nav">
                    {NAV_LINKS.map(link => (
                        <button
                            key={link.label}
                            onClick={() => handleNavClick(link.href)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'rgba(255,255,255,0.72)', fontWeight: 500, fontSize: '0.92rem',
                                padding: '8px 16px', borderRadius: 8, transition: 'all 0.2s',
                                fontFamily: 'Inter, sans-serif',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.background = 'none'; }}
                        >
                            {link.label}
                        </button>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="lp-desktop-nav">
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <button style={{
                            background: 'none', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                            color: 'white', fontWeight: 600, fontSize: '0.88rem',
                            padding: '9px 20px', borderRadius: 10, transition: 'all 0.2s',
                            fontFamily: 'Inter, sans-serif',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'none'; }}
                        >
                            Sign In
                        </button>
                    </Link>
                    <Link to="/register" style={{ textDecoration: 'none' }}>
                        <button style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            border: 'none', cursor: 'pointer',
                            color: 'white', fontWeight: 700, fontSize: '0.88rem',
                            padding: '10px 20px', borderRadius: 10, transition: 'all 0.2s',
                            fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.55)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.4)'; }}
                        >
                            Get Started <ArrowRight size={15} />
                        </button>
                    </Link>
                </div>

                {/* Hamburger */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="lp-hamburger"
                    style={{
                        background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 8, cursor: 'pointer', padding: '8px',
                        display: 'none', alignItems: 'center', justifyContent: 'center',
                        color: 'white',
                    }}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(20px)',
                            borderTop: '1px solid rgba(99,102,241,0.15)',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {NAV_LINKS.map(link => (
                                <button key={link.label} onClick={() => handleNavClick(link.href)} style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: '1rem',
                                    padding: '12px 16px', borderRadius: 8, textAlign: 'left',
                                    fontFamily: 'Inter, sans-serif',
                                }}>
                                    {link.label}
                                </button>
                            ))}
                            <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
                                <Link to="/login" style={{ flex: 1, textDecoration: 'none' }}>
                                    <button style={{
                                        width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.2)',
                                        color: 'white', fontWeight: 600, padding: '12px', borderRadius: 10,
                                        cursor: 'pointer', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif',
                                    }}>Sign In</button>
                                </Link>
                                <Link to="/register" style={{ flex: 1, textDecoration: 'none' }}>
                                    <button style={{
                                        width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        border: 'none', color: 'white', fontWeight: 700, padding: '12px',
                                        borderRadius: 10, cursor: 'pointer', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif',
                                    }}>Get Started</button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @media (max-width: 768px) {
                    .lp-desktop-nav { display: none !important; }
                    .lp-hamburger { display: flex !important; }
                }
            `}</style>
        </motion.nav>
    );
};

export default LandingNavbar;
