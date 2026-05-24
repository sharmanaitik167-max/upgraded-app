import { useState, useEffect, useCallback } from 'react';
import { PhoneCall, Users, Warehouse, Menu, X, ClipboardList } from 'lucide-react';
import CustomerForm from './components/CustomerForm';
import Dashboard from './components/Dashboard';
import StockManager from './components/StockManager';
import DailyReport from './components/DailyReport';
import CustomerProfile from './components/CustomerProfile';
import Toast from './components/Toast';
import {
  getCustomers, addCustomer, updateCustomer, deleteCustomer,
  getStock, addStock, updateStock, deleteStock,
  updatePaymentStatus, deductStockForItems, markAllCustomerBillsPaid
} from './services/customerService';

function App() {
  const [customers, setCustomers] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('sales');
  const [toasts, setToasts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileGroup, setProfileGroup] = useState(null);

  const notify = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [customerData, stockData] = await Promise.all([getCustomers(), getStock()]);
      setCustomers(customerData);
      setStock(stockData);
    } catch (error) {
      console.error("Error loading data", error);
      notify("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Customer Handlers ---
  const handleAddSubmit = async (data) => {
    if (editingCustomer) {
      try {
        await updateCustomer(editingCustomer.id, data);
        setEditingCustomer(null);
        const updated = await getCustomers();
        setCustomers(updated);
        notify("Entry updated!");
      } catch { notify("Failed to update", "error"); }
    } else {
      try {
        await addCustomer(data);

        // Multi-product stock deduction
        const itemsToDeduct = data.items && data.items.length > 0
          ? data.items
          : [{ product: data.product, quantity: data.quantity || 1 }];

        const results = await deductStockForItems(itemsToDeduct);

        const warnings = results.filter(r => r.found && (r.warning || r.lowStock));
        const found = results.filter(r => r.found);

        if (warnings.length > 0) {
          warnings.forEach(w => {
            notify(`⚠️ Stock low! "${w.item.productName}" → ${w.newQuantity} left`, 'error');
          });
        } else if (found.length > 0) {
          notify(`Entry saved! Stock updated for ${found.length} product${found.length > 1 ? 's' : ''}`);
        } else {
          notify("Entry saved!");
        }

        const [updatedC, updatedS] = await Promise.all([getCustomers(), getStock()]);
        setCustomers(updatedC);
        setStock(updatedS);
      } catch { notify("Failed to add entry", "error"); }
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      notify("Entry deleted");
    } catch { notify("Failed to delete", "error"); }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setProfileGroup(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (id, newStatus) => {
    try {
      await updatePaymentStatus(id, newStatus);
      const updated = await getCustomers();
      setCustomers(updated);
      notify(`Payment marked as ${newStatus === 'paid' ? 'Paid ✅' : 'Due ⏳'}`);
    } catch { notify("Failed to update status", "error"); }
  };

  const handleMarkAllPaid = async (bills) => {
    try {
      await markAllCustomerBillsPaid(bills);
      const updated = await getCustomers();
      setCustomers(updated);
      setProfileGroup(null);
      notify(`All bills marked as Paid ✅`);
    } catch { notify("Failed to update", "error"); }
  };

  // --- Stock Handlers ---
  const handleAddStock = async (data) => {
    try {
      await addStock(data);
      const updated = await getStock();
      setStock(updated);
      notify("Stock item added!");
    } catch { notify("Failed to add stock", "error"); }
  };

  const handleUpdateStock = async (id, data) => {
    try {
      await updateStock(id, data);
      const updated = await getStock();
      setStock(updated);
      notify("Stock updated!");
    } catch { notify("Failed to update stock", "error"); }
  };

  const handleDeleteStock = async (id) => {
    try {
      await deleteStock(id);
      setStock(prev => prev.filter(s => s.id !== id));
      notify("Stock deleted");
    } catch { notify("Failed to delete stock", "error"); }
  };

  const goToStock = () => { setActiveTab('stock'); setMobileMenuOpen(false); };
  const goToReport = () => { setActiveTab('report'); setMobileMenuOpen(false); };

  const tabs = [
    { key: 'sales', label: 'Sales & Customers', icon: <Users size={18} /> },
    { key: 'stock', label: 'Stock Inventory', icon: <Warehouse size={18} /> },
    { key: 'report', label: 'Daily Report', icon: <ClipboardList size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* HEADER */}
      <header className="bg-gray-900 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="NatvarNand" className="w-11 h-11 rounded-xl object-cover shadow-lg" />
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight leading-tight">NatvarNand</h1>
                <p className="text-gray-400 text-xs font-medium tracking-wide">Cement & Building Materials</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-5">
              <div className="text-right">
                <p className="text-xs text-gray-400">Proprietor</p>
                <p className="text-sm font-semibold text-gray-200">Pradeep Kumar Sharma</p>
              </div>
              <a href="tel:9460004889" className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-xl transition-colors font-semibold text-sm shadow-md">
                <PhoneCall size={16} /> 9460004889
              </a>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-800 pt-3 animate-slide-down">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-300"><span className="text-gray-500">Proprietor:</span> Pradeep Kumar Sharma</p>
                <a href="tel:9460004889" className="flex items-center gap-2 bg-orange-600 px-3 py-1.5 rounded-lg text-sm font-semibold">
                  <PhoneCall size={14} /> 9460004889
                </a>
              </div>
            </div>
          )}
          <div className="flex border-t border-gray-800 -mb-px overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setMobileMenuOpen(false); }}
                className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.key ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}>
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-orange-600"></div>
            <p className="text-gray-400 text-sm">Loading data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'sales' && (
              <>
                {editingCustomer ? (
                  <div className="animate-slide-down bg-orange-50 p-4 rounded-xl border border-orange-200 mb-6 flex justify-between items-center">
                    <p className="text-orange-800 font-semibold text-sm">✏️ Editing: <strong>{editingCustomer.name}</strong></p>
                    <button onClick={() => setEditingCustomer(null)}
                      className="text-sm bg-white text-orange-600 px-3 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-100 font-medium">Cancel</button>
                  </div>
                ) : null}

                {editingCustomer ? (
                  <EditCustomerForm initialData={editingCustomer} onSubmit={handleAddSubmit} onNotify={notify} />
                ) : (
                  <CustomerForm onSubmit={handleAddSubmit} onNotify={notify} existingCustomers={customers} stockItems={stock} />
                )}

                <Dashboard customers={customers} stock={stock} onEdit={handleEdit} onDelete={handleDelete}
                  onNotify={notify} onToggleStatus={handleToggleStatus} onGoToStock={goToStock} onGoToReport={goToReport}
                  onViewProfile={(group) => setProfileGroup(group)} />
              </>
            )}

            {activeTab === 'stock' && (
              <StockManager stock={stock} onAdd={handleAddStock} onUpdate={handleUpdateStock} onDelete={handleDeleteStock} />
            )}

            {activeTab === 'report' && (
              <DailyReport customers={customers} stock={stock} />
            )}
          </>
        )}
      </main>

      {/* Customer Profile Modal */}
      {profileGroup && (
        <CustomerProfile group={profileGroup} onClose={() => setProfileGroup(null)}
          onToggleStatus={handleToggleStatus} onMarkAllPaid={handleMarkAllPaid}
          onEdit={handleEdit} onDelete={handleDelete} onNotify={notify} />
      )}

      {/* Toasts */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}

