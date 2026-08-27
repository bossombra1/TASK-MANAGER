--
-- PostgreSQL database dump
--

\restrict xF5zFmdyLVh2ZU1hOUGToZOfZrsRIKKqilzqTnILbik9octfFRjIcftshrTEmUQ

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

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id uuid NOT NULL,
    task_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    type character varying(30) NOT NULL,
    task_id uuid,
    comment_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: project_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_members (
    project_id uuid NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.project_members OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(150) NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'todo'::character varying NOT NULL,
    color character varying(10) DEFAULT '#E8523F'::character varying NOT NULL,
    CONSTRAINT projects_status_check CHECK (((status)::text = ANY ((ARRAY['todo'::character varying, 'doing'::character varying, 'done'::character varying])::text[])))
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: task_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_assignments (
    task_id uuid NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.task_assignments OWNER TO postgres;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    title character varying(200) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'todo'::character varying NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    avatar_url character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, task_id, author_id, content, created_at) FROM stdin;
ee7ed4d1-e173-4b06-bb24-536e61f691b6	c4444444-4444-4444-4444-444444444441	a1111111-1111-1111-1111-111111111111	désolé du retard je vais me ratrapé	2026-07-25 13:54:15.232213
5a50eac2-9f37-4ca2-9507-216a9e4eec5b	c4444444-4444-4444-4444-444444444441	a1111111-1111-1111-1111-111111111111	je suis occupé	2026-07-25 13:55:03.223048
87a5d8d4-f2fd-4e61-b34a-602f9246be6e	c1111111-1111-1111-1111-111111111114	a1111111-1111-1111-1111-111111111111	vous êtes en retard sur cette tâche	2026-07-25 14:02:46.427779
2c79b491-cb73-4722-8c5d-c637a0486811	c4444444-4444-4444-4444-444444444441	a1111111-1111-1111-1111-111111111111	nouveau membre	2026-07-25 16:40:30.984717
92d5ebd3-10a1-4835-87ef-14ad9ebe58d6	c4444444-4444-4444-4444-444444444441	a4444444-4444-4444-4444-444444444444	bien reçu	2026-07-25 16:41:21.266908
497a1c5a-4d23-4e4f-9815-3d9b63a6c93f	c2222222-2222-2222-2222-222222222221	a4444444-4444-4444-4444-444444444444	hello	2026-07-25 16:43:30.760849
5c27a4a0-322a-4614-98e6-21e983f3f7a2	c4444444-4444-4444-4444-444444444441	a1111111-1111-1111-1111-111111111111	ok	2026-07-25 16:50:25.646724
6c9353ad-6fea-4e43-aa84-bcd100c6c713	c1111111-1111-1111-1111-111111111111	a1111111-1111-1111-1111-111111111111	hello	2026-07-25 17:23:19.9851
13bf91ea-4971-4675-8297-12551f39c1ee	c1111111-1111-1111-1111-111111111111	a3333333-3333-3333-3333-333333333333	comment tu vas ?	2026-07-25 17:23:41.624337
728b65f9-030c-454f-8635-a09b5b81a121	c4444444-4444-4444-4444-444444444441	a4444444-4444-4444-4444-444444444444	recu	2026-07-25 17:25:30.511645
dc140f6e-d049-4adc-a6ed-9de02bf1df41	1385ea85-396d-460e-a40c-22850d883a44	a1111111-1111-1111-1111-111111111111	bonjour comment vous-allez	2026-07-25 17:54:04.918635
d3c86032-262f-4798-bb6e-eaa39a594f3f	1385ea85-396d-460e-a40c-22850d883a44	a4444444-4444-4444-4444-444444444444	oui je suis là les gars	2026-07-25 18:04:36.008382
d9e1067b-5e32-43ed-bf38-081e2d246ad1	1385ea85-396d-460e-a40c-22850d883a44	a4444444-4444-4444-4444-444444444444	bonjour boss	2026-07-26 14:07:14.251136
bb46649f-4f02-4f4d-8eff-8240d66d6962	1385ea85-396d-460e-a40c-22850d883a44	a4444444-4444-4444-4444-444444444444	comment vous allez?	2026-07-26 14:07:29.738337
39172bdf-f6f1-4d7c-bf94-691854f48ff2	1385ea85-396d-460e-a40c-22850d883a44	a4444444-4444-4444-4444-444444444444	sa va bien et vous?	2026-07-26 18:22:17.378291
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, task_id, comment_id, is_read, created_at) FROM stdin;
0062916d-0efc-4cee-8858-c4ed799a4146	a4444444-4444-4444-4444-444444444444	new_comment	c4444444-4444-4444-4444-444444444441	2c79b491-cb73-4722-8c5d-c637a0486811	t	2026-07-25 16:40:31.012305
c63ef1b7-0b95-4f26-b6ff-c51a9868a5f2	a4444444-4444-4444-4444-444444444444	new_comment	c4444444-4444-4444-4444-444444444441	ee7ed4d1-e173-4b06-bb24-536e61f691b6	t	2026-07-25 13:54:15.365786
fa76fa27-71db-4a57-bcff-9dfbd6956f23	a4444444-4444-4444-4444-444444444444	new_comment	c4444444-4444-4444-4444-444444444441	5a50eac2-9f37-4ca2-9507-216a9e4eec5b	t	2026-07-25 13:55:03.235176
77767317-5553-4122-88fc-2b8db2b58579	a4444444-4444-4444-4444-444444444444	new_comment	c1111111-1111-1111-1111-111111111114	87a5d8d4-f2fd-4e61-b34a-602f9246be6e	t	2026-07-25 14:02:46.440444
d0c3b92a-a69a-4e84-8213-d72dc678687e	a3333333-3333-3333-3333-333333333333	new_comment	c1111111-1111-1111-1111-111111111111	6c9353ad-6fea-4e43-aa84-bcd100c6c713	t	2026-07-25 17:23:20.039074
a4bf5390-96b2-4521-bbc3-eeb819810a20	a4444444-4444-4444-4444-444444444444	new_comment	c4444444-4444-4444-4444-444444444441	5c27a4a0-322a-4614-98e6-21e983f3f7a2	t	2026-07-25 16:50:25.700024
3970f271-e868-48d2-b484-d3bd0f1d88a7	a1111111-1111-1111-1111-111111111111	new_comment	c4444444-4444-4444-4444-444444444441	728b65f9-030c-454f-8635-a09b5b81a121	t	2026-07-25 17:25:30.516618
9c93fcc8-6c33-4a96-a3ad-2d226f426f51	a1111111-1111-1111-1111-111111111111	new_comment	c1111111-1111-1111-1111-111111111111	13bf91ea-4971-4675-8297-12551f39c1ee	t	2026-07-25 17:23:41.635878
ed8a624e-0108-443e-b0a1-37d8a6ac173b	a4444444-4444-4444-4444-444444444444	new_comment	1385ea85-396d-460e-a40c-22850d883a44	dc140f6e-d049-4adc-a6ed-9de02bf1df41	t	2026-07-25 17:54:04.932994
1f1e0d1b-a908-4336-9d39-dccd4bfd0ead	a2222222-2222-2222-2222-222222222222	new_comment	1385ea85-396d-460e-a40c-22850d883a44	dc140f6e-d049-4adc-a6ed-9de02bf1df41	t	2026-07-25 17:54:04.937566
0d3ee513-1ccd-4638-94ec-2fdef1202ce4	a2222222-2222-2222-2222-222222222222	new_comment	1385ea85-396d-460e-a40c-22850d883a44	d3c86032-262f-4798-bb6e-eaa39a594f3f	f	2026-07-25 18:04:36.022797
15f4a5e1-abfc-4a20-b881-4199a0d0a142	a1111111-1111-1111-1111-111111111111	new_comment	1385ea85-396d-460e-a40c-22850d883a44	d3c86032-262f-4798-bb6e-eaa39a594f3f	t	2026-07-25 18:04:36.063542
e4069475-aebe-4769-9642-06d2ab8d23c0	a2222222-2222-2222-2222-222222222222	new_comment	1385ea85-396d-460e-a40c-22850d883a44	d9e1067b-5e32-43ed-bf38-081e2d246ad1	f	2026-07-26 14:07:14.319283
45a6fe7c-3a49-4b5f-a091-8400ba65f0d9	a2222222-2222-2222-2222-222222222222	new_comment	1385ea85-396d-460e-a40c-22850d883a44	bb46649f-4f02-4f4d-8eff-8240d66d6962	f	2026-07-26 14:07:29.76584
2c7344ac-ff6a-4b00-8060-b90f61fc63a1	a1111111-1111-1111-1111-111111111111	new_comment	1385ea85-396d-460e-a40c-22850d883a44	bb46649f-4f02-4f4d-8eff-8240d66d6962	t	2026-07-26 14:07:29.780462
680c0ace-88d4-4df3-9c64-4df7e0994ccd	a1111111-1111-1111-1111-111111111111	new_comment	1385ea85-396d-460e-a40c-22850d883a44	d9e1067b-5e32-43ed-bf38-081e2d246ad1	t	2026-07-26 14:07:14.321382
d654ba32-ec4d-432e-899f-341fc63d1a46	a2222222-2222-2222-2222-222222222222	new_comment	1385ea85-396d-460e-a40c-22850d883a44	39172bdf-f6f1-4d7c-bf94-691854f48ff2	f	2026-07-26 18:22:17.382657
43fc4211-e0ad-43c8-b209-93a5de133f84	a1111111-1111-1111-1111-111111111111	new_comment	1385ea85-396d-460e-a40c-22850d883a44	39172bdf-f6f1-4d7c-bf94-691854f48ff2	f	2026-07-26 18:22:17.438997
\.


