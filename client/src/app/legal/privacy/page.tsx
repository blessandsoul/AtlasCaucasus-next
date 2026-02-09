import type { Metadata } from 'next';
import PrivacyPolicyClient from './PrivacyPolicyClient';

export const metadata: Metadata = {
  title: 'Privacy Policy | AtlasCaucasus',
  description: 'Learn how AtlasCaucasus collects, uses, and protects your personal data.',
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
