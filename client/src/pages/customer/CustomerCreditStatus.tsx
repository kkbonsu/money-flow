import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  CheckCircle,
  AlertTriangle,
  Star,
  Award
} from 'lucide-react';
import { format } from 'date-fns';
import type { Customer, LoanBook, PaymentSchedule } from '@shared/schema';

export default function CustomerCreditStatus() {
  const { data: customer } = useQuery<Customer>({
    queryKey: ['/api/customer/profile'],
  });

  const { data: loans } = useQuery<LoanBook[]>({
    queryKey: ['/api/customer/loans'],
  });

  const { data: payments } = useQuery<PaymentSchedule[]>({
    queryKey: ['/api/customer/payments'],
  });

  // Calculate credit score components
  const calculateCreditScore = () => {
    if (!loans || !payments) return { score: 0, factors: [] };

    let score = 300; // Base score
    const factors = [];

    // Loan history factor (25%)
    const totalLoans = loans.length;
    if (totalLoans > 0) {
      score += Math.min(totalLoans * 25, 100);
      factors.push({
        name: 'Loan History',
        impact: Math.min(totalLoans * 25, 100),
        description: `${totalLoans} loan(s) taken`,
        type: 'positive'
      });
    }

    // Payment history factor (35%)
    const totalPayments = payments.length;
    const paidPayments = payments.filter(p => p.status === 'paid').length;
    const paymentRatio = totalPayments > 0 ? paidPayments / totalPayments : 0;
    const paymentScore = Math.round(paymentRatio * 150);
    score += paymentScore;
    factors.push({
      name: 'Payment History',
      impact: paymentScore,
      description: `${paidPayments}/${totalPayments} payments on time`,
      type: paymentRatio > 0.8 ? 'positive' : paymentRatio > 0.5 ? 'neutral' : 'negative'
    });

    // Outstanding debt factor (20%)
    const totalLoanAmount = loans.reduce((sum, loan) => sum + parseFloat(loan.loanAmount), 0);
    const outstandingAmount = loans.reduce((sum, loan) => sum + parseFloat(loan.outstandingBalance || '0'), 0);
    const debtRatio = totalLoanAmount > 0 ? outstandingAmount / totalLoanAmount : 0;
    const debtScore = Math.round((1 - debtRatio) * 80);
    score += debtScore;
    factors.push({
      name: 'Debt Utilization',
      impact: debtScore,
      description: `${Math.round(debtRatio * 100)}% of credit used`,
      type: debtRatio < 0.3 ? 'positive' : debtRatio < 0.7 ? 'neutral' : 'negative'
    });

    // Late payments penalty (10%)
    const latePayments = payments.filter(p => p.status === 'overdue').length;
    const latePenalty = latePayments * 15;
    score -= latePenalty;
    if (latePayments > 0) {
      factors.push({
        name: 'Late Payments',
        impact: -latePenalty,
        description: `${latePayments} late payment(s)`,
        type: 'negative'
      });
    }

    // Account age factor (10%)
    if (customer?.createdAt) {
      const accountAge = Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
      const ageScore = Math.min(accountAge * 5, 50);
      score += ageScore;
      factors.push({
        name: 'Account Age',
        impact: ageScore,
        description: `${accountAge} month(s) with us`,
        type: 'positive'
      });
    }

    return { 
      score: Math.min(Math.max(score, 300), 850), 
      factors: factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    };
  };

  const getCreditGrade = (score: number) => {
    if (score >= 750) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 700) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 650) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 600) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 550) return { grade: 'C+', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 500) return { grade: 'C', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const creditData = calculateCreditScore();
  const creditGrade = getCreditGrade(creditData.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Credit Status
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor your creditworthiness and financial health
          </p>
        </div>

        {/* Credit Score Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Credit Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                    {creditData.score}
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${creditGrade.bg} ${creditGrade.color}`}>
                    <Award className="w-4 h-4 mr-1" />
                    Grade {creditGrade.grade}
                  </div>
                </div>
                <div className="w-32 h-32 relative">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(creditData.score / 850) * 251.2} 251.2`}
                      className="text-blue-600"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {Math.round((creditData.score / 850) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Poor (300-549)</span>
                  <span>Fair (550-649)</span>
                  <span>Good (650-749)</span>
                  <span>Excellent (750+)</span>
                </div>
                <Progress value={(creditData.score - 300) / 550 * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Loans</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loans?.length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">On-time Payments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {payments ? Math.round((payments.filter(p => p.status === 'paid').length / (payments.length || 1)) * 100) : 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Credit Factors */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Credit Score Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {creditData.factors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      factor.type === 'positive' ? 'bg-green-100 text-green-600' :
                      factor.type === 'negative' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {factor.type === 'positive' ? <TrendingUp className="w-5 h-5" /> :
                       factor.type === 'negative' ? <TrendingDown className="w-5 h-5" /> :
                       <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{factor.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{factor.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={factor.impact > 0 ? "default" : "destructive"}>
                      {factor.impact > 0 ? '+' : ''}{factor.impact} pts
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Credit Tips */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Tips to Improve Your Credit Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Make Payments On Time</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Payment history is the most important factor. Set up auto-payments to never miss a due date.
                </p>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Keep Balances Low</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Try to keep your outstanding debt below 30% of your total credit limit.
                </p>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Build Credit History</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The longer your account history, the better. Keep older accounts open and active.
                </p>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Diversify Credit Types</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Having different types of credit accounts can positively impact your score.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}