import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ImportCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string; data: any }>;
  total: number;
}

export default function ImportCustomerModal({ isOpen, onClose }: ImportCustomerModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (csvData: string) => {
      return apiRequest('POST', '/api/customers/import', { csvData });
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      
      if (result.success > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${result.success} customers${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import customers",
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      const text = await file.text();
      importMutation.mutate(text);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'firstName',
      'lastName', 
      'email',
      'phone',
      'address',
      'nationalId',
      'creditScore',
      'status'
    ];
    
    const sampleData = [
      'John,Doe,john.doe@email.com,+233-24-111-2222,Accra Ghana,GHA-111222333,750,active',
      'Jane,Smith,jane.smith@email.com,+233-24-333-4444,Kumasi Ghana,GHA-444555666,680,active'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetModal = () => {
    setFile(null);
    setImportResult(null);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Customers</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple customers at once. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium">Need a template?</h4>
              <p className="text-sm text-muted-foreground">
                Download the CSV template with sample data and required columns.
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload Area */}
          {!importResult && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {file ? file.name : 'Drop your CSV file here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'or click to browse'}
                </p>
                {!file && (
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Select CSV File
                  </Button>
                )}
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* File Selected */}
          {file && !importResult && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Progress */}
          {importMutation.isPending && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Importing customers...</span>
              </div>
              <Progress value={45} className="w-full" />
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h4 className="font-medium">Import Complete</h4>
                  <p className="text-sm text-muted-foreground">
                    {importResult.success} of {importResult.total} customers imported successfully
                  </p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">
                        {importResult.errors.length} customers failed to import:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <div key={index} className="text-xs">
                            <span className="font-medium">Row {error.row}:</span> {error.error}
                          </div>
                        ))}
                        {importResult.errors.length > 5 && (
                          <div className="text-xs text-muted-foreground">
                            ... and {importResult.errors.length - 5} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              {importResult ? 'Close' : 'Cancel'}
            </Button>
            {file && !importResult && (
              <Button 
                onClick={handleImport}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? 'Importing...' : 'Import Customers'}
              </Button>
            )}
            {importResult && (
              <Button onClick={resetModal}>
                Import More
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}