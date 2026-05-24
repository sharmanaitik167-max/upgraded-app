import { useState, useMemo } from 'react';
import { CalendarDays, Copy, Share2, Package, TrendingUp, ClipboardList, AlertTriangle } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

// WhatsApp icon
function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function DailyReport({ customers, stock }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [copied, setCopied] = useState(false);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const formatCurrencyPlain = (amount) =>
    '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);

  const dayCustomers = useMemo(() => {
    const target = new Date(selectedDate + 'T00:00:00');
    return customers.filter(c => isSameDay(new Date(c.date), target));
  }, [customers, selectedDate]);

  const summary = useMemo(() => {
    let totalSales = 0, collected = 0, pending = 0;
    dayCustomers.forEach(c => {
      const amount = Number(c.amount) || 0;
      totalSales += amount;
      // Entries without status field treated as paid (collected)
      if (c.status === 'due') pending += amount;
      else collected += amount;
    });
    return { totalSales, billCount: dayCustomers.length, collected, pending };
  }, [dayCustomers]);

  const itemsSold = useMemo(() => {
    const map = {};
    dayCustomers.forEach(c => {
      const product = c.product || 'Other';
      if (!map[product]) map[product] = { qty: 0, amount: 0 };
      map[product].qty += Number(c.quantity) || 1;
      map[product].amount += Number(c.amount) || 0;
    });
    return Object.entries(map).map(([product, data]) => ({ product, ...data }));
  }, [dayCustomers]);

  const lowStockItems = useMemo(() => {
    return (stock || []).filter(item => Number(item.quantity) <= (Number(item.minThreshold) || 50));
  }, [stock]);

  const generateReportText = () => {
    const dateStr = format(new Date(selectedDate + 'T00:00:00'), 'dd MMM yyyy');
    let text = `📊 NatvarNand — Daily Report\n📅 Date: ${dateStr}\n\n`;
    text += `💰 Total Sales: ${formatCurrencyPlain(summary.totalSales)}\n`;
    text += `🧾 Bills: ${summary.billCount}\n`;
    text += `✅ Collected: ${formatCurrencyPlain(summary.collected)}\n`;
    text += `⏳ Pending: ${formatCurrencyPlain(summary.pending)}\n`;
    if (itemsSold.length > 0) {
      text += `\n📦 Items Sold:\n`;
      itemsSold.forEach(item => { text += `- ${item.product}: ${item.qty} units — ${formatCurrencyPlain(item.amount)}\n`; });
    }
    if (lowStockItems.length > 0) {
      text += `\n⚠️ Low Stock:\n`;
      lowStockItems.forEach(item => { text += `- ${item.productName}: ${item.quantity} remaining\n`; });
    }
    text += `\n— NatvarNand | 9460004889`;
    return text;
  };

  const handleCopyShare = async () => {
    const text = generateReportText();
    if (navigator.share) {
      try { await navigator.share({ title: 'NatvarNand — Daily Report', text }); return; }
      catch (err) { if (err.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    const text = generateReportText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const summaryCards = [
    { label: 'Total Sales', value: formatCurrency(summary.totalSales), icon: <TrendingUp size={22} />, iconBg: 'bg-orange-50', iconColor: 'text-orange-600', accent: 'border-l-orange-500' },
    { label: 'Bills', value: summary.billCount, icon: <ClipboardList size={22} />, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', accent: 'border-l-blue-500' },
    { label: 'Collected', value: formatCurrency(summary.collected), icon: <Package size={22} />, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', accent: 'border-l-emerald-500' },
    { label: 'Pending', value: formatCurrency(summary.pending), icon: <AlertTriangle size={22} />, iconBg: 'bg-red-50', iconColor: 'text-red-600', accent: 'border-l-red-500' }
  ];

  return (
    <div className="mt-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800">Daily Report</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm bg-gray-50 hover:bg-white transition-colors" />
          </div>
          {/* WhatsApp Share */}
          <button onClick={handleWhatsAppShare}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm">
            <WhatsAppIcon size={16} /> WhatsApp
          </button>
          {/* Copy/Share */}
          <button onClick={handleCopyShare}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm">
            {navigator.share ? <Share2 size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : navigator.share ? 'Share' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label}
            className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 ${card.accent} flex items-center gap-4 hover:shadow-md transition-shadow`}>
            <div className={`p-3 rounded-xl ${card.iconBg} ${card.iconColor}`}>{card.icon}</div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Items Sold */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Package size={18} className="text-orange-600" /> Items Sold</h3>
        </div>
        {itemsSold.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><Package size={24} className="text-gray-400" /></div>
            <p className="text-gray-500 text-sm">No sales on this date</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-500 uppercase text-xs tracking-wider">
                    <th className="px-5 py-3.5 font-semibold border-b border-gray-100">Product</th>
                    <th className="px-5 py-3.5 font-semibold border-b border-gray-100 text-right">Qty</th>
                    <th className="px-5 py-3.5 font-semibold border-b border-gray-100 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsSold.map((item) => (
                    <tr key={item.product} className="hover:bg-orange-50/40 transition-colors border-b border-gray-50 last:border-b-0">
                      <td className="px-5 py-4 font-semibold text-gray-800">{item.product}</td>
                      <td className="px-5 py-4 text-right text-sm text-gray-600">{item.qty}</td>
                      <td className="px-5 py-4 text-right font-bold text-gray-800">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden space-y-3 p-4">
              {itemsSold.map((item) => (
                <div key={item.product} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{item.product}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.qty} units</p>
                  </div>
                  <span className="font-bold text-orange-600">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Low Stock */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600" /> Low Stock Items</h3>
          </div>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-500 uppercase text-xs tracking-wider">
                  <th className="px-5 py-3.5 font-semibold border-b border-gray-100">Product</th>
                  <th className="px-5 py-3.5 font-semibold border-b border-gray-100">Brand</th>
                  <th className="px-5 py-3.5 font-semibold border-b border-gray-100 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/40 transition-colors border-b border-gray-50 last:border-b-0">
                    <td className="px-5 py-4 font-semibold text-gray-800">{item.productName}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{item.brand || '-'}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-red-600">{item.quantity}</span>
                      <span className="text-gray-400 text-xs ml-1">{item.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-3 p-4">
            {lowStockItems.map((item) => (
              <div key={item.id} className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{item.productName}</p>
                  {item.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
                </div>
                <span className="font-bold text-red-600">{item.quantity} <span className="text-xs text-gray-400">{item.unit}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
