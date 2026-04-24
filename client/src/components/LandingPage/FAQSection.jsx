import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { HelpCircle, Plus, Minus } from 'lucide-react';

const FAQS = [
    { q: 'What types of businesses can use MyBookings?', a: 'MyBookings is built for any service-based business — salons, spas, clinics, fitness studios, tutoring centers, repair shops, and more. If you schedule appointments, we handle everything.' },
    { q: 'Can I manage multiple business locations?', a: 'Yes! Depending on your plan, you can add multiple businesses and locations under one account. Each business operates independently with its own staff, services, and bookings.' },
    { q: 'How does the booking widget work?', a: 'We generate a JavaScript snippet and REST API for each business. Embed it on your existing website or use the API to build a custom booking flow — customers can book directly without needing to log in to MyBookings.' },
    { q: 'Is Razorpay the only payment option?', a: 'Currently, we integrate deeply with Razorpay for UPI, cards, and netbanking. The payment gateway is embedded in the booking flow. More gateways may be added in future updates.' },
    { q: 'What happens when my subscription expires?', a: 'Your data remains safe. When a subscription lapses, booking and management features are restricted until you renew. You can resubscribe any time from the dashboard.' },
    { q: 'Is there a free plan available?', a: 'Yes — check our Pricing section above. We offer a free/starter tier so you can explore the platform before committing to a paid plan.' },
    { q: 'Can my customers receive booking confirmations?', a: 'Booking status is reflected in real-time on the dashboard. Email and SMS notification integrations are on our active roadmap for upcoming releases.' },
    { q: 'How do I get started?', a: 'Click "Get Started Free" to create your account. Set up your first business, add your services and staff, then share your booking link or widget with customers. The whole process takes under 5 minutes.' },
];

const FAQItem = ({ item, index }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });

    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.45, delay: index * 0.05 }}>
            <div
                onClick={() => setOpen(!open)}
                style={{ background: open ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${open ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: '20px 24px', cursor: 'pointer', transition: 'all 0.25s', marginBottom: 12, backdropFilter: 'blur(8px)' }}
                onMouseEnter={e => { if (!open) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; } }}
                onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; } }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: '0.97rem', margin: 0, lineHeight: 1.45, flex: 1 }}>
                        {item.q}
                    </h3>
                    <div style={{ width: 30, height: 30, flexShrink: 0, background: open ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.07)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s' }}>
                        {open
                            ? <Minus size={15} color="#c7d2fe" strokeWidth={2.5} />
                            : <Plus size={15} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                        }
                    </div>
                </div>
                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                            <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: '0.9rem', lineHeight: 1.75, margin: '14px 0 0 0' }}>
                                {item.a}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const FAQSection = () => {
    const titleRef = useRef(null);
    const titleInView = useInView(titleRef, { once: true, margin: '-60px' });

    return (
        <section id="faq" style={{ padding: '100px 24px', background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <motion.div ref={titleRef} initial={{ opacity: 0, y: 30 }} animate={titleInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} style={{ textAlign: 'center', marginBottom: 56 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>
                        <HelpCircle size={13} color="#c7d2fe" strokeWidth={2.5} />
                        <span style={{ color: '#c7d2fe', fontWeight: 600, fontSize: '0.82rem' }}>FAQ</span>
                    </div>
                    <h2 style={{ color: 'white', fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 2.8rem)', margin: '0 0 16px 0', lineHeight: 1.2, letterSpacing: '-0.8px' }}>
                        Frequently asked{' '}
                        <span style={{ background: 'linear-gradient(90deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>questions</span>
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
                        Everything you need to know before getting started.
                    </p>
                </motion.div>
                <div>
                    {FAQS.map((item, i) => <FAQItem key={i} item={item} index={i} />)}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
