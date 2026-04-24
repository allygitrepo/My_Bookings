import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calendar, Building2, Zap, Rocket } from 'lucide-react';

const STATS = [
    { value: '10,000+', label: 'Bookings Managed', Icon: Calendar, color: '#6366f1' },
    { value: '500+', label: 'Active Businesses', Icon: Building2, color: '#a855f7' },
    { value: '99.9%', label: 'Uptime Guarantee', Icon: Zap, color: '#10b981' },
    { value: '5 min', label: 'Setup Time', Icon: Rocket, color: '#f59e0b' },
];

const StatsStrip = () => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });

    return (
        <section ref={ref} style={{ padding: '64px 24px', background: 'rgba(15,23,42,0.8)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
                    {STATS.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 24 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            style={{ textAlign: 'center' }}
                        >
                            {/* Icon badge */}
                            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${stat.color}15`, border: `1px solid ${stat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                <stat.Icon size={22} color={stat.color} strokeWidth={1.8} />
                            </div>
                            <div style={{ fontWeight: 900, fontSize: '2.2rem', background: 'linear-gradient(90deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px', marginBottom: 6 }}>
                                {stat.value}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 500 }}>
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsStrip;
