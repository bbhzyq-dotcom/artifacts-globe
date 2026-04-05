import fs from 'fs';

const countries = [
  { code: 'CN', name: '中国', lat: 35.8617, lng: 104.1954, count: 330 },
  { code: 'EG', name: '埃及', lat: 26.8206, lng: 30.8025, count: 120 },
  { code: 'GR', name: '希腊', lat: 37.9715, lng: 23.7267, count: 85 },
  { code: 'IT', name: '意大利', lat: 41.9028, lng: 12.4964, count: 95 },
  { code: 'IN', name: '印度', lat: 20.5937, lng: 78.9629, count: 150 },
  { code: 'IQ', name: '伊拉克', lat: 33.3152, lng: 44.3661, count: 80 },
  { code: 'IR', name: '伊朗', lat: 35.6892, lng: 51.3890, count: 75 },
  { code: 'JP', name: '日本', lat: 35.6762, lng: 139.6503, count: 120 },
  { code: 'MX', name: '墨西哥', lat: 19.4326, lng: -99.1332, count: 95 },
  { code: 'PE', name: '秘鲁', lat: -13.5319, lng: -71.9675, count: 85 },
  { code: 'NG', name: '尼日利亚', lat: 6.4654, lng: 3.5752, count: 70 },
  { code: 'TR', name: '土耳其', lat: 41.0082, lng: 28.9784, count: 90 },
  { code: 'GB', name: '英国', lat: 51.5074, lng: -0.1278, count: 80 },
  { code: 'FR', name: '法国', lat: 48.8566, lng: 2.3522, count: 75 },
  { code: 'DE', name: '德国', lat: 52.5200, lng: 13.4050, count: 70 },
  { code: 'ES', name: '西班牙', lat: 40.4168, lng: -3.7038, count: 65 },
  { code: 'NL', name: '荷兰', lat: 52.3676, lng: 4.9041, count: 55 },
  { code: 'PT', name: '葡萄牙', lat: 38.7223, lng: -9.1393, count: 45 },
  { code: 'BE', name: '比利时', lat: 50.8503, lng: 4.3517, count: 35 },
  { code: 'CH', name: '瑞士', lat: 46.9480, lng: 7.4474, count: 30 },
  { code: 'AT', name: '奥地利', lat: 48.2082, lng: 16.3738, count: 35 },
  { code: 'PL', name: '波兰', lat: 52.2297, lng: 21.0122, count: 40 },
  { code: 'CZ', name: '捷克', lat: 50.0755, lng: 14.4378, count: 25 },
  { code: 'HU', name: '匈牙利', lat: 47.4979, lng: 19.0402, count: 25 },
  { code: 'RU', name: '俄罗斯', lat: 55.7558, lng: 37.6173, count: 60 },
  { code: 'UA', name: '乌克兰', lat: 50.4501, lng: 30.5234, count: 35 },
  { code: 'SE', name: '瑞典', lat: 59.3293, lng: 18.0686, count: 25 },
  { code: 'NO', name: '挪威', lat: 59.9139, lng: 10.7522, count: 20 },
  { code: 'DK', name: '丹麦', lat: 55.6761, lng: 12.5683, count: 22 },
  { code: 'FI', name: '芬兰', lat: 60.1699, lng: 24.9384, count: 18 },
  { code: 'IE', name: '爱尔兰', lat: 53.3498, lng: -6.2603, count: 20 },
  { code: 'US', name: '美国', lat: 38.9072, lng: -77.0369, count: 50 },
  { code: 'CA', name: '加拿大', lat: 45.4215, lng: -75.6972, count: 35 },
  { code: 'BR', name: '巴西', lat: -15.7975, lng: -47.8919, count: 55 },
  { code: 'AR', name: '阿根廷', lat: -34.6037, lng: -58.3816, count: 40 },
  { code: 'CL', name: '智利', lat: -33.4489, lng: -70.6693, count: 25 },
  { code: 'CO', name: '哥伦比亚', lat: 4.7110, lng: -74.0721, count: 30 },
  { code: 'CU', name: '古巴', lat: 23.1136, lng: -82.3666, count: 20 },
  { code: 'GT', name: '危地马拉', lat: 14.5586, lng: -90.7295, count: 18 },
  { code: 'PA', name: '巴拿马', lat: 8.9824, lng: -79.5199, count: 15 },
  { code: 'CR', name: '哥斯达黎加', lat: 9.7489, lng: -83.7534, count: 12 },
  { code: 'EC', name: '厄瓜多尔', lat: -0.1807, lng: -78.4678, count: 15 },
  { code: 'BO', name: '玻利维亚', lat: -16.5000, lng: -68.1500, count: 12 },
  { code: 'KH', name: '柬埔寨', lat: 13.4125, lng: 103.8670, count: 45 },
  { code: 'TH', name: '泰国', lat: 13.7563, lng: 100.5018, count: 50 },
  { code: 'VN', name: '越南', lat: 21.0285, lng: 105.8542, count: 40 },
  { code: 'LA', name: '老挝', lat: 17.9757, lng: 102.6331, count: 20 },
  { code: 'MM', name: '缅甸', lat: 19.7633, lng: 96.0785, count: 35 },
  { code: 'ID', name: '印度尼西亚', lat: -6.2088, lng: 106.8456, count: 55 },
  { code: 'PH', name: '菲律宾', lat: 14.5995, lng: 120.9842, count: 30 },
  { code: 'MY', name: '马来西亚', lat: 3.1390, lng: 101.6869, count: 25 },
  { code: 'SG', name: '新加坡', lat: 1.3521, lng: 103.8198, count: 15 },
  { code: 'BN', name: '文莱', lat: 4.9031, lng: 114.9398, count: 8 },
  { code: 'NP', name: '尼泊尔', lat: 27.7172, lng: 85.3244, count: 35 },
  { code: 'BT', name: '不丹', lat: 27.5141, lng: 89.6722, count: 10 },
  { code: 'LK', name: '斯里兰卡', lat: 7.8731, lng: 80.7718, count: 25 },
  { code: 'MV', name: '马尔代夫', lat: 3.2028, lng: 73.2207, count: 8 },
  { code: 'BD', name: '孟加拉国', lat: 23.8103, lng: 90.4125, count: 20 },
  { code: 'PK', name: '巴基斯坦', lat: 33.6844, lng: 73.0479, count: 40 },
  { code: 'AF', name: '阿富汗', lat: 34.3500, lng: 70.5000, count: 25 },
  { code: 'TM', name: '土库曼斯坦', lat: 37.9601, lng: 58.3266, count: 12 },
  { code: 'UZ', name: '乌兹别克斯坦', lat: 40.1000, lng: 67.0000, count: 15 },
  { code: 'KZ', name: '哈萨克斯坦', lat: 51.1694, lng: 71.4491, count: 12 },
  { code: 'KG', name: '吉尔吉斯斯坦', lat: 40.0691, lng: 74.4857, count: 8 },
  { code: 'TJ', name: '塔吉克斯坦', lat: 38.8610, lng: 71.0930, count: 8 },
  { code: 'MN', name: '蒙古', lat: 47.8864, lng: 106.9057, count: 15 },
  { code: 'KP', name: '朝鲜', lat: 39.0392, lng: 125.7625, count: 12 },
  { code: 'KR', name: '韩国', lat: 35.9078, lng: 127.7669, count: 45 },
  { code: 'AM', name: '亚美尼亚', lat: 40.1792, lng: 44.4995, count: 18 },
  { code: 'GE', name: '格鲁吉亚', lat: 41.7151, lng: 44.8271, count: 15 },
  { code: 'AZ', name: '阿塞拜疆', lat: 40.4093, lng: 49.8671, count: 12 },
  { code: 'SY', name: '叙利亚', lat: 33.5138, lng: 36.2765, count: 25 },
  { code: 'LB', name: '黎巴嫩', lat: 33.8886, lng: 35.4955, count: 20 },
  { code: 'JO', name: '约旦', lat: 30.3285, lng: 35.4444, count: 25 },
  { code: 'IL', name: '以色列', lat: 31.7683, lng: 35.2137, count: 35 },
  { code: 'PS', name: '巴勒斯坦', lat: 31.9522, lng: 35.2332, count: 15 },
  { code: 'YE', name: '也门', lat: 15.3694, lng: 44.1910, count: 20 },
  { code: 'SA', name: '沙特阿拉伯', lat: 23.8859, lng: 45.0792, count: 18 },
  { code: 'AE', name: '阿联酋', lat: 24.4539, lng: 54.3773, count: 10 },
  { code: 'OM', name: '阿曼', lat: 21.4735, lng: 55.9754, count: 8 },
  { code: 'KW', name: '科威特', lat: 29.3759, lng: 47.9774, count: 6 },
  { code: 'QA', name: '卡塔尔', lat: 25.3548, lng: 51.1839, count: 5 },
  { code: 'BH', name: '巴林', lat: 26.0667, lng: 50.5577, count: 5 },
  { code: 'SD', name: '苏丹', lat: 15.5007, lng: 32.5599, count: 15 },
  { code: 'ET', name: '埃塞俄比亚', lat: 9.1450, lng: 40.4897, count: 20 },
  { code: 'KE', name: '肯尼亚', lat: -1.2921, lng: 36.8219, count: 18 },
  { code: 'TZ', name: '坦桑尼亚', lat: -6.7924, lng: 39.2083, count: 12 },
  { code: 'GH', name: '加纳', lat: 6.5247, lng: -1.6295, count: 15 },
  { code: 'SN', name: '塞内加尔', lat: 14.7167, lng: -17.4677, count: 10 },
  { code: 'MG', name: '马达加斯加', lat: -18.8792, lng: 47.5079, count: 8 },
  { code: 'ZW', name: '津巴布韦', lat: -17.8252, lng: 31.0335, count: 8 },
  { code: 'MZ', name: '莫桑比克', lat: -25.9655, lng: 32.5832, count: 6 },
  { code: 'AO', name: '安哥拉', lat: -8.8390, lng: 13.2894, count: 6 },
  { code: 'ZA', name: '南非', lat: -25.7479, lng: 28.2293, count: 20 },
  { code: 'MA', name: '摩洛哥', lat: 31.7917, lng: -7.0926, count: 25 },
  { code: 'DZ', name: '阿尔及利亚', lat: 28.0339, lng: 1.6596, count: 15 },
  { code: 'TN', name: '突尼斯', lat: 33.8869, lng: 9.5375, count: 18 },
  { code: 'LY', name: '利比亚', lat: 26.3351, lng: 17.2283, count: 10 },
  { code: 'CY', name: '塞浦路斯', lat: 35.1264, lng: 33.4299, count: 15 },
];

