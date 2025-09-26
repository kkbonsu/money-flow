import { PaymentSchedule, LoanBook, Customer } from '@shared/schema';
import { format } from 'date-fns';
import { Printer, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

interface PaymentReceiptProps {
  payment: PaymentSchedule;
  loan: LoanBook;
  customer: Customer;
}

export default function PaymentReceipt({ payment, loan, customer }: PaymentReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - #${payment.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 12px; 
              line-height: 1.4; 
              color: #000;
              background: white;
              width: 100%;
              max-width: 400px;
              margin: 0 auto;
              padding: 20px;
            }
            .receipt-header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
            }
            .company-name { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 5px; 
            }
            .company-tagline { 
              font-size: 10px; 
              color: #666; 
            }
            .receipt-title { 
              font-size: 16px; 
              font-weight: bold; 
              margin: 15px 0 10px 0; 
              text-align: center;
            }
            .receipt-number { 
              font-size: 12px; 
              text-align: center; 
              margin-bottom: 20px; 
            }
            .section { 
              margin-bottom: 15px; 
            }
            .section-title { 
              font-weight: bold; 
              margin-bottom: 8px; 
              border-bottom: 1px solid #ccc;
              padding-bottom: 2px;
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 5px; 
            }
            .info-row.total { 
              font-weight: bold; 
              font-size: 14px; 
              border-top: 1px solid #000;
              padding-top: 8px;
              margin-top: 10px;
            }
            .amount { 
              font-weight: bold; 
            }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              padding-top: 15px; 
              border-top: 1px dashed #000; 
              font-size: 10px; 
              color: #666;
            }
            .status-paid { 
              background: #e8f5e8; 
              color: #2d5a2d; 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-weight: bold; 
              text-align: center; 
              margin: 10px 0;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Payment Receipt
        </h3>
        <Button 
          onClick={handlePrint}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
          data-testid="button-print-receipt"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </Button>
      </div>

      <div ref={printRef} className="bg-white border rounded-lg p-6" style={{ fontFamily: 'monospace' }}>
        {/* Header */}
        <div className="receipt-header">
          <div className="company-name">MONEY FLOW</div>
          <div className="company-tagline">Financial Management System</div>
          <div className="receipt-title">PAYMENT RECEIPT</div>
          <div className="receipt-number">Receipt #: {payment.id.toString().padStart(6, '0')}</div>
        </div>

        {/* Customer Information */}
        <div className="section">
          <div className="section-title">CUSTOMER DETAILS</div>
          <div className="info-row">
            <span>Name:</span>
            <span>{customer.firstName} {customer.lastName}</span>
          </div>
          <div className="info-row">
            <span>Customer ID:</span>
            <span>#{customer.id}</span>
          </div>
          {customer.phone && (
            <div className="info-row">
              <span>Phone:</span>
              <span>{customer.phone}</span>
            </div>
          )}
        </div>

        {/* Loan Information */}
        <div className="section">
          <div className="section-title">LOAN DETAILS</div>
          <div className="info-row">
            <span>Loan ID:</span>
            <span>#{loan.id}</span>
          </div>
          <div className="info-row">
            <span>Loan Amount:</span>
            <span>{formatCurrency(loan.loanAmount)}</span>
          </div>
          <div className="info-row">
            <span>Interest Rate:</span>
            <span>{loan.interestRate}%</span>
          </div>
        </div>

        {/* Payment Information */}
        <div className="section">
          <div className="section-title">PAYMENT DETAILS</div>
          <div className="info-row">
            <span>Payment ID:</span>
            <span>#{payment.id}</span>
          </div>
          <div className="info-row">
            <span>Due Date:</span>
            <span>{format(new Date(payment.dueDate), 'MMM dd, yyyy')}</span>
          </div>
          <div className="info-row">
            <span>Paid Date:</span>
            <span>{payment.paidDate ? format(new Date(payment.paidDate), 'MMM dd, yyyy') : 'N/A'}</span>
          </div>
          <div className="info-row">
            <span>Principal:</span>
            <span className="amount">{formatCurrency(payment.principalAmount)}</span>
          </div>
          <div className="info-row">
            <span>Interest:</span>
            <span className="amount">{formatCurrency(payment.interestAmount)}</span>
          </div>
          <div className="info-row total">
            <span>TOTAL PAID:</span>
            <span className="amount">{formatCurrency(payment.paidAmount || payment.amount)}</span>
          </div>
        </div>

        {/* Status */}
        {payment.status === 'paid' && (
          <div className="status-paid">✓ PAYMENT CONFIRMED</div>
        )}

        {/* Footer */}
        <div className="footer">
          <div>Thank you for your payment!</div>
          <div>Receipt generated on {format(new Date(), 'MMM dd, yyyy HH:mm')}</div>
          <div style={{ marginTop: '10px' }}>
            For questions about this payment, please contact<br/>
            Money Flow Financial Services
          </div>
        </div>
      </div>
    </div>
  );
}