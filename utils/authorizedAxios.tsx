
import axios from 'axios'

// Khoi tao 1 doi tuong axios (authorizedAxiosInstance) voi cac cau hinh mac dinh

let authorizedAxiosInstance = axios.create()

// Thoi gian cho toi da cua 1 request la 10  phut

authorizedAxiosInstance.defaults.timeout = 1000 * 60 * 10 

export default authorizedAxiosInstance