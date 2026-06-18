import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

export const apiService = {
  getHealth: () => api.get('/health'),
  regenerateData: () => api.post('/regenerate'),
  getSummary: () => api.get('/summary').then(r => r.data),
  getCityDemographics: (city) => api.get('/city-demographics', { params: { city } }).then(r => r.data),
  getPreferenceDifferences: () => api.get('/preference-differences').then(r => r.data),
  getSelfIntroAnalysis: () => api.get('/self-intro-analysis').then(r => r.data),
  getAnxietyIndex: () => api.get('/anxiety-index').then(r => r.data),
  getMatchSuccess: () => api.get('/match-success').then(r => r.data),
  getAllData: () => api.get('/all-data').then(r => r.data)
}

export default apiService
