import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Building2, Users, Calendar, CreditCard, Globe, BarChart3, UserCircle, Layout } from 'lucide-react';

const FEATURES = [
    { Icon: Building2, title: 'Multi-Business Management', desc: 'Run multiple business locations from a single dashboard. Add businesses, configure independently, and manage everything under one roof.', color: '#6366f1' },
    { Icon: Users, title: 'Smart Staff Scheduling', desc: 'Assign services to staff, set custom availability slots, manage leaves, and prevent double-bookings automatically.', color: '#8b5cf6' },
    { Icon: Calendar, title: 'Real-Time Availability', desc: 'Customers always see accurate, live slots. Buffer times, break periods, and blocked dates are respected automatically.', color: '#a855f7' },
    { Icon: CreditCard, title: 'Integrated Payments', desc: 'Collect UPI, card, and netbanking payments via Razorpay. View payment history, manage refunds, and generate revenue reports.', color: '#c084fc' },
    { Icon: Globe, title: 'Booking Widget & API', desc: 'Embed a beautiful booking widget on any website or connect via REST API. Let customers book directly from your site.', color: '#818cf8' },
    { Icon: BarChart3, title: 'Detailed Analytics & Reports', desc: 'Track revenue trends, booking volumes, staff performance, and customer metrics. Export as PDF with one click.', color: '#60a5fa' },
    { Icon: UserCircle, title: 'Customer Management', desc: 'Build a rich customer database. View full booking history, manage returning clients, and maintain customer profiles.', color: '#6366f1' },
    { Icon: Layout, title: 'Website Builder', desc: 'Generate a professional public business page in seconds. Showcase services, team, and location — zero coding required.', color: '#8b5cf6' },
];

const FeatureCard = ({ feature, index }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    const { Icon, color, title, desc } = feature;

    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55, delay: index * 0.07 }} whileHover={{ y: -6, scale: 1.02 }}>
            <div
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 26px', height: '100%', backdropFilter: 'blur(10px)', transition: 'all 0.3s', position: 'relative', overflow: 'hidden', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px ${color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
                <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle at top right, ${color}15, transparent 70%)`, pointerEvents: 'none' }} />
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${color}22, ${color}08)`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <Icon size={24} color={color} strokeWidth={1.8} />
                </div>
                <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', margin: '0 0 10px 0', lineHeight: 1.3 }}>{title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>{desc}</p>
            </div>
        </motion.div>
    );
};

const FeaturesSection = () => {
    const titleRef = useRef(null);
    const titleInView = useInView(titleRef, { once: true, margin: '-80px' });

    return (
        <section id="features" style={{ padding: '100px 24px', background: 'linear-gradient(180deg, #3b0764 0%, #1e1b4b 40%, #0f172a 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <motion.div ref={titleRef} initial={{ opacity: 0, y: 30 }} animate={titleInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} style={{ textAlign: 'center', marginBottom: 64 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>
                        <Layout size={13} color="#c7d2fe" strokeWidth={2.5} />
                        <span style={{ color: '#c7d2fe', fontWeight: 600, fontSize: '0.82rem' }}>Platform Features</span>
                    </div>
                    <h2 style={{ color: 'white', fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 3rem)', margin: '0 0 16px 0', lineHeight: 1.15, letterSpacing: '-1px' }}>
                        Everything you need to{' '}
                        <span style={{ background: 'linear-gradient(90deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>run your business</span>
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                        From scheduling to payments, from staff to analytics — MyBookings gives service businesses the complete toolkit to thrive.
                    </p>
                </motion.div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                    {FEATURES.map((feature, i) => <FeatureCard key={i} feature={feature} index={i} />)}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
