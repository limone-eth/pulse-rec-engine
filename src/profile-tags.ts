import { init } from '@airstack/node';

import { fetchPoaps } from './airstack/functions/fetch-poaps.js';
import { fetchAddressSocialProfiles } from './airstack/functions/fetch-user-socials.js';
import { UnifiedPost } from './db/types/ex-supabase.js';
import { getPostsByAuthors, getPostsByIds } from './db/unified-posts.js';
import { queryOpenAI } from './openai.js';
import { initPineconeIndex, queryPineconeIndex } from './pinecone.js';

export const generateProfileTags = async (address: string): Promise<any> => {
  init(process.env.AIRSTACK_API_KEY!);
  const userSocials = await fetchAddressSocialProfiles(address);
  const farcasterFid = userSocials.find((s) => s.dappName === 'farcaster')?.profileName ?? null;
  const lensHandle = userSocials.find((s) => s.dappName === 'lens')?.profileName.replace('lens/', '') ?? null;
  const posts =
    farcasterFid || lensHandle
      ? await getPostsByAuthors([farcasterFid as string, lensHandle as string].filter(Boolean), 100)
      : [];
  const poaps = await fetchPoaps(address);
  const content = `Content Posted:\n${posts
    .map((p) => `Text: ${p.cleaned_text}\n`)
    .join('\n\n')}------\n\nPOAPs Collected (aka event attended):\n${poaps
    .map((p) => `Event Name: ${p.poapEvent.eventName}\n Event Description: ${p.poapEvent.description}`)
    .join('\n\n')}`;
  return queryOpenAI(content.substring(0, 10000));
};

export const getPostsForYou = async (address: string): Promise<UnifiedPost[]> => {
  const query = await queryOpenAI(await generateProfileTags(address));
  try {
    const pineconeIndex = await initPineconeIndex('posts');
    const result = await queryPineconeIndex(pineconeIndex, [query.replace(/["'\\]/g, '').trim()]);
    if (result?.matches.length > 0) {
      return await getPostsByIds(result.matches.map((r) => r.id));
    }
    return [];
  } catch (e) {
    console.error(e);
    return [];
  }
};
