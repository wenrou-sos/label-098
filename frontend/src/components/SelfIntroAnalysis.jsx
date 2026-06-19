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

function SelfIntroAnalysis({ data, globalFilter = null }) {
  const [viewMode, setViewMode] = useState('对比')

  const globalGender = globalFilter?.gender || null
  const hasMale = (data['男']?.top_keywords?.length || 0) > 0
  const hasFemale = (data['女']?.top_keywords?.length || 0) > 0

  const maleKeywords = data['男']?.top_keywords || []
  const femaleKeywords = data['女']?.top_keywords || []
  const maleFocus = data['男']?.focus_rates || {}
  const femaleFocus = data['女']?.focus_rates || {}

  const segmentOptions = useMemo(() => {
    const opts = []
    if (hasMale && hasFemale) opts.push('对比')
    if (hasMale) opts.push('男性')
    if (hasFemale) opts.push('女性')
    return opts
  }, [hasMale, hasFemale])

  const effectiveViewMode = useMemo(() => {
    if (hasMale && hasFemale) return viewMode
    if (hasMale) return '男性'
    if (hasFemale) return '女性'
    return viewMode
  }, [viewMode, hasMale, hasFemale])

  const keywordBarOption = useMemo(() => {
    if (effectiveViewMode === '男性') {
      return buildKeywordBar(maleKeywords, globalGender ? `${globalGender}性用户高频词 Top20` : '男性用户高频词 Top20', '#1890ff')
    } else if (effectiveViewMode === '女性') {
      return buildKeywordBar(femaleKeywords, globalGender ? `${globalGender}性用户高频词 Top20` : '女性用户高频词 Top20', '#eb2f96')
    }
    return buildKeywordCompare(maleKeywords, femaleKeywords)
  }, [effectiveViewMode, maleKeywords, femaleKeywords, globalGender])

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

    const series = []
    const legendData = []
    if (hasMale) {
      legendData.push('男性')
      series.push({
        name: '男性',
        type: 'bar',
        data: maleVals,
        itemStyle: { color: '#1890ff' },
        barGap: '0%'
      })
    }
    if (hasFemale) {
      legendData.push('女性')
      series.push({
        name: '女性',
        type: 'bar',
        data: femaleVals,
        itemStyle: { color: '#eb2f96' }
      })
    }
    if (hasMale && hasFemale) {
      legendData.push('差值(男-女)')
      series.push({
        name: '差值(男-女)',
        type: 'line',
        yAxisIndex: 1,
        data: diff,
        itemStyle: { color: '#722ed1' },
        lineStyle: { type: 'dashed' },
        symbol: 'diamond',
        symbolSize: 10
      })
    }

    const yAxisList = [{ type: 'value', axisLabel: { formatter: '{value}%' }, name: '提及率' }]
    if (hasMale && hasFemale) {
      yAxisList.push({ type: 'value', axisLabel: { formatter: '{value}%' }, name: '差值' })
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const k = params[0].name
          let result = `<b>${k} 提及率</b><br/>`
          if (hasMale) result += `🔵 男性: ${maleFocus[k] || 0}%<br/>`
          if (hasFemale) result += `🔴 女性: ${femaleFocus[k] || 0}%<br/>`
          if (hasMale && hasFemale) {
            const m = maleFocus[k] || 0
            const f = femaleFocus[k] || 0
            result += `差值: ${(m - f) > 0 ? '+' : ''}${(m - f).toFixed(1)}%`
          }
          return result
        }
      },
      legend: { data: legendData, top: 0 },
      grid: { left: 60, right: 60, top: 50, bottom: 40 },
      xAxis: {
        type: 'category',
        data: keys,
        axisLabel: { rotate: 30, fontSize: 10 }
      },
      yAxis: yAxisList,
      series
    }
  }, [maleFocus, femaleFocus, hasMale, hasFemale])

  const biggestDiff = useMemo(() => {
    const allKeys = Object.keys({ ...maleFocus, ...femaleFocus })
    if (hasMale && hasFemale) {
      const diffs = allKeys.map(k => ({
        key: k,
        male: maleFocus[k] || 0,
        female: femaleFocus[k] || 0,
        diff: (maleFocus[k] || 0) - (femaleFocus[k] || 0)
      }))
      const maleMore = [...diffs].sort((a, b) => b.diff - a.diff).slice(0, 5)
      const femaleMore = [...diffs].sort((a, b) => a.diff - b.diff).slice(0, 5)
      return { maleMore, femaleMore }
    }
    if (hasMale) {
      const sorted = allKeys.map(k => ({
        key: k, male: maleFocus[k] || 0, female: 0, diff: maleFocus[k] || 0
      })).sort((a, b) => b.male - a.male)
      return { maleMore: sorted.slice(0, 5), femaleMore: [] }
    }
    if (hasFemale) {
      const sorted = allKeys.map(k => ({
        key: k, male: 0, female: femaleFocus[k] || 0, diff: femaleFocus[k] || 0
      })).sort((a, b) => b.female - a.female)
      return { maleMore: [], femaleMore: sorted.slice(0, 5) }
    }
    return { maleMore: [], femaleMore: [] }
  }, [maleFocus, femaleFocus, hasMale, hasFemale])

  return (
    <div>
      {globalGender && (
        <div style={{
          padding: '8px 16px',
          background: '#fff7e6',
          border: '1px solid #ffd591',
          borderRadius: 4,
          marginBottom: 16,
          color: '#d46b08',
          fontSize: 13
        }}>
          ⚠️ 当前全局筛选为单一性别（{globalGender}性），页面仅展示该性别数据
        </div>
      )}
      <div className="chart-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="chart-title" style={{ marginBottom: 0 }}>
            自我介绍文本关键词分析
          </div>
          <Segmented
            options={segmentOptions}
            value={effectiveViewMode}
            onChange={setViewMode}
          />
        </div>
        <div className="chart-container" style={{ height: 450 }}>
          <ReactECharts option={keywordBarOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={hasMale && hasFemale ? 16 : 24}>
          <div className="chart-card">
            <div className="chart-title">
              {hasMale && hasFemale
                ? '核心关注点男女提及率对比'
                : ('核心关注点提及率（' + (globalGender || (hasMale ? '男性' : '女性')) + '）')}
            </div>
            <div className="chart-container">
              <ReactECharts option={focusCompare} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
        {(hasMale || hasFemale) && (
          <Col xs={24} md={8}>
            {hasMale && biggestDiff.maleMore.length > 0 && (
              <div className="chart-card" style={{ marginBottom: 16 }}>
                <div className="chart-title">
                  {hasFemale ? '🔵 男性更看重 (提及率差值Top5)' : `🔵 男性最关注的关键词 (提及率Top5)`}
                </div>
                {biggestDiff.maleMore.map((item, i) => (
                  <div key={item.key} className="focus-bar">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span><Tag color="blue">#{i + 1}</Tag>{item.key}</span>
                      {hasFemale ? (
                        <span style={{ color: '#52c41a' }}>+{item.diff.toFixed(1)}%</span>
                      ) : (
                        <span style={{ color: '#1890ff' }}>{item.male}%</span>
                      )}
                    </div>
                    <Progress
                      percent={item.male}
                      showInfo={false}
                      strokeColor="#1890ff"
                      size="small"
                      style={{ marginBottom: 4 }}
                    />
                    {hasFemale && (
                      <div style={{ fontSize: 11, color: '#888', textAlign: 'right' }}>
                        男 {item.male}% / 女 {item.female}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {hasFemale && biggestDiff.femaleMore.length > 0 && (
              <div className="chart-card">
                <div className="chart-title">
                  {hasMale ? '🔴 女性更看重 (提及率差值Top5)' : `🔴 女性最关注的关键词 (提及率Top5)`}
                </div>
                {biggestDiff.femaleMore.map((item, i) => (
                  <div key={item.key} className="focus-bar">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span><Tag color="magenta">#{i + 1}</Tag>{item.key}</span>
                      {hasMale ? (
                        <span style={{ color: '#eb2f96' }}>+{Math.abs(item.diff).toFixed(1)}%</span>
                      ) : (
                        <span style={{ color: '#eb2f96' }}>{item.female}%</span>
                      )}
                    </div>
                    <Progress
                      percent={item.female}
                      showInfo={false}
                      strokeColor="#eb2f96"
                      size="small"
                      style={{ marginBottom: 4 }}
                    />
                    {hasMale && (
                      <div style={{ fontSize: 11, color: '#888', textAlign: 'right' }}>
                        女 {item.female}% / 男 {item.male}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Col>
        )}
      </Row>
    </div>
  )
}

export default SelfIntroAnalysis
