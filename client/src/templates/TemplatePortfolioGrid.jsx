import React from 'react';
import { motion } from 'framer-motion';

const TemplatePortfolioGrid = ({ data }) => {
    const { business = {}, services = [], locations = [] } = data || {};

    const displayName = business.owner?.name || business.business_name || "Modern Professional";
    const firstName = displayName.split(' ')[0];
    const bio = business.description || "Passionate professional providing top-tier services to help you reach your full potential. Specializing in efficient, results-driven workflows that save you time and effort.";

    // Load External Booking Widget Script
    React.useEffect(() => {
        if (data.hideScript) return;
        const scriptId = 'mybookings-widget-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://mybookings.allysoftsolutions.com/widget.js";
            script.dataset.businessId = business.api_key || "pk_live_2a3364a2d6ac4db497371edfbe156dbd";
            script.dataset.theme = "light";
            script.async = true;
            document.body.appendChild(script);
        }
    }, [business.api_key, data.hideScript]);

    const styles = {
        root: {
            background: 'linear-gradient(180deg, #fdfbfb 0%, #ebedee 100%)',
            minHeight: '100vh',
            paddingBottom: 80,
            fontFamily: "'Inter', sans-serif",
            color: '#1a1a1a'
        },
        nav: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 40px',
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        },
        navLogo: {
            fontSize: 20,
            fontWeight: 800,
            color: '#111',
            letterSpacing: -0.5,
        },
        navBtn: {
            background: '#111',
            color: '#fff',
            border: 'none',
            padding: '10px 24px',
            borderRadius: 30,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)',
        },
        hero: {
            padding: '60px 32px 30px',
            textAlign: 'center',
            maxWidth: 1000,
            margin: '0 auto',
        },
        avatarWrapper: {
            position: 'relative',
            width: 200,
            height: 200,
            margin: '0 auto 20px',
        },
        avatarStatus: {
            position: 'absolute',
            bottom: 5,
            right: 5,
            width: 20,
            height: 20,
            background: '#22c55e',
            borderRadius: '50%',
            border: '4px solid #fff'
        },
        avatar: {
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: business.owner?.profile_picture
                ? `url(${business.owner.profile_picture}) center/cover no-repeat`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            fontSize: 64,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 30px 60px -15px rgba(0,0,0,0.25)',
            border: '6px solid white'
        },
        name: {
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: '-1.5px',
            marginBottom: 16,
            background: 'linear-gradient(90deg, #111 0%, #555 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        bio: {
            fontSize: 18,
            color: '#555',
            lineHeight: 1.6,
            marginBottom: 20,
            fontWeight: 400
        },
        chipsRow: {
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
        },
        chip: {
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: 100,
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.08)',
            color: '#444',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
        },
        bentoContainer: {
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 32px',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
        },
        bentoCard: {
            background: '#ffffff',
            borderRadius: 24,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid rgba(0,0,0,0.04)',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
        },
        bentoIcon: {
            width: 48,
            height: 48,
            borderRadius: 16,
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            color: '#111'
        },
        cardName: {
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 12,
            letterSpacing: -0.5
        },
        cardDesc: {
            fontSize: 15,
            color: '#666',
            lineHeight: 1.6,
            marginBottom: 32,
        },
        cardFooter: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
            paddingTop: 24,
            borderTop: '1px solid rgba(0,0,0,0.05)'
        },
        price: {
            fontSize: 24,
            fontWeight: 700,
            color: '#111',
        },
        duration: {
            fontSize: 13,
            color: '#888',
            fontWeight: 500
        },
        bookBtn: {
            padding: '10px 20px',
            borderRadius: 100,
            background: '#111',
            color: '#fff',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
        },
        cta: {
            margin: '80px auto 0',
            maxWidth: 1100,
            padding: '60px',
            background: 'linear-gradient(135deg, #111 0%, #333 100%)',
            borderRadius: 32,
            display: 'flex',
            gap: 40,
            alignItems: 'center',
            color: '#fff',
            boxShadow: '0 30px 60px -15px rgba(0,0,0,0.3)',
        },
        ctaTitle: {
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: -1,
            marginBottom: 16,
        },
        ctaSub: {
            fontSize: 16,
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.6,
        },
        ctaPrimary: {
            background: '#fff',
            color: '#111',
            border: 'none',
            padding: '16px 32px',
            borderRadius: 100,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
        },
        footer: {
            textAlign: 'center',
            padding: '60px 32px 0',
            fontSize: 14,
            color: '#888',
            fontWeight: 500
        }
    };

    const icons = [
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
    ];

    return (
        <div style={styles.root}>
            <motion.nav style={styles.nav} initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                <div style={styles.navLogo}>{firstName}<span style={{ color: '#667eea' }}>.</span></div>

            </motion.nav>

            <div style={styles.hero}>
                <motion.div style={styles.avatarWrapper} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15, stiffness: 100 }}>
                    <div style={styles.avatar}>{!business.owner?.profile_picture && displayName.charAt(0)}</div>
                    <div style={styles.avatarStatus} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div style={styles.name}>{displayName}</div>
                    <div style={styles.bio}>{bio}</div>
                    <div style={styles.chipsRow}>
                        <div style={styles.chip}>📍 {locations?.[0]?.city || business.city || 'Remote Available'}</div>
                        {business.business_type && (
                            <div style={{ ...styles.chip, background: '#f3f4f6', borderColor: '#e5e7eb' }}>
                                ✨ {business.business_type}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <div style={styles.bentoContainer} id="services-section">
                <div style={styles.grid}>
                    {services.map((service, index) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -8, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                            style={styles.bentoCard}
                        >
                            <div>
                                <div style={styles.bentoIcon}>
                                    {icons[index % icons.length]}
                                </div>
                                <div style={styles.cardName}>{service.service_name}</div>
                                <div style={styles.cardDesc}>
                                    {service.description || `A specialized full ${service.duration_minutes} minute immersive session tailored specifically for your needs.`}
                                </div>
                            </div>
                            <div style={styles.cardFooter}>
                                <div>
                                    <div style={styles.duration}>{service.duration_minutes} min</div>
                                    <div style={styles.price}>₹{Number(service.price).toLocaleString()}</div>
                                </div>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.bookBtn}>
                                    Book Now
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div style={{ padding: '0 32px' }}>
                <motion.div
                    style={styles.cta}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <div style={{ flex: 1 }}>
                        <div style={styles.ctaTitle}>Start the journey.</div>
                        <div style={styles.ctaSub}>Reach out directly. Responses typically within 24 hours.</div>
                    </div>
                    <div>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.ctaPrimary}>
                            Contact Me Now
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            <div style={styles.footer}>
                © {new Date().getFullYear()} {displayName}. Crafted with modern precision.
            </div>
        </div>
    );
};

export default TemplatePortfolioGrid;