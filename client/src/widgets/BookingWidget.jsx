import React, { useState, useEffect } from 'react';
import {
    Fab, Dialog, DialogContent, Box, Typography, IconButton, Button,
    Card, Grid, TextField, List, ListItem, ListItemButton,
    Avatar, Divider, LinearProgress, Chip,
} from '@mui/material';
import {
    Event as BookIcon, Close as CloseIcon, ArrowBack as BackIcon,
    CheckCircle as SuccessIcon, AccessTime as TimeIcon,
    AttachMoney as PriceIcon,
    Google as GoogleIcon,
} from '@mui/icons-material';
import { useGoogleLogin } from '@react-oauth/google';
import { createCalendarEvent, formatBookingToEvent } from '../services/googleCalendar.service';
import { motion, AnimatePresence } from 'framer-motion';
import { getServices } from '../api/service.api';
import { getServiceLocations } from '../api/serviceLocation.api';
import { getApiKeys } from '../api/apiKey.api';
import { getStaff } from '../api/staff.api';
import { getStaffServices } from '../api/staffService.api';
import { getStaffAvailability } from '../api/staffAvailability.api';
import { getCustomers, createCustomer } from '../api/customer.api';
import { getBusinesses, getBusinessByIdPublic } from '../api/business.api';
import { getBookings, createBooking, deleteBooking } from '../api/booking.api';
import { createPayment, createRazorpayOrder, verifyRazorpayPayment, createStripeCheckoutSession, verifyStripePayment } from '../api/payment.api';
import { getLocations } from '../api/location.api';
import { getBusinessClosures } from '../api/businessClosure.api';
import { getStaffLeaves } from '../api/staffLeave.api';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { validateEmail, validateMobile, validateName, blockEmoji } from '../utils/validators';
import { formatDate, getDayName } from '../utils/date';
import PhoneInput from '../components/ui/PhoneInput';

const steps = ['Location', 'Services', 'Staff', 'Date & Time', 'Your Details', 'Payment'];

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
    const finalH = Math.floor(total / 60) % 24;
    const finalM = total % 60;
    return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}:00`;
};

// Format a slot as "9:00 – 9:30"
const formatSlotLabel = (startTime, durationMin) => {
    const end = addMinutes(startTime, durationMin);
    return `${timeFrom24(startTime)} – ${timeFrom24(end)}`;
};

const generateSlots = (startTime, endTime, stepMin, serviceDuration) => {
    const slots = [];
    if (!startTime || !endTime || !stepMin || !serviceDuration) return slots;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let cur = sh * 60 + sm;
    let end = eh * 60 + em;

    // Handle overnight shifts if eh < sh
    if (end <= cur) {
        end += 24 * 60;
    }

    console.log(`Widget: Generating slots from ${startTime} to ${endTime} (step=${stepMin}, service=${serviceDuration}min). cur=${cur}, end=${end}`);

    let lastEnd = -1;
    while (cur + serviceDuration <= end) {
        if (cur >= lastEnd) {
            const h = Math.floor(cur / 60) % 24;
            const m = cur % 60;
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
            slots.push(timeStr);
            lastEnd = cur + serviceDuration;
        }
        cur += stepMin;
    }
    console.log(`Widget: Generated ${slots.length} non-overlapping slots.`);
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

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const formatDuration = (mins) => {
    if (!mins) return '0 min';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} hr ${m} min` : `${h === 1 ? '1 hr' : `${h} hrs`}`;
};

