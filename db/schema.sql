create extension if not exists vector;

create table if not exists documents (
    id uuid primary key,
    filename text not null,
    page_count integer not null,
    char_count integer not null,
    created_at timestamptz not null default now()
);

create table if not exists document_chunks (
    id text primary key,
    document_id uuid not null references documents(id) on delete cascade,
    filename text not null,
    chunk_index integer not null,
    text text not null,
    embedding vector(1536) not null,
    token_count integer,
    page integer,
    created_at timestamptz not null default now()
);

create index if not exists document_chunks_document_id_idx
    on document_chunks(document_id);

create index if not exists document_chunks_embedding_idx
    on document_chunks
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);
