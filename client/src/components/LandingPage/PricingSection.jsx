import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
    Building2, MapPin, Users, Bell, Calendar,
    Plug, Globe, CreditCard, Check, X,
    Sparkles, Zap, Gem, Crown, ArrowRight, ShieldCheck, Percent,
} from 'lucide-react';
import { getActivePackages } from '../../api/package.api';

const getPlanIcon = (pkg) => {
    if (pkg.amount == 0) return Sparkles;
    if (pkg.amount <= 500) return Zap;
    if (pkg.amount <= 1500) return Gem;
    return Crown;
};

const getPlanAccent = (index) => {
    const accents = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc'];
    return accents[index % accents.length];
};

const formatCurrency = (amount) => {
    if (amount == 0) return 'Free';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
};

const isRecommended = (packages, pkg) => {
    const paid = packages.filter(p => Number(p.amount) > 0);
    if (paid.length === 0) return false;
    const mid = paid[Math.floor(paid.length / 2)];
    return mid?.id === pkg.id;
};

const PlanCard = ({ pkg, recommended, accent, index }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    const PlanIcon = getPlanIcon(pkg);

    const chargeVal = parseFloat(pkg.portal_payment_charges || 0);
    const chargeLabel = chargeVal === 0 ? '0% Platform Fee' : `${chargeVal}% Payment Charge`;

    const features = [
        { Icon: Building2, label: `${pkg.max_businesses} Business${pkg.max_businesses > 1 ? 'es' : ''}`, enabled: true },
        { Icon: MapPin, label: `${pkg.max_locations} Location${pkg.max_locations > 1 ? 's' : ''}`, enabled: true },
        { Icon: Users, label: `${pkg.max_staff} Staff Member${pkg.max_staff > 1 ? 's' : ''}`, enabled: true },
        { Icon: Bell, label: `${pkg.max_services} Services`, enabled: true },
        { Icon: Calendar, label: pkg.max_bookings === -1 ? 'Unlimited Bookings' : `${pkg.max_bookings} Bookings`, enabled: true },
        { Icon: Percent, label: chargeLabel, enabled: true, highlight: chargeVal === 0 },
        { Icon: CreditCard, label: 'Payment Integration', enabled: true },
        { Icon: Plug, label: 'API Access', enabled: pkg.allow_api },
        { Icon: Globe, label: 'Website Builder', enabled: pkg.allow_website_builder },
    ];

    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55, delay: index * 0.08 }} whileHover={{ y: -8 }} style={{ position: 'relative', height: '100%' }}>


            <div style={{ background: recommended ? `linear-gradient(145deg, ${accent}18, rgba(255,255,255,0.04))` : 'rgba(255,255,255,0.03)', border: `1px solid ${recommended ? accent + '50' : 'rgba(255,255,255,0.09)'}`, borderRadius: 24, padding: '32px 28px', height: '100%', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(10px)', boxShadow: recommended ? `0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px ${accent}20` : 'none', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 180, height: 180, background: `radial-gradient(circle at top right, ${accent}20, transparent 70%)`, pointerEvents: 'none' }} />

                {/* Icon + name */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${accent}25, ${accent}08)`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                        <PlanIcon size={24} color={accent} strokeWidth={1.8} />
                    </div>
                    <h3 style={{ color: 'white', fontWeight: 900, fontSize: '1.4rem', margin: '0 0 4px 0' }}>{pkg.name}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', margin: 0 }}>
                        {pkg.duration_days === 30 ? 'Monthly plan' : `${pkg.duration_days}-day plan`}
                    </p>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ color: 'white', fontWeight: 900, fontSize: pkg.amount == 0 ? '2.5rem' : '2.8rem' }}>
                            {formatCurrency(pkg.amount)}
                        </span>
                        {pkg.amount > 0 && (
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                                / {pkg.duration_days === 30 ? 'mo' : `${pkg.duration_days}d`}
                            </span>
                        )}
                    </div>

                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 22 }} />

                {/* Features list */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 28 }}>
                    {features.map((f, fi) => {
                        const disabled = f.enabled === false;
                        return (
                            <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: disabled ? 'rgba(255,255,255,0.04)' : `${accent}15`, border: `1px solid ${disabled ? 'rgba(255,255,255,0.06)' : accent + '25'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <f.Icon size={14} color={disabled ? 'rgba(255,255,255,0.2)' : accent} strokeWidth={2} />
                                </div>
                                <span style={{ color: disabled ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.78)', fontSize: '0.87rem', fontWeight: 500, textDecoration: disabled ? 'line-through' : 'none', flex: 1 }}>
                                    {f.label}
                                </span>
                                {!disabled && (
                                    <Check size={14} color="#10b981" strokeWidth={2.5} />
                                )}
                                {disabled && (
                                    <X size={14} color="rgba(255,255,255,0.2)" strokeWidth={2} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* CTA */}
                <Link to="/register" style={{ textDecoration: 'none' }}>
                    <button
                        style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: 800, fontSize: '0.95rem', padding: '14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.25s', fontFamily: 'Inter, sans-serif', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                    >
                        {pkg.amount == 0 ? 'Start Free' : 'Get Started'}
                        <ArrowRight size={16} strokeWidth={2.5} />
                    </button>
                </Link>
            </div>
        </motion.div>
    );
};

const PricingSection = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const titleRef = useRef(null);
    const titleInView = useInView(titleRef, { once: true, margin: '-80px' });

    useEffect(() => {
        getActivePackages()
            .then(res => { if (res.success) setPackages(res.data.filter(p => p.status)); else setError('Could not load packages.'); })
            .catch(() => setError('Could not load packages from server.'))
            .finally(() => setLoading(false));
    }, []);

    if (!loading && (error || packages.length === 0)) return null;

    return (
        <section id="pricing" style={{ padding: '100px 24px', background: 'linear-gradient(180deg, #0f172a 0%, #1a0e2e 60%, #0f172a 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                <motion.div ref={titleRef} initial={{ opacity: 0, y: 30 }} animate={titleInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} style={{ textAlign: 'center', marginBottom: 64 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>
                        <Gem size={13} color="#c7d2fe" strokeWidth={2.5} />
                        <span style={{ color: '#c7d2fe', fontWeight: 600, fontSize: '0.82rem' }}>Pricing Plans</span>
                    </div>
                    <h2 style={{ color: 'white', fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 3rem)', margin: '0 0 16px 0', lineHeight: 1.15, letterSpacing: '-1px' }}>
                        Simple, transparent{' '}
                        <span style={{ background: 'linear-gradient(90deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>pricing</span>
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                        No hidden fees. No surprises. Pick a plan that scales with your business and cancel any time.
                    </p>
                </motion.div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 16 }}>Loading plans...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}


                {!loading && !error && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: packages.length <= 5
                            ? `repeat(${packages.length}, 1fr)`
                            : 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: 24,
                        alignItems: 'start',
                    }}>
                        {packages.map((pkg, i) => (
                            <PlanCard key={pkg.id} pkg={pkg} recommended={isRecommended(packages, pkg)} accent={getPlanAccent(i)} index={i} />
                        ))}
                    </div>
                )}


            </div>
        </section>
    );
};

export default PricingSection;