const BookingWidget = ({ businessId, externalOpen = null, onClose = null, hideFab = false, isExpired: externalIsExpired = null, allowSkipPayment = undefined }) => {
    const isPortalDomain = (() => {
        if (typeof window === 'undefined') return false;
        const pathname = window.location.pathname.toLowerCase();

        // ONLY allow if we are explicitly on the Admin Portal Dashboard routes (/bookings, /dashboard, /payments)
        const isAdminPortalRoute = pathname.startsWith('/bookings') || pathname.startsWith('/dashboard') || pathname.startsWith('/payments');
        return isAdminPortalRoute;
    })();

    const canShowSkipPayment = allowSkipPayment !== undefined ? allowSkipPayment : isPortalDomain;
    const [services, setServices] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [staff, setStaff] = useState([]);
    const [staffServices, setStaffServices] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [serviceLocations, setServiceLocations] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvedBusinessId, setResolvedBusinessId] = useState(null);
    const [quotaExceeded, setQuotaExceeded] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    const [open, setOpen] = useState(false);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

    // Sync externalOpen with internal open state
    useEffect(() => {
        console.log("Widget Version 2 Loaded");
        if (externalOpen !== null) {
            setOpen(externalOpen);
        }
    }, [externalOpen]);

    const handleInternalClose = () => {
        setOpen(false);
        if (onClose) onClose();
    };
    const [activeStep, setActiveStep] = useState(0);
    const [bookingData, setBookingData] = useState({
        location: null,
        services: [], // Multi-selection enabled
        staff: null,
        date: '',
        slot: '',
        paidAmount: 0,
        customer: { name: '', phone: '' },
    });
    const [detailErrors, setDetailErrors] = useState({});
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
    const [upiUtr, setUpiUtr] = useState('');

    useEffect(() => {
        if (!canShowSkipPayment && (selectedPaymentMethod === 'venue' || selectedPaymentMethod === 'cash')) {
            setSelectedPaymentMethod('razorpay');
        }
    }, [canShowSkipPayment, selectedPaymentMethod]);
    const [stripeModalOpen, setStripeModalOpen] = useState(false);
    const [stripeCard, setStripeCard] = useState({ number: '', exp: '', cvc: '', name: '' });
    const [stripeProcessing, setStripeProcessing] = useState(false);
    const [pendingBookingId, setPendingBookingId] = useState(null);
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });

    const isExtraSmall = typeof window !== 'undefined' && window.innerWidth < 400;

    const [closures, setClosures] = useState([]);
    const [staffLeaves, setStaffLeaves] = useState([]);

    const fetchData = async () => {
        // If it's a public key, set the header for all subsequent Widget requests
        if (businessId && String(businessId).startsWith('pk_live_')) {
            axiosInstance.defaults.headers.common['x-api-key'] = businessId;
        }

        setLoading(true);
        try {
            const [svcRes, staffRes, ssRes, availRes, custRes, keysRes, bookRes, bizRes, locRes, slRes, closuresRes, leavesRes] = await Promise.allSettled([
                getServices(), getStaff(), getStaffServices(), getStaffAvailability(), getCustomers(), getApiKeys(), getBookings(), getBusinesses(), getLocations(), getServiceLocations(), getBusinessClosures(), getStaffLeaves()
            ]);

            let bizId = businessId;
            console.log('Widget: Input businessId:', businessId);

            // If businessId is an API Key (pk_live_...), resolve the numeric ID
            if (businessId && String(businessId).startsWith('pk_live_')) {
                const matchedKey = (keysRes.status === 'fulfilled' && keysRes.value?.success) ? keysRes.value.data.find(k => k.api_key === businessId) : null;
                if (matchedKey) {
                    bizId = matchedKey.business_id;
                    console.log('Widget: Resolved API Key to Business ID:', bizId);
                } else {
                    console.error('Widget: Could not resolve API Key to a Business ID. Check if the key is correct.');
                    bizId = null; // Don't try to filter using the string key
                }
            }
            const effectiveBizId = bizId || ((bizRes.status === 'fulfilled' && bizRes.value?.success) && bizRes.value.data[0]?.id);
            setResolvedBusinessId(effectiveBizId);

            // Quota Check
            if (effectiveBizId) {
                try {
                    const usageRes = await axiosInstance.get(`/businesses/usage/${effectiveBizId}`);
                    if (usageRes.data.success) {
                        console.log('Widget: Usage Status for', effectiveBizId, ':', usageRes.data);
                        setQuotaExceeded(usageRes.data.canAcceptBooking === false);
                        setIsExpired(usageRes.data.isExpired === true);
                    } else {
                        console.error('Widget: Usage API returned success:false');
                        setQuotaExceeded(false);
                        setIsExpired(false);
                    }
                } catch (e) {
                    console.error('Widget Quota Check Failed:', e);
                }
            }

            // Filter data by resolvedBusinessId if provided
            if (svcRes.status === 'fulfilled' && svcRes.value?.success) {
                const sData = Array.isArray(svcRes.value.data) ? svcRes.value.data : (svcRes.value.data?.rows || []);
                const bizServices = bizId
                    ? sData.filter(s => String(s.business_id) === String(bizId))
                    : sData;
                setServices(bizServices);
            }
            if (staffRes.status === 'fulfilled' && staffRes.value?.success) {
                const stData = Array.isArray(staffRes.value.data) ? staffRes.value.data : (staffRes.value.data?.rows || []);
                const bizStaff = bizId
                    ? stData.filter(s => String(s.business_id) === String(bizId))
                    : stData;
                setStaff(bizStaff);
            }
            if (ssRes.status === 'fulfilled' && ssRes.value?.success) setStaffServices(Array.isArray(ssRes.value.data) ? ssRes.value.data : (ssRes.value.data?.rows || []));
            if (availRes.status === 'fulfilled' && availRes.value?.success) setAvailability(Array.isArray(availRes.value.data) ? availRes.value.data : (availRes.value.data?.rows || []));
            if (custRes.status === 'fulfilled' && custRes.value?.success) setCustomers(Array.isArray(custRes.value.data) ? custRes.value.data : (custRes.value.data?.rows || []));
            let fetchedBizList = [];
            if (bizRes.status === 'fulfilled' && bizRes.value?.success) {
                fetchedBizList = Array.isArray(bizRes.value.data) ? bizRes.value.data : (bizRes.value.data?.rows || []);
            }
            if (fetchedBizList.length === 0 && effectiveBizId) {
                try {
                    const pubBiz = await getBusinessByIdPublic(effectiveBizId);
                    if (pubBiz?.success && pubBiz.data?.business) {
                        fetchedBizList = [pubBiz.data.business];
                    }
                } catch (e) {
                    console.warn('Widget public business fetch fallback:', e);
                }
            }
            setBusinesses(fetchedBizList);
            if (locRes.status === 'fulfilled' && locRes.value?.success) {
                const lData = Array.isArray(locRes.value.data) ? locRes.value.data : (locRes.value.data?.rows || []);
                const bizLocs = bizId
                    ? lData.filter(l => String(l.business_id) === String(bizId))
                    : lData;
                setLocations(bizLocs);
            }
            if (slRes.status === 'fulfilled' && slRes.value?.success) setServiceLocations(Array.isArray(slRes.value.data) ? slRes.value.data : (slRes.value.data?.rows || []));
            if (closuresRes.status === 'fulfilled' && closuresRes.value?.success) setClosures(Array.isArray(closuresRes.value.data) ? closuresRes.value.data : (closuresRes.value.data?.rows || []));
            if (leavesRes.status === 'fulfilled' && leavesRes.value?.success) setStaffLeaves(Array.isArray(leavesRes.value.data) ? leavesRes.value.data : (leavesRes.value.data?.rows || []));
        } catch (error) {
            console.error('Widget Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (open) fetchData();
    }, [open, businessId]);

    useEffect(() => {
        if (resolvedBusinessId && businesses.length > 0) {
            const targetBiz = businesses.find(b => String(b.id) === String(resolvedBusinessId));
            if (targetBiz) {
                if (targetBiz.stripe_enabled && targetBiz.stripe_publishable_key) {
                    setSelectedPaymentMethod('stripe');
                } else if (targetBiz.razorpay_enabled && targetBiz.razorpay_key_id) {
                    setSelectedPaymentMethod('razorpay');
                } else if (targetBiz.upi_enabled) {
                    setSelectedPaymentMethod('upi');
                } else if (targetBiz.cash_on_arrival_enabled !== false) {
                    setSelectedPaymentMethod('cash');
                }
            }
        }
    }, [resolvedBusinessId, businesses]);

    const activeBusiness = businesses.find(b => String(b.id) === String(resolvedBusinessId)) || businesses[0];

    const getLogoUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
        const rawBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        if (rawBase.endsWith('/mybookings') && cleanUrl.startsWith('/mybookings/')) {
            const origin = rawBase.replace(/\/mybookings\/?$/, '');
            return `${origin}${cleanUrl}`;
        }
        return `${rawBase}${cleanUrl}`;
    };

    // Handle clicks on elements with the 'mybookings-trigger' class
    useEffect(() => {
        const handleTriggerClick = (e) => {
            // Find if the clicked element or any of its parents has the trigger class
            const trigger = e.target.closest('.mybookings-trigger');
            if (trigger) {
                e.preventDefault();
                setOpen(true);
            }
        };

        document.addEventListener('click', handleTriggerClick);
        return () => document.removeEventListener('click', handleTriggerClick);
    }, []);

    const handleNext = () => setActiveStep(p => p + 1);
    const handleBack = () => setActiveStep(p => p - 1);

    const resetBooking = () => {
        setOpen(false);
        if (onClose) onClose();
        setActiveStep(0);
        setDetailErrors({});
        setBookingData({
            location: null,
            service: null,
            services: [],
            staff: null,
            date: '',
            slots: [], // Changed from slot to slots array
            paidAmount: 0,
            customer: { name: '', phone: '' }
        });
    };

    // Staff who can perform ALL selected services and belong to the selected location
    const availableStaff = (bookingData.services.length > 0 && bookingData.location)
        ? staff.filter(s => {
            const isAtLocation = s.locations?.some(l => String(l.id) === String(bookingData.location.id));
            const canPerformAll = bookingData.services.every(svc =>
                staffServices.some(ss => ss.staff_id === s.id && ss.service_id === svc.id)
            );
            return isAtLocation && canPerformAll;
        })
        : [];

    // Total duration for all selected services
    const totalDuration = bookingData.services.reduce((acc, s) => acc + (Number(s.duration_minutes) || 0), 0);
    // Time slots use staff's slot_duration_minutes as the "step" for availability
    const slotStepMin = Number(bookingData.staff?.slot_duration_minutes) || 30;

    // Final booking duration is the sum of service durations, or staff slot step if no services selected
    const bookingDuration = totalDuration > 0 ? totalDuration : slotStepMin;

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
            const isLocationMatch = String(a.location_id) === String(bookingData.location.id);
            const backendDay = String(a.day_of_week).toLowerCase();
            const isDayMatch = backendDay === internalDay ||
                backendDay === internalDay.slice(0, 3) ||
                backendDay.startsWith(internalDay.slice(0, 3));

            return isStaffMatch && isLocationMatch && isDayMatch;
        });
        console.log('Widget Matched Records:', filtered);
        return filtered;
    })();

    const availableSlots = (() => {
        if (matchingRecs.length === 0) return [];
        const all = [];
        matchingRecs.forEach(r => {
            console.log(` - Record ${r.id}: ${r.start_time} - ${r.end_time}`);
            // Generate all possible base slots (stepMin duration each)
            generateSlots(r.start_time, r.end_time, slotStepMin, slotStepMin).forEach(s => all.push(s));
        });

        const uniqueSlots = [...new Set(all)].sort();

        const getDayNameFromDateStr = (dateStr) => {
            if (!dateStr) return '';
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long' });
        };

        const isClosureActiveOnDate = (c, dateStr) => {
            if (c.status !== true && String(c.status) !== '1') return false;
            if (c.is_recurring) {
                const dayOfWeek = getDayNameFromDateStr(dateStr);
                const days = (c.recurring_day || '').split(',').map(d => d.trim().toLowerCase());
                return days.includes(dayOfWeek.toLowerCase());
            }
            return c.start_date <= dateStr && c.end_date >= dateStr;
        };

        // Check if business is closed all day
        const isBusinessClosedAllDay = closures.some(c => {
            if (c.is_all_day === false) return false;
            return isClosureActiveOnDate(c, bookingData.date);
        });
        if (isBusinessClosedAllDay) return [];

        // Check if staff member is on full-day leave
        const isStaffOnLeaveAllDay = staffLeaves.some(l => {
            if (String(l.staff_id) !== String(bookingData.staff?.id)) return false;
            if (l.status !== true && String(l.status) !== '1') return false;
            if (l.approval_status !== 'Approved') return false;
            if (l.is_all_day === false) return false;
            return l.start_date <= bookingData.date && l.end_date >= bookingData.date;
        });
        if (isStaffOnLeaveAllDay) return [];

        // BLOCK ALREADY BOOKED SLOTS, PAST SLOTS FOR TODAY, CLOSURES, AND LEAVES
        return uniqueSlots.filter(slot => {
            // Check if slot is in the past (for today)
            const now = new Date();
            const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            if (bookingData.date === todayStr) {
                const curTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
                if (slot < curTime) return false;
            }

            const slotStart = slot;
            const slotEnd = addMinutes(slot, slotStepMin);

            // Check partial Business Closures
            const isClosedAtSlot = closures.some(c => {
                if (!isClosureActiveOnDate(c, bookingData.date)) return false;
                if (c.is_all_day !== false) return true;
                if (!c.start_time || !c.end_time) return false;
                return (slotStart < c.end_time && slotEnd > c.start_time);
            });
            if (isClosedAtSlot) return false;

            // Check partial Staff Leaves
            const isStaffOnLeaveAtSlot = staffLeaves.some(l => {
                if (String(l.staff_id) !== String(bookingData.staff?.id)) return false;
                if (l.status !== true && String(l.status) !== '1') return false;
                if (l.approval_status !== 'Approved') return false;
                if (l.start_date > bookingData.date || l.end_date < bookingData.date) return false;
                if (l.is_all_day !== false) return true;
                if (!l.start_time || !l.end_time) return false;
                return (slotStart < l.end_time && slotEnd > l.start_time);
            });
            if (isStaffOnLeaveAtSlot) return false;

            const isAlreadyBooked = bookings.some(b => {
                if (String(b.staff_id) !== String(bookingData.staff.id)) return false;
                if (String(b.booking_date) !== String(bookingData.date)) return false;
                if (b.status !== true && String(b.status) !== '1') return false;

                // Check overlap: (StartA < EndB) and (EndA > StartB)
                const startA = slotStart;
                const endA = slotEnd;
                const startB = b.start_time;
                const endB = b.end_time || addMinutes(b.start_time, slotStepMin); // fallback if end_time missing

                return (startA < endB && endA > startB);
            });
            return !isAlreadyBooked;
        });
    })();

    const activeClosureNotice = (() => {
        if (!bookingData.date) return null;
        const closure = closures.find(c => {
            if (c.status !== true && String(c.status) !== '1') return false;
            return c.start_date <= bookingData.date && c.end_date >= bookingData.date;
        });
        if (!closure) return null;
        return {
            title: closure.title,
            reason: closure.reason,
            timing: closure.is_all_day !== false ? 'Closed All Day' : `${closure.start_time} - ${closure.end_time}`
        };
    })();

    const activeLeaveNotice = (() => {
        if (!bookingData.date || !bookingData.staff?.id) return null;
        const leave = staffLeaves.find(l => {
            if (String(l.staff_id) !== String(bookingData.staff.id)) return false;
            if (l.status !== true && String(l.status) !== '1') return false;
            if (l.approval_status !== 'Approved') return false;
            return l.start_date <= bookingData.date && l.end_date >= bookingData.date;
        });
        if (!leave) return null;
        return {
            staffName: bookingData.staff.staff_name,
            timing: leave.is_all_day !== false ? 'Full Day' : `${leave.start_time} - ${leave.end_time}`
        };
    })();

    // Helper to handle slot selection
    const handleSlotClick = (slot) => {
        const currentSlots = [...(bookingData.slots || [])];
        const index = currentSlots.indexOf(slot);

        if (index > -1) {
            // Deselect: Remove from array
            currentSlots.splice(index, 1);
        } else {
            // Select: Only allow if not already fulfilled
            if (currentSlots.length * slotStepMin >= totalDuration) {
                toast.error(`Required duration of ${formatDuration(totalDuration)} already fulfilled.`);
                return;
            }
            currentSlots.push(slot);
        }

        setBookingData({ ...bookingData, slots: currentSlots.sort() });
    };

    const selectedDuration = (bookingData.slots?.length || 0) * slotStepMin;
    const isDurationMet = selectedDuration >= totalDuration;

    // Check if selected slots are consecutive
    const areSlotsConsecutive = (() => {
        if (!bookingData.slots || bookingData.slots.length <= 1) return true;
        const sorted = [...bookingData.slots].sort();
        for (let i = 0; i < sorted.length - 1; i++) {
            if (addMinutes(sorted[i], slotStepMin) !== sorted[i + 1]) return false;
        }
        return true;
    })();

    const handleConfirmBooking = async (skipPayment = false) => {
        setLoading(true);
        try {
            // 1. Find or create customer
            let customerId;
            const existing = customers.find(c => c.phone === bookingData.customer.phone);

            if (existing) {
                customerId = existing.id;
            } else {
                console.log('Widget: Creating new customer with businessId:', resolvedBusinessId);
                const custRes = await createCustomer({
                    business_id: resolvedBusinessId,
                    name: bookingData.customer.name,
                    phone: bookingData.customer.phone
                });
                if (!custRes.success) {
                    console.error('Widget: Customer creation failed:', custRes.message);
                    throw new Error(custRes.message);
                }
                customerId = custRes.data.id;
            }

            // 2. Create booking
            const startSlot = [...bookingData.slots].sort()[0];
            const finalDuration = bookingData.slots.length * slotStepMin;
            const totalAmount = bookingData.services.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
            const minAmountToPay = bookingData.services.reduce((acc, s) => acc + (Number(s.minimum_booking_charge) || Number(s.min_booking_charge) || Number(s.price) || 0), 0);
            const amountToPayNow = minAmountToPay;

            const isSkip = canShowSkipPayment && (skipPayment === true || selectedPaymentMethod === 'venue');
            const isOnline = !isSkip && (selectedPaymentMethod === 'stripe' || selectedPaymentMethod === 'razorpay');
            const bookingPayload = {
                business_id: resolvedBusinessId,
                location_id: bookingData.location.id,
                staff_id: bookingData.staff.id,
                service_id: bookingData.services[0].id,
                service_ids: bookingData.services.map(s => s.id),
                customer_id: customerId,
                booking_date: bookingData.date,
                start_time: startSlot,
                end_time: addMinutes(startSlot, finalDuration),
                payment_status: isSkip ? true : (isOnline ? false : (selectedPaymentMethod === 'upi' ? true : false)),
                booking_status: 'Confirmed',
                skip_payment: isSkip,
                payment_method: isSkip ? 'Pay at Venue / Cash' : selectedPaymentMethod,
                status: true,
                is_widget_request: true
            };

            const bookingRes = await createBooking(bookingPayload);
            if (!bookingRes.success) throw new Error(bookingRes.message);
            const bookingId = bookingRes.data.id;
            let createdBookingId = bookingId;

            // Direct confirm for skip payment / pay at venue
            if (isSkip) {
                setActiveStep(6);
                setLoading(false);
                toast.success("Booking confirmed successfully!");
                return;
            }

            // Route by selected payment method
            if (selectedPaymentMethod === 'stripe') {
                const sessionRes = await createStripeCheckoutSession({
                    amount: amountToPayNow,
                    booking_id: bookingId,
                    business_id: resolvedBusinessId,
                    service_name: bookingData.services.map(s => s.service_name).join(', ')
                });

                if (sessionRes.success && sessionRes.url) {
                    // Redirect customer directly to Stripe's Official Hosted Payment Page!
                    window.location.href = sessionRes.url;
                    return;
                } else {
                    if (createdBookingId) await deleteBooking(createdBookingId);
                    throw new Error(sessionRes.message || "Failed to launch Stripe official Checkout page");
                }
            } else if (selectedPaymentMethod === 'razorpay') {
                const orderRes = await createRazorpayOrder({
                    amount: amountToPayNow,
                    booking_id: bookingId,
                    business_id: resolvedBusinessId
                });

                if (!orderRes.success) {
                    if (createdBookingId) await deleteBooking(createdBookingId);
                    throw new Error(orderRes.message);
                }

                const isLoaded = await loadRazorpayScript();
                if (!isLoaded) {
                    toast.error("Razorpay SDK failed to load. Are you online?");
                    setLoading(false);
                    if (createdBookingId) await deleteBooking(createdBookingId);
                    return;
                }

                const biz = businesses.find(b => String(b.id) === String(resolvedBusinessId));
                const options = {
                    key: orderRes.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
                    amount: orderRes.order.amount,
                    currency: orderRes.order.currency,
                    name: biz?.business_name || "My Bookings",
                    description: `Booking for ${bookingData.services.map(s => s.service_name).join(', ')}`,
                    order_id: orderRes.order.id,
                    handler: async (response) => {
                        try {
                            setLoading(true);
                            const verifyRes = await verifyRazorpayPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                booking_id: bookingId,
                                amount: totalAmount,
                                paid_amount: amountToPayNow
                            });

                            if (verifyRes.success) {
                                handleNext();
                            } else {
                                throw new Error(verifyRes.message);
                            }
                        } catch (err) {
                            toast.error(err.message || "Payment verification failed");
                            if (createdBookingId) await deleteBooking(createdBookingId);
                        } finally {
                            setLoading(false);
                        }
                    },
                    prefill: {
                        name: bookingData.customer.name,
                        contact: bookingData.customer.phone
                    },
                    theme: { color: "#6366f1" },
                    modal: {
                        ondismiss: async () => {
                            setLoading(false);
                            if (createdBookingId) {
                                try { await deleteBooking(createdBookingId); } catch (e) { }
                            }
                        }
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            } else if (selectedPaymentMethod === 'upi') {
                await createPayment({
                    booking_id: bookingId,
                    business_id: resolvedBusinessId,
                    amount: totalAmount,
                    paid_amount: amountToPayNow,
                    payment_method: `UPI ${upiUtr ? `(Ref: ${upiUtr})` : ''}`,
                    payment_status: true,
                    transaction_id: upiUtr || `UPI_${Date.now()}`
                });
                handleNext();
            } else if (selectedPaymentMethod === 'cash') {
                await createPayment({
                    booking_id: bookingId,
                    business_id: resolvedBusinessId,
                    amount: totalAmount,
                    paid_amount: 0,
                    payment_method: 'Pay at Venue (Cash)',
                    payment_status: false,
                    transaction_id: `CASH_${Date.now()}`
                });
                handleNext();
            }
        } catch (error) {
            toast.error(error.message || 'Booking failed');
            setLoading(false);
        }
    };

    const handleConfirmStripePayment = async () => {
        if (!pendingBookingId) return;
        setStripeProcessing(true);
        try {
            const totalAmount = bookingData.services.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
            const minAmountToPay = bookingData.services.reduce((acc, s) => acc + (Number(s.minimum_booking_charge) || Number(s.price) || 0), 0);
            const amountToPayNow = bookingData.paidAmount || minAmountToPay;

            const verifyRes = await verifyStripePayment({
                payment_intent_id: `pi_stripe_${Date.now()}`,
                booking_id: pendingBookingId,
                amount: totalAmount,
                paid_amount: amountToPayNow
            });

            if (verifyRes.success) {
                toast.success('Stripe Payment completed successfully!');
                setStripeModalOpen(false);
                handleNext();
            } else {
                throw new Error(verifyRes.message || 'Stripe payment failed');
            }
        } catch (err) {
            toast.error(err.message || 'Stripe Payment Error');
        } finally {
            setStripeProcessing(false);
        }
    };

    /*
    // Calendar Sync Disabled
    // Google Calendar Sync Logic for Widget
    const [googleToken, setGoogleToken] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSynced, setIsSynced] = useState(false);

    const googleLogin = useGoogleLogin({
        onSuccess: tokenResponse => {
            setGoogleToken(tokenResponse.access_token);
            performWidgetSync(tokenResponse.access_token);
        },
        onError: error => toast.error('Google login failed'),
        scope: 'https://www.googleapis.com/auth/calendar.events',
    });

    const performWidgetSync = async (token) => {
        setIsSyncing(true);
        try {
            const primaryService = bookingData.services[0];
            const staffMember = bookingData.staff;
            const location = bookingData.location;
            const customer = bookingData.customer;

            // Reconstruct a booking-like object for the formatter
            const bookingProxy = {
                booking_date: bookingData.date,
                start_time: bookingData.slots.sort()[0],
                end_time: addMinutes(bookingData.slots.sort()[0], bookingData.slots.length * slotStepMin),
                id: 'New Booking'
            };

            const eventData = formatBookingToEvent(bookingProxy, { 
                customer, 
                service: primaryService, 
                staff: staffMember, 
                location 
            });

            await createCalendarEvent(token, eventData);
            setIsSynced(true);
            
            // Also mark in global synced list if possible
            try {
                const globalSyncs = JSON.parse(localStorage.getItem('syncedBookingIds') || '[]');
                localStorage.setItem('syncedBookingIds', JSON.stringify([...new Set([...globalSyncs, 'widget_last_sync'])]));
            } catch (_) {}

            toast.success('Added to Google Calendar!');
        } catch (error) {
            toast.error(error.message || 'Failed to sync to Google Calendar');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleGoogleSync = () => {
        if (googleToken) {
            performWidgetSync(googleToken);
        } else {
            googleLogin();
        }
    };
    */
    const isSyncing = false;
    const isSynced = false;
    const handleGoogleSync = () => { };

    const renderStep = () => {
        switch (activeStep) {
            case 0: // Location Selection
                return (
                    <Box>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Select a location to see available services.
                        </Typography>
                        {loading ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <LinearProgress sx={{ borderRadius: 2, height: 6, mb: 1.5, bgcolor: 'rgba(99,102,241,0.1)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' } }} />
                                <Typography variant="caption" color="text.secondary">Loading locations...</Typography>
                            </Box>
                        ) : locations.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                                <Typography variant="body2">No locations available.</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {locations.map(loc => (
                                    <Box key={loc.id}
                                        onClick={() => {
                                            setBookingData({ ...bookingData, location: loc, services: [], staff: null, slots: [] });
                                            handleNext();
                                        }}
                                        sx={{
                                            p: 2, borderRadius: 3, cursor: 'pointer',
                                            border: '1.5px solid', borderColor: bookingData.location?.id === loc.id ? '#6366f1' : 'rgba(99,102,241,0.15)',
                                            bgcolor: bookingData.location?.id === loc.id ? 'rgba(99,102,241,0.05)' : 'background.paper',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                            transition: 'all 0.18s',
                                            '&:hover': {
                                                borderColor: '#6366f1',
                                                boxShadow: '0 4px 20px rgba(99,102,241,0.15)',
                                                transform: 'translateY(-2px)',
                                            },
                                        }}
                                    >
                                        <Typography fontWeight={700} fontSize="0.95rem">{loc.location_name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {loc.location_type === 'Online' ? 'Online / Virtual' : `${loc.address}, ${loc.city}`}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                );

            case 1: // Service Selection (Multi-selection enabled)
                return (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <IconButton size="small" onClick={handleBack}
                                sx={{ bgcolor: 'rgba(99,102,241,0.08)', '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' } }}>
                                <BackIcon fontSize="small" sx={{ color: '#6366f1' }} />
                            </IconButton>
                            <Typography variant="caption" color="text.secondary">Select one or more services at <strong>{bookingData.location?.location_name}</strong></Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                            {services.filter(svc => {
                                // Only show services assigned to THIS location
                                return serviceLocations.some(sl => sl.service_id === svc.id && String(sl.location_id) === String(bookingData.location.id));
                            }).map(service => {
                                const isSelected = bookingData.services.some(s => s.id === service.id);
                                return (
                                    <Box key={service.id}
                                        onClick={() => {
                                            const newServices = isSelected
                                                ? bookingData.services.filter(s => s.id !== service.id)
                                                : [...bookingData.services, service];
                                            setBookingData({ ...bookingData, services: newServices, staff: null, slots: [] });
                                        }}
                                        sx={{
                                            p: 2, borderRadius: 3, cursor: 'pointer',
                                            border: '1.5px solid', borderColor: isSelected ? '#6366f1' : 'rgba(99,102,241,0.15)',
                                            bgcolor: isSelected ? 'rgba(99,102,241,0.05)' : 'background.paper',
                                            boxShadow: isSelected ? '0 4px 12px rgba(99,102,241,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
                                            transition: 'all 0.18s',
                                            '&:hover': {
                                                borderColor: '#6366f1',
                                                transform: 'translateY(-2px)',
                                            },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                <Typography fontWeight={700} fontSize="0.95rem">{service.service_name}</Typography>
                                                {service.service_type && (
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', px: 1, py: 0.2, borderRadius: 1, bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 800 }}>
                                                        {service.service_type}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{
                                                width: 20, height: 20, borderRadius: '4px',
                                                border: '2px solid', borderColor: isSelected ? '#6366f1' : '#cbd5e1',
                                                bgcolor: isSelected ? '#6366f1' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}>
                                                {isSelected && <SuccessIcon sx={{ fontSize: 14, color: 'white' }} />}
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 2, mt: 0.8 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <TimeIcon sx={{ fontSize: 13, color: '#6366f1' }} />
                                                <Typography variant="caption" color="text.secondary" fontWeight={500}>{service.duration_minutes} min</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                {Number(service.minimum_booking_charge || service.min_booking_charge || 0) > 0 && Number(service.minimum_booking_charge || service.min_booking_charge || 0) < Number(service.price || 0) ? (
                                                    <>
                                                        <Typography variant="caption" fontWeight={800} color="primary.main" sx={{ bgcolor: 'rgba(99,102,241,0.1)', px: 1, py: 0.2, borderRadius: 1 }}>
                                                            Min. Pay: ₹{service.minimum_booking_charge || service.min_booking_charge}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                                            ₹{service.price}
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <Typography variant="caption" fontWeight={700} color="success.main">₹{service.price}</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>

                        {bookingData.services.length > 0 && (
                            <Box sx={{
                                mb: 3, p: 2, borderRadius: 3, bgcolor: '#6366f1', color: 'white',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                                animation: 'fadeInUp 0.3s ease-out'
                            }}>
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, display: 'block', letterSpacing: 0.5 }}>MINIMUM DURATION</Typography>
                                    <Typography variant="h6" fontWeight={800}>{formatDuration(totalDuration)}</Typography>
                                </Box>
                                <Button
                                    onClick={handleNext}
                                    sx={{
                                        backgroundColor: '#ffffff !important',
                                        color: '#6366f1 !important',
                                        fontWeight: 900,
                                        px: 3,
                                        py: 1,
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        '&:hover': { backgroundColor: '#f0f0f0 !important' },
                                    }}
                                >
                                    Continue
                                </Button>
                            </Box>
                        )}
                    </Box>
                );

            case 2: // Staff Selection
                return (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <IconButton size="small" onClick={handleBack}
                                sx={{ bgcolor: 'rgba(99,102,241,0.08)', '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' } }}>
                                <BackIcon fontSize="small" sx={{ color: '#6366f1' }} />
                            </IconButton>
                            <Typography variant="caption" color="text.secondary">Select a professional for your services</Typography>
                        </Box>
                        {availableStaff.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                                <Typography variant="body2">No staff available who can perform all selected services at this location.</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={1.5}>
                                {availableStaff.map(s => {
                                    const isSelected = bookingData.staff?.id === s.id;
                                    return (
                                        <Grid item xs={6} key={s.id}>
                                            <Box onClick={() => { setBookingData({ ...bookingData, staff: s, slots: [] }); handleNext(); }}
                                                sx={{
                                                    p: 2, textAlign: 'center', cursor: 'pointer',
                                                    borderRadius: 4, bgcolor: 'background.paper',
                                                    border: '1.5px solid', borderColor: isSelected ? '#6366f1' : 'rgba(99,102,241,0.1)',
                                                    boxShadow: isSelected ? '0 8px 16px rgba(99,102,241,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        borderColor: '#6366f1',
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: '0 12px 20px rgba(99,102,241,0.15)',
                                                    },
                                                }}
                                            >
                                                <Avatar
                                                    src={s.photo}
                                                    sx={{
                                                        width: 64, height: 64, mx: 'auto', mb: 1.5,
                                                        border: '2px solid', borderColor: isSelected ? '#6366f1' : 'transparent',
                                                        p: isSelected ? 0.3 : 0,
                                                        bgcolor: 'primary.50', color: 'primary.main', fontWeight: 700, fontSize: '1.4rem'
                                                    }}
                                                >
                                                    {s.staff_name?.charAt(0)}
                                                </Avatar>
                                                <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ color: isSelected ? '#6366f1' : 'inherit' }}>{s.staff_name}</Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2, fontWeight: 500 }}>{s.role || 'Professional'}</Typography>
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        )}
                    </Box>
                );

            case 3: { // Date & Time
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
                    setBookingData(prev => ({ ...prev, date: iso, slots: [] }));
                    setTimeout(() => {
                        const el = document.getElementById('timing-slots-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 150);
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

                        {!isDurationMet && (
                            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(245,158,11,0.08)', border: '1px solid', borderColor: 'rgba(245,158,11,0.2)' }}>
                                <Typography variant="caption" fontWeight={700} color="#b45309" sx={{ display: 'block' }}>
                                    MINIMUM DURATION REQUIRED: {formatDuration(totalDuration)}
                                </Typography>
                                <Typography variant="caption" color="#d97706">
                                    Selected: {formatDuration(selectedDuration)}. Need {formatDuration(totalDuration - selectedDuration)} more.
                                </Typography>
                            </Box>
                        )}

                        {bookingData.slots?.length > 0 && !areSlotsConsecutive && (
                            <Box sx={{ mb: 2, p: 1, borderRadius: 2, bgcolor: 'rgba(239,68,68,0.08)', border: '1px solid', borderColor: 'rgba(239,68,68,0.2)' }}>
                                <Typography variant="caption" fontWeight={700} color="error.main">
                                    Error: Selected slots must be consecutive.
                                </Typography>
                            </Box>
                        )}

                        {/* ── Modern Inline Calendar ── */}
                        <Box sx={{
                            border: '1.5px solid', borderColor: 'divider', borderRadius: 3,
                            overflow: 'hidden', mb: 2.5,
                            bgcolor: 'background.paper',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
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
                                    const isClosedDay = closures.some(c => {
                                        if (c.status !== true && String(c.status) !== '1') return false;
                                        if (c.is_all_day === false) return false;
                                        if (c.is_recurring) {
                                            const dayOfWeek = new Date(year, month, d).toLocaleDateString('en-US', { weekday: 'long' });
                                            const days = (c.recurring_day || '').split(',').map(td => td.trim().toLowerCase());
                                            return days.includes(dayOfWeek.toLowerCase());
                                        }
                                        return c.start_date <= iso && c.end_date >= iso;
                                    });
                                    const isOnLeaveDay = staffLeaves.some(l => String(l.staff_id) === String(bookingData.staff?.id) && (l.status === true || String(l.status) === '1') && l.approval_status === 'Approved' && l.start_date <= iso && l.end_date >= iso && l.is_all_day !== false);

                                    return (
                                        <Box key={d}
                                            onClick={() => handleCalDay(d)}
                                            sx={{
                                                textAlign: 'center', py: 0.7,
                                                borderRadius: 2,
                                                position: 'relative',
                                                cursor: isPast ? 'default' : 'pointer',
                                                bgcolor: isSelected ? '#6366f1' : (isOnLeaveDay ? 'rgba(245,158,11,0.08)' : isClosedDay ? 'rgba(239,68,68,0.08)' : 'transparent'),
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
                                                    color: isSelected ? 'white' : isPast ? 'text.disabled' : isOnLeaveDay ? 'warning.main' : isClosedDay ? 'error.main' : 'text.primary',
                                                    fontSize: '0.8rem',
                                                }}
                                            >{d}</Typography>
                                            {(isOnLeaveDay || isClosedDay) && (
                                                <Box sx={{
                                                    width: 4, height: 4, borderRadius: '50%', mx: 'auto', mt: 0.2,
                                                    bgcolor: isSelected ? 'white' : isOnLeaveDay ? 'warning.main' : 'error.main'
                                                }} />
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* Time slots */}
                        {bookingData.date && (
                            <Box id="timing-slots-section" sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#6366f1' }}>
                                        Available Slots — {getDayNameDisplay(bookingData.date)}
                                    </Typography>
                                    <Chip
                                        label={`Required: ${formatDuration(totalDuration)}`}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 700, borderRadius: 1.5 }}
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                    Select multiple slots to fulfill the {formatDuration(totalDuration)} requirement.
                                </Typography>
                                {availableSlots.length === 0 ? (
                                    <Box sx={{
                                        py: 2.5, px: 2, textAlign: 'center', borderRadius: 2.5,
                                        bgcolor: activeLeaveNotice ? 'rgba(245, 158, 11, 0.12)' : activeClosureNotice ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239,68,68,0.05)',
                                        border: '1px solid',
                                        borderColor: activeLeaveNotice ? 'rgba(245, 158, 11, 0.4)' : activeClosureNotice ? 'rgba(239, 68, 68, 0.4)' : 'transparent'
                                    }}>
                                        {activeLeaveNotice ? (
                                            <Box>
                                                <Typography variant="subtitle2" color="warning.main" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                    🏖️ {activeLeaveNotice.staffName} is on leave.
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                    {activeLeaveNotice.timing === 'Full Day' ? 'Not available on this date.' : `Unavailable during ${activeLeaveNotice.timing}`}
                                                </Typography>
                                            </Box>
                                        ) : activeClosureNotice ? (
                                            <Box>
                                                <Typography variant="subtitle2" color="error.main" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                    🏬 Business Closed: {activeClosureNotice.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                    Timing: {activeClosureNotice.timing} {activeClosureNotice.reason ? `• "${activeClosureNotice.reason}"` : ''}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                {matchingRecs.length > 0
                                                    ? `No available time slots left for ${bookingData.staff?.staff_name} on this day.`
                                                    : `${bookingData.staff?.staff_name} is not available on ${getDayNameDisplay(bookingData.date)}s.`
                                                }
                                            </Typography>
                                        )}
                                    </Box>
                                ) : (
                                    <Grid container spacing={1}>
                                        {availableSlots.map(slot => {
                                            const isSelected = bookingData.slots?.includes(slot);
                                            return (
                                                <Grid item xs={6} key={slot}>
                                                    <Button
                                                        variant={isSelected ? "contained" : "outlined"}
                                                        fullWidth
                                                        onClick={() => handleSlotClick(slot)}
                                                        sx={{
                                                            borderRadius: 2.5,
                                                            py: 1,
                                                            fontSize: '0.75rem', // Slightly smaller font to fit range
                                                            fontWeight: isSelected ? 800 : 600,
                                                            borderColor: isSelected ? 'transparent' : 'rgba(99,102,241,0.2)',
                                                            color: isSelected ? 'white' : '#6366f1',
                                                            bgcolor: isSelected ? '#6366f1' : 'background.paper',
                                                            '&:hover': {
                                                                bgcolor: isSelected ? '#4f46e5' : 'action.hover',
                                                                borderColor: '#6366f1'
                                                            }
                                                        }}
                                                    >
                                                        {formatSlotLabel(slot, slotStepMin)}
                                                    </Button>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                )}

                                <Button
                                    fullWidth
                                    variant="contained"
                                    disabled={!isDurationMet || !areSlotsConsecutive}
                                    onClick={handleNext}
                                    sx={{
                                        mt: 3, borderRadius: 3, py: 1.5, fontWeight: 800,
                                        background: (isDurationMet && areSlotsConsecutive) ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'rgba(255,255,255,0.05)',
                                        color: (isDurationMet && areSlotsConsecutive) ? 'white' : 'text.disabled',
                                        boxShadow: (isDurationMet && areSlotsConsecutive) ? '0 10px 20px rgba(99,102,241,0.25)' : 'none',
                                        '&:hover': { background: (isDurationMet && areSlotsConsecutive) ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : 'rgba(255,255,255,0.05)' }
                                    }}
                                >
                                    {isDurationMet ? 'Continue' : `Selected ${formatDuration(selectedDuration)} of ${formatDuration(totalDuration)}`}
                                </Button>
                            </Box>
                        )}
                    </Box>
                );
            }

            case 4: { // Your Details
                const validateAndNext = () => {
                    const errs = {};
                    const { name, phone } = bookingData.customer;

                    const nameRes = validateName(name);
                    if (nameRes !== true) errs.name = nameRes;

                    const mobileRes = validateMobile(phone);
                    if (mobileRes !== true) errs.phone = mobileRes;

                    const nameEmoji = blockEmoji(name);
                    if (nameEmoji !== true) errs.name = nameEmoji;

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
                                        const val = e.target.value.replace(/[^A-Za-z .\-']/g, '');
                                        setBookingData({ ...bookingData, customer: { ...bookingData.customer, name: val } });
                                        if (detailErrors.name) setDetailErrors(p => ({ ...p, name: undefined }));
                                    }} />
                            </Grid>
                            <Grid item xs={12}>
                                <PhoneInput
                                    value={bookingData.customer.phone}
                                    onChange={val => {
                                        setBookingData({ ...bookingData, customer: { ...bookingData.customer, phone: val } });
                                        if (detailErrors.phone) setDetailErrors(p => ({ ...p, phone: undefined }));
                                    }}
                                    label="Phone Number *"
                                    error={!!detailErrors.phone}
                                    helperText={detailErrors.phone}
                                />
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

            case 5: { // Payment
                const totalAmount = bookingData.services.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
                const minAmountToPay = bookingData.services.reduce((acc, s) => acc + (Number(s.minimum_booking_charge) || Number(s.price) || 0), 0);
                const targetBiz = businesses.find(b => String(b.id) === String(resolvedBusinessId));

                const isStripeActive = !!targetBiz?.stripe_enabled && !!targetBiz?.stripe_publishable_key;
                const isRazorpayActive = !!targetBiz?.razorpay_enabled || (!targetBiz?.stripe_enabled && !targetBiz?.upi_enabled);
                const isUpiActive = !!targetBiz?.upi_enabled && (!!targetBiz?.upi_id || !!targetBiz?.upi_qr_code);
                const isCashActive = targetBiz?.cash_on_arrival_enabled !== false;

                return (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                            <IconButton size="small" onClick={handleBack}><BackIcon fontSize="small" /></IconButton>
                            <Typography variant="h6" fontWeight={700}>Confirm & Pay</Typography>
                        </Box>

                        <Card variant="outlined" sx={{ p: 2.5, mb: 3, bgcolor: 'background.default', borderRadius: 2.5 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Order Summary</Typography>
                            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Services ({bookingData.services.length})</Typography>
                                    <Typography variant="body2" fontWeight={600}>{bookingData.services.map(s => s.service_name).join(', ')}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Location</Typography><Typography variant="body2">{bookingData.location?.location_name}</Typography></Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Staff</Typography><Typography variant="body2">{bookingData.staff?.staff_name}</Typography></Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Date</Typography><Typography variant="body2">{formatDate(bookingData.date)}</Typography></Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Time</Typography>
                                    <Typography variant="body2">
                                        <strong>{bookingData.slots?.length > 0 ? formatSlotLabel(bookingData.slots.sort()[0], bookingData.slots.length * slotStepMin) : '—'}</strong>
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Total Duration</Typography>
                                    <Typography variant="body2">{bookingData.slots?.length * slotStepMin} min</Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ my: 1.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography fontWeight={700}>Total Amount</Typography>
                                <Typography fontWeight={800} color="text.primary" fontSize="1.1rem">₹{totalAmount}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant="body2" color="primary.main" fontWeight={600}>Min. to Pay Now</Typography>
                                <Typography variant="body2" fontWeight={700} color="primary.main">₹{minAmountToPay}</Typography>
                            </Box>
                        </Card>

                        {/* Payment Method Selector */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
                                Select Payment Method
                            </Typography>
                            <Grid container spacing={1.5}>
                                {isStripeActive && (
                                    <Grid item xs={12} sm={6}>
                                        <Card
                                            onClick={() => setSelectedPaymentMethod('stripe')}
                                            variant="outlined"
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2.5,
                                                cursor: 'pointer',
                                                border: '2px solid',
                                                borderColor: selectedPaymentMethod === 'stripe' ? '#6366f1' : 'divider',
                                                bgcolor: selectedPaymentMethod === 'stripe' ? 'rgba(99,102,241,0.08)' : 'transparent'
                                            }}
                                        >
                                            <Typography variant="subtitle2" fontWeight={800} color="#635BFF">💳 Stripe Card</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">Credit / Debit Card</Typography>
                                        </Card>
                                    </Grid>
                                )}
                                {isRazorpayActive && (
                                    <Grid item xs={12} sm={6}>
                                        <Card
                                            onClick={() => setSelectedPaymentMethod('razorpay')}
                                            variant="outlined"
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2.5,
                                                cursor: 'pointer',
                                                border: '2px solid',
                                                borderColor: selectedPaymentMethod === 'razorpay' ? '#6366f1' : 'divider',
                                                bgcolor: selectedPaymentMethod === 'razorpay' ? 'rgba(99,102,241,0.08)' : 'transparent'
                                            }}
                                        >
                                            <Typography variant="subtitle2" fontWeight={800} color="#0052FF">📱 Razorpay</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">UPI, Netbanking, Cards</Typography>
                                        </Card>
                                    </Grid>
                                )}
                                {canShowSkipPayment && (
                                    <Grid item xs={12} sm={6}>
                                        <Card
                                            onClick={() => setSelectedPaymentMethod('venue')}
                                            variant="outlined"
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2.5,
                                                cursor: 'pointer',
                                                border: '2px solid',
                                                borderColor: selectedPaymentMethod === 'venue' ? '#10b981' : 'divider',
                                                bgcolor: selectedPaymentMethod === 'venue' ? 'rgba(16,185,129,0.08)' : 'transparent'
                                            }}
                                        >
                                            <Typography variant="subtitle2" fontWeight={800} color="#10b981">💵 Pay at Venue / Cash</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">Skip Online Payment</Typography>
                                        </Card>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>

                        <Button fullWidth variant="contained" size="large" sx={{ mt: 1, borderRadius: 2, py: 1.4, fontWeight: 700 }}
                            onClick={() => handleConfirmBooking(canShowSkipPayment && selectedPaymentMethod === 'venue')}
                            disabled={loading}>
                            {loading ? 'Processing...' : (canShowSkipPayment && selectedPaymentMethod === 'venue' ? 'Confirm Booking (Pay at Venue)' : `Confirm & Pay via ${((!canShowSkipPayment && selectedPaymentMethod === 'venue') ? 'RAZORPAY' : selectedPaymentMethod).toUpperCase()}`)}
                        </Button>

                        {canShowSkipPayment && selectedPaymentMethod !== 'venue' && (
                            <Button fullWidth variant="outlined" color="success" size="large" sx={{ mt: 1.5, borderRadius: 2, py: 1.2, fontWeight: 700, textTransform: 'none' }}
                                onClick={() => handleConfirmBooking(true)}
                                disabled={loading}>
                                ⚡ Skip Payment & Confirm Booking
                            </Button>
                        )}
                    </Box>
                );
            }

            case 6: // Success
                return (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        {activeBusiness?.logo ? (
                            <Avatar
                                src={getLogoUrl(activeBusiness.logo)}
                                alt={activeBusiness.business_name || 'Business'}
                                sx={{ width: 72, height: 72, mx: 'auto', mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
                            />
                        ) : (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
                                <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                            </motion.div>
                        )}
                        <Typography variant="h5" fontWeight={800} gutterBottom>Booking Confirmed!</Typography>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                            Your appointment with <strong>{bookingData.staff?.staff_name}</strong> is scheduled for
                        </Typography>
                        <Box sx={{ bgcolor: 'success.50', borderRadius: 2, p: 2, mb: 3, border: '1px solid', borderColor: 'success.200' }}>
                            <Typography variant="body2" color="success.main" fontWeight={600}>
                                {formatDate(bookingData.date)} at {[...bookingData.slots].sort()[0].slice(0, 5)}
                            </Typography>
                            <Typography variant="caption" color="success.main">
                                {bookingData.slots.length * slotStepMin} min session • {bookingData.services.map(s => s.service_name).join(', ')}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            {/* 
                            // Calendar Sync Disabled
                            !isSynced ? (
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    onClick={handleGoogleSync}
                                    disabled={isSyncing}
                                    startIcon={<GoogleIcon />}
                                    sx={{ 
                                        borderRadius: 2, 
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        bgcolor: '#4285F4',
                                        '&:hover': { bgcolor: '#357ae8' }
                                    }}
                                >
                                    {isSyncing ? 'Syncing...' : 'Add to Google Calendar'}
                                </Button>
                            ) : (
                                <Typography variant="body2" color="success.main" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <SuccessIcon fontSize="small" /> Added to Calendar
                                </Typography>
                            ) 
                            */}
                            <Button variant="outlined" onClick={resetBooking} sx={{ borderRadius: 2, textTransform: 'none' }}>
                                Close
                            </Button>
                        </Box>

                    </Box>
                );
            default:
                return null;
        }
    };


    return (
        <>
            {!hideFab && (
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
            )}

            <Dialog
                open={open}
                onClose={(event, reason) => {
                    if (reason && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
                        return;
                    }
                    resetBooking();
                }}
                maxWidth="xs"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 4,
                        overflow: 'hidden',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
                        height: isMobile ? '100%' : 'auto',
                        maxHeight: isMobile ? '100%' : 'calc(100% - 64px)'
                    }
                }}>

                {(quotaExceeded || isExpired || externalIsExpired === true) ? (
                    <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <IconButton onClick={resetBooking} size="small">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Avatar sx={{ width: 80, height: 80, bgcolor: 'error.light', color: 'error.main', mx: 'auto', mb: 3 }}>
                            <BookIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Typography variant="h5" fontWeight={900} gutterBottom>
                            {isExpired ? 'Not Accepting Bookings' : 'Limit Reached'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, px: 2 }}>
                            {isExpired
                                ? 'We are not accepting bookings right now.'
                                : 'We have reached our booking limit for this period and are not accepting new appointments right now. Please contact us directly for assistance.'
                            }
                        </Typography>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={resetBooking}
                            sx={{
                                borderRadius: 3, py: 1.5, fontWeight: 800,
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            }}
                        >
                            Got it
                        </Button>
                    </Box>
                ) : (
                    <>
                        {/* ── Gradient Header ── */}
                        {activeStep < 6 && (
                            <Box sx={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                px: { xs: 2.5, sm: 3 },
                                pt: { xs: 2, sm: 2.5 },
                                pb: 2,
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        {activeBusiness?.logo ? (
                                            <Avatar
                                                src={getLogoUrl(activeBusiness.logo)}
                                                alt={activeBusiness.business_name || 'Business Logo'}
                                                sx={{
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius: 2.5,
                                                    bgcolor: 'white',
                                                    border: '2px solid rgba(255,255,255,0.5)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        ) : null}
                                        <Box>
                                            {activeBusiness?.business_name && (
                                                <Typography variant="subtitle2" fontWeight={800} color="white" lineHeight={1.1} sx={{ opacity: 0.95, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                                    {activeBusiness.business_name}
                                                </Typography>
                                            )}
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                                Step {activeStep + 1} of {steps.length} • {steps[activeStep]}
                                            </Typography>
                                        </Box>
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

                        <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: 3, pt: 2.5, bgcolor: 'background.default' }}>
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
                    </>
                )}
            </Dialog>

            {/* Stripe Card Payment Dialog */}
            <Dialog open={stripeModalOpen} onClose={() => setStripeModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PriceIcon sx={{ color: '#635BFF', fontSize: 28 }} />
                        <Typography variant="h6" fontWeight={800}>Stripe Card Payment</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setStripeModalOpen(false)}><CloseIcon fontSize="small" /></IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Enter card details to pay <strong>₹{bookingData.paidAmount || bookingData.services.reduce((acc, s) => acc + (Number(s.minimum_booking_charge) || Number(s.price) || 0), 0)}</strong> directly to merchant account.
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Card Number"
                            placeholder="4242 •••• •••• 4242"
                            value={stripeCard.number}
                            onChange={(e) => setStripeCard(prev => ({ ...prev, number: e.target.value }))}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Expires (MM/YY)"
                            placeholder="12/28"
                            value={stripeCard.exp}
                            onChange={(e) => setStripeCard(prev => ({ ...prev, exp: e.target.value }))}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            size="small"
                            label="CVC / CVV"
                            placeholder="123"
                            type="password"
                            value={stripeCard.cvc}
                            onChange={(e) => setStripeCard(prev => ({ ...prev, cvc: e.target.value }))}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Cardholder Name"
                            placeholder="John Doe"
                            value={stripeCard.name}
                            onChange={(e) => setStripeCard(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </Grid>
                </Grid>

                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={stripeProcessing}
                    onClick={handleConfirmStripePayment}
                    sx={{ mt: 3, borderRadius: 2.5, py: 1.3, bgcolor: '#635BFF', '&:hover': { bgcolor: '#4B45C6' }, fontWeight: 800 }}
                >
                    {stripeProcessing ? 'Processing Payment...' : `Pay ₹${bookingData.paidAmount || bookingData.services.reduce((acc, s) => acc + (Number(s.minimum_booking_charge) || Number(s.price) || 0), 0)} via Stripe`}
                </Button>
            </Dialog>
        </>
    );
};

export default BookingWidget;
