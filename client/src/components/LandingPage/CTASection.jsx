import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Rocket, ArrowRight, BadgeCheck } from 'lucide-react';

const CTASection = () => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });

    return (
        <section ref={ref} style={{ padding: '100px 24px', background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '10%', left: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

            <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 32, padding: 'clamp(40px, 6vw, 72px)', backdropFilter: 'blur(20px)', boxShadow: '0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1)' }}
                >
                    {/* Icon ring */}
                    <div style={{ width: 72, height: 72, margin: '0 auto 24px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(99,102,241,0.5)' }}>
                        <Rocket size={32} color="white" strokeWidth={1.8} />
                    </div>

                    <h2 style={{ color: 'white', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', margin: '0 0 16px 0', lineHeight: 1.2, letterSpacing: '-0.8px' }}>
                        Ready to transform{' '}
                        <span style={{ background: 'linear-gradient(90deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            your business?
                        </span>
                    </h2>

                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.05rem', lineHeight: 1.75, margin: '0 0 36px 0' }}>
                        Join hundreds of service businesses using MyBookings to automate scheduling, manage their team, and grow their revenue — all from one intelligent platform.
                    </p>

                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
                        <Link to="/register" style={{ textDecoration: 'none' }}>
                            <button
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: 'white', fontWeight: 800, fontSize: '1rem', padding: '15px 32px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.25s', fontFamily: 'Inter, sans-serif', boxShadow: '0 8px 28px rgba(99,102,241,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(99,102,241,0.65)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.5)'; }}
                            >
                                Start Free Today <ArrowRight size={17} strokeWidth={2.5} />
                            </button>
                        </Link>
                        <Link to="/login" style={{ textDecoration: 'none' }}>
                            <button
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, fontSize: '1rem', padding: '15px 26px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.25s', fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(8px)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                            >
                                Already have an account?
                            </button>
                        </Link>
                    </div>

                    {/* Micro trust text */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <BadgeCheck size={14} color="rgba(255,255,255,0.3)" strokeWidth={2} />
                        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.8rem', margin: 0 }}>
                            No credit card required · Setup in minutes · Cancel any time
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CTASection;
