import type { Service, ServiceFieldDef } from './types';

export const categoriesSeed = [
  { id: 'cat-frp', slug: 'frp', name: 'FRP (Desbloqueio de Conta)', icon: 'shield', color: '#00ff66' },
  { id: 'cat-imei', slug: 'imei', name: 'Reparo de IMEI', icon: 'chip', color: '#22d3ee' },
  { id: 'cat-ativacoes', slug: 'ativacoes', name: 'Ativações', icon: 'bolt', color: '#facc15' },
  { id: 'cat-mdm', slug: 'mdm', name: 'MDM / Gerenciamento', icon: 'lock', color: '#f472b6' },
  { id: 'cat-unlock', slug: 'unlock', name: 'Desbloqueio de Operadora', icon: 'unlock', color: '#a78bfa' },
  { id: 'cat-desbloqueios', slug: 'desbloqueios', name: 'Outros Desbloqueios', icon: 'wrench', color: '#fb923c' },
  { id: 'cat-remote', slug: 'remote', name: 'Aluguel de Ferramentas', icon: 'wrench', color: '#00ff66' },
];

export const servicesSeed = [
  { id: 'srv-1', categoryId: 'cat-frp', slug: 'samsung-frp-remocao-de-conta-google', name: 'Samsung FRP (Remoção de Conta Google)', description: 'Remoção de conta Google via servidor. Suporta modelos 2016+ (A, S, Note, M).', price: 12.9, deliveryTime: 'Instantâneo', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-2', categoryId: 'cat-frp', slug: 'xiaomi-frp-mi-cloud', name: 'Xiaomi FRP / MI Cloud', description: 'Remoção de conta MI e Mi Cloud para Redmi, POCO e Xiaomi.', price: 9.9, deliveryTime: 'Instantâneo', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-3', categoryId: 'cat-frp', slug: 'motorola-frp', name: 'Motorola FRP', description: 'Remoção de FRP para Motorola sem necessidade de flashear.', price: 14.9, deliveryTime: 'Instantâneo', provider: 'auto', productUuid: '4697', apiField: 'SERIAL NUMBER' },
  { id: 'srv-4', categoryId: 'cat-frp', slug: 'lg-frp', name: 'LG FRP', description: 'Remoção de conta Google para aparelhos LG.', price: 11.9, deliveryTime: 'Até 5 min', provider: 'auto', productUuid: '1360', apiField: 'IMEI' },
  { id: 'srv-5', categoryId: 'cat-frp', slug: 'apple-frp-icloud-remocao', name: 'Apple FRP (iCloud - Remoção)', description: 'Remoção de iCloud vinculado. Suporta iPhone e iPad.', price: 59.9, deliveryTime: 'Até 24h', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-6', categoryId: 'cat-imei', slug: 'reparo-de-imei-samsung', name: 'Reparo de IMEI Samsung', description: 'Correção de IMEI em aparelhos Samsung (certificado).', price: 25, deliveryTime: 'Até 30 min', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-7', categoryId: 'cat-imei', slug: 'reparo-de-imei-xiaomi', name: 'Reparo de IMEI Xiaomi', description: 'Correção de IMEI para Xiaomi, Redmi e POCO.', price: 25, deliveryTime: 'Até 30 min', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-8', categoryId: 'cat-imei', slug: 'alteracao-de-imei-motorola', name: 'Alteração de IMEI Motorola', description: 'Alteração de IMEI para aparelhos Motorola com bootloader liberado.', price: 30, deliveryTime: 'Até 1h', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-9', categoryId: 'cat-ativacoes', slug: 'ativacao-ios-qualquer-versao', name: 'Ativação iOS (Qualquer versão)', description: 'Ativação do aparelho sem Apple ID, qualquer versão do iOS.', price: 35, deliveryTime: 'Até 2h', provider: 'auto', productUuid: '3128', apiField: 'Serial' },
  { id: 'srv-10', categoryId: 'cat-mdm', slug: 'remocao-mdm-iphone', name: 'Remoção MDM iPhone', description: 'Remoção de gerenciamento corporativo (MDM) para iPhones.', price: 49.9, deliveryTime: 'Até 24h', provider: 'auto', productUuid: '226', apiField: 'Serial' },
  { id: 'srv-11', categoryId: 'cat-mdm', slug: 'remocao-mdm-android-zero-touch-dpc', name: 'Remoção MDM Android (Zero Touch / DPC)', description: 'Remoção de inscrição em enterprise mobility para Android.', price: 22.9, deliveryTime: 'Até 1h', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-12', categoryId: 'cat-unlock', slug: 'desbloqueio-de-operadora-simlock-iphone', name: 'Desbloqueio de Operadora (Simlock) iPhone', description: 'Desbloqueio permanente de operadora via base de dados oficial.', price: 39.9, deliveryTime: 'Instantâneo', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-13', categoryId: 'cat-unlock', slug: 'desbloqueio-de-operadora-simlock-samsung', name: 'Desbloqueio de Operadora (Simlock) Samsung', description: 'Desbloqueio de simlock para aparelhos Samsung.', price: 29.9, deliveryTime: 'Até 30 min', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-14', categoryId: 'cat-desbloqueios', slug: 'desbloqueio-de-conta-google-tela-bloqueada', name: 'Desbloqueio de Conta Google (Tela bloqueada)', description: 'Remoção de conta Google da tela de bloqueio (lock screen), sem perder dados.', price: 15.9, deliveryTime: 'Até 15 min', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-15', categoryId: 'cat-desbloqueios', slug: 'desbloqueio-de-padrao-pin', name: 'Desbloqueio de Padrão / PIN', description: 'Remoção de padrão, PIN ou senha de bloqueio em Android.', price: 18.9, deliveryTime: 'Até 15 min', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-16', categoryId: 'cat-desbloqueios', slug: 'remocao-de-frp-via-emergency-account', name: 'Remoção de FRP via EMERGENCY ACCOUNT', description: 'Remoção de conta Google via conta emergencial para modelos selecionados.', price: 8.9, deliveryTime: 'Instantâneo', provider: 'manual', productUuid: null, apiField: null },
];

export const marcas = ['Samsung', 'Xiaomi', 'Motorola', 'Apple', 'LG', 'POCO', 'Redmi', 'Asus', 'Nokia', 'Realme', 'Huawei', 'Oppo'];
export const pagamentos = ['PIX', 'Cartão', 'Cripto', 'Boleto'];

const uvId: ServiceFieldDef = { key: 'UltraViewer ID', label: 'UltraViewer ID', required: true };
const uvFull: ServiceFieldDef[] = [
  { key: 'UltraViewer ID', label: 'UltraViewer ID', required: true },
  { key: 'UltraViewer Password', label: 'UltraViewer Password', required: true },
];

const remoteOverrides: Record<string, Pick<Service, 'provider' | 'productUuid' | 'apiField' | 'apiExtra'>> = {
  'remote-3': { provider: 'auto', productUuid: '2216', apiField: 'Quantity', apiExtra: null },
  'remote-4': { provider: 'auto', productUuid: '2216', apiField: 'Quantity', apiExtra: null },
  'remote-5': { provider: 'auto', productUuid: '2211', apiField: 'Quantity', apiExtra: null },
  'remote-6': { provider: 'auto', productUuid: '2189', apiField: 'Quantity', apiExtra: uvFull },
  'remote-7': { provider: 'auto', productUuid: '2998', apiField: 'Quantity', apiExtra: null },
  'remote-8': { provider: 'auto', productUuid: '2333', apiField: 'Quantity', apiExtra: null },
  'remote-9': { provider: 'auto', productUuid: '2194', apiField: 'Quantity', apiExtra: null },
  'remote-12': { provider: 'auto', productUuid: '2215', apiField: 'Quantity', apiExtra: uvFull },
  'remote-13': { provider: 'auto', productUuid: '2214', apiField: 'Quantity', apiExtra: null },
  'remote-14': { provider: 'auto', productUuid: '2209', apiField: 'Quantity', apiExtra: null },
  'remote-25': { provider: 'auto', productUuid: '2182', apiField: 'Quantity', apiExtra: null },
  'remote-26': { provider: 'auto', productUuid: '2212', apiField: 'Quantity', apiExtra: null },
  'remote-30': { provider: 'auto', productUuid: '2211', apiField: 'Quantity', apiExtra: null },
  'remote-37': { provider: 'auto', productUuid: '2210', apiField: 'Quantity', apiExtra: null },
  'remote-39': { provider: 'auto', productUuid: '2203', apiField: 'Quantity', apiExtra: null },
  'remote-40': { provider: 'auto', productUuid: '2202', apiField: 'Quantity', apiExtra: null },
  'remote-41': { provider: 'auto', productUuid: '2205', apiField: 'Quantity', apiExtra: null },
  'remote-45': { provider: 'auto', productUuid: '2187', apiField: 'Quantity', apiExtra: [uvId] },
  'remote-52': { provider: 'auto', productUuid: '2185', apiField: 'Quantity', apiExtra: [uvId] },
  'remote-53': { provider: 'auto', productUuid: '2185', apiField: 'Quantity', apiExtra: [uvId] },
  'remote-54': { provider: 'auto', productUuid: '2200', apiField: 'Quantity', apiExtra: null },
  'remote-55': { provider: 'auto', productUuid: '2196', apiField: 'Quantity', apiExtra: null },
  'remote-58': { provider: 'auto', productUuid: '2183', apiField: 'Quantity', apiExtra: uvFull },
};

export const remoteServicesSeed: Service[] =
  (
    [
      ['remote-1', 'Motorola Moto FRP Unlock Fastboot Mode Instant MTK Only', 8.9, 'Minutes'],
      ['remote-2', 'Xiaomi FRP REMOVE INSTANT BY USB ASSISTANT MODE', 4.4, 'Miniutes'],
      ['remote-3', 'AMT Android Multi Tool RENT (2H) Instant S2', 0.39, 'Instant'],
      ['remote-4', 'AMT Android Multi Tool RENT 2H Instant', 0.49, 'Instant'],
      ['remote-5', 'Dft Pro Tool Rent 48 hours Instant', 1.99, 'Instant'],
      ['remote-6', 'EFT Pro Tool 6 Hour Rent instant', 3, 'Minutes'],
      ['remote-7', 'TSM Tool Pro Rent 3 hours Instant', 0.94, 'Instant'],
      ['remote-8', 'Unlock Tool RENT (6H) Instant S2 (Limited 70 Account)', 0.54, 'Instant'],
      ['remote-9', 'Unlock Tool Rent Instant 6 Hour', 0.51, 'Instant'],
      ['remote-10', 'Z3X SamsTool Online Rent 1Month (Pre Login)', 25, '1-30 Miniutes'],
      ['remote-11', 'Rent Service Problem Submit', 0, '1-10 Miniutes'],
      ['remote-12', 'AndroidWinTool (AWT) Rent [48 Hours]', 2.1, 'Instant'],
      ['remote-13', 'AnonySHU Rent [12 Hours]', 3, 'Instant'],
      ['remote-14', 'Griffin-Unlocker-Tool (Premium Account) Tool RENT [6 Hours]', 3, 'Instant'],
      ['remote-15', '(Filewale.com) Firmware Request', 1.1, 'Miniutes'],
      ['remote-16', '(givemerom.com) (1MB to 1GB) GiveMeROM Firmware Request', 0.9, '1 hour'],
      ['remote-17', '(hello-firmware.com) Firmware Request Here', 1.8, '10-30 Miniutes'],
      ['remote-18', '(Support.halabtech.com) 13GB to 30GB Halabtech Firmware Request', 4.5, '3-6 Hour'],
      ['remote-19', '(Support.halabtech.com) 1MB to 1GB Halabtech Firmware Request', 0.9, '1-30 Minute'],
      ['remote-20', '(Support.halabtech.com) 2GB to 3GB Halabtech Firmware Request', 1.4, '1-3 Hour'],
      ['remote-21', '(Support.halabtech.com) 3GB to 4GB Halabtech Firmware Request', 2, '1-3 Hour'],
      ['remote-22', '(Support.halabtech.com) 5GB to 9GB Halabtech Firmware Request', 2.5, '3-6 Hour'],
      ['remote-23', '(Support.halabtech.com) 9GB to13GB Halabtech Firmware Request', 2.9, '3-6 Hour'],
      ['remote-24', 'APIZU MDM TOOL PRO Rent (Time: 4 Hours)', 2, 'Miniutes'],
      ['remote-25', 'CellTool/SamsungTool.us Samsung Tool Rent 12 Hours', 2.9, 'Instant'],
      ['remote-26', 'CF Tools Rent Instant [6 Hours]', 0.78, 'Instant'],
      ['remote-27', 'CHEETAH TOOL RENT [25 Days] instant', 9, 'Instant'],
      ['remote-28', 'CM2 Dongle Rent (New Version) [1 Hour]', 2.3, '1-10 Minutes'],
      ['remote-29', 'CM2 Dongle Rent (New Version) [1 Hour] Premium', 2.8, '1-10 Minutes'],
      ['remote-30', 'Dft Pro Tool Rent [45 hours] Instant S2', 2.1, 'Instant'],
      ['remote-31', 'File Password Only (HALABTECH)', 0.3, '1-30 Minute'],
      ['remote-32', 'GivemeROM File Request (13GB to 30GB) Firmware Request', 4, '3-6 Hour'],
      ['remote-33', 'GivemeROM File Request (2GB to 3GB) Firmware Request', 1.4, '1-3 Hour'],
      ['remote-34', 'GivemeROM File Request (5GB to 9GB) Firmware Request', 2.5, '3-6 hour'],
      ['remote-35', 'GivemeROM File Request (9GB to 13GB) Firmware Request', 2.4, '3-6 Hour'],
      ['remote-36', 'GivemeROM File Request 3GB to 4GB Firmware Request', 2, '1-3 Hour'],
      ['remote-37', 'Griffin-Unlocker Tool RENT instant [6 Hours]', 1.8, 'Instant'],
      ['remote-38', 'HSPro Tool Access Rent For 6 Hours (Temporarily Login - No Refundable)', 3.5, 'Miniutes'],
      ['remote-39', 'Kg Killer Tool Rent [4 Hours] Instant', 0.99, 'Instant'],
      ['remote-40', 'MDM Fix Tool Rent 6 Hour Instant', 1.69, 'Instant'],
      ['remote-41', 'Mst [MobileSea Sevice Tool] Instant [6 hours]', 0.49, 'Instant'],
      ['remote-42', 'MultiUnlock Tool Access Rent For 12 Hours (Login By AnyDesk)', 2, 'Instant'],
      ['remote-43', 'Octoplus Box - FRP Tool Rent (1 Hour)', 2.3, '1-10 Minutes'],
      ['remote-44', 'Octoplus Box - Huawei Tool Rent (1 Hour)', 2.5, '1-10 Miniutes'],
      ['remote-45', 'Octoplus Box - LG Tool Rent (1 Hour)', 2.3, '1-10 Minutes'],
      ['remote-46', 'Octoplus Box - Samsung Tool (Exynos Cup) Rent (1 Hour)', 2.3, '1-10 Minutes'],
      ['remote-47', 'Pandora Tool { Digital } Login (Rent 48 Hours)', 10, '1-30 Miniutes'],
      ['remote-48', 'Pandora Tool { Digital } Login Rent 1 month', 20, 'Miniutes'],
      ['remote-49', 'Pandora Tool { Digital } Login Rent 2 months 60 days', 28, 'Miniutes'],
      ['remote-50', 'Relogin Your, OCTOPLUS, SIGMA Within 1 Hour After Ordering', 0, '1-10 Min'],
      ['remote-51', 'RTC Tool Rent 6 Hour Instant', 2, 'Instant'],
      ['remote-52', 'SIGMA PLUS 1 Hour Rent', 3.2, '1-10 Minutes'],
      ['remote-53', 'Sigma Plus Rent [1 Hours]', 2, '1-10 Minutes'],
      ['remote-54', 'Tfm Tool Rent [3 hours] Instant', 0.69, 'Instant'],
      ['remote-55', 'TR Tools Pro Rent Instant 24 Hour', 3.3, 'Instant'],
      ['remote-56', 'UnlockTool Rent (Login + Password) 12 Hours', 0.89, 'Instant'],
      ['remote-57', 'UnlockTool Rent (Login + Password) 24 Hours', 1.19, 'Instant'],
      ['remote-58', 'Z3X Samsung Tool Pro Rent (Box) 1 Hours', 2.5, '1-30 Miniutes'],
      ['remote-59', 'SmartTool Pro Access Rent For 10 Hours (Direct Source)', 3, 'Instant'],
    ] as const
  ).map(([id, name, price, deliveryTime]) => {
    const over = remoteOverrides[id];
    return {
      id,
      slug: `aluguel-${id.split('-')[1]}`,
      categoryId: 'cat-remote',
      name,
      description:
        over?.provider === 'auto'
          ? 'Acesso remoto à ferramenta com entrega automática de credenciais no pedido.'
          : 'Serviço remoto executado por nossa equipe. Você recebe o resultado no seu pedido.',
      price,
      deliveryTime,
      isActive: true,
      provider: 'manual',
      productUuid: null,
      apiField: null,
      apiExtra: null,
      ...over,
    } satisfies Service;
  })
;