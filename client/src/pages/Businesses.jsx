import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, TextField, Grid, MenuItem, Select, FormControl, InputLabel,
    Switch, FormControlLabel, Box, Typography, Divider, Chip, TablePagination, CircularProgress, Card, Tooltip, Avatar, Button, Autocomplete
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Business as BusinessIcon,
    OpenInNew as OpenIcon,
    LocationOn as LocationIcon,
    LaptopMac as OnlineIcon,
    Map as MapIcon,
    Info as InfoIcon,
    CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';
import PageTransition from '../components/PageTransition';
import { useBusiness } from '../context/BusinessContext';
import { useSubscription } from '../context/SubscriptionContext';
import { createBusiness, updateBusiness, deleteBusiness } from '../api/business.api';
import { refreshToken } from '../api/user.api';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { encodeBusinessId } from '../utils/obfuscation';
import toast from 'react-hot-toast';
import { validateName, validateEmail, validatePhone, blockEmoji } from '../utils/validators';
import { showGlobalLoader, hideGlobalLoader } from '../utils/loader';
import PhoneInput from '../components/ui/PhoneInput';
import ConfirmDialog from '../components/ConfirmDialog';
import locationService from '../utils/locationService';
import {
    Hospital,
    Building2,
    Scissors,
    Dumbbell,
    Sparkles,
    GraduationCap,
    Briefcase,
    Folder
} from 'lucide-react';

const INDUSTRY_OPTIONS = [
    { label: 'Healthcare / Hospital', value: 'Healthcare / Hospital', icon: Hospital, color: '#ef4444' },
    { label: 'Corporate', value: 'Corporate', icon: Building2, color: '#3b82f6' },
    { label: 'Salon / Beauty', value: 'Salon / Beauty', icon: Scissors, color: '#ec4899' },
    { label: 'Gym / Fitness', value: 'Gym / Fitness', icon: Dumbbell, color: '#f59e0b' },
    { label: 'Spa / Wellness', value: 'Spa / Wellness', icon: Sparkles, color: '#10b981' },
    { label: 'Education / Coaching', value: 'Education / Coaching', icon: GraduationCap, color: '#8b5cf6' },
    { label: 'Professional Services', value: 'Professional Services', icon: Briefcase, color: '#6366f1' },
    { label: 'Other', value: 'Other', icon: Folder, color: '#64748b' }
];

const FieldSection = ({ label, children }) => (
    <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
            {label}
        </Typography>
        {children}
    </Box>
);

