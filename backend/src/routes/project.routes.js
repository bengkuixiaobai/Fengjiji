const express = require('express')
const router = express.Router()
const Joi = require('joi')
const projectController = require('../controllers/project.controller')
const { authenticate } = require('../middleware/auth.middleware')
const ApiResponse = require('../utils/response')

// 验证中间件
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)
    if (error) {
      return ApiResponse.validationError(res, error.details[0].message)
    }
    next()
  }
}

// 创建项目验证 schema
const createProjectSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': '请输入项目名称',
  }),
  description: Joi.string().allow('', null),
  techStack: Joi.array().items(Joi.string()),
  codeUrl: Joi.string().uri().allow('', null),
  demoUrl: Joi.string().uri().allow('', null),
  status: Joi.string().valid('planning', 'in_progress', 'completed').default('planning'),
  isPublic: Joi.boolean().default(true),
})

// 更新项目验证 schema
const updateProjectSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow('', null),
  techStack: Joi.array().items(Joi.string()),
  codeUrl: Joi.string().uri().allow('', null),
  demoUrl: Joi.string().uri().allow('', null),
  status: Joi.string().valid('planning', 'in_progress', 'completed'),
  isPublic: Joi.boolean(),
  completionRate: Joi.number().integer().min(0).max(100),
})

/**
 * @route   GET /api/projects
 * @desc    获取项目列表
 * @access  Public
 */
router.get('/', projectController.getProjects)

/**
 * @route   GET /api/projects/:id
 * @desc    获取项目详情
 * @access  Public
 */
router.get('/:id', projectController.getProjectById)

/**
 * @route   POST /api/projects
 * @desc    创建项目
 * @access  Private
 */
router.post('/', authenticate, validate(createProjectSchema), projectController.createProject)

/**
 * @route   PUT /api/projects/:id
 * @desc    更新项目
 * @access  Private
 */
router.put('/:id', authenticate, validate(updateProjectSchema), projectController.updateProject)

/**
 * @route   DELETE /api/projects/:id
 * @desc    删除项目
 * @access  Private
 */
router.delete('/:id', authenticate, projectController.deleteProject)

module.exports = router