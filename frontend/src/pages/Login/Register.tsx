import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, KeyOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { register } from '../../services/auth'
import styles from './Login.module.css'

interface RegisterFormValues {
  username: string
  email: string
  password: string
  confirmPassword: string
  inviteCode: string
}

function Register() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { login: setAuth, setLoading, setError } = useAuthStore()

  const handleSubmit = async (values: RegisterFormValues) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await register({
        username: values.username,
        email: values.email,
        password: values.password,
        inviteCode: values.inviteCode,
      })

      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data
        setAuth(user, token, refreshToken)
        localStorage.setItem('auth-token', token)
        if (refreshToken) localStorage.setItem('auth-refresh-token', refreshToken)
        message.success('注册成功！')
        navigate('/')
      } else {
        message.error(response.error?.message || '注册失败')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || '网络错误，请稍后重试'
      message.error(errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* 左侧品牌区 - 星空流星风格 */}
      <div className={styles.brandSection}>
        {/* 星空 */}
        <div className={styles.stars}>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
          <div className={styles.star}></div>
        </div>

        {/* 流星 */}
        <div className={styles.shootingStars}>
          <div className={styles.shootingStar}></div>
          <div className={styles.shootingStar}></div>
          <div className={styles.shootingStar}></div>
          <div className={styles.shootingStar}></div>
        </div>

        {/* 装饰线 */}
        <div className={styles.decoration}>
          <div className={styles.windLine}></div>
          <div className={styles.windLine}></div>
          <div className={styles.windLine}></div>
        </div>

        <div className={styles.brandContent}>
          <h1 className={styles.logo}>风迹集</h1>
          <p className={styles.slogan}>风过留痕，迹存于心</p>
          <p className={styles.description}>
            记录技术思考，分享项目经验<br />
            沉淀个人知识，追踪项目进度
          </p>
        </div>
      </div>

      {/* 右侧注册表单 */}
      <div className={styles.formSection}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>创建账户</h2>
          <p className={styles.formSubtitle}>开启您的风迹集之旅</p>

          <Form
            form={form}
            name="register"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
            className={styles.form}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
                { max: 20, message: '用户名最多20个字符' },
              ]}
            >
              <Input
                prefix={<UserOutlined className={styles.inputIcon} />}
                placeholder="用户名"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<MailOutlined className={styles.inputIcon} />}
                placeholder="邮箱地址"
              />
            </Form.Item>

            <Form.Item
              name="inviteCode"
              rules={[
                { required: true, message: '请输入邀请码' },
              ]}
            >
              <Input
                prefix={<KeyOutlined className={styles.inputIcon} />}
                placeholder="邀请码"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className={styles.inputIcon} />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className={styles.inputIcon} />}
                placeholder="确认密码"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block className={styles.submitBtn}>
                注册
              </Button>
            </Form.Item>
          </Form>

          <div className={styles.footer}>
            已有账户？{' '}
            <Link to="/login" className={styles.registerLink}>
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
