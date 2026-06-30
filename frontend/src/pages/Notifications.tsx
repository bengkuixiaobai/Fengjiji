// 通知中心 — 聊天 + 关注 + 通知 + 好友申请
import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Input, Button, Avatar, Badge, Tabs, Empty, message, Modal, Tag, Tooltip,
} from 'antd'
import {
  ArrowLeftOutlined, SearchOutlined, SendOutlined,
  SmileOutlined, PictureOutlined, CheckOutlined,
  BellOutlined, BookOutlined, RocketOutlined,
  MessageOutlined, GlobalOutlined, BellFilled,
  UserAddOutlined, CheckCircleOutlined, CloseCircleOutlined,
  IdcardOutlined, ClockCircleOutlined,
} from '@ant-design/icons'
import AppLayout from '../components/AppLayout'
import { useAuthStore } from '../stores/authStore'
import {
  useContacts, useMessages, useNotices, useFollowed,
  useSearchUsers, useFriendRequests,
  type Contact, type FriendRequest,
} from '../services/notifications'

type TabKey = 'messages' | 'following' | 'notices'

export default function Notifications() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { contacts, strangers, updateContact, acceptStranger } = useContacts()
  const { messagesByContact, sendMessage, addSystemMessage } = useMessages()
  const { notices, markAllRead } = useNotices()
  const { followedIds, follow, unfollow, isFollowed } = useFollowed()
  const searchUsers = useSearchUsers()
  const {
    sentRequests, pendingRequests, ignoredRequests,
    acceptRequest, rejectRequest, ignoreRequest, restoreRequest, sendRequest,
  } = useFriendRequests()

  // 关注切换
  const handleToggleFollow = (c: Contact) => {
    if (isFollowed(c.id)) {
      unfollow(c.id)
      message.success(`已取消关注「${c.name}」`)
    } else {
      follow(c.id)
      message.success(`已关注「${c.name}」`)
    }
  }

  const [tab, setTab] = useState<TabKey>('messages')
  const [search, setSearch] = useState('')
  const [activeContactId, setActiveContactId] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [addFriendOpen, setAddFriendOpen] = useState(false)
  const [addFriendQuery, setAddFriendQuery] = useState('')
  const messageEndRef = useRef<HTMLDivElement>(null)

  // 消息 tab 默认选中第一个
  useEffect(() => {
    if (tab === 'messages' && !activeContactId && contacts.length > 0) {
      const firstUnread = contacts.find(c => c.unread > 0 && c.isFriend)
      setActiveContactId(firstUnread?.id ?? contacts.find(c => c.isFriend)?.id ?? null)
    }
  }, [tab, contacts, activeContactId])

  const activeContact = useMemo(
    () => contacts.find(c => c.id === activeContactId) ?? null,
    [contacts, activeContactId],
  )
  const activeMessages = activeContactId ? (messagesByContact[activeContactId] ?? []) : []

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages.length, activeContactId])

  // 联系人列表(过滤搜索)
  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return contacts
      .filter(c => c.isFriend)
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.identityCode.toLowerCase().includes(q))
  }, [contacts, search])

  // 联系人 + 系统账号分组
  const { personalContacts, systemContacts } = useMemo(() => ({
    personalContacts: filteredContacts.filter(c => !c.isSystem),
    systemContacts: filteredContacts.filter(c => c.isSystem),
  }), [filteredContacts])

  const followedContacts = systemContacts.filter(c => followedIds.includes(c.id))

  // 搜索陌生人结果(实时)
  const searchResults = useMemo(() => {
    return searchUsers(addFriendQuery)
  }, [addFriendQuery, searchUsers])

  // 发送消息
  const handleSend = () => {
    const text = inputValue.trim()
    if (!text || !activeContactId) return
    sendMessage(activeContactId, text)
    setInputValue('')
    // 模拟对方自动回复
    setTimeout(() => {
      sendMessage(activeContactId, '收到~')
      updateContact(activeContactId, {
        lastMessage: text,
        lastTime: '刚刚',
      })
    }, 800)
    updateContact(activeContactId, {
      lastMessage: text,
      lastTime: '刚刚',
    })
  }

  // 选中联系人 → 清未读
  const handleSelectContact = (c: Contact) => {
    setActiveContactId(c.id)
    updateContact(c.id, { unread: 0 })
  }

  // 发送好友申请
  const handleSendRequest = (stranger: Contact) => {
    sendRequest(stranger)
    message.success(`已向「${stranger.name}」发送好友申请`)
  }

  // 接受申请
  const handleAcceptRequest = (req: FriendRequest) => {
    acceptRequest(req.id)
    // 找到对应的 stranger,加入好友
    const stranger = strangers.find(s => s.id === req.fromId)
    if (stranger) {
      acceptStranger({ ...stranger, name: req.fromName })
      addSystemMessage(stranger.id, `🎉 你已成为「${req.fromName}」的好友,开始聊天吧!`)
    }
    message.success(`已添加「${req.fromName}」为好友`)
  }

  // 拒绝申请
  const handleRejectRequest = (req: FriendRequest) => {
    rejectRequest(req.id)
    message.info('已拒绝申请')
  }

  // 头像背景渐变
  const avatarColor = (name: string) => {
    const colors = ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#f472b6', '#3b82f6']
    let h = 0
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
    return colors[h % colors.length]
  }

  const unreadTotal = contacts.filter(c => c.isFriend).reduce((s, c) => s + c.unread, 0)
  const noticeUnread = notices.filter(n => !n.read).length
  const requestCount = pendingRequests.length

  return (
    <AppLayout selectedKey="notifications">
      <div style={{
        animation: 'fadeIn 0.4s ease-out both',
        maxWidth: 1280, margin: '0 auto',
      }}>
        {/* ===== 顶部操作栏 ===== */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '8px 12px',
          marginBottom: '20px',
          background: 'var(--card-bg)',
          border: 'var(--card-border)',
          borderRadius: '12px',
          backdropFilter: 'blur(20px)',
          boxShadow: 'var(--shadow-sm)',
          gap: '10px',
        }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="fjj-btn-text"
            style={{
              color: 'var(--secondary-text)',
              width: 34, height: 34, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4 }}>
            <span style={{
              fontSize: 22, lineHeight: 1,
              filter: 'drop-shadow(0 2px 6px rgba(102, 126, 234, 0.3))',
            }}>💬</span>
            <h2 style={{
              margin: 0, color: 'var(--text-color)',
              fontSize: 16, fontWeight: 600,
              letterSpacing: '0.1px', lineHeight: 1,
            }}>消息中心</h2>
            {(unreadTotal + noticeUnread + requestCount) > 0 && (
              <Badge
                count={unreadTotal + noticeUnread + requestCount}
                style={{ marginLeft: 6 }}
              />
            )}
          </div>
          <div style={{ flex: 1 }} />
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            className="fjj-btn-primary"
            onClick={() => setAddFriendOpen(true)}
            style={{ height: 34, borderRadius: 8, fontWeight: 500 }}
          >
            添加好友
          </Button>
        </div>

        {/* ===== 主体两栏 ===== */}
        <div style={{
          background: 'var(--card-bg)',
          border: 'var(--card-border)',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          display: 'flex',
          minHeight: 'calc(100vh - 240px)',
        }}>
          {/* ===== 左侧 ===== */}
          <div style={{
            width: 320,
            flexShrink: 0,
            borderRight: 'var(--divider-color)',
            display: 'flex', flexDirection: 'column',
            background: 'var(--card-bg)',
          }}>
            <div style={{ padding: '12px 14px' }}>
              <Input
                placeholder="搜索名字 / 身份码"
                prefix={<SearchOutlined style={{ color: 'var(--muted-text)' }} />}
                value={search}
                onChange={e => setSearch(e.target.value)}
                allowClear
                style={{ borderRadius: 8 }}
              />
            </div>

            <Tabs
              activeKey={tab}
              onChange={k => setTab(k as TabKey)}
              centered
              size="small"
              items={[
                {
                  key: 'messages',
                  label: (
                    <span>
                      <MessageOutlined /> 消息
                      {unreadTotal > 0 && <Badge count={unreadTotal} size="small" offset={[4, -2]} />}
                    </span>
                  ),
                },
                {
                  key: 'following',
                  label: (
                    <span>
                      <GlobalOutlined /> 关注
                    </span>
                  ),
                },
                {
                  key: 'notices',
                  label: (
                    <span>
                      <BellOutlined /> 通知
                      {noticeUnread > 0 && <Badge count={noticeUnread} size="small" offset={[4, -2]} />}
                    </span>
                  ),
                },
              ]}
              style={{ padding: '0 14px', borderBottom: 'var(--divider-color)' }}
            />

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {tab === 'messages' && (
                <MessagesList
                  personal={personalContacts}
                  system={systemContacts}
                  activeId={activeContactId}
                  onSelect={handleSelectContact}
                  avatarColor={avatarColor}
                  requests={pendingRequests}
                  ignoredRequests={ignoredRequests}
                  onAcceptRequest={handleAcceptRequest}
                  onRejectRequest={handleRejectRequest}
                  onIgnoreRequest={ignoreRequest}
                  onRestoreRequest={restoreRequest}
                />
              )}
              {tab === 'following' && (
                <FollowingList
                  accounts={followedContacts}
                  allAccounts={systemContacts}
                  onFollow={handleToggleFollow}
                  isFollowed={isFollowed}
                  avatarColor={avatarColor}
                />
              )}
              {tab === 'notices' && (
                <NoticesList
                  notices={notices}
                  avatarColor={avatarColor}
                  onMarkAllRead={markAllRead}
                />
              )}
            </div>
          </div>

          {/* ===== 中间:聊天框 ===== */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {!activeContact ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--muted-text)', gap: 12,
              }}>
                <div style={{ fontSize: 64, opacity: 0.3 }}>💬</div>
                <div style={{ fontSize: 14 }}>选择一个联系人开始聊天</div>
                <div style={{ fontSize: 12 }}>或在左侧点击「+ 添加好友」开启新对话</div>
              </div>
            ) : (
              <>
                {/* 聊天对象头部 — 头像左,信息浮在右上方(更紧凑) */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px',
                  borderBottom: 'var(--divider-color)',
                  background: 'var(--card-bg)',
                }}>
                  {/* 头像(在线点已内置在右上角) */}
                  <Badge
                    dot color={activeContact.online ? '#10b981' : '#9ca3af'}
                    offset={[-4, 2]}
                  >
                    <Avatar size={44} src={activeContact.avatar}
                      style={{
                        background: avatarColor(activeContact.name),
                        fontSize: 16, fontWeight: 600, flexShrink: 0,
                        border: '2px solid var(--card-bg)',
                      }}
                    >
                      {activeContact.name?.[0]}
                    </Avatar>
                  </Badge>
                  {/* 文字信息 — 竖排在头像右边 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--text-color)', fontSize: 15, fontWeight: 600 }}>
                        {activeContact.name}
                      </span>
                      {activeContact.isSystem && (
                        <span style={{ padding: '1px 6px', background: 'rgba(102, 126, 234, 0.12)', color: 'var(--accent-start)', fontSize: 10, fontWeight: 600, borderRadius: 4 }}>
                          公众号
                        </span>
                      )}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '1px 6px',
                        background: 'var(--segmented-bg)',
                        color: 'var(--muted-text)',
                        fontSize: 10, fontWeight: 600,
                        borderRadius: 4,
                        fontFamily: 'monospace',
                      }}>
                        <IdcardOutlined style={{ fontSize: 9 }} />
                        {activeContact.identityCode}
                      </span>
                    </div>
                    <div style={{
                      color: 'var(--muted-text)', fontSize: 11,
                      marginTop: 3, display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{
                        display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                        background: activeContact.online ? '#10b981' : '#9ca3af',
                      }} />
                      {activeContact.online ? '在线' : '离线'}
                    </div>
                  </div>
                  {activeContact.isSystem && (
                    <Button
                      size="small"
                      type={isFollowed(activeContact.id) ? 'default' : 'primary'}
                      className={isFollowed(activeContact.id) ? '' : 'fjj-btn-primary'}
                      onClick={() => handleToggleFollow(activeContact)}
                      style={{ borderRadius: 8 }}
                    >
                      {isFollowed(activeContact.id) ? '已关注' : '+ 关注'}
                    </Button>
                  )}
                </div>

                {/* 消息列表 */}
                <div style={{
                  flex: 1, overflowY: 'auto',
                  padding: '20px',
                  background: 'var(--segmented-bg)',
                }}>
                  {activeMessages.length === 0 ? (
                    <Empty description="还没有消息,开始聊吧~" />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {activeMessages.map((m, idx) => (
                        <MessageBubble
                          key={m.id} message={m}
                          avatarColor={avatarColor(activeContact.name)}
                          isFirst={idx === 0 || activeMessages[idx - 1].sender !== m.sender}
                          isLast={idx === activeMessages.length - 1 || activeMessages[idx + 1].sender !== m.sender}
                          myAvatarColor={avatarColor(user?.nickname || user?.username || '我')}
                        />
                      ))}
                      <div ref={messageEndRef} />
                    </div>
                  )}
                </div>

                {/* 输入区 */}
                <div style={{
                  padding: '12px 16px',
                  borderTop: 'var(--divider-color)',
                  background: 'var(--card-bg)',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: 8,
                    padding: '8px 12px',
                    background: 'var(--segmented-bg)',
                    borderRadius: 12,
                    border: '1px solid var(--input-border)',
                  }}>
                    <Button type="text" icon={<SmileOutlined />} className="fjj-btn-text"
                      style={{ color: 'var(--muted-text)' }} />
                    <Button type="text" icon={<PictureOutlined />} className="fjj-btn-text"
                      style={{ color: 'var(--muted-text)' }} />
                    <Input.TextArea
                      placeholder={`给 ${activeContact.name} 发消息...`}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onPressEnter={e => {
                        if (!e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      variant="borderless"
                      style={{ flex: 1, padding: '4px 0', resize: 'none' }}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      className="fjj-btn-primary"
                      onClick={handleSend}
                      disabled={!inputValue.trim()}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===== 添加好友弹窗 ===== */}
      <Modal
        open={addFriendOpen}
        title="添加好友"
        onCancel={() => { setAddFriendOpen(false); setAddFriendQuery('') }}
        footer={null}
        width={520}
        destroyOnClose
        centered
      >
        <Input
          placeholder="搜索用户名 / 身份码(如 FJ7K9P2)"
          prefix={<SearchOutlined style={{ color: 'var(--muted-text)' }} />}
          value={addFriendQuery}
          onChange={e => setAddFriendQuery(e.target.value)}
          allowClear
          autoFocus
          size="large"
          style={{ borderRadius: 8, marginBottom: 12 }}
        />

        {addFriendQuery.trim() === '' ? (
          <div style={{
            padding: '40px 20px', textAlign: 'center',
            color: 'var(--muted-text)', fontSize: 13,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>🔍</div>
            输入用户名或身份码搜索用户
          </div>
        ) : searchResults.length === 0 ? (
          <div style={{
            padding: '30px 20px', textAlign: 'center',
            color: 'var(--muted-text)', fontSize: 13,
          }}>
            没有找到匹配的用户
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {searchResults.map(u => (
              <SearchResultItem
                key={u.id}
                user={u}
                avatarColor={avatarColor(u.name)}
                sent={sentRequests.includes(u.id)}
                onAdd={() => handleSendRequest(u)}
              />
            ))}
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}

// ===== 搜索结果项 =====
function SearchResultItem({ user, avatarColor, sent, onAdd }: {
  user: Contact; avatarColor: string; sent: boolean; onAdd: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px',
      background: 'var(--card-bg)',
      borderRadius: 8,
      border: '1px solid var(--input-border)',
      transition: 'all 0.2s ease',
    }}>
      <Avatar size={40} src={user.avatar}
        style={{ background: avatarColor, fontSize: 16, fontWeight: 600, flexShrink: 0 }}>
        {user.name?.[0]}
      </Avatar>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--text-color)', fontSize: 14, fontWeight: 500 }}>
          {user.name}
          {user.isFriend && (
            <Tag style={{ marginLeft: 6, padding: '0 6px', fontSize: 10, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'none', borderRadius: 3 }}>
              已是好友
            </Tag>
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--muted-text)', fontSize: 11, marginTop: 2,
        }}>
          <IdcardOutlined style={{ fontSize: 10 }} />
          <span style={{ fontFamily: 'monospace' }}>{user.identityCode}</span>
          {user.online && <span style={{ color: '#10b981' }}>· 在线</span>}
        </div>
      </div>
      {user.isFriend ? (
        <Tag style={{ margin: 0, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'none' }}>
          已添加
        </Tag>
      ) : sent ? (
        <Tag style={{ margin: 0, background: 'var(--segmented-bg)', color: 'var(--muted-text)', border: 'none' }}>
          <ClockCircleOutlined /> 已发送
        </Tag>
      ) : (
        <Button
          type="primary"
          size="small"
          className="fjj-btn-primary"
          icon={<UserAddOutlined />}
          onClick={onAdd}
          style={{ borderRadius: 6 }}
        >
          添加
        </Button>
      )}
    </div>
  )
}

// ===== 联系人列表(含"新的朋友"申请区域) =====
function MessagesList({
  personal, system, activeId, onSelect, avatarColor,
  requests, ignoredRequests,
  onAcceptRequest, onRejectRequest, onIgnoreRequest, onRestoreRequest,
}: {
  personal: Contact[]; system: Contact[]; activeId: number | null;
  onSelect: (c: Contact) => void; avatarColor: (name: string) => string;
  requests: FriendRequest[]; ignoredRequests: FriendRequest[];
  onAcceptRequest: (r: FriendRequest) => void;
  onRejectRequest: (r: FriendRequest) => void;
  onIgnoreRequest: (id: number) => void;
  onRestoreRequest: (id: number) => void;
}) {
  const [showIgnored, setShowIgnored] = useState(false)

  if (personal.length === 0 && system.length === 0 && requests.length === 0 && ignoredRequests.length === 0) {
    return <Empty description="暂无联系人" style={{ marginTop: 60 }} />
  }
  return (
    <>
      {/* 好友申请区 */}
      {requests.length > 0 && (
        <>
          <div style={listSectionTitle}>
            新的朋友 <Badge count={requests.length} style={{ background: '#f472b6', marginLeft: 4 }} />
          </div>
          {requests.map(r => (
            <RequestItem key={r.id} req={r} avatarColor={avatarColor}
              onAccept={() => onAcceptRequest(r)}
              onReject={() => onRejectRequest(r)}
              onIgnore={() => onIgnoreRequest(r.id)} />
          ))}
        </>
      )}

      {/* 已忽略申请(可点开查看 + 恢复) */}
      {ignoredRequests.length > 0 && (
        <>
          <div
            onClick={() => setShowIgnored(s => !s)}
            style={{
              ...listSectionTitle,
              cursor: 'pointer',
              color: 'var(--muted-text)',
            }}
          >
            <span>已忽略 {ignoredRequests.length} 项</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 500 }}>
              {showIgnored ? '收起 ▴' : '展开 ▾'}
            </span>
          </div>
          {showIgnored && ignoredRequests.map(r => (
            <RequestItem key={r.id} req={r} avatarColor={avatarColor}
              isIgnored
              onAccept={() => onAcceptRequest(r)}
              onReject={() => onRejectRequest(r)}
              onIgnore={() => onRestoreRequest(r.id)} />
          ))}
        </>
      )}

      {personal.length > 0 && (
        <>
          <div style={listSectionTitle}>私聊</div>
          {personal.map(c => (
            <ContactItem key={c.id} contact={c} active={activeId === c.id}
              onSelect={onSelect} avatarColor={avatarColor} />
          ))}
        </>
      )}

      {system.length > 0 && (
        <>
          <div style={listSectionTitle}>公众号 / 订阅号</div>
          {system.map(c => (
            <ContactItem key={c.id} contact={c} active={activeId === c.id}
              onSelect={onSelect} avatarColor={avatarColor} />
          ))}
        </>
      )}
    </>
  )
}

