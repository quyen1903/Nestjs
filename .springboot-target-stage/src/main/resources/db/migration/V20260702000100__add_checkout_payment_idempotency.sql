-- Additive compatibility migration for Phase 5. NestJS ignores these columns
-- and tables, so it remains a valid rollback service during dual-run.

ALTER TABLE public.reservation_inventories
    ADD COLUMN order_id text;

ALTER TABLE public.reservation_inventories
    ADD CONSTRAINT reservation_inventories_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id)
    ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX reservation_inventories_order_id_idx
    ON public.reservation_inventories USING btree (order_id)
    WHERE order_id IS NOT NULL;

CREATE TABLE public.checkout_commands (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    request_fingerprint character varying(64) NOT NULL,
    order_ids text[] DEFAULT ARRAY[]::text[] NOT NULL,
    status character varying(24) NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL,
    CONSTRAINT checkout_commands_user_key_unique UNIQUE (user_id, idempotency_key)
);

CREATE TABLE public.payment_operations (
    id text PRIMARY KEY,
    operation_type character varying(32) NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    actor_id text NOT NULL,
    order_id text,
    request_fingerprint character varying(64) NOT NULL,
    amount_minor bigint,
    provider_object_id text,
    provider_status character varying(64),
    status character varying(24) NOT NULL,
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL,
    CONSTRAINT payment_operations_type_key_unique UNIQUE (operation_type, idempotency_key),
    CONSTRAINT payment_operations_order_id_fkey FOREIGN KEY (order_id)
        REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX payment_operations_order_id_idx
    ON public.payment_operations USING btree (order_id)
    WHERE order_id IS NOT NULL;

CREATE TABLE public.payment_events (
    event_id text PRIMARY KEY,
    event_type character varying(128) NOT NULL,
    payment_intent_id text,
    status character varying(32) NOT NULL,
    failure_code character varying(64),
    created_at bigint DEFAULT 0 NOT NULL,
    updated_at bigint DEFAULT 0 NOT NULL
);

CREATE INDEX payment_events_intent_idx
    ON public.payment_events USING btree (payment_intent_id)
    WHERE payment_intent_id IS NOT NULL;
