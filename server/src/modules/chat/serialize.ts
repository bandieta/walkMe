import { Message, User } from '@prisma/client';

export function toMessageDto(message: Message & { sender: User }) {
  return {
    id: message.id,
    roomId: message.roomId,
    walkId: message.walkId ?? undefined,
    senderId: message.senderId,
    senderName: message.sender.displayName,
    content: message.content,
    type: message.type,
    createdAt: message.createdAt.toISOString(),
  };
}
