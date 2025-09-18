import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Clock, 
  Send, 
  User, 
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  ExternalLink
} from 'lucide-react';

export default function CustomerSupport() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/customer/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('customer_auth_token')}`,
        },
        body: JSON.stringify({
          title: formData.subject,
          description: formData.message,
          category: formData.category,
          priority: formData.priority,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit ticket');
      }
      
      toast({
        title: "Support ticket submitted",
        description: "We've received your message and will respond within 24 hours.",
      });
      
      setFormData({
        subject: '',
        category: '',
        priority: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Failed to submit support ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      icon: Phone,
      contact: '+1 (555) 123-4567',
      hours: 'Mon-Fri, 9AM-6PM EST',
      color: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Email Support',
      description: 'Send us a detailed message',
      icon: Mail,
      contact: 'support@moneyflow.com',
      hours: 'Response within 24 hours',
      color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
    },
    {
      title: 'Live Chat',
      description: 'Get instant help from our team',
      icon: MessageSquare,
      contact: 'Available in portal',
      hours: 'Mon-Fri, 9AM-6PM EST',
      color: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
    }
  ];

  const supportCategories = [
    { value: 'payment', label: 'Payment Issues' },
    { value: 'account', label: 'Account Management' },
    { value: 'loan', label: 'Loan Questions' },
    { value: 'documents', label: 'Document Upload' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'general', label: 'General Inquiry' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const supportTeam = [
    {
      name: 'Sarah Johnson',
      role: 'Senior Support Specialist',
      department: 'Customer Success',
      avatar: '/api/placeholder/40/40',
      rating: 4.9,
      specialties: ['Loan Applications', 'Payment Issues']
    },
    {
      name: 'Mike Chen',
      role: 'Technical Support Lead',
      department: 'Technical Support',
      avatar: '/api/placeholder/40/40',
      rating: 4.8,
      specialties: ['Technical Issues', 'Account Management']
    },
    {
      name: 'Emma Rodriguez',
      role: 'Customer Success Manager',
      department: 'Customer Success',
      avatar: '/api/placeholder/40/40',
      rating: 4.9,
      specialties: ['Document Verification', 'General Inquiries']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Customer Support
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Get help from our dedicated support team
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <Card key={method.title} className="glass-card slide-in-up hover:shadow-lg transition-shadow cursor-pointer" style={{ animationDelay: `${0.1 * index}s` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${method.color} rounded-full flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {method.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {method.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {method.icon === Phone && <Phone className="w-4 h-4 text-gray-500" />}
                      {method.icon === Mail && <Mail className="w-4 h-4 text-gray-500" />}
                      {method.icon === MessageSquare && <MessageSquare className="w-4 h-4 text-gray-500" />}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {method.contact}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {method.hours}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Support Form */}
          <Card className="glass-card slide-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Submit Support Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="">Select category</option>
                      {supportCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="">Select priority</option>
                      {priorityLevels.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Please provide detailed information about your issue..."
                    rows={6}
                    required
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Tips for better support:
                      </p>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                        <li>• Include your loan ID or payment reference if applicable</li>
                        <li>• Describe the steps you took before the issue occurred</li>
                        <li>• Mention any error messages you received</li>
                        <li>• Include screenshots if they help explain the issue</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full glass-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Support Team */}
          <div className="space-y-6">
            <Card className="glass-card slide-in-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Our Support Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTeam.map((member, index) => (
                    <div key={member.name} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{member.name}</h4>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{member.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{member.role}</p>
                        <div className="flex flex-wrap gap-1">
                          {member.specialties.map(specialty => (
                            <Badge key={specialty} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Support Hours */}
            <Card className="glass-card slide-in-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Support Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Monday - Friday</span>
                    <span className="font-medium text-gray-900 dark:text-white">9:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Saturday</span>
                    <span className="font-medium text-gray-900 dark:text-white">10:00 AM - 2:00 PM EST</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Sunday</span>
                    <span className="font-medium text-gray-900 dark:text-white">Closed</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">Currently available</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="glass-card slide-in-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                        For urgent payment or account issues:
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Emergency Hotline: <strong>+1 (555) 911-HELP</strong>
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Available 24/7 for critical issues
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}