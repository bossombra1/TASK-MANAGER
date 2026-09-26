--
-- PostgreSQL database dump
--

\restrict KrcW3lwIlaaBTZEnI7JFWWw31r1tCXwv9mUxLxrY5wsJqsh7uVR3PW3vpoUCamB

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.task_assignments DROP CONSTRAINT IF EXISTS task_assignments_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.task_assignments DROP CONSTRAINT IF EXISTS task_assignments_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.task_assignments DROP CONSTRAINT IF EXISTS task_assignments_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.super_admin_logs DROP CONSTRAINT IF EXISTS super_admin_logs_super_admin_id_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.project_members DROP CONSTRAINT IF EXISTS project_members_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.project_members DROP CONSTRAINT IF EXISTS project_members_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.project_members DROP CONSTRAINT IF EXISTS project_members_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_comment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.comments DROP CONSTRAINT IF EXISTS comments_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.comments DROP CONSTRAINT IF EXISTS comments_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.comments DROP CONSTRAINT IF EXISTS comments_author_id_fkey;
DROP INDEX IF EXISTS public.idx_notifications_user;
DROP INDEX IF EXISTS public.idx_comments_task;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.task_assignments DROP CONSTRAINT IF EXISTS task_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.super_admin_logs DROP CONSTRAINT IF EXISTS super_admin_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.project_members DROP CONSTRAINT IF EXISTS project_members_pkey;
ALTER TABLE IF EXISTS ONLY public.organizations DROP CONSTRAINT IF EXISTS organizations_slug_key;
ALTER TABLE IF EXISTS ONLY public.organizations DROP CONSTRAINT IF EXISTS organizations_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.comments DROP CONSTRAINT IF EXISTS comments_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.tasks;
DROP TABLE IF EXISTS public.task_assignments;
DROP TABLE IF EXISTS public.super_admin_logs;
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.project_members;
DROP TABLE IF EXISTS public.organizations;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.comments;
DROP EXTENSION IF EXISTS "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id uuid NOT NULL,
    task_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    type character varying(30) NOT NULL,
    task_id uuid,
    comment_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    plan character varying(50) DEFAULT 'free'::character varying,
    status character varying(50) DEFAULT 'trial'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL
);


--
-- Name: project_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_members (
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    organization_id uuid
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(150) NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'todo'::character varying NOT NULL,
    color character varying(10) DEFAULT '#E8523F'::character varying NOT NULL,
    organization_id uuid,
    CONSTRAINT projects_status_check CHECK (((status)::text = ANY ((ARRAY['todo'::character varying, 'doing'::character varying, 'done'::character varying])::text[])))
);


