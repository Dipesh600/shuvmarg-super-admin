import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState } from "react";

const ReportEdit = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "Daily Revenue Report",
    description: "Complete revenue breakdown by routes and payment methods",
    frequency: "daily",
    format: "pdf",
    recipients: "admin@yatrabus.com, finance@yatrabus.com",
    autoGenerate: true,
    scheduleTime: "06:00",
    includeCharts: true,
    includeSummary: true,
    includeDetails: true,
    retentionDays: "30"
  });

  const handleSave = () => {
    toast.success("Report settings saved successfully");
    navigate("/reports");
  };

  const handleDelete = () => {
    toast.success("Report schedule deleted");
    navigate("/reports");
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Edit Report Settings</h2>
          <p className="text-muted-foreground mt-1">Configure report generation and scheduling</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" className="gap-2" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete Schedule
          </Button>
          <Button className="gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Report name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Report Name</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Output Format</Label>
              <Select value={formData.format} onValueChange={(v) => setFormData({...formData, format: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV File</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Settings</CardTitle>
            <CardDescription>Configure automatic report generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Generate</Label>
                <p className="text-sm text-muted-foreground">Automatically generate reports on schedule</p>
              </div>
              <Switch 
                checked={formData.autoGenerate}
                onCheckedChange={(v) => setFormData({...formData, autoGenerate: v})}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={formData.frequency} onValueChange={(v) => setFormData({...formData, frequency: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Schedule Time</Label>
              <Input 
                id="time" 
                type="time"
                value={formData.scheduleTime}
                onChange={(e) => setFormData({...formData, scheduleTime: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retention">Retention Period (days)</Label>
              <Input 
                id="retention" 
                type="number"
                value={formData.retentionDays}
                onChange={(e) => setFormData({...formData, retentionDays: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Email Distribution</CardTitle>
            <CardDescription>Configure report recipients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipients">Email Recipients</Label>
              <Textarea 
                id="recipients" 
                value={formData.recipients}
                onChange={(e) => setFormData({...formData, recipients: e.target.value})}
                placeholder="Enter email addresses separated by commas"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
            </div>
          </CardContent>
        </Card>

        {/* Content Options */}
        <Card>
          <CardHeader>
            <CardTitle>Content Options</CardTitle>
            <CardDescription>Choose what to include in the report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Include Summary</Label>
                <p className="text-sm text-muted-foreground">Executive summary with key metrics</p>
              </div>
              <Switch 
                checked={formData.includeSummary}
                onCheckedChange={(v) => setFormData({...formData, includeSummary: v})}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Include Charts</Label>
                <p className="text-sm text-muted-foreground">Visual charts and graphs</p>
              </div>
              <Switch 
                checked={formData.includeCharts}
                onCheckedChange={(v) => setFormData({...formData, includeCharts: v})}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Include Details</Label>
                <p className="text-sm text-muted-foreground">Detailed transaction breakdown</p>
              </div>
              <Switch 
                checked={formData.includeDetails}
                onCheckedChange={(v) => setFormData({...formData, includeDetails: v})}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ReportEdit;
