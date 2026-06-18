const projectService = require('../services/project.service')
const ApiResponse = require('../utils/response')

/**
 * 获取项目列表
 */
async function getProjects(req, res, next) {
  try {
    const {
      page,
      limit,
      status,
      authorId,
      isPublic,
      search,
      orderBy,
      order,
    } = req.query

    const result = await projectService.getProjects({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status,
      authorId: authorId ? parseInt(authorId) : undefined,
      isPublic: isPublic !== 'false',
      search,
      orderBy,
      order,
    })

    return ApiResponse.success(res, result)
  } catch (error) {
    next(error)
  }
}

/**
 * 获取项目详情
 */
async function getProjectById(req, res, next) {
  try {
    const { id } = req.params
    const project = await projectService.getProjectById(parseInt(id))
    return ApiResponse.success(res, project)
  } catch (error) {
    if (error.code === 'PROJECT_NOT_FOUND') {
      return ApiResponse.notFound(res, error.message)
    }
    next(error)
  }
}

/**
 * 创建项目
 */
async function createProject(req, res, next) {
  try {
    const project = await projectService.createProject(req.userId, req.body)
    return ApiResponse.created(res, project)
  } catch (error) {
    next(error)
  }
}

/**
 * 更新项目
 */
async function updateProject(req, res, next) {
  try {
    const { id } = req.params
    const project = await projectService.updateProject(parseInt(id), req.userId, req.body)
    return ApiResponse.success(res, project)
  } catch (error) {
    if (error.code === 'PROJECT_NOT_FOUND') {
      return ApiResponse.notFound(res, error.message)
    }
    if (error.code === 'FORBIDDEN') {
      return ApiResponse.error(res, error.message, 'FORBIDDEN', 403)
    }
    next(error)
  }
}

/**
 * 删除项目
 */
async function deleteProject(req, res, next) {
  try {
    const { id } = req.params
    await projectService.deleteProject(parseInt(id), req.userId)
    return ApiResponse.success(res, null, '项目删除成功')
  } catch (error) {
    if (error.code === 'PROJECT_NOT_FOUND') {
      return ApiResponse.notFound(res, error.message)
    }
    if (error.code === 'FORBIDDEN') {
      return ApiResponse.error(res, error.message, 'FORBIDDEN', 403)
    }
    next(error)
  }
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
}