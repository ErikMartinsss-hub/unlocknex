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

// Catálogo de serviços passou a ser gerenciado pelo painel /admin
// ("Adicionar serviços da API" e preços) — o seed fixo foi esgotado
// de propósito para o "Sincronizar catálogo" não recriar itens.
export const servicesSeed: Service[] = [];

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

// Catálogo de aluguel também migrado para o painel /admin — esgotado de
// propósito: adicione um produto por vez em "Adicionar serviços da API".
export const remoteServicesSeed: Service[] = [];

// Downloads (Ferramentas e Drivers) — catálogo da Central de Downloads.
// Os links (url) são preenchidos no painel /admin; o sync preserva url e
// disponibilidade ajustadas lá (não sobrescreve).
export const downloadsSeed: DownloadItem[] = [
  { id: 'dl-1', name: 'Anydesk Para Desbloqueios 💻', version: '7', description: 'Windows 7, 8, 10 e 11', category: 'ferramenta', url: 'https://mega.nz/file/950FRYIS#jtgZq-9AJlEvgWHjaLGFdiVcUNIRRpcRvjVKupgRAjw', isActive: true },
  { id: 'dl-2', name: 'Rustdesk', version: 'Atualizado', description: 'Acesso remoto', category: 'ferramenta', url: 'https://github.com/rustdesk/rustdesk/releases/download/1.4.9/rustdesk-1.4.9-x86_64.exe', isActive: true },
  { id: 'dl-3', name: 'Octoplus - Pack remoto', version: '5.11', description: 'Senha para extrair (WinRAR): f5gsm.com.br', category: 'ferramenta', url: 'https://www.mediafire.com/file/n3bwqv5c80e022w/F5GSM+-+Pacote+Octoplus.zip/file', isActive: true },
  { id: 'dl-4', name: 'Driver MTK 💻', version: 'All', description: 'MTK Auto installation drivers', category: 'driver', url: 'https://mega.nz/file/10U3iBiT#L9iKlwK1LU6AxaZjNYNI3VDULtEKqR0bU7M1iCrWb6w', imageUrl: 'https://i.ytimg.com/vi/RvtOz_2cYwk/maxresdefault.jpg', isActive: true },
  { id: 'dl-5', name: 'Driver UsbDK 💻', version: 'All', description: 'UsbDk devices', category: 'driver', url: 'https://github.com/daynix/UsbDk/releases/download/v1.00-22/UsbDk_1.0.22_x64.msi', isActive: true },
  { id: 'dl-6', name: 'USB Redirector Versão 1.97', version: 'V1.97', description: 'Conecta apenas com IP', category: 'ferramenta', url: 'https://www.mediafire.com/file/faxgqx3u4vr8afq/F5GSM+-+V1.97.exe/file', isActive: true },
  { id: 'dl-7', name: 'Driver MTK e Qualcomm OPPO / Realme', version: 'V2', description: 'Drivers Oppo / Realme', category: 'driver', url: 'https://www.mediafire.com/file/v5lfa66l7yqa6p6/Driver_Qualcomm_Mtk_2.0.1.zip/file', isActive: true },
  { id: 'dl-8', name: 'Arquivo para PICO 2', version: 'v1', description: 'Exploit', category: 'ferramenta', url: 'https://mega.nz/file/h0d3EQDB#y992GBz03Q0JkNts6Faae9I9beVxe2B9p-eO0feof6M', isActive: true },
  { id: 'dl-9', name: 'Drivers SPD 💻', version: 'V2', description: 'Atualizado All Bands', category: 'driver', url: 'https://www.mediafire.com/file_premium/uw2238zj1et234q/Spreadtrum_77xx_Drivers.7z/file', isActive: true },
  { id: 'dl-10', name: 'Ultra View', version: 'V6', description: 'Para Remotos', category: 'ferramenta', url: 'https://mega.nz/file/Y0VUTArI#LjMaqtOfXxXiWKmMdkFUKTKPzFRVeTKzWCSxDcJiJN0', isActive: true },
  { id: 'dl-11', name: 'SamFW Tool', version: '5.6', description: 'Windows 10', category: 'ferramenta', url: 'https://samfw.com/SamFwToolSetup_v5.6.zip', isActive: true },
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