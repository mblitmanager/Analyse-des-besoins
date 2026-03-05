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
    "prerequisQuestionsScope" character varying(12) DEFAULT 'global'::character varying NOT NULL,
    "complementaryQuestionsScope" character varying(12) DEFAULT 'global'::character varying NOT NULL,
    "availabilitiesQuestionsScope" character varying(12) DEFAULT 'global'::character varying NOT NULL,
    "miseANiveauQuestionsScope" character varying(12) DEFAULT 'global'::character varying NOT NULL,
    "enableLowScoreWarning" boolean DEFAULT true NOT NULL
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
    "formationId" integer,
    "isActive" boolean DEFAULT true NOT NULL
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
-- Name: parcours_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parcours_rules (
    id integer NOT NULL,
    formation character varying(100) NOT NULL,
    condition character varying(255) NOT NULL,
    formation1 character varying(255) NOT NULL,
    formation2 character varying(255) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "requirePrerequisiteFailure" boolean DEFAULT false NOT NULL,
    "order" double precision DEFAULT '0'::double precision NOT NULL
);


ALTER TABLE public.parcours_rules OWNER TO postgres;

--
-- Name: parcours_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.parcours_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parcours_rules_id_seq OWNER TO postgres;

--
-- Name: parcours_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.parcours_rules_id_seq OWNED BY public.parcours_rules.id;


--
-- Name: question_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_rules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    workflow character varying(100) NOT NULL,
    formation character varying,
    "questionId" integer,
    operator character varying(50) DEFAULT 'EQUALS'::character varying NOT NULL,
    "expectedValue" character varying,
    "resultType" character varying(255) NOT NULL,
    "resultMessage" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.question_rules OWNER TO postgres;

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
    "responseType" character varying(20) DEFAULT 'qcm'::character varying NOT NULL,
    "correctResponseIndexes" text,
    "showIfQuestionId" integer,
    "showIfResponseIndexes" text,
    "showIfResponseValue" character varying,
    "showIfRules" text,
    "showIfOperator" character varying(10) DEFAULT 'OR'::character varying NOT NULL
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
    conseiller character varying,
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
    situation text,
    "miseANiveauAnswers" text,
    "highLevelContinue" boolean DEFAULT false NOT NULL
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
-- Name: parcours_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcours_rules ALTER COLUMN id SET DEFAULT nextval('public.parcours_rules_id_seq'::regclass);


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

COPY public.formations (id, slug, label, "isActive", category, icon, color, objectifs, prequis, "modaliteDuree", "dateEnregistrement", certificateur, programme, "prerequisQuestionsScope", "complementaryQuestionsScope", "availabilitiesQuestionsScope", "miseANiveauQuestionsScope", "enableLowScoreWarning") FROM stdin;
23	digcomp	DigComp	t	Internet	\N	\N	Améliorer sa culture numérique globale. Maîtriser les outils informatiques et la sécurité en ligne.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 12h accompagnement.	18/12/2024	DigComp	Séquence 1 : Recherche d'information et veille. Séquence 2 : Communication et collaboration. Séquence 3 : Création de contenu numérique. Séquence 4 : Sécurité et protection des données.	auto	auto	auto	global	t
24	intelligence-artificielle-générative	Intelligence Artificielle Générative	t	IA	\N	\N	Maîtriser l'usage responsable de l'IA générative pour la création de contenus rédactionnels et visuels.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. 21h dont 12h accompagnement.	18/12/2024	Certification Interne / RS	Séquence 1 : Fondamentaux de l'IA. Séquence 2 : Prompt engineering. Séquence 3 : Création de textes et images. Séquence 4 : Éthique et limites de l'IA.	auto	auto	auto	global	t
19	illustrator	Illustrator	t	Création	\N	\N	Concevoir des illustrations et des logos vectoriels. Maîtriser les outils de dessin et de mise en page.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h accompagnement.	18/12/2024	TOSA	Séquence 1 : Interface et outils de base.\nSéquence 2 : Dessin vectoriel et formes.\n Séquence 3 : Couleurs et dégradés.\n Séquence 4 : Exportation et impression.	auto	auto	auto	global	t
22	wordpress	WordPress	t	Internet	search	\N	Créer et administrer un site internet sur-mesure. Gérer les thèmes, les extensions et le contenu.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 12h à 14h accompagnement.	18/12/2024	TOSA / ICDL	Séquence 1 : Installation et configuration. Séquence 2 : Création de pages et articles. Séquence 3 : Personnalisation avec thèmes et plugins. Séquence 4 : Sécurité et SEO.	auto	auto	auto	global	t
5	google-sheets	Google Sheets	t	Bureautique Google	school	#3B82F6							auto	auto	auto	global	t
4	google-docs	Google Docs	t	Bureautique Google	school	#3B82F6							auto	auto	auto	global	t
10	google-slides	Google Slides	t	Bureautique Google	table	#3B82F6			Individuelle à votre rythme. Accès e-learning 1 an + 10h à 20h accompagnement.				auto	auto	auto	global	t
43	outils-collaboratifs-google	Outils Collaboratifs Google	t	Internet	\N	\N	\N	\N	\N	\N	\N	\N	auto	auto	auto	global	t
51	voltaire	Français	t	LANGUES	spellcheck	blue-600	\N	\N	\N	\N	\N	\N	auto	auto	auto	global	t
15	pack-office-outlook	Outlook	t	Bureautique Microsoft	\N	\N	Gérer efficacement sa messagerie, son calendrier et ses tâches. Collaborer avec les outils Outlook.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h accompagnement.	18/12/2024	TOSA	Séquence 1 : Gestion des mails. Séquence 2 : Calendrier et rendez-vous. Séquence 3 : Gestion des contacts et des tâches.	auto	auto	auto	global	t
44	word	Word	t	Bureautique Microsoft	description	blue-600	\N	\N	\N	\N	\N	\N	auto	auto	auto	global	t
20	photoshop	Photoshop	t	Création	draw	\N	Retoucher des images et des photos avec expertise. Découvrir les outils d'IA générative de Photoshop.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h à 12h accompagnement.	18/12/2024	ICDL / TOSA	Séquence 1 : Retouche photo et calques. Séquence 2 : Sélections et masques. Séquence 3 : Filtres et effets. Séquence 4 : IA générative.	auto	auto	auto	global	t
25	toeic	Anglais 	t	LANGUES	spellcheck	\N	\N	\N	\N	\N	\N	\N	auto	auto	auto	global	t
45	excel	Excel	t	Bureautique Microsoft	table_view	green-500	\N	\N	\N	\N	\N	\N	auto	auto	auto	global	t
21	sketchup	Sketchup	t	Création	square	\N	Concevoir des projets d'aménagement intérieur et extérieur en 3D. Modéliser des espaces et des objets.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h accompagnement.	18/12/2024	ICDL	Séquence 1 : Bases de la modélisation 3D. Séquence 2 : Matériaux et textures. Séquence 3 : Rendu et présentation.	auto	auto	auto	global	t
54	ppt	PowerPoint	t	Bureautique Microsoft	slide	#3B82F6							both	both	both	both	t
48	gimp	Gimp	t	Création	\N	\N	\N	\N	\N	\N	\N	\N	both	both	both	both	t
\.


--
-- Data for Name: levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.levels (id, label, "order", "successThreshold", "recommendationLabel", "formationId", "isActive") FROM stdin;
488	Initial	1	3	\N	20	t
489	Basique	2	4	\N	20	t
490	Opérationnel 	3	4	\N	20	t
308	Découverte	1	4	Niveau Découverte - Formation Français recommandée	51	t
309	Technique	2	4	Niveau Technique - Formation Français recommandée	51	t
310	Professionnel	3	4	Niveau Professionnel - Formation Français recommandée	51	t
311	Affaires	4	5	Niveau Affaires - Formation Français recommandée	51	t
492	Expert	5	5	\N	20	t
491	Avancé 	4	4	\N	20	t
493	Initial	1	3	\N	15	t
494	Basique	2	4	\N	15	t
57	Expert	5	5	Parcours Expert	23	t
217	Avance	4	5	\N	44	t
495	Opérationnel	3	4	\N	15	t
178	Expert	5	5	Parcours Expert	45	t
213	Avance	4	5	\N	48	t
215	Avance	4	5	\N	21	t
208	Operationnel	3	4	\N	23	t
209	Avance	4	4	\N	23	t
210	Operationnel	3	4	\N	45	t
212	Operationnel	3	4	\N	48	t
214	Operationnel	3	4	\N	21	t
216	Operationnel	3	4	\N	44	t
201	Basique	2	5	\N	23	t
191	Basique	2	4	\N	44	t
193	Initial	1	4	\N	22	t
194	Basique	2	4	\N	22	t
292	Initial	1	3	Niveau Débutant - Formation Google Docs recommandée	4	t
200	Initial	1	3	\N	23	t
293	Basique	2	4	Niveau Basique - Formation Google Docs recommandée	4	t
187	Initial	1	3	\N	45	t
294	Opérationnel	3	4	Niveau Intermédiaire - Formation Google Docs recommandée	4	t
202	Initial	1	3	\N	48	t
206	Basique	2	4	\N	21	t
205	Initial	1	3	\N	21	t
295	Avancé	4	5	Niveau Avancé - Formation Google Docs recommandée	4	t
190	Initial	1	3	\N	44	t
304	Initial	1	3	Niveau Débutant - Formation Outils Collaboratifs Google recommandée	43	t
305	Basique	2	4	Niveau Basique - Formation Outils Collaboratifs Google recommandée	43	t
306	Opérationnel	3	4	Niveau Intermédiaire - Formation Outils Collaboratifs Google recommandée	43	t
307	Avancé	4	5	Niveau Avancé - Formation Outils Collaboratifs Google recommandée	43	t
203	Basique	2	3	\N	48	t
300	Initial	1	3	Niveau Débutant - Formation Google Slides recommandée	10	t
301	Basique	2	4	Niveau Basique - Formation Google Slides recommandée	10	t
302	Opérationnel	3	4	Niveau Intermédiaire - Formation Google Slides recommandée	10	t
303	Avancé	4	5	Niveau Avancé - Formation Google Slides recommandée	10	t
296	Initial	1	3	Niveau Débutant - Formation Google Sheets recommandée	5	t
297	Basique	2	4	Niveau Basique - Formation Google Sheets recommandée	5	t
299	Avancé	4	5	Niveau Avancé - Formation Google Sheets recommandée	5	t
298	Opérationnel	3	4	Niveau Intermédiaire - Formation Google Sheets recommandée	5	t
496	Avancé	4	4	\N	15	t
497	Expert	5	5	\N	15	t
529	Initial	1	3	\N	54	t
530	Basique	2	4	\N	54	t
531	Opérationnel	3	4	\N	54	t
211	Avance	4	4	\N	45	t
188	Basique	2	4	\N	45	t
218	Operationnel	3	5	\N	22	t
2	A2 - Consolider les bases	2	5	Parcours Elémentaire (A2)	25	t
3	B1 - Développer l'autonomie	3	5	Parcours Intermédiaire (B1)	25	t
1	A1 - Revoir les bases	1	6	Parcours Débutant (A1)	25	t
4	B2 - Renforcer les compétences	4	5	Parcours Avancé (B2)	25	t
5	C1 - Se perfectionner	5	5	Parcours Expert (C1)	25	t
383	Initial	1	4	\N	19	t
384	Basique	2	4	\N	19	t
385	Opérationnel	3	5	\N	19	t
533	Initial	0	3	\N	24	t
534	Expert	5	5	\N	54	t
532	Avancé	4	4	\N	54	t
\.


--
-- Data for Name: parcours_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parcours_rules (id, formation, condition, formation1, formation2, "isActive", "requirePrerequisiteFailure", "order") FROM stdin;
3	Word	Si résultat du test = Initial	TOSA Word Initial	TOSA Word Basique	t	f	1
4	Word	Si résultat du test = Basique	TOSA Word Basique	TOSA Word Opérationnel	t	f	2
13	Anglais	Si test = A1 - Revoir les bases et obtenir le niveau B1	A2	B1	t	f	0
14	Anglais	Si test = A2 - Consolider les bases et obtenir le niveau B1	A2	B1	t	f	1
15	Anglais	Si test = B1 - Développer l'autonomie et obtenir le niveau B1	A2	B1	t	f	2
16	Anglais	Si test = B2 - Renforcer les compétences	B1	B2	t	f	3
17	Anglais	Si test = C1 Se perfectionner	B2	C1	t	f	4
29	WordPress	Si résultat du test = Initial	TOSA WordPress Initial	TOSA WordPress Basique	t	f	0
30	WordPress	Si résultat du test = Basique ou Opérationnel	TOSA WordPress Basique	TOSA WordPress Opérationnel	t	f	1
31	SketchUp	Si résultat du test = Initial	ICDL SketchUp Initial	ICDL SketchUp Basique	t	f	0
32	SketchUp	Si résultat du test = Basique ou Opérationnel	ICDL SketchUp Basique	ICDL SketchUp Opérationnel	t	f	1
33	SketchUp	Si résultat du test = Avancé ou Expert	ICDL SketchUp Opérationnel	ICDL SketchUp Avancé	t	f	2
46	GIMP	Si résultat du test = Initial	ICDL GIMP Initial	ICDL GIMP Basique	t	f	0
47	GIMP	Si résultat du test = Basique ou Opérationnel	ICDL GIMP Basique	ICDL GIMP Opérationnel	t	f	1
48	GIMP	Si résultat du test = Avancé ou Expert	ICDL GIMP Opérationnel	ICDL GIMP Avancé	t	f	2
52	Google Docs/Sheets/Slides	Si résultat du test < Initial	ICDL Outils Coll	ICDL Outils Coll	t	f	0
53	Google Docs/Sheets/Slides	Si résultat du test = Initial ou Basique ou Opérationnel	ICDL Docs/Sheets/Slides	ICDL Docs/Sheets/Slides	t	f	1
54	Google Docs/Sheets/Slides	Si résultat du test = Avancé ou Expert	ICDL Docs/Sheets/Slides	ICDL Docs/Sheets/Slides	t	f	2
25	DigComp	Si résultat du test = Initial	DigComp Initial	DigComp Basique	t	f	1
26	DigComp	Si résultat du test = Basique	DigComp Basique	DigComp Operationnel	t	f	2
7	Excel	Si résultat du test = Initial	DigComp Initial	Excel Initial	t	t	0
12	Excel	Si résultat du test = Avance	Excel Avance	Excel Expert	t	f	4
11	Excel	Si résultat du test = Operationnel	Excel Operationnel	Excel Avance	t	f	3
10	Excel	Si résultat du test = Basique	Excel Basique	Excel Operationnel	t	f	2
34	Français	Si résultat du test = Découverte	Français Découverte	Français Technique	t	f	0
8	Excel	Si résultat du test = Initial	Excel Initial	Excel Basique	t	f	1
35	Français	Si résultat du test = Technique	Français Technique	Français Professionnel	t	f	1
36	Français	Si résultat du test = Professionnel	Français Professionnel	Français Affaires	t	f	2
1	Word	Si résultat du test = Initial	DigComp Initial	Word Initial	t	t	0
37	Outlook	Si résultat du test = Initial	DigComp Initial	Outlook Initial	t	t	0
39	Outlook	Si résultat du test = Basique	Outlook Basique	Outlook Basique	t	f	2
19	PowerPoint	Si résultat du test = Initial	PowerPoint Initial	DigComp Initial	t	t	0
20	PowerPoint	Si résultat du test = Initial	PowerPoint Initial	PowerPoint Basique	t	f	1
21	PowerPoint	Si résultat du test = Basique	PowerPoint Basique	PowerPoint Opérationnel	t	f	2
43	Photoshop	Si résultat du test = Basique	Photoshop Basique	Photoshop Opérationnel 	t	f	1
42	Photoshop	Si résultat du test <= Initial	Photoshop Initial	Photoshop Basique	t	f	0
38	Outlook	Si résultat du test = Initial	Outlook Initial	Outlook Basique	t	f	1
49	Outils Collaboratifs Google	Si résultat du test < Initial	Outils Collaboratifs Google Initial	Outils Collaboratifs Google Basique	t	f	0
24	DigComp	Si résultat du test = Initial	DigComp Initial	TOSA Word/Excel /PPT Initial	t	t	0
50	Outils Collaboratifs Google	Si résultat du test = Basique	Outils Collaboratifs Google Basique	Google Doc /Sheets /Slides	t	f	1
59	IA Inkrea	Test pré-requis technique uniquement	Inkrea IA	Inkrea IA	t	f	0
60	Anglais 	Si résultat du test = A1 - Revoir les bases	Anglais  A2 - Consolider les bases	Anglais  B1 - Développer l'autonomie	t	f	0
61	Anglais 	Si résultat du test = A2 - Consolider les bases	Anglais  A2 - Consolider les bases	Anglais  B1 - Développer l'autonomie	t	f	1
62	Anglais 	Si résultat du test = B1 - Développer l'autonomie	Anglais  A2 - Consolider les bases	Anglais  B1 - Développer l'autonomie	t	f	2
63	Anglais 	Si résultat du test = B2 - Renforcer les compétences	Anglais  B1 - Développer l'autonomie	Anglais  B2 - Renforcer les compétences	t	f	3
64	Anglais 	Si résultat du test = C1 - Se perfectionner	Anglais  B2 - Renforcer les compétences	Anglais  C1 - Se perfectionner	t	f	4
65	Gimp	Si résultat du test = Initial	Gimp Basique	Gimp Operationnel	t	f	0
67	Google Docs	Si résultat du test = Initial	Google Docs Basique	Google Docs Opérationnel	t	f	1
66	Google Docs	Si résultat du test = Initial	Outils Collaboratifs Google Basique	Outils Collaboratifs Google Opérationnel	t	t	0
68	Google Sheets	Si résultat du test = Initial	Outils Collaboratifs Google Basique	Outils Collaboratifs Google Opérationnel	t	t	0
69	Google Sheets	Si résultat du test = Initial	Google Sheets Basique	Google Sheets Opérationnel	t	f	1
71	Google Slides	Si résultat du test = Initial	Google Slides Basique	Google Slides Opérationnel	t	f	1
70	Google Slides	Si résultat du test = Initial	Outils Collaboratifs Google Basique	Outils Collaboratifs Google Opérationnel	t	t	0
56	Illustrator	Si résultat du test = Basique	Illustrator Basique	Illustrator Opérationnel	t	f	1
55	Illustrator	Si résultat du test = Initial	Illustrator Initial	Illustrator Basique	t	f	0
72	Sketchup	Si résultat du test = Initial	Sketchup Basique	Sketchup Operationnel	t	f	0
73	Intelligence Artificielle Générative	Si résultat du test = Initial	Inkrea IA	Inkrea IA	t	f	0
\.


