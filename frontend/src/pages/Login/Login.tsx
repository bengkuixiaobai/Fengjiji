import { Form, Input, Button, Checkbox, message, Tooltip } from 'antd'
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
        const { user, token, refreshToken } = response.data
        setAuth(user, token, refreshToken)
        localStorage.setItem('auth-token', token)
        if (refreshToken) localStorage.setItem('auth-refresh-token', refreshToken)
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

  // 验证失败:用 toast 提示一下下就消失
  const handleFinishFailed = (errorInfo: { errorFields: { name: string[] }[] }) => {
    const missing = errorInfo.errorFields.map((f) => f.name[0]).join(' 和 ')
    const map: Record<string, string> = {
      usernameOrEmail: '用户名或邮箱',
      password: '密码',
    }
    const labels = errorInfo.errorFields
      .map((f) => map[f.name[0]] || f.name[0])
      .join(' 和 ')
    message.error(`请输入${labels}`, 2)  // 2 秒后自动消失
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
            onFinishFailed={handleFinishFailed}
            autoComplete="off"
            size="large"
            className={styles.form}
            validateTrigger={[]}
            requiredMark={false}
          >
            <Form.Item
              name="usernameOrEmail"
              rules={[
                { required: true, message: '' },
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
                { required: true, message: '' },
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
              <Tooltip title="如需重置密码,请联系系统管理员">
                <span className={styles.forgotLink} style={{ cursor: 'help' }}>
                  忘记密码？
                </span>
              </Tooltip>
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
