import React, { useState, useEffect, useMemo, useRef } from 'react'
import { apiService } from '../services/api'
import {
  Row, Col, Card, Select, InputNumber, Button, Spin, List, Avatar, Tag,
  Progress, Space, Typography, Empty, Divider, Tooltip, Alert
} from 'antd'
import {
  UserOutlined, HeartOutlined, HomeOutlined, BankOutlined,
  BookOutlined, DollarOutlined, InfoCircleOutlined
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const GENDER_OPTIONS = [
  { value: '男', label: '👨 找女生', icon: '♀️' },
  { value: '女', label: '👩 找男生', icon: '♂️' }
]

const EDUCATION_OPTIONS = [
  { value: '高中', label: '高中及以上' },
  { value: '大专', label: '大专及以上' },
  { value: '本科', label: '本科及以上' },
  { value: '硕士', label: '硕士及以上' },
  { value: '博士', label: '博士' }
]

const TIER_COLORS = {
  '一线': '#f5222d',
  '新一线': '#fa8c16',
  '二线': '#1890ff',
  '三线': '#52c41a'
}

const SCORE_COLOR = (score) => {
  if (score >= 80) return '#52c41a'
  if (score >= 60) return '#fa8c16'
  if (score >= 40) return '#1890ff'
  return '#8c8c8c'
}

function CityMatch() {
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState(null)
  const [selectedCity, setSelectedCity] = useState(null)
  const [targetGender, setTargetGender] = useState('男')
  const [minAge, setMinAge] = useState(22)
  const [maxAge, setMaxAge] = useState(32)
  const [minEducation, setMinEducation] = useState(null)
  const [citiesLoading, setCitiesLoading] = useState(true)
  const requestIdRef = useRef(0)
  const [ageError, setAgeError] = useState(false)

  useEffect(() => {
    loadCities()
  }, [])

  const loadCities = async () => {
    try {
      const data = await apiService.getCities()
      setCities(data.cities || [])
      if (data.cities && data.cities.length > 0) {
        const tier1Cities = data.cities.filter(c => c.tier === '一线')
        setSelectedCity(tier1Cities[0]?.name || data.cities[0].name)
      }
    } catch (err) {
      console.error('加载城市列表失败:', err)
    } finally {
      setCitiesLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!selectedCity) return
    if (minAge > maxAge) {
      setAgeError(true)
      return
    }
    setAgeError(false)
    const myRequestId = ++requestIdRef.current
    setLoading(true)
    try {
      const params = {
        city: selectedCity,
        gender: targetGender,
        min_age: minAge,
        max_age: maxAge,
        top_n: 20
      }
      if (minEducation) {
        params.education = minEducation
      }
      const data = await apiService.getMatchRecommendations(params)
      if (myRequestId === requestIdRef.current) {
        setRecommendations(data)
      }
    } catch (err) {
      if (myRequestId === requestIdRef.current) {
        console.error('获取匹配推荐失败:', err)
      }
    } finally {
      if (myRequestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (selectedCity && !citiesLoading) {
      handleSearch()
    }
  }, [selectedCity, targetGender, minAge, maxAge, minEducation])

  const cityOptions = useMemo(() => {
    const groups = {}
    cities.forEach(city => {
      if (!groups[city.tier]) groups[city.tier] = []
      groups[city.tier].push(city)
    })
    return ['一线', '新一线', '二线', '三线'].map(tier => (
      <Select.OptGroup key={tier} label={`${tier}城市`}>
        {groups[tier]?.map(city => (
          <Option key={city.name} value={city.name}>
            {city.name} <Text type="secondary" style={{ fontSize: 12 }}>
              ({city.male_count}男/{city.female_count}女)
            </Text>
          </Option>
        )) || []}
      </Select.OptGroup>
    ))
  }, [cities])

  const renderMatchCard = (item, index) => {
    const details = item.match_details || {}
    const score = item.match_score

    return (
      <Card
        key={item.user_id}
        className="match-card"
        style={{ marginBottom: 16, position: 'relative' }}
        hoverable
      >
        <Row gutter={16}>
          <Col xs={24} sm={6} md={4} style={{ textAlign: 'center' }}>
            <Avatar
              size={80}
              icon={<UserOutlined />}
              style={{
                backgroundColor: item.gender === '女' ? '#eb2f96' : '#1890ff',
                fontSize: 36
              }}
            />
            <div style={{ marginTop: 12 }}>
              <Tag color={TIER_COLORS[item.city_tier]}>{item.city_tier}</Tag>
            </div>
          </Col>
          <Col xs={24} sm={18} md={14}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space size={12} wrap>
                <Title level={4} style={{ margin: 0 }}>
                  {item.gender === '女' ? '👩' : '👨'} {item.age}岁
                </Title>
                <Tag icon={<BookOutlined />} color="blue">{item.education}</Tag>
                <Tag icon={<DollarOutlined />} color="green">{item.income}</Tag>
                <Tag icon={<HomeOutlined />} color="orange">{item.property}</Tag>
                <Tag icon={<InfoCircleOutlined />}>{item.height}cm</Tag>
              </Space>
              <Paragraph
                ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                style={{ margin: '8px 0', color: '#555' }}
              >
                {item.self_intro_full}
              </Paragraph>
              <Space wrap size={8}>
                {item.req_education != null && (
                  <Tag color="purple">学历要求: {item.req_education}</Tag>
                )}
                {item.pref_min_age != null && item.pref_max_age != null && (
                  <Tag color="cyan">
                    年龄偏好: {item.pref_min_age}-{item.pref_max_age}岁
                  </Tag>
                )}
              </Space>
            </Space>
          </Col>
          <Col xs={24} sm={24} md={6} style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>综合匹配度</Text>
            </div>
            <Title
              level={2}
              style={{ margin: 0, color: SCORE_COLOR(score) }}
            >
              {score}
              <Text style={{ fontSize: 16, color: '#888' }}>分</Text>
            </Title>
            <Progress
              percent={score}
              showInfo={false}
              strokeColor={SCORE_COLOR(score)}
              size="small"
              style={{ marginTop: 8 }}
            />
            <div style={{ marginTop: 12 }}>
              <Space direction="vertical" size={4} style={{ fontSize: 12, textAlign: 'left' }}>
                <Text type="secondary">
                  年龄差 {details.age_diff} 岁: +{details.age_score}分
                </Text>
                <Text type="secondary">
                  学历差 {details.education_diff} 级: +{details.education_score}分
                </Text>
                <Text type="secondary">
                  收入差 {details.income_diff} 级: +{details.income_score}分
                </Text>
                <Text type="secondary">
                  同城: +{details.city_score}分
                </Text>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>
    )
  }

  return (
    <div className="city-match-container">
      <Card className="filter-card" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Title level={4} style={{ margin: 0 }}>
            💕 同城匹配模拟器
          </Title>
          <Text type="secondary">
            选择城市和筛选条件，系统将根据年龄差、学历、收入、同城等因素智能计算匹配度
          </Text>
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#555' }}>
                🏙️ 选择城市
              </div>
              <Select
                showSearch
                placeholder="请选择城市"
                style={{ width: '100%' }}
                value={selectedCity}
                onChange={setSelectedCity}
                loading={citiesLoading}
                optionFilterProp="children"
              >
                {cityOptions}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#555' }}>
                🔍 寻找
              </div>
              <Select
                style={{ width: '100%' }}
                value={targetGender}
                onChange={setTargetGender}
              >
                {GENDER_OPTIONS.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#555' }}>
                🎂 最小年龄
              </div>
              <InputNumber
                min={18}
                max={60}
                value={minAge}
                onChange={val => {
                  const newVal = val || 18
                  setMinAge(newVal)
                  if (newVal > maxAge) {
                    setAgeError(true)
                  } else {
                    setAgeError(false)
                  }
                }}
                style={{ width: '100%' }}
                addonAfter="岁"
                status={ageError ? 'error' : ''}
              />
            </Col>
            <Col xs={24} sm={8} md={4}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#555' }}>
                🎂 最大年龄
              </div>
              <InputNumber
                min={18}
                max={60}
                value={maxAge}
                onChange={val => {
                  const newVal = val || 60
                  setMaxAge(newVal)
                  if (minAge > newVal) {
                    setAgeError(true)
                  } else {
                    setAgeError(false)
                  }
                }}
                style={{ width: '100%' }}
                addonAfter="岁"
                status={ageError ? 'error' : ''}
              />
            </Col>
            <Col xs={24} sm={8} md={5}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#555' }}>
                🎓 最低学历
              </div>
              <Select
                style={{ width: '100%' }}
                value={minEducation}
                onChange={setMinEducation}
                allowClear
                placeholder="不限"
              >
                {EDUCATION_OPTIONS.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Col>
          </Row>
          {ageError && (
            <Alert
              message="年龄范围错误"
              description="最小年龄不能大于最大年龄，请调整筛选条件"
              type="error"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
          {recommendations && (
            <div style={{ marginTop: 8, padding: '12px 16px', background: '#f6f8fa', borderRadius: 6 }}>
              <Space size={24} wrap>
                <Text>
                  📊 共找到 <b style={{ color: '#1890ff' }}>{recommendations.total_available}</b> 位符合条件的用户
                </Text>
                <Text>
                  🎯 展示前 <b style={{ color: '#52c41a' }}>{recommendations.total_candidates}</b> 位最佳匹配
                </Text>
                {recommendations.recommendations.length > 0 && (
                  <Text>
                    ⭐ 最高匹配分 <b style={{ color: '#fa8c16' }}>{recommendations.recommendations[0].match_score}</b> 分
                  </Text>
                )}
              </Space>
            </div>
          )}
        </Space>
      </Card>

      <Spin spinning={loading}>
        {recommendations && recommendations.recommendations.length > 0 ? (
          <div>
            {recommendations.recommendations.map((item, index) => renderMatchCard(item, index))}
          </div>
        ) : recommendations ? (
          <Empty
            description={
              <Space direction="vertical">
                <Text>没有找到符合条件的匹配对象</Text>
                <Text type="secondary">试试放宽筛选条件吧~</Text>
              </Space>
            }
          />
        ) : null}
      </Spin>
    </div>
  )
}

export default CityMatch
