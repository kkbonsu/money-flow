import { db } from "./db";
import bcrypt from "bcryptjs";

const DEFAULT_TENANT_ID = "default-tenant-001";

async function runSimpleSeed() {
  console.log("🌱 Starting comprehensive database seeding...");

  try {
    // 1. Create admin user with proper password
    console.log("👤 Creating admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    await db.execute(`
      INSERT INTO users (tenant_id, first_name, last_name, username, email, password, role, is_active)
      VALUES ('${DEFAULT_TENANT_ID}', 'System', 'Administrator', 'admin', 'admin@moneyflow.com', '${hashedPassword}', 'admin', true)
      ON CONFLICT (email) DO UPDATE SET
        tenant_id = '${DEFAULT_TENANT_ID}',
        role = 'admin',
        is_active = true;
    `);

    // 2. Create comprehensive sample customers
    console.log("👥 Creating sample customers...");
    const customerPassword = await bcrypt.hash("customer123", 10);
    
    await db.execute(`
      INSERT INTO customers (tenant_id, first_name, last_name, email, phone, address, occupation, monthly_income, credit_score, status, password)
      VALUES 
        ('${DEFAULT_TENANT_ID}', 'Emmanuel', 'Boateng', 'e.boateng@email.com', '+233-24-777-8888', 'Tema Community 1', 'Retail Trader', '8500.00', 750, 'active', '${customerPassword}'),
        ('${DEFAULT_TENANT_ID}', 'Akosua', 'Frimpong', 'a.frimpong@email.com', '+233-50-999-0000', 'Kumasi Adum', 'Restaurant Owner', '12000.00', 680, 'active', '${customerPassword}'),
        ('${DEFAULT_TENANT_ID}', 'Kofi', 'Asiedu', 'k.asiedu@email.com', '+233-26-111-2222', 'Tamale Central', 'Farmer', '5500.00', 620, 'active', '${customerPassword}'),
        ('${DEFAULT_TENANT_ID}', 'Efua', 'Gyasi', 'e.gyasi@email.com', '+233-55-333-4444', 'Cape Coast', 'Fish Trader', '7200.00', 710, 'active', '${customerPassword}'),
        ('${DEFAULT_TENANT_ID}', 'Yaw', 'Opoku', 'y.opoku@email.com', '+233-20-555-6666', 'Ho Township', 'Transport Business', '15000.00', 780, 'active', '${customerPassword}')
      ON CONFLICT (email) DO NOTHING;
    `);

    // 3. Create loan products
    console.log("💳 Creating loan products...");
    await db.execute(`
      INSERT INTO loan_products (tenant_id, name, description, min_amount, max_amount, interest_rate, term_months, fee, is_active)
      VALUES 
        ('${DEFAULT_TENANT_ID}', 'Small Business Loan', 'Quick loans for small business expansion', '1000.00', '50000.00', '18.50', 12, '2.50', true),
        ('${DEFAULT_TENANT_ID}', 'Agricultural Loan', 'Seasonal loans for farmers and agribusiness', '2000.00', '100000.00', '15.75', 18, '2.00', true),
        ('${DEFAULT_TENANT_ID}', 'Emergency Personal Loan', 'Fast personal loans for urgent needs', '500.00', '25000.00', '22.00', 6, '3.00', true)
      ON CONFLICT DO NOTHING;
    `);

    // 4. Create active loans with proper relationships
    console.log("💰 Creating sample loans...");
    await db.execute(`
      INSERT INTO loan_books (tenant_id, customer_id, loan_product_id, loan_amount, interest_rate, term, purpose, status, disbursement_date, maturity_date)
      SELECT 
        '${DEFAULT_TENANT_ID}',
        c.id,
        lp.id,
        CASE 
          WHEN c.email = 'e.boateng@email.com' THEN '25000.00'
          WHEN c.email = 'a.frimpong@email.com' THEN '45000.00'
          WHEN c.email = 'k.asiedu@email.com' THEN '80000.00'
          WHEN c.email = 'e.gyasi@email.com' THEN '18000.00'
          ELSE '35000.00'
        END,
        lp.interest_rate,
        lp.term_months,
        CASE 
          WHEN c.email = 'e.boateng@email.com' THEN 'Inventory expansion for retail business'
          WHEN c.email = 'a.frimpong@email.com' THEN 'Restaurant equipment purchase'
          WHEN c.email = 'k.asiedu@email.com' THEN 'Farm equipment and seeds for cocoa farming'
          WHEN c.email = 'e.gyasi@email.com' THEN 'Cold storage facilities for fish business'
          ELSE 'Vehicle purchase for transport business'
        END,
        CASE 
          WHEN c.email = 'y.opoku@email.com' THEN 'pending'
          ELSE 'active'
        END,
        CASE 
          WHEN c.email = 'e.boateng@email.com' THEN '2024-07-01'::date
          WHEN c.email = 'a.frimpong@email.com' THEN '2024-06-15'::date
          WHEN c.email = 'k.asiedu@email.com' THEN '2024-05-01'::date
          WHEN c.email = 'e.gyasi@email.com' THEN '2024-08-01'::date
          ELSE NULL
        END,
        CASE 
          WHEN c.email = 'e.boateng@email.com' THEN '2025-07-01'::date
          WHEN c.email = 'a.frimpong@email.com' THEN '2025-06-15'::date
          WHEN c.email = 'k.asiedu@email.com' THEN '2025-11-01'::date
          WHEN c.email = 'e.gyasi@email.com' THEN '2025-08-01'::date
          ELSE NULL
        END
      FROM customers c
      CROSS JOIN loan_products lp
      WHERE c.tenant_id = '${DEFAULT_TENANT_ID}'
        AND lp.tenant_id = '${DEFAULT_TENANT_ID}'
        AND ((c.email = 'e.boateng@email.com' AND lp.name = 'Small Business Loan')
             OR (c.email = 'a.frimpong@email.com' AND lp.name = 'Small Business Loan')
             OR (c.email = 'k.asiedu@email.com' AND lp.name = 'Agricultural Loan')
             OR (c.email = 'e.gyasi@email.com' AND lp.name = 'Small Business Loan')
             OR (c.email = 'y.opoku@email.com' AND lp.name = 'Small Business Loan'))
      ON CONFLICT DO NOTHING;
    `);

    // 5. Create financial management data
    console.log("💹 Creating financial records...");
    
    // Income records
    await db.execute(`
      INSERT INTO income_management (tenant_id, source, amount, category, date, description)
      VALUES 
        ('${DEFAULT_TENANT_ID}', 'Interest Payment', '5240.50', 'Loan Interest', '2024-08-01', 'Monthly interest payments from active loans'),
        ('${DEFAULT_TENANT_ID}', 'Processing Fees', '2150.00', 'Fee Income', '2024-08-01', 'Loan processing fees collected'),
        ('${DEFAULT_TENANT_ID}', 'Investment Returns', '8500.00', 'Investment Income', '2024-07-30', 'Returns from government bonds'),
        ('${DEFAULT_TENANT_ID}', 'Service Charges', '1320.00', 'Service Income', '2024-08-05', 'Account maintenance and transaction fees')
      ON CONFLICT DO NOTHING;
    `);

    // Expense records
    await db.execute(`
      INSERT INTO expenses (tenant_id, description, amount, category, vendor, date)
      VALUES 
        ('${DEFAULT_TENANT_ID}', 'Staff salaries for August 2024', '13500.00', 'Personnel', 'Payroll Department', '2024-08-01'),
        ('${DEFAULT_TENANT_ID}', 'Office rent for August 2024', '3200.00', 'Overhead', 'Unity Properties Ltd', '2024-08-01'),
        ('${DEFAULT_TENANT_ID}', 'Loan default provisions', '4500.00', 'Provisions', 'Internal', '2024-08-10'),
        ('${DEFAULT_TENANT_ID}', 'Marketing and advertising', '2800.00', 'Marketing', 'Digital Marketing Agency', '2024-08-05'),
        ('${DEFAULT_TENANT_ID}', 'Office supplies and utilities', '1650.00', 'Operations', 'Various Suppliers', '2024-08-08')
      ON CONFLICT DO NOTHING;
    `);

    // 6. Create staff records
    console.log("👨‍💼 Creating staff members...");
    await db.execute(`
      INSERT INTO staff (tenant_id, first_name, last_name, email, phone, position, salary, hire_date, status)
      VALUES 
        ('${DEFAULT_TENANT_ID}', 'Sarah', 'Mensah', 's.mensah@ghanams.com', '+233-20-111-2222', 'Loan Officer', '3500.00', '2024-01-15', 'active'),
        ('${DEFAULT_TENANT_ID}', 'David', 'Owusu', 'd.owusu@ghanams.com', '+233-20-333-4444', 'Credit Analyst', '4200.00', '2024-02-01', 'active'),
        ('${DEFAULT_TENANT_ID}', 'Grace', 'Adjei', 'g.adjei@ghanams.com', '+233-20-555-6666', 'Operations Manager', '5800.00', '2023-11-10', 'active')
      ON CONFLICT DO NOTHING;
    `);

    // 7. Create bank accounts
    console.log("🏦 Creating bank accounts...");
    await db.execute(`
      INSERT INTO bank_management (tenant_id, account_name, bank_name, account_number, balance, status)
      VALUES 
        ('${DEFAULT_TENANT_ID}', 'Ghana MFS Operations Account', 'Ghana Commercial Bank', '1234567890123', '485750.00', 'active'),
        ('${DEFAULT_TENANT_ID}', 'Ghana MFS Loan Disbursement Account', 'Ecobank Ghana', '9876543210987', '125000.00', 'active'),
        ('${DEFAULT_TENANT_ID}', 'Ghana MFS Investment Account', 'Standard Chartered Bank', '5555666677778', '350000.00', 'active')
      ON CONFLICT DO NOTHING;
    `);

    // 8. Create assets, liabilities, and equity
    console.log("🏢 Creating assets, liabilities, and equity...");
    
    await db.execute(`
      INSERT INTO assets (tenant_id, asset_name, category, value, depreciation_rate, purchase_date, status)
      VALUES 
        ('${DEFAULT_TENANT_ID}', 'Head Office Building', 'Real Estate', '850000.00', '2.50', '2023-03-15', 'active'),
        ('${DEFAULT_TENANT_ID}', 'Company Vehicles', 'Transportation', '125000.00', '15.00', '2024-01-20', 'active'),
        ('${DEFAULT_TENANT_ID}', 'IT Infrastructure', 'Technology', '45000.00', '25.00', '2024-02-10', 'active')
      ON CONFLICT DO NOTHING;
    `);

    await db.execute(`
      INSERT INTO liabilities (tenant_id, liability_name, amount, due_date, status, creditor, interest_rate)
      VALUES 
        ('${DEFAULT_TENANT_ID}', 'Bank of Ghana Regulatory Capital', '2000000.00', '2025-12-31', 'active', 'Bank of Ghana', '8.50'),
        ('${DEFAULT_TENANT_ID}', 'Equipment Financing Loan', '75000.00', '2025-06-30', 'active', 'Development Bank Ghana', '12.00'),
        ('${DEFAULT_TENANT_ID}', 'Supplier Credit Line', '25000.00', '2024-12-31', 'pending', 'Office Supplies Ghana Ltd', '6.00')
      ON CONFLICT DO NOTHING;
    `);

    await db.execute(`
      INSERT INTO equity (tenant_id, equity_type, amount, date, description)
      VALUES 
        ('${DEFAULT_TENANT_ID}', 'Share Capital', '5000000.00', '2024-01-01', 'Initial share capital from founders'),
        ('${DEFAULT_TENANT_ID}', 'Retained Earnings', '125000.00', '2024-07-31', 'Accumulated retained earnings from operations'),
        ('${DEFAULT_TENANT_ID}', 'Capital Reserve', '250000.00', '2024-03-01', 'Capital reserve for regulatory compliance')
      ON CONFLICT DO NOTHING;
    `);

    console.log("✅ Comprehensive database seeding completed successfully!");
    console.log(`
📊 Summary of seeded data:
- ✓ Admin user with credentials: admin@moneyflow.com / admin123
- ✓ 5 Sample customers with realistic profiles  
- ✓ 3 Loan products (Business, Agricultural, Personal)
- ✓ 5 Loan applications (4 active, 1 pending)
- ✓ Financial records: Income, Expenses, Bank accounts
- ✓ Staff management: 3 employees
- ✓ Asset management: Real estate, vehicles, IT
- ✓ Liability and Equity records
- ✓ Multi-tenant architecture with default tenant ID

🔑 Test Credentials:
- Admin: admin@moneyflow.com / admin123
- Customer: any customer email / customer123
    `);

  } catch (error) {
    console.error("❌ Error during database seeding:", error);
    throw error;
  }
}

export { runSimpleSeed };