--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_members (project_id, user_id) FROM stdin;
b1111111-1111-1111-1111-111111111111	a1111111-1111-1111-1111-111111111111
b1111111-1111-1111-1111-111111111111	a2222222-2222-2222-2222-222222222222
b1111111-1111-1111-1111-111111111111	a3333333-3333-3333-3333-333333333333
b2222222-2222-2222-2222-222222222222	a2222222-2222-2222-2222-222222222222
b2222222-2222-2222-2222-222222222222	a4444444-4444-4444-4444-444444444444
b3333333-3333-3333-3333-333333333333	a3333333-3333-3333-3333-333333333333
b3333333-3333-3333-3333-333333333333	a1111111-1111-1111-1111-111111111111
b4444444-4444-4444-4444-444444444444	a4444444-4444-4444-4444-444444444444
b4444444-4444-4444-4444-444444444444	a2222222-2222-2222-2222-222222222222
b2222222-2222-2222-2222-222222222222	e95856b2-0faf-4b5a-85ba-116ef61c87ac
b2222222-2222-2222-2222-222222222222	98acff0c-6bd9-49ed-b2fb-c9d73d2f661d
ff925b19-030a-46fa-856f-9b8969bf9c9d	e95856b2-0faf-4b5a-85ba-116ef61c87ac
ff925b19-030a-46fa-856f-9b8969bf9c9d	98acff0c-6bd9-49ed-b2fb-c9d73d2f661d
ff925b19-030a-46fa-856f-9b8969bf9c9d	a2222222-2222-2222-2222-222222222222
ff925b19-030a-46fa-856f-9b8969bf9c9d	a4444444-4444-4444-4444-444444444444
ff925b19-030a-46fa-856f-9b8969bf9c9d	a3333333-3333-3333-3333-333333333333
ff925b19-030a-46fa-856f-9b8969bf9c9d	487bf466-ee01-4817-96e9-9d46b11970b3
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, title, description, created_by, created_at, status, color) FROM stdin;
b2222222-2222-2222-2222-222222222222	App mobile CESA	Application de suivi des notes et emplois du temps pour les élèves.	a1111111-1111-1111-1111-111111111111	2026-07-25 11:17:07.472811+00	doing	#6C5CE7
b1111111-1111-1111-1111-111111111111	Site web	Nouveau site vitrine + espace client, livraison prévue avant la rentrée.	a1111111-1111-1111-1111-111111111111	2026-07-25 11:17:07.472811+00	doing	#E8523F
b4444444-4444-4444-4444-444444444444	Support et maintenance	Tickets et demandes récurrentes des utilisateurs internes.	a1111111-1111-1111-1111-111111111111	2026-07-25 11:17:07.472811+00	done	#2F9E44
b3333333-3333-3333-3333-333333333333	Campagne rentrée	Communication et supports visuels pour la rentrée scolaire 2026.	a1111111-1111-1111-1111-111111111111	2026-07-25 11:17:07.472811+00	done	#3B7DDD
ff925b19-030a-46fa-856f-9b8969bf9c9d	Marketplace locale multi-vendeurs	• Un client peut parcourir le catalogue, filtrer par catégorie/prix, ajouter au panier et passer commande\n• Gestion du panier persistant (même après rafraîchissement de page)\n• Simulation de paiement (pas de vraie intégration bancaire requise, un simple flux de validation suffit)\n• Suivi de commande pour le client (en préparation / expédiée / livrée)\n• Tableau de bord vendeur (ses produits, ses ventes, commandes reçues)\n• Tableau de bord administrateur (validation des nouveaux vendeurs, modération des produits)	a1111111-1111-1111-1111-111111111111	2026-07-26 21:12:12.95113+00	todo	#2F9E44
\.


