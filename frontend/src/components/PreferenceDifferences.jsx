import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Row, Col } from 'antd'

function PreferenceDifferences({ data }) {
  const ageGroups = ['20-25', '26-30', '31-35', '36-40', '40+']
  const reqTypes = [
    { key: 'education_req', label: '学历硬性要求' },
    { key: 'income_req', label: '收入硬性要求' },
    { key: 'property_req', label: '房产硬性要求' },
    { key: 'height_req', label: '身高硬性要求' }
  ]

  const radarOption = useMemo(() => {
    const indicators = reqTypes.map(r => ({ name: r.label, max: 100 }))
    return {
      tooltip: {},
      legend: { data: ['男性用户', '女性用户'], top: 0 },
      radar: {
        indicator: indicators,
        center: ['50%', '55%'],
        radius: '60%',
        splitArea: {
          areaStyle: {
            color: ['rgba(235,47,150,0.05)', 'rgba(24,144,255,0.05)']
          }
        }
      },
      series: [{
        type: 'radar',
        areaStyle: {},
        data: [
          {
            value: reqTypes.map(r => {
              const vals = ageGroups.map(ag => (data['男']?.[ag]?.[r.key]) || 0)
              return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
            }),
            name: '男性用户',
            itemStyle: { color: '#1890ff' },
            areaStyle: { color: 'rgba(24,144,255,0.2)' }
          },
          {
            value: reqTypes.map(r => {
              const vals = ageGroups.map(ag => (data['女']?.[ag]?.[r.key]) || 0)
              return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
            }),
            name: '女性用户',
            itemStyle: { color: '#eb2f96' },
            areaStyle: { color: 'rgba(235,47,150,0.2)' }
          }
        ]
      }]
    }
  }, [data])

  const maleOption = useMemo(() => buildBarChart(data, '男', '男性用户择偶硬性要求比例'), [data])
  const femaleOption = useMemo(() => buildBarChart(data, '女', '女性用户择偶硬性要求比例'), [data])

  function buildBarChart(d, gender, title) {
    const series = reqTypes.map((r, idx) => {
      const colors = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1']
      return {
        name: r.label,
        type: 'bar',
        data: ageGroups.map(ag => (d[gender]?.[ag]?.[r.key]) || 0),
        itemStyle: { color: colors[idx] },
        barGap: '10%'
      }
    })
    return {
      title: { text: title, left: 'center', top: 0, textStyle: { fontSize: 14 } },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const ag = params[0].name
          const info = d[gender]?.[ag]
          let result = `<b>${ag}岁 ${gender}性</b> (样本: ${info?.total || 0}人)<br/>`
          params.forEach(p => {
            result += `${p.marker}${p.seriesName}: ${p.value}%<br/>`
          })
          return result
        }
      },
      legend: {
        data: reqTypes.map(r => r.label),
        top: 28,
        textStyle: { fontSize: 11 }
      },
      grid: { left: 50, right: 20, top: 80, bottom: 40 },
      xAxis: {
        type: 'category',
        data: ageGroups.map(a => a + '岁'),
        axisLabel: { fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%' }
      },
      series
    }
  }

  const trendOption = useMemo(() => {
    return {
      title: { text: '硬性要求率随年龄变化趋势', left: 'center', top: 0, textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      legend: {
        top: 28,
        data: ['男-学历', '女-学历', '男-收入', '女-收入', '男-房产', '女-房产', '男-身高', '女-身高'],
        textStyle: { fontSize: 10 }
      },
      grid: { left: 50, right: 30, top: 100, bottom: 40 },
      xAxis: {
        type: 'category',
        data: ageGroups.map(a => a + '岁'),
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%' }
      },
      series: [
        { name: '男-学历', type: 'line', smooth: true, data: ageGroups.map(a => data['男']?.[a]?.education_req || 0), itemStyle: { color: '#1890ff' }, lineStyle: { type: 'solid' } },
        { name: '女-学历', type: 'line', smooth: true, data: ageGroups.map(a => data['女']?.[a]?.education_req || 0), itemStyle: { color: '#eb2f96' }, lineStyle: { type: 'solid' } },
        { name: '男-收入', type: 'line', smooth: true, data: ageGroups.map(a => data['男']?.[a]?.income_req || 0), itemStyle: { color: '#1890ff' }, lineStyle: { type: 'dashed' } },
        { name: '女-收入', type: 'line', smooth: true, data: ageGroups.map(a => data['女']?.[a]?.income_req || 0), itemStyle: { color: '#eb2f96' }, lineStyle: { type: 'dashed' } },
        { name: '男-房产', type: 'line', smooth: true, data: ageGroups.map(a => data['男']?.[a]?.property_req || 0), itemStyle: { color: '#1890ff' }, lineStyle: { type: 'dotted' } },
        { name: '女-房产', type: 'line', smooth: true, data: ageGroups.map(a => data['女']?.[a]?.property_req || 0), itemStyle: { color: '#eb2f96' }, lineStyle: { type: 'dotted' } },
        { name: '男-身高', type: 'line', smooth: true, data: ageGroups.map(a => data['男']?.[a]?.height_req || 0), itemStyle: { color: '#1890ff' }, lineStyle: { width: 1, opacity: 0.5 } },
        { name: '女-身高', type: 'line', smooth: true, data: ageGroups.map(a => data['女']?.[a]?.height_req || 0), itemStyle: { color: '#eb2f96' }, lineStyle: { width: 1, opacity: 0.5 } }
      ]
    }
  }, [data])

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={10}>
          <div className="chart-card">
            <div className="chart-container">
              <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
        <Col xs={24} md={14}>
          <div className="chart-card">
            <div className="chart-container">
              <ReactECharts option={trendOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <div className="chart-card">
            <div className="chart-container">
              <ReactECharts option={maleOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div className="chart-card">
            <div className="chart-container">
              <ReactECharts option={femaleOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default PreferenceDifferences
