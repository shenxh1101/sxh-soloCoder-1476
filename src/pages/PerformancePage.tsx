import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Clock, Star, DollarSign, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { api } from '../lib/api';
import type { MonthlyPerformance } from '../../shared/types';

export default function PerformancePage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [performances, setPerformances] = useState<MonthlyPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformance();
  }, [month]);

  async function loadPerformance() {
    setLoading(true);
    try {
      const data = await api.performance.list(month);
      setPerformances(data);
    } catch (e) {
      console.error('加载绩效数据失败', e);
    } finally {
      setLoading(false);
    }
  }

  function changeMonth(delta: number) {
    const [year, m] = month.split('-').map(Number);
    const date = new Date(year, m - 1 + delta, 1);
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  const formatMonth = (monthStr: string) => {
    const [year, m] = monthStr.split('-');
    return `${year}年${parseInt(m)}月`;
  };

  const totalHours = performances.reduce((sum, p) => sum + p.totalHours, 0);
  const totalOrders = performances.reduce((sum, p) => sum + p.totalOrders, 0);
  const totalSalary = performances.reduce((sum, p) => sum + p.totalSalary, 0);

  function exportSalaryCSV() {
    if (performances.length === 0) {
      alert('本月暂无数据可导出');
      return;
    }
    const headers = ['排名', '阿姨姓名', '订单数', '总工时(h)', '好评数', '差评数', '基本工资(¥)', '奖金/扣罚(¥)', '实发工资(¥)'];
    const rows = performances.map((p, index) => [
      index + 1,
      p.workerName,
      p.totalOrders,
      p.totalHours,
      p.positiveReviews,
      p.negativeReviews,
      p.baseSalary,
      p.bonus >= 0 ? `+${p.bonus}` : `${p.bonus}`,
      p.totalSalary,
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${formatMonth(month)}工资表.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-stone-600" />
          </button>
          <h2 className="text-xl font-semibold text-stone-800 min-w-[140px] text-center">
            {formatMonth(month)} 绩效统计
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-stone-600" />
          </button>
        </div>
        <button
          onClick={exportSalaryCSV}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm"
        >
          <Download className="w-4 h-4" />
          导出工资表
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500">总工时</p>
              <p className="text-2xl font-bold text-stone-800 mt-1">{totalHours.toFixed(1)}h</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500">总订单数</p>
              <p className="text-2xl font-bold text-stone-800 mt-1">{totalOrders}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-success-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500">好评数</p>
              <p className="text-2xl font-bold text-stone-800 mt-1">
                {performances.reduce((sum, p) => sum + p.positiveReviews, 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center">
              <Star className="w-6 h-6 text-warning-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500">总工资</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">¥{totalSalary.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100">
          <h3 className="font-semibold text-stone-800">阿姨绩效排行</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">排名</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">阿姨</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-stone-600">订单数</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-stone-600">总工时</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-stone-600">好评</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-stone-600">差评</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-stone-600">基本工资</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-stone-600">奖金/扣罚</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-stone-600">实发工资</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {performances.map((p, index) => (
                <tr key={p.workerId} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-stone-200 text-stone-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-stone-100 text-stone-500'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                        {p.workerName.charAt(0)}
                      </div>
                      <span className="ml-3 font-medium text-stone-800">{p.workerName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-stone-600">{p.totalOrders}</td>
                  <td className="px-6 py-4 text-center text-stone-600">{p.totalHours}h</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center text-success-500">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {p.positiveReviews}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center text-red-500">
                      <TrendingDown className="w-4 h-4 mr-1" />
                      {p.negativeReviews}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-stone-600">¥{p.baseSalary}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={p.bonus >= 0 ? 'text-success-500' : 'text-red-500'}>
                      {p.bonus >= 0 ? '+' : ''}¥{p.bonus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-primary-600">
                    ¥{p.totalSalary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {performances.length === 0 && (
            <div className="text-center py-16 text-stone-400">
              本月暂无绩效数据
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
        <h3 className="font-semibold text-stone-800 mb-4">薪资计算说明</h3>
        <div className="grid grid-cols-3 gap-6 text-sm text-stone-600">
          <div>
            <p className="font-medium text-stone-700">基本工资</p>
            <p className="mt-1">时薪 × 实际工时</p>
          </div>
          <div>
            <p className="font-medium text-stone-700">好评奖励</p>
            <p className="mt-1">每次好评 +¥50</p>
          </div>
          <div>
            <p className="font-medium text-stone-700">差评扣罚</p>
            <p className="mt-1">每次差评 -¥30</p>
          </div>
        </div>
      </div>
    </div>
  );
}
