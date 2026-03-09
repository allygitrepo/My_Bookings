import React, { useState, useEffect } from 'react';
import {
    Fab, Dialog, DialogContent, Box, Typography, IconButton, Button,
    Card, Grid, TextField, List, ListItem, ListItemButton,
    ListItemText, Avatar, Divider, LinearProgress,
} from '@mui/material';
import {
    Event as BookIcon, Close as CloseIcon, ArrowBack as BackIcon,
    CheckCircle as SuccessIcon, AccessTime as TimeIcon,
    AttachMoney as PriceIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { getServices } from '../api/service.api';
import { getApiKeys } from '../api/apiKey.api';
import { getStaff } from '../api/staff.api';
import { getStaffServices } from '../api/staffService.api';
import { getStaffAvailability } from '../api/staffAvailability.api';
import { getCustomers, createCustomer } from '../api/customer.api';
import { getBusinesses } from '../api/business.api';
import { getBookings, createBooking } from '../api/booking.api';
import { createPayment } from '../api/payment.api';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { formatDate, getDayName } from '../utils/date';

const steps = ['Service', 'Staff', 'Date & Time', 'Your Details', 'Payment'];

// Format a 24h time string to 12h "H:MM AM/PM"
const timeFrom24 = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

// Add `addMinutes` to a "HH:MM" string
const addMinutes = (t, mins) => {
    const [h, m] = t.split(':').map(Number);
    const total = h * 60 + m + mins;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// Format a slot as "9:00 – 9:30"
const formatSlotLabel = (startTime, durationMin) => {
    const end = addMinutes(startTime, durationMin);
    return `${timeFrom24(startTime)} – ${timeFrom24(end)}`;
};

const generateSlots = (startTime, endTime, durationMin) => {
    const slots = [];
    if (!startTime || !endTime || !durationMin) return slots;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let cur = sh * 60 + sm;
    let end = eh * 60 + em;

    // Handle overnight shifts if eh < sh
    if (end <= cur) {
        end += 24 * 60;
    }

    console.log(`Widget: Generating slots from ${startTime} to ${endTime} (${durationMin} min). cur=${cur}, end=${end}`);

    while (cur + durationMin <= end) {
        const h = Math.floor(cur / 60) % 24;
        const m = cur % 60;
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        cur += durationMin;
    }
    console.log(`Widget: Generated ${slots.length} slots.`);
    return slots;
};

const getDayNameInternal = (dateStr) => {
    if (!dateStr) return '';
    return getDayName(dateStr).toLowerCase();
};

const getDayNameDisplay = (dateStr) => {
    return getDayName(dateStr);
};

console.log('Booking Widget Version: 2.1 (Robust Day Matching)');

const BookingWidget = ({ businessId }) => {
    const [services, setServices] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [staff, setStaff] = useState([]);
    const [staffServices, setStaffServices] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvedBusinessId, setResolvedBusinessId] = useState(null);

    const [open, setOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [bookingData, setBookingData] = useState({
        service: null, staff: null, date: '', slot: '', paidAmount: 0,
        customer: { name: '', email: '', phone: '' },
    });
    const [detailErrors, setDetailErrors] = useState({});
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });

    const fetchData = async () => {
        // If it's a public key, set the header for all subsequent Widget requests
        if (businessId && String(businessId).startsWith('pk_live_')) {
            axiosInstance.defaults.headers.common['x-api-key'] = businessId;
        }

        setLoading(true);
        try {
            const [svcRes, staffRes, ssRes, availRes, custRes, keysRes, bookRes, bizRes] = await Promise.all([
                getServices(), getStaff(), getStaffServices(), getStaffAvailability(), getCustomers(), getApiKeys(), getBookings(), getBusinesses()
            ]);

            let bizId = businessId;
            console.log('Widget: Input businessId:', businessId);

            // If businessId is an API Key (pk_live_...), resolve the numeric ID
            if (businessId && String(businessId).startsWith('pk_live_')) {
                const matchedKey = keysRes.success ? keysRes.data.find(k => k.api_key === businessId) : null;
                if (matchedKey) {
                    bizId = matchedKey.business_id;
                    console.log('Widget: Resolved API Key to Business ID:', bizId);
                } else {
                    console.error('Widget: Could not resolve API Key to a Business ID. Check if the key is correct.');
                    bizId = null; // Don't try to filter using the string key
                }
            }
            setResolvedBusinessId(bizId);

            // Filter data by resolvedBusinessId if provided
            if (svcRes.success) {
                console.log('Widget: Fetched Services count:', svcRes.data.length);
                const bizServices = bizId
                    ? svcRes.data.filter(s => String(s.business_id) === String(bizId))
                    : svcRes.data;
                console.log('Widget: Filtered Services count:', bizServices.length);
                setServices(bizServices);
            } else {
                console.error('Widget: Failed to fetch services:', svcRes.message);
            }
            if (staffRes.success) {
                const bizStaff = bizId
                    ? staffRes.data.filter(s => String(s.business_id) === String(bizId))
                    : staffRes.data;
                setStaff(bizStaff);
            }
            if (ssRes.success) setStaffServices(ssRes.data);
            if (availRes.success) setAvailability(availRes.data);
            if (custRes.success) setCustomers(custRes.data);
            if (bookRes.success) setBookings(bookRes.data);
            if (bizRes.success) setBusinesses(bizRes.data);
        } catch (error) {
            console.error('Widget Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (open) fetchData();
    }, [open, businessId]);

    const handleNext = () => setActiveStep(p => p + 1);
    const handleBack = () => setActiveStep(p => p - 1);

    const resetBooking = () => {
        setOpen(false);
        setActiveStep(0);
        setDetailErrors({});
        setBookingData({
            service: null, staff: null, date: '', slot: '', paidAmount: 0,
            customer: { name: '', email: '', phone: '' }
        });
    };

    // Staff who can perform the selected service (using schema id field: staff_id, service_id)
    const availableStaff = bookingData.service
        ? staff.filter(s => staffServices.some(ss => ss.staff_id === s.id && ss.service_id === bookingData.service.id))
        : [];

    // Time slots and matching availability records
    const slotDurationMin = Number(bookingData.staff?.slot_duration_minutes) || 30;

    const matchingRecs = (() => {
        if (!bookingData.staff || !bookingData.date) return [];
        const internalDay = getDayNameInternal(bookingData.date);

        console.log('Widget Availability Check:', {
            date: bookingData.date,
            dayToMatch: internalDay,
            staffId: bookingData.staff.id,
            totalAvailabilityRecords: availability.length
        });

        const filtered = availability.filter(a => {
            const isStaffMatch = String(a.staff_id) === String(bookingData.staff.id);
            const backendDay = String(a.day_of_week).toLowerCase();
            const isDayMatch = backendDay === internalDay ||
                backendDay === internalDay.slice(0, 3) ||
                backendDay.startsWith(internalDay.slice(0, 3));

            if (isStaffMatch) {
                console.log(` - Checking Staff Avail: "${backendDay}" (Match with "${internalDay}": ${isDayMatch})`);
            }
            return isStaffMatch && isDayMatch;
        });
        console.log('Widget Matched Records:', filtered);
        return filtered;
    })();

    const availableSlots = (() => {
        if (matchingRecs.length === 0) return [];
        const all = [];
        matchingRecs.forEach(r => { // Changed recs.forEach to matchingRecs.forEach
            console.log(` - Record ${r.id}: ${r.start_time} - ${r.end_time}`);
            generateSlots(r.start_time, r.end_time, slotDurationMin).forEach(s => all.push(s));
        });

        const uniqueSlots = [...new Set(all)].sort();

        // BLOCK ALREADY BOOKED SLOTS
        return uniqueSlots.filter(slot => {
            const isAlreadyBooked = bookings.some(b =>
                String(b.staff_id) === String(bookingData.staff.id) &&
                String(b.booking_date) === String(bookingData.date) &&
                String(b.start_time).startsWith(slot) &&
                (b.status === true || String(b.status) === '1')
            );
            return !isAlreadyBooked;
        });
    })();

    const handleConfirmBooking = async () => {
        setLoading(true);
        try {
            // 1. Find or create customer
            let customerId;
            const existing = customers.find(c => c.email === bookingData.customer.email);

            if (existing) {
                customerId = existing.id;
            } else {
                console.log('Widget: Creating new customer with businessId:', resolvedBusinessId);
                const custRes = await createCustomer({
                    business_id: resolvedBusinessId,
                    name: bookingData.customer.name,
                    email: bookingData.customer.email,
                    phone: bookingData.customer.phone
                });
                if (!custRes.success) {
                    console.error('Widget: Customer creation failed:', custRes.message);
                    throw new Error(custRes.message);
                }
                customerId = custRes.data.id;
            }

            // 2. Create booking
            const slotDurationMin = Number(bookingData.staff?.slot_duration_minutes) || 30;
            const endTime = addMinutes(bookingData.slot, slotDurationMin);

            const bookingPayload = {
                business_id: bookingData.service.business_id,
                location_id: bookingData.staff.location_id,
                staff_id: bookingData.staff.id,
                service_id: bookingData.service.id,
                customer_id: customerId,
                booking_date: bookingData.date,
                start_time: bookingData.slot,
                end_time: endTime,
                payment_status: true, // Use boolean for DataTypes.BOOLEAN
                status: true          // Use boolean for DataTypes.BOOLEAN
            };

            console.log('Widget: Creating booking with payload:', bookingPayload);
            const bookingRes = await createBooking(bookingPayload);

            if (!bookingRes.success) {
                console.error('Widget: Booking creation failed:', bookingRes.message);
                throw new Error(bookingRes.message);
            }
            const bookingId = bookingRes.data.id;

            // 3. Create payment
            const paymentPayload = {
                booking_id: bookingId,
                amount: bookingData.service.price,
                paid_amount: bookingData.paidAmount || bookingData.service.price,
                payment_method: 'UPI/Card',
                transaction_id: 'txn_' + crypto.randomUUID().split('-')[0],
                payment_status: true // Use boolean
            };

            console.log('Widget: Creating payment with payload:', paymentPayload);
            const payRes = await createPayment(paymentPayload);

            if (!payRes.success) {
                console.error('Widget: Payment creation failed:', payRes.message);
                throw new Error(payRes.message);
            }

            handleNext();
        } catch (error) {
            toast.error(error.message || 'Booking failed');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Select the service you'd like to book.
                        </Typography>
                        {loading ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <LinearProgress sx={{ borderRadius: 2, height: 6, mb: 1.5, bgcolor: 'rgba(99,102,241,0.1)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' } }} />
                                <Typography variant="caption" color="text.secondary">Loading services...</Typography>
                            </Box>
                        ) : services.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                                <Typography variant="body2">No services available yet.</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {services.map(service => (
                                    <Box key={service.id}
                                        onClick={() => {
                                            setBookingData({ ...bookingData, service, staff: null, slot: '', paidAmount: Number(service.minimum_booking_charge) || Number(service.price) });
                                            handleNext();
                                        }}
                                        sx={{
                                            p: 2, borderRadius: 3, cursor: 'pointer',
                                            border: '1.5px solid', borderColor: 'rgba(99,102,241,0.15)',
                                            bgcolor: 'white',
                                            boxShadow: '0 2px 8px rgba(99,102,241,0.06)',
                                            transition: 'all 0.18s',
                                            '&:hover': {
                                                borderColor: '#6366f1',
                                                boxShadow: '0 4px 20px rgba(99,102,241,0.15)',
                                                transform: 'translateY(-2px)',
                                            },
                                        }}
                                    >
                                        <Typography fontWeight={700} fontSize="0.95rem">{service.service_name}</Typography>
                                        <Box sx={{ display: 'flex', gap: 2, mt: 0.8 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <TimeIcon sx={{ fontSize: 13, color: '#6366f1' }} />
                                                <Typography variant="caption" color="text.secondary" fontWeight={500}>{service.duration_minutes} min</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <PriceIcon sx={{ fontSize: 13, color: '#10b981' }} />
                                                <Typography variant="caption" fontWeight={700} color="success.main">₹{service.price}</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                );

            case 1:
                return (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <IconButton size="small" onClick={handleBack}
                                sx={{ bgcolor: 'rgba(99,102,241,0.08)', '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' } }}>
                                <BackIcon fontSize="small" sx={{ color: '#6366f1' }} />
                            </IconButton>
                            <Typography variant="caption" color="text.secondary">Professionals who offer <strong>{bookingData.service?.service_name}</strong></Typography>
                        </Box>
                        {availableStaff.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                                <Typography variant="body2">No staff assigned to this service yet.</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={1.5}>
                                {availableStaff.map(s => (
                                    <Grid item xs={6} key={s.id}>
                                        <Box onClick={() => { setBookingData({ ...bookingData, staff: s, slot: '' }); handleNext(); }}
                                            sx={{
                                                p: 2, textAlign: 'center', cursor: 'pointer',
                                                borderRadius: 3, bgcolor: 'white',
                                                border: '1.5px solid', borderColor: 'rgba(99,102,241,0.15)',
                                                boxShadow: '0 2px 8px rgba(99,102,241,0.06)',
                                                transition: 'all 0.18s',
                                                '&:hover': {
                                                    borderColor: '#6366f1',
                                                    boxShadow: '0 4px 20px rgba(99,102,241,0.15)',
                                                    transform: 'translateY(-2px)',
                                                },
                                            }}
                                        >
                                            <Avatar sx={{
                                                mx: 'auto', mb: 1, width: 44, height: 44, fontSize: '1.1rem',
                                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                            }}>
                                                {s.staff_name?.charAt(0)}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight={700}>{s.staff_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{s.role}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                );

            case 2: {
                // Build calendar grid
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const { year, month } = calendarMonth;
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

                const calCells = [];
                for (let i = 0; i < firstDay; i++) calCells.push(null);
                for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

                const handleCalDay = (d) => {
                    if (!d) return;
                    const selected = new Date(year, month, d);
                    selected.setHours(0, 0, 0, 0);
                    if (selected < today) return;
                    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    setBookingData(prev => ({ ...prev, date: iso, slot: '' }));
                };

                const prevMonth = () => setCalendarMonth(prev => {
                    const d = new Date(prev.year, prev.month - 1, 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                });
                const nextMonth = () => setCalendarMonth(prev => {
                    const d = new Date(prev.year, prev.month + 1, 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                });
                const canGoPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

                return (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                            <IconButton size="small" onClick={handleBack}><BackIcon fontSize="small" /></IconButton>
                            <Typography variant="h6" fontWeight={700}>Pick a Date &amp; Time</Typography>
                        </Box>

                        {/* ── Modern Inline Calendar ── */}
                        <Box sx={{
                            border: '1.5px solid', borderColor: 'divider', borderRadius: 3,
                            overflow: 'hidden', mb: 2.5,
                            background: 'linear-gradient(135deg, #f8f9ff 0%, #fff 100%)',
                            boxShadow: '0 2px 12px rgba(99,102,241,0.08)',
                        }}>
                            {/* Month nav */}
                            <Box sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                px: 2, py: 1.5,
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            }}>
                                <IconButton size="small" onClick={prevMonth} disabled={!canGoPrev}
                                    sx={{ color: 'white', opacity: canGoPrev ? 1 : 0.3, '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                                    <BackIcon fontSize="small" />
                                </IconButton>
                                <Typography fontWeight={700} color="white" fontSize="0.95rem">
                                    {MONTH_NAMES[month]} {year}
                                </Typography>
                                <IconButton size="small" onClick={nextMonth}
                                    sx={{ color: 'white', transform: 'rotate(180deg)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                                    <BackIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            {/* Day labels */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', px: 1, pt: 1.5 }}>
                                {DAY_LABELS.map(dl => (
                                    <Box key={dl} sx={{ textAlign: 'center', pb: 0.5 }}>
                                        <Typography variant="caption" fontWeight={700} color="text.disabled" fontSize="0.65rem">{dl}</Typography>
                                    </Box>
                                ))}
                            </Box>

                            {/* Date cells */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', px: 1, pb: 1.5, gap: 0.3 }}>
                                {calCells.map((d, i) => {
                                    if (!d) return <Box key={`e${i}`} />;
                                    const cellDate = new Date(year, month, d);
                                    cellDate.setHours(0, 0, 0, 0);
                                    const isPast = cellDate < today;
                                    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                    const isSelected = bookingData.date === iso;
                                    const isToday = cellDate.getTime() === today.getTime();
                                    return (
                                        <Box key={d}
                                            onClick={() => handleCalDay(d)}
                                            sx={{
                                                textAlign: 'center', py: 0.7,
                                                borderRadius: 2,
                                                cursor: isPast ? 'default' : 'pointer',
                                                bgcolor: isSelected ? '#6366f1' : 'transparent',
                                                border: isToday && !isSelected ? '1.5px solid #6366f1' : '1.5px solid transparent',
                                                transition: 'all 0.12s',
                                                '&:hover': isPast ? {} : {
                                                    bgcolor: isSelected ? '#6366f1' : 'rgba(99,102,241,0.1)',
                                                },
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                fontWeight={isSelected ? 800 : isToday ? 700 : 400}
                                                sx={{
                                                    color: isSelected ? 'white' : isPast ? 'text.disabled' : 'text.primary',
                                                    fontSize: '0.8rem',
                                                }}
                                            >{d}</Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* Time slots */}
                        {bookingData.date && (
                            <>
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: '#6366f1' }}>
                                    Available Slots — {getDayNameDisplay(bookingData.date)}
                                </Typography>
                                {availableSlots.length === 0 ? (
                                    <Box sx={{ py: 2, textAlign: 'center', bgcolor: 'rgba(239,68,68,0.05)', borderRadius: 2, px: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {matchingRecs.length > 0
                                                ? `No available time slots left for ${bookingData.staff?.staff_name} on this day.`
                                                : `${bookingData.staff?.staff_name} is not available on ${getDayNameDisplay(bookingData.date)}s.`
                                            }
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Grid container spacing={1}>
                                        {availableSlots.map(slot => (
                                            <Grid item xs={6} key={slot}>
                                                <Box
                                                    onClick={() => setBookingData({ ...bookingData, slot })}
                                                    sx={{
                                                        textAlign: 'center', py: 1, px: 0.5,
                                                        borderRadius: 2.5, cursor: 'pointer',
                                                        border: '1.5px solid',
                                                        borderColor: bookingData.slot === slot ? '#6366f1' : 'rgba(99,102,241,0.2)',
                                                        bgcolor: bookingData.slot === slot
                                                            ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                                            : 'white',
                                                        background: bookingData.slot === slot
                                                            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                                            : 'white',
                                                        boxShadow: bookingData.slot === slot
                                                            ? '0 4px 12px rgba(99,102,241,0.3)'
                                                            : 'none',
                                                        transition: 'all 0.15s',
                                                        '&:hover': {
                                                            borderColor: '#6366f1',
                                                            bgcolor: bookingData.slot === slot ? undefined : 'rgba(99,102,241,0.06)',
                                                        },
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        fontWeight={700}
                                                        sx={{ color: bookingData.slot === slot ? 'white' : '#6366f1', fontSize: '0.72rem' }}
                                                    >
                                                        {formatSlotLabel(slot, slotDurationMin)}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </>
                        )}
                        <Button fullWidth variant="contained" sx={{
                            mt: 3, borderRadius: 2.5, fontWeight: 700, py: 1.3,
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                            '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                            '&:disabled': { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' },
                        }}
                            disabled={!bookingData.date || !bookingData.slot} onClick={handleNext}>
                            Continue
                        </Button>
                    </Box>
                );
            }

            case 3: {
                const validateAndNext = () => {
                    const errs = {};
                    const { name, phone, email } = bookingData.customer;
                    if (!name.trim()) errs.name = 'Name is required';
                    else if (!/^[A-Za-z .\-']+$/.test(name.trim())) errs.name = 'Name can only contain letters and spaces';
                    if (!phone.trim()) errs.phone = 'Phone number is required';
                    else if (!/^\d{10}$/.test(phone)) errs.phone = 'Enter exactly 10 digits';
                    if (!email.trim()) errs.email = 'Email is required';
                    else if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim())) errs.email = 'Enter a valid email (e.g. user@example.com)';
                    setDetailErrors(errs);
                    if (Object.keys(errs).length === 0) handleNext();
                };
                return (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                            <IconButton size="small" onClick={handleBack}><BackIcon fontSize="small" /></IconButton>
                            <Typography variant="h6" fontWeight={700}>Your Details</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Full Name *" value={bookingData.customer.name}
                                    error={!!detailErrors.name}
                                    helperText={detailErrors.name}
                                    onChange={e => {
                                        // Allow only letters, spaces, hyphens, apostrophes, dots
                                        const val = e.target.value.replace(/[^A-Za-z .\-']/g, '');
                                        setBookingData({ ...bookingData, customer: { ...bookingData.customer, name: val } });
                                        if (detailErrors.name) setDetailErrors(p => ({ ...p, name: undefined }));
                                    }} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Phone Number *" value={bookingData.customer.phone}
                                    error={!!detailErrors.phone}
                                    helperText={detailErrors.phone || '10-digit mobile number'}
                                    inputProps={{ maxLength: 10, inputMode: 'numeric' }}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setBookingData({ ...bookingData, customer: { ...bookingData.customer, phone: val } });
                                        if (detailErrors.phone) setDetailErrors(p => ({ ...p, phone: undefined }));
                                    }} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Email *" value={bookingData.customer.email}
                                    type="email"
                                    error={!!detailErrors.email}
                                    helperText={detailErrors.email}
                                    onChange={e => {
                                        // Strip emojis, control chars, and non-printable characters
                                        const val = e.target.value.replace(/[^\x20-\x7E]/g, '');
                                        setBookingData({ ...bookingData, customer: { ...bookingData.customer, email: val } });
                                        if (detailErrors.email) setDetailErrors(p => ({ ...p, email: undefined }));
                                    }} />
                            </Grid>
                        </Grid>
                        <Button fullWidth variant="contained" sx={{
                            mt: 3, borderRadius: 2.5, fontWeight: 700, py: 1.3,
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                            '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                        }} onClick={validateAndNext}>
                            Review &amp; Pay
                        </Button>
                    </Box>
                );
            }

            case 4:
                return (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                            <IconButton size="small" onClick={handleBack}><BackIcon fontSize="small" /></IconButton>
                            <Typography variant="h6" fontWeight={700}>Confirm & Pay</Typography>
                        </Box>

                        {/* Summary card */}
                        <Card variant="outlined" sx={{ p: 2.5, mb: 3, bgcolor: 'background.default', borderRadius: 2.5 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Order Summary</Typography>
                            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Service</Typography><Typography variant="body2" fontWeight={600}>{bookingData.service?.service_name}</Typography></Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Staff</Typography><Typography variant="body2">{bookingData.staff?.staff_name}</Typography></Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Date</Typography><Typography variant="body2">{formatDate(bookingData.date)}</Typography></Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Time</Typography><Typography variant="body2"><strong>{formatSlotLabel(bookingData.slot, slotDurationMin)}</strong></Typography></Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Duration</Typography><Typography variant="body2">{slotDurationMin} min</Typography></Box>
                            </Box>
                            <Divider sx={{ my: 1.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography fontWeight={700}>Total Amount</Typography>
                                <Typography fontWeight={800} color="text.primary" fontSize="1.1rem">₹{bookingData.service?.price}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant="body2" color="primary.main" fontWeight={600}>Min. to Pay Now</Typography>
                                <Typography variant="body2" fontWeight={700} color="primary.main">₹{bookingData.service?.minimum_booking_charge || bookingData.service?.price}</Typography>
                            </Box>
                        </Card>

                        {/* Amount Input */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                Enter Amount to Pay (₹)
                            </Typography>
                            <TextField
                                fullWidth
                                type="number"
                                size="small"
                                value={bookingData.paidAmount}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val >= 0) {
                                        setBookingData({ ...bookingData, paidAmount: val });
                                    }
                                }}
                                InputProps={{
                                    inputProps: {
                                        min: bookingData.service?.minimum_booking_charge || 0,
                                        max: bookingData.service?.price || 999999
                                    }
                                }}
                                helperText={
                                    bookingData.paidAmount < (bookingData.service?.minimum_booking_charge || 0)
                                        ? `Minimum ₹${bookingData.service?.minimum_booking_charge} required`
                                        : `Remaining: ₹${(Number(bookingData.service?.price || 0) - Number(bookingData.paidAmount)).toFixed(2)}`
                                }
                                error={bookingData.paidAmount < (bookingData.service?.minimum_booking_charge || 0)}
                            />
                        </Box>

                        {/* UPI Payment section */}
                        {(() => {
                            const biz = businesses.find(b => String(b.id) === String(resolvedBusinessId));
                            if (biz?.upi_id) {
                                const upiUri = `upi://pay?pa=${biz.upi_id}&pn=${encodeURIComponent(biz.business_name)}&am=${bookingData.paidAmount}&cu=INR`;
                                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUri)}`;
                                return (
                                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>Scan to Pay ₹{bookingData.paidAmount}</Typography>
                                        <Box sx={{ p: 2, bgcolor: 'white', display: 'inline-block', borderRadius: 3, boxShadow: 1, mb: 1.5 }}>
                                            <img src={qrUrl} alt="UPI QR Code" style={{ width: 140, height: 140, display: 'block' }} />
                                        </Box>
                                    </Box>
                                );
                            }
                            return null;
                        })()}

                        <Button fullWidth variant="contained" size="large" sx={{ mt: 1, borderRadius: 2, py: 1.4, fontWeight: 700 }}
                            onClick={handleConfirmBooking}
                            disabled={loading || bookingData.paidAmount < (bookingData.service?.minimum_booking_charge || 0)}>
                            {loading ? 'Processing...' : `Confirm & Proceed`}
                        </Button>
                    </Box>
                );

            case 5:
                return (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
                            <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                        </motion.div>
                        <Typography variant="h5" fontWeight={800} gutterBottom>Booking Confirmed!</Typography>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                            Your appointment with <strong>{bookingData.staff?.staff_name}</strong> is scheduled for
                        </Typography>
                        <Box sx={{ bgcolor: 'success.50', borderRadius: 2, p: 2, mb: 3, border: '1px solid', borderColor: 'success.200' }}>
                            <Typography fontWeight={700} color="success.dark">{formatDate(bookingData.date)}</Typography>
                            <Typography variant="body2" color="success.main" fontWeight={600}>{formatSlotLabel(bookingData.slot, slotDurationMin)}</Typography>
                            <Typography variant="caption" color="success.main">{bookingData.service?.service_name}</Typography>
                        </Box>
                        <Button variant="outlined" onClick={resetBooking} sx={{ borderRadius: 2 }}>
                            Close
                        </Button>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Fab color="primary" aria-label="book-now" variant="extended"
                sx={{
                    position: 'fixed', bottom: 32, right: 32, zIndex: 1050,
                    boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
                    borderRadius: 3, fontWeight: 700, px: 3,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                }}
                onClick={() => setOpen(true)}>
                <BookIcon sx={{ mr: 1 }} />
                Book Now
            </Fab>

            <Dialog open={open} onClose={resetBooking} maxWidth="xs" fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4, overflow: 'hidden',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
                    }
                }}>

                {/* ── Gradient Header ── */}
                {activeStep < 5 && (
                    <Box sx={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        px: 3, pt: 2.5, pb: 2,
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                                    Step {activeStep + 1} of {steps.length}
                                </Typography>
                                <Typography variant="h6" fontWeight={800} color="white" lineHeight={1.2}>
                                    {steps[activeStep]}
                                </Typography>
                            </Box>
                            <IconButton onClick={resetBooking} size="small"
                                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        {/* Pill step dots */}
                        <Box sx={{ display: 'flex', gap: 0.6 }}>
                            {steps.map((_, i) => (
                                <Box key={i} sx={{
                                    height: 4, flex: 1, borderRadius: 10,
                                    bgcolor: i <= activeStep ? 'white' : 'rgba(255,255,255,0.25)',
                                    transition: 'background 0.3s',
                                }} />
                            ))}
                        </Box>
                    </Box>
                )}

                <DialogContent sx={{ px: 3, pb: 3, pt: 2.5, bgcolor: '#fafbff' }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={activeStep}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.2 }}>
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default BookingWidget;
