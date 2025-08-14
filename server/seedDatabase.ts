import { db } from "./db";
import { 
  users, customers, loanBooks, loanProducts, paymentSchedules, staff, incomeManagement, 
  expenses, bankManagement, pettyCash, inventory, rentManagement, assets, 
  liabilities, equity, mfiRegistration, shareholders
} from "@shared/schema";
import bcrypt from "bcryptjs";

const DEFAULT_TENANT_ID = "default-tenant-001";

export async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Clear existing data (be careful in production!)
    console.log("🧹 Clearing existing data...");
    await db.delete(paymentSchedules);
    await db.delete(loanBooks);
    await db.delete(loanProducts);
    await db.delete(customers);
    await db.delete(staff);
    await db.delete(incomeManagement);
    await db.delete(expenses);
    await db.delete(bankManagement);
    await db.delete(pettyCash);
    await db.delete(inventory);
    await db.delete(rentManagement);
    await db.delete(assets);
    await db.delete(liabilities);
    await db.delete(equity);
    await db.delete(shareholders);
    await db.delete(mfiRegistration);
    await db.delete(users);

    // 1. Create Admin User
    console.log("👤 Creating admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db.insert(users).values({
      tenantId: DEFAULT_TENANT_ID,
      firstName: "John",
      lastName: "Administrator", 
      username: "admin",
      email: "admin@moneyflow.com",
      password: hashedPassword,
      role: "admin",
      isActive: true
    }).returning();

    // 2. Create MFI Registration
    console.log("🏢 Creating MFI registration...");
    await db.insert(mfiRegistration).values({
      tenantId: DEFAULT_TENANT_ID,
      companyName: "Ghana Microfinance Solutions Ltd",
      registrationNumber: "GMS-2024-001",
      registeredAddress: "123 Independence Avenue, Accra, Ghana",
      physicalAddress: "456 Liberation Road, Accra, Ghana",
      paidUpCapital: "5000000.00",
      minimumCapitalRequired: "2000000.00",
      contactPhone: "+233-20-123-4567",
      contactEmail: "info@ghanams.com",
      boGLicenseNumber: "BOG-MFI-2024-015",
      licenseExpiryDate: new Date("2025-12-31"),
      isActive: true
    });

    // 3. Create Shareholders
    console.log("👥 Creating shareholders...");
    await db.insert(shareholders).values([
      {
        tenantId: DEFAULT_TENANT_ID,
        shareholderType: "local",
        name: "Kwame Asante",
        nationality: "Ghanaian",
        idType: "ghana_card",
        idNumber: "GHA-123456789-0",
        address: "East Legon, Accra",
        contactPhone: "+233-24-567-8901",
        contactEmail: "k.asante@email.com",
        sharesOwned: 6000,
        sharePercentage: "60.00",
        investmentAmount: "3000000.00",
        investmentCurrency: "GHS",
        isActive: true
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        shareholderType: "local",
        name: "Ama Osei",
        nationality: "Ghanaian", 
        idType: "ghana_card",
        idNumber: "GHA-987654321-0",
        address: "Cantonments, Accra",
        contactPhone: "+233-55-123-4567",
        contactEmail: "a.osei@email.com",
        sharesOwned: 4000,
        sharePercentage: "40.00",
        investmentAmount: "2000000.00",
        investmentCurrency: "GHS",
        isActive: true
      }
    ]);

    // 4. Create Staff Members
    console.log("👨‍💼 Creating staff members...");
    await db.insert(staff).values([
      {
        tenantId: DEFAULT_TENANT_ID,
        firstName: "Sarah",
        lastName: "Mensah",
        email: "s.mensah@ghanams.com",
        phone: "+233-20-111-2222",
        position: "Loan Officer",
        salary: "3500.00",
        hireDate: new Date("2024-01-15"),
        status: "active"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        firstName: "David",
        lastName: "Owusu",
        email: "d.owusu@ghanams.com",
        phone: "+233-20-333-4444",
        position: "Credit Analyst",
        salary: "4200.00",
        hireDate: new Date("2024-02-01"),
        status: "active"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        firstName: "Grace",
        lastName: "Adjei",
        email: "g.adjei@ghanams.com",
        phone: "+233-20-555-6666",
        position: "Operations Manager",
        salary: "5800.00",
        hireDate: new Date("2023-11-10"),
        status: "active"
      }
    ]);

    // 5. Create Loan Products
    console.log("💳 Creating loan products...");
    const loanProductsData = await db.insert(loanProducts).values([
      {
        tenantId: DEFAULT_TENANT_ID,
        name: "Small Business Loan",
        description: "Quick loans for small business expansion",
        minAmount: "1000.00",
        maxAmount: "50000.00",
        interestRate: "18.50",
        termMonths: 12,
        processingFee: "2.50",
        isActive: true
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        name: "Agricultural Loan",
        description: "Seasonal loans for farmers and agribusiness",
        minAmount: "2000.00",
        maxAmount: "100000.00",
        interestRate: "15.75",
        termMonths: 18,
        processingFee: "2.00",
        isActive: true
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        name: "Emergency Personal Loan",
        description: "Fast personal loans for urgent needs",
        minAmount: "500.00",
        maxAmount: "25000.00",
        interestRate: "22.00",
        termMonths: 6,
        processingFee: "3.00",
        isActive: true
      }
    ]).returning();

    // 6. Create Customers
    console.log("👥 Creating customers...");
    const customersData = await db.insert(customers).values([
      {
        tenantId: DEFAULT_TENANT_ID,
        firstName: "Emmanuel",
        lastName: "Boateng",
        email: "e.boateng@email.com",
        phone: "+233-24-777-8888",
        address: "Tema Community 1",
        occupation: "Retail Trader",
        monthlyIncome: "8500.00",
        creditScore: 750,
        status: "active",
        password: await bcrypt.hash("customer123", 10)
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        firstName: "Akosua",
        lastName: "Frimpong",
        email: "a.frimpong@email.com",
        phone: "+233-50-999-0000",
        address: "Kumasi Adum",
        occupation: "Restaurant Owner",
        monthlyIncome: "12000.00",
        creditScore: 680,
        status: "active",
        password: await bcrypt.hash("customer123", 10)
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        firstName: "Kofi",
        lastName: "Asiedu",
        email: "k.asiedu@email.com",
        phone: "+233-26-111-2222",
        address: "Tamale Central",
        occupation: "Farmer",
        monthlyIncome: "5500.00",
        creditScore: 620,
        status: "active",
        password: await bcrypt.hash("customer123", 10)
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        firstName: "Efua",
        lastName: "Gyasi",
        email: "e.gyasi@email.com",
        phone: "+233-55-333-4444",
        address: "Cape Coast",
        occupation: "Fish Trader",
        monthlyIncome: "7200.00",
        creditScore: 710,
        status: "active",
        password: await bcrypt.hash("customer123", 10)
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        firstName: "Yaw",
        lastName: "Opoku",
        email: "y.opoku@email.com",
        phone: "+233-20-555-6666",
        address: "Ho Township",
        occupation: "Transport Business",
        monthlyIncome: "15000.00",
        creditScore: 780,
        status: "active",
        password: await bcrypt.hash("customer123", 10)
      }
    ]).returning();

    // 7. Create Loans
    console.log("💰 Creating loans...");
    const loansData = await db.insert(loanBooks).values([
      {
        tenantId: DEFAULT_TENANT_ID,
        customerId: customersData[0].id,
        loanProductId: loanProductsData[0].id,
        loanAmount: "25000.00",
        interestRate: "18.50",
        term: 12,
        purpose: "Inventory expansion for retail business",
        status: "active",
        disbursementDate: new Date("2024-07-01"),
        maturityDate: new Date("2025-07-01")
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        customerId: customersData[1].id,
        loanProductId: loanProductsData[0].id,
        loanAmount: "45000.00",
        interestRate: "18.50",
        term: 12,
        purpose: "Restaurant equipment purchase",
        status: "active",
        disbursementDate: new Date("2024-06-15"),
        maturityDate: new Date("2025-06-15")
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        customerId: customersData[2].id,
        loanProductId: loanProductsData[1].id,
        loanAmount: "80000.00",
        interestRate: "15.75",
        term: 18,
        purpose: "Farm equipment and seeds for cocoa farming",
        status: "active",
        disbursementDate: new Date("2024-05-01"),
        maturityDate: new Date("2025-11-01")
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        customerId: customersData[3].id,
        loanProductId: loanProductsData[0].id,
        loanAmount: "18000.00",
        interestRate: "18.50",
        term: 12,
        purpose: "Cold storage facilities for fish business",
        status: "active",
        disbursementDate: new Date("2024-08-01"),
        maturityDate: new Date("2025-08-01")
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        customerId: customersData[4].id,
        loanProductId: loanProductsData[0].id,
        loanAmount: "35000.00",
        interestRate: "18.50",
        term: 12,
        purpose: "Vehicle purchase for transport business",
        status: "pending",
        disbursementDate: null,
        maturityDate: null
      }
    ]).returning();

    // 8. Create Payment Schedules for Active Loans
    console.log("📅 Creating payment schedules...");
    const activeLoans = loansData.filter(loan => loan.status === 'active');
    
    for (const loan of activeLoans) {
      const principal = parseFloat(loan.loanAmount);
      const monthlyRate = parseFloat(loan.interestRate) / 100 / 12;
      const numPayments = loan.term;
      
      // Calculate monthly payment using amortization formula
      const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                            (Math.pow(1 + monthlyRate, numPayments) - 1);
      
      let remainingBalance = principal;
      const disbursementDate = loan.disbursementDate!;
      
      for (let i = 1; i <= numPayments; i++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance -= principalPayment;
        
        const dueDate = new Date(disbursementDate);
        dueDate.setMonth(disbursementDate.getMonth() + i);
        dueDate.setDate(1);
        
        // Mark some payments as paid for realistic data
        const isPaid = i <= 3; // First 3 payments are paid
        
        await db.insert(paymentSchedules).values({
          tenantId: DEFAULT_TENANT_ID,
          loanId: loan.id,
          dueDate,
          amount: monthlyPayment.toFixed(2),
          principalAmount: principalPayment.toFixed(2),
          interestAmount: interestPayment.toFixed(2),
          status: isPaid ? 'paid' : 'pending',
          paidDate: isPaid ? new Date(dueDate.getTime() - 86400000) : null, // Paid 1 day before due
          paidAmount: isPaid ? monthlyPayment.toFixed(2) : null
        });
      }
    }

    // 9. Create Income Records
    console.log("💹 Creating income records...");
    await db.insert(incomeManagement).values([
      {
        tenantId: DEFAULT_TENANT_ID,
        source: "Interest Payment",
        amount: "5240.50",
        category: "Loan Interest",
        date: "2024-08-01",
        description: "Monthly interest payments from active loans"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        source: "Processing Fees",
        amount: "2150.00",
        category: "Fee Income",
        date: "2024-08-01",
        description: "Loan processing fees collected"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        source: "Investment Returns",
        amount: "8500.00",
        category: "Investment Income",
        date: "2024-07-30",
        description: "Returns from government bonds"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        source: "Service Charges",
        amount: "1320.00",
        category: "Service Income",
        date: "2024-08-05",
        description: "Account maintenance and transaction fees"
      }
    ]);

    // 10. Create Expense Records
    console.log("📉 Creating expense records...");
    await db.insert(expenses).values([
      {
        tenantId: DEFAULT_TENANT_ID,
        description: "Staff salaries for August 2024",
        amount: "13500.00",
        category: "Personnel",
        vendor: "Payroll Department",
        date: "2024-08-01"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        description: "Office rent for August 2024",
        amount: "3200.00",
        category: "Overhead",
        vendor: "Unity Properties Ltd",
        date: "2024-08-01"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        description: "Loan default provisions",
        amount: "4500.00",
        category: "Provisions",
        vendor: "Internal",
        date: "2024-08-10"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        description: "Marketing and advertising",
        amount: "2800.00",
        category: "Marketing",
        vendor: "Digital Marketing Agency",
        date: "2024-08-05"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        description: "Office supplies and utilities",
        amount: "1650.00",
        category: "Operations",
        vendor: "Various Suppliers",
        date: "2024-08-08"
      }
    ]);

    // 11. Create Bank Accounts
    console.log("🏦 Creating bank accounts...");
    await db.insert(bankManagement).values([
      {
        tenantId: DEFAULT_TENANT_ID,
        accountName: "Ghana MFS Operations Account",
        bankName: "Ghana Commercial Bank",
        accountNumber: "1234567890123",
        balance: "485750.00",
        status: "active"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        accountName: "Ghana MFS Loan Disbursement Account",
        bankName: "Ecobank Ghana",
        accountNumber: "9876543210987",
        balance: "125000.00",
        status: "active"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        accountName: "Ghana MFS Investment Account",
        bankName: "Standard Chartered Bank",
        accountNumber: "5555666677778",
        balance: "350000.00",
        status: "active"
      }
    ]);

    // 12. Create Petty Cash Records
    console.log("💰 Creating petty cash records...");
    await db.insert(pettyCash).values([
      {
        tenantId: DEFAULT_TENANT_ID,
        description: "Office cleaning supplies",
        amount: "150.00",
        type: "expense",
        date: "2024-08-12",
        purpose: "Office maintenance"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        description: "Client meeting refreshments",
        amount: "85.00",
        type: "expense",
        date: "2024-08-10",
        purpose: "Client relations"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        description: "Petty cash fund replenishment",
        amount: "500.00",
        type: "income",
        date: "2024-08-01",
        purpose: "Fund replenishment"
      }
    ]);

    // 13. Create Inventory
    console.log("📦 Creating inventory records...");
    await db.insert(inventory).values([
      {
        tenantId: DEFAULT_TENANT_ID,
        itemName: "Office Computers",
        quantity: 8,
        unitPrice: "2500.00",
        totalValue: "20000.00",
        category: "IT Equipment",
        status: "in_stock",
        description: "Dell OptiPlex desktops for staff use"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        itemName: "Office Furniture Set",
        quantity: 12,
        unitPrice: "650.00",
        totalValue: "7800.00",
        category: "Furniture",
        status: "in_stock",
        description: "Desk and chair sets for workstations"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        itemName: "Loan Documentation Forms",
        quantity: 500,
        unitPrice: "2.50",
        totalValue: "1250.00",
        category: "Stationery",
        status: "in_stock",
        description: "Pre-printed loan application forms"
      }
    ]);

    // 14. Create Assets
    console.log("🏢 Creating asset records...");
    await db.insert(assets).values([
      {
        tenantId: DEFAULT_TENANT_ID,
        assetName: "Head Office Building",
        category: "Real Estate",
        value: "850000.00",
        depreciationRate: "2.50",
        purchaseDate: new Date("2023-03-15"),
        status: "active"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        assetName: "Company Vehicles",
        category: "Transportation",
        value: "125000.00",
        depreciationRate: "15.00",
        purchaseDate: new Date("2024-01-20"),
        status: "active"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        assetName: "IT Infrastructure",
        category: "Technology",
        value: "45000.00",
        depreciationRate: "25.00",
        purchaseDate: new Date("2024-02-10"),
        status: "active"
      }
    ]);

    // 15. Create Liabilities
    console.log("📋 Creating liability records...");
    await db.insert(liabilities).values([
      {
        tenantId: DEFAULT_TENANT_ID,
        liabilityName: "Bank of Ghana Regulatory Capital",
        amount: "2000000.00",
        dueDate: new Date("2025-12-31"),
        status: "active",
        creditor: "Bank of Ghana",
        interestRate: "8.50"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        liabilityName: "Equipment Financing Loan",
        amount: "75000.00",
        dueDate: new Date("2025-06-30"),
        status: "active",
        creditor: "Development Bank Ghana",
        interestRate: "12.00"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        liabilityName: "Supplier Credit Line",
        amount: "25000.00",
        dueDate: new Date("2024-12-31"),
        status: "pending",
        creditor: "Office Supplies Ghana Ltd",
        interestRate: "6.00"
      }
    ]);

    // 16. Create Equity Records
    console.log("📊 Creating equity records...");
    await db.insert(equity).values([
      {
        tenantId: DEFAULT_TENANT_ID,
        equityType: "Share Capital",
        amount: "5000000.00",
        date: new Date("2024-01-01"),
        description: "Initial share capital from founders"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        equityType: "Retained Earnings",
        amount: "125000.00",
        date: new Date("2024-07-31"),
        description: "Accumulated retained earnings from operations"
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        equityType: "Capital Reserve",
        amount: "250000.00",
        date: new Date("2024-03-01"),
        description: "Capital reserve for regulatory compliance"
      }
    ]);

    console.log("✅ Database seeding completed successfully!");
    console.log(`
📊 Summary of seeded data:
- 1 Admin user created
- 1 MFI registration
- 2 Shareholders
- 3 Staff members
- 3 Loan products
- 5 Customers
- 5 Loans (4 active, 1 pending)
- Payment schedules for active loans
- Financial records: Income, Expenses, Bank accounts
- Asset management: Inventory, Fixed assets
- Liability and Equity records
    `);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("🎉 Seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}