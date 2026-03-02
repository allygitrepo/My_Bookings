import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import { useStaffServices, useStaff, useServices } from '../store';

const StaffServices = () => {
    const [staffServices] = useStaffServices();
    const [staff] = useStaff();
    const [services] = useServices();

    return (
        <>
            <PageHeader
                title="Staff Services Mapping"
                subtitle="View the relationship between staff members and the services they provide."
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Staff Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Service Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {staffServices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                    No staff assigned to any services. Assign staff while creating a new Service.
                                </TableCell>
                            </TableRow>
                        ) : null}
                        {staffServices.map((ss, index) => {
                            const staffMember = staff.find((s) => s.id === ss.staffId);
                            const service = services.find((s) => s.id === ss.serviceId);
                            return (
                                <TableRow key={index} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{staffMember?.name || 'Unknown'}</TableCell>
                                    <TableCell>{service?.name || 'Unknown'}</TableCell>
                                    <TableCell>{ss.createdAt}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={ss.status}
                                            size="small"
                                            color={ss.status === 'Active' ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

export default StaffServices;