--
-- Name: super_admin_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.super_admin_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    super_admin_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    target_type character varying(50),
    target_id text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: task_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_assignments (
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    organization_id uuid
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    title character varying(200) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'todo'::character varying NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    start_date date,
    organization_id uuid,
    CONSTRAINT check_start_before_due CHECK (((start_date IS NULL) OR (due_date IS NULL) OR (start_date <= due_date)))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    avatar_url character varying(255),
    organization_id uuid
);


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.comments VALUES ('ee7ed4d1-e173-4b06-bb24-536e61f691b6', 'c4444444-4444-4444-4444-444444444441', 'a1111111-1111-1111-1111-111111111111', 'désolé du retard je vais me ratrapé', '2026-07-25 13:54:15.232213', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('5a50eac2-9f37-4ca2-9507-216a9e4eec5b', 'c4444444-4444-4444-4444-444444444441', 'a1111111-1111-1111-1111-111111111111', 'je suis occupé', '2026-07-25 13:55:03.223048', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('87a5d8d4-f2fd-4e61-b34a-602f9246be6e', 'c1111111-1111-1111-1111-111111111114', 'a1111111-1111-1111-1111-111111111111', 'vous êtes en retard sur cette tâche', '2026-07-25 14:02:46.427779', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('2c79b491-cb73-4722-8c5d-c637a0486811', 'c4444444-4444-4444-4444-444444444441', 'a1111111-1111-1111-1111-111111111111', 'nouveau membre', '2026-07-25 16:40:30.984717', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('92d5ebd3-10a1-4835-87ef-14ad9ebe58d6', 'c4444444-4444-4444-4444-444444444441', 'a4444444-4444-4444-4444-444444444444', 'bien reçu', '2026-07-25 16:41:21.266908', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('497a1c5a-4d23-4e4f-9815-3d9b63a6c93f', 'c2222222-2222-2222-2222-222222222221', 'a4444444-4444-4444-4444-444444444444', 'hello', '2026-07-25 16:43:30.760849', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('5c27a4a0-322a-4614-98e6-21e983f3f7a2', 'c4444444-4444-4444-4444-444444444441', 'a1111111-1111-1111-1111-111111111111', 'ok', '2026-07-25 16:50:25.646724', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('6c9353ad-6fea-4e43-aa84-bcd100c6c713', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'hello', '2026-07-25 17:23:19.9851', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('13bf91ea-4971-4675-8297-12551f39c1ee', 'c1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'comment tu vas ?', '2026-07-25 17:23:41.624337', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('728b65f9-030c-454f-8635-a09b5b81a121', 'c4444444-4444-4444-4444-444444444441', 'a4444444-4444-4444-4444-444444444444', 'recu', '2026-07-25 17:25:30.511645', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('dc140f6e-d049-4adc-a6ed-9de02bf1df41', '1385ea85-396d-460e-a40c-22850d883a44', 'a1111111-1111-1111-1111-111111111111', 'bonjour comment vous-allez', '2026-07-25 17:54:04.918635', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('d3c86032-262f-4798-bb6e-eaa39a594f3f', '1385ea85-396d-460e-a40c-22850d883a44', 'a4444444-4444-4444-4444-444444444444', 'oui je suis là les gars', '2026-07-25 18:04:36.008382', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('d9e1067b-5e32-43ed-bf38-081e2d246ad1', '1385ea85-396d-460e-a40c-22850d883a44', 'a4444444-4444-4444-4444-444444444444', 'bonjour boss', '2026-07-26 14:07:14.251136', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('bb46649f-4f02-4f4d-8eff-8240d66d6962', '1385ea85-396d-460e-a40c-22850d883a44', 'a4444444-4444-4444-4444-444444444444', 'comment vous allez?', '2026-07-26 14:07:29.738337', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.comments VALUES ('39172bdf-f6f1-4d7c-bf94-691854f48ff2', '1385ea85-396d-460e-a40c-22850d883a44', 'a4444444-4444-4444-4444-444444444444', 'sa va bien et vous?', '2026-07-26 18:22:17.378291', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications VALUES ('0062916d-0efc-4cee-8858-c4ed799a4146', 'a4444444-4444-4444-4444-444444444444', 'new_comment', 'c4444444-4444-4444-4444-444444444441', '2c79b491-cb73-4722-8c5d-c637a0486811', true, '2026-07-25 16:40:31.012305', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('c63ef1b7-0b95-4f26-b6ff-c51a9868a5f2', 'a4444444-4444-4444-4444-444444444444', 'new_comment', 'c4444444-4444-4444-4444-444444444441', 'ee7ed4d1-e173-4b06-bb24-536e61f691b6', true, '2026-07-25 13:54:15.365786', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('fa76fa27-71db-4a57-bcff-9dfbd6956f23', 'a4444444-4444-4444-4444-444444444444', 'new_comment', 'c4444444-4444-4444-4444-444444444441', '5a50eac2-9f37-4ca2-9507-216a9e4eec5b', true, '2026-07-25 13:55:03.235176', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('77767317-5553-4122-88fc-2b8db2b58579', 'a4444444-4444-4444-4444-444444444444', 'new_comment', 'c1111111-1111-1111-1111-111111111114', '87a5d8d4-f2fd-4e61-b34a-602f9246be6e', true, '2026-07-25 14:02:46.440444', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('d0c3b92a-a69a-4e84-8213-d72dc678687e', 'a3333333-3333-3333-3333-333333333333', 'new_comment', 'c1111111-1111-1111-1111-111111111111', '6c9353ad-6fea-4e43-aa84-bcd100c6c713', true, '2026-07-25 17:23:20.039074', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('a4bf5390-96b2-4521-bbc3-eeb819810a20', 'a4444444-4444-4444-4444-444444444444', 'new_comment', 'c4444444-4444-4444-4444-444444444441', '5c27a4a0-322a-4614-98e6-21e983f3f7a2', true, '2026-07-25 16:50:25.700024', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('3970f271-e868-48d2-b484-d3bd0f1d88a7', 'a1111111-1111-1111-1111-111111111111', 'new_comment', 'c4444444-4444-4444-4444-444444444441', '728b65f9-030c-454f-8635-a09b5b81a121', true, '2026-07-25 17:25:30.516618', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('9c93fcc8-6c33-4a96-a3ad-2d226f426f51', 'a1111111-1111-1111-1111-111111111111', 'new_comment', 'c1111111-1111-1111-1111-111111111111', '13bf91ea-4971-4675-8297-12551f39c1ee', true, '2026-07-25 17:23:41.635878', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('ed8a624e-0108-443e-b0a1-37d8a6ac173b', 'a4444444-4444-4444-4444-444444444444', 'new_comment', '1385ea85-396d-460e-a40c-22850d883a44', 'dc140f6e-d049-4adc-a6ed-9de02bf1df41', true, '2026-07-25 17:54:04.932994', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('1f1e0d1b-a908-4336-9d39-dccd4bfd0ead', 'a2222222-2222-2222-2222-222222222222', 'new_comment', '1385ea85-396d-460e-a40c-22850d883a44', 'dc140f6e-d049-4adc-a6ed-9de02bf1df41', true, '2026-07-25 17:54:04.937566', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('0d3ee513-1ccd-4638-94ec-2fdef1202ce4', 'a2222222-2222-2222-2222-222222222222', 'new_comment', '1385ea85-396d-460e-a40c-22850d883a44', 'd3c86032-262f-4798-bb6e-eaa39a594f3f', false, '2026-07-25 18:04:36.022797', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('15f4a5e1-abfc-4a20-b881-4199a0d0a142', 'a1111111-1111-1111-1111-111111111111', 'new_comment', '1385ea85-396d-460e-a40c-22850d883a44', 'd3c86032-262f-4798-bb6e-eaa39a594f3f', true, '2026-07-25 18:04:36.063542', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('e4069475-aebe-4769-9642-06d2ab8d23c0', 'a2222222-2222-2222-2222-222222222222', 'new_comment', '1385ea85-396d-460e-a40c-22850d883a44', 'd9e1067b-5e32-43ed-bf38-081e2d246ad1', false, '2026-07-26 14:07:14.319283', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('45a6fe7c-3a49-4b5f-a091-8400ba65f0d9', 'a2222222-2222-2222-2222-222222222222', 'new_comment', '1385ea85-396d-460e-a40c-22850d883a44', 'bb46649f-4f02-4f4d-8eff-8240d66d6962', false, '2026-07-26 14:07:29.76584', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('2c7344ac-ff6a-4b00-8060-b90f61fc63a1', 'a1111111-1111-1111-1111-111111111111', 'new_comment', '1385ea85-396d-460e-a40c-22850d883a44', 'bb46649f-4f02-4f4d-8eff-8240d66d6962', true, '2026-07-26 14:07:29.780462', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('680c0ace-88d4-4df3-9c64-4df7e0994ccd', 'a1111111-1111-1111-1111-111111111111', 'new_comment', '1385ea85-396d-460e-a40c-22850d883a44', 'd9e1067b-5e32-43ed-bf38-081e2d246ad1', true, '2026-07-26 14:07:14.321382', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('d654ba32-ec4d-432e-899f-341fc63d1a46', 'a2222222-2222-2222-2222-222222222222', 'new_comment', '1385ea85-396d-460e-a40c-22850d883a44', '39172bdf-f6f1-4d7c-bf94-691854f48ff2', false, '2026-07-26 18:22:17.382657', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.notifications VALUES ('43fc4211-e0ad-43c8-b209-93a5de133f84', 'a1111111-1111-1111-1111-111111111111', 'new_comment', '1385ea85-396d-460e-a40c-22850d883a44', '39172bdf-f6f1-4d7c-bf94-691854f48ff2', false, '2026-07-26 18:22:17.438997', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.organizations VALUES ('NEURONES', 'neurones', 'free', 'active', '2026-08-19 11:00:31.091645', '02c0768d-6b3b-4b46-bc6c-ff3451c08bee');
INSERT INTO public.organizations VALUES ('nouvelle', 'ma-nouvelle-entreprise', 'free', 'suspended', '2026-08-10 14:41:45.118119', 'bf88fce0-f350-4cf3-98d3-31baf1e4bcc9');
INSERT INTO public.organizations VALUES ('RTI1', 'rti1', 'free', 'active', '2026-08-25 18:44:27.914971', 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.organizations VALUES ('SODECI', 'org-initiale', 'enterprise', 'active', '2026-08-03 10:24:05.752866', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.organizations VALUES ('DGMP', 'dgmp', 'pro', 'active', '2026-08-11 15:36:45.882488', 'ed417138-5efd-4db5-a58d-364d92d2a02e');


--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_members VALUES ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('b1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('b2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('b3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('b4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('b4444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('b2222222-2222-2222-2222-222222222222', 'e95856b2-0faf-4b5a-85ba-116ef61c87ac', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('b2222222-2222-2222-2222-222222222222', '98acff0c-6bd9-49ed-b2fb-c9d73d2f661d', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('ff925b19-030a-46fa-856f-9b8969bf9c9d', 'e95856b2-0faf-4b5a-85ba-116ef61c87ac', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('ff925b19-030a-46fa-856f-9b8969bf9c9d', '98acff0c-6bd9-49ed-b2fb-c9d73d2f661d', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('ff925b19-030a-46fa-856f-9b8969bf9c9d', 'a2222222-2222-2222-2222-222222222222', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('ff925b19-030a-46fa-856f-9b8969bf9c9d', 'a4444444-4444-4444-4444-444444444444', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('ff925b19-030a-46fa-856f-9b8969bf9c9d', 'a3333333-3333-3333-3333-333333333333', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('ff925b19-030a-46fa-856f-9b8969bf9c9d', '487bf466-ee01-4817-96e9-9d46b11970b3', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('99c6efbd-3511-4946-954a-07ad1c9e9d78', '2dface6c-1156-4b43-82bd-7be58994628f', 'ed417138-5efd-4db5-a58d-364d92d2a02e');
INSERT INTO public.project_members VALUES ('99c6efbd-3511-4946-954a-07ad1c9e9d78', '270b8a22-1ef5-4d61-9887-9001a4f26423', 'ed417138-5efd-4db5-a58d-364d92d2a02e');
INSERT INTO public.project_members VALUES ('1cff43d5-f2e8-4250-8554-5b73a9d3fbd9', '270b8a22-1ef5-4d61-9887-9001a4f26423', 'ed417138-5efd-4db5-a58d-364d92d2a02e');
INSERT INTO public.project_members VALUES ('ab007f20-b349-4327-94d9-6d23a835ddc1', '97ca3233-75b3-444f-8f1d-193f22e92b6c', '02c0768d-6b3b-4b46-bc6c-ff3451c08bee');
INSERT INTO public.project_members VALUES ('ab007f20-b349-4327-94d9-6d23a835ddc1', 'e60afb9c-53b5-4448-ab0d-250a9da95b17', '02c0768d-6b3b-4b46-bc6c-ff3451c08bee');
INSERT INTO public.project_members VALUES ('4f5c2378-c59d-4fa1-bbc6-94ec821bc73e', '5826a38b-4058-4640-842f-53505c6a8add', 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.project_members VALUES ('4f5c2378-c59d-4fa1-bbc6-94ec821bc73e', '002ae44c-50a9-4a72-aee2-89610ad47268', 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.project_members VALUES ('4f5c2378-c59d-4fa1-bbc6-94ec821bc73e', '6cfebe9d-3249-437b-bd3b-4ecb2da54272', 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.project_members VALUES ('4f5c2378-c59d-4fa1-bbc6-94ec821bc73e', '29aa044f-8f5e-4d26-8958-a35ff1681e30', 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.project_members VALUES ('5a83dd41-513c-4187-bf54-d04486a17dcc', 'a1111111-1111-1111-1111-111111111111', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('5a83dd41-513c-4187-bf54-d04486a17dcc', 'e95856b2-0faf-4b5a-85ba-116ef61c87ac', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('5a83dd41-513c-4187-bf54-d04486a17dcc', 'a2222222-2222-2222-2222-222222222222', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.project_members VALUES ('5a83dd41-513c-4187-bf54-d04486a17dcc', 'a4444444-4444-4444-4444-444444444444', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.projects VALUES ('b1111111-1111-1111-1111-111111111111', 'Site web', 'Nouveau site vitrine + espace client, livraison prévue avant la rentrée.', 'a1111111-1111-1111-1111-111111111111', '2026-07-25 11:17:07.472811+00', 'doing', '#E8523F', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.projects VALUES ('b2222222-2222-2222-2222-222222222222', 'App mobile CESA', 'Application de suivi des notes et emplois du temps pour les élèves.', 'a1111111-1111-1111-1111-111111111111', '2026-07-25 11:17:07.472811+00', 'doing', '#6C5CE7', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.projects VALUES ('b3333333-3333-3333-3333-333333333333', 'Campagne rentrée', 'Communication et supports visuels pour la rentrée scolaire 2026.', 'a1111111-1111-1111-1111-111111111111', '2026-07-25 11:17:07.472811+00', 'done', '#E0A62E', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.projects VALUES ('b4444444-4444-4444-4444-444444444444', 'Support et maintenance', 'Tickets et demandes récurrentes des utilisateurs internes.', 'a1111111-1111-1111-1111-111111111111', '2026-07-25 11:17:07.472811+00', 'done', '#2F9E44', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.projects VALUES ('5a83dd41-513c-4187-bf54-d04486a17dcc', 'ajourd''hui', 'c''est vendredi', 'a1111111-1111-1111-1111-111111111111', '2026-09-25 20:24:29.506118+00', 'todo', '#E8523F', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.projects VALUES ('99c6efbd-3511-4946-954a-07ad1c9e9d78', 'gestion de stock', 'gestionnaires', '270b8a22-1ef5-4d61-9887-9001a4f26423', '2026-08-11 16:00:57.217787+00', 'doing', '#E8523F', 'ed417138-5efd-4db5-a58d-364d92d2a02e');
INSERT INTO public.projects VALUES ('ab007f20-b349-4327-94d9-6d23a835ddc1', 'site web', 'bndsjge', '97ca3233-75b3-444f-8f1d-193f22e92b6c', '2026-08-19 11:04:14.428377+00', 'done', '#3B7DDD', '02c0768d-6b3b-4b46-bc6c-ff3451c08bee');
INSERT INTO public.projects VALUES ('4f5c2378-c59d-4fa1-bbc6-94ec821bc73e', 'hihui', 'kjnj', '5826a38b-4058-4640-842f-53505c6a8add', '2026-08-26 17:45:06.436688+00', 'doing', '#E8523F', 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.projects VALUES ('1cff43d5-f2e8-4250-8554-5b73a9d3fbd9', 'e-commerce', 'exemple de jumia', '270b8a22-1ef5-4d61-9887-9001a4f26423', '2026-08-11 16:04:34.214625+00', 'done', '#E8523F', 'ed417138-5efd-4db5-a58d-364d92d2a02e');
INSERT INTO public.projects VALUES ('ff925b19-030a-46fa-856f-9b8969bf9c9d', 'Marketplace locale multi-vendeurs', '• Un client peut parcourir le catalogue, filtrer par catégorie/prix, ajouter au panier et passer commande
• Gestion du panier persistant (même après rafraîchissement de page)
• Simulation de paiement (pas de vraie intégration bancaire requise, un simple flux de validation suffit)
• Suivi de commande pour le client (en préparation / expédiée / livrée)
• Tableau de bord vendeur (ses produits, ses ventes, commandes reçues)
• Tableau de bord administrateur (validation des nouveaux vendeurs, modération des produits)', 'a1111111-1111-1111-1111-111111111111', '2026-07-26 21:12:12.95113+00', 'doing', '#2F9E44', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');


--
-- Data for Name: super_admin_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.super_admin_logs VALUES ('4b34c8da-aff1-42bb-8445-264a0db27355', '25deb3a3-8879-4b51-8159-af8d648d481a', 'toggle_organization_status', 'organization', '1', '{"newStatus": "active"}', '2026-08-21 12:14:24.306259+00');
INSERT INTO public.super_admin_logs VALUES ('94bd3e0e-c433-429b-b08a-d4d8e22eefb6', '25deb3a3-8879-4b51-8159-af8d648d481a', 'toggle_organization_status', 'organization', '1', '{"newStatus": "suspended"}', '2026-08-21 12:14:28.317933+00');
INSERT INTO public.super_admin_logs VALUES ('c5fee9f4-d30b-4684-b5cc-3c2a395d5113', '25deb3a3-8879-4b51-8159-af8d648d481a', 'toggle_organization_status', 'organization', '1', '{"newStatus": "active"}', '2026-08-21 12:15:00.407733+00');
INSERT INTO public.super_admin_logs VALUES ('3c56ca50-7a63-4b77-830c-39f226c8bf7b', '25deb3a3-8879-4b51-8159-af8d648d481a', 'create_organization', 'organization', '5', '{"adminEmail": "rti@taskmanager.com", "organizationName": "RTI1"}', '2026-08-25 18:44:28.681174+00');
INSERT INTO public.super_admin_logs VALUES ('c5a2e80e-bdfc-4369-ba68-3770520788a3', '25deb3a3-8879-4b51-8159-af8d648d481a', 'toggle_organization_status', 'organization', '2', '{"newStatus": "suspended"}', '2026-08-25 22:35:18.717886+00');
INSERT INTO public.super_admin_logs VALUES ('22bec516-111b-4891-9cf6-3fd1e04f80cf', '25deb3a3-8879-4b51-8159-af8d648d481a', 'update_organization_plan', 'organization', '5', '{"newPlan": "pro"}', '2026-08-26 12:53:26.538825+00');
INSERT INTO public.super_admin_logs VALUES ('3edb4a36-73dc-49ea-b358-75e86b2854a8', '25deb3a3-8879-4b51-8159-af8d648d481a', 'update_organization_plan', 'organization', '5', '{"newPlan": "free"}', '2026-08-26 12:53:58.524121+00');
INSERT INTO public.super_admin_logs VALUES ('5d8b57f7-d44b-44cb-8796-9450cd1bd069', '25deb3a3-8879-4b51-8159-af8d648d481a', 'toggle_organization_status', 'organization', '3', '{"newStatus": "suspended"}', '2026-08-26 12:54:03.06649+00');
INSERT INTO public.super_admin_logs VALUES ('340f57ee-e4d6-4e39-9b53-7433c4d8375b', '25deb3a3-8879-4b51-8159-af8d648d481a', 'toggle_organization_status', 'organization', '3', '{"newStatus": "active"}', '2026-08-26 12:54:05.348267+00');
INSERT INTO public.super_admin_logs VALUES ('9726f845-a411-48ba-9055-311cc57b885e', '25deb3a3-8879-4b51-8159-af8d648d481a', 'update_organization_plan', 'organization', '3', '{"newPlan": "pro"}', '2026-08-26 12:54:09.433742+00');
INSERT INTO public.super_admin_logs VALUES ('2b7d87a1-77d7-4cdc-8a63-e694f0fe69d3', '25deb3a3-8879-4b51-8159-af8d648d481a', 'toggle_organization_status', 'organization', '1', '{"newStatus": "suspended"}', '2026-08-26 18:49:09.948545+00');
INSERT INTO public.super_admin_logs VALUES ('f227f74c-58c0-46a2-b0d5-003e4dbb68da', '25deb3a3-8879-4b51-8159-af8d648d481a', 'toggle_organization_status', 'organization', '1', '{"newStatus": "active"}', '2026-08-26 18:49:11.597258+00');
INSERT INTO public.super_admin_logs VALUES ('2144e0d2-a125-436b-9775-a833750b2fa5', '25deb3a3-8879-4b51-8159-af8d648d481a', 'update_organization_plan', 'organization', 'ed417138-5efd-4db5-a58d-364d92d2a02e', '{"newPlan": "free"}', '2026-08-26 20:10:00.172704+00');
INSERT INTO public.super_admin_logs VALUES ('d38bc181-9c36-4229-b3a9-759b32484e38', '25deb3a3-8879-4b51-8159-af8d648d481a', 'update_organization_plan', 'organization', 'ed417138-5efd-4db5-a58d-364d92d2a02e', '{"newPlan": "pro"}', '2026-08-26 20:10:37.071017+00');


--
-- Data for Name: task_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.task_assignments VALUES ('c1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('c1111111-1111-1111-1111-111111111112', 'a1111111-1111-1111-1111-111111111111', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('c1111111-1111-1111-1111-111111111113', 'a1111111-1111-1111-1111-111111111111', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('c1111111-1111-1111-1111-111111111114', 'a4444444-4444-4444-4444-444444444444', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('c1111111-1111-1111-1111-111111111115', 'a3333333-3333-3333-3333-333333333333', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('c2222222-2222-2222-2222-222222222221', 'a4444444-4444-4444-4444-444444444444', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('c2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('c3333333-3333-3333-3333-333333333331', 'a3333333-3333-3333-3333-333333333333', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('c3333333-3333-3333-3333-333333333332', 'a1111111-1111-1111-1111-111111111111', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('c4444444-4444-4444-4444-444444444441', 'a4444444-4444-4444-4444-444444444444', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('1385ea85-396d-460e-a40c-22850d883a44', 'a4444444-4444-4444-4444-444444444444', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('1385ea85-396d-460e-a40c-22850d883a44', 'a2222222-2222-2222-2222-222222222222', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('4fb3d022-0f0a-41a8-9684-4f8bf7061f21', 'a2222222-2222-2222-2222-222222222222', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('4fb3d022-0f0a-41a8-9684-4f8bf7061f21', 'e95856b2-0faf-4b5a-85ba-116ef61c87ac', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('e8fbae92-2240-4702-9574-6345e4ad1566', 'a3333333-3333-3333-3333-333333333333', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('e8fbae92-2240-4702-9574-6345e4ad1566', 'e95856b2-0faf-4b5a-85ba-116ef61c87ac', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('e8fbae92-2240-4702-9574-6345e4ad1566', 'a2222222-2222-2222-2222-222222222222', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('e72e5486-6444-4cb6-81ea-8cb3e5141b97', 'e95856b2-0faf-4b5a-85ba-116ef61c87ac', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('4cbcde91-977f-4516-b4d7-a5b573467bdd', '270b8a22-1ef5-4d61-9887-9001a4f26423', 'ed417138-5efd-4db5-a58d-364d92d2a02e');
INSERT INTO public.task_assignments VALUES ('cc04f8eb-3a67-46a8-88f5-1f523cd72c06', '270b8a22-1ef5-4d61-9887-9001a4f26423', 'ed417138-5efd-4db5-a58d-364d92d2a02e');
INSERT INTO public.task_assignments VALUES ('bbe04569-542f-47f3-a16c-0527864666fc', 'e60afb9c-53b5-4448-ab0d-250a9da95b17', '02c0768d-6b3b-4b46-bc6c-ff3451c08bee');
INSERT INTO public.task_assignments VALUES ('b48e57ec-eb86-4167-9739-d894e0978bef', 'a2222222-2222-2222-2222-222222222222', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.task_assignments VALUES ('b48e57ec-eb86-4167-9739-d894e0978bef', 'a4444444-4444-4444-4444-444444444444', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tasks VALUES ('c1111111-1111-1111-1111-111111111114', 'b1111111-1111-1111-1111-111111111111', 'Tests responsive mobile', 'Vérifier l''affichage sur les principaux breakpoints mobiles.', 'done', 'high', '2026-08-23 00:00:00+00', '2026-07-25 11:17:07.472811+00', '2026-05-20', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Maquettes page d''accueil', 'Wireframes et maquettes haute-fidélité de la home.', 'todo', 'medium', '2026-10-12 00:00:00+00', '2026-07-25 11:17:07.472811+00', '2026-08-10', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('c1111111-1111-1111-1111-111111111112', 'b1111111-1111-1111-1111-111111111111', 'Mise en place JWT auth', 'Authentification backend avec tokens JWT.', 'done', 'high', '2026-07-05 00:00:00+00', '2026-07-25 11:17:07.472811+00', '2026-04-07', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('c2222222-2222-2222-2222-222222222221', 'b2222222-2222-2222-2222-222222222222', 'Setup Flutter du projet', 'Initialisation de l''architecture technique de l''app.', 'doing', 'high', '2026-07-15 00:00:00+00', '2026-07-25 11:17:07.472811+00', '2026-02-06', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('c1111111-1111-1111-1111-111111111113', 'b1111111-1111-1111-1111-111111111111', 'Intégration formulaire de contact', 'Connecter le formulaire à l''API avec validation des champs.', 'done', 'high', '2026-07-16 00:00:00+00', '2026-07-25 11:17:07.472811+00', '2026-01-13', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('c4444444-4444-4444-4444-444444444441', 'b4444444-4444-4444-4444-444444444444', 'Ticket #245 — bug connexion', 'Un utilisateur signale une déconnexion intempestive.', 'done', 'high', '2026-07-19 00:00:00+00', '2026-07-25 11:17:07.472811+00', '2026-03-12', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('c3333333-3333-3333-3333-333333333332', 'b3333333-3333-3333-3333-333333333333', 'Impression flyers', 'Commande et impression des flyers de rentrée.', 'done', 'low', '2026-07-22 00:00:00+00', '2026-07-25 11:17:07.472811+00', '2026-07-08', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('c1111111-1111-1111-1111-111111111115', 'b1111111-1111-1111-1111-111111111111', 'Optimisation images', 'Compression et lazy-loading des visuels du site.', 'done', 'medium', '2026-07-28 00:00:00+00', '2026-07-25 11:17:07.472811+00', '2026-05-05', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('1385ea85-396d-460e-a40c-22850d883a44', 'b4444444-4444-4444-4444-444444444444', 'réparation écran blue', 'changer le système et rédémarer le bios du pc', 'done', 'medium', '2026-07-28 00:00:00+00', '2026-07-25 17:52:37.81238+00', NULL, 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('1140e6ba-b5a0-476f-8d24-c90c2ee0d475', '1cff43d5-f2e8-4250-8554-5b73a9d3fbd9', 'qdfe', 'csfs', 'done', 'medium', '2026-09-04 00:00:00+00', '2026-08-26 20:11:01.628549+00', '2026-08-28', 'ed417138-5efd-4db5-a58d-364d92d2a02e');
INSERT INTO public.tasks VALUES ('5657490b-0b48-4772-8273-46e61ba869b4', '5a83dd41-513c-4187-bf54-d04486a17dcc', 'formulaire', 'ajouter', 'todo', 'medium', '2026-09-27 00:00:00+00', '2026-09-25 20:25:01.978801+00', '2026-09-18', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('4cbcde91-977f-4516-b4d7-a5b573467bdd', '99c6efbd-3511-4946-954a-07ad1c9e9d78', 'crée un image', 'image de naruto', 'done', 'medium', '2026-08-13 00:00:00+00', '2026-08-11 16:01:32.426983+00', NULL, 'ed417138-5efd-4db5-a58d-364d92d2a02e');
INSERT INTO public.tasks VALUES ('cc04f8eb-3a67-46a8-88f5-1f523cd72c06', '99c6efbd-3511-4946-954a-07ad1c9e9d78', 'magasin', 'gestionnaire des magasins', 'todo', 'medium', '2026-08-05 00:00:00+00', '2026-08-11 16:02:16.944988+00', NULL, 'ed417138-5efd-4db5-a58d-364d92d2a02e');
INSERT INTO public.tasks VALUES ('bbe04569-542f-47f3-a16c-0527864666fc', 'ab007f20-b349-4327-94d9-6d23a835ddc1', 'maquette', 'faire une maquette', 'done', 'medium', '2026-08-22 00:00:00+00', '2026-08-19 11:04:47.089531+00', NULL, '02c0768d-6b3b-4b46-bc6c-ff3451c08bee');
INSERT INTO public.tasks VALUES ('c3333333-3333-3333-3333-333333333331', 'b3333333-3333-3333-3333-333333333333', 'Visuels réseaux sociaux', 'Bannières et posts pour Facebook/Instagram.', 'done', 'medium', '2026-07-01 00:00:00+00', '2026-07-25 11:17:07.472811+00', '2026-04-05', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('4fb3d022-0f0a-41a8-9684-4f8bf7061f21', 'b2222222-2222-2222-2222-222222222222', 'devoir', 'examen de session', 'done', 'medium', '2026-08-06 00:00:00+00', '2026-07-26 21:10:27.645622+00', '2026-06-06', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('e72e5486-6444-4cb6-81ea-8cb3e5141b97', 'b2222222-2222-2222-2222-222222222222', 'gestion de bd', 'gestion de bd', 'done', 'low', '2026-08-27 00:00:00+00', '2026-08-10 13:26:00.86411+00', '2026-08-06', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Spécification des écrans', 'Cahier des charges fonctionnel des écrans principaux.', 'doing', 'medium', '2026-07-31 00:00:00+00', '2026-07-25 11:17:07.472811+00', '2026-07-20', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('b48e57ec-eb86-4167-9739-d894e0978bef', 'b4444444-4444-4444-4444-444444444444', 'calcule', 'nos calcule', 'todo', 'low', '2026-09-06 00:00:00+00', '2026-08-21 10:37:47.831975+00', '2026-08-21', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('7c047c94-2e34-42ff-9680-8a825c8aa715', '4f5c2378-c59d-4fa1-bbc6-94ec821bc73e', 'qfqef', 'sfvsv', 'doing', 'medium', '2026-09-04 00:00:00+00', '2026-08-26 19:22:35.774446+00', '2026-08-09', 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.tasks VALUES ('38d1955f-1db6-454d-8b84-14ac235124dd', 'ff925b19-030a-46fa-856f-9b8969bf9c9d', 'hello', 'elle', 'todo', 'medium', '2026-09-05 00:00:00+00', '2026-08-26 09:15:57.611004+00', '2026-08-26', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.tasks VALUES ('e8fbae92-2240-4702-9574-6345e4ad1566', 'ff925b19-030a-46fa-856f-9b8969bf9c9d', 'Trois types de comptes : client, vendeur, administrateur', 'Un vendeur peut créer/modifier/supprimer ses propres produits (nom, prix, stock, image, description)', 'done', 'high', '2026-08-07 00:00:00+00', '2026-07-26 21:13:17.685283+00', NULL, 'cb861c7b-3963-476c-8ee5-d0a36be57cff');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('5826a38b-4058-4640-842f-53505c6a8add', 'Frabrice', 'rti@taskmanager.com', '$2b$10$U4Edgd7bberlsQozkq9Nkelpu79hnacU0yS8g6VPmRYfkqQY4VCtC', 'admin', true, '2026-08-25 18:44:27.914971+00', '/uploads/avatars/5826a38b-4058-4640-842f-53505c6a8add-1787771155230.jpg', 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.users VALUES ('a2222222-2222-2222-2222-222222222222', 'Moussa Diallo', 'moussa.diallo@taskly.io', '$2b$10$Dxpf18t3iufWF5Vkkjt1w.32JoJPoMKn0qboYDxfMap5InPnrvAQS', 'user', true, '2026-07-25 11:17:07.472811+00', NULL, 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.users VALUES ('a3333333-3333-3333-3333-333333333333', 'Sarah Yao', 'sarah.yao@taskly.io', '$2b$10$Dxpf18t3iufWF5Vkkjt1w.32JoJPoMKn0qboYDxfMap5InPnrvAQS', 'user', true, '2026-07-25 11:17:07.472811+00', NULL, 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.users VALUES ('a4444444-4444-4444-4444-444444444444', 'Jean Toure', 'jean.toure@taskly.io', '$2b$10$Dxpf18t3iufWF5Vkkjt1w.32JoJPoMKn0qboYDxfMap5InPnrvAQS', 'user', true, '2026-07-25 11:17:07.472811+00', '/uploads/avatars/a4444444-4444-4444-4444-444444444444-1785022739593.jpg', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.users VALUES ('25deb3a3-8879-4b51-8159-af8d648d481a', 'Super Admin', 'superadmin@taskmanager.com', '$2b$10$PBeyBHpLLdM970rVOI6wK.Q.2zFZqTrOzlKfs32L3MAP7BTcaII7S', 'super_admin', true, '2026-08-21 11:08:16.326758+00', NULL, NULL);
INSERT INTO public.users VALUES ('a1111111-1111-1111-1111-111111111111', 'Awa Koffi', 'awa.koffi@taskly.io', '$2b$10$PTjHmqjUe58IUoiSGCBhR.kAUDnX0KSa3pOBH3dKG8MjEk7fgYMGa', 'admin', true, '2026-07-25 11:17:07.472811+00', '/uploads/avatars/a1111111-1111-1111-1111-111111111111-1785027448976.jpg', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.users VALUES ('483704d7-16d8-4bdc-b606-da6e566ec2eb', 'Administrateur Principal', 'admin@taskmanager.com', '$2b$10$X/9bhIEAZafw5ltUMthR7uRitTg2OHSNXQjv.w2G.CsXA848j19YW', 'admin', true, '2026-07-24 14:16:45.142768+00', '/uploads/avatars/483704d7-16d8-4bdc-b606-da6e566ec2eb-1785027694711.jpeg', 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.users VALUES ('487bf466-ee01-4817-96e9-9d46b11970b3', 'regis kouame', 'regiskouame@gmail.com', '$2b$10$VypF.gRX6LEZV.QUplwfaurny5qGN9T0YCBqG3vA18w2N5s/i6e2q', 'user', true, '2026-07-26 12:51:09.697565+00', NULL, 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.users VALUES ('e95856b2-0faf-4b5a-85ba-116ef61c87ac', 'Adayé Emmanuel', 'adaye.emmanuel@taskly.io', '$2b$10$li3WR.bfpyd41YDossK0ye/OOmXH9HS98bQjoKclS/So5nE5UUv.G', 'user', true, '2026-07-26 20:18:31.051283+00', NULL, 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.users VALUES ('98acff0c-6bd9-49ed-b2fb-c9d73d2f661d', 'rose kady', 'rose@taskly.io', '$2b$10$6TbaiQ3jBenRmSqh3RZQROVWFs4ueGjNgcyf3Rxp3gisraCPq.b3G', 'user', true, '2026-07-26 20:21:09.15994+00', NULL, 'cb861c7b-3963-476c-8ee5-d0a36be57cff');
INSERT INTO public.users VALUES ('1318a833-e572-40d9-8ef5-3afbf3015b19', 'Jean Dupont', 'jean@nouvelle-entreprise.com', '$2b$10$t3IDd8M5nAKuLXLXi1Y4qet0U6AVlYTpiKdb5tSyiILTWfh1rIBe2', 'admin', true, '2026-08-10 14:41:45.118119+00', NULL, 'bf88fce0-f350-4cf3-98d3-31baf1e4bcc9');
INSERT INTO public.users VALUES ('270b8a22-1ef5-4d61-9887-9001a4f26423', 'Coulibaly David', 'coulibaly@taskly.io', '$2b$10$v8xXt3UsWywaGgt5rNvVr.I10vg3VtUjt0.47v4zLTPxd5MHNwz9.', 'admin', true, '2026-08-11 15:36:45.882488+00', NULL, 'ed417138-5efd-4db5-a58d-364d92d2a02e');
INSERT INTO public.users VALUES ('2dface6c-1156-4b43-82bd-7be58994628f', 'Bossombra Ba', 'bossombra@taskly.io', '$2b$10$PDcGKN6KXyLJU67jBjOVf.47U6Qj9XAgonPAPBQgPXqbxSV7x/4ZG', 'user', true, '2026-08-11 16:00:25.056233+00', NULL, 'ed417138-5efd-4db5-a58d-364d92d2a02e');
INSERT INTO public.users VALUES ('e60afb9c-53b5-4448-ab0d-250a9da95b17', 'regis k', 'regisk@taskly.io', '$2b$10$egdGas0.1grAfWvo4p7/huHwFep14bs9oL.Lq8RTcNBPg98oh0OjS', 'user', true, '2026-08-19 11:06:41.298346+00', NULL, '02c0768d-6b3b-4b46-bc6c-ff3451c08bee');
INSERT INTO public.users VALUES ('97ca3233-75b3-444f-8f1d-193f22e92b6c', 'NEURONE ANGRE', 'neurone@taskly.io', '$2b$10$Ahg/dYI9knZwjqEnJdM9m.Ui3ZJVnUUbKmln8IBT4fWbsM.04mruG', 'admin', true, '2026-08-19 11:00:31.091645+00', NULL, '02c0768d-6b3b-4b46-bc6c-ff3451c08bee');
INSERT INTO public.users VALUES ('6cfebe9d-3249-437b-bd3b-4ecb2da54272', 'arafat konan', 'a@taskmanager.com', '$2b$10$KXu065HbWHygdVAAoJFvVOsEoAoYUa31wgVl.wSzbr6S9MHdy0s86', 'user', true, '2026-08-26 09:22:44.114263+00', NULL, 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.users VALUES ('4783f217-7b15-43c3-b339-f94f2f82e17e', 'serge aurier', 's@taskmanager.com', '$2b$10$Ogfc/lLqbuoL28WL12k4yuOw0g0XHNnG3KBnaWB11z3yqB51Wax1C', 'user', true, '2026-08-26 09:23:21.662993+00', NULL, 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.users VALUES ('d47211ef-4e96-418e-b9bd-dd2aa68e5f8a', 'adingra haller', 'h@taskmanager.com', '$2b$10$Zl.zWQ3wFZFm3sYxWeEjQOYIpRjhD5FvtPNkrCxH9BfrOwhfVKRTC', 'user', true, '2026-08-26 09:23:52.528608+00', NULL, 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.users VALUES ('29aa044f-8f5e-4d26-8958-a35ff1681e30', 'amadou kone', 'k@taskmanager.com', '$2b$10$ezRDoWJJv3S9sftztau4lublsq96HihA38JN5w8dBimSojnSBrYVK', 'user', true, '2026-08-26 09:24:20.432958+00', NULL, 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.users VALUES ('002ae44c-50a9-4a72-aee2-89610ad47268', 'fofana yaya', 'y@taskmanager.com', '$2b$10$CcLMkDurdSbIYJ/8IdxmFO.i26NoMafoCqgL7.j3gdoUHWZgOo6zu', 'user', true, '2026-08-26 09:24:48.73324+00', NULL, 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.users VALUES ('8f974d74-1a51-4b03-8266-8d9be05cc59f', 'adama touré', 't@taskmanager.com', '$2b$10$RKki1Ux30ewowzhDwLla/ukngXPs4ruOuIK4C0AeVhwsFFQOMnjBe', 'user', true, '2026-08-26 10:25:43.065076+00', NULL, 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.users VALUES ('65b564da-e5e7-4775-a015-f3b45b93079e', 'bossombra kouame', 'b@taskmanager.com', '$2b$10$3hjDvAXvid4VF8oDOlt5QOQSHbzhapdDfIe.DpoFFr42mogFWlHYG', 'user', true, '2026-08-26 10:26:09.051584+00', NULL, 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.users VALUES ('fa3f133c-4b89-4127-80dc-ec22a0140364', 'mamadou Lo', 'lo@taskmanager.com', '$2b$10$h8v0DghwuV1TYL4ExxWoNegw7sWYEv0LnJeXHMr6b2k4ZZm25Onxi', 'user', true, '2026-08-26 10:26:36.97221+00', NULL, 'b098c8e1-7307-4d2b-a299-4fb686b7493d');
INSERT INTO public.users VALUES ('833be505-16a5-4135-99bc-8c466c714ab1', 'Lohi Gon', 'g@taskmanager.com', '$2b$10$BCRPcvF59U68.c.DmRAGNOf8.CRZdT3vsnwx6OEkbUmX4a9ibK9wu', 'user', true, '2026-08-26 10:27:23.715202+00', NULL, 'b098c8e1-7307-4d2b-a299-4fb686b7493d');


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (project_id, user_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: super_admin_logs super_admin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_admin_logs
    ADD CONSTRAINT super_admin_logs_pkey PRIMARY KEY (id);


--
-- Name: task_assignments task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (task_id, user_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_comments_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_task ON public.comments USING btree (task_id);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, is_read);


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: comments comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: project_members project_members_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: project_members project_members_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_members project_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: projects projects_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: super_admin_logs super_admin_logs_super_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_admin_logs
    ADD CONSTRAINT super_admin_logs_super_admin_id_fkey FOREIGN KEY (super_admin_id) REFERENCES public.users(id);


--
-- Name: task_assignments task_assignments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: task_assignments task_assignments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_assignments task_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KrcW3lwIlaaBTZEnI7JFWWw31r1tCXwv9mUxLxrY5wsJqsh7uVR3PW3vpoUCamB

