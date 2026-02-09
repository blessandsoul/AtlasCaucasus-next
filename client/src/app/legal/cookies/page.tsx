import type { Metadata } from 'next';
import CookiePolicyClient from './CookiePolicyClient';

export const metadata: Metadata = {
  title: 'Cookie Policy | AtlasCaucasus',
  description: 'Learn about the cookies and similar technologies used by AtlasCaucasus.',
};

export default function CookiePolicyPage() {
  return <CookiePolicyClient />;
}
