const postService = require('../services/post.service')
const ApiResponse = require('../utils/response')

/**
 * 获取文章列表
 */
async function getPosts(req, res, next) {
  try {
    const {
      page,
      limit,
      categoryId,
      tagId,
      status,
      authorId,
      search,
      orderBy,
      order,
    } = req.query

    const result = await postService.getPosts({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      tagId: tagId ? parseInt(tagId) : undefined,
      status,
      authorId: authorId ? parseInt(authorId) : undefined,
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
 * 获取文章详情
 */
async function getPostById(req, res, next) {
  try {
    const { id } = req.params
    const post = await postService.getPostById(parseInt(id))
    return ApiResponse.success(res, post)
  } catch (error) {
    if (error.code === 'POST_NOT_FOUND') {
      return ApiResponse.notFound(res, error.message)
    }
    next(error)
  }
}

/**
 * 创建文章
 */
async function createPost(req, res, next) {
  try {
    const post = await postService.createPost(req.userId, req.body)
    return ApiResponse.created(res, post)
  } catch (error) {
    if (error.code === 'SLUG_EXISTS') {
      return ApiResponse.conflict(res, error.message)
    }
    next(error)
  }
}

/**
 * 更新文章
 */
async function updatePost(req, res, next) {
  try {
    const { id } = req.params
    const post = await postService.updatePost(parseInt(id), req.userId, req.body)
    return ApiResponse.success(res, post)
  } catch (error) {
    if (error.code === 'POST_NOT_FOUND') {
      return ApiResponse.notFound(res, error.message)
    }
    if (error.code === 'FORBIDDEN') {
      return ApiResponse.error(res, error.message, 'FORBIDDEN', 403)
    }
    if (error.code === 'SLUG_EXISTS') {
      return ApiResponse.conflict(res, error.message)
    }
    next(error)
  }
}

/**
 * 删除文章
 */
async function deletePost(req, res, next) {
  try {
    const { id } = req.params
    await postService.deletePost(parseInt(id), req.userId)
    return ApiResponse.success(res, null, '文章删除成功')
  } catch (error) {
    if (error.code === 'POST_NOT_FOUND') {
      return ApiResponse.notFound(res, error.message)
    }
    if (error.code === 'FORBIDDEN') {
      return ApiResponse.error(res, error.message, 'FORBIDDEN', 403)
    }
    next(error)
  }
}

/** 记录阅读量(访客 id 从 header 拿,缺省 'anon') */
async function recordView(req, res, next) {
  try {
    const { id } = req.params
    const visitorId = (req.headers['x-visitor-id'] || 'anon').toString().slice(0, 64)
    const post = await postService.recordView(parseInt(id), visitorId)
    return ApiResponse.success(res, post)
  } catch (error) {
    if (error.code === 'POST_NOT_FOUND') {
      return ApiResponse.notFound(res, error.message)
    }
    next(error)
  }
}

/** 切换点赞 */
async function toggleLike(req, res, next) {
  try {
    const { id } = req.params
    const visitorId = (req.headers['x-visitor-id'] || 'anon').toString().slice(0, 64)
    const result = await postService.toggleLike(parseInt(id), visitorId)
    return ApiResponse.success(res, result)
  } catch (error) {
    if (error.code === 'POST_NOT_FOUND') {
      return ApiResponse.notFound(res, error.message)
    }
    next(error)
  }
}

/** 获取点赞状态 */
async function getLikeStatus(req, res, next) {
  try {
    const { id } = req.params
    const visitorId = (req.headers['x-visitor-id'] || 'anon').toString().slice(0, 64)
    const result = await postService.getLikeStatus(parseInt(id), visitorId)
    return ApiResponse.success(res, result)
  } catch (error) {
    if (error.code === 'POST_NOT_FOUND') {
      return ApiResponse.notFound(res, error.message)
    }
    next(error)
  }
}

/** 获取上下篇 */
async function getAdjacentPosts(req, res, next) {
  try {
    const { id } = req.params
    const result = await postService.getAdjacentPosts(parseInt(id))
    return ApiResponse.success(res, result)
  } catch (error) {
    if (error.code === 'POST_NOT_FOUND') {
      return ApiResponse.notFound(res, error.message)
    }
    next(error)
  }
}

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  // 阅读 / 点赞 / 上下篇
  recordView,
  toggleLike,
  getLikeStatus,
  getAdjacentPosts,
}