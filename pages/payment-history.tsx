import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Table, Tag, Typography, Button, Space, DatePicker, Select, Input, message } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, DownloadOutlined, HomeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { RouteGuard } from '../components/route-guard';
import { useI18n } from "../contexts/I18nContext";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created: number;
  customer_email?: string;
}

const PaymentHistoryPage: React.FC = () => {
  const { t } = useI18n();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // 模拟支付数据 - 在实际应用中，这些数据应该从API获取
  const mockPayments: PaymentRecord[] = [
    {
      id: 'cs_test_1234567890',
      amount: 5000,
      currency: 'usd',
      status: 'paid',
             description: 'Purchase Photo服务',
      created: Date.now() / 1000 - 86400, // 1天前
      customer_email: 'user@example.com'
    },
    {
      id: 'cs_test_0987654321',
      amount: 2500,
      currency: 'usd',
      status: 'pending',
      description: '高级报告模板',
      created: Date.now() / 1000 - 172800, // 2天前
      customer_email: 'user@example.com'
    },
    {
      id: 'cs_test_1122334455',
      amount: 10000,
      currency: 'usd',
      status: 'paid',
      description: '企业版订阅',
      created: Date.now() / 1000 - 259200, // 3天前
      customer_email: 'user@example.com'
    }
  ];

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      // 调用API获取支付记录
      const response = await fetch('/api/payment-history');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.sessions || []);
      } else {
        // 如果API调用失败，使用模拟数据
        console.warn('API call failed, using mock data');
        setPayments(mockPayments);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      // 如果出现错误，使用模拟数据
      setPayments(mockPayments);
      message.warning('使用模拟数据，API连接失败');
    } finally {
      setLoading(false);
    }
  }, [mockPayments]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      paid: { color: 'success', text: '已支付' },
      pending: { color: 'processing', text: t("Common.processing") },
      failed: { color: 'error', text: '失败' },
      cancelled: { color: 'default', text: '已取消' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text code>{id}</Text>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: PaymentRecord) => (
        <Text strong>{formatAmount(amount, record.currency)}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '支付时间',
      dataIndex: 'created',
      key: 'created',
      render: (created: number) => formatDate(created),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: PaymentRecord) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => viewPaymentDetails(record)}
          >
            查看
          </Button>
          <Button 
            type="link" 
            icon={<DownloadOutlined />}
            onClick={() => downloadReceipt(record)}
          >
            收据
          </Button>
        </Space>
      ),
    },
  ];

  const viewPaymentDetails = (payment: PaymentRecord) => {
    message.info(`查看支付详情: ${payment.id}`);
    // 在实际应用中，这里可以打开一个模态框显示详细信息
  };

  const downloadReceipt = (payment: PaymentRecord) => {
    message.success(`下载收据: ${payment.id}`);
    // 在实际应用中，这里应该生成并下载PDF收据
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.description.toLowerCase().includes(searchText.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    const matchesDate = !dateRange || (
      payment.created >= new Date(dateRange[0]).getTime() / 1000 &&
      payment.created <= new Date(dateRange[1]).getTime() / 1000
    );
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <RouteGuard>
      <Head>
                 <title>支付历史 - Purchase Photo</title>
        <meta name="description" content="查看支付历史记录" />
      </Head>
      
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <Card 
          style={{ 
            maxWidth: 1200, 
            margin: '0 auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            borderRadius: '16px'
          }}
        >
          {/* 头部导航区域 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '24px' 
          }}>
            <Button 
              icon={<HomeOutlined />} 
              onClick={() => router.push('/home')}
              style={{ marginRight: '16px' }}
            >
              返回支付主页
            </Button>
            <div style={{ flex: 1 }}>
              <Title level={2} style={{ margin: 0 }}>支付历史</Title>
              <Text type="secondary">查看您的所有支付记录</Text>
            </div>
          </div>

          {/* 搜索和筛选 */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '24px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <Input
              placeholder="搜索订单ID或描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
            >
              <Option value="all">全部状态</Option>
              <Option value="paid">已支付</Option>
              <Option value="pending">处理中</Option>
              <Option value="failed">失败</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
            
            <RangePicker
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0]!.toISOString(), dates[1]!.toISOString()]);
                } else {
                  setDateRange(null);
                }
              }}
              placeholder={['开始日期', '结束日期']}
            />
            
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadPayments}
              loading={loading}
            >
              刷新
            </Button>
          </div>

          {/* 统计信息 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px', 
            marginBottom: '24px' 
          }}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                  {payments.filter(p => p.status === 'paid').length}
                </Title>
                <Text type="secondary">成功支付</Text>
              </div>
            </Card>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                  {formatAmount(
                    payments
                      .filter(p => p.status === 'paid')
                      .reduce((sum, p) => sum + p.amount, 0),
                    'usd'
                  )}
                </Title>
                <Text type="secondary">总支付金额</Text>
              </div>
            </Card>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#faad14' }}>
                  {payments.filter(p => p.status === 'pending').length}
                </Title>
                <Text type="secondary">处理中</Text>
              </div>
            </Card>
          </div>

          {/* 支付记录表格 */}
          <Table
            columns={columns}
            dataSource={filteredPayments}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            }}
          />
        </Card>
      </div>
    </RouteGuard>
  );
};

export default PaymentHistoryPage;
