// Test script to verify automatic income generation from loan processing
const fetch = require('node-fetch'); // You might need to install this: npm install node-fetch

const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'your-auth-token'; // Replace with actual token

async function testIncomeGeneration() {
  console.log('🧪 Testing Automatic Income Generation...\n');

  try {
    // 1. First, get existing income count
    const initialIncomeResponse = await fetch(`${BASE_URL}/api/income`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    const initialIncome = await initialIncomeResponse.json();
    console.log(`📊 Initial income records: ${initialIncome.length}`);

    // 2. Create a loan product with a fee
    const loanProductData = {
      name: 'Test Loan Product',
      description: 'Test product for income generation',
      interestRate: '10.5',
      fee: '100.00',
      term: 12,
      maxAmount: '10000'
    };

    const loanProductResponse = await fetch(`${BASE_URL}/api/loan-products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(loanProductData)
    });
    const loanProduct = await loanProductResponse.json();
    console.log(`✅ Created loan product: ${loanProduct.name} (ID: ${loanProduct.id})`);

    // 3. Create a customer
    const customerData = {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test@example.com',
      phone: '1234567890',
      address: 'Test Address'
    };

    const customerResponse = await fetch(`${BASE_URL}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(customerData)
    });
    const customer = await customerResponse.json();
    console.log(`✅ Created customer: ${customer.firstName} ${customer.lastName} (ID: ${customer.id})`);

    // 4. Create a loan
    const loanData = {
      customerId: customer.id,
      loanProductId: loanProduct.id,
      loanAmount: '5000.00',
      interestRate: '10.5',
      term: 12,
      purpose: 'Test loan for income generation',
      status: 'pending'
    };

    const loanResponse = await fetch(`${BASE_URL}/api/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(loanData)
    });
    const loan = await loanResponse.json();
    console.log(`✅ Created loan: $${loan.loanAmount} (ID: ${loan.id})`);

    // 5. Approve the loan (should trigger processing fee income)
    const approveResponse = await fetch(`${BASE_URL}/api/loans/${loan.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({ ...loan, status: 'approved' })
    });
    console.log(`✅ Approved loan (should create processing fee income)`);

    // 6. Get payment schedules for the loan
    const schedulesResponse = await fetch(`${BASE_URL}/api/payment-schedules/loan/${loan.id}`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    const schedules = await schedulesResponse.json();
    console.log(`✅ Found ${schedules.length} payment schedules`);

    if (schedules.length > 0) {
      // 7. Mark first payment as paid (should trigger interest income)
      const firstSchedule = schedules[0];
      const markPaidResponse = await fetch(`${BASE_URL}/api/payment-schedules/${firstSchedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({ 
          ...firstSchedule, 
          status: 'paid',
          paidDate: new Date().toISOString().split('T')[0]
        })
      });
      console.log(`✅ Marked payment as paid (should create interest income)`);
    }

    // 8. Check final income count
    const finalIncomeResponse = await fetch(`${BASE_URL}/api/income`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    const finalIncome = await finalIncomeResponse.json();
    console.log(`📊 Final income records: ${finalIncome.length}`);

    // 9. Show new income records
    const newIncomeRecords = finalIncome.slice(initialIncome.length);
    console.log('\n🎯 New Income Records Generated:');
    newIncomeRecords.forEach(record => {
      console.log(`  - ${record.source}: $${record.amount} (${record.category})`);
      console.log(`    Description: ${record.description}`);
    });

    console.log(`\n✅ Test completed! Generated ${newIncomeRecords.length} income records automatically.`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Uncomment to run the test
// testIncomeGeneration();

console.log('Test script created. To run:');
console.log('1. Replace AUTH_TOKEN with a valid token');
console.log('2. Uncomment the testIncomeGeneration() call');
console.log('3. Run: node testIncomeGeneration.js');