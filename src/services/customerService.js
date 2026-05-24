import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';

const CUSTOMERS_COLLECTION = 'customers';
const STOCK_COLLECTION = 'stock';
const RESTOCK_HISTORY_KEY = 'restockHistory';

// --- Fallback Local Storage Helpers ---
const getLocal = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveLocal = (key, items) => {
  localStorage.setItem(key, JSON.stringify(items));
};

// ==========================================
//  ENTRY NORMALIZATION (backward compat)
// ==========================================

/**
 * Normalize an entry to have `items` array for multi-product support.
 * Old entries: { product, amount, quantity } → { items: [{...}], product, amount, quantity }
 */
export const normalizeEntry = (entry) => {
  if (!entry.items || !Array.isArray(entry.items)) {
    return {
      ...entry,
      items: [{
        product: entry.product || '',
        quantity: Number(entry.quantity) || 1,
        pricePerUnit: (Number(entry.amount) || 0) / (Number(entry.quantity) || 1),
        lineTotal: Number(entry.amount) || 0
      }]
    };
  }
  return entry;
};

// ==========================================
//  CUSTOMER GROUPING UTILITY
// ==========================================

/**
 * Group flat sale entries into customer groups.
 * Two entries belong to the same customer if:
 *  - Same phone number (exact match, non-empty), OR
 *  - Same customer name (case-insensitive, trimmed)
 * Phone match takes priority.
 */
export const groupCustomerEntries = (entries) => {
  const groups = [];
  const phoneMap = {};   // phone → group index
  const nameMap = {};    // normalized name → group index

  entries.forEach(entry => {
    const normalized = normalizeEntry(entry);
    const phone = (normalized.phone || '').trim();
    const nameLower = (normalized.name || '').trim().toLowerCase();

    let groupIndex = -1;

    // Priority 1: Match by phone
    if (phone && phoneMap[phone] !== undefined) {
      groupIndex = phoneMap[phone];
    }
    // Priority 2: Match by name
    else if (nameLower && nameMap[nameLower] !== undefined) {
      groupIndex = nameMap[nameLower];
    }

    if (groupIndex >= 0) {
      // Add to existing group
      groups[groupIndex].bills.push(normalized);
    } else {
      // Create new group
      groupIndex = groups.length;
      groups.push({
        customerName: normalized.name,
        customerPhone: phone,
        bills: [normalized]
      });
    }

    // Register both phone and name for this group
    if (phone) phoneMap[phone] = groupIndex;
    if (nameLower) nameMap[nameLower] = groupIndex;
  });

  // Compute summaries for each group
  return groups.map(group => {
    let totalAmount = 0, totalPaid = 0, totalDue = 0;
    group.bills.forEach(bill => {
      const amt = Number(bill.amount) || 0;
      totalAmount += amt;
      if (bill.status === 'due') totalDue += amt;
      else totalPaid += amt;
    });
    return {
      ...group,
      totalAmount,
      totalPaid,
      totalDue,
      billCount: group.bills.length
    };
  });
};

/**
 * Get unique customers for auto-suggest (deduplicated by name/phone).
 */
export const getUniqueCustomers = (entries) => {
  const seen = new Map();
  entries.forEach(entry => {
    const key = (entry.phone || '').trim() || (entry.name || '').trim().toLowerCase();
    if (key && !seen.has(key)) {
      const billCount = entries.filter(e => {
        const p1 = (e.phone || '').trim();
        const p2 = (entry.phone || '').trim();
        if (p1 && p2 && p1 === p2) return true;
        return (e.name || '').trim().toLowerCase() === (entry.name || '').trim().toLowerCase();
      }).length;
      seen.set(key, { name: entry.name, phone: entry.phone || '', billCount });
    }
  });
  return Array.from(seen.values());
};

// ==========================================
//  CUSTOMER SERVICE
// ==========================================

