import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Edit2, Trash2, Phone, Package, FileDown, Share2, ChevronDown, ChevronUp, User } from 'lucide-react';
import { sendWhatsApp, downloadPdfBill, shareViaNativeShare } from '../utils/billUtils';
import { groupCustomerEntries, normalizeEntry } from '../services/customerService';

// WhatsApp green SVG icon
function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function StatusBadge({ status }) {
  const isPaid = (status || 'paid') !== 'due';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
      isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {isPaid ? 'Paid' : 'Due'}
    </span>
  );
}

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function CustomerList({ customers, onEdit, onDelete, onNotify, onToggleStatus, onViewProfile }) {
  const [expandedGroups, setExpandedGroups] = useState({});

  const groups = useMemo(() => groupCustomerEntries(customers), [customers]);

  const toggleGroup = (index) => {
    setExpandedGroups(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleWhatsApp = (bill) => {
    const result = sendWhatsApp(bill);
    if (!result.success) onNotify(result.error, 'error');
    else onNotify(`Bill sent to ${bill.name} via WhatsApp`, 'success');
  };

  const handlePdf = (bill) => {
    downloadPdfBill(bill);
    onNotify(`PDF generated for ${bill.name}`, 'success');
  };

  const handleShare = async (bill) => {
    const result = await shareViaNativeShare(bill);
    if (result.success) onNotify(result.fallback ? 'Copied to clipboard!' : 'Shared!', 'success');
    else onNotify(result.error, 'error');
  };

  if (customers.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-500 text-base font-medium">No entries found</p>
        <p className="text-gray-400 text-sm mt-1">Add your first customer entry above</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {groups.map((group, groupIndex) => {
        const isExpanded = expandedGroups[groupIndex] !== false; // default expanded
        const productTags = (bill) => {
          const n = normalizeEntry(bill);
          return n.items.map(i => i.product);
        };

        return (
          <div key={`group-${groupIndex}`} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            {/* GROUP HEADER */}
            <div
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleGroup(groupIndex)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-orange-600" />
                </div>
                <div>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (onViewProfile) onViewProfile(group); }}
                    className="font-bold text-gray-800 text-sm hover:text-orange-600 transition-colors text-left"
                  >
                    {group.customerName}
                  </button>
                  <div className="flex items-center gap-2 mt-0.5">
                    {group.customerPhone && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone size={10} /> {group.customerPhone}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{group.billCount} bill{group.billCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="font-bold text-gray-800 text-sm">{formatCurrency(group.totalAmount)}</p>
                  <div className="flex gap-2 text-xs mt-0.5">
                    {group.totalPaid > 0 && <span className="text-green-600">✅ {formatCurrency(group.totalPaid)}</span>}
                    {group.totalDue > 0 && <span className="text-red-600">⏳ {formatCurrency(group.totalDue)}</span>}
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </div>

            {/* Mobile summary (visible on small screens) */}
            <div className="sm:hidden px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="font-bold text-gray-800 text-sm">{formatCurrency(group.totalAmount)}</span>
              <div className="flex gap-2 text-xs">
                {group.totalPaid > 0 && <span className="text-green-600">Paid: {formatCurrency(group.totalPaid)}</span>}
                {group.totalDue > 0 && <span className="text-red-600">Due: {formatCurrency(group.totalDue)}</span>}
              </div>
            </div>

            {/* BILLS LIST */}
            {isExpanded && (
              <div>
                {/* Desktop */}
                <div className="hidden md:block">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-gray-500 uppercase text-xs tracking-wider bg-gray-50/50">
                        <th className="px-4 py-2 font-semibold">Date</th>
                        <th className="px-4 py-2 font-semibold">Products</th>
                        <th className="px-4 py-2 font-semibold text-right">Amount</th>
                        <th className="px-4 py-2 font-semibold text-center">Status</th>
                        <th className="px-4 py-2 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.bills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-orange-50/30 transition-colors border-t border-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-700">{format(new Date(bill.date), 'dd MMM yyyy')}</div>
                            <div className="text-xs text-gray-400">{format(new Date(bill.date), 'hh:mm a')}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {productTags(bill).map((tag, ti) => (
                                <span key={ti} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{tag}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-gray-800">{formatCurrency(bill.amount)}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <StatusBadge status={bill.status} />
                              <button
                                onClick={() => onToggleStatus(bill.id, bill.status === 'due' ? 'paid' : 'due')}
                                className={`text-xs font-medium px-2 py-0.5 rounded-md transition-colors ${
                                  bill.status === 'due'
                                    ? 'text-green-600 hover:bg-green-50'
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                              >
                                {bill.status === 'due' ? 'Mark Paid' : 'Mark Due'}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <button onClick={() => handleWhatsApp(bill)} className="text-green-600 hover:text-green-700 p-1.5 hover:bg-green-50 rounded-lg transition-colors" title="WhatsApp">
                                <WhatsAppIcon size={14} />
                              </button>
                              <button onClick={() => handlePdf(bill)} className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="PDF">
                                <FileDown size={14} />
                              </button>
                              <button onClick={() => handleShare(bill)} className="text-gray-400 hover:text-orange-600 p-1.5 hover:bg-orange-50 rounded-lg transition-colors" title="Share">
                                <Share2 size={14} />
                              </button>
                              <button onClick={() => onEdit(bill)} className="text-gray-400 hover:text-orange-600 p-1.5 hover:bg-orange-50 rounded-lg transition-colors" title="Edit">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => { if (window.confirm(`Delete this entry?`)) onDelete(bill.id); }}
                                className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="md:hidden space-y-2 p-3">
                  {group.bills.map((bill) => (
                    <div key={bill.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {productTags(bill).map((tag, ti) => (
                              <span key={ti} className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded-md border border-gray-100">{tag}</span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">{format(new Date(bill.date), 'dd MMM yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={bill.status} />
                          <span className="font-bold text-orange-600">{formatCurrency(bill.amount)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
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
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => handleWhatsApp(bill)} className="text-green-600 p-1.5 hover:bg-white rounded-lg"><WhatsAppIcon size={14} /></button>
                          <button onClick={() => handlePdf(bill)} className="text-gray-400 p-1.5 hover:bg-white rounded-lg"><FileDown size={14} /></button>
                          <button onClick={() => onEdit(bill)} className="text-gray-400 p-1.5 hover:bg-white rounded-lg"><Edit2 size={14} /></button>
                          <button onClick={() => { if (window.confirm(`Delete?`)) onDelete(bill.id); }} className="text-gray-400 p-1.5 hover:bg-white rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* GROUP SUMMARY */}
                {group.billCount > 1 && (
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs font-semibold">
                    <span className="text-gray-500">Total: {formatCurrency(group.totalAmount)}</span>
                    <div className="flex gap-3">
                      <span className="text-green-600">Paid: {formatCurrency(group.totalPaid)}</span>
                      <span className="text-red-600">Due: {formatCurrency(group.totalDue)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
