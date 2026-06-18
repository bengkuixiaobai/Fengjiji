const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const { authenticate } = require('../middleware/auth.middleware')
const ApiResponse = require('../utils/response')

// 配置文件存储
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, unique + ext)
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
router.post('/', authenticate, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return ApiResponse.error(res, '文件过大，最大 5MB', 'FILE_TOO_LARGE', 400)
      }
      return ApiResponse.error(res, err.message, 'UPLOAD_ERROR', 400)
    }
    if (!req.file) {
      return ApiResponse.validationError(res, '请选择图片')
    }

    const url = `/uploads/${req.file.filename}`
    return ApiResponse.success(res, { url, filename: req.file.filename })
  })
})

module.exports = router
