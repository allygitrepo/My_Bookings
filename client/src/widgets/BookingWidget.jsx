import React, { useState } from 'react';
import {
    Fab,
    Dialog,
    DialogContent,
    Box,
    Typography,
    IconButton,
    Button,
    Stepper,
    Step,
    StepLabel,
    Card,
    Grid,
    TextField,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Avatar,
    Divider,
} from '@mui/material';
import {
    Event as BookIcon,
    Close as CloseIcon,
    ArrowBack as BackIcon,
    CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useServices,
    useStaff,
    useStaffServices,
    useBookings,
    useCustomers,
    usePayments
} from '../store';

const steps = ['Service', 'Staff', 'Date & Time', 'Details', 'Payment'];

const BookingWidget = () => {
    const [services] = useServices();
    const [staff] = useStaff();
    const [staffServices] = useStaffServices();
    const [bookings, setBookings] = useBookings();
    const [customers, setCustomers] = useCustomers();
    const [payments, setPayments] = usePayments();

    const [open, setOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [bookingData, setBookingData] = useState({
        service: null,
        staff: null,
        date: '',
        time: '',
        customer: { name: '', email: '', phone: '' },
    });

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);

    const selectService = (service) => {
        setBookingData({ ...bookingData, service });
        handleNext();
    };

    const selectStaff = (staffMember) => {
        setBookingData({ ...bookingData, staff: staffMember });
        handleNext();
    };

    const handleConfirmBooking = () => {
        // 1. Find or create Customer
        let customerId;
        const existingCustomer = customers.find(c => c.email === bookingData.customer.email);

        if (existingCustomer) {
            customerId = existingCustomer.id;
        } else {
            customerId = Date.now().toString();
            const newCustomer = {
                id: customerId,
                businessId: bookingData.service.businessId,
                name: bookingData.customer.name,
                email: bookingData.customer.email,
                phone: bookingData.customer.phone,
                createdAt: new Date().toISOString().split('T')[0]
            };
            setCustomers([...customers, newCustomer]);
        }

        // 2. Create Booking
        const bookingId = 'BK' + Date.now().toString().slice(-6);
        const newBooking = {
            id: bookingId,
            customerId,
            serviceId: bookingData.service.id,
            staffId: bookingData.staff.id,
            date: bookingData.date,
            time: bookingData.time,
            bookingStatus: 'Confirmed',
            paymentStatus: 'Paid', // Assuming Paid since they just completed the payment step
        };
        setBookings([...bookings, newBooking]);

        // 3. Create Payment
        const paymentId = 'PAY' + Date.now().toString().slice(-7);
        const newPayment = {
            id: paymentId,
            bookingId: bookingId,
            amount: bookingData.service.price,
            method: 'Credit Card',
            transactionId: 'txn_' + crypto.randomUUID().split('-')[0],
            status: 'Completed',
            date: new Date().toISOString().split('T')[0]
        };
        setPayments([...payments, newPayment]);

        // Proceed to success step
        handleNext();
    };

    const resetBooking = () => {
        setOpen(false);
        setActiveStep(0);
        setBookingData({
            service: null,
            staff: null,
            date: '',
            time: '',
            customer: { name: '', email: '', phone: '' },
        });
    };

    const availableStaff = bookingData.service
        ? staff.filter((s) =>
            staffServices.some((ss) => ss.staffId === s.id && ss.serviceId === bookingData.service.id)
        )
        : [];

    const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

    const renderStep = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                            Select a Service
                        </Typography>
                        <List>
                            {services.length === 0 && (
                                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    No services available right now.
                                </Typography>
                            )}
                            {services.map((service) => (
                                <ListItem key={service.id} disablePadding sx={{ mb: 1 }}>
                                    <ListItemButton
                                        onClick={() => selectService(service)}
                                        sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}
                                    >
                                        <ListItemText
                                            primary={service.name}
                                            secondary={`${service.duration} mins • $${service.price}`}
                                            primaryTypographyProps={{ fontWeight: 600 }}
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
                        <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton size="small" onClick={handleBack}><BackIcon fontSize="small" /></IconButton>
                            Select Staff
                        </Typography>
                        <Grid container spacing={2}>
                            {availableStaff.length === 0 && (
                                <Grid item xs={12}>
                                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                        No staff available for this service.
                                    </Typography>
                                </Grid>
                            )}
                            {availableStaff.map((s) => (
                                <Grid item xs={6} key={s.id}>
                                    <Card
                                        variant="outlined"
                                        sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
                                        onClick={() => selectStaff(s)}
                                    >
                                        <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'secondary.main' }}>{s.name[0]}</Avatar>
                                        <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{s.role}</Typography>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                );
            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton size="small" onClick={handleBack}><BackIcon fontSize="small" /></IconButton>
                            Select Date & Time
                        </Typography>
                        <TextField
                            fullWidth
                            type="date"
                            label="Select Date"
                            InputLabelProps={{ shrink: true }}
                            sx={{ mb: 3 }}
                            onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                        />
                        <Typography variant="subtitle2" gutterBottom>Available Slots</Typography>
                        <Grid container spacing={1}>
                            {timeSlots.map((slot) => (
                                <Grid item xs={4} key={slot}>
                                    <Button
                                        fullWidth
                                        variant={bookingData.time === slot ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => setBookingData({ ...bookingData, time: slot })}
                                    >
                                        {slot}
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3 }}
                            disabled={!bookingData.date || !bookingData.time}
                            onClick={handleNext}
                        >
                            Continue
                        </Button>
                    </Box>
                );
            case 3:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton size="small" onClick={handleBack}><BackIcon fontSize="small" /></IconButton>
                            Your Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    variant="outlined"
                                    value={bookingData.customer.name}
                                    onChange={(e) => setBookingData({ ...bookingData, customer: { ...bookingData.customer, name: e.target.value } })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    variant="outlined"
                                    value={bookingData.customer.email}
                                    onChange={(e) => setBookingData({ ...bookingData, customer: { ...bookingData.customer, email: e.target.value } })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    variant="outlined"
                                    value={bookingData.customer.phone}
                                    onChange={(e) => setBookingData({ ...bookingData, customer: { ...bookingData.customer, phone: e.target.value } })}
                                />
                            </Grid>
                        </Grid>
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3 }}
                            disabled={!bookingData.customer.name || !bookingData.customer.email}
                            onClick={handleNext}
                        >
                            Review & Pay
                        </Button>
                    </Box>
                );
            case 4:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton size="small" onClick={handleBack}><BackIcon fontSize="small" /></IconButton>
                            Payment
                        </Typography>
                        <Card variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f8fafc' }}>
                            <Typography variant="subtitle2" color="text.secondary">Order Summary</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="body2">{bookingData.service?.name}</Typography>
                                <Typography variant="body2" fontWeight={600}>${bookingData.service?.price}</Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body1" fontWeight={700}>Total</Typography>
                                <Typography variant="body1" fontWeight={700} color="primary.main">${bookingData.service?.price}</Typography>
                            </Box>
                        </Card>
                        <TextField fullWidth label="Card Number" placeholder="**** **** **** ****" sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={6}><TextField fullWidth label="Expiry" placeholder="MM/YY" /></Grid>
                            <Grid item xs={6}><TextField fullWidth label="CVC" placeholder="***" /></Grid>
                        </Grid>
                        <Button fullWidth variant="contained" size="large" sx={{ mt: 3 }} onClick={handleConfirmBooking}>
                            Pay Now
                        </Button>
                    </Box>
                );
            case 5:
                return (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
                            <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                        </motion.div>
                        <Typography variant="h5" fontWeight={700} gutterBottom>Booking Confirmed!</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            Your appointment with {bookingData.staff?.name} is scheduled for {bookingData.date} at {bookingData.time}.
                        </Typography>
                        <Button variant="outlined" onClick={resetBooking}>Close</Button>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Fab
                color="primary"
                aria-label="book-now"
                sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, boxShadow: 6 }}
                onClick={() => setOpen(true)}
                variant="extended"
            >
                <BookIcon sx={{ mr: 1 }} />
                Book Now
            </Fab>

            <Dialog
                open={open}
                onClose={resetBooking}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 4, position: 'relative', overflow: 'hidden' }
                }}
            >
                <IconButton
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                    onClick={resetBooking}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent sx={{ p: 4 }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default BookingWidget;
