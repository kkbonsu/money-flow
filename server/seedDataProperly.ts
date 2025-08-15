import { db } from "./db";
import { 
  users, customers, loanBooks, loanProducts, paymentSchedules, staff, incomeManagement, 
  expenses, bankManagement, pettyCash, inventory, assets, liabilities, equity
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const DEFAULT_TENANT_ID = "default-tenant-001";

async function seedDataProperly() {
  console.log("🌱 Starting proper database seeding for local development...");

  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
    
    if (existingAdmin.length === 0) {
      console.log("👤 Creating admin user...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      
      await db.insert(users).values({
        tenantId: DEFAULT_TENANT_ID,
        firstName: "System",
        lastName: "Administrator",
        username: "admin",
        email: "admin@moneyflow.com",
        password: hashedPassword,
        role: "admin",
        isActive: true
      });
      console.log("✅ Admin user created successfully");
    } else {
      console.log("👤 Admin user already exists, skipping...");
    }

    // Check and create loan products
    const existingProducts = await db.select().from(loanProducts);
    if (existingProducts.length === 0) {
      console.log("💳 Creating loan products...");
      await db.insert(loanProducts).values([
        {
          tenantId: DEFAULT_TENANT_ID,
          name: "Small Business Loan",
          description: "Quick loans for small business expansion",
          minAmount: "1000.00",
          maxAmount: "50000.00",
          interestRate: "18.50",
          termMonths: 12,
          fee: "2.50",
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
          fee: "2.00",
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
          fee: "3.00",
          isActive: true
        }
      ]);
      console.log("✅ Loan products created successfully");
    } else {
      console.log("💳 Loan products already exist, skipping...");
    }

    // Check and create customers
    const existingCustomers = await db.select().from(customers);
    if (existingCustomers.length === 0) {
      console.log("👥 Creating sample customers...");
      const customerPassword = await bcrypt.hash("customer123", 10);
      
      await db.insert(customers).values([
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
          password: customerPassword
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
          password: customerPassword
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
          password: customerPassword
        }
      ]);
      console.log("✅ Sample customers created successfully");
    } else {
      console.log("👥 Customers already exist, skipping...");
    }

    // Create sample loans if they don't exist
    const existingLoans = await db.select().from(loanBooks);
    if (existingLoans.length === 0) {
      console.log("💰 Creating sample loans...");
      
      const allCustomers = await db.select().from(customers).limit(3);
      const allProducts = await db.select().from(loanProducts).limit(3);
      
      if (allCustomers.length > 0 && allProducts.length > 0) {
        await db.insert(loanBooks).values([
          {
            tenantId: DEFAULT_TENANT_ID,
            customerId: allCustomers[0].id,
            loanProductId: allProducts[0].id,
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
            customerId: allCustomers[1].id,
            loanProductId: allProducts[0].id,
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
            customerId: allCustomers[2].id,
            loanProductId: allProducts[1].id,
            loanAmount: "80000.00",
            interestRate: "15.75",
            term: 18,
            purpose: "Farm equipment and seeds for cocoa farming",
            status: "active",
            disbursementDate: new Date("2024-05-01"),
            maturityDate: new Date("2025-11-01")
          }
        ]);
        console.log("✅ Sample loans created successfully");
      }
    } else {
      console.log("💰 Loans already exist, skipping...");
    }

    // Create financial records
    const existingIncome = await db.select().from(incomeManagement);
    if (existingIncome.length === 0) {
      console.log("💹 Creating financial records...");
      
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
        }
      ]);

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
        }
      ]);

      console.log("✅ Financial records created successfully");
    } else {
      console.log("💹 Financial records already exist, skipping...");
    }

    // Create staff records
    const existingStaff = await db.select().from(staff);
    if (existingStaff.length === 0) {
      console.log("👨‍💼 Creating staff records...");
      
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
        }
      ]);

      console.log("✅ Staff records created successfully");
    } else {
      console.log("👨‍💼 Staff records already exist, skipping...");
    }

    // Create bank accounts
    const existingBanks = await db.select().from(bankManagement);
    if (existingBanks.length === 0) {
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
        }
      ]);

      console.log("✅ Bank accounts created successfully");
    } else {
      console.log("🏦 Bank accounts already exist, skipping...");
    }

    // Final verification
    console.log("\n📊 Verifying seeded data...");
    const finalUsers = await db.select().from(users);
    const finalCustomers = await db.select().from(customers);
    const finalLoans = await db.select().from(loanBooks);
    const finalProducts = await db.select().from(loanProducts);
    const finalStaff = await db.select().from(staff);
    const finalBanks = await db.select().from(bankManagement);

    console.log(`
✅ Database seeding completed successfully!

📈 Final Data Summary:
- Users: ${finalUsers.length}
- Customers: ${finalCustomers.length}
- Loan Products: ${finalProducts.length}
- Active Loans: ${finalLoans.length}
- Staff Members: ${finalStaff.length}
- Bank Accounts: ${finalBanks.length}

🔑 Test Credentials:
- Admin Login: admin@moneyflow.com / admin123
- Customer Login: e.boateng@email.com / customer123

🎯 Ready for local development and testing!
    `);

  } catch (error) {
    console.error("❌ Error during database seeding:", error);
    throw error;
  }
}

export { seedDataProperly };