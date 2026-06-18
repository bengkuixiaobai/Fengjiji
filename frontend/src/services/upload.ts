import apiClient from './auth'

export interface UploadResponse {
  success: boolean
  data?: {
    url: string
    filename: string
  }
  error?: {
    code: string
    message: string
  }
}

/**
 * 上传图片文件
 * @param file 图片文件
 * @returns 返回图片访问 URL
 */
export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('image', file)
  const response = await apiClient.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
