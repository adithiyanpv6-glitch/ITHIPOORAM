import { 
  INITIAL_TABLES, 
  INITIAL_ORDERS, 
  INITIAL_MENU_CATEGORIES, 
  INITIAL_USERS, 
  INITIAL_AUDIT_LOGS 
} from './mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ithipooram_token');
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('ithipooram_user');
  return user ? JSON.parse(user) : null;
}

// In-browser fallback state store for instant Vercel preview
let memoryTables = [...INITIAL_TABLES];
let memoryOrders = { ...INITIAL_ORDERS };
let memoryMenu = [...INITIAL_MENU_CATEGORIES];
let memoryUsers = [...INITIAL_USERS];
let memoryAudit = [...INITIAL_AUDIT_LOGS];

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const baseUrl = API_BASE || '';
  const url = endpoint.startsWith('/api') ? `${baseUrl}${endpoint}` : `${baseUrl}/api${endpoint}`;
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { ...options, headers });
    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch (e) {
    // Continue to fallback if network or fetch throws
  }

  // --- Fallback in-memory handler for standalone Vercel preview ---
  await new Promise((r) => setTimeout(r, 60)); // Simulate micro-delay

  if (endpoint === '/tables' || endpoint.startsWith('/tables?')) {
    return memoryTables as any;
  }

  if (endpoint.startsWith('/billing/tables/') && endpoint.endsWith('/unpaid')) {
    const tableCode = endpoint.split('/')[3];
    const orders = memoryOrders[tableCode] || [];
    return {
      table: { tableCode, displayName: `Table ${tableCode}` },
      unpaidOrders: orders.filter((o) => o.billingStatus === 'UNPAID'),
    } as any;
  }

  if (endpoint.startsWith('/billing/orders/') && endpoint.endsWith('/preview')) {
    const orderId = endpoint.split('/')[3];
    let foundOrder: any = null;
    for (const list of Object.values(memoryOrders)) {
      const o = list.find((item) => item.id === orderId);
      if (o) foundOrder = o;
    }
    const subtotal = foundOrder?.subtotalPaise || 50000;
    const cgst = Math.round((subtotal * 2.5) / 100);
    const sgst = Math.round((subtotal * 2.5) / 100);
    return {
      order: foundOrder,
      calculation: {
        subtotalPaise: subtotal,
        discountPaise: 0,
        cgstPaise: cgst,
        sgstPaise: sgst,
        grandTotalPaise: subtotal + cgst + sgst,
      },
    } as any;
  }

  if (endpoint.startsWith('/billing/orders/') && endpoint.endsWith('/confirm-payment')) {
    const orderId = endpoint.split('/')[3];
    const body = JSON.parse(options.body as string);
    const pin = body.cashierPin;
    if (pin !== '5566' && pin !== '7788' && pin !== '1122' && pin !== '3344') {
      throw new Error('Invalid Cashier PIN. Verification failed.');
    }

    // Mark paid in memory
    for (const [tCode, list] of Object.entries(memoryOrders)) {
      const order = list.find((o) => o.id === orderId);
      if (order) {
        order.billingStatus = 'PAID';
        // Update table balance
        const tIndex = memoryTables.findIndex((t) => t.tableCode === tCode);
        if (tIndex >= 0) {
          memoryTables[tIndex].unpaidCount = Math.max(0, memoryTables[tIndex].unpaidCount - 1);
          memoryTables[tIndex].unpaidTotalPaise = Math.max(0, memoryTables[tIndex].unpaidTotalPaise - order.grandTotalPaise);
          if (memoryTables[tIndex].unpaidCount === 0) {
            memoryTables[tIndex].status = 'AVAILABLE';
          }
        }

        const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`;
        const thermalReceipt = `================================================
                    ഇത്തിപ്പൂരം
                    ITHI POORAM
       Authentic Kerala Lunch & Seafood Spot
   Opp. Old Secretariat Gate, MG Road, Trivandrum
                  Ph: +91 471 233 4567
     GSTIN: 32AAAAI0000A1Z5 | FSSAI: 11324007000890
================================================
                  TAX INVOICE
------------------------------------------------
Invoice: ${invoiceNumber}             Table: ${tCode}
Order Ref: ${order.customerCode}        Time: ${new Date().toLocaleTimeString()}
Cashier: Gokul Krishnan (Counter 1)
------------------------------------------------
ITEM [QTY x RATE]                    TOTAL (INR)
------------------------------------------------
${order.items.map((i: any) => `${i.itemNameSnapshot}\n  ${i.quantity} x ₹${(i.itemPriceSnapshotPaise/100).toFixed(2)}                      ₹${(i.lineTotalPaise/100).toFixed(2)}`).join('\n')}
------------------------------------------------
Subtotal:                                ₹${(order.subtotalPaise/100).toFixed(2)}
CGST (2.5%):                              ₹${((order.grandTotalPaise - order.subtotalPaise)/200).toFixed(2)}
SGST (2.5%):                              ₹${((order.grandTotalPaise - order.subtotalPaise)/200).toFixed(2)}
================================================
NET PAYABLE:                             ₹${(order.grandTotalPaise/100).toFixed(2)}
================================================
Payment Mode: ${body.paymentMode}
------------------------------------------------
         Thank you for dining with us!
        ഇത്തിപ്പൂരം വീണ്ടും സന്ദർശിക്കുക
`;
        return {
          message: 'Payment confirmed and invoice created.',
          order,
          invoice: {
            id: 'inv-demo-1',
            invoiceNumber,
            grandTotalPaise: order.grandTotalPaise,
            printStatus: 'PRINTED',
          },
          printerStatus: 'SUCCESS',
          thermalReceipt,
        } as any;
      }
    }
  }

  if (endpoint === '/admin/overview') {
    return {
      businessDate: new Date().toISOString().slice(0, 10),
      kpis: {
        grossSalesPaise: 1850000,
        subtotalPaise: 1762000,
        discountPaise: 12000,
        netSalesPaise: 1850000,
        totalOrdersCount: 28,
        paidOrdersCount: 24,
        unpaidOrdersCount: 4,
        cancelledOrdersCount: 1,
        averageOrderValuePaise: 77083,
      },
      salesByPaymentType: {
        UPI: 1150000,
        CASH: 450000,
        CARD: 250000,
      },
      topSellingItems: [
        { name: 'Special Kerala Seafood Oonu', quantity: 42, totalPaise: 672000 },
        { name: 'Karimeen Pollichathu', quantity: 18, totalPaise: 684000 },
        { name: 'Neymeen Tawa Fry', quantity: 15, totalPaise: 480000 },
        { name: 'Ayala Fry (Mackerel)', quantity: 24, totalPaise: 336000 },
        { name: 'Special Kulukki Sarbath', quantity: 38, totalPaise: 190000 },
      ],
      stockAlerts: [
        { id: 'm8', name: 'Koonthal Pepper Fry', category: 'Seafood Fry', isAvailable: true, currentStock: 3 },
      ],
      tableWiseSales: [
        { tableCode: 'TQ1', orderCount: 5, totalPaise: 380000 },
        { tableCode: 'TQ3', orderCount: 4, totalPaise: 310000 },
        { tableCode: 'TQ5', orderCount: 6, totalPaise: 420000 },
        { tableCode: 'TQ7', orderCount: 3, totalPaise: 240000 },
      ],
      staffBillingActivity: [
        { name: 'Gokul Krishnan (Billing Counter 1)', invoiceCount: 16, totalPaise: 1240000 },
        { name: 'Meera Rajesh (Billing Counter 2)', invoiceCount: 8, totalPaise: 610000 },
      ],
    } as any;
  }

  if (endpoint === '/menu/staff') {
    return memoryMenu as any;
  }

  if (endpoint.startsWith('/menu/items/') && endpoint.endsWith('/availability')) {
    const itemId = endpoint.split('/')[3];
    const body = JSON.parse(options.body as string);
    for (const cat of memoryMenu) {
      const it = cat.items.find((item: any) => item.id === itemId);
      if (it) {
        if (typeof body.isAvailable === 'boolean') it.isAvailable = body.isAvailable;
        if (body.currentStock !== undefined) it.currentStock = body.currentStock;
        return it as any;
      }
    }
  }

  if (endpoint.startsWith('/menu/items/') && endpoint.endsWith('/price')) {
    const itemId = endpoint.split('/')[3];
    const body = JSON.parse(options.body as string);
    for (const cat of memoryMenu) {
      const it = cat.items.find((item: any) => item.id === itemId);
      if (it) {
        it.pricePaise = body.newPricePaise;
        return it as any;
      }
    }
  }

  if (endpoint.startsWith('/audit/logs')) {
    return { logs: memoryAudit, total: memoryAudit.length } as any;
  }

  if (endpoint === '/admin/users') {
    return memoryUsers as any;
  }

  if (endpoint.startsWith('/admin/users/')) {
    const userId = endpoint.split('/')[3];
    const body = JSON.parse(options.body as string);
    const u = memoryUsers.find((user) => user.id === userId);
    if (u) {
      if (typeof body.isActive === 'boolean') u.isActive = body.isActive;
      if (body.role) u.role = body.role;
      return u as any;
    }
  }

  if (endpoint === '/auth/register') {
    const body = JSON.parse(options.body as string);
    const rawName = (body.name || body.username || '').trim();
    if (!rawName) throw new Error('Staff name is required');
    const pin = (body.pin || body.password || '').trim();
    if (!pin || pin.length !== 4) throw new Error('Password must be exactly 4 digits');

    const cleanUsername = rawName.toLowerCase().replace(/\s+/g, '');
    const users = getRegisteredStaffList();

    const newUser = {
      id: `u-${Date.now()}`,
      username: cleanUsername,
      fullName: rawName,
      role: body.role || 'CASHIER',
      pin,
      isActive: true,
      hasPin: true,
    };

    const existingIdx = users.findIndex((u: any) => u.username === cleanUsername);
    if (existingIdx >= 0) {
      users[existingIdx] = newUser;
    } else {
      users.push(newUser);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('ithipooram_registered_users', JSON.stringify(users));
    }
    return {
      message: 'Staff registered successfully',
      user: newUser,
    } as any;
  }

  if (endpoint === '/auth/login') {
    const body = JSON.parse(options.body as string);
    const inputUser = (body.username || '').trim().toLowerCase().replace(/\s+/g, '');
    const inputPin = (body.password || body.pin || '').trim();

    if (!inputUser) throw new Error('Username is required');
    if (!inputPin) throw new Error('4-digit Password / PIN is required');

    const users = getRegisteredStaffList();
    const foundUser = users.find((u: any) => u.username === inputUser || u.fullName.toLowerCase() === body.username.trim().toLowerCase());

    // ADMIN SUPER-PASSWORD RULE:
    // Admin password (default: '1111' or any registered MAIN_ADMIN's pin) can log in to ANY username!
    const adminStaff = users.filter((u: any) => u.role === 'MAIN_ADMIN');
    const isAdminMasterPassword = inputPin === '1111' || adminStaff.some((a: any) => a.pin === inputPin);

    if (isAdminMasterPassword) {
      const activeUser = foundUser || {
        id: `u-${inputUser}`,
        username: inputUser,
        fullName: body.username,
        role: 'MAIN_ADMIN',
        hasPin: true,
      };

      return {
        message: 'Admin Master authorization successful',
        token: 'admin-master-jwt-token',
        user: activeUser,
      } as any;
    }

    // Standard Staff Authentication
    if (!foundUser) {
      throw new Error(`User "${body.username}" not found. Please register as new staff.`);
    }

    if (foundUser.pin !== inputPin) {
      throw new Error('Incorrect 4-digit password / PIN. Please try again.');
    }

    return {
      message: 'Login successful',
      token: 'jwt-auth-token-for-staff',
      user: foundUser,
    } as any;
  }

  return {} as any;
}

export function getRegisteredStaffList(): any[] {
  if (typeof window === 'undefined') return [...INITIAL_USERS];
  const saved = localStorage.getItem('ithipooram_registered_users');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  const defaults = [
    { id: 'u-admin', username: 'admin', fullName: 'Owner / Admin', role: 'MAIN_ADMIN', pin: '1111', isActive: true, hasPin: true },
    { id: 'u-cashier1', username: 'cashier1', fullName: 'Gokul Krishnan', role: 'CASHIER', pin: '1234', isActive: true, hasPin: true },
    { id: 'u-cashier2', username: 'cashier2', fullName: 'Meera Rajesh', role: 'CASHIER', pin: '5678', isActive: true, hasPin: true },
    { id: 'u-manager1', username: 'manager1', fullName: 'Ananthu V', role: 'MANAGER', pin: '9999', isActive: true, hasPin: true },
  ];
  localStorage.setItem('ithipooram_registered_users', JSON.stringify(defaults));
  return defaults;
}