// Edit form
function EditCustomerForm({ initialData, onSubmit, onNotify }) {
  const [formData, setFormData] = useState({
    ...initialData, quantity: initialData.quantity || 1, status: initialData.status || 'paid'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.product || !formData.amount) {
      onNotify('Fill all required fields', 'error'); return;
    }
    onSubmit({ ...formData, amount: parseFloat(formData.amount), quantity: parseInt(formData.quantity) || 1 });
  };

  const inputClass = "w-full p-3.5 border border-gray-200 rounded-xl outline-none transition-all text-gray-800 placeholder-gray-400 bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 hover:border-gray-300";

  return (
    <div className="animate-fade-in-up bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-orange-200 mb-8 ring-2 ring-orange-100">
      <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <span className="bg-orange-100 text-orange-800 px-2.5 py-1 rounded-lg text-sm font-semibold">EDIT</span> Update Entry
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Customer Name <span className="text-orange-500">*</span></label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Phone <span className="text-gray-400 text-xs">(optional)</span></label>
            <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Product <span className="text-orange-500">*</span></label>
            <input type="text" name="product" value={formData.product} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Amount (₹) <span className="text-orange-500">*</span></label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} min="0" step="0.01" required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Quantity</label>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Payment Status</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, status: 'paid' }))}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${formData.status === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>✅ Paid</button>
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, status: 'due' }))}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${formData.status === 'due' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>⏳ Due</button>
            </div>
          </div>
        </div>
        <div className="pt-2">
          <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3.5 px-8 rounded-xl transition-all shadow-sm hover:shadow-md text-base">Save Changes</button>
        </div>
      </form>
    </div>
  );
}

export default App;
