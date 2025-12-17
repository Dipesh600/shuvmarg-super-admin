import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useModal } from "@/hooks/use-model-store";

const CustomReportDialog = () => {
  const { isOpen, type, onClose } = useModal();
  const isModelOpen = isOpen && type === "addCustomReport";
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <Dialog open={isModelOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Generate Custom Report</DialogTitle>
          <DialogDescription>
            Configure your custom report parameters and data fields.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] custom-scrollbar overflow-y-auto px-2">
            <div className="space-y-2">
              <Label htmlFor="reportName">Report Name *</Label>
              <Input id="reportName" placeholder="Enter report name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial Report</SelectItem>
                  <SelectItem value="operational">
                    Operational Report
                  </SelectItem>
                  <SelectItem value="userAnalytics">User Analytics</SelectItem>
                  <SelectItem value="fleetPerformance">
                    Fleet Performance
                  </SelectItem>
                  <SelectItem value="agentCommission">
                    Agent Commission
                  </SelectItem>
                  <SelectItem value="compliance">Compliance Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input id="startDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input id="endDate" type="date" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV File</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Include Data Fields</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="revenue" defaultChecked />
                  <label htmlFor="revenue" className="text-sm">
                    Revenue Data
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="transactions" defaultChecked />
                  <label htmlFor="transactions" className="text-sm">
                    Transactions
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="userStats" />
                  <label htmlFor="userStats" className="text-sm">
                    User Statistics
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="routeAnalysis" />
                  <label htmlFor="routeAnalysis" className="text-sm">
                    Route Analysis
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="commissions" />
                  <label htmlFor="commissions" className="text-sm">
                    Commissions
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="bookings" />
                  <label htmlFor="bookings" className="text-sm">
                    Booking Details
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule Report</Label>
              <Select defaultValue="once">
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">One-time</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailRecipients">
                Email Recipients (optional)
              </Label>
              <Input
                id="emailRecipients"
                placeholder="email1@example.com, email2@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit">Generate Report</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomReportDialog;
