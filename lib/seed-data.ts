export const categoriesSeed = [
  { id: 'cat-frp', slug: 'frp', name: 'FRP (Desbloqueio de Conta)', icon: 'shield', color: '#00ff66' },
  { id: 'cat-imei', slug: 'imei', name: 'Reparo de IMEI', icon: 'chip', color: '#22d3ee' },
  { id: 'cat-ativacoes', slug: 'ativacoes', name: 'Ativações', icon: 'bolt', color: '#facc15' },
  { id: 'cat-mdm', slug: 'mdm', name: 'MDM / Gerenciamento', icon: 'lock', color: '#f472b6' },
  { id: 'cat-unlock', slug: 'unlock', name: 'Desbloqueio de Operadora', icon: 'unlock', color: '#a78bfa' },
  { id: 'cat-desbloqueios', slug: 'desbloqueios', name: 'Outros Desbloqueios', icon: 'wrench', color: '#fb923c' },
];

export const servicesSeed = [
  { id: 'srv-1', categoryId: 'cat-frp', slug: 'samsung-frp-remocao-de-conta-google', name: 'Samsung FRP (Remoção de Conta Google)', description: 'Remoção de conta Google via servidor. Suporta modelos 2016+ (A, S, Note, M).', price: 12.9, deliveryTime: 'Instantâneo' },
  { id: 'srv-2', categoryId: 'cat-frp', slug: 'xiaomi-frp-mi-cloud', name: 'Xiaomi FRP / MI Cloud', description: 'Remoção de conta MI e Mi Cloud para Redmi, POCO e Xiaomi.', price: 9.9, deliveryTime: 'Instantâneo' },
  { id: 'srv-3', categoryId: 'cat-frp', slug: 'motorola-frp', name: 'Motorola FRP', description: 'Remoção de FRP para Motorola sem necessidade de flashear.', price: 14.9, deliveryTime: 'Instantâneo' },
  { id: 'srv-4', categoryId: 'cat-frp', slug: 'lg-frp', name: 'LG FRP', description: 'Remoção de conta Google para aparelhos LG.', price: 11.9, deliveryTime: 'Até 5 min' },
  { id: 'srv-5', categoryId: 'cat-frp', slug: 'apple-frp-icloud-remocao', name: 'Apple FRP (iCloud - Remoção)', description: 'Remoção de iCloud vinculado. Suporta iPhone e iPad.', price: 59.9, deliveryTime: 'Até 24h' },
  { id: 'srv-6', categoryId: 'cat-imei', slug: 'reparo-de-imei-samsung', name: 'Reparo de IMEI Samsung', description: 'Correção de IMEI em aparelhos Samsung (certificado).', price: 25, deliveryTime: 'Até 30 min' },
  { id: 'srv-7', categoryId: 'cat-imei', slug: 'reparo-de-imei-xiaomi', name: 'Reparo de IMEI Xiaomi', description: 'Correção de IMEI para Xiaomi, Redmi e POCO.', price: 25, deliveryTime: 'Até 30 min' },
  { id: 'srv-8', categoryId: 'cat-imei', slug: 'alteracao-de-imei-motorola', name: 'Alteração de IMEI Motorola', description: 'Alteração de IMEI para aparelhos Motorola com bootloader liberado.', price: 30, deliveryTime: 'Até 1h' },
  { id: 'srv-9', categoryId: 'cat-ativacoes', slug: 'ativacao-ios-qualquer-versao', name: 'Ativação iOS (Qualquer versão)', description: 'Ativação do aparelho sem Apple ID, qualquer versão do iOS.', price: 35, deliveryTime: 'Até 2h' },
  { id: 'srv-10', categoryId: 'cat-mdm', slug: 'remocao-mdm-iphone', name: 'Remoção MDM iPhone', description: 'Remoção de gerenciamento corporativo (MDM) para iPhones.', price: 49.9, deliveryTime: 'Até 24h' },
  { id: 'srv-11', categoryId: 'cat-mdm', slug: 'remocao-mdm-android-zero-touch-dpc', name: 'Remoção MDM Android (Zero Touch / DPC)', description: 'Remoção de inscrição em enterprise mobility para Android.', price: 22.9, deliveryTime: 'Até 1h' },
  { id: 'srv-12', categoryId: 'cat-unlock', slug: 'desbloqueio-de-operadora-simlock-iphone', name: 'Desbloqueio de Operadora (Simlock) iPhone', description: 'Desbloqueio permanente de operadora via base de dados oficial.', price: 39.9, deliveryTime: 'Instantâneo' },
  { id: 'srv-13', categoryId: 'cat-unlock', slug: 'desbloqueio-de-operadora-simlock-samsung', name: 'Desbloqueio de Operadora (Simlock) Samsung', description: 'Desbloqueio de simlock para aparelhos Samsung.', price: 29.9, deliveryTime: 'Até 30 min' },
  { id: 'srv-14', categoryId: 'cat-desbloqueios', slug: 'desbloqueio-de-conta-google-tela-bloqueada', name: 'Desbloqueio de Conta Google (Tela bloqueada)', description: 'Remoção de conta Google da tela de bloqueio (lock screen), sem perder dados.', price: 15.9, deliveryTime: 'Até 15 min' },
  { id: 'srv-15', categoryId: 'cat-desbloqueios', slug: 'desbloqueio-de-padrao-pin', name: 'Desbloqueio de Padrão / PIN', description: 'Remoção de padrão, PIN ou senha de bloqueio em Android.', price: 18.9, deliveryTime: 'Até 15 min' },
  { id: 'srv-16', categoryId: 'cat-desbloqueios', slug: 'remocao-de-frp-via-emergency-account', name: 'Remoção de FRP via EMERGENCY ACCOUNT', description: 'Remoção de conta Google via conta emergencial para modelos selecionados.', price: 8.9, deliveryTime: 'Instantâneo' },
];

export const marcas = ['Samsung', 'Xiaomi', 'Motorola', 'Apple', 'LG', 'POCO', 'Redmi', 'Asus', 'Nokia', 'Realme', 'Huawei', 'Oppo'];
export const pagamentos = ['PIX', 'Cartão', 'Cripto', 'Boleto'];