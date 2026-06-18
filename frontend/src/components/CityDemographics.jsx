import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Row, Col, Select, Table, Tag, Card } from 'antd'

const TIER_COLORS = {
  '一线': '#f5222d',
  '新一线': '#fa8c16',
  '二线': '#1890ff',
  '三线': '#52c41a'
}

function CityDemographics({ data }) {
  const [selectedTier, setSelectedTier] = useState(null)
  const [selectedCity, setSelectedCity] = useState(null)

  const cities = Object.entries(data).map(([name, info]) => ({
    name,
    ...info
  }))

  const filteredCities = useMemo(() => {
    if (selectedTier) return cities.filter(c => c.tier === selectedTier)
    return cities
  }, [cities, selectedTier])

  const ratioOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const city = params[0].name
        const info = data[city]
        return `<b>${city}</b> (${info.tier})<br/>
          男性: ${info.males.toLocaleString()} (${info.male_ratio}%)<br/>
          女性: ${info.females.toLocaleString()} (${info.female_ratio}%)<br/>
          男/女比: ${info.ratio}<br/>
          状态: ${info.status}`
      }
    },
    legend: { data: ['男性占比', '女性占比'], top: 0 },
    grid: { left: 50, right: 30, top: 50, bottom: 120 },
    xAxis: {
      type: 'category',
      data: filteredCities.map(c => c.name),
      axisLabel: { rotate: 45, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [
      {
        name: '男性占比',
        type: 'bar',
        stack: 'total',
        data: filteredCities.map(c => c.male_ratio),
        itemStyle: { color: '#1890ff' },
        label: { show: false }
      },
      {
        name: '女性占比',
        type: 'bar',
        stack: 'total',
        data: filteredCities.map(c => c.female_ratio),
        itemStyle: { color: '#eb2f96' },
        label: { show: false }
      }
    ]
  }), [data, filteredCities])

  const ageDistOption = useMemo(() => {
    const target = selectedCity ? cities.find(c => c.name === selectedCity) : null
    if (!target) {
      const avgMale = { '20-25': 0, '26-30': 0, '31-35': 0, '36-40': 0, '40+': 0 }
      const avgFemale = { '20-25': 0, '26-30': 0, '31-35': 0, '36-40': 0, '40+': 0 }
      cities.forEach(c => {
        Object.keys(avgMale).forEach(k => {
          avgMale[k] += c.male_age_dist[k] || 0
          avgFemale[k] += c.female_age_dist[k] || 0
        })
      })
      Object.keys(avgMale).forEach(k => {
        avgMale[k] = Math.round(avgMale[k] / cities.length)
        avgFemale[k] = Math.round(avgFemale[k] / cities.length)
      })
      return buildAgeDistChart(avgMale, avgFemale, '全部城市平均')
    }
    return buildAgeDistChart(target.male_age_dist, target.female_age_dist, target.name)
  }, [selectedCity, cities])

  function buildAgeDistChart(maleDist, femaleDist, title) {
    const ageGroups = ['20-25', '26-30', '31-35', '36-40', '40+']
    return {
      title: { text: `${title} 年龄分布`, left: 'center', top: 0, textStyle: { fontSize: 14 } },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const age = params[0].name
          let result = `<b>${age}岁</b><br/>`
          params.forEach(p => {
            result += `${p.marker}${p.seriesName}: ${Math.abs(p.value)}人<br/>`
          })
          return result
        }
      },
      legend: { data: ['男性', '女性'], top: 28 },
      grid: { left: 60, right: 60, top: 70, bottom: 40 },
      xAxis: [
        {
          type: 'value',
          axisLabel: { formatter: (v) => Math.abs(v) }
        }
      ],
      yAxis: {
        type: 'category',
        data: ageGroups,
        axisLabel: { fontSize: 12 }
      },
      series: [
        {
          name: '男性',
          type: 'bar',
          data: ageGroups.map(a => -(maleDist[a] || 0)),
          itemStyle: { color: '#1890ff' },
          barWidth: 20
        },
        {
          name: '女性',
          type: 'bar',
          data: ageGroups.map(a => femaleDist[a] || 0),
          itemStyle: { color: '#eb2f96' },
          barWidth: 20,
          label: {
            show: true,
            formatter: (p) => Math.abs(p.value),
            position: 'right'
          }
        }
      ]
    }
  }

  const tableData = cities.map(c => ({
    key: c.name,
    city: c.name,
    tier: c.tier,
    total: c.total,
    males: c.males,
    females: c.females,
    ratio: c.ratio,
    status: c.status,
    maleAvgAge: c.male_avg_age,
    femaleAvgAge: c.female_avg_age
  })).sort((a, b) => b.total - a.total)

  const columns = [
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      fixed: 'left',
      render: (text, record) => (
        <span>
          <Tag color={TIER_COLORS[record.tier]}>{record.tier}</Tag>
          {text}
        </span>
      )
    },
    { title: '用户数', dataIndex: 'total', key: 'total', sorter: (a, b) => a.total - b.total, render: v => v.toLocaleString() },
    { title: '男性', dataIndex: 'males', key: 'males', render: v => v.toLocaleString() },
    { title: '女性', dataIndex: 'females', key: 'females', render: v => v.toLocaleString() },
    { title: '性别比(男/女)', dataIndex: 'ratio', key: 'ratio', sorter: (a, b) => a.ratio - b.ratio },
    {
      title: '结构状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        if (s === '男多女少') return <Tag color="blue">{s}</Tag>
        if (s === '女多男少') return <Tag color="magenta">{s}</Tag>
        return <Tag color="green">{s}</Tag>
      }
    },
    { title: '男性平均年龄', dataIndex: 'maleAvgAge', key: 'maleAvgAge' },
    { title: '女性平均年龄', dataIndex: 'femaleAvgAge', key: 'femaleAvgAge' }
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card size="small" style={{ marginBottom: 8 }}>
            <Select
              style={{ width: 160 }}
              placeholder="筛选城市线级"
              allowClear
              onChange={setSelectedTier}
              options={[
                { value: '一线', label: '一线城市' },
                { value: '新一线', label: '新一线城市' },
                { value: '二线', label: '二线城市' },
                { value: '三线', label: '三线城市' }
              ]}
            />
          </Card>
          <div className="chart-card">
            <div className="chart-title">各城市男女比例分布</div>
            <div className="chart-container">
              <ReactECharts option={ratioOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" style={{ marginBottom: 8 }}>
            <Select
              style={{ width: 200 }}
              placeholder="选择城市查看详情"
              allowClear
              showSearch
              onChange={setSelectedCity}
              options={cities.map(c => ({ value: c.name, label: c.name }))}
            />
          </Card>
          <div className="chart-card">
            <div className="chart-container">
              <ReactECharts option={ageDistOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
      </Row>

      <div className="chart-card">
        <div className="chart-title">全量城市人口结构明细</div>
        <Table
          dataSource={tableData}
          columns={columns}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          size="small"
        />
      </div>
    </div>
  )
}

export default CityDemographics
