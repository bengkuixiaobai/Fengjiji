import { Form, Input, Button, Checkbox, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { login } from '../../services/auth'
import styles from './Login.module.css'

interface LoginFormValues {
  usernameOrEmail: string
  password: string
  remember: boolean
}

function Login() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { login: setAuth, setLoading, setError } = useAuthStore()

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      setLoading(true)
      setError(null)

      const response = await login({
        usernameOrEmail: values.usernameOrEmail,
        password: values.password,
      })

      if (response.success && response.data) {
        const { user, token } = response.data
        setAuth(user, token)
        localStorage.setItem('auth-token', token)
        message.success('登录成功！')
        navigate('/')
      } else {
        message.error(response.error?.message || '登录失败')
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

      {/* 右侧登录表单 */}
      <div className={styles.formSection}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>欢迎回来</h2>
          <p className={styles.formSubtitle}>登录您的账户继续探索</p>

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
            className={styles.form}
          >
            <Form.Item
              name="usernameOrEmail"
              rules={[
                { required: true, message: '请输入用户名或邮箱' },
              ]}
            >
              <Input
                prefix={<UserOutlined className={styles.inputIcon} />}
                placeholder="用户名或邮箱"
                autoComplete="off"
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
                autoComplete="off"
              />
            </Form.Item>

            <div className={styles.formOptions}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <Link to="/forgot-password" className={styles.forgotLink}>
                忘记密码？
              </Link>
            </div>

            <Form.Item>
              <Button type="primary" htmlType="submit" block className={styles.submitBtn}>
                登录
              </Button>
            </Form.Item>
          </Form>

          <div className={styles.footer}>
            还没有账户？{' '}
            <Link to="/register" className={styles.registerLink}>
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
