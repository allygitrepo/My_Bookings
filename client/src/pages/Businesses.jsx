import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, TextField, Grid, MenuItem, Select, FormControl, InputLabel,
    Switch, FormControlLabel, Box, Typography, Divider, Chip, TablePagination, CircularProgress, Card, Tooltip
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
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
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

const INDUSTRY_OPTIONS = [
    { label: 'Healthcare / Hospital', value: 'Healthcare / Hospital', icon: '🏥' },
    { label: 'Corporate', value: 'Corporate', icon: '🏢' },
    { label: 'Salon / Beauty', value: 'Salon / Beauty', icon: '✂️' },
    { label: 'Gym / Fitness', value: 'Gym / Fitness', icon: '💪' },
    { label: 'Spa / Wellness', value: 'Spa / Wellness', icon: '🧖' },
    { label: 'Education / Coaching', value: 'Education / Coaching', icon: '🎓' },
    { label: 'Professional Services', value: 'Professional Services', icon: '💼' },
    { label: 'Other', value: 'Other', icon: '📁' }
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

    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
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
        },
    });

    const hasMultipleLocations = watch('has_multiple_locations');
    const locationType = watch('location_type');

    // Removed local fetchBusinesses as it's now in BusinessContext

    const handleOpen = (biz = null) => {
        setEditId(biz?.id || null);
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

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this business?')) {
            try {
                const response = await deleteBusiness(id);
                if (response.success) {
                    toast.success('Business deleted successfully');
                    refreshBusinesses();
                    refreshUsage();
                }
            } catch (error) {
                toast.error('Failed to delete business');
            }
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
                                <TableCell sx={{ fontWeight: 500 }}>{biz.business_name}</TableCell>
                                <TableCell>{biz.business_type}</TableCell>
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
                                    <IconButton onClick={() => handleDelete(biz.id)} color="error" size="small" disabled={biz.status === false}><DeleteIcon fontSize="small" /></IconButton>
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
                                        width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.50', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' 
                                    }}>
                                        {industry?.icon || '🏢'}
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
                                    <IconButton onClick={() => handleDelete(biz.id)} color="error" size="small" disabled={biz.status === false}><DeleteIcon fontSize="small" /></IconButton>
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
                                    >
                                        {INDUSTRY_OPTIONS.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value} sx={{ py: 1.2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Typography component="span" sx={{ fontSize: '1.2rem' }}>{opt.icon}</Typography>
                                                    <Typography variant="body2">{opt.label}</Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
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
                                <TextField {...field} fullWidth label="Phone" placeholder="+91 79 26543210" error={!!errors.phone} helperText={errors.phone?.message} />
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
                                <Controller
                                    name="location_type"
                                    control={control}
                                    render={({ field: { value, onChange } }) => (
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Paper 
                                                    onClick={() => onChange('Physical')}
                                                    sx={{ 
                                                        p: 1.5, textAlign: 'center', cursor: 'pointer', borderRadius: 2,
                                                        border: '2px solid', borderColor: value === 'Physical' ? 'primary.main' : 'divider',
                                                        bgcolor: value === 'Physical' ? 'primary.50' : 'background.paper',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <LocationIcon color={value === 'Physical' ? 'primary' : 'disabled'} sx={{ mb: 0.5 }} />
                                                    <Typography variant="body2" fontWeight={700} color={value === 'Physical' ? 'primary' : 'text.secondary'}>Physical</Typography>
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Paper 
                                                    onClick={() => onChange('Online')}
                                                    sx={{ 
                                                        p: 1.5, textAlign: 'center', cursor: 'pointer', borderRadius: 2,
                                                        border: '2px solid', borderColor: value === 'Online' ? 'primary.main' : 'divider',
                                                        bgcolor: value === 'Online' ? 'primary.50' : 'background.paper',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <OnlineIcon color={value === 'Online' ? 'primary' : 'disabled'} sx={{ mb: 0.5 }} />
                                                    <Typography variant="body2" fontWeight={700} color={value === 'Online' ? 'primary' : 'text.secondary'}>Online</Typography>
                                                </Paper>
                                            </Grid>
                                        </Grid>
                                    )}
                                />

                                {locationType === 'Physical' ? (
                                    <>
                                        <Controller name="address" control={control}
                                            rules={{ required: !hasMultipleLocations && locationType === 'Physical' ? 'Address is required' : false }}
                                            render={({ field }) => (
                                                <TextField {...field} fullWidth label="Full Address *" multiline rows={2} placeholder="Shop No. 5, Business Center..." 
                                                    error={!!errors.address} helperText={errors.address?.message} />
                                            )} />
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Controller name="city" control={control}
                                                    rules={{ required: !hasMultipleLocations && locationType === 'Physical' ? 'City is required' : false }}
                                                    render={({ field }) => (
                                                        <TextField {...field} fullWidth label="City *" error={!!errors.city} helperText={errors.city?.message} />
                                                    )} />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Controller name="state" control={control}
                                                    rules={{ required: !hasMultipleLocations && locationType === 'Physical' ? 'State is required' : false }}
                                                    render={({ field }) => (
                                                        <TextField {...field} fullWidth label="State *" error={!!errors.state} helperText={errors.state?.message} />
                                                    )} />
                                            </Grid>
                                        </Grid>
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
        </PageTransition>
    );
};

export default Businesses;
