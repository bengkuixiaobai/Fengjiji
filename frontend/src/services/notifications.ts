// 通知中心 mock 数据 — 联系人 / 消息 / 通知 / 身份码 / 好友申请
import { useState, useMemo } from 'react'

// ============== 身份码生成 ==============
// 6 位字母数字(去除易混淆字符),用 userId 作为种子保证稳定
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateIdentityCode(userId: number): string {
  let n = userId
  let code = ''
  // 简单哈希混合
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.abs(n) % CODE_CHARS.length]
    n = Math.floor(n / CODE_CHARS.length) + userId * 31 + 7
  }
  return code
}

// ============== 类型 ==============
export type RequestStatus = 'none' | 'sent' | 'received' | 'accepted' | 'rejected'

export interface Contact {
  id: number
  name: string
  avatar?: string
  identityCode: string  // 固定身份码
  lastMessage: string
  lastTime: string
  unread: number
  online: boolean
  isSystem?: boolean
  systemType?: 'blog' | 'project' | 'system'
  isFriend: boolean     // 是否已是好友
}

export interface FriendRequest {
  id: number
  fromId: number
  fromName: string
  fromCode: string
  fromAvatar?: string
  message?: string
  time: string
  status: 'pending' | 'accepted' | 'rejected'
}

export interface Message {
  id: number
  contactId: number
  content: string
  time: string
  sender: 'me' | 'them'
  type?: 'text' | 'image' | 'system'
}

export interface Notice {
  id: number
  actorName: string
  actorAvatar?: string
  type: 'comment' | 'like' | 'follow' | 'system' | 'reply'
  target: string
  preview?: string
  time: string
  read: boolean
}

// ============== 初始数据 ==============
// 所有已存在的联系人(都是好友)
const seedContacts: Contact[] = [
  {
    id: 1, name: '小爱', identityCode: generateIdentityCode(1),
    lastMessage: '好的,明天见 👋', lastTime: '14:23',
    unread: 2, online: true, isFriend: true,
  },
  {
    id: 2, name: '设计师小王', identityCode: generateIdentityCode(2),
    lastMessage: '你看下这版设计稿', lastTime: '12:10',
    unread: 5, online: true, isFriend: true,
  },
  {
    id: 3, name: '产品经理 Leo', identityCode: generateIdentityCode(3),
    lastMessage: '需求评审下午 3 点', lastTime: '11:30',
    unread: 0, online: false, isFriend: true,
  },
  {
    id: 4, name: '运营小张', identityCode: generateIdentityCode(4),
    lastMessage: '活动数据出来了,你看看', lastTime: '昨天',
    unread: 1, online: true, isFriend: true,
  },
  {
    id: 5, name: '前端老李', identityCode: generateIdentityCode(5),
    lastMessage: 'TypeScript 真香', lastTime: '昨天',
    unread: 0, online: false, isFriend: true,
  },
  // 系统账号(关注的推送源)
  {
    id: 101, name: '阮一峰的网络日志',
    identityCode: generateIdentityCode(101),
    lastMessage: '科技爱好者周刊第 287 期', lastTime: '1 小时前',
    unread: 1, online: false, isSystem: true, systemType: 'blog', isFriend: true,
  },
  {
    id: 102, name: 'GitHub Trending',
    identityCode: generateIdentityCode(102),
    lastMessage: '今日热门: awesome-react-components', lastTime: '3 小时前',
    unread: 0, online: false, isSystem: true, systemType: 'project', isFriend: true,
  },
  {
    id: 103, name: '系统通知',
    identityCode: generateIdentityCode(103),
    lastMessage: '欢迎使用风迹集!', lastTime: '3 天前',
    unread: 0, online: false, isSystem: true, systemType: 'system', isFriend: true,
  },
]

// 陌生人用户(可被搜索,等待申请)
const seedStrangers: Contact[] = [
  { id: 201, name: '新朋友小李', identityCode: generateIdentityCode(201),
    lastMessage: '', lastTime: '', unread: 0, online: true, isFriend: false },
  { id: 202, name: '产品小张', identityCode: generateIdentityCode(202),
    lastMessage: '', lastTime: '', unread: 0, online: false, isFriend: false },
  { id: 203, name: '测试小明', identityCode: generateIdentityCode(203),
    lastMessage: '', lastTime: '', unread: 0, online: true, isFriend: false },
  { id: 204, name: '运营达人', identityCode: generateIdentityCode(204),
    lastMessage: '', lastTime: '', unread: 0, online: false, isFriend: false },
  { id: 205, name: '设计阿 May', identityCode: generateIdentityCode(205),
    lastMessage: '', lastTime: '', unread: 0, online: true, isFriend: false },
  { id: 206, name: '后端小王', identityCode: generateIdentityCode(206),
    lastMessage: '', lastTime: '', unread: 0, online: false, isFriend: false },
  { id: 207, name: '前端的鱼', identityCode: generateIdentityCode(207),
    lastMessage: '', lastTime: '', unread: 0, online: true, isFriend: false },
  { id: 208, name: '产品小姐姐', identityCode: generateIdentityCode(208),
    lastMessage: '', lastTime: '', unread: 0, online: false, isFriend: false },
]

