import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Box, Typography, Avatar, Chip, IconButton, Button, Divider,
    TextField, FormControlLabel, Checkbox, TablePagination, Tabs, Tab,
    Grid, MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle,
    DialogContent, DialogActions
} from '@mui/material';
import {
    Schedule as ScheduleIcon, Edit as EditIcon, Add as AddIcon,
    Delete as DeleteIcon, Warning as WarningIcon, EventBusy as EventBusyIcon,
    BeachAccess as BeachAccessIcon, CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon, HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';
import PageTransition from '../components/PageTransition';
import { getStaffAvailability, bulkCreateStaffAvailability, deleteStaffAvailabilityByStaff } from '../api/staffAvailability.api';
import { getStaffLeaves, createStaffLeave, updateStaffLeave, deleteStaffLeave } from '../api/staffLeave.api';
import { getBusinessClosures, createBusinessClosure, updateBusinessClosure, deleteBusinessClosure } from '../api/businessClosure.api';
import { getStaff } from '../api/staff.api';
import { useSearch } from '../context/SearchContext';
import { useBusiness } from '../context/BusinessContext';
import { useSubscription } from '../context/SubscriptionContext';
import toast from 'react-hot-toast';
import { showGlobalLoader, hideGlobalLoader } from '../utils/loader';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayColors = {
    Monday: 'primary', Tuesday: 'secondary', Wednesday: 'info',
    Thursday: 'warning', Friday: 'success', Saturday: 'error', Sunday: 'default',
};

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Vacation', 'Unpaid Leave', 'Other'];
const leaveColors = {
    'Casual Leave': 'info',
    'Sick Leave': 'error',
    'Vacation': 'success',
    'Unpaid Leave': 'warning',
    'Other': 'default'
};

const Availability = () => {
    const { searchQuery } = useSearch();
    const { isSuspended } = useBusiness();
    const { isFeatureAllowed } = useSubscription();
    const isLeaveAllowed = isFeatureAllowed('leaveMaster');
    const [currentTab, setCurrentTab] = useState(isLeaveAllowed ? 1 : 2);

    useEffect(() => {
        if (!isLeaveAllowed && currentTab === 1) {
            setCurrentTab(2);
        } else if (currentTab === 0) {
            setCurrentTab(isLeaveAllowed ? 1 : 2);
        }
    }, [isLeaveAllowed, currentTab]);

    // Common State
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => parseInt(localStorage.getItem('rowsPerPage'), 10) || 10);

    // Tab 0: Weekly Availability
    const [availability, setAvailability] = useState([]);
    const [filterStaff, setFilterStaff] = useState('all');
    const [openWeeklyDrawer, setOpenWeeklyDrawer] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [schedule, setSchedule] = useState({});
    const [savingWeekly, setSavingWeekly] = useState(false);
    const [slotErrors, setSlotErrors] = useState({});

    // Tab 1: Staff Leaves
    const [leaves, setLeaves] = useState([]);
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [leaveForm, setLeaveForm] = useState({
        staff_id: '',
        leave_type: 'Casual Leave',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '17:00',
        is_all_day: true,
        approval_status: 'Approved',
        reason: ''
    });
    const [savingLeave, setSavingLeave] = useState(false);

    // Tab 2: Business Closures & Holidays
    const [closures, setClosures] = useState([]);
    const [closureModalOpen, setClosureModalOpen] = useState(false);
    const [selectedClosure, setSelectedClosure] = useState(null);
    const [closureForm, setClosureForm] = useState({
        title: '',
        is_recurring: false,
        recurring_day: ['Sunday'],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '17:00',
        is_all_day: true,
        reason: ''
    });
    const [savingClosure, setSavingClosure] = useState(false);

    useEffect(() => {
        setPage(0);
    }, [searchQuery, filterStaff, currentTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [availRes, staffRes, leavesRes, closuresRes] = await Promise.allSettled([
                getStaffAvailability(),
                getStaff(),
                getStaffLeaves(),
                getBusinessClosures()
            ]);

            if (availRes.status === 'fulfilled' && availRes.value?.success) {
                setAvailability(Array.isArray(availRes.value.data) ? availRes.value.data : (availRes.value.data?.rows || []));
            }
            if (staffRes.status === 'fulfilled' && staffRes.value?.success) {
                const sList = Array.isArray(staffRes.value.data) ? staffRes.value.data : (staffRes.value.data?.rows || []);
                setStaffList(sList);
            } else {
                console.warn('Failed to fetch staff:', staffRes.reason);
            }
            if (leavesRes.status === 'fulfilled' && leavesRes.value?.success) {
                setLeaves(Array.isArray(leavesRes.value.data) ? leavesRes.value.data : (leavesRes.value.data?.rows || []));
            }
            if (closuresRes.status === 'fulfilled' && closuresRes.value?.success) {
                setClosures(Array.isArray(closuresRes.value.data) ? closuresRes.value.data : (closuresRes.value.data?.rows || []));
            }
        } catch (error) {
            console.error('Fetch availability error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // -------------------------------------------------------------
    // TAB 0: Weekly Availability Handlers
    // -------------------------------------------------------------
    const filteredAvailability = availability.filter(a => {
        const staffName = staffList.find(s => s.id === a.staff_id)?.staff_name || '';
        const matchesSearch = staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.day_of_week.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.start_time.includes(searchQuery) ||
            a.end_time.includes(searchQuery);

        if (filterStaff === 'all') return matchesSearch;
        return a.staff_id === filterStaff && matchesSearch;
    });

    const handleEditWeekly = (staff) => {
        setSelectedStaff(staff);
        const existing = availability.filter(a => a.staff_id === staff.id);
        const sched = {};
        existing.forEach(a => {
            const dayMatch = DAYS.find(d => d.toLowerCase() === a.day_of_week.toLowerCase());
            if (dayMatch) {
                if (!sched[dayMatch]) sched[dayMatch] = [];
                sched[dayMatch].push({ id: a.id, start_time: a.start_time, end_time: a.end_time });
            }
        });
        setSchedule(sched);
        setOpenWeeklyDrawer(true);
    };

    const toggleDay = (day) => {
        setSchedule(prev => {
            if (prev[day]) {
                const next = { ...prev };
                delete next[day];
                return next;
            }
            return { ...prev, [day]: [{ start_time: '09:00', end_time: '17:00' }] };
        });
    };

    const addSlot = (day) => {
        setSchedule(prev => ({
            ...prev,
            [day]: [...(prev[day] || []), { start_time: '09:00', end_time: '17:00' }],
        }));
    };

    const removeSlot = (day, idx) => {
        setSchedule(prev => {
            const slots = prev[day].filter((_, i) => i !== idx);
            if (slots.length === 0) {
                const next = { ...prev };
                delete next[day];
                return next;
            }
            return { ...prev, [day]: slots };
        });
    };

    const updateSlot = (day, idx, field, value) => {
        setSchedule(prev => {
            const updatedDaySlots = prev[day].map((slot, i) => i === idx ? { ...slot, [field]: value } : slot);
            return { ...prev, [day]: updatedDaySlots };
        });

        setSlotErrors(prev => {
            const key = `${day}-${idx}`;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const copyToAll = (sourceDay) => {
        const slotsToCopy = schedule[sourceDay];
        if (!slotsToCopy) return;
        const newSchedule = { ...schedule };
        DAYS.filter(d => !!newSchedule[d]).forEach(day => {
            newSchedule[day] = slotsToCopy.map(s => ({ start_time: s.start_time, end_time: s.end_time }));
        });
        setSchedule(newSchedule);
        toast.success(`Copied ${sourceDay}'s schedule to all active days`);
    };

    const checkOverlap = (s1, s2) => {
        if (!s1.start_time || !s1.end_time || !s2.start_time || !s2.end_time) return false;
        const getIntervals = (s) => {
            if (s.start_time < s.end_time) return [[s.start_time, s.end_time]];
            return [[s.start_time, '23:59'], ['00:00', s.end_time]];
        };
        const i1 = getIntervals(s1);
        const i2 = getIntervals(s2);
        return i1.some(([s1s, s1e]) => i2.some(([s2s, s2e]) => s1s < s2e && s1e > s2s));
    };

    const handleSaveWeekly = async () => {
        if (savingWeekly) return;
        const clashingDays = [];
        
        Object.entries(schedule).forEach(([day, slots]) => {
            const hasClash = slots.some((slot, idx) => slots.some((other, j) => idx !== j && checkOverlap(slot, other)));
            if (hasClash) clashingDays.push(day);
        });

        if (clashingDays.length > 0) {
            toast.error(`Schedule conflict detected on: ${clashingDays.join(', ')}. Please adjust overlapping shifts.`);
            return;
        }

        setSavingWeekly(true);
        setOpenWeeklyDrawer(false);
        showGlobalLoader('Updating availability...');

        try {
            await deleteStaffAvailabilityByStaff(selectedStaff.id);

            const records = [];
            Object.entries(schedule).forEach(([day, slots]) => {
                slots.forEach(slot => {
                    records.push({
                        staff_id: selectedStaff.id,
                        day_of_week: day.toLowerCase(),
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                    });
                });
            });
            if (records.length > 0) {
                await bulkCreateStaffAvailability(records);
            }
            toast.success('Availability updated successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to update availability');
        } finally {
            setSavingWeekly(false);
            hideGlobalLoader();
        }
    };

    const groupedStaffAvailability = staffList.filter(staff => {
        if (filterStaff !== 'all' && String(staff.id) !== String(filterStaff)) return false;
        const matchesSearch = !searchQuery || staff.staff_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    }).map(staff => {
        const staffRecords = availability.filter(a => String(a.staff_id) === String(staff.id));
        const sortedRecords = [...staffRecords].sort((a, b) => {
            const indexA = DAYS.findIndex(d => d.toLowerCase() === a.day_of_week.toLowerCase());
            const indexB = DAYS.findIndex(d => d.toLowerCase() === b.day_of_week.toLowerCase());
            return indexA - indexB;
        });

        const totalWeeklyMinutes = sortedRecords.reduce((total, a) => {
            const [sh, sm] = (a.start_time || '00:00').split(':').map(Number);
            const [eh, em] = (a.end_time || '00:00').split(':').map(Number);
            return total + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
        }, 0);

        return {
            staff,
            records: sortedRecords,
            totalWeeklyMinutes
        };
    }).filter(item => item.records.length > 0 || filterStaff !== 'all');

    // -------------------------------------------------------------
    // TAB 1: Staff Leaves Handlers
    // -------------------------------------------------------------
    const filteredLeaves = leaves.filter(l => {
        const staffName = l.staff?.staff_name || staffList.find(s => s.id === l.staff_id)?.staff_name || '';
        const matchesSearch = staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.leave_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.reason && l.reason.toLowerCase().includes(searchQuery.toLowerCase()));

        if (filterStaff === 'all') return matchesSearch;
        return l.staff_id === filterStaff && matchesSearch;
    });

    const handleOpenAddLeave = () => {
        setSelectedLeave(null);
        const defaultStaffId = staffList.length > 0 ? String(staffList[0].id) : '';
        setLeaveForm({
            staff_id: defaultStaffId,
            leave_type: 'Casual Leave',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            start_time: '09:00',
            end_time: '17:00',
            is_all_day: true,
            approval_status: 'Approved',
            reason: ''
        });
        setLeaveModalOpen(true);
    };

    useEffect(() => {
        if (leaveModalOpen && !leaveForm.staff_id && staffList.length > 0) {
            setLeaveForm(prev => ({ ...prev, staff_id: String(staffList[0].id) }));
        }
    }, [leaveModalOpen, staffList]);

    const handleEditLeave = (leave) => {
        setSelectedLeave(leave);
        setLeaveForm({
            staff_id: leave.staff_id,
            leave_type: leave.leave_type || 'Casual Leave',
            start_date: leave.start_date,
            end_date: leave.end_date,
            start_time: leave.start_time || '09:00',
            end_time: leave.end_time || '17:00',
            is_all_day: leave.is_all_day !== false,
            approval_status: leave.approval_status || 'Approved',
            reason: leave.reason || ''
        });
        setLeaveModalOpen(true);
    };

    const handleSaveLeave = async () => {
        if (!leaveForm.staff_id) {
            toast.error('Please select a staff member');
            return;
        }
        if (!leaveForm.start_date || !leaveForm.end_date) {
            toast.error('Please select start and end dates');
            return;
        }

        setSavingLeave(true);
        showGlobalLoader(selectedLeave ? 'Updating leave...' : 'Recording leave...');
        try {
            if (selectedLeave) {
                await updateStaffLeave(selectedLeave.id, leaveForm);
                toast.success('Staff leave updated successfully');
            } else {
                await createStaffLeave(leaveForm);
                toast.success('Staff leave recorded successfully');
            }
            setLeaveModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save staff leave');
        } finally {
            setSavingLeave(false);
            hideGlobalLoader();
        }
    };

    const handleDeleteLeave = async (id) => {
        if (!window.confirm('Are you sure you want to delete this staff leave record?')) return;
        showGlobalLoader('Deleting leave...');
        try {
            await deleteStaffLeave(id);
            toast.success('Leave deleted successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete leave');
        } finally {
            hideGlobalLoader();
        }
    };

    // -------------------------------------------------------------
    // TAB 2: Business Closures & Holidays Handlers
    // -------------------------------------------------------------
    const filteredClosures = closures.filter(c => {
        return c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.reason && c.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
            c.start_date.includes(searchQuery) ||
            c.end_date.includes(searchQuery);
    });

    const handleOpenAddClosure = () => {
        setSelectedClosure(null);
        setClosureForm({
            title: '',
            is_recurring: false,
            recurring_day: ['Sunday'],
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            start_time: '09:00',
            end_time: '17:00',
            is_all_day: true,
            reason: ''
        });
        setClosureModalOpen(true);
    };

    const handleEditClosure = (closure) => {
        setSelectedClosure(closure);
        const recDays = (closure.recurring_day || '').split(',').map(d => d.trim()).filter(Boolean);
        setClosureForm({
            title: closure.title,
            is_recurring: !!closure.is_recurring,
            recurring_day: recDays.length > 0 ? recDays : ['Sunday'],
            start_date: closure.start_date || '',
            end_date: closure.end_date || '',
            start_time: closure.start_time || '09:00',
            end_time: closure.end_time || '17:00',
            is_all_day: closure.is_all_day !== false,
            reason: closure.reason || ''
        });
        setClosureModalOpen(true);
    };

    const handleSaveClosure = async () => {
        if (!closureForm.title) {
            toast.error('Please specify a title (e.g. Sunday Shop Off, Diwali Holiday)');
            return;
        }

        if (closureForm.is_recurring && (!closureForm.recurring_day || closureForm.recurring_day.length === 0)) {
            toast.error('Please select at least one recurring day (e.g. Sunday)');
            return;
        }

        if (!closureForm.is_recurring && (!closureForm.start_date || !closureForm.end_date)) {
            toast.error('Please select start and end dates');
            return;
        }

        const payload = {
            ...closureForm,
            recurring_day: Array.isArray(closureForm.recurring_day) ? closureForm.recurring_day.join(', ') : closureForm.recurring_day,
            start_date: closureForm.is_recurring ? (closureForm.start_date || '1970-01-01') : closureForm.start_date,
            end_date: closureForm.is_recurring ? (closureForm.end_date || '2099-12-31') : closureForm.end_date,
        };

        setSavingClosure(true);
        showGlobalLoader(selectedClosure ? 'Updating closure...' : 'Adding business closure...');
        try {
            if (selectedClosure) {
                await updateBusinessClosure(selectedClosure.id, payload);
                toast.success('Business closure updated successfully');
            } else {
                await createBusinessClosure(payload);
                toast.success('Business closure recorded successfully');
            }
            setClosureModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save business closure');
        } finally {
            setSavingClosure(false);
            hideGlobalLoader();
        }
    };

    const handleDeleteClosure = async (id) => {
        if (!window.confirm('Are you sure you want to remove this business closure?')) return;
        showGlobalLoader('Deleting closure...');
        try {
            await deleteBusinessClosure(id);
            toast.success('Business closure removed successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete business closure');
        } finally {
            hideGlobalLoader();
        }
    };

    return (
        <PageTransition>
            <PageHeader
                title="Leaves & Closures Management"
                subtitle="Manage employee leaves, staff time-offs, and business holidays or temporary closures."
                extraActions={
                    currentTab === 1 ? (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddLeave}
                            disabled={isSuspended}
                            sx={{ borderRadius: 2 }}
                        >
                            Log Staff Leave
                        </Button>
                    ) : currentTab === 2 ? (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddClosure}
                            disabled={isSuspended}
                            sx={{ borderRadius: 2 }}
                        >
                            Add Business Closure
                        </Button>
                    ) : null
                }
            />

            {/* Navigation Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, val) => { setCurrentTab(val); setPage(0); }}
                    textColor="primary"
                    indicatorColor="primary"
                >
                    {isLeaveAllowed && (
                        <Tab value={1} label={`Employee Leaves (${leaves.length})`} icon={<BeachAccessIcon />} iconPosition="start" />
                    )}
                    <Tab value={2} label={`Business Closures (${closures.length})`} icon={<EventBusyIcon />} iconPosition="start" />
                </Tabs>
            </Box>

            {/* Staff Filter Bar (for Tab 1 Employee Leaves) */}
            {currentTab === 1 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>Filter Staff:</Typography>
                    <Chip
                        label="All Staff"
                        size="small"
                        variant={filterStaff === 'all' ? 'filled' : 'outlined'}
                        color={filterStaff === 'all' ? 'primary' : 'default'}
                        onClick={() => setFilterStaff('all')}
                        clickable
                    />
                    {staffList.map(s => (
                        <Chip
                            key={s.id}
                            label={s.staff_name}
                            size="small"
                            variant={filterStaff === s.id ? 'filled' : 'outlined'}
                            color={filterStaff === s.id ? 'primary' : 'default'}
                            onClick={() => setFilterStaff(s.id)}
                            clickable
                            avatar={<Avatar sx={{ fontSize: '0.65rem' }}>{s.staff_name?.charAt(0)}</Avatar>}
                        />
                    ))}
                </Box>
            )}

            {/* TAB 1: EMPLOYEE LEAVES */}
            {currentTab === 1 && (
                <>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Sr. No.</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Staff Member</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Timing</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                                            <Typography color="text.secondary">Loading staff leave records...</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLeaves.length === 0 ? (
                                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                        <BeachAccessIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.25, display: 'block', mx: 'auto' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {searchQuery ? 'No staff leave records match your search.' : 'No staff leaves recorded yet.'}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled">Click "Log Staff Leave" above to record employee leaves.</Typography>
                                    </TableCell></TableRow>
                                ) : filteredLeaves.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((leave, idx) => {
                                    const staffName = leave.staff?.staff_name || staffList.find(s => s.id === leave.staff_id)?.staff_name || 'Staff';
                                    return (
                                        <TableRow key={leave.id} hover>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{page * rowsPerPage + idx + 1}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: 'secondary.main' }}>
                                                        {staffName.charAt(0)}
                                                    </Avatar>
                                                    <Typography variant="body2" fontWeight={500}>{staffName}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={leave.leave_type}
                                                    size="small"
                                                    color={leaveColors[leave.leave_type] || 'default'}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{leave.start_date}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{leave.end_date}</TableCell>
                                            <TableCell>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: leave.is_all_day ? 'primary.main' : 'text.primary' }}>
                                                    {leave.is_all_day ? 'Full Day' : `${leave.start_time} - ${leave.end_time}`}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={leave.approval_status}
                                                    size="small"
                                                    color={leave.approval_status === 'Approved' ? 'success' : leave.approval_status === 'Rejected' ? 'error' : 'warning'}
                                                    icon={leave.approval_status === 'Approved' ? <CheckCircleIcon /> : leave.approval_status === 'Rejected' ? <CancelIcon /> : <PendingIcon />}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 200 }}>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {leave.reason || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" color="primary" onClick={() => handleEditLeave(leave)} disabled={isSuspended}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDeleteLeave(leave.id)} disabled={isSuspended}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 20, 30, 50]}
                        component="div"
                        count={filteredLeaves.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, p) => setPage(p)}
                        onRowsPerPageChange={(e) => {
                            const rpp = parseInt(e.target.value, 10);
                            setRowsPerPage(rpp);
                            localStorage.setItem('rowsPerPage', rpp);
                            setPage(0);
                        }}
                    />
                </>
            )}

            {/* TAB 2: BUSINESS CLOSURES & HOLIDAYS */}
            {currentTab === 2 && (
                <>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Sr. No.</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Title / Holiday Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Duration / Timing</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Reason / Details</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                            <Typography color="text.secondary">Loading business closures...</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredClosures.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                        <EventBusyIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.25, display: 'block', mx: 'auto' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {searchQuery ? 'No business closures match your search.' : 'No business closures or holidays added yet.'}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled">Click "Add Business Closure" above to close business for holidays or repairs.</Typography>
                                    </TableCell></TableRow>
                                ) : filteredClosures.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((closure, idx) => {
                                    return (
                                        <TableRow key={closure.id} hover>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{page * rowsPerPage + idx + 1}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 30, height: 30, bgcolor: closure.is_recurring ? 'warning.main' : 'error.main', fontSize: '0.8rem' }}>
                                                        <EventBusyIcon fontSize="small" />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{closure.title}</Typography>
                                                        {closure.is_recurring && (
                                                            <Chip label={`Weekly (${closure.recurring_day})`} size="small" color="warning" variant="outlined" sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700, mt: 0.3 }} />
                                                        )}
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>
                                                {closure.is_recurring ? `Every ${closure.recurring_day}` : closure.start_date}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>
                                                {closure.is_recurring ? 'Indefinite' : closure.end_date}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={closure.is_all_day ? 'All Day Closed' : `${closure.start_time} - ${closure.end_time}`}
                                                    size="small"
                                                    color="error"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 250 }}>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {closure.reason || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" color="primary" onClick={() => handleEditClosure(closure)} disabled={isSuspended}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDeleteClosure(closure.id)} disabled={isSuspended}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 20, 30, 50]}
                        component="div"
                        count={filteredClosures.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, p) => setPage(p)}
                        onRowsPerPageChange={(e) => {
                            const rpp = parseInt(e.target.value, 10);
                            setRowsPerPage(rpp);
                            localStorage.setItem('rowsPerPage', rpp);
                            setPage(0);
                        }}
                    />
                </>
            )}

            {/* TAB 0 DRAWER: EDIT WEEKLY WORKING HOURS */}
            <FormDrawer
                open={openWeeklyDrawer}
                onClose={() => setOpenWeeklyDrawer(false)}
                title={`Edit Availability`}
                subtitle={`Set working hours for ${selectedStaff?.staff_name}`}
                onSave={handleSaveWeekly}
                isLoading={savingWeekly}
                saveLabel={savingWeekly ? 'Updating...' : 'Update Availability'}
            >
                <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
                        Weekly Schedule
                    </Typography>
                    {DAYS.map(day => {
                        const isDayClashing = schedule[day]?.some((slot, idx) => schedule[day].some((other, j) => idx !== j && checkOverlap(slot, other)));
                        
                        return (
                            <Box key={day} sx={{ 
                                mb: 3, p: 2, borderRadius: 2, border: '1px solid',
                                borderColor: isDayClashing ? 'error.light' : (!!schedule[day] ? 'primary.light' : 'divider'),
                                bgcolor: isDayClashing ? 'error.50' : (!!schedule[day] ? 'primary.50' : 'transparent'),
                                transition: 'all 0.2s'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: !!schedule[day] ? 2 : 0, justifyContent: 'space-between' }}>
                                    <FormControlLabel
                                        label={<Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDayClashing ? 'error.main' : 'inherit' }}>{day}</Typography>}
                                        control={<Checkbox checked={!!schedule[day]} onChange={() => toggleDay(day)} color="primary" />}
                                        sx={{ mr: 0 }}
                                    />
                                    {isDayClashing && (
                                        <Typography variant="caption" color="error" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <WarningIcon fontSize="inherit" /> Scheduling Conflict
                                        </Typography>
                                    )}
                                    {schedule[day] && (
                                        <Button size="small" variant="text" onClick={() => copyToAll(day)} sx={{ fontSize: '0.65rem', fontWeight: 700, ml: 'auto' }}>
                                            Apply to all days
                                        </Button>
                                    )}
                                </Box>

                                {schedule[day] && (
                                    <Box sx={{ 
                                        pl: 4, mt: 0.5, p: 1.5, borderRadius: 2, 
                                        bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid', borderColor: 'divider'
                                    }}>
                                        {schedule[day].map((slot, idx) => {
                                            const errKey = `${day}-${idx}`;
                                            const slotErr = slotErrors[errKey];
                                            const isClashing = schedule[day].some((other, j) => idx !== j && checkOverlap(slot, other));
                                            
                                            return (
                                                <Box key={idx} sx={{ 
                                                    display: 'flex', gap: 1, alignItems: 'center', p: 1, 
                                                    borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid',
                                                    borderColor: (slotErr || isClashing) ? 'error.light' : 'divider',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                    mb: 1
                                                }}>
                                                    <TextField 
                                                        type="time" 
                                                        size="small" 
                                                        fullWidth
                                                        value={slot.start_time} 
                                                        onChange={(e) => updateSlot(day, idx, 'start_time', e.target.value)} 
                                                        InputLabelProps={{ shrink: true, sx: { fontSize: '0.8rem' } }} 
                                                        label="Start" 
                                                        error={!!slotErr || isClashing}
                                                        sx={{ '& .MuiInputBase-root': { height: 36, fontSize: '0.8rem' } }}
                                                    />
                                                    <TextField 
                                                        type="time" 
                                                        size="small" 
                                                        fullWidth
                                                        value={slot.end_time} 
                                                        onChange={(e) => updateSlot(day, idx, 'end_time', e.target.value)} 
                                                        InputLabelProps={{ shrink: true, sx: { fontSize: '0.8rem' } }} 
                                                        label="End" 
                                                        error={!!slotErr || isClashing}
                                                        sx={{ '& .MuiInputBase-root': { height: 36, fontSize: '0.8rem' } }}
                                                    />
                                                    <IconButton 
                                                        size="small" 
                                                        color="error" 
                                                        onClick={() => removeSlot(day, idx)} 
                                                        disabled={schedule[day].length === 1}
                                                        sx={{ width: 36, height: 36, flexShrink: 0 }}
                                                    >
                                                        <DeleteIcon fontSize="inherit" sx={{ fontSize: '1.2rem' }} />
                                                    </IconButton>
                                                </Box>
                                            );
                                        })}
                                        <Button size="small" startIcon={<AddIcon />} onClick={() => addSlot(day)} sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Add slot</Button>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </FormDrawer>

            {/* TAB 1 DIALOG: LOG / EDIT STAFF LEAVE */}
            <Dialog open={leaveModalOpen} onClose={() => setLeaveModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedLeave ? 'Edit Staff Leave' : 'Log Employee Leave'}</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Staff Member</InputLabel>
                            <Select
                                value={String(leaveForm.staff_id || '')}
                                label="Staff Member"
                                onChange={(e) => setLeaveForm(prev => ({ ...prev, staff_id: e.target.value }))}
                            >
                                {staffList.length === 0 ? (
                                    <MenuItem value="" disabled>No staff members found</MenuItem>
                                ) : (
                                    staffList.map(s => (
                                        <MenuItem key={s.id} value={String(s.id)}>
                                            {s.staff_name} {s.phone ? `(${s.phone})` : s.email ? `(${s.email})` : ''}
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Leave Type</InputLabel>
                                <Select
                                    value={leaveForm.leave_type}
                                    label="Leave Type"
                                    onChange={(e) => setLeaveForm(prev => ({ ...prev, leave_type: e.target.value }))}
                                >
                                    {LEAVE_TYPES.map(type => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <InputLabel>Approval Status</InputLabel>
                                <Select
                                    value={leaveForm.approval_status}
                                    label="Approval Status"
                                    onChange={(e) => setLeaveForm(prev => ({ ...prev, approval_status: e.target.value }))}
                                >
                                    <MenuItem value="Approved">Approved</MenuItem>
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="Rejected">Rejected</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                type="date"
                                label="Start Date"
                                size="small"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={leaveForm.start_date}
                                onChange={(e) => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))}
                            />
                            <TextField
                                type="date"
                                label="End Date"
                                size="small"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={leaveForm.end_date}
                                onChange={(e) => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))}
                            />
                        </Box>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={leaveForm.is_all_day}
                                    onChange={(e) => setLeaveForm(prev => ({ ...prev, is_all_day: e.target.checked }))}
                                />
                            }
                            label="Full Day Leave"
                        />

                        {!leaveForm.is_all_day && (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    type="time"
                                    label="Start Time"
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={leaveForm.start_time}
                                    onChange={(e) => setLeaveForm(prev => ({ ...prev, start_time: e.target.value }))}
                                />
                                <TextField
                                    type="time"
                                    label="End Time"
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={leaveForm.end_time}
                                    onChange={(e) => setLeaveForm(prev => ({ ...prev, end_time: e.target.value }))}
                                />
                            </Box>
                        )}

                        <TextField
                            label="Reason / Notes"
                            size="small"
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="e.g., Doctor's appointment, Personal vacation"
                            value={leaveForm.reason}
                            onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setLeaveModalOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveLeave} disabled={savingLeave}>
                        {selectedLeave ? 'Update Leave' : 'Save Leave'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* TAB 2 DIALOG: ADD / EDIT BUSINESS CLOSURE */}
            <Dialog open={closureModalOpen} onClose={() => setClosureModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedClosure ? 'Edit Business Closure' : 'Add Business Closure / Holiday'}</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 0.5 }}>
                        <FormControl fullWidth size="small">
                            <Typography variant="caption" fontWeight={700} color="text.secondary" mb={0.5}>Closure Type</Typography>
                            <Select
                                value={closureForm.is_recurring ? 'recurring' : 'date_range'}
                                onChange={(e) => {
                                    const isRec = e.target.value === 'recurring';
                                    setClosureForm(prev => ({
                                        ...prev,
                                        is_recurring: isRec,
                                        title: prev.title || (isRec ? 'Weekly Shop Off' : '')
                                    }));
                                }}
                                sx={{ borderRadius: '10px' }}
                            >
                                <MenuItem value="date_range">Specific Dates (Holiday / Maintenance Range)</MenuItem>
                                <MenuItem value="recurring">Recurring Weekly Day Off (Every Sunday, Saturday, etc.)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Title / Closure Name"
                            size="small"
                            fullWidth
                            required
                            placeholder={closureForm.is_recurring ? "e.g., Sunday Shop Off, Weekly Off" : "e.g., Independence Day, Store Repairs"}
                            value={closureForm.title}
                            onChange={(e) => setClosureForm(prev => ({ ...prev, title: e.target.value }))}
                        />

                        {closureForm.is_recurring ? (
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1} display="block">
                                    Select Recurring Off Day(s) *
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {DAYS.map(day => {
                                        const isSelected = (closureForm.recurring_day || []).includes(day);
                                        return (
                                            <Chip
                                                key={day}
                                                label={day}
                                                size="medium"
                                                clickable
                                                color={isSelected ? 'primary' : 'default'}
                                                variant={isSelected ? 'filled' : 'outlined'}
                                                onClick={() => {
                                                    const cur = closureForm.recurring_day || [];
                                                    const next = isSelected ? cur.filter(d => d !== day) : [...cur, day];
                                                    setClosureForm(prev => ({ ...prev, recurring_day: next }));
                                                }}
                                                sx={{ fontWeight: 700, borderRadius: '10px' }}
                                            />
                                        );
                                    })}
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    type="date"
                                    label="Start Date"
                                    size="small"
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={closureForm.start_date}
                                    onChange={(e) => setClosureForm(prev => ({ ...prev, start_date: e.target.value }))}
                                />
                                <TextField
                                    type="date"
                                    label="End Date"
                                    size="small"
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={closureForm.end_date}
                                    onChange={(e) => setClosureForm(prev => ({ ...prev, end_date: e.target.value }))}
                                />
                            </Box>
                        )}

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={closureForm.is_all_day}
                                    onChange={(e) => setClosureForm(prev => ({ ...prev, is_all_day: e.target.checked }))}
                                />
                            }
                            label="Closed All Day"
                        />

                        {!closureForm.is_all_day && (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    type="time"
                                    label="Closure Start Time"
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={closureForm.start_time}
                                    onChange={(e) => setClosureForm(prev => ({ ...prev, start_time: e.target.value }))}
                                />
                                <TextField
                                    type="time"
                                    label="Closure End Time"
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={closureForm.end_time}
                                    onChange={(e) => setClosureForm(prev => ({ ...prev, end_time: e.target.value }))}
                                />
                            </Box>
                        )}

                        <TextField
                            label="Description / Customer Notice"
                            size="small"
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="e.g., Business will remain closed on account of national holiday."
                            value={closureForm.reason}
                            onChange={(e) => setClosureForm(prev => ({ ...prev, reason: e.target.value }))}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setClosureModalOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleSaveClosure} disabled={savingClosure}>
                        {selectedClosure ? 'Update Closure' : 'Save Closure'}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageTransition>
    );
};

export default Availability;
