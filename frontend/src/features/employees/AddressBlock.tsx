import { Col, Form, Input, Row, Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { lookupApi } from '@/features/lookups/api';

interface Props {
  /**
   * Tên trường ngoài cùng — dùng làm prefix cho 5 trường con (countryId/provinceId/districtId/wardId/addressLine).
   * Form sẽ giữ nested object dạng `{ [name]: { countryId, provinceId, ... } }`.
   */
  name: string;
  disabled?: boolean;
}

/**
 * Khối nhập 1 địa chỉ Việt Nam: Quốc gia → Tỉnh/Thành → Quận/Huyện → Phường/Xã + dòng địa chỉ.
 * District/Ward chưa seed sẵn → dropdown vẫn render nhưng có thể rỗng (acceptable cho MVP).
 */
export function AddressBlock({ name, disabled }: Props) {
  const countries = useQuery({
    queryKey: ['lookup-options', 'Country'],
    queryFn: () => lookupApi.listItems('Country', { page: 1, pageSize: 300 }),
  });
  const provinces = useQuery({
    queryKey: ['lookup-options', 'Province'],
    queryFn: () => lookupApi.listItems('Province', { page: 1, pageSize: 300 }),
  });

  const opts = (rows?: { id: string; code: string; name: string }[]) =>
    (rows ?? []).map((x) => ({ value: x.id, label: x.name }));

  return (
    <Row gutter={12}>
      <Col span={6}>
        <Form.Item label="Quốc gia" name={[name, 'countryId']}>
          <Select allowClear showSearch optionFilterProp="label" disabled={disabled}
            options={opts(countries.data?.items)} loading={countries.isLoading} />
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item label="Tỉnh/Thành phố" name={[name, 'provinceId']}>
          <Select allowClear showSearch optionFilterProp="label" disabled={disabled}
            options={opts(provinces.data?.items)} loading={provinces.isLoading} />
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item label="Quận/Huyện" name={[name, 'districtId']}>
          {/* District/Ward chưa seed — placeholder text input free-form không có, để Select rỗng */}
          <Select allowClear showSearch optionFilterProp="label" disabled={disabled} options={[]} notFoundContent="Chưa có dữ liệu" />
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item label="Phường/Xã" name={[name, 'wardId']}>
          <Select allowClear showSearch optionFilterProp="label" disabled={disabled} options={[]} notFoundContent="Chưa có dữ liệu" />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="Địa chỉ" name={[name, 'addressLine']}>
          <Input maxLength={512} disabled={disabled} placeholder="Số nhà, đường, thôn..." />
        </Form.Item>
      </Col>
    </Row>
  );
}
