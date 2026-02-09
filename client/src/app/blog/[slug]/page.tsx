import type { Metadata } from 'next';
import { BlogPostClient } from './BlogPostClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${apiUrl}/blogs/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return { title: 'Post Not Found' };
    }

    const result = await response.json();
    const post = result.data;

    const description = post.excerpt || `Read "${post.title}" on the AtlasCaucasus Blog`;
    const coverUrl = post.coverImage?.url || '/atlascaucasus.png';

    return {
      title: post.title,
      description,
      openGraph: {
        title: post.title,
        description,
        type: 'article',
        publishedTime: post.publishedAt || post.createdAt,
        authors: post.author
          ? [`${post.author.firstName} ${post.author.lastName}`]
          : undefined,
        tags: post.tags,
        images: [
          {
            url: coverUrl,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description,
        images: [coverUrl],
      },
    };
  } catch {
    return { title: 'Blog Post' };
  }
}

export default async function BlogPostPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return <BlogPostClient slug={slug} />;
}
