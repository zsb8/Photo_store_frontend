import React from 'react';
import { Card, Input, Select, DatePicker, Button, Table, Typography, Tag } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import styles from '../styles/photos-backend-management.module.css';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
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

interface ViewOrdersModuleProps {
  payments: PaymentRecord[];
  filteredPayments: PaymentRecord[];
  paymentsLoading: boolean;
  searchText: string;
  setSearchText: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  setDateRange: (v: [string, string] | null) => void;
  loadPayments: () => Promise<void> | void;
  formatAmount: (amount: number, currency: string) => string;
  formatDate: (timestamp: number) => string;
  getStatusTag: (status: string) => React.ReactNode;
}

const ViewOrdersModule: React.FC<ViewOrdersModuleProps> = ({
  payments,
  filteredPayments,
  paymentsLoading,
  searchText,
  setSearchText,
  statusFilter,
  setStatusFilter,
  setDateRange,
  loadPayments,
  formatAmount,
  formatDate,
  getStatusTag,
}) => {
  const paymentColumns = [
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
      title: '客户邮箱',
      dataIndex: 'customer_email',
      key: 'customer_email',
      render: (email: string) => email || '-',
    },
    {
      title: '支付时间',
      dataIndex: 'created',
      key: 'created',
      render: (created: number) => formatDate(created),
    },
  ];

  return (
    <Card title="查看订单" className={styles.contentCard}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder="搜索订单ID、姓名、电话、邮件"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
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
          <Option value="canceled">已取消</Option>
        </Select>
        <RangePicker
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
            } else {
              setDateRange(null);
            }
          }}
          placeholder={['开始日期', '结束日期']}
        />
        <Button 
          icon={<ReloadOutlined />}
          onClick={loadPayments}
          loading={paymentsLoading}
        >
          刷新
        </Button>
      </div>

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
        <Card size="small">
          <div style={{ textAlign: 'center' }}>
            <Title level={4} style={{ margin: 0, color: '#666' }}>
              {filteredPayments.length}
            </Title>
            <Text type="secondary">当前显示</Text>
          </div>
        </Card>
      </div>

      <Table
        columns={paymentColumns as any}
        dataSource={filteredPayments}
        rowKey="id"
        loading={paymentsLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
        }}
        scroll={{ x: 1000 }}
      />
    </Card>
  );
};

export default ViewOrdersModule;


