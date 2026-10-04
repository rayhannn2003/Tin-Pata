import type { Metadata } from 'next';

import { CinematicShowcase } from './CinematicShowcase';

export const metadata: Metadata = {
  title: 'Original Motion Pictures',
  description: 'A cinematic collection of three original stories, presented by Tin Pata Pictures.',
};

export default function AnimationPage() {
  return <CinematicShowcase />;
}
