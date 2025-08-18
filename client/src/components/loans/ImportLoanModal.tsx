import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface ImportLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string; data: any }>;
  total: number;
}

export default function ImportLoanModal({ isOpen, onClose }: ImportLoanModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (csvData: string) => {
      return apiClient.post('/loans/import', { csvData });
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      
      if (result.success > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${result.success} loans${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import loans",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const processImport = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = e.target?.result as string;
      importMutation.mutate(csvData);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = `Customer ID,Loan Product ID,Loan Amount,Interest Rate,Term (months),Purpose,Date Applied
16,6,50000,12.5,24,Business expansion,2024-01-15
16,6,25000,10.0,12,Equipment purchase,2024-01-20`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'loan-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "Use this template to format your loan data for import",
    });
  };

  const resetImport = () => {
    setFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Loans</DialogTitle>
          <DialogDescription>
            Import loan data from a CSV file. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Need a template?</h4>
              <p className="text-sm text-muted-foreground">Download our CSV template to get started</p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <FileText className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : file 
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                : 'border-muted-foreground/25'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {file ? (
              <div className="space-y-2">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <h3 className="font-medium">File Ready</h3>
                <p className="text-sm text-muted-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="font-medium">Drop your CSV file here</h3>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
            )}
            
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            
            {!file && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
            )}
          </div>

          {/* Import Progress */}
          {importMutation.isPending && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing import...</span>
                  </div>
                  <Progress value={undefined} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Import Results</h4>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-green-600">
                        ✓ {importResult.success} successful
                      </span>
                      {importResult.errors.length > 0 && (
                        <span className="text-red-600">
                          ✗ {importResult.errors.length} errors
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Progress 
                    value={(importResult.success / importResult.total) * 100} 
                    className="w-full" 
                  />
                  
                  {importResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-red-600">Errors:</h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <Alert key={index} variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              Row {error.row}: {error.error}
                            </AlertDescription>
                          </Alert>
                        ))}
                        {importResult.errors.length > 5 && (
                          <p className="text-xs text-muted-foreground">
                            ... and {importResult.errors.length - 5} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetImport}>
              Reset
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={processImport} 
                disabled={!file || importMutation.isPending}
              >
                {importMutation.isPending ? 'Importing...' : 'Import Loans'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}