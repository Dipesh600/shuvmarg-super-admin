import AddBusDialog from "@/components/models/create--bus-model";
import { AddAgentDialog } from "@/components/models/create-agent-model";
import { AddBusOwnerDialog } from "@/components/models/create-bus-owner-model";
import CustomReportDialog from "@/components/models/create-custom-report-model";
import { AddUserDialog } from "@/components/models/create-user-model";
import { EditAgentDialog } from "@/components/models/edit-agent-model";
import { EditBusDialog } from "@/components/models/edit-bus-model";
import { EditBusOwnerDialog } from "@/components/models/edit-bus-owner-model";
import { EditUserDialog } from "@/components/models/edit-user-model";
import { useState, useEffect } from "react";

const agentData = {
  id: "AGT-001",
  name: "Ram Bahadur",
  email: "ram@agency.com",
  phone: "+977-9841234567",
  agencyName: "Nepal Travels Agency",
  location: "Kathmandu",
  status: "Verified",
  commission: "5.2%",
  performance: "Excellent",
  joined: "2023-06-15",
  panNumber: "123456789",
  bankDetails: "Nepal Bank - 1234567890",
  totalApplications: 234,
  totalEarnings: "NPR 156,000",
  monthlyEarnings: "NPR 24,500",
  recentApplications: [
    { id: "APP-001", user: "Sita Sharma", route: "Kathmandu - Pokhara", date: "2024-01-28", commission: "NPR 60", status: "Confirmed" },
    { id: "APP-002", user: "Mohan Thapa", route: "Kathmandu - Chitwan", date: "2024-01-27", commission: "NPR 45", status: "Confirmed" },
    { id: "APP-003", user: "Gita Rai", route: "Pokhara - Butwal", date: "2024-01-27", commission: "NPR 55", status: "Pending" },
  ],
  payouts: [
    { id: "PAY-001", amount: "NPR 12,500", date: "2024-01-25", status: "Completed", method: "Bank Transfer" },
    { id: "PAY-002", amount: "NPR 8,300", date: "2024-01-18", status: "Completed", method: "Bank Transfer" },
    { id: "PAY-003", amount: "NPR 15,200", date: "2024-01-11", status: "Completed", method: "Bank Transfer" },
  ],
};
const ownerData = {
  id: "OWN-001",
  company: "Nepal Express Pvt. Ltd.",
  owner: "Hari Prasad",
  email: "hari@nepalexpress.com",
  phone: "+977-9841234567",
  address: "New Road, Kathmandu",
  type: "Private Limited",
  status: "Active",
  joined: "2022-03-15",
  panNumber: "987654321",
  registrationNumber: "REG-2022-12345",
  bankDetails: "Himalayan Bank - 9876543210",
  fleetSize: 12,
  activeRoutes: 8,
  monthlyRevenue: "NPR 2,450,000",
  totalRevenue: "NPR 28,500,000",
  buses: [
    { id: "NP-BA-1234", type: "Deluxe", route: "Kathmandu - Pokhara", status: "Active", capacity: 42 },
    { id: "NP-BA-2345", type: "AC", route: "Kathmandu - Chitwan", status: "Active", capacity: 36 },
    { id: "NP-BA-3456", type: "Standard", route: "Pokhara - Butwal", status: "Maintenance", capacity: 48 },
  ],
  recentPayments: [
    { id: "SET-001", amount: "NPR 450,000", date: "2024-01-25", status: "Completed", period: "Jan Week 4" },
    { id: "SET-002", amount: "NPR 380,000", date: "2024-01-18", status: "Completed", period: "Jan Week 3" },
    { id: "SET-003", amount: "NPR 520,000", date: "2024-01-11", status: "Completed", period: "Jan Week 2" },
  ],
};
const busData = {
  id: "NP-BA-1234",
  type: "Deluxe",
  operator: "Nepal Express Pvt. Ltd.",
  operatorId: "OWN-001",
  route: "Kathmandu - Pokhara",
  status: "Active",
  gps: "Online",
  capacity: 42,
  occupancy: 85,
  manufacturingYear: 2022,
  chassisNumber: "CH-2022-123456",
  engineNumber: "EN-2022-789012",
  gpsDeviceId: "GPS-001234",
  insuranceExpiry: "2025-06-15",
  fitnessExpiry: "2024-12-31",
  lastService: "2024-01-10",
  nextService: "2024-04-10",
  amenities: ["AC", "WiFi", "USB Charging", "Reclining Seats", "Blankets"],
  recentTrips: [
    { id: "TRP-001", date: "2024-01-28", route: "Kathmandu - Pokhara", passengers: 38, revenue: "NPR 45,600", status: "Completed" },
    { id: "TRP-002", date: "2024-01-27", route: "Pokhara - Kathmandu", passengers: 42, revenue: "NPR 50,400", status: "Completed" },
    { id: "TRP-003", date: "2024-01-26", route: "Kathmandu - Pokhara", passengers: 35, revenue: "NPR 42,000", status: "Completed" },
  ],
  maintenanceHistory: [
    { id: "MNT-001", date: "2024-01-10", type: "Regular Service", cost: "NPR 15,000", description: "Oil change, brake check, tire rotation" },
    { id: "MNT-002", date: "2023-10-15", type: "Repair", cost: "NPR 25,000", description: "AC compressor replacement" },
    { id: "MNT-003", date: "2023-07-20", type: "Regular Service", cost: "NPR 12,000", description: "Full inspection and minor repairs" },
  ],
};
const ModelProvider = () => {
  const [isMounted, setIsMounted] = useState(false);
  // const {admin} = useAuth();
  useEffect(() => {
    setIsMounted(true);
  }, [isMounted]);
  if (!isMounted) {
    return null;
  }
  return (
    <>
      <AddUserDialog />
      <AddAgentDialog />
      <AddBusOwnerDialog />
      <AddBusDialog />
      <EditUserDialog />
      <EditAgentDialog  agent={agentData}/>
      <EditBusOwnerDialog owner={ownerData}/>
      <EditBusDialog bus={busData}/>
      <CustomReportDialog />
    </>
  );
};
export default ModelProvider;
