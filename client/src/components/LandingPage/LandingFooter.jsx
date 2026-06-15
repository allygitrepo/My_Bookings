import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Briefcase, Camera, Calendar, Users, CreditCard, BarChart3, Layout, ArrowRight, Shield } from 'lucide-react';
import Logo from '../Logo';

const QUICK_LINKS = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Documentation', to: '/docs' },
    { label: 'Sign In', to: '/login' },
    { label: 'Register', to: '/register' },
];

const SOCIAL_LINKS = [
    { label: 'Twitter', Icon: MessageCircle, href: '#' },
    { label: 'LinkedIn', Icon: Briefcase, href: '#' },
    { label: 'Instagram', Icon: Camera, href: '#' },
];

const PLATFORM_ITEMS = [
    { Icon: Calendar, text: 'Appointment Scheduling' },
    { Icon: Users, text: 'Staff Management' },
    { Icon: CreditCard, text: 'Payment Processing' },
    { Icon: BarChart3, text: 'Business Analytics' },
    { Icon: Layout, text: 'Website Builder' },
];

const LandingFooter = () => {
    const handleScroll = (href) => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <footer style={{ background: '#0a0f1e', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '64px 24px 32px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                <div className="lp-footer-grid">

                    {/* Brand column */}
                    <div>
                        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <Logo size={48} showText={false} sx={{ m: 0 }} glow={true} />
                            <span style={{ fontWeight: 900, fontSize: '1.3rem', background: 'linear-gradient(90deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                MyBookings
                            </span>
                        </Link>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: 280, margin: '0 0 20px 0' }}>
                            The all-in-one SaaS platform for service businesses to schedule, manage, and grow with confidence.
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {SOCIAL_LINKS.map((s) => (
                                <a key={s.label} href={s.href} aria-label={s.label}
                                    style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                >
                                    <s.Icon size={15} color="rgba(255,255,255,0.6)" strokeWidth={1.8} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 style={{ color: 'white', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 16px 0' }}>
                            Quick Links
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {QUICK_LINKS.map((link) => (
                                link.to ? (
                                    <Link key={link.label} to={link.to} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 500 }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                                    >{link.label}</Link>
                                ) : (
                                    <button key={link.label} onClick={() => handleScroll(link.href)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', textAlign: 'left', padding: 0, transition: 'color 0.2s', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                                    >{link.label}</button>
                                )
                            ))}
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 style={{ color: 'white', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 20px 0' }}>
                            Platform
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                            {PLATFORM_ITEMS.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                        background: 'rgba(99,102,241,0.12)',
                                        border: '1px solid rgba(99,102,241,0.22)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <item.Icon size={16} color="#818cf8" strokeWidth={1.8} />
                                    </div>
                                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', fontWeight: 500 }}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Column */}
                    <div>
                        <h4 style={{ color: 'white', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 16px 0' }}>
                            Get Started
                        </h4>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: 20 }}>
                            Join thousands of service businesses already growing with MyBookings.
                        </p>
                        <Link to="/register" style={{ textDecoration: 'none' }}>
                            <button style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.9rem', padding: '12px 20px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.25s', fontFamily: 'Inter, sans-serif', boxShadow: '0 6px 20px rgba(99,102,241,0.4)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(99,102,241,0.55)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)'; }}
                            >
                                Create Free Account <ArrowRight size={15} strokeWidth={2.5} />
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '48px 0 28px' }} />

                {/* Bottom bar */}
                <div className="lp-footer-bottom">
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', margin: 0 }}>
                        © {new Date().getFullYear()} MyBookings. All rights reserved.
                    </p>
                    <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
                        Developed by{' '}
                        <a href="https://allysoftsolutions.com" target="_blank" rel="noopener noreferrer" style={{ color: 'yellow', fontWeight: 700, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#c084fc'} onMouseLeave={e => e.currentTarget.style.color = 'yellow'}>
                            Allysoft Solutions
                        </a>
                    </p>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                        <Shield size={13} color="rgba(255,255,255,0.25)" strokeWidth={2} />
                        {['Privacy Policy', 'Terms of Service'].map(link => (
                            <a key={link} href="#" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
                            >{link}</a>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .lp-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
                .lp-footer-bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
                @media (max-width: 1024px) { .lp-footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; } }
                @media (max-width: 600px) { .lp-footer-grid { grid-template-columns: 1fr; gap: 28px; } .lp-footer-bottom { flex-direction: column; text-align: center; } }
            `}</style>
        </footer>
    );
};

export default LandingFooter;
