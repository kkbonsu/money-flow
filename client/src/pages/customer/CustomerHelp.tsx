import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  HelpCircle, 
  Book, 
  CreditCard, 
  FileText, 
  Shield, 
  Phone, 
  ChevronRight,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  tags: string[];
}

export default function CustomerHelp() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Topics', icon: Book },
    { id: 'getting-started', name: 'Getting Started', icon: HelpCircle },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'loans', name: 'Loans', icon: FileText },
    { id: 'account', name: 'Account', icon: Shield },
    { id: 'support', name: 'Support', icon: Phone }
  ];

  const faqItems: FAQItem[] = [
    {
      id: 'faq-1',
      question: 'How do I make a loan payment?',
      answer: 'You can make payments through your customer portal by clicking "Make Payment" on your payment schedule. We accept bank transfers, credit cards, and cryptocurrency payments through our secure payment processors.',
      category: 'payments',
      helpful: 45
    },
    {
      id: 'faq-2',
      question: 'What documents do I need to upload?',
      answer: 'Required documents include: National ID or passport, recent bank statements (3 months), utility bill for address verification, and a clear selfie for identity verification. Optional documents include employment verification and additional income proof.',
      category: 'getting-started',
      helpful: 38
    },
    {
      id: 'faq-3',
      question: 'How is my loan interest calculated?',
      answer: 'Interest is calculated using the reducing balance method. Your monthly payment includes both principal and interest, with the interest portion decreasing over time as the principal balance reduces.',
      category: 'loans',
      helpful: 32
    },
    {
      id: 'faq-4',
      question: 'What happens if I miss a payment?',
      answer: 'If you miss a payment, a late fee may apply and your loan will be marked as overdue. We recommend contacting our support team immediately to discuss payment options and avoid further penalties.',
      category: 'payments',
      helpful: 28
    },
    {
      id: 'faq-5',
      question: 'How do I update my profile information?',
      answer: 'You can update your profile information by going to the Profile tab in your customer portal. Changes to sensitive information like phone number or address may require document verification.',
      category: 'account',
      helpful: 25
    },
    {
      id: 'faq-6',
      question: 'What payment methods are accepted?',
      answer: 'We accept bank transfers, credit/debit cards, and cryptocurrency payments. For crypto payments, we support Bitcoin, Ethereum, and other major cryptocurrencies through our Privy integration.',
      category: 'payments',
      helpful: 42
    }
  ];

  const helpArticles: HelpArticle[] = [
    {
      id: 'art-1',
      title: 'Getting Started with Your Customer Portal',
      description: 'Learn how to navigate your customer portal, view loan details, and manage your account settings.',
      category: 'getting-started',
      readTime: '5 min read',
      tags: ['tutorial', 'basics', 'navigation']
    },
    {
      id: 'art-2',
      title: 'Understanding Your Payment Schedule',
      description: 'Detailed explanation of how payment schedules work, including principal and interest breakdowns.',
      category: 'payments',
      readTime: '7 min read',
      tags: ['payments', 'schedule', 'interest']
    },
    {
      id: 'art-3',
      title: 'Document Upload Requirements',
      description: 'Complete guide to uploading required documents with tips for better approval rates.',
      category: 'getting-started',
      readTime: '4 min read',
      tags: ['documents', 'verification', 'requirements']
    },
    {
      id: 'art-4',
      title: 'Loan Application Process',
      description: 'Step-by-step guide through the loan application process from start to disbursement.',
      category: 'loans',
      readTime: '10 min read',
      tags: ['application', 'process', 'requirements']
    },
    {
      id: 'art-5',
      title: 'Payment Options and Methods',
      description: 'Overview of all available payment methods including traditional and cryptocurrency options.',
      category: 'payments',
      readTime: '6 min read',
      tags: ['payment-methods', 'crypto', 'bank-transfer']
    },
    {
      id: 'art-6',
      title: 'Account Security Best Practices',
      description: 'Essential security tips to protect your account and personal information.',
      category: 'account',
      readTime: '8 min read',
      tags: ['security', 'password', 'protection']
    }
  ];

  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Help Center
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Find answers to your questions and learn how to use the platform
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for help articles, FAQs, or topics..."
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card slide-in-up hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Make a Payment</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pay your loan installment</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card slide-in-up hover:shadow-lg transition-shadow cursor-pointer" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Upload Documents</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Submit required documents</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card slide-in-up hover:shadow-lg transition-shadow cursor-pointer" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Contact Support</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get help from our team</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FAQ Section */}
          <div>
            <Card className="glass-card slide-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                        {expandedFAQ === faq.id ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="p-4 pt-0">
                          <p className="text-gray-600 dark:text-gray-400 mb-3">{faq.answer}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Was this helpful?</span>
                              <Button variant="outline" size="sm">Yes</Button>
                              <Button variant="outline" size="sm">No</Button>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {faq.helpful} people found this helpful
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Help Articles */}
          <div>
            <Card className="glass-card slide-in-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="w-5 h-5" />
                  Help Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredArticles.map((article) => (
                    <div key={article.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{article.title}</h3>
                        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{article.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {article.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{article.readTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Support CTA */}
        <Card className="glass-card slide-in-up mt-8">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Still need help?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Can't find what you're looking for? Our support team is here to help you with any questions or issues.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="glass-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Contact Support
                </Button>
                <Button variant="outline">
                  Schedule a Call
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}