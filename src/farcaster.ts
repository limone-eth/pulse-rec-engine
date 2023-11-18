/* eslint-disable camelcase */
import { getCasts } from './db/casts.js';
import { Cast, UnifiedPost } from './db/types/ex-supabase.js';
import { fetchAllSupabase } from './db/utils.js';
import { readCSV } from './utils/csv.js';
import { mapFarcasterToUnified } from './utils/unified.js';

export const fetchAndPrepareFarcasterPosts = async (cache = true): Promise<UnifiedPost[]> => {
    let farcasterCasts: Cast[];
    if (cache) {
        const farcasterCastsCache = await readCSV(`./farcaster-casts.csv`);
        farcasterCasts = farcasterCastsCache.map((rowPublication) => mapCsvRowToCast(rowPublication));
    } else {
        farcasterCasts = await fetchAllSupabase(getCasts);
    }
    return farcasterCasts.map((post) => mapFarcasterToUnified(post));
};

export const mapCsvRowToCast = (row: string[]): Cast => {
    const [
        hash,
        thread_hash,
        parent_hash,
        author_fid,
        author_username,
        author_display_name,
        author_pfp_url,
        author_pfp_verified,
        text,
        published_at,
        replies_count,
        reactions_count,
        recasts_count,
        watches_count,
        deleted,
        parent_author_fid,
        parent_author_username,
        hash_v1,
        parent_hash_v1,
        thread_hash_v1,
        fts,
    ] = row;

    return {
        author_display_name: author_display_name || null,
        author_fid: parseInt(author_fid, 10),
        author_pfp_url: author_pfp_url || null,
        author_pfp_verified: author_pfp_verified === 'true',
        author_username: author_username || null,
        deleted: deleted === 'true',
        fts: fts || null,
        hash,
        hash_v1: hash_v1 || null,
        mentions: null,
        parent_author_fid: parent_author_fid ? parseInt(parent_author_fid, 10) : null,
        parent_author_username: parent_author_username || null,
        parent_hash: parent_hash || null,
        parent_hash_v1: parent_hash_v1 || null,
        published_at,
        reactions_count: reactions_count ? parseInt(reactions_count, 10) : null,
        recasts_count: recasts_count ? parseInt(recasts_count, 10) : null,
        replies_count: replies_count ? parseInt(replies_count, 10) : null,
        text,
        thread_hash,
        thread_hash_v1: thread_hash_v1 || null,
        watches_count: watches_count ? parseInt(watches_count, 10) : null,
    };
};
