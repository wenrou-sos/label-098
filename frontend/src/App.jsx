import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Layout, Tabs, Row, Col, Statistic, Spin, message, Button, Tooltip, Select } from 'antd'
import { apiService } from './services/api'
import CityDemographics from './components/CityDemographics'
import PreferenceDifferences from './components/PreferenceDifferences'
import SelfIntroAnalysis from './components/SelfIntroAnalysis'
import AnxietyIndex from './components/AnxietyIndex'
import MatchSuccess from './components/MatchSuccess'

const { Option } = Select

const TIER_OPTIONS = [
  { value: '一线', label: '🏙️ 一线城市' },
  { value: '新一线', label: '🌆 新一线城市' },
  { value: '二线', label: '🏢 二线城市' },
  { value: '三线', label: '🏘️ 三线城市' }
]

const AGE_GROUP_OPTIONS = [
  { value: '20-25', label: '20-25岁' },
  { value: '26-30', label: '26-30岁' },
  { value: '31-35', label: '31-35岁' },
  { value: '36-40', label: '36-40岁' },
  { value: '40+', label: '40岁以上' }
]

const GENDER_OPTIONS = [
  { value: '男', label: '👨 男性' },
  { value: '女', label: '👩 女性' }
]

function App() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('city')
  const [filters, setFilters] = useState({
    tier: null,
    ageGroup: null,
    gender: null
  })
  const fetchingRef = useRef(false)
  const mountedRef = useRef(false)

  const fetchData = useCallback(async ({ showTip = false, filterParams = null } = {}) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try {
      const currentFilters = filterParams || filters
      const result = await apiService.getAllData(currentFilters)
      setData(result)
      if (showTip) {
        message.success('数据加载成功')
      }
    } catch (err) {
      message.error('数据加载失败，请检查后端服务')
      console.error(err)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [filters])

  const handleRegenerate = async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try {
      await apiService.regenerateData()
      const result = await apiService.getAllData(filters)
      setData(result)
      message.success('数据刷新成功')
    } catch (err) {
      message.error('重新生成数据失败')
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value || null }
    setFilters(newFilters)
    fetchData({ filterParams: newFilters, showTip: false })
  }

  const resetFilters = () => {
    const newFilters = { tier: null, ageGroup: null, gender: null }
    setFilters(newFilters)
    fetchData({ filterParams: newFilters, showTip: false })
  }

  const hasActiveFilters = filters.tier || filters.ageGroup || filters.gender

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      fetchData({ showTip: false })
    }
  }, [fetchData])

  const tabItems = [
    { key: 'city', label: '🏙️ 城市人口结构分析' },
    { key: 'preference', label: '💝 择偶要求差异分析' },
    { key: 'intro', label: '📝 自我介绍内容分析' },
    { key: 'anxiety', label: '😰 婚恋焦虑指数' },
    { key: 'match', label: '💕 脱单成功规律' }
  ]

  const IconEmoji = ({ emoji, className, style }) => (
    <span className={className} style={{ ...style, fontSize: 36, opacity: 0.2 }}>{emoji}</span>
  )

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">💑 婚恋市场数据分析看板</h1>
          <p className="dashboard-subtitle">Dating Market Analytics Dashboard · 全方位洞察婚恋市场趋势与规律</p>
          
          <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Tooltip title="重新生成模拟数据并分析">
              <Button type="primary" onClick={handleRegenerate} loading={loading}>
                🔄 刷新数据
              </Button>
            </Tooltip>
          </div>
        </div>

        {data && (
          <div className="filter-bar" style={{
            background: '#fff',
            padding: '16px 24px',
            borderRadius: 8,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap'
          }}>
            <div style={{ fontWeight: 500, color: '#333', marginRight: 8 }}>
              🔍 全局筛选
            </div>
            
            <Select
              placeholder="城市线级"
              style={{ width: 150 }}
              allowClear
              value={filters.tier}
              onChange={(val) => handleFilterChange('tier', val)}
            >
              {TIER_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>

            <Select
              placeholder="年龄段"
              style={{ width: 140 }}
              allowClear
              value={filters.ageGroup}
              onChange={(val) => handleFilterChange('ageGroup', val)}
            >
              {AGE_GROUP_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>

            <Select
              placeholder="性别"
              style={{ width: 120 }}
              allowClear
              value={filters.gender}
              onChange={(val) => handleFilterChange('gender', val)}
            >
              {GENDER_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>

            {hasActiveFilters && (
              <Button size="small" onClick={resetFilters} style={{ marginLeft: 'auto' }}>
                重置筛选
              </Button>
            )}

            {hasActiveFilters && data.filter_applied && (
              <div style={{ color: '#888', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>当前筛选：</span>
                {data.filter_applied.tier && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#e6f7ff',
                    color: '#1890ff',
                    borderRadius: 4,
                    fontSize: 12
                  }}>{data.filter_applied.tier}</span>
                )}
                {data.filter_applied.age_group && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#f6ffed',
                    color: '#52c41a',
                    borderRadius: 4,
                    fontSize: 12
                  }}>{data.filter_applied.age_group}岁</span>
                )}
                {data.filter_applied.gender && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#fff0f6',
                    color: '#eb2f96',
                    borderRadius: 4,
                    fontSize: 12
                  }}>{data.filter_applied.gender}性</span>
                )}
              </div>
            )}
          </div>
        )}

        {loading && !data ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" tip="正在加载数据分析结果..." />
          </div>
        ) : data ? (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={12} md={6}>
                <div className="stat-card" style={{ position: 'relative', borderLeftColor: '#eb2f96' }}>
                  <IconEmoji emoji="👥" className="stat-icon" />
                  <div className="stat-label">注册用户总数</div>
                  <div className="stat-value">{data.summary.total_users.toLocaleString()}</div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="stat-card" style={{ position: 'relative', borderLeftColor: '#1890ff' }}>
                  <IconEmoji emoji="⚧" className="stat-icon" />
                  <div className="stat-label">男女比例</div>
                  <div className="stat-value">
                    <span style={{ color: '#1890ff' }}>{data.summary.male_pct}%</span>
                    <span style={{ fontSize: 18, color: '#888', fontWeight: 400 }}> / </span>
                    <span style={{ color: '#eb2f96' }}>{data.summary.female_pct}%</span>
                  </div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="stat-card" style={{ position: 'relative', borderLeftColor: '#fa8c16' }}>
                  <IconEmoji emoji="👑" className="stat-icon" />
                  <div className="stat-label">付费用户 / 客单价</div>
                  <div className="stat-value">
                    {data.summary.paid_count.toLocaleString()}
                    <span style={{ fontSize: 14, color: '#888', fontWeight: 400, marginLeft: 8 }}>
                      ¥{data.summary.avg_spent_per_user}
                    </span>
                  </div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="stat-card" style={{ position: 'relative', borderLeftColor: '#52c41a' }}>
                  <IconEmoji emoji="💖" className="stat-icon" />
                  <div className="stat-label">成功牵手对数</div>
                  <div className="stat-value" style={{ color: '#52c41a' }}>
                    {data.summary.success_matches.toLocaleString()}
                  </div>
                </div>
              </Col>
            </Row>

            <div className="chart-card" style={{ marginBottom: 24 }}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                size="large"
                tabBarStyle={{ borderBottom: 'none', marginBottom: 0 }}
              />
            </div>

            <Spin spinning={loading}>
              {activeTab === 'city' && data && (
                <CityDemographics data={data.city_demographics} />
              )}
              {activeTab === 'preference' && data && (
                <PreferenceDifferences data={data.preference_differences} />
              )}
              {activeTab === 'intro' && data && (
                <SelfIntroAnalysis data={data.self_intro_analysis} />
              )}
              {activeTab === 'anxiety' && data && (
                <AnxietyIndex data={data.anxiety_index} />
              )}
              {activeTab === 'match' && data && (
                <MatchSuccess data={data.match_success} />
              )}
            </Spin>
          </>
        ) : null}

        <div style={{ textAlign: 'center', padding: '32px 0 16px', color: '#999', fontSize: 12 }}>
          🔥 婚恋市场数据分析看板 · 数据均为模拟脱敏数据，仅供分析展示
        </div>
      </div>
    </Layout>
  )
}

export default App
