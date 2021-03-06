import { i18n } from '@/i18n/setup'
import axios from 'axios'

const languages = window.$$CONFIG.supportedLocaleConfigs

export const login = () => {
  if (Math.random() > 0.8) {
    localStorage.setItem('$$online', 1)
    return Promise.resolve()
  }
  return Promise.reject(new Error(i18n.t('login.loginErrorTip')))
}

export const logout = () => {
  localStorage.setItem('$$online', 0)
  return Promise.resolve()
}

export const getUserInfo = (pageNo, pageSize) => Promise.resolve({ name: 'admin' })

export const getMenu = () => axios.get(`${process.env.BASE_URL}menu.json`).then(({ data }) => {
  return Promise.resolve(data)
})

export const getLangs = () => Promise.resolve(languages)
