import { useState } from 'react';

export default function EditCustomerForm({ initialData, onSubmit, onNotify }) {
  const [formData, setFormData] = useState({
    ...initialData,
    quantity: initialData.quantity || 1,
    status: initialData.status || 'paid'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.product || !formData.amount) {
      onNotify('Fill all required fields', 'error');
      return;
    }
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      quantity: parseInt(formData.quantity) || 1
    });
  };

  const inputClass = "w-full p-3.5 border border-gray-200 rounded-xl outline-none transition-all text-gray-800 placeholder-gray-400 bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-300";

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
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${formData.status === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Paid ✅</button>
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, status: 'due' }))}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${formData.status === 'due' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Due ⏳</button>
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