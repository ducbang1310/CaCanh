// API v2 — cấu trúc 2 cấp sau sáp nhập 07/2025: Tỉnh → Xã/Phường (không có Quận/Huyện)
const API_BASE = 'https://provinces.open-api.vn/api/v2'

export const addressService = {
  // Lấy danh sách 34 tỉnh/thành phố mới
  getProvinces: async () => {
    const res = await fetch(`${API_BASE}/p/`)
    if (!res.ok) throw new Error('Không thể tải danh sách tỉnh')
    return res.json()  // [{ code, name, codename, division_type, ... }]
  },

  // Lấy xã/phường trực thuộc tỉnh (v2: tỉnh → xã, không qua huyện)
  getWards: async (provinceCode) => {
    const res = await fetch(`${API_BASE}/p/${provinceCode}?depth=2`)
    if (!res.ok) throw new Error('Không thể tải danh sách xã/phường')
    const data = await res.json()
    // v2 trả về province.wards[] trực tiếp (không qua districts)
    return (data.wards || []).map(w => ({
      code: w.code,
      name: w.name
    }))
  }
}