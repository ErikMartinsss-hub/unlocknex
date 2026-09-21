export type Role = 'admin' | 'user';

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: Role;
  balance: number;
  phone: string | null;
  createdAt: number;
};

export type ServiceCategory = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
};

export type Service = {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  deliveryTime: string;
  isActive: boolean;
};

export type Order = {
  id: string;
  userId: string;
  serviceId: string;
  deviceIdentifier: string;
  deviceModel: string | null;
  status: 'processando' | 'concluido' | 'pendente' | 'cancelado';
  cost: number;
  createdAt: number;
};

export type Transaction = {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'refund' | 'charge';
  status: 'pendente' | 'concluido' | 'cancelado';
  paymentMethod: string | null;
  reference: string | null;
  createdAt: number;
};

export type Ticket = {
  id: string;
  userId: string;
  subject: string;
  status: 'aberto' | 'respondido' | 'fechado';
  priority: 'baixa' | 'normal' | 'alta';
  closedAt: number | null;
  createdAt: number;
};

export type TicketMessage = {
  id: string;
  ticketId: string;
  userId: string;
  body: string;
  createdAt: number;
};