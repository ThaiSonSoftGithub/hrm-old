import { Alert, Card, Checkbox, Col, DatePicker, Form, Input, InputNumber, Row, Select, Skeleton, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { employeeApi } from './api';
import type { EmployeeAddressInput, UpdateEmployeePersonalInfoRequest } from './types';
import { lookupApi } from '@/features/lookups/api';
import { AddressBlock } from './AddressBlock';
import { ApiError } from '@/shared/api/apiError';

import type { TabFormActions } from './Tab01General';

interface Props {
  employeeId: string;
  onActionsChange?: (a: TabFormActions) => void;
}

const toIsoDate = (d: any): string | null => (d ? dayjs(d).format('YYYY-MM-DD') : null);
const fromIsoDate = (s: string | null | undefined) => (s ? dayjs(s) : undefined);

const useLookup = (categoryCode: string) => useQuery({
  queryKey: ['lookup-options', categoryCode],
  queryFn: () => lookupApi.listItems(categoryCode, { page: 1, pageSize: 300 }),
});

const lkOpts = (rows?: { id: string; name: string }[]) =>
  (rows ?? []).map((x) => ({ value: x.id, label: x.name }));

export function Tab02Personal({ employeeId, onActionsChange }: Props) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [sameRes, setSameRes] = useState(false);
  const [dirty, setDirty] = useState(false);

  const personal = useQuery({
    queryKey: ['employee', employeeId, 'personal'],
    queryFn: () => employeeApi.getPersonal(employeeId),
  });

  const provinces = useLookup('Province');
  const countries = useLookup('Country');
  const ethnicities = useLookup('Ethnicity');
  const religions = useLookup('Religion');
  const maritalStatuses = useLookup('MaritalStatus');
  const familyBgs = useLookup('FamilyBackground');
  const personalBgs = useLookup('PersonalBackground');
  const eduLevels = useLookup('EducationLevel');
  const eduPlaces = useLookup('TrainingPlace');
  const eduFaculties = useLookup('TrainingFaculty');
  const eduMajors = useLookup('TrainingMajor');
  const degreeRanks = useLookup('DegreeRank');
  const familyRelations = useLookup('FamilyRelation');

  useEffect(() => {
    if (!personal.data) return;
    const p = personal.data;
    setSameRes(p.sameAsPermanentResidence);
    form.setFieldsValue({
      identityNumber: p.identityNumber,
      identityIssueDate: fromIsoDate(p.identityIssueDate),
      identityIssueProvinceId: p.identityIssueProvinceId,
      identityExpiryDate: fromIsoDate(p.identityExpiryDate),
      passportNumber: p.passportNumber,
      passportIssueDate: fromIsoDate(p.passportIssueDate),
      passportIssueProvinceId: p.passportIssueProvinceId,
      passportExpiryDate: fromIsoDate(p.passportExpiryDate),
      partyCardNumber: p.partyCardNumber,
      partyJoinDate: fromIsoDate(p.partyJoinDate),
      partyJoinPlace: p.partyJoinPlace,
      unionCardNumber: p.unionCardNumber,
      unionJoinDate: fromIsoDate(p.unionJoinDate),
      unionJoinPlace: p.unionJoinPlace,
      generalEducationLevel: p.generalEducationLevel,
      educationLevelId: p.educationLevelId,
      educationPlaceId: p.educationPlaceId,
      educationFacultyId: p.educationFacultyId,
      educationMajorId: p.educationMajorId,
      graduationYear: p.graduationYear,
      degreeClassificationId: p.degreeClassificationId,
      maritalStatusId: p.maritalStatusId,
      familyBackgroundId: p.familyBackgroundId,
      personalBackgroundId: p.personalBackgroundId,
      ethnicityId: p.ethnicityId,
      religionId: p.religionId,
      nationalityCountryId: p.nationalityCountryId,
      mobilePhone: p.mobilePhone,
      homePhone: p.homePhone,
      officePhone: p.officePhone,
      otherPhone: p.otherPhone,
      officeEmail: p.officeEmail,
      personalEmail: p.personalEmail,
      otherEmail: p.otherEmail,
      skype: p.skype,
      facebook: p.facebook,
      nativePlaceAddress: addrToForm(p.nativePlaceAddress),
      birthPlace: p.birthPlace,
      householdBookNumber: p.householdBookNumber,
      familyHouseholdCode: p.familyHouseholdCode,
      isHouseholdHead: p.isHouseholdHead,
      permanentResidenceAddress: addrToForm(p.permanentResidenceAddress),
      currentResidenceAddress: addrToForm(p.currentResidenceAddress),
      sameAsPermanentResidence: p.sameAsPermanentResidence,
      emergencyContactName: p.emergencyContactName,
      emergencyRelationId: p.emergencyRelationId,
      emergencyMobilePhone: p.emergencyMobilePhone,
      emergencyHomePhone: p.emergencyHomePhone,
      emergencyEmail: p.emergencyEmail,
      emergencyAddress: p.emergencyAddress,
      heightText: p.heightText,
      weightText: p.weightText,
      bloodGroupText: p.bloodGroupText,
      healthStatusText: p.healthStatusText,
    });
    setDirty(false);
  }, [personal.data, form]);

  const save = useMutation({
    mutationFn: (v: any) => {
      const body: UpdateEmployeePersonalInfoRequest = {
        identityNumber: v.identityNumber ?? null,
        identityIssueDate: toIsoDate(v.identityIssueDate),
        identityIssueProvinceId: v.identityIssueProvinceId ?? null,
        identityExpiryDate: toIsoDate(v.identityExpiryDate),
        passportNumber: v.passportNumber ?? null,
        passportIssueDate: toIsoDate(v.passportIssueDate),
        passportIssueProvinceId: v.passportIssueProvinceId ?? null,
        passportExpiryDate: toIsoDate(v.passportExpiryDate),
        partyCardNumber: v.partyCardNumber ?? null,
        partyJoinDate: toIsoDate(v.partyJoinDate),
        partyJoinPlace: v.partyJoinPlace ?? null,
        unionCardNumber: v.unionCardNumber ?? null,
        unionJoinDate: toIsoDate(v.unionJoinDate),
        unionJoinPlace: v.unionJoinPlace ?? null,
        generalEducationLevel: v.generalEducationLevel ?? null,
        educationLevelId: v.educationLevelId ?? null,
        educationPlaceId: v.educationPlaceId ?? null,
        educationFacultyId: v.educationFacultyId ?? null,
        educationMajorId: v.educationMajorId ?? null,
        graduationYear: v.graduationYear ?? null,
        degreeClassificationId: v.degreeClassificationId ?? null,
        maritalStatusId: v.maritalStatusId ?? null,
        familyBackgroundId: v.familyBackgroundId ?? null,
        personalBackgroundId: v.personalBackgroundId ?? null,
        ethnicityId: v.ethnicityId ?? null,
        religionId: v.religionId ?? null,
        nationalityCountryId: v.nationalityCountryId ?? null,
        mobilePhone: v.mobilePhone ?? null,
        homePhone: v.homePhone ?? null,
        officePhone: v.officePhone ?? null,
        otherPhone: v.otherPhone ?? null,
        officeEmail: v.officeEmail ?? null,
        personalEmail: v.personalEmail ?? null,
        otherEmail: v.otherEmail ?? null,
        skype: v.skype ?? null,
        facebook: v.facebook ?? null,
        nativePlaceAddress: formToAddr(v.nativePlaceAddress),
        birthPlace: v.birthPlace ?? null,
        householdBookNumber: v.householdBookNumber ?? null,
        familyHouseholdCode: v.familyHouseholdCode ?? null,
        isHouseholdHead: !!v.isHouseholdHead,
        permanentResidenceAddress: formToAddr(v.permanentResidenceAddress),
        currentResidenceAddress: formToAddr(v.currentResidenceAddress),
        sameAsPermanentResidence: !!v.sameAsPermanentResidence,
        emergencyContactName: v.emergencyContactName ?? null,
        emergencyRelationId: v.emergencyRelationId ?? null,
        emergencyMobilePhone: v.emergencyMobilePhone ?? null,
        emergencyHomePhone: v.emergencyHomePhone ?? null,
        emergencyEmail: v.emergencyEmail ?? null,
        emergencyAddress: v.emergencyAddress ?? null,
        heightText: v.heightText ?? null,
        weightText: v.weightText ?? null,
        bloodGroupText: v.bloodGroupText ?? null,
        healthStatusText: v.healthStatusText ?? null,
      };
      return employeeApi.updatePersonal(employeeId, body);
    },
    onSuccess: () => {
      message.success('Đã lưu thông tin cá nhân');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  // Expose actions cho footer ghim của Layout — canSave chỉ true khi user thực sự đổi
  useEffect(() => {
    onActionsChange?.({
      canSave: !!personal.data && !save.isPending && dirty,
      isSaving: save.isPending,
      dirty,
      submit: () => form.submit(),
    });
  }, [personal.data, save.isPending, form, onActionsChange, dirty]);

  if (personal.isLoading) return <Skeleton active />;
  if (personal.isError) {
    const err = personal.error as ApiError;
    return <Alert type="error" showIcon message="Không tải được Tab Thông tin cá nhân" description={err?.message ?? ''} />;
  }

  return (
    <Form form={form} name="employee-form-tab-2" layout="vertical" onFinish={(v) => save.mutate(v)}
      onValuesChange={(changed) => {
        setDirty(true);
        if (Object.prototype.hasOwnProperty.call(changed, 'sameAsPermanentResidence')) {
          const v = !!changed.sameAsPermanentResidence;
          setSameRes(v);
          if (v) {
            const perm = form.getFieldValue('permanentResidenceAddress');
            form.setFieldValue('currentResidenceAddress', { ...perm });
          }
        }
        if (sameRes && Object.keys(changed).some((k) => k === 'permanentResidenceAddress')) {
          form.setFieldValue('currentResidenceAddress', { ...changed.permanentResidenceAddress });
        }
      }}
    >
      <Card title="Chứng minh nhân dân / Thẻ căn cước" size="small" style={{ marginBottom: 12 }}>
        <Row gutter={16}>
          <Col span={8}><Form.Item label="Số CCCD/CMND" name="identityNumber"><Input maxLength={32} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Ngày cấp" name="identityIssueDate"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
          <Col span={8}><Form.Item label="Nơi cấp (Tỉnh/TP)" name="identityIssueProvinceId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(provinces.data?.items)} loading={provinces.isLoading} />
          </Form.Item></Col>
          <Col span={8}><Form.Item label="Ngày hết hạn" name="identityExpiryDate"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
        </Row>
      </Card>

      <Card title="Hộ chiếu" size="small" style={{ marginBottom: 12 }}>
        <Row gutter={16}>
          <Col span={8}><Form.Item label="Số hộ chiếu" name="passportNumber"><Input maxLength={32} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Ngày cấp" name="passportIssueDate"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
          <Col span={8}><Form.Item label="Nơi cấp (Tỉnh/TP)" name="passportIssueProvinceId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(provinces.data?.items)} loading={provinces.isLoading} />
          </Form.Item></Col>
          <Col span={8}><Form.Item label="Ngày hết hạn" name="passportExpiryDate"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
        </Row>
      </Card>

      <Card title="Thông tin Đảng viên" size="small" style={{ marginBottom: 12 }}>
        <Row gutter={16}>
          <Col span={8}><Form.Item label="Số thẻ Đảng" name="partyCardNumber"><Input maxLength={64} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Ngày kết nạp" name="partyJoinDate"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
          <Col span={8}><Form.Item label="Nơi kết nạp" name="partyJoinPlace"><Input maxLength={256} /></Form.Item></Col>
        </Row>
      </Card>

      <Card title="Thông tin Đoàn viên" size="small" style={{ marginBottom: 12 }}>
        <Row gutter={16}>
          <Col span={8}><Form.Item label="Số thẻ Đoàn" name="unionCardNumber"><Input maxLength={64} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Ngày kết nạp" name="unionJoinDate"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
          <Col span={8}><Form.Item label="Nơi kết nạp" name="unionJoinPlace"><Input maxLength={256} /></Form.Item></Col>
        </Row>
      </Card>

      <Card title="Trình độ" size="small" style={{ marginBottom: 12 }}>
        <Row gutter={16}>
          <Col span={8}><Form.Item label="Học vấn phổ thông" name="generalEducationLevel"><Input maxLength={64} placeholder="VD: 12/12" /></Form.Item></Col>
          <Col span={8}><Form.Item label="Trình độ học vấn" name="educationLevelId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(eduLevels.data?.items)} />
          </Form.Item></Col>
          <Col span={8}><Form.Item label="Năm tốt nghiệp" name="graduationYear">
            <InputNumber style={{ width: '100%' }} min={1900} max={2100} />
          </Form.Item></Col>
          <Col span={8}><Form.Item label="Nơi đào tạo" name="educationPlaceId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(eduPlaces.data?.items)} notFoundContent="Chưa có dữ liệu" />
          </Form.Item></Col>
          <Col span={8}><Form.Item label="Khoa" name="educationFacultyId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(eduFaculties.data?.items)} notFoundContent="Chưa có dữ liệu" />
          </Form.Item></Col>
          <Col span={8}><Form.Item label="Chuyên ngành" name="educationMajorId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(eduMajors.data?.items)} notFoundContent="Chưa có dữ liệu" />
          </Form.Item></Col>
          <Col span={8}><Form.Item label="Xếp loại bằng cấp" name="degreeClassificationId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(degreeRanks.data?.items)} />
          </Form.Item></Col>
        </Row>
      </Card>

      <Card title="Thành phần gia đình" size="small" style={{ marginBottom: 12 }}>
        <Row gutter={16}>
          <Col span={8}><Form.Item label="Tình trạng hôn nhân" name="maritalStatusId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(maritalStatuses.data?.items)} />
          </Form.Item></Col>
          <Col span={8}><Form.Item label="Thành phần gia đình" name="familyBackgroundId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(familyBgs.data?.items)} />
          </Form.Item></Col>
          <Col span={8}><Form.Item label="Thành phần bản thân" name="personalBackgroundId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(personalBgs.data?.items)} />
          </Form.Item></Col>
          <Col span={8}><Form.Item label="Dân tộc" name="ethnicityId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(ethnicities.data?.items)} />
          </Form.Item></Col>
          <Col span={8}><Form.Item label="Tôn giáo" name="religionId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(religions.data?.items)} />
          </Form.Item></Col>
          <Col span={8}><Form.Item label="Quốc tịch" name="nationalityCountryId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(countries.data?.items)} />
          </Form.Item></Col>
        </Row>
      </Card>

      <Card title="Thông tin liên hệ" size="small" style={{ marginBottom: 12 }}>
        <Row gutter={16}>
          <Col span={6}><Form.Item label="ĐTDĐ" name="mobilePhone"><Input maxLength={32} /></Form.Item></Col>
          <Col span={6}><Form.Item label="ĐT nhà riêng" name="homePhone"><Input maxLength={32} /></Form.Item></Col>
          <Col span={6}><Form.Item label="ĐT cơ quan" name="officePhone"><Input maxLength={32} /></Form.Item></Col>
          <Col span={6}><Form.Item label="ĐT khác" name="otherPhone"><Input maxLength={32} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Email cơ quan" name="officeEmail" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}><Input maxLength={256} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Email cá nhân" name="personalEmail" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}><Input maxLength={256} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Email khác" name="otherEmail" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}><Input maxLength={256} /></Form.Item></Col>
          <Col span={12}><Form.Item label="Skype" name="skype"><Input maxLength={128} /></Form.Item></Col>
          <Col span={12}><Form.Item label="Facebook" name="facebook"><Input maxLength={256} /></Form.Item></Col>
        </Row>
      </Card>

      <Card title="Nguyên quán" size="small" style={{ marginBottom: 12 }}>
        <AddressBlock name="nativePlaceAddress" />
        <Row gutter={16}>
          <Col span={8}><Form.Item label="Nơi sinh" name="birthPlace"><Input maxLength={256} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Số sổ hộ khẩu" name="householdBookNumber"><Input maxLength={64} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Mã hộ gia đình" name="familyHouseholdCode"><Input maxLength={64} /></Form.Item></Col>
          <Col span={8}><Form.Item label=" " name="isHouseholdHead" valuePropName="checked">
            <Checkbox>Là chủ hộ</Checkbox>
          </Form.Item></Col>
        </Row>
      </Card>

      <Card title="Hộ khẩu thường trú" size="small" style={{ marginBottom: 12 }}>
        <AddressBlock name="permanentResidenceAddress" />
      </Card>

      <Card title="Chỗ ở hiện nay" size="small" style={{ marginBottom: 12 }}
        extra={(
          <Form.Item name="sameAsPermanentResidence" valuePropName="checked" noStyle>
            <Checkbox>Giống hộ khẩu thường trú</Checkbox>
          </Form.Item>
        )}
      >
        <AddressBlock name="currentResidenceAddress" disabled={sameRes} />
      </Card>

      <Card title="Liên hệ khẩn cấp" size="small" style={{ marginBottom: 12 }}>
        <Row gutter={16}>
          <Col span={8}><Form.Item label="Họ tên" name="emergencyContactName"><Input maxLength={128} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Quan hệ" name="emergencyRelationId">
            <Select allowClear showSearch optionFilterProp="label" options={lkOpts(familyRelations.data?.items)} />
          </Form.Item></Col>
          <Col span={8}><Form.Item label="ĐTDĐ" name="emergencyMobilePhone"><Input maxLength={32} /></Form.Item></Col>
          <Col span={8}><Form.Item label="ĐT nhà riêng" name="emergencyHomePhone"><Input maxLength={32} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Email" name="emergencyEmail" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}><Input maxLength={256} /></Form.Item></Col>
          <Col span={24}><Form.Item label="Địa chỉ" name="emergencyAddress"><Input maxLength={512} /></Form.Item></Col>
        </Row>
      </Card>

      <Card title="Thông tin sức khỏe" size="small" style={{ marginBottom: 12 }}>
        <Row gutter={16}>
          <Col span={6}><Form.Item label="Chiều cao" name="heightText"><Input maxLength={32} placeholder="VD: 170 cm" /></Form.Item></Col>
          <Col span={6}><Form.Item label="Cân nặng" name="weightText"><Input maxLength={32} placeholder="VD: 60 kg" /></Form.Item></Col>
          <Col span={6}><Form.Item label="Nhóm máu" name="bloodGroupText"><Input maxLength={16} placeholder="VD: A" /></Form.Item></Col>
          <Col span={24}><Form.Item label="Tình trạng sức khỏe" name="healthStatusText"><Input.TextArea rows={2} maxLength={512} /></Form.Item></Col>
        </Row>
      </Card>
    </Form>
  );
}

function addrToForm(a: any): any {
  return a ? {
    countryId: a.countryId, provinceId: a.provinceId,
    districtId: a.districtId, wardId: a.wardId, addressLine: a.addressLine,
  } : {};
}

function formToAddr(v: any): EmployeeAddressInput | null {
  if (!v) return null;
  if (!v.countryId && !v.provinceId && !v.districtId && !v.wardId && !v.addressLine) return null;
  return {
    countryId: v.countryId ?? null,
    provinceId: v.provinceId ?? null,
    districtId: v.districtId ?? null,
    wardId: v.wardId ?? null,
    addressLine: v.addressLine ?? null,
  };
}
