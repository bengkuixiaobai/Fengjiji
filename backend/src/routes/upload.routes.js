const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { fileTypeFromFile } = require('file-type')
const { authenticate, requireRole } = require('../middleware/auth.middleware')
const ApiResponse = require('../utils/response')

// 允许的图片 MIME 类型
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
])

// 配置文件存储
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname).toLowerCase()
    // 只保留白名单内的扩展名，否则用 .jpg 兜底
    const safeExt = /\.(jpe?g|png|gif|webp|svg)$/i.test(ext) ? ext : '.jpg'
    cb(null, unique + safeExt)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 jpg/png/gif/webp/svg 格式'))
    }
  },
})

/**
 * @route   POST /api/upload
 * @desc    上传图片
 * @access  Private
 */
router.post('/', authenticate, requireRole('admin'), (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return ApiResponse.error(res, '文件过大，最大 5MB', 'FILE_TOO_LARGE', 400)
      }
      return ApiResponse.error(res, err.message, 'UPLOAD_ERROR', 400)
    }
    if (!req.file) {
      return ApiResponse.validationError(res, '请选择图片')
    }

    // 校验文件真实 MIME 类型
    try {
      const type = await fileTypeFromFile(req.file.path)
      if (!type || !ALLOWED_MIMES.has(type.mime)) {
        fs.unlinkSync(req.file.path) // 删除非法文件
        return ApiResponse.error(res, '文件类型不合法，仅支持 jpg/png/gif/webp/svg 图片', 'INVALID_FILE_TYPE', 400)
      }
    } catch {
      fs.unlinkSync(req.file.path)
      return ApiResponse.error(res, '文件校验失败', 'FILE_CHECK_ERROR', 400)
    }

    const url = `/uploads/${req.file.filename}`
    return ApiResponse.success(res, { url, filename: req.file.filename })
  })
})

module.exports = router
