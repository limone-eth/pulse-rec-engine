import weaviate, { WeaviateClient, ApiKey, ObjectsBatcher, generateUuid5 } from 'weaviate-ts-client';

import { UnifiedPost } from './db/types/ex-supabase.js';
import { generateEmbeddingsCohere } from './utils/embeddings.js';

export const initWeaviate = async () =>
  weaviate.client({
    scheme: 'https',
    host: process.env.WEAVIATE_HOST as string,
    apiKey: new ApiKey(process.env.WEAVIATE_API_KEY!),
    headers: {
      'X-Cohere-Api-Key': process.env.COHERE_API_KEY as string,
    },
  });

export const addSchema = async (client: WeaviateClient, schema: object) =>
  client.schema.classCreator().withClass(schema).do();

export async function importPosts(client: WeaviateClient, data: UnifiedPost[]) {
  // Prepare a batcher
  let batcher: ObjectsBatcher = client.batch.objectsBatcher();
  let numBatches = 0;
  let counter = 0;
  const batchSize = 1000;

  // eslint-disable-next-line no-restricted-syntax
  for (const obj of data) {
    console.log(counter);
    // add the object to the batch queue
    batcher = batcher.withObject({
      class: 'Post',
      id: generateUuid5(obj.content_id),
      properties: {
        ...obj,
      },
    });

    // When the batch counter reaches batchSize, push the objects to Weaviate
    if (counter++ === batchSize) {
      // flush the batch queue
      // eslint-disable-next-line no-await-in-loop
      const res = await batcher.do();
      console.log('ERROR', res[0].result?.errors);

      // restart the batch queue
      counter = 0;
      batcher = client.batch.objectsBatcher();
      console.log(numBatches++);
    }
  }

  // Flush the remaining objects
  const res = await batcher.do();
  console.log(res);
}

export const syncPostsOnWeaviate = async (posts: UnifiedPost[]) => {
  const weaviateClient = await initWeaviate();
  await weaviateClient.schema.classDeleter().withClassName('Post').do();
  await addSchema(weaviateClient, {
    class: 'Post',
    vectorizer: 'text2vec-cohere', // If set to "none" you must always provide vectors yourself. Could be any other "text2vec-*" also.
    moduleConfig: {
      'text2vec-cohere': {},
    },
  });
  await importPosts(weaviateClient, posts);
  const result = await weaviateClient.graphql
    .get()
    .withClassName('Post')
    .withNearVector({
      vector: (await generateEmbeddingsCohere(['web3 socials farcaster lens']))[0],
    })
    .withLimit(25)
    .withFields('text _additional { distance }')
    .do();
  console.log(result);
};
