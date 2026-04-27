import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#6366f1', // Indigo
            light: '#818cf8',
            dark: '#4f46e5',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#a855f7', // Violet
            light: '#c084fc',
            dark: '#9333ea',
            contrastText: '#ffffff',
        },
        background: {
            default: '#0f172a', // Deep slate
            paper: '#1e293b', // Slightly lighter slate
        },
        text: {
            primary: '#f8fafc',
            secondary: '#94a3b8',
        },
        divider: 'rgba(255,255,255,0.08)',
        error: { main: '#ef4444' },
        warning: { main: '#f59e0b' },
        info: { main: '#3b82f6' },
        success: { main: '#10b981' },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.5px' },
        h2: { fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' },
        h3: { fontSize: '1.75rem', fontWeight: 700 },
        h4: { fontSize: '1.5rem', fontWeight: 700 },
        h5: { fontSize: '1.25rem', fontWeight: 600 },
        h6: { fontSize: '1rem', fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
        borderRadius: 14,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                    backgroundAttachment: 'fixed',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#334155 #0f172a',
                },
                '*': {
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.1) transparent',
                },
                // Chrome, Edge, Safari
                '*::-webkit-scrollbar': {
                    width: '6px',
                    height: '6px',
                },
                '*::-webkit-scrollbar-track': {
                    background: 'transparent',
                },
                '*::-webkit-scrollbar-thumb': {
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    transition: 'background-color 0.2s ease',
                },
                '*::-webkit-scrollbar-thumb:hover': {
                    background: 'rgba(255,255,255,0.2)',
                },
                // Prevent showing scrollbar when not needed
                'html, body': {
                    overflowX: 'hidden',
                    height: '100%',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    borderRadius: 10,
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    padding: '20px',
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    borderRadius: 16,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: 10,
                        '& input:-webkit-autofill': {
                            WebkitBoxShadow: '0 0 0 1000px #1e293b inset !important',
                            WebkitTextFillColor: '#f8fafc !important',
                            transition: 'background-color 5000s ease-in-out 0s',
                        },
                        '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.1)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(255,255,255,0.2)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#818cf8',
                        },
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                },
                head: {
                    fontWeight: 700,
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    color: '#c7d2fe',
                },
            },
        },
    },
});

export default theme;
