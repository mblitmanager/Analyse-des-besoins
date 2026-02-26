--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

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
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contacts (
    id integer NOT NULL,
    civilite character varying NOT NULL,
    nom character varying NOT NULL,
    prenom character varying NOT NULL,
    telephone character varying NOT NULL,
    email character varying,
    conseiller character varying,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contacts_id_seq OWNER TO postgres;

--
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;


--
-- Name: formations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formations (
    id integer NOT NULL,
    slug character varying NOT NULL,
    label character varying NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    category character varying,
    icon character varying,
    color character varying,
    objectifs text,
    prequis text,
    "modaliteDuree" text,
    "dateEnregistrement" character varying,
    certificateur character varying,
    programme text,
    "prerequisQuestionsScope" character varying(12) DEFAULT 'auto'::character varying NOT NULL,
    "complementaryQuestionsScope" character varying(12) DEFAULT 'auto'::character varying NOT NULL,
    "availabilitiesQuestionsScope" character varying(12) DEFAULT 'auto'::character varying NOT NULL
);


ALTER TABLE public.formations OWNER TO postgres;

--
-- Name: formations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.formations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.formations_id_seq OWNER TO postgres;

--
-- Name: formations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.formations_id_seq OWNED BY public.formations.id;


--
-- Name: levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.levels (
    id integer NOT NULL,
    label character varying NOT NULL,
    "order" integer NOT NULL,
    "successThreshold" integer NOT NULL,
    "recommendationLabel" character varying,
    "formationId" integer
);


ALTER TABLE public.levels OWNER TO postgres;

--
-- Name: levels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.levels_id_seq OWNER TO postgres;

--
-- Name: levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.levels_id_seq OWNED BY public.levels.id;


--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    text character varying NOT NULL,
    options text NOT NULL,
    "correctResponseIndex" integer NOT NULL,
    "order" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    type character varying(50) NOT NULL,
    "levelId" integer,
    category character varying,
    icon character varying,
    metadata text,
    "formationId" integer,
    "responseType" character varying(20) DEFAULT 'qcm'::character varying NOT NULL
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questions_id_seq OWNER TO postgres;

--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    brand character varying NOT NULL,
    civilite character varying NOT NULL,
    nom character varying NOT NULL,
    prenom character varying NOT NULL,
    telephone character varying NOT NULL,
    conseiller character varying NOT NULL,
    "formationChoisie" character varying,
    "prerequisiteScore" text,
    "levelsScores" text,
    "stopLevel" character varying,
    "finalRecommendation" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "emailSentAt" timestamp without time zone,
    "scorePretest" integer,
    "complementaryQuestions" text,
    availabilities text,
    "stagiaireId" integer,
    "lastValidatedLevel" character varying,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "positionnementAnswers" text,
    metier character varying,
    situation text
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    key character varying NOT NULL,
    value character varying NOT NULL,
    description character varying
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: stagiaires; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stagiaires (
    id integer NOT NULL,
    civilite character varying NOT NULL,
    nom character varying NOT NULL,
    prenom character varying NOT NULL,
    email character varying NOT NULL,
    telephone character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.stagiaires OWNER TO postgres;

--
-- Name: stagiaires_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stagiaires_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stagiaires_id_seq OWNER TO postgres;

--
-- Name: stagiaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stagiaires_id_seq OWNED BY public.stagiaires.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    role character varying DEFAULT 'admin'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    name character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: workflow_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_steps (
    id integer NOT NULL,
    code character varying NOT NULL,
    label character varying NOT NULL,
    "order" integer NOT NULL,
    route character varying NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.workflow_steps OWNER TO postgres;

--
-- Name: workflow_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workflow_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workflow_steps_id_seq OWNER TO postgres;

--
-- Name: workflow_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workflow_steps_id_seq OWNED BY public.workflow_steps.id;


--
-- Name: contacts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);


--
-- Name: formations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formations ALTER COLUMN id SET DEFAULT nextval('public.formations_id_seq'::regclass);


--
-- Name: levels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels ALTER COLUMN id SET DEFAULT nextval('public.levels_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: stagiaires id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stagiaires ALTER COLUMN id SET DEFAULT nextval('public.stagiaires_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: workflow_steps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_steps ALTER COLUMN id SET DEFAULT nextval('public.workflow_steps_id_seq'::regclass);


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contacts (id, civilite, nom, prenom, telephone, email, conseiller, "isActive", "createdAt") FROM stdin;
108	Mme.	THIRE	Merryl	07 82 23 19 12	merryl.thire@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.493313
109	Mme.	CONSTANT	Emilie	06 69 38 36 18	emilie.constant@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.49721
110	Mme.	BENOÎT	Gwladys	06 68 17 88 68	glwadys.benoit@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.500775
111	Mme.	BROSSARD	Danila	06 68 17 88 68	danila.brossard@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.503511
112	Mme.	GANDREUIL	Chloé	07 64 71 34 32	chloe.gandreuil@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.506148
113	Mme.	CHARLES	Loétitia	09 74 77 38 69	loetitia.charles@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.508527
114	Mme.	BOUTIN	Séverine	07 64 22 56 56	severine.boutin@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.512145
115	Mme.	FAURY	Béatrice	06 69 71 84 65	beatrice.faury@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.5161
116	M.	BIARDOUX	Bruno	06 87 34 71 34	bruno.biardoux@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.519243
117	Mme.	BAILLOT	Jade	07 60 27 26 89	jade.baillot@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.521961
118	M.	PINO CORTES	Franck	06 13 57 82 10	franck.pino-cortes@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.524801
119	Mme.	HUET	Audrey	06 59 39 62 48	audrey.huet@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.527489
120	Mme.	RAYNAL	Cécile	06 64 65 97 61	cecile.raynal@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.529829
121	Mme.	SAVATIER	Charlène	06 68 94 83 18	charlene.savatier@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.532433
122	Mme.	DESAIVRE	Amandine	06 14 67 64 11	amandine.desaivre@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.536906
123	Mme.	LECINA	Estelle	06 87 04 83 19	estelle.lecina@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.540627
126	Mme.	BIRÉ	Aurélie	07 63 76 61 79	aurelie.bire@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.549259
127	Mme.	BLIN	Mélinda	06 63 87 30 03	melinda.blin@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.552087
128	M.	BOYÉ	Simon	06 84 44 76 36	simon.boye@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.554705
129	Mme.	CUBAUD	Valérie	06 16 42 41 58	valerie.cubaud@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.56078
130	M.	DELABI	Cédric	06 72 34 15 26	cedric.delabi@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.565025
131	M.	DURAT	Maxence	06 60 92 33 15	maxence.durat@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.568652
132	Mme.	GAUVILLE	Ghislaine	06 23 19 37 31	ghislaine.gauville@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.572618
133	Mme.	GAILLARD	Nathalie	06 30 01 22 83	contact@numenat.fr	Commercials	t	2026-02-21 14:52:16.579852
134	Mme.	GRUAUD	Sandrine	06 86 94 93 51	sandrine.gruaud@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.585046
135	Mme.	HÉRAULT	Véronique	06 34 12 22 92	veronique.herault@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.587593
136	M.	HUARD	Christophe	06 12 97 64 58	christophe.huard@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.590044
137	Mme.	JACQUART	Marie-Hélène	06 16 92 21 95	marie-helene.jacquart@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.59236
138	M.	LANDAIS	Arnaud	06 19 65 88 10	arnaud.landais@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.595215
73		Formateur	Test	06 00 00 00 00	formateur@wizi-learn.com	Formateurs	f	2026-02-21 14:52:16.309345
75	Mme.	PAOLI	Anne-Marie	06 68 60 22 86	anne-marie.paoli@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.358941
76	Mme.	GUILLEMIN	Audrey	06 61 34 39 29	audrey.guillemin@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.362257
77	M.	DUCHER	Bastien	06 62 76 79 10	bastien.ducher@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.366089
78	Mme.	MALTERRE	Camille	06 62 63 09 30	camille.malterre@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.369916
79	Mme.	LOISEAU	Cécile	06 62 96 10 67	cecile.loiseau@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.373758
80	M.	DESLANDES	Charlie	06 98 07 75 30	charlie.deslandes@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.381285
81	Mme.	POULBERE	Elodie	07 60 27 25 81	elodie.poulbere@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.384673
82	M.	BEY	Esteban	07 64 71 44 78	esteban.bey@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.389403
83	M.	LEBRE	Geoffrey	06 50 69 52 00	geoffrey.lebre@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.392771
84	Mme.	GUILLERD	Julie	07 62 52 90 06	julie.guiller@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.402256
85	Mme.	LEDOUX	Justine	07 62 60 68 25	justine.ledoux@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.407751
86	M.	RENAUDEAU	Kevin	07 64 71 44 60	kevin.renaudeau@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.412341
87	Mme.	DELEMARRE	Lisa	07 65 18 84 95	lisa.delemarre@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.415493
88	Mme.	OSES	Ludiwine	06 21 87 95 68	ludiwine.oses@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.418194
89	Mme.	GUINOUARD	Manon	07 60 83 97 90	manon.guinouard@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.421157
90	M.	COTTEAU	Manuel	06 58 45 35 99	manuel.cotteau@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.425793
91	Mme.	PASTORÉ	Marie-Josée	06 29 58 02 81	marie-jo.pastore@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.429002
92	Mme.	BEAUDROIT	Marion	07 61 41 39 25	marion.beaudroit@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.431642
93	Mme.	BERISTAIN	Marion	06 61 72 94 20	marion.beristain@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.43629
94	Mme.	FRICHOT	Michelle	06 63 52 70 55	michelle.frichot@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.441899
96	Mme.	BRAYLE	Océane	06 58 92 16 19	oceane.brayle@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.447404
97	M.	ESTEVEZ	Philippe	07 64 73 00 04	philippe.estevez@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.450338
98	Mme.	DESBAS	Romane	07 60 27 32 31	romane.desbas@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.452869
99	Mme.	LE CALVÉ	Sonia	07 62 59 43 74	sonia.lecalve@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.455799
100	Mme.	CLEMENT	Sophie	06 58 47 05 06	sophie.clement@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.458855
102	M.	HARDUIN	Wilfried	06 98 07 85 98	wilfried.harduin@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.464241
103	Mme.	BENOIT	Laurie	N/A	laurie.benoit@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.468035
104	Mme.	GAILLARD	Nathalie	N/A	nathalie.gaillard@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.474077
105		Pole relation	Client	06 00 00 00 00	herizobm@gmail.com	Pole Relation Clients	f	2026-02-21 14:52:16.480334
107	M.	SIMON	Nicolas	01 696 03 93	nicolas.simon@ns-conseil.fr	Pole Relation Clients	f	2026-02-21 14:52:16.487666
106	M.	FLOREK	Alexandre	06 03 67 59 24	alexandre.florek@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.484028
124		Teddy	Rinah	+1 (429) 901-3175	rinah@gmail.com	Pole Relation Clients	f	2026-02-21 14:52:16.543579
125		Commercial	Martine	+26409809	commercial@test.fr	Commercials	f	2026-02-21 14:52:16.546658
139	Mme.	MINEAU	Isabelle	06 79 46 39 61	isabelle.mineau@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.597792
140		THIBAUD	Françis	06 65 65 24 88	francis.thibaud@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.60189
141	Mme.	SALGUEIRO	Élisabeth	06 13 93 79 06	elisabeth.salgueiro@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.604529
142	M.	VERGNE	Thierry	07 60 43 81 49	thierry.vergne@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.612393
143	Mme.	COLIN	Sophie	06 27 35 53 37	sophie.colin@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.614858
144	M.	HUBERT	Philippe	07 64 72 06 62	philippe.hubert@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.620157
95		Test 1	Test	N/A	est@example.com	Formateurs	f	2026-02-21 14:52:16.444539
74	M.	VALETTE	Alexis	07 64 71 44 72	alexis.valette@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.354694
101	Mme.	PEREIRA	Sylvie	06 63 35 91 09	sylvie.pereira@ns-conseil.com	Formateurs	f	2026-02-21 14:52:16.461593
\.


--
-- Data for Name: formations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.formations (id, slug, label, "isActive", category, icon, color, objectifs, prequis, "modaliteDuree", "dateEnregistrement", certificateur, programme, "prerequisQuestionsScope", "complementaryQuestionsScope", "availabilitiesQuestionsScope") FROM stdin;
16	google-workspace	Google Workspace	t	Internet	\N	\N	Maîtriser les outils collaboratifs de Google (Docs, Sheets, Slides, Gmail, Drive). Travail en équipe en temps réel.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h accompagnement.	18/12/2024	ICDL	Séquence 1 : Google Drive et stockage. Séquence 2 : Outils de communication (Gmail, Meet). Séquence 3 : Collaboration sur documents.	auto	auto	auto
20	photoshop	Photoshop	t	Création	\N	\N	Retoucher des images et des photos avec expertise. Découvrir les outils d'IA générative de Photoshop.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h à 12h accompagnement.	18/12/2024	ICDL / TOSA	Séquence 1 : Retouche photo et calques. Séquence 2 : Sélections et masques. Séquence 3 : Filtres et effets. Séquence 4 : IA générative.	auto	auto	auto
21	sketchup	Sketchup	t	Création	\N	\N	Concevoir des projets d'aménagement intérieur et extérieur en 3D. Modéliser des espaces et des objets.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h accompagnement.	18/12/2024	ICDL	Séquence 1 : Bases de la modélisation 3D. Séquence 2 : Matériaux et textures. Séquence 3 : Rendu et présentation.	auto	auto	auto
23	digcomp	DigComp	t	Internet	\N	\N	Améliorer sa culture numérique globale. Maîtriser les outils informatiques et la sécurité en ligne.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 12h accompagnement.	18/12/2024	DigComp	Séquence 1 : Recherche d'information et veille. Séquence 2 : Communication et collaboration. Séquence 3 : Création de contenu numérique. Séquence 4 : Sécurité et protection des données.	auto	auto	auto
24	intelligence-artificielle-générative	Intelligence Artificielle Générative	t	IA	\N	\N	Maîtriser l'usage responsable de l'IA générative pour la création de contenus rédactionnels et visuels.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. 21h dont 12h accompagnement.	18/12/2024	Certification Interne / RS	Séquence 1 : Fondamentaux de l'IA. Séquence 2 : Prompt engineering. Séquence 3 : Création de textes et images. Séquence 4 : Éthique et limites de l'IA.	auto	auto	auto
15	pack-office-outlook	Pack Office Outlook	t	Bureautique Microsoft	\N	\N	Gérer efficacement sa messagerie, son calendrier et ses tâches. Collaborer avec les outils Outlook.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h accompagnement.	18/12/2024	TOSA	Séquence 1 : Gestion des mails. Séquence 2 : Calendrier et rendez-vous. Séquence 3 : Gestion des contacts et des tâches.	auto	auto	auto
14	pack-office-powerpoint	Pack Office PowerPoint	t	Bureautique Microsoft	\N	\N	Concevoir des présentations percutantes. Utiliser les masques, les animations et les transitions.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h accompagnement.	18/12/2024	TOSA	Séquence 1 : Interface et création de diapositives. Séquence 2 : Mise en forme et objets graphiques. Séquence 3 : Animations et diaporamas.	auto	auto	auto
19	illustrator	Illustrator	t	Création	\N	\N	Concevoir des illustrations et des logos vectoriels. Maîtriser les outils de dessin et de mise en page.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h accompagnement.	18/12/2024	TOSA	Séquence 1 : Interface et outils de base.\nSéquence 2 : Dessin vectoriel et formes.\n Séquence 3 : Couleurs et dégradés.\n Séquence 4 : Exportation et impression.	auto	auto	auto
22	wordpress	WordPress	t	Internet	search	\N	Créer et administrer un site internet sur-mesure. Gérer les thèmes, les extensions et le contenu.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 12h à 14h accompagnement.	18/12/2024	TOSA / ICDL	Séquence 1 : Installation et configuration. Séquence 2 : Création de pages et articles. Séquence 3 : Personnalisation avec thèmes et plugins. Séquence 4 : Sécurité et SEO.	auto	auto	auto
2	voltaire	Français	t	LANGUES	spellcheck	blue-600	\N	\N	\N	\N	\N	\N	auto	auto	auto
25	toeic	Anglais 	t	LANGUES	\N	\N	\N	\N	\N	\N	\N	\N	auto	auto	auto
5	google-sheets	Google Sheets	t	Bureautique Google	school	#3B82F6							auto	auto	auto
4	google-docs	Google Docs	t	Bureautique Google	school	#3B82F6							auto	auto	auto
10	google-slides	Google Slides	t	Bureautique Google	table	#3B82F6			Individuelle à votre rythme. Accès e-learning 1 an + 10h à 20h accompagnement.				auto	auto	auto
48	gimp	Gimp	t	Création	\N	\N	\N	\N	\N	\N	\N	\N	formation	formation	formation
45	excel	Pack Office Excel	t	BUREAUTIQUE microsoft	table_view	green-500	\N	\N	\N	\N	\N	\N	auto	auto	auto
44	word	Pack Office Word	t	Bureautique Microsoft	description	blue-600	\N	\N	\N	\N	\N	\N	auto	auto	auto
\.


--
-- Data for Name: levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.levels (id, label, "order", "successThreshold", "recommendationLabel", "formationId") FROM stdin;
4	B2	4	4	Parcours Avancé (B2)	25
98	Débutant	1	5	Parcours Débutant	2
101	Expert	4	6	Parcours Expert	2
142	Débutant	1	5	\N	5
19	Intermédiaire	2	4	Parcours Intermédiaire	14
23	Intermédiaire	2	4	Parcours Intermédiaire	15
24	Avancé	3	4	Parcours Avancé	15
27	Intermédiaire	2	4	Parcours Intermédiaire	16
28	Avancé	3	4	Parcours Avancé	16
143	Intermédiaire	2	4	\N	5
144	Avancé	3	4	\N	5
145	Expert	4	6	\N	5
26	Débutant	1	5	Parcours Débutant	16
29	Expert	4	6	Parcours Expert	16
40	Avancé	3	5	Parcours Avancé	19
41	Expert	4	6	Parcours Expert	19
58	Débutant	1	5	Parcours Débutant	24
38	Débutant	1	4	Parcours Débutant	19
39	Intermédiaire	2	4	Parcours Intermédiaire	19
61	Expert	4	6	Parcours Expert	24
59	Intermédiaire	2	4	Parcours Intermédiaire	24
60	Avancé	3	4	Parcours Avancé	24
22	Débutant	1	5	Parcours Débutant	15
25	Expert	4	6	Parcours Expert	15
124	Avancé	3	5	Niveau Avancé - Formation Photoshop recommandée	20
125	Expert	4	5	Niveau Expert - Formation Photoshop recommandée	20
18	Débutant	1	5	Parcours Débutant	14
20	Avancé	3	5	Parcours Avancé	14
21	Expert	4	6	Parcours Expert	14
122	Débutant	1	5	Niveau Débutant - Formation Photoshop recommandée	20
123	Intermédiaire	2	4	Niveau Intermédiaire - Formation Photoshop recommandée	20
57	Expert	5	5	Parcours Expert	23
1	A1	1	6	Parcours Débutant (A1)	25
2	A2	2	5	Parcours Elémentaire (A2)	25
3	B1	3	5	Parcours Intermédiaire (B1)	25
217	Avance	4	5	\N	44
174	Expert	5	5	Parcours Expert	44
178	Expert	5	5	Parcours Expert	45
211	Avance	4	5	\N	45
213	Avance	4	5	\N	48
215	Avance	4	5	\N	21
99	Intermédiaire	2	4	Parcours Intermédiaire	2
100	Avancé	3	4	Parcours Avancé	2
163	Débutant	1	5	\N	10
165	Avancé	3	4	\N	10
167	Intermédiaire	2	4	\N	10
168	Expert	4	6	\N	10
208	Operationnel	3	4	\N	23
209	Avance	4	4	\N	23
210	Operationnel	3	4	\N	45
212	Operationnel	3	4	\N	48
214	Operationnel	3	4	\N	21
216	Operationnel	3	4	\N	44
5	C1	5	4	Parcours Expert (C1)	25
146	A1	0	5	\N	4
138	Débutant	1	5	\N	4
139	Intermédiaire	2	4	\N	4
140	Avancé	3	4	\N	4
141	Expert	4	6	\N	4
164	Débutant	1	5	\N	10
166	Avancé	3	4	\N	10
169	Intermédiaire	2	4	\N	10
170	Expert	4	6	\N	10
201	Basique	2	5	\N	23
191	Basique	2	4	\N	44
193	Initial	1	4	\N	22
194	Basique	2	4	\N	22
200	Initial	1	3	\N	23
187	Initial	1	3	\N	45
202	Initial	1	3	\N	48
206	Basique	2	4	\N	21
205	Initial	1	3	\N	21
190	Initial	1	3	\N	44
218	Operationnel	3	4	\N	22
188	Basique	2	3	\N	45
203	Basique	2	3	\N	48
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (id, text, options, "correctResponseIndex", "order", "isActive", type, "levelId", category, icon, metadata, "formationId", "responseType") FROM stdin;
1952	Je reçois un email avec une pièce jointe que je veux la mettre sur mon ordinateur	["Je clique sur Enregistrez sous","Je l’ouvre et je copie le texte","Je ne sais pas"]	0	1	t	positionnement	200	\N	\N	\N	23	qcm
1953	Je veux me connecter facilement aux services de l’état (Impôts…)	["Je peux me connecter sans m’identifier","J’utilise l’Identité Numérique La Poste","Je ne sais pas"]	1	2	t	positionnement	200	\N	\N	\N	23	qcm
1954	Je veux faire une visio sur mon ordinateur	["J’utilise Windows","J’utilise Teams","J’utilise Excel","Je ne sais pas"]	1	3	t	positionnement	200	\N	\N	\N	23	qcm
1955	Je cherche une information sur internet	["Je consulte plusieurs sites et compare les informations","Je regarde un seul site","Je ne sais pas trop comment vérifier","Je n’utilise pas Internet pour cela"]	0	1	t	positionnement	201	\N	\N	\N	23	qcm
1956	J’ai reçu un mail que je souhaite renvoyer à une autre personne, que dois-je faire	["Je clique sur répondre","Je copie tout le texte dans un nouveau mail","Je transfère le mail","Je ne sais pas comment faire"]	2	2	t	positionnement	201	\N	\N	\N	23	qcm
1957	Je dois rédiger un courrier important	["J’utilise le logiciel Excel","J’utilise le logiciel Word","Je vais sur internet","Je ne sais pas faire"]	1	3	t	positionnement	201	\N	\N	\N	23	qcm
1958	Mon ordinateur est lent et il devient difficile de travailler	["Je ferme un programme","Je redémarre l’ordinateur","Je demande de l’aide","Je ne sais pas"]	1	4	t	positionnement	201	\N	\N	\N	23	qcm
15	We ___ tired, so we decided to go home.	["was","were","are","Je ne sais pas"]	1	7	t	positionnement	2		quiz	\N	25	qcm
20	We ___ to the supermarket yesterday.	["go","went","are going","Je ne sais pas"]	1	12	t	positionnement	2		quiz	\N	25	qcm
44	Quelles sont vos dates de début souhaitées ?	[]	0	2	t	availabilities	\N	Disponibilités	event	{"type":"textarea","rows":2,"placeholder":"Ex : À partir du 1er mars 2025, semaines paires uniquement..."}	\N	qcm
45	Commentaires ou contraintes supplémentaires sur vos disponibilités	[]	0	3	t	availabilities	\N	Disponibilités	comment	{"type":"textarea","rows":3,"placeholder":"Ex : Indisponible le mardi matin, contraintes personnelles..."}	\N	qcm
19	Mary is ___ her sister.	["as beautiful as","beautiful","more beautiful","Je ne sais pas"]	0	11	t	positionnement	2		quiz	\N	25	qcm
40	Êtes-vous en recherche d'emploi ?	["Oui","Non"]	0	3	t	complementary	\N	Profil professionnel	search	{"type":"radio_toggle"}	\N	qcm
41	Avez-vous une reconnaissance de travailleur handicapé (RQTH) ?	["Oui","Non"]	0	4	t	complementary	\N	Profil professionnel	accessible	{"type":"radio_toggle"}	\N	qcm
42	Si oui, souhaitez-vous des aménagements spécifiques pour votre formation ?	[]	0	5	t	complementary	\N	Profil professionnel	settings_accessibility	{"type":"textarea","rows":3,"placeholder":"Décrivez vos besoins d'aménagement...","condition":"handicap == 'Oui'"}	\N	qcm
18	He’s the ___ student in the class.	["more tall","taller","tallest","Je ne sais pas"]	2	10	t	positionnement	2		quiz	\N	25	qcm
17	There isn’t ___ milk left in the fridge.	["many","much","a few","Je ne sais pas"]	1	9	t	positionnement	2		quiz	\N	25	qcm
16	While I ___ TV, I heard a strange noise.	["am watching","were watching","was watching","Je ne sais pas"]	2	8	t	positionnement	2		quiz	\N	25	qcm
21	I’ve known her ___ we were children.	["for","since","during","Je ne sais pas"]	1	13	t	positionnement	3		quiz	\N	25	qcm
22	If I ___ more time, I would travel around the world.	["have","had","will have","Je ne sais pas"]	1	14	t	positionnement	3		quiz	\N	25	qcm
23	The castle ___ in 1692.	["was built","is built","was building","Je ne sais pas"]	0	15	t	positionnement	3		quiz	\N	25	qcm
24	She ___ here for five years.	["has worked","works","is working","Je ne sais pas"]	0	16	t	positionnement	3		quiz	\N	25	qcm
25	He felt sick because he ___ too much chocolate.	["ate","has eaten","had eaten","Je ne sais pas"]	2	17	t	positionnement	3		quiz	\N	25	qcm
26	I ___ more water recently and I feel better.	["have been drinking","had drunk","drank","Je ne sais pas"]	0	18	t	positionnement	3		quiz	\N	25	qcm
27	You ___ me about the problem earlier.	["should have told","should told","must","Je ne sais pas"]	0	19	t	positionnement	4		quiz	\N	25	qcm
28	If the baby had slept better, I ___ so tired.	["won’t be","wouldn’t be","wouldn’t have been","Je ne sais pas"]	2	20	t	positionnement	4		quiz	\N	25	qcm
29	By this time next year, I ___ my studies.	["will finish","will have finished","am finishing","Je ne sais pas"]	1	21	t	positionnement	4		quiz	\N	25	qcm
30	This time tomorrow, we ___ on the beach.	["will lie","will be lying","lie","Je ne sais pas"]	1	22	t	positionnement	4		quiz	\N	25	qcm
31	The meeting was called ___ due to unexpected problems.	["off","up","out","Je ne sais pas"]	0	23	t	positionnement	4		quiz	\N	25	qcm
32	___ he was tired, he continued working.	["Because","Despite","Although","Je ne sais pas"]	2	24	t	positionnement	4		quiz	\N	25	qcm
33	You ___ apologise now if you want to avoid further conflict.	["would rather","had better","will","Je ne sais pas"]	1	25	t	positionnement	5		quiz	\N	25	qcm
34	I’d rather you ___ this matter confidential.	["kept","keep","will keep","Je ne sais pas"]	0	26	t	positionnement	5		quiz	\N	25	qcm
35	The committee demanded that the report ___ before Friday.	["is submitted","was submitted","be submitted","Je ne sais pas"]	2	27	t	positionnement	5		quiz	\N	25	qcm
36	___ the circumstances, his reaction was surprisingly restrained.	["Because","Although","Given","Je ne sais pas"]	2	28	t	positionnement	5		quiz	\N	25	qcm
37	Rarely ___ such a compelling argument.	["I have heard","have I heard","I heard","Je ne sais pas"]	1	29	t	positionnement	5		quiz	\N	25	qcm
38	Not only ___ late, but he also failed to apologise.	["he arrived","did he arrive","he did arrive","Je ne sais pas"]	1	30	t	positionnement	5		quiz	\N	25	qcm
1959	Mots de passe sur internet	["J’utilise ma date de naissance","J’utilise le même mot de passe sur tous les sites","J’utilise une combinaison de chiffres, de lettres majuscules et minuscules et de symboles","J’utilise seulement 6 caractères"]	2	5	t	positionnement	201	\N	\N	\N	23	qcm
1960	Je veux trouver une information précise sur internet	["Je fais une recherche simple sur Google","J’utilise la recherche avancée en précisant des critères","J’ouvre plusieurs pages web","Je ne sais pas"]	1	1	t	positionnement	208	\N	\N	\N	23	qcm
1961	Pour classer mes mails, je dois	["Attribuer un numéro par email pour les classer","Je les classe par ordre alphabétique","Je crée des dossiers par thèmes","Je ne sais pas"]	2	2	t	positionnement	208	\N	\N	\N	23	qcm
2109	Savez-vous vous repérer dans l’environnement Windows : bureau, menu démarrer, fenêtres, icônes, applications… 	["Acquis","Moyen","Insuffisant"]	0	9	t	prerequis	\N		quiz	\N	\N	qcm
1998	À quoi sert principalement GIMP ?	["Gérer des fichiers","Je ne sais pas","Créer des vidéos","Éditer des images "]	3	1	t	positionnement	202		quiz	\N	48	qcm
482	Avez-vous déjà réalisé des démarches administratives en ligne ?	["Oui","Non"]	-1	14	f	prerequis	\N	\N	\N	\N	\N	qcm
2093	Situation actuelle 	["Salarié","Indépendant","Demandeur d'emploi","Réconversion"]	0	3	t	prerequis	\N		quiz	\N	\N	qcm
477	Savez-vous allumer un ordinateur, utiliser le clavier et la souris 	["Acquis","Moyen","Insuffisant"]	-1	8	t	prerequis	\N		quiz	\N	\N	qcm
43	Quels créneaux vous conviennent pour vous former ?	["Matin","Après-midi","Journée complète"]	0	1	t	availabilities	\N	Disponibilités	schedule	{"type":"multi_select","icons":["wb_sunny","light_mode","calendar_today"]}	\N	qcm
1962	Je dois transmettre un courrier important par mail mais il ne doit pas être possible de le modifier	["Je transfère mon fichier Word","Je fais une photo de mon fichier et je l’envoi","Je le transforme en PDF","Je ne sais pas"]	2	3	t	positionnement	208	\N	\N	\N	23	qcm
1963	Je dois imprimer une grande quantité de courrier	["J’imprime sur une imprimante Jet d’encre","J’utilise une imprimante laser","J’enregistre en fichier impression","Je ne sais pas"]	1	4	t	positionnement	208	\N	\N	\N	23	qcm
1964	Je veux mettre mon ordinateur en sécurité	["J’utilise plusieurs antivirus","J’utilise un antivirus","j’utilise un malware ou un ransomware","Je ne sais pas"]	1	5	t	positionnement	208	\N	\N	\N	23	qcm
1965	Vous avez trouvé une information importante sur Google	["Vous savez comment vérifier cette information","Inutile de la vérifier puisqu’elle est disponible","Je refais la même recherche sur un autre moteur de recherche","Je ne sais pas"]	0	1	t	positionnement	209	\N	\N	\N	23	qcm
1966	Je dois créer mon identité numérique	["Je dois refaire ma pièce d’identité","Je dois avoir un compte sur un réseau social","Je peux la créer avec une application sur mon téléphone","Je ne sais pas"]	2	2	t	positionnement	209	\N	\N	\N	23	qcm
1967	Je dois créer un rapport de mes dépenses	["Le logiciel Word sera parfait pour faire ça","Je peux créer un tableau sur Excel avec des formules automatiques","Je m’adresse à un comptable","Je ne sais pas"]	1	3	t	positionnement	209	\N	\N	\N	23	qcm
1968	Ma box internet est en panne et j’ai un document urgent à envoyer	["Je partage la connexion avec mon téléphone","J’imprime mon document et je l’envoie par la poste","Je cherche un voisin chez qui je pourrais me connecter","Je ne sais pas"]	0	4	t	positionnement	209	\N	\N	\N	23	qcm
1969	La sécurité de mes données est importante sur mon ordinateur	["Ma box internet me protège du piratage","j’utilise plusieurs antivirus sur mon ordinateur","J’effectue régulièrement un scan de mes fichiers avec mon antivirus","Je ne sais pas"]	2	5	t	positionnement	209	\N	\N	\N	23	qcm
1970	Je veux rester en permanence informé sur un sujet donné	["Je consulte les journaux","J’utilise des outils de veille","Je consulte plein de sites internet tous les jours","Je ne sais pas"]	1	1	t	positionnement	57	\N	\N	\N	23	qcm
1971	La e-citoyenneté c’est quoi ?	["L’utilisation régulière des outils numériques","La présence sur les réseaux sociaux","Le respect de règles établies","Je ne sais pas"]	2	2	t	positionnement	57	\N	\N	\N	23	qcm
1972	Quelle fonction Excel permet d’additionner des valeurs en respectant plusieurs critères ?	["SOMME.SI.ENS","SOMME.SI","SOMME","Je ne sais pas"]	0	3	t	positionnement	57	\N	\N	\N	23	qcm
1973	Quel moyen est efficace pour s’informer sur les progrès technologiques ?	["J’évite Internet pour ne pas se tromper","Je consulte des sites internet","Je me fie uniquement au bouche-à-oreille","Je ne sais pas"]	1	4	t	positionnement	57	\N	\N	\N	23	qcm
1974	Quel risque peut être lié à une utilisation excessive des technologies numériques ?	["Amélioration automatique de la santé","Disparition de la fatigue","Fatigue visuelle, troubles du sommeil et stress","Augmentation systématique de l’activité physique"]	2	5	t	positionnement	57	\N	\N	\N	23	qcm
1975	Comment Excel nomme l’intersection d’une ligne et d’une colonne ?	["Une **case**","Une **cellule **","Un **bloc**","Je ne sais pas"]	1	1	t	positionnement	187	\N	\N	\N	45	qcm
1976	Quelle formule est la plus adaptée et rapide pour additionner les valeurs des cellules A1, A3, A5 et A7 ?	["\\\\=A1 **+** A3 **+** A5 **+** A7","\\\\=**SOMME**(A1 : A7)","\\\\=**SOMME**(A1 ; A3 ; A5 ; A7)","Je ne sais pas"]	2	2	t	positionnement	187	\N	\N	\N	45	qcm
1977	Comment Excel nomme précisément les 3 principaux graphiques les plus utilisés ?	["**Diagramme** / **Colonnes** / **Courbe**","**Secteur** / **Histogramme** / **Courbe**","**Camembert** / **Histogramme** / **Linéaire**","Je ne sais pas"]	1	3	t	positionnement	187	\N	\N	\N	45	qcm
1978	Quel icône, par le biais du raccourcis clavier (fn)+F4, permet de figer une référence à une cellule ?	["L'icône : **%**","L'icône : **£**","L'icône : **$**","Je ne sais pas"]	2	1	t	positionnement	188	\N	\N	\N	45	qcm
1979	A quoi sert un filtre ?	["A **afficher** les valeurs correspondant au filtre","A **ordonner** les valeurs en fonction du filtre","A **trier** les valeurs","Je ne sais pas"]	0	2	t	positionnement	188	\N	\N	\N	45	qcm
1980	Quelle fonction permet d’afficher un résultat en fonction d’un test logique ?	["**SOMME**()","**SI**()","**NB**()","Je ne sais pas"]	1	3	t	positionnement	188	\N	\N	\N	45	qcm
1981	Je souhaite pouvoir visualiser continuellement ma 1ère ligne de tableau tout en descendant dans un tableau volumineux. Comment se nomme l’outil qui permet cela ?	["Figer les **volets **","Imprimer les **titres**","Mise en forme **conditionnelle**","Je ne sais pas"]	0	4	t	positionnement	188	\N	\N	\N	45	qcm
1982	Quelle fonction permet d’afficher uniquement la date du jour seule ?	["**MAINTENANT**()","**DATE**()","**AUJOURDHUI**()","Je ne sais pas"]	2	5	t	positionnement	188	\N	\N	\N	45	qcm
1983	A quoi sert une mise en forme conditionnelle ?	["À **modifier** les valeurs","À **mettre en évidence** les valeurs","À **effacer** les valeurs **ne répondant pas** au critère","Je ne sais pas"]	1	1	t	positionnement	210	\N	\N	\N	45	qcm
1999	Qu’est-ce qu’un pixel ?	["Une couleur automatique","Je ne sais pas","Un filtre","La plus petite unité d’une image "]	3	2	t	positionnement	202		quiz	\N	48	qcm
447	Quel est le but de votre formation ?	[]	0	2	t	complementary	\N		quiz	\N	\N	text
1984	Quelle est l’utilité de la poignée de recopie ?	["De **dupliquer** une feuille","D’**agrandir** une zone sélectionnée","De **copier** et/ou **incrémenter** une valeur","Je ne sais pas"]	2	2	t	positionnement	210	\N	\N	\N	45	qcm
1985	Je souhaite analyser et synthétiser des données volumineuses de manière rapide. Quel outil est le plus approprié ?	["Un **tableau croisé dynamique**","Les **fonctions** adaptées aux **bases de données**","Un **segment**","Je ne sais pas"]	0	3	t	positionnement	210	\N	\N	\N	45	qcm
1986	Je souhaite proposer une liste de choix dans une liste déroulante. Par quel ruban dois-je passer ?	["Insertion","Données","Affichage","Je ne sais pas"]	1	4	t	positionnement	210	\N	\N	\N	45	qcm
1987	Comment éviter des modifications involontaires sur mes formules ?	["Je **déverrouille** les **cellules**","Je **protège** le **classeur**","Je **protège** la **feuille**","Je ne sais pas"]	2	5	t	positionnement	210	\N	\N	\N	45	qcm
1988	Quelle est la solution la plus adaptée pour effectuer le total de plusieurs multiplications ?	["Réaliser les **multiplications** les unes sous les autres puis utiliser la fonction **SOMME**","Utiliser la fonction SOMMEPROD","Utiliser un **tableau croisé dynamique**","Je ne sais pas"]	1	1	t	positionnement	211	\N	\N	\N	45	qcm
1989	Je souhaite pouvoir ajouter un seuil fixe dans un graphique histogramme. Quelle méthode est la plus adaptée ?	["Ajouter une **forme** de type « **trait** » et la déplacer au-dessus du **graphique**","Utiliser un **graphique croisé dynamique**","Utiliser un **graphique combiné**","Je ne sais pas"]	2	2	t	positionnement	211	\N	\N	\N	45	qcm
1990	Que permet le symbole « & » dans Excel ?	["À **additionner** des valeurs","À **concaténer** des valeurs","À **réaliser** des tests logiques **multiples** dans des fonctions conditionnelles","Je ne sais pas"]	1	3	t	positionnement	211	\N	\N	\N	45	qcm
1991	A quoi sert la fonction EQUIV ?	["À **trouver** la **position** d’une valeur dans une matrice","À **retourner** une **valeur** à partir d’une position","À **tester** les valeurs **équivalentes**","Je ne sais pas"]	0	4	t	positionnement	211	\N	\N	\N	45	qcm
1992	À quoi sert la fonctionnalité “Consolider” ?	["À **regrouper** des données dans un **modèle de données** utile au **tableau croisé dynamique**","À **regrouper** et **résumer** des données provenant de **plusieurs** feuilles ou classeurs en un **seul** tableau","À **figer** les données afin qu’elle ne puisse pas être **déplacés** ou **modifiés**","Je ne sais pas"]	1	5	t	positionnement	211	\N	\N	\N	45	qcm
1993	Quelle est la méthode la plus rapide pour rechercher une valeur spécifique dans un tableau et renvoyer une autre valeur correspondante ?	["**INDEX** et **EQUIV**","**RECHERCHEV**","**DECALER**","Je ne sais pas"]	1	1	t	positionnement	178	\N	\N	\N	45	qcm
1994	Dans un tableau croisé dynamique, à quoi sert un champ calculé ?	["À **formater** le champ en **pourcentage**","À **ajouter** des **sous-totaux** au champ sélectionné","À **créer** un **nouveau** champ basé sur une **formule** appliquée aux champs existants","Je ne sais pas"]	2	2	t	positionnement	178	\N	\N	\N	45	qcm
1995	Quelle fonctionnalité avancée permet de trouver la meilleure solution possible à un problème donné selon des contraintes ?	["L’outil **solveur**","Le gestionnaire de **scénario**","Un **tableau croisé dynamique** basé sur un **modèle de données**","Je ne sais pas"]	0	3	t	positionnement	178	\N	\N	\N	45	qcm
1996	Dans quel ruban peut-on trouver des contrôles de formulaire ou contrôles ActiveX ?	["**Insertion**","**Données**","**Développeur**","Je ne sais pas"]	2	4	t	positionnement	178	\N	\N	\N	45	qcm
1997	Quelles actions adaptées dois-je mettre en œuvre afin de mettre en forme les cellules contenant des dates d’entrée des salariés en fonction de, la date du jour et de 10 ans d’ancienneté ?	["Je **sélectionne manuellement** les cellules à chaque fois, je **choisis** une mise en forme en utilisant un **style de cellule**, et je **les change** à chaque mois","J’utilise une **mise en forme conditionnelle** avec **formule** et j’intègre la fonction **DATEDIF**","On ne peut le faire qu’à l’aide du **VBA**","Je ne sais pas"]	1	5	t	positionnement	178	\N	\N	\N	45	qcm
473	Savez-vous naviguer sur internet 	["Acquis","Moyen","Insuffisant"]	0	12	t	prerequis	\N		quiz	\N	\N	qcm
2000	Enregistrer une image permet de :	["L’imprimer","Je ne sais pas","La sauvegarder ","La supprimer"]	2	3	t	positionnement	202		quiz	\N	48	qcm
2001	Un format JPEG est principalement utilisé pour :**	["Dessin vectoriel","Animation","Je ne sais pas","Photo compressée "]	3	1	t	positionnement	203		quiz	\N	48	qcm
2002	L’outil de sélection sert à :	["Exporter une image","Ajouter un texte","Je ne sais pas","Choisir une zone à modifier "]	3	2	t	positionnement	203		quiz	\N	48	qcm
2004	Rogner une image signifie :	["Ajuster la luminosité","Ajouter un filtre","Je ne sais pas","Recadrer l’image "]	3	4	t	positionnement	203		quiz	\N	48	qcm
2006	Fusionner des calques permet de :	["Ajouter un filtre","Augmenter la résolution","Je ne sais pas","Simplifier la composition "]	3	1	t	positionnement	212		quiz	\N	48	qcm
2007	Modifier la résolution agit sur :	["La couleur dominante","Le texte","Je ne sais pas","La qualité d’impression "]	3	2	t	positionnement	212		quiz	\N	48	qcm
2008	L’outil texte permet de :**	["Rogner l’image","Je ne sais pas","Ajouter du texte éditable ","Modifier un filtre"]	2	3	t	positionnement	212		quiz	\N	48	qcm
2009	Un filtre de flou sert à :	["Supprimer un calque","Réduire le poids du fichier","Je ne sais pas","Adoucir une image "]	3	4	t	positionnement	212		quiz	\N	48	qcm
2010	Le mode colorimétrique RVB est destiné à :	["L’impression offset","L’animation","Je ne sais pas","L’affichage écran"]	3	1	t	positionnement	213		quiz	\N	48	qcm
2014	À quoi sert principalement SketchUp ?	["Modélisation 3D","Retouche photo","Je ne sais pas"]	0	1	t	positionnement	205	\N	\N	\N	21	qcm
2027	Pourquoi orienter correctement les axes ?	["Faciliter la modélisation précise","Réduire le poids","Je ne sais pas","Esthétique"]	0	1	t	positionnement	215		quiz	\N	21	qcm
2012	Quelle est la fonction d’un masque de calque et comment l’appliquer correctement :	["Supprimer définitivement des parties du calque","Dupliquer un calque","Je ne sais pas","Masquer ou révéler des zones du calque sans supprimer les pixels, en peignant en noir/blanc "]	3	3	t	positionnement	213		quiz	\N	48	qcm
2015	Que permet l’outil “Sélection” ?	["Choisir un élément du modèle","Supprimer un fichier","Je ne sais pas"]	0	2	t	positionnement	205	\N	\N	\N	21	qcm
2016	À quoi sert l’outil “Rectangle” ?	["Créer une caméra","Mesurer une distance","Je ne sais pas"]	-1	3	t	positionnement	205	\N	\N	\N	21	qcm
2017	Pour enregistrer un fichier pour la première fois : Cliquer sur**	["« Fichier » puis « enregistrer »","« Fichier » puis « enregistrer sous »","« Fichier » puis « enregistrer comme modèle type »","« Fichier » puis « exporter »","Je ne sais pas"]	1	1	t	positionnement	206	\N	\N	\N	21	qcm
2018	À quoi sert la molette de la souris ?	["Supprimer","Dessiner","Je ne sais pas"]	-1	2	t	positionnement	206	\N	\N	\N	21	qcm
2019	Pourquoi grouper des éléments ?	["Éviter qu’ils se collent","Réduire le poids du fichier","Je ne sais pas"]	0	3	t	positionnement	206	\N	\N	\N	21	qcm
2020	Que permet l’outil “Mètre” ?	["Vérifier ou créer une côte","Créer un axe","Je ne sais pas"]	0	4	t	positionnement	206	\N	\N	\N	21	qcm
2021	Dans SketchUp, à quoi servent les balises (calques) ?**	["À créer des volumes","À gérer l’affichage et l’organisation du modèle","À mesurer les distances","À appliquer des matériaux","Je ne sais pas"]	1	5	t	positionnement	206	\N	\N	\N	21	qcm
2022	À quoi sert principalement l’outil _Pousser/Tirer_ dans SketchUp ?**	["À dessiner des lignes","À mesurer des distances","Je ne sais pas"]	-1	1	t	positionnement	214	\N	\N	\N	21	qcm
2023	Différence principale entre groupe et composant ?	["Le composant est lié à ses copies","Taille","Je ne sais pas"]	0	2	t	positionnement	214	\N	\N	\N	21	qcm
2024	Pourquoi verrouiller un objet ?	["Le cacher","L’exporter","Je ne sais pas"]	-1	3	t	positionnement	214	\N	\N	\N	21	qcm
2025	À quoi servent les scènes ?	["Ajouter de la lumière","Dessiner plus vite","Je ne sais pas"]	-1	4	t	positionnement	214	\N	\N	\N	21	qcm
2026	Pourquoi nettoyer un modèle ?	["Changer couleur","Ajouter des textures","Je ne sais pas"]	-1	5	t	positionnement	214	\N	\N	\N	21	qcm
2030	Pourquoi optimiser un modèle avant export ?	["Ajouter détails","Modifier lumière","Je ne sais pas"]	-1	4	t	positionnement	215	\N	\N	\N	21	qcm
2031	Que permet l’outil _Suivez-moi_ ?**	["Créer une scène","Appliquer un matériau","Extruder une forme le long d’un tracé","Mesurer un angle","Je ne sais pas"]	2	5	t	positionnement	215	\N	\N	\N	21	qcm
2028	Dans SketchUp, à quoi correspondent les 3 axes (rouge, vert, bleu) ?	["Aux directions X, Y, Z de l’espace 3D","Aux calques (tags)","Aux scènes","Je ne sais pas","Aux matériaux du modèle"]	0	2	t	positionnement	215		quiz	\N	21	qcm
2029	À quoi sert une coupe de section ?	["Supprimer","Texturer","Je ne sais pas","Voir l’intérieur du modèle "]	3	3	t	positionnement	215		quiz	\N	21	qcm
2013	L’outil pipette sert à :	["Effacer une zone","Je ne sais pas","Ils sont identiques","Je ne sais pas","Prélever une couleur "]	4	4	t	positionnement	213		quiz	\N	48	qcm
2003	Un calque permet de :	["Imprimer plus vite","Supprimer une couleur","Je ne sais pas","Séparer les éléments d’une image "]	3	3	t	positionnement	203		quiz	\N	48	qcm
2060	A quoi sert le logiciel Word ?	["A **créer** des **tableaux** avec des **formules** automatisées","A **écrire** un mail","A **rédiger** du contenu **traitement de texte**","Je ne sais pas"]	2	1	t	positionnement	190	\N	\N	\N	44	qcm
2061	Quelle action permet de sauvegarder un document Word pour la première fois ?	["**Accueil** \\\\> **Copier**","**Fichier** \\\\> **Enregistrer sous**","**Fichier** \\\\> **Exporter**","Je ne sais pas"]	1	2	t	positionnement	190	\N	\N	\N	44	qcm
2062	Par où passe-t-on pour intégrer une photo depuis l’ordinateur ?	["**Dessin** > **Ajouter**","**Insertion** > **Images **","**Insertion** > **Objet**","Je ne sais pas"]	1	3	t	positionnement	190	\N	\N	\N	44	qcm
2063	Quel raccourci clavier permet d’enregistrer rapidement un document ?	["CTRL + **S **","CTRL + **E**","**F7**","Je ne sais pas"]	0	1	t	positionnement	191	\N	\N	\N	44	qcm
2064	Quelle méthode est la plus rapide pour mettre en forme un tableau ?	["Sélectionner les cellules puis **Accueil** > **Trame de fond**","Sélectionner les cellules puis **Accueil** > **Couleur de surlignage**","Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","Je ne sais pas"]	2	2	t	positionnement	191	\N	\N	\N	44	qcm
2065	Je souhaite aligner un mot à une position précise sur la ligne sans déplacer tout le paragraphe. Que dois-je utiliser ?	["Un **retrait**","Des **espaces**","Une **tabulation**","Je ne sais pas"]	2	3	t	positionnement	191	\N	\N	\N	44	qcm
2066	Comment insérer le logo de mon entreprise en en-tête de document ?	["**Se positionner** sur le **1er** paragraphe puis **Insérer** une image","**Double clic** dans la partie la plus **haute** de la page puis **Insérer** une image","**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","Je ne sais pas"]	1	4	t	positionnement	191	\N	\N	\N	44	qcm
2067	Quelle couleur de soulignement indique une faute de grammaire ?	["Bleu","Vert","Rouge","Je ne sais pas"]	0	5	t	positionnement	191	\N	\N	\N	44	qcm
2068	Quel outil permet d’appliquer rapidement un format uniforme à plusieurs paragraphes ?	["**Copier** > **Coller**","**Accueil** > **Styles**","**Rechercher** > **Remplacer**","Je ne sais pas"]	1	1	t	positionnement	216	\N	\N	\N	44	qcm
2069	Pour créer un texte en deux colonnes, on utilise :	["**Insertion** > **Tableau**","**Insertion** > **Zone de texte**","**Mise en page** > **Colonnes **","Je ne sais pas"]	2	2	t	positionnement	216	\N	\N	\N	44	qcm
2070	Quel est le format d’un modèle de document ?	[".**DOTX**",".**DOCX**",".**DOCM**","Je ne sais pas"]	0	3	t	positionnement	216	\N	\N	\N	44	qcm
474	Savez-vous créer un dossier et y ranger et renommer un fichier 	["Acquis","Moyen","Insuffisant"]	0	13	t	prerequis	\N		quiz	\N	\N	qcm
2071	Je veux intégrer un tableau créé dans Excel dans mon document Word et pouvoir le modifier dans Word, quelle méthode dois-je utiliser ?	["**Insertion** > **Tableau** > Feuille de calcul **Excel**","On **ne peut pas** insérer un **tableau** provenant **d’Excel** et le **modifier** dans **Word**","**Copier** le tableau dans **Excel** > **Coller** de manière **spéciale** dans **Word **","Je ne sais pas"]	2	4	t	positionnement	216	\N	\N	\N	44	qcm
2072	J’ai un document assez long et je souhaite ordonner mes grands titres dans un sommaire en début de document, quelle méthode est la plus adaptée ?	["**Insertion** > **Ajouter un sommaire**","**Références** > **Tables des matières **","Je **liste** mes grands titres sur la **1ère page** et leur **associent** le **numéro** de page correspondant","Je ne sais pas"]	1	5	t	positionnement	216	\N	\N	\N	44	qcm
2073	Comment organiser un document long en plusieurs documents liés ?	["En partageant le document via un **cloud** (**OneDrive**) pour du travail **collaboratif**","Créer une **table des matières** suffira","En utilisant le principe du **document maître** et des **sous-documents**","Je ne sais pas"]	2	1	t	positionnement	217	\N	\N	\N	44	qcm
2074	Quelle est la différence entre une note de bas de page et une note de fin ?	["La note de bas de page est visible **uniquement à l’impression**, la note de fin **uniquement dans le document**","La note de bas de page s’affiche **en bas de la page concernée**, tandis que la note de fin est **regroupée à la fin du document** ou d’une section","Il n’y a pas de **différence**, ce sont les **mêmes** fonctionnalités","Je ne sais pas"]	1	2	t	positionnement	217	\N	\N	\N	44	qcm
2075	A quoi sert le mode « Suivi des modifications » ?	["À avoir un **historique des différentes versions** du document","À proposer une **relecture** du document afin de **le vérifier**","À **visualiser** et **corriger** des **modifications proposées** par d’autres utilisateurs ou par soi-même","Je ne sais pas"]	2	3	t	positionnement	217	\N	\N	\N	44	qcm
438	L'outil Plume génère des courbes de...	["Bézier","Newton","Planck","Gauss"]	0	3	t	positionnement	124	\N	\N	\N	20	qcm
2005	Quelle est la différence entre les formats XCF, JPEG et PNG ? :**	["JPEG est vectoriel, PNG est bitmap","Il n’y a aucune différence","Je ne sais pas","XCF conserve les calques, JPEG compresse avec une perte, PNG conserve la transparence "]	3	5	t	positionnement	203		quiz	\N	48	qcm
426	Quel est le format d'enregistrement de projet natif à Photoshop ?	[".jpg",".png",".psd",".pdf"]	2	1	t	positionnement	122	\N	\N	\N	20	qcm
427	Lequel de ces outils permet de sélectionner une partie rectangulaire de l'image ?	["L'outil Rectangle de sélection","L'outil Baguette magique","L'outil Pinceau","L'outil Crayon"]	0	2	t	positionnement	122	\N	\N	\N	20	qcm
428	Que représente le panneau 'Calques' ?	["Une bibliothèque de polices","Les feuilles transparentes superposées composant l'image","Les filtres d'effets visuels","Un historique de modifications"]	1	3	t	positionnement	122	\N	\N	\N	20	qcm
429	Comment annuler la dernière action effectuée par défaut (sur les versions récentes) ?	["Ctrl + Z","F1","Ctrl + D","Echap"]	0	4	t	positionnement	122	\N	\N	\N	20	qcm
430	L'outil 'Loupe' (ou Zoom) sert à :	["Augmenter définitivement la résolution de l'image","Agrandi la zone de travail à l'écran pour mieux voir les détails sans modifier le fichier","Nettoyer les yeux rouges","Chercher des fichiers sur l'ordinateur"]	1	5	t	positionnement	122	\N	\N	\N	20	qcm
431	Généralement, pour la sélection d'un ciel bleu uni, quel outil parmi ces choix est le plus rapide ?	["Plume","Lasso Libre","Baguette magique / Sélection rapide","Gomme"]	2	1	t	positionnement	123	\N	\N	\N	20	qcm
432	À quoi sert un 'Masque de fusion' associé à un calque ?	["A fusionner tous les calques du document en arrière-plan","A masquer temporairement et de manière non-destructive des zones du calque en peignant en noir","A appliquer un flou de mouvement global","A réduire la résolution"]	1	2	t	positionnement	123	\N	\N	\N	20	qcm
433	Combien de pixels par pouce (DPI/PPP) recommande-t-on le plus souvent pour une impression standard professionnelle ?	["72","150","300","720"]	2	3	t	positionnement	123	\N	\N	\N	20	qcm
434	Quel outil est représenté par une icône de 'pansement' (ou tampon) ?	["L'outil Correcteur localisé, utilisé pour gommer les imperfections/tâches","Le tampon de motif","L'outil Historique","L'outil Dégradé"]	0	4	t	positionnement	123	\N	\N	\N	20	qcm
435	Lequel de ces raccourcis permet de clore (valider) une 'Transformation manuelle' (Ctrl + T) ?	["La touche Echap","Touche Entrée (ou double clic dans la zone)","Touche Suppr","Ctrl + S"]	1	5	t	positionnement	123	\N	\N	\N	20	qcm
436	Qu'est-ce qu'un 'Objet dynamique' (Smart Object) dans un calque ?	["Un calque vectoriel qui s'anime et forme un GIF autonome","Un calque qui empaquette une image source, permettant de la redimensionner indéfiniment sans perte destructrice de la résolution initiale","Un texte en 3D volumétrique","Un objet qui change de couleur selon l'arrière-plan avec un style IA"]	1	1	t	positionnement	124	\N	\N	\N	20	qcm
437	A quelle logique fonctionnelle répondent les 'Modes de fusion' (comme Produit ou Superposition) ?	["Permettre la réplication d'images sur des supports réseau cloud distants multicalques","Dicter mathématiquement la manière dont les pixels d'un calque vont se mélanger visuellement avec les calques et pixels situés en dessous","Pré-séparer les couches CMJN avant tirage machine","Créer des vecteurs paramétriques sans lissage de crénage"]	1	2	t	positionnement	124	\N	\N	\N	20	qcm
439	Si un calque de 'Réglage (Levels/Courbes)' doit n'affecter QUE le calque directement en dessous de lui, que devons-nous utiliser ?	["Verrouiller les pixels transparents du calque principal","Créer un Masque d'écrêtage ('Clipping Mask') entre les deux calques (Alt+Clic entre les 2)","Fusionner prématurément","Effacer le réglage global via un filtre Gauss"]	1	4	t	positionnement	124	\N	\N	\N	20	qcm
440	Quel espace colorimétrique utilise-t-on par défaut principalement pour un affichage web/écran standard ?	["CMJN","Pantone","Niveaux de gris","RVB / sRGB"]	3	5	t	positionnement	124	\N	\N	\N	20	qcm
441	Le terme 'Séparations de couches' (Channels) fait appel à la maitrise de l'extraction par les couches R, V ou B en noir et blanc...	["Pour concevoir des gifs interactifs flash plus légers par compression locale adaptative","Oui, typiquement exploitée pour la sélection complexe des cheveux ou éléments translucides très fins hors des vecteurs tracés","Pour réduire les vibrations d'écrans lors de la publication web","Simplement pour désactiver les droits d'auteur en métadonnées EXIF d'origine"]	1	1	t	positionnement	125	\N	\N	\N	20	qcm
442	Savoir utiliser les outils 'Densité +/ Densité -' de façon experte réfère au jargon anglais du...	["Dodge and Burn, souvent peint localement via un calque gris neutre 50% en mode Incrustation ou Lumière tamisée pour modeler le volume sans affecter l'image native","Healing Brush paramétrique IA basé sur des modèles GAN volumétriques externes","Clipping paths texturés limités des objets vectoriels du cloud interne créatif","Rien, c'est un vieil outil inutile remplacé par la commande teinte et saturation"]	0	2	t	positionnement	125	\N	\N	\N	20	qcm
443	Comment exploiter au mieux Camera Raw Filter intégré à Photoshop sur un flux expert d'image composite ?	["Il ne s'applique qu'au tout début sur l'importation de fichiers .CR2 ou .NEF bruts limités, il ne faut surtout pas essayer de l'utiliser après dans la composition","En le combinant systématiquement à un filtre externe tiers, obligatoire de nos jours","En l'appliquant en tant que Filtre dynamique sur un Objet Dynamique, pour des corrections colorimétriques non destructives modulables tout au long du processus","Il sert uniquement à effacer les aberrations chromatiques via des Scripts d'actions externes"]	2	3	t	positionnement	125	\N	\N	\N	20	qcm
444	En quoi les 'Compositions de calques' (Layer Comps) sont-elles différentes des simples Groupes ou Ensembles Photoshop ?	["Elles enregistrent différents états de visibilité, position et style des calques, pour générer des variantes (ou 'Maquettes multiples') dans un seul et même document fichier .psd allégé","Il n'y a pas de différence, Adobe a juste changé le nom des dossiers Groupe en 2018","Elles limitent à 5 calques les objets dynamiques pour la gestion de la ram allégée locale 16bits","Elles génèrent de la musique ambiante durant l'édition selon un modèle IA prédictif colorimétrique analytique de base"]	0	4	t	positionnement	125	\N	\N	\N	20	qcm
445	Parmi ces assertions d'automatisation via Scripts, quelle est la limite notable par défaut ?	["Seuls 5 Scripts peuvent être lus simultanément dans un même document .psd complexe","Généralement, pour conditionner ou insérer de la 'logique IF / ELSE' stricte dans des scripts complexes, le simple enregistreur d'Actions ne suffit plus et l'on doit passer par ExtendScript (JavaScript) lié à Photoshop","Les scripts sont totalement bloqués par la nouvelle IA de l'édition Génératrice 'Adobe Firefly' en local sur du Remplissage génératif classique de base","Il faut obligatoirement du C++ pour créer soi-même des Droplets sur Windows depuis 2021"]	1	5	t	positionnement	125	\N	\N	\N	20	qcm
453	Quel est l’objectif principal de votre formation ?	["Découvrir l’outil par curiosité","Créer un site vitrine pour présenter votre activité","Créer une boutique en ligne pour vendre des produits"]	0	100	f	complementary	\N	\N	\N	{"type":"radio_toggle"}	\N	qcm
454	Quelle suite logicielle souhaitez-vous privilégier ?	["Microsoft Office (Word, Excel, PPT)","Google Workspace (Docs, Sheets, Slides)"]	0	50	f	complementary	\N	\N	\N	{"type":"radio_toggle"}	\N	qcm
2011	Comment utiliser le Correcteur et le Tampon pour retoucher des zones complexes avec texture :	["Tampon : appliquer un filtre, Correcteur : ajouter du texte","Ils font la même chose","Je ne sais pas","Tampon : copier-coller exactement, Correcteur : adapter texture et couleur à la zone cible "]	3	2	t	positionnement	213		quiz	\N	48	qcm
470	Votre fréquence d’utilisation d’un ordinateur 	["Tous les jours","Occasionnelle","Jamais"]	0	5	t	prerequis	\N		quiz	\N	\N	qcm
2123	Hello, my name ___ Sarah.	["am","is","are","Je ne sais pas"]	1	1	t	positionnement	1		quiz	\N	25	qcm
2124	We ___ English on Monday.	["are","have","has","Je ne sais pas"]	1	2	t	positionnement	1		quiz	\N	25	qcm
2125	She ___ 12 years old.	["is","are","has","Je ne sais pas"]	0	3	t	positionnement	1		quiz	\N	25	qcm
2126	There ___ a book on the table.	["are","have","is","Je ne sais pas"]	2	4	t	positionnement	1		quiz	\N	25	qcm
2127	She ___ TV right now.	["watches","watching","is watching","Je ne sais pas"]	2	5	t	positionnement	1		quiz	\N	25	qcm
2128	She ___ to the gym three times a week.	["go","goes","is going","Je ne sais pas"]	1	6	t	positionnement	1		quiz	\N	25	qcm
2132	Quelle est la différence entre un masque bitmap et un masque vectoriel dans GIMP :	["Bitmap est toujours invisible, Vectoriel toujours visible","Bitmap : basé sur les pixels, Vectoriel : basé sur les formes et tracés ","Ils sont identiques","Je ne sais pas"]	1	1	t	prerequis	213		quiz	\N	48	qcm
2102	Votre métier (poste actuel) 	[]	0	1	t	prerequis	\N		quiz	\N	\N	text
2130	Utilisez-vous les logiciels suivants : 	["Traitement de texte type Word, Google Docs","Tableur feuille de calcul type Excel, Google Sheets","Logiciel de présentation type PowerPoint, Google Slides","Je n’utilise aucun de ces logiciels"]	0	1	t	prerequis	\N		quiz	\N	22	checkbox
2076	Quelle option permet de protéger d’un document ?	["**Révision** > **Restreindre** la modification","**Fichiers** > **Informations** > **Gérer le document**","**Accueil** > **Protéger**","Je ne sais pas"]	0	4	t	positionnement	217	\N	\N	\N	44	qcm
2077	Comment se nomme l’outil qui permet de manipuler (masquer, sélectionner, renommer, réorganiser) différents objets ?	["Volet de **navigation**","Sélectionner les **objets**","Volet **sélection **","Je ne sais pas"]	2	5	t	positionnement	217	\N	\N	\N	44	qcm
2079	Quels sont les 2 éléments indispensables pour avoir un site internet ?**	["Un ordinateur puissant et une connexion fibre optique.","Un compte Facebook professionnel et une carte de visite avec un QR Code.","Un nom de domaine (l'adresse du site) et un hébergement (l'espace de stockage sur un serveur).","Je ne sais pas"]	2	1	t	positionnement	193	\N	\N	\N	22	qcm
2080	Où puis-je télécharger le logiciel WordPress ?**	["Sur site officiel : https://fr.wordpress.org/","Dans une boutique informatique","sur Google Play Store ou App Store","Je ne sais pas"]	0	2	t	positionnement	193	\N	\N	\N	22	qcm
2081	Pour vous, qu'est-ce que WordPress ?**	["Un logiciel de traitement de texte comme Word.","Un outil (CMS) qui permet de créer et gérer un site web sans forcément coder.","Un hébergeur de site web uniquement.","Je ne sais pas"]	1	3	t	positionnement	193	\N	\N	\N	22	qcm
2082	À quoi sert principalement un thème dans WordPress ?**	["À définir l'apparence visuelle, la mise en page et le design du site.","À protéger le site contre les attaques de pirates et les malwares.","À stocker la base de données de tous les articles et commentaires du site.","Je ne sais pas"]	0	4	t	positionnement	193	\N	\N	\N	22	qcm
2083	Ajouter des fonctionnalités à WordPress.✅	["Changer l'apparence graphique du site.","Ajouter des utilisateurs.","Je ne sais pas"]	-1	1	t	positionnement	194	\N	\N	\N	22	qcm
2084	Si vous souhaitez changer votre mot de passe ou votre adresse e-mail de profil, où allez-vous ?**	["Dans le fichier wp-config.php.","Dans la gestion de votre compte via le tableau de bord de WordPress.","Dans le menu \\"Thèmes\\".","Je ne sais pas"]	1	2	t	positionnement	194	\N	\N	\N	22	qcm
2085	Quelle est la différence entre un "Article" et une "Page" ?**	["Il n'y en a pas, c'est la même chose.","L'Article est payant, la Page est gratuite.","La Page est pour du contenu dit statique (Contact, À propos), l'Article est pour du contenu chronologique (Actualités).","Je ne sais pas"]	2	3	t	positionnement	194	\N	\N	\N	22	qcm
2086	Vous souhaitez ajouter une fonctionnalité de formulaire de contact. Où allez-vous ?**	["Dans l'onglet \\"Apparence\\".","Dans l'onglet Extensions\\" (Plugins).","Dans l'onglet \\"Réglages\\" > \\"Discussion\\".","Je ne sais pas"]	1	4	t	positionnement	194	\N	\N	\N	22	qcm
2087	Je souhaite modifier les couleurs de mon site WordPress, que dois-je faire ?**	["Modifier les réglages du site.","Coder le HTML.","Personnaliser le thème.","Je ne sais pas"]	2	5	t	positionnement	194	\N	\N	\N	22	qcm
2088	À quoi servent les "Permaliens" dans les réglages de WordPress ?**	["À changer la langue du site","À définir la structure des adresses URL des pages","À sauvegarder le site sur un disque dur","Je ne sais pas"]	1	1	t	positionnement	218	\N	\N	\N	22	qcm
2089	Qu'est-ce qu'un "Menu" dans WordPress ?**	["La liste des ingrédients pour faire fonctionner le site.","L'élément de navigation qui permet aux visiteurs d'accéder aux différentes pages.","Un outil pour changer les couleurs du site.","Je ne sais pas"]	1	2	t	positionnement	218	\N	\N	\N	22	qcm
2090	Dans WordPress, quelle est la fonction principale d'un "Article" ?**	["Créer du contenu permanent et fixe, comme une page \\"Contact\\"","Publier des contenus actualisés qui s'affichent par ordre chronologique, du plus récent au plus ancien.","Modifier uniquement le design des couleurs et la police d'écriture de tout le site.","Je ne sais pas"]	1	3	t	positionnement	218	\N	\N	\N	22	qcm
2091	Dans quel répertoire sont situées les extensions (plugins) de WordPress ?**	["wp-content/uploads","wp-include/wp-plugins","wp-content/plugins","Je ne sais pas"]	1	4	t	positionnement	218	\N	\N	\N	22	qcm
2092	Sous quelle forme l'URL d'un article est-elle la plus optimisée pour le SEO ?**	["www.mon-site.com/?p=64631","www.mon-site.com/exemple-article-64631","[www.mon-site.com/exemple-article](http://www.mon-site.com/exemple-article)","Je ne sais pas"]	2	5	t	positionnement	218	\N	\N	\N	22	qcm
39	Quel est votre métier actuel ?	[]	0	1	f	complementary	\N	Profil professionnel	work	{"type":"textarea","rows":2,"placeholder":"Ex : Comptable, Vendeur, Secrétaire..."}	\N	qcm
2131	Quel est l’objectif principal de votre formation 	["Découvrir l'outil par curiosité.","Créer un site vitrine pour présenter une activité.","Créer une boutique en ligne pour vendre des produits."]	0	2	t	prerequis	\N		quiz	\N	22	qcm
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, brand, civilite, nom, prenom, telephone, conseiller, "formationChoisie", "prerequisiteScore", "levelsScores", "stopLevel", "finalRecommendation", "createdAt", "emailSentAt", "scorePretest", "complementaryQuestions", availabilities, "stagiaireId", "lastValidatedLevel", "isCompleted", "positionnementAnswers", metier, situation) FROM stdin;
475140af-6b6c-4b19-85d6-cdd638277fa5	aopia	Mme	Paul	Maisie	+1 (404) 627-5928	Aut voluptatem sit 	Parcours Initial (DigComp & Word)	{"470":"Occasionnelle","473":"Moyen","474":"Moyen","477":"Moyen","478":"Insuffisant","2099":"Moyen"}	\N	\N	Formation non reconnue	2026-02-26 11:24:46.564681	\N	\N	{"39":"dfg","40":"Non","41":"Non","42":"","447":"dfg"}	{"43":["Matin"],"44":"dfg","45":"dfg"}	\N	\N	f	\N	dfg	["Salarié"]
0439fc71-05c9-4b20-bf0a-e18898ca70c0	aopia	M.	Verbeke	Syriac	+261600000000	az	\N	\N	\N	\N	\N	2026-02-26 16:15:46.919309	\N	\N	\N	\N	\N	\N	f	\N	\N	\N
5f78e3c4-41dd-4b89-a162-e02c02d6eba3	aopia	Mme	Dennis	Ashely	+1 (398) 134-9978	Qui aut dolore perfe	Parcours Initial (DigComp & Word)	{"470":"Occasionnelle","473":"Insuffisant","474":"Insuffisant","477":"Insuffisant","2109":"Insuffisant"}	\N	\N	DigComp Initial | Word Initial	2026-02-26 12:08:05.80836	\N	\N	\N	\N	\N	\N	f	\N	Qui est ad dolore nu	["Salarié"]
389628cc-7875-425a-98c3-9d6592b1320f	aopia	M.	Verbeke	Syriac	+261600000000	hjk	WordPress	{"470":"Jamais","473":"Moyen","474":"Moyen","477":"Moyen","2109":"Moyen"}	{"Initial":{"score":1,"total":4,"percentage":25,"requiredCorrect":4,"validated":false}}	Initial	Initial | Basique	2026-02-26 16:47:32.420748	2026-02-26 17:11:16.388	25	{"40":"Non","41":"Non","42":"","447":"gh"}	{"43":["Matin"],"44":"fgh","45":"fgh"}	\N	Débutant	t	{"Initial":{"2079":"Un ordinateur puissant et une connexion fibre optique.","2080":"Dans une boutique informatique","2081":"Un outil (CMS) qui permet de créer et gérer un site web sans forcément coder.","2082":"À protéger le site contre les attaques de pirates et les malwares."}}	df	["Salarié"]
6c4c8d97-fb65-4e21-9250-547c778fccea	aopia	M.	Verbeke	Syriac	+261600000000	fgh	Anglais 	{"470":"Jamais","473":"Moyen","474":"Moyen","477":"Insuffisant","2109":"Moyen"}	{"A1":{"score":2,"total":12,"percentage":16.666666666666664,"requiredCorrect":3,"validated":false}}	A1	Anglais  - A1 & A2	2026-02-26 12:40:56.416813	\N	\N	\N	\N	\N	Débutant	f	{"A1":{"9":"is","10":"have","11":"are","12":"have","13":"watching","14":"is going","2032":"are","2033":"are","2034":"are","2035":"have","2036":"watching","2037":"is going"}}	sdf	["Salarié"]
72470336-a86c-4037-b173-20dd15dc177e	aopia	M.	Verbeke	Syriac	+261600000000	az	Pack Office Word	{"470":"Occasionnelle","473":"Moyen","474":"Moyen","477":"Moyen","2109":"Moyen","2110":"Jamais","2111":"Insuffisant","2112":"Moyen","2113":"Moyen","2115":"Moyen","2116":"Mettre à jour votre système d’exploitation et vos logiciels"}	{"Débutant":{"score":5,"total":5,"percentage":100,"requiredCorrect":5,"validated":true},"Intermédiaire":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Avancé":{"score":1,"total":5,"percentage":20,"requiredCorrect":5,"validated":false}}	Avancé	Intermédiaire | Avancé	2026-02-26 13:05:42.36613	2026-02-26 14:54:15.417	67	{"40":"Oui","41":"Non","42":"","447":"sdf"}	{"43":["Matin"],"44":"sdf","45":"sdf"}	\N	Intermédiaire	t	{"Débutant":{"382":"B (ou G)","383":"Ctrl + Z","384":"Onglet Accueil","385":"Elle enregistre le document","386":"Ctrl + A"},"Intermédiaire":{"387":"A structurer le document de manière cohérente","388":"Aligner le texte des deux côtés (gauche/droite) uniformément","389":"Mise en page","390":"Copier le style graphique d'un texte et l'appliquer ailleurs","391":"Une façon de forcer le début de texte sur la page suivante"},"Avancé":{"392":"Réécrire les titres manuellement et ajouter des points","393":"Un saut de section ferme le document","394":"A enregistrer automatiquement après chaque frappe","395":"Lier un document Word à une base de données (ex: fichier Excel) pour envoyer des courriers personnalisés","396":"A ajouter des numéros de page avec un style original"}}	dfgdf	["Salarié"]
c4cf8074-da4b-49e7-b9ab-db8e2d9c6f8c	aopia	Mme	Santiago	Nigel	+1 (464) 174-3909	Recusandae Velit qu	Pack Office Word	{"470":"Tous les jours","473":"Moyen","474":"Moyen","477":"Moyen","478":"Moyen","2099":"Moyen"}	{"Débutant":{"score":5,"total":5,"percentage":100,"requiredCorrect":5,"validated":true},"Intermédiaire":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Avancé":{"score":3,"total":5,"percentage":60,"requiredCorrect":5,"validated":false}}	Avancé	Avancé et Expert	2026-02-26 11:46:53.825119	2026-02-26 11:58:21.064	80	{"40":"Non","41":"Non","42":"","447":"fgh"}	{"43":["Matin"],"44":"fgh","45":"fgh"}	\N	Intermédiaire	t	{"Débutant":{"382":"B (ou G)","383":"Ctrl + Z","384":"Onglet Accueil","385":"Elle enregistre le document","386":"Ctrl + A"},"Intermédiaire":{"387":"A structurer le document de manière cohérente","388":"Aligner le texte des deux côtés (gauche/droite) uniformément","389":"Mise en page","390":"Copier le style graphique d'un texte et l'appliquer ailleurs","391":"Une façon de forcer le début de texte sur la page suivante"},"Avancé":{"392":"Créer une Table des matières à l'aide des Styles de Titre appliqués","393":"Un saut de section permet de changer de mise en page (ex: paysage/portrait) au sein d'un document","394":"A enregistrer automatiquement après chaque frappe","395":"Publier son document sur un blog public","396":"A renvoyer à une explication ou source positionnée en bas de la même page"}}	Est repudiandae mole	["Salarié"]
31b9a447-70e4-485f-8376-ad0624c30fb4	aopia	M.	Verbeke	Syriac	+261600000000	hj	Pack Office Excel	{"470":"Jamais","473":"Moyen","474":"Insuffisant","477":"Moyen","2109":"Moyen","2115":"Insuffisant"}	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Initial	Pack Office Excel - Initial & Basique	2026-02-26 15:17:39.979307	\N	\N	\N	\N	\N	Débutant	f	{"Initial":{"1975":"Une **cellule **","1976":"\\\\=**SOMME**(A1 ; A3 ; A5 ; A7)","1977":"**Camembert** / **Histogramme** / **Linéaire**"}}	fgh	["Salarié"]
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (key, value, description) FROM stdin;
SUPPORT_PHONE	01 23 45 67 89	Téléphone de support affiché
PLATFORM_NAME	Wizzi Learn	Nom de la plateforme
ADMIN_EMAIL	herizo.randrianiaina@mbl-service.com	Email de réception des bilans
POSITIONNEMENT_PAGINATED	false	Afficher le positionnement question par question
PREREQUIS_PAGINATED	true	Afficher les prérequis question par question
\.


--
-- Data for Name: stagiaires; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stagiaires (id, civilite, nom, prenom, email, telephone, "createdAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, role, "createdAt", name) FROM stdin;
3	test@test.fr	$2b$10$xl4.8qwisASO0SkY4Bc5bus97WsH5v9/TKpIlwoJuTkv7qLaLhchy	admin	2026-02-23 10:07:45.21547	fdg
4	admin@wizy-learn.com	admin123	admin	2026-02-23 17:53:05.171398	\N
\.


--
-- Data for Name: workflow_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflow_steps (id, code, label, "order", route, "isActive") FROM stdin;
1	IDENTIFICATION	Identification du bénéficiaire	0	/	t
3	PREREQUIS	Test informatique prérequis	1	/prerequis	t
2	FORMATION_SELECTION	Choix de la formation	2	/formations	t
4	POSITIONNEMENT	Test de positionnement	3	/positionnement	t
5	RESULTATS	Résultat et validation de la formation	4	/resultats	t
6	COMPLEMENTARY	Questions complémentaires	5	/complementary	t
7	AVAILABILITIES	Disponibilités	6	/availabilities	t
8	VALIDATION	Validation finale	7	/validation	t
\.


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contacts_id_seq', 151, true);


--
-- Name: formations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.formations_id_seq', 48, true);


--
-- Name: levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.levels_id_seq', 259, true);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_id_seq', 2132, true);


--
-- Name: stagiaires_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stagiaires_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: workflow_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workflow_steps_id_seq', 8, true);


--
-- Name: levels PK_05f8dd8f715793c64d49e3f1901; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT "PK_05f8dd8f715793c64d49e3f1901" PRIMARY KEY (id);


--
-- Name: questions PK_08a6d4b0f49ff300bf3a0ca60ac; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY (id);


--
-- Name: sessions PK_3238ef96f18b355b671619111bc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY (id);


--
-- Name: stagiaires PK_68ac98bbda6ca0b4ac33578e0ca; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stagiaires
    ADD CONSTRAINT "PK_68ac98bbda6ca0b4ac33578e0ca" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: workflow_steps PK_b602e5ecb22943db11c96a7f31c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT "PK_b602e5ecb22943db11c96a7f31c" PRIMARY KEY (id);


--
-- Name: contacts PK_b99cd40cfd66a99f1571f4f72e6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY (id);


--
-- Name: settings PK_c8639b7626fa94ba8265628f214; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT "PK_c8639b7626fa94ba8265628f214" PRIMARY KEY (key);


--
-- Name: formations PK_e071aaba3322392364953ba5c95; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formations
    ADD CONSTRAINT "PK_e071aaba3322392364953ba5c95" PRIMARY KEY (id);


--
-- Name: formations UQ_18bb1c327ebc1cb28cc1e658085; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formations
    ADD CONSTRAINT "UQ_18bb1c327ebc1cb28cc1e658085" UNIQUE (slug);


--
-- Name: workflow_steps UQ_230fe2a1dcd6f447a00475aaf94; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT "UQ_230fe2a1dcd6f447a00475aaf94" UNIQUE (code);


--
-- Name: stagiaires UQ_746c11ce1e2323e7be4333d0e45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stagiaires
    ADD CONSTRAINT "UQ_746c11ce1e2323e7be4333d0e45" UNIQUE (email);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: questions FK_0fcf8577a48cae9d3f670f271a8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "FK_0fcf8577a48cae9d3f670f271a8" FOREIGN KEY ("formationId") REFERENCES public.formations(id);


--
-- Name: levels FK_796e64d3767d4451a9f8aa24702; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT "FK_796e64d3767d4451a9f8aa24702" FOREIGN KEY ("formationId") REFERENCES public.formations(id);


--
-- Name: questions FK_7a6c725e75f11d735f97b9c54be; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "FK_7a6c725e75f11d735f97b9c54be" FOREIGN KEY ("levelId") REFERENCES public.levels(id);


--
-- Name: sessions FK_8aef363b8c6fc539ecaf20f4945; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "FK_8aef363b8c6fc539ecaf20f4945" FOREIGN KEY ("stagiaireId") REFERENCES public.stagiaires(id);


--
-- PostgreSQL database dump complete
--

