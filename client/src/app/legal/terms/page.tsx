import type { Metadata } from 'next';
import TermsOfServiceClient from './TermsOfServiceClient';

export const metadata: Metadata = {
  title: 'Terms of Service | AtlasCaucasus',
  description: 'Read the terms and conditions for using the AtlasCaucasus tourism marketplace platform.',
};

export default function TermsOfServicePage() {
  return <TermsOfServiceClient />;
}