export const getCustomers = async () => {
  if (!firebaseReady) {
    return getLocal(CUSTOMERS_COLLECTION).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  try {
    const q = query(collection(db, CUSTOMERS_COLLECTION), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting customers:", error);
    return getLocal(CUSTOMERS_COLLECTION).sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};

export const addCustomer = async (customerData) => {
  // Build product string from items array if present
  let productStr = customerData.product || '';
  if (customerData.items && customerData.items.length > 0) {
    productStr = customerData.items.map(i => i.product).join(', ');
  }

  const newCustomer = {
    ...customerData,
    product: productStr,
    status: customerData.status || 'paid',
    quantity: customerData.quantity || 1,
    date: customerData.entryDate
      ? new Date(customerData.entryDate + 'T' + new Date().toTimeString().slice(0, 8)).toISOString()
      : new Date().toISOString()
  };

  if (!firebaseReady) {
    const customers = getLocal(CUSTOMERS_COLLECTION);
    newCustomer.id = Date.now().toString();
    customers.push(newCustomer);
    saveLocal(CUSTOMERS_COLLECTION, customers);
    return newCustomer;
  }

  try {
    const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), newCustomer);
    return { id: docRef.id, ...newCustomer };
  } catch (error) {
    console.error("Error adding customer: ", error);
    throw error;
  }
};

export const updateCustomer = async (id, updatedData) => {
  if (!firebaseReady) {
    const customers = getLocal(CUSTOMERS_COLLECTION);
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...updatedData };
      saveLocal(CUSTOMERS_COLLECTION, customers);
    }
    return;
  }

  try {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, id);
    await updateDoc(customerRef, updatedData);
  } catch (error) {
    console.error("Error updating customer: ", error);
    throw error;
  }
};

