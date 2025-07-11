
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download, X } from "lucide-react";
import { Invoice, invoiceService } from "@/services/invoiceService";
import { useToast } from "@/hooks/use-toast";

interface InvoiceViewerProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceViewer = ({ invoice, isOpen, onClose }: InvoiceViewerProps) => {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const handlePrint = async () => {
    if (printRef.current) {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 20px; 
                  color: #000;
                  background: #fff;
                }
                .invoice-header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  border-bottom: 2px solid #000;
                  padding-bottom: 20px;
                }
                .invoice-title {
                  font-size: 28px;
                  font-weight: bold;
                  margin-bottom: 10px;
                }
                .company-info, .customer-info { 
                  margin-bottom: 20px; 
                  padding: 15px;
                  border: 1px solid #ccc;
                }
                .invoice-details { 
                  display: flex; 
                  justify-content: space-between; 
                  margin-bottom: 20px; 
                }
                .invoice-table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin-bottom: 20px; 
                }
                .invoice-table th, .invoice-table td { 
                  border: 1px solid #000; 
                  padding: 12px 8px; 
                  text-align: left; 
                  font-size: 12px;
                }
                .invoice-table th { 
                  background-color: #f5f5f5; 
                  font-weight: bold;
                }
                .amount-summary { 
                  float: right; 
                  width: 300px; 
                  margin-top: 20px; 
                }
                .amount-row { 
                  display: flex; 
                  justify-content: space-between; 
                  padding: 5px 0; 
                  border-bottom: 1px solid #eee;
                }
                .total-row { 
                  font-weight: bold; 
                  font-size: 16px; 
                  border-top: 2px solid #000;
                  padding-top: 10px;
                }
                .amount-words {
                  margin-top: 30px;
                  padding: 15px;
                  background-color: #f9f9f9;
                  border: 1px solid #ddd;
                  font-weight: bold;
                }
                .footer-info { 
                  margin-top: 40px; 
                  font-size: 10px; 
                  color: #666; 
                  border-top: 1px solid #ccc;
                  padding-top: 15px;
                }
                .copy-notice {
                  text-align: center;
                  color: red;
                  font-weight: bold;
                  margin-top: 10px;
                }
                @media print { 
                  body { margin: 0; }
                  .no-print { display: none; }
                  @page { margin: 1cm; }
                }
              </style>
            </head>
            <body>
              <div class="invoice-header">
                <div class="invoice-title">TAX INVOICE</div>
                <div style="font-size: 14px; color: #666;">(As per Schedule-6 of VAT Rules)</div>
                ${invoice.printCount > 0 ? `<div class="copy-notice">*** COPY OF ORIGINAL (${invoice.printCount}) ***</div>` : ''}
              </div>

              <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div class="company-info" style="width: 45%;">
                  <h3 style="margin-top: 0;">SELLER INFORMATION</h3>
                  <strong>[Your Company Name]</strong><br>
                  [Your Address]<br>
                  PAN: [Your PAN Number]<br>
                  Phone: [Your Phone]<br>
                  Email: [Your Email]
                </div>
                <div class="customer-info" style="width: 45%;">
                  <h3 style="margin-top: 0;">BUYER INFORMATION</h3>
                  <strong>${invoice.customerName}</strong><br>
                  ${invoice.customerAddress}<br>
                  PAN: ${invoice.customerPAN}<br>
                  Phone: ${invoice.customerPhone}<br>
                  Email: ${invoice.customerEmail}
                </div>
              </div>

              <div class="invoice-details">
                <div><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</div>
                <div><strong>Invoice Date:</strong> ${invoice.invoiceDate}</div>
                <div><strong>Due Date:</strong> ${invoice.dueDate}</div>
                <div><strong>Fiscal Year:</strong> ${invoice.fiscalYear}</div>
              </div>

              <h3 style="margin-bottom: 10px;">ITEMS & SERVICES</h3>
              <table class="invoice-table">
                <thead>
                  <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 25%;">Description</th>
                    <th style="width: 8%;">HSN</th>
                    <th style="width: 8%;">Qty</th>
                    <th style="width: 8%;">Unit</th>
                    <th style="width: 12%;">Rate</th>
                    <th style="width: 10%;">Discount</th>
                    <th style="width: 8%;">VAT%</th>
                    <th style="width: 16%;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items.map((item, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${item.productName}</td>
                      <td>${item.hsnCode || '-'}</td>
                      <td>${item.quantity}</td>
                      <td>${item.unit}</td>
                      <td>NPR ${item.unitPrice.toLocaleString()}</td>
                      <td>NPR ${item.discount.toLocaleString()}</td>
                      <td>${item.vatRate}%</td>
                      <td>NPR ${item.totalAmount.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="amount-summary">
                <div class="amount-row">
                  <span>Subtotal:</span>
                  <span>NPR ${invoice.subtotal.toLocaleString()}</span>
                </div>
                <div class="amount-row">
                  <span>Total Discount:</span>
                  <span>- NPR ${invoice.totalDiscount.toLocaleString()}</span>
                </div>
                <div class="amount-row">
                  <span>Taxable Amount:</span>
                  <span>NPR ${invoice.taxableAmount.toLocaleString()}</span>
                </div>
                <div class="amount-row">
                  <span>VAT Amount:</span>
                  <span>NPR ${invoice.vatAmount.toLocaleString()}</span>
                </div>
                <div class="amount-row total-row">
                  <span>GRAND TOTAL:</span>
                  <span>NPR ${invoice.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div style="clear: both;"></div>

              <div class="amount-words">
                <strong>Amount in Words:</strong> ${convertToWords(invoice.totalAmount)}
              </div>

              ${invoice.remarks ? `
                <div style="margin-top: 20px;">
                  <h3>REMARKS</h3>
                  <div style="padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
                    ${invoice.remarks}
                  </div>
                </div>
              ` : ''}

              <div style="margin-top: 30px;">
                <div style="display: flex; justify-content: space-between;">
                  <div>
                    <strong>Payment Terms:</strong> ${invoice.paymentTerms}<br>
                    ${invoice.paymentMethod ? `<strong>Payment Method:</strong> ${invoice.paymentMethod}<br>` : ''}
                    <strong>Status:</strong> ${invoice.status.toUpperCase()}
                  </div>
                  <div style="text-align: right;">
                    <div>_________________________</div>
                    <div style="margin-top: 10px;"><strong>Authorized Signature</strong></div>
                  </div>
                </div>
              </div>

              <div class="footer-info">
                <div style="display: flex; justify-content: space-between;">
                  <div>
                    Created: ${invoice.createdDate} by ${invoice.createdBy}<br>
                    Updated: ${invoice.updatedDate} by ${invoice.updatedBy}
                  </div>
                  <div style="text-align: right;">
                    Print Count: ${invoice.printCount}<br>
                    IRD Sync: ${invoice.syncedWithIRD ? 'Yes' : 'Pending'}<br>
                    Fiscal Year: ${invoice.fiscalYear}
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        };
      }
    }

    try {
      // Update print count in backend
      await invoiceService.printInvoice(invoice.id);
      toast({
        title: "Invoice Printed",
        description: `Invoice ${invoice.invoiceNumber} has been printed successfully.`,
      });
    } catch (error) {
      console.error('Error updating print count:', error);
      toast({
        title: "Print Completed",
        description: `Invoice ${invoice.invoiceNumber} has been printed (print count update failed).`,
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    // Create a comprehensive text-based invoice for download
    const invoiceText = `
=====================================================
                    TAX INVOICE
              (As per Schedule-6 of VAT Rules)
=====================================================

Invoice Number: ${invoice.invoiceNumber}
Fiscal Year: ${invoice.fiscalYear}
Invoice Date: ${invoice.invoiceDate}
Due Date: ${invoice.dueDate}

${invoice.printCount > 0 ? `*** COPY OF ORIGINAL (${invoice.printCount}) ***\n` : ''}

SELLER INFORMATION:
-------------------
[Your Company Name]
[Your Address]
PAN: [Your PAN Number]
Phone: [Your Phone]
Email: [Your Email]

BUYER INFORMATION:
------------------
Name: ${invoice.customerName}
Address: ${invoice.customerAddress}
PAN: ${invoice.customerPAN}
Phone: ${invoice.customerPhone}
Email: ${invoice.customerEmail}

ITEMS & SERVICES:
=================
${invoice.items.map((item, index) => `
${index + 1}. ${item.productName}
   HSN Code: ${item.hsnCode || 'N/A'}
   Quantity: ${item.quantity} ${item.unit}
   Unit Price: NPR ${item.unitPrice.toLocaleString()}
   Discount: NPR ${item.discount.toLocaleString()}
   VAT Rate: ${item.vatRate}%
   Total Amount: NPR ${item.totalAmount.toLocaleString()}
`).join('')}

AMOUNT SUMMARY:
===============
Subtotal:        NPR ${invoice.subtotal.toLocaleString()}
Total Discount:  NPR ${invoice.totalDiscount.toLocaleString()}
Taxable Amount:  NPR ${invoice.taxableAmount.toLocaleString()}
VAT Amount:      NPR ${invoice.vatAmount.toLocaleString()}
-----------------------------------------------------
GRAND TOTAL:     NPR ${invoice.totalAmount.toLocaleString()}

Amount in Words: ${convertToWords(invoice.totalAmount)}

PAYMENT INFORMATION:
====================
Payment Terms: ${invoice.paymentTerms}
${invoice.paymentMethod ? `Payment Method: ${invoice.paymentMethod}\n` : ''}Status: ${invoice.status.toUpperCase()}

${invoice.remarks ? `REMARKS:\n${invoice.remarks}\n` : ''}

DOCUMENT INFORMATION:
=====================
Created: ${invoice.createdDate} by ${invoice.createdBy}
Updated: ${invoice.updatedDate} by ${invoice.updatedBy}
Print Count: ${invoice.printCount}
IRD Sync Status: ${invoice.syncedWithIRD ? 'Synced' : 'Pending'}

=====================================================
        Thank you for your business!
=====================================================
    `.trim();

    const blob = new Blob([invoiceText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoice.invoiceNumber}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Invoice Downloaded",
      description: `Invoice ${invoice.invoiceNumber} has been downloaded as a text file.`,
    });
  };

  const convertToWords = (amount: number): string => {
    if (amount === 0) return 'Zero Rupees Only';
    
    const rupees = Math.floor(amount);
    const paisa = Math.round((amount - rupees) * 100);
    
    const numberToWords = (num: number): string => {
      if (num === 0) return '';
      
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      
      if (num < 10) return ones[num];
      if (num < 20) return teens[num - 10];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
      if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
      if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
      return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
    };
    
    let result = numberToWords(rupees) + ' Rupees';
    if (paisa > 0) {
      result += ' and ' + numberToWords(paisa) + ' Paisa';
    }
    return result + ' Only';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Invoice {invoice.invoiceNumber}
            <div className="flex gap-2">
              <Button onClick={handlePrint} size="sm" className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button onClick={handleDownload} size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button onClick={onClose} size="sm" variant="ghost">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="space-y-6 p-4">
          {/* Invoice Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">TAX INVOICE</h1>
            <p className="text-sm text-muted-foreground">(As per Schedule-6 of VAT Rules)</p>
            {invoice.printCount > 0 && (
              <Badge variant="destructive">
                COPY OF ORIGINAL ({invoice.printCount})
              </Badge>
            )}
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">SELLER INFORMATION</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><strong>[Your Company Name]</strong></p>
                <p>[Your Address]</p>
                <p>PAN: [Your PAN Number]</p>
                <p>Phone: [Your Phone]</p>
                <p>Email: [Your Email]</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">BUYER INFORMATION</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><strong>{invoice.customerName}</strong></p>
                <p>{invoice.customerAddress}</p>
                <p>PAN: {invoice.customerPAN}</p>
                <p>Phone: {invoice.customerPhone}</p>
                <p>Email: {invoice.customerEmail}</p>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Metadata */}
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Invoice Number:</span>
              <p>{invoice.invoiceNumber}</p>
            </div>
            <div>
              <span className="font-medium">Invoice Date:</span>
              <p>{invoice.invoiceDate}</p>
            </div>
            <div>
              <span className="font-medium">Due Date:</span>
              <p>{invoice.dueDate}</p>
            </div>
            <div>
              <span className="font-medium">Fiscal Year:</span>
              <p>{invoice.fiscalYear}</p>
            </div>
          </div>

          <Separator />

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-2">ITEMS & SERVICES</h3>
            <Table className="border">
              <TableHeader>
                <TableRow>
                  <TableHead className="border">#</TableHead>
                  <TableHead className="border">Description</TableHead>
                  <TableHead className="border">HSN</TableHead>
                  <TableHead className="border">Qty</TableHead>
                  <TableHead className="border">Unit</TableHead>
                  <TableHead className="border">Rate</TableHead>
                  <TableHead className="border">Discount</TableHead>
                  <TableHead className="border">VAT%</TableHead>
                  <TableHead className="border">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="border">{index + 1}</TableCell>
                    <TableCell className="border">{item.productName}</TableCell>
                    <TableCell className="border">{item.hsnCode || '-'}</TableCell>
                    <TableCell className="border">{item.quantity}</TableCell>
                    <TableCell className="border">{item.unit}</TableCell>
                    <TableCell className="border">NPR {item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell className="border">NPR {item.discount.toLocaleString()}</TableCell>
                    <TableCell className="border">{item.vatRate}%</TableCell>
                    <TableCell className="border">NPR {item.totalAmount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold">PAYMENT INFORMATION</h3>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Payment Terms:</span> {invoice.paymentTerms}</p>
                {invoice.paymentMethod && (
                  <p><span className="font-medium">Payment Method:</span> {invoice.paymentMethod}</p>
                )}
                <p><span className="font-medium">Status:</span> 
                  <Badge className="ml-2" variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                    {invoice.status}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">AMOUNT SUMMARY</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>NPR {invoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Discount:</span>
                  <span>- NPR {invoice.totalDiscount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Amount:</span>
                  <span>NPR {invoice.taxableAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT Amount:</span>
                  <span>NPR {invoice.vatAmount.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>GRAND TOTAL:</span>
                  <span>NPR {invoice.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="bg-muted/20 p-3 rounded">
            <p className="text-sm">
              <span className="font-medium">Amount in Words:</span> {convertToWords(invoice.totalAmount)}
            </p>
          </div>

          {/* Remarks */}
          {invoice.remarks && (
            <div>
              <h3 className="font-semibold mb-2">REMARKS</h3>
              <p className="text-sm bg-muted/20 p-3 rounded">{invoice.remarks}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between text-xs text-muted-foreground pt-4 border-t">
            <div>
              <p>Created: {invoice.createdDate} by {invoice.createdBy}</p>
              <p>Updated: {invoice.updatedDate} by {invoice.updatedBy}</p>
            </div>
            <div className="text-right">
              <p>Print Count: {invoice.printCount}</p>
              <p>IRD Sync: {invoice.syncedWithIRD ? 'Yes' : 'Pending'}</p>
              <p>Fiscal Year: {invoice.fiscalYear}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceViewer;
