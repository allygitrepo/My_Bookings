import React, { useState } from 'react';
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
import { useServices, useStaff, useStaffServices, useAvailability, useBookings, useCustomers, usePayments } from '../store';

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
    const end = eh * 60 + em;
    while (cur + durationMin <= end) {
        const h = Math.floor(cur / 60);
        const m = cur % 60;
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        cur += durationMin;
    }
    return slots;
};

const getDayName = (dateStr) => {
    if (!dateStr) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(dateStr + 'T00:00:00').getDay()];
};

const BookingWidget = () => {
    const [services] = useServices();
    const [staff] = useStaff();
    const [staffServices] = useStaffServices();
    const [availability] = useAvailability();
    const [bookings, setBookings] = useBookings();
    const [customers, setCustomers] = useCustomers();
    const [payments, setPayments] = usePayments();

    const [open, setOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [bookingData, setBookingData] = useState({
        service: null, staff: null, date: '', slot: '', customer: { name: '', email: '', phone: '' },
    });

    const handleNext = () => setActiveStep(p => p + 1);
    const handleBack = () => setActiveStep(p => p - 1);

    const resetBooking = () => { setOpen(false); setActiveStep(0); setBookingData({ service: null, staff: null, date: '', slot: '', customer: { name: '', email: '', phone: '' } }); };

    // Staff who can perform the selected service (using schema id field: staff_id, service_id)
    const availableStaff = bookingData.service
        ? staff.filter(s => staffServices.some(ss => ss.staff_id === s.id && ss.service_id === bookingData.service.id))
        : [];

    // Time slots based on selected staff's slot_duration_minutes and day availability
    const slotDurationMin = Number(bookingData.staff?.slot_duration_minutes) || 30;
    const availableSlots = (() => {
        if (!bookingData.staff || !bookingData.date) return [];
        const dayName = getDayName(bookingData.date);
        const recs = availability.filter(a => a.staff_id === bookingData.staff.id && a.day_of_week === dayName);
        const all = [];
        recs.forEach(r => {
            generateSlots(r.start_time, r.end_time, slotDurationMin).forEach(s => all.push(s));
        });
        return [...new Set(all)].sort();
    })();

    const handleConfirmBooking = () => {
        const now = new Date().toISOString();
        // Find or create customer
        let customerId;
        const existing = customers.find(c => c.email === bookingData.customer.email);
        if (existing) {
            customerId = existing.id;
        } else {
            customerId = Date.now().toString();
            setCustomers([...customers, {
                id: customerId, name: bookingData.customer.name,
                email: bookingData.customer.email, phone: bookingData.customer.phone,
                created_at: now, updated_at: now,
            }]);
        }

        // Compute end_time from slot + staff's slot duration
        const endTime = addMinutes(bookingData.slot, slotDurationMin);

        // Create booking using schema field names
        const bookingId = `BK-${Date.now()}`;
        const newBooking = {
            id: bookingId,
            business_id: bookingData.service.business_id || '',
            location_id: '',
            staff_id: bookingData.staff.id,
            service_id: bookingData.service.id,
            customer_id: customerId,
            booking_date: bookingData.date,
            start_time: bookingData.slot,
            end_time: endTime,
            payment_status: 'Paid',
            status: 'Confirmed',
            created_at: now, updated_at: now,
        };
        setBookings([...bookings, newBooking]);

        // Create payment
        const paymentId = `PAY-${Date.now()}`;
        setPayments([...payments, {
            id: paymentId, booking_id: bookingId,
            amount: bookingData.service.price,
            payment_method: 'Card',
            transaction_id: 'txn_' + crypto.randomUUID().split('-')[0],
            payment_status: 'Completed',
            created_at: now, updated_at: now,
        }]);
        handleNext();
    };

    const renderStep = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Choose a Service</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>Select the service you'd like to book.</Typography>
                        {services.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                                <Typography variant="body2">No services available yet.</Typography>
                            </Box>
                        )}
                        <List disablePadding>
                            {services.map(service => (
                                <ListItem key={service.id} disablePadding sx={{ mb: 1.5 }}>
                                    <ListItemButton
                                        onClick={() => { setBookingData({ ...bookingData, service, staff: null, slot: '' }); handleNext(); }}
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
                            inputProps={{ min: new Date().toISOString().split('T')[0] }}
                            sx={{ mb: 3 }}
                            value={bookingData.date}
                            onChange={e => setBookingData({ ...bookingData, date: e.target.value, slot: '' })}
                        />
                        {bookingData.date && (
                            <>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                    Available Slots — {getDayName(bookingData.date)}
                                </Typography>
                                {availableSlots.length === 0 ? (
                                    <Box sx={{ py: 2, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {bookingData.staff?.staff_name} is not available on {getDayName(bookingData.date)}s.
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
                                <Typography fontWeight={700}>Total</Typography>
                                <Typography fontWeight={800} color="primary.main" fontSize="1.1rem">₹{bookingData.service?.price}</Typography>
                            </Box>
                        </Card>

                        <TextField fullWidth label="Card Number" placeholder="4242 4242 4242 4242" size="small" sx={{ mb: 2 }} />
                        <Grid container spacing={1.5}>
                            <Grid item xs={6}><TextField fullWidth label="Expiry" placeholder="MM/YY" size="small" /></Grid>
                            <Grid item xs={6}><TextField fullWidth label="CVC" placeholder="123" size="small" /></Grid>
                        </Grid>
                        <Button fullWidth variant="contained" size="large" sx={{ mt: 3, borderRadius: 2, py: 1.4, fontWeight: 700 }}
                            onClick={handleConfirmBooking}>
                            Pay ₹{bookingData.service?.price}
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
                sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, boxShadow: 6, borderRadius: 3, fontWeight: 700 }}
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
