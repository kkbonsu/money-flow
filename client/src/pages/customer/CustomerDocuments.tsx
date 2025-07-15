import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  CreditCard, 
  Building, 
  Receipt, 
  User, 
  PenTool,
  Check,
  X,
  Eye,
  Download,
  AlertCircle
} from 'lucide-react';

interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: any;
  required: boolean;
  status: 'pending' | 'uploaded' | 'approved' | 'rejected';
  uploadedFile?: string;
  rejectionReason?: string;
}

export default function CustomerDocuments() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);

  const [documents, setDocuments] = useState<DocumentType[]>([
    {
      id: 'national-id',
      name: 'National ID',
      description: 'Valid national identification document',
      icon: User,
      required: true,
      status: 'pending'
    },
    {
      id: 'passport',
      name: 'Passport',
      description: 'International passport (if available)',
      icon: CreditCard,
      required: false,
      status: 'pending'
    },
    {
      id: 'bank-statement',
      name: 'Bank Statement',
      description: 'Last 3 months bank statement',
      icon: Building,
      required: true,
      status: 'pending'
    },
    {
      id: 'utility-bill',
      name: 'Utility Bill',
      description: 'Recent utility bill for address verification',
      icon: Receipt,
      required: true,
      status: 'pending'
    },
    {
      id: 'selfie',
      name: 'Selfie Photo',
      description: 'Clear selfie photo for identity verification',
      icon: User,
      required: true,
      status: 'pending'
    },
    {
      id: 'digital-signature',
      name: 'Digital Signature',
      description: 'Digital signature for loan agreements',
      icon: PenTool,
      required: true,
      status: 'pending'
    }
  ]);

  const handleFileUpload = async (documentId: string, file: File) => {
    setUploading(documentId);
    
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'uploaded', uploadedFile: file.name }
          : doc
      ));
      
      toast({
        title: "Document uploaded successfully",
        description: `${file.name} has been uploaded and is under review.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'uploaded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="w-4 h-4" />;
      case 'rejected':
        return <X className="w-4 h-4" />;
      case 'uploaded':
        return <Eye className="w-4 h-4" />;
      case 'pending':
        return <Upload className="w-4 h-4" />;
      default:
        return <Upload className="w-4 h-4" />;
    }
  };

  const completedDocuments = documents.filter(doc => doc.status === 'approved').length;
  const totalRequired = documents.filter(doc => doc.required).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Document Upload
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload required documents for loan verification and processing
          </p>
        </div>

        {/* Progress Summary */}
        <Card className="glass-card slide-in-up mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Document Verification Progress
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {completedDocuments} of {totalRequired} required documents completed
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round((completedDocuments / totalRequired) * 100)}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Complete</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedDocuments / totalRequired) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.map((document, index) => {
            const Icon = document.icon;
            return (
              <Card key={document.id} className="glass-card slide-in-up" style={{ animationDelay: `${0.1 * index}s` }}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {document.name}
                          {document.required && (
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                              Required
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {document.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(document.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(document.status)}
                        {document.status}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {document.status === 'pending' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`file-${document.id}`} className="text-sm font-medium">
                          Choose File
                        </Label>
                        <Input
                          id={`file-${document.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(document.id, file);
                            }
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <FileText className="w-4 h-4" />
                        Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB)
                      </div>
                    </div>
                  )}

                  {document.status === 'uploaded' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                        <Eye className="w-4 h-4" />
                        Under Review: {document.uploadedFile}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Your document is being reviewed by our team. This usually takes 24-48 hours.
                      </p>
                    </div>
                  )}

                  {document.status === 'approved' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <Check className="w-4 h-4" />
                        Approved: {document.uploadedFile}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}

                  {document.status === 'rejected' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <X className="w-4 h-4" />
                        Rejected: {document.uploadedFile}
                      </div>
                      {document.rejectionReason && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                Rejection Reason:
                              </p>
                              <p className="text-sm text-red-700 dark:text-red-300">
                                {document.rejectionReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div>
                        <Label htmlFor={`reupload-${document.id}`} className="text-sm font-medium">
                          Upload New File
                        </Label>
                        <Input
                          id={`reupload-${document.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(document.id, file);
                            }
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {uploading === document.id && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        Uploading...
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/2"></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Section */}
        <Card className="glass-card slide-in-up mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Photo Requirements:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Clear, high-resolution images</li>
                    <li>• All text must be readable</li>
                    <li>• No blurry or cropped images</li>
                    <li>• File size should not exceed 5MB</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Document Types:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Original documents preferred</li>
                    <li>• Certified copies accepted</li>
                    <li>• Documents must be current</li>
                    <li>• English translation required for foreign documents</li>
                  </ul>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Need Help?
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      If you need assistance with document upload or have questions about requirements, 
                      please contact our support team through the Support tab.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}