-- Compatibility-first transition: NestJS continues to read/write the existing
-- raw columns during the rollback window. Spring dual-writes keyed digests and
-- prefers them for verification. Raw-column removal is a separate post-cutover
-- migration and is intentionally not part of this change.

ALTER TABLE public.key_tokens
    ADD COLUMN refresh_token_digest character varying(64);

ALTER TABLE public.refresh_tokens_used
    ADD COLUMN refresh_token_digest character varying(64);

ALTER TABLE public.password_resets
    ADD COLUMN token_digest character varying(64);

CREATE UNIQUE INDEX key_tokens_refresh_token_digest_key
    ON public.key_tokens USING btree (refresh_token_digest)
    WHERE refresh_token_digest IS NOT NULL;

CREATE UNIQUE INDEX refresh_tokens_used_refresh_token_digest_key
    ON public.refresh_tokens_used USING btree (refresh_token_digest)
    WHERE refresh_token_digest IS NOT NULL;

CREATE UNIQUE INDEX password_resets_token_digest_key
    ON public.password_resets USING btree (token_digest)
    WHERE token_digest IS NOT NULL;