--
-- Data for Name: question_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_rules (id, workflow, formation, "questionId", operator, "expectedValue", "resultType", "resultMessage", "isActive", "order", "createdAt", "updatedAt") FROM stdin;
7d9ef371-da91-4603-9c39-777b9ab4d44e	prerequis	\N	470	EQUALS	Jamais	FORMATION_RECOMMENDATION	DigComp	t	0	2026-03-05 18:38:34.413878	2026-03-05 19:37:28.825561
f025b393-d82d-4d00-8cf7-4d83d8039b80	prerequis	\N	477	EQUALS	Non	FORMATION_RECOMMENDATION	DigComp	t	1	2026-03-05 19:38:05.079669	2026-03-05 19:38:05.079669
9665400f-b8e7-49ec-9064-550dedcb60cb	prerequis	\N	2640	EQUALS	Insufissant	FORMATION_RECOMMENDATION	DigComp	t	2	2026-03-05 19:46:31.717191	2026-03-05 19:46:31.717191
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (id, text, options, "correctResponseIndex", "order", "isActive", type, "levelId", category, icon, metadata, "formationId", "responseType", "correctResponseIndexes", "showIfQuestionId", "showIfResponseIndexes", "showIfResponseValue", "showIfRules", "showIfOperator") FROM stdin;
1952	Je reçois un email avec une pièce jointe que je veux la mettre sur mon ordinateur	["Je clique sur Enregistrez sous","Je l’ouvre et je copie le texte","Je ne sais pas"]	0	1	t	positionnement	200	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1953	Je veux me connecter facilement aux services de l’état (Impôts…)	["Je peux me connecter sans m’identifier","J’utilise l’Identité Numérique La Poste","Je ne sais pas"]	1	2	t	positionnement	200	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1954	Je veux faire une visio sur mon ordinateur	["J’utilise Windows","J’utilise Teams","J’utilise Excel","Je ne sais pas"]	1	3	t	positionnement	200	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1955	Je cherche une information sur internet	["Je consulte plusieurs sites et compare les informations","Je regarde un seul site","Je ne sais pas trop comment vérifier","Je n’utilise pas Internet pour cela"]	0	1	t	positionnement	201	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1956	J’ai reçu un mail que je souhaite renvoyer à une autre personne, que dois-je faire	["Je clique sur répondre","Je copie tout le texte dans un nouveau mail","Je transfère le mail","Je ne sais pas comment faire"]	2	2	t	positionnement	201	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1957	Je dois rédiger un courrier important	["J’utilise le logiciel Excel","J’utilise le logiciel Word","Je vais sur internet","Je ne sais pas faire"]	1	3	t	positionnement	201	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1958	Mon ordinateur est lent et il devient difficile de travailler	["Je ferme un programme","Je redémarre l’ordinateur","Je demande de l’aide","Je ne sais pas"]	1	4	t	positionnement	201	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
15	We ___ tired, so we decided to go home.	["was","were","are","Je ne sais pas"]	1	7	t	positionnement	2		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
20	We ___ to the supermarket yesterday.	["go","went","are going","Je ne sais pas"]	1	12	t	positionnement	2		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
19	Mary is ___ her sister.	["as beautiful as","beautiful","more beautiful","Je ne sais pas"]	0	11	t	positionnement	2		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
40	Êtes-vous en recherche d'emploi ?	["Oui","Non"]	0	3	t	complementary	\N	Profil professionnel	search	{"type":"radio_toggle"}	\N	qcm	\N	\N	\N	\N	\N	OR
18	He’s the ___ student in the class.	["more tall","taller","tallest","Je ne sais pas"]	2	10	t	positionnement	2		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
17	There isn’t ___ milk left in the fridge.	["many","much","a few","Je ne sais pas"]	1	9	t	positionnement	2		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
16	While I ___ TV, I heard a strange noise.	["am watching","were watching","was watching","Je ne sais pas"]	2	8	t	positionnement	2		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
21	I’ve known her ___ we were children.	["for","since","during","Je ne sais pas"]	1	13	t	positionnement	3		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
22	If I ___ more time, I would travel around the world.	["have","had","will have","Je ne sais pas"]	1	14	t	positionnement	3		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
23	The castle ___ in 1692.	["was built","is built","was building","Je ne sais pas"]	0	15	t	positionnement	3		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
24	She ___ here for five years.	["has worked","works","is working","Je ne sais pas"]	0	16	t	positionnement	3		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
25	He felt sick because he ___ too much chocolate.	["ate","has eaten","had eaten","Je ne sais pas"]	2	17	t	positionnement	3		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
26	I ___ more water recently and I feel better.	["have been drinking","had drunk","drank","Je ne sais pas"]	0	18	t	positionnement	3		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
27	You ___ me about the problem earlier.	["should have told","should told","must","Je ne sais pas"]	0	19	t	positionnement	4		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
28	If the baby had slept better, I ___ so tired.	["won’t be","wouldn’t be","wouldn’t have been","Je ne sais pas"]	2	20	t	positionnement	4		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
29	By this time next year, I ___ my studies.	["will finish","will have finished","am finishing","Je ne sais pas"]	1	21	t	positionnement	4		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
30	This time tomorrow, we ___ on the beach.	["will lie","will be lying","lie","Je ne sais pas"]	1	22	t	positionnement	4		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
31	The meeting was called ___ due to unexpected problems.	["off","up","out","Je ne sais pas"]	0	23	t	positionnement	4		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
32	___ he was tired, he continued working.	["Because","Despite","Although","Je ne sais pas"]	2	24	t	positionnement	4		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
33	You ___ apologise now if you want to avoid further conflict.	["would rather","had better","will","Je ne sais pas"]	1	25	t	positionnement	5		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
34	I’d rather you ___ this matter confidential.	["kept","keep","will keep","Je ne sais pas"]	0	26	t	positionnement	5		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
35	The committee demanded that the report ___ before Friday.	["is submitted","was submitted","be submitted","Je ne sais pas"]	2	27	t	positionnement	5		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
36	___ the circumstances, his reaction was surprisingly restrained.	["Because","Although","Given","Je ne sais pas"]	2	28	t	positionnement	5		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
37	Rarely ___ such a compelling argument.	["I have heard","have I heard","I heard","Je ne sais pas"]	1	29	t	positionnement	5		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
38	Not only ___ late, but he also failed to apologise.	["he arrived","did he arrive","he did arrive","Je ne sais pas"]	1	30	t	positionnement	5		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
1959	Mots de passe sur internet	["J’utilise ma date de naissance","J’utilise le même mot de passe sur tous les sites","J’utilise une combinaison de chiffres, de lettres majuscules et minuscules et de symboles","J’utilise seulement 6 caractères"]	2	5	t	positionnement	201	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1960	Je veux trouver une information précise sur internet	["Je fais une recherche simple sur Google","J’utilise la recherche avancée en précisant des critères","J’ouvre plusieurs pages web","Je ne sais pas"]	1	1	t	positionnement	208	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
42	Si oui, décrivez le en quelques mots ?	[]	0	5	t	complementary	\N	Profil professionnel	settings_accessibility	{"type":"textarea","rows":3,"placeholder":"Décrivez vos besoins d'aménagement...","condition":"handicap == 'Oui'"}	\N	qcm	[]	\N	\N	\N	\N	OR
2617	Quelle extension correspond à l’enregistrement sous le format diaporama ?	["PPTX","POTX","PPSX","Je ne sais pas"]	2	2	t	positionnement	531		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
1961	Pour classer mes mails, je dois	["Attribuer un numéro par email pour les classer","Je les classe par ordre alphabétique","Je crée des dossiers par thèmes","Je ne sais pas"]	2	2	t	positionnement	208	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
482	Avez-vous déjà réalisé des démarches administratives en ligne ?	["Oui","Non"]	-1	14	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
1962	Je dois transmettre un courrier important par mail mais il ne doit pas être possible de le modifier	["Je transfère mon fichier Word","Je fais une photo de mon fichier et je l’envoi","Je le transforme en PDF","Je ne sais pas"]	2	3	t	positionnement	208	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1963	Je dois imprimer une grande quantité de courrier	["J’imprime sur une imprimante Jet d’encre","J’utilise une imprimante laser","J’enregistre en fichier impression","Je ne sais pas"]	1	4	t	positionnement	208	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
2334	Comment enregistrer les modifications dans un document Google Docs ?	["Fichier > Enregistrer","Elles sont enregistrées automatiquement","Édition > Copier","Je ne sais pas"]	1	2	t	positionnement	292	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
1964	Je veux mettre mon ordinateur en sécurité	["J’utilise plusieurs antivirus","J’utilise un antivirus","j’utilise un malware ou un ransomware","Je ne sais pas"]	1	5	t	positionnement	208	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1965	Vous avez trouvé une information importante sur Google	["Vous savez comment vérifier cette information","Inutile de la vérifier puisqu’elle est disponible","Je refais la même recherche sur un autre moteur de recherche","Je ne sais pas"]	0	1	t	positionnement	209	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1966	Je dois créer mon identité numérique	["Je dois refaire ma pièce d’identité","Je dois avoir un compte sur un réseau social","Je peux la créer avec une application sur mon téléphone","Je ne sais pas"]	2	2	t	positionnement	209	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1967	Je dois créer un rapport de mes dépenses	["Le logiciel Word sera parfait pour faire ça","Je peux créer un tableau sur Excel avec des formules automatiques","Je m’adresse à un comptable","Je ne sais pas"]	1	3	t	positionnement	209	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1968	Ma box internet est en panne et j’ai un document urgent à envoyer	["Je partage la connexion avec mon téléphone","J’imprime mon document et je l’envoie par la poste","Je cherche un voisin chez qui je pourrais me connecter","Je ne sais pas"]	0	4	t	positionnement	209	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1969	La sécurité de mes données est importante sur mon ordinateur	["Ma box internet me protège du piratage","j’utilise plusieurs antivirus sur mon ordinateur","J’effectue régulièrement un scan de mes fichiers avec mon antivirus","Je ne sais pas"]	2	5	t	positionnement	209	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1970	Je veux rester en permanence informé sur un sujet donné	["Je consulte les journaux","J’utilise des outils de veille","Je consulte plein de sites internet tous les jours","Je ne sais pas"]	1	1	t	positionnement	57	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1971	La e-citoyenneté c’est quoi ?	["L’utilisation régulière des outils numériques","La présence sur les réseaux sociaux","Le respect de règles établies","Je ne sais pas"]	2	2	t	positionnement	57	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1972	Quelle fonction Excel permet d’additionner des valeurs en respectant plusieurs critères ?	["SOMME.SI.ENS","SOMME.SI","SOMME","Je ne sais pas"]	0	3	t	positionnement	57	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1973	Quel moyen est efficace pour s’informer sur les progrès technologiques ?	["J’évite Internet pour ne pas se tromper","Je consulte des sites internet","Je me fie uniquement au bouche-à-oreille","Je ne sais pas"]	1	4	t	positionnement	57	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1974	Quel risque peut être lié à une utilisation excessive des technologies numériques ?	["Amélioration automatique de la santé","Disparition de la fatigue","Fatigue visuelle, troubles du sommeil et stress","Augmentation systématique de l’activité physique"]	2	5	t	positionnement	57	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
2512	 Quel outil est indispensable pour créer des tracés courbés et précis manuellement ?	["L'outil Gomme","L'outil Plume","L'outil Pot de peinture","Je ne sais pas"]	1	1	t	positionnement	385		quiz	\N	19	qcm	[]	\N	\N	\N	\N	OR
2513	À quoi sert l'outil "Concepteur de forme" ?	["À dessiner des carrés arrondis","À fusionner ou soustraire des zones de plusieurs formes sélectionnées","À vérifier les fautes d'orthographe","Je ne sais pas"]	1	2	t	positionnement	385		quiz	\N	19	qcm	[]	\N	\N	\N	\N	OR
2514	Comment transformer un texte en dessin vectoriel pour qu'il soit modifiable point par point ?	["En changeant la police","En utilisant la fonction \\"Vectoriser le texte\\"","En l'enregistrant en PNG","Je ne sais pas"]	1	3	t	positionnement	385		quiz	\N	19	qcm	[]	\N	\N	\N	\N	OR
2515	 Quel mode colorimétrique devez-vous choisir pour un logo destiné à l'impression ?	["RVB (Rouge, Vert, Bleu)","CMJN (Cyan, Magenta, Jaune, Noir)","CNoir et Blanc uniquement.","Je ne sais pas"]	1	4	t	positionnement	385		quiz	\N	19	qcm	[]	\N	\N	\N	\N	OR
2516	Comment appelle-t-on les poignées qui permettent de courber un tracé autour d'un point d'ancrage ?	["Les lignes directrices (ou tangentes).","Les élastiques.","Les segments de droite.","Je ne sais pas"]	0	5	t	positionnement	385		quiz	\N	19	qcm	[]	\N	\N	\N	\N	OR
1975	Comment Excel nomme l’intersection d’une ligne et d’une colonne ?	["Une **case**","Une **cellule **","Un **bloc**","Je ne sais pas"]	1	1	t	positionnement	187	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1976	Quelle formule est la plus adaptée et rapide pour additionner les valeurs des cellules A1, A3, A5 et A7 ?	["\\\\=A1 **+** A3 **+** A5 **+** A7","\\\\=**SOMME**(A1 : A7)","\\\\=**SOMME**(A1 ; A3 ; A5 ; A7)","Je ne sais pas"]	2	2	t	positionnement	187	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1977	Comment Excel nomme précisément les 3 principaux graphiques les plus utilisés ?	["**Diagramme** / **Colonnes** / **Courbe**","**Secteur** / **Histogramme** / **Courbe**","**Camembert** / **Histogramme** / **Linéaire**","Je ne sais pas"]	1	3	t	positionnement	187	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
2335	Par défaut, un document Google Docs est enregistré	["Sur le disque dur de l’ordinateur","Dans Google Drive en ligne","Sur une clé USB","Je ne sais pas"]	1	3	t	positionnement	292	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2109	Savez-vous vous repérer dans l’environnement Windows : bureau, menu démarrer, fenêtres, icônes, applications… 	["Oui","Non","Oui avec quelques difficultés "]	0	5	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
1998	À quoi sert principalement GIMP ?	["Gérer des fichiers","Je ne sais pas","Créer des vidéos","Éditer des images "]	3	1	f	positionnement	202		quiz	\N	48	qcm	\N	\N	\N	\N	\N	OR
1978	Quel icône, par le biais du raccourcis clavier (fn)+F4, permet de figer une référence à une cellule ?	["L'icône : **%**","L'icône : **£**","L'icône : **$**","Je ne sais pas"]	2	1	t	positionnement	188	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1979	A quoi sert un filtre ?	["A **afficher** les valeurs correspondant au filtre","A **ordonner** les valeurs en fonction du filtre","A **trier** les valeurs","Je ne sais pas"]	0	2	t	positionnement	188	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1980	Quelle fonction permet d’afficher un résultat en fonction d’un test logique ?	["**SOMME**()","**SI**()","**NB**()","Je ne sais pas"]	1	3	t	positionnement	188	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1981	Je souhaite pouvoir visualiser continuellement ma 1ère ligne de tableau tout en descendant dans un tableau volumineux. Comment se nomme l’outil qui permet cela ?	["Figer les **volets **","Imprimer les **titres**","Mise en forme **conditionnelle**","Je ne sais pas"]	0	4	t	positionnement	188	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1982	Quelle fonction permet d’afficher uniquement la date du jour seule ?	["**MAINTENANT**()","**DATE**()","**AUJOURDHUI**()","Je ne sais pas"]	2	5	t	positionnement	188	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1983	A quoi sert une mise en forme conditionnelle ?	["À **modifier** les valeurs","À **mettre en évidence** les valeurs","À **effacer** les valeurs **ne répondant pas** au critère","Je ne sais pas"]	1	1	t	positionnement	210	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1984	Quelle est l’utilité de la poignée de recopie ?	["De **dupliquer** une feuille","D’**agrandir** une zone sélectionnée","De **copier** et/ou **incrémenter** une valeur","Je ne sais pas"]	2	2	t	positionnement	210	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1985	Je souhaite analyser et synthétiser des données volumineuses de manière rapide. Quel outil est le plus approprié ?	["Un **tableau croisé dynamique**","Les **fonctions** adaptées aux **bases de données**","Un **segment**","Je ne sais pas"]	0	3	t	positionnement	210	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1986	Je souhaite proposer une liste de choix dans une liste déroulante. Par quel ruban dois-je passer ?	["Insertion","Données","Affichage","Je ne sais pas"]	1	4	t	positionnement	210	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1987	Comment éviter des modifications involontaires sur mes formules ?	["Je **déverrouille** les **cellules**","Je **protège** le **classeur**","Je **protège** la **feuille**","Je ne sais pas"]	2	5	t	positionnement	210	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1988	Quelle est la solution la plus adaptée pour effectuer le total de plusieurs multiplications ?	["Réaliser les **multiplications** les unes sous les autres puis utiliser la fonction **SOMME**","Utiliser la fonction SOMMEPROD","Utiliser un **tableau croisé dynamique**","Je ne sais pas"]	1	1	t	positionnement	211	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1989	Je souhaite pouvoir ajouter un seuil fixe dans un graphique histogramme. Quelle méthode est la plus adaptée ?	["Ajouter une **forme** de type « **trait** » et la déplacer au-dessus du **graphique**","Utiliser un **graphique croisé dynamique**","Utiliser un **graphique combiné**","Je ne sais pas"]	2	2	t	positionnement	211	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1990	Que permet le symbole « & » dans Excel ?	["À **additionner** des valeurs","À **concaténer** des valeurs","À **réaliser** des tests logiques **multiples** dans des fonctions conditionnelles","Je ne sais pas"]	1	3	t	positionnement	211	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1991	A quoi sert la fonction EQUIV ?	["À **trouver** la **position** d’une valeur dans une matrice","À **retourner** une **valeur** à partir d’une position","À **tester** les valeurs **équivalentes**","Je ne sais pas"]	0	4	t	positionnement	211	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1992	À quoi sert la fonctionnalité “Consolider” ?	["À **regrouper** des données dans un **modèle de données** utile au **tableau croisé dynamique**","À **regrouper** et **résumer** des données provenant de **plusieurs** feuilles ou classeurs en un **seul** tableau","À **figer** les données afin qu’elle ne puisse pas être **déplacés** ou **modifiés**","Je ne sais pas"]	1	5	t	positionnement	211	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1993	Quelle est la méthode la plus rapide pour rechercher une valeur spécifique dans un tableau et renvoyer une autre valeur correspondante ?	["**INDEX** et **EQUIV**","**RECHERCHEV**","**DECALER**","Je ne sais pas"]	1	1	t	positionnement	178	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1994	Dans un tableau croisé dynamique, à quoi sert un champ calculé ?	["À **formater** le champ en **pourcentage**","À **ajouter** des **sous-totaux** au champ sélectionné","À **créer** un **nouveau** champ basé sur une **formule** appliquée aux champs existants","Je ne sais pas"]	2	2	t	positionnement	178	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1995	Quelle fonctionnalité avancée permet de trouver la meilleure solution possible à un problème donné selon des contraintes ?	["L’outil **solveur**","Le gestionnaire de **scénario**","Un **tableau croisé dynamique** basé sur un **modèle de données**","Je ne sais pas"]	0	3	t	positionnement	178	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1996	Dans quel ruban peut-on trouver des contrôles de formulaire ou contrôles ActiveX ?	["**Insertion**","**Données**","**Développeur**","Je ne sais pas"]	2	4	t	positionnement	178	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1997	Quelles actions adaptées dois-je mettre en œuvre afin de mettre en forme les cellules contenant des dates d’entrée des salariés en fonction de, la date du jour et de 10 ans d’ancienneté ?	["Je **sélectionne manuellement** les cellules à chaque fois, je **choisis** une mise en forme en utilisant un **style de cellule**, et je **les change** à chaque mois","J’utilise une **mise en forme conditionnelle** avec **formule** et j’intègre la fonction **DATEDIF**","On ne peut le faire qu’à l’aide du **VBA**","Je ne sais pas"]	1	5	t	positionnement	178	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
2186	Avez-vous des connaissances en dessin ?	["Oui","Non"]	0	1	t	mise_a_niveau	\N	illustrator	quiz	{"type":"radio_toggle"}	19	qcm	\N	\N	\N	\N	\N	OR
2000	Enregistrer une image permet de :	["L’imprimer","Je ne sais pas","La sauvegarder ","La supprimer"]	2	3	f	positionnement	202		quiz	\N	48	qcm	\N	\N	\N	\N	\N	OR
2006	Fusionner des calques permet de :	["Ajouter un filtre","Augmenter la résolution","Je ne sais pas","Simplifier la composition "]	3	1	f	positionnement	212		quiz	\N	48	qcm	\N	\N	\N	\N	\N	OR
2007	Modifier la résolution agit sur :	["La couleur dominante","Le texte","Je ne sais pas","La qualité d’impression "]	3	2	f	positionnement	212		quiz	\N	48	qcm	\N	\N	\N	\N	\N	OR
2002	L’outil de sélection sert à :	["Exporter une image","Ajouter un texte","Je ne sais pas","Choisir une zone à modifier "]	3	2	f	positionnement	203		quiz	\N	48	qcm	\N	\N	\N	\N	\N	OR
2004	Rogner une image signifie :	["Ajuster la luminosité","Ajouter un filtre","Je ne sais pas","Recadrer l’image "]	3	4	f	positionnement	203		quiz	\N	48	qcm	\N	\N	\N	\N	\N	OR
2027	Pourquoi orienter correctement les axes ?	["Faciliter la modélisation précise","Réduire le poids","Je ne sais pas","Esthétique"]	0	1	t	positionnement	215		quiz	\N	21	qcm	\N	\N	\N	\N	\N	OR
2028	Dans SketchUp, à quoi correspondent les 3 axes (rouge, vert, bleu) ?	["Aux directions X, Y, Z de l’espace 3D","Aux calques (tags)","Aux scènes","Je ne sais pas","Aux matériaux du modèle"]	0	2	t	positionnement	215		quiz	\N	21	qcm	\N	\N	\N	\N	\N	OR
2029	À quoi sert une coupe de section ?	["Supprimer","Texturer","Je ne sais pas","Voir l’intérieur du modèle "]	3	3	t	positionnement	215		quiz	\N	21	qcm	\N	\N	\N	\N	\N	OR
2336	La fonction Zoom permet de	["Modifier la taille du texte à l’impression","Ajuster l’affichage du document à l’écran","Changer la police du document","Je ne sais pas"]	1	1	t	positionnement	293	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2338	Pour rechercher un mot précis dans Google Docs, vous utilisez	["Édition > Rechercher et remplacer","Outils > Rechercher et remplacer","Fichier > Rechercher et remplacer","Je ne sais pas"]	0	3	t	positionnement	293	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2339	Que permet l’alignement du texte “Justifié” ?	["Centrer le texte","Uniformiser l’alignement du texte entre les marges","Aligner le texte à gauche","Je ne sais pas"]	1	4	t	positionnement	293	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2340	Vous souhaitez vérifier le nombre de mots d’un document avant de l’envoyer. Quelle fonctionnalité devez-vous utiliser ?	["Format > Paragraphe","Outils > Nombre de mots","Fichier > Imprimer","Je ne sais pas"]	1	5	t	positionnement	293		quiz	\N	4	qcm	[]	\N	\N	\N	\N	OR
2341	Quelle fonctionnalité permet d’appliquer rapidement la même mise en forme à plusieurs titres ?	["Copier > Coller","Utiliser les styles de titre (Titre 1, Titre 2…)","Changer la police manuellement","Je ne sais pas"]	1	1	t	positionnement	294		quiz	\N	4	qcm	[]	\N	\N	\N	\N	OR
2017	Pour enregistrer un fichier pour la première fois : Cliquer sur	["« Fichier » puis « enregistrer »","« Fichier » puis « enregistrer sous »","« Fichier » puis « enregistrer comme modèle type »","« Fichier » puis « exporter »","Je ne sais pas"]	1	1	t	positionnement	206		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2014	À quoi sert principalement SketchUp ?	["Modélisation 3D","Retouche photo","Je ne sais pas","Montage vidéo"]	0	1	t	positionnement	205		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2015	Que permet l’outil “Sélection” ?	["Choisir un élément du modèle","Supprimer un fichier","Je ne sais pas","Colorier un objet"]	0	2	t	positionnement	205		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2016	À quoi sert l’outil “Rectangle” ?	["Créer une caméra","Mesurer une distance","Je ne sais pas","Dessiner une surface plane"]	3	3	t	positionnement	205		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2018	À quoi sert la molette de la souris ?	["Supprimer","Dessiner","Je ne sais pas","Zoomer/dézoomer"]	3	2	t	positionnement	206		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2020	Que permet l’outil “Mètre” ?	["Vérifier ou créer une côte","Créer un axe","Je ne sais pas","Dessiner une ligne"]	0	4	t	positionnement	206		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2021	Dans SketchUp, à quoi servent les balises (calques) ?	["À créer des volumes","À gérer l’affichage et l’organisation du modèle","À mesurer les distances","À appliquer des matériaux","Je ne sais pas"]	1	5	t	positionnement	206		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2022	À quoi sert principalement l’outil _Pousser/Tirer_ dans SketchUp ?**	["À dessiner des lignes","À mesurer des distances","Je ne sais pas","À créer des volumes à partir de faces"]	3	1	t	positionnement	214		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2023	Différence principale entre groupe et composant ?	["Le composant est lié à ses copies","Taille","Je ne sais pas","Couleur"]	0	2	t	positionnement	214		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2024	Pourquoi verrouiller un objet ?	["Le cacher","L’exporter","Je ne sais pas","Éviter modification accidentelle"]	3	3	t	positionnement	214		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2026	Pourquoi nettoyer un modèle ?	["Changer couleur","Ajouter des textures","Je ne sais pas","Améliorer performance "]	3	5	t	positionnement	214		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2030	Pourquoi optimiser un modèle avant export ?	["Ajouter détails","Modifier lumière","Je ne sais pas","Réduire bugs/poids "]	3	4	t	positionnement	215		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2031	Que permet l’outil _Suivez-moi_ ?	["Créer une scène","Appliquer un matériau","Extruder une forme le long d’un tracé","Mesurer un angle","Je ne sais pas"]	2	5	t	positionnement	215		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2342	Après avoir inséré un tableau dans Google Docs, comment modifier la largeur d’une colonne ?	["Clic droit > Largeur de colonne","Je fais glisser la bordure de la colonne","J’augmente la taille du texte","Je ne sais pas"]	1	2	t	positionnement	294	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2343	Quelle fonctionnalité utiliser pour aligner du texte à une position très précise sur la ligne sans déplacer tout le paragraphe ?	["Des espaces","Une tabulation","Un retrait","Je ne sais pas"]	1	3	t	positionnement	294	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2345	Quelle fonctionnalité permet de séparer un document en plusieurs parties ayant des mises en page différentes ?	["Insérer un saut de ligne","Insérer un saut de section","Changer la police","Je ne sais pas"]	1	5	t	positionnement	294	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2347	Comment insérer un saut de page dans Google Docs ?	["Fichier > Nouvelle page","Insertion > Saut > Saut de page","Format > Page suivante","Je ne sais pas"]	1	2	t	positionnement	295	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2008	L’outil texte permet de :	["Rogner l’image","Je ne sais pas","Ajouter du texte éditable ","Modifier un filtre"]	2	3	f	positionnement	212		quiz	\N	48	qcm	[]	\N	\N	\N	\N	OR
2009	Un filtre de flou sert à :	["Supprimer un calque","Réduire le poids du fichier","Je ne sais pas","Adoucir une image "]	3	4	f	positionnement	212		quiz	\N	48	qcm	\N	\N	\N	\N	\N	OR
2010	Le mode colorimétrique RVB est destiné à :	["L’impression offset","L’animation","Je ne sais pas","L’affichage écran"]	3	1	f	positionnement	213		quiz	\N	48	qcm	\N	\N	\N	\N	\N	OR
2013	L’outil pipette sert à :	["Effacer une zone","Je ne sais pas","Ils sont identiques","Je ne sais pas","Prélever une couleur "]	4	4	f	positionnement	213		quiz	\N	48	qcm	\N	\N	\N	\N	\N	OR
2001	Un format JPEG est principalement utilisé pour :	["Dessin vectoriel","Animation","Je ne sais pas","Photo compressée "]	3	1	f	positionnement	203		quiz	\N	48	qcm	[]	\N	\N	\N	\N	OR
2348	À quoi sert le publipostage ?	["Envoyer un document en pièce jointe","Créer plusieurs documents personnalisés pour différents destinataires","Corriger automatiquement les fautes d’orthographe","Je ne sais pas"]	1	3	t	positionnement	295	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2349	Quelle fonctionnalité permet de vérifier son document avant impression ?	["Fichier > Imprimer","Fichier > Configuration de la page","Outils > Préférence","Je ne sais pas"]	1	4	t	positionnement	295	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2350	Quel mode permet de proposer des modifications visibles par tous sans modifier directement le texte original ?	["Mode Lecture","Mode Impression","Mode Suggestion","Je ne sais pas"]	2	5	t	positionnement	295	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2352	Comment enregistrer les modifications dans un document Google Sheets ?	["Il faut passer par Fichier > Enregistrer","Il n’y a rien à faire, l’enregistrement est automatique","Il faut passer par Édition > Copier","Je ne sais pas"]	1	2	t	positionnement	296	\N	\N	\N	5	qcm	\N	\N	\N	\N	\N	OR
2353	Quelle est la référence correcte d’une cellule située colonne C, ligne 4 ?	["4C","C4","Ligne 4 Colonne C","Je ne sais pas"]	1	3	t	positionnement	296	\N	\N	\N	5	qcm	\N	\N	\N	\N	\N	OR
2355	À quoi sert la poignée de recopie dans Google Sheets ?	["À dupliquer une feuille","À copier ou incrémenter une valeur ou une formule","À fusionner des cellules","Je ne sais pas"]	1	2	t	positionnement	297	\N	\N	\N	5	qcm	\N	\N	\N	\N	\N	OR
2357	Quelle action permet de trier une colonne de données par ordre croissant ?	["Insertion > Trier","Données > Trier la plage","Format > Organiser","Je ne sais pas"]	1	4	t	positionnement	297	\N	\N	\N	5	qcm	\N	\N	\N	\N	\N	OR
2060	A quoi sert le logiciel Word ?	["A **créer** des **tableaux** avec des **formules** automatisées","A **écrire** un mail","A **rédiger** du contenu **traitement de texte**","Je ne sais pas"]	2	1	t	positionnement	190	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2062	Par où passe-t-on pour intégrer une photo depuis l’ordinateur ?	["**Dessin** > **Ajouter**","**Insertion** > **Images **","**Insertion** > **Objet**","Je ne sais pas"]	1	3	t	positionnement	190	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2063	Quel raccourci clavier permet d’enregistrer rapidement un document ?	["CTRL + **S **","CTRL + **E**","**F7**","Je ne sais pas"]	0	1	t	positionnement	191	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2064	Quelle méthode est la plus rapide pour mettre en forme un tableau ?	["Sélectionner les cellules puis **Accueil** > **Trame de fond**","Sélectionner les cellules puis **Accueil** > **Couleur de surlignage**","Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","Je ne sais pas"]	2	2	t	positionnement	191	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2065	Je souhaite aligner un mot à une position précise sur la ligne sans déplacer tout le paragraphe. Que dois-je utiliser ?	["Un **retrait**","Des **espaces**","Une **tabulation**","Je ne sais pas"]	2	3	t	positionnement	191	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2066	Comment insérer le logo de mon entreprise en en-tête de document ?	["**Se positionner** sur le **1er** paragraphe puis **Insérer** une image","**Double clic** dans la partie la plus **haute** de la page puis **Insérer** une image","**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","Je ne sais pas"]	1	4	t	positionnement	191	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2067	Quelle couleur de soulignement indique une faute de grammaire ?	["Bleu","Vert","Rouge","Je ne sais pas"]	0	5	t	positionnement	191	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2068	Quel outil permet d’appliquer rapidement un format uniforme à plusieurs paragraphes ?	["**Copier** > **Coller**","**Accueil** > **Styles**","**Rechercher** > **Remplacer**","Je ne sais pas"]	1	1	t	positionnement	216	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2069	Pour créer un texte en deux colonnes, on utilise :	["**Insertion** > **Tableau**","**Insertion** > **Zone de texte**","**Mise en page** > **Colonnes **","Je ne sais pas"]	2	2	t	positionnement	216	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2346	Comment ajouter le logo de mon entreprise dans l’en-tête du document ?	["Insérer une image > Clic droit > Positionner dans l’en-tête","Double clic dans le haut du document > insérer une image","Se positionner en bas du document > Insérer une image","Je ne sais pas"]	1	1	t	positionnement	295		quiz	\N	4	qcm	[]	\N	\N	\N	\N	OR
2354	Quelle formule permet d’additionner les valeurs des cellules A1 à A5 ?	["=A1+A5","=SOMME(A1:A5)","=MOYENNE(A1:A5)","Je ne sais pas"]	1	1	t	positionnement	297		quiz	\N	5	qcm	[]	\N	\N	\N	\N	OR
2351	Dans Google Sheets, comment appelle-t-on l’intersection d’une ligne et d’une colonne ?	["Un champ","Une cellule","Une case","Je ne sais pas"]	1	1	t	positionnement	296		quiz	\N	5	qcm	[]	\N	\N	\N	\N	OR
2356	Comment sélectionner rapidement plusieurs cellules adjacentes ?	["Maintenir Ctrl et cliquer sur chaque cellule","Cliquer sur la première cellule puis maintenir Maj et cliquer sur la dernière","Double-cliquer sur une cellule","Je ne sais pas"]	1	3	t	positionnement	297		quiz	\N	5	qcm	[]	\N	\N	\N	\N	OR
2358	Quelle fonction me permet d’afficher la date et l’heure en automatique dans une cellule ?	["AUJOURDHUI()","MAINTENANT()","DATE()","Je ne sais pas"]	1	5	t	positionnement	297		quiz	\N	5	qcm	[]	\N	\N	\N	\N	OR
2359	Quel symbole permet de figer une cellule dans une formule Google Sheets ?	["#","$","%","Je ne sais pas"]	1	1	t	positionnement	298		quiz	\N	5	qcm	[]	\N	\N	\N	\N	OR
2070	Quel est le format d’un modèle de document ?	[".**DOTX**",".**DOCX**",".**DOCM**","Je ne sais pas"]	0	3	t	positionnement	216	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2361	Quelle fonctionnalité permet de colorer automatiquement les cellules selon leur valeur ?	["Poignée de recopie","Mise en forme conditionnelle","Fusionner les cellules","Je ne sais pas"]	1	3	t	positionnement	298	\N	\N	\N	5	qcm	\N	\N	\N	\N	\N	OR
2362	Quel type de graphique est le plus adapté pour représenter une évolution dans le temps ?	["Secteur","Courbe","Histogramme","Je ne sais pas"]	1	4	t	positionnement	298	\N	\N	\N	5	qcm	\N	\N	\N	\N	\N	OR
2366	Quelle option permet d’imprimer uniquement une partie sélectionnée du tableau ?	["Format > Masquer","Données > Trier","Sélectionner les cellules puis Fichier > Imprimer > Plage sélectionnée","Je ne sais pas"]	2	3	t	positionnement	299	\N	\N	\N	5	qcm	\N	\N	\N	\N	\N	OR
2368	Quelle fonction permet de rechercher une valeur dans une colonne et d’en retourner une autre correspondante ?	["RECHERCHEH","RECHERCHEV","TROUVE","Je ne sais pas"]	1	5	t	positionnement	299	\N	\N	\N	5	qcm	\N	\N	\N	\N	\N	OR
2369	Dans Google Slides, comment sont enregistrées les modifications ?	["Fichier > Enregistrer","Elles sont enregistrées automatiquement","Édition > Copier","Je ne sais pas"]	1	1	t	positionnement	300	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2003	Un calque permet de :	["Imprimer plus vite","Supprimer une couleur","Je ne sais pas","Séparer les éléments d’une image "]	3	3	f	positionnement	203		quiz	\N	48	qcm	\N	\N	\N	\N	\N	OR
2370	Quel mode d’affichage permet de visualiser toutes les diapositives sous forme de miniatures ?	["Affichage > Grille","Affichage > Commenter","Affichage > Edition","Je ne sais pas"]	0	2	t	positionnement	300	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2371	Quelle action ne permet pas d’ajouter une nouvelle diapositive ?	["Diapositive > Nouvelle diapositive","Outils > Nouvelle diapositive","Insertion > Nouvelle diapositive","Je ne sais pas"]	1	3	t	positionnement	300	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2373	Quelle mise en forme est la plus adaptée pour présenter des points clés courts sur une diapositive ?	["Alignement centré","Liste à puces","Couleur du texte","Je ne sais pas"]	1	2	t	positionnement	301	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2376	Quelle action permet de conserver à la fois le contenu et la mise en page d’une diapositive existante lors de la création d’une nouvelle diapositive ?	["Nouvelle diapositive","Dupliquer la diapositive","Modifier le thème","Je ne sais pas"]	1	5	t	positionnement	301	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2071	Je veux intégrer un tableau créé dans Excel dans mon document Word et pouvoir le modifier dans Word, quelle méthode dois-je utiliser ?	["**Insertion** > **Tableau** > Feuille de calcul **Excel**","On **ne peut pas** insérer un **tableau** provenant **d’Excel** et le **modifier** dans **Word**","**Copier** le tableau dans **Excel** > **Coller** de manière **spéciale** dans **Word **","Je ne sais pas"]	2	4	t	positionnement	216	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2072	J’ai un document assez long et je souhaite ordonner mes grands titres dans un sommaire en début de document, quelle méthode est la plus adaptée ?	["**Insertion** > **Ajouter un sommaire**","**Références** > **Tables des matières **","Je **liste** mes grands titres sur la **1ère page** et leur **associent** le **numéro** de page correspondant","Je ne sais pas"]	1	5	t	positionnement	216	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2073	Comment organiser un document long en plusieurs documents liés ?	["En partageant le document via un **cloud** (**OneDrive**) pour du travail **collaboratif**","Créer une **table des matières** suffira","En utilisant le principe du **document maître** et des **sous-documents**","Je ne sais pas"]	2	1	t	positionnement	217	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2074	Quelle est la différence entre une note de bas de page et une note de fin ?	["La note de bas de page est visible **uniquement à l’impression**, la note de fin **uniquement dans le document**","La note de bas de page s’affiche **en bas de la page concernée**, tandis que la note de fin est **regroupée à la fin du document** ou d’une section","Il n’y a pas de **différence**, ce sont les **mêmes** fonctionnalités","Je ne sais pas"]	1	2	t	positionnement	217	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2075	A quoi sert le mode « Suivi des modifications » ?	["À avoir un **historique des différentes versions** du document","À proposer une **relecture** du document afin de **le vérifier**","À **visualiser** et **corriger** des **modifications proposées** par d’autres utilisateurs ou par soi-même","Je ne sais pas"]	2	3	t	positionnement	217	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2377	Après avoir inséré un tableau, comment ajouter une nouvelle ligne ?	["Insertion > Ligne","Clic droit dans le tableau > Insérer une ligne","Format > Nouvelle ligne","Je ne sais pas"]	1	1	t	positionnement	302	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2378	Comment redimensionner une image insérée dans une diapositive ?	["Format > Image","Clic droit > Redimensionner","Faire glisser une poignée de redimensionnement","Je ne sais pas"]	2	2	t	positionnement	302	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2379	Quelle fonctionnalité permet de maintenir un format cohérent sur toutes les diapositives d’une présentation ?	["Diapositive > Modifier le thème","La liste à puces","Le mode Lecture","Je ne sais pas"]	0	3	t	positionnement	302	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2365	Quelle fonction permet de compter le nombre de cellules contenant la réponse “Oui” dans une colonne ?	["SOMME.SI","NB.SI","MOYENNE","Je ne sais pas"]	1	2	t	positionnement	299		quiz	\N	5	qcm	[]	\N	\N	\N	\N	OR
2367	Après avoir appliqué un filtre à un tableau, quelle fonction permet de calculer le total uniquement des lignes visibles ?	["SOMME.SI","SOUS.TOTAL","MOYENNE.SI","Je ne sais pas"]	1	4	t	positionnement	299		quiz	\N	5	qcm	[]	\N	\N	\N	\N	OR
2360	Quelle formule permet d’afficher “Admis” si la cellule A1 est supérieure ou égale à 10, sinon “Ajourné” ?	["=SI(A1>=10;”Admis”;”Ajourné”)","=SI(A1>=10;Admis;Ajourné)","=SI(A1>=10,Admis,Ajourné)","Je ne sais pas"]	1	2	t	positionnement	298		quiz	\N	5	qcm	[]	\N	\N	\N	\N	OR
2363	Que signifie de message d’erreur #DIV/0	["La cellule contient un chiffre très long","La fonction n’a pas trouvé la valeur recherchée","Une division par zéro a été effectuée","Je ne sais pas"]	2	5	t	positionnement	298		quiz	\N	5	qcm	[]	\N	\N	\N	\N	OR
2372	Quelle mise en page est la plus adaptée pour créer la diapositive d’ouverture d’une présentation ?	["Diapositive Titre et corps","Diapositive de titre","Diapositive en-tête de section","Je ne sais pas"]	1	1	t	positionnement	301		quiz	\N	10	qcm	[]	\N	\N	\N	\N	OR
2374	J’ai inséré une forme et je souhaite la dupliquer, comment faire ?	["Clic droit > Dupliquer","CTRL+ D","CTRL + X","Je ne sais pas"]	1	3	t	positionnement	301		quiz	\N	10	qcm	[]	\N	\N	\N	\N	OR
2375	Quelle raccourci clavier me permet d’insérer une nouvelle diapositive	["CRTL + D","CTRL + N","CTRL + M","Je ne sais pas"]	2	4	t	positionnement	301		quiz	\N	10	qcm	[]	\N	\N	\N	\N	OR
2380	Vous souhaitez représenter les différentes étapes d’un projet dans l’ordre chronologique\\. Quelle fonctionnalité est la plus adaptée ?	["Image","Graphique Courbe","Diagramme","Je ne sais pas"]	2	4	t	positionnement	302	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2382	Quelle fonctionnalité permet d’appliquer un effet lors du passage d’une diapositive à une autre ?	["Animation","Transition","Mode Lecture","Je ne sais pas"]	1	1	t	positionnement	303	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2384	Quelle action permet d’exclure temporairement une diapositive lors du diaporama sans la supprimer ?	["Supprimer la diapositive","La déplacer à la fin","Masquer la diapositive","Je ne sais pas"]	2	3	t	positionnement	303	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2187	Avez-vous déjà utilisé un logiciel de dessin ?	["Oui","Non"]	0	2	t	mise_a_niveau	\N	illustrator	quiz	{"type":"radio_toggle"}	19	qcm	\N	\N	\N	\N	\N	OR
2180	Avez-vous déjà dessiné un plan ?	["Oui","Non"]	0	1	t	mise_a_niveau	\N	sketchup	quiz	{"type":"radio_toggle"}	21	qcm	\N	\N	\N	\N	\N	OR
2183	Quel est l'objectif principal de votre formation ?	["Découvrir l'outil par curiosité","Créer un site vitrine","Créer une boutique en ligne"]	0	1	t	mise_a_niveau	\N	wordpress	quiz	{"type":"qcm"}	22	qcm	\N	\N	\N	\N	\N	OR
2184	Exercez-vous dans les domaines de :	["Assistanat","Secrétariat","Marketing","Communication","RH","Juridique"]	0	1	t	mise_a_niveau	\N	ia	quiz	{"type":"qcm"}	24	qcm	\N	\N	\N	\N	\N	OR
2165	Français langue maternelle ?	["Oui","Non"]	0	1	t	mise_a_niveau	\N	voltaire	quiz	{"type":"radio_toggle"}	51	qcm	[]	\N	\N	\N	\N	OR
2178	Vous prenez des photos ?	["Régulièrement","Occasionnellement","Jamais"]	0	1	t	mise_a_niveau	\N	photoshop	quiz	{"type":"qcm"}	20	qcm	\N	\N	\N	\N	\N	OR
2181	Avez-vous déjà réalisé un visuel d'ambiance ou maquette ?	["Oui","Non"]	0	2	t	mise_a_niveau	\N	sketchup	quiz	{"type":"radio_toggle"}	21	qcm	\N	\N	\N	\N	\N	OR
2179	Avez-vous déjà retouché des photos ?	["Oui","Non"]	0	2	t	mise_a_niveau	\N	photoshop	quiz	{"type":"radio_toggle"}	20	qcm	\N	\N	\N	\N	\N	OR
2185	Quelle est votre utilisation de l'IA ?	["Jamais utilisé","Déjà testé","Utilisation régulière"]	0	2	t	mise_a_niveau	\N	ia	quiz	{"type":"qcm"}	24	qcm	\N	\N	\N	\N	\N	OR
2182	Avez-vous déjà utilisé SketchUp ?	["Oui","Non"]	0	3	t	mise_a_niveau	\N	sketchup	quiz	{"type":"radio_toggle"}	21	qcm	\N	\N	\N	\N	\N	OR
2387	Quel outil permet de communiquer de manière synchrone ?	["Gmail","Google Meet","Google Docs","Je ne sais pas"]	1	1	t	positionnement	304	\N	\N	\N	43	qcm	\N	\N	\N	\N	\N	OR
2388	Quel outil me permet de stocker mes fichiers en ligne ?	["Gmail","Google Drive","Google Docs","Je ne sais pas"]	1	2	t	positionnement	304	\N	\N	\N	43	qcm	\N	\N	\N	\N	\N	OR
2389	Lorsque vous utilisez Google Workspace via un navigateur web, comment sont gérées les mises à jour ?	["Installation manuelle","Automatiquement déployées par Google","Via Google Drive","Je ne sais pas"]	1	3	t	positionnement	304	\N	\N	\N	43	qcm	\N	\N	\N	\N	\N	OR
2390	Je souhaite organiser une réunion de travail et y inviter mes collaborateurs, quel outil utiliser ?	["Gmail","Google Agenda","Google Drive","Je ne sais pas"]	1	1	t	positionnement	305	\N	\N	\N	43	qcm	\N	\N	\N	\N	\N	OR
2391	Je reçois une invitation Google Agenda, quelle option n’est pas disponible dans les réponses proposées ?	["Oui","Provisoire","Non","Je ne sais pas"]	1	2	t	positionnement	305	\N	\N	\N	43	qcm	\N	\N	\N	\N	\N	OR
2175	Fréquence (professionnelle) :	["Régulier","Ponctuel"]	0	4	t	mise_a_niveau	\N	anglais	quiz	{"type":"qcm"}	25	qcm	[]	2173	[0]	\N	[{"questionId":2173,"responseIndexes":[0]}]	OR
2176	Utilisation personnelle de l'anglais ?	["Oui","Non"]	0	5	t	mise_a_niveau	\N	anglais	quiz	{"type":"radio_toggle"}	25	qcm	\N	\N	\N	\N	\N	OR
2172	Étude de l'anglais jusqu'à :	["Collège","Lycée","Bac + 2","Bac + 5"]	0	1	t	mise_a_niveau	\N	anglais	quiz	{"type":"qcm"}	25	qcm	\N	\N	\N	\N	\N	OR
2173	Utilisation professionnelle de l'anglais ?	["Oui","Non"]	0	2	t	mise_a_niveau	\N	anglais	quiz	{"type":"radio_toggle"}	25	qcm	\N	\N	\N	\N	\N	OR
2174	Si oui : clientèle, collègue, fournisseurs (sélectionnez)	["Clientèle","Collègue","Fournisseurs"]	0	3	t	mise_a_niveau	\N	anglais	quiz	{"type":"qcm"}	25	qcm	[]	2173	[0]	\N	[{"questionId":2173,"responseIndexes":[0]}]	OR
2381	Vous souhaitez intégrer une vidéo YouTube dans votre présentation Google Slides. Quelle est la méthode la plus adaptée ?	["Télécharger la vidéo sur votre ordinateur puis l’insérer comme fichier","Utiliser la fonction Insertion > Vidéo et rechercher la vidéo YouTube","Copier-coller le lien dans une zone de texte","Je ne sais pas"]	1	5	t	positionnement	302		quiz	\N	10	qcm	[]	\N	\N	\N	\N	OR
2177	Si oui : voyages, films/séries, applis, lecture (sélectionnez)	["Voyages","Films/Séries","Applis","Lecture"]	0	6	t	mise_a_niveau	\N	anglais	quiz	{"type":"qcm"}	25	checkbox	[]	2176	[0]	\N	[{"questionId":2176,"responseIndexes":[0]}]	OR
2383	Quelle fonctionnalité permet d’appliquer un effet d’apparition à un élément (texte ou image) sur une diapositive ?	["Animation","Transition","Mode Lecture","Je ne sais pas"]	0	2	t	positionnement	303		quiz	\N	10	qcm	[]	\N	\N	\N	\N	OR
2386	Quel format permet de partager une présentation en conservant la mise en page tout en limitant les modifications ?	[".pptx",".pdf",".docx","Je ne sais pas"]	1	5	t	positionnement	303		quiz	\N	10	qcm	[]	\N	\N	\N	\N	OR
2385	Quelle fonctionnalité permet d’ajouter automatiquement le numéro de diapositive sur toutes les diapositives ?	["Insertion > Numéro de diapositive","Insertion > En-tête et pied de page","Format > Texte","Je ne sais pas"]	1	4	t	positionnement	303		quiz	\N	10	qcm	[]	\N	\N	\N	\N	OR
2392	Dans Gmail, quelles sources permettent d’ajouter directement une pièce jointe ?	["Disque dur et Google Drive","Microsoft Teams et Google Meet","Google Agenda uniquement","Je ne sais pas"]	0	3	t	positionnement	305	\N	\N	\N	43	qcm	\N	\N	\N	\N	\N	OR
453	Quel est l’objectif principal de votre formation ?	["Découvrir l’outil par curiosité","Créer un site vitrine pour présenter votre activité","Créer une boutique en ligne pour vendre des produits"]	0	100	f	complementary	\N	\N	\N	{"type":"radio_toggle"}	\N	qcm	\N	\N	\N	\N	\N	OR
454	Quelle suite logicielle souhaitez-vous privilégier ?	["Microsoft Office (Word, Excel, PPT)","Google Workspace (Docs, Sheets, Slides)"]	0	50	f	complementary	\N	\N	\N	{"type":"radio_toggle"}	\N	qcm	\N	\N	\N	\N	\N	OR
2393	Dans Google Tasks, je peux	["Créer une liste de tâches","Organiser une réunion","Supprimer un compte utilisateur","Je ne sais pas"]	0	4	t	positionnement	305	\N	\N	\N	43	qcm	\N	\N	\N	\N	\N	OR
2395	Que signifie la collaboration synchrone ?	["Envoyer un mail","Stocker un fichier","Travailler en même temps sur un document partagé","Je ne sais pas"]	2	1	t	positionnement	306	\N	\N	\N	43	qcm	\N	\N	\N	\N	\N	OR
2398	À quoi sert l’historique des versions dans Google Docs ?	["Supprimer définitivement le document","Restaurer une version précédente","Modifier les paramètres de partage","Je ne sais pas"]	1	4	t	positionnement	306	\N	\N	\N	43	qcm	\N	\N	\N	\N	\N	OR
2403	Pendant une réunion Google Meet, quel outil me permet de prendre des notes personnelles afin de les consulter après la réunion ?	["Google Keep","Google Tasks","Google Agenda","Je ne sais pas"]	0	4	t	positionnement	307	\N	\N	\N	43	qcm	\N	\N	\N	\N	\N	OR
2076	Quelle option permet de protéger d’un document ?	["**Révision** > **Restreindre** la modification","**Fichiers** > **Informations** > **Gérer le document**","**Accueil** > **Protéger**","Je ne sais pas"]	0	4	t	positionnement	217	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2132	Quelle est la différence entre un masque bitmap et un masque vectoriel dans GIMP :	["Bitmap est toujours invisible, Vectoriel toujours visible","Bitmap : basé sur les pixels, Vectoriel : basé sur les formes et tracés ","Ils sont identiques","Je ne sais pas"]	1	1	f	prerequis	\N		quiz	\N	\N	qcm	\N	\N	\N	\N	\N	OR
470	A quelle fréquence utilisez-vous un ordinateur ?	["Quotidiennement ","Occasionnellement (1 à 2 fois par semaine)","Jamais"]	0	3	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
2123	Hello, my name ___ Sarah.	["am","is","are","Je ne sais pas"]	1	1	t	positionnement	1		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
2124	We ___ English on Monday.	["are","have","has","Je ne sais pas"]	1	2	t	positionnement	1		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
2125	She ___ 12 years old.	["is","are","has","Je ne sais pas"]	0	3	t	positionnement	1		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
2126	There ___ a book on the table.	["are","have","is","Je ne sais pas"]	2	4	t	positionnement	1		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
2127	She ___ TV right now.	["watches","watching","is watching","Je ne sais pas"]	2	5	t	positionnement	1		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
2128	She ___ to the gym three times a week.	["go","goes","is going","Je ne sais pas"]	1	6	t	positionnement	1		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
2428	Dans la phrase « Elle est très efficace », quelle est la nature du mot « très » ?	["Un adjectif","Un nom","Un adverbe","Je ne sais pas"]	2	1	t	positionnement	308	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2429	Dans la phrase « Les dossiers urgents sont traités », quelle est la nature du mot « urgents » ?	["Un verbe","Un déterminant","Un adjectif","Je ne sais pas"]	2	2	t	positionnement	308	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2430	Dans la phrase « Ces collaborateurs arrivent demain », quelle est la nature du mot « Ces » ?	["Un adverbe","Un déterminant","Un adjectif","Je ne sais pas"]	1	3	t	positionnement	308	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2431	Dans la phrase « Les documents qu’elle a envoyés à ses collègues hier ont été validés. », quel est le COD ?	["à ses collègues","hier","les documents","Je ne sais pas"]	2	4	t	positionnement	308	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2432	Dans la phrase « Les documents qu’elle a envoyés à ses collègues hier ont été validés. », quel est le COI ?	["à ses collègues","hier","les documents","Je ne sais pas"]	0	5	t	positionnement	308	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2433	Les phrases ci-dessous sont-elles correctes ou incorrectes : « Il ne faut pas sans faire pour si peu. »	["Correcte","Incorrecte","Je ne sais pas"]	1	1	t	positionnement	309	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2434	Les phrases ci-dessous sont-elles correctes ou incorrectes : « Il serait préférable dans commander rapidement. »	["Correcte","Incorrecte","Je ne sais pas"]	1	2	t	positionnement	309	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2397	Un document Google Docs m’est partagé avec le rôle “Commentateur”. Quelle action n’est pas autorisée ?	["Modifier du texte","Ajouter un commentaire","Suggérer une modification","Je ne sais pas"]	0	3	t	positionnement	306		quiz	\N	43	qcm	[]	\N	\N	\N	\N	OR
2399	Quelle action permet de notifier automatiquement un collègue dans un commentaire Google Docs ?	["Ajouter son adresse e-mail dans le texte","Utiliser le symbole @ suivi de son nom","Insérer un émoji Bonjour","Je ne sais pas"]	1	5	t	positionnement	306		quiz	\N	43	qcm	[]	\N	\N	\N	\N	OR
2401	Quelles applications peuvent-être intégrées à Gmail ?	["Google Drive et Google Tasks","Google Docs et Google Agenda","Google Meet et Google Chat","Je ne sais pas"]	2	2	t	positionnement	307		quiz	\N	43	qcm	[]	\N	\N	\N	\N	OR
2402	Dans quelle application puis-je créer une liste de diffusion ?	["Google Drive","Google Contacts","Google Meet","Je ne sais pas"]	1	3	t	positionnement	307		quiz	\N	43	qcm	[]	\N	\N	\N	\N	OR
2404	Lors d’une réunion Google Meet, plusieurs informations importantes sont échangées dans le chat. Quelle précaution devez-vous prendre pour être sûr de pouvoir les conserver après la réunion ?	["Activer l’enregistrement automatique du chat","Copier le chat avant la fin de la réunion","Compter sur l’enregistrement automatique dans Google Drive","Je ne sais pas"]	1	5	t	positionnement	307		quiz	\N	43	qcm	[]	\N	\N	\N	\N	OR
2435	Les phrases ci-dessous sont-elles correctes ou incorrectes : « De l’avis général, son discours était plus tôt ennuyeux. »	["Correcte","Incorrecte","Je ne sais pas"]	1	3	t	positionnement	309	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2436	Les phrases ci-dessous sont-elles correctes ou incorrectes : « Il aurait fallu pour cela davantage de temps.. »	["Correcte","Incorrecte","Je ne sais pas"]	0	4	t	positionnement	309	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2437	Les phrases ci-dessous sont-elles correctes ou incorrectes : « La réunion est prêt de se finir. »	["Correcte","Incorrecte","Je ne sais pas"]	1	5	t	positionnement	309	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2438	Les phrases ci-dessous sont-elles correctes ou incorrectes : « Les voisins du dessus ont déménagés. »	["Correcte","Incorrecte","Je ne sais pas"]	1	1	t	positionnement	310	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2439	Les phrases ci-dessous sont-elles correctes ou incorrectes : « La plupart des coiffeurs utilise nos produits. »	["Correcte","Incorrecte","Je ne sais pas"]	1	2	t	positionnement	310	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2440	Les phrases ci-dessous sont-elles correctes ou incorrectes : « Est-ce bien toi qui va les chercher tout à l’heure ? »	["Correcte","Incorrecte","Je ne sais pas"]	1	3	t	positionnement	310	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2441	Les phrases ci-dessous sont-elles correctes ou incorrectes : « Cette jeune entreprise a fait appel à un fonds d’investissement. »	["Correcte","Incorrecte","Je ne sais pas"]	0	4	t	positionnement	310	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2442	Les phrases ci-dessous sont-elles correctes ou incorrectes : « Quel est le chiffre d’affaire de cette agence ? . »	["Correcte","Incorrecte","Je ne sais pas"]	1	5	t	positionnement	310	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2443	Les phrases ci-dessous sont-elles correctes ou incorrectes : « Il faut savoir tirer partie des faux pas de la concurrence. »	["Correcte","Incorrecte","Je ne sais pas"]	1	1	t	positionnement	311	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2444	Les phrases ci-dessous sont-elles correctes ou incorrectes : « J’irai jusqu’au bout, quelque soit les difficultés.. »	["Correcte","Incorrecte","Je ne sais pas"]	1	2	t	positionnement	311	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2445	Les phrases ci-dessous sont-elles correctes ou incorrectes : « Les arbres que nous avons vus abattre étaient malades. »	["Correcte","Incorrecte","Je ne sais pas"]	1	3	t	positionnement	311	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2446	Les phrases ci-dessous sont-elles correctes ou incorrectes : « Nous vous serions gré de ne pas en parler pour le moment. »	["Correcte","Incorrecte","Je ne sais pas"]	1	4	t	positionnement	311	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2447	Les phrases ci-dessous sont-elles correctes ou incorrectes : « Après que les lumières se soient éteintes, il quitta les lieux.. »	["Correcte","Incorrecte","Je ne sais pas"]	1	5	t	positionnement	311	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2130	Utilisez-vous les logiciels suivants : 	["Traitement de texte type Word, Google Docs","Tableur feuille de calcul type Excel, Google Sheets","Logiciel de présentation type PowerPoint, Google Slides","Je n’utilise aucun de ces logiciels"]	0	1	f	prerequis	\N		quiz	\N	\N	checkbox	\N	\N	\N	\N	\N	OR
2077	Comment se nomme l’outil qui permet de manipuler (masquer, sélectionner, renommer, réorganiser) différents objets ?	["Volet de **navigation**","Sélectionner les **objets**","Volet **sélection **","Je ne sais pas"]	2	5	t	positionnement	217	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2083	Ajouter des fonctionnalités à WordPress.✅	["Changer l'apparence graphique du site.","Ajouter des utilisateurs.","Je ne sais pas"]	-1	1	t	positionnement	194	\N	\N	\N	22	qcm	\N	\N	\N	\N	\N	OR
2089	Qu'est-ce qu'un "Menu" dans WordPress ?**	["La liste des ingrédients pour faire fonctionner le site.","L'élément de navigation qui permet aux visiteurs d'accéder aux différentes pages.","Un outil pour changer les couleurs du site.","Je ne sais pas"]	1	2	t	positionnement	218	\N	\N	\N	22	qcm	\N	\N	\N	\N	\N	OR
2091	Dans quel répertoire sont situées les extensions (plugins) de WordPress ?**	["wp-content/uploads","wp-include/wp-plugins","wp-content/plugins","Je ne sais pas"]	1	4	t	positionnement	218	\N	\N	\N	22	qcm	\N	\N	\N	\N	\N	OR
2092	Sous quelle forme l'URL d'un article est-elle la plus optimisée pour le SEO ?**	["www.mon-site.com/?p=64631","www.mon-site.com/exemple-article-64631","[www.mon-site.com/exemple-article](http://www.mon-site.com/exemple-article)","Je ne sais pas"]	2	5	t	positionnement	218	\N	\N	\N	22	qcm	\N	\N	\N	\N	\N	OR
39	Quel est votre métier actuel ?	[]	0	1	f	complementary	\N	Profil professionnel	work	{"type":"textarea","rows":2,"placeholder":"Ex : Comptable, Vendeur, Secrétaire..."}	\N	qcm	\N	\N	\N	\N	\N	OR
2131	Quel est l’objectif principal de votre formation 	["Découvrir l'outil par curiosité.","Créer un site vitrine pour présenter une activité.","Créer une boutique en ligne pour vendre des produits."]	0	2	f	prerequis	\N		quiz	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2419	Avez-vous déjà utilisé les logiciels suivants :	["Traitement de texte type Word, Google Docs","Tableur feuille de calcul type Excel, Google Sheets","Logiciel de présentation type Powerpoint, Google slides","Je n'utilise aucun de ces logiciels"]	-1	5	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2418	Savoir naviguer sur internet	["Acquis","Moyen","Insuffisant"]	-1	4	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2415	Fréquence d’utilisation d’un ordinateur	["Tous les jours","Occasionnelle","Jamais"]	-1	1	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2417	Se repérer dans l'environnement Windows (bureau, menu démarrer, fenêtres, icônes...)	["Acquis","Moyen","Insuffisant"]	-1	3	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2416	Savoir allumer un ordinateur, utiliser le clavier et la souris	["Acquis","Moyen","Insuffisant"]	-1	2	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2421	Sur votre ordinateur, savez-vous effectuer les manipulations suivantes ?	["Protéger votre ordinateur avec un antivirus","Mettre à jour votre système d’exploitation et vos logiciels","Changer vos mots de passe régulièrement","Aucun des trois"]	-1	8	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2420	Savoir créer un dossier et y ranger et renommer un fichier	["Acquis","Moyen","Insuffisant"]	-1	6	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2448	Fréquence (Personnelle)	["Régulier","Ponctuel"]	0	7	t	mise_a_niveau	\N	anglais	quiz	\N	25	qcm	[]	2176	[0]	\N	[{"questionId":2176,"responseIndexes":[0]}]	OR
2337	Quel est le raccourci clavier qui permet de sélectionner tout le document ?	["Ctrl + P","Ctrl + U","Ctrl + A","Je ne sais pas"]	2	2	t	positionnement	293		quiz	\N	4	qcm	[]	\N	\N	\N	\N	OR
2344	Dans quel menu peut-on trouver la vérification orthographique et grammaticale dans Google Docs	["Outils > Grammaire et orthographe","Édition > Grammaire et orthographe","Fichier > Grammaire et orthographe","Je ne sais pas"]	0	4	t	positionnement	294		quiz	\N	4	qcm	[]	\N	\N	\N	\N	OR
2364	Quelle fonctionnalité permet de garder visibles les en-têtes lors du défilement d’un tableau ?	["Masquer les lignes","Figer les volets","Fusionner les cellules","Je ne sais pas"]	1	1	t	positionnement	299		quiz	\N	5	qcm	[]	\N	\N	\N	\N	OR
2517	Vous prenez des photos 	["Régulièrement ","Occasionnellement ","Jamais"]	0	1	t	mise_a_niveau	\N		quiz	\N	48	qcm	[]	\N	\N	\N	\N	OR
2084	Si vous souhaitez changer votre mot de passe ou votre adresse e-mail de profil, où allez-vous ?	["Dans le fichier wp-config.php.","Dans la gestion de votre compte via le tableau de bord de WordPress.","Dans le menu \\"Thèmes\\".","Je ne sais pas"]	1	2	t	positionnement	194		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
2080	Où puis-je télécharger le logiciel WordPress ?	["Sur site officiel : https://fr.wordpress.org/","Dans une boutique informatique","sur Google Play Store ou App Store","Je ne sais pas"]	0	2	t	positionnement	193		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
2081	Pour vous, qu'est-ce que WordPress ?	["Un logiciel de traitement de texte comme Word.","Un outil (CMS) qui permet de créer et gérer un site web sans forcément coder.","Un hébergeur de site web uniquement.","Je ne sais pas"]	1	3	t	positionnement	193		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
2079	Quels sont les 2 éléments indispensables pour avoir un site internet ?	["Un ordinateur puissant et une connexion fibre optique.","Un compte Facebook professionnel et une carte de visite avec un QR Code.","Un nom de domaine (l'adresse du site) et un hébergement (l'espace de stockage sur un serveur).","Je ne sais pas"]	2	1	t	positionnement	193		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
2088	À quoi servent les "Permaliens" dans les réglages de WordPress ?	["À changer la langue du site","À définir la structure des adresses URL des pages","À sauvegarder le site sur un disque dur","Je ne sais pas"]	1	1	t	positionnement	218		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
2085	Quelle est la différence entre un "Article" et une "Page" ?	["Il n'y en a pas, c'est la même chose.","L'Article est payant, la Page est gratuite.","La Page est pour du contenu dit statique (Contact, À propos), l'Article est pour du contenu chronologique (Actualités).","Je ne sais pas"]	2	3	t	positionnement	194		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
2086	Vous souhaitez ajouter une fonctionnalité de formulaire de contact. Où allez-vous ?	["Dans l'onglet \\"Apparence\\".","Dans l'onglet Extensions\\" (Plugins).","Dans l'onglet \\"Réglages\\" > \\"Discussion\\".","Je ne sais pas"]	1	4	t	positionnement	194		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
2082	À quoi sert principalement un thème dans WordPress ?	["À définir l'apparence visuelle, la mise en page et le design du site.","À protéger le site contre les attaques de pirates et les malwares.","À stocker la base de données de tous les articles et commentaires du site.","Je ne sais pas"]	0	4	t	positionnement	193		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
2518	Avez-vous déjà retouché des photos ? 	["Oui","Non"]	0	2	t	mise_a_niveau	\N		quiz	\N	48	qcm	[]	\N	\N	\N	\N	OR
2333	À quoi sert l’application Google Docs ?	["Créer des feuilles de calcul","Rédiger et mettre en forme des documents texte","Envoyer des e-mails","Je ne sais pas"]	1	1	t	positionnement	292		quiz	\N	4	qcm	[]	\N	\N	\N	\N	OR
2519	Quelle est la principale différence entre Illustrator (vectoriel) et Photoshop (pixel) ?	["llustrator permet de modifier des photos","Illustrator permet d'agrandir un dessin à l'infini sans perte de qualité. ","Illustrator ne gère pas les couleurs.","Je ne sais pas"]	1	15	t	positionnement	383		quiz	\N	19	qcm	[]	\N	\N	\N	\N	OR
2520	Comment s'appelle l'espace de travail blanc sur lequel vous dessinez ?	["Le plan de travail.","La feuille de style.","La zone de calque.","Je ne sais pas"]	0	16	t	positionnement	383		quiz	\N	19	qcm	[]	\N	\N	\N	\N	OR
2522	Quel est le format d’enregistrement de illustrator ?	[".AI",".JPG",".MP4","Je ne sais pas"]	0	18	t	positionnement	383		quiz	\N	19	qcm	[]	\N	\N	\N	\N	OR
2521	Que permet de faire illustrator ?	["De la retouche photo","Du dessin vectoriel ","De la mise en page","Je ne sais pas"]	1	17	t	positionnement	383		quiz	\N	19	qcm	[]	\N	\N	\N	\N	OR
2523	Où se trouvent les outils principaux (Plume, Texte, Rectangle) ?	["Dans le menu Fenêtre","Dans la barre d'outils (à gauche par défaut). ","Dans le menu Aide","Je ne sais pas"]	1	1	t	positionnement	384		quiz	\N	19	qcm	[]	\N	\N	\N	\N	OR
2524	Comment s'appelle l'espace de travail blanc sur lequel vous dessinez ?	["Le plan de travail","La feuille de style","La zone de calque","Je ne sais pas"]	0	2	t	positionnement	384		quiz	\N	19	qcm	[]	\N	\N	\N	\N	OR
2526	Si un objet est caché derrière un autre, comment le faire passer devant ?	["Menu Objet > Disposition > Premier plan.","En supprimant l'objet de devant.","En changeant la résolution de l'image.","Je ne sais pas"]	0	4	t	positionnement	384		quiz	\N	19	qcm	[]	\N	\N	\N	\N	OR
2525	Quelle touche du clavier permet de maintenir les proportions d'une forme quand on l'agrandit ?	["Espace","Majuscule (Shift)","Entrée","Je ne sais pas"]	1	3	t	positionnement	384		quiz	\N	19	qcm	[]	\N	\N	\N	\N	OR
2394	Vous souhaitez demander rapidement à un(e) collègue s’il/elle est disponible pour une pause café. Quelle est la méthode la plus adaptée ?	["Lui envoyer un document partagé","Lui envoyer un message via Google Chat","Planifier une réunion dans Google Agenda","Je ne sais pas"]	1	5	t	positionnement	305		quiz	\N	43	qcm	[]	\N	\N	\N	\N	OR
2396	Je participe en tant qu’invité à une visioconférence avec Google Meet, que suis-je autorisé à faire pendant la réunion ?	["Partager mon écran, lever la main, couper le micro des autres participants","Partager mon écran, lever la main, discuter dans le chat","Lever la main, modifier les paramètres généraux de la réunion, discuter dans le chat","Je ne sais pas"]	1	2	t	positionnement	306		quiz	\N	43	qcm	[]	\N	\N	\N	\N	OR
2019	Pourquoi grouper des éléments ?	["Éviter qu’ils se collent","Réduire le poids du fichier","Je ne sais pas","Les colorier ensemble"]	0	3	t	positionnement	206		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2025	À quoi servent les scènes ?	["Ajouter de la lumière","Dessiner plus vite","Je ne sais pas","Sauvegarder des vues/configurations "]	3	4	t	positionnement	214		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2528	Comment ouvrir une image dans Photoshop ?	["Image > Couleur","Fichier > Ouvrir ","Édition > Importer","Je ne sais pas"]	1	1	t	positionnement	488		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2529	 Quelle est la différence principale entre le format PSD et le format JPEG ?	["Le PSD est plus léger que le JPEG","Le JPEG est l’extension la moins utilisée","Le PSD est l’extension de Photoshop","Je ne sais pas"]	2	2	t	positionnement	488		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2530	Quelle est la fonction de l’outil Recadrage ?	["Modifier les couleurs de l’image","Supprimer une partie de l’image et ajuster le cadrage ","Ajouter du texte","Je ne sais pas"]	1	3	t	positionnement	488		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2531	Quelle est la fonction de l’outil Pipette ?	["Dessiner une forme","Copier une couleur de l’image ","Supprimer un objet","Je ne sais pas"]	1	1	t	positionnement	489		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2532	Quel est le raccourci pour annuler une action ?	["Ctrl + S","Ctrl + Z","Ctrl  + P","Je ne sais pas"]	0	2	t	positionnement	489		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2533	Quelle est la différence principale entre le format PSD et le format JPEG ?	["Le PSD est plus léger que le JPEG","Le JPEG est l’extension la moins utilisée","Le PSD est l’extension de Photoshop","Je ne sais pas"]	2	3	t	positionnement	489		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2534	À quoi sert un calque ?	["À séparer les éléments pour les modifier indépendamment ","À changer la couleur de toute l’image","À enregistrer le fichier","Je ne sais pas"]	0	4	t	positionnement	489		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2535	Le raccourci Ctrl + T permet :	["D’enregistrer l’image","De transformer (redimensionner / déplacer) un élément ","De créer un nouveau document","Je ne sais pas"]	1	5	t	positionnement	489		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2536	Comment inverser une sélection ?	["Sélection > Intervertir ","Image > Rotation","Fichier > Ouvrir","Je ne sais pas"]	0	6	t	positionnement	489		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2537	Quelle est la différence entre un calque de remplissage et un calque de réglage ?	["Le calque de remplissage applique une couleur ou un dégradé, le calque de réglage modifie les couleurs/luminosité ","Il n’y a aucune différence","Le calque de réglage sert uniquement à dessiner","Je ne sais pas"]	0	1	t	positionnement	490		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2538	Quelle est la différence entre le Tampon de duplication et le Correcteur ?	["Ils font exactement la même chose"," Le Tampon copie à l’identique, le Correcteur adapte la texture et la couleur ","Le Correcteur sert uniquement à effacer","Je ne sais pas"]	1	7	t	positionnement	490		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2539	Comment utiliser le panneau Camera Raw pour une retouche avancée ?	["En ajustant l’exposition, le contraste, la clarté et la balance des blancs ","En ajoutant du texte","En créant un nouveau document","Je ne sais pas"]	0	8	t	positionnement	490		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2102	Votre métier (poste actuel) 	[]	0	1	t	prerequis	\N		quiz	\N	\N	text	\N	\N	\N	\N	\N	OR
2635	Votre situation actuelle	["Salarié","Indépendant","Demandeur d’emploi","Reconversion"]	0	2	t	prerequis	\N		quiz	\N	\N	checkbox	[]	\N	\N	\N	[]	OR
2636	Savez-vous créer un dossier et y ranger et renommer un fichier	["Oui","Non","Oui avec quelques difficultés"]	0	7	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
2541	Quelle est la différence entre “Enregistrer pour le web” et “Exporter sous” ?	["“Enregistrer pour le web” est ancien et orienté optimisation web, “Exporter sous” est plus moderne et polyvalent ","Ils sont totalement identiques","“Exporter sous” ne permet pas de compresser","Je ne sais pas"]	0	10	t	positionnement	490		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2540	À quoi sert le masque de fusion dans un objet dynamique ?	["À supprimer définitivement une partie de l’image","À masquer ou révéler des zones sans modifier l’image d’origine ","À changer le format du fichier","Je ne sais pas"]	1	9	t	positionnement	490		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2542	Quelle est la différence entre un calque normal, un objet dynamique et un calque vectoriel ?	["Ils ont exactement la même fonction","Le calque normal contient des pixels, l’objet dynamique permet des modifications non destructives, le calque vectoriel est basé sur des formes redimensionnables sans perte ","Le calque vectoriel sert uniquement au texte","Je ne sais pas"]	1	1	t	positionnement	491		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2543	Comment appliquer un profil ICC à un document pour un rendu couleur précis ?	["Image > Rotation","Édition > Couleurs","Édition > Convertir en profil ","Je ne sais pas"]	2	2	t	positionnement	491		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2544	Comment transformer une sélection en objet dynamique masqué ?	["Supprimer la sélection","Convertir le calque en objet dynamique puis ajouter un masque de fusion ","Aplatir l’image","Je ne sais pas"]	1	3	t	positionnement	491		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2545	Comment appliquer un flou directionnel pour simuler le mouvement ?	["Filtre > Bruit","Filtre > Flou > Flou directionnel ","Image > Taille de l’image","Image > Taille de l’image"]	1	4	t	positionnement	491		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2546	Comment créer et appliquer une action Photoshop pour automatiser un flux de travail répétitif ?	["Fenêtre > Actions, enregistrer les étapes puis lancer l’action ","Fichier > Nouveau","Image > Mode","Je ne sais pas"]	0	5	t	positionnement	491		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2547	Quelle est la différence entre un objet dynamique intégré et un objet dynamique lié pour le travail collaboratif ?	["L’objet intégré reste dans le document et n’est pas lié à un fichier externe, l’objet lié référence un fichier externe pour pouvoir le mettre à jour facilement ","L’objet intégré est toujours vectoriel, l’objet lié est toujours pixelisé","Il n’y a aucune différence","Je ne sais pas"]	0	1	t	positionnement	492		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2548	Comment utiliser un calque d’écrêtage sur plusieurs calques pour contrôler un effet uniquement sur la zone visible ?	["Sélectionner le calque supérieur et faire Alt + clic entre les calques pour créer un écrêtage ","Fusionner tous les calques","Appliquer un filtre directement sur le calque inférieur","Je ne sais pas"]	0	2	t	positionnement	492		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2549	Comment utiliser la plage de profondeur pour créer des sélections précises dans une image avec effet bokeh ?	["Fichier > Nouveau","Sélection > Plage de profondeur pour isoler les zones nettes ou floues ","Image > Réglages > Luminosité/Contraste","Je ne sais pas"]	1	3	t	positionnement	492		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2550	Comment créer des dégradés complexes et dynamiques avec plusieurs couleurs et opacités sur un objet masqué ?	["Appliquer un dégradé linéaire ou radial directement sur l’objet masqué et ajuster la transparence globale de l’objet","Utiliser un calque de dégradé séparé avec le masque de l’objet, puis ajuster les couleurs, la transparence et le mode de fusion pour obtenir un effet dynamique ","Transformer l’objet en bitmap et peindre manuellement les transitions de couleurs avec un pinceau flou ","Je ne sais pas"]	1	4	t	positionnement	492		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2551	Comment créer un HDR réaliste à partir de plusieurs expositions tout en conservant les détails locaux ?	["Fichier > Fusionner > HDR Pro et ajuster les détails locaux ","Appliquer un filtre Flou","Enregistrer chaque photo séparément","Je ne sais pas"]	0	5	t	positionnement	492		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2552	A quoi sert Microsoft Outlook	["à créer un site internet","à créer des tableaux ","à envoyer des e-mails ","Je ne sais pas"]	2	1	t	positionnement	493		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2553	Quels modules principaux sont inclus dans Outlook ? 	["Word, Excel et PowerPoint","Courrier, Calendrier et Contacts","Tâches avancées et Règles automatiques","Je ne sais pas"]	1	2	t	positionnement	493		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2585	Quel élément permet d’afficher la liste des emails reçus ?	["Le dossier Contacts","Le dossier Courrier ","Le dossier Notes","Je ne sais pas"]	1	3	t	positionnement	493		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2586	Quelle action permet de créer un nouvel email ?	["Répondre","Nouveau message ","Transférer","Je ne sais pas"]	1	4	t	positionnement	494		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2588	Comment répondre à une invitation à une réunion ?	["En cliquant sur Accepter / Refuser ","En supprimant le message","En créant un nouveau mail","Je ne sais pas"]	0	1	t	positionnement	494		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2587	Quelle fonctionnalité utiliser pour vérifier les fautes dans un mail? 	["Vérification orthographique ","Règles","Archivage","Je ne sais pas"]	0	16	t	positionnement	494		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2589	Comment ajouter un nouveau contact ?	["Depuis le dossier Contacts → Nouveau contact ","Depuis le calendrier","Depuis la corbeille","Je ne sais pas"]	0	17	t	positionnement	494		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2590	Quel onglet permet principalement de mettre en forme un email ?	["Accueil","Format du texte ","Affichage","Je ne sais pas"]	1	18	t	positionnement	494		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2591	Comment créer un dossier pour classer ses emails ?	["Clic droit sur Boîte de réception → Nouveau dossier ","Supprimer un email","Modifier le ruban","Je ne sais pas"]	0	1	t	positionnement	495		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2592	Quelle fonction permet d’envoyer une réponse automatique pendant ses congés ?	["Gestionnaire d’absence ","Signature","Règle de tri","Je ne sais pas"]	0	2	t	positionnement	495		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2593	À quoi sert le champ CCI ?	["Envoyer une copie visible à tous","Envoyer une copie en préservant la confidentialité des adresses ","Supprimer un destinataire du message","Je ne sais pas"]	1	3	t	positionnement	495		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2594	Comment demander un accusé de réception ?	["Dans les options du message ","En transférant le message","En le mettant en brouillon","Je ne sais pas"]	0	4	t	positionnement	495		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2595	Comment effectuer une recherche d’email par expéditeur ?	["Utiliser la barre de recherche ","Ouvrir le calendrier","Trier les messages","Je ne sais pas"]	0	5	t	positionnement	495		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2596	Quelle est la principale caractéristique d’un compte IMAP par rapport à un compte POP ?	["Les mails sont obligatoirement supprimés du serveur après téléchargement","Les mails restent synchronisés avec le serveur et accessibles depuis plusieurs appareils ","IMAP fonctionne uniquement en réseau local","Je ne sais pas"]	1	1	t	positionnement	496		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2597	Comment programmer l’envoi d’un email à une date spécifique ?	["Utiliser une règle automatique","Le mettre en brouillon","Options → Différer la livraison ","Je ne sais pas"]	2	2	t	positionnement	496		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2598	À quoi servent les catégories de couleurs ?	["Classer et filtrer les éléments Outlook ","Modifier la police","Supprimer les emails","Je ne sais pas"]	0	3	t	positionnement	496		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2599	14.\tComment transférer automatiquement un mail d’un expéditeur spécifique vers un dossier prédéfini ? 	["Paramètres du compte","Menu Options","Règles → Créer une règle ","Je ne sais pas"]	2	4	t	positionnement	496		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2600	Comment créer une liste de distribution ?	["Depuis Options d’impression","Depuis Contacts → Nouveau groupe ","Depuis Calendrier","Je ne sais pas"]	1	5	t	positionnement	496		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2601	16.\tQuelle est l’extension d’un modèle de courrier électronique Outlook ?	[".docx",".oft",".msg","Je ne sais pas"]	2	1	t	positionnement	497		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2602	Quelle est l’extension du fichier utilisé pour exporter un calendrier Outlook afin qu’il puisse être importé dans un autre agenda ?	[".csv",".ics",".pst","Je ne sais pas"]	1	2	t	positionnement	497		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2603	À quoi sert le mappage des champs lors de l’importation d’un fichier de contacts dans Outlook ?	["Associer les colonnes du fichier importé aux champs correspondants dans Outlook ","Supprimer les contacts en double","Modifier automatiquement la mise en forme des contacts","Je ne sais pas"]	0	3	t	positionnement	497		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2604	Quelle fonctionnalité permet de configurer des flux RSS ?	["Paramètres du compte","Paramètres des flux RSS ","Signature","Je ne sais pas"]	1	4	t	positionnement	497		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2605	Quelle fonctionnalité permet de créer un dossier affichant automatiquement tous les messages non lus, sans les déplacer de leur emplacement d’origine ?	["Une règle de tri","Un dossier de recherche ","Une catégorie de couleur","Je ne sais pas"]	1	5	t	positionnement	497		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
41	Avez-vous un handicap qui pourrait altérer/ affecter votre apprentissage ? 	["Oui","Non"]	0	4	t	complementary	\N	Profil professionnel	accessible	{"type":"radio_toggle"}	\N	qcm	[]	\N	\N	\N	\N	OR
447	Quel est l’objectif de votre formation ?	[]	0	2	t	complementary	\N		quiz	\N	\N	text	[]	\N	\N	\N	\N	OR
2166	Quelle est votre niveau ?	["A2","B1","B2","C1"]	0	2	t	mise_a_niveau	\N	voltaire	quiz	{"type":"qcm"}	51	qcm	[]	2165	[1]	\N	[{"questionId":2165,"responseIndexes":[1],"responseValue":""}]	OR
2168	Étiez-vous à l'aise en conjugaison (reconnaître les temps, les utiliser) ?	["Pas du tout","Un peu","Moyennement","Tout à fait"]	0	4	t	mise_a_niveau	\N	voltaire	quiz	{"type":"radio_toggle"}	51	qcm	[]	2165	[0]	\N	[{"questionId":2165,"responseIndexes":[0],"responseValue":""},{"questionId":2166,"responseIndexes":[2],"responseValue":""},{"questionId":2166,"responseIndexes":[3],"responseValue":""}]	OR
2449	Quels types d’ouvrages :	["Livres","Magazines","BD","Journaux","Comptes-rendus "]	0	9	t	mise_a_niveau	\N	voltaire	quiz	\N	51	checkbox	[]	2169	[0]	\N	[{"questionId":2169,"responseIndexes":[0],"responseValue":""},{"questionId":2171,"responseIndexes":[0],"responseValue":""}]	OR
2606	Quelle est votre niveau ?	["A2","B1","B2","C1"]	0	16	f	mise_a_niveau	\N	voltaire	quiz	\N	51	qcm	[]	2165	[1]	\N	[{"questionId":2165,"responseIndexes":[1],"responseValue":""}]	OR
2611	Quel raccourci permet de lancer le diaporama ?	["**CTRL + D**","**F5**","Il **n’y a pas** de raccourci, il faut **utiliser la commande** dans le logiciel","Je ne sais pas"]	1	1	t	positionnement	530		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2167	Étiez-vous à l'aise en dictée à l'école ?	["Pas du tout","Un peu","Moyennement","Tout à fait"]	0	3	t	mise_a_niveau	\N	voltaire	quiz	{"type":"qcm"}	51	qcm	[]	2165	[0]	\N	[{"questionId":2165,"responseIndexes":[0],"responseValue":""},{"questionId":2166,"responseIndexes":[2],"responseValue":""},{"questionId":2166,"responseIndexes":[3],"responseValue":""}]	OR
2169	Lisez-vous à titre professionnel ?	["Oui","Non"]	0	5	t	mise_a_niveau	\N	voltaire	quiz	{"type":"qcm"}	51	qcm	[]	2165	[0]	\N	[{"questionId":2165,"responseIndexes":[0],"responseValue":""},{"questionId":2166,"responseIndexes":[3],"responseValue":""},{"questionId":2166,"responseIndexes":[2],"responseValue":""}]	OR
2610	Quel est le but final de PowerPoint ?	["Créer un **diaporama** ","Créer un **modèle** de document","Créer du **contenu** dédié aux **réseaux sociaux**","Je ne sais pas"]	0	3	t	positionnement	529		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2609	Parmi les choix suivants, que peut-on ajouter comme contenu ? Plusieurs réponses possibles	["Un **tableau** ","Une **image**","Une **forme** ","Je ne sais pas"]	0	2	t	positionnement	529		quiz	\N	54	checkbox	[0,1,2]	\N	\N	\N	[]	OR
2607	À quoi sert PowerPoint ? 	["À créer des **tableurs** de calculs","À créer des **présentations** avec des diapositives ","À créer des **graphiques** automatisés","Je ne sais pas"]	1	1	t	positionnement	529		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2171	Lisez-vous à titre personnel ?	["Oui","Non"]	0	7	t	mise_a_niveau	\N	voltaire	quiz	{"type":"qcm"}	51	qcm	[]	2165	[0]	\N	[{"questionId":2165,"responseIndexes":[0],"responseValue":""},{"questionId":2166,"responseIndexes":[2],"responseValue":""},{"questionId":2166,"responseIndexes":[3],"responseValue":""}]	OR
2170	Si oui : Ponctuellement ou Régulièrement ?	["Oui","Non"]	0	6	t	mise_a_niveau	\N	voltaire	quiz	{"type":"radio_toggle"}	51	qcm	[]	2169	[0]	\N	[{"questionId":2169,"responseIndexes":[0],"responseValue":""}]	OR
2425	Fréquence,  à titre personnel  : Ponctuellement ou Régulièrement ?	["Ponctuellement ","Régulièrement "]	0	8	t	mise_a_niveau	\N	voltaire	quiz	\N	51	qcm	[]	2171	[0]	\N	[{"questionId":2171,"responseIndexes":[0],"responseValue":""}]	OR
2061	Quelle action permet de sauvegarder un document Word pour la première fois ?	["**Accueil** > **Copier**","**Fichier** > **Enregistrer sous**","**Fichier** > **Exporter**","Je ne sais pas"]	1	2	t	positionnement	190		quiz	\N	44	qcm	[]	\N	\N	\N	\N	OR
2612	Quel est l’intérêt d’un thème ?	["De **proposer un modèle** de présentation prédéfini","De **permettre l’enregistrement** sous un format **vidéo** (MP4)","**D’appliquer** une mise en forme **générale** à toute la **présentation **","Je ne sais pas"]	2	2	t	positionnement	530		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2613	J’ai ajouté une diapositive « Titre et contenu », comment se nomme techniquement les zones présentes par défaut 	["Une **zone de texte**","Un **espace réservé **","Des **blocs**","Je ne sais pas"]	1	3	t	positionnement	530		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2614	Que ne peut-on pas réaliser dans un tableau créé dans PowerPoint ?	["Des **formules** de **calculs **","**Fusionner** ou **fractionner ** des **cellules**","**Appliquer** un **style** prédéfini","Je ne sais pas"]	0	4	t	positionnement	530		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2615	Par ou passe-t-on pour ajouter des photos dans la présentation ?	["**Fichier > Ouvrir**","**Compléments**","**Insertion > Images **","Je ne sais pas"]	2	5	t	positionnement	530		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2616	Quelle est la différence entre une transition et une animation ?	["La **transition** peut être **minuté** mais pas **l’animation**","La **transition** s’applique au passage **entre deux diapositives**, tandis que **l’animation** s’applique **aux objets** à l’intérieur d’une diapositive ","Il **n’y a pas** de **différences**, ce sont deux types d’effet qui s’appliquent **aux mêmes endroits**","Je ne sais pas"]	1	1	t	positionnement	531		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2618	Parmi les choix suivants, quels trios d’objets peuvent être tous insérer dans une diapositive ? 	["**SmartArt **/ Vidéo **YouTube / Graphiques **","**Tableau Croisé Dynamique **/ Album photo / **Audio**","**WordArt **/ Document **PDF / Formes **automatiques","Je ne sais pas"]	0	3	t	positionnement	531		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2625	Je souhaite pouvoir affecter à plusieurs objets de ma diapositives le même effet paramétré, quel outil est le plus adapté ?	["Je sélectionne l’objet, puis Copier > Coller l’effet sur un autre objet","Dans le groupe Animation avancée, j’utilise Reproduire l’animation","Dans le groupe Presse Papier, j’utilise Reproduire la mise en forme","Je ne sais pas"]	1	5	t	positionnement	532		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2631	Quel est l’avantage principal d’utiliser plusieurs masques de diapositives dans une même présentation ?	["Nous ne pouvons pas créer plusieurs masques, un seul uniquement par présentation ","Appliquer des mises en page différentes selon les types de diapositives tout en gardant une cohérence globale ","Cela permet de combiner plusieurs présentations distinctes en une seule sur le principe du Document maître et des sous-documents","Je ne sais pas"]	1	5	t	positionnement	534		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
1999	Qu’est-ce qu’un pixel ?	["Une couleur automatique","Je ne sais pas","Un filtre","La plus petite unité d’une image "]	3	2	f	positionnement	202		quiz	\N	48	qcm	\N	\N	\N	\N	\N	OR
2011	Comment utiliser le Correcteur et le Tampon pour retoucher des zones complexes avec texture :	["Tampon : appliquer un filtre, Correcteur : ajouter du texte","Ils font la même chose","Je ne sais pas","Tampon : copier-coller exactement, Correcteur : adapter texture et couleur à la zone cible "]	3	2	f	positionnement	213		quiz	\N	48	qcm	\N	\N	\N	\N	\N	OR
2012	Quelle est la fonction d’un masque de calque et comment l’appliquer correctement :	["Supprimer définitivement des parties du calque","Dupliquer un calque","Je ne sais pas","Masquer ou révéler des zones du calque sans supprimer les pixels, en peignant en noir/blanc "]	3	3	f	positionnement	213		quiz	\N	48	qcm	\N	\N	\N	\N	\N	OR
2005	Quelle est la différence entre les formats XCF, JPEG et PNG ? :	["JPEG est vectoriel, PNG est bitmap","Il n’y a aucune différence","Je ne sais pas","XCF conserve les calques, JPEG compresse avec une perte, PNG conserve la transparence "]	3	5	f	positionnement	203		quiz	\N	48	qcm	[]	\N	\N	\N	\N	OR
2619	Quel mode ne permet pas d’ajouter des notes ?	["Le mode **Normal**","Le mode **Plan**","Le mode **Trieuse de diapositives **","Je ne sais pas"]	2	4	t	positionnement	531		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2626	Comment créer une navigation interactive sur tout objet ou espace de la présentation ?	["Avec les boutons d’Action ","Avec la commande Déclencheur","Avec la commande Objet","Je ne sais pas"]	0	1	t	positionnement	534		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2087	Je souhaite modifier les couleurs de mon site WordPress, que dois-je faire ?	["Modifier les réglages du site.","Coder le HTML.","Personnaliser le thème.","Je ne sais pas"]	2	5	t	positionnement	194		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
2090	Dans WordPress, quelle est la fonction principale d'un "Article" ?	["Créer du contenu permanent et fixe, comme une page \\"Contact\\"","Publier des contenus actualisés qui s'affichent par ordre chronologique, du plus récent au plus ancien.","Modifier uniquement le design des couleurs et la police d'écriture de tout le site.","Je ne sais pas"]	1	3	t	positionnement	218		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
44	Quelles sont vos dates de début souhaitées ?	[]	0	2	f	availabilities	\N	Disponibilités	event	{"type":"textarea","rows":2,"placeholder":"Ex : À partir du 1er mars 2025, semaines paires uniquement..."}	\N	qcm	\N	\N	\N	\N	\N	OR
45	Commentaires ou contraintes supplémentaires sur vos disponibilités	[]	0	3	f	availabilities	\N	Disponibilités	comment	{"type":"textarea","rows":3,"placeholder":"Ex : Indisponible le mardi matin, contraintes personnelles..."}	\N	qcm	\N	\N	\N	\N	\N	OR
2620	À quoi sert le masque des diapositives dans PowerPoint ?	["À paramétrer quelles diapositives doivent être afficher ou masquer au lancement du diaporama","C’est à cet emplacement uniquement que l’on configure les effets visuels (transitions et animations)","À modifier un thème existant afin de le personnaliser à des fins précises (charte graphique d’une entreprise par exemple) ","Je ne sais pas"]	2	5	t	positionnement	531		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2627	Quel outil permet de calibrer l’organisation et le minutage de chaque effet de la présentation ?	["Options de l’effet","Mode plan","Volet d’animation ","Je ne sais pas"]	0	2	t	positionnement	534		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
477	Savez-vous allumer un ordinateur, utiliser le clavier et la souris 	["Oui","Non","Oui avec quelques difficultés "]	-1	4	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
43	A quel moment êtes-vous disponible ?	["Matin","Après-midi","Entre 12h et 14h","Toute la journée"]	0	1	t	availabilities	\N	Disponibilités	schedule	{"type":"multi_select","icons":["wb_sunny","light_mode","calendar_today"]}	\N	qcm	[]	\N	\N	\N	[]	OR
2400	Quel est l’avantage principal du partage par lien Google Drive par rapport à une pièce jointe ?	["Il augmente automatiquement la capacité de stockage","Il supprime le fichier du disque dur","Je ne sais pas"]	0	1	t	positionnement	307		quiz	\N	43	qcm	[]	\N	\N	\N	[]	OR
2624	Sur quel objet ne peut-on pas insérer de lien hypertexte ?	["Un tableau ","Une image","Un graphique","Je ne sais pas"]	0	4	t	positionnement	532		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
473	A quelle fréquence utilisez-vous internet ?	["Quotidiennement ","Occasionnellement (1 à 2 fois par semaine)","Jamais"]	0	6	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
2621	Quel est l’avantage principal du mode Présentateur ?	["D’utiliser un pointeur laser","À voir les notes sans que le public ne les voie ","De paramétrer des sous-titres","Je ne sais pas"]	1	1	f	prerequis	532		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2628	Quel est l’avantage principal du mode Présentateur ?	["D’utiliser un pointeur laser","À voir les notes sans que le public ne les voie ","De paramétrer des sous-titres","Je ne sais pas"]	1	6	t	positionnement	532		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2527	À quoi sert l'outil "Sélection Directe" (la flèche blanche) ?	["À déplacer tout un groupe d'objets.","À modifier les points d'ancrage individuels d'un tracé.","À changer la couleur du fond.","Je ne sais pas"]	1	15	t	positionnement	384		quiz	\N	19	qcm	[]	\N	\N	\N	[]	OR
2622	Quel est l’intérêt d’utiliser des sections ?	["Permet d’intégrer une table des matières","De couper une diapositive en deux colonnes","De regrouper certaines diapositives ","Je ne sais pas"]	2	2	t	positionnement	532		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2629	Afin de réduire le poids d’une présentation, il est possible de compresser certains éléments. Lequel de ces éléments ne peut être compressé ?	["Vidéo YouTube ","Image en ligne","Audio enregistré par PowerPoint","Je ne sais pas"]	0	3	t	positionnement	534		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2632	Savez-vous participer à une visioconférence (Zoom, Teams, etc.) de manière autonome ?	["Oui","Non"]	0	8	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
2623	Un en-tête et/ou pied de page s’applique-t-il obligatoirement sur toutes les diapositives ?	["Non, nous pouvons choisir les diapositives sur lesquelles l’appliquer","Oui, nous n’avons pas d’autres options possibles","Non, nous pouvons choisir ne pas les afficher sur la diapositive de titre uniquement ","Je ne sais pas"]	2	3	t	positionnement	532		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2630	A quoi sert la commande Objet ?	["À répertorier dans une boite dialogue tous les objets qui peuvent être insérés (image, vidéo, son…)","À insérer un objet externe à PowerPoint ","Cette commande n’existe pas dans PowerPoint","Je ne sais pas"]	1	4	t	positionnement	534		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2633	Utilisez-vous une messagerie électronique (envoyer, répondre, joindre un fichier) ?	["Quotidiennement","Occasionnellement (1 à 2 fois par semaine)","Jamais"]	0	9	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
2640	qfq	["Insufissant","A"]	0	15	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, brand, civilite, nom, prenom, telephone, conseiller, "formationChoisie", "prerequisiteScore", "levelsScores", "stopLevel", "finalRecommendation", "createdAt", "emailSentAt", "scorePretest", "complementaryQuestions", availabilities, "stagiaireId", "lastValidatedLevel", "isCompleted", "positionnementAnswers", metier, situation, "miseANiveauAnswers", "highLevelContinue") FROM stdin;
0edf83ff-4fcc-42f7-832d-ca7e54e1690a	aopia	M.	Rakoto	ANdria	06 06 06 08 10		Français	{"470":"Occasionnelle","473":"Moyen","474":"Moyen","477":"Acquis","2109":"Moyen"}	\N	\N	\N	2026-03-03 07:49:50.179523	\N	\N	\N	\N	\N	\N	f	\N	Chef de vente	["Indépendant","Salarié","Demandeur d’emploi"]	\N	f
ff326370-cf10-4882-99bb-890f88f44000	aopia	M.	merryl	thire	0782231912	dsd	Français	{"470":"Occasionnelle","473":"Moyen","474":"Moyen","477":"Moyen","2109":"Moyen"}	{"Découverte":{"score":2,"total":5,"percentage":40,"requiredCorrect":4,"validated":false}}	Découverte	Français - Niveau Découverte & Niveau Technique	2026-03-02 14:42:01.596757	\N	\N	\N	\N	\N	Débutant	f	{"Découverte":{"2428":"Un adjectif","2429":"Un adjectif","2430":"Un déterminant","2431":"hier","2432":"hier"}}	ds	["Salarié"]	{"2165":"Oui","2166":"Un peu","2167":"Un peu","2168":"Non","2169":null,"2170":"Non","2172":null,"2173":null,"2174":null,"2175":null,"2176":null,"2177":[],"2178":null,"2179":null,"2180":null,"2181":null,"2182":null,"2183":null,"2184":null,"2185":null,"2186":null,"2187":null,"2425":null,"2448":null,"2449":"Magazines","2517":null,"2518":null}	f
0d7db0da-bad0-45d8-abf3-1f4aa58ee0c2	aopia	M.	FLOREK	Prénom	+33603675924	AF	Excel	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":0,"total":5,"percentage":0,"requiredCorrect":3,"validated":false}}	Basique	Excel - Niveau Basique & Niveau Operationnel	2026-03-03 08:46:23.756815	\N	\N	\N	\N	\N	Initial	f	{"Initial":{"1975":"Une **cellule **","1976":"\\\\=**SOMME**(A1 ; A3 ; A5 ; A7)","1977":"**Secteur** / **Histogramme** / **Courbe**"},"Basique":{"1978":"L'icône : **£**","1979":"A **ordonner** les valeurs en fonction du filtre","1980":"**NB**()","1981":"Imprimer les **titres**","1982":"**DATE**()"}}	commercial	["Indépendant"]	\N	f
40b882bb-a745-4714-8c5d-096c1a119999	aopia	M.	merryl	thire	0782231912	dsd	\N	\N	\N	\N	\N	2026-03-03 08:54:56.798806	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
74c8c9ea-fc5d-440c-94de-3007e7d06ae8	aopia	M.	Thiré	Merryl	0782231912	sds	Anglais 	{"470":"Occasionnelle","473":"Moyen","474":"Moyen","477":"Moyen","2109":"Moyen"}	{"A1":{"score":5,"total":6,"percentage":83.33333333333334,"requiredCorrect":4,"validated":true},"A2":{"score":4,"total":6,"percentage":66.66666666666666,"requiredCorrect":5,"validated":false}}	A2	Niveau A2 | Niveau B1	2026-03-02 14:21:29.331734	2026-03-02 14:36:41.382	75	{"40":"Non","41":"Non","42":null,"447":"djkj"}	{"43":["Matin"],"44":"ds","45":"sd"}	\N	A1	t	{"A1":{"2123":"is","2124":"have","2125":"is","2126":"is","2127":"is watching","2128":"is going"},"A2":{"15":"were","16":"was watching","17":"much","18":"tallest","19":"beautiful","20":"go"}}	ffdf	["Salarié"]	{"2165":null,"2166":null,"2167":null,"2168":null,"2169":null,"2170":null,"2172":"Bac + 2","2173":"Non","2174":null,"2175":null,"2176":"Oui","2177":["Lecture"],"2178":null,"2179":null,"2180":null,"2181":null,"2182":null,"2183":null,"2184":null,"2185":null,"2186":null,"2187":null,"2425":null,"2448":"Régulier","2449":null,"2517":null,"2518":null}	f
c1164e11-2e47-4deb-8307-baa813c30524	aopia	M.	FLOREK	Prénom	+33603675924	AF	Excel	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Initial	Excel - Niveau Initial & Niveau Basique	2026-03-03 08:28:47.414802	\N	\N	\N	\N	\N	Débutant	f	{"Initial":{"1975":"Une **cellule **","1976":"\\\\=**SOMME**(A1 ; A3 ; A5 ; A7)","1977":"**Diagramme** / **Colonnes** / **Courbe**"}}	Commercial	["Indépendant"]	\N	f
2f59c0aa-c34c-43c6-9828-324070c5c8a1	aopia	M.	PINO CORTES	FRANCK	+33613578210	ARNAUD LANDAIS	Intelligence Artificielle Générative	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	\N	\N	Formation non reconnue	2026-03-03 17:25:47.588791	\N	\N	{"40":"Non","41":"Non","42":null,"447":"Savoir utiliser l'IA dans mes missions professionnelles"}	{"43":["Toute la journée"],"44":"avril 2026","45":"dispo après 16h"}	\N	\N	f	\N	Responsable formateurs et ADV	["Salarié"]	{"2165":null,"2166":null,"2167":null,"2168":null,"2169":null,"2170":null,"2171":null,"2172":null,"2173":null,"2174":null,"2175":null,"2176":null,"2177":[],"2178":null,"2179":null,"2180":null,"2181":null,"2182":null,"2183":null,"2184":"Communication","2185":"Utilisation régulière","2186":null,"2187":null,"2425":null,"2448":null,"2449":[],"2517":null,"2518":null}	f
11ebb68a-192e-42de-a30d-4fde145fa7b5	aopia	M.	Cécile	Test	0546857545	FT	Anglais 	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"A1 - Revoir les bases":{"score":6,"total":6,"percentage":100,"requiredCorrect":6,"validated":true},"A2 - Consolider les bases":{"score":3,"total":6,"percentage":50,"requiredCorrect":5,"validated":false}}	A2 - Consolider les bases	Niveau A2 - Consolider les bases | Niveau B1 - Développer l'autonomie	2026-03-04 11:24:56.132813	2026-03-04 13:05:18.702	75	{"40":"Non","41":"Oui","42":"Difficulté d'audition","447":"Progresser"}	{"43":[],"44":null,"45":null}	\N	A1 - Revoir les bases	t	{"A1 - Revoir les bases":{"2123":"is","2124":"have","2125":"is","2126":"is","2127":"is watching","2128":"goes"},"A2 - Consolider les bases":{"15":"are","16":"was watching","17":"many","18":"taller","19":"as beautiful as","20":"went"}}	comptable	["Indépendant"]	{"2165":null,"2166":null,"2167":null,"2168":null,"2169":null,"2170":null,"2171":null,"2172":"Bac + 2","2173":"Non","2174":null,"2175":null,"2176":"Oui","2177":["Voyages"],"2178":null,"2179":null,"2180":null,"2181":null,"2182":null,"2183":null,"2184":null,"2185":null,"2186":null,"2187":null,"2425":null,"2448":"Ponctuel","2449":[],"2517":null,"2518":null}	f
7f247c1b-a8e0-42af-b8c7-dcd7d2a0627d	aopia	M.	FLOREK	Alexandre	+33603675924	c	Excel	{"470":"Tous les jours","473":"Acquis","474":"Insuffisant","477":"Acquis","2109":"Acquis"}	{"Initial":{"score":0,"total":3,"percentage":0,"requiredCorrect":3,"validated":false}}	Initial	Excel - Niveau Initial & Niveau Basique	2026-03-03 08:54:35.219272	\N	\N	\N	\N	\N	Débutant	f	{"Initial":{"1975":"Je ne sais pas","1976":"Je ne sais pas","1977":"Je ne sais pas"}}	C	["Indépendant"]	\N	f
cd8898ae-63eb-4529-b219-b9802c3c329d	aopia	M.	FLOREK	Alexandre	+33603675924	c	\N	\N	\N	\N	\N	2026-03-03 10:53:08.866684	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
90d3e067-2281-4ba6-a88d-f7c24dbfec1a	aopia	M.	FLOREK	Alexandre	+33603675924		Excel	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":3,"validated":true},"Operationnel":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Avance":{"score":2,"total":5,"percentage":40,"requiredCorrect":5,"validated":false}}	Avance	Niveau Avance | Niveau Expert	2026-03-03 10:55:09.135722	2026-03-03 11:29:16.408	72	{"40":"Non","41":"Non","42":null,"447":"être meilleur que Franck"}	{"43":["Toute la journée"],"44":"avril 2026","45":"aucune"}	\N	Operationnel	t	{"Initial":{"1975":"Une **cellule **","1976":"\\\\=**SOMME**(A1 ; A3 ; A5 ; A7)","1977":"**Secteur** / **Histogramme** / **Courbe**"},"Basique":{"1978":"L'icône : **$**","1979":"A **ordonner** les valeurs en fonction du filtre","1980":"**SI**()","1981":"Figer les **volets **","1982":"**AUJOURDHUI**()"},"Operationnel":{"1983":"À **mettre en évidence** les valeurs","1984":"De **copier** et/ou **incrémenter** une valeur","1985":"Un **tableau croisé dynamique**","1986":"Données","1987":"Je **protège** le **classeur**"},"Avance":{"1988":"Utiliser un **tableau croisé dynamique**","1989":"Ajouter une **forme** de type « **trait** » et la déplacer au-dessus du **graphique**","1990":"À **concaténer** des valeurs","1991":"À **retourner** une **valeur** à partir d’une position","1992":"À **regrouper** et **résumer** des données provenant de **plusieurs** feuilles ou classeurs en un **seul** tableau"}}	Animateur 	["Indépendant"]	\N	f
3e1aca72-d45d-459c-865a-6ea206be04e4	aopia	Mme	Cécile 	Raynal	06 03 67 59 24	FT	\N	\N	\N	\N	\N	2026-03-03 13:24:50.45353	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
c4b1bbec-0069-4d04-81fb-b7527acf1c4a	aopia	Mme	Cécile 	Raynal	06 03 67 59 24	FT	\N	\N	\N	\N	\N	2026-03-03 13:24:55.813805	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
da37033e-7511-42a9-aa46-4a2d36beb2e0	aopia	Mme	Cécile 	Raynal	06 03 67 59 24	FT	\N	\N	\N	\N	\N	2026-03-03 13:25:02.532807	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
8e1f4a95-2c03-4e84-8f24-519ed19db499	aopia	Mme	Cécile 	Raynal	06 03 67 59 24	FT	\N	\N	\N	\N	\N	2026-03-03 13:25:12.030845	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
56ee7895-1344-4d2e-aa25-eb4a95fd1e5b	aopia	Mme	RAYNAL	Cécile	06 03 67 59 24	AF	\N	\N	\N	\N	\N	2026-03-03 13:26:22.539339	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
777b4f96-5ec2-4a1b-94b7-c3c5edd8caa1	aopia	Mme	RAYNAL	Cécile	06 03 67 59 24	AF	\N	\N	\N	\N	\N	2026-03-03 13:29:00.459475	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
3f64275e-905d-47e2-b409-7fe36e28caab	aopia	Mme	RAYNAL	cécile	06849056	FT	\N	\N	\N	\N	\N	2026-03-03 13:33:18.174267	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
a1074dfd-f1a9-405d-b903-dbbdfad6dbc3	aopia	Mme	RAYNAL	cécile	06849056	FT	\N	\N	\N	\N	\N	2026-03-03 13:33:19.504707	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
312f7dd4-9112-49db-a93e-fa6fa7657a62	aopia	Mme	RAYNAL	cécile	06849056	FT	\N	\N	\N	\N	\N	2026-03-03 13:33:22.153805	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
01824a11-c6cd-4f42-969a-ce0110313599	aopia	M.	PINO CORTES	FRANCK	+33613578210	ARNAUD LANDAIS	Sketchup	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Initial	Niveau Initial | Niveau Basique	2026-03-03 17:28:56.040194	2026-03-03 17:31:21.631	67	{"40":"Non","41":"Non","42":null,"447":"professionnel"}	{"43":[],"44":null,"45":null}	\N	Débutant	t	{"Initial":{"2014":"Modélisation 3D","2015":"Choisir un élément du modèle","2016":"Mesurer une distance"}}	responsable	["Salarié"]	{"2165":null,"2166":null,"2167":null,"2168":null,"2169":null,"2170":null,"2171":null,"2172":null,"2173":null,"2174":null,"2175":null,"2176":null,"2177":[],"2178":null,"2179":null,"2180":"Oui","2181":"Non","2182":"Oui","2183":null,"2184":null,"2185":null,"2186":null,"2187":null,"2425":null,"2448":null,"2449":[],"2517":null,"2518":null}	f
71ebffee-de52-42b4-bc31-7513e0cbaece	aopia	Mme	Mckee	Harlan	+1 (689) 155-8629	Voluptatibus sapient	\N	\N	\N	\N	\N	2026-03-03 13:44:52.440807	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
3f196cd9-fc83-414d-832a-d21a303b0aae	aopia	M.	RAYNAL	cécile	0684479536	FT	\N	\N	\N	\N	\N	2026-03-03 14:54:19.77381	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
1dd5639a-d59e-4669-b46a-476e605e2390	aopia	M.	RAYNAL	cécile	0684479536	FT	\N	\N	\N	\N	\N	2026-03-03 14:54:21.774808	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
4fa33c2e-7d7c-4b09-805a-0f0194999a79	aopia	M.	RAYNAL	cécile	0678451236	francis THIBAULT	\N	\N	\N	\N	\N	2026-03-03 14:54:45.214796	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
7213a27e-ede1-4223-8a99-43ab14f5db08	aopia	M.	RAYNAL	cécile	0678451236	francis THIBAULT	\N	\N	\N	\N	\N	2026-03-03 14:54:46.561747	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
2ae75736-ccf2-4870-8227-ea38c6dd66f8	aopia	M.	RAYNAL	Cécile	0648754623	FT	\N	\N	\N	\N	\N	2026-03-03 14:55:11.295812	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
7956c9c3-aa2b-4e1c-8211-100ad926087f	aopia	M.	RAYNAL	Cécile	0648754623	FT	\N	\N	\N	\N	\N	2026-03-03 14:55:12.468838	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
2523f6ec-a1f3-4472-b6b1-65e649c02a72	aopia	M.	RAYNAL	Cécile	0648754623	FT	\N	\N	\N	\N	\N	2026-03-03 14:55:19.862803	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
cbe43adb-9ebf-4e42-a859-0315fe274e84	aopia	M.	RAYNAL	Cécile	0648754623	FT	\N	\N	\N	\N	\N	2026-03-03 14:55:21.78081	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
70c07606-7a03-44c3-93a6-9ef23f7ce863	aopia	M.	RAYNAL	Cécile	0648754623	FT	\N	\N	\N	\N	\N	2026-03-03 14:55:29.662822	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
072ab76f-74cd-4de2-9ee0-bf4043af81d9	aopia	Mme	raynal	Audrey	0623457852	AF	\N	\N	\N	\N	\N	2026-03-03 14:55:54.341802	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
2406220c-1781-4ec0-ac73-2a2685eb9252	aopia	Mme	raynal	Audrey	0623457852	AF	\N	\N	\N	\N	\N	2026-03-03 14:55:55.487804	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
18739da4-cc6e-435a-ab74-1e23042d931d	aopia	M.	PINO CORTES	FRANCK	+33613578210	ARNAUD LANDAIS	Word	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Operationnel":{"score":3,"total":5,"percentage":60,"requiredCorrect":4,"validated":false}}	Operationnel	Niveau Operationnel | Niveau Avance	2026-03-03 17:31:46.669275	2026-03-03 17:42:21.841	77	{"40":null,"41":null,"42":null,"447":""}	{"43":[],"44":null,"45":null}	\N	Basique	t	{"Initial":{"2060":"A **rédiger** du contenu **traitement de texte**","2061":"**Fichier** \\\\> **Enregistrer sous**","2062":"**Insertion** > **Images **"},"Basique":{"2063":"CTRL + **S **","2064":"Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","2065":"Un **retrait**","2066":"**Double clic** dans la partie la plus **haute** de la page puis **Insérer** une image","2067":"Bleu"},"Operationnel":{"2068":"**Accueil** > **Styles**","2069":"**Mise en page** > **Colonnes **","2070":".**DOCX**","2071":"**Insertion** > **Tableau** > Feuille de calcul **Excel**","2072":"**Références** > **Tables des matières **"}}	responsable	["Salarié"]	\N	f
082711d6-3d71-4b7f-91ef-d9564c92f77b	aopia	M.	PINO CORTES	FRANCK	+33613578210		PowerPoint	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	\N	\N	Formation non reconnue	2026-03-03 17:42:29.776984	\N	\N	{"40":null,"41":null,"42":null,"447":""}	{"43":[],"44":null,"45":null}	\N	\N	f	\N	responsable formation	["Salarié"]	\N	f
79053322-7c47-40c0-81bc-41320bdac33d	aopia	M.	RANDRIANIAINA	Herizo	03 20 84 49 49	AF	\N	\N	\N	\N	\N	2026-03-04 05:14:00.373805	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
0db894ad-2673-46f7-82d8-f8a5d36029c4	aopia	M.	PINO CORTES	FRANCK	+33613578210	ARNAUD LANDAIS	Google Sheets	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true}}	\N	\N	2026-03-03 17:44:02.730858	\N	\N	\N	\N	\N	Basique	f	{"Initial":{"2351":"Une cellule","2352":"Il n’y a rien à faire, l’enregistrement est automatique","2353":"C4"},"Basique":{"2354":"=SOMME(A1:A5)","2355":"À copier ou incrémenter une valeur ou une formule","2356":"Cliquer sur la première cellule puis maintenir Maj et cliquer sur la dernière","2357":"Données > Trier la plage","2358":"MAINTENANT()"}}	responsable	["Salarié"]	\N	f
2636501f-20b5-4744-830c-98a37d87ad4d	aopia	M.	dfg	dfg	dfg		Français	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"Découverte":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true},"Technique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Professionnel":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true},"Affaires":{"score":4,"total":5,"percentage":80,"requiredCorrect":5,"validated":false}}	Affaires	Français - Niveau Affaires	2026-03-04 06:48:23.3248	\N	\N	\N	\N	\N	Professionnel	f	{"Découverte":{"2428":"Un adverbe","2429":"Un adjectif","2430":"Un déterminant","2431":"les documents","2432":"à ses collègues"},"Technique":{"2433":"Incorrecte","2434":"Incorrecte","2435":"Correcte","2436":"Correcte","2437":"Incorrecte"},"Professionnel":{"2438":"Incorrecte","2439":"Incorrecte","2440":"Incorrecte","2441":"Correcte","2442":"Incorrecte"},"Affaires":{"2443":"Correcte","2444":"Incorrecte","2445":"Incorrecte","2446":"Incorrecte","2447":"Incorrecte"}}	dfg	["Salarié","Indépendant"]	{"2165":"Oui","2166":null,"2167":null,"2168":null,"2169":null,"2170":null,"2171":null,"2172":null,"2173":null,"2174":null,"2175":null,"2176":null,"2177":[],"2178":null,"2179":null,"2180":null,"2181":null,"2182":null,"2183":null,"2184":null,"2185":null,"2186":null,"2187":null,"2425":null,"2448":null,"2449":[],"2517":null,"2518":null}	f
e5d648de-9d65-48de-8d99-9970a65e2304	aopia	Mme	RAYNAL	Cécile	0654878541	FT	Word	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true},"Operationnel":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Avance":{"score":3,"total":5,"percentage":60,"requiredCorrect":5,"validated":false}}	Avance	Word - Niveau Avance	2026-03-04 08:08:20.311705	\N	\N	\N	\N	\N	Operationnel	f	{"Initial":{"2060":"A **rédiger** du contenu **traitement de texte**","2061":"**Fichier** > **Enregistrer sous**","2062":"**Insertion** > **Images **"},"Basique":{"2063":"CTRL + **S **","2064":"Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","2065":"Une **tabulation**","2066":"**Double clic** dans la partie la plus **haute** de la page puis **Insérer** une image","2067":"Bleu"},"Operationnel":{"2068":"**Accueil** > **Styles**","2069":"**Mise en page** > **Colonnes **","2070":".**DOCX**","2071":"**Copier** le tableau dans **Excel** > **Coller** de manière **spéciale** dans **Word **","2072":"**Références** > **Tables des matières **"},"Avance":{"2073":"En utilisant le principe du **document maître** et des **sous-documents**","2074":"La note de bas de page s’affiche **en bas de la page concernée**, tandis que la note de fin est **regroupée à la fin du document** ou d’une section","2075":"À **visualiser** et **corriger** des **modifications proposées** par d’autres utilisateurs ou par soi-même","2076":"**Fichiers** > **Informations** > **Gérer le document**","2077":"Sélectionner les **objets**"}}	Formatrice	["Salarié"]	\N	f
3f0c35fb-8740-4b37-9e09-a6f05028575b	aopia	M.	Verbeke	Syriac	+261600000000		PowerPoint	{"470":"Occasionnelle","473":"Moyen","474":"Moyen","477":"Moyen","2109":"Moyen"}	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	\N	\N	2026-03-04 12:12:47.572807	\N	\N	\N	\N	\N	Débutant	f	{"Initial":{"2607":"À créer des présentations avec des diapositives ","2609":["Un tableau ","Une image ","Une forme "],"2610":"Créer un diaporama "}}	hjk	["Salarié"]	\N	f
5b3d03cb-054c-4ff5-9250-1f2076bc1f56	aopia	M.	PINO CORTES	FRANCK	+33613578210	ARNAUD LANDAIS	Excel	{"470":"Tous les jours","473":"Acquis","474":"Moyen","477":"Acquis","2109":"Acquis"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":1,"total":5,"percentage":20,"requiredCorrect":4,"validated":false}}	Basique	Niveau Basique | Niveau Operationnel	2026-03-04 10:37:18.870282	2026-03-04 10:43:33.93	50	{"40":null,"41":null,"42":null,"447":""}	{"43":[],"44":null,"45":null}	\N	Initial	t	{"Initial":{"1975":"Une **cellule **","1976":"\\\\=**SOMME**(A1 ; A3 ; A5 ; A7)","1977":"**Secteur** / **Histogramme** / **Courbe**"},"Basique":{"1978":"L'icône : **%**","1979":"A **ordonner** les valeurs en fonction du filtre","1980":"**SI**()","1981":"Imprimer les **titres**","1982":"**DATE**()"}}	resp	["Salarié"]	\N	f
cbce5826-054d-442d-9db3-a5233f26e235	aopia	M.	PINO CORTES	FRANCK	+33613578210		\N	\N	\N	\N	\N	2026-03-04 10:44:12.597793	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
88c9f244-ef29-441e-abb7-09c5b379ee94	aopia	Mme	HUET	Audrey	06 59 39 62 48		Photoshop	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"Initial":{"score":4,"total":4,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":5,"total":6,"percentage":83.33333333333334,"requiredCorrect":4,"validated":true}}	Basique	Niveau Opérationnel  | Niveau Avancé 	2026-03-04 16:15:14.344271	2026-03-04 16:27:28.395	90	{"40":"Non","41":"Non","42":null,"447":""}	{"43":["Matin"],"44":null,"45":null}	\N	Basique	t	{"Initial":{"2528":"Fichier > Ouvrir ","2529":"Le PSD est l’extension de Photoshop","2530":"Supprimer une partie de l’image et ajuster le cadrage ","2608":"À créer des présentations avec des diapositives"},"Basique":{"2531":"Copier une couleur de l’image ","2532":"Ctrl + Z","2533":"Le PSD est l’extension de Photoshop","2534":"À séparer les éléments pour les modifier indépendamment ","2535":"De transformer (redimensionner / déplacer) un élément ","2536":"Sélection > Intervertir "}}	Coordinatrice	["Salarié"]	{"2165":null,"2166":null,"2167":null,"2168":null,"2169":null,"2170":null,"2171":null,"2172":null,"2173":null,"2174":null,"2175":null,"2176":null,"2177":[],"2178":"Occasionnellement","2179":"Oui","2180":null,"2181":null,"2182":null,"2183":null,"2184":null,"2185":null,"2186":null,"2187":null,"2425":null,"2448":null,"2449":[],"2517":null,"2518":null}	f
91648d5c-df15-4464-bb63-825530dd6812	aopia	Mme	HUET	audrey	06 59 39 62 48		Excel	{"470":"Jamais","473":"Insuffisant","474":"Insuffisant","477":"Insuffisant","2109":"Insuffisant"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true},"Operationnel":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Avance":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Expert":{"score":2,"total":5,"percentage":40,"requiredCorrect":5,"validated":false}}	Expert	Niveau Expert	2026-03-04 16:28:50.884809	2026-03-04 16:38:01.136	78	{"40":null,"41":null,"42":null,"447":""}	{"43":[],"44":null,"45":null}	\N	Avance	t	{"Initial":{"1975":"Une **cellule **","1976":"\\\\=**SOMME**(A1 ; A3 ; A5 ; A7)","1977":"**Secteur** / **Histogramme** / **Courbe**"},"Basique":{"1978":"L'icône : **$**","1979":"A **afficher** les valeurs correspondant au filtre","1980":"**SI**()","1981":"Figer les **volets **","1982":"**AUJOURDHUI**()"},"Operationnel":{"1983":"À **mettre en évidence** les valeurs","1984":"De **copier** et/ou **incrémenter** une valeur","1985":"Un **tableau croisé dynamique**","1986":"Données","1987":"Je **protège** le **classeur**"},"Avance":{"1988":"Utiliser la fonction SOMMEPROD","1989":"Utiliser un **graphique combiné**","1990":"À **concaténer** des valeurs","1991":"À **tester** les valeurs **équivalentes**","1992":"À **regrouper** et **résumer** des données provenant de **plusieurs** feuilles ou classeurs en un **seul** tableau"},"Expert":{"1993":"**RECHERCHEV**","1994":"Je ne sais pas","1995":"Un **tableau croisé dynamique** basé sur un **modèle de données**","1996":"**Développeur**","1997":"Je ne sais pas"}}	Coordinatrice	["Salarié"]	\N	f
79c7a24b-efeb-4b95-b59b-04f0522d6b01	aopia	M.	MBL	IT Manager	+261326844949		\N	\N	\N	\N	\N	2026-03-05 06:52:10.247814	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
24edaac6-e8ab-4c4b-8f0a-df5e6d00fda4	aopia	M.	Verbeke	Syriac	+261600000000		Photoshop	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"Initial":{"score":2,"total":4,"percentage":50,"requiredCorrect":3,"validated":false}}	Initial	Photoshop Initial & Photoshop Basique	2026-03-05 16:43:00.585023	\N	\N	\N	\N	\N	Débutant	f	{"Initial":{"2528":"Fichier > Ouvrir ","2529":"Le JPEG est l’extension la moins utilisée","2530":"Ajouter du texte","2608":"À créer des présentations avec des diapositives"}}	fghgh	["Indépendant","Demandeur d’emploi"]	{"2165":null,"2166":null,"2167":null,"2168":null,"2169":null,"2170":null,"2171":null,"2172":null,"2173":null,"2174":null,"2175":null,"2176":null,"2177":[],"2178":"Régulièrement","2179":"Oui","2180":null,"2181":null,"2182":null,"2183":null,"2184":null,"2185":null,"2186":null,"2187":null,"2425":null,"2448":null,"2449":[],"2517":null,"2518":null}	f
be60db79-2a32-4bba-93fa-34e621487d1b	aopia	M.	Verbeke	Syriac	+261600000000		Excel	{"470":"Occasionnellement (1 à 2 fois par semaine)","473":"Quotidiennement ","477":"Oui","2109":"Oui","2632":"Oui","2633":"Quotidiennement","2636":"Oui","2640":"Insufissant"}	\N	\N	\N	2026-03-05 19:46:49.480637	\N	\N	\N	\N	\N	\N	f	\N	aze	["Salarié","Reconversion","Indépendant"]	\N	f
1a48888f-5a29-448b-949a-8d7c2bb65d19	aopia	M.	RANDRIANIAINA	Herizo	+261326844949		Anglais 	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"A1 - Revoir les bases":{"score":6,"total":6,"percentage":100,"requiredCorrect":6,"validated":true},"A2 - Consolider les bases":{"score":6,"total":6,"percentage":100,"requiredCorrect":5,"validated":true},"B1 - Développer l'autonomie":{"score":3,"total":6,"percentage":50,"requiredCorrect":5,"validated":false}}	B1 - Développer l'autonomie	Niveau B1 - Développer l'autonomie | Niveau B2 - Renforcer les compétences	2026-03-05 07:16:55.202793	2026-03-05 07:23:33.482	83	{"40":"Non","41":"Non","42":null,"447":"Se renforcer"}	{"43":["Toute la journée"],"44":null,"45":null}	\N	A2 - Consolider les bases	t	{"A1 - Revoir les bases":{"2123":"is","2124":"have","2125":"is","2126":"is","2127":"is watching","2128":"goes"},"A2 - Consolider les bases":{"15":"were","16":"was watching","17":"much","18":"tallest","19":"as beautiful as","20":"went"},"B1 - Développer l'autonomie":{"21":"since","22":"had","23":"was building","24":"has worked","25":"ate","26":"drank"}}	Chef de projet IT	["Salarié"]	{"2165":null,"2166":null,"2167":null,"2168":null,"2169":null,"2170":null,"2171":null,"2172":"Lycée","2173":"Oui","2174":"Clientèle","2175":"Ponctuel","2176":"Oui","2177":["Films/Séries"],"2178":null,"2179":null,"2180":null,"2181":null,"2182":null,"2183":null,"2184":null,"2185":null,"2186":null,"2187":null,"2425":null,"2448":"Ponctuel","2449":[],"2517":null,"2518":null}	f
d1331c71-dfca-4d20-bbe9-15d83ce9c1b5	aopia	M.	Verbeke	Syriac	+261600000000		Français	{"470":"Occasionnelle","473":"Moyen","474":"Moyen","477":"Moyen","2109":"Moyen"}	\N	\N	\N	2026-03-05 07:14:28.132611	\N	\N	\N	\N	\N	\N	f	\N	dsdf	["Salarié"]	{"2165":"Non","2166":null,"2167":null,"2168":null,"2169":null,"2170":null,"2171":null,"2172":null,"2173":null,"2174":null,"2175":null,"2176":null,"2177":[],"2178":null,"2179":null,"2180":null,"2181":null,"2182":null,"2183":null,"2184":null,"2185":null,"2186":null,"2187":null,"2425":null,"2448":null,"2449":[],"2517":null,"2518":null}	f
273b73b7-7ffb-487a-9c6d-ad52d322d652	aopia	M.	RANDRIANIAINA	Herizo Nomenjanahary	+261344972670		Anglais 	{"470":"Occasionnelle","473":"Acquis","474":"Moyen","477":"Moyen","2109":"Moyen"}	{"A1 - Revoir les bases":{"score":6,"total":6,"percentage":100,"requiredCorrect":6,"validated":true},"A2 - Consolider les bases":{"score":4,"total":6,"percentage":66.66666666666666,"requiredCorrect":5,"validated":false}}	A2 - Consolider les bases	Anglais  - Niveau A2 - Consolider les bases & Niveau B1 - Développer l'autonomie	2026-03-05 09:50:48.458893	\N	\N	\N	\N	\N	A1 - Revoir les bases	f	{"A1 - Revoir les bases":{"2123":"is","2124":"have","2125":"is","2126":"is","2127":"is watching","2128":"goes"},"A2 - Consolider les bases":{"15":"were","16":"were watching","17":"much","18":"tallest","19":"beautiful","20":"went"}}	dfq	["Indépendant"]	{"2165":null,"2166":null,"2167":null,"2168":null,"2169":null,"2170":null,"2171":null,"2172":"Bac + 2","2173":"Non","2174":null,"2175":null,"2176":"Oui","2177":["Films/Séries"],"2178":null,"2179":null,"2180":null,"2181":null,"2182":null,"2183":null,"2184":null,"2185":null,"2186":null,"2187":null,"2425":null,"2448":"Régulier","2449":[],"2517":null,"2518":null}	f
7413b4fc-33c8-4055-83a4-e98d95d3b145	like	M.	Verbeke	Syriac	+261600000000		\N	\N	\N	\N	\N	2026-03-05 08:00:12.833573	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
759137d6-f9a6-4485-a7c5-f4713f4f27b9	aopia	Mme	HUET	Audrey	06 59 39 62 48		\N	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	\N	\N	\N	2026-03-05 09:11:54.342791	\N	\N	\N	\N	\N	\N	f	\N	Coordinatrice	["Salarié"]	\N	f
8437db6a-eb45-4599-9b42-23980d196ea4	aopia	M.	Verbeke	Syriac	+261600000000		Word	{"470":"Occasionnellement (1 à 2 fois par semaine)","473":"Occasionnellement (1 à 2 fois par semaine)","477":"Non","2109":"Non","2632":"Non","2633":"Occasionnellement (1 à 2 fois par semaine)","2636":"Non"}	{"Initial":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	Initial	TOSA Word Initial & TOSA Word Basique	2026-03-05 18:40:56.418896	\N	\N	{"40":"Oui","41":"Oui","42":"dfg","447":"dfg"}	\N	\N	Débutant	f	{"Initial":{"2060":"A **rédiger** du contenu **traitement de texte**","2061":"**Fichier** > **Exporter**","2062":"**Insertion** > **Objet**"}}	Assistant 	["Salarié","Reconversion"]	\N	f
157f2cef-0712-42d8-b4b0-d141cc41125e	aopia	M.	Verbeke	Syriac	+261600000000		Gimp	{"470":"Occasionnellement (1 à 2 fois par semaine)","473":"Occasionnellement (1 à 2 fois par semaine)","477":"Oui","2109":"Non","2632":"Non","2633":"Jamais","2636":"Non"}	\N	\N	\N	2026-03-05 19:13:34.965762	\N	\N	{"40":"Oui","41":"Oui","42":"sdf","447":"sdf"}	\N	\N	\N	f	\N	fgh	["Salarié","Demandeur d’emploi"]	{"2165":null,"2166":null,"2167":null,"2168":null,"2169":null,"2170":null,"2171":null,"2172":null,"2173":null,"2174":null,"2175":null,"2176":null,"2177":[],"2178":null,"2179":null,"2180":null,"2181":null,"2182":null,"2183":null,"2184":null,"2185":null,"2186":null,"2187":null,"2425":null,"2448":null,"2449":[],"2517":"Régulièrement ","2518":"Oui"}	f
5004b7a3-cbca-4b77-af44-ed007813170f	aopia	M.	Verbeke	Syriac	+261600000000		Word	{"470":"Tous les jours","473":"Moyen","474":"Moyen","477":"Moyen","2109":"Moyen"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Operationnel":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Avance":{"score":5,"total":5,"percentage":100,"requiredCorrect":5,"validated":true}}	Avance	TOSA Word Basique & TOSA Word Opérationnel	2026-03-05 15:11:10.872035	\N	\N	\N	\N	\N	Avance	f	{"Initial":{"2060":"A **rédiger** du contenu **traitement de texte**","2061":"**Fichier** > **Enregistrer sous**","2062":"**Insertion** > **Images **"},"Basique":{"2063":"CTRL + **S **","2064":"Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","2065":"Une **tabulation**","2066":"**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","2067":"Bleu"},"Operationnel":{"2068":"**Accueil** > **Styles**","2069":"**Mise en page** > **Colonnes **","2070":".**DOTX**","2071":"**Copier** le tableau dans **Excel** > **Coller** de manière **spéciale** dans **Word **","2072":"**Insertion** > **Ajouter un sommaire**"},"Avance":{"2073":"En utilisant le principe du **document maître** et des **sous-documents**","2074":"La note de bas de page s’affiche **en bas de la page concernée**, tandis que la note de fin est **regroupée à la fin du document** ou d’une section","2075":"À **visualiser** et **corriger** des **modifications proposées** par d’autres utilisateurs ou par soi-même","2076":"**Révision** > **Restreindre** la modification","2077":"Volet **sélection **"}}	fghghh	["Salarié"]	\N	f
1586dbaa-e106-4396-a76b-fb3b7b6b0c2c	aopia	M.	Verbeke	Syriac	+261600000000		Word	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Operationnel":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Avance":{"score":5,"total":5,"percentage":100,"requiredCorrect":5,"validated":true}}	Avance	TOSA Word Basique & TOSA Word Opérationnel	2026-03-05 15:57:26.748583	2026-03-05 15:59:40.831	0	{"40":"Oui","41":"Oui","42":"sdf","447":"df"}	{"43":["Matin"],"44":"sqsd","45":"qsd"}	\N	Avance	t	{"Initial":{"2060":"A **rédiger** du contenu **traitement de texte**","2061":"**Fichier** > **Enregistrer sous**","2062":"**Insertion** > **Images **"},"Basique":{"2063":"CTRL + **S **","2064":"Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","2065":"Une **tabulation**","2066":"**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","2067":"Bleu"},"Operationnel":{"2068":"**Accueil** > **Styles**","2069":"**Mise en page** > **Colonnes **","2070":".**DOTX**","2071":"**Copier** le tableau dans **Excel** > **Coller** de manière **spéciale** dans **Word **","2072":"**Insertion** > **Ajouter un sommaire**"},"Avance":{"2073":"En utilisant le principe du **document maître** et des **sous-documents**","2074":"La note de bas de page s’affiche **en bas de la page concernée**, tandis que la note de fin est **regroupée à la fin du document** ou d’une section","2075":"À **visualiser** et **corriger** des **modifications proposées** par d’autres utilisateurs ou par soi-même","2076":"**Révision** > **Restreindre** la modification","2077":"Volet **sélection **"}}	dfg	["Salarié"]	\N	f
97a0f88a-bbc2-4de9-8d21-0f0ddc7042a5	aopia	M.	Verbeke	Syriac	+261600000000		\N	\N	\N	\N	\N	2026-03-05 18:11:04.418512	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
f1ff74ec-1bfc-491c-8f38-de95ff5b1800	aopia	M.	Verbeke	Syriac	+261600000000		\N	\N	\N	\N	\N	2026-03-05 18:11:20.074335	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
64a49379-dbfe-4073-a411-5587c7c5c860	aopia	M.	Verbeke	Syriac	+261600000000		PowerPoint	{"470":"Occasionnelle","473":"Acquis","474":"Acquis","477":"Moyen","2109":"Acquis"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true},"Opérationnel":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true}}	\N	\N	2026-03-05 16:31:54.082833	\N	\N	\N	\N	\N	Opérationnel	f	{"Initial":{"2607":"À créer des **présentations** avec des diapositives ","2609":["Une **forme** ","Une **image**","Un **tableau** "],"2610":"Créer un **diaporama** "},"Basique":{"2611":"**F5**","2612":"**D’appliquer** une mise en forme **générale** à toute la **présentation **","2613":"Un **espace réservé **","2614":"Des **formules** de **calculs **","2615":"**Insertion > Images **"},"Opérationnel":{"2616":"La **transition** s’applique au passage **entre deux diapositives**, tandis que **l’animation** s’applique **aux objets** à l’intérieur d’une diapositive ","2617":"PPSX","2618":"**SmartArt **/ Vidéo **YouTube / Graphiques **","2619":"Le mode **Trieuse de diapositives **","2620":"À modifier un thème existant afin de le personnaliser à des fins précises (charte graphique d’une entreprise par exemple) "}}	df	["Salarié"]	\N	f
73a9d8d3-2ca3-4061-875a-a0b850be57f5	aopia	M.	Verbeke	Syriac	+261600000000		PowerPoint	{"470":"Occasionnelle","473":"Moyen","474":"Moyen","477":"Moyen","2109":"Moyen"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true},"Opérationnel":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true},"Avancé":{"score":4,"total":4,"percentage":100,"requiredCorrect":4,"validated":true},"Expert":{"score":0,"total":2,"percentage":0,"requiredCorrect":2,"validated":false}}	Expert	PowerPoint Basique & PowerPoint Opérationnel	2026-03-05 16:00:56.209065	\N	\N	\N	\N	\N	Avancé	f	{"Avancé":{"2622":"De regrouper certaines diapositives ","2623":"Non, nous pouvons choisir ne pas les afficher sur la diapositive de titre uniquement ","2624":"Un tableau ","2625":"Dans le groupe Animation avancée, j’utilise Reproduire l’animation"},"Expert":{"2626":"Avec la commande Déclencheur","2627":"Mode plan"}}	dfg	["Salarié"]	\N	f
8ecdae44-cbf8-4527-a06c-280be801c5c7	aopia	M.	Verbeke	Syriac	+261600000000		Word	{"470":"Occasionnellement (1 à 2 fois par semaine)","473":"Occasionnellement (1 à 2 fois par semaine)","477":"Non","2109":"Non","2632":"Non","2633":"Occasionnellement (1 à 2 fois par semaine)","2636":"Non"}	\N	\N	\N	2026-03-05 17:39:02.238001	\N	\N	\N	\N	\N	\N	f	\N	qsd	["Salarié","Reconversion"]	\N	f
3fdcf4e5-b74c-4e05-9a92-09262c172e69	aopia	M.	Verbeke	Syriac	+261600000000		Excel	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true}}	\N	\N	2026-03-05 16:45:19.409778	\N	\N	\N	\N	\N	Initial	f	{"Initial":{"2060":"A **rédiger** du contenu **traitement de texte**","2061":"**Fichier** > **Enregistrer sous**","2062":"**Insertion** > **Images **"}}	fgh	["Salarié"]	\N	f
7c230545-cf61-4869-8730-5b42fb7b9c1e	aopia	M.	Verbeke	Syriac	+261600000000		Excel	{"470":"Tous les jours","473":"Acquis","474":"Acquis","477":"Acquis","2109":"Acquis"}	\N	\N	\N	2026-03-05 16:46:40.297644	\N	\N	\N	\N	\N	\N	f	\N	dfg	["Salarié"]	\N	f
82f64fae-103f-43d7-99b7-dcce34c04ab7	aopia	M.	Verbeke	Syriac	+261600000000		\N	\N	\N	\N	\N	2026-03-05 16:59:03.49122	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
fef7e10e-8e61-4668-af3b-c845ae4cc0fb	aopia	M.	Verbeke	Syriac	+261600000000		\N	\N	\N	\N	\N	2026-03-05 17:00:09.680189	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
ee4ab12a-26de-41b4-9034-8f50db11f96f	aopia	M.	Verbeke	Syriac	+261600000000		\N	\N	\N	\N	\N	2026-03-05 17:07:15.829445	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
968be580-9e33-4754-a4dc-7e28ddf7686d	aopia	M.	Verbeke	Syriac	+261600000000		\N	{"470":"Quotidien","473":"Quotidien","477":"Oui","2109":"Oui","2632":"Oui","2633":"Occasionnellement (1 à 2 fois par semaine)"}	\N	\N	\N	2026-03-05 17:07:38.280165	\N	\N	\N	\N	\N	\N	f	\N	565	["Salarié"]	\N	f
cac5d5ac-a138-45f8-bcb0-502c0f021ef8	aopia	M.	Verbeke	Syriac	+261600000000		Gimp	{"470":"Quotidiennement ","473":"Quotidiennement ","477":"Oui","2109":"Oui","2632":"Oui","2633":"Quotidiennement","2636":"Oui"}	\N	\N	\N	2026-03-05 17:58:47.453513	\N	\N	\N	\N	\N	\N	f	\N	aze	["Demandeur d’emploi","Salarié"]	{"2165":null,"2166":null,"2167":null,"2168":null,"2169":null,"2170":null,"2171":null,"2172":null,"2173":null,"2174":null,"2175":null,"2176":null,"2177":[],"2178":null,"2179":null,"2180":null,"2181":null,"2182":null,"2183":null,"2184":null,"2185":null,"2186":null,"2187":null,"2425":null,"2448":null,"2449":[],"2517":"Régulièrement ","2518":"Oui"}	f
15ed996d-aa2d-49d2-83de-fa6f1762182c	aopia	M.	Verbeke	Syriac	+261600000000		\N	{"470":"Jamais","473":"Occasionnellement (1 à 2 fois par semaine)","477":"Non","2109":"Non","2632":"Non","2633":"Occasionnellement (1 à 2 fois par semaine)","2636":"Non"}	\N	\N	\N	2026-03-05 18:11:42.445279	\N	\N	\N	\N	\N	\N	f	\N	sdfsd	["Salarié"]	\N	f
537e5e2e-7c8b-4944-91c6-6291ed61b9e4	aopia	M.	Verbeke	Syriac	+261600000000		\N	\N	\N	\N	\N	2026-03-05 19:23:41.284766	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f
43b3751a-888d-45c1-99fe-6e94ecd381ca	aopia	M.	Verbeke	Syriac	+261600000000		Word	{"470":"Occasionnellement (1 à 2 fois par semaine)","473":"Occasionnellement (1 à 2 fois par semaine)","477":"Non","2109":"Non","2632":"Non","2633":"Occasionnellement (1 à 2 fois par semaine)","2636":"Non","2640":"Insufissant"}	\N	\N	\N	2026-03-05 19:31:45.722502	\N	\N	\N	\N	\N	\N	f	\N	tes	["Salarié","Reconversion","Indépendant"]	\N	f
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (key, value, description) FROM stdin;
SUPPORT_PHONE	01 23 45 67 89	Téléphone de support affiché
PLATFORM_NAME	Wizzi Learn	Nom de la plateforme
POSITIONNEMENT_PAGINATED	false	Afficher le positionnement question par question
PREREQUIS_PAGINATED	false	Afficher les prérequis question par question
AUTO_SKIP_MISE_A_NIVEAU	true	Autoriser le saut automatique de l'étape 'mise à niveau' en l'absence de questions
ADMIN_EMAIL	herizo.randrianiaina@mbl-service.com	Email de réception des bilans
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
3	PREREQUIS	Test informatique prérequis	2	/prerequis	t
2	FORMATION_SELECTION	Choix de la formation	3	/formations	t
9	MISE_A_NIVEAU	Mise Ã  niveau	4	/mise-a-niveau	t
4	POSITIONNEMENT	Test de positionnement	5	/positionnement	t
5	RESULTATS	Résultat et validation de la formation	6	/resultats	t
6	COMPLEMENTARY	Questions complémentaires	7	/complementary	t
7	AVAILABILITIES	Disponibilités	8	/availabilities	t
8	VALIDATION	Validation finale	9	/validation	t
12	test	test	1	/Test	f
\.


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contacts_id_seq', 151, true);


--
-- Name: formations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.formations_id_seq', 54, true);


--
-- Name: levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.levels_id_seq', 534, true);


--
-- Name: parcours_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parcours_rules_id_seq', 73, true);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_id_seq', 2640, true);


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

SELECT pg_catalog.setval('public.workflow_steps_id_seq', 12, true);


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
-- Name: question_rules PK_b3eb6ce2d48107adc3aaac0f7c8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_rules
    ADD CONSTRAINT "PK_b3eb6ce2d48107adc3aaac0f7c8" PRIMARY KEY (id);


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
-- Name: parcours_rules PK_bff447d7e41209d7025bbf73f51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcours_rules
    ADD CONSTRAINT "PK_bff447d7e41209d7025bbf73f51" PRIMARY KEY (id);


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

