import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, DollarSign, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isCalculating, setIsCalculating] = useState(false);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const calculateLoan = async () => {
    setIsCalculating(true);
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const principal = parseFloat(formData.loanAmount);
    const annualRate = parseFloat(formData.interestRate) / 100;
    const termInMonths = formData.loanTermType === 'years' 
      ? parseInt(formData.loanTerm) * 12 
      : parseInt(formData.loanTerm);

    if (!principal || !annualRate || !termInMonths) {
      setIsCalculating(false);
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
    
    setIsCalculating(false);
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-7 h-7 text-primary" />
            Loan Simulator
          </h1>
          <p className="text-muted-foreground">Calculate loan payments and view amortization schedules</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Calculator Form */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Loan Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
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
              <Button 
                onClick={calculateLoan} 
                disabled={isCalculating}
                className="flex-1 relative overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  {isCalculating ? (
                    <motion.div
                      key="calculating"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                      Calculating...
                    </motion.div>
                  ) : (
                    <motion.span
                      key="calculate"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      Calculate Loan
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Loan Summary */}
        <AnimatePresence>
          {simulation && (
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.9 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="overflow-hidden border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-green-500/5 to-blue-500/5">
                  <CardTitle className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </motion.div>
                    Loan Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="flex justify-between"
                      >
                        <span className="text-sm font-medium">Loan Amount:</span>
                        <span className="text-sm font-bold">${simulation.loanAmount.toLocaleString()}</span>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                        className="flex justify-between"
                      >
                        <span className="text-sm font-medium">Interest Rate:</span>
                        <span className="text-sm">{simulation.interestRate}%</span>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.7 }}
                        className="flex justify-between"
                      >
                        <span className="text-sm font-medium">Loan Term:</span>
                        <span className="text-sm">{simulation.loanTerm} months</span>
                      </motion.div>
                    </div>
                    <div className="space-y-3">
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.8 }}
                        className="flex justify-between"
                      >
                        <span className="text-sm font-medium">Monthly Payment:</span>
                        <motion.span 
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.9 }}
                          className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded"
                        >
                          ${simulation.monthlyPayment.toFixed(2)}
                        </motion.span>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 1.0 }}
                        className="flex justify-between"
                      >
                        <span className="text-sm font-medium">Total Payments:</span>
                        <span className="text-sm font-semibold">${simulation.totalPayments.toFixed(2)}</span>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 1.1 }}
                        className="flex justify-between"
                      >
                        <span className="text-sm font-medium">Total Interest:</span>
                        <span className="text-sm text-destructive font-semibold">${simulation.totalInterest.toFixed(2)}</span>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payment Schedule */}
      <AnimatePresence>
        {simulation && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Payment Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Payment #</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Payment Amount</TableHead>
                        <TableHead className="font-semibold">Principal</TableHead>
                        <TableHead className="font-semibold">Interest</TableHead>
                        <TableHead className="font-semibold">Remaining Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {simulation.schedule.slice(0, 12).map((payment, index) => (
                        <TableRow 
                          key={payment.paymentNumber}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                          <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                          <TableCell className="font-semibold">${payment.paymentAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-green-600">${payment.principalAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-orange-600">${payment.interestAmount.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">${payment.remainingBalance.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {simulation.schedule.length > 12 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                    className="p-4 bg-gradient-to-r from-muted/20 to-muted/10 text-center text-sm text-muted-foreground border-t"
                  >
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    Showing first 12 payments of {simulation.schedule.length} total payments
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}