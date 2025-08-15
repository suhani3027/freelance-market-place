import FreelancerProfileContent from './FreelancerProfileContent';

interface PageProps {
  params: Promise<{ email: string }>;
}

export default async function FreelancerProfile({ params }: PageProps) {
  const resolvedParams = await params;
  return <FreelancerProfileContent email={resolvedParams.email} />;
}
