import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Users, 
  Package,
  Download,
  Calendar,
  PieChart
} from "lucide-react";
import MainLayout from "@/components/Layout/MainLayout";
import { useToast } from "@/hooks/use-toast";

const Reports = () => {
  const { toast } = useToast();

  const reportCategories = [
    {
      title: "Sales Reports",
      description: "Revenue, sales trends, and performance analytics",
      icon: BarChart3,
      color: "text-primary",
      reports: [
        { name: "Daily Sales Report", description: "Daily revenue breakdown with IRD compliance" },
        { name: "Monthly Sales Summary", description: "Monthly sales performance and trends" },
        { name: "Sales by Customer", description: "Top customers and customer analytics" },
        { name: "Sales by Product", description: "Best selling products and inventory turnover" },
      ]
    },
    {
      title: "Financial Reports", 
      description: "Tax compliance, VAT reports, and financial summaries",
      icon: DollarSign,
      color: "text-success",
      reports: [
        { name: "VAT Report", description: "IRD compliant VAT calculations and summaries" },
        { name: "Tax Summary", description: "Complete tax breakdown for IRD filing" },
        { name: "Profit & Loss", description: "Revenue, expenses, and profit analysis" },
        { name: "Cash Flow Report", description: "Cash inflow and outflow tracking" },
      ]
    },
    {
      title: "Customer Reports",
      description: "Customer analytics and relationship insights", 
      icon: Users,
      color: "text-secondary",
      reports: [
        { name: "Customer Analytics", description: "Customer behavior and purchase patterns" },
        { name: "Customer Aging Report", description: "Outstanding balances and payment status" },
        { name: "New Customer Report", description: "Customer acquisition and growth metrics" },
        { name: "Customer Lifetime Value", description: "CLV analysis and retention metrics" },
      ]
    },
    {
      title: "Inventory Reports",
      description: "Stock levels, movements, and inventory analytics",
      icon: Package,
      color: "text-warning",
      reports: [
        { name: "Stock Level Report", description: "Current inventory levels and stock alerts" },
        { name: "Stock Movement Report", description: "Inventory in/out tracking and history" },
        { name: "Low Stock Alert", description: "Products requiring immediate restocking" },
        { name: "Inventory Valuation", description: "Current inventory value and cost analysis" },
      ]
    }
  ];

  const quickStats = [
    { label: "Total Sales This Month", value: "NPR 4,25,600", change: "+15.2%", icon: TrendingUp },
    { label: "Active Customers", value: "89", change: "+5", icon: Users },
    { label: "Invoices Generated", value: "156", change: "+12", icon: FileText },
    { label: "Products in Stock", value: "245", change: "-3", icon: Package },
  ];

  const handleGenerateReport = (reportName: string) => {
    toast({
      title: "Generating Report",
      description: `${reportName} is being generated and will be downloaded shortly.`,
    });
  };

  const handleScheduleReport = (reportName: string) => {
    toast({
      title: "Schedule Report",
      description: `Schedule ${reportName} functionality would open here.`,
    });
  };

  return (
    <MainLayout userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">IRD compliant reports and business insights</p>
          </div>
          <div className="flex gap-2">
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <Card key={index} className="bg-gradient-card shadow-card hover:shadow-md transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </p>
                  </div>
                  <stat.icon className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reportCategories.map((category, index) => (
            <Card key={index} className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <category.icon className={`w-6 h-6 ${category.color}`} />
                  {category.title}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.reports.map((report, reportIndex) => (
                  <div key={reportIndex} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{report.name}</h4>
                      <p className="text-xs text-muted-foreground">{report.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateReport(report.name)}
                        className="gap-2"
                      >
                        <Download className="w-3 h-3" />
                        Generate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm" 
                        onClick={() => handleScheduleReport(report.name)}
                        className="gap-2"
                      >
                        <Calendar className="w-3 h-3" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* IRD Compliance Notice */}
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="w-5 h-5" />
              IRD Compliance
            </CardTitle>
            <CardDescription>
              All reports are generated in compliance with Nepal IRD (Inland Revenue Department) requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">VAT Compliance</h4>
                <p className="text-sm text-muted-foreground">
                  All VAT calculations follow Nepal VAT Act 2064 guidelines with proper tax breakdowns.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Record Keeping</h4>
                <p className="text-sm text-muted-foreground">
                  Maintains complete audit trail and transaction records as required by IRD regulations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Reports;