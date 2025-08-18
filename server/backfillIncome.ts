import { db } from './db';
import { paymentSchedules, incomeManagement } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

async function backfillIncomeRecords() {
  console.log('🔍 Starting backfill for existing paid payments...');
  
  try {
    // Get all paid payment schedules that don't have corresponding income records
    const paidPayments = await db
      .select()
      .from(paymentSchedules)
      .where(eq(paymentSchedules.status, 'paid'));
    
    console.log(`📊 Found ${paidPayments.length} paid payments to check`);
    
    let created = 0;
    
    for (const payment of paidPayments) {
      // Check if income record already exists for this payment
      const existingIncome = await db
        .select()
        .from(incomeManagement)
        .where(eq(incomeManagement.description, `Interest payment from loan payment schedule #${payment.id}`));
      
      if (existingIncome.length === 0 && payment.interestAmount) {
        const interestAmount = parseFloat(payment.interestAmount);
        
        if (interestAmount > 0) {
          const paidDate = payment.paidDate ? new Date(payment.paidDate) : new Date(payment.updatedAt || new Date());
          
          console.log(`💰 Creating income record for payment ${payment.id}: $${interestAmount}`);
          
          await db.insert(incomeManagement).values({
            tenantId: payment.tenantId,
            source: 'Interest Payment',
            amount: payment.interestAmount,
            description: `Interest payment from loan payment schedule #${payment.id}`,
            date: paidDate.toISOString().split('T')[0],
            category: 'Loan Interest'
          });
          
          created++;
        }
      }
    }
    
    console.log(`✅ Backfill completed! Created ${created} new income records`);
    return { success: true, created };
    
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw error;
  }
}

export { backfillIncomeRecords };

// Run backfill immediately
backfillIncomeRecords()
  .then((result) => {
    console.log('Backfill result:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backfill error:', error);
    process.exit(1);
  });