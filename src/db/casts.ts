import supabase from './index.js';
import { Cast } from './types/ex-supabase.js';

import { writeDataToCSV } from '../utils/csv.js';

export const getCastsByFid = async (fid: number, limit = 100): Promise<Cast[]> => {
    const { data, error } = await supabase
        .from('casts')
        .select('*')
        .eq('author_fid', fid)
        .order('published_at', { ascending: false })
        .limit(limit);
    if (error) {
        console.error(error);
        throw error;
    }
    return data ?? [];
};

export const getCasts = async (
    page = 0,
    limit = 500,
    publishedAfter: string = new Date('2023-10-23T14:56:10+00:00').toISOString()
): Promise<Cast[]> => {
    const { data, error } = await supabase
        .from('casts')
        .select('*')
        .order('published_at', { ascending: true })
        .gt('published_at', publishedAfter)
        .range(page * limit, (page + 1) * limit - 1);
    if (error) {
        throw error;
    }
    await writeDataToCSV(data, 'farcaster-casts.csv');
    return data ?? [];
};
