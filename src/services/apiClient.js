import axios from 'axios'

const DEFAULT_API_BASE_URL = 'http://localhost:8080'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : DEFAULT_API_BASE_URL),
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export const setAuthTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem('accessToken', accessToken)
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
}

export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        clearAuthTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL}/api/auth/refresh`,
          { refreshToken },
          { withCredentials: true },
        )

        const newAccessToken = refreshResponse?.data?.payload?.accessToken || refreshResponse?.data?.accessToken || refreshResponse?.data?.token
        const newRefreshToken = refreshResponse?.data?.payload?.refreshToken || refreshResponse?.data?.refreshToken

        if (newAccessToken) {
          setAuthTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken || refreshToken })
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        clearAuthTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