const categories = [
  '青铜器', '瓷器', '陶器', '玉器', '金银器', '石雕', '木雕', '牙雕', '书画',
  '壁画', '纺织', '玻璃器', '印章', '钱币', '文献', '佛教器物', '金属器',
  '甲胄', '武器', '漆器', '乐器', '钟表', '珐琅', '装饰', '马赛克'
];

const artifactPrefixes = [
  '青铜', '白玉', '碧玉', '金制', '银制', '鎏金', '鎏银', '青花', '釉下彩',
  '釉上彩', '粉彩', '斗彩', '单色釉', '窑变', '冰裂', '铁锈花', '釉里红',
  '红陶', '灰陶', '黑陶', '彩陶', '白陶', '紫砂', '建窑', '吉州窑',
  '龙泉窑', '景德镇', '德化窑', '石湾窑', '耀州窑', '汝窑', '官窑', '哥窑',
  '定窑', '钧窑', '邢窑', '越窑', '瓯窑', '婺州窑', '寿州窑', '洪州窑'
];

const artifactSuffixes = [
  '鼎', '簋', '爵', '斝', '罍', '尊', '壶', '瓶', '罐', '盘', '碗', '杯',
  '盏', '碟', '盆', '盒', '炉', '熏', '灯', '觚', '觥', '甑', '鬲',
  '佛像', '菩萨像', '弟子像', '天王像', '供养人像', '说法图', '经变图',
  '壁画残片', '石刻', '玉璧', '玉琮', '玉璜', '玉玦', '玉环', '玉牌',
  '带钩', '剑', '刀', '矛', '戈', '戟', '钺', '斧', '凿', '锯', '锛',
  '编钟', '甬钟', '钮钟', '镈', '铃', '鼓', '琴', '瑟', '琵琶', '筝',
  '锦', '帛', '纱', '绢', '绮', '绫', '罗', '绣', '毯', '帷幔'
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateArtifactName() {
  return randomChoice(artifactPrefixes) + randomChoice(artifactSuffixes);
}

function generateArtifact(id, country, baseYear) {
  const year = baseYear + randomInt(-15, 15);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  
  const latOffset = (Math.random() - 0.5) * 5;
  const lngOffset = (Math.random() - 0.5) * 5;
  
  return {
    id: `artifact-${id}`,
    name: generateArtifactName(),
    nameEn: `Artifact ${id}`,
    country: country.name,
    countryCode: country.code,
    latitude: country.lat + latOffset,
    longitude: country.lng + lngOffset,
    acquisitionDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    acquisitionYear: year,
    category: randomChoice(categories),
    description: `${country.name}出土的历史文物，具有重要的文化价值和艺术价值。`
  };
}

function generateArtifacts() {
  const artifacts = [];
  let id = 1;
  const baseYear = 1800;
  
  for (const country of countries) {
    for (let i = 0; i < country.count; i++) {
      artifacts.push(generateArtifact(id++, country, baseYear));
    }
  }
  
  return artifacts.sort((a, b) => a.acquisitionYear - b.acquisitionYear);
}

const artifacts = generateArtifacts();
const total = artifacts.length;

console.log(`Generated ${total} artifacts from ${countries.length} countries`);
console.log(`Top 5 countries by count:`);
countries.slice(0, 5).forEach(c => console.log(`  ${c.name}: ${c.count}`));
console.log(`Total: ${total} artifacts`);

fs.writeFileSync('src/data/artifacts.json', JSON.stringify(artifacts, null, 2));
console.log('Data written to src/data/artifacts.json');