// 收到的申请(可接受/拒绝)
const seedRequests: FriendRequest[] = [
  {
    id: 301, fromId: 201, fromName: '新朋友小李', fromCode: generateIdentityCode(201),
    message: '你好,看到你的博客,想加你交流一下!', time: '10 分钟前', status: 'pending',
  },
  {
    id: 302, fromId: 203, fromName: '测试小明', fromCode: generateIdentityCode(203),
    message: '我是做前端的,想认识一下', time: '1 小时前', status: 'pending',
  },
  {
    id: 303, fromId: 205, fromName: '设计阿 May', fromCode: generateIdentityCode(205),
    message: '看到你的设计很棒!', time: '2 小时前', status: 'pending',
  },
]

// 消息历史(按联系人 ID)
const seedMessages: Record<number, Message[]> = {
  1: [
    { id: 101, contactId: 1, content: '在吗?', time: '14:20', sender: 'them' },
    { id: 102, contactId: 1, content: '在的', time: '14:21', sender: 'me' },
    { id: 103, contactId: 1, content: '明天一起去爬山?', time: '14:22', sender: 'them' },
    { id: 104, contactId: 1, content: '好啊,几点?', time: '14:23', sender: 'me' },
    { id: 105, contactId: 1, content: '早上 8 点老地方集合', time: '14:23', sender: 'them' },
    { id: 106, contactId: 1, content: '好的,明天见 👋', time: '14:23', sender: 'them' },
  ],
  2: [
    { id: 201, contactId: 2, content: '你看下这版设计稿', time: '12:05', sender: 'them' },
    { id: 202, contactId: 2, content: '好的,等我看看', time: '12:08', sender: 'me' },
    { id: 203, contactId: 2, content: '[图片]', time: '12:10', sender: 'them', type: 'image' },
    { id: 204, contactId: 2, content: '感觉还不错,配色可以再大胆一点', time: '12:15', sender: 'me' },
    { id: 205, contactId: 2, content: '收到,我再调整一下', time: '12:16', sender: 'them' },
  ],
  3: [
    { id: 301, contactId: 3, content: '需求评审下午 3 点', time: '11:30', sender: 'them' },
    { id: 302, contactId: 3, content: '好的,会议室在哪里?', time: '11:32', sender: 'me' },
    { id: 303, contactId: 3, content: '3 号会议室', time: '11:33', sender: 'them' },
  ],
  4: [
    { id: 401, contactId: 4, content: '活动数据出来了,你看看', time: '昨天 18:20', sender: 'them' },
  ],
  5: [
    { id: 501, contactId: 5, content: 'TypeScript 真香', time: '昨天 14:00', sender: 'them' },
    { id: 502, contactId: 5, content: '确实,类型系统救我狗命', time: '昨天 14:05', sender: 'me' },
  ],
  101: [
    { id: 1001, contactId: 101, content: '📰 科技爱好者周刊第 287 期已发布,本期推荐:理解 React Server Components',
      time: '1 小时前', sender: 'them', type: 'system' },
  ],
  102: [
    { id: 1002, contactId: 102, content: '⭐ 今日热门项目: awesome-react-components (⭐ 12.3k)',
      time: '3 小时前', sender: 'them', type: 'system' },
  ],
  103: [
    { id: 1003, contactId: 103, content: '👋 欢迎使用风迹集!点击右上角开始你的创作之旅。',
      time: '3 天前', sender: 'them', type: 'system' },
  ],
}

