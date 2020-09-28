import request from '@/utils/request'

export function login(username, password) {
  return request({
    url: '/login',
    method: 'post',
    params: { username, password }
  })
}

export function getInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

export function logout() {
  return request({
    url: '/vue-admin-template/user/logout',
    method: 'post'
  })
}
