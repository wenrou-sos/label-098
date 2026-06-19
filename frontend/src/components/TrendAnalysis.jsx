import React, { useState, useEffect, useMemo } from 'react'
import { apiService } from '../services/api'
import {
  Row, Col, Card, Select, Spin, Typography, Space, Statistic,
  Empty, Tag, Alert, Table
} from 'antd'
import {
  LineChartOutlined, RiseOutlined, FallOutlined, InfoCircleOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'

const { Title, Text } = Typography
const { Option } = Select

const METRIC_CONFIG = {
  total_users: { name: '用户总数', color: '#1890ff', unit: '人', type: 'number' },
  avg_age: { name: '平均年龄', color: '#722ed1', unit: '岁', type: 'decimal' },
  male_pct: { name: '男性占比', color: '#1890ff', unit: '%', type: 'decimal' },
  female_pct: { name: '女性占比', color: '#eb2f96', unit: '%', type: 'decimal' },
  paid_rate: { name: '付费率', color: '#fa8c16', unit: '%', type: 'decimal' },
  avg_spent_per_user: { name: '客单价', color: '#52c41a', unit: '元', type: 'decimal' },
  total_revenue: { name: '平台总收入', color: '#faad14', unit: '元', type: 'number' },
  success_matches: { name: '成功牵手数', color: '#eb2f96', unit: '对', type: 'number' },
  success_rate: { name: '匹配成功率', color: '#13c2c2', unit: '%', type: 'decimal' },
  anxiety_index_avg: { name: '平均焦虑指数', color: '#f5222d', unit: '', type: 'decimal' },
  city_count: { name: '覆盖城市数', color: '#2f54eb', unit: '个', type: 'number' }
}

const CHART_GROUPS = [
  {
    title: '👥 用户规模',
    metrics: ['total_users', 'city_count', 'avg_age']
  },
  {
    title: '⚧️ 性别结构',
    metrics: ['male_pct', 'female_pct']
  },
  {
    title: '💰 付费行为',
    metrics: ['paid_rate', 'avg_spent_per_user', 'total_revenue']
  },
  {
    title: '💕 匹配效果',
    metrics: ['success_matches', 'success_rate']
  },
  {
    title: '😰 焦虑指数',
    metrics: ['anxiety_index_avg']
  }
]

function TrendAnalysis() {
  const [loading, setLoading] = useState(true)
  const [historyData, setHistoryData] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [returnedCount, setReturnedCount] = useState(0)
  const [selectedMetrics, setSelectedMetrics] = useState(['total_users', 'paid_rate', 'success_rate', 'anxiety_index_avg'])

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await apiService.getSnapshotHistory(500)
      setHistoryData(data.history || [])
      setTotalCount(data.total_count ?? (data.history || []).length)
      setReturnedCount(data.returned_count ?? (data.history || []).length)
    } catch (err) {
      console.error('加载历史数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value, metric) => {
    const config = METRIC_CONFIG[metric]
    if (config.type === 'decimal') {
      return `${value?.toFixed?.(1) || value}${config.unit}`
    }
    return `${value?.toLocaleString?.() || value}${config.unit}`
  }

  const calculateChange = (metric) => {
    if (historyData.length < 2) return { value: 0, direction: 'stable' }
    const latest = historyData[historyData.length - 1]?.[metric]
    const previous = historyData[historyData.length - 2]?.[metric]
    if (latest == null || previous == null) return { value: 0, direction: 'stable' }
    const diff = latest - previous
    const pct = previous !== 0 ? Math.abs(diff / previous * 100).toFixed(1) : '0.0'
    return {
      value: pct,
      diff: diff,
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable'
    }
  }

  const getChartOption = (group) => {
    const metrics = group.metrics.filter(m => selectedMetrics.includes(m))
    if (metrics.length === 0) return null

    const xAxisData = historyData.map(item => {
      const date = new Date(item.created_at)
      return `v${item.version}\n${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    })

    const series = metrics.map(metric => ({
      name: METRIC_CONFIG[metric].name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: historyData.map(item => item[metric]),
      lineStyle: { width: 2, color: METRIC_CONFIG[metric].color },
      itemStyle: { color: METRIC_CONFIG[metric].color },
      areaStyle: metrics.length === 1 ? {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: METRIC_CONFIG[metric].color + '40' },
            { offset: 1, color: METRIC_CONFIG[metric].color + '05' }
          ]
        }
      } : undefined
    }))

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e8e8e8',
        textStyle: { color: '#333' },
        formatter: (params) => {
          let result = `<div style="font-weight:bold;margin-bottom:4px">${params[0].axisValue}</div>`
          params.forEach(p => {
            const config = METRIC_CONFIG[group.metrics.find(m => METRIC_CONFIG[m].name === p.seriesName)]
            result += `<div style="display:flex;align-items:center;gap:8px;margin:2px 0">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color}"></span>
              <span>${p.seriesName}:</span>
              <span style="font-weight:bold">${formatValue(p.value, group.metrics.find(m => METRIC_CONFIG[m].name === p.seriesName))}</span>
            </div>`
          })
          return result
        }
      },
      legend: {
        data: metrics.map(m => METRIC_CONFIG[m].name),
        top: 0,
        icon: 'circle'
      },
      grid: { left: 60, right: 30, top: 50, bottom: 50 },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: { lineStyle: { color: '#ddd' } },
        axisLabel: { color: '#888', fontSize: 11, rotate: historyData.length > 6 ? 30 : 0 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } },
        axisLabel: { color: '#888' }
      },
      series
    }
  }

  const tableColumns = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: v => <Tag color="blue">v{v}</Tag>
    },
    {
      title: '生成时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: v => new Date(v).toLocaleString('zh-CN')
    },
    ...Object.entries(METRIC_CONFIG).slice(0, 8).map(([key, config]) => ({
      title: (
        <Space size={4}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: config.color }}></span>
          {config.name}
        </Space>
      ),
      dataIndex: key,
      key,
      width: 100,
      render: v => formatValue(v, key)
    }))
  ]

  const statCards = useMemo(() => {
    if (historyData.length === 0) return []
    const latest = historyData[historyData.length - 1]
    return ['total_users', 'paid_rate', 'success_rate', 'anxiety_index_avg'].map(metric => {
      const change = calculateChange(metric)
      const config = METRIC_CONFIG[metric]
      return { metric, latest, change, config }
    })
  }, [historyData])

  return (
    <div className="trend-analysis-container">
      <Card className="chart-card" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                <LineChartOutlined style={{ marginRight: 8 }} />
                趋势变化分析
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                追踪各版本核心指标的变化趋势，对比不同数据版本的差异
              </Text>
            </div>
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                共 {totalCount} 个历史版本{returnedCount < totalCount ? `（展示最近 ${returnedCount} 条）` : ''}
              </Text>
            </Space>
          </div>

          <Alert
            message="💡 使用说明"
            description="每次点击「刷新数据」重新生成数据时，系统会自动保存当前指标快照。下方图表展示各指标随版本迭代的变化趋势，可通过多选框切换关注的指标。"
            type="info"
            showIcon
          />

          <div>
            <div style={{ marginBottom: 8, fontSize: 13, color: '#555' }}>
              📈 选择要展示的指标
            </div>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="选择要展示的指标"
              value={selectedMetrics}
              onChange={setSelectedMetrics}
              maxTagCount={6}
            >
              {Object.entries(METRIC_CONFIG).map(([key, config]) => (
                <Option key={key} value={key}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: config.color, marginRight: 8 }}></span>
                  {config.name} ({config.unit})
                </Option>
              ))}
            </Select>
          </div>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {historyData.length > 0 ? (
          <>
            {statCards.length > 0 && (
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {statCards.map(({ metric, latest, change, config }) => (
                  <Col xs={12} md={6} key={metric}>
                    <Card className="stat-card" style={{ borderLeftColor: config.color }}>
                      <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: config.color }}></span>
                        {config.name}
                        {change.direction !== 'stable' && historyData.length >= 2 && (
                          <Tag
                            color={change.direction === 'up' ? 'red' : 'green'}
                            icon={change.direction === 'up' ? <RiseOutlined /> : <FallOutlined />}
                            style={{ marginLeft: 'auto', border: 'none', background: 'transparent' }}
                          >
                            {change.direction === 'up' ? '+' : ''}{change.value}%
                          </Tag>
                        )}
                      </div>
                      <div className="stat-value" style={{ color: config.color }}>
                        {formatValue(latest[metric], metric)}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}

            {CHART_GROUPS.map((group, idx) => {
              const option = getChartOption(group)
              if (!option) return null
              return (
                <Card key={idx} className="chart-card" style={{ marginBottom: 24 }}>
                  <div className="chart-title">{group.title}</div>
                  <ReactECharts option={option} style={{ height: 320 }} notMerge />
                </Card>
              )
            })}

            <Card className="chart-card">
              <div className="chart-title">📋 历史版本明细</div>
              <Table
                dataSource={historyData.slice().reverse()}
                columns={tableColumns}
                rowKey="version"
                scroll={{ x: 1200 }}
                size="small"
                pagination={{ pageSize: 10, showSizeChanger: true }}
              />
            </Card>
          </>
        ) : (
          <Empty
            description={
              <Space direction="vertical">
                <Text>暂无历史数据</Text>
                <Text type="secondary">点击「刷新数据」按钮重新生成数据，系统将自动保存版本快照</Text>
              </Space>
            }
          />
        )}
      </Spin>
    </div>
  )
}

export default TrendAnalysis
