import React, { useState, useEffect, useMemo } from 'react'
import { apiService } from '../services/api'
import {
  Row, Col, Card, Select, Spin, Typography, Space, Tag, Alert, Statistic, Progress
} from 'antd'
import {
  UserOutlined, TeamOutlined, CrownOutlined, RocketOutlined,
  CoffeeOutlined, ThunderboltOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'

const { Title, Text } = Typography
const { Option } = Select

const CLUSTER_ICONS = {
  '优质精英': <CrownOutlined />,
  '务实刚需': <ThunderboltOutlined />,
  '躺平佛系': <CoffeeOutlined />,
  '焦虑追赶': <RocketOutlined />,
  '潜力新秀': <UserOutlined />
}

function UserClustering() {
  const [loading, setLoading] = useState(true)
  const [clusterData, setClusterData] = useState(null)
  const [nClusters, setNClusters] = useState(5)
  const [selectedCluster, setSelectedCluster] = useState(null)

  useEffect(() => {
    loadClusters()
  }, [nClusters])

  const loadClusters = async () => {
    setLoading(true)
    try {
      const data = await apiService.getUserClusters({ n_clusters: nClusters, sample_size: 10000 })
      setClusterData(data)
      if (data.clusters && data.clusters.length > 0) {
        setSelectedCluster(data.clusters[0].name)
      }
    } catch (err) {
      console.error('加载聚类数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const pieOption = useMemo(() => {
    if (!clusterData?.clusters) return null
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}人 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { fontSize: 12 }
      },
      series: [
        {
          name: '人群分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 11
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          data: clusterData.clusters.map(c => ({
            value: c.count,
            name: c.name,
            itemStyle: { color: c.color }
          }))
        }
      ]
    }
  }, [clusterData])

  const radarOption = useMemo(() => {
    if (!clusterData?.clusters || !clusterData?.radar_keys) return null
    return {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: clusterData.clusters.map(c => c.name),
        bottom: 0,
        textStyle: { fontSize: 11 }
      },
      radar: {
        indicator: clusterData.radar_keys.map(key => ({
          name: key,
          max: 100
        })),
        center: ['50%', '45%'],
        radius: '60%',
        splitNumber: 4,
        axisName: {
          color: '#666',
          fontSize: 12
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(24, 144, 255, 0.05)', 'rgba(24, 144, 255, 0.1)']
          }
        }
      },
      series: [
        {
          type: 'radar',
          data: clusterData.clusters.map(c => ({
            value: clusterData.radar_keys.map(k => c.radar_data[k]),
            name: c.name,
            itemStyle: { color: c.color },
            lineStyle: { width: 2, color: c.color },
            areaStyle: {
              color: c.color,
              opacity: 0.15
            }
          }))
        }
      ]
    }
  }, [clusterData])

  const scatterOption = useMemo(() => {
    if (!clusterData?.scatter_data || !clusterData?.clusters) return null
    
    const clusters = clusterData.clusters
    const series = clusters.map(c => {
      const items = clusterData.scatter_data.filter(d => d.cluster === c.name)
      return {
        name: c.name,
        type: 'scatter',
        data: items.map(d => [d.x, d.y, d.age]),
        itemStyle: {
          color: c.color,
          opacity: 0.7
        },
        symbolSize: 8
      }
    })

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const data = params.data
          const incomeLabels = ['5k以下', '5k-10k', '10k-20k', '20k-50k', '50k以上']
          return `<div style="padding:4px">
            <div style="font-weight:bold;margin-bottom:4px">${params.seriesName}</div>
            <div>收入: ${incomeLabels[data[0]] || '未知'}</div>
            <div>消费: ¥${data[1]}</div>
            <div>年龄: ${data[2]}岁</div>
          </div>`
        }
      },
      legend: {
        data: clusters.map(c => c.name),
        bottom: 0,
        textStyle: { fontSize: 11 }
      },
      grid: { left: 60, right: 20, top: 20, bottom: 50 },
      xAxis: {
        type: 'category',
        data: ['5k以下', '5k-10k', '10k-20k', '20k-50k', '50k以上'],
        axisLabel: { color: '#888', fontSize: 11, rotate: 30 },
        axisLine: { lineStyle: { color: '#ddd' } }
      },
      yAxis: {
        type: 'value',
        name: '累计消费 (元)',
        nameTextStyle: { color: '#888', fontSize: 11 },
        axisLabel: { color: '#888', fontSize: 11 },
        splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } }
      },
      series
    }
  }, [clusterData])

  const selectedClusterData = useMemo(() => {
    if (!clusterData?.clusters || !selectedCluster) return null
    return clusterData.clusters.find(c => c.name === selectedCluster)
  }, [clusterData, selectedCluster])

  const barOption = useMemo(() => {
    if (!selectedClusterData?.distributions) return null
    
    const eduDist = selectedClusterData.distributions.education || {}
    const eduOrder = ['高中', '大专', '本科', '硕士', '博士']
    
    return {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}%'
      },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: eduOrder,
        axisLabel: { color: '#888', fontSize: 11 },
        axisLine: { lineStyle: { color: '#ddd' } }
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          color: '#888',
          fontSize: 11,
          formatter: '{value}%'
        },
        splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } }
      },
      series: [
        {
          type: 'bar',
          data: eduOrder.map(e => eduDist[e] || 0),
          itemStyle: {
            color: selectedClusterData.color,
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: '50%'
        }
      ]
    }
  }, [selectedClusterData])

  return (
    <div className="user-clustering-container">
      <Card className="chart-card" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                <TeamOutlined style={{ marginRight: 8 }} />
                用户画像聚类分析
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                基于 K-Means 算法，根据年龄、收入、学历、房产、消费能力、择偶要求等特征自动划分用户群体
              </Text>
            </div>
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>聚类数量:</Text>
              <Select value={nClusters} onChange={setNClusters} style={{ width: 100 }} size="small">
                <Option value={3}>3 类</Option>
                <Option value={4}>4 类</Option>
                <Option value={5}>5 类</Option>
              </Select>
            </Space>
          </div>

          <Alert
            message="💡 分析说明"
            description="系统使用 K-Means 无监督聚类算法，自动将用户划分为不同群体。每个群体具有独特的画像特征，可用于精准运营和产品策略制定。"
            type="info"
            showIcon
          />
        </Space>
      </Card>

      <Spin spinning={loading}>
        {clusterData && (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {clusterData.clusters.map((cluster, idx) => (
                <Col xs={12} md={8} lg={24 / clusterData.clusters.length} key={cluster.name}>
                  <Card
                    className="stat-card"
                    style={{
                      cursor: 'pointer',
                      borderTop: `3px solid ${cluster.color}`,
                      boxShadow: selectedCluster === cluster.name ? `0 4px 12px ${cluster.color}30` : 'none'
                    }}
                    onClick={() => setSelectedCluster(cluster.name)}
                  >
                    <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: cluster.color }}>{CLUSTER_ICONS[cluster.name] || <UserOutlined />}</span>
                      {cluster.name}
                    </div>
                    <div className="stat-value" style={{ color: cluster.color, fontSize: 28 }}>
                      {cluster.count.toLocaleString()}
                      <span style={{ fontSize: 14, fontWeight: 400, color: '#999', marginLeft: 4 }}>人</span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: '#888' }}>
                      占比 {cluster.percentage}%
                    </div>
                    <Progress
                      percent={cluster.percentage}
                      showInfo={false}
                      strokeColor={cluster.color}
                      size="small"
                      style={{ marginTop: 8 }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={12}>
                <Card className="chart-card" title="🍰 人群占比分布">
                  <ReactECharts option={pieOption} style={{ height: 280 }} notMerge />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card className="chart-card" title="🎯 各群体特征雷达图对比">
                  <ReactECharts option={radarOption} style={{ height: 320 }} notMerge />
                </Card>
              </Col>
            </Row>

            <Card
              className="chart-card"
              style={{ marginBottom: 24 }}
              title={
                <Space>
                  <span>
                    {selectedClusterData && (
                      <span style={{ color: selectedClusterData.color }}>
                        {CLUSTER_ICONS[selectedClusterData.name] || <UserOutlined />}
                      </span>
                    )}
                    {selectedCluster} 画像详情
                  </span>
                </Space>
              }
              extra={
                <Tag color={selectedClusterData?.color}>{selectedClusterData?.percentage}% 占比</Tag>
              }
            >
              {selectedClusterData && (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {selectedClusterData.description}
                    </Text>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="平均年龄"
                        value={selectedClusterData.statistics.avg_age}
                        suffix="岁"
                        valueStyle={{ color: selectedClusterData.color, fontSize: 24 }}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="主力学历"
                        value={selectedClusterData.statistics.avg_education}
                        valueStyle={{ color: selectedClusterData.color, fontSize: 24 }}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="主力收入"
                        value={selectedClusterData.statistics.avg_income}
                        valueStyle={{ color: selectedClusterData.color, fontSize: 24 }}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="付费率"
                        value={selectedClusterData.statistics.paid_rate}
                        suffix="%"
                        valueStyle={{ color: selectedClusterData.color, fontSize: 24 }}
                      />
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="平均消费"
                        value={selectedClusterData.statistics.avg_spent}
                        suffix="元"
                        precision={0}
                        valueStyle={{ color: selectedClusterData.color, fontSize: 24 }}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="主要房产"
                        value={selectedClusterData.statistics.top_property}
                        valueStyle={{ color: selectedClusterData.color, fontSize: 20 }}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="择偶严格度"
                        value={selectedClusterData.statistics.avg_pickiness}
                        suffix="分"
                        valueStyle={{ color: selectedClusterData.color, fontSize: 24 }}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="总人数"
                        value={selectedClusterData.count}
                        suffix="人"
                        valueStyle={{ color: selectedClusterData.color, fontSize: 24 }}
                      />
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#555' }}>
                        📚 学历分布
                      </div>
                      <ReactECharts option={barOption} style={{ height: 180 }} notMerge />
                    </Col>
                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#555' }}>
                        🏠 房产分布
                      </div>
                      {Object.entries(selectedClusterData.distributions.property || {}).map(([key, val]) => (
                        <div key={key} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                            <span>{key}</span>
                            <span style={{ color: selectedClusterData.color }}>{val}%</span>
                          </div>
                          <Progress
                            percent={val}
                            showInfo={false}
                            strokeColor={selectedClusterData.color}
                            size="small"
                          />
                        </div>
                      ))}
                    </Col>
                  </Row>
                </Space>
              )}
            </Card>

            <Card className="chart-card" title="📊 收入 vs 消费散点图 (抽样展示)">
              <ReactECharts option={scatterOption} style={{ height: 380 }} notMerge />
            </Card>
          </>
        )}
      </Spin>
    </div>
  )
}

export default UserClustering
