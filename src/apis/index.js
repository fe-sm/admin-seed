/*!
 * 请求相关处理，基于 [axios](https://github.com/axios/axios) | bqliu
 * 设置 Accept-Language 可以参见 `entries/index/index.js`
 */

/* eslint prefer-promise-reject-errors: "off" */

import axios from 'axios'
import findIndex from 'lodash/findIndex'
import cloneDeep from 'lodash/cloneDeep'
import pathToRegExp from 'path-to-regexp'
import { inArray, generateUID, fullScreenLoading, removeFullScreenLoading } from '@/utils/helpers'
import apiConfig, { genErrorMap } from './config'
import { transformTo } from '@/i18n/setup'

export const UNAUTH_TYPE = 'unath'
export const FORBIDDEN_TYPE = 'forbidden'

const noLoadingUrlRegs = apiConfig.noLoadingUrls.map((url) => pathToRegExp(url))

let fullScreenLoadingTimer = null
let currentRequestCount = 0 // 当前正在发的请求数目
const loadingReqs = [ ] // 当前所有正在发的请求，维护玩的

// 独立的 zone，不污染，根据情况自定义默认配置
// @see https://github.com/axios/axios#creating-an-instance
export const axiosInstance = window.y = axios.create({
  baseURL: apiConfig.baseURL,
  withCredentials: apiConfig.withCredentials,
  headers: apiConfig.headers,
  timeout: apiConfig.timeout // 5s
})

function addLoadingReq (req) {
  const inLoadingReq = inArray(loadingReqs, req, (xs, y) => xs.some((x) => x._reqId === y._reqId))
  if (!inLoadingReq) {
    loadingReqs.push(req)
  }
}

function removeLoadingReq (req) {
  const index = findIndex(loadingReqs, (x) => x._reqId === req._reqId)
  loadingReqs.splice(index, 1)
}

// 请求前拦截器配置
axiosInstance.interceptors.request.use(function (config) {
  config._reqId = generateUID('req_')
  addLoadingReq(config)
  currentRequestCount += 1

  const noLoading = noLoadingUrlRegs.some((reg) => reg.exec(config.url) !== null)
  if (noLoading) {
    return config
  }
  if (!fullScreenLoadingTimer) {
    fullScreenLoadingTimer = setTimeout(() => fullScreenLoading(), apiConfig.maxWaitingTime)
  }
  return config
}, function (error) {
  finalize()
  return Promise.reject(error)
})

// finalize
const finalize = function () {
  currentRequestCount -= 1
  // log(`请求结束啦，当前还剩${currentRequestCount}个`)
  if (currentRequestCount === 0) {
    clearTimeout(fullScreenLoadingTimer)
    removeFullScreenLoading()
    fullScreenLoadingTimer = null
  }
}

export function handleUnauth (url) {
  function fin () {
    return new Promise((resolve, reject) => {
      // 5s 之后 reject，一般 5s 都能跳转到 uap 登录页面，所以来不及 reject
      // 算是个 hack 的做法（不展示 error tip）
      setTimeout(() => {
        reject({
          type: UNAUTH_TYPE,
          message: transformTo('tip.notLogin')
        })
      }, 5 * 1000)
    })
  }

  location.href = url || './login.html'
  return fin()
}

// 响应处理
axiosInstance.interceptors.response.use(function (response) {
  removeLoadingReq(response.config)
  finalize()
  if (!response.data) {
    return Promise.reject(new Error(transformTo('tip.serviceException')))
  }
  try {
    switch (response.data.code) {
      case 302: {
        return handleUnauth(response.data.redirectUrl)
      }
      case 401: {
        return handleUnauth()
      }
      case 403: {
        return Promise.reject({
          type: FORBIDDEN_TYPE,
          message: transformTo('tip.notAllow')
        })
      }
    }
  } catch (e) { /* Ignore */ }
  if (response.data.code !== 0) { // 请求成功的标志，和后端商量好再定
    return Promise.reject({
      message: response.data.msg,
      data: response.data.data,
      code: response.data.code
    })
  }
  return response.data
}, function (error) {
  removeLoadingReq(error.config)
  finalize()
  const errorMap = genErrorMap()
  const e = errorMap.request[error.request.status] ||
            errorMap.response[error.response.status] ||
            errorMap.common

  return Promise.reject(cloneDeep(e))
})

/**
 * 基于 axiosInstance 和 Promise 的包装
 * 之所以用这个是不想用 `promise polyfill`，不过基于 `preset-env` 可以不用这样了，暂时保持
 * @param {"get"|"put"|"head"|"delete"|"post"|"patch"} action HTTP 动词
 * @param {string} url 请求地址
 * @param {any} data 要发送的数据
 */
export const axiosPromiseWrapper = (action, url, data) => {
  return Promise.resolve(axiosInstance[action](url, data))
}
