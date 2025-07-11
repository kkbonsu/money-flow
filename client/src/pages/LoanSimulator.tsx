import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

interface LoanSimulation {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  schedule: PaymentScheduleItem[];
}

interface PaymentScheduleItem {
  paymentNumber: number;
  paymentDate: string;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
}

export default function LoanSimulator() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    loanAmount: '',
    interestRate: '',
    loanTerm: '',
    loanTermType: 'months'
  });
  const [simulation, setSimulation] = useState<LoanSimulation | null>(null);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const calculateLoan = () => {
    const principal = parseFloat(formData.loanAmount);
    const annualRate = parseFloat(formData.interestRate) / 100;
    const termInMonths = formData.loanTermType === 'years' 
      ? parseInt(formData.loanTerm) * 12 
      : parseInt(formData.loanTerm);

    if (!principal || !annualRate || !termInMonths) {
      return;
    }

    const monthlyRate = annualRate / 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termInMonths)) / 
                          (Math.pow(1 + monthlyRate, termInMonths) - 1);
    
    const totalPayments = monthlyPayment * termInMonths;
    const totalInterest = totalPayments - principal;

    // Generate payment schedule
    const schedule: PaymentScheduleItem[] = [];
    let remainingBalance = principal;
    const startDate = new Date();

    for (let i = 1; i <= termInMonths; i++) {
      const interestAmount = remainingBalance * monthlyRate;
      const principalAmount = monthlyPayment - interestAmount;
      remainingBalance -= principalAmount;

      const paymentDate = new Date(startDate);
      paymentDate.setMonth(startDate.getMonth() + i);

      schedule.push({
        paymentNumber: i,
        paymentDate: paymentDate.toISOString().split('T')[0],
        paymentAmount: monthlyPayment,
        principalAmount: principalAmount,
        interestAmount: interestAmount,
        remainingBalance: Math.max(0, remainingBalance)
      });
    }

    setSimulation({
      loanAmount: principal,
      interestRate: annualRate * 100,
      loanTerm: termInMonths,
      monthlyPayment,
      totalPayments,
      totalInterest,
      schedule
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      loanAmount: '',
      interestRate: '',
      loanTerm: '',
      loanTermType: 'months'
    });
    setSimulation(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loan Simulator</h1>
          <p className="text-muted-foreground">Calculate loan payments and view amortization schedules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Calculator Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Loan Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="loanAmount">Loan Amount ($)</Label>
              <Input
                id="loanAmount"
                type="number"
                placeholder="Enter loan amount"
                value={formData.loanAmount}
                onChange={(e) => handleInputChange('loanAmount', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                placeholder="Enter interest rate"
                value={formData.interestRate}
                onChange={(e) => handleInputChange('interestRate', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loanTerm">Loan Term</Label>
                <Input
                  id="loanTerm"
                  type="number"
                  placeholder="Enter term"
                  value={formData.loanTerm}
                  onChange={(e) => handleInputChange('loanTerm', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="loanTermType">Term Type</Label>
                <Select value={formData.loanTermType} onValueChange={(value) => handleInputChange('loanTermType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={calculateLoan} className="flex-1">
                Calculate Loan
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loan Summary */}
        {simulation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Loan Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Loan Amount:</span>
                    <span className="text-sm">${simulation.loanAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Interest Rate:</span>
                    <span className="text-sm">{simulation.interestRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Loan Term:</span>
                    <span className="text-sm">{simulation.loanTerm} months</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Monthly Payment:</span>
                    <span className="text-sm font-bold text-primary">${simulation.monthlyPayment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Payments:</span>
                    <span className="text-sm">${simulation.totalPayments.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Interest:</span>
                    <span className="text-sm text-destructive">${simulation.totalInterest.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Schedule */}
      {simulation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Payment Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment Amount</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Remaining Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulation.schedule.slice(0, 12).map((payment) => (
                    <TableRow key={payment.paymentNumber}>
                      <TableCell>{payment.paymentNumber}</TableCell>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell>${payment.paymentAmount.toFixed(2)}</TableCell>
                      <TableCell>${payment.principalAmount.toFixed(2)}</TableCell>
                      <TableCell>${payment.interestAmount.toFixed(2)}</TableCell>
                      <TableCell>${payment.remainingBalance.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {simulation.schedule.length > 12 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Showing first 12 payments of {simulation.schedule.length} total payments
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}