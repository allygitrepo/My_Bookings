import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Zap, Building2, Calendar, IndianRupee, ArrowRight, ChevronDown } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: 'easeOut' } }),
};

const BADGES = [
    { icon: Star, text: '4.9/5 Rating' },
    { icon: Zap, text: '10k+ Bookings' },
    { icon: Building2, text: '500+ Businesses' },
];

const FLOATING_STATS = [
    { label: 'Bookings Today', value: '1,284', color: '#6366f1', Icon: Calendar },
    { label: 'Revenue Generated', value: '₹2.4L', color: '#10b981', Icon: IndianRupee },
    { label: 'Active Businesses', value: '512', color: '#f59e0b', Icon: Building2 },
];

const HeroSection = () => {
    return (
        <section style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 40%, #2d1a4b 70%, #3b0764 100%)',
            paddingTop: 72,
        }}>
            {/* Decorative background blobs */}
            <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: 550, height: 550, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '40%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

            {/* Animated grid overlay */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.035, pointerEvents: 'none',
                backgroundImage: 'repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 60px)',
            }} />

            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', width: '100%', position: 'relative', zIndex: 1 }}>
                <div className="lp-hero-grid">

                    {/* ── LEFT COLUMN ── */}
                    <div>
                        {/* Trust pill */}


                        {/* Headline */}
                        <motion.h1
                            custom={0.1} initial="hidden" animate="visible" variants={fadeUp}
                            style={{ fontSize: 'clamp(2.6rem, 5.5vw, 4rem)', fontWeight: 900, color: 'white', lineHeight: 1.1, margin: '0 0 24px 0', letterSpacing: '-1.5px' }}
                        >
                            Your Bookings,{' '}<br />
                            <span style={{ background: 'linear-gradient(90deg, #c084fc, #818cf8, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Seamlessly Managed.
                            </span>
                        </motion.h1>

                        {/* Subheading */}
                        <motion.p
                            custom={0.2} initial="hidden" animate="visible" variants={fadeUp}
                            style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.1rem', lineHeight: 1.75, marginBottom: 36, maxWidth: 520 }}
                        >
                            The all-in-one SaaS platform for salons, clinics, and service businesses to schedule, manage staff, process payments, and grow — all from one dashboard.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            custom={0.3} initial="hidden" animate="visible" variants={fadeUp}
                            style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 40 }}
                        >
                            <Link to="/register" style={{ textDecoration: 'none' }}>
                                <button style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    border: 'none', color: 'white', fontWeight: 800, fontSize: '1rem',
                                    padding: '15px 30px', borderRadius: 14, cursor: 'pointer',
                                    transition: 'all 0.25s', fontFamily: 'Inter, sans-serif',
                                    boxShadow: '0 8px 28px rgba(99,102,241,0.5)',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(99,102,241,0.65)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.5)'; }}
                                >
                                    Start Free Today <ArrowRight size={17} strokeWidth={2.5} />
                                </button>
                            </Link>
                            <button
                                onClick={() => { const el = document.querySelector('#features'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
                                style={{
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white', fontWeight: 700, fontSize: '1rem',
                                    padding: '15px 26px', borderRadius: 14, cursor: 'pointer',
                                    transition: 'all 0.25s', fontFamily: 'Inter, sans-serif',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    backdropFilter: 'blur(8px)',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                            >
                                See Features <ChevronDown size={17} strokeWidth={2.5} />
                            </button>
                        </motion.div>

                        {/* Social proof badges */}
                        <motion.div
                            custom={0.4} initial="hidden" animate="visible" variants={fadeUp}
                            style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}
                        >
                            {BADGES.map((b, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 20, padding: '7px 14px',
                                }}>
                                    <b.icon size={13} color="#c7d2fe" strokeWidth={2.5} />
                                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 600 }}>{b.text}</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* ── RIGHT COLUMN: Dashboard Preview ── */}
                    <motion.div
                        initial={{ opacity: 0, x: 60, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                        style={{ position: 'relative' }}
                    >
                        {/* Dashboard preview card */}
                        <div style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 24, padding: 24,
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.2)',
                        }}>
                            {/* Mock browser chrome */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                {['#ef4444', '#f59e0b', '#10b981'].map((c, i) => (
                                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                                ))}
                                <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 20, marginLeft: 8, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>app.mybookings.in/dashboard</span>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                                {FLOATING_STATS.map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 + i * 0.1 }}
                                        style={{
                                            background: `linear-gradient(135deg, ${stat.color}18 0%, transparent 100%)`,
                                            border: `1px solid ${stat.color}30`,
                                            borderRadius: 12, padding: '12px 14px',
                                        }}
                                    >
                                        <stat.Icon size={16} color={stat.color} strokeWidth={2} style={{ marginBottom: 6 }} />
                                        <div style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', marginTop: 4 }}>{stat.value}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem', fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Mock recent bookings table */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <Calendar size={13} color="#c7d2fe" />
                                        <span style={{ color: 'white', fontWeight: 700, fontSize: '0.78rem' }}>Recent Bookings</span>
                                    </div>
                                    <span style={{ background: 'rgba(99,102,241,0.3)', color: '#c7d2fe', fontSize: '0.62rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>LIVE</span>
                                </div>
                                {[
                                    { customer: 'Priya S.', service: 'Hair Cut', time: '10:00 AM', status: 'Confirmed', color: '#10b981' },
                                    { customer: 'Rahul M.', service: 'Massage', time: '11:30 AM', status: 'Pending', color: '#f59e0b' },
                                    { customer: 'Asha K.', service: 'Facial', time: '2:00 PM', status: 'Confirmed', color: '#10b981' },
                                ].map((row, i) => (
                                    <div key={i} style={{ padding: '10px 14px', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ color: 'white', fontSize: '0.78rem', fontWeight: 600 }}>{row.customer}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>{row.service} · {row.time}</div>
                                        </div>
                                        <div style={{ background: `${row.color}20`, color: row.color, fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>{row.status}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Floating badge */}
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute', bottom: -18, right: -18,
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                borderRadius: 16, padding: '14px 18px',
                                boxShadow: '0 12px 32px rgba(16,185,129,0.4)',
                                border: '2px solid rgba(255,255,255,0.15)',
                                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <IndianRupee size={14} color="white" strokeWidth={2.5} />
                                <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>+24%</div>
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 500 }}>Revenue Growth</div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            <style>{`
                .lp-hero-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 64px;
                    align-items: center;
                }
                @media (max-width: 900px) {
                    .lp-hero-grid { grid-template-columns: 1fr; gap: 48px; }
                }
            `}</style>
        </section>
    );
};

export default HeroSection;
