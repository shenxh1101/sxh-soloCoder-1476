import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../lib/api';
import type { WorkerStatus } from '../../shared/types';

const SKILL_OPTIONS = ['日常保洁', '深度保洁', '擦玻璃', '地板打蜡', '油烟机清洗'];

export default function WorkerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    skills: string[];
    hireDate: string;
    insuranceExpiryDate: string;
    hourlyRate: number;
    status: WorkerStatus;
  }>({
    name: '',
    phone: '',
    skills: [] as string[],
    hireDate: '',
    insuranceExpiryDate: '',
    hourlyRate: 25,
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadWorker();
    }
  }, [id]);

  async function loadWorker() {
    setLoading(true);
    try {
      const worker = await api.workers.get(parseInt(id!));
      setFormData({
        name: worker.name,
        phone: worker.phone,
        skills: worker.skills,
        hireDate: worker.hireDate,
        insuranceExpiryDate: worker.insuranceExpiryDate,
        hourlyRate: worker.hourlyRate,
        status: worker.status,
      });
    } catch (e) {
      alert('加载失败');
    } finally {
      setLoading(false);
    }
  }

  function toggleSkill(skill: string) {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name) {
      alert('请输入姓名');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.workers.update(parseInt(id!), formData);
      } else {
        await api.workers.create(formData);
      }
      navigate('/workers');
    } catch (e: any) {
      alert(e.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/workers')}
        className="flex items-center text-stone-600 hover:text-stone-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        返回阿姨列表
      </button>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-800">
            {isEdit ? '编辑阿姨信息' : '添加新阿姨'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                联系电话
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入联系电话"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              技能标签
            </label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.skills.includes(skill)
                      ? 'bg-primary-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                入职日期
              </label>
              <input
                type="date"
                value={formData.hireDate}
                onChange={e => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                保险到期日期
              </label>
              <input
                type="date"
                value={formData.insuranceExpiryDate}
                onChange={e => setFormData({ ...formData, insuranceExpiryDate: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                时薪（元/小时）
              </label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={e => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                状态
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="active">在职</option>
                <option value="inactive">离职</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/workers')}
              className="px-6 py-2 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
