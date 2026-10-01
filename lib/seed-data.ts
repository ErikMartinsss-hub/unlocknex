import type { DownloadItem, Service, ServiceFieldDef } from './types';

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
  { id: 'srv-1', categoryId: 'cat-frp', slug: 'samsung-frp-remocao-de-conta-google', name: 'Samsung FRP (Remoção de Conta Google)', description: 'Remoção de conta Google via servidor. Suporta modelos 2016+ (A, S, Note, M).', price: 77.4, deliveryTime: 'Instantâneo', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-2', categoryId: 'cat-frp', slug: 'xiaomi-frp-mi-cloud', name: 'Xiaomi FRP / MI Cloud', description: 'Remoção de conta MI e Mi Cloud para Redmi, POCO e Xiaomi.', price: 59.4, deliveryTime: 'Instantâneo', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-3', categoryId: 'cat-frp', slug: 'motorola-frp', name: 'Motorola FRP', description: 'Remoção de FRP para Motorola sem necessidade de flashear.', price: 89.4, deliveryTime: 'Instantâneo', provider: 'auto', productUuid: '4697', apiField: 'SERIAL NUMBER' },
  { id: 'srv-4', categoryId: 'cat-frp', slug: 'lg-frp', name: 'LG FRP', description: 'Remoção de conta Google para aparelhos LG.', price: 71.4, deliveryTime: 'Até 5 min', provider: 'auto', productUuid: '1360', apiField: 'IMEI' },
  { id: 'srv-5', categoryId: 'cat-frp', slug: 'apple-frp-icloud-remocao', name: 'Apple FRP (iCloud - Remoção)', description: 'Remoção de iCloud vinculado. Suporta iPhone e iPad.', price: 359.4, deliveryTime: 'Até 24h', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-6', categoryId: 'cat-imei', slug: 'reparo-de-imei-samsung', name: 'Reparo de IMEI Samsung', description: 'Correção de IMEI em aparelhos Samsung (certificado).', price: 150, deliveryTime: 'Até 30 min', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-7', categoryId: 'cat-imei', slug: 'reparo-de-imei-xiaomi', name: 'Reparo de IMEI Xiaomi', description: 'Correção de IMEI para Xiaomi, Redmi e POCO.', price: 150, deliveryTime: 'Até 30 min', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-8', categoryId: 'cat-imei', slug: 'alteracao-de-imei-motorola', name: 'Alteração de IMEI Motorola', description: 'Alteração de IMEI para aparelhos Motorola com bootloader liberado.', price: 180, deliveryTime: 'Até 1h', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-9', categoryId: 'cat-ativacoes', slug: 'ativacao-ios-qualquer-versao', name: 'Ativação iOS (Qualquer versão)', description: 'Ativação do aparelho sem Apple ID, qualquer versão do iOS.', price: 210, deliveryTime: 'Até 2h', provider: 'auto', productUuid: '3128', apiField: 'Serial' },
  { id: 'srv-10', categoryId: 'cat-mdm', slug: 'remocao-mdm-iphone', name: 'Remoção MDM iPhone', description: 'Remoção de gerenciamento corporativo (MDM) para iPhones.', price: 299.4, deliveryTime: 'Até 24h', provider: 'auto', productUuid: '226', apiField: 'Serial' },
  { id: 'srv-11', categoryId: 'cat-mdm', slug: 'remocao-mdm-android-zero-touch-dpc', name: 'Remoção MDM Android (Zero Touch / DPC)', description: 'Remoção de inscrição em enterprise mobility para Android.', price: 137.4, deliveryTime: 'Até 1h', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-12', categoryId: 'cat-unlock', slug: 'desbloqueio-de-operadora-simlock-iphone', name: 'Desbloqueio de Operadora (Simlock) iPhone', description: 'Desbloqueio permanente de operadora via base de dados oficial.', price: 239.4, deliveryTime: 'Instantâneo', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-13', categoryId: 'cat-unlock', slug: 'desbloqueio-de-operadora-simlock-samsung', name: 'Desbloqueio de Operadora (Simlock) Samsung', description: 'Desbloqueio de simlock para aparelhos Samsung.', price: 179.4, deliveryTime: 'Até 30 min', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-14', categoryId: 'cat-desbloqueios', slug: 'desbloqueio-de-conta-google-tela-bloqueada', name: 'Desbloqueio de Conta Google (Tela bloqueada)', description: 'Remoção de conta Google da tela de bloqueio (lock screen), sem perder dados.', price: 95.4, deliveryTime: 'Até 15 min', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-15', categoryId: 'cat-desbloqueios', slug: 'desbloqueio-de-padrao-pin', name: 'Desbloqueio de Padrão / PIN', description: 'Remoção de padrão, PIN ou senha de bloqueio em Android.', price: 113.4, deliveryTime: 'Até 15 min', provider: 'manual', productUuid: null, apiField: null },
  { id: 'srv-16', categoryId: 'cat-desbloqueios', slug: 'remocao-de-frp-via-emergency-account', name: 'Remoção de FRP via EMERGENCY ACCOUNT', description: 'Remoção de conta Google via conta emergencial para modelos selecionados.', price: 53.4, deliveryTime: 'Instantâneo', provider: 'manual', productUuid: null, apiField: null },
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
      ['remote-1', 'Motorola Moto FRP Unlock Fastboot Mode Instant MTK Only', 53.4, 'Minutes'],
      ['remote-2', 'Xiaomi FRP REMOVE INSTANT BY USB ASSISTANT MODE', 26.4, 'Miniutes'],
      ['remote-3', 'AMT Android Multi Tool RENT (2H) Instant S2', 2.34, 'Instant'],
      ['remote-4', 'AMT Android Multi Tool RENT 2H Instant', 2.94, 'Instant'],
      ['remote-5', 'Dft Pro Tool Rent 48 hours Instant', 11.94, 'Instant'],
      ['remote-6', 'EFT Pro Tool 6 Hour Rent instant', 18, 'Minutes'],
      ['remote-7', 'TSM Tool Pro Rent 3 hours Instant', 5.64, 'Instant'],
      ['remote-8', 'Unlock Tool RENT (6H) Instant S2 (Limited 70 Account)', 3.24, 'Instant'],
      ['remote-9', 'Unlock Tool Rent Instant 6 Hour', 3.06, 'Instant'],
      ['remote-10', 'Z3X SamsTool Online Rent 1Month (Pre Login)', 150, '1-30 Miniutes'],
      ['remote-11', 'Rent Service Problem Submit', 0, '1-10 Miniutes'],
      ['remote-12', 'AndroidWinTool (AWT) Rent [48 Hours]', 12.6, 'Instant'],
      ['remote-13', 'AnonySHU Rent [12 Hours]', 18, 'Instant'],
      ['remote-14', 'Griffin-Unlocker-Tool (Premium Account) Tool RENT [6 Hours]', 18, 'Instant'],
      ['remote-15', '(Filewale.com) Firmware Request', 6.6, 'Miniutes'],
      ['remote-16', '(givemerom.com) (1MB to 1GB) GiveMeROM Firmware Request', 5.4, '1 hour'],
      ['remote-17', '(hello-firmware.com) Firmware Request Here', 10.8, '10-30 Miniutes'],
      ['remote-18', '(Support.halabtech.com) 13GB to 30GB Halabtech Firmware Request', 27, '3-6 Hour'],
      ['remote-19', '(Support.halabtech.com) 1MB to 1GB Halabtech Firmware Request', 5.4, '1-30 Minute'],
      ['remote-20', '(Support.halabtech.com) 2GB to 3GB Halabtech Firmware Request', 8.4, '1-3 Hour'],
      ['remote-21', '(Support.halabtech.com) 3GB to 4GB Halabtech Firmware Request', 12, '1-3 Hour'],
      ['remote-22', '(Support.halabtech.com) 5GB to 9GB Halabtech Firmware Request', 15, '3-6 Hour'],
      ['remote-23', '(Support.halabtech.com) 9GB to13GB Halabtech Firmware Request', 17.4, '3-6 Hour'],
      ['remote-24', 'APIZU MDM TOOL PRO Rent (Time: 4 Hours)', 12, 'Miniutes'],
      ['remote-25', 'CellTool/SamsungTool.us Samsung Tool Rent 12 Hours', 17.4, 'Instant'],
      ['remote-26', 'CF Tools Rent Instant [6 Hours]', 4.68, 'Instant'],
      ['remote-27', 'CHEETAH TOOL RENT [25 Days] instant', 54, 'Instant'],
      ['remote-28', 'CM2 Dongle Rent (New Version) [1 Hour]', 13.8, '1-10 Minutes'],
      ['remote-29', 'CM2 Dongle Rent (New Version) [1 Hour] Premium', 16.8, '1-10 Minutes'],
      ['remote-30', 'Dft Pro Tool Rent [45 hours] Instant S2', 12.6, 'Instant'],
      ['remote-31', 'File Password Only (HALABTECH)', 1.8, '1-30 Minute'],
      ['remote-32', 'GivemeROM File Request (13GB to 30GB) Firmware Request', 24, '3-6 Hour'],
      ['remote-33', 'GivemeROM File Request (2GB to 3GB) Firmware Request', 8.4, '1-3 Hour'],
      ['remote-34', 'GivemeROM File Request (5GB to 9GB) Firmware Request', 15, '3-6 hour'],
      ['remote-35', 'GivemeROM File Request (9GB to 13GB) Firmware Request', 14.4, '3-6 Hour'],
      ['remote-36', 'GivemeROM File Request 3GB to 4GB Firmware Request', 12, '1-3 Hour'],
      ['remote-37', 'Griffin-Unlocker Tool RENT instant [6 Hours]', 10.8, 'Instant'],
      ['remote-38', 'HSPro Tool Access Rent For 6 Hours (Temporarily Login - No Refundable)', 21, 'Miniutes'],
      ['remote-39', 'Kg Killer Tool Rent [4 Hours] Instant', 5.94, 'Instant'],
      ['remote-40', 'MDM Fix Tool Rent 6 Hour Instant', 10.14, 'Instant'],
      ['remote-41', 'Mst [MobileSea Sevice Tool] Instant [6 hours]', 2.94, 'Instant'],
      ['remote-42', 'MultiUnlock Tool Access Rent For 12 Hours (Login By AnyDesk)', 12, 'Instant'],
      ['remote-43', 'Octoplus Box - FRP Tool Rent (1 Hour)', 13.8, '1-10 Minutes'],
      ['remote-44', 'Octoplus Box - Huawei Tool Rent (1 Hour)', 15, '1-10 Miniutes'],
      ['remote-45', 'Octoplus Box - LG Tool Rent (1 Hour)', 13.8, '1-10 Minutes'],
      ['remote-46', 'Octoplus Box - Samsung Tool (Exynos Cup) Rent (1 Hour)', 13.8, '1-10 Minutes'],
      ['remote-47', 'Pandora Tool { Digital } Login (Rent 48 Hours)', 60, '1-30 Miniutes'],
      ['remote-48', 'Pandora Tool { Digital } Login Rent 1 month', 120, 'Miniutes'],
      ['remote-49', 'Pandora Tool { Digital } Login Rent 2 months 60 days', 168, 'Miniutes'],
      ['remote-50', 'Relogin Your, OCTOPLUS, SIGMA Within 1 Hour After Ordering', 0, '1-10 Min'],
      ['remote-51', 'RTC Tool Rent 6 Hour Instant', 12, 'Instant'],
      ['remote-52', 'SIGMA PLUS 1 Hour Rent', 19.2, '1-10 Minutes'],
      ['remote-53', 'Sigma Plus Rent [1 Hours]', 12, '1-10 Minutes'],
      ['remote-54', 'Tfm Tool Rent [3 hours] Instant', 4.14, 'Instant'],
      ['remote-55', 'TR Tools Pro Rent Instant 24 Hour', 19.8, 'Instant'],
      ['remote-56', 'UnlockTool Rent (Login + Password) 12 Hours', 5.34, 'Instant'],
      ['remote-57', 'UnlockTool Rent (Login + Password) 24 Hours', 7.14, 'Instant'],
      ['remote-58', 'Z3X Samsung Tool Pro Rent (Box) 1 Hours', 15, '1-30 Miniutes'],
      ['remote-59', 'SmartTool Pro Access Rent For 10 Hours (Direct Source)', 18, 'Instant'],
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