const seedNotices: Notice[] = [
  {
    id: 201, actorName: '张三', type: 'comment',
    target: '你的文章《Vue 3 实战》',
    preview: '写得很详细,期待下一篇!', time: '5 分钟前', read: false,
  },
  {
    id: 202, actorName: '李四', type: 'like',
    target: '你的项目《博客系统》', time: '20 分钟前', read: false,
  },
  {
    id: 203, actorName: '王五', type: 'follow',
    target: '关注了你', time: '1 小时前', read: false,
  },
  {
    id: 204, actorName: '赵六', type: 'reply',
    target: '你的评论',
    preview: '我也遇到过这个问题...', time: '2 小时前', read: true,
  },
  {
    id: 205, actorName: '系统', type: 'system',
    target: '欢迎加入风迹集社区!', time: '3 天前', read: true,
  },
]

// ============== Hooks ==============
export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>(seedContacts)
  const [strangers, setStrangers] = useState<Contact[]>(seedStrangers)

  const updateContact = (id: number, patch: Partial<Contact>) => {
    setContacts(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }

  // 接受申请 → 陌生人变好友
  const acceptStranger = (stranger: Contact) => {
    setStrangers(prev => prev.filter(s => s.id !== stranger.id))
    setContacts(prev => ([
      {
        ...stranger,
        isFriend: true,
        lastMessage: '已成为好友,开始聊天吧~',
        lastTime: '刚刚',
        unread: 0,
        online: true,
      },
      ...prev,
    ]))
  }

  return { contacts, strangers, updateContact, acceptStranger }
}

// 搜索用户(按名字 或 身份码,跨好友/陌生人)
export function useSearchUsers() {
  const { contacts, strangers } = useContacts()
  return (query: string): Contact[] => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return [...contacts, ...strangers].filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.identityCode.toLowerCase().includes(q),
    )
  }
}

export function useMessages() {
  const [messagesByContact, setMessagesByContact] = useState(seedMessages)

  const sendMessage = (contactId: number, content: string) => {
    const newMsg: Message = {
      id: Date.now(),
      contactId,
      content,
      time: '刚刚',
      sender: 'me',
    }
    setMessagesByContact(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg],
    }))
  }

  // 添加系统消息(成为好友提示等)
  const addSystemMessage = (contactId: number, content: string) => {
    const newMsg: Message = {
      id: Date.now(),
      contactId,
      content,
      time: '刚刚',
      sender: 'them',
      type: 'system',
    }
    setMessagesByContact(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg],
    }))
  }

  return { messagesByContact, sendMessage, addSystemMessage }
}

export function useNotices() {
  const [notices, setNotices] = useState<Notice[]>(seedNotices)
  const markAllRead = () => {
    setNotices(prev => prev.map(n => ({ ...n, read: true })))
  }
  return { notices, markAllRead }
}

// 好友申请管理
export function useFriendRequests() {
  const [requests, setRequests] = useState<FriendRequest[]>(seedRequests)
  const [sentRequests, setSentRequests] = useState<number[]>([])  // 已发送的陌生人 ID
  const [ignoredIds, setIgnoredIds] = useState<Set<number>>(new Set())  // 忽略的申请 ID

  const pendingRequests = useMemo(
    () => requests.filter(r => r.status === 'pending' && !ignoredIds.has(r.id)),
    [requests, ignoredIds],
  )

  const ignoredRequests = useMemo(
    () => requests.filter(r => ignoredIds.has(r.id)),
    [requests, ignoredIds],
  )

  const acceptRequest = (id: number) => {
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'accepted' } : r,
    ))
    setIgnoredIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const rejectRequest = (id: number) => {
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'rejected' } : r,
    ))
    setIgnoredIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  /** 忽略 — 不再决定,稍后再看 */
  const ignoreRequest = (id: number) => {
    setIgnoredIds(prev => new Set(prev).add(id))
  }

  /** 恢复显示(从"已忽略"回到"新的朋友") */
  const restoreRequest = (id: number) => {
    setIgnoredIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const sendRequest = (stranger: Contact) => {
    setSentRequests(prev => prev.includes(stranger.id) ? prev : [...prev, stranger.id])
  }

  return {
    requests, sentRequests, pendingRequests, ignoredRequests, ignoredIds,
    acceptRequest, rejectRequest, ignoreRequest, restoreRequest, sendRequest,
  }
}

export function useFollowed() {
  const [followedIds, setFollowedIds] = useState<number[]>([101, 102, 103])
  const follow = (id: number) => {
    setFollowedIds(prev => (prev.includes(id) ? prev : [...prev, id]))
  }
  const unfollow = (id: number) => {
    setFollowedIds(prev => prev.filter(f => f !== id))
  }
  const isFollowed = (id: number) => followedIds.includes(id)
  return { followedIds, follow, unfollow, isFollowed }
}