/**
 * Fonte única das regras do Firestore publicadas pelo botão
 * "Publicar regras do banco" no /admin (rota /api/admin/sync-rules).
 *
 * IMPORTANTE: mantenha igual ao conteúdo de firestore.rules (usado para
 * consulta e publicação manual no console). O botão do /admin usa este
 * módulo porque em produção (Vercel) o arquivo .rules não acompanha o
 * pacote de deploy.
 */
export const FIRESTORE_RULES_SOURCE = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Catálogo público para qualquer pessoa logada
    match /categories/{id} {
      allow read: if isSignedIn();
      allow write: if false;
    }

    match /services/{id} {
      allow read: if isSignedIn();
      allow write: if false;
    }

    // Central de Downloads: leitura para qualquer pessoa logada,
    // escrita apenas pelo servidor (Admin SDK) via /api/admin.
    match /downloads/{id} {
      allow read: if isSignedIn();
      allow write: if false;
    }

    // Perfil do usuário: dono lê e atualiza (não pode mudar saldo/role)
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId);
      allow update: if isOwner(userId)
        && request.resource.data.balance == resource.data.balance
        && request.resource.data.role == resource.data.role
        && request.resource.data.uid == resource.data.uid;
      allow delete: if false;
    }

    // Pedidos: usuário cria e lê os próprios
    match /orders/{orderId} {
      allow create: if isOwner(request.resource.data.userId);
      allow read, update: if isOwner(resource.data.userId);
      allow delete: if false;
    }

    // Transações: usuário lê/cria as próprias
    match /transactions/{txId} {
      allow create: if isOwner(request.resource.data.userId);
      allow read: if isOwner(resource.data.userId);
      allow update, delete: if false;
    }

    // Pagamentos PIX: leitura pelo dono, escrita apenas pelo servidor (webhook/rota)
    match /payments/{paymentId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
      allow update, delete: if false;
    }

    // Tickets e mensagens: criador e dono
    match /tickets/{ticketId} {
      allow create: if isOwner(request.resource.data.userId);
      allow read, update: if isOwner(resource.data.userId);
      allow delete: if false;
    }

    match /ticketMessages/{msgId} {
      allow create: if isOwner(request.resource.data.userId);
      allow read: if isSignedIn();
      allow update, delete: if false;
    }
  }
}
`;