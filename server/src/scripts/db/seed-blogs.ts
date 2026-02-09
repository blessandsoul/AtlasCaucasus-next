/**
 * Blog Posts Seeder
 *
 * Seeds blog posts with cover images for an existing database.
 * Finds the first ADMIN user and creates blog posts authored by them.
 *
 * Usage: npx tsx src/scripts/db/seed-blogs.ts
 */

import { PrismaClient, UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { BLOG_POSTS } from './data/blogs.js';

const prisma = new PrismaClient();

function uuid(): string {
  return uuidv4();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(1, daysAgo));
  return date;
}

async function main(): Promise<void> {
  console.log('');
  console.log('📝 Blog Posts Seeder');
  console.log('====================');
  console.log('');

  // Check if blog posts already exist
  const existingCount = await prisma.blogPost.count();
  if (existingCount > 0) {
    console.log(`  ℹ️  ${existingCount} blog posts already exist.`);
    console.log('  Deleting existing blog posts and their media...');

    // Delete media for existing blog posts
    await prisma.media.deleteMany({
      where: { entityType: 'blog' },
    });

    // Delete all blog posts
    await prisma.blogPost.deleteMany();

    console.log('  ✓ Cleaned up existing blog posts');
  }

  // Find an admin user
  const adminRoleAssignment = await prisma.userRoleAssignment.findFirst({
    where: { role: UserRole.ADMIN },
    include: { user: true },
  });

  if (!adminRoleAssignment) {
    console.error('  ❌ No admin user found. Please run the main seeder first.');
    return;
  }

  const authorId = adminRoleAssignment.userId;
  console.log(`  Using admin author: ${adminRoleAssignment.user.firstName} ${adminRoleAssignment.user.lastName} (${adminRoleAssignment.user.email})`);
  console.log('');

  let postCount = 0;

  for (let i = 0; i < BLOG_POSTS.length; i++) {
    const blogData = BLOG_POSTS[i];

    // Generate slug from title with random suffix
    const baseSlug = slugify(blogData.title).substring(0, 250);
    const suffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${suffix}`;

    // Calculate reading time (strip HTML, count words, 200 wpm)
    const textContent = blogData.content.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const publishedAt = pastDate(randomInt(7, 120));

    const post = await prisma.blogPost.create({
      data: {
        id: uuid(),
        authorId,
        title: blogData.title,
        slug,
        excerpt: blogData.excerpt,
        content: blogData.content,
        tags: JSON.stringify(blogData.tags),
        isPublished: blogData.isPublished,
        viewCount: blogData.viewCount,
        readingTime,
        publishedAt: blogData.isPublished ? publishedAt : null,
        createdAt: publishedAt,
      },
    });

    // Create cover image media record
    await prisma.media.create({
      data: {
        id: uuid(),
        filename: `blog-cover-${post.id.slice(0, 8)}.jpg`,
        originalName: `blog-cover-${i + 1}.jpg`,
        mimeType: 'image/jpeg',
        size: randomInt(150000, 400000),
        url: `/seed-assets/image-${blogData.imageIndex}.jpg`,
        entityType: 'blog',
        entityId: post.id,
        uploadedBy: authorId,
      },
    });

    postCount++;
    console.log(`  ✓ [${postCount}/${BLOG_POSTS.length}] ${blogData.title}`);
  }

  console.log('');
  console.log(`✅ Created ${postCount} blog posts with cover images`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
