import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Row, Col, Card, Statistic, Descriptions, Tag, Progress } from 'antd'

const EDU_LEVELS = ['高中', '大专', '本科', '硕士', '博士']
const INCOME_LEVELS = ['5k以下', '5k-10k', '10k-20k', '20k-50k', '50k以上']

function MatchSuccess({ data }) {
  const stats = data.key_statistics || {}

  const ageDiffOption = useMemo(() => {
    const dist = data.age_diff_distribution || {}
    const categories = [
      '女大6岁+', '女大4-6岁', '女大2-4岁', '女大0-2岁',
      '男大0-2岁', '男大2-4岁', '男大4-6岁', '男大6岁+'
    ]
    const realKeys = [
      '女大6岁以上', '女大4-6岁', '女大2-4岁', '女大0-2岁',
      '男大0-2岁', '男大2-4岁', '男大4-6岁', '男大6岁以上'
    ]
    const values = realKeys.map(k => dist[k]?.count || 0)
    const pcts = realKeys.map(k => dist[k]?.pct || 0)
    const centerIdx = 4

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const idx = params[0].dataIndex
          return `<b>${categories[idx]}</b><br/>
            配对数: ${values[idx].toLocaleString()}<br/>
            占比: ${pcts[idx]}%`
        }
      },
      grid: { left: 80, right: 40, top: 30, bottom: 50 },
      xAxis: {
        type: 'value',
        axisLabel: { formatter: v => v.toLocaleString() }
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          fontSize: 11,
          formatter: (value, idx) => {
            if (idx >= centerIdx) return '{a|' + value + '}'
            return '{b|' + value + '}'
          },
          rich: {
            a: { color: '#1890ff', fontWeight: 600, padding: [0, 4] },
            b: { color: '#eb2f96', fontWeight: 600, padding: [0, 4] }
          }
        }
      },
      series: [{
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: i >= centerIdx ? '#1890ff' : '#eb2f96',
            borderRadius: i >= centerIdx ? [0, 6, 6, 0] : [6, 0, 0, 6]
          }
        })),
        barWidth: 18,
        label: {
          show: true,
          formatter: (p) => `${pcts[p.dataIndex]}%`,
          position: 'right',
          fontSize: 11
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#999' },
          data: [{ xAxis: 0, label: { show: false } }]
        }
      }]
    }
  }, [data])

  const eduDiffOption = useMemo(() => {
    const dist = data.education_diff_distribution || {}
    const cats = ['男方低2级+', '男方低1级', '同级', '男方高1级', '男方高2级+']
    const realKeys = ['男方低2级以上', '男方低1级', '同级', '男方高1级', '男方高2级以上']
    const values = realKeys.map(k => dist[k]?.count || 0)
    const pcts = realKeys.map(k => dist[k]?.pct || 0)

    return {
      tooltip: {
        trigger: 'item',
        formatter: (p) => `<b>${cats[p.dataIndex]}</b><br/>配对数: ${values[p.dataIndex].toLocaleString()}<br/>占比: ${pcts[p.dataIndex]}%`
      },
      legend: { bottom: 0, data: cats, textStyle: { fontSize: 11 } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: cats.map((c, i) => ({
          name: c,
          value: values[i],
          itemStyle: {
            color: ['#ff4d4f', '#ff7a45', '#52c41a', '#1890ff', '#722ed1'][i]
          }
        }))
      }]
    }
  }, [data])

  const incomeDiffOption = useMemo(() => {
    const dist = data.income_diff_distribution || {}
    const cats = ['女方高2级+', '女方高1级', '同级', '男方高1级', '男方高2级+']
    const realKeys = ['女方高2级以上', '女方高1级', '同级', '男方高1级', '男方高2级以上']
    const values = realKeys.map(k => dist[k]?.count || 0)
    const pcts = realKeys.map(k => dist[k]?.pct || 0)

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (p) => `<b>${cats[p[0].dataIndex]}</b><br/>配对数: ${values[p[0].dataIndex].toLocaleString()}<br/>占比: ${pcts[p[0].dataIndex]}%`
      },
      grid: { left: 50, right: 30, top: 20, bottom: 60 },
      xAxis: {
        type: 'category',
        data: cats,
        axisLabel: { rotate: 20, fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}%' },
        max: 50
      },
      series: [{
        type: 'bar',
        data: pcts.map((v, i) => ({
          value: v,
          itemStyle: {
            color: ['#f5222d', '#fa8c16', '#52c41a', '#1890ff', '#722ed1'][i],
            borderRadius: [6, 6, 0, 0]
          }
        })),
        barWidth: 32,
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          fontSize: 11
        }
      }]
    }
  }, [data])

  const eduHeatmapOption = useMemo(() => {
    const mat = data.education_combination || {}
    const matrixData = []
    let maxVal = 0
    for (let i = 0; i < EDU_LEVELS.length; i++) {
      for (let j = 0; j < EDU_LEVELS.length; j++) {
        const key = `${EDU_LEVELS[i]}_${EDU_LEVELS[j]}`
        const val = mat[key] || 0
        matrixData.push([j, i, val])
        if (val > maxVal) maxVal = val
      }
    }

    return {
      tooltip: {
        position: 'top',
        formatter: (p) => {
          const [fx, my, val] = p.data
          return `男方: ${EDU_LEVELS[my]}<br/>女方: ${EDU_LEVELS[fx]}<br/>成功配对: ${val.toLocaleString()}`
        }
      },
      grid: { left: 90, right: 40, top: 50, bottom: 80 },
      xAxis: {
        type: 'category',
        data: EDU_LEVELS,
        splitArea: { show: true },
        axisLabel: { fontSize: 10, rotate: 20 },
        name: '女方学历 →',
        nameLocation: 'middle',
        nameGap: 50
      },
      yAxis: {
        type: 'category',
        data: EDU_LEVELS,
        splitArea: { show: true },
        axisLabel: { fontSize: 10 },
        name: '← 男方学历',
        nameLocation: 'middle',
        nameGap: 60
      },
      visualMap: {
        min: 0,
        max: maxVal,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 10,
        inRange: {
          color: ['#f5f5f5', '#ffd6e7', '#ff85c0', '#eb2f96', '#c41d7f']
        }
      },
      series: [{
        name: '成功配对数',
        type: 'heatmap',
        data: matrixData,
        label: {
          show: true,
          fontSize: 10,
          formatter: (p) => p.value[2] ? p.value[2] : ''
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
  }, [data])

  const incomeHeatmapOption = useMemo(() => {
    const mat = data.income_combination || {}
    const matrixData = []
    let maxVal = 0
    for (let i = 0; i < INCOME_LEVELS.length; i++) {
      for (let j = 0; j < INCOME_LEVELS.length; j++) {
        const key = `${INCOME_LEVELS[i]}_${INCOME_LEVELS[j]}`
        const val = mat[key] || 0
        matrixData.push([j, i, val])
        if (val > maxVal) maxVal = val
      }
    }

    return {
      tooltip: {
        position: 'top',
        formatter: (p) => {
          const [fx, my, val] = p.data
          return `男方收入: ${INCOME_LEVELS[my]}<br/>女方收入: ${INCOME_LEVELS[fx]}<br/>成功配对: ${val.toLocaleString()}`
        }
      },
      grid: { left: 100, right: 40, top: 50, bottom: 80 },
      xAxis: {
        type: 'category',
        data: INCOME_LEVELS,
        splitArea: { show: true },
        axisLabel: { fontSize: 9, rotate: 20 },
        name: '女方收入 →',
        nameLocation: 'middle',
        nameGap: 55
      },
      yAxis: {
        type: 'category',
        data: INCOME_LEVELS,
        splitArea: { show: true },
        axisLabel: { fontSize: 9 },
        name: '← 男方收入',
        nameLocation: 'middle',
        nameGap: 70
      },
      visualMap: {
        min: 0,
        max: maxVal,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 10,
        inRange: {
          color: ['#f0f5ff', '#bae7ff', '#69c0ff', '#1890ff', '#0050b3']
        }
      },
      series: [{
        name: '成功配对数',
        type: 'heatmap',
        data: matrixData,
        label: {
          show: true,
          fontSize: 9,
          formatter: (p) => p.value[2] ? p.value[2] : ''
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
  }, [data])

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card style={{ borderTop: '4px solid #52c41a' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>总配对尝试数</span>}
              value={data.total_matches}
              prefix="👥 "
              valueStyle={{ fontSize: 24, color: '#333' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderTop: '4px solid #eb2f96' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>成功牵手对数</span>}
              value={data.success_count}
              prefix="💖 "
              valueStyle={{ fontSize: 24, color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderTop: '4px solid #1890ff' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>整体成功率</span>}
              value={data.success_rate}
              suffix="%"
              prefix="🏆 "
              valueStyle={{ fontSize: 24, color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderTop: '4px solid #722ed1' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>平均年龄差</span>}
              value={Math.abs(stats.avg_age_diff)}
              suffix="岁"
              prefix="😊 "
              valueStyle={{ fontSize: 24, color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="chart-card" style={{ marginBottom: 16 }}>
        <div className="chart-title">🎯 成功配对核心规律统计</div>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="男方年龄偏大占比">
            <Tag color="blue">{stats.male_older_pct}%</Tag>
            <Progress percent={stats.male_older_pct} size="small" strokeColor="#1890ff" style={{ marginTop: 4 }} />
          </Descriptions.Item>
          <Descriptions.Item label="年龄差在3岁以内">
            <Tag color="green">{stats.age_diff_within_3_pct}%</Tag>
            <Progress percent={stats.age_diff_within_3_pct} size="small" strokeColor="#52c41a" style={{ marginTop: 4 }} />
          </Descriptions.Item>
          <Descriptions.Item label="学历相同配对">
            <Tag color="purple">{stats.edu_same_pct}%</Tag>
            <Progress percent={stats.edu_same_pct} size="small" strokeColor="#722ed1" style={{ marginTop: 4 }} />
          </Descriptions.Item>
          <Descriptions.Item label="收入相同配对">
            <Tag color="cyan">{stats.income_same_pct}%</Tag>
            <Progress percent={stats.income_same_pct} size="small" strokeColor="#13c2c2" style={{ marginTop: 4 }} />
          </Descriptions.Item>
          <Descriptions.Item label="男方学历更高">
            <Tag color="geekblue">{stats.male_higher_edu_pct}%</Tag>
            <Progress percent={stats.male_higher_edu_pct} size="small" strokeColor="#2f54eb" style={{ marginTop: 4 }} />
          </Descriptions.Item>
          <Descriptions.Item label="男方收入更高">
            <Tag color="magenta">{stats.male_higher_income_pct}%</Tag>
            <Progress percent={stats.male_higher_income_pct} size="small" strokeColor="#eb2f96" style={{ marginTop: 4 }} />
          </Descriptions.Item>
        </Descriptions>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={14}>
          <div className="chart-card">
            <div className="chart-title">年龄差分布（男正女负）</div>
            <div className="chart-container">
              <ReactECharts option={ageDiffOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
        <Col xs={24} md={10}>
          <div className="chart-card">
            <div className="chart-title">学历差异分布</div>
            <div className="chart-container">
              <ReactECharts option={eduDiffOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={10}>
          <div className="chart-card">
            <div className="chart-title">收入差异分布</div>
            <div className="chart-container">
              <ReactECharts option={incomeDiffOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
        <Col xs={24} md={14}>
          <div className="chart-card">
            <div className="chart-title">🔥 学历组合热力图（对角线=门当户对）</div>
            <div className="chart-container">
              <ReactECharts option={eduHeatmapOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </Col>
      </Row>

      <div className="chart-card">
        <div className="chart-title">💰 收入组合热力图</div>
        <div className="chart-container">
          <ReactECharts option={incomeHeatmapOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    </div>
  )
}

export default MatchSuccess
