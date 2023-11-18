import { Index, Pinecone, RecordMetadata } from '@pinecone-database/pinecone';

import { UnifiedPost } from './db/types/ex-supabase.js';
import { generateEmbeddingsCohere } from './utils/embeddings.js';
import { chunkArray } from './utils/index.js';

export const initPineconeIndex = async <T extends RecordMetadata>(name: string) => {
  const pinecone = new Pinecone({
    environment: 'eu-west4-gcp',
    apiKey: process.env.PINECONE_API_KEY as string,
  });
  return pinecone.Index<T>(name);
};

export const syncPostsOnPinecone = async (posts: UnifiedPost[], chunkSize = 100) => {
  const pineconeIndex = await initPineconeIndex<{ content_id: string; source: 'Farcaster' | 'Lens' }>('posts');
  const chunks = chunkArray(posts, chunkSize);
  let index = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const chunk of chunks) {
    console.log(`Syncing ${posts.length} posts in ${chunks.length} chunks...[${index++} / ${chunks.length}]`);
    console.log('Generating vectors...');
    // eslint-disable-next-line no-await-in-loop
    const vectors = await getPostsVectors(chunk);
    console.log('Upserting to pinecone');
    console.time('upsert pinecone');
    // eslint-disable-next-line no-await-in-loop
    await pineconeIndex.upsert(vectors.filter((v) => v.values));
    console.timeEnd('upsert pinecone');
  }
  console.log('done');
};

export const getPostVectors = async (
  post: UnifiedPost
): Promise<{
  id: string;
  values: Array<number>;
  metadata: {
    content_id: string;
    source: 'Farcaster' | 'Lens';
  };
}> => {
  const embeddings = (await generateEmbeddingsCohere([post.cleaned_text])).filter(Boolean);
  return {
    id: `${post.content_id}`,
    values: embeddings[0],
    metadata: {
      content_id: post.content_id,
      source: post.source as 'Farcaster' | 'Lens',
    },
  };
};

export const getPostsVectors = async (
  posts: UnifiedPost[]
): Promise<{ metadata: { content_id: string; source: 'Farcaster' | 'Lens' }; values: number[]; id: string }[]> => {
  const embeddings = (await generateEmbeddingsCohere(posts.map((p) => p.cleaned_text))).filter(Boolean);
  return embeddings.map((embedding, index) => ({
    id: `${posts[index].content_id}`,
    values: embedding,
    metadata: {
      content_id: posts[index].content_id,
      source: posts[index].source as 'Farcaster' | 'Lens',
    },
  }));
};

export const queryPineconeIndex = async (pineconeIndex: Index, query: string[]) => {
  const embeddings = await generateEmbeddingsCohere(query);
  console.log(query);
  return pineconeIndex.query({
    vector: embeddings.flat().filter(Boolean),
    topK: 25,
  });
};