// Downloads (Ferramentas e Drivers) — catálogo da Central de Downloads.
// Os links (url) são preenchidos no painel /admin; o sync preserva url e
// disponibilidade ajustadas lá (não sobrescreve).
export const downloadsSeed: DownloadItem[] = [
  { id: 'dl-1', name: 'Anydesk Para Desbloqueios 💻', version: '7', description: 'Windows 7, 8, 10 e 11', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-2', name: 'Rustdesk', version: 'Atualizado', description: 'Acesso remoto', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-3', name: 'Octoplus - Pack remoto', version: '5.11', description: 'Senha: f5gsm.com.br', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-4', name: 'Driver MTK 💻', version: 'All', description: 'MTK Auto installation drivers', category: 'driver', url: '', isActive: true },
  { id: 'dl-5', name: 'Driver UsbDK 💻', version: 'All', description: 'UsbDk devices', category: 'driver', url: '', isActive: true },
  { id: 'dl-6', name: 'USB Redirector Versão 1.97', version: 'V1.97', description: 'Conecta apenas com IP', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-7', name: 'Driver MTK e Qualcomm OPPO / Realme', version: 'V2', description: 'Drivers Oppo / Realme', category: 'driver', url: '', isActive: true },
  { id: 'dl-8', name: 'Arquivo para PICO 2', version: 'v1', description: 'Exploit', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-9', name: 'Drivers SPD 💻', version: 'V2', description: 'Atualizado All Bands', category: 'driver', url: '', isActive: true },
  { id: 'dl-10', name: 'Ultra View', version: 'V6', description: 'Para Remotos', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-11', name: 'SamFW Tool', version: '5.6', description: 'Windows 10', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-12', name: '3uTools 🍎', version: 'All', description: 'Software Apple', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-13', name: 'USB Redirector Versão 2.5', version: 'V2.5', description: 'Conecta com nome e ID', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-14', name: 'Drivers Qualcomm', version: 'All', description: 'Drivers Qualcomm todas as marcas', category: 'driver', url: '', isActive: true },
  { id: 'dl-15', name: 'Drivers USB SAMSUNG 🛠', version: 'Atualizado', description: 'Windows 7, 8, 10 e 11', category: 'driver', url: '', isActive: true },
  { id: 'dl-16', name: 'Zadig', version: 'v2', description: 'Utilitário de instalação de drivers USB', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-17', name: 'LG UP 💻', version: 'V1.14', description: 'Flash Software em aparelhos da LG', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-18', name: 'Drivers USB LG 🛠', version: 'V4.8.0', description: 'Windows 7, 8, 10 e 11', category: 'driver', url: '', isActive: true },
  { id: 'dl-19', name: 'Desativar AntiVirus', version: 'Senha: sordum', description: 'Removedor de antivírus', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-20', name: 'Software Fix Motorola 💻', version: 'All', description: 'Reparo e atualização Motorola', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-21', name: 'FIX MTK 💻', version: 'Windows 11', description: 'Corrigir erro de driver MTK', category: 'ferramenta', url: '', isActive: true },
  { id: 'dl-22', name: 'Custom DA 💻', version: 'V1', description: 'Moto E22i', category: 'ferramenta', url: '', isActive: true },
];