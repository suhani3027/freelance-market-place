'use client';

import { useParams } from 'next/navigation';
import ChatUI from '../../../../components/chatUI';

const ClientChatPage = () => {
  const { freelancerId } = useParams();

  // 🔐 In real app, fetch from session/auth
  const clientId = 'client123'; // placeholder for now

  return (
    <div>
      <h2 className="text-2xl font-bold text-center my-4">Chat with Freelancer</h2>
      <ChatUI senderId={clientId} receiverId={freelancerId as string} />
    </div>
  );
};

export default ClientChatPage;