const Businesses = () => {
    const { searchQuery } = useSearch();
    const { businesses, refreshBusinesses, loading } = useBusiness();
    const { canAdd, usage, refreshUsage } = useSubscription();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => parseInt(localStorage.getItem('rowsPerPage'), 10) || 10);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setPage(0);
    }, [searchQuery]);

    const filteredBusinesses = businesses.filter(biz =>
        biz.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.business_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.sync_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.upi_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            upi_id: '',
            sync_email: '',
            has_multiple_locations: false,
            location_type: 'Physical',
            address: '',
            city: '',
            state: '',
            meeting_link: '',
            account_holder_name: '',
            account_number: '',
            ifsc_code: '',
            bank_name: '',
            logo: '',
        },
    });

    const logoUrl = watch('logo');

    const hasMultipleLocations = watch('has_multiple_locations');
    const locationType = watch('location_type');

    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedState, setSelectedState] = useState(null);

    const fetchStatesData = async () => {
        try {
            const data = await locationService.getStates();
            setStates(data);
        } catch (error) {
            console.error('Failed to fetch states', error);
        }
    };

    const fetchCitiesData = async (stateCode) => {
        try {
            const data = await locationService.getCities(stateCode);
            setCities(data);
        } catch (error) {
            console.error('Failed to fetch cities', error);
        }
    };

    useEffect(() => {
        fetchStatesData();
    }, []);

    useEffect(() => {
        if (selectedState?.iso2) {
            fetchCitiesData(selectedState.iso2);
        } else {
            setCities([]);
        }
    }, [selectedState]);

    const handleOpen = async (biz = null) => {
        setEditId(biz?.id || null);
        if (biz && biz.state) {
            const stateObj = states.find(s => s.name === biz.state);
            setSelectedState(stateObj || null);
            if (stateObj) {
                await fetchCitiesData(stateObj.iso2);
            }
        } else {
            setSelectedState(null);
            setCities([]);
        }
        reset(biz ? {
            business_name: biz.business_name || '',
            business_type: biz.business_type || '',
            email: biz.email || '',
            phone: biz.phone || '',
            upi_id: biz.upi_id || '',
            sync_email: biz.sync_email || '',
            has_multiple_locations: !!biz.has_multiple_locations,
            location_type: biz.location_type || 'Physical',
            address: biz.address || '',
            city: biz.city || '',
            state: biz.state || '',
            meeting_link: biz.meeting_link || '',
            account_holder_name: biz.account_holder_name || '',
            account_number: biz.account_number || '',
            ifsc_code: biz.ifsc_code || '',
            bank_name: biz.bank_name || '',
            logo: biz.logo || '',
        } : {
            business_name: '',
            business_type: '',
            email: '',
            phone: '',
            upi_id: '',
            sync_email: '',
            has_multiple_locations: false,
            location_type: 'Physical',
            address: '',
            city: '',
            state: '',
            meeting_link: '',
            account_holder_name: '',
            account_number: '',
            ifsc_code: '',
            bank_name: '',
            logo: '',
        });
        setOpen(true);
    };

    const onSubmit = async (data) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setOpen(false); // Close drawer immediately
        showGlobalLoader(editId ? 'Updating business...' : 'Creating business...');

        try {
            if (editId) {
                const response = await updateBusiness(editId, data);
                if (response.success) {
                    toast.success('Business updated successfully');
                    refreshBusinesses();
                }
            } else {
                const response = await createBusiness(data);
                if (response.success) {
                    toast.success('Business created successfully');
                    refreshBusinesses();
                    refreshUsage();
                    // Refresh the JWT token to embed the new business_id.
                    try {
                        const refreshed = await refreshToken();
                        if (refreshed.success) {
                            const { token, user: refreshedUser } = refreshed.data;
                            const currentUserData = JSON.parse(localStorage.getItem('currentUser')) || {};
                            localStorage.setItem('currentUser', JSON.stringify({
                                ...currentUserData,
                                ...refreshedUser,
                                token,
                            }));
                        }
                    } catch (e) {
                        console.warn('Token refresh failed', e);
                    }
                }
            }
        } catch (error) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
            hideGlobalLoader();
        }
    };

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [businessToDelete, setBusinessToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleDeleteClick = (id) => {
        setBusinessToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!businessToDelete) return;
        setDeleteLoading(true);
        try {
            const response = await deleteBusiness(businessToDelete);
            if (response.success) {
                toast.success('Business deleted successfully');
                refreshBusinesses();
                refreshUsage();
            } else {
                toast.error(response.message || 'Failed to delete business');
            }
        } catch (error) {
            toast.error('Failed to delete business');
        } finally {
            setDeleteLoading(false);
            setDeleteConfirmOpen(false);
            setBusinessToDelete(null);
        }
    };

    return (
        <PageTransition>
            <PageHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        Businesses
                        {usage && usage.limits.businesses !== -1 && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1.5 }}>
                                {usage.usage.businesses} / {usage.limits.businesses} Used
                            </Typography>
                        )}
                    </Box>
                }
                subtitle="Manage your business profiles and settings."
                onAddClick={() => handleOpen()}
                buttonText="Add Business"
                disabled={!canAdd('business')}
            />

            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, borderRadius: '16px', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Business Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                            {/* <TableCell sx={{ fontWeight: 600 }}>Sync Email</TableCell> */}
                            <TableCell sx={{ fontWeight: 600 }}>UPI ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                    <CircularProgress size={32} />
                                </TableCell>
                            </TableRow>
                        ) : filteredBusinesses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    {searchQuery ? 'No businesses match your search.' : (
                                        <Box sx={{ opacity: 0.5 }}>
                                            <BusinessIcon sx={{ fontSize: 40, mb: 1, display: 'block', mx: 'auto' }} />
                                            <Typography variant="h6">No businesses yet</Typography>
                                            <Typography variant="body2">Click "Add Business" to get started.</Typography>
                                        </Box>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : filteredBusinesses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((biz, index) => (
                            <TableRow key={biz.id} hover>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{page * rowsPerPage + index + 1}</TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>
                                    {biz.business_name}
                                </TableCell>
                                <TableCell>
                                    {(() => {
                                        const opt = INDUSTRY_OPTIONS.find(o => o.value === biz.business_type);
                                        if (!opt) return biz.business_type;
                                        const IconComp = opt.icon;
                                        return (
                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    width: 24, height: 24, borderRadius: 1.2,
                                                    bgcolor: `${opt.color}18`, color: opt.color
                                                }}>
                                                    <IconComp size={14} />
                                                </Box>
                                                <Typography variant="body2" fontWeight={500}>{biz.business_type}</Typography>
                                            </Box>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell>{biz.phone}</TableCell>
                                <TableCell>{biz.email}</TableCell>
                                {/* <TableCell>{biz.sync_email || '—'}</TableCell> */}
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{biz.upi_id || '—'}</TableCell>
                                <TableCell>
                                    {biz.status === false ? (
                                        <Tooltip title={biz.suspended_reason || "Violation of platform policies"} arrow>
                                            <Chip
                                                label="Suspended"
                                                color="error"
                                                size="small"
                                                variant="filled"
                                                icon={<InfoIcon style={{ fontSize: '0.9rem' }} />}
                                                sx={{ fontWeight: 700, borderRadius: 1.5, cursor: 'help' }}
                                            />
                                        </Tooltip>
                                    ) : (
                                        <Chip
                                            label="Active"
                                            color="success"
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                        />
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    {biz.website_enabled && biz.slug && (
                                        <IconButton
                                            onClick={() => window.open(`/${encodeBusinessId(biz.id)}`, '_blank')}
                                            color="secondary"
                                            size="small"
                                            title="Visit Website"
                                        >
                                            <OpenIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    <IconButton onClick={() => handleOpen(biz)} color="primary" size="small" disabled={biz.status === false}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton onClick={() => handleDeleteClick(biz.id)} color="error" size="small" disabled={biz.status === false}><DeleteIcon fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Mobile Card View */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                {loading ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                ) : filteredBusinesses.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px dashed divider' }}>
                        <Typography color="text.secondary">No businesses found</Typography>
                    </Paper>
                ) : filteredBusinesses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((biz) => {
                    const industry = INDUSTRY_OPTIONS.find(opt => opt.value === biz.business_type);
                    return (
                        <Card key={biz.id} sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <Box sx={{
                                         width: 40, height: 40, borderRadius: 2,
                                         bgcolor: `${industry?.color || '#3b82f6'}18`, color: industry?.color || '#3b82f6',
                                         display: 'flex', alignItems: 'center', justifyContent: 'center'
                                     }}>
                                         {industry?.icon ? (() => {
                                             const IconComp = industry.icon;
                                             return <IconComp size={20} />;
                                         })() : <Building2 size={20} />}
                                     </Box>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={900}>{biz.business_name}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="caption" color="text.secondary">{biz.business_type}</Typography>
                                            {biz.status === false && (
                                                <Chip label="Suspended" color="error" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex' }}>
                                    {biz.website_enabled && (
                                        <IconButton onClick={() => window.open(`/${encodeBusinessId(biz.id)}`, '_blank')} color="secondary" size="small">
                                            <OpenIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    <IconButton onClick={() => handleOpen(biz)} color="primary" size="small" disabled={biz.status === false}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton onClick={() => handleDeleteClick(biz.id)} color="error" size="small" disabled={biz.status === false}><DeleteIcon fontSize="small" /></IconButton>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Phone</Typography>
                                    <Typography variant="body2" fontWeight={700}>{biz.phone || '—'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">UPI ID</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{biz.upi_id || '—'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary" display="block">Email</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>{biz.email || '—'}</Typography>
                                </Grid>
                            </Grid>
                        </Card>
                    );
                })}
            </Box>
            <TablePagination
                rowsPerPageOptions={[5, 10, 20, 30, 50]}
                component="div"
                count={filteredBusinesses.length}
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
                title={editId ? 'Edit Business' : 'Add New Business'}
                subtitle="Fill in the details below to configure your business profile."
                onSave={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                saveLabel={editId ? (isSubmitting ? 'Updating...' : 'Update Business') : (isSubmitting ? 'Creating...' : 'Create Business')}
            >
                <FieldSection label="Business Identity">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Controller name="business_name" control={control}
                            rules={{
                                validate: {
                                    required: v => v?.trim() ? true : 'Business name is required',
                                    format: v => validateName(v),
                                    emoji: v => blockEmoji(v)
                                }
                            }}
                            render={({ field }) => (
                                <TextField {...field} fullWidth label="Business Name *" error={!!errors.business_name}
                                    helperText={errors.business_name?.message} placeholder="e.g. Shiv Clinic" />
                            )} />

                        <Controller name="business_type" control={control} rules={{ required: 'Business type is required' }}
                            render={({ field }) => (
                                <FormControl fullWidth error={!!errors.business_type} variant="outlined">
                                    <InputLabel id="business-type-label">Business Type *</InputLabel>
                                    <Select
                                        {...field}
                                        labelId="business-type-label"
                                        label="Business Type *"
                                        sx={{ borderRadius: 2 }}
                                        renderValue={(selected) => {
                                            const opt = INDUSTRY_OPTIONS.find(o => o.value === selected);
                                            if (!opt) return selected;
                                            const IconComp = opt.icon;
                                            return (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 26, height: 26, borderRadius: 1.5,
                                                        bgcolor: `${opt.color}18`, color: opt.color
                                                    }}>
                                                        <IconComp size={15} />
                                                    </Box>
                                                    <Typography variant="body2" fontWeight={600}>{opt.label}</Typography>
                                                </Box>
                                            );
                                        }}
                                    >
                                        {INDUSTRY_OPTIONS.map(opt => {
                                            const IconComp = opt.icon;
                                            return (
                                                <MenuItem key={opt.value} value={opt.value} sx={{ py: 1.2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Box sx={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            width: 32, height: 32, borderRadius: 1.8,
                                                            bgcolor: `${opt.color}18`, color: opt.color
                                                        }}>
                                                            <IconComp size={18} />
                                                        </Box>
                                                        <Typography variant="body2" fontWeight={600}>{opt.label}</Typography>
                                                    </Box>
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                    {errors.business_type && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                            {errors.business_type.message}
                                        </Typography>
                                    )}
                                </FormControl>
                            )} />
                    </Box>
                </FieldSection>

                <Divider sx={{ my: 2.5 }} />

                <FieldSection label="Business Logo">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar
                            src={logoUrl ? (logoUrl.startsWith('http') ? logoUrl : `${import.meta.env.VITE_API_BASE_URL.replace('/mybookings', '')}${logoUrl}`) : undefined}
                            sx={{ width: 80, height: 80, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}
                        >
                            {!logoUrl && <BusinessIcon sx={{ fontSize: 40, color: 'text.disabled' }} />}
                        </Avatar>
                        <Box>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<UploadIcon />}
                                size="small"
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                            >
                                Upload Logo
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const formData = new FormData();
                                            formData.append('logo', file);
                                            try {
                                                const token = JSON.parse(localStorage.getItem('currentUser'))?.token;
                                                const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/upload/logo`, formData, {
                                                    headers: {
                                                        'Content-Type': 'multipart/form-data',
                                                        'Authorization': `Bearer ${token}`
                                                    }
                                                });
                                                if (res.data.success) {
                                                    reset({ ...watch(), logo: res.data.url });
                                                    toast.success('Logo uploaded successfully');
                                                }
                                            } catch (err) {
                                                toast.error('Failed to upload logo');
                                            }
                                        }
                                    }}
                                />
                            </Button>
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                Recommended: Square image (min 200x200px), Max 2MB.
                            </Typography>
                        </Box>
                    </Box>
                </FieldSection>

                <Divider sx={{ my: 2.5 }} />
                <FieldSection label="Contact Information">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Controller name="email" control={control}
                            rules={{ validate: validateEmail }}
                            render={({ field }) => (
                                <TextField {...field} fullWidth label="Email Address" type="email" placeholder="business@example.com" error={!!errors.email} helperText={errors.email?.message} />
                            )} />

                        <Controller name="phone" control={control}
                            rules={{ validate: validatePhone }}
                            render={({ field }) => (
                                <PhoneInput
                                    {...field}
                                    label="Phone Number"
                                    error={!!errors.phone}
                                    helperText={errors.phone?.message}
                                />
                            )} />

                        <Controller name="upi_id" control={control}
                            rules={{ validate: blockEmoji }}
                            render={({ field }) => (
                                <TextField {...field} fullWidth label="UPI ID" placeholder="businessname@upi" error={!!errors.upi_id} helperText={errors.upi_id?.message} />
                            )} />
                    </Box>
                </FieldSection>
                <Divider sx={{ my: 2.5 }} />

                <FieldSection label="Payout Details (Optional)">
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                        Provide your bank details to receive payments from bookings. These are handled via our central Razorpay account.
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                        It is required for manage the sattlements after bookings
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Controller name="account_holder_name" control={control}
                            render={({ field }) => (
                                <TextField {...field} fullWidth label="Account Holder Name" placeholder="Full name as per bank" />
                            )} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Controller name="account_number" control={control}
                                    render={({ field }) => (
                                        <TextField {...field} fullWidth label="Account Number" placeholder="1234567890" />
                                    )} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller name="ifsc_code" control={control}
                                    render={({ field }) => (
                                        <TextField {...field} fullWidth label="IFSC Code" placeholder="SBIN0001234" />
                                    )} />
                            </Grid>
                        </Grid>

                        <Controller name="bank_name" control={control}
                            render={({ field }) => (
                                <TextField {...field} fullWidth label="Bank Name" placeholder="State Bank of India" />
                            )} />
                    </Box>
                </FieldSection>

                <Divider sx={{ my: 2.5 }} />

                <FieldSection label="Location Structure">
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px', border: '1px dashed', borderColor: 'divider' }}>
                        <Controller
                            name="has_multiple_locations"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <Tooltip
                                    title={usage?.limits?.locations === 1 ? "Upgrade your plan to enable multiple locations for this business." : ""}
                                    placement="top"
                                    arrow
                                >
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={usage?.limits?.locations === 1 ? false : !!value}
                                                onChange={usage?.limits?.locations === 1 ? undefined : onChange}
                                                disabled={usage?.limits?.locations === 1}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography variant="body2" fontWeight={700} color={usage?.limits?.locations === 1 ? 'text.disabled' : 'inherit'}>
                                                    Operating from multiple locations?
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {usage?.limits?.locations === 1
                                                        ? "Your current plan supports 1 location only."
                                                        : value
                                                            ? "Use the 'Locations' page to manage your branches."
                                                            : "Provide address details here to bypass manual location setup."}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </Tooltip>
                            )}
                        />
                    </Box>
                </FieldSection>

                {!hasMultipleLocations && (
                    <>
                        <Divider sx={{ my: 2.5 }} />
                        <FieldSection label="Business Location Details">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px', border: '1px dashed', borderColor: 'divider' }}>
                                    <Controller
                                        name="location_type"
                                        control={control}
                                        render={({ field: { value, onChange } }) => (
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={value === 'Online'}
                                                        onChange={(e) => onChange(e.target.checked ? 'Online' : 'Physical')}
                                                        color="primary"
                                                    />
                                                }
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        {value === 'Online' ? (
                                                            <OnlineIcon color="primary" fontSize="small" />
                                                        ) : (
                                                            <LocationIcon color="action" fontSize="small" />
                                                        )}
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                Is this an Online Business?
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {value === 'Online'
                                                                    ? "Online business (Google Meet, Zoom, virtual consultations)."
                                                                    : "Physical location (physical street address & branch)."
                                                                }
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        )}
                                    />
                                </Box>

                                {locationType === 'Physical' ? (
                                    <>
                                        <Controller name="address" control={control}
                                            rules={{ required: !hasMultipleLocations && locationType === 'Physical' ? 'Address is required' : false }}
                                            render={({ field }) => (
                                                <TextField {...field} fullWidth label="Full Address *" multiline rows={2} placeholder="Shop No. 5, Business Center..."
                                                    error={!!errors.address} helperText={errors.address?.message} />
                                            )} />
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, width: '100%' }}>
                                            <Controller name="state" control={control}
                                                rules={{ required: !hasMultipleLocations && locationType === 'Physical' ? 'State is required' : false }}
                                                render={({ field }) => (
                                                    <Autocomplete
                                                        fullWidth
                                                        options={states}
                                                        getOptionLabel={(option) => option.name || ''}
                                                        value={states.find(s => s.name === field.value) || null}
                                                        onChange={(_, v) => {
                                                            field.onChange(v?.name || '');
                                                            setSelectedState(v || null);
                                                            setValue('city', '');
                                                        }}
                                                        isOptionEqualToValue={(option, value) => option.name === value?.name}
                                                        renderInput={(params) => (
                                                            <TextField {...params} label="State *" error={!!errors.state} helperText={errors.state?.message} />
                                                        )}
                                                        slotProps={{
                                                            paper: {
                                                                sx: {
                                                                    borderRadius: 2,
                                                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                                                    '& .MuiAutocomplete-listbox': { maxHeight: 250 },
                                                                    '& .MuiAutocomplete-option': { fontSize: '0.875rem', py: 1 }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                )} />
                                            <Controller name="city" control={control}
                                                rules={{ required: !hasMultipleLocations && locationType === 'Physical' ? 'City is required' : false }}
                                                render={({ field }) => (
                                                    <Autocomplete
                                                        fullWidth
                                                        options={cities}
                                                        getOptionLabel={(option) => typeof option === 'string' ? option : option.name || ''}
                                                        value={cities.find(c => (typeof c === 'string' ? c : c.name) === field.value) || null}
                                                        onChange={(_, v) => field.onChange(typeof v === 'string' ? v : v?.name || '')}
                                                        isOptionEqualToValue={(option, value) => (typeof option === 'string' ? option : option.name) === (typeof value === 'string' ? value : value?.name)}
                                                        disabled={!selectedState}
                                                        noOptionsText={selectedState ? 'No cities found' : 'Select state first'}
                                                        renderInput={(params) => (
                                                            <TextField {...params} label="City *" error={!!errors.city} helperText={errors.city?.message || (!selectedState ? 'Select state first' : '')} />
                                                        )}
                                                        slotProps={{
                                                            paper: {
                                                                sx: {
                                                                    borderRadius: 2,
                                                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                                                    '& .MuiAutocomplete-listbox': { maxHeight: 250 },
                                                                    '& .MuiAutocomplete-option': { fontSize: '0.875rem', py: 1 }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                )} />
                                        </Box>
                                    </>
                                ) : (
                                    <Controller name="meeting_link" control={control}
                                        render={({ field }) => (
                                            <TextField {...field} fullWidth label="Meeting Link / Instructions" placeholder="Zoom Link, Google Meet URL, etc."
                                                multiline rows={2} helperText="Explain how customers will meet you online." />
                                        )} />
                                )}
                            </Box>
                        </FieldSection>
                    </>
                )}
            </FormDrawer>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onClose={() => { if (!deleteLoading) { setDeleteConfirmOpen(false); setBusinessToDelete(null); } }}
                onConfirm={handleConfirmDelete}
                loading={deleteLoading}
                title="Delete Business?"
                message="Are you sure you want to delete this business? All associated services, bookings, and locations under this business will be permanently affected."
                confirmText="Delete Business"
                confirmColor="error"
                iconType="delete"
            />
        </PageTransition>
    );
};

export default Businesses;
