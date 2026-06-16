import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, User, CheckCircle, Clock, MapPin, Phone } from 'lucide-react';
import { api } from '../lib/api';
import type { WorkerWithScore } from '../../shared/types';

const SERVICE_TYPES = ['日常保洁', '深度保洁', '擦玻璃', '地板打蜡', '油烟机清洗'];

export default function OrderFormPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    serviceAddress: '',
    serviceType: '',
    scheduledDate: '',
    startTime: '09:00',
    endTime: '12:00',
    notes: '',
  });
  
  const [recommendedWorkers, setRecommendedWorkers] = useState<WorkerWithScore[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);

  useEffect(() => {
    const canRecommend = formData.serviceType && formData.scheduledDate && formData.startTime && formData.endTime;
    if (canRecommend) {
      loadRecommendations();
    } else {
      setRecommendedWorkers([]);
      setShowRecommendation(false);
    }
  }, [formData.serviceType, formData.scheduledDate, formData.startTime, formData.endTime]);

  async function loadRecommendations() {
    setRecommending(true);
    try {
      const startTime = `${formData.scheduledDate}T${formData.startTime}:00`;
      const endTime = `${formData.scheduledDate}T${formData.endTime}:00`;
      
      const workers = await api.workers.available({
        serviceType: formData.serviceType,
        startTime,
        endTime,
      });
      
      setRecommendedWorkers(workers);
      setShowRecommendation(true);
      if (workers.length > 0 && !selectedWorkerId) {
        setSelectedWorkerId(workers[0].id);
      }
    } catch (e) {
      console.error('获取推荐失败', e);
    } finally {
      setRecommending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.customerName || !formData.serviceType || !formData.scheduledDate) {
      alert('请填写必要信息');
      return;
    }

    setLoading(true);
    try {
      const startTime = `${formData.scheduledDate}T${formData.startTime}:00`;
      const endTime = `${formData.scheduledDate}T${formData.endTime}:00`;

      await api.orders.create({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        serviceAddress: formData.serviceAddress,
        serviceType: formData.serviceType,
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        workerId: selectedWorkerId || undefined,
        notes: formData.notes,
      });

      navigate('/orders');
    } catch (e: any) {
      alert(e.message || '创建失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center text-stone-600 hover:text-stone-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        返回订单列表
      </button>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
            <div className="p-6 border-b border-stone-100">
              <h2 className="text-lg font-semibold text-stone-800">新建预约订单</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  客户姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入客户姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  联系电话
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="请输入联系电话"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  服务地址
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    value={formData.serviceAddress}
                    onChange={e => setFormData({ ...formData, serviceAddress: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="请输入详细地址"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  服务类型 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, serviceType: type })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.serviceType === type
                          ? 'bg-primary-500 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  服务日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    开始时间
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    结束时间
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  备注信息
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="特殊要求、注意事项等"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/orders')}
                  className="px-6 py-2 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? '创建中...' : '创建订单'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm sticky top-6">
            <div className="p-5 border-b border-stone-100">
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-500 mr-2" />
                <h3 className="font-semibold text-stone-800">智能推荐阿姨</h3>
              </div>
              <p className="text-xs text-stone-500 mt-1">根据技能和时间自动匹配</p>
            </div>

            <div className="p-4 max-h-[600px] overflow-y-auto">
              {recommending ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : recommendedWorkers.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-sm">
                  {showRecommendation ? '暂无合适的阿姨' : '请选择服务类型和时间'}
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedWorkers.map((worker, index) => (
                    <div
                      key={worker.id}
                      onClick={() => setSelectedWorkerId(worker.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedWorkerId === worker.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                            {worker.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <div className="flex items-center">
                              <span className="font-medium text-stone-800">{worker.name}</span>
                              {index === 0 && (
                                <span className="ml-2 px-1.5 py-0.5 bg-primary-100 text-primary-600 text-xs rounded font-medium">
                                  推荐
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">
                              ¥{worker.hourlyRate}/小时
                            </p>
                          </div>
                        </div>
                        {selectedWorkerId === worker.id && (
                          <CheckCircle className="w-5 h-5 text-primary-500" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {worker.skills.map(skill => (
                          <span
                            key={skill}
                            className={`px-2 py-0.5 rounded text-xs ${
                              skill === formData.serviceType
                                ? 'bg-primary-100 text-primary-600 font-medium'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedWorkerId && (
              <div className="p-4 border-t border-stone-100 bg-stone-50 rounded-b-xl">
                <p className="text-sm text-stone-600">
                  已选择：
                  <span className="font-medium text-stone-800 ml-1">
                    {recommendedWorkers.find(w => w.id === selectedWorkerId)?.name}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