export const deleteCustomer = async (id) => {
  if (!firebaseReady) {
    const customers = getLocal(CUSTOMERS_COLLECTION);
    saveLocal(CUSTOMERS_COLLECTION, customers.filter(c => c.id !== id));
    return;
  }

  try {
    await deleteDoc(doc(db, CUSTOMERS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting customer: ", error);
    throw error;
  }
};

// ==========================================
//  PAYMENT HELPERS
// ==========================================

export const updatePaymentStatus = async (id, status) => {
  return updateCustomer(id, { status });
};

export const markAllCustomerBillsPaid = async (entries) => {
  const promises = entries
    .filter(e => e.status === 'due')
    .map(e => updatePaymentStatus(e.id, 'paid'));
  await Promise.all(promises);
};

// ==========================================
//  STOCK / INVENTORY SERVICE
// ==========================================

export const getStock = async () => {
  if (!firebaseReady) {
    return getLocal(STOCK_COLLECTION).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  try {
    const q = query(collection(db, STOCK_COLLECTION), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting stock:", error);
    return getLocal(STOCK_COLLECTION).sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};

export const addStock = async (stockData) => {
  const newStock = {
    ...stockData,
    minThreshold: stockData.minThreshold || 50,
    date: new Date().toISOString()
  };

  if (!firebaseReady) {
    const stock = getLocal(STOCK_COLLECTION);
    newStock.id = Date.now().toString();
    stock.push(newStock);
    saveLocal(STOCK_COLLECTION, stock);

    // Log restock history
    addRestockHistory({
      stockId: newStock.id,
      productName: newStock.productName,
      quantityAdded: Number(newStock.quantity) || 0,
      newTotal: Number(newStock.quantity) || 0,
      date: newStock.date,
      type: 'initial'
    });

    return newStock;
  }

  try {
    const docRef = await addDoc(collection(db, STOCK_COLLECTION), newStock);
    addRestockHistory({
      stockId: docRef.id,
      productName: newStock.productName,
      quantityAdded: Number(newStock.quantity) || 0,
      newTotal: Number(newStock.quantity) || 0,
      date: newStock.date,
      type: 'initial'
    });
    return { id: docRef.id, ...newStock };
  } catch (error) {
    console.error("Error adding stock: ", error);
    throw error;
  }
};

export const updateStock = async (id, updatedData) => {
  // Get old stock to compute restock amount
  const stockItems = getLocal(STOCK_COLLECTION);
  const oldItem = stockItems.find(s => s.id === id);
  const oldQty = oldItem ? Number(oldItem.quantity) || 0 : 0;
  const newQty = Number(updatedData.quantity) || 0;

  if (!firebaseReady) {
    const index = stockItems.findIndex(s => s.id === id);
    if (index !== -1) {
      stockItems[index] = { ...stockItems[index], ...updatedData };
      saveLocal(STOCK_COLLECTION, stockItems);
    }

    // Log restock if quantity increased
    if (newQty > oldQty) {
      addRestockHistory({
        stockId: id,
        productName: updatedData.productName || (oldItem && oldItem.productName) || 'Unknown',
        quantityAdded: newQty - oldQty,
        newTotal: newQty,
        date: new Date().toISOString(),
        type: 'restock'
      });
    }
    return;
  }

  try {
    const stockRef = doc(db, STOCK_COLLECTION, id);
    await updateDoc(stockRef, updatedData);

    if (newQty > oldQty) {
      addRestockHistory({
        stockId: id,
        productName: updatedData.productName || (oldItem && oldItem.productName) || 'Unknown',
        quantityAdded: newQty - oldQty,
        newTotal: newQty,
        date: new Date().toISOString(),
        type: 'restock'
      });
    }
  } catch (error) {
    console.error("Error updating stock: ", error);
    throw error;
  }
};

export const deleteStock = async (id) => {
  if (!firebaseReady) {
    const stock = getLocal(STOCK_COLLECTION);
    saveLocal(STOCK_COLLECTION, stock.filter(s => s.id !== id));
    return;
  }

  try {
    await deleteDoc(doc(db, STOCK_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting stock: ", error);
    throw error;
  }
};

// ==========================================
//  STOCK DEDUCTION
// ==========================================

/**
 * Deduct stock for a single product. Uses exact case-insensitive match on productName.
 */
export const deductStockByProduct = async (productName, quantity) => {
  const stockItems = getLocal(STOCK_COLLECTION);
  const pLower = (productName || '').trim().toLowerCase();

  // Try exact match first, then contains match
  let matchIndex = stockItems.findIndex(item =>
    (item.productName || '').trim().toLowerCase() === pLower
  );

  if (matchIndex === -1) {
    matchIndex = stockItems.findIndex(item =>
      (item.productName || '').trim().toLowerCase().includes(pLower) ||
      pLower.includes((item.productName || '').trim().toLowerCase())
    );
  }

  if (matchIndex === -1) {
    return { found: false };
  }

  const item = stockItems[matchIndex];
  const currentQty = Number(item.quantity) || 0;
  const newQuantity = currentQty - quantity;
  const threshold = Number(item.minThreshold) || 50;

  stockItems[matchIndex] = { ...item, quantity: newQuantity };
  saveLocal(STOCK_COLLECTION, stockItems);

  // Log as sale deduction
  addRestockHistory({
    stockId: item.id,
    productName: item.productName,
    quantityAdded: -quantity,
    newTotal: newQuantity,
    date: new Date().toISOString(),
    type: 'sale'
  });

  try {
    await updateStock(item.id, { quantity: newQuantity });
  } catch (error) {
    console.error("Error syncing stock deduction:", error);
  }

  return {
    found: true,
    item,
    newQuantity,
    warning: newQuantity <= 0,
    lowStock: newQuantity <= threshold && newQuantity > 0
  };
};

/**
 * Deduct stock for multiple items (multi-product bill).
 */
export const deductStockForItems = async (items) => {
  const results = [];
  for (const item of items) {
    const result = await deductStockByProduct(item.product, item.quantity || 1);
    results.push({ ...result, product: item.product });
  }
  return results;
};

// ==========================================
//  RESTOCK HISTORY
// ==========================================

const addRestockHistory = (entry) => {
  const history = getLocal(RESTOCK_HISTORY_KEY);
  history.push({ id: Date.now().toString(), ...entry });
  saveLocal(RESTOCK_HISTORY_KEY, history);
};

export const getRestockHistory = (stockId) => {
  const history = getLocal(RESTOCK_HISTORY_KEY);
  return history
    .filter(h => h.stockId === stockId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getAllRestockHistory = () => {
  return getLocal(RESTOCK_HISTORY_KEY)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};
