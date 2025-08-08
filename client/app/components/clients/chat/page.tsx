import ChatUI from "../../chatUI";

const ClientChatPage = () => {
  // You may want to pass senderId and receiverId as props or from context
  return <ChatUI senderId="client123" receiverId="freelancer123" />;
};

export default ClientChatPage;
