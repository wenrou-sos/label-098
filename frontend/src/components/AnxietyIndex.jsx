import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Row, Col, Card, Progress, Statistic, Table } from 'antd'

const TIER_ORDER = ['一线', '新一线', '二线', '三线']
const TIER_COLORS = {
  '一线': { main: '#f5222d', light: '#fff1f0' },
  '新一线': { main: '#fa8c16', light: '#fff7e6' },
  '二线': { main: '#1890ff', light: '#e6f7ff' },
  '三线': { main: '#52c41a', light: '#f6ffed' }
}

function AnxietyIndex({ data }) {
  const tiers = TIER_ORDER.filter(t => data[t])

  const anxietyGaugeOptions = useMemo(() => {
    return tiers.map(tier => {
      const info = data[tier]
      const level = info.anxiety_index
      return buildGauge(tier, level, info.anxiety_label)
    })
  }, [data])

  function buildGauge(tier, value, label) {
    const color = TIER_COLORS[tier].main
    return {
      series: [{
        type: 'gauge',
        center: ['50%', '60%'],
        radius: '85%',
        min: 0,
        max: 100,
        startAngle: 200,
        endAngle: -20,
        progress: { show: true, width: 18, itemStyle: { color } },
        pointer: { show: false },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [[1, TIER_COLORS[tier].light]]
          }
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: {
          offsetCenter: [0, '-10%'],
          fontSize: 14,
          color: '#333',
          fontWeight: 600
        },
        detail: {
          offsetCenter: [0, '15%'],
          valueAnimation: true,
          fontSize: 28,
          fontWeight: 700,
          formatter: '{value}',
          color
        },
        data: [{ value, name: `${tier}城市 · ${label}` }]
      }]
    }
  }

  const factorCompareOption = useMemo(() => {
    const factors = ['paid_rate', 'age_30_plus_pct', 'no_property_pct', 'low_income_pct']
    const factorLabels = {
      paid_rate: '付费率(%)',
      age_30_plus_pct: '30岁以上占比(%)',
      no_property_pct: '无房占比(%)',
      low_income_pct: '低收入占比(%)'
    }
    const series = factors.map((f, idx) => {
      const colors = ['#f5222d', '#fa8c16', '#1890ff', '#52c41a']
      return {
        name: factorLabels[f],
        type: 'bar',
        data: tiers.map(t => data[t][f]),
        itemStyle: { color: colors[idx], borderRadius: [4, 4, 0, 0] },
        barGap: '15%'
      }
    })
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, data: Object.values(factorLabels) },
      grid: { left: 50, right: 20, top: 50, bottom: 40 },
      xAxis: { type: 'category', data: tiers.map(t => t + '城市') },
      yAxis: { type: 'value', axisLabel: { formatter: '{value}%' }, max: 100 },
      series
    }
  }, [data])

  const paidScatterOption = useMemo(() => {
    const cityData = []
    tiers.forEach(tier => {
      const cities = data[tier].city_details || {}
      Object.entries(cities).forEach(([city, info]) => {
        cityData.push({
          name: city,
          value: [info.paid_rate, info.avg_spent, info.total],
          tier
        })
      })
    })
    return {
      tooltip: {
        formatter: (p) => {
          return `<b>${p.data.name}</b> (${p.data.tier})<br/>
            付费率: ${p.data.value[0]}%<br/>
            平均消费: ¥${p.data.value[1]}<br/>
            用户规模: ${p.data.value[2].toLocaleString()}`
        }
      },
      legend: {
        data: tiers.map(t => t + '城市'),
        top: 0
      },
      grid: { left: 60, right: 30, top: 50, bottom: 50 },
      xAxis: {
        type: 'value',
        name: '付费率 (%)',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: { formatter: '{value}%' }
      },
      yAxis: {
        type: 'value',
        name: '平均客单价 (元)',
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: { formatter: '¥{value}' }
      },
      series: tiers.map(tier => ({
        name: tier + '城市',
        type: 'scatter',
        data: cityData.filter(c => c.tier === tier).map(c => ({
          name: c.name,
          value: c.value,
          tier: c.tier
        })),
        symbolSize: (d) => Math.max(10, Math.sqrt(d[2]) / 2),
        itemStyle: {
          color: TIER_COLORS[tier].main,
          opacity: 0.7
        },
        emphasis: {
          label: { show: true, formatter: p => p.data.name, position: 'top' }
        }
      }))
    }
  }, [data])

  const vipDistOption = useMemo(() => {
    const vipLevels = ['月度会员', '季度会员', '年度会员', '钻石会员', '定制服务']
    const series = tiers.map(tier => {
      const dist = data[tier].vip_distribution || {}
      const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
      return {
        name: tier + '城市',
        type: 'line',
        stack: null,
        smooth: true,
        data: vipLevels.map(l => total ? Math.round((dist[l] || 0) / total * 1000) / 10 : 0),
        itemStyle: { color: TIER_COLORS[tier].main },
        lineStyle: { width: 3 }
      }
    })
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          let result = `<b>${params[0].name}</b><br/>`
          params.forEach(p => {
            result += `${p.marker}${p.seriesName}: ${p.value}%<br/>`
          })
          return result
        }
      },
      legend: { data: tiers.map(t => t + '城市'), top: 0 },
      grid: { left: 50, right: 20, top: 50, bottom: 40 },
      xAxis: { type: 'category', data: vipLevels, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
      series
    }
  }, [data])

  const cityRankData = useMemo(() => {
    const all = []
    tiers.forEach(tier => {
      const cities = data[tier].city_details || {}
      Object.entries(cities).forEach(([city, info]) => {
        all.push({
          key: city,
          city,
          tier,
          total: info.total,
          paid_count: info.paid_count,
          paid_rate: info.paid_rate,
          avg_spent: info.avg_spent,
          anxiety: data[tier].anxiety_index
        })
      })
    })
    return all.sort((a, b) => b.paid_rate - a.paid_rate)
  }, [data])

  const rankColumns = [
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      render: (t, r) => (
        <span>
          <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: TIER_COLORS[r.tier].main, marginRight: 6
          }} />
          {t}
          <span style={{ color: '#999', fontSize: 11, marginLeft: 4 }}>({r.tier})</span>
        </span>
      )
    },
    { title: '用户数', dataIndex: 'total', key: 'total', render: v => v.toLocaleString(), sorter: (a, b) => a.total - b.total },
    { title: '付费用户', dataIndex: 'paid_count', key: 'paid_count', render: v => v.toLocaleString() },
    {
      title: '付费率',
      dataIndex: 'paid_rate',
      key: 'paid_rate',
      render: v => `${v}%`,
      sorter: (a, b) => a.paid_rate - b.paid_rate,
      defaultSortOrder: 'descend'
    },
    {
      title: '平均客单价',
      dataIndex: 'avg_spent',
      key: 'avg_spent',
      render: v => `¥${v}`,
      sorter: (a, b) => a.avg_spent - b.avg_spent
    }
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {tiers.map((tier, i) => (
          <Col xs={12} md={6} key={tier}>
            <Card
              size="small"
              style={{
                background: `linear-gradient(135deg, ${TIER_COLORS[tier].light} 0%, white 100%)`,
                borderTop: `4px solid ${TIER_COLORS[tier].main}`
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: TIER_COLORS[tier].main }}>
                  {tier}城市
                </div>
                <div style={{ height: 180 }}>
                  <ReactECharts option={anxietyGaugeOptions[i]} style={{ height: '100%', width: '100%' }} />
                </div>
                <Row gutter={8} style={{ marginTop: 8 }}>
                  <Col span={12}>
                    <Statistic
                      title={<span style={{ fontSize: 11 }}>付费率</span>}
                      value={data[tier].paid_rate}
                      suffix="%"
                      valueStyle={{ fontSize: 16 }}
                      prefix="👑 "
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={<span style={{ fontSize: 11 }}>客单价</span>}
                      value={data[tier].avg_spent}
                      prefix="¥"
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <div className="chart-card">
            <div className="chart-title">焦虑指数构成因素对比</div>
            <div className="chart-container">
              <ReactECharts option={factorCompareOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div className="chart-card">
            <div className="chart-title">城市付费意愿 vs 客单价（气泡大小=用户规模）</div>
            <div className="chart-container">
              <ReactECharts option={paidScatterOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={10}>
          <div className="chart-card">
            <div className="chart-title">各线城市VIP等级分布</div>
            <div className="chart-container">
              <ReactECharts option={vipDistOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
        <Col xs={24} md={14}>
          <div className="chart-card">
            <div className="chart-title">城市付费榜</div>
            <Table
              dataSource={cityRankData}
              columns={rankColumns}
              pagination={{ pageSize: 6, size: 'small' }}
              size="small"
            />
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default AnxietyIndex
