import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, User, Star, CalendarCheck, CreditCard, Layout, MapPin, Users, CheckCircle2, DollarSign, Info, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ImagePreview = ({ src, alt, maxHeight = '400px' }) => {
    return (
        <div style={{
            margin: '20px 0',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '8px',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <img 
                src={src} 
                alt={alt} 
                style={{
                    maxWidth: '100%',
                    maxHeight: maxHeight,
                    borderRadius: '8px',
                    objectFit: 'contain',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    transition: 'transform 0.3s ease',
                }}
                className="hover-zoom"
            />
        </div>
    );
};

const BookingStepsViewer = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const steps = [
        { title: "Select Service", img: "/Screenshots/Booking Steps/Select Service.png", desc: "Customers start by picking their desired service from your configured list." },
        { title: "Select Staff", img: "/Screenshots/Booking Steps/Select Staff for selected service.png", desc: "Customers choose an available staff member who specializes in that service." },
        { title: "Select Slot", img: "/Screenshots/Booking Steps/Select slot according to the time.png", desc: "Our real-time calendar shows open slots. Double-booking is impossible." },
        { title: "Fill Details", img: "/Screenshots/Booking Steps/Fill up your details.png", desc: "Customers enter their contact information and special requests." },
        { title: "Complete Booking", img: "/Screenshots/Booking Steps/Complete The bookings.png", desc: "Confirm the booking and make a secure online payment if required." },
        { title: "Success Message", img: "/Screenshots/Booking Steps/Booking success messege.png", desc: "An instant booking confirmation screen displays for the customer." },
        { title: "Summary Report", img: "/Screenshots/Booking Steps/Check the summary report.png", desc: "A detailed summary report of the appointment is generated." }
    ];

    useEffect(() => {
        if (isHovered) return;
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % steps.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [isHovered, steps.length]);

    const handleNext = () => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
    };

    const handlePrev = () => {
        setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
    };

    return (
        <div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                margin: '24px 0',
                position: 'relative'
            }}
        >
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '8px' }}>
                {steps.map((step, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentStep(idx)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: currentStep === idx ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.02)',
                            border: '1px solid',
                            borderColor: currentStep === idx ? '#6366f1' : 'rgba(255, 255, 255, 0.1)',
                            color: currentStep === idx ? '#818cf8' : 'rgba(255, 255, 255, 0.6)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                        }}
                    >
                        Step {idx + 1}: {step.title}
                    </button>
                ))}
            </div>
            
            <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                minHeight: '440px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                position: 'relative'
            }}>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '1rem', fontWeight: 500 }}>
                    {steps[currentStep].desc}
                </p>

                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    flex: 1, 
                    position: 'relative',
                    gap: '20px'
                }}>
                    <button 
                        onClick={handlePrev}
                        style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#6366f1'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, maxHeight: '350px', overflow: 'hidden' }}>
                        <img 
                            key={currentStep}
                            src={steps[currentStep].img} 
                            alt={steps[currentStep].title} 
                            className="carousel-image"
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '320px', 
                                objectFit: 'contain', 
                                borderRadius: '8px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                            }} 
                        />
                    </div>

                    <button 
                        onClick={handleNext}
                        style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#6366f1'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
                    {steps.map((_, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => setCurrentStep(idx)}
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: currentStep === idx ? '#818cf8' : 'rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                transition: 'background-color 0.3s'
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const DOC_DATA = [
    {
        id: "introduction",
        title: "Introduction",
        icon: <Info size={20} />,
        sections: [
            {
                subtitle: "What is MyBookings?",
                content: (
                    <p>MyBookings is the all-in-one SaaS platform designed specifically for service-based businesses. Whether you run a clinic, a salon, a consulting firm, or a fitness center, MyBookings provides the digital infrastructure you need to transition your business online seamlessly. From a customizable public website to a powerful backend dashboard, we handle the heavy lifting so you can focus on your clients.</p>
                )
            },
            {
                subtitle: "Why Use MyBookings?",
                content: (
                    <ul className="doc-list">
                        <li><strong>Save Time:</strong> Automate mundane tasks like sending appointment reminders and managing calendars.</li>
                        <li><strong>Eliminate Errors:</strong> Our smart calendar ensures double-booking is a thing of the past.</li>
                        <li><strong>Look Professional:</strong> Instantly generate a beautiful, mobile-friendly booking website for your brand.</li>
                        <li><strong>Get Paid Faster:</strong> Securely accept online payments from customers right at the time of booking.</li>
                    </ul>
                )
            },
            {
                subtitle: "What Can You Manage?",
                content: (
                    <div className="doc-grid">
                        <div className="doc-card">
                            <h4>Locations & Services</h4>
                            <p>Manage multiple offices and a limitless menu of services and prices.</p>
                        </div>
                        <div className="doc-card">
                            <h4>Staff & Schedules</h4>
                            <p>Control exactly when your team works and what services they can perform.</p>
                        </div>
                        <div className="doc-card">
                            <h4>Customers & Bookings</h4>
                            <p>Maintain detailed histories of your clients and their upcoming appointments.</p>
                        </div>
                        <div className="doc-card">
                            <h4>Payments & Websites</h4>
                            <p>Track your earnings, manage your premium plan, and customize your Website Builder.</p>
                        </div>
                    </div>
                )
            }
        ]
    },
    {
        id: "getting-started",
        title: "Getting Started",
        icon: <User size={20} />,
        sections: [
            {
                subtitle: "Creating Your Account",
                content: (
                    <>
                        <p>Getting started is quick and easy.</p>
                        <ol className="doc-list">
                            <li>Click <strong>Sign In</strong> or <strong>Get Started</strong> on the top right of the screen.</li>
                            <li>Use your Google account for a secure, one-click login.</li>
                            <li>Once logged in, we automatically set up a default "My Business" profile for you and start your Free Trial.</li>
                            <li>Check your inbox for a Welcome Email outlining your trial features!</li>
                        </ol>
                    </>
                )
            },
            {
                subtitle: "Your Dashboard",
                content: (
                    <>
                        <p>After logging in, you'll see your main Dashboard. This is your command center where you can track today's appointments, see your total revenue, and quickly navigate to your services, staff, and settings.</p>
                        <ImagePreview src="/Screenshots/dashboard_preview.png" alt="Admin Dashboard Overview" maxHeight="450px" />
                    </>
                )
            }
        ]
    },
    {
        id: "services-locations",
        title: "Services & Locations",
        icon: <MapPin size={20} />,
        sections: [
            {
                subtitle: "Setting up Locations",
                content: (
                    <p>Do you operate out of multiple clinics, salons, or offices? Head over to the <strong>Locations</strong> tab to add them. Your customers will be able to select which location they want to visit when booking an appointment.</p>
                )
            },
            {
                subtitle: "Adding Your Services",
                content: (
                    <>
                        <p>Under the <strong>Services</strong> tab, you can define exactly what you offer.</p>
                        <ul>
                            <li><strong>Name & Description:</strong> Clearly describe what the service is.</li>
                            <li><strong>Duration:</strong> Set how long the appointment takes (e.g., 30 mins, 1 hour). This ensures our calendar leaves enough time before your next client.</li>
                            <li><strong>Price:</strong> Set the cost. Customers can pay this online when they book.</li>
                        </ul>
                        <ImagePreview src="/Screenshots/services_preview.png" alt="Services Settings" maxHeight="400px" />
                    </>
                )
            }
        ]
    },
    {
        id: "staff",
        title: "Staff & Schedules",
        icon: <Users size={20} />,
        sections: [
            {
                subtitle: "Managing Your Team",
                content: (
                    <>
                        <p>In the <strong>Staff</strong> section, you can add your employees. You can assign specific services to specific staff members. For example, if only "Sarah" handles "Advanced Hair Coloring", you can link that service directly to her.</p>
                        <ImagePreview src="/Screenshots/staff_preview.png" alt="Staff Management & Scheduling" maxHeight="400px" />
                    </>
                )
            },
            {
                subtitle: "Smart Availability & No Double-Booking",
                content: (
                    <>
                        <p>Set up working hours for each staff member (e.g., Monday 9 AM to 5 PM). </p>
                        <div className="doc-highlight">
                            <strong>Peace of Mind:</strong> Our system has a built-in smart calendar. If a customer books a 1-hour appointment at 10 AM, that staff member's calendar is automatically blocked until 11 AM. <strong>Double-booking is impossible.</strong>
                        </div>
                    </>
                )
            }
        ]
    },
    {
        id: "bookings",
        title: "Handling Bookings",
        icon: <CalendarCheck size={20} />,
        sections: [
            {
                subtitle: "How Appointments Work",
                content: (
                    <>
                        <p>When a customer visits your online booking page, they simply choose a Service, pick a Location, select a Staff member, and pick an open time slot. Once they confirm, the appointment instantly appears on your Dashboard calendar.</p>
                        <BookingStepsViewer />
                    </>
                )
            },
            {
                subtitle: "Automatic Notifications",
                content: (
                    <ul className="doc-list interactive">
                        <li>
                            <CheckCircle2 size={18} color="#10b981" />
                            <div><strong>Real-Time Updates:</strong> You don't need to refresh your screen. New bookings pop up on your dashboard instantly.</div>
                        </li>
                        <li>
                            <CheckCircle2 size={18} color="#10b981" />
                            <div><strong>Customer Profiles:</strong> We automatically remember your customers. If they book again using the same email or phone number, we add the new appointment to their existing history.</div>
                        </li>
                        <li>
                            <CheckCircle2 size={18} color="#10b981" />
                            <div><strong>WhatsApp Alerts:</strong> If a customer pays for their booking online, they receive an automatic WhatsApp confirmation message!</div>
                        </li>
                    </ul>
                )
            }
        ]
    },
    {
        id: "website",
        title: "Your Public Website",
        icon: <Layout size={20} />,
        sections: [
            {
                subtitle: "Choosing a Template",
                content: (
                    <p>Don't have a website yet? No problem! Go to the <strong>Website Builder</strong> section. Here, you can select from beautiful, pre-designed templates tailored for service businesses. Just click "Apply", and your business instantly has a professional website where customers can book you.</p>
                )
            },
            {
                subtitle: "Embedding on Your Own Site",
                content: (
                    <p>Already have a WordPress, Wix, or custom website? We provide a simple line of code (a "Widget"). Just copy and paste it into your website, and our seamless booking calendar will appear right on your own page!</p>
                )
            }
        ]
    },
    {
        id: "whatsapp",
        title: "WhatsApp Integration",
        icon: <MessageCircle size={20} />,
        sections: [
            {
                subtitle: "Connecting Your Account",
                content: (
                    <>
                        <p>Head to the <strong>WhatsApp</strong> tab on your dashboard. You can seamlessly link your business's WhatsApp account to the platform by simply scanning a QR code. By connecting your device, you unlock powerful automated communication with your customers.</p>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '20px' }}>
                            <div style={{ flex: '1 1 300px' }}>
                                <ImagePreview src="/Screenshots/Whatsapp link 1.png" alt="WhatsApp Connection Step 1" maxHeight="350px" />
                            </div>
                            <div style={{ flex: '1 1 300px' }}>
                                <ImagePreview src="/Screenshots/Whatsapp link 2.png" alt="WhatsApp Connection Step 2" maxHeight="350px" />
                            </div>
                        </div>
                    </>
                )
            },
            {
                subtitle: "Automated Notifications",
                content: (
                    <ul className="doc-list interactive">
                        <li>
                            <CheckCircle2 size={18} color="#10b981" />
                            <div><strong>Booking Confirmations:</strong> Send instant WhatsApp messages with appointment details the second a customer finishes booking.</div>
                        </li>
                        <li>
                            <CheckCircle2 size={18} color="#10b981" />
                            <div><strong>Payment Receipts:</strong> Automatically notify customers via WhatsApp as soon as their secure online payment succeeds.</div>
                        </li>
                    </ul>
                )
            }
        ]
    },
    {
        id: "billing",
        title: "Upgrading Your Plan",
        icon: <Star size={20} />,
        sections: [
            {
                subtitle: "Choosing a Package",
                content: (
                    <>
                        <p>As your business grows, you might need to handle more bookings or add more staff members. Head to the <strong>Pricing</strong> or <strong>Subscription</strong> page to view our premium packages.</p>
                        <ImagePreview src="/Screenshots/pricing_preview.png" alt="Upgrade Pricing Plans" maxHeight="450px" />
                        <div className="doc-grid">
                            <div className="doc-card">
                                <h4>Instant Upgrades</h4>
                                <p>Select a plan, pay securely via our checkout, and your account limits are increased instantly.</p>
                            </div>
                            <div className="doc-card">
                                <h4>Email Receipts</h4>
                                <p>Every time you upgrade, you'll receive an email confirmation with your new package details.</p>
                            </div>
                        </div>
                    </>
                )
            }
        ]
    },
    {
        id: "payouts",
        title: "Earnings & Payouts",
        icon: <DollarSign size={20} />,
        sections: [
            {
                subtitle: "Getting Paid",
                content: (
                    <>
                        <p>When customers pay for their appointments online, the funds are collected securely. Based on your package, a small platform fee may be deducted.</p>
                        <ol className="doc-list">
                            <li>You can view all your earnings in the <strong>Payments</strong> section of your dashboard.</li>
                            <li>The platform administrators will periodically transfer your available balance directly to your registered bank account.</li>
                            <li>Once the money is sent, you will receive a <strong>Payout Email</strong> confirming the amount and the bank details used.</li>
                        </ol>
                    </>
                )
            }
        ]
    }
];

const Documentation = () => {
    const [activeId, setActiveId] = useState(DOC_DATA[0].id);

    useEffect(() => {
        window.scrollTo(0, 0);

        const observerOptions = {
            root: null, // Use the viewport as the root
            rootMargin: '-120px 0px -60% 0px', // Adjust these bounds so it highlights when the section reaches the upper half of the screen
            threshold: 0
        };

        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveId(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Observe all sections
        DOC_DATA.forEach((d) => {
            const element = document.getElementById(d.id);
            if (element) observer.observe(element);
        });

        return () => {
            observer.disconnect();
        };
    }, []);

    const scrollToSection = (id) => {
        setActiveId(id); // Instantly highlight the button
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div style={{
            fontFamily: '"Inter", "Roboto", sans-serif',
            background: '#0f172a',
            color: 'white',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                padding: '0 24px',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <Link to="/" style={{ textDecoration: 'none', color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.95rem' }}>
                        <ArrowLeft size={18} /> Back
                    </Link>
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                            src="/logo.png"
                            alt="MyBookings"
                            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)' }}
                        />
                        <span style={{
                            fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.5px',
                            background: 'linear-gradient(90deg, #c084fc, #818cf8)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            MyBookings
                        </span>
                        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)' }}>
                            User Guide
                        </span>
                    </div>
                </div>
            </div>

            {/* Layout Container */}
            <div style={{ display: 'flex', flex: 1, width: '100%', marginTop: '70px' }}>

                {/* Sidebar (Fixed position) */}
                <div style={{
                    width: '320px',
                    position: 'fixed',
                    top: '70px',
                    bottom: 0,
                    left: 0,
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.01)',
                    overflowY: 'auto',
                    padding: '32px 20px'
                }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', paddingLeft: '12px' }}>
                        Help Center
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {DOC_DATA.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px',
                                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                                    background: activeId === item.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    border: '1px solid',
                                    borderColor: activeId === item.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    color: activeId === item.id ? '#818cf8' : 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
                                    fontWeight: activeId === item.id ? 600 : 500,
                                    fontSize: '0.95rem'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeId !== item.id) {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeId !== item.id) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                                    }
                                }}
                            >
                                <span style={{ color: activeId === item.id ? '#c084fc' : 'rgba(255,255,255,0.4)' }}>
                                    {item.icon}
                                </span>
                                {item.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area (Offset by sidebar width) */}
                <div style={{
                    flex: 1,
                    marginLeft: '320px',
                    padding: '48px 64px 100px',
                    position: 'relative'
                }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

                            {DOC_DATA.map((contentData, index) => (
                                <div key={contentData.id} id={contentData.id} style={{ marginBottom: '80px', scrollMarginTop: '100px' }}>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                        <div style={{
                                            background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99,102,241,0.2)',
                                            width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8'
                                        }}>
                                            {contentData.icon}
                                        </div>
                                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>
                                            {contentData.title}
                                        </h1>
                                    </div>

                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '24px 0 32px' }} />

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                                        {contentData.sections.map((section, idx) => (
                                            <div key={idx} className="doc-section">
                                                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '20px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '8px', height: '24px', background: '#6366f1', borderRadius: '4px' }} />
                                                    {section.subtitle}
                                                </h2>
                                                <div className="doc-content-body" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', lineHeight: 1.75 }}>
                                                    {section.content}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            ))}

                        </motion.div>
                    </div>
                </div>
            </div>

            <style>{`
                /* Scrollbar Customization */
                ::-webkit-scrollbar { width: 8px; height: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

                /* Typography & Content Styles */
                .doc-content-body p { margin-bottom: 20px; }
                .doc-content-body strong { color: white; font-weight: 600; }
                
                /* Highlights */
                .doc-highlight {
                    background: rgba(99, 102, 241, 0.08);
                    border-left: 4px solid #6366f1;
                    padding: 16px 20px;
                    border-radius: 0 8px 8px 0;
                    margin: 24px 0;
                }

                /* Lists */
                .doc-list { padding-left: 24px; margin-bottom: 24px; }
                .doc-list li { margin-bottom: 12px; }
                
                .doc-list.interactive { list-style: none; padding: 0; display: flex; flexDirection: column; gap: 16px; }
                .doc-list.interactive li {
                    display: flex; gap: 16px; align-items: flex-start;
                    background: rgba(255,255,255,0.02); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);
                }

                /* Grids & Cards */
                .doc-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                    margin: 24px 0;
                }
                .doc-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    padding: 24px;
                    border-radius: 16px;
                    transition: transform 0.2s, background 0.2s;
                }
                .doc-card:hover {
                    background: rgba(255,255,255,0.05);
                    transform: translateY(-2px);
                    border-color: rgba(99, 102, 241, 0.3);
                }
                .doc-card h4 { margin: 0 0 12px 0; color: white; font-size: 1.1rem; }
                .doc-card p { margin: 0; font-size: 0.95rem; line-height: 1.6; color: rgba(255,255,255,0.6); }

                @media (max-width: 1024px) {
                    .doc-grid { grid-template-columns: 1fr; }
                }

                /* Carousel Image Animation */
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }

                .carousel-image {
                    animation: fadeIn 0.35s ease-out;
                    transition: all 0.3s ease-in-out;
                }

                .hover-zoom {
                    transition: transform 0.3s ease;
                }
                
                .hover-zoom:hover {
                    transform: scale(1.02);
                }
            `}</style>
        </div>
    );
};

export default Documentation;