const listSectionTitle: React.CSSProperties = {
  padding: '12px 14px 4px',
  color: 'var(--muted-text)',
  fontSize: 10, fontWeight: 600,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  display: 'flex', alignItems: 'center',
}

// ===== 申请项 =====
function RequestItem({ req, avatarColor, onAccept, onReject, onIgnore, isIgnored }: {
  req: FriendRequest; avatarColor: (name: string) => string;
  onAccept: () => void; onReject: () => void; onIgnore: () => void;
  isIgnored?: boolean
}) {
  return (
    <div style={{
      padding: '10px 14px',
      background: isIgnored
        ? 'rgba(255, 255, 255, 0.02)'
        : 'rgba(244, 114, 182, 0.04)',
      borderLeft: isIgnored
        ? '3px solid var(--input-border)'
        : '3px solid #f472b6',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar size={36} style={{ background: avatarColor(req.fromName), fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
          {req.fromName?.[0]}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--text-color)', fontSize: 13, fontWeight: 500 }}>
              {req.fromName}
            </span>
            <span style={{
              padding: '0 4px', fontSize: 9, fontWeight: 600,
              background: 'var(--segmented-bg)', color: 'var(--muted-text)',
              borderRadius: 3, fontFamily: 'monospace',
            }}>
              @{req.fromCode}
            </span>
            {isIgnored && (
              <span style={{
                padding: '0 4px', fontSize: 9, fontWeight: 600,
                background: 'var(--segmented-bg)', color: 'var(--muted-text)',
                borderRadius: 3,
              }}>已忽略</span>
            )}
          </div>
          <div style={{
            color: 'var(--muted-text)', fontSize: 11, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {req.message}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <Button
          type="primary"
          size="small"
          className="fjj-btn-primary"
          icon={<CheckCircleOutlined />}
          onClick={onAccept}
          style={{ flex: 1, borderRadius: 8, fontSize: 12 }}
        >
          接受
        </Button>
        <Tooltip title="拒绝">
          <Button
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={onReject}
            style={{ borderRadius: 8, width: 36, padding: 0 }}
          />
        </Tooltip>
        <Tooltip title={isIgnored ? '恢复显示' : '忽略,稍后处理'}>
          <Button
            size="small"
            type={isIgnored ? 'default' : 'text'}
            onClick={onIgnore}
            style={{ borderRadius: 8, fontSize: 12, padding: '0 10px' }}
          >
            {isIgnored ? '↩' : '忽略'}
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

function ContactItem({ contact, active, onSelect, avatarColor }: {
  contact: Contact; active: boolean;
  onSelect: (c: Contact) => void; avatarColor: (name: string) => string
}) {
  return (
    <div
      onClick={() => onSelect(contact)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        cursor: 'pointer',
        background: active ? 'rgba(102, 126, 234, 0.12)' : 'transparent',
        borderLeft: active ? '3px solid var(--accent-start)' : '3px solid transparent',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <Badge dot color={contact.online ? '#10b981' : '#9ca3af'} offset={[-2, 28]}>
        <Avatar size={40} src={contact.avatar}
          style={{ background: avatarColor(contact.name), fontSize: 16, fontWeight: 600, flexShrink: 0 }}>
          {contact.name?.[0]}
        </Avatar>
      </Badge>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 4,
        }}>
          <span style={{
            color: 'var(--text-color)', fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 4,
            minWidth: 0, flex: 1,
          }}>
            <span style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 100,
            }}>{contact.name}</span>
            <span style={{
              padding: '0 4px', fontSize: 9, fontWeight: 600,
              background: 'var(--segmented-bg)', color: 'var(--muted-text)',
              borderRadius: 3, fontFamily: 'monospace', flexShrink: 0,
            }}>
              {contact.identityCode}
            </span>
            {contact.isSystem && (
              <span style={{
                padding: '0 4px', fontSize: 9, fontWeight: 600,
                background: 'rgba(102, 126, 234, 0.15)', color: 'var(--accent-start)',
                borderRadius: 3, flexShrink: 0,
              }}>号</span>
            )}
          </span>
          <span style={{ color: 'var(--muted-text)', fontSize: 10, flexShrink: 0 }}>{contact.lastTime}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 4, marginTop: 2,
        }}>
          <span style={{
            color: 'var(--muted-text)', fontSize: 12,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1, minWidth: 0,
          }}>{contact.lastMessage}</span>
          {contact.unread > 0 && (
            <Badge count={contact.unread} size="small"
              style={{ background: 'var(--accent-start)', flexShrink: 0 }} />
          )}
        </div>
      </div>
    </div>
  )
}

// ===== 关注列表 =====
function FollowingList({ accounts, allAccounts, onFollow, isFollowed, avatarColor }: {
  accounts: Contact[]; allAccounts: Contact[];
  onFollow: (c: Contact) => void; isFollowed: (id: number) => boolean;
  avatarColor: (name: string) => string
}) {
  const unfollowed = allAccounts.filter(a => !isFollowed(a.id))
  return (
    <div>
      <div style={listSectionTitle}>已关注 ({accounts.length})</div>
      {accounts.length === 0 && (
        <div style={{ padding: '20px 14px', color: 'var(--muted-text)', fontSize: 12, textAlign: 'center' }}>
          还没有关注任何公众号
        </div>
      )}
      {accounts.map(c => (
        <AccountItem key={c.id} account={c} onFollow={onFollow}
          followed={true} avatarColor={avatarColor} />
      ))}
      <div style={listSectionTitle}>推荐关注</div>
      {unfollowed.map(c => (
        <AccountItem key={c.id} account={c} onFollow={onFollow}
          followed={false} avatarColor={avatarColor} />
      ))}
    </div>
  )
}

function AccountItem({ account, onFollow, followed, avatarColor }: {
  account: Contact; onFollow: (c: Contact) => void; followed: boolean;
  avatarColor: (name: string) => string
}) {
  const Icon = account.systemType === 'blog' ? BookOutlined
    : account.systemType === 'project' ? RocketOutlined
    : BellFilled
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
    }}>
      <Avatar size={36} icon={<Icon />}
        style={{ background: avatarColor(account.name), flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--text-color)', fontSize: 13, fontWeight: 500 }}>
          {account.name}
          {followed && <CheckOutlined style={{ color: 'var(--accent-start)', fontSize: 11, marginLeft: 4 }} />}
        </div>
        <div style={{ color: 'var(--muted-text)', fontSize: 11, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {account.lastMessage || account.identityCode}
        </div>
      </div>
      <Button size="small"
        type={followed ? 'default' : 'primary'}
        className={followed ? '' : 'fjj-btn-primary'}
        onClick={() => onFollow(account)}
        style={{ borderRadius: 6, fontSize: 12, flexShrink: 0 }}>
        {followed ? '已关注' : '+ 关注'}
      </Button>
    </div>
  )
}

// ===== 通知列表 =====
function NoticesList({ notices, avatarColor: _avatarColor, onMarkAllRead }: {
  notices: any[]; avatarColor: (name: string) => string;
  onMarkAllRead: () => void
}) {
  if (notices.length === 0) return <Empty description="暂无通知" style={{ marginTop: 60 }} />
  return (
    <div>
      <div style={{
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: 'var(--muted-text)', fontSize: 12 }}>共 {notices.length} 条</span>
        <Button size="small" type="link" onClick={onMarkAllRead}
          style={{ padding: 0, fontSize: 12 }}>全部标为已读</Button>
      </div>
      {notices.map(n => (
        <NoticeItem key={n.id} notice={n} />
      ))}
    </div>
  )
}

function NoticeItem({ notice }: { notice: any }) {
  const iconMap: Record<string, JSX.Element> = {
    comment: <MessageOutlined />, like: <SmileOutlined />,
    follow: <UserAddOutlined />, reply: <MessageOutlined />,
    system: <BellFilled />,
  }
  const colorMap: Record<string, string> = {
    comment: '#3b82f6', like: '#f472b6', follow: '#10b981',
    reply: '#8b5cf6', system: '#9ca3af',
  }
  return (
    <div style={{
      display: 'flex', gap: 10,
      padding: '12px 14px',
      background: notice.read ? 'transparent' : 'rgba(102, 126, 234, 0.04)',
      borderBottom: 'var(--divider-color)',
      cursor: 'pointer',
    }}>
      <Avatar size={36} icon={iconMap[notice.type] ?? <BellFilled />}
        style={{ background: colorMap[notice.type] ?? 'var(--accent-start)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--text-color)', fontSize: 13 }}>
          <strong>{notice.actorName}</strong>
          <span style={{ color: 'var(--muted-text)', marginLeft: 4, fontWeight: 400 }}>
            {notice.type === 'comment' && '评论了'}
            {notice.type === 'like' && '点赞了'}
            {notice.type === 'follow' && '关注了你'}
            {notice.type === 'reply' && '回复了'}
            {notice.type === 'system' && ''}
          </span>
          <span style={{ color: 'var(--text-color)' }}>「{notice.target}」</span>
        </div>
        {notice.preview && (
          <div style={{
            marginTop: 4, padding: '6px 10px',
            background: 'var(--segmented-bg)',
            borderRadius: 6,
            color: 'var(--muted-text)', fontSize: 12,
          }}>
            {notice.preview}
          </div>
        )}
        <div style={{ color: 'var(--muted-text)', fontSize: 11, marginTop: 4 }}>
          {notice.time}
          {!notice.read && (
            <span style={{
              marginLeft: 8, padding: '0 6px',
              background: 'var(--accent-start)', color: '#fff',
              fontSize: 9, fontWeight: 600, borderRadius: 8,
            }}>未读</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== 消息气泡 =====
function MessageBubble({ message, avatarColor, isFirst, isLast, myAvatarColor }: {
  message: any; avatarColor: string; isFirst: boolean; isLast: boolean;
  myAvatarColor: string
}) {
  const isMe = message.sender === 'me'
  return (
    // 整体左对齐一行,头像靠左
    <div style={{
      display: 'flex',
      flexDirection: isMe ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: isFirst ? 0 : 4,
    }}>
      {/* 头像 — 顶部对齐气泡 */}
      <div style={{ width: 32, flexShrink: 0, visibility: isFirst ? 'visible' : 'hidden' }}>
        <Avatar size={32}
          style={{
            background: isMe ? myAvatarColor : avatarColor,
            fontSize: 13, fontWeight: 600,
          }}
        >
          {message.sender === 'them' ? '👤' : '我'}
        </Avatar>
      </div>
      {/* 气泡列 — 紧贴头像右侧,顶部对齐 */}
      <div style={{
        maxWidth: '65%',
        display: 'flex', flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
      }}>
        <div style={{
          padding: message.type === 'image' ? '6px' : '8px 12px',
          background: isMe ? 'var(--accent-gradient)'
            : message.type === 'system' ? 'rgba(245, 158, 11, 0.15)' : 'var(--card-bg)',
          border: isMe ? 'none' : '1px solid var(--input-border)',
          borderRadius: isMe
            ? '12px 12px 4px 12px'
            : '12px 12px 12px 4px',
          color: isMe ? '#fff' : message.type === 'system' ? '#f59e0b' : 'var(--text-color)',
          fontSize: 14, lineHeight: 1.55,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          maxWidth: '100%', wordBreak: 'break-word',
        }}>
          {message.type === 'image' ? (
            <div style={{
              width: 160, height: 110,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 30,
            }}>
              🖼️
            </div>
          ) : message.type === 'system' ? (
            <span>{message.content}</span>
          ) : (
            <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
          )}
        </div>
        {/* 时间 — 贴在气泡下方小角 */}
        {isLast && (
          <span style={{
            color: 'var(--muted-text)', fontSize: 10,
            marginTop: 3, padding: '0 4px',
          }}>{message.time}</span>
        )}
      </div>
    </div>
  )
}