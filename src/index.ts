import 'dotenv/config';

import { getPosts } from './db/unified-posts.js';
import { syncPostsOnPinecone } from './pinecone.js';
import { getPostsForYou } from './profile-tags.js';

export const main = async () => {
  const feed = await getPostsForYou('limone.eth');
  console.log(feed);
  for (let page = 12; page <= 100; page++) {
    // eslint-disable-next-line no-await-in-loop
    const posts = await getPosts(500, page);
    // eslint-disable-next-line no-await-in-loop
    await syncPostsOnPinecone(
      posts.filter((p) => p.text && p.author_id && new Date(p.publish_date) >= new Date('2023-08-01'))
    );
  }
};

main().then(() => {
  process.exit(0);
});
