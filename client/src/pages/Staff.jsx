import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, TextField, Grid, MenuItem, Select, FormControl, InputLabel,
    Box, Typography, Divider, Checkbox, FormControlLabel, Button, TablePagination, Avatar,
    Autocomplete, Chip, CircularProgress, Card
} from '@mui/material';
import { MobileTimePicker } from '@mui/x-date-pickers';
import {
    Edit as EditIcon, Delete as DeleteIcon, People as PeopleIcon,
    Add as AddIcon, Remove as RemoveIcon, Warning as WarningIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';
import PageTransition from '../components/PageTransition';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../api/staff.api';
import { getBusinesses } from '../api/business.api';
import { getLocations } from '../api/location.api';
import { getStaffAvailability, bulkCreateStaffAvailability, deleteStaffAvailabilityByStaff } from '../api/staffAvailability.api';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { useBusiness } from '../context/BusinessContext';
import toast from 'react-hot-toast';
import { validateName, validateMobile, blockEmoji } from '../utils/validators';
import { showGlobalLoader, hideGlobalLoader } from '../utils/loader';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PHOTO_SIZE_LIMIT = 500 * 1024; // 500 KB limit for base64

const compressImage = (file, maxKB = 499) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max dimension 800px
                const maxDim = 800;
                if (width > height && width > maxDim) {
                    height *= maxDim / width;
                    width = maxDim;
                } else if (height > maxDim) {
                    width *= maxDim / height;
                    height = maxDim;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                let quality = 0.9;
                let base64 = canvas.toDataURL('image/jpeg', quality);
                
                // Iteratively reduce quality if still over limit
                while (base64.length * 0.75 > maxKB * 1024 && quality > 0.1) {
                    quality -= 0.1;
                    base64 = canvas.toDataURL('image/jpeg', quality);
                }
                resolve(base64);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

const FieldSection = ({ label, children }) => (
    <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
            {label}
        </Typography>
        {children}
    </Box>
);

const Staff = () => {
    const { searchQuery } = useSearch();
    const { selectedBusinessId } = useBusiness();
    const [staffList, setStaffList] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => parseInt(localStorage.getItem('rowsPerPage'), 10) || 10);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterDays, setFilterDays] = useState([]);

    useEffect(() => {
        setPage(0);
    }, [searchQuery, selectedBusinessId]);

    const filteredStaff = staffList.filter(s => {
        const matchesBusiness = selectedBusinessId === 'all' || s.business_id === selectedBusinessId;
        if (!matchesBusiness) return false;

        const matchesSearch = s.staff_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.phone?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (filterDays.length === 0) return matchesSearch;
        
        const staffDays = availability.filter(a => a.staff_id === s.id).map(a => a.day_of_week.toLowerCase());
        const matchesDays = filterDays.some(d => staffDays.includes(d.toLowerCase()));
        
        return matchesSearch && matchesDays;
    });

    // availability schedule: { [day]: [{ start_time, end_time }] | null }
    const [schedule, setSchedule] = useState({});
    const [slotErrors, setSlotErrors] = useState({});
    const [photoPreview, setPhotoPreview] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staffRes, bizRes, locRes, availRes] = await Promise.all([
                getStaff(), getBusinesses(), getLocations(), getStaffAvailability()
            ]);
            
            console.log('Staff Page Data:', { 
                staff: staffRes.data?.length, 
                businesses: bizRes.data?.length, 
                locations: locRes.data?.length 
            });

            if (staffRes.success) setStaffList(staffRes.data || []);
            if (bizRes.success) setBusinesses(bizRes.data || []);
            if (locRes.success) setLocations(locRes.data || []);
            if (availRes.success) setAvailability(availRes.data || []);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: { business_id: '', location_ids: [], staff_name: '', role: '', phone: '', slot_duration_minutes: '30', photo: '' },
    });

    const selectedLocationIds = watch('location_ids') || [];

    const handleOpen = (s = null) => {
        setEditId(s?.id || null);
        const sLocIds = s?.locations?.map(l => l.id) || [];
        const initialBizId = s?.business_id || (selectedBusinessId !== 'all' ? selectedBusinessId : businesses[0]?.id) || '';
        
        reset(s
            ? { business_id: initialBizId, location_ids: sLocIds, staff_name: s.staff_name || '', role: s.role || '', phone: s.phone || '', slot_duration_minutes: s.slot_duration_minutes || '30', photo: s.photo || '' }
            : { business_id: initialBizId, location_ids: [], staff_name: '', role: '', phone: '', slot_duration_minutes: '30', photo: '' }
        );
        setPhotoPreview(s?.photo || null);

        // Build schedule from existing availability records for this staff
        if (s) {
            const existing = availability.filter(a => a.staff_id === s.id);
            const sched = {};
            existing.forEach(a => {
                const dayMatch = DAYS.find(d => d.toLowerCase() === a.day_of_week.toLowerCase());
                if (dayMatch) {
                    if (!sched[dayMatch]) sched[dayMatch] = [];
                    sched[dayMatch].push({ 
                        start_time: a.start_time.slice(0, 5), // 'HH:mm'
                        end_time: a.end_time.slice(0, 5), 
                        location_id: a.location_id 
                    });
                }
            });
            setSchedule(sched);
        } else {
            setSchedule({});
        }
        setOpen(true);
    };

    const toggleDay = (day) => {
        setSchedule(prev => {
            if (prev[day]) {
                const next = { ...prev };
                delete next[day];
                return next;
            }
            // Use first assigned location if available
            const defaultLocId = selectedLocationIds[0] || '';
            return { ...prev, [day]: [{ start_time: '09:00', end_time: '17:00', location_id: defaultLocId }] };
        });
    };

    const addSlot = (day) => {
        const defaultLocId = selectedLocationIds[0] || '';
        setSchedule(prev => ({
            ...prev,
            [day]: [...(prev[day] || []), { start_time: '09:00', end_time: '17:00', location_id: defaultLocId }],
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
        let updatedSlot;
        setSchedule(prev => {
            const updatedDaySlots = prev[day].map((slot, i) => {
                if (i === idx) {
                    updatedSlot = { ...slot, [field]: value };
                    return updatedSlot;
                }
                return slot;
            });
            return { ...prev, [day]: updatedDaySlots };
        });

        // Removed "End time must be after start time" validation to allow overnight shifts
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

        const newSchedule = {};
        DAYS.forEach(day => {
            newSchedule[day] = slotsToCopy.map(s => ({ ...s }));
        });
        setSchedule(newSchedule);
        toast.success(`Copied ${sourceDay}'s schedule to all 7 days`);
    };

    const checkOverlap = (s1, s2) => {
        if (!s1.start_time || !s1.end_time || !s2.start_time || !s2.end_time) return false;
        
        const getIntervals = (s) => {
            if (s.start_time < s.end_time) return [[s.start_time, s.end_time]];
            // Wrap-around shift: e.g., 21:00 to 05:00
            return [[s.start_time, '23:59'], ['00:00', s.end_time]];
        };

        const i1 = getIntervals(s1);
        const i2 = getIntervals(s2);

        return i1.some(([s1s, s1e]) => 
            i2.some(([s2s, s2e]) => s1s < s2e && s1e > s2s)
        );
    };

    const onSubmit = async (data) => {
        if (isSubmitting) return;
        // Final check for any clashes before submitting
        const clashingDays = [];
        
        DAYS.forEach(day => {
            const daySlots = schedule[day] || [];
            const hasClash = daySlots.some((slot, i) => daySlots.some((other, j) => i !== j && checkOverlap(slot, other)));
            if (hasClash) clashingDays.push(day);
        });

        if (clashingDays.length > 0) {
            toast.error(`Schedule conflict detected on: ${clashingDays.join(', ')}. Please adjust overlapping shifts.`);
            return;
        }

        if (!selectedLocationIds.length) {
            toast.error('Please select at least one location for this staff member');
            return;
        }

        // Check if all slots have a location assigned
        let missingLocation = false;
        DAYS.forEach(day => {
            if (schedule[day]?.some(slot => !slot.location_id)) missingLocation = true;
        });
        if (missingLocation) {
            toast.error('Please assign a location for all time slots');
            return;
        }

        setIsSubmitting(true);
        setOpen(false); // Close immediately
        showGlobalLoader(editId ? 'Updating staff member...' : 'Adding new staff...');

        try {
            let staffId;
            if (editId) {
                staffId = editId;
                const response = await updateStaff(editId, data);
                if (response.success) {
                    // Update availability using bulk methods
                    await deleteStaffAvailabilityByStaff(editId);
                    await createNewAvailabilityRecords(staffId);
                    toast.success('Staff member updated successfully');
                    fetchData();
                }
            } else {
                const response = await createStaff(data);
                if (response.success) {
                    staffId = response.data.id;
                    await createNewAvailabilityRecords(staffId);
                    toast.success('Staff member added successfully');
                    fetchData();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setIsSubmitting(false);
            hideGlobalLoader();
        }
    };

    const createNewAvailabilityRecords = async (staffId) => {
        const records = [];
        Object.entries(schedule).forEach(([day, slots]) => {
            slots.forEach(slot => {
                if (slot.location_id) {
                    records.push({
                        staff_id: staffId,
                        day_of_week: day.toLowerCase(),
                        location_id: slot.location_id,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                    });
                }
            });
        });
        if (records.length > 0) {
            await bulkCreateStaffAvailability(records);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            try {
                // Also delete their availability
                const staffAvails = availability.filter(a => a.staff_id === id);
                await Promise.all(staffAvails.map(a => deleteStaffAvailability(a.id)));
                const response = await deleteStaff(id);
                if (response.success) {
                    toast.success('Staff member deleted successfully');
                    fetchData();
                }
            } catch (error) {
                toast.error('Failed to delete staff member');
            }
        }
    };

    return (
        <PageTransition>
            <PageHeader title="Staff Members" subtitle="Manage your team and their weekly availability." onAddClick={() => handleOpen()} buttonText="Add Staff" 
                extraActions={
                    <Autocomplete
                        multiple
                        size="small"
                        options={DAYS}
                        value={filterDays}
                        onChange={(_, newValue) => {
                            setFilterDays(newValue);
                            setPage(0);
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Filter by Days" placeholder="Select Days" sx={{ minWidth: 220, bgcolor: 'background.paper' }} />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const { key, ...tagProps } = getTagProps({ index });
                                return <Chip key={key} label={option.slice(0, 3)} {...tagProps} size="small" />;
                            })
                        }
                    />
                }
            />

            {/* Desktop Table */}
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Staff Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Business</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Slot</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Working Days</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                    <CircularProgress size={32} />
                                </TableCell>
                            </TableRow>
                        ) : filteredStaff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    {searchQuery ? 'No staff match your search.' : (
                                        <>
                                            <PeopleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3, display: 'block', mx: 'auto' }} />
                                            No staff added yet. Click "Add Staff" to get started.
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : filteredStaff.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((s, index) => {
                            const biz = businesses.find(b => b.id === s.business_id);
                            const workingDays = [...new Set(availability.filter(a => a.staff_id === s.id).map(a => a.day_of_week.slice(0, 3)))];
                            return (
                                <TableRow key={s.id} hover>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{page * rowsPerPage + index + 1}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar
                                                src={s.photo}
                                                sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'primary.50', color: 'primary.main', fontWeight: 700 }}
                                            >
                                                {s.staff_name.charAt(0)}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight={700}>{s.staff_name}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'inline-block', px: 1.5, py: 0.3, borderRadius: 1, bgcolor: 'primary.50', color: 'primary.main', fontSize: '0.75rem', fontWeight: 600 }}>
                                            {s.role || '—'}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{biz?.business_name || '—'}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            {s.locations?.length > 0 
                                                ? s.locations.map(l => (
                                                    <Chip key={l.id} label={l.location_name} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20, fontWeight: 600, borderRadius: 1 }} />
                                                ))
                                                : '—'
                                            }
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{s.phone}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'inline-block', px: 1.5, py: 0.3, borderRadius: 1, bgcolor: 'info.50', color: 'info.dark', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                            {s.slot_duration_minutes || 30} min
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            {workingDays.length > 0
                                                ? workingDays.map(d => (
                                                    <Box key={d} sx={{ px: 1, py: 0.2, borderRadius: 1, bgcolor: 'success.50', color: 'success.dark', fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>{d}</Box>
                                                ))
                                                : <Typography variant="caption" color="text.disabled">Not set</Typography>
                                            }
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpen(s)} color="primary" size="small"><EditIcon fontSize="small" /></IconButton>
                                        <IconButton onClick={() => handleDelete(s.id)} color="error" size="small"><DeleteIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Mobile Card View */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                {loading ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                ) : filteredStaff.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed divider' }}>
                        <Typography color="text.secondary">No staff members found</Typography>
                    </Paper>
                ) : filteredStaff.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((s) => {
                    const workingDays = [...new Set(availability.filter(a => a.staff_id === s.id).map(a => a.day_of_week.slice(0, 3)))];
                    return (
                        <Card key={s.id} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Avatar src={s.photo} sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.main', fontWeight: 800 }}>{s.staff_name.charAt(0)}</Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" fontWeight={900}>{s.staff_name}</Typography>
                                    <Typography variant="caption" color="primary.main" fontWeight={700}>{s.role || 'Staff member'}</Typography>
                                </Box>
                                <Box>
                                    <IconButton onClick={() => handleOpen(s)} size="small" color="primary"><EditIcon fontSize="small" /></IconButton>
                                    <IconButton onClick={() => handleDelete(s.id)} size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                                </Box>
                            </Box>
                            
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Phone</Typography>
                                    <Typography variant="body2" fontWeight={700}>{s.phone}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Slot Duration</Typography>
                                    <Typography variant="body2" fontWeight={700}>{s.slot_duration_minutes || 30} min</Typography>
                                </Grid>
                            </Grid>

                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Working Days:</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {workingDays.length > 0 ? workingDays.map(d => (
                                        <Chip key={d} label={d.toUpperCase()} size="small" color="success" variant="filled" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900 }} />
                                    )) : <Typography variant="caption" color="text.disabled">Not set</Typography>}
                                </Box>
                            </Box>
                        </Card>
                    );
                })}
            </Box>
            <TablePagination
                rowsPerPageOptions={[5, 10, 20, 30, 50]}
                component="div"
                count={filteredStaff.length}
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

            <FormDrawer
                open={open}
                onClose={() => setOpen(false)}
                title={editId ? 'Edit Staff Member' : 'Add Staff Member'}
                subtitle="Set staff details and their weekly availability schedule."
                onSave={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                saveLabel={editId ? (isSubmitting ? 'Updating...' : 'Update Staff') : (isSubmitting ? 'Creating...' : 'Add Staff')}
            >
                {/* --- Assignment --- */}
                <FieldSection label="Assignment">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Controller name="business_id" control={control} rules={{ required: 'Business is required' }}
                            render={({ field }) => (
                                <Autocomplete
                                    options={businesses}
                                    getOptionLabel={(o) => o.business_name || ''}
                                    value={businesses.find(b => b.id === field.value) || null}
                                    onChange={(_, v) => {
                                        field.onChange(v?.id || '');
                                        setValue('location_ids', []); // Reset locations when business changes
                                    }}
                                    isOptionEqualToValue={(o, v) => o.id === v?.id}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Business *" error={!!errors.business_id} helperText={errors.business_id?.message} fullWidth />
                                    )}
                                />
                            )} />
                        
                        <Controller name="location_ids" control={control} rules={{ required: 'Select at least one location' }}
                            render={({ field }) => {
                                const businessId = watch('business_id');
                                const filteredLocations = locations.filter(l => !businessId || String(l.business_id) === String(businessId));
                                
                                return (
                                    <Autocomplete
                                        multiple
                                        fullWidth
                                        options={filteredLocations}
                                        getOptionLabel={(option) => option.location_name || ''}
                                        value={locations.filter(l => (field.value || []).includes(l.id))}
                                        onChange={(_, newValue) => field.onChange(newValue.map(v => v.id))}
                                        disabled={!businessId}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Locations *" error={!!errors.location_ids} helperText={errors.location_ids?.message || (!businessId ? 'Select business first' : '')} placeholder="Select locations" fullWidth />
                                        )}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => {
                                                const { key, ...tagProps } = getTagProps({ index });
                                                return <Chip key={key} label={option.location_name} {...tagProps} size="small" />;
                                            })
                                        }
                                    />
                                );
                            }} />
                    </Box>
                </FieldSection>

                <Divider sx={{ my: 2.5 }} />

                {/* --- Staff Details --- */}
                <FieldSection label="Staff Details">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Controller name="staff_name" control={control}
                            rules={{
                                validate: {
                                    required: v => v?.trim() ? true : 'Name is required',
                                    format: v => validateName(v),
                                    emoji: v => blockEmoji(v)
                                }
                            }}
                            render={({ field }) => (
                                <TextField {...field} fullWidth label="Staff Name *" error={!!errors.staff_name} helperText={errors.staff_name?.message} placeholder="e.g. Dr. Agarwal"
                                    onChange={(e) => field.onChange(e.target.value)}
                                />
                            )} />
                        
                        <Controller name="role" control={control}
                            rules={{ validate: blockEmoji }}
                            render={({ field }) => (
                                <TextField {...field} fullWidth label="Role" placeholder="e.g. Doctor" error={!!errors.role} helperText={errors.role?.message} />
                            )} />
                        
                        <Controller name="phone" control={control}
                            rules={{
                                validate: validateMobile
                            }}
                            render={({ field }) => (
                                <TextField {...field} fullWidth label="Phone" placeholder="9876543210"
                                    error={!!errors.phone} helperText={errors.phone?.message}
                                    inputProps={{ maxLength: 10, inputMode: 'numeric' }}
                                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                />
                            )} />
                    </Box>
                </FieldSection>

                <Divider sx={{ my: 2.5 }} />

                {/* --- Profile Photo --- */}
                <FieldSection label="Profile Photo">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            src={photoPreview}
                            sx={{ width: 80, height: 80, borderRadius: 2, border: '2px solid', borderColor: 'divider' }}
                        >
                            <PeopleIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                        </Avatar>
                        <Box>
                            <Button
                                variant="outlined"
                                component="label"
                                size="small"
                                startIcon={<AddIcon />}
                                sx={{ mb: 1 }}
                            >
                                Upload Photo
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            try {
                                                const compressed = await compressImage(file);
                                                setPhotoPreview(compressed);
                                                setValue('photo', compressed);
                                            } catch (err) {
                                                toast.error('Failed to process image');
                                                console.error(err);
                                            }
                                        }
                                    }}
                                />
                            </Button>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Max 500KB. Square image recommended.
                            </Typography>
                            {photoPreview && (
                                <Button
                                    size="small"
                                    color="error"
                                    sx={{ mt: 0.5, p: 0, minWidth: 0, textTransform: 'none', fontSize: '0.7rem' }}
                                    onClick={() => {
                                        setPhotoPreview(null);
                                        setValue('photo', '');
                                    }}
                                >
                                    Remove
                                </Button>
                            )}
                        </Box>
                    </Box>
                </FieldSection>

                <Divider sx={{ my: 2.5 }} />

                {/* --- Availability Schedule --- */}
                <FieldSection label="Weekly Availability">
                    <Typography variant="caption" color="text.secondary" mb={2} display="block">
                        Assign shifts to specific locations. Ensure timings do not overlap.
                    </Typography>
                    {DAYS.map(day => {
                        const daySlots = schedule[day] || [];
                        const hasClash = daySlots.some((slot, i) => 
                            daySlots.some((other, j) => i !== j && checkOverlap(slot, other))
                        );

                        return (
                            <Box key={day} sx={{ 
                                mb: 2, p: 1.5, borderRadius: 2, 
                                border: '1px solid', 
                                borderColor: hasClash ? 'error.light' : (!!schedule[day] ? 'primary.light' : 'divider'),
                                bgcolor: hasClash ? 'error.50' : (!!schedule[day] ? 'primary.50' : 'transparent'),
                                transition: 'all 0.2s'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: !!schedule[day] ? 1.5 : 0 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={!!schedule[day]}
                                                onChange={() => toggleDay(day)}
                                                size="small"
                                            />
                                        }
                                        label={<Typography variant="body2" fontWeight={700} color={hasClash ? "error" : "inherit"}>{day}</Typography>}
                                        sx={{ mr: 0 }}
                                    />
                                    {hasClash && (
                                        <Typography variant="caption" color="error" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <WarningIcon fontSize="inherit" /> Conflict
                                        </Typography>
                                    )}
                                    {schedule[day] && (
                                        <Button size="small" variant="text" onClick={() => copyToAll(day)} sx={{ fontSize: '0.65rem', fontWeight: 700, ml: 'auto' }}>
                                            Apply to all days
                                        </Button>
                                    )}
                                </Box>

                                {schedule[day] && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {daySlots.map((slot, idx) => {
                                            const errKey = `${day}-${idx}`;
                                            const slotErr = slotErrors[errKey];
                                            const isClashing = daySlots.some((other, j) => idx !== j && checkOverlap(slot, other));
                                            
                                            return (
                                                <Grid container spacing={1} sx={{ 
                                                    alignItems: 'center', p: 1, 
                                                    borderRadius: 1.5, bgcolor: 'white', border: '1px solid',
                                                    borderColor: (slotErr || isClashing) ? 'error.light' : 'divider',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                    mb: 1
                                                }}>
                                                    <Grid item xs={5} sx={{ minWidth: 0 }}>
                                                        <FormControl size="small" fullWidth>
                                                            <InputLabel sx={{ fontSize: '0.8rem' }}>Location</InputLabel>
                                                            <Select
                                                                value={slot.location_id}
                                                                label="Location"
                                                                onChange={(e) => updateSlot(day, idx, 'location_id', e.target.value)}
                                                                error={!slot.location_id}
                                                                sx={{ height: 36, fontSize: '0.8rem' }}
                                                            >
                                                                {locations.filter(l => selectedLocationIds.includes(l.id)).map(l => (
                                                                    <MenuItem key={l.id} value={l.id} sx={{ fontSize: '0.8rem' }}>{l.location_name}</MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    </Grid>

                                                    <Grid item xs={3} sx={{ minWidth: 0 }}>
                                                        <MobileTimePicker
                                                            label="From"
                                                            value={dayjs(slot.start_time, 'HH:mm')}
                                                            onChange={(val) => updateSlot(day, idx, 'start_time', val ? val.format('HH:mm') : '')}
                                                            slotProps={{ 
                                                                textField: { 
                                                                    size: 'small', 
                                                                    fullWidth: true,
                                                                    error: !!slotErr || isClashing,
                                                                    sx: { 
                                                                        '& .MuiInputBase-root': { height: 36, fontSize: '0.8rem' },
                                                                        '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                                                                    }
                                                                } 
                                                            }}
                                                        />
                                                    </Grid>

                                                    <Grid item xs={3} sx={{ minWidth: 0 }}>
                                                        <MobileTimePicker
                                                            label="To"
                                                            value={dayjs(slot.end_time, 'HH:mm')}
                                                            onChange={(val) => updateSlot(day, idx, 'end_time', val ? val.format('HH:mm') : '')}
                                                            slotProps={{ 
                                                                textField: { 
                                                                    size: 'small', 
                                                                    fullWidth: true,
                                                                    error: !!slotErr || isClashing,
                                                                    sx: { 
                                                                        '& .MuiInputBase-root': { height: 36, fontSize: '0.8rem' },
                                                                        '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                                                                    }
                                                                } 
                                                            }}
                                                        />
                                                    </Grid>

                                                    <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                                                        <IconButton 
                                                            size="small" 
                                                            sx={{ 
                                                                color: 'error.main', 
                                                                width: 36, height: 36,
                                                                '&:hover': { bgcolor: 'error.lighter' }
                                                            }} 
                                                            onClick={() => removeSlot(day, idx)}
                                                        >
                                                            <DeleteIcon fontSize="inherit" sx={{ fontSize: '1.2rem' }} />
                                                        </IconButton>
                                                    </Grid>
                                                    {slotErr && (
                                                        <Grid item xs={12}>
                                                            <Typography variant="caption" color="error" sx={{ fontWeight: 600, ml: 1 }}>{slotErr}</Typography>
                                                        </Grid>
                                                    )}
                                                </Grid>
                                            );
                                        })}
                                        <Button
                                            size="small"
                                            startIcon={<AddIcon />}
                                            onClick={() => addSlot(day)}
                                            sx={{ alignSelf: 'flex-start', fontSize: '0.75rem', fontWeight: 700 }}
                                        >
                                            Add Shift
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </FieldSection>
                <Divider sx={{ my: 2.5 }} />

                {/* --- Slot Duration --- */}
                <FieldSection label="Booking Slot Duration">
                    <Typography variant="caption" color="text.secondary" mb={2} display="block">
                        Time duration of each bookable slot (e.g. 30 min → 9:00–9:30, 9:30–10:00, …)
                    </Typography>
                    <Controller name="slot_duration_minutes" control={control}
                        render={({ field }) => (
                            <FormControl fullWidth>
                                <InputLabel>Slot Duration</InputLabel>
                                <Select {...field} label="Slot Duration">
                                    <MenuItem value="15">15 minutes</MenuItem>
                                    <MenuItem value="20">20 minutes</MenuItem>
                                    <MenuItem value="30">30 minutes</MenuItem>
                                    <MenuItem value="45">45 minutes</MenuItem>
                                    <MenuItem value="60">1 hour</MenuItem>
                                    <MenuItem value="90">1.5 hours</MenuItem>
                                    <MenuItem value="120">2 hours</MenuItem>
                                </Select>
                            </FormControl>
                        )} />
                </FieldSection>
            </FormDrawer>
        </PageTransition>
    );
};

export default Staff;
