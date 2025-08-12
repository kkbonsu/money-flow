import { useUser, useOrganization, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useMultiTenantAuth() {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { signOut } = useClerkAuth();
  const [, setLocation] = useLocation();

  // Check if user has an organization
  useEffect(() => {
    if (userLoaded && orgLoaded && isSignedIn && !organization) {
      // User is signed in but has no organization
      // Redirect to organization setup
      navigate('/organization-setup');
    }
  }, [userLoaded, orgLoaded, isSignedIn, organization, navigate]);

  return {
    user: user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: user.fullName || '',
      imageUrl: user.imageUrl,
    } : null,
    organization: organization ? {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      imageUrl: organization.imageUrl,
      membersCount: organization.membersCount,
      createdAt: organization.createdAt,
    } : null,
    isLoading: !userLoaded || !orgLoaded,
    isSignedIn,
    hasOrganization: !!organization,
    signOut,
  };
}