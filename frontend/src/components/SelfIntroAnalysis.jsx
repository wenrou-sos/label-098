import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Row, Col, Segmented, Divider, Progress, Tag } from 'antd'

const FOCUS_KEYS = [
  { key: '经济独立', male: '男性关注', female: '女性关注' },
  { key: '性格好', male: '男性关注', female: '女性关注' },
  { key: '有上进心', male: '男性关注', female: '女性关注' },
  { key: '顾家', male: '男性关注', female: '女性关注' },
  { key: '温柔', male: '男性关注', female: '女性关注' },
  { key: '孝顺', male: '男性关注', female: '女性关注' },
  { key: '责任心', male: '男性关注', female: '女性关注' },
  { key: '成熟', male: '男性关注', female: '女性关注' },
  { key: '幽默', male: '男性关注', female: '女性关注' },
  { key: '有房', male: '男性关注', female: '女性关注' },
  { key: '稳定', male: '男性关注', female: '女性关注' },
  { key: '三观', male: '男性关注', female: '女性关注' }
]

function SelfIntroAnalysis({ data }) {
  const [viewMode, setViewMode] = useState('对比')

  const maleKeywords = data['男']?.top_keywords || []
  const femaleKeywords = data['女']?.top_keywords || []
  const maleFocus = data['男']?.focus_rates || {}
  const femaleFocus = data['女']?.focus_rates || {}

  const keywordBarOption = useMemo(() => {
    if (viewMode === '男性') {
      return buildKeywordBar(maleKeywords, '男性用户高频词 Top20', '#1890ff')
    } else if (viewMode === '女性') {
      return buildKeywordBar(femaleKeywords, '女性用户高频词 Top20', '#eb2f96')
    }
    return buildKeywordCompare(maleKeywords, femaleKeywords)
  }, [viewMode, maleKeywords, femaleKeywords])

  function buildKeywordBar(keywords, title, color) {
    const sorted = [...keywords].sort((a, b) => a.count - b.count)
    return {
      title: { text: title, left: 'center', top: 0, textStyle: { fontSize: 14 } },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (p) => `${p[0].name}: ${p[0].value}次`
      },
      grid: { left: 80, right: 40, top: 50, bottom: 30 },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: sorted.map(k => k.word),
        axisLabel: { fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: sorted.map(k => k.count),
        itemStyle: {
          color,
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          fontSize: 10
        },
        barWidth: 14
      }]
    }
  }

  function buildKeywordCompare(male, female) {
    const allWords = new Set([...male.map(k => k.word), ...female.map(k => k.word)])
    const maleMap = Object.fromEntries(male.map(k => [k.word, k.count]))
    const femaleMap = Object.fromEntries(female.map(k => [k.word, k.count]))
    
    const wordList = Array.from(allWords)
    wordList.sort((a, b) => {
      const ma = maleMap[a] || 0
      const mb = maleMap[b] || 0
      const fa = femaleMap[a] || 0
      const fb = femaleMap[b] || 0
      return (ma + fa) - (mb + fb)
    })

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const w = params[0].name
          return `<b>${w}</b><br/>
            🔵 男性: ${maleMap[w] || 0}次<br/>
            🔴 女性: ${femaleMap[w] || 0}次`
        }
      },
      legend: { data: ['男性', '女性'], top: 0 },
      grid: { left: 80, right: 60, top: 40, bottom: 30 },
      xAxis: [{
        type: 'value',
        axisLabel: { formatter: v => Math.abs(v) }
      }],
      yAxis: {
        type: 'category',
        data: wordList,
        axisLabel: { fontSize: 11 }
      },
      series: [
        {
          name: '男性',
          type: 'bar',
          data: wordList.map(w => -(maleMap[w] || 0)),
          itemStyle: { color: '#1890ff' },
          barWidth: 12
        },
        {
          name: '女性',
          type: 'bar',
          data: wordList.map(w => femaleMap[w] || 0),
          itemStyle: { color: '#eb2f96' },
          barWidth: 12
        }
      ]
    }
  }

  const focusCompare = useMemo(() => {
    const keys = FOCUS_KEYS.map(k => k.key)
    const maleVals = keys.map(k => maleFocus[k] || 0)
    const femaleVals = keys.map(k => femaleFocus[k] || 0)
    const diff = keys.map(k => {
      const m = maleFocus[k] || 0
      const f = femaleFocus[k] || 0
      return m - f
    })
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const k = params[0].name
          const m = maleFocus[k] || 0
          const f = femaleFocus[k] || 0
          return `<b>${k} 提及率</b><br/>
            🔵 男性: ${m}%<br/>
            🔴 女性: ${f}%<br/>
            差值: ${(m - f) > 0 ? '+' : ''}${(m - f).toFixed(1)}%`
        }
      },
      legend: { data: ['男性', '女性', '差值(男-女)'], top: 0 },
      grid: { left: 60, right: 60, top: 50, bottom: 40 },
      xAxis: {
        type: 'category',
        data: keys,
        axisLabel: { rotate: 30, fontSize: 10 }
      },
      yAxis: [
        { type: 'value', axisLabel: { formatter: '{value}%' }, name: '提及率' },
        { type: 'value', axisLabel: { formatter: '{value}%' }, name: '差值' }
      ],
      series: [
        {
          name: '男性',
          type: 'bar',
          data: maleVals,
          itemStyle: { color: '#1890ff' },
          barGap: '0%'
        },
        {
          name: '女性',
          type: 'bar',
          data: femaleVals,
          itemStyle: { color: '#eb2f96' }
        },
        {
          name: '差值(男-女)',
          type: 'line',
          yAxisIndex: 1,
          data: diff,
          itemStyle: { color: '#722ed1' },
          lineStyle: { type: 'dashed' },
          symbol: 'diamond',
          symbolSize: 10
        }
      ]
    }
  }, [maleFocus, femaleFocus])

  const biggestDiff = useMemo(() => {
    const diffs = Object.keys({ ...maleFocus, ...femaleFocus }).map(k => ({
      key: k,
      male: maleFocus[k] || 0,
      female: femaleFocus[k] || 0,
      diff: (maleFocus[k] || 0) - (femaleFocus[k] || 0)
    }))
    const maleMore = [...diffs].sort((a, b) => b.diff - a.diff).slice(0, 5)
    const femaleMore = [...diffs].sort((a, b) => a.diff - b.diff).slice(0, 5)
    return { maleMore, femaleMore }
  }, [maleFocus, femaleFocus])

  return (
    <div>
      <div className="chart-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="chart-title" style={{ marginBottom: 0 }}>
            自我介绍文本关键词分析
          </div>
          <Segmented
            options={['对比', '男性', '女性']}
            value={viewMode}
            onChange={setViewMode}
          />
        </div>
        <div className="chart-container" style={{ height: 450 }}>
          <ReactECharts option={keywordBarOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <div className="chart-card">
            <div className="chart-title">核心关注点男女提及率对比</div>
            <div className="chart-container">
              <ReactECharts option={focusCompare} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div className="chart-card" style={{ marginBottom: 16 }}>
            <div className="chart-title">🔵 男性更看重 (提及率差值Top5)</div>
            {biggestDiff.maleMore.map((item, i) => (
              <div key={item.key} className="focus-bar">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span><Tag color="blue">#{i + 1}</Tag>{item.key}</span>
                  <span style={{ color: '#52c41a' }}>+{item.diff.toFixed(1)}%</span>
                </div>
                <Progress
                  percent={item.male}
                  showInfo={false}
                  strokeColor="#1890ff"
                  size="small"
                  style={{ marginBottom: 4 }}
                />
                <div style={{ fontSize: 11, color: '#888', textAlign: 'right' }}>
                  男 {item.male}% / 女 {item.female}%
                </div>
              </div>
            ))}
          </div>
          <div className="chart-card">
            <div className="chart-title">🔴 女性更看重 (提及率差值Top5)</div>
            {biggestDiff.femaleMore.map((item, i) => (
              <div key={item.key} className="focus-bar">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span><Tag color="magenta">#{i + 1}</Tag>{item.key}</span>
                  <span style={{ color: '#eb2f96' }}>+{Math.abs(item.diff).toFixed(1)}%</span>
                </div>
                <Progress
                  percent={item.female}
                  showInfo={false}
                  strokeColor="#eb2f96"
                  size="small"
                  style={{ marginBottom: 4 }}
                />
                <div style={{ fontSize: 11, color: '#888', textAlign: 'right' }}>
                  女 {item.female}% / 男 {item.male}%
                </div>
              </div>
            ))}
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default SelfIntroAnalysis
