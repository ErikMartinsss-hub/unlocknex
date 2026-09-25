'use client';

import { useEffect } from 'react';

const AGENT_HASH_ID = '87b04773-9fae-48f9-a826-e06f70afe681';

/**
 * Injects the BubbleChat agent widget from Agent Factory.
 * Renders nothing; it only adds the chat bubble to the DOM on the client.
 */
export function AgentChat() {
  useEffect(() => {
    const scriptId = 'agent-factory-chat';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'module';
    script.textContent = `
      import BubbleChat from 'https://agent-factory-chat.hostgator.io/scripts/start-chat.js';
      const hashId = '${AGENT_HASH_ID}';
      const bubbleChat = new BubbleChat(hashId, 'prod');
      bubbleChat.open();
    `;
    document.body.appendChild(script);
  }, []);

  return null;
}