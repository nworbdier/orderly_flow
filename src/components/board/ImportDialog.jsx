"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseMondayExport } from "@/lib/excel-import";

export function ImportDialog({ onImport }) {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (
      !validTypes.includes(file.type) &&
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls")
    ) {
      setError("Please select a valid Excel file (.xlsx or .xls)");
      toast.error("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const data = await parseMondayExport(file);

      if (data.groups.length === 0) {
        setError("No data found in the file. Please check the file format.");
        toast.error("No data found. Please check the file format.");
        setIsProcessing(false);
        return;
      }

      // Call the onImport callback with the parsed data
      onImport(data);
      toast.success("Board data imported from Excel");

      // Close dialog and reset state
      setOpen(false);
      setIsProcessing(false);
      setError(null);
    } catch (err) {
      console.error("Error parsing Excel file:", err);
      setError(
        "Failed to parse the Excel file. Please ensure it's a valid Monday.com export.",
      );
      toast.error(
        "Failed to parse the Excel file. Please ensure it's a valid Monday.com export.",
      );
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from Excel</DialogTitle>
          <DialogDescription>
            Upload a Monday.com board export to import groups, items, and columns.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
              ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
            onClick={handleBrowseClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {isProcessing ? 'Processing...' : 'Drop your Excel file here'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or click to browse
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Supports .xlsx and .xls files
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                {error}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-medium">Import tips:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Export your board from Monday.com as Excel</li>
              <li>Groups and items will be preserved</li>
              <li>Column types will be auto-detected</li>
              <li>This will add to your current board</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

