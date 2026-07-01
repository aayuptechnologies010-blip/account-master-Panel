import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../apiService';
import Highcharts from 'highcharts';
import HighchartsReactBase from 'highcharts-react-official';
import { Badge } from '@chakra-ui/react';
import { FaRupeeSign, FaFileInvoiceDollar, FaUsers, FaBoxes, FaExclamationTriangle, FaArrowUp, FaArrowRight } from 'react-icons/fa';

const HighchartsReact = HighchartsReactBase.default || HighchartsReactBase;
const CHART_COLORS = ['#0ea5e9', '#6366f1', '#a78bfa', '#f472b6', '#34d399', '#fb7185', '#fbbf24', '#38bdf8', '#818cf8'];

const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, borderColor, prefix, suffix, onClick, alert }) => (
  <div onClick={onClick} style={{
    background: 'white', borderRadius: '16px', padding: '22px 24px',
    border: `1px solid #e2e8f0`, borderLeft: `4px solid ${borderColor}`,
    boxShadow: '0 1px 8px rgba(0,0,0,0.05)', cursor: onClick ? 'pointer' : 'default',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    transition: 'transform 0.15s, box-shadow 0.15s',
    position: 'relative', overflow: 'hidden'
  }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; } }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.05)'; }}
  >
    <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', borderRadius: '0 0 0 80px', background: iconBg, opacity: 0.15 }} />
    <div>
      <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {prefix && <span style={{ fontSize: '18px', color: borderColor, fontWeight: '700' }}>{prefix}</span>}
        <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{value}</span>
        {suffix && <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500', alignSelf: 'flex-end', marginBottom: '3px' }}>{suffix}</span>}
      </div>
      {alert ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '11px', fontWeight: '600', color: '#ef4444' }}>
          <FaExclamationTriangle style={{ fontSize: '10px' }} /> Needs Reorder
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '11px', fontWeight: '600', color: '#22c55e' }}>
          <FaArrowUp style={{ fontSize: '9px' }} /> Updated live
        </div>
      )}
    </div>
    <div style={{
      width: '48px', height: '48px', borderRadius: '14px',
      background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 4px 14px ${iconBg}88`, flexShrink: 0
    }}>
      <Icon style={{ color: iconColor, fontSize: '20px' }} />
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, onAction, actionLabel, children }) => (
  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
    <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{subtitle}</div>}
      </div>
      {onAction && (
        <button onClick={onAction} style={{
          display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600',
          color: '#0ea5e9', background: '#f0f9ff', border: '1px solid #bae6fd',
          borderRadius: '8px', padding: '5px 12px', cursor: 'pointer'
        }}>
          {actionLabel} <FaArrowRight style={{ fontSize: '10px' }} />
        </button>
      )}
    </div>
    <div style={{ padding: '0' }}>{children}</div>
  </div>
);

export default function Dashboard({ stats }) {
  const navigate = useNavigate();
  const [recentBills, setRecentBills] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [topCategoriesOptions, setTopCategoriesOptions] = useState({});
  const [categorySalesOptions, setCategorySalesOptions] = useState({});
  const [salesAreaOptions, setSalesAreaOptions] = useState({});
  const [orderStatusesOptions, setOrderStatusesOptions] = useState({});

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const recentRes = await apiService.getSaleBills({}, 1, 5);
        setRecentBills(recentRes.bills || []);

        const lowStockRes = await apiService.getItems({ lowStock: true, threshold: 10 }, 1, 5);
        setLowStockItems(lowStockRes.items || []);

        const getCategory = (itemName = '') => {
          const n = itemName.toLowerCase();
          if (n.includes('rice') || n.includes('atta')) return 'Grains';
          if (n.includes('oil')) return 'Oils';
          if (n.includes('salt')) return 'Essentials';
          if (n.includes('handwash') || n.includes('dettol')) return 'Personal Care';
          if (n.includes('maggi') || n.includes('noodle')) return 'Packaged Foods';
          return 'General';
        };

        const allBillsRes = await apiService.getSaleBills({}, 1, 1000);
        const allBills = allBillsRes.bills || [];
        const categoryTotals = {};
        allBills.forEach(bill => {
          (bill.items || []).forEach(item => {
            const cat = getCategory(item.description);
            categoryTotals[cat] = (categoryTotals[cat] || 0) + item.amount;
          });
        });
        const donutData = Object.keys(categoryTotals).map(cat => ({ name: cat, y: categoryTotals[cat] }));

        const chartBase = { backgroundColor: 'transparent', style: { fontFamily: 'Inter, sans-serif' }, height: 280 };
        const titleStyle = { color: '#0f172a', fontWeight: '700', fontSize: '14px' };

        setTopCategoriesOptions({
          chart: { ...chartBase, type: 'pie' }, colors: CHART_COLORS,
          title: { text: 'Sales by Category', align: 'left', style: titleStyle },
          subtitle: { text: 'Live category-wise sales distribution', align: 'left', style: { fontSize: '11px', color: '#94a3b8' } },
          tooltip: { pointFormat: '₹{point.y} ({point.percentage:.1f}%)' },
          plotOptions: { pie: { innerSize: '60%', allowPointSelect: true, cursor: 'pointer', dataLabels: { enabled: true, format: '{point.name}: {point.percentage:.0f}%', style: { fontSize: '10px', color: '#64748b', fontWeight: '500', textOutline: 'none' } } } },
          credits: { enabled: false },
          series: [{
            name: 'Sales',
            colorByPoint: true,
            data: donutData
          }]
        });

        const getShortMonthName = (dateObj) => {
          return dateObj.toLocaleString('en-US', { month: 'short' });
        };

        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          last6Months.push({
            name: `${getShortMonthName(d)} ${d.getFullYear().toString().substring(2)}`,
            monthIndex: d.getMonth(),
            year: d.getFullYear()
          });
        }

        const xAxisMonths = last6Months.map(m => m.name);
        const categoriesList = ['Grains', 'Oils', 'Essentials', 'Personal Care', 'Packaged Foods', 'Others'];

        const monthlyCategoryData = categoriesList.map(catName => {
          const data = last6Months.map(mInfo => {
            let sum = 0;
            allBills.forEach(bill => {
              const billDate = new Date(bill.date);
              if (billDate.getMonth() === mInfo.monthIndex && billDate.getFullYear() === mInfo.year) {
                (bill.items || []).forEach(item => {
                  if (getCategory(item.description) === catName) {
                    sum += (Number(item.amount) || 0);
                  }
                });
              }
            });
            return sum;
          });
          return { name: catName, data };
        });

        setCategorySalesOptions({
          chart: { ...chartBase, type: 'column' }, colors: CHART_COLORS,
          title: { text: 'Monthly Category Sales', align: 'left', style: titleStyle },
          xAxis: { categories: xAxisMonths, gridLineColor: 'transparent', labels: { style: { color: '#94a3b8', fontSize: '10px' } }, lineColor: '#f1f5f9' },
          yAxis: { min: 0, title: { text: '' }, gridLineColor: '#f8fafc', labels: { style: { color: '#94a3b8', fontSize: '10px' } } },
          legend: { align: 'center', verticalAlign: 'bottom', itemStyle: { color: '#64748b', fontWeight: '500', fontSize: '10px' } },
          tooltip: { headerFormat: '<b>{point.x}</b><br/>', pointFormat: '{series.name}: ₹{point.y}' },
          plotOptions: { column: { stacking: 'normal', borderRadius: 4, borderWidth: 0, dataLabels: { enabled: false } } },
          credits: { enabled: false },
          series: monthlyCategoryData.filter(s => s.data.some(v => v > 0))
        });

        setSalesAreaOptions({
          chart: { ...chartBase, type: 'area' }, colors: CHART_COLORS,
          title: { text: 'Revenue Trend', align: 'left', style: titleStyle },
          xAxis: { categories: xAxisMonths, gridLineColor: 'transparent', labels: { style: { color: '#94a3b8', fontSize: '10px' } }, lineColor: '#f1f5f9' },
          yAxis: { title: { text: '' }, gridLineColor: '#f8fafc', labels: { style: { color: '#94a3b8', fontSize: '10px' } } },
          tooltip: { pointFormat: '{series.name}: <b>₹{point.y}</b>' },
          plotOptions: { area: { stacking: 'normal', lineColor: '#ffffff', lineWidth: 1.5, marker: { lineWidth: 1, lineColor: '#ffffff', radius: 3 } } },
          credits: { enabled: false },
          series: monthlyCategoryData.filter(s => s.data.some(v => v > 0))
        });

        const paidCount = allBills.filter(b => b.balance === 0).length;
        const partialCount = allBills.filter(b => b.balance > 0 && b.balance < b.amountR).length;
        const unpaidCount = allBills.filter(b => b.balance > 0 && b.balance === b.amountR).length;

        setOrderStatusesOptions({
          chart: { ...chartBase, type: 'pie' }, colors: ['#22c55e', '#f59e0b', '#ef4444'],
          title: { text: 'Invoice Status', align: 'left', style: titleStyle },
          tooltip: { pointFormat: '{series.name}: <b>{point.y}</b>' },
          plotOptions: { pie: { innerSize: '55%', dataLabels: { enabled: false }, showInLegend: true } },
          legend: { align: 'center', verticalAlign: 'bottom', itemStyle: { color: '#64748b', fontSize: '10px', fontWeight: '500' } },
          credits: { enabled: false },
          series: [{
            name: 'Invoices',
            colorByPoint: true,
            data: [
              { name: 'Paid / Cleared', y: paidCount },
              { name: 'Partially Due', y: partialCount },
              { name: 'Overdue / Unpaid', y: unpaidCount }
            ]
          }]
        });
      } catch (err) {
        console.error(err);
      }
    };
    loadDashboardData();
  }, [stats]);

  const thStyle = { padding: '11px 16px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' };
  const tdStyle = (extra = {}) => ({ padding: '13px 16px', fontSize: '13px', borderBottom: '1px solid #f8fafc', ...extra });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <StatCard label="Total Sales Value" value={stats.totalSales?.toLocaleString('en-IN') || '0'} icon={FaRupeeSign} iconBg="#dbeafe" iconColor="#2563eb" borderColor="#3b82f6" prefix="₹" />
        <StatCard label="Active Clients" value={stats.totalClients || 0} icon={FaUsers} iconBg="#d1fae5" iconColor="#059669" borderColor="#10b981" onClick={() => navigate('/clients')} />
        <StatCard label="Items Catalog" value={stats.totalItems || 0} icon={FaBoxes} iconBg="#ede9fe" iconColor="#7c3aed" borderColor="#8b5cf6" onClick={() => navigate('/items')} />
        <StatCard label="Low Stock Alert" value={stats.lowStockCount || 0} icon={FaExclamationTriangle} iconBg="#fee2e2" iconColor="#dc2626" borderColor="#ef4444" alert={stats.lowStockCount > 0} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {[
          { opts: topCategoriesOptions, title: 'Sales by Category', sub: 'Product distribution' },
          { opts: categorySalesOptions, title: 'Monthly Category Sales', sub: 'Stacked comparison' },
          { opts: salesAreaOptions, title: 'Revenue Trend', sub: 'Cumulative growth' },
          { opts: orderStatusesOptions, title: 'Invoice Status', sub: 'Payment overview' },
        ].map(({ opts, title, sub }) => (
          <SectionCard key={title} title={title} subtitle={sub}>
            <div style={{ padding: '16px' }}>
              {opts.series && <HighchartsReact highcharts={Highcharts} options={opts} />}
            </div>
          </SectionCard>
        ))}
      </div>

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Bills */}
        <SectionCard title="Recent Sale Bills" subtitle="Last 5 transactions" onAction={() => navigate('/bills')} actionLabel="View All">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Voucher No</th>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Amount</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBills.length === 0 ? (
                <tr><td colSpan={4} style={{ ...tdStyle({ textAlign: 'center', color: '#94a3b8', padding: '32px' }) }}>No bills found</td></tr>
              ) : recentBills.map(b => (
                <tr key={b._id} style={{ transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={tdStyle({ fontWeight: '700', color: '#0369a1', fontFamily: 'monospace', fontSize: '12px' })}>{b.voucherNo}</td>
                  <td style={tdStyle({ color: '#334155', fontWeight: '500' })}>{b.customer?.partyName || '—'}</td>
                  <td style={tdStyle({ fontWeight: '700', color: '#0f172a' })}>₹{b.amountR?.toLocaleString('en-IN')}</td>
                  <td style={{ ...tdStyle({ textAlign: 'right' }) }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                      background: b.balance === 0 ? '#dcfce7' : '#fef9c3',
                      color: b.balance === 0 ? '#15803d' : '#92400e'
                    }}>
                      {b.balance === 0 ? '✓ Paid' : `₹${b.balance} Due`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        {/* Low Stock */}
        <SectionCard
          title="Low Stock Alerts"
          subtitle="Items below threshold (≤ 10)"
          onAction={() => navigate('/items')}
          actionLabel="Manage Stock"
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Item Code</th>
                <th style={thStyle}>Description</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length === 0 ? (
                <tr><td colSpan={3} style={{ ...tdStyle({ textAlign: 'center', color: '#94a3b8', padding: '32px' }) }}>All items healthy ✓</td></tr>
              ) : lowStockItems.map(i => (
                <tr key={i._id}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff7f7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={tdStyle({ fontWeight: '700', color: '#dc2626', fontFamily: 'monospace', fontSize: '12px' })}>{i.ipmrpCd}</td>
                  <td style={tdStyle({ color: '#334155', fontWeight: '500' })}>{i.descript}</td>
                  <td style={{ ...tdStyle({ textAlign: 'right' }) }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                      background: '#fee2e2', color: '#dc2626'
                    }}>
                      {i.stkBal} {i.unit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>
    </div>
  );
}
