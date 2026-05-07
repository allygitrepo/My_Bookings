import React, { useState, useEffect } from 'react';
import { 
    Box, TextField, Autocomplete, Typography, 
    InputAdornment, createFilterOptions, MenuItem 
} from '@mui/material';
import axios from 'axios';

// Curated list of common countries as fallback
const DEFAULT_COUNTRIES = [
    { name: 'India', iso2: 'IN', phonecode: '91', emoji: '🇮🇳', length: 10 },
    { name: 'United States', iso2: 'US', phonecode: '1', emoji: '🇺🇸', length: 10 },
    { name: 'United Kingdom', iso2: 'GB', phonecode: '44', emoji: '🇬🇧', length: 10 },
    { name: 'United Arab Emirates', iso2: 'AE', phonecode: '971', emoji: '🇦🇪', length: 9 },
    { name: 'Canada', iso2: 'CA', phonecode: '1', emoji: '🇨🇦', length: 10 },
    { name: 'Australia', iso2: 'AU', phonecode: '61', emoji: '🇦🇺', length: 9 },
    { name: 'Singapore', iso2: 'SG', phonecode: '65', emoji: '🇸🇬', length: 8 },
    { name: 'Germany', iso2: 'DE', phonecode: '49', emoji: '🇩🇪', length: 11 },
];

const filter = createFilterOptions();

const PhoneInput = ({ value = '', onChange, label = 'Phone Number', error, helperText, required = false, fullWidth = true }) => {
    const [countries, setCountries] = useState(DEFAULT_COUNTRIES);
    const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRIES[0]);
    const [phoneNumber, setPhoneNumber] = useState('');

    // Initialize from value (e.g., "+919876543210")
    useEffect(() => {
        if (value && typeof value === 'string') {
            const country = countries.find(c => value.startsWith(`+${c.phonecode}`));
            if (country) {
                setSelectedCountry(country);
                setPhoneNumber(value.replace(`+${country.phonecode}`, ''));
            } else {
                setPhoneNumber(value);
            }
        }
    }, [value, countries]);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const apiKey = import.meta.env.VITE_STATE_CITY_API;
                if (!apiKey) return;

                const response = await axios.get('https://api.countrystatecity.in/v1/countries', {
                    headers: { 'X-CSCAPI-KEY': apiKey }
                });

                if (response.data) {
                    const fetched = response.data.map(c => ({
                        name: c.name,
                        iso2: c.iso2,
                        phonecode: c.phonecode.replace('+', ''),
                        emoji: c.emoji,
                        length: c.iso2 === 'IN' ? 10 : (c.iso2 === 'US' ? 10 : 10) // Defaulting to 10 if not known
                    }));
                    
                    // Prioritize India and US at the top
                    const prioritized = [
                        ...fetched.filter(c => c.iso2 === 'IN' || c.iso2 === 'US'),
                        ...fetched.filter(c => c.iso2 !== 'IN' && c.iso2 !== 'US')
                    ];
                    setCountries(prioritized);
                }
            } catch (err) {
                console.error('Failed to fetch countries:', err);
            }
        };

        fetchCountries();
    }, []);

    const handleCountryChange = (event, newValue) => {
        if (newValue) {
            setSelectedCountry(newValue);
            const newValueFull = `+${newValue.phonecode}${phoneNumber}`;
            onChange(newValueFull);
        }
    };

    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/\D/g, '');
        // Restrict length based on country if known (optional, but requested)
        const maxLength = selectedCountry.length || 15;
        const restrictedVal = val.slice(0, maxLength);
        
        setPhoneNumber(restrictedVal);
        onChange(`+${selectedCountry.phonecode}${restrictedVal}`);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Autocomplete
                    sx={{ width: 150, flexShrink: 0 }}
                    options={countries}
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    getOptionLabel={(option) => `+${option.phonecode} ${option.iso2}`}
                    filterOptions={(options, params) => {
                        const filtered = filter(options, params);
                        const { inputValue } = params;
                        const more = options.filter(o => 
                            o.name.toLowerCase().includes(inputValue.toLowerCase()) && 
                            !filtered.find(f => f.iso2 === o.iso2)
                        );
                        return [...filtered, ...more];
                    }}
                    renderOption={(props, option) => (
                        <MenuItem {...props} sx={{ py: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                <img
                                    loading="lazy"
                                    width="22"
                                    src={`https://flagcdn.com/w20/${option.iso2.toLowerCase()}.png`}
                                    srcSet={`https://flagcdn.com/w40/${option.iso2.toLowerCase()}.png 2x`}
                                    alt={option.name}
                                    style={{ borderRadius: '2px' }}
                                />
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{option.name}</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{option.iso2} (+{option.phonecode})</Typography>
                                </Box>
                            </Box>
                        </MenuItem>
                    )}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Code"
                            placeholder="Search"
                            variant="outlined"
                            InputProps={{
                                ...params.InputProps,
                                startAdornment: selectedCountry ? (
                                    <InputAdornment position="start" sx={{ pl: 1 }}>
                                        <img
                                            loading="lazy"
                                            width="20"
                                            src={`https://flagcdn.com/w20/${selectedCountry.iso2.toLowerCase()}.png`}
                                            alt=""
                                            style={{ borderRadius: '2px' }}
                                        />
                                    </InputAdornment>
                                ) : null,
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    pl: '8px !important'
                                }
                            }}
                        />
                    )}
                    disableClearable
                    autoHighlight
                />
                
                <TextField
                    fullWidth={fullWidth}
                    label={label}
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="Enter phone number"
                    error={error}
                    helperText={helperText}
                    required={required}
                    variant="outlined"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px'
                        }
                    }}
                />
            </Box>
        </Box>
    );
};

export default PhoneInput;
