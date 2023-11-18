import { chunkArray } from './index.js';

import { Cast, UnifiedPost } from '../db/types/ex-supabase.js';
import { upsertPosts } from '../db/unified-posts.js';
import { fetchAndPrepareFarcasterPosts } from '../farcaster.js';
import { fetchAndPrepareLensPosts, LensPublication } from '../lens.js';

export const cleanPost = (rawPostContent: string): string => {
  // Trim whitespace
  let cleanedContent = rawPostContent.trim().toLowerCase();

  // Remove URLs
  cleanedContent = cleanedContent.replace(/https?:\/\/\S+/g, '');

  // Replace multiple spaces with a single space
  return cleanedContent.replace(/\s\s+/g, ' ');
};

export function mapLensToUnified(lensPost: LensPublication): UnifiedPost {
  return {
    content_id: lensPost.publication_id,
    author_id: lensPost.profile_id, // Assuming the profile_id is the author's unique identifier or address
    author_name: lensPost.profile_name || 'Unknown',
    author_profile_image: lensPost.profile_metadata_url, // Assuming profile image URL is in metadata
    text: lensPost.content,
    cleaned_text: cleanPost(lensPost.content),
    publish_date: new Date(lensPost.block_timestamp).toISOString(),
    source: 'Lens',
  };
}

export function mapFarcasterToUnified(farcasterPost: Cast): UnifiedPost {
  return {
    content_id: farcasterPost.hash,
    author_id: farcasterPost.author_username!,
    author_name: farcasterPost.author_display_name || farcasterPost.author_username || 'Unknown',
    author_profile_image: farcasterPost.author_pfp_url,
    text: farcasterPost.text,
    cleaned_text: cleanPost(farcasterPost.text),
    publish_date: new Date(farcasterPost.published_at).toISOString(),
    source: 'Farcaster',
  };
}

export const fetchAllPosts = async (): Promise<UnifiedPost[]> => {
  console.log('Fetching and preparing Lens posts...');
  const lensPosts = await fetchAndPrepareLensPosts();
  console.log(`Found ${lensPosts.length} Lens posts!`);

  console.log('Fetching and preparing Farcaster posts...');
  const farcasterPosts = await fetchAndPrepareFarcasterPosts();
  console.log(`Found ${farcasterPosts.length} Farcaster posts!`);

  const allPosts = [...lensPosts, ...farcasterPosts];
  console.log(`Found a total of ${allPosts.length}!`);

  return allPosts;
};

export const synchronizeAllPosts = async () => {
  const posts = await fetchAllPosts();
  const postChunks = chunkArray(
    posts.filter((p) => p.author_id),
    10000
  );
  let i = 0;
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of postChunks) {
    console.log(i++ * 10000);
    await upsertPosts(chunk);
  }
};
