import { format } from 'date-fns';
import { X, Phone, Edit2, Trash2, CheckCircle, User } from 'lucide-react';
import { normalizeEntry } from '../services/customerService';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function CustomerProfile({ group, onClose, onToggleStatus, onMarkAllPaid, onEdit, onDelete, onNotify }) {
  if (!group) return null;

  const handleMarkAllPaid = () => {
    if (window.confirm(`Mark all ${group.billCount} bills as Paid for ${group.customerName}?`)) {
      onMarkAllPaid(group.bills);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-10 sm:pt-20 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <User size={22} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{group.customerName}</h2>
                {group.customerPhone && (
                  <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                    <Phone size={12} /> {group.customerPhone}
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <p className="text-xs text-blue-500 font-semibold">Total Bills</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{group.billCount}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
            <p className="text-xs text-orange-500 font-semibold">Total Amount</p>
            <p className="text-xl font-bold text-orange-700 mt-1">{formatCurrency(group.totalAmount)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <p className="text-xs text-green-500 font-semibold">Paid</p>
            <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(group.totalPaid)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
            <p className="text-xs text-red-500 font-semibold">Due</p>
            <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(group.totalDue)}</p>
          </div>
        </div>

        {/* Mark All Paid */}
        {group.totalDue > 0 && (
          <div className="px-5 pb-3">
            <button
              onClick={handleMarkAllPaid}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow-md text-sm"
            >
              <CheckCircle size={18} />
              Mark All Bills as Paid ({formatCurrency(group.totalDue)} due)
            </button>
          </div>
        )}

        {/* Bills List */}
        <div className="px-5 pb-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">All Bills</h3>
          <div className="space-y-2">
            {group.bills.map((bill) => {
              const n = normalizeEntry(bill);
              const products = n.items.map(i => i.product).join(', ');
              const isPaid = (bill.status || 'paid') !== 'due';

              return (
                <div key={bill.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{products}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{format(new Date(bill.date), 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {isPaid ? 'Paid' : 'Due'}
                      </span>
                      <span className="font-bold text-gray-800 text-sm">{formatCurrency(bill.amount)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => onToggleStatus(bill.id, bill.status === 'due' ? 'paid' : 'due')}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${
                        bill.status === 'due'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {bill.status === 'due' ? '✅ Mark Paid' : 'Mark Due'}
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(bill)} className="text-gray-400 hover:text-orange-600 p-1.5 rounded-lg hover:bg-white transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => { if (window.confirm('Delete this bill?')) onDelete(bill.id); }}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-white transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
