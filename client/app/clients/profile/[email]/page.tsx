import ClientProfileContent from './ClientProfileContent';

interface PageProps {
  params: Promise<{ email: string }>;
}

export default async function ClientProfile({ params }: PageProps) {
  const resolvedParams = await params;
  return <ClientProfileContent email={resolvedParams.email} />;
} 