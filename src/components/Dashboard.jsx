import { useState, useMemo } from 'react';
import { Search, CalendarDays, FileDown, Share2, PlusCircle } from 'lucide-react';
import { isToday, isThisWeek } from 'date-fns';
import BillingSummary from './BillingSummary';
import CustomerList from './CustomerList';
import { generateBillText, sendWhatsApp, downloadPdfBill } from '../utils/billUtils';

function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'paid', label: 'Paid' },
  { key: 'dues', label: 'Dues' }
];

export default function Dashboard({ customers, stock, onEdit, onDelete, onNotify, onToggleStatus, onGoToStock, onGoToReport, onViewProfile }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = !searchTerm ||
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.product && customer.product.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDate = filterDate ? customer.date.startsWith(filterDate) : true;

      let matchesQuickFilter = true;
      if (activeFilter === 'today') matchesQuickFilter = isToday(new Date(customer.date));
      else if (activeFilter === 'week') matchesQuickFilter = isThisWeek(new Date(customer.date), { weekStartsOn: 1 });
      else if (activeFilter === 'dues') matchesQuickFilter = customer.status === 'due';
      else if (activeFilter === 'paid') matchesQuickFilter = (customer.status || 'paid') !== 'due';

      return matchesSearch && matchesDate && matchesQuickFilter;
    });
  }, [customers, searchTerm, filterDate, activeFilter]);

  const handleBulkPdf = () => {
    if (filteredCustomers.length === 0) { onNotify('No records', 'error'); return; }
    downloadPdfBill(filteredCustomers[0]);
    onNotify(`PDF for ${filteredCustomers[0].name}`, 'success');
  };

  const handleBulkWhatsApp = () => {
    if (filteredCustomers.length === 0) { onNotify('No records', 'error'); return; }
    const result = sendWhatsApp(filteredCustomers[0]);
    if (!result.success) onNotify(result.error, 'error');
    else onNotify(`Bill sent via WhatsApp`, 'success');
  };

  const handleShare = async () => {
    if (filteredCustomers.length === 0) { onNotify('No records', 'error'); return; }
    const text = generateBillText(filteredCustomers[0]);
    if (navigator.share) {
      try { await navigator.share({ title: `Invoice | NatvarNand`, text }); onNotify('Shared!', 'success'); }
      catch (err) { if (err.name !== 'AbortError') onNotify('Share cancelled', 'error'); }
    } else {
      try { await navigator.clipboard.writeText(text); onNotify('Copied to clipboard!', 'success'); }
      catch { onNotify('Not supported', 'error'); }
    }
  };

  return (
    <div className="mt-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800">Business Dashboard</h2>
        </div>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm text-sm">
          <PlusCircle size={16} /> New Sale
        </button>
      </div>

      <BillingSummary customers={customers} stock={stock} onGoToStock={onGoToStock} onGoToReport={onGoToReport} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search name, phone, or product..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm bg-gray-50 hover:bg-white transition-colors" />
              </div>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                {FILTERS.map(f => (
                  <button key={f.key} onClick={() => { setActiveFilter(f.key); setFilterDate(''); }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeFilter === f.key ? 'filter-btn-active' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}>{f.label}</button>
                ))}
              </div>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input type="date" value={filterDate}
                  onChange={(e) => { setFilterDate(e.target.value); setActiveFilter('all'); }}
                  className="pl-10 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm bg-gray-50 hover:bg-white transition-colors w-full sm:w-auto" />
              </div>
              {filterDate && (
                <button onClick={() => setFilterDate('')} className="text-xs text-orange-600 hover:text-orange-800 font-medium self-center underline">Clear</button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              <span className="text-sm text-gray-400 mr-1">{filteredCustomers.length} record{filteredCustomers.length !== 1 ? 's' : ''}</span>
              <button onClick={handleBulkPdf} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3.5 py-2 rounded-xl font-medium text-sm shadow-sm" title="PDF">
                <FileDown size={15} /><span className="hidden sm:inline">PDF</span>
              </button>
              <button onClick={handleBulkWhatsApp} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-xl font-medium text-sm shadow-sm" title="WhatsApp">
                <WhatsAppIcon size={15} /><span className="hidden sm:inline">WhatsApp</span>
              </button>
              <button onClick={handleShare} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-xl font-medium text-sm shadow-sm" title="Share">
                <Share2 size={15} /><span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>
        <div className="p-5 pt-0 mt-3">
          <CustomerList customers={filteredCustomers} onEdit={onEdit} onDelete={onDelete} onNotify={onNotify}
            onToggleStatus={onToggleStatus} onViewProfile={onViewProfile} />
        </div>
      </div>
    </div>
  );
}
