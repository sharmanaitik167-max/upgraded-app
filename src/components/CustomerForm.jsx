import { useState, useRef, useEffect, useMemo } from 'react';
import { PlusCircle, RotateCcw, CalendarDays, X, ChevronDown } from 'lucide-react';
import { getUniqueCustomers } from '../services/customerService';

export default function CustomerForm({ onSubmit, onNotify, existingCustomers = [], stockItems = [] }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const emptyItem = { product: '', quantity: '1', pricePerUnit: '', lineTotal: 0 };

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [entryDate, setEntryDate] = useState(todayStr);
  const [status, setStatus] = useState('paid');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [errors, setErrors] = useState({});
  const [customerHint, setCustomerHint] = useState(null);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [activeProductDropdown, setActiveProductDropdown] = useState(-1);
  const [productSearch, setProductSearch] = useState({});
  const nameRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Unique customers for auto-suggest
  const uniqueCustomers = useMemo(() => getUniqueCustomers(existingCustomers), [existingCustomers]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handle = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          nameRef.current && !nameRef.current.contains(e.target)) {
        setShowNameSuggestions(false);
      }
      // Close product dropdowns
      if (!e.target.closest('.product-dropdown-container')) {
        setActiveProductDropdown(-1);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Customer name change handler
  const handleNameChange = (val) => {
    setName(val);
    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));

    if (val.trim().length > 0) {
      const q = val.trim().toLowerCase();
      const matches = uniqueCustomers.filter(c => c.name.toLowerCase().includes(q)).slice(0, 5);
      setNameSuggestions(matches);
      setShowNameSuggestions(matches.length > 0);

      // Show existing customer hint
      const exactMatch = uniqueCustomers.find(c => c.name.toLowerCase() === q);
      if (exactMatch) {
        setCustomerHint(`Existing customer found: ${exactMatch.name} (${exactMatch.billCount} bill${exactMatch.billCount !== 1 ? 's' : ''})`);
      } else {
        setCustomerHint(null);
      }
    } else {
      setNameSuggestions([]);
      setShowNameSuggestions(false);
      setCustomerHint(null);
    }
  };

  const selectCustomerSuggestion = (cust) => {
    setName(cust.name);
    setPhone(cust.phone || '');
    setShowNameSuggestions(false);
    setCustomerHint(`Existing customer: ${cust.name} (${cust.billCount} bill${cust.billCount !== 1 ? 's' : ''})`);
  };

  // Item handlers
  const updateItem = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-calculate lineTotal
      const qty = parseFloat(updated[index].quantity) || 0;
      const price = parseFloat(updated[index].pricePerUnit) || 0;
      updated[index].lineTotal = Math.round(qty * price * 100) / 100;

      return updated;
    });
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { ...emptyItem }]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const selectStockProduct = (index, stockItem) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        product: stockItem.productName,
        pricePerUnit: String(stockItem.costPrice || ''),
        lineTotal: (parseFloat(updated[index].quantity) || 1) * (stockItem.costPrice || 0)
      };
      return updated;
    });
    setActiveProductDropdown(-1);
    setProductSearch({});
  };

  const getFilteredStock = (index) => {
    const search = (productSearch[index] || items[index]?.product || '').toLowerCase();
    if (!search) return stockItems;
    return stockItems.filter(s =>
      (s.productName || '').toLowerCase().includes(search)
    );
  };

  // Grand total
  const grandTotal = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  const totalQty = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Customer name is required';
    items.forEach((item, i) => {
      if (!item.product.trim()) newErrors[`product_${i}`] = 'Product required';
    });
    if (grandTotal <= 0 && items.every(i => !i.lineTotal)) newErrors.amount = 'Enter valid amounts';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e, addAnother = false) => {
    e.preventDefault();
    if (!validate()) {
      onNotify('Please fill all required fields', 'error');
      return;
    }

    const cleanItems = items.map(item => ({
      product: item.product.trim(),
      quantity: parseInt(item.quantity) || 1,
      pricePerUnit: parseFloat(item.pricePerUnit) || 0,
      lineTotal: item.lineTotal || 0
    }));

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      entryDate,
      items: cleanItems,
      product: cleanItems.map(i => i.product).join(', '),
      amount: grandTotal || cleanItems.reduce((s, i) => s + i.lineTotal, 0),
      quantity: totalQty || cleanItems.reduce((s, i) => s + i.quantity, 0),
      status
    });

    // Reset
    setName('');
    setPhone('');
    setEntryDate(todayStr);
    setStatus('paid');
    setItems([{ ...emptyItem }]);
    setErrors({});
    setCustomerHint(null);
    setProductSearch({});
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEntryDate(todayStr);
    setStatus('paid');
    setItems([{ ...emptyItem }]);
    setErrors({});
    setCustomerHint(null);
    setProductSearch({});
  };

  const inputClass = (field) =>
    `w-full p-3 border rounded-xl outline-none transition-all text-gray-800 placeholder-gray-400 text-sm ${
      errors[field]
        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
        : 'border-gray-200 bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 hover:border-gray-300'
    }`;

  return (
    <div className="bg-white p-5 md:p-7 rounded-2xl shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
          New Entry
        </h2>
        <button type="button" onClick={resetForm}
          className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Reset form">
          <RotateCcw size={18} />
        </button>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
        {/* Customer Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Customer Name with auto-suggest */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Customer Name <span className="text-orange-500">*</span>
            </label>
            <input ref={nameRef} type="text" value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => { if (nameSuggestions.length > 0) setShowNameSuggestions(true); }}
              autoComplete="off" className={inputClass('name')} placeholder="Enter customer name" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            {customerHint && !showNameSuggestions && (
              <p className="text-xs text-green-600 mt-1 font-medium">✓ {customerHint}</p>
            )}

            {showNameSuggestions && nameSuggestions.length > 0 && (
              <div ref={suggestionsRef}
                className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {nameSuggestions.map((cust, idx) => (
                  <button key={idx} type="button" onClick={() => selectCustomerSuggestion(cust)}
                    className="w-full text-left px-3 py-2 hover:bg-orange-50 transition-colors flex items-center justify-between gap-2 border-b border-gray-50 last:border-b-0">
                    <span className="font-medium text-gray-800 text-sm truncate">{cust.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{cust.billCount} bill{cust.billCount !== 1 ? 's' : ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Phone <span className="text-gray-400 text-xs font-normal">(optional)</span>
            </label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className={inputClass('phone')} placeholder="Phone number" />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
              <CalendarDays size={12} /> Date
            </label>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)}
              className={inputClass('entryDate')} />
          </div>
        </div>

        {/* Product Lines */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-600">Product Lines</label>
            <button type="button" onClick={addItemRow}
              className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 px-2 py-1 hover:bg-orange-50 rounded-lg transition-colors">
              <PlusCircle size={14} /> Add Product
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                {/* Product */}
                <div className="col-span-12 sm:col-span-4 relative product-dropdown-container">
                  <label className="block text-xs text-gray-500 mb-0.5">Product <span className="text-orange-500">*</span></label>
                  <input type="text" value={item.product}
                    onChange={(e) => {
                      updateItem(index, 'product', e.target.value);
                      setProductSearch(prev => ({ ...prev, [index]: e.target.value }));
                      setActiveProductDropdown(index);
                    }}
                    onFocus={() => setActiveProductDropdown(index)}
                    autoComplete="off"
                    className={`w-full p-2.5 border rounded-lg outline-none text-sm ${errors[`product_${index}`] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white focus:ring-2 focus:ring-orange-400'}`}
                    placeholder="Select or type product" />
                  {activeProductDropdown === index && getFilteredStock(index).length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {getFilteredStock(index).map((s) => (
                        <button key={s.id} type="button" onClick={() => selectStockProduct(index, s)}
                          className="w-full text-left px-3 py-2 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-b-0 flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-800">{s.productName}</span>
                          <span className="text-xs text-gray-400">₹{s.costPrice}/{s.unit || 'unit'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-0.5">Qty</label>
                  <input type="number" value={item.quantity} min="1"
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg outline-none text-sm bg-white focus:ring-2 focus:ring-orange-400"
                    placeholder="1" />
                </div>

                {/* Price/Unit */}
                <div className="col-span-4 sm:col-span-3">
                  <label className="block text-xs text-gray-500 mb-0.5">Price/Unit (₹)</label>
                  <input type="number" value={item.pricePerUnit} min="0" step="0.01"
                    onChange={(e) => updateItem(index, 'pricePerUnit', e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg outline-none text-sm bg-white focus:ring-2 focus:ring-orange-400"
                    placeholder="₹" />
                </div>

                {/* Line Total */}
                <div className="col-span-3 sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-0.5">Total</label>
                  <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-sm font-bold text-orange-700 text-right">
                    ₹{new Intl.NumberFormat('en-IN').format(item.lineTotal || 0)}
                  </div>
                </div>

                {/* Remove button */}
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItemRow(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-4">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Grand Total */}
          <div className="flex justify-end mt-3">
            <div className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-base">
              Grand Total: ₹{new Intl.NumberFormat('en-IN').format(grandTotal)}
            </div>
          </div>
        </div>

        {/* Status Toggle */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Status</label>
          <div className="flex rounded-xl overflow-hidden border border-gray-200 w-fit">
            <button type="button" onClick={() => setStatus('paid')}
              className={`px-5 py-2 text-sm font-semibold transition-all ${
                status === 'paid' ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}>
              ✅ Paid
            </button>
            <button type="button" onClick={() => setStatus('due')}
              className={`px-5 py-2 text-sm font-semibold transition-all ${
                status === 'due' ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}>
              ⏳ Due
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button type="submit"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold py-3 px-7 rounded-xl transition-all shadow-sm hover:shadow-md text-sm">
            <PlusCircle size={18} /> Save Entry
          </button>
          <button type="button" onClick={(e) => handleSubmit(e, true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-7 rounded-xl transition-all text-sm border border-gray-200">
            <PlusCircle size={18} /> Save & Add New
          </button>
        </div>
      </form>
    </div>
  );
}
