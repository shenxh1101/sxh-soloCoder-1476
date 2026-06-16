import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Phone, Calendar, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Worker } from '../../shared/types';

const SKILL_OPTIONS = ['日常保洁', '深度保洁', '擦玻璃', '地板打蜡', '油烟机清洗'];

export default function WorkersPage() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  useEffect(() => {
    loadWorkers();
  }, []);

  async function loadWorkers() {
    setLoading(true);
    try {
      const data = await api.workers.list();
      setWorkers(data);
    } catch (e) {
      console.error('加载阿姨列表失败', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`确定要删除 ${name} 吗？`)) return;
    try {
      await api.workers.delete(id);
      loadWorkers();
    } catch (e) {
      alert('删除失败');
    }
  }

  const filteredWorkers = workers.filter(w => {
    const matchName = w.name.includes(searchTerm) || w.phone.includes(searchTerm);
    const matchSkill = !skillFilter || w.skills.includes(skillFilter);
    return matchName && matchSkill;
  });

  const getInsuranceStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 7) return { text: `${days}天后到期`, class: 'bg-red-100 text-red-600' };
    if (days <= 30) return { text: `${days}天后到期`, class: 'bg-warning-100 text-warning-600' };
    return { text: '正常', class: 'bg-success-100 text-success-500' };
  };

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="搜索姓名或电话..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-72 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">全部技能</option>
            {SKILL_OPTIONS.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => navigate('/workers/new')}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          添加阿姨
        </button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">阿姨信息</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">技能</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">入职日期</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">保险状态</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">时薪</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">状态</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-stone-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredWorkers.map(worker => {
              const insuranceStatus = getInsuranceStatus(worker.insuranceExpiryDate);
              return (
                <tr key={worker.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                        {worker.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-stone-800">{worker.name}</p>
                        <p className="text-sm text-stone-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {worker.phone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {worker.skills.map(skill => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-stone-600">
                      <Calendar className="w-4 h-4 mr-2 text-stone-400" />
                      {worker.hireDate}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-stone-400" />
                      <span className={`px-2 py-1 rounded text-xs font-medium ${insuranceStatus.class}`}>
                        {insuranceStatus.text}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-stone-800">
                    ¥{worker.hourlyRate}/小时
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      worker.status === 'active'
                        ? 'bg-success-100 text-success-500'
                        : 'bg-stone-100 text-stone-500'
                    }`}>
                      {worker.status === 'active' ? '在职' : '离职'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/workers/${worker.id}/edit`)}
                        className="p-2 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(worker.id, worker.name)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredWorkers.length === 0 && (
          <div className="text-center py-12 text-stone-400">
            暂无匹配的阿姨
          </div>
        )}
      </div>
    </div>
  );
}
