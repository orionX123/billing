
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Download, X, Eye, Package, Tag, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Product } from "@/services/productService";
import { useToast } from "@/hooks/use-toast";

interface ProductViewerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductViewer = ({ product, isOpen, onClose }: ProductViewerProps) => {
  const { toast } = useToast();

  if (!product) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Product Details - ${product.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                color: #000;
                background: #fff;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #000;
                padding-bottom: 20px;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .product-info { 
                margin-bottom: 20px; 
                padding: 15px;
                border: 1px solid #ccc;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
              }
              .info-item {
                margin-bottom: 10px;
              }
              .label {
                font-weight: bold;
                color: #333;
              }
              .value {
                margin-left: 10px;
              }
              .status-active { color: #22c55e; }
              .status-inactive { color: #ef4444; }
              .low-stock { color: #f59e0b; }
              .footer { 
                margin-top: 40px; 
                font-size: 10px; 
                color: #666; 
                border-top: 1px solid #ccc;
                padding-top: 15px;
                text-align: center;
              }
              @media print { 
                body { margin: 0; }
                @page { margin: 1cm; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">PRODUCT DETAILS</div>
              <div style="font-size: 14px; color: #666;">Product Information Report</div>
            </div>

            <div class="product-info">
              <h2 style="margin-top: 0; color: #1f2937;">${product.name}</h2>
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <span class="label">SKU:</span>
                    <span class="value">${product.sku || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Category:</span>
                    <span class="value">${product.category}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Brand:</span>
                    <span class="value">${product.brand || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Barcode:</span>
                    <span class="value">${product.barcode || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">HSN Code:</span>
                    <span class="value">${product.hsnCode || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <span class="label">Price:</span>
                    <span class="value">NPR ${product.price.toLocaleString()}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Cost Price:</span>
                    <span class="value">NPR ${product.costPrice.toLocaleString()}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Stock:</span>
                    <span class="value ${product.stock <= product.minStockLevel ? 'low-stock' : ''}">${product.stock} ${product.unitOfMeasure}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Reorder Point:</span>
                    <span class="value">${product.reorderPoint} ${product.unitOfMeasure}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">VAT Rate:</span>
                    <span class="value">${product.vatRate}%</span>
                  </div>
                </div>
              </div>

              ${product.description ? `
                <div class="info-item">
                  <span class="label">Description:</span>
                  <div style="margin-top: 5px; padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
                    ${product.description}
                  </div>
                </div>
              ` : ''}

              ${product.supplier ? `
                <div class="info-item">
                  <span class="label">Supplier:</span>
                  <span class="value">${product.supplier}</span>
                </div>
              ` : ''}

              <div class="info-item">
                <span class="label">Status:</span>
                <span class="value ${product.status === 'Active' ? 'status-active' : 'status-inactive'}">${product.status}</span>
              </div>
            </div>

            <div class="footer">
              Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>
              Created: ${product.createdDate} | Updated: ${product.updatedDate}
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
    }

    toast({
      title: "Product Details Printed",
      description: `Product details for "${product.name}" have been printed successfully.`,
    });
  };

  const handleDownload = () => {
    const productText = `
PRODUCT DETAILS REPORT
======================

Product Name: ${product.name}
SKU: ${product.sku || 'N/A'}
Category: ${product.category}
Brand: ${product.brand || 'N/A'}
Barcode: ${product.barcode || 'N/A'}
HSN Code: ${product.hsnCode || 'N/A'}

PRICING INFORMATION:
====================
Selling Price: NPR ${product.price.toLocaleString()}
Cost Price: NPR ${product.costPrice.toLocaleString()}
Profit Margin: NPR ${(product.price - product.costPrice).toLocaleString()}
VAT Rate: ${product.vatRate}%

INVENTORY INFORMATION:
======================
Current Stock: ${product.stock} ${product.unitOfMeasure}
Minimum Stock Level: ${product.minStockLevel} ${product.unitOfMeasure}
Reorder Point: ${product.reorderPoint} ${product.unitOfMeasure}
Stock Status: ${product.stock <= product.minStockLevel ? 'LOW STOCK - REORDER REQUIRED' : 'ADEQUATE STOCK'}

ADDITIONAL INFORMATION:
=======================
${product.description ? `Description: ${product.description}\n` : ''}${product.supplier ? `Supplier: ${product.supplier}\n` : ''}Status: ${product.status}

RECORD INFORMATION:
===================
Created: ${product.createdDate} by ${product.createdBy}
Updated: ${product.updatedDate} by ${product.updatedBy}

Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
    `.trim();

    const blob = new Blob([productText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Product_${product.sku || product.id}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Product Details Downloaded",
      description: `Product details for "${product.name}" have been downloaded as a text file.`,
    });
  };

  const getStockStatus = () => {
    if (product.stock <= 0) return { status: 'Out of Stock', color: 'destructive' };
    if (product.stock <= product.minStockLevel) return { status: 'Low Stock', color: 'warning' };
    return { status: 'In Stock', color: 'default' };
  };

  const stockStatus = getStockStatus();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Details - {product.name}
            </div>
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

        <div className="space-y-6 p-4">
          {/* Product Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <p className="text-muted-foreground">{product.category}</p>
            </div>
            <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>
              {product.status}
            </Badge>
          </div>

          <Separator />

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Selling Price</div>
                    <div className="text-2xl font-bold">NPR {product.price.toLocaleString()}</div>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Stock</div>
                    <div className="text-2xl font-bold">{product.stock}</div>
                    <div className="text-xs text-muted-foreground">{product.unitOfMeasure}</div>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Profit Margin</div>
                    <div className="text-2xl font-bold">NPR {(product.price - product.costPrice).toLocaleString()}</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Stock Status</div>
                    <Badge variant={stockStatus.color as any} className="mt-1">
                      {stockStatus.status}
                    </Badge>
                  </div>
                  <AlertCircle className={`w-8 h-8 ${stockStatus.color === 'destructive' ? 'text-red-600' : stockStatus.color === 'warning' ? 'text-yellow-600' : 'text-green-600'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Information */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  BASIC INFORMATION
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">SKU:</span>
                  <span>{product.sku || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Category:</span>
                  <span>{product.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Brand:</span>
                  <span>{product.brand || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Barcode:</span>
                  <span>{product.barcode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">HSN Code:</span>
                  <span>{product.hsnCode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Unit of Measure:</span>
                  <span>{product.unitOfMeasure}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  PRICING & INVENTORY
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Selling Price:</span>
                  <span className="font-semibold">NPR {product.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Cost Price:</span>
                  <span>NPR {product.costPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Profit per Unit:</span>
                  <span className="text-green-600 font-semibold">NPR {(product.price - product.costPrice).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">VAT Rate:</span>
                  <span>{product.vatRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Current Stock:</span>
                  <span className={product.stock <= product.minStockLevel ? 'text-orange-600 font-semibold' : ''}>
                    {product.stock} {product.unitOfMeasure}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Reorder Point:</span>
                  <span>{product.reorderPoint} {product.unitOfMeasure}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">DESCRIPTION</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-2 gap-6">
            {product.supplier && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">SUPPLIER INFORMATION</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{product.supplier}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">RECORD INFORMATION</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Created:</span>
                  <span>{product.createdDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Created By:</span>
                  <span>{product.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Updated:</span>
                  <span>{product.updatedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Updated By:</span>
                  <span>{product.updatedBy}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Alert */}
          {product.stock <= product.minStockLevel && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-800">Low Stock Alert</p>
                    <p className="text-sm text-orange-700">
                      Current stock ({product.stock} {product.unitOfMeasure}) is at or below the minimum level ({product.minStockLevel} {product.unitOfMeasure}). 
                      Consider reordering when stock reaches {product.reorderPoint} {product.unitOfMeasure}.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductViewer;
