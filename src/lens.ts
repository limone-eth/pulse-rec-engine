/* eslint-disable camelcase */
import { UnifiedPost } from './db/types/ex-supabase';
import { readCSV } from './utils/csv.js';
import { mapLensToUnified } from './utils/unified.js';

export interface LensPublication {
    publication_id: string;
    profile_id: string;
    publication_type: string;
    parent_publication_id: string;
    root_publication_id: string;
    is_hidden: string;
    block_timestamp: string;
    content: string;
    language: string;
    main_content_focus: string;
    tags_vector: string;
    profile_name: string;
    profile_metadata_url: string;
    owned_by: string;
    handle: string;
}

export const publicationsFields = [
    'publication_id',
    'profile_id',
    'publication_type',
    'parent_publication_id',
    'root_publication_id',
    'is_hidden',
    'block_timestamp',
    'content',
    'language',
    'main_content_focus',
    'tags_vector',
    'profile_name',
    'profile_metadata_url',
];

export const mapCsvRowToLensPublication = (row: string[]): LensPublication => {
    // Assuming 'row' is an array of values in the order specified in your CSV header
    const [
        publication_id,
        profile_id,
        publication_type,
        parent_publication_id,
        root_publication_id,
        is_hidden,
        block_timestamp,
        content,
        language,
        main_content_focus,
        tags_vector,
        profile_name,
        owned_by,
        profile_metadata_url,
        handle,
    ] = row;

    return {
        publication_id,
        profile_id,
        publication_type,
        parent_publication_id,
        root_publication_id,
        is_hidden,
        block_timestamp,
        content,
        language,
        main_content_focus,
        tags_vector,
        profile_name,
        profile_metadata_url,
        handle,
        owned_by,
    };
};

export const fetchAndPrepareLensPosts = async (): Promise<UnifiedPost[]> => {
    const lensPublications = await readCSV(`./lens-publications.csv`);
    const parsedLensPublications = lensPublications.map((rowPublication) => mapCsvRowToLensPublication(rowPublication));
    return parsedLensPublications.map((post) => mapLensToUnified(post));
};
