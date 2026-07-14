-- Additive Phase 6 reliability structures. Legacy NestJS does not read these
-- tables or indexes, so it remains available as the rollback service.

CREATE INDEX comments_spu_active_created_idx
    ON public.comments USING btree (spu_id, is_active, created_at, id);

CREATE INDEX comment_closure_descendant_depth_idx
    ON public.comment_closure USING btree ("descendantId", depth, "ancestorId");

CREATE TABLE public.domain_event_outbox (
    id text PRIMARY KEY,
    aggregate_type character varying(64) NOT NULL,
    aggregate_id text NOT NULL,
    event_type character varying(128) NOT NULL,
    topic character varying(128) NOT NULL,
    event_key text NOT NULL,
    payload jsonb NOT NULL,
    status character varying(24) NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    available_at timestamp(3) without time zone NOT NULL,
    locked_at timestamp(3) without time zone,
    locked_by character varying(128),
    published_at timestamp(3) without time zone,
    last_error character varying(255),
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);

CREATE INDEX domain_event_outbox_dispatch_idx
    ON public.domain_event_outbox USING btree (status, available_at, created_at, id);

CREATE TABLE public.notification_event_receipts (
    event_id text PRIMARY KEY,
    event_topic character varying(128) NOT NULL,
    payload_sha256 character varying(64) NOT NULL,
    notification_count integer DEFAULT 0 NOT NULL,
    status character varying(24) NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);
