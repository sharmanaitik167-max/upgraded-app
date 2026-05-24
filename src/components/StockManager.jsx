import { useState } from 'react';
import { Package, PlusCircle, Edit2, Trash2, Search, X, AlertTriangle, History } from 'lucide-react';
import { format } from 'date-fns';
import { getRestockHistory } from '../services/customerService';

export default function StockManager({ stock, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showHistoryFor, setShowHistoryFor] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [formData, setFormData] = useState({
    productName: '', brand: '', quantity: '', unit: 'Bags', costPrice: '', supplier: '', minThreshold: ''
  });

  const isLowStock = (item) => Number(item.quantity) <= (Number(item.minThreshold) || 50);

  const resetForm = () => {
    setFormData({ productName: '', brand: '', quantity: '', unit: 'Bags', costPrice: '', supplier: '', minThreshold: '' });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.productName || !formData.quantity) {
      alert("Please fill Product Name and Quantity");
      return;
    }
    const payload = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0,
      minThreshold: formData.minThreshold ? parseFloat(formData.minThreshold) : 50
    };
    if (editingItem) onUpdate(editingItem.id, payload);
    else onAdd(payload);
    resetForm();
  };

  const handleEdit = (item) => {
    setFormData({
      productName: item.productName, brand: item.brand || '', quantity: item.quantity,
      unit: item.unit || 'Bags', costPrice: item.costPrice || '', supplier: item.supplier || '',
      minThreshold: item.minThreshold || ''
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const toggleHistory = (itemId) => {
    if (showHistoryFor === itemId) {
      setShowHistoryFor(null);
      setHistoryData([]);
    } else {
      setShowHistoryFor(itemId);
      setHistoryData(getRestockHistory(itemId));
    }
  };

  const filteredStock = stock.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLow = showLowStockOnly ? isLowStock(item) : true;
    return matchesSearch && matchesLow;
  });

  const totalValue = stock.reduce((sum, item) => sum + ((Number(item.costPrice) || 0) * (Number(item.quantity) || 0)), 0);
  const totalItems = stock.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const lowStockCount = stock.filter(item => isLowStock(item)).length;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const inputClass = "w-full p-3.5 border border-gray-200 rounded-xl outline-none transition-all text-gray-800 placeholder-gray-400 bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 hover:border-gray-300";

  return (
    <div className="mt-4 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800">Stock Inventory</h2>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (editingItem) resetForm(); }}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-sm hover:shadow-md text-base">
          {showForm ? <X size={20} /> : <PlusCircle size={20} />}
          {showForm ? 'Close' : 'Add Stock'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-orange-500 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600"><Package size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Items</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{totalItems.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><span className="text-lg font-bold">₹</span></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Stock Value</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{formatCurrency(totalValue)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-500 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-red-50 text-red-600"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Low Stock</p>
            <p className="text-2xl font-bold text-red-600 mt-0.5">{lowStockCount}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className={`animate-slide-down p-6 md:p-8 rounded-2xl shadow-sm mb-6 border ${editingItem ? 'bg-white border-orange-200 ring-2 ring-orange-100' : 'bg-white border-gray-100'}`}>
          <h3 className="text-lg font-bold mb-5 text-gray-800">
            {editingItem ? <span className="flex items-center gap-2"><span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-lg text-sm font-semibold">EDIT</span> Update Stock Item</span> : 'Add New Stock Item'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Product Name <span className="text-orange-500">*</span></label>
                <input type="text" name="productName" value={formData.productName} onChange={handleChange} required className={inputClass} placeholder="E.g., UltraTech Cement" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Brand</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} className={inputClass} placeholder="Brand name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Supplier</label>
                <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} className={inputClass} placeholder="Supplier (optional)" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Quantity <span className="text-orange-500">*</span></label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="0" required className={inputClass} placeholder="Number of items" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Unit</label>
                <select name="unit" value={formData.unit} onChange={handleChange} className={inputClass}>
                  <option value="Bags">Bags</option><option value="Kg">Kg</option><option value="Pieces">Pieces</option>
                  <option value="Tons">Tons</option><option value="Bundles">Bundles</option><option value="Feet">Feet</option><option value="Meters">Meters</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Cost Price (₹/unit)</label>
                <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} min="0" step="0.01" className={inputClass} placeholder="Price per unit" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Min. Stock Alert</label>
                <input type="number" name="minThreshold" value={formData.minThreshold} onChange={handleChange} min="0" className={inputClass} placeholder="Default: 50" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3.5 px-8 rounded-xl transition-all shadow-sm hover:shadow-md text-base">
                {editingItem ? 'Save Changes' : 'Add to Stock'}
              </button>
              {editingItem && (
                <button type="button" onClick={resetForm} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 px-8 rounded-xl transition-all text-base border border-gray-200">Cancel</button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Stock List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search stock..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm bg-gray-50 hover:bg-white transition-colors" />
            </div>
            <div className="flex items-center gap-3">
              {lowStockCount > 0 && <span className="text-sm text-red-500 font-medium">{lowStockCount} item{lowStockCount !== 1 ? 's' : ''} low</span>}
              <button onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors border ${showLowStockOnly ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                <AlertTriangle size={14} /> Low Stock
              </button>
            </div>
          </div>
        </div>

        {filteredStock.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Package size={28} className="text-gray-400" /></div>
            <p className="text-gray-500 text-base font-medium">No stock items found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-500 uppercase text-xs tracking-wider">
                    <th className="px-5 py-3.5 font-semibold border-b border-gray-100">Product</th>
                    <th className="px-5 py-3.5 font-semibold border-b border-gray-100">Qty</th>
                    <th className="px-5 py-3.5 font-semibold border-b border-gray-100">Cost/Unit</th>
                    <th className="px-5 py-3.5 font-semibold border-b border-gray-100">Value</th>
                    <th className="px-5 py-3.5 font-semibold border-b border-gray-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-800">{item.productName}</span>
                        {item.brand && <span className="text-xs text-gray-400 ml-2">({item.brand})</span>}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span className={`font-semibold ${isLowStock(item) ? 'text-red-600' : 'text-gray-800'}`}>{item.quantity}</span>
                        <span className="text-gray-400 ml-1 text-xs">{item.unit}</span>
                        {isLowStock(item) && <span className="ml-2 text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md font-medium">Low</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{formatCurrency(item.costPrice || 0)}</td>
                      <td className="px-5 py-4 font-bold text-gray-800">{formatCurrency((Number(item.costPrice) || 0) * (Number(item.quantity) || 0))}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => toggleHistory(item.id)} className={`p-2 rounded-lg transition-colors ${showHistoryFor === item.id ? 'text-orange-600 bg-orange-50' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'}`} title="History">
                            <History size={16} />
                          </button>
                          <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-orange-600 p-2 hover:bg-orange-50 rounded-lg transition-colors" title="Edit"><Edit2 size={16} /></button>
                          <button onClick={() => { if (window.confirm('Delete?')) onDelete(item.id); }} className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* History Panel (desktop) */}
              {showHistoryFor && (
                <div className="mx-5 mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 animate-slide-down">
                  <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2"><History size={14} /> Stock History</h4>
                  {historyData.length === 0 ? (
                    <p className="text-xs text-amber-600">No history recorded yet</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {historyData.map((h) => (
                        <div key={h.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 text-xs border border-amber-100">
                          <span className="text-gray-500">{format(new Date(h.date), 'dd MMM yyyy, hh:mm a')}</span>
                          <span className={`font-semibold ${h.type === 'sale' ? 'text-red-600' : 'text-green-600'}`}>
                            {h.type === 'sale' ? '−' : '+'}{Math.abs(h.quantityAdded)}
                          </span>
                          <span className="text-gray-600 font-medium">→ {h.newTotal} remaining</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${h.type === 'sale' ? 'bg-red-50 text-red-600' : h.type === 'initial' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                            {h.type === 'sale' ? 'Sale' : h.type === 'initial' ? 'Initial' : 'Restock'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-4">
              {filteredStock.map((item) => (
                <div key={item.id}>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{item.productName}</h4>
                        {item.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-base ${isLowStock(item) ? 'text-red-600' : 'text-gray-800'}`}>
                          {item.quantity} <span className="text-xs text-gray-400">{item.unit}</span>
                        </span>
                        {isLowStock(item) && <span className="ml-1 text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md font-medium">Low</span>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                      <span className="text-sm font-medium text-orange-600">{formatCurrency((Number(item.costPrice) || 0) * (Number(item.quantity) || 0))}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleHistory(item.id)} className={`p-2 rounded-lg ${showHistoryFor === item.id ? 'text-orange-600 bg-white' : 'text-gray-400 hover:bg-white'}`}><History size={16} /></button>
                        <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-orange-600 p-2 hover:bg-white rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => { if (window.confirm('Delete?')) onDelete(item.id); }} className="text-gray-400 hover:text-red-600 p-2 hover:bg-white rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                  {showHistoryFor === item.id && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-1 animate-slide-down">
                      <h4 className="text-xs font-bold text-amber-800 mb-2">History</h4>
                      {historyData.length === 0 ? <p className="text-xs text-amber-600">No history</p> : (
                        <div className="space-y-1.5">
                          {historyData.map((h) => (
                            <div key={h.id} className="flex justify-between items-center bg-white rounded px-2 py-1.5 text-xs border border-amber-100">
                              <span className="text-gray-500">{format(new Date(h.date), 'dd MMM')}</span>
                              <span className={h.type === 'sale' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                {h.type === 'sale' ? '−' : '+'}{Math.abs(h.quantityAdded)}
                              </span>
                              <span className="text-gray-600">→ {h.newTotal}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
