import { useMemo } from 'react';
import { IndianRupee, TrendingUp, Users, Calendar, AlertCircle, ClipboardList } from 'lucide-react';
import { isToday, isThisMonth } from 'date-fns';

export default function BillingSummary({ customers, stock = [], onGoToStock, onGoToReport }) {
  const summary = useMemo(() => {
    let total = 0, today = 0, monthly = 0, todayCustomers = 0, collected = 0, pending = 0;
    customers.forEach(c => {
      const amount = Number(c.amount) || 0;
      total += amount;
      if (c.status === 'due') pending += amount;
      else collected += amount;
      const date = new Date(c.date);
      if (isToday(date)) { today += amount; todayCustomers++; }
      if (isThisMonth(date)) monthly += amount;
    });
    return { total, today, monthly, todayCustomers, totalCustomers: customers.length, collected, pending };
  }, [customers]);

  const lowStockCount = useMemo(() => {
    return stock.filter(item => Number(item.quantity) <= (Number(item.minThreshold) || 50)).length;
  }, [stock]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const cards = [
    { label: "Today's Sales", value: formatCurrency(summary.today), icon: <TrendingUp size={24} />, iconBg: 'bg-orange-50', iconColor: 'text-orange-600', accent: 'border-l-orange-500' },
    { label: 'Total Customers', value: summary.totalCustomers, subtitle: `${summary.todayCustomers} today`, icon: <Users size={24} />, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', accent: 'border-l-blue-500' },
    { label: 'Total Revenue', value: formatCurrency(summary.total), icon: <IndianRupee size={24} />, iconBg: 'bg-green-50', iconColor: 'text-green-600', accent: 'border-l-green-500' },
    { label: 'Monthly Sales', value: formatCurrency(summary.monthly), icon: <Calendar size={24} />, iconBg: 'bg-purple-50', iconColor: 'text-purple-600', accent: 'border-l-purple-500' },
    { label: 'Total Collected', value: formatCurrency(summary.collected), icon: <IndianRupee size={24} />, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', accent: 'border-l-emerald-500' },
    { label: 'Total Pending', value: formatCurrency(summary.pending), icon: <AlertCircle size={24} />, iconBg: 'bg-red-50', iconColor: 'text-red-600', accent: 'border-l-red-500' }
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {cards.map((card) => (
          <div key={card.label}
            className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 ${card.accent} flex items-center gap-4 hover:shadow-md transition-shadow`}>
            <div className={`p-3 rounded-xl ${card.iconBg} ${card.iconColor}`}>{card.icon}</div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{card.value}</p>
              {card.subtitle && <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {lowStockCount > 0 && (
          <button onClick={onGoToStock}
            className="flex-1 flex items-center gap-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 px-5 py-3.5 rounded-2xl transition-all text-sm font-medium cursor-pointer">
            <span className="text-lg">⚠️</span>
            <span>{lowStockCount} item{lowStockCount !== 1 ? 's are' : ' is'} low on stock</span>
          </button>
        )}
        <button onClick={onGoToReport}
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-3.5 rounded-2xl transition-all shadow-sm hover:shadow-md text-sm">
          <ClipboardList size={18} /> Today's Report
        </button>
      </div>
    </div>
  );
}
