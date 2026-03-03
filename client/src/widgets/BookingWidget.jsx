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
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date(dateStr + 'T00:00:00').getDay()];
};

const getDayNameDisplay = (dateStr) => {
    if (!dateStr) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(dateStr + 'T00:00:00').getDay()];
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
                        <Typography variant="h6" fontWeight={700} gutterBottom>Choose a Service</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>Select the service you'd like to book.</Typography>
                        {loading ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <LinearProgress sx={{ borderRadius: 2, height: 6, mb: 1.5 }} />
                                <Typography variant="caption" color="text.secondary">Loading services...</Typography>
                            </Box>
                        ) : services.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                                <Typography variant="body2">No services available yet.</Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {services.map(service => (
                                    <ListItem key={service.id} disablePadding sx={{ mb: 1.5 }}>
                                        <ListItemButton
                                            onClick={() => {
                                                setBookingData({
                                                    ...bookingData,
                                                    service,
                                                    staff: null,
                                                    slot: '',
                                                    paidAmount: Number(service.minimum_booking_charge) || Number(service.price)
                                                });
                                                handleNext();
                                            }}
                                            sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: 2.5, p: 2, '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' } }}
                                        >
                                            <ListItemText
                                                primary={<Typography fontWeight={700}>{service.service_name}</Typography>}
                                                secondary={
                                                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <TimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                                                            <Typography variant="caption" color="text.secondary">{service.duration_minutes} min</Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <PriceIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                                                            <Typography variant="caption" color="text.secondary">₹{service.price}</Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                );

            case 1:
                return (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <IconButton size="small" onClick={handleBack}><BackIcon fontSize="small" /></IconButton>
                            <Box>
                                <Typography variant="h6" fontWeight={700}>Select Staff</Typography>
                                <Typography variant="caption" color="text.secondary">Professionals who offer {bookingData.service?.service_name}</Typography>
                            </Box>
                        </Box>
                        {availableStaff.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                                <Typography variant="body2">No staff assigned to this service yet.</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={1.5}>
                                {availableStaff.map(s => (
                                    <Grid item xs={6} key={s.id}>
                                        <Card variant="outlined" onClick={() => { setBookingData({ ...bookingData, staff: s, slot: '' }); handleNext(); }}
                                            sx={{ p: 2, textAlign: 'center', cursor: 'pointer', borderRadius: 2.5, transition: 'all 0.15s', '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50', boxShadow: 2 } }}>
                                            <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'primary.main', width: 44, height: 44, fontSize: '1.1rem' }}>
                                                {s.staff_name?.charAt(0)}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight={700}>{s.staff_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{s.role}</Typography>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                            <IconButton size="small" onClick={handleBack}><BackIcon fontSize="small" /></IconButton>
                            <Typography variant="h6" fontWeight={700}>Pick a Date & Time</Typography>
                        </Box>
                        <TextField
                            fullWidth type="date" label="Select Date"
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                min: new Date().toLocaleDateString('en-CA'), // Formats to YYYY-MM-DD in local time
                            }}
                            sx={{ mb: 3 }}
                            value={bookingData.date}
                            onChange={e => {
                                const selectedDate = e.target.value;
                                const today = new Date().toLocaleDateString('en-CA');
                                if (selectedDate < today) {
                                    toast.error('Please select a future date');
                                    return;
                                }
                                setBookingData({ ...bookingData, date: selectedDate, slot: '' });
                            }}
                        />
                        {bookingData.date && (
                            <>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                    Available Slots — {getDayNameDisplay(bookingData.date)}
                                </Typography>
                                {availableSlots.length === 0 ? (
                                    <Box sx={{ py: 2, textAlign: 'center' }}>
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
                                                <Button
                                                    fullWidth size="small"
                                                    variant={bookingData.slot === slot ? 'contained' : 'outlined'}
                                                    onClick={() => setBookingData({ ...bookingData, slot })}
                                                    sx={{ borderRadius: 2, fontSize: '0.72rem', whiteSpace: 'nowrap', px: 0.5 }}
                                                >
                                                    {formatSlotLabel(slot, slotDurationMin)}
                                                </Button>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </>
                        )}
                        <Button fullWidth variant="contained" sx={{ mt: 3, borderRadius: 2 }}
                            disabled={!bookingData.date || !bookingData.slot} onClick={handleNext}>
                            Continue
                        </Button>
                    </Box>
                );

            case 3:
                return (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                            <IconButton size="small" onClick={handleBack}><BackIcon fontSize="small" /></IconButton>
                            <Typography variant="h6" fontWeight={700}>Your Details</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Full Name *" value={bookingData.customer.name}
                                    onChange={e => setBookingData({ ...bookingData, customer: { ...bookingData.customer, name: e.target.value } })} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Phone Number" value={bookingData.customer.phone}
                                    onChange={e => setBookingData({ ...bookingData, customer: { ...bookingData.customer, phone: e.target.value } })} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Email *" value={bookingData.customer.email}
                                    onChange={e => setBookingData({ ...bookingData, customer: { ...bookingData.customer, email: e.target.value } })} />
                            </Grid>
                        </Grid>
                        <Button fullWidth variant="contained" sx={{ mt: 3, borderRadius: 2 }}
                            disabled={!bookingData.customer.name || !bookingData.customer.email} onClick={handleNext}>
                            Review & Pay
                        </Button>
                    </Box>
                );

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
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Date</Typography><Typography variant="body2">{bookingData.date}</Typography></Box>
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
                            <Typography fontWeight={700} color="success.dark">{bookingData.date}</Typography>
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
                sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1050, boxShadow: 6, borderRadius: 3, fontWeight: 700 }}
                onClick={() => setOpen(true)}>
                <BookIcon sx={{ mr: 1 }} />
                Book Now
            </Fab>

            <Dialog open={open} onClose={resetBooking} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
                <Box sx={{ px: 3, pt: 2.5, pb: 0 }}>
                    {activeStep < 5 && (
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Step {activeStep + 1} of {steps.length}</Typography>
                                <Typography variant="caption" color="primary.main" fontWeight={600}>{steps[activeStep]}</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={((activeStep + 1) / steps.length) * 100} sx={{ borderRadius: 2, height: 4 }} />
                        </Box>
                    )}
                </Box>
                <IconButton sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }} onClick={resetBooking} size="small">
                    <CloseIcon fontSize="small" />
                </IconButton>
                <DialogContent sx={{ px: 3, pb: 3, pt: 1 }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={activeStep} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default BookingWidget;