--
-- Data for Name: task_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_assignments (task_id, user_id) FROM stdin;
c1111111-1111-1111-1111-111111111111	a3333333-3333-3333-3333-333333333333
c1111111-1111-1111-1111-111111111112	a1111111-1111-1111-1111-111111111111
c1111111-1111-1111-1111-111111111113	a1111111-1111-1111-1111-111111111111
c1111111-1111-1111-1111-111111111114	a4444444-4444-4444-4444-444444444444
c1111111-1111-1111-1111-111111111115	a3333333-3333-3333-3333-333333333333
c2222222-2222-2222-2222-222222222221	a4444444-4444-4444-4444-444444444444
c2222222-2222-2222-2222-222222222222	a2222222-2222-2222-2222-222222222222
c3333333-3333-3333-3333-333333333331	a3333333-3333-3333-3333-333333333333
c3333333-3333-3333-3333-333333333332	a1111111-1111-1111-1111-111111111111
c4444444-4444-4444-4444-444444444441	a4444444-4444-4444-4444-444444444444
1385ea85-396d-460e-a40c-22850d883a44	a4444444-4444-4444-4444-444444444444
1385ea85-396d-460e-a40c-22850d883a44	a2222222-2222-2222-2222-222222222222
4fb3d022-0f0a-41a8-9684-4f8bf7061f21	a2222222-2222-2222-2222-222222222222
4fb3d022-0f0a-41a8-9684-4f8bf7061f21	e95856b2-0faf-4b5a-85ba-116ef61c87ac
e8fbae92-2240-4702-9574-6345e4ad1566	a3333333-3333-3333-3333-333333333333
e8fbae92-2240-4702-9574-6345e4ad1566	e95856b2-0faf-4b5a-85ba-116ef61c87ac
e8fbae92-2240-4702-9574-6345e4ad1566	a2222222-2222-2222-2222-222222222222
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, project_id, title, description, status, priority, due_date, created_at) FROM stdin;
c1111111-1111-1111-1111-111111111111	b1111111-1111-1111-1111-111111111111	Maquettes page d'accueil	Wireframes et maquettes haute-fidélité de la home.	done	medium	2026-07-12 00:00:00+00	2026-07-25 11:17:07.472811+00
c4444444-4444-4444-4444-444444444441	b4444444-4444-4444-4444-444444444444	Ticket #245 — bug connexion	Un utilisateur signale une déconnexion intempestive.	done	high	2026-07-19 00:00:00+00	2026-07-25 11:17:07.472811+00
c3333333-3333-3333-3333-333333333332	b3333333-3333-3333-3333-333333333333	Impression flyers	Commande et impression des flyers de rentrée.	done	low	2026-07-22 00:00:00+00	2026-07-25 11:17:07.472811+00
c1111111-1111-1111-1111-111111111113	b1111111-1111-1111-1111-111111111111	Intégration formulaire de contact	Connecter le formulaire à l'API avec validation des champs.	done	high	2026-07-16 00:00:00+00	2026-07-25 11:17:07.472811+00
c1111111-1111-1111-1111-111111111115	b1111111-1111-1111-1111-111111111111	Optimisation images	Compression et lazy-loading des visuels du site.	done	medium	2026-07-28 00:00:00+00	2026-07-25 11:17:07.472811+00
c2222222-2222-2222-2222-222222222221	b2222222-2222-2222-2222-222222222222	Setup Flutter du projet	Initialisation de l'architecture technique de l'app.	done	high	2026-07-15 00:00:00+00	2026-07-25 11:17:07.472811+00
c1111111-1111-1111-1111-111111111112	b1111111-1111-1111-1111-111111111111	Mise en place JWT auth	Authentification backend avec tokens JWT.	done	high	2026-07-05 00:00:00+00	2026-07-25 11:17:07.472811+00
1385ea85-396d-460e-a40c-22850d883a44	b4444444-4444-4444-4444-444444444444	réparation écran blue	changer le système et rédémarer le bios du pc	done	medium	2026-07-28 00:00:00+00	2026-07-25 17:52:37.81238+00
e8fbae92-2240-4702-9574-6345e4ad1566	ff925b19-030a-46fa-856f-9b8969bf9c9d	Trois types de comptes : client, vendeur, administrateur	Un vendeur peut créer/modifier/supprimer ses propres produits (nom, prix, stock, image, description)	todo	high	2026-08-07 00:00:00+00	2026-07-26 21:13:17.685283+00
c1111111-1111-1111-1111-111111111114	b1111111-1111-1111-1111-111111111111	Tests responsive mobile	Vérifier l'affichage sur les principaux breakpoints mobiles.	doing	high	2026-05-02 00:00:00+00	2026-07-25 11:17:07.472811+00
4fb3d022-0f0a-41a8-9684-4f8bf7061f21	b2222222-2222-2222-2222-222222222222	devoir	examen de session	todo	medium	2026-08-06 00:00:00+00	2026-07-26 21:10:27.645622+00
c3333333-3333-3333-3333-333333333331	b3333333-3333-3333-3333-333333333333	Visuels réseaux sociaux	Bannières et posts pour Facebook/Instagram.	done	medium	2026-07-01 00:00:00+00	2026-07-25 11:17:07.472811+00
c2222222-2222-2222-2222-222222222222	b2222222-2222-2222-2222-222222222222	Spécification des écrans	Cahier des charges fonctionnel des écrans principaux.	todo	medium	2026-07-31 00:00:00+00	2026-07-25 11:17:07.472811+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, nom, email, password_hash, role, is_active, created_at, avatar_url) FROM stdin;
a2222222-2222-2222-2222-222222222222	Moussa Diallo	moussa.diallo@taskly.io	$2b$10$Dxpf18t3iufWF5Vkkjt1w.32JoJPoMKn0qboYDxfMap5InPnrvAQS	user	t	2026-07-25 11:17:07.472811+00	\N
a3333333-3333-3333-3333-333333333333	Sarah Yao	sarah.yao@taskly.io	$2b$10$Dxpf18t3iufWF5Vkkjt1w.32JoJPoMKn0qboYDxfMap5InPnrvAQS	user	t	2026-07-25 11:17:07.472811+00	\N
a4444444-4444-4444-4444-444444444444	Jean Toure	jean.toure@taskly.io	$2b$10$Dxpf18t3iufWF5Vkkjt1w.32JoJPoMKn0qboYDxfMap5InPnrvAQS	user	t	2026-07-25 11:17:07.472811+00	/uploads/avatars/a4444444-4444-4444-4444-444444444444-1785022739593.jpg
a1111111-1111-1111-1111-111111111111	Awa Koffi	awa.koffi@taskly.io	$2b$10$PTjHmqjUe58IUoiSGCBhR.kAUDnX0KSa3pOBH3dKG8MjEk7fgYMGa	admin	t	2026-07-25 11:17:07.472811+00	/uploads/avatars/a1111111-1111-1111-1111-111111111111-1785027448976.jpg
483704d7-16d8-4bdc-b606-da6e566ec2eb	Administrateur Principal	admin@taskmanager.com	$2b$10$X/9bhIEAZafw5ltUMthR7uRitTg2OHSNXQjv.w2G.CsXA848j19YW	admin	t	2026-07-24 14:16:45.142768+00	/uploads/avatars/483704d7-16d8-4bdc-b606-da6e566ec2eb-1785027694711.jpeg
487bf466-ee01-4817-96e9-9d46b11970b3	regis kouame	regiskouame@gmail.com	$2b$10$VypF.gRX6LEZV.QUplwfaurny5qGN9T0YCBqG3vA18w2N5s/i6e2q	user	t	2026-07-26 12:51:09.697565+00	\N
e95856b2-0faf-4b5a-85ba-116ef61c87ac	Adayé Emmanuel	adaye.emmanuel@taskly.io	$2b$10$li3WR.bfpyd41YDossK0ye/OOmXH9HS98bQjoKclS/So5nE5UUv.G	user	t	2026-07-26 20:18:31.051283+00	\N
98acff0c-6bd9-49ed-b2fb-c9d73d2f661d	rose kady	rose@taskly.io	$2b$10$6TbaiQ3jBenRmSqh3RZQROVWFs4ueGjNgcyf3Rxp3gisraCPq.b3G	user	t	2026-07-26 20:21:09.15994+00	\N
\.


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (project_id, user_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: task_assignments task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (task_id, user_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_comments_task; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_task ON public.comments USING btree (task_id);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, is_read);


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: project_members project_members_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_members project_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: task_assignments task_assignments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_assignments task_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict xF5zFmdyLVh2ZU1hOUGToZOfZrsRIKKqilzqTnILbik9octfFRjIcftshrTEmUQ

