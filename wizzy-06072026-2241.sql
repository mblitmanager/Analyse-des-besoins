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
-- Name: email_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    slug character varying NOT NULL,
    name character varying NOT NULL,
    subject text NOT NULL,
    "htmlContent" text NOT NULL,
    description text,
    "availableVariables" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.email_templates OWNER TO postgres;

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
    "enableLowScoreWarning" boolean DEFAULT true NOT NULL,
    "enableP3ManualChoice" boolean DEFAULT false NOT NULL,
    "enableHighLevelAlert" boolean DEFAULT true NOT NULL,
    "maxLevelOrder" integer
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
    "isActive" boolean DEFAULT true NOT NULL,
    consigne text,
    "shortName" character varying
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
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: p3_filter_rule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.p3_filter_rule (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    "sourceCategory" character varying,
    "sourceSlugs" text,
    "maxLevelOrder" integer,
    "filterMode" character varying DEFAULT 'EXCLUDE'::character varying NOT NULL,
    "targetSlugs" text,
    "targetCategories" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "levelOperator" character varying(10) DEFAULT 'lte'::character varying NOT NULL
);


ALTER TABLE public.p3_filter_rule OWNER TO postgres;

--
-- Name: p3_override_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.p3_override_rules (
    id integer NOT NULL,
    formation character varying(100) NOT NULL,
    "formationId" integer,
    condition character varying(255) NOT NULL,
    formation1 character varying(255) NOT NULL,
    formation2 character varying(255),
    "order" double precision DEFAULT '0'::double precision NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    certification character varying(255),
    "explanationMessage" text,
    "parcoursTitle" character varying(255),
    "conditionP1" character varying(255),
    "conditionP2" character varying(255),
    "requireTest" boolean DEFAULT false NOT NULL,
    "forceChoice" boolean DEFAULT true NOT NULL,
    "isHiddenResult" boolean DEFAULT false NOT NULL,
    "hiddenResultType" character varying(50),
    "testFormations" json
);


ALTER TABLE public.p3_override_rules OWNER TO postgres;

--
-- Name: p3_override_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.p3_override_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.p3_override_rules_id_seq OWNER TO postgres;

--
-- Name: p3_override_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.p3_override_rules_id_seq OWNED BY public.p3_override_rules.id;


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
    "order" double precision DEFAULT '0'::double precision NOT NULL,
    certification character varying(255),
    "prerequisiteConditions" text,
    "prerequisiteLogic" character varying(10) DEFAULT 'OR'::character varying NOT NULL,
    "formationId" integer,
    "explanationMessage" text,
    "parcoursTitle" character varying(255),
    "selectionConditions" text,
    "selectionConditionLogic" character varying(10) DEFAULT 'AND'::character varying NOT NULL,
    "isHiddenResult" boolean DEFAULT false NOT NULL,
    "hiddenResultType" character varying(20)
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
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "formationId" integer
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
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand character varying,
    civilite character varying,
    nom character varying,
    prenom character varying,
    telephone character varying,
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
    "highLevelContinue" boolean DEFAULT false NOT NULL,
    "ignoreQuestionRules" boolean DEFAULT false NOT NULL,
    "isP3Mode" boolean DEFAULT false NOT NULL,
    "parcoursRuleHadPrereqCondition" boolean DEFAULT false NOT NULL,
    "parrainNom" character varying,
    "parrainPrenom" character varying,
    "parrainEmail" character varying,
    "parrainTelephone" character varying,
    "p3SkipQuiz" boolean DEFAULT false NOT NULL,
    "stopLevelOrder" integer,
    "parcoursNumber" integer DEFAULT 1 NOT NULL,
    "bureautiqueSuite" character varying,
    "explanationMessage" text,
    "parcoursTitle" character varying,
    "parcoursChoices" text
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
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: p3_override_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.p3_override_rules ALTER COLUMN id SET DEFAULT nextval('public.p3_override_rules_id_seq'::regclass);


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
128	M.	BOYÉ	Simon	06 84 44 76 36	simon.boye@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.554705
131	M.	DURAT	Maxence	06 60 92 33 15	maxence.durat@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.568652
132	Mme.	GAUVILLE	Ghislaine	06 23 19 37 31	ghislaine.gauville@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.572618
133	Mme.	GAILLARD	Nathalie	06 30 01 22 83	contact@numenat.fr	Commercials	t	2026-02-21 14:52:16.579852
106	M.	FLOREK	Alexandre	06 03 67 59 24	alexandre.florek@ns-conseil.com	Pole Relation Clients	t	2026-02-21 14:52:16.484028
140		THIBAUD	Françis	06 65 65 24 88	francis.thibaud@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.60189
129	Mme.	CUBAUD	Valérie	06 16 42 41 58	valerie.cubaud@aopia.fr	Commercials	t	2026-02-21 14:52:16.56078
130	Mr.	DELABI	Cédric	06 72 34 15 26	cedric.delabi@aopia.fr	Commercials	t	2026-02-21 14:52:16.565025
134	Mme.	GRUAUD	Sandrine	06 86 94 93 51	sandrine.gruaud@aopia.fr	Commercials	t	2026-02-21 14:52:16.585046
126	Mme.	BIRÉ	Aurélie	07 63 76 61 79	aurelie.bire@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.549259
127	Mme.	BLIN	Mélinda	06 63 87 30 03	melinda.blin@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.552087
135	Mme.	HÉRAULT	Véronique	06 34 12 22 92	veronique.herault@aopia.fr	Commercials	t	2026-02-21 14:52:16.587593
136	Mr.	HUARD	Christophe	06 12 97 64 58	christophe.huard@aopia.fr	Commercials	t	2026-02-21 14:52:16.590044
137	Mme.	JACQUART	Marie-Hélène	06 16 92 21 95	marie-helene.jacquart@aopia.fr	Commercials	t	2026-02-21 14:52:16.59236
138	Mr.	LANDAIS	Arnaud	06 19 65 88 10	arnaud.landais@aopia.fr	Commercials	t	2026-02-21 14:52:16.595215
139	Mme.	MINEAU	Isabelle	06 79 46 39 61	isabelle.mineau@aopia.fr	Commercials	t	2026-02-21 14:52:16.597792
141	Mme.	SALGUEIRO	Élisabeth	06 13 93 79 06	elisabeth.salgueiro@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.604529
143	Mme.	COLIN/THIBAULT	Sophie	06 27 35 53 37	sophie.colin@ns-conseil.com	Commercials	t	2026-02-21 14:52:16.614858
144	Mr.	HUBERT	Philippe	07 64 72 06 62	philippe.hubert@aopia.fr	Commercials	t	2026-02-21 14:52:16.620157
152	Mr.	PERROT	Francis		francis.perrot@ns-conseil.com	Conseiller en formation	t	2026-04-28 08:10:12.838924
153	Mr.	PHILIPPEAU	Olivier		olivier.philippeau@ns-conseil.com	Conseiller en formation	t	2026-04-28 08:11:00.439646
154	Mme.	PRESTAT	Stéphanie		stephanie.prestat@ns-conseil.com	Conseiller en formation	t	2026-04-28 08:11:36.988924
155	Mr.	TRUNFIO	Antonio		info@infotechservices.fr	Conseiller en formation	t	2026-04-28 08:12:37.010947
142	Mr.	VERGNE	Thierry	07 60 43 81 49	thierry.vergne@aopia.fr	Commercials	t	2026-02-21 14:52:16.612393
157	Mr.	Randria	Herizo	06	herizo.randrianiaina@mbl-service.Com	Conseiller en formation	t	2026-06-29 09:09:26.488658
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_templates (id, slug, name, subject, "htmlContent", description, "availableVariables", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: formations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.formations (id, slug, label, "isActive", category, icon, color, objectifs, prequis, "modaliteDuree", "dateEnregistrement", certificateur, programme, "prerequisQuestionsScope", "complementaryQuestionsScope", "availabilitiesQuestionsScope", "miseANiveauQuestionsScope", "enableLowScoreWarning", "enableP3ManualChoice", "enableHighLevelAlert", "maxLevelOrder") FROM stdin;
24	intelligence-artificielle-générative	Intelligence Artificielle Générative	f	IA	\N	#3B82F6	Maîtriser l'usage responsable de l'IA générative pour la création de contenus rédactionnels et visuels.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. 21h dont 12h accompagnement.	18/12/2024	Certification Interne / RS	Séquence 1 : Fondamentaux de l'IA. Séquence 2 : Prompt engineering. Séquence 3 : Création de textes et images. Séquence 4 : Éthique et limites de l'IA.	both	both	both	both	f	f	t	\N
57	microsoft-office	Mixte Microsoft Office (Word + Excel)	t	Bureautique Microsoft	school	#3B82F6							both	both	both	both	f	f	t	2
45	excel	Excel	t	Bureautique Microsoft	table_view	green-500	\N	\N	\N	\N	\N	\N	both	both	both	both	f	f	f	3
55	Excel-ia	Excel + IA	t	IA	school	#3B82F6	Maîtriser l'usage responsable de l'IA générative pour la création de contenus rédactionnels et visuels.					Séquence 1 : Fondamentaux de l'IA.\n Séquence 2 : Prompt engineering. \nSéquence 3 : Création de textes et images. \nSéquence 4 : Éthique et limites de l'IA.	both	both	both	both	f	f	f	4
15	pack-office-outlook	Outlook	t	Bureautique Microsoft	\N	#3B82F6	Gérer efficacement sa messagerie, son calendrier et ses tâches. Collaborer avec les outils Outlook.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h accompagnement.	18/12/2024	TOSA	Séquence 1 : Gestion des mails. Séquence 2 : Calendrier et rendez-vous. Séquence 3 : Gestion des contacts et des tâches.	both	both	both	both	f	f	t	2
43	outils-collaboratifs-google	Outils Collaboratifs Google	t	Internet	\N	#3B82F6	\N	\N	\N	\N	\N	\N	both	both	both	both	f	f	t	2
20	photoshop	Photoshop	t	Création	draw	#3B82F6	Retoucher des images et des photos avec expertise. Découvrir les outils d'IA générative de Photoshop.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h à 12h accompagnement.	18/12/2024	ICDL / TOSA	Séquence 1 : Retouche photo et calques. Séquence 2 : Sélections et masques. Séquence 3 : Filtres et effets. Séquence 4 : IA générative.	both	both	both	both	t	f	t	2
51	voltaire	Français	t	LANGUES	spellcheck	blue-600	\N	\N	\N	\N	\N	\N	both	both	both	both	f	f	t	2
54	ppt	PowerPoint	t	Bureautique Microsoft	slide	#3B82F6							both	both	both	both	f	f	t	2
4	google-docs	Google Docs	t	Bureautique Google	school	#3B82F6							both	global	both	both	f	f	t	2
21	sketchup	SketchUp	t	Création	square	#3B82F6	Concevoir des projets d'aménagement intérieur et extérieur en 3D. Modéliser des espaces et des objets.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h accompagnement.	18/12/2024	ICDL	Séquence 1 : Bases de la modélisation 3D. Séquence 2 : Matériaux et textures. Séquence 3 : Rendu et présentation.	both	both	both	both	t	f	t	2
44	word	Word	t	Bureautique Microsoft	description	blue-600	\N	\N	\N	\N	\N	\N	both	both	both	both	f	f	t	2
48	gimp	Gimp	t	Création	\N	#3B82F6	\N	\N	\N	\N	\N	\N	both	both	both	both	t	f	t	2
25	toeic	Anglais 	t	LANGUES	spellcheck	#3B82F6	\N	\N	\N	\N	\N	\N	both	both	both	both	f	t	t	3
56	word-ia	Word + IA	t	IA	school	#3B82F6	Maîtriser l'usage responsable de l'IA générative pour la création de contenus rédactionnels et visuels.					Séquence 1 : Fondamentaux de l'IA.\n Séquence 2 : Prompt engineering. \nSéquence 3 : Création de textes et images. \nSéquence 4 : Éthique et limites de l'IA.	both	both	both	both	f	f	t	3
22	wordpress	WordPress	t	Internet	search	#3B82F6	Créer et administrer un site internet sur-mesure. Gérer les thèmes, les extensions et le contenu.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 12h à 14h accompagnement.	18/12/2024	TOSA / ICDL	Séquence 1 : Installation et configuration. Séquence 2 : Création de pages et articles. Séquence 3 : Personnalisation avec thèmes et plugins. Séquence 4 : Sécurité et SEO.	both	both	both	both	t	f	t	2
10	google-slides	Google Slides	t	Bureautique Google	table	#3B82F6			Individuelle à votre rythme. Accès e-learning 1 an + 10h à 20h accompagnement.				both	both	both	both	f	f	t	2
5	google-sheets	Google Sheets	t	Bureautique Google	school	#3B82F6							both	both	both	both	f	f	t	2
23	digcomp	Digitales Compétences	t	Internet	\N	#3B82F6	Améliorer sa culture numérique globale. Maîtriser les outils informatiques et la sécurité en ligne.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 12h accompagnement.	18/12/2024	DigComp	Séquence 1 : Recherche d'information et veille. Séquence 2 : Communication et collaboration. Séquence 3 : Création de contenu numérique. Séquence 4 : Sécurité et protection des données.	both	both	both	both	f	f	t	2
19	illustrator	Illustrator	t	Création	\N	#3B82F6	Concevoir des illustrations et des logos vectoriels. Maîtriser les outils de dessin et de mise en page.	Formation ouverte à tous niveaux. Disposer du matériel informatique adapté. Accès internet.	Individuelle à votre rythme. Accès e-learning 1 an + 10h accompagnement.	18/12/2024	TOSA	Séquence 1 : Interface et outils de base.\nSéquence 2 : Dessin vectoriel et formes.\n Séquence 3 : Couleurs et dégradés.\n Séquence 4 : Exportation et impression.	both	both	both	both	t	f	t	2
\.


--
-- Data for Name: levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.levels (id, label, "order", "successThreshold", "recommendationLabel", "formationId", "isActive", consigne, "shortName") FROM stdin;
536	IA Générative 	0	3	\N	55	t	\N	\N
537	Initial	1	3	\N	55	t	\N	\N
538	Basique	2	4	\N	55	t	\N	\N
541	IA Générative 	0	3	\N	56	t	\N	\N
542	Initial	1	3	\N	56	t	\N	\N
543	Basique	2	4	\N	56	t	\N	\N
539	Avancé	4	4	\N	55	t	\N	\N
546	Opérationnel	3	4	\N	55	t	\N	\N
540	Expert	5	4	\N	55	t	\N	\N
544	Avancé	4	4	\N	56	t	\N	\N
547	Opérationnel	3	4	\N	56	t	\N	\N
545	Expert	5	4	\N	56	t	\N	\N
193	Initial	0	4	\N	22	t	\N	\N
194	Basique	1	4	\N	22	t	\N	\N
218	Operationnel	2	4	\N	22	t	\N	\N
548	Initial	0	3	\N	57	t	\N	\N
549	Basique	1	4	\N	57	t	\N	\N
554	Opérationnel	2	4	\N	57	t	\N	\N
552	Avancé	3	4	\N	57	t	\N	\N
553	Expert	4	4	\N	57	t	\N	\N
556	Professionnel	5	4	\N	57	t	\N	\N
304	Initial	0	3	Niveau Débutant - Formation Outils Collaboratifs Google recommandée	43	t	\N	\N
305	Basique	1	4	Niveau Basique - Formation Outils Collaboratifs Google recommandée	43	t	\N	\N
306	Opérationnel	2	4	Niveau Intermédiaire - Formation Outils Collaboratifs Google recommandée	43	t	\N	\N
307	Avancé	3	5	Niveau Avancé - Formation Outils Collaboratifs Google recommandée	43	t	\N	\N
308	Découverte	0	4	Niveau Découverte - Formation Français recommandée	51	t	\N	\N
309	Technique	1	4	Niveau Technique - Formation Français recommandée	51	t	Les phrases ci-dessous sont-elles correctes ou incorrectes : 	\N
310	Professionnel	2	4	Niveau Professionnel - Formation Français recommandée	51	t	Les phrases ci-dessous sont-elles correctes ou incorrectes : 	\N
311	Affaires	3	5	Niveau Affaires - Formation Français recommandée	51	t	Les phrases ci-dessous sont-elles correctes ou incorrectes : 	\N
202	Initial	0	3	\N	48	t	\N	\N
203	Basique	1	3	\N	48	t	\N	\N
212	Opérationnel	2	4	\N	48	t	\N	\N
213	Avancé	3	5	\N	48	t	\N	\N
1	Niveau A1	0	6	Parcours Débutant (A1)	25	t	\N	\N
2	Niveau A2	1	5	Parcours Elémentaire (A2)	25	t	\N	\N
3	Niveau B1	2	5	Parcours Intermédiaire (B1)	25	t	\N	\N
4	Niveau B2	3	5	Parcours Avancé (B2)	25	t	\N	\N
5	Niveau C1	4	5	Parcours Expert (C1)	25	t	\N	\N
57	Expert	4	5	Parcours Expert	23	t	\N	\N
201	Basique	1	5	\N	23	t	\N	\N
200	Initial	0	3	\N	23	t	\N	\N
208	Opérationnel	2	4	\N	23	t	\N	\N
209	Avancé	3	4	\N	23	t	\N	\N
187	Initial	0	3	\N	45	t	\N	\N
188	Basique	1	4	\N	45	t	\N	\N
210	Opérationnel	2	4	\N	45	t	\N	\N
211	Avancé	3	4	\N	45	t	\N	\N
178	Expert	4	4	Parcours Expert	45	t	\N	\N
292	Initial	0	3	Niveau Débutant - Formation Google Docs recommandée	4	t	\N	\N
293	Basique	1	4	Niveau Basique - Formation Google Docs recommandée	4	t	\N	\N
294	Opérationnel	2	4	Niveau Intermédiaire - Formation Google Docs recommandée	4	t	\N	\N
295	Avancé	3	5	Niveau Avancé - Formation Google Docs recommandée	4	t	\N	\N
296	Initial	0	3	Niveau Débutant - Formation Google Sheets recommandée	5	t	\N	\N
297	Basique	1	4	Niveau Basique - Formation Google Sheets recommandée	5	t	\N	\N
299	Avancé	3	5	Niveau Avancé - Formation Google Sheets recommandée	5	t	\N	\N
298	Opérationnel	2	4	Niveau Intermédiaire - Formation Google Sheets recommandée	5	t	\N	\N
300	Initial	0	3	Niveau Débutant - Formation Google Slides recommandée	10	t	\N	\N
301	Basique	1	4	Niveau Basique - Formation Google Slides recommandée	10	t	\N	\N
302	Opérationnel	2	4	Niveau Intermédiaire - Formation Google Slides recommandée	10	t	\N	\N
303	Avancé	3	5	Niveau Avancé - Formation Google Slides recommandée	10	t	\N	\N
383	Initial	0	4	\N	19	t	\N	\N
384	Basique	1	4	\N	19	t	\N	\N
385	Opérationnel	2	5	\N	19	t	\N	\N
493	Initial	0	3	\N	15	t	\N	\N
494	Basique	1	4	\N	15	t	\N	\N
495	Opérationnel	2	4	\N	15	t	\N	\N
496	Avancé	3	4	\N	15	t	\N	\N
497	Expert	4	5	\N	15	t	\N	\N
488	Initial	0	3	\N	20	t	\N	\N
489	Basique	1	4	\N	20	t	\N	\N
490	Opérationnel 	2	4	\N	20	t	\N	\N
492	Expert	4	5	\N	20	t	\N	\N
491	Avancé 	3	4	\N	20	t	\N	\N
529	Initial	0	3	\N	54	t	\N	\N
530	Basique	1	4	\N	54	t	\N	\N
531	Opérationnel	2	4	\N	54	t	\N	\N
532	Avancé	3	4	\N	54	t	\N	\N
534	Expert	4	4	\N	54	t	\N	\N
206	Basique	1	4	\N	21	t	\N	\N
205	Initial	0	3	\N	21	t	\N	\N
215	Avancé	3	5	\N	21	t	\N	\N
214	Opérationnel	2	4	\N	21	t	\N	\N
217	Avance	3	5	\N	44	t	\N	\N
191	Basique	1	4	\N	44	t	\N	\N
190	Initial	0	3	\N	44	t	\N	\N
216	Opérationnel	2	4	\N	44	t	\N	\N
535	Expert	4	4	\N	44	t	\N	\N
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	20260710000000	AddHighLevelToFormations20260710000000
2	20260710000001	AddLevelShortName20260710000001
\.


--
-- Data for Name: p3_filter_rule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.p3_filter_rule (id, name, "sourceCategory", "sourceSlugs", "maxLevelOrder", "filterMode", "targetSlugs", "targetCategories", "isActive", "order", "levelOperator") FROM stdin;
7e659404-f96d-4c44-affc-9bed884942c5	Powerpoint operationnel	\N	ppt	3	EXCLUDE	voltaire,toeic,ppt,microsoft-office		t	0	gte
81641602-2ada-4802-8957-fad622b230e3	Outlook	\N	pack-office-outlook	3	EXCLUDE	toeic,voltaire,pack-office-outlook,wordpress,microsoft-office,gimp,illustrator,photoshop,sketchup		t	0	lte
fbfd5bcf-cec0-4c57-9f81-b31befba3930	Google docs	\N	google-docs	\N	EXCLUDE	voltaire,toeic,google-docs,microsoft-office		t	0	lte
10e5a179-7cf9-4e05-976e-242b78787ccb	Google sheets	\N	google-sheets	\N	EXCLUDE	toeic,voltaire,google-sheets,microsoft-office		t	0	lte
cbd06a12-5145-4e87-850a-e44ef1e8f467	Google slides	\N	google-slides	\N	EXCLUDE	toeic,voltaire,google-slides,microsoft-office		t	0	lte
f3f72c6b-f173-44c0-89ac-9fbe27a2d42d	Photoshop	\N	photoshop	1	EXCLUDE	photoshop,toeic,voltaire,microsoft-office		t	0	gte
59f6988e-09b1-4c11-bf01-e63733454578	Sketchup	\N	sketchup	\N	EXCLUDE	sketchup,toeic,voltaire,microsoft-office		t	0	lte
5cb01e66-4744-4df7-a785-226ce081de2c	Word	\N	word	2	EXCLUDE	voltaire,toeic,microsoft-office		t	0	lte
052940c6-8793-449d-a581-dd6977f6804a	Wordpress	\N	wordpress	3	EXCLUDE	toeic,voltaire,wordpress,microsoft-office		t	0	lte
51278665-b619-4b0d-be80-c9abe4942d38	Parcours mixtes bureautiques	\N	microsoft-office	1	EXCLUDE	toeic,voltaire,microsoft-office		t	0	gte
167c0c00-d648-40d6-b872-6881fc941b86	Digital Compétences	\N	digcomp,microsoft-office	3	EXCLUDE	toeic,voltaire,digcomp		t	0	gte
f625fa10-f792-4f87-a0cc-c6acc631c925	IA Générative Excel	\N	word-ia	3	EXCLUDE	excel-ia,voltaire,toeic,wordpress,microsoft-office		t	0	lte
aa6d99a0-404c-48a0-9f8c-3288fad95a5d	Gimp	\N	gimp	\N	EXCLUDE	toeic,voltaire,microsoft-office		t	0	lte
ef09fcd0-7bcd-490c-b10a-f980d84b7395	IA Générative Word	\N	word-ia	3	EXCLUDE	toeic,voltaire,microsoft-office,wordpress,word-ia,gimp,illustrator,photoshop,sketchup		t	0	lte
6f73f981-c9a8-4986-a379-e3889ef0732f	Word operationnel	\N	word	3	EXCLUDE	word,voltaire,toeic,microsoft-office		t	0	gte
26e60375-0629-4cb5-bd9d-4f1aa7cfabe4	Excel	\N	excel	2	EXCLUDE	toeic,voltaire,microsoft-office,gimp,illustrator,photoshop,sketchup,wordpress		t	0	lte
7253d199-dab8-48b9-820e-4b0ad28c9448	Excel operationnel	\N	excel	3	EXCLUDE	toeic,voltaire,excel,microsoft-office		t	0	gte
2aefc3f9-7c59-4925-a10e-a5f6277620a3	Power point	\N	ppt	2	EXCLUDE	toeic,voltaire,microsoft-office,gimp,illustrator,photoshop,sketchup,wordpress		t	0	lte
20a3d358-fe4a-433f-9d74-82932c9baa8b	Français	\N	voltaire	2	EXCLUDE	voltaire,microsoft-office		t	0	gte
04db0cc9-96ae-42d5-bfc4-98e53b797558	Anglais	\N	toeic	4	EXCLUDE	toeic,microsoft-office		t	0	gte
c1345fe2-1246-4d2c-b6ab-94a9f18fd982	Illustrator	\N	illustrator	2	EXCLUDE	illustrator,toeic,voltaire,microsoft-office		t	0	gte
d3558176-f860-4699-8f9e-957671960cf1	Google Workspace	\N	outils-collaboratifs-google	\N	EXCLUDE	toeic,voltaire,outils-collaboratifs-google,microsoft-office		t	0	lte
\.


--
-- Data for Name: p3_override_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.p3_override_rules (id, formation, "formationId", condition, formation1, formation2, "order", "isActive", certification, "explanationMessage", "parcoursTitle", "conditionP1", "conditionP2", "requireTest", "forceChoice", "isHiddenResult", "hiddenResultType", "testFormations") FROM stdin;
276	Excel	45	Si résultat du test ≤ Basique	OUTLOOK Basique (TOSA)		3	t	\N	EXCEL Basique (TOSA) + EXCEL Opérationnel (ICDL) -> OUTLOOK Basique (TOSA)	Renforcement Excel - P3	EXCEL Basique (TOSA)	EXCEL Opérationnel (ICDL)	f	t	f	\N	\N
277	Excel	45	Si résultat du test EXCEL = Opérationnel	WORD Basique (TOSA)		4	t	\N	EXCEL Opérationnel (ICDL) + EXCEL Expert (TOSA) -> WORD Basique (TOSA)	Expertise Excel - P3	EXCEL Opérationnel (ICDL)	EXCEL Expert (TOSA)	f	t	f	\N	\N
278	Excel	45	Si résultat du test EXCEL = Opérationnel	PPT Basique (TOSA)		5	t	\N	EXCEL Opérationnel (ICDL) + EXCEL Expert (TOSA) -> PPT Basique (TOSA)	Expertise Excel - P3	EXCEL Opérationnel (ICDL)	EXCEL Expert (TOSA)	f	t	f	\N	\N
279	Excel	45	Si résultat du test EXCEL = Opérationnel	OUTLOOK Opérationnel (ICDL)		6	t	\N	EXCEL Opérationnel (ICDL) + EXCEL Expert (TOSA) -> OUTLOOK Opérationnel (ICDL)	Expertise Excel - P3	EXCEL Opérationnel (ICDL)	EXCEL Expert (TOSA)	f	t	f	\N	\N
285	PowerPoint	54	≤ Basique	PowerPoint Opérationnel (ICDL)		2	t	\N		Essentiels Digitales Compétences & PPT - P3	Digitales Compétences Basique (TOSA)	PowerPoint Basique (TOSA)	f	t	f	\N	\N
273	Word	44	= Basique	Outlook Basique (TOSA)		3	t	\N		Renforcement Word - P3	Word Basique (TOSA)	Word Opérationnel (ICDL)	t	t	f	\N	\N
272	Word	44	Si résultat du test = Basique	PPT Basique (TOSA)		2	f	\N	WORD Basique (TOSA) + WORD Opérationnel (ICDL) -> PPT Basique (TOSA)	Renforcement Word - P3	WORD Basique (TOSA)	WORD Opérationnel (ICDL)	f	t	f	\N	\N
264	Digitales Compétences	23	≤ Basique	WORD Basique (TOSA)		15	t	\N	Digitales Compétences Basique (TOSA) + OUTLOOK Basique (TOSA) -> WORD Basique (TOSA)	Renforcement Digital Compétence - P3	Digitales Compétences Basique (TOSA)	OUTLOOK Basique (TOSA)	t	t	f	\N	\N
280	Gimp	48		IA GENERATIVE (INKREA)		1	t	\N		Création graphique + IA - P3	Gimp Opérationnel (ICDL)	Illustrator Opérationnel (TOSA)	t	t	f	\N	["Excel + IA","Word + IA"]
263	Digitales Compétences	23	≤ Basique	PPT Basique (TOSA)		14	t	\N	Digitales Compétences Basique (TOSA) + OUTLOOK Basique (TOSA) -> PPT Basique (TOSA)	Renforcement Digital Compétence - P3	Digitales Compétences Basique (TOSA)	OUTLOOK Basique (TOSA)	f	t	f	\N	\N
271	Word	44	≤ Expert	Excel Basique (TOSA)	PowerPoint Basique (TOSA)	1	t	\N		Renforcement Word - P3	Word Basique (TOSA)	Word Opérationnel (ICDL)	t	t	f	\N	\N
281	Gimp	48	≤ Basique	SketchUp Opérationnel (ICDL)		2	t	\N		Création visuels 3D - P3	Gimp Opérationnel (ICDL)	Illustrator Opérationnel (TOSA)	t	t	t	too_advanced	[]
282	Gimp	48	≤ Basique	Photoshop Basique (TOSA)		3	t	\N		Renforcement Photoshop - P3	Gimp Opérationnel (ICDL)	Illustrator Opérationnel (TOSA)	t	t	f	\N	[]
284	PowerPoint	54	≤ Basique	Word Basique (TOSA)	Excel Basique (TOSA)	1	t	\N		Renforcement Powerpoint - P3	PowerPoint Basique (TOSA)	PowerPoint Opérationnel (ICDL)	t	t	f	\N	\N
286	PowerPoint	54	≤ Basique	Outlook Basique (TOSA)		3	t	\N		Renforcement Powerpoint - P3	PowerPoint Basique (TOSA)	PowerPoint Opérationnel (ICDL)	t	t	f	\N	\N
283	Français	51		Français Affaires (VOLTAIRE)		1	f	\N		Renforcement Français - P3	Français Technique (VOLTAIRE)	Français Professionnel (VOLTAIRE)	f	t	f	\N	[]
274	Excel	45		WORD Basique (TOSA)		1	t	\N		Renforcement Excel - P3	Excel Basique (TOSA)	Excel Opérationnel (ICDL)	t	t	f	\N	[]
287	Mixte Microsoft Office (Word + Excel)	57		PowerPoint Basique (TOSA)	Outlook Basique (TOSA)	1	t	\N		Essentiels Bureautique - P3	Word Basique (TOSA)	Excel Basique (TOSA)	t	t	f	\N	[]
275	Excel	45		PowerPoint Basique (TOSA)	Outlook Basique (TOSA)	2	t	\N		Renforcement Excel - P3	Excel Basique (TOSA)	Excel Opérationnel (ICDL)	t	t	f	\N	[]
268	Anglais	25		Niveau B2 - TOEIC		1	t	\N		"Renforcement Anglais" (A2 & B1) - TOEIC - P3	Niveau A2 - TOEIC	Niveau B1 - TOEIC	f	t	f	\N	[]
257	Digitales Compétences	23	Si résultat du test ≤ Basique	EXCEL Opérationnel (ICDL)		8	t	\N	Digitales Compétences Basique (TOSA) + EXCEL Basique (TOSA) -> EXCEL Opérationnel (ICDL)	Essentiels Digitales Compétences & Excel - P3	Digitales Compétences Basique (TOSA)	EXCEL Basique (TOSA)	f	t	f	\N	\N
260	Digitales Compétences	23	≤ Basique	OUTLOOK Basique (TOSA)		11	t	\N	Digitales Compétences Basique (TOSA) + PPT Basique (TOSA) -> OUTLOOK Basique (TOSA)	Essentiels Digitales Compétences & PPT - P3	Digitales Compétences Basique (TOSA)	PowerPoint Basique (TOSA)	t	t	f	\N	\N
289	Mixte Microsoft Office (Word + Excel)	57		EXCEL Expert (TOSA)	Excel Expert (TOSA)	3	t	\N		Perfectionnement Bureautique - P3	Word Opérationnel (ICDL)	Excel Opérationnel (ICDL)	f	t	f	\N	[]
242	Photoshop	20		IA GENERATIVE (INKREA)		1	t	\N		Renforcement Photoshop - P3	Photoshop Basique (TOSA)	Photoshop Opérationnel  (ICDL)	t	t	f	\N	["Excel + IA","Word + IA"]
252	Digitales Compétences	23		OUTLOOK Basique (TOSA)		3	t	\N		Essentiels Digitales Compétences & Word - P3	Digitales Compétences Basique (TOSA)	Word Basique (TOSA)	t	t	f	\N	[]
241	Illustrator	19		IA GENERATIVE (INKREA)		1	t	\N		Renforcement Illustrator - P3	Illustrator Basique (TOSA)	Illustrator Opérationnel (ICDL)	t	t	f	\N	["Word + IA","Excel + IA"]
255	Digitales Compétences	23	≤ Basique	PPT Basique (TOSA)		6	t	\N	Digitales Compétences Basique (TOSA) + EXCEL Basique (TOSA) -> PPT Basique (TOSA)	Essentiels Digitales Compétences & Excel - P3	Digitales Compétences Basique (TOSA)	EXCEL Basique (TOSA)	t	t	f	\N	\N
256	Digitales Compétences	23	≤ Basique	OUTLOOK Basique (TOSA)		7	t	\N	Digitales Compétences Basique (TOSA) + EXCEL Basique (TOSA) -> OUTLOOK Basique (TOSA)	Essentiels Digitales Compétences & Excel - P3	Digitales Compétences Basique (TOSA)	EXCEL Basique (TOSA)	t	t	f	\N	\N
258	Digitales Compétences	23	<= Basique	EXCEL Basique (TOSA)		9	t	\N	Digitales Compétences Basique (TOSA) + PPT Basique (TOSA) -> EXCEL Basique (TOSA)	Essentiels Digitales Compétences & PPT - P3	Digitales Compétences Basique (TOSA)	PowerPoint Basique (TOSA)	t	t	f	\N	\N
259	Digitales Compétences	23	≤ Basique	WORD Basique (TOSA)		10	t	\N	Digitales Compétences Basique (TOSA) + PPT Basique (TOSA) -> WORD Basique (TOSA)	Essentiels Digitales Compétences & PPT - P3	Digitales Compétences Basique (TOSA)	PowerPoint Basique (TOSA)	t	t	f	\N	\N
253	Digitales Compétences	23	≤ Basique	WORD Opérationnel (ICDL)		4	t	\N	Digitales Compétences Basique (TOSA) + WORD Basique (TOSA) -> WORD Opérationnel (ICDL)	Essentiels Digitales Compétences & Word - P3	Digitales Compétences Basique (TOSA)	Word Basique (TOSA)	f	t	f	\N	\N
254	Digitales Compétences	23	≤ Basique	WORD Basique (TOSA)		5	t	\N	Digitales Compétences Basique (TOSA) + EXCEL Basique (TOSA) -> WORD Basique (TOSA)	Essentiels Digitales Compétences & Excel - P3	Digitales Compétences Basique (TOSA)	Excel Basique (TOSA)	t	t	f	\N	\N
246	SketchUp	21		ILLUSTRATOR Basique (TOSA)		2	t	\N		Création visuels : 3D/Images - P3	SketchUp Opérationnel (ICDL)	Gimp Opérationnel (ICDL)	t	t	f	\N	[]
243	Photoshop	20	Si résultat du test ≤ Basique	SKETCHUP Opérationnel (ICDL)		2	f	\N	PHOTOSHOP basique (TOSA) + PHOTOSHOP Opérationnel (ICDL) -> SKETCHUP Opérationnel (ICDL)	Renforcement Photoshop - P3	PHOTOSHOP Basique (TOSA)	PHOTOSHOP Opérationnel (ICDL)	f	t	f	\N	\N
245	SketchUp	21	≤ Avancé	IA GENERATIVE (INKREA)		1	t	\N		Création visuels : 3D/Images - P3	SketchUp Opérationnel (ICDL)	Gimp Opérationnel (ICDL)	t	t	t	too_advanced	["Excel + IA","Word + IA"]
247	WordPress	22		IA GENERATIVE (INKREA)		1	t	\N		Renforcement Wordpress - P3	WordPress Basique (TOSA)	WordPress Operationnel (ICDL)	t	t	f	\N	["Excel + IA","Word + IA",55,56]
248	WordPress	22		SKETCHUP Opérationnel (ICDL)		2	t	\N		Renforcement Wordpress - P3	WordPress Basique (TOSA)	WordPress Operationnel (ICDL)	t	t	f	\N	[]
249	WordPress	22		Photoshop Basique (TOSA)		3	t	\N		Renforcement Wordpress - P3	WordPress Basique (TOSA)	WordPress Operationnel (ICDL)	t	t	f	\N	[]
251	Digitales Compétences	23	≤ Basique	PowerPoint Basique (TOSA)		2	t	\N		Essentiels Digitales Compétences & Word - P3	Digitales Compétences Basique (TOSA)	Word Basique (TOSA)	t	t	t	too_advanced	[]
261	Digitales Compétences	23	Si résultat du test ≤ Basique	PPT Opérationnel (ICDL)		12	t	\N	Digitales Compétences Basique (TOSA) + PPT Basique (TOSA) -> PPT Opérationnel (ICDL)	Essentiels Digitales Compétences & PPT - P3	Digitales Compétences Basique (TOSA)	PPT Basique (TOSA)	f	t	f	\N	\N
262	Digitales Compétences	23	Si résultat du test ≤ Basique	EXCEL Basique (TOSA)		13	t	\N	Digitales Compétences Basique (TOSA) + OUTLOOK Basique (TOSA) -> EXCEL Basique (TOSA)	Renforcement Digital Compétence - P3	Digitales Compétences Basique (TOSA)	OUTLOOK Basique (TOSA)	f	t	f	\N	\N
238	Google Docs	4		IA GENERATIVE (INKREA)		1	t	\N		Bureautique Google (DOCS) - P3	Google Docs Opérationnel (ICDL)	Google Slides Opérationnel (ICDL)	t	t	f	\N	["Excel + IA","Word + IA"]
239	Google Sheets	5		Google Slides Opérationnel (ICDL)		1	t	\N		Bureautique Google (SHEETS) - P3	Google Sheets Opérationnel (ICDL)	Google Docs Opérationnel (ICDL)	t	t	f	\N	[]
240	Google Slides	10		IA GENERATIVE (INKREA)		1	t	\N		Bureautique Google (SLIDES) - P3	Google Slides Opérationnel (ICDL)	Google Docs Opérationnel (ICDL)	t	t	f	\N	["Excel + IA","Word + IA"]
265	Digitales Compétences	23	= Opérationnel	Google Sheets Opérationnel (ICDL)		16	t	\N	Digitales Compétences Opérationnel (TOSA) + OUTILS COLLABORATIFS (ICDL) -> GOOGLE SHEETS Opérationnel (ICDL)	Perfectionnement Digitales Compétences & Outils Coll. - P3	Digitales Compétences Opérationnel (TOSA)	Outils Collaboratifs Opérationnel (ICDL)	t	t	f	\N	\N
269	Anglais	25		Excel Basique (TOSA)	Excel Opérationnel (ICDL)	2	t	\N			Niveau B2 - TOEIC	Niveau C1 - TOEIC	t	t	f	\N	[]
250	Digitales Compétences	23		EXCEL Basique (TOSA)		1	t	\N		Essentiels Digitales Compétences & Word - P3	Digitales Compétences Basique (TOSA)	Word Basique (TOSA)	t	t	f	\N	[]
244	Photoshop	20		Illustrator Basique (TOSA)	SketchUp (ICDL)	3	t	\N		Renforcement Photoshop - P3	Photoshop Basique (TOSA)	Photoshop Opérationnel  (ICDL)	t	t	f	\N	[]
300	Outlook	15		PowerPoint Basique (TOSA)		1	t			Essentiels Digitales Compétences & Outlook - P3	Outlook Basique (TOSA)	Digitales Compétences Basique (TOSA)	t	t	f	\N	\N
266	Digitales Compétences	23	= Opérationnel	Google Docs Opérationnel (ICDL)		17	t	\N	Digitales Compétences Opérationnel (TOSA) + OUTILS COLLABORATIFS (ICDL) -> GOOGLE DOCS Opérationnel (ICDL)	Perfectionnement Digitales Compétences & Outils Coll. - P3	Digitales Compétences Opérationnel (TOSA)	Outils Collaboratifs Opérationnel (ICDL)	t	t	f	\N	\N
267	Digitales Compétences	23	= Opérationnel	Google Slides Opérationnel (ICDL)		18	t	\N	Digitales Compétences Opérationnel (TOSA) + OUTILS COLLABORATIFS (ICDL) -> GOOGLE SLIDES Opérationnel (ICDL)	Perfectionnement Digitales Compétences & Outils Coll. - P3	Digitales Compétences Opérationnel (TOSA)	Outils Collaboratifs Opérationnel (ICDL)	t	t	f	\N	\N
307	Google Sheets	5		Google Slides Opérationnel (ICDL)		3	t	\N		Bureautique Google (SHEETS) - P3 	Google Sheets Opérationnel (ICDL)	Google Docs Opérationnel (ICDL)	t	t	f	\N	[]
290	Word + IA	56		PowerPoint Basique (TOSA)	Excel Basique (TOSA)	0	t			IA Générative & Word - P3	IA GENERATIVE (INKREA)	Word (TOSA)	t	t	f	\N	\N
291	Word + IA	56		Word Opérationnel (ICDL)		1	t			IA Générative & Word - P3	IA GENERATIVE (INKREA)	Word (TOSA)	f	t	f	\N	\N
306	Google Sheets	5		IA GENERATIVE (INKREA)		2	t	\N		Bureautique Google (SHEETS) - P3 	Google Sheets Opérationnel (ICDL)	Google Docs Opérationnel (ICDL)	t	t	f	\N	["Excel + IA","Word + IA"]
294	Word	44		PowerPoint Basique (TOSA)	Outlook Basique (TOSA)	3	t			Essentiels Bureautique - P3	Word Basique (TOSA)	Excel Basique (TOSA)	t	t	f	\N	\N
293	Word	44	≤ Initial	Word Opérationnel (ICDL)		2	t			Essentiels Digitales Compétences & Word - P3	Digitales Compétences Basique (TOSA)	Word Basique (TOSA)	f	t	f	\N	\N
295	Word	44		Excel Basique (TOSA)	PowerPoint Basique (TOSA)	4	t			Essentiels Digitales Compétences & WORD - P3	Digitales Compétences Basique (TOSA)	Word Basique (TOSA)	t	t	f	\N	\N
296	Word	44		Outlook Basique (TOSA)		5	t			Essentiels Digitales Compétences & WORD - P3	Digitales Compétences Basique (TOSA)	Word Basique (TOSA)	t	t	f	\N	\N
292	Word + IA	56		Digitales Compétences Opérationnel (TOSA)	Outlook Basique (TOSA)	2	t			IA Générative & Word - P3	IA GENERATIVE (INKREA)	Word (TOSA)	t	t	f	\N	\N
297	PowerPoint	54		Outlook Basique (TOSA)		3	t			Essentiels Digitales Compétences & PPT - P3	Digitales Compétences Basique (TOSA)	Photoshop Basique (TOSA)	t	t	f	\N	\N
298	PowerPoint	54		Word Basique (TOSA)	Excel Basique (TOSA)	4	t			Essentiels Digitales Compétences & PPT - P3	Digitales Compétences Basique (TOSA)	PowerPoint Basique (TOSA)	t	t	f	\N	\N
299	Outlook	15		Word Basique (TOSA)	Excel Basique (TOSA)	0	t			Essentiels Digitales Compétences & Outlook - P3	Outlook Basique (TOSA)	Digitales Compétences Basique (TOSA)	t	t	f	\N	\N
303	Google Docs	4		IA GENERATIVE (INKREA)		1	t	\N		Bureautique Google (DOCS) - P3	Google Docs Opérationnel (ICDL)	Google Sheets Opérationnel (ICDL)	t	t	f	\N	["Excel + IA","Word + IA"]
304	Google Docs	4		Google Slides Opérationnel (ICDL)		2	t	\N		Bureautique Google (DOCS) - P3	Google Docs Opérationnel (ICDL)	Google Sheets Opérationnel (ICDL)	t	t	f	\N	[]
305	Google Docs	4		Google Sheets Opérationnel (ICDL)		3	t	\N		Bureautique Google (DOCS) - P3 	Google Docs Opérationnel (ICDL)	Google Slides Opérationnel (ICDL)	t	t	f	\N	[]
302	Google Sheets	5		IA GENERATIVE (INKREA)		1	t	\N		Bureautique Google (SHEETS) - P3 	Google Sheets Opérationnel (ICDL)	Google Slides Opérationnel (ICDL)	t	t	f	\N	["Excel + IA","Word + IA"]
301	Google Slides	10		Google Docs Opérationnel (TOSA)		1	t			Bureautique Google (SLIDES) - P3	Google Slides Opérationnel (ICDL)	Google Sheets Opérationnel (ICDL)	t	t	f	\N	[]
270	Outils Collaboratifs Google	43		IA GENERATIVE (INKREA)		1	t	\N		Google Workspace - P3	Outils Collaboratifs Google Opérationnel (ICDL)	Google Docs Opérationnel (ICDL)	t	t	f	\N	["Excel + IA","Word + IA"]
308	Google Slides	10		IA Générative (INKREA)		2	t			Bureautique Google (SLIDES) - P3	Google Slides Opérationnel (ICDL)	Google Sheets Opérationnel (ICDL)	t	t	f	\N	["Excel + IA","Word + IA"]
309	Google Slides	10		Google Docs Opérationnel (TOSA)		3	t			Bureautique Google (SLIDES) - P3 	Google Slides Opérationnel (ICDL)	Google Sheets Opérationnel (ICDL)	t	t	f	\N	[]
313	Outils Collaboratifs Google	43		Google Docs Opérationnel (ICDL)	Google Sheets Opérationnel (ICDL)	4	t	\N		Google Workspace - P3  	Outils Collaboratifs Google Opérationnel (ICDL)	Digitales Compétences Opérationnel (TOSA)	t	t	f	\N	[]
310	Outils Collaboratifs Google	43		IA GENERATIVE (INKREA)		1	t	\N		Google Workspace - P3 	Outils Collaboratifs Google Opérationnel (ICDL)	Digitales Compétences Opérationnel (TOSA)	t	t	f	\N	["Excel + IA","Word + IA"]
311	Outils Collaboratifs Google	43		IA GENERATIVE (INKREA)		2	t	\N		Google Workspace - P3 	Outils Collaboratifs Google Opérationnel (ICDL)	Google Sheets Opérationnel (ICDL)	t	t	f	\N	["Excel + IA","Word + IA"]
312	Outils Collaboratifs Google	43		IA GENERATIVE (INKREA)		3	t	\N		Google Workspace - P3  	Outils Collaboratifs Google Opérationnel (ICDL)	Google Slides Opérationnel (ICDL)	t	t	f	\N	["Excel + IA","Word + IA"]
314	Outils Collaboratifs Google	43		Google Docs Opérationnel (ICDL)	Google Sheets Opérationnel (ICDL)	5	f	\N		Google Workspace - P3   (copie)	Outils Collaboratifs Google Opérationnel (ICDL)	Digitales Compétences Opérationnel (TOSA)	t	t	f	\N	[]
315	Outils Collaboratifs Google	43		Digitales Compétences Opérationnel (TOSA)		6	t	\N		Google Workspace - P3   	Outils Collaboratifs Google Opérationnel (ICDL)	IA GENERATIVE (INKREA)	t	t	f	\N	[]
316	Français	51		NIVEAU A2 - TOEIC		1	f				Français Professionnel (VOLTAIRE)	Français Affaires (VOLTAIRE)	t	t	f	\N	["Anglais "]
317	Excel	45		Word Basique (TOSA)	PowerPoint Basique (TOSA)	6	t			Essentiels Digitales Compétences & Excel - P3	Digitales Compétences Basique (TOSA)	Excel Basique (TOSA)	t	t	f	\N	[]
318	Excel	45		Outils Collaboratifs Google Basique (TOSA)		7	t			Essentiels Digitales Compétences & Excel - P3	Digitales Compétences Basique (TOSA)	Excel Basique (TOSA)	t	t	f	\N	[]
319	Excel	45		Excel Opérationnel (ICDL)		8	t	Essentiels Digitales Compétences & Excel - P3			Digitales Compétences Basique (TOSA)	Excel Basique (TOSA)	f	t	f	\N	[]
320	Anglais 	25		Niveau C1 - TOEIC		2	t				Niveau B1 - TOEIC	Niveau B2 - TOEIC	f	t	f	\N	[]
\.


--
-- Data for Name: parcours_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parcours_rules (id, formation, condition, formation1, formation2, "isActive", "requirePrerequisiteFailure", "order", certification, "prerequisiteConditions", "prerequisiteLogic", "formationId", "explanationMessage", "parcoursTitle", "selectionConditions", "selectionConditionLogic", "isHiddenResult", "hiddenResultType") FROM stdin;
430	Excel + IA	Si résultat du test ≤ Opérationnel	IA GENERATIVE (INKREA)	Excel Opérationnel (TOSA)	t	f	0		[]	OR	55		IA Générative 	[]	AND	f	\N
417	Français	Si résultat du test ≤ Technique	Français Technique (VOLTAIRE)	Français Professionnel (VOLTAIRE)	t	f	1		[]	OR	51		Renforcement Français	[]	AND	f	\N
438	Digitales Compétences	Si résultat du test DIGCOMP <= Basique	Digitales Compétences Basique (TOSA)	Excel Basique (TOSA)	t	f	2		[]	OR	23		Essentiels Digitales Compétences & Excel	[]	AND	f	\N
436	Digitales Compétences	Si résultat du test DIGCOMP <= Basique	Digitales Compétences Basique (TOSA)	Outlook Opérationnel (TOSA)	t	f	4		[]	OR	23		Renforcement Digital Compétence + OUTLOOK	[]	AND	f	\N
398	Digitales Compétences	Si résultat du test DIGCOMP = Opérationnel	Digitales Compétences Opérationnel (TOSA)	Outils Collaboratifs Google Opérationnel (ICDL)	t	f	5		[]	OR	23		Perfectionnement Digital Compétence + OC	[]	AND	f	\N
418	Français	Si résultat du test FRANÇAIS = Professionnel	Français Professionnel (VOLTAIRE)	Français Affaires (VOLTAIRE)	t	f	2		[]	OR	51		Perfectionnement Français	[]	AND	f	\N
433	Mixte Microsoft Office (Word + Excel)	Si résultat du test ≤ Basique	Word Basique (TOSA)	Excel Basique (TOSA)	t	f	0		[]	OR	57		Essentiels Bureautique	[]	AND	f	\N
434	Mixte Microsoft Office (Word + Excel)	Si résultat du test = Opérationnel	Word Opérationnel (ICDL)	Excel Opérationnel (ICDL)	t	f	1		[]	OR	57		Perfectionnement Bureautique	[]	AND	f	\N
487	Outlook	Si résultat du test ≤ Initial	Outlook Basique (TOSA)	Digitales Compétences Opérationnel (TOSA)	t	f	1		[]	OR	15		Essentiels Digitales Compétences & Outlook	[]	AND	f	\N
432	Outlook	Si résultat du test = Basique	Outlook Basique (TOSA)	Outlook Opérationnel (ICDL)	t	f	2		[]	OR	15		Renforcement Outlook	[]	AND	f	\N
462	Gimp	Si résultat du test ≤ Basique	Gimp Opérationnel (ICDL)	Illustrator Opérationnel (TOSA)	t	f	1		[]	OR	48		Création Graphique	[]	AND	f	\N
400	Excel	Si résultat du test = Basique	Excel Basique (TOSA)	Excel Opérationnel (ICDL)	t	f	2		[]	OR	45		Renforcement EXCEL	[]	AND	f	\N
401	Excel	Si résultat du test = Opérationnel	Excel Opérationnel (ICDL)	Excel Expert (TOSA)	t	f	4		[]	OR	45		Expertise EXCEL	[]	AND	f	\N
412	Illustrator	Si résultat du test <= Basique	Illustrator Basique (TOSA)	Illustrator Opérationnel (ICDL)	t	f	1		[]	OR	19		Renforcement ILLUSTRATOR	[]	AND	f	\N
427	Anglais 	Si résultat du test ≤ Niveau A2	Niveau A2 - TOEIC	Niveau B1 - TOEIC	t	f	1		[]	OR	25		"Renforcement Anglais" (A2 & B1) - TOEIC	[]	AND	f	\N
429	Anglais 	Si résultat du test = Niveau B2	Niveau B2 - TOEIC	Niveau C1 - TOEIC	t	f	3		[]	OR	25		"Expertise Anglais"  : (B2 & C1) - TOEIC	[]	AND	f	\N
428	Anglais 	Si résultat du test = Niveau B1	Niveau B1 - TOEIC	Niveau B2 - TOEIC	t	f	2		[]	OR	25		"Perfectionnement Anglais" : (B1 & B2) - TOEIC	[]	AND	f	\N
485	Outils Collaboratifs Google	Si résultat du test <= Basique	Outils Collaboratifs Google Opérationnel (ICDL)	Digitales Compétences Opérationnel (TOSA)	t	f	4		[]	OR	\N		Google WORKSPACE (OC & Digitales Compétences)	[]	AND	f	\N
486	Outils Collaboratifs Google	Si résultat du test <= Basique	Outils Collaboratifs Google Opérationnel (ICDL)	IA GENERATIVE (INKREA)	t	f	5		[]	OR	\N		Google WORKSPACE (OC & IA Générative)	[]	AND	f	\N
439	Word	Si résultat du test = Basique	Word Basique (TOSA)	Excel Basique (TOSA)	t	f	3		[]	OR	44		Essentiels WORD & EXCEL	[]	AND	f	\N
443	Excel	Si résultat du test = Basique	Word Basique (TOSA)	Excel Basique (TOSA)	t	f	3		[]	OR	45		Essentiels WORD & EXCEL	[]	AND	f	\N
444	Excel	Si résultat du test = Opérationnel	Word Opérationnel (TOSA)	Excel Opérationnel (TOSA)	t	f	5		[]	OR	45		Perfectionnement WORD & EXCEL	[]	AND	f	\N
448	Outils Collaboratifs Google	Si résultat du test = Opérationnel	Digitales Compétences Opérationnel (TOSA)	Outils Collaboratifs Google Opérationnel (ICDL)	t	f	10		[]	OR	43		Perfectionnement Digital Compétence + OC	[]	AND	t	too_advanced
403	Outils Collaboratifs Google	Si résultat du test <= Basique	Outils Collaboratifs Google Opérationnel (ICDL)	Google Docs Opérationnel (ICDL)	t	f	1		[]	OR	43		Google WORKSPACE (OC & DOCS)	[]	AND	f	\N
435	Word	Si résultat du test <= Initial	Digitales Compétences Basique (TOSA)	Word Basique (TOSA)	t	f	1		[]	OR	44		Essentiels Digitales Compétences & WORD	[]	AND	f	\N
394	Digitales Compétences	Si résultat du test DIGCOMP <= Basique	Digitales Compétences Basique (TOSA)	Word Basique (TOSA)	t	f	1		[]	OR	23		Essentiels Digitales Compétences & Word	[]	AND	f	\N
437	Digitales Compétences	Si résultat du test DIGCOMP <= Basique	Digitales Compétences Basique (TOSA)	PowerPoint Basique (TOSA)	t	f	3		[]	OR	23		Essentiels Digital Compétence & PPT	[]	AND	f	\N
484	Word	Si résultat du test ≥ Opérationnel	WORD Opérationnel (TOSA)	EXCEL Opérationnel (TOSA)	t	f	6		[]	OR	\N		Perfectionnement WORD + EXCEL	[]	AND	t	too_advanced
442	Excel	Si résultat du test <= Initial	Digitales Compétences Basique (TOSA)	Excel Basique (TOSA)	t	f	1		[]	OR	45		Essentiels Digitales Compétences & EXCEL	[]	AND	f	\N
445	PowerPoint	Si résultat du test <= Initial	Digitales Compétences Basique (TOSA)	PowerPoint Basique (TOSA)	t	f	1		[]	OR	54		Essentiels Digitales Compétences & PPT	[]	AND	f	\N
402	PowerPoint	Si résultat du test = Basique	PowerPoint Basique (TOSA)	PowerPoint Opérationnel (ICDL)	t	f	2		[]	OR	54		Renforcement PPT	[]	AND	f	\N
409	Photoshop	Si résultat du test <= Basique	Photoshop Basique (TOSA)	Photoshop Opérationnel  (ICDL)	t	f	1		[]	OR	20		Renforcement PHOTOSHOP	[]	AND	f	\N
447	Outils Collaboratifs Google	Si résultat du test <= Basique	Outils Collaboratifs Google Opérationnel (ICDL)	Google Slides Opérationnel (ICDL)	t	f	3		[]	OR	43		Google WORKSPACE (OC & SLIDES)	[]	AND	f	\N
468	SketchUp	Si résultat du test ≤ Basique	SketchUp Opérationnel (ICDL)	Gimp Opérationnel (ICDL)	t	f	1		[]	OR	21		Création visuels : 3D / Images	[]	AND	f	\N
446	Outils Collaboratifs Google	Si résultat du test <= Basique	Outils Collaboratifs Google Opérationnel (ICDL)	Google Sheets Opérationnel (ICDL)	t	f	2		[]	OR	43		Google WORKSPACE (OC & SHEETS)	[]	AND	f	\N
407	Google Docs	Si résultat du test <= Basique	Google Docs Opérationnel (ICDL)	Google Sheets Opérationnel (ICDL)	t	f	1		[]	OR	4		Google WORKSPACE (DOCS & SHEETS)	[]	AND	f	\N
451	Google Docs	Si résultat du test <= Basique	Google Docs Opérationnel (ICDL)	Google Slides Opérationnel (ICDL)	t	f	2		[]	OR	4		Google WORKSPACE (DOCS & SLIDES)	[]	AND	f	\N
483	Word	Si résultat du test ≥ Opérationnel	Word Basique (TOSA)	Word Opérationnel (ICDL)	t	f	5		[]	OR	44		Renforcement WORD	[]	AND	t	too_advanced
406	Google Sheets	Si résultat du test <= Basique	Google Sheets Opérationnel (ICDL)	Google Docs Opérationnel (ICDL)	t	f	1		[]	OR	5		Google WORKSPACE (SHEETS & DOCS)	[]	AND	f	\N
450	Google Sheets	Si résultat du test <= Basique	Google Sheets Opérationnel (ICDL)	Google Slides Opérationnel (ICDL)	t	f	2		[]	OR	5		Google WORKSPACE (SHEETS & SLIDES)	[]	AND	f	\N
408	Google Slides	Si résultat du test <= Basique	Google Slides Opérationnel (ICDL)	Google Docs Opérationnel (ICDL)	t	f	1		[]	OR	10		Google WORKSPACE (SLIDES & DOCS)	[]	AND	f	\N
449	Google Slides	Si résultat du test <= Basique	Google Slides Opérationnel (ICDL)	Google Sheets Opérationnel (ICDL)	t	f	2		[]	OR	10		Google WORKSPACE (SLIDES & SHEETS)	[]	AND	f	\N
413	WordPress	Si résultat du test <= Basique	WordPress Basique (TOSA)	WordPress Operationnel (ICDL)	t	f	1		[]	OR	22		Renforcement WORDPRESS	[]	AND	f	\N
458	WordPress	Si résultat du test = Opérationnel	WORDPRESS Basique (TOSA)	WORDPRESS Opérationnel (ICDL)	f	f	3	\N	\N	OR	\N	\N	Renforcement WORDPRESS	\N	AND	f	\N
431	Word + IA	Si résultat du test ≤ Basique	IA GENERATIVE (INKREA)	Word (TOSA)	t	f	0		[]	OR	56		IA Générative & Word	[]	AND	f	\N
399	Word	Si résultat du test = Basique	Word Basique (TOSA)	Word Opérationnel (ICDL)	t	f	2		[]	OR	44		Renforcement WORD	[]	AND	f	\N
\.


--
-- Data for Name: question_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_rules (id, workflow, formation, "questionId", operator, "expectedValue", "resultType", "resultMessage", "isActive", "order", "createdAt", "updatedAt", "formationId") FROM stdin;
627b2c89-2885-48b6-bb7d-6da818924df5	prerequis	\N	470	EQUALS	Jamais	CUSTOM_MESSAGE	Digitales Compétences Basique (TOSA) & Word Basique (TOSA) / Excel Basique (TOSA) / PowerPoint Basique (TOSA) 	t	0	2026-03-05 21:35:39.744439	2026-07-11 11:34:43.898278	\N
2c058caf-dddf-4d05-9c7c-1aa5c88ca7b8	prerequis	\N	477	EQUALS	Non	CUSTOM_MESSAGE	Digitales Compétences Basique (TOSA) & Word Basique (TOSA) / Excel Basique (TOSA) / PowerPoint Basique (TOSA) 	t	1	2026-03-05 21:35:39.76782	2026-07-11 11:36:59.732792	\N
173df79e-7351-406c-ad52-70e00709eba1	prerequis	\N	2109	EQUALS	Non	CUSTOM_MESSAGE	Digitales Compétences Basique (TOSA) & Word Basique (TOSA) / Excel Basique (TOSA) / PowerPoint Basique (TOSA) 	t	2	2026-03-05 21:35:39.775357	2026-07-11 11:37:03.821164	\N
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (id, text, options, "correctResponseIndex", "order", "isActive", type, "levelId", category, icon, metadata, "formationId", "responseType", "correctResponseIndexes", "showIfQuestionId", "showIfResponseIndexes", "showIfResponseValue", "showIfRules", "showIfOperator") FROM stdin;
1953	Je veux me connecter facilement aux services de l’état (Impôts…)	["Je peux me connecter sans m’identifier","J’utilise l’Identité Numérique La Poste","Je ne sais pas"]	1	2	t	positionnement	200	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1954	Je veux faire une visio sur mon ordinateur	["J’utilise Windows","J’utilise Teams","J’utilise Excel","Je ne sais pas"]	1	3	t	positionnement	200	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1955	Je cherche une information sur internet	["Je consulte plusieurs sites et compare les informations","Je regarde un seul site","Je ne sais pas trop comment vérifier","Je n’utilise pas Internet pour cela"]	0	1	t	positionnement	201	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
1957	Je dois rédiger un courrier important	["J’utilise le logiciel Excel","J’utilise le logiciel Word","Je vais sur internet","Je ne sais pas faire"]	1	3	t	positionnement	201	\N	\N	\N	23	qcm	\N	\N	\N	\N	\N	OR
15	We ___ tired, so we decided to go home.	["was","were","are","Je ne sais pas"]	1	7	t	positionnement	2		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
20	We ___ to the supermarket yesterday.	["go","went","are going","Je ne sais pas"]	1	12	t	positionnement	2		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
19	Mary is ___ her sister.	["as beautiful as","beautiful","more beautiful","Je ne sais pas"]	0	11	t	positionnement	2		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
18	He’s the ___ student in the class.	["more tall","taller","tallest","Je ne sais pas"]	2	10	t	positionnement	2		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
17	There isn’t ___ milk left in the fridge.	["many","much","a few","Je ne sais pas"]	1	9	t	positionnement	2		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
16	While I ___ TV, I heard a strange noise.	["am watching","were watching","was watching","Je ne sais pas"]	2	8	t	positionnement	2		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
21	I’ve known her ___ we were children.	["for","since","during","Je ne sais pas"]	1	13	t	positionnement	3		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
22	If I ___ more time, I would travel around the world.	["have","had","will have","Je ne sais pas"]	1	14	t	positionnement	3		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
23	The castle ___ in 1692.	["was built","is built","was building","Je ne sais pas"]	0	15	t	positionnement	3		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
24	She ___ here for five years.	["has worked","works","is working","Je ne sais pas"]	0	16	t	positionnement	3		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
25	He felt sick because he ___ too much chocolate.	["ate","has eaten","had eaten","Je ne sais pas"]	2	17	t	positionnement	3		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
26	I ___ more water recently and I feel better.	["have been drinking","had drunk","drank","Je ne sais pas"]	0	18	t	positionnement	3		quiz	\N	25	qcm	\N	\N	\N	\N	\N	OR
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
2585	Quel élément permet d’afficher la liste des emails reçus ?	["Le dossier Contacts","Le dossier Courrier ","Le dossier Notes","Je ne sais pas"]	1	3	t	positionnement	493		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
1958	Mon ordinateur est lent et il devient difficile de travailler, que dois-je faire?	["Je ferme un programme","Je redémarre l’ordinateur","Je demande de l’aide","Je ne sais pas"]	1	4	t	positionnement	201		quiz	\N	23	qcm	[]	\N	\N	\N	[]	OR
27	You ___ me about the problem earlier.	["should have told","should told","must tell","Je ne sais pas"]	0	19	t	positionnement	4		quiz	\N	25	qcm	[]	\N	\N	\N	[]	OR
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
2335	Par défaut, un document Google Docs est enregistré	["Sur le disque dur de l’ordinateur","Dans Google Drive en ligne","Sur une clé USB","Je ne sais pas"]	1	3	t	positionnement	292	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
1979	A quoi sert un filtre ?	["A **afficher** les valeurs correspondant au filtre","A **ordonner** les valeurs en fonction du filtre","A **trier** les valeurs","Je ne sais pas"]	0	2	t	positionnement	188	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
470	A quelle fréquence utilisez-vous un ordinateur ?	["Quotidiennement ","Occasionnellement","Jamais"]	0	3	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
1977	Je souhaite représenter mes données dans un graphique simple. Quel type de graphique est adapté ? 	["Graphique **Sparkline**","Graphique **Camembert (Secteur) **","**Graphique Combiné**","Je ne sais pas"]	1	3	t	positionnement	187		quiz	\N	45	qcm	[]	\N	\N	\N	[]	OR
1978	Quel caractère permet de figer une référence à une cellule ? 	["L'icône : **%**","L'icône : **£**","L'icône : **$**","Je ne sais pas"]	2	1	t	positionnement	188		quiz	\N	45	qcm	[]	\N	\N	\N	[]	OR
1980	Quelle fonction permet d’afficher un résultat en fonction d’une condition ? 	["**SOMME**()","**SI**()","**NB**()","Je ne sais pas"]	1	3	t	positionnement	188		quiz	\N	45	qcm	[]	\N	\N	\N	[]	OR
2586	Quelle action permet de créer un nouvel email ?	["Répondre","Nouveau message ","Transférer","Je ne sais pas"]	1	1	t	positionnement	494		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
1981	Je souhaite pouvoir visualiser continuellement ma 1ère ligne de tableau tout en descendant dans un tableau volumineux. Comment se nomme l’outil qui permet cela ?	["Figer les **volets **","Imprimer les **titres**","Mise en forme **conditionnelle**","Je ne sais pas"]	0	4	t	positionnement	188	\N	\N	\N	45	qcm	\N	\N	\N	\N	\N	OR
1998	À quoi sert principalement GIMP ?	["Gérer des fichiers","Créer des vidéos","Éditer des images ","Je ne sais pas"]	2	1	t	positionnement	202		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
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
2336	La fonction Zoom permet de	["Modifier la taille du texte à l’impression","Ajuster l’affichage du document à l’écran","Changer la police du document","Je ne sais pas"]	1	1	t	positionnement	293	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2338	Pour rechercher un mot précis dans Google Docs, vous utilisez	["Édition > Rechercher et remplacer","Outils > Rechercher et remplacer","Fichier > Rechercher et remplacer","Je ne sais pas"]	0	3	t	positionnement	293	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2339	Que permet l’alignement du texte “Justifié” ?	["Centrer le texte","Uniformiser l’alignement du texte entre les marges","Aligner le texte à gauche","Je ne sais pas"]	1	4	t	positionnement	293	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2006	Fusionner des calques permet de :	["Ajouter un filtre","Augmenter la résolution","Simplifier la composition ","Je ne sais pas"]	2	1	t	positionnement	212		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
2000	Enregistrer une image permet de :	["L’imprimer","La sauvegarder ","La supprimer","Je ne sais pas"]	1	3	t	positionnement	202		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
2028	Dans SketchUp, à quoi correspondent les 3 axes (rouge, vert, bleu) ?	["Aux directions X, Y, Z de l’espace 3D","Aux calques (tags)","Aux scènes","Aux matériaux du modèle","Je ne sais pas"]	0	2	t	positionnement	215		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2340	Vous souhaitez vérifier le nombre de mots d’un document avant de l’envoyer. Quelle fonctionnalité devez-vous utiliser ?	["Format > Paragraphe","Outils > Nombre de mots","Fichier > Imprimer","Je ne sais pas"]	1	5	t	positionnement	293		quiz	\N	4	qcm	[]	\N	\N	\N	\N	OR
2341	Quelle fonctionnalité permet d’appliquer rapidement la même mise en forme à plusieurs titres ?	["Copier > Coller","Utiliser les styles de titre (Titre 1, Titre 2…)","Changer la police manuellement","Je ne sais pas"]	1	1	t	positionnement	294		quiz	\N	4	qcm	[]	\N	\N	\N	\N	OR
2342	Après avoir inséré un tableau dans Google Docs, comment modifier la largeur d’une colonne ?	["Clic droit > Largeur de colonne","Je fais glisser la bordure de la colonne","J’augmente la taille du texte","Je ne sais pas"]	1	2	t	positionnement	294	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2343	Quelle fonctionnalité utiliser pour aligner du texte à une position très précise sur la ligne sans déplacer tout le paragraphe ?	["Des espaces","Une tabulation","Un retrait","Je ne sais pas"]	1	3	t	positionnement	294	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2004	Rogner une image signifie :	["Ajuster la luminosité","Ajouter un filtre","Recadrer l’image ","Je ne sais pas"]	2	4	t	positionnement	203		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
2345	Quelle fonctionnalité permet de séparer un document en plusieurs parties ayant des mises en page différentes ?	["Insérer un saut de ligne","Insérer un saut de section","Changer la police","Je ne sais pas"]	1	5	t	positionnement	294	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2347	Comment insérer un saut de page dans Google Docs ?	["Fichier > Nouvelle page","Insertion > Saut > Saut de page","Format > Page suivante","Je ne sais pas"]	1	2	t	positionnement	295	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2348	À quoi sert le publipostage ?	["Envoyer un document en pièce jointe","Créer plusieurs documents personnalisés pour différents destinataires","Corriger automatiquement les fautes d’orthographe","Je ne sais pas"]	1	3	t	positionnement	295	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2349	Quelle fonctionnalité permet de vérifier son document avant impression ?	["Fichier > Imprimer","Fichier > Configuration de la page","Outils > Préférence","Je ne sais pas"]	1	4	t	positionnement	295	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2350	Quel mode permet de proposer des modifications visibles par tous sans modifier directement le texte original ?	["Mode Lecture","Mode Impression","Mode Suggestion","Je ne sais pas"]	2	5	t	positionnement	295	\N	\N	\N	4	qcm	\N	\N	\N	\N	\N	OR
2352	Comment enregistrer les modifications dans un document Google Sheets ?	["Il faut passer par Fichier > Enregistrer","Il n’y a rien à faire, l’enregistrement est automatique","Il faut passer par Édition > Copier","Je ne sais pas"]	1	2	t	positionnement	296	\N	\N	\N	5	qcm	\N	\N	\N	\N	\N	OR
2353	Quelle est la référence correcte d’une cellule située colonne C, ligne 4 ?	["4C","C4","Ligne 4 Colonne C","Je ne sais pas"]	1	3	t	positionnement	296	\N	\N	\N	5	qcm	\N	\N	\N	\N	\N	OR
2390	Je souhaite organiser une réunion de travail et y inviter mes collaborateurs, quel outil utiliser ?	["Gmail","Google Agenda","Google Drive","Je ne sais pas"]	1	1	t	positionnement	305	\N	\N	\N	43	qcm	\N	\N	\N	\N	\N	OR
2355	À quoi sert la poignée de recopie dans Google Sheets ?	["À dupliquer une feuille","À copier ou incrémenter une valeur ou une formule","À fusionner des cellules","Je ne sais pas"]	1	2	t	positionnement	297	\N	\N	\N	5	qcm	\N	\N	\N	\N	\N	OR
2357	Quelle action permet de trier une colonne de données par ordre croissant ?	["Insertion > Trier","Données > Trier la plage","Format > Organiser","Je ne sais pas"]	1	4	t	positionnement	297	\N	\N	\N	5	qcm	\N	\N	\N	\N	\N	OR
2060	A quoi sert le logiciel Word ?	["A **créer** des **tableaux** avec des **formules** automatisées","A **écrire** un mail","A **rédiger** du contenu **traitement de texte**","Je ne sais pas"]	2	1	t	positionnement	190	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2014	À quoi sert principalement SketchUp ?	["Modélisation 3D","Retouche photo","Montage vidéo","Je ne sais pas"]	0	1	t	positionnement	205		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2015	Que permet l’outil “Sélection” ?	["Choisir un élément du modèle","Supprimer un fichier","Colorier un objet","Je ne sais pas"]	0	2	t	positionnement	205		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2020	Que permet l’outil “Mètre” ?	["Vérifier ou créer une côte","Créer un axe","Dessiner une ligne","Je ne sais pas"]	0	4	t	positionnement	206		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2010	Le mode colorimétrique RVB est destiné à :	["L’impression offset","L’animation","L’affichage écran","Je ne sais pas"]	2	1	t	positionnement	213		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
2007	Modifier la résolution agit sur :	["La couleur dominante","Le texte","La qualité d’impression ","Je ne sais pas"]	2	2	t	positionnement	212		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
2017	Pour enregistrer un fichier pour la première fois : Cliquer sur	["« Fichier » puis « enregistrer »","« Fichier » puis « enregistrer sous »","« Fichier » puis « enregistrer comme modèle type »","« Fichier » puis « exporter »","Je ne sais pas"]	1	1	t	positionnement	206		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2016	À quoi sert l’outil “Rectangle” ?	["Créer une caméra","Mesurer une distance","Dessiner une surface plane","Je ne sais pas"]	2	3	t	positionnement	205		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2022	À quoi sert principalement l’outil _Pousser/Tirer_ dans SketchUp ?**	["À dessiner des lignes","À mesurer des distances","À créer des volumes à partir de faces","Je ne sais pas"]	2	1	t	positionnement	214		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2023	Différence principale entre groupe et composant ?	["Le composant est lié à ses copies","Taille","Couleur","Je ne sais pas"]	0	2	t	positionnement	214		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2018	À quoi sert la molette de la souris ?	["Supprimer","Dessiner","Zoomer/dézoomer","Je ne sais pas"]	2	2	t	positionnement	206		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2062	Par où passe-t-on pour intégrer une photo depuis l’ordinateur ?	["**Dessin** > **Ajouter**","**Insertion** > **Images **","**Insertion** > **Objet**","Je ne sais pas"]	1	3	t	positionnement	190	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2063	Quel raccourci clavier permet d’enregistrer rapidement un document ?	["CTRL + **S **","CTRL + **E**","**F7**","Je ne sais pas"]	0	1	t	positionnement	191	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2064	Quelle méthode est la plus rapide pour mettre en forme un tableau ?	["Sélectionner les cellules puis **Accueil** > **Trame de fond**","Sélectionner les cellules puis **Accueil** > **Couleur de surlignage**","Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","Je ne sais pas"]	2	2	t	positionnement	191	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2065	Je souhaite aligner un mot à une position précise sur la ligne sans déplacer tout le paragraphe. Que dois-je utiliser ?	["Un **retrait**","Des **espaces**","Une **tabulation**","Je ne sais pas"]	2	3	t	positionnement	191	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2066	Comment insérer le logo de mon entreprise en en-tête de document ?	["**Se positionner** sur le **1er** paragraphe puis **Insérer** une image","**Double clic** dans la partie la plus **haute** de la page puis **Insérer** une image","**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","Je ne sais pas"]	1	4	t	positionnement	191	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2067	Quelle couleur de soulignement indique une faute de grammaire ?	["Bleu","Vert","Rouge","Je ne sais pas"]	0	5	t	positionnement	191	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
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
2370	Quel mode d’affichage permet de visualiser toutes les diapositives sous forme de miniatures ?	["Affichage > Grille","Affichage > Commenter","Affichage > Edition","Je ne sais pas"]	0	2	t	positionnement	300	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2371	Quelle action ne permet pas d’ajouter une nouvelle diapositive ?	["Diapositive > Nouvelle diapositive","Outils > Nouvelle diapositive","Insertion > Nouvelle diapositive","Je ne sais pas"]	1	3	t	positionnement	300	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2373	Quelle mise en forme est la plus adaptée pour présenter des points clés courts sur une diapositive ?	["Alignement centré","Liste à puces","Couleur du texte","Je ne sais pas"]	1	2	t	positionnement	301	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2376	Quelle action permet de conserver à la fois le contenu et la mise en page d’une diapositive existante lors de la création d’une nouvelle diapositive ?	["Nouvelle diapositive","Dupliquer la diapositive","Modifier le thème","Je ne sais pas"]	1	5	t	positionnement	301	\N	\N	\N	10	qcm	\N	\N	\N	\N	\N	OR
2071	Je veux intégrer un tableau créé dans Excel dans mon document Word et pouvoir le modifier dans Word, quelle méthode dois-je utiliser ?	["**Insertion** > **Tableau** > Feuille de calcul **Excel**","On **ne peut pas** insérer un **tableau** provenant **d’Excel** et le **modifier** dans **Word**","**Copier** le tableau dans **Excel** > **Coller** de manière **spéciale** dans **Word **","Je ne sais pas"]	2	4	t	positionnement	216	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
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
2391	Je reçois une invitation Google Agenda, quelle option n’est pas disponible dans les réponses proposées ?	["Oui","Provisoire","Non","Je ne sais pas"]	1	2	t	positionnement	305	\N	\N	\N	43	qcm	\N	\N	\N	\N	\N	OR
2175	Fréquence (professionnelle) :	["Régulier","Ponctuel"]	0	4	t	mise_a_niveau	\N	anglais	quiz	{"type":"qcm"}	25	qcm	[]	2173	[0]	\N	[{"questionId":2173,"responseIndexes":[0]}]	OR
2176	Utilisation personnelle de l'anglais ?	["Oui","Non"]	0	5	t	mise_a_niveau	\N	anglais	quiz	{"type":"radio_toggle"}	25	qcm	\N	\N	\N	\N	\N	OR
2172	Étude de l'anglais jusqu'à :	["Collège","Lycée","Bac + 2","Bac + 5"]	0	1	t	mise_a_niveau	\N	anglais	quiz	{"type":"qcm"}	25	qcm	\N	\N	\N	\N	\N	OR
2173	Utilisation professionnelle de l'anglais ?	["Oui","Non"]	0	2	t	mise_a_niveau	\N	anglais	quiz	{"type":"radio_toggle"}	25	qcm	\N	\N	\N	\N	\N	OR
2593	À quoi sert le champ CCI ?	["Envoyer une copie visible à tous","Envoyer une copie en préservant la confidentialité des adresses ","Supprimer un destinataire du message","Je ne sais pas"]	1	3	t	positionnement	495		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
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
2417	Se repérer dans l'environnement Windows (bureau, menu démarrer, fenêtres, icônes...)	["Acquis","Moyen","Insuffisant"]	-1	3	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2397	Un document Google Docs m’est partagé avec le rôle “Commentateur”. Quelle action n’est pas autorisée ?	["Modifier du texte","Ajouter un commentaire","Suggérer une modification","Je ne sais pas"]	0	3	t	positionnement	306		quiz	\N	43	qcm	[]	\N	\N	\N	\N	OR
2399	Quelle action permet de notifier automatiquement un collègue dans un commentaire Google Docs ?	["Ajouter son adresse e-mail dans le texte","Utiliser le symbole @ suivi de son nom","Insérer un émoji Bonjour","Je ne sais pas"]	1	5	t	positionnement	306		quiz	\N	43	qcm	[]	\N	\N	\N	\N	OR
2401	Quelles applications peuvent-être intégrées à Gmail ?	["Google Drive et Google Tasks","Google Docs et Google Agenda","Google Meet et Google Chat","Je ne sais pas"]	2	2	t	positionnement	307		quiz	\N	43	qcm	[]	\N	\N	\N	\N	OR
2402	Dans quelle application puis-je créer une liste de diffusion ?	["Google Drive","Google Contacts","Google Meet","Je ne sais pas"]	1	3	t	positionnement	307		quiz	\N	43	qcm	[]	\N	\N	\N	\N	OR
2404	Lors d’une réunion Google Meet, plusieurs informations importantes sont échangées dans le chat. Quelle précaution devez-vous prendre pour être sûr de pouvoir les conserver après la réunion ?	["Activer l’enregistrement automatique du chat","Copier le chat avant la fin de la réunion","Compter sur l’enregistrement automatique dans Google Drive","Je ne sais pas"]	1	5	t	positionnement	307		quiz	\N	43	qcm	[]	\N	\N	\N	\N	OR
2438	Les phrases ci-dessous sont-elles correctes ou incorrectes : « Les voisins du dessus ont déménagés. »	["Correcte","Incorrecte","Je ne sais pas"]	1	1	t	positionnement	310	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2443	Les phrases ci-dessous sont-elles correctes ou incorrectes : « Il faut savoir tirer partie des faux pas de la concurrence. »	["Correcte","Incorrecte","Je ne sais pas"]	1	1	t	positionnement	311	\N	\N	\N	51	qcm	\N	\N	\N	\N	\N	OR
2130	Utilisez-vous les logiciels suivants : 	["Traitement de texte type Word, Google Docs","Tableur feuille de calcul type Excel, Google Sheets","Logiciel de présentation type PowerPoint, Google Slides","Je n’utilise aucun de ces logiciels"]	0	1	f	prerequis	\N		quiz	\N	\N	checkbox	\N	\N	\N	\N	\N	OR
2077	Comment se nomme l’outil qui permet de manipuler (masquer, sélectionner, renommer, réorganiser) différents objets ?	["Volet de **navigation**","Sélectionner les **objets**","Volet **sélection **","Je ne sais pas"]	2	5	t	positionnement	217	\N	\N	\N	44	qcm	\N	\N	\N	\N	\N	OR
2131	Quel est l’objectif principal de votre formation 	["Découvrir l'outil par curiosité.","Créer un site vitrine pour présenter une activité.","Créer une boutique en ligne pour vendre des produits."]	0	2	f	prerequis	\N		quiz	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2419	Avez-vous déjà utilisé les logiciels suivants :	["Traitement de texte type Word, Google Docs","Tableur feuille de calcul type Excel, Google Sheets","Logiciel de présentation type Powerpoint, Google slides","Je n'utilise aucun de ces logiciels"]	-1	5	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2418	Savoir naviguer sur internet	["Acquis","Moyen","Insuffisant"]	-1	4	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2415	Fréquence d’utilisation d’un ordinateur	["Tous les jours","Occasionnelle","Jamais"]	-1	1	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2416	Savoir allumer un ordinateur, utiliser le clavier et la souris	["Acquis","Moyen","Insuffisant"]	-1	2	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
39	Quel est votre métier actuel ?	[]	0	1	f	complementary	\N	Profil professionnel	work	{"type":"textarea","rows":2,"placeholder":"Ex : Comptable, Vendeur, Secrétaire..."}	\N	qcm	[]	\N	\N	\N	[]	OR
2421	Sur votre ordinateur, savez-vous effectuer les manipulations suivantes ?	["Protéger votre ordinateur avec un antivirus","Mettre à jour votre système d’exploitation et vos logiciels","Changer vos mots de passe régulièrement","Aucun des trois"]	-1	8	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2420	Savoir créer un dossier et y ranger et renommer un fichier	["Acquis","Moyen","Insuffisant"]	-1	6	f	prerequis	\N	\N	\N	\N	\N	qcm	\N	\N	\N	\N	\N	OR
2448	Fréquence (Personnelle)	["Régulier","Ponctuel"]	0	7	t	mise_a_niveau	\N	anglais	quiz	\N	25	qcm	[]	2176	[0]	\N	[{"questionId":2176,"responseIndexes":[0]}]	OR
2337	Quel est le raccourci clavier qui permet de sélectionner tout le document ?	["Ctrl + P","Ctrl + U","Ctrl + A","Je ne sais pas"]	2	2	t	positionnement	293		quiz	\N	4	qcm	[]	\N	\N	\N	\N	OR
2344	Dans quel menu peut-on trouver la vérification orthographique et grammaticale dans Google Docs	["Outils > Grammaire et orthographe","Édition > Grammaire et orthographe","Fichier > Grammaire et orthographe","Je ne sais pas"]	0	4	t	positionnement	294		quiz	\N	4	qcm	[]	\N	\N	\N	\N	OR
2364	Quelle fonctionnalité permet de garder visibles les en-têtes lors du défilement d’un tableau ?	["Masquer les lignes","Figer les volets","Fusionner les cellules","Je ne sais pas"]	1	1	t	positionnement	299		quiz	\N	5	qcm	[]	\N	\N	\N	\N	OR
2517	Vous prenez des photos 	["Régulièrement ","Occasionnellement ","Jamais"]	0	1	t	mise_a_niveau	\N		quiz	\N	48	qcm	[]	\N	\N	\N	\N	OR
2437	« La réunion est prêt de se finir. »	["Correcte","Incorrecte","Je ne sais pas"]	1	5	t	positionnement	309		quiz	\N	51	qcm	[]	\N	\N	\N	[]	OR
2435	« De l’avis général, son discours était plus tôt ennuyeux. »	["Correcte","Incorrecte","Je ne sais pas"]	1	3	t	positionnement	309		quiz	\N	51	qcm	[]	\N	\N	\N	[]	OR
2436	« Il aurait fallu pour cela davantage de temps. »	["Correcte","Incorrecte","Je ne sais pas"]	0	4	t	positionnement	309		quiz	\N	51	qcm	[]	\N	\N	\N	[]	OR
2439	« La plupart des coiffeurs utilise nos produits. »	["Correcte","Incorrecte","Je ne sais pas"]	1	2	t	positionnement	310		quiz	\N	51	qcm	[]	\N	\N	\N	[]	OR
2440	« Est-ce bien toi qui va les chercher tout à l’heure ? »	["Correcte","Incorrecte","Je ne sais pas"]	1	3	t	positionnement	310		quiz	\N	51	qcm	[]	\N	\N	\N	[]	OR
2441	« Cette jeune entreprise a fait appel à un fonds d’investissement. »	["Correcte","Incorrecte","Je ne sais pas"]	0	4	t	positionnement	310		quiz	\N	51	qcm	[]	\N	\N	\N	[]	OR
2442	 « Quel est le chiffre d’affaire de cette agence ? »	["Correcte","Incorrecte","Je ne sais pas"]	1	5	t	positionnement	310		quiz	\N	51	qcm	[]	\N	\N	\N	[]	OR
2444	« J’irai jusqu’au bout, quelque soit les difficultés. »	["Correcte","Incorrecte","Je ne sais pas"]	1	2	t	positionnement	311		quiz	\N	51	qcm	[]	\N	\N	\N	[]	OR
2445	« Les arbres que nous avons vus abattre étaient malades. »	["Correcte","Incorrecte","Je ne sais pas"]	1	3	t	positionnement	311		quiz	\N	51	qcm	[]	\N	\N	\N	[]	OR
2446	« Nous vous serions gré de ne pas en parler pour le moment. »	["Correcte","Incorrecte","Je ne sais pas"]	1	4	t	positionnement	311		quiz	\N	51	qcm	[]	\N	\N	\N	[]	OR
2447	« Après que les lumières se soient éteintes, il quitta les lieux.»	["Correcte","Incorrecte","Je ne sais pas"]	1	5	t	positionnement	311		quiz	\N	51	qcm	[]	\N	\N	\N	[]	OR
2091	Dans quel répertoire sont situées les extensions (plugins) de WordPress ?	["wp-content/uploads","wp-include/wp-plugins","wp-content/plugins","Je ne sais pas"]	1	4	t	positionnement	218		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
2008	L’outil texte permet de :	["Rogner l’image","Ajouter du texte éditable ","Modifier un filtre","Je ne sais pas"]	1	3	t	positionnement	212		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
2009	Un filtre de flou sert à :	["Supprimer un calque","Réduire le poids du fichier","Adoucir une image ","Je ne sais pas"]	2	4	t	positionnement	212		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
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
2528	Comment ouvrir une image dans Photoshop ?	["Image > Couleur","Fichier > Ouvrir ","Édition > Importer","Je ne sais pas"]	1	1	t	positionnement	488		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
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
2635	Votre situation actuelle	["Salarié","Indépendant","Demandeur d’emploi","Reconversion"]	0	2	t	prerequis	\N		quiz	\N	\N	checkbox	[]	\N	\N	\N	[]	OR
2541	Quelle est la différence entre “Enregistrer pour le web” et “Exporter sous” ?	["“Enregistrer pour le web” est ancien et orienté optimisation web, “Exporter sous” est plus moderne et polyvalent ","Ils sont totalement identiques","“Exporter sous” ne permet pas de compresser","Je ne sais pas"]	0	10	t	positionnement	490		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2540	À quoi sert le masque de fusion dans un objet dynamique ?	["À supprimer définitivement une partie de l’image","À masquer ou révéler des zones sans modifier l’image d’origine ","À changer le format du fichier","Je ne sais pas"]	1	9	t	positionnement	490		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2542	Quelle est la différence entre un calque normal, un objet dynamique et un calque vectoriel ?	["Ils ont exactement la même fonction","Le calque normal contient des pixels, l’objet dynamique permet des modifications non destructives, le calque vectoriel est basé sur des formes redimensionnables sans perte ","Le calque vectoriel sert uniquement au texte","Je ne sais pas"]	1	1	t	positionnement	491		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2543	Comment appliquer un profil ICC à un document pour un rendu couleur précis ?	["Image > Rotation","Édition > Couleurs","Édition > Convertir en profil ","Je ne sais pas"]	2	2	t	positionnement	491		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2544	Comment transformer une sélection en objet dynamique masqué ?	["Supprimer la sélection","Convertir le calque en objet dynamique puis ajouter un masque de fusion ","Aplatir l’image","Je ne sais pas"]	1	3	t	positionnement	491		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2545	Comment appliquer un flou directionnel pour simuler le mouvement ?	["Filtre > Bruit","Filtre > Flou > Flou directionnel ","Image > Taille de l’image","Image > Taille de l’image"]	1	4	t	positionnement	491		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2546	Comment créer et appliquer une action Photoshop pour automatiser un flux de travail répétitif ?	["Fenêtre > Actions, enregistrer les étapes puis lancer l’action ","Fichier > Nouveau","Image > Mode","Je ne sais pas"]	0	5	t	positionnement	491		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2606	Quelle est votre niveau ?	["A2","B1","B2","C1"]	0	16	f	mise_a_niveau	\N	voltaire	quiz	\N	51	qcm	[]	2165	[1]	\N	[{"questionId":2165,"responseIndexes":[1],"responseValue":""}]	OR
2547	Quelle est la différence entre un objet dynamique intégré et un objet dynamique lié pour le travail collaboratif ?	["L’objet intégré reste dans le document et n’est pas lié à un fichier externe, l’objet lié référence un fichier externe pour pouvoir le mettre à jour facilement ","L’objet intégré est toujours vectoriel, l’objet lié est toujours pixelisé","Il n’y a aucune différence","Je ne sais pas"]	0	1	t	positionnement	492		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2548	Comment utiliser un calque d’écrêtage sur plusieurs calques pour contrôler un effet uniquement sur la zone visible ?	["Sélectionner le calque supérieur et faire Alt + clic entre les calques pour créer un écrêtage ","Fusionner tous les calques","Appliquer un filtre directement sur le calque inférieur","Je ne sais pas"]	0	2	t	positionnement	492		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2549	Comment utiliser la plage de profondeur pour créer des sélections précises dans une image avec effet bokeh ?	["Fichier > Nouveau","Sélection > Plage de profondeur pour isoler les zones nettes ou floues ","Image > Réglages > Luminosité/Contraste","Je ne sais pas"]	1	3	t	positionnement	492		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2168	Étiez-vous à l'aise en conjugaison (reconnaître les temps, les utiliser) ?	["Pas du tout","Un peu","Moyennement","Tout à fait"]	0	4	t	mise_a_niveau	\N	voltaire	quiz	{"type":"radio_toggle"}	51	qcm	[]	2165	[0]	\N	[{"questionId":2165,"responseIndexes":[0],"responseValue":""},{"questionId":2166,"responseIndexes":[2],"responseValue":""},{"questionId":2166,"responseIndexes":[3],"responseValue":""}]	OR
2102	Votre métier (poste actuel) 	[]	0	1	t	prerequis	\N	Profil professionnel	work	\N	\N	text	[]	\N	\N	\N	[]	OR
2550	Comment créer des dégradés complexes et dynamiques avec plusieurs couleurs et opacités sur un objet masqué ?	["Appliquer un dégradé linéaire ou radial directement sur l’objet masqué et ajuster la transparence globale de l’objet","Utiliser un calque de dégradé séparé avec le masque de l’objet, puis ajuster les couleurs, la transparence et le mode de fusion pour obtenir un effet dynamique ","Transformer l’objet en bitmap et peindre manuellement les transitions de couleurs avec un pinceau flou ","Je ne sais pas"]	1	4	t	positionnement	492		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2551	Comment créer un HDR réaliste à partir de plusieurs expositions tout en conservant les détails locaux ?	["Fichier > Fusionner > HDR Pro et ajuster les détails locaux ","Appliquer un filtre Flou","Enregistrer chaque photo séparément","Je ne sais pas"]	0	5	t	positionnement	492		quiz	\N	20	qcm	[]	\N	\N	\N	\N	OR
2552	A quoi sert Microsoft Outlook	["à créer un site internet","à créer des tableaux ","à envoyer des e-mails ","Je ne sais pas"]	2	1	t	positionnement	493		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2553	Quels modules principaux sont inclus dans Outlook ? 	["Word, Excel et PowerPoint","Courrier, Calendrier et Contacts","Tâches avancées et Règles automatiques","Je ne sais pas"]	1	2	t	positionnement	493		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2591	Comment créer un dossier pour classer ses emails ?	["Clic droit sur Boîte de réception → Nouveau dossier ","Supprimer un email","Modifier le ruban","Je ne sais pas"]	0	1	t	positionnement	495		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2592	Quelle fonction permet d’envoyer une réponse automatique pendant ses congés ?	["Gestionnaire d’absence ","Signature","Règle de tri","Je ne sais pas"]	0	2	t	positionnement	495		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
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
2166	Quelle est votre niveau ?	["A2","B1","B2","C1"]	0	2	t	mise_a_niveau	\N	voltaire	quiz	{"type":"qcm"}	51	qcm	[]	2165	[1]	\N	[{"questionId":2165,"responseIndexes":[1],"responseValue":""}]	OR
2449	Quels types d’ouvrages :	["Livres","Magazines","BD","Journaux","Comptes-rendus "]	0	9	t	mise_a_niveau	\N	voltaire	quiz	\N	51	checkbox	[]	2169	[0]	\N	[{"questionId":2169,"responseIndexes":[0],"responseValue":""},{"questionId":2171,"responseIndexes":[0],"responseValue":""}]	OR
2611	Quel raccourci permet de lancer le diaporama ?	["**CTRL + D**","**F5**","Il **n’y a pas** de raccourci, il faut **utiliser la commande** dans le logiciel","Je ne sais pas"]	1	1	t	positionnement	530		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2167	Étiez-vous à l'aise en dictée à l'école ?	["Pas du tout","Un peu","Moyennement","Tout à fait"]	0	3	t	mise_a_niveau	\N	voltaire	quiz	{"type":"qcm"}	51	qcm	[]	2165	[0]	\N	[{"questionId":2165,"responseIndexes":[0],"responseValue":""},{"questionId":2166,"responseIndexes":[2],"responseValue":""},{"questionId":2166,"responseIndexes":[3],"responseValue":""}]	OR
2169	Lisez-vous à titre professionnel ?	["Oui","Non"]	0	5	t	mise_a_niveau	\N	voltaire	quiz	{"type":"qcm"}	51	qcm	[]	2165	[0]	\N	[{"questionId":2165,"responseIndexes":[0],"responseValue":""},{"questionId":2166,"responseIndexes":[3],"responseValue":""},{"questionId":2166,"responseIndexes":[2],"responseValue":""}]	OR
2610	Quel est le but final de PowerPoint ?	["Créer un **diaporama** ","Créer un **modèle** de document","Créer du **contenu** dédié aux **réseaux sociaux**","Je ne sais pas"]	0	3	t	positionnement	529		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2609	Parmi les choix suivants, que peut-on ajouter comme contenu ? Plusieurs réponses possibles	["Un **tableau** ","Une **image**","Une **forme** ","Je ne sais pas"]	0	2	t	positionnement	529		quiz	\N	54	checkbox	[0,1,2]	\N	\N	\N	[]	OR
2607	À quoi sert PowerPoint ? 	["À créer des **tableurs** de calculs","À créer des **présentations** avec des diapositives ","À créer des **graphiques** automatisés","Je ne sais pas"]	1	1	t	positionnement	529		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2171	Lisez-vous à titre personnel ?	["Oui","Non"]	0	7	t	mise_a_niveau	\N	voltaire	quiz	{"type":"qcm"}	51	qcm	[]	2165	[0]	\N	[{"questionId":2165,"responseIndexes":[0],"responseValue":""},{"questionId":2166,"responseIndexes":[2],"responseValue":""},{"questionId":2166,"responseIndexes":[3],"responseValue":""}]	OR
2589	Comment ajouter un nouveau contact ?	["Depuis le dossier Contacts → Nouveau contact ","Depuis le calendrier","Depuis la corbeille","Je ne sais pas"]	0	4	t	positionnement	494		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2590	Quel onglet permet principalement de mettre en forme un email ?	["Accueil","Format du texte ","Affichage","Je ne sais pas"]	1	5	t	positionnement	494		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2425	Fréquence,  à titre personnel  : Ponctuellement ou Régulièrement ?	["Ponctuellement ","Régulièrement "]	0	8	t	mise_a_niveau	\N	voltaire	quiz	\N	51	qcm	[]	2171	[0]	\N	[{"questionId":2171,"responseIndexes":[0],"responseValue":""}]	OR
2061	Quelle action permet de sauvegarder un document Word pour la première fois ?	["**Accueil** > **Copier**","**Fichier** > **Enregistrer sous**","**Fichier** > **Exporter**","Je ne sais pas"]	1	2	t	positionnement	190		quiz	\N	44	qcm	[]	\N	\N	\N	\N	OR
2612	Quel est l’intérêt d’un thème ?	["De **proposer un modèle** de présentation prédéfini","De **permettre l’enregistrement** sous un format **vidéo** (MP4)","**D’appliquer** une mise en forme **générale** à toute la **présentation **","Je ne sais pas"]	2	2	t	positionnement	530		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2529	Quel outil permet de dessiner sur une image ?	["L’outil Déplacement","L’outil Recadrage","L’outil Pinceau ","Je ne sais pas"]	2	2	t	positionnement	488		quiz	\N	20	qcm	[]	\N	\N	\N	[]	OR
2613	J’ai ajouté une diapositive « Titre et contenu », comment se nomme techniquement les zones présentes par défaut 	["Une **zone de texte**","Un **espace réservé **","Des **blocs**","Je ne sais pas"]	1	3	t	positionnement	530		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2614	Que ne peut-on pas réaliser dans un tableau créé dans PowerPoint ?	["Des **formules** de **calculs **","**Fusionner** ou **fractionner ** des **cellules**","**Appliquer** un **style** prédéfini","Je ne sais pas"]	0	4	t	positionnement	530		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2615	Par ou passe-t-on pour ajouter des photos dans la présentation ?	["**Fichier > Ouvrir**","**Compléments**","**Insertion > Images **","Je ne sais pas"]	2	5	t	positionnement	530		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2616	Quelle est la différence entre une transition et une animation ?	["La **transition** peut être **minuté** mais pas **l’animation**","La **transition** s’applique au passage **entre deux diapositives**, tandis que **l’animation** s’applique **aux objets** à l’intérieur d’une diapositive ","Il **n’y a pas** de **différences**, ce sont deux types d’effet qui s’appliquent **aux mêmes endroits**","Je ne sais pas"]	1	1	t	positionnement	531		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2618	Parmi les choix suivants, quels trios d’objets peuvent être tous insérer dans une diapositive ? 	["**SmartArt **/ Vidéo **YouTube / Graphiques **","**Tableau Croisé Dynamique **/ Album photo / **Audio**","**WordArt **/ Document **PDF / Formes **automatiques","Je ne sais pas"]	0	3	t	positionnement	531		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2631	Quel est l’avantage principal d’utiliser plusieurs masques de diapositives dans une même présentation ?	["Nous ne pouvons pas créer plusieurs masques, un seul uniquement par présentation ","Appliquer des mises en page différentes selon les types de diapositives tout en gardant une cohérence globale ","Cela permet de combiner plusieurs présentations distinctes en une seule sur le principe du Document maître et des sous-documents","Je ne sais pas"]	1	5	t	positionnement	534		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2619	Quel mode ne permet pas d’ajouter des notes ?	["Le mode **Normal**","Le mode **Plan**","Le mode **Trieuse de diapositives **","Je ne sais pas"]	2	4	t	positionnement	531		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2626	Comment créer une navigation interactive sur tout objet ou espace de la présentation ?	["Avec les boutons d’Action ","Avec la commande Déclencheur","Avec la commande Objet","Je ne sais pas"]	0	1	t	positionnement	534		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2087	Je souhaite modifier les couleurs de mon site WordPress, que dois-je faire ?	["Modifier les réglages du site.","Coder le HTML.","Personnaliser le thème.","Je ne sais pas"]	2	5	t	positionnement	194		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
2090	Dans WordPress, quelle est la fonction principale d'un "Article" ?	["Créer du contenu permanent et fixe, comme une page \\"Contact\\"","Publier des contenus actualisés qui s'affichent par ordre chronologique, du plus récent au plus ancien.","Modifier uniquement le design des couleurs et la police d'écriture de tout le site.","Je ne sais pas"]	1	3	t	positionnement	218		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
44	Quelles sont vos dates de début souhaitées ?	[]	0	2	f	availabilities	\N	Disponibilités	event	{"type":"textarea","rows":2,"placeholder":"Ex : À partir du 1er mars 2025, semaines paires uniquement..."}	\N	qcm	\N	\N	\N	\N	\N	OR
45	Commentaires ou contraintes supplémentaires sur vos disponibilités	[]	0	3	f	availabilities	\N	Disponibilités	comment	{"type":"textarea","rows":3,"placeholder":"Ex : Indisponible le mardi matin, contraintes personnelles..."}	\N	qcm	\N	\N	\N	\N	\N	OR
2620	À quoi sert le masque des diapositives dans PowerPoint ?	["À paramétrer quelles diapositives doivent être afficher ou masquer au lancement du diaporama","C’est à cet emplacement uniquement que l’on configure les effets visuels (transitions et animations)","À modifier un thème existant afin de le personnaliser à des fins précises (charte graphique d’une entreprise par exemple) ","Je ne sais pas"]	2	5	t	positionnement	531		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2627	Quel outil permet de calibrer l’organisation et le minutage de chaque effet de la présentation ?	["Options de l’effet","Mode plan","Volet d’animation ","Je ne sais pas"]	0	2	t	positionnement	534		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
1999	Qu’est-ce qu’un pixel ?	["Une couleur automatique","Un filtre","La plus petite unité d’une image ","Je ne sais pas"]	2	2	t	positionnement	202		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
2648	A quoi sert un filtre ?	["A **afficher** les valeurs correspondant au filtre","A **ordonner** les valeurs en fonction du filtre","A **trier** les valeurs","Je ne sais pas"]	0	1	t	positionnement	538	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2649	Quel caractère permet de figer une référence à une cellule ? 	["L'icône : **%**","L'icône : **£**","L'icône : **$**","Je ne sais pas"]	2	2	t	positionnement	538	\N	quiz	\N	55	qcm	[]	\N	\N	\N	\N	OR
2650	Quelle fonction permet d’afficher un résultat en fonction d’une condition ? 	["**SOMME**()","**SI**()","**NB**()","Je ne sais pas"]	1	3	t	positionnement	538	\N	quiz	\N	55	qcm	[]	\N	\N	\N	\N	OR
2624	Sur quel objet ne peut-on pas insérer de lien hypertexte ?	["Un tableau ","Une image","Un graphique","Je ne sais pas"]	0	4	t	positionnement	532		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2625	Je souhaite pouvoir affecter à plusieurs objets de ma diapositives le même effet paramétré, quel outil est le plus adapté ?	["Je sélectionne l’objet, puis Copier > Coller l’effet sur un autre objet","Dans le groupe Animation avancée, j’utilise Reproduire l’animation","Dans le groupe Presse Papier, j’utilise Reproduire la mise en forme","Je ne sais pas"]	1	5	t	positionnement	532		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2628	Quel est l’avantage principal du mode Présentateur ?	["D’utiliser un pointeur laser","À voir les notes sans que le public ne les voie ","De paramétrer des sous-titres","Je ne sais pas"]	1	6	t	positionnement	532		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2011	Comment utiliser le Correcteur et le Tampon pour retoucher des zones complexes avec texture :	["Tampon : appliquer un filtre, Correcteur : ajouter du texte","Ils font la même chose","Tampon : copier-coller exactement, Correcteur : adapter texture et couleur à la zone cible ","Je ne sais pas"]	2	2	t	positionnement	213		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
2527	À quoi sert l'outil "Sélection Directe" (la flèche blanche) ?	["À déplacer tout un groupe d'objets.","À modifier les points d'ancrage individuels d'un tracé.","À changer la couleur du fond.","Je ne sais pas"]	1	15	t	positionnement	384		quiz	\N	19	qcm	[]	\N	\N	\N	[]	OR
2629	Afin de réduire le poids d’une présentation, il est possible de compresser certains éléments. Lequel de ces éléments ne peut être compressé ?	["Vidéo YouTube ","Image en ligne","Audio enregistré par PowerPoint","Je ne sais pas"]	0	3	t	positionnement	534		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2630	A quoi sert la commande Objet ?	["À répertorier dans une boite dialogue tous les objets qui peuvent être insérés (image, vidéo, son…)","À insérer un objet externe à PowerPoint ","Cette commande n’existe pas dans PowerPoint","Je ne sais pas"]	1	4	t	positionnement	534		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
41	Avez-vous un handicap qui pourrait altérer/ affecter votre apprentissage ? 	["Non","Oui"]	0	4	t	complementary	\N	Profil professionnel	accessible	{"type":"radio_toggle"}	\N	qcm	[]	\N	\N	\N	[]	OR
40	Êtes-vous en recherche d'emploi ?	["Non","Oui"]	0	3	t	complementary	\N	Profil professionnel	search	{"type":"radio_toggle"}	\N	qcm	[]	\N	\N	\N	[]	OR
477	Savez-vous allumer un ordinateur, utiliser le clavier et la souris ?	["Oui","Oui avec quelques difficultés ","Non"]	-1	4	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
2109	Savez-vous vous repérer dans l’environnement Windows : bureau, menu démarrer, fenêtres, icônes, applications… ?	["Oui","Oui avec quelques difficultés ","Non"]	0	5	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
2636	Savez-vous créer un dossier et y ranger et renommer un fichier?	["Oui","Oui avec quelques difficultés","Non"]	0	7	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
473	A quelle fréquence utilisez-vous internet ?	["Quotidiennement ","Occasionnellement ","Jamais"]	0	6	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
2632	Utilisez-vous la visioconférence (Zoom, Teams, etc…)?	["Oui","Non"]	0	8	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
2633	A quelle fréquence utilisez-vous votre mail ?	["Quotidiennement","Occasionnellement","Jamais"]	0	9	t	prerequis	\N		quiz	\N	\N	qcm	[]	\N	\N	\N	[]	OR
43	Pour votre formation, vous êtes plutôt disponible : 	["Matin","Après-midi","Entre 12h et 14h","Toute la journée"]	0	1	t	availabilities	\N	Disponibilités	schedule	{"type":"multi_select","icons":["wb_sunny","light_mode","calendar_today"]}	\N	qcm	[]	\N	\N	\N	[]	OR
2641	Vous souhaitez fournir une précision sur vos disponibilités :	[]	0	15	t	availabilities	\N	Disponibilités	quiz	\N	\N	text	[]	\N	\N	\N	[]	OR
1976	Quelle fonction est la plus adaptée et rapide pour additionner des valeurs ? 	["**=NB()**","**=NBVAL()**","**=SOMME() **","Je ne sais pas"]	2	2	t	positionnement	187		quiz	\N	45	qcm	[]	\N	\N	\N	[]	OR
2646	Où peut-on activer les contrôles de formulaire dans Word ?	["Seul **Excel ** propose ces **contrôles**","Il faut **activer ** le ruban **Développeur ** depuis **Fichier > Options **> Personnaliser le **ruban **","Il faut **impérativement **créer un **UserForm **depuis le **Visual Basic **pour avoir accès à ces **contrôles**","Je ne sais pas"]	1	17	t	positionnement	535		quiz	\N	44	qcm	[]	\N	\N	\N	[]	OR
2587	Quelle fonctionnalité utiliser pour vérifier les fautes dans un mail? 	["Vérification orthographique ","Règles","Archivage","Je ne sais pas"]	0	2	t	positionnement	494		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2588	Comment répondre à une invitation à une réunion ?	["En cliquant sur Accepter / Refuser ","En supprimant le message","En créant un nouveau mail","Je ne sais pas"]	0	3	t	positionnement	494		quiz	\N	15	qcm	[]	\N	\N	\N	\N	OR
2170	Si oui : Ponctuellement ou Régulièrement ?	["Ponctuellement","Régulièrement "]	0	6	t	mise_a_niveau	\N	voltaire	quiz	{"type":"radio_toggle"}	51	qcm	[]	2169	[0]	\N	[{"questionId":2169,"responseIndexes":[0],"responseValue":""}]	OR
2623	Un en-tête et/ou pied de page s’applique-t-il obligatoirement sur toutes les diapositives ?	["Non, nous pouvons choisir les diapositives sur lesquelles l’appliquer","Oui, nous n’avons pas d’autres options possibles","Non, nous pouvons choisir ne pas les afficher sur la diapositive de titre uniquement ","Je ne sais pas"]	2	3	t	positionnement	532		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2025	À quoi servent les scènes ?	["Ajouter de la lumière","Dessiner plus vite","Sauvegarder des vues/configurations ","Je ne sais pas"]	2	4	t	positionnement	214		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2622	Quel est l’intérêt d’utiliser des sections ?	["Permet d’intégrer une table des matières","De couper une diapositive en deux colonnes","De regrouper certaines diapositives ","Je ne sais pas"]	2	2	t	positionnement	532		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2031	Que permet l’outil _Suivez-moi_ ?	["Créer une scène","Appliquer un matériau","Extruder une forme le long d’un tracé","Mesurer un angle","Je ne sais pas"]	2	5	t	positionnement	215		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2027	Pourquoi orienter correctement les axes ?	["Faciliter la modélisation précise","Réduire le poids","Esthétique","Je ne sais pas"]	0	1	t	positionnement	215		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2030	Pourquoi optimiser un modèle avant export ?	["Ajouter détails","Modifier lumière","Réduire bugs/poids ","Je ne sais pas"]	2	4	t	positionnement	215		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2092	Sous quelle forme l'URL d'un article est-elle la plus optimisée pour le SEO ?	["www.mon-site.com/?p=64631","www.mon-site.com/exemple-article-64631","www.mon-site.com/exemple-article","Je ne sais pas"]	2	5	t	positionnement	218		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
2083	A quoi sert une extension WordPress ?	["Changer l'apparence graphique du site.","Ajouter des utilisateurs.","Ajouter des fonctionnalités à WordPress","Je ne sais pas"]	2	1	t	positionnement	194		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
2019	Pourquoi grouper des éléments ?	["Éviter qu’ils se collent","Réduire le poids du fichier","Les colorier ensemble","Je ne sais pas"]	0	3	t	positionnement	206		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2068	Quel outil permet d’appliquer rapidement une mise en forme uniforme à plusieurs paragraphes ? 	["**Copier** > **Coller**","**Accueil** > **Styles**","**Rechercher** > **Remplacer**","Je ne sais pas"]	1	1	t	positionnement	216		quiz	\N	44	qcm	[]	\N	\N	\N	[]	OR
2072	Je souhaite ajouter un sommaire en début de document, quelle méthode est la plus adaptée ? 	["**Insertion** > **Ajouter un sommaire**","**Références** > **Tables des matières **","Je **crée** un sommaire **manuellement ** en **y ajoutant** les numéro de pages **correspondants**","Je ne sais pas"]	1	5	t	positionnement	216		quiz	\N	44	qcm	[]	\N	\N	\N	[]	OR
2642	Quelle fonctionnalité est nécessaire lors de la comparaison et la fusion de deux documents ?	["Le volet de **navigation**","Le suivi des **modifications **","Le mode **Plan**","Je ne sais pas"]	1	1	t	positionnement	535		quiz	\N	44	qcm	[]	\N	\N	\N	[]	OR
2643	Quel est l’utilité de l’inspecteur de style ?	["**Vérifier** et **gérer** précisément la mise en forme d’un texte ","**Comparer** le style de deux documents distincts afin de le **reproduire ** par son biais","**D’afficher** tous les styles existants du document dans un **volet approprié**","Je ne sais pas"]	0	2	t	positionnement	535		quiz	\N	44	qcm	[]	\N	\N	\N	[]	OR
2644	Je souhaite protéger mon document mais autoriser certaines actions de mes collaborateurs. Quel outil est le plus adapté ?	["**Protéger** le document en lecture seule","**Partager** le document avec un accès en modification","**Restreindre ** la modification ","Je ne sais pas"]	2	15	t	positionnement	535		quiz	\N	44	qcm	[]	\N	\N	\N	[]	OR
2645	Quelle source de données n’est pas compatible avec un publipostage ?	["SQL **Serveur**","**Excel**","Contact **GMail**","Je ne sais pas"]	2	16	t	positionnement	535		quiz	\N	44	qcm	[]	\N	\N	\N	[]	OR
447	Quel est l’objectif de votre formation ?	["Je souhaite acquérir des savoirs de base et des compétences clés","Je vise un emploi pour lequel de nouvelles compétences me seront utiles","Je souhaite obtenir une certification pour améliorer mes chances de retrouver un emploi","Je me forme pour m'améliorer sur mon poste actuel","Je développe mes compétences pour évoluer ou changer de poste au sein de mon entreprise","Je souhaite me reconvertir","J'envisage de créer ou de racheter une entreprise"]	0	2	t	complementary	\N	Profil professionnel	quiz	\N	\N	dropdown	[]	\N	\N	\N	[]	OR
1952	Je reçois un email avec une pièce jointe que je veux mettre sur mon ordinateur	["Je clique sur Enregistrer sous","Je l’ouvre et je copie le texte","Je ne sais pas"]	0	1	t	positionnement	200		quiz	\N	23	qcm	[]	\N	\N	\N	[]	OR
2021	Dans SketchUp, à quoi servent les balises (calques) ?	["À créer des volumes","À gérer l’affichage et l’organisation du modèle","À mesurer les distances","À appliquer des matériaux","Je ne sais pas"]	1	5	t	positionnement	206		quiz	\N	21	qcm	[]	\N	\N	\N	\N	OR
2029	À quoi sert une coupe de section ?	["Supprimer","Texturer","Voir l’intérieur du modèle ","Je ne sais pas"]	2	3	t	positionnement	215		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2024	Pourquoi verrouiller un objet ?	["Le cacher","L’exporter","Éviter modification accidentelle","Je ne sais pas"]	2	3	t	positionnement	214		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2026	Pourquoi nettoyer un modèle ?	["Changer couleur","Ajouter des textures","Améliorer performance ","Je ne sais pas"]	2	5	t	positionnement	214		quiz	\N	21	qcm	[]	\N	\N	\N	[]	OR
2651	Je souhaite pouvoir visualiser continuellement ma 1ère ligne de tableau tout en descendant dans un tableau volumineux. Comment se nomme l’outil qui permet cela ?	["Figer les **volets **","Imprimer les **titres**","Mise en forme **conditionnelle**","Je ne sais pas"]	0	4	t	positionnement	538	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2652	Quelle fonction permet d’afficher uniquement la date du jour seule ?	["**MAINTENANT**()","**DATE**()","**AUJOURDHUI**()","Je ne sais pas"]	2	5	t	positionnement	538	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2672	Qu’est-ce qu’un prompt ? 	["La question ou la consigne donnée à l’IA","Une base de données","Le résultat produit par l’IA","Un logiciel informatique"]	0	3	t	positionnement	536		quiz	\N	55	qcm	[]	\N	\N	\N	[]	OR
2621	Quel est l’avantage principal du mode Présentateur ?	["D’utiliser un pointeur laser","À voir les notes sans que le public ne les voie ","De paramétrer des sous-titres","Je ne sais pas"]	1	1	t	positionnement	532		quiz	\N	54	qcm	[]	\N	\N	\N	[]	OR
2012	Quelle est la fonction d’un masque de calque et comment l’appliquer correctement :	["Supprimer définitivement des parties du calque","Dupliquer un calque","Masquer ou révéler des zones du calque sans supprimer les pixels, en peignant en noir/blanc ","Je ne sais pas"]	2	3	t	positionnement	213		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
2013	L’outil pipette sert à :	["Prélever une couleur ","Effacer une zone","Ils sont identiques","Je ne sais pas"]	0	4	t	positionnement	213		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
1956	J’ai reçu un mail que je souhaite renvoyer à une autre personne, que dois-je faire ?	["Je clique sur répondre","Je copie tout le texte dans un nouveau mail","Je transfère le mail","Je ne sais pas comment faire"]	2	2	t	positionnement	201		quiz	\N	23	qcm	[]	\N	\N	\N	[]	OR
2653	Quelle fonction est la plus adaptée et rapide pour additionner des valeurs ? 	["**=NB()**","**=NBVAL()**","**=SOMME() **","Je ne sais pas"]	2	1	t	positionnement	537	\N	quiz	\N	55	qcm	[]	\N	\N	\N	\N	OR
2654	Je souhaite représenter mes données dans un graphique simple. Quel type de graphique est adapté ? 	["Graphique **Sparkline**","Graphique **Camembert (Secteur) **","**Graphique Combiné**","Je ne sais pas"]	1	2	t	positionnement	537	\N	quiz	\N	55	qcm	[]	\N	\N	\N	\N	OR
2655	Comment Excel nomme l’intersection d’une ligne et d’une colonne ?	["Une **case**","Une **cellule **","Un **bloc**","Je ne sais pas"]	1	3	t	positionnement	537	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2673	Quel exemple correspond à un usage d’IA générative ?	["Copier-coller un texte dans un document","Générer automatiquement un texte ou une image à partir d’une demande ","Classer automatiquement des emails par expéditeur","Rechercher une information sur Internet"]	1	1	t	positionnement	541	\N	quiz	\N	56	qcm	[]	\N	\N	\N	\N	OR
2674	Quelle affirmation décrit le mieux une IA générative ?	["Une IA spécialisée uniquement dans la reconnaissance vocale","Une IA capable de créer du contenu à partir de données apprises ","Une IA qui applique uniquement des règles programmées","Une IA qui analyse des données sans produire de contenu"]	1	2	t	positionnement	541	\N	quiz	\N	56	qcm	[]	\N	\N	\N	\N	OR
2675	Qu’est-ce qu’un prompt ? 	["La question ou la consigne donnée à l’IA","Une base de données","Le résultat produit par l’IA","Un logiciel informatique"]	0	3	t	positionnement	541	\N	quiz	\N	56	qcm	[]	\N	\N	\N	\N	OR
2676	Quel raccourci clavier permet d’enregistrer rapidement un document ?	["CTRL + **S **","CTRL + **E**","**F7**","Je ne sais pas"]	0	1	t	positionnement	543	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2677	Quelle méthode est la plus rapide pour mettre en forme un tableau ?	["Sélectionner les cellules puis **Accueil** > **Trame de fond**","Sélectionner les cellules puis **Accueil** > **Couleur de surlignage**","Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","Je ne sais pas"]	2	2	t	positionnement	543	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2678	Je souhaite aligner un mot à une position précise sur la ligne sans déplacer tout le paragraphe. Que dois-je utiliser ?	["Un **retrait**","Des **espaces**","Une **tabulation**","Je ne sais pas"]	2	3	t	positionnement	543	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2679	Comment insérer le logo de mon entreprise en en-tête de document ?	["**Se positionner** sur le **1er** paragraphe puis **Insérer** une image","**Double clic** dans la partie la plus **haute** de la page puis **Insérer** une image","**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","Je ne sais pas"]	1	4	t	positionnement	543	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2680	Quelle couleur de soulignement indique une faute de grammaire ?	["Bleu","Vert","Rouge","Je ne sais pas"]	0	5	t	positionnement	543	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2089	Qu'est-ce qu'un "Menu" dans WordPress ?	["La liste des ingrédients pour faire fonctionner le site.","L'élément de navigation qui permet aux visiteurs d'accéder aux différentes pages.","Un outil pour changer les couleurs du site.","Je ne sais pas"]	1	2	t	positionnement	218		quiz	\N	22	qcm	[]	\N	\N	\N	[]	OR
1962	Je dois transmettre un courrier important par mail mais il ne doit pas être possible de le modifier	["Je transfère mon fichier Word","Je fais une photo de mon fichier et je l’envoie","Je le transforme en PDF","Je ne sais pas"]	2	3	t	positionnement	208		quiz	\N	23	qcm	[]	\N	\N	\N	[]	OR
9	Quelle action permet de sauvegarder un document Word pour la première fois ?	["**Accueil** > **Copier**","**Fichier** > **Enregistrer sous**","**Fichier** > **Exporter**","Je ne sais pas"]	1	1	t	positionnement	542		quiz	\N	56	qcm	[]	\N	\N	\N	\N	OR
10	Par où passe-t-on pour intégrer une photo depuis l’ordinateur ?	["**Dessin** > **Ajouter**","**Insertion** > **Images **","**Insertion** > **Objet**","Je ne sais pas"]	1	2	t	positionnement	542	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
11	A quoi sert le logiciel Word ?	["A **créer** des **tableaux** avec des **formules** automatisées","A **écrire** un mail","A **rédiger** du contenu **traitement de texte**","Je ne sais pas"]	2	3	t	positionnement	542	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2656	A quoi sert une mise en forme conditionnelle ?	["À **modifier** les valeurs","À **mettre en évidence** les valeurs","À **effacer** les valeurs **ne répondant pas** au critère","Je ne sais pas"]	1	1	t	positionnement	546	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2657	Quelle est l’utilité de la poignée de recopie ?	["De **dupliquer** une feuille","D’**agrandir** une zone sélectionnée","De **copier** et/ou **incrémenter** une valeur","Je ne sais pas"]	2	2	t	positionnement	546	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2658	Je souhaite analyser et synthétiser des données volumineuses de manière rapide. Quel outil est le plus approprié ?	["Un **tableau croisé dynamique**","Les **fonctions** adaptées aux **bases de données**","Un **segment**","Je ne sais pas"]	0	3	t	positionnement	546	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2659	Je souhaite proposer une liste de choix dans une liste déroulante. Par quel ruban dois-je passer ?	["Insertion","Données","Affichage","Je ne sais pas"]	1	4	t	positionnement	546	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2660	Comment éviter des modifications involontaires sur mes formules ?	["Je **déverrouille** les **cellules**","Je **protège** le **classeur**","Je **protège** la **feuille**","Je ne sais pas"]	2	5	t	positionnement	546	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2681	Comment organiser un document long en plusieurs documents liés ?	["En partageant le document via un **cloud** (**OneDrive**) pour du travail **collaboratif**","Créer une **table des matières** suffira","En utilisant le principe du **document maître** et des **sous-documents**","Je ne sais pas"]	2	1	t	positionnement	544	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2718	Pour créer un texte en deux colonnes, on utilise :	["**Insertion** > **Tableau**","**Insertion** > **Zone de texte**","**Mise en page** > **Colonnes **","Je ne sais pas"]	2	1	t	positionnement	554	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2682	Quelle est la différence entre une note de bas de page et une note de fin ?	["La note de bas de page est visible **uniquement à l’impression**, la note de fin **uniquement dans le document**","La note de bas de page s’affiche **en bas de la page concernée**, tandis que la note de fin est **regroupée à la fin du document** ou d’une section","Il n’y a pas de **différence**, ce sont les **mêmes** fonctionnalités","Je ne sais pas"]	1	2	t	positionnement	544	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2683	A quoi sert le mode « Suivi des modifications » ?	["À avoir un **historique des différentes versions** du document","À proposer une **relecture** du document afin de **le vérifier**","À **visualiser** et **corriger** des **modifications proposées** par d’autres utilisateurs ou par soi-même","Je ne sais pas"]	2	3	t	positionnement	544	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2684	Quelle option permet de protéger d’un document ?	["**Révision** > **Restreindre** la modification","**Fichiers** > **Informations** > **Gérer le document**","**Accueil** > **Protéger**","Je ne sais pas"]	0	4	t	positionnement	544	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2685	Comment se nomme l’outil qui permet de manipuler (masquer, sélectionner, renommer, réorganiser) différents objets ?	["Volet de **navigation**","Sélectionner les **objets**","Volet **sélection **","Je ne sais pas"]	2	5	t	positionnement	544	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2174	Si oui : clientèle, collègue, fournisseurs (sélectionnez)	["Clientèle","Collègue","Fournisseurs"]	0	3	t	mise_a_niveau	\N	anglais	quiz	{"type":"qcm"}	25	checkbox	[]	2173	[0]	\N	[{"questionId":2173,"responseIndexes":[0],"responseValue":""}]	OR
2661	Quelle est la solution la plus adaptée pour effectuer le total de plusieurs multiplications ?	["Réaliser les **multiplications** les unes sous les autres puis utiliser la fonction **SOMME**","Utiliser la fonction SOMMEPROD","Utiliser un **tableau croisé dynamique**","Je ne sais pas"]	1	1	t	positionnement	539	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2662	Je souhaite pouvoir ajouter un seuil fixe dans un graphique histogramme. Quelle méthode est la plus adaptée ?	["Ajouter une **forme** de type « **trait** » et la déplacer au-dessus du **graphique**","Utiliser un **graphique croisé dynamique**","Utiliser un **graphique combiné**","Je ne sais pas"]	2	2	t	positionnement	539	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2663	Que permet le symbole « & » dans Excel ?	["À **additionner** des valeurs","À **concaténer** des valeurs","À **réaliser** des tests logiques **multiples** dans des fonctions conditionnelles","Je ne sais pas"]	1	3	t	positionnement	539	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2664	A quoi sert la fonction EQUIV ?	["À **trouver** la **position** d’une valeur dans une matrice","À **retourner** une **valeur** à partir d’une position","À **tester** les valeurs **équivalentes**","Je ne sais pas"]	0	4	t	positionnement	539	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2665	À quoi sert la fonctionnalité “Consolider” ?	["À **regrouper** des données dans un **modèle de données** utile au **tableau croisé dynamique**","À **regrouper** et **résumer** des données provenant de **plusieurs** feuilles ou classeurs en un **seul** tableau","À **figer** les données afin qu’elle ne puisse pas être **déplacés** ou **modifiés**","Je ne sais pas"]	1	5	t	positionnement	539	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2647	Quelle affirmation décrit le mieux une IA générative ?	["Une IA spécialisée uniquement dans la reconnaissance vocale","Une IA capable de créer du contenu à partir de données apprises ","Une IA qui applique uniquement des règles programmées","Une IA qui analyse des données sans produire de contenu"]	1	1	t	positionnement	536		quiz	\N	55	qcm	[]	\N	\N	\N	[]	OR
2686	Où peut-on activer les contrôles de formulaire dans Word ?	["Seul **Excel ** propose ces **contrôles**","Il faut **activer ** le ruban **Développeur ** depuis **Fichier > Options **> Personnaliser le **ruban **","Il faut **impérativement **créer un **UserForm **depuis le **Visual Basic **pour avoir accès à ces **contrôles**","Je ne sais pas"]	1	1	t	positionnement	545	\N	quiz	\N	56	qcm	[]	\N	\N	\N	\N	OR
2687	Quelle fonctionnalité est nécessaire lors de la comparaison et la fusion de deux documents ?	["Le volet de **navigation**","Le suivi des **modifications **","Le mode **Plan**","Je ne sais pas"]	1	2	t	positionnement	545	\N	quiz	\N	56	qcm	[]	\N	\N	\N	\N	OR
2688	Quel est l’utilité de l’inspecteur de style ?	["**Vérifier** et **gérer** précisément la mise en forme d’un texte ","**Comparer** le style de deux documents distincts afin de le **reproduire ** par son biais","**D’afficher** tous les styles existants du document dans un **volet approprié**","Je ne sais pas"]	0	3	t	positionnement	545	\N	quiz	\N	56	qcm	[]	\N	\N	\N	\N	OR
2689	Je souhaite protéger mon document mais autoriser certaines actions de mes collaborateurs. Quel outil est le plus adapté ?	["**Protéger** le document en lecture seule","**Partager** le document avec un accès en modification","**Restreindre ** la modification ","Je ne sais pas"]	2	4	t	positionnement	545	\N	quiz	\N	56	qcm	[]	\N	\N	\N	\N	OR
2690	Quelle source de données n’est pas compatible avec un publipostage ?	["SQL **Serveur**","**Excel**","Contact **GMail**","Je ne sais pas"]	2	5	t	positionnement	545	\N	quiz	\N	56	qcm	[]	\N	\N	\N	\N	OR
2434	« Il serait préférable dans commander rapidement. »	["Correcte","Incorrecte","Je ne sais pas"]	1	2	t	positionnement	309		quiz	\N	51	qcm	[]	\N	\N	\N	[]	OR
2666	Quelle est la méthode la plus rapide pour rechercher une valeur spécifique dans un tableau et renvoyer une autre valeur correspondante ?	["**INDEX** et **EQUIV**","**RECHERCHEV**","**DECALER**","Je ne sais pas"]	1	1	t	positionnement	540	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2667	Dans un tableau croisé dynamique, à quoi sert un champ calculé ?	["À **formater** le champ en **pourcentage**","À **ajouter** des **sous-totaux** au champ sélectionné","À **créer** un **nouveau** champ basé sur une **formule** appliquée aux champs existants","Je ne sais pas"]	2	2	t	positionnement	540	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2668	Quelle fonctionnalité avancée permet de trouver la meilleure solution possible à un problème donné selon des contraintes ?	["L’outil **solveur**","Le gestionnaire de **scénario**","Un **tableau croisé dynamique** basé sur un **modèle de données**","Je ne sais pas"]	0	3	t	positionnement	540	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2669	Dans quel ruban peut-on trouver des contrôles de formulaire ou contrôles ActiveX ?	["**Insertion**","**Données**","**Développeur**","Je ne sais pas"]	2	4	t	positionnement	540	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2670	Quelles actions adaptées dois-je mettre en œuvre afin de mettre en forme les cellules contenant des dates d’entrée des salariés en fonction de, la date du jour et de 10 ans d’ancienneté ?	["Je **sélectionne manuellement** les cellules à chaque fois, je **choisis** une mise en forme en utilisant un **style de cellule**, et je **les change** à chaque mois","J’utilise une **mise en forme conditionnelle** avec **formule** et j’intègre la fonction **DATEDIF**","On ne peut le faire qu’à l’aide du **VBA**","Je ne sais pas"]	1	5	t	positionnement	540	\N	\N	\N	55	qcm	\N	\N	\N	\N	\N	OR
2691	Pour créer un texte en deux colonnes, on utilise :	["**Insertion** > **Tableau**","**Insertion** > **Zone de texte**","**Mise en page** > **Colonnes **","Je ne sais pas"]	2	1	t	positionnement	547	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2692	Quel est le format d’un modèle de document ?	[".**DOTX**",".**DOCX**",".**DOCM**","Je ne sais pas"]	0	2	t	positionnement	547	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2693	Je veux intégrer un tableau créé dans Excel dans mon document Word et pouvoir le modifier dans Word, quelle méthode dois-je utiliser ?	["**Insertion** > **Tableau** > Feuille de calcul **Excel**","On **ne peut pas** insérer un **tableau** provenant **d’Excel** et le **modifier** dans **Word**","**Copier** le tableau dans **Excel** > **Coller** de manière **spéciale** dans **Word **","Je ne sais pas"]	2	3	t	positionnement	547	\N	\N	\N	56	qcm	\N	\N	\N	\N	\N	OR
2694	Quel outil permet d’appliquer rapidement une mise en forme uniforme à plusieurs paragraphes ? 	["**Copier** > **Coller**","**Accueil** > **Styles**","**Rechercher** > **Remplacer**","Je ne sais pas"]	1	4	t	positionnement	547	\N	quiz	\N	56	qcm	[]	\N	\N	\N	\N	OR
2695	Je souhaite ajouter un sommaire en début de document, quelle méthode est la plus adaptée ? 	["**Insertion** > **Ajouter un sommaire**","**Références** > **Tables des matières **","Je **crée** un sommaire **manuellement ** en **y ajoutant** les numéro de pages **correspondants**","Je ne sais pas"]	1	5	t	positionnement	547	\N	quiz	\N	56	qcm	[]	\N	\N	\N	\N	OR
2671	Quel exemple correspond à un usage d’IA générative ?	["Copier-coller un texte dans un document","Générer automatiquement un texte ou une image à partir d’une demande ","Classer automatiquement des emails par expéditeur","Rechercher une information sur Internet"]	1	2	t	positionnement	536		quiz	\N	55	qcm	[]	\N	\N	\N	[]	OR
2696	Quelle est votre utilisation de l'IA ?	["Jamais utilisé","Déjà testé","Utilisation régulière"]	0	6	t	mise_a_niveau	\N	ia	quiz	{"type":"qcm"}	56	qcm	\N	\N	\N	\N	\N	OR
2697	Exercez-vous dans les domaines de :	["Assistanat","Secrétariat","Marketing","Communication","RH","Juridique"]	0	7	t	mise_a_niveau	\N	ia	quiz	{"type":"qcm"}	56	qcm	\N	\N	\N	\N	\N	OR
2698	Quelle est votre utilisation de l'IA ?	["Jamais utilisé","Déjà testé","Utilisation régulière"]	0	6	t	mise_a_niveau	\N	ia	quiz	{"type":"qcm"}	55	qcm	\N	\N	\N	\N	\N	OR
2699	Exercez-vous dans les domaines de :	["Assistanat","Secrétariat","Marketing","Communication","RH","Juridique"]	0	7	t	mise_a_niveau	\N	ia	quiz	{"type":"qcm"}	55	qcm	[]	\N	\N	\N	[]	OR
2700	Comment organiser un document long en plusieurs documents liés ?	["En partageant le document via un **cloud** (**OneDrive**) pour du travail **collaboratif**","Créer une **table des matières** suffira","En utilisant le principe du **document maître** et des **sous-documents**","Je ne sais pas"]	2	1	t	positionnement	552	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2701	Quelle est la différence entre une note de bas de page et une note de fin ?	["La note de bas de page est visible **uniquement à l’impression**, la note de fin **uniquement dans le document**","La note de bas de page s’affiche **en bas de la page concernée**, tandis que la note de fin est **regroupée à la fin du document** ou d’une section","Il n’y a pas de **différence**, ce sont les **mêmes** fonctionnalités","Je ne sais pas"]	1	2	t	positionnement	552	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2702	A quoi sert le mode « Suivi des modifications » ?	["À avoir un **historique des différentes versions** du document","À proposer une **relecture** du document afin de **le vérifier**","À **visualiser** et **corriger** des **modifications proposées** par d’autres utilisateurs ou par soi-même","Je ne sais pas"]	2	3	t	positionnement	552	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2703	Quelle option permet de protéger d’un document ?	["**Révision** > **Restreindre** la modification","**Fichiers** > **Informations** > **Gérer le document**","**Accueil** > **Protéger**","Je ne sais pas"]	0	4	t	positionnement	552	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2704	Comment se nomme l’outil qui permet de manipuler (masquer, sélectionner, renommer, réorganiser) différents objets ?	["Volet de **navigation**","Sélectionner les **objets**","Volet **sélection **","Je ne sais pas"]	2	5	t	positionnement	552	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2719	Quel est le format d’un modèle de document ?	[".**DOTX**",".**DOCX**",".**DOCM**","Je ne sais pas"]	0	2	t	positionnement	554	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2720	Je veux intégrer un tableau créé dans Excel dans mon document Word et pouvoir le modifier dans Word, quelle méthode dois-je utiliser ?	["**Insertion** > **Tableau** > Feuille de calcul **Excel**","On **ne peut pas** insérer un **tableau** provenant **d’Excel** et le **modifier** dans **Word**","**Copier** le tableau dans **Excel** > **Coller** de manière **spéciale** dans **Word **","Je ne sais pas"]	2	3	t	positionnement	554	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2721	Quel outil permet d’appliquer rapidement une mise en forme uniforme à plusieurs paragraphes ? 	["**Copier** > **Coller**","**Accueil** > **Styles**","**Rechercher** > **Remplacer**","Je ne sais pas"]	1	4	t	positionnement	554	\N	quiz	\N	57	qcm	[]	\N	\N	\N	\N	OR
2722	Je souhaite ajouter un sommaire en début de document, quelle méthode est la plus adaptée ? 	["**Insertion** > **Ajouter un sommaire**","**Références** > **Tables des matières **","Je **crée** un sommaire **manuellement ** en **y ajoutant** les numéro de pages **correspondants**","Je ne sais pas"]	1	5	t	positionnement	554	\N	quiz	\N	57	qcm	[]	\N	\N	\N	\N	OR
2005	Quelle est la différence entre les formats XCF, JPEG et PNG ? :	["JPEG est vectoriel, PNG est bitmap","Il n’y a aucune différence","XCF conserve les calques, JPEG compresse avec une perte, PNG conserve la transparence ","Je ne sais pas"]	2	5	t	positionnement	203		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
2705	Où peut-on activer les contrôles de formulaire dans Word ?	["Seul **Excel ** propose ces **contrôles**","Il faut **activer ** le ruban **Développeur ** depuis **Fichier > Options **> Personnaliser le **ruban **","Il faut **impérativement **créer un **UserForm **depuis le **Visual Basic **pour avoir accès à ces **contrôles**","Je ne sais pas"]	1	1	t	positionnement	553	\N	quiz	\N	57	qcm	[]	\N	\N	\N	\N	OR
2706	Quelle fonctionnalité est nécessaire lors de la comparaison et la fusion de deux documents ?	["Le volet de **navigation**","Le suivi des **modifications **","Le mode **Plan**","Je ne sais pas"]	1	2	t	positionnement	553	\N	quiz	\N	57	qcm	[]	\N	\N	\N	\N	OR
2707	Quel est l’utilité de l’inspecteur de style ?	["**Vérifier** et **gérer** précisément la mise en forme d’un texte ","**Comparer** le style de deux documents distincts afin de le **reproduire ** par son biais","**D’afficher** tous les styles existants du document dans un **volet approprié**","Je ne sais pas"]	0	3	t	positionnement	553	\N	quiz	\N	57	qcm	[]	\N	\N	\N	\N	OR
2708	Je souhaite protéger mon document mais autoriser certaines actions de mes collaborateurs. Quel outil est le plus adapté ?	["**Protéger** le document en lecture seule","**Partager** le document avec un accès en modification","**Restreindre ** la modification ","Je ne sais pas"]	2	4	t	positionnement	553	\N	quiz	\N	57	qcm	[]	\N	\N	\N	\N	OR
2709	Quelle source de données n’est pas compatible avec un publipostage ?	["SQL **Serveur**","**Excel**","Contact **GMail**","Je ne sais pas"]	2	5	t	positionnement	553	\N	quiz	\N	57	qcm	[]	\N	\N	\N	\N	OR
2400	Quel est l’avantage principal du partage par lien Google Drive par rapport à une pièce jointe ?	["Il permet de modifier les autorisations après envoi","Il augmente automatiquement la capacité de stockage","Il supprime le fichier du disque dur","Je ne sais pas"]	0	1	t	positionnement	307		quiz	\N	43	qcm	[]	\N	\N	\N	[]	OR
2001	Un format JPEG est principalement utilisé pour :	["Dessin vectoriel","Animation","Photo compressée ","Je ne sais pas"]	2	1	t	positionnement	203		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
2710	Quel raccourci clavier permet d’enregistrer rapidement un document ?	["CTRL + **S **","CTRL + **E**","**F7**","Je ne sais pas"]	0	1	t	positionnement	549	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2711	Quelle méthode est la plus rapide pour mettre en forme un tableau ?	["Sélectionner les cellules puis **Accueil** > **Trame de fond**","Sélectionner les cellules puis **Accueil** > **Couleur de surlignage**","Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","Je ne sais pas"]	2	2	t	positionnement	549	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2712	Je souhaite aligner un mot à une position précise sur la ligne sans déplacer tout le paragraphe. Que dois-je utiliser ?	["Un **retrait**","Des **espaces**","Une **tabulation**","Je ne sais pas"]	2	3	t	positionnement	549	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2713	Comment insérer le logo de mon entreprise en en-tête de document ?	["**Se positionner** sur le **1er** paragraphe puis **Insérer** une image","**Double clic** dans la partie la plus **haute** de la page puis **Insérer** une image","**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","Je ne sais pas"]	1	4	t	positionnement	549	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2714	Quelle couleur de soulignement indique une faute de grammaire ?	["Bleu","Vert","Rouge","Je ne sais pas"]	0	5	t	positionnement	549	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2002	L’outil de sélection sert à :	["Exporter une image","Ajouter un texte","Choisir une zone à modifier ","Je ne sais pas"]	2	2	t	positionnement	203		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
2715	Par où passe-t-on pour intégrer une photo depuis l’ordinateur ?	["**Dessin** > **Ajouter**","**Insertion** > **Images **","**Insertion** > **Objet**","Je ne sais pas"]	1	1	t	positionnement	548	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2716	Quelle action permet de sauvegarder un document Word pour la première fois ?	["**Accueil** > **Copier**","**Fichier** > **Enregistrer sous**","**Fichier** > **Exporter**","Je ne sais pas"]	1	2	t	positionnement	548	\N	quiz	\N	57	qcm	[]	\N	\N	\N	\N	OR
2717	A quoi sert le logiciel Word ?	["A **créer** des **tableaux** avec des **formules** automatisées","A **écrire** un mail","A **rédiger** du contenu **traitement de texte**","Je ne sais pas"]	2	3	t	positionnement	548	\N	\N	\N	57	qcm	\N	\N	\N	\N	\N	OR
2003	Un calque permet de :	["Imprimer plus vite","Supprimer une couleur","Séparer les éléments d’une image ","Je ne sais pas"]	2	3	t	positionnement	203		quiz	\N	48	qcm	[]	\N	\N	\N	[]	OR
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, brand, civilite, nom, prenom, telephone, conseiller, "formationChoisie", "prerequisiteScore", "levelsScores", "stopLevel", "finalRecommendation", "createdAt", "emailSentAt", "scorePretest", "complementaryQuestions", availabilities, "stagiaireId", "lastValidatedLevel", "isCompleted", "positionnementAnswers", metier, situation, "miseANiveauAnswers", "highLevelContinue", "ignoreQuestionRules", "isP3Mode", "parcoursRuleHadPrereqCondition", "parrainNom", "parrainPrenom", "parrainEmail", "parrainTelephone", "p3SkipQuiz", "stopLevelOrder", "parcoursNumber", "bureautiqueSuite", "explanationMessage", "parcoursTitle", "parcoursChoices") FROM stdin;
4ba793e2-8d31-4a0c-b2bc-2998983ea0c0	aopia	M.	a	z	0	Herizo Randria	Digitales Compétences	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":1,"total":5,"percentage":20,"requiredCorrect":5,"validated":false}}	Basique	Digitales Compétences Basique (TOSA)	2026-07-06 21:55:20.342073	2026-07-06 21:56:17.307	\N	\N	{"43":"Après-midi","2641":""}	\N	Initial	t	{"Initial":{"1952":"Je clique sur Enregistrer sous","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"},"Basique":{"1955":"Je ne sais pas trop comment vérifier","1956":"Je copie tout le texte dans un nouveau mail","1957":"J’utilise le logiciel Word","1958":"Je demande de l’aide","1959":"J’utilise le même mot de passe sur tous les sites"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N		Essentiels Digitales Compétences & Word	\N
6b87d68e-1f51-4e7d-9225-9782bb33b843	aopia	M.	test	jkl	06	Herizo Randria	Digitales Compétences	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":5,"total":5,"percentage":100,"requiredCorrect":5,"validated":true},"Opérationnel":{"score":1,"total":5,"percentage":20,"requiredCorrect":4,"validated":false}}	Basique	Digitales Compétences Opérationnel (TOSA) & OUTILS COLLABORATIFS (ICDL)	2026-07-06 12:59:32.580747	2026-07-06 13:01:58.715	0	\N	{"43":"Après-midi","2641":""}	\N	Basique	t	{"Initial":{"1952":"Je clique sur Enregistrer sous","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"},"Basique":{"1955":"Je consulte plusieurs sites et compare les informations","1956":"Je transfère le mail","1957":"J’utilise le logiciel Word","1958":"Je redémarre l’ordinateur","1959":"J’utilise une combinaison de chiffres, de lettres majuscules et minuscules et de symboles"},"Opérationnel":{"1960":"J’ouvre plusieurs pages web","1961":"Je les classe par ordre alphabétique","1962":"Je fais une photo de mon fichier et je l’envoie","1963":"J’utilise une imprimante laser","1964":"j’utilise un malware ou un ransomware"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		Renforcement Digital Compétence	\N
250abecc-0292-43c5-b524-e5dd5a14f03b	aopia	M.	toec	A	06	herizo Randria	Anglais 	\N	{"Niveau A1":{"score":6,"total":6,"percentage":100,"requiredCorrect":6,"validated":true},"Niveau A2":{"score":5,"total":6,"percentage":83.33333333333334,"requiredCorrect":5,"validated":true},"Niveau B1":{"score":2,"total":6,"percentage":33.33333333333333,"requiredCorrect":5,"validated":false}}	Niveau C1	Niveau C1 - TOEIC	2026-07-06 14:26:14.163462	2026-07-06 14:27:46.19	-1	\N	{"43":"Après-midi","2641":""}	\N	Niveau A2	t	{"Niveau A1":{"2123":"is","2124":"have","2125":"is","2126":"is","2127":"is watching","2128":"goes"},"Niveau A2":{"15":"were","16":"was watching","17":"a few","18":"tallest","19":"as beautiful as","20":"went"},"Niveau B1":{"21":"since","22":"had","23":"was building","24":"is working","25":"has eaten","26":"had drunk"}}	\N	\N	\N	f	f	t	f					t	5	1	\N		“Perfectionnement Anglais” : (B1 & B2) - TOEIC	\N
4b7a00af-2bd8-4a86-814e-8550f6e73a56	aopia	M.	h	h	h	herizo Randria	Outlook	\N	{}	\N	\N	2026-07-04 20:49:34.519891	2026-07-04 21:36:50.051	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
d31d9026-ceb8-463d-be76-ad18b3327715	aopia	M.	test	test	06	Herizo Randria	Digitales Compétences	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Initial	Essentiels Digitales Compétences | Renforcement Digital Compétence	2026-07-06 15:24:18.984364	\N	\N	\N	\N	\N	Débutant	f	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		\N	[{"id":394,"title":"Essentiels Digitales Compétences","recommendations":["Digitales Compétences Basique (TOSA)","WORD Basique (TOSA)/EXCEL Basique (TOSA)/PPT Basique (TOSA)"],"explanationMessage":""},{"id":436,"title":"Renforcement Digital Compétence","recommendations":["Digitales Compétences Basique (TOSA)","OUTLOOK Basique (TOSA)"],"explanationMessage":""}]
81a66638-5277-499f-8b2b-78791bfd0065	aopia	M.	TOEIC	a	06	Herizo Randria	Anglais 	\N	{"Niveau A1":{"score":4,"total":6,"percentage":66.66666666666666,"requiredCorrect":6,"validated":false}}	Niveau B2	Niveau B2 - TOEIC	2026-07-06 19:58:58.930578	2026-07-06 20:18:00.098	-1	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Niveau A1":{"2123":"is","2124":"has","2125":"is","2126":"is","2127":"is watching","2128":"is going"}}	\N	\N	\N	f	f	t	f					t	4	1	\N		"Perfectionnement Anglais" : (B1 & B2) - TOEIC	\N
0a72f34d-63de-4e88-9912-2690ba7afa7c	aopia	M.	TOEIC	test	06	Herizo Randria	Anglais 	\N	{"Niveau A1":{"score":5,"total":6,"percentage":83.33333333333334,"requiredCorrect":6,"validated":false}}	Débutant	Niveau A2 - TOEIC & Anglais A2 (ETS)	2026-07-06 14:16:46.061909	2026-07-06 14:17:19.348	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Niveau A1":{"2123":"is","2124":"have","2125":"is","2126":"is","2127":"is watching","2128":"is going"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		"Renforcement Anglais” (A2 & B1) - TOEIC	\N
a9a71ee9-90be-43be-b3ac-1ba5b533101d	aopia	M.	a	a	06	Herizo Randria	Digitales Compétences	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Initial	Essentiels Digitales Compétences & Excel | Renforcement Digital Compétence	2026-07-06 16:47:21.157623	\N	\N	\N	\N	\N	Débutant	f	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		\N	[{"id":394,"title":"Essentiels Digitales Compétences & Excel","recommendations":["Digitales Compétences Basique (TOSA)","EXCEL Basique (TOSA)"],"explanationMessage":""},{"id":436,"title":"Renforcement Digital Compétence","recommendations":["Digitales Compétences Basique (TOSA)","OUTLOOK Basique (TOSA)"],"explanationMessage":""}]
f11fd4ab-77e9-4b37-8b43-3266642c71cf	aopia	M.	test	test	06	Herizo Randria	Anglais 	\N	{"Niveau A1":{"score":6,"total":6,"percentage":100,"requiredCorrect":6,"validated":true},"Niveau A2":{"score":6,"total":6,"percentage":100,"requiredCorrect":5,"validated":true},"Niveau B1":{"score":3,"total":6,"percentage":50,"requiredCorrect":5,"validated":false}}	Niveau A2	Niveau B1 - TOEIC & Anglais B1 (ETS)	2026-07-06 09:54:29.452436	2026-07-06 09:56:10.561	0	\N	{"43":"Après-midi","2641":""}	\N	Niveau A2	t	{"Niveau A1":{"2123":"is","2124":"have","2125":"is","2126":"is","2127":"is watching","2128":"goes"},"Niveau A2":{"15":"were","16":"was watching","17":"much","18":"tallest","19":"as beautiful as","20":"went"},"Niveau B1":{"21":"during","22":"had","23":"is built","24":"has worked","25":"had eaten","26":"drank"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		Perfectionnement Anglais - TOEIC	\N
cd580e78-e057-4fd7-b1b9-0f481f81b11c	aopia	M.	test	06	06	Herizo Randria	Français	\N	{"Découverte":{"score":2,"total":5,"percentage":40,"requiredCorrect":4,"validated":false}}	Découverte	Français Professionnel (VOLTAIRE)	2026-07-06 15:11:46.061946	2026-07-06 15:23:24.266	-1	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Découverte":{"2428":"Un adverbe","2429":"Un déterminant","2430":"Un adjectif","2431":"les documents","2432":"les documents"}}	\N	\N	\N	f	f	t	f					t	4	3	\N	Professionnel + Affaires	Renforcement Français	\N
d09a4434-c61d-41df-b24e-f2fbc7e044ea	aopia	M.	a	a	06	Herizo Randria	Digitales Compétences	\N	{"Initial":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	Débutant	Digitales Compétences Basique (TOSA) & OUTLOOK Basique (TOSA)	2026-07-06 16:48:05.370234	2026-07-06 16:48:36.517	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Excel"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	Renforcement Digital Compétence	\N
a15a9d8a-628b-47ff-bd98-defb7158f11b	aopia	M.	test	za	a	Herizo Randria	Digitales Compétences	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Initial	WORD Basique (TOSA)	2026-07-06 21:44:35.374482	2026-07-06 21:45:04.21	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N		Essentiels Digitales Compétences & Word	\N
cceead3a-cf12-4948-bfbf-39af13a37236	aopia	M.	Dicomp	test	06	Herizo Randria	WORD Basique (TOSA)	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	WORD Basique (TOSA)	WORD Basique (TOSA)	2026-07-06 20:19:21.522094	2026-07-06 21:15:13.754	-1	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"}}	\N	\N	\N	f	f	t	f					t	\N	1	\N	Digitales Compétences Basique (TOSA) + OUTLOOK Basique (TOSA) -> Word basique	Renforcement Digital Compétence - P3	\N
253d4641-4c96-4263-a9f9-bda9fcd1b611	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-06 19:45:46.126966	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f	\N	\N	\N	\N	f	\N	1	\N	\N	\N	\N
bd12bda2-0990-43ac-b2a9-bc2d237b72ee	aopia	M.	test	AB	.	TEST CECILE	WordPress	{"470":"Quotidiennement ","473":"Quotidiennement ","477":"Oui","2109":"Oui","2632":"Oui","2633":"Quotidiennement","2636":"Oui"}	{"Initial":{"score":1,"total":4,"percentage":25,"requiredCorrect":4,"validated":false}}	Initial	WORDPRESS Basique (TOSA) | WORDPRESS Opérationnel (ICDL)	2026-07-07 13:14:01.450406	\N	\N	\N	\N	\N	Débutant	f	{"Initial":{"2079":"Un nom de domaine (l'adresse du site) et un hébergement (l'espace de stockage sur un serveur).","2080":"Je ne sais pas","2081":"Je ne sais pas","2082":"À stocker la base de données de tous les articles et commentaires du site."}}	.	["Salarié"]	{"2183":"Créer un site vitrine"}	f	f	f	f					f	\N	1	\N		Renforcement Wordpress	\N
43f0caf1-7060-4cf0-83a1-000539357da7	aopia	M.	Anglais	A1 KO	06 06 06 06 06		\N	\N	\N	\N	\N	2026-07-07 13:41:43.088518	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
6ac775fe-ff4b-4517-a44b-8d6ae0d33d1b	aopia	M.	Test AB	Digcomp	.	TEST CECILE	Excel	{"470":"Quotidiennement ","473":"Quotidiennement ","477":"Oui","2109":"Oui","2632":"Oui","2633":"Quotidiennement","2636":"Oui"}	{}	\N	\N	2026-07-07 09:29:57.60411	\N	\N	\N	\N	\N	\N	f	{}	coordinatrice	["Salarié"]	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
3012c61c-39f4-455e-87ef-25bcd463a7ba	aopia	M.	Anglais	A1 KO	0606060606		\N	\N	\N	\N	\N	2026-07-07 13:48:28.134485	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
a72e3d23-58d3-4b26-a5c3-58ea6e5e9bf2	aopia	M.	AA	AA	06	herizo Randria	SketchUp	{"470":"Occasionnellement","473":"Occasionnellement ","477":"Oui","2109":"Oui avec quelques difficultés ","2632":"Oui","2633":"Occasionnellement","2636":"Oui avec quelques difficultés"}	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Initial	SKETCHUP Opérationnel (ICDL) | GIMP Opérationnel (ICDL)	2026-07-07 17:03:36.378662	\N	\N	\N	\N	\N	Débutant	f	{"Initial":{"2014":"Modélisation 3D","2015":"Choisir un élément du modèle","2016":"Mesurer une distance"}}	jk	["Salarié"]	{"2180":"Oui","2181":"Oui","2182":"Oui"}	f	f	f	f					f	\N	1	\N		Création visuels : 3D/Images	\N
a39fff1a-6ede-4f95-af6a-01850e58772c	aopia	M.	test	w	06	Herizo Randria	Word	{"470":"Occasionnellement","473":"Occasionnellement ","477":"Oui","2109":"Oui avec quelques difficultés ","2632":"Non","2633":"Occasionnellement","2636":"Oui avec quelques difficultés"}	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Initial	WORD Basique (TOSA) | Digitales Compétences Basique (TOSA)	2026-07-07 13:45:05.39811	\N	\N	\N	\N	\N	Débutant	f	{"Initial":{"2060":"A **rédiger** du contenu **traitement de texte**","2061":"**Fichier** > **Enregistrer sous**","2062":"**Insertion** > **Objet**"}}	test	["Demandeur d’emploi"]	\N	f	f	f	f					f	\N	1	\N		Essentiels Digitales Compétences & WORD	\N
cb61ade2-cce5-498f-8167-40e2bad81521	aopia	M.	Anglais	A1 KO	0606060606		\N	\N	\N	\N	\N	2026-07-07 13:54:09.38249	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
15edcb19-9e81-49ef-937a-55f3c56f18db	aopia	M.	Anglais	A1 KO	0606060606		\N	\N	\N	\N	\N	2026-07-07 13:54:32.066515	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
79fc4d29-18bb-4d9e-ac47-805e0e9ea44c	aopia	M.	Anglais	A1 KO	0606060606		\N	\N	\N	\N	\N	2026-07-07 13:55:09.045825	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
4f8ea524-9025-4fb2-924f-b36b02b2a56f	aopia	M.	Anglais	A1 KO	0606060606		\N	\N	\N	\N	\N	2026-07-07 13:55:44.794997	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
10b685fd-eeb2-4a21-ab83-b3335909ff4e	aopia	M.	a	a	06	Herizo Randria	\N	{"470":"Occasionnellement","473":"Occasionnellement ","477":"Oui avec quelques difficultés ","2109":"Oui avec quelques difficultés ","2632":"Non","2633":"Occasionnellement","2636":"Oui avec quelques difficultés"}	\N	\N	\N	2026-07-07 13:56:12.87482	\N	\N	\N	\N	\N	\N	f	\N	test	["Salarié"]	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
7e4e8cc4-a594-4f5a-96e7-18db8f4be013	aopia	M.	a	a	0+	Herizo Randria	Digitales Compétences	{"470":"Occasionnellement","473":"Occasionnellement ","477":"Oui avec quelques difficultés ","2109":"Oui avec quelques difficultés ","2632":"Oui","2633":"Occasionnellement","2636":"Oui avec quelques difficultés"}	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Initial	Essentiels Digitales Compétences & Word | Essentiels Digitales Compétences & Excel | Essentiels Digitales Compétences & PPT | Renforcement Digital Compétence  & OUTLOOK	2026-07-07 17:01:44.7154	\N	\N	\N	\N	\N	Débutant	f	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"}}	kl	["Salarié"]	\N	f	f	f	f					f	\N	1	\N		\N	[{"id":394,"title":"Essentiels Digitales Compétences & Word","recommendations":["Digitales Compétences Basique (TOSA)","WORD Basique (TOSA)"],"explanationMessage":""},{"id":438,"title":"Essentiels Digitales Compétences & Excel","recommendations":["Digitales Compétences Basique (TOSA)","EXCEL Basique (TOSA)"],"explanationMessage":""},{"id":437,"title":"Essentiels Digitales Compétences & PPT","recommendations":["Digitales Compétences Basique (TOSA)","PPT Basique (TOSA)"],"explanationMessage":""},{"id":436,"title":"Renforcement Digital Compétence  & OUTLOOK","recommendations":["Digitales Compétences Basique (TOSA)","OUTLOOK Basique (TOSA)"],"explanationMessage":""}]
2d24e8a7-a708-48ef-be23-b066fdbcc841	aopia	M.	test	rzqr	06	Herizo Randria	\N	\N	\N	\N	\N	2026-07-08 11:14:00.641092	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
78163583-dfc8-48cc-b98b-2b11a5942ad4	aopia	M.	hg	a	06	Herizo Randria	EXCEL Basique (TOSA)	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	EXCEL Basique (TOSA)	EXCEL Basique (TOSA)	2026-07-08 11:14:51.402346	2026-07-08 11:46:12.299	-1	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"}}	\N	\N	\N	f	f	t	f					t	\N	1	\N	Digitales Compétences Basique (TOSA) + WORD Basique (TOSA) -> EXCEL Basique (TOSA)	Essentiels Digitales Compétences & Word - P3	\N
015c38ee-7433-4b5e-8420-4aa3d4a6ff69	aopia	M.	az	a	06	Herizo Randria	Word + IA	\N	{"IA Générative ":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	IA Générative 	Aucun parcours actif ne correspond à cette progression.	2026-07-12 23:51:45.864725	2026-07-12 23:52:07.871	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"IA Générative ":{"2673":"Générer automatiquement un texte ou une image à partir d’une demande ","2674":"Une IA capable de créer du contenu à partir de données apprises ","2675":"Le résultat produit par l’IA"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
f2e7452c-10dd-4ab3-9567-a26c84f6f4ad	aopia	M.	a	a	06	Herizo Randria	Excel	\N	{}	\N	\N	2026-07-12 23:04:28.164677	2026-07-12 23:04:52.756	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
c5655178-907a-431a-ac3d-042ee2d6d45a	aopia	M.	aza	a	06	Herizo Randria	Photoshop	\N	{}	\N	\N	2026-07-12 22:10:03.667454	2026-07-12 22:11:58.707	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
57f363ea-ebdf-48da-8f8d-f99e0116d450	aopia	M.	Test	H	06	Herizo Randria	Digitales Compétences	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Débutant	Digitales Compétences Basique (TOSA) & PPT Basique (TOSA)	2026-07-08 11:56:22.947779	2026-07-08 11:58:00.64	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	Essentiels Digitales Compétences & PPT	\N
3e2d5845-a015-4829-bb44-69b5316250ec	aopia	M.	te	a	06	Herizo Randria	Niveau C1 - TOEIC	{"470":"Occasionnellement","473":"Quotidiennement ","477":"Oui avec quelques difficultés ","2109":"Oui avec quelques difficultés ","2632":"Non","2633":"Occasionnellement","2636":"Oui avec quelques difficultés"}	{"Niveau A1":{"score":3,"total":6,"percentage":50,"requiredCorrect":6,"validated":false}}	Niveau C1 - TOEIC	Niveau C1 - TOEIC	2026-07-08 14:45:31.141942	2026-07-08 14:46:58.476	-1	{"40":"Non","41":"Non","42":null,"447":"Je vise un emploi pour lequel de nouvelles compétences me seront utiles"}	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Niveau A1":{"2123":"is","2124":"have","2125":"are","2126":"have","2127":"is watching","2128":"is going"}}	test	["Salarié"]	{"2172":"Collège","2173":"Oui","2174":["Clientèle"],"2175":"Régulier","2176":"Oui","2177":["Voyages","Lecture"],"2448":"Ponctuel"}	f	f	t	f					t	\N	1	\N	Niveau A2 - TOEIC + Niveau B1 - TOEIC -> Niveau C1 - TOEIC	"Renforcement Anglais" (A2 & B1) - TOEIC - P3	\N
62787907-02e1-414a-b217-3a59a1d7665e	aopia	M.	a	a	06	Herizo Randria	Digitales Compétences	\N	{"Initial":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	Initial	Essentiels Digitales Compétences & Word | Essentiels Digitales Compétences & Excel | Essentiels Digitales Compétences & PPT | Renforcement Digital Compétence  & OUTLOOK	2026-07-08 14:27:11.952867	\N	\N	\N	\N	\N	Débutant	f	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Excel"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		\N	[{"id":394,"title":"Essentiels Digitales Compétences & Word","recommendations":["Digitales Compétences Basique (TOSA)","WORD Basique (TOSA)"],"explanationMessage":""},{"id":438,"title":"Essentiels Digitales Compétences & Excel","recommendations":["Digitales Compétences Basique (TOSA)","EXCEL Basique (TOSA)"],"explanationMessage":""},{"id":437,"title":"Essentiels Digitales Compétences & PPT","recommendations":["Digitales Compétences Basique (TOSA)","PPT Basique (TOSA)"],"explanationMessage":""},{"id":436,"title":"Renforcement Digital Compétence  & OUTLOOK","recommendations":["Digitales Compétences Basique (TOSA)","OUTLOOK Basique (TOSA)"],"explanationMessage":""}]
15ceadbf-da49-445d-b44a-1de8bfc64a3a	aopia	M.	tes	tes	06	Herizo Randria	Word	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true}}	\N	\N	2026-07-08 14:43:05.341044	\N	\N	\N	\N	\N	Basique	f	{"Initial":{"2060":"A **rédiger** du contenu **traitement de texte**","2061":"**Fichier** > **Enregistrer sous**","2062":"**Insertion** > **Images **"},"Basique":{"2063":"CTRL + **S **","2064":"Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","2065":"Une **tabulation**","2066":"**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","2067":"Bleu"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		Essentiels Digitales Compétences & WORD	\N
937daf33-eeeb-469b-935a-174ddc4413f2	aopia	M.	test	H	06	Herizo Randria	WORD Basique (TOSA)	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	WORD Basique (TOSA)	WORD Basique (TOSA)	2026-07-08 12:06:05.133969	2026-07-08 12:23:36.702	-1	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"}}	\N	\N	\N	f	f	t	f					t	\N	1	\N	Digitales Compétences Basique (TOSA) + EXCEL Basique (TOSA) -> WORD Basique (TOSA)	Essentiels Digitales Compétences & Excel - P3	\N
300095b7-3b68-46ad-b659-31626151bbbb	aopia	M.	h	h	06	Herizo Randria	Anglais 	{"470":"Occasionnellement","473":"Occasionnellement ","477":"Oui","2109":"Oui avec quelques difficultés ","2632":"Non","2633":"Quotidiennement","2636":"Oui"}	{"Niveau A1":{"score":4,"total":6,"percentage":66.66666666666666,"requiredCorrect":6,"validated":false}}	Débutant	Niveau A2 - TOEIC & Niveau B1 - TOEIC	2026-07-08 15:00:13.045063	2026-07-08 15:01:30.51	0	{"40":"Non","41":"Non","42":null,"447":"Je vise un emploi pour lequel de nouvelles compétences me seront utiles"}	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Niveau A1":{"2123":"is","2124":"have","2125":"is","2126":"is","2127":"watches","2128":"is going"}}	z	["Salarié"]	{"2172":"Collège","2173":"Oui","2174":["Collègue"],"2175":"Régulier","2176":"Non","2177":[],"2448":null}	f	f	f	f					f	\N	1	\N		"Renforcement Anglais" (A2 & B1) - TOEIC	\N
3d140a96-f87d-47cc-a56b-6979d8000ffd	aopia	M.	a	a	06	Herizo Randria	EXCEL Basique (TOSA)	\N	{}	\N	\N	2026-07-09 10:15:38.799924	2026-07-09 10:16:50.993	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					t	\N	3	\N	\N	\N	\N
085bb15a-a592-4e5f-a635-a134e6adf42e	aopia	M.	h	h	h	herizo Randria	EXCEL Basique (TOSA)	\N	{"Initial":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	EXCEL Basique (TOSA)	EXCEL Basique (TOSA)	2026-07-08 21:36:44.807869	2026-07-08 21:37:42.123	-1	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Excel"}}	\N	\N	\N	f	f	t	f					t	\N	1	\N	Digitales Compétences Basique (TOSA) + WORD Basique (TOSA) -> EXCEL Basique (TOSA)	Essentiels Digitales Compétences & Word - P3	\N
eb08f7a3-993e-4362-aaee-7729a6fff279	aopia	M.	a	a	a	Herizo Randria	IA GENERATIVE (INKREA)	\N	{"Initial":{"score":2,"total":4,"percentage":50,"requiredCorrect":4,"validated":false}}	IA GENERATIVE (INKREA)	IA GENERATIVE (INKREA)	2026-07-12 22:20:03.294857	2026-07-12 22:20:48.316	-1	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"2519":"Illustrator permet d'agrandir un dessin à l'infini sans perte de qualité. ","2520":"La zone de calque.","2521":"Du dessin vectoriel ","2522":".JPG"}}	\N	\N	\N	f	f	t	f					t	\N	1	\N	ILLUSTRATOR Basique (TOSA) + ILLUSTRATOR Opérationnel (ICDL) -> IA GENERATIVE (INKREA)	Renforcement Illustrator - P3	\N
c14a0ef2-ed12-4982-b1a2-9ab244b324a5	aopia	M.	a	a	06	Herizo Randria	Excel + IA	\N	{}	\N	\N	2026-07-12 23:14:41.203398	2026-07-12 23:15:01.953	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
720f0c9a-28a4-4bd2-b2f0-b658c24bd509	aopia	M.	az	a	06	Herizo Randria	Excel + IA	\N	{"IA Générative ":{"score":0,"total":3,"percentage":0,"requiredCorrect":3,"validated":false}}	IA Générative 	Aucun parcours actif ne correspond à cette progression.	2026-07-12 23:55:14.501515	2026-07-12 23:55:35.563	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"IA Générative ":{"2647":"Une IA qui applique uniquement des règles programmées","2671":"Classer automatiquement des emails par expéditeur","2672":"Le résultat produit par l’IA"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
0fa0ef8f-4d51-4623-b258-ffd356c8a9cb	aopia	M.	a	a	06	Herizo Randria	Word Opérationnel (ICDL)	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Opérationnel":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true},"Avance":{"score":2,"total":5,"percentage":40,"requiredCorrect":5,"validated":false}}	Word Opérationnel (ICDL)	Word Opérationnel (ICDL)	2026-07-11 12:19:17.765246	2026-07-11 12:20:48.673	-1	\N	{"43":"Après-midi","2641":""}	\N	Opérationnel	t	{"Initial":{"2060":"A **rédiger** du contenu **traitement de texte**","2061":"**Fichier** > **Enregistrer sous**","2062":"**Insertion** > **Images **"},"Basique":{"2063":"CTRL + **S **","2064":"Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","2065":"Une **tabulation**","2066":"**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","2067":"Bleu"},"Opérationnel":{"2068":"**Accueil** > **Styles**","2069":"**Mise en page** > **Colonnes **","2070":".**DOTX**","2071":"**Copier** le tableau dans **Excel** > **Coller** de manière **spéciale** dans **Word **","2072":"**Références** > **Tables des matières **"},"Avance":{"2073":"En utilisant le principe du **document maître** et des **sous-documents**","2074":"La note de bas de page s’affiche **en bas de la page concernée**, tandis que la note de fin est **regroupée à la fin du document** ou d’une section","2075":"À avoir un **historique des différentes versions** du document","2076":"**Fichiers** > **Informations** > **Gérer le document**","2077":"Volet de **navigation**"}}	\N	\N	\N	f	f	t	f					t	\N	1	\N	Word Basique (TOSA) + Word Opérationnel (ICDL) -> Word Opérationnel (ICDL)	Renforcement Word - P3	\N
fb604117-be78-4947-be35-32d54f4cac96	aopia	M.	a	a	06	Herizo Randria	Excel	\N	{}	\N	\N	2026-07-10 14:32:38.706311	2026-07-10 14:35:36.62	\N	\N	\N	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
3eb32712-cc06-4b41-9918-562f6dfbcc5f	aopia	M.	A	H	06	Herizo Randria	Outlook	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Opérationnel":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Avancé":{"score":3,"total":5,"percentage":60,"requiredCorrect":4,"validated":false}}	Avancé	Outlook Basique (TOSA) | Digitales Compétences Opérationnel (TOSA)	2026-07-12 20:58:57.432627	\N	\N	\N	\N	\N	Opérationnel	t	{"Opérationnel":{"2591":"Clic droit sur Boîte de réception → Nouveau dossier ","2592":"Gestionnaire d’absence ","2593":"Envoyer une copie en préservant la confidentialité des adresses ","2594":"Dans les options du message ","2595":"Trier les messages"},"Avancé":{"2596":"Les mails restent synchronisés avec le serveur et accessibles depuis plusieurs appareils ","2597":"Le mettre en brouillon","2598":"Supprimer les emails","2599":"Règles → Créer une règle ","2600":"Depuis Contacts → Nouveau groupe "}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		Essentiels Digitales Compétences & Outlook	\N
c47c2987-cfe6-4d5e-9852-830b19ca57df	aopia	M.	a	a	a	Herizo Randria	SketchUp	\N	{}	\N	\N	2026-07-09 16:28:48.337648	2026-07-09 16:30:00.406	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
1675340c-36a9-4b5d-9655-f187c6333d67	aopia	M.	a	a	06	Herizo Randria	Anglais 	\N	{"Niveau A1":{"score":6,"total":6,"percentage":100,"requiredCorrect":6,"validated":true},"Niveau A2":{"score":5,"total":6,"percentage":83.33333333333334,"requiredCorrect":5,"validated":true},"Niveau B1":{"score":1,"total":6,"percentage":16.666666666666664,"requiredCorrect":5,"validated":false}}	Niveau A2	Niveau A2 - TOEIC & Niveau B1 - TOEIC	2026-07-13 01:12:55.742575	2026-07-13 01:13:49.32	0	\N	{"43":"Entre 12h et 14h","2641":""}	\N	Niveau A2	t	{"Niveau A1":{"2123":"is","2124":"have","2125":"is","2126":"is","2127":"is watching","2128":"goes"},"Niveau A2":{"15":"were","16":"was watching","17":"a few","18":"tallest","19":"as beautiful as","20":"went"},"Niveau B1":{"21":"during","22":"will have","23":"was building","24":"works","25":"had eaten","26":"drank"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		"Renforcement Anglais" (A2 & B1) - TOEIC	\N
99982f5a-f2b8-4931-9cfa-68fb8468c540	aopia	M.	a	a	06	Herizo Randria	Excel + IA	\N	{}	\N	\N	2026-07-12 23:15:40.924084	2026-07-12 23:16:02.989	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
ee54a3a5-1ff4-48ca-9ce2-20cdc7eb9348	aopia	M.	a	a	06	Herizo Randria	Word + IA	\N	{"IA Générative ":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	IA Générative 	Aucun parcours actif ne correspond à cette progression.	2026-07-13 00:34:09.74064	2026-07-13 00:34:35.32	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"IA Générative ":{"2673":"Classer automatiquement des emails par expéditeur","2674":"Une IA capable de créer du contenu à partir de données apprises ","2675":"Le résultat produit par l’IA"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
2daa6203-3728-445f-b316-86763770ba6b	aopia	M.	a	a	06	Herizo Randria	Google Docs	\N	{}	\N	\N	2026-07-12 22:25:53.239026	2026-07-12 22:26:22.804	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
b911a207-a065-41b9-a8d4-3a8951fa36a0	aopia	M.	a	a	06	Herizo Randria	Word + IA	\N	{"IA Générative ":{"score":0,"total":3,"percentage":0,"requiredCorrect":3,"validated":false}}	IA Générative 	Aucun parcours actif ne correspond à cette progression.	2026-07-12 23:57:12.440207	2026-07-12 23:57:32.236	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"IA Générative ":{"2673":"Classer automatiquement des emails par expéditeur","2674":"Une IA qui applique uniquement des règles programmées","2675":"Le résultat produit par l’IA"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
59576e90-c9a7-492a-9cca-f0364f2a96a5	aopia	M.	Her	test	06	Herizo Randria	WORD Basique (TOSA)	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Opérationnel":{"score":2,"total":5,"percentage":40,"requiredCorrect":4,"validated":false}}	WORD Basique (TOSA)	WORD Basique (TOSA)	2026-07-10 11:35:47.12047	2026-07-10 11:36:06.685	-1	{"40":"Non","41":"Non","42":null,"447":"Je vise un emploi pour lequel de nouvelles compétences me seront utiles"}	{"43":"Après-midi","2641":""}	\N	Basique	t	{"Initial":{"1975":"Une **cellule **","1976":"**=SOMME() **","1977":"Graphique **Camembert (Secteur) **"},"Basique":{"1978":"L'icône : **$**","1979":"A **afficher** les valeurs correspondant au filtre","1980":"**SI**()","1981":"Mise en forme **conditionnelle**","1982":"**AUJOURDHUI**()"},"Opérationnel":{"1983":"À **effacer** les valeurs **ne répondant pas** au critère","1984":"De **copier** et/ou **incrémenter** une valeur","1985":"Un **segment**","1986":"Données","1987":"Je **protège** le **classeur**"}}	\N	\N	\N	f	f	t	f					t	\N	1	\N	EXCEL Basique (TOSA) + EXCEL Opérationnel (ICDL) -> WORD Basique (TOSA)	Renforcement Excel - P3	\N
38f3e8c1-11f9-45fb-8bc6-9d750912f38b	aopia	M.	a	a	a	Herizo Randria	WordPress	\N	{"Initial":{"score":0,"total":4,"percentage":0,"requiredCorrect":4,"validated":false}}	Débutant	WordPress Basique (TOSA) & WordPress Operationnel (ICDL)	2026-07-13 00:38:31.965548	2026-07-13 00:40:05.383	0	\N	{"43":"Toute la journée","2641":""}	\N	Débutant	t	{"Initial":{"2079":"Un compte Facebook professionnel et une carte de visite avec un QR Code.","2080":"sur Google Play Store ou App Store","2081":"Un hébergeur de site web uniquement.","2082":"À protéger le site contre les attaques de pirates et les malwares."}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		Renforcement WORDPRESS	\N
5947dce9-c2f1-4c00-815a-3e73c9c2f2c6	aopia	M.	a	a	06	Herizo Randria	Outlook	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Opérationnel":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true},"Avancé":{"score":2,"total":5,"percentage":40,"requiredCorrect":4,"validated":false}}	Opérationnel	Outlook Basique (TOSA) & Outlook Opérationnel (ICDL)	2026-07-12 21:15:42.674391	2026-07-12 21:40:00.593	0	\N	{"43":"Entre 12h et 14h","2641":""}	\N	Opérationnel	t	{"Initial":{"2552":"à envoyer des e-mails ","2553":"Courrier, Calendrier et Contacts","2585":"Le dossier Courrier "},"Basique":{"2586":"Nouveau message ","2587":"Vérification orthographique ","2588":"En cliquant sur Accepter / Refuser ","2589":"Depuis le dossier Contacts → Nouveau contact ","2590":"Accueil"},"Opérationnel":{"2591":"Clic droit sur Boîte de réception → Nouveau dossier ","2592":"Gestionnaire d’absence ","2593":"Envoyer une copie en préservant la confidentialité des adresses ","2594":"Dans les options du message ","2595":"Utiliser la barre de recherche "},"Avancé":{"2596":"Les mails restent synchronisés avec le serveur et accessibles depuis plusieurs appareils ","2597":"Options → Différer la livraison ","2598":"Supprimer les emails","2599":"Menu Options","2600":"Depuis Calendrier"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		Essentiels Digitales Compétences & Outlook	\N
44d91c44-dac3-44c1-801d-a0ff512692f1	aopia	M.	a	PPT	06	Herizo Randria	PowerPoint Opérationnel (ICDL)	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":3,"total":5,"percentage":60,"requiredCorrect":4,"validated":false}}	PowerPoint Opérationnel (ICDL)	PowerPoint Opérationnel (ICDL)	2026-07-11 12:44:09.117653	2026-07-11 12:55:48.961	-1	\N	{"43":"Après-midi","2641":""}	\N	Initial	t	{"Initial":{"2607":"À créer des **présentations** avec des diapositives ","2609":["Un **tableau** ","Une **image**","Une **forme** "],"2610":"Créer un **diaporama** "},"Basique":{"2611":"**CTRL + D**","2612":"**D’appliquer** une mise en forme **générale** à toute la **présentation **","2613":"Un **espace réservé **","2614":"**Appliquer** un **style** prédéfini","2615":"**Insertion > Images **"}}	\N	\N	\N	f	f	t	f					t	\N	1	\N	Digitales Compétences Basique (TOSA) + PowerPoint Basique (TOSA) -> PowerPoint Opérationnel (ICDL)	Essentiels Digitales Compétences & PPT - P3	\N
d3a04940-76da-4a59-b29f-80de981c9569	aopia	M.	a	a	a	Herizo Randria	IA GENERATIVE (INKREA)	\N	{"Initial":{"score":0,"total":3,"percentage":0,"requiredCorrect":3,"validated":false}}	IA GENERATIVE (INKREA)	IA GENERATIVE (INKREA)	2026-07-10 14:51:58.78366	2026-07-10 14:52:34.492	-1	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"2333":"Créer des feuilles de calcul","2334":"Fichier > Enregistrer","2335":"Sur une clé USB"}}	\N	\N	\N	f	f	t	f					t	\N	1	\N	GOOGLE DOCS Opérationnel (ICDL) + GOOGLE SHEETS Opérationnel (ICDL) / GOOGLE SLIDES Opérationnel (ICDL) -> IA GENERATIVE (INKREA)	Bureautique Google (DOCS) - P3	\N
59798715-00af-45e2-b587-5e571b728e33	aopia	M.	a	a	06	Herizo Randria	Word Opérationnel (ICDL)	\N	{}	Word Opérationnel (ICDL)	Word Opérationnel (ICDL)	2026-07-13 00:00:10.795941	2026-07-13 00:05:55.464	-1	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					t	\N	3	\N	Digitales Compétences Basique (TOSA) + Word Basique (TOSA) -> Word Opérationnel (ICDL)	Essentiels Digitales Compétences & Word - P3	\N
7a7b2afb-67b7-4b54-b081-ee9d60d386ff	aopia	M.	a	a	06	Herizo Randria	Photoshop	\N	{}	\N	\N	2026-07-12 22:35:37.754279	2026-07-12 22:36:03.75	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
32706a8f-047d-431e-926a-5a383f4f22f9	aopia	M.	a	a	06	Herizo Randria	Word + IA	\N	{"IA Générative ":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	IA Générative 	Aucun parcours actif ne correspond à cette progression.	2026-07-12 23:18:11.981741	2026-07-12 23:18:31.141	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"IA Générative ":{"2673":"Générer automatiquement un texte ou une image à partir d’une demande ","2674":"Une IA qui applique uniquement des règles programmées","2675":"Le résultat produit par l’IA"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
db31e484-3540-4829-868b-ed6dea993149	aopia	M.	WORD	max	06	Herizo Randria	Word	{"470":"Occasionnellement","473":"Occasionnellement ","477":"Oui","2109":"Oui avec quelques difficultés ","2632":"Non","2633":"Quotidiennement","2636":"Oui"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Opérationnel":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true},"Avance":{"score":2,"total":5,"percentage":40,"requiredCorrect":5,"validated":false}}	Avance	TOSA WORD Basique | TOSA EXCEL Basique	2026-07-08 16:28:28.986093	\N	\N	\N	\N	\N	Opérationnel	f	{"Initial":{"2060":"A **rédiger** du contenu **traitement de texte**","2061":"**Fichier** > **Enregistrer sous**","2062":"**Insertion** > **Images **"},"Basique":{"2063":"CTRL + **S **","2064":"Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","2065":"Une **tabulation**","2066":"**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","2067":"Bleu"},"Opérationnel":{"2068":"**Accueil** > **Styles**","2069":"**Mise en page** > **Colonnes **","2070":".**DOTX**","2071":"**Copier** le tableau dans **Excel** > **Coller** de manière **spéciale** dans **Word **","2072":"**Références** > **Tables des matières **"},"Avance":{"2073":"En utilisant le principe du **document maître** et des **sous-documents**","2074":"La note de bas de page s’affiche **en bas de la page concernée**, tandis que la note de fin est **regroupée à la fin du document** ou d’une section","2075":"À avoir un **historique des différentes versions** du document","2076":"**Fichiers** > **Informations** > **Gérer le document**","2077":"Volet de **navigation**"}}	a	["Salarié"]	\N	f	f	f	f					f	\N	1	\N		Essentiels Digitales Compétences & WORD	\N
e217c1df-6de5-4274-b5eb-d19f777d2f63	aopia	M.	h	h	h	herizo Randria	WORD Basique (TOSA)	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	WORD Basique (TOSA)	WORD Basique (TOSA)	2026-07-08 22:13:27.814822	2026-07-08 22:14:16.8	-1	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"}}	\N	\N	\N	f	f	t	f					t	\N	1	\N	Digitales Compétences Basique (TOSA) + EXCEL Basique (TOSA) -> WORD Basique (TOSA)	Essentiels Digitales Compétences & Excel - P3	\N
25d7734e-1ef9-4895-ad08-55c227ff2c27	aopia	M.	a	a	06	BOYÉ Simon	\N	\N	\N	\N	\N	2026-07-13 00:06:12.250515	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
06a35703-7bb7-4004-80b5-b9786c47ca57	aopia	M.	j	j	j	Herizo Randria	IA GENERATIVE (INKREA)	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":1,"total":5,"percentage":20,"requiredCorrect":3,"validated":false}}	IA GENERATIVE (INKREA)	IA GENERATIVE (INKREA)	2026-07-08 16:54:37.029675	2026-07-08 20:08:04.238	-1	\N	{"43":"Après-midi","2641":""}	\N	Initial	t	{"Initial":{"1998":"Éditer des images ","1999":"La plus petite unité d’une image ","2000":"La sauvegarder "},"Basique":{"2001":"Photo compressée ","2002":"Ajouter un texte","2003":"Supprimer une couleur","2004":"Ajouter un filtre","2005":"Il n’y a aucune différence"}}	\N	\N	\N	f	f	t	f					t	\N	1	\N	GIMP Opérationnel (ICDL) + ILLUSTRATOR Opérationnel (TOSA) -> IA GENERATIVE (INKREA)	Création graphique - P3	\N
1dea9ce1-b7d6-489b-98e3-eaa448afe396	aopia	M.	j	a	06	Herizo Randria	Gimp	\N	{"Initial":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	Débutant	ICDL GIMP Opérationnel & TOSA ILLUSTRATOR Opérationnel	2026-07-08 16:52:11.401659	2026-07-08 16:52:51.049	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1998":"Créer des vidéos","1999":"Une couleur automatique","2000":"La sauvegarder "}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		Création Graphique	\N
32d70ad3-51f6-47e9-b59d-aeffff1df63f	aopia	M.	H	h	06	Herizo Randria	PowerPoint	\N	{}	\N	\N	2026-07-08 20:08:20.502102	2026-07-08 20:09:03.452	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
470ba529-ef78-44e6-8c04-e2d2614f94b7	aopia	M.	az	a	06	Herizo Randria	Word	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Opérationnel":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true},"Avance":{"score":2,"total":5,"percentage":40,"requiredCorrect":5,"validated":false}}	Avance		2026-07-10 14:54:14.793801	\N	\N	\N	\N	\N	Opérationnel	t	{"Initial":{"2060":"A **rédiger** du contenu **traitement de texte**","2061":"**Fichier** > **Enregistrer sous**","2062":"**Insertion** > **Images **"},"Basique":{"2063":"CTRL + **S **","2064":"Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","2065":"Une **tabulation**","2066":"**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","2067":"Bleu"},"Opérationnel":{"2068":"**Accueil** > **Styles**","2069":"**Mise en page** > **Colonnes **","2070":".**DOTX**","2071":"**Copier** le tableau dans **Excel** > **Coller** de manière **spéciale** dans **Word **","2072":"**Références** > **Tables des matières **"},"Avance":{"2073":"En utilisant le principe du **document maître** et des **sous-documents**","2074":"La note de bas de page s’affiche **en bas de la page concernée**, tandis que la note de fin est **regroupée à la fin du document** ou d’une section","2075":"À proposer une **relecture** du document afin de **le vérifier**","2076":"**Fichiers** > **Informations** > **Gérer le document**","2077":"Sélectionner les **objets**"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N	Votre niveau ne correspond pas à cette formation. Nous vous invitons à choisir une formation plus adaptée.	Renforcement WORD	\N
f7979f8b-3e17-48fb-9575-9dfdd256a23a	aopia	M.	a	a	06	Herizo Randria	Word + IA	\N	{"IA Générative ":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	IA Générative 	Aucun parcours actif ne correspond à cette progression.	2026-07-12 23:21:20.933056	2026-07-12 23:21:45.015	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"IA Générative ":{"2673":"Générer automatiquement un texte ou une image à partir d’une demande ","2674":"Une IA qui applique uniquement des règles programmées","2675":"Le résultat produit par l’IA"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
cee18b3a-72dc-49b8-aaa3-a19ed7ce5657	aopia	M.	a	a	H	Herizo Randria	SketchUp	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Débutant	SketchUp Opérationnel (ICDL) & Gimp Opérationnel (ICDL)	2026-07-12 22:44:49.250512	2026-07-12 22:45:12.583	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"2014":"Modélisation 3D","2015":"Colorier un objet","2016":"Dessiner une surface plane"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		Création visuels : 3D / Images	\N
214c9ecc-395f-4f72-8a89-d5963e25ed9e	aopia	M.	a	a	06	Herizo Randria	Outils Collaboratifs Google	\N	{"Initial":{"score":0,"total":3,"percentage":0,"requiredCorrect":3,"validated":false}}	Débutant	Outils Collaboratifs Google Basique (TOSA)	2026-07-13 00:06:17.742961	2026-07-13 00:16:31.149	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"2387":"Google Docs","2388":"Google Docs","2389":"Via Google Drive"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	Digitales Compétences Basique (TOSA) + Excel Basique (TOSA) -> Outils Collaboratifs Google Basique (TOSA)	Essentiels Digitales Compétences & Excel - P3	\N
8bc54975-f0ff-4581-97db-eb7c2a4ebcb9	aopia	M.	a	a	06	Herizo Randria	Excel + IA	\N	{"IA Générative ":{"score":0,"total":3,"percentage":0,"requiredCorrect":3,"validated":false}}	IA Générative 	Aucun parcours actif ne correspond à cette progression.	2026-07-13 00:16:53.853575	2026-07-13 00:17:12.214	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"IA Générative ":{"2647":"Une IA qui applique uniquement des règles programmées","2671":"Classer automatiquement des emails par expéditeur","2672":"Le résultat produit par l’IA"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
7a85d993-e84d-4b55-abc4-9160ea9f1a5d	aopia	M.	a	a	06	Herizo Randria	Excel	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":3,"total":5,"percentage":60,"requiredCorrect":4,"validated":false}}	Initial	EXCEL Basique (TOSA)	2026-07-10 10:43:51.956572	2026-07-10 10:44:56.819	0	\N	{"43":"Après-midi","2641":""}	\N	Initial	t	{"Initial":{"1975":"Une **cellule **","1976":"**=SOMME() **","1977":"Graphique **Camembert (Secteur) **"},"Basique":{"1978":"L'icône : **$**","1979":"A **ordonner** les valeurs en fonction du filtre","1980":"**SI**()","1981":"Mise en forme **conditionnelle**","1982":"**AUJOURDHUI**()"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	Digitales Compétences Basique (TOSA) + WORD Basique (TOSA) -> EXCEL Basique (TOSA)	Essentiels Digitales Compétences & Word - P3	\N
bbf4a03c-c907-4b3e-b2ee-02a10f6f259c	aopia	M.	a	a	06	Herizo Randria	Outlook	\N	{"Initial":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	Débutant	OUTLOOK Basique (TOSA)	2026-07-09 13:26:20.712357	2026-07-09 13:34:42.527	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"2552":"à créer des tableaux ","2553":"Tâches avancées et Règles automatiques","2585":"Le dossier Courrier "}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	Digitales Compétences Basique (TOSA) + PPT Basique (TOSA) -> OUTLOOK Basique (TOSA)	Essentiels Digitales Compétences & PPT - P3	\N
e7fd1df1-58c4-441b-8d30-cfdf4835b1ad	aopia	M.	H	h	06	Herizo Randria	EXCEL Basique (TOSA)	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	EXCEL Basique (TOSA)	EXCEL Basique (TOSA)	2026-07-09 11:06:38.42185	2026-07-09 11:07:36.158	-1	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"}}	\N	\N	\N	f	f	t	f					t	\N	1	\N	Digitales Compétences Basique (TOSA) + PPT Basique (TOSA) -> EXCEL Basique (TOSA)	Essentiels Digitales Compétences & PPT - P3	\N
118fdf08-1892-4d64-a024-a715dc4e7b6d	aopia	M.	a	a	06	Herizo Randria	EXCEL Basique (TOSA)	\N	{}	\N	\N	2026-07-09 11:22:35.909205	2026-07-09 11:22:58.671	\N	\N	{"43":"Matin","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
f7e1c349-b28d-4a38-b0fa-a9811d4c62a4	aopia	M.	a	a	06	Herizo Randria	SKETCHUP Opérationnel (ICDL)	\N	{}	SKETCHUP Opérationnel (ICDL)	SKETCHUP Opérationnel (ICDL)	2026-07-09 14:34:28.22943	2026-07-09 15:51:12.179	-1	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					t	\N	3	\N	PHOTOSHOP basique (TOSA) + PHOTOSHOP Opérationnel (ICDL) -> SKETCHUP Opérationnel (ICDL)	Renforcement Photoshop - P3	\N
bade2d0a-c201-43d7-9680-758254f993e3	aopia	M.	a	a	06	Herizo Randria	IA GENERATIVE (INKREA)	\N	{}	IA GENERATIVE (INKREA)	IA GENERATIVE (INKREA)	2026-07-09 15:51:38.91342	2026-07-09 15:53:40.819	-1	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					t	\N	3	\N	PHOTOSHOP basique (TOSA) + PHOTOSHOP Opérationnel (ICDL) -> IA GENERATIVE (INKREA)	Renforcement Photoshop - P3	\N
696bae26-69e3-49a3-a5f9-e9b9fd71570e	aopia	M.	D	d	06	Herizo Randria	Excel	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Opérationnel":{"score":2,"total":5,"percentage":40,"requiredCorrect":4,"validated":false}}	Opérationnel	EXCEL Opérationnel (ICDL)	2026-07-09 12:33:43.812788	2026-07-09 12:34:28.784	\N	\N	{"43":"Après-midi","2641":""}	\N	Basique	t	{"Initial":{"1975":"Une **cellule **","1976":"**=SOMME() **","1977":"Graphique **Camembert (Secteur) **"},"Basique":{"1978":"L'icône : **$**","1979":"A **afficher** les valeurs correspondant au filtre","1980":"**SI**()","1981":"Mise en forme **conditionnelle**","1982":"**AUJOURDHUI**()"},"Opérationnel":{"1983":"À **mettre en évidence** les valeurs","1984":"De **copier** et/ou **incrémenter** une valeur","1985":"Un **segment**","1986":"Affichage","1987":"Je **protège** le **classeur**"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N		Renforcement EXCEL	\N
775f085c-0296-4024-b3df-aa8b840d98e5	aopia	M.	H	a	06	Herizo Randria	SketchUp	\N	{}	\N	\N	2026-07-09 16:56:53.929742	2026-07-09 16:57:13.006	\N	\N	{"43":"Matin","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
5003c2b1-d7f2-489d-b671-3c6add9ed62d	aopia	M.	a	a	06	Herizo Randria	SketchUp	\N	{}	\N	\N	2026-07-09 15:59:18.998195	2026-07-09 15:59:44.627	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
637699ec-b232-4795-b679-0052a8c89c40	aopia	M.	Z	Z	A	Herizo Randria	Digitales Compétences	\N	{}	\N	\N	2026-07-09 12:18:51.882595	2026-07-09 12:19:34.122	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
d85c4867-c243-4377-9069-0bb25bde0a14	aopia	M.	a	a	06	Herizo Randria	Gimp	\N	{}	\N	\N	2026-07-10 11:01:51.778214	2026-07-10 11:02:44.622	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	{"2517":"Régulièrement ","2518":"Oui"}	f	f	t	f					f	\N	3	\N	\N	\N	\N
c426cacf-e3ed-49a1-bdab-cb742312f0cf	aopia	M.	a	a	06	Herizo Randria	SketchUp	\N	{}	\N	\N	2026-07-09 16:49:01.879575	2026-07-09 16:54:25.514	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					t	\N	3	\N	\N	\N	\N
b5aae2cf-e2d5-4e86-9e4d-2cd2648be2ab	aopia	M.	a	a	06	Herizo Randria	IA GENERATIVE (INKREA)	\N	{}	IA GENERATIVE (INKREA)	IA GENERATIVE (INKREA)	2026-07-09 16:55:59.827433	2026-07-09 16:56:38.209	-1	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					t	\N	3	\N	ILLUSTRATOR Basique (TOSA) + ILLUSTRATOR Opérationnel (ICDL) -> IA GENERATIVE (INKREA)	Renforcement Illustrator - P3	\N
8a0539b9-3576-42f7-968f-de24181343b0	aopia	M.	H	h	a	Herizo Randria	SketchUp	\N	{"Initial":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	Débutant	SKETCHUP Opérationnel (ICDL)	2026-07-09 17:00:32.65094	2026-07-10 10:25:32.833	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"2014":"Retouche photo","2015":"Supprimer un fichier","2016":"Dessiner une surface plane"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	GIMP Opérationnel (ICDL) + ILLUSTRATOR Opérationnel (TOSA) -> SKETCHUP Opérationnel (ICDL)	Création visuels 3D - P3	\N
4080b10a-dfaf-42fc-bdd1-ff42dd573e27	aopia	M.	j	j	j	Herizo Randria	Gimp	\N	{}	\N	\N	2026-07-10 10:46:45.122568	2026-07-10 10:47:07.666	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	{"2517":"Régulièrement ","2518":"Oui"}	f	f	t	f					f	\N	3	\N	\N	\N	\N
8eaad681-fa64-4243-9af9-502b94a9dcd0	aopia	M.	az	a	06	Herizo Randria	Excel	\N	{}	\N	\N	2026-07-10 11:30:21.810705	\N	\N	\N	\N	\N	\N	f	{}	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
75ca7721-5a39-463d-85b9-4d03844c8c02	aopia	M.	a	a	06	Herizo Randria	SketchUp	\N	{"Initial":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	Initial	SketchUp (Excel + IA)	2026-07-12 22:52:05.067468	2026-07-12 22:52:32.683	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"2014":"Retouche photo","2015":"Choisir un élément du modèle","2016":"Mesurer une distance"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	SketchUp Opérationnel (ICDL) + Gimp Opérationnel (ICDL) -> SketchUp (Excel + IA)	Création visuels : 3D/Images - P3	\N
84cf42a0-50a6-4ee7-88eb-ad5d562158e5	aopia	M.	a	a	06	Herizo Randria	SketchUp	\N	{"Initial":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	Débutant	SketchUp (ICDL)	2026-07-13 01:01:06.537623	2026-07-13 01:03:25.932	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"2014":"Montage vidéo","2015":"Colorier un objet","2016":"Dessiner une surface plane"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	Photoshop Basique (TOSA) + Photoshop Opérationnel  (ICDL) -> SketchUp (ICDL)	Renforcement Photoshop - P3	\N
2b951591-4002-48be-85ef-6ec3ab8a6ff2	aopia	M.	Her	test	06	Herizo Randria	WORD Basique (TOSA)	{"470":"Quotidiennement ","473":"Occasionnellement ","477":"Oui avec quelques difficultés ","2109":"Oui","2632":"Non","2633":"Occasionnellement","2636":"Oui"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Opérationnel":{"score":2,"total":5,"percentage":40,"requiredCorrect":4,"validated":false}}	WORD Basique (TOSA)	WORD Basique (TOSA)	2026-07-10 11:32:45.630343	2026-07-10 11:34:17.063	-1	{"40":"Non","41":"Non","42":null,"447":"Je vise un emploi pour lequel de nouvelles compétences me seront utiles"}	{"43":"Après-midi","2641":""}	\N	Basique	t	{"Initial":{"1975":"Une **cellule **","1976":"**=SOMME() **","1977":"Graphique **Camembert (Secteur) **"},"Basique":{"1978":"L'icône : **$**","1979":"A **afficher** les valeurs correspondant au filtre","1980":"**SI**()","1981":"Mise en forme **conditionnelle**","1982":"**AUJOURDHUI**()"},"Opérationnel":{"1983":"À **effacer** les valeurs **ne répondant pas** au critère","1984":"De **copier** et/ou **incrémenter** une valeur","1985":"Un **segment**","1986":"Données","1987":"Je **protège** le **classeur**"}}	test	["Salarié"]	\N	f	f	t	f					t	\N	1	\N	EXCEL Basique (TOSA) + EXCEL Opérationnel (ICDL) -> WORD Basique (TOSA)	Renforcement Excel - P3	\N
deb947b4-f636-44d1-8d6b-c8445c426126	aopia	M.	Her	test	06	Herizo Randria	\N	{"470":"Quotidiennement ","473":"Occasionnellement ","477":"Oui avec quelques difficultés ","2109":"Oui","2632":"Non","2633":"Occasionnellement","2636":"Oui"}	\N	\N	\N	2026-07-10 11:35:47.072835	\N	\N	\N	\N	\N	\N	f	\N	test	["Salarié"]	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
7ae130c6-4867-446f-9aaf-9d5a30d03a92	aopia	M.	Anglais	B1-Test	06 06 06 06 06		Anglais 	\N	{"Niveau A1":{"score":6,"total":6,"percentage":100,"requiredCorrect":6,"validated":true},"Niveau A2":{"score":5,"total":6,"percentage":83.33333333333334,"requiredCorrect":5,"validated":true},"Niveau B1":{"score":5,"total":6,"percentage":83.33333333333334,"requiredCorrect":5,"validated":true}}	\N	\N	2026-07-10 13:07:16.002228	\N	\N	\N	\N	\N	Niveau B1	f	{"Niveau A1":{"2123":"is","2124":"have","2125":"is","2126":"is","2127":"is watching","2128":"goes"},"Niveau A2":{"15":"were","16":"was watching","17":"a few","18":"tallest","19":"as beautiful as","20":"went"},"Niveau B1":{"21":"since","22":"had","23":"was built","24":"has worked","25":"had eaten","26":"drank"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		\N	\N
6c28a208-563a-4c00-b6e4-95015b841f59	aopia	M.	Anglais	a	06	Herizo Randria	Niveau B2 - TOEIC	{"470":"Occasionnellement","473":"Quotidiennement ","477":"Oui","2109":"Oui avec quelques difficultés ","2632":"Oui","2633":"Occasionnellement","2636":"Oui avec quelques difficultés"}	{"Niveau A1":{"score":3,"total":6,"percentage":50,"requiredCorrect":6,"validated":false}}	Niveau B2 - TOEIC	Niveau B2 - TOEIC	2026-07-10 11:50:20.457924	2026-07-10 12:33:30.997	-1	{"40":"Non","41":"Non","42":null,"447":"Je vise un emploi pour lequel de nouvelles compétences me seront utiles"}	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Niveau A1":{"2123":"is","2124":"have","2125":"are","2126":"have","2127":"watches","2128":"goes"}}	a	["Salarié"]	{"2172":"Collège","2173":"Oui","2174":["Clientèle"],"2175":"Régulier","2176":"Oui","2177":["Voyages","Lecture"],"2448":"Régulier"}	f	f	t	f					t	\N	1	\N	Niveau A2 - TOEIC + Niveau B1 - TOEIC -> Niveau B2 - TOEIC	"Renforcement Anglais" (A2 & B1) - TOEIC - P3	\N
596e3c6b-758d-482a-aa5b-dc9d1c2167c0	aopia	M.	Anglais	A2-Test	06 06 06 06 06		\N	\N	\N	\N	\N	2026-07-10 13:00:10.671262	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
9f20d09c-3e0f-4757-916a-90fd2223dbb4	aopia	M.	Anglais	B1-Test	06 06 06 06 06		\N	\N	\N	\N	\N	2026-07-10 13:00:10.631394	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
c74b27ef-33e5-4383-a97d-954703c9deca	aopia	M.	Anglais	C1-Test	06 06 06 06 06		\N	\N	\N	\N	\N	2026-07-10 13:00:10.688394	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
e6b8f2a0-8df5-43d3-b657-8ccf3f212c5c	aopia	M.	Anglais	B2-Test	06 06 06 06 06		\N	\N	\N	\N	\N	2026-07-10 13:00:10.847544	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
d5bf63cc-15b2-4184-8005-c02922d928e7	aopia	M.	Anglais	A2-Test	06 06 06 06 06		\N	\N	\N	\N	\N	2026-07-10 13:01:59.475284	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
4ec0335a-ec38-4614-bbf5-6eff640123de	aopia	M.	Anglais	B1-Test	06 06 06 06 06		\N	\N	\N	\N	\N	2026-07-10 13:02:24.588359	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
565244bc-df14-4d0a-9261-1da8075b0df9	aopia	M.	Anglais	B2-Test	06 06 06 06 06		\N	\N	\N	\N	\N	2026-07-10 13:02:48.565443	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
8962b45d-a36f-4907-9bd5-0f7e468af84b	aopia	M.	Anglais	C1-Test	06 06 06 06 06		\N	\N	\N	\N	\N	2026-07-10 13:03:12.603936	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
e76cde15-47be-4891-9b8c-455e00ce8661	aopia	M.	az	a	06	Herizo Randria	Word + IA	\N	{"IA Générative ":{"score":0,"total":3,"percentage":0,"requiredCorrect":3,"validated":false}}	IA Générative 	Aucun parcours actif ne correspond à cette progression.	2026-07-13 00:19:04.190929	2026-07-13 00:19:24.169	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"IA Générative ":{"2673":"Rechercher une information sur Internet","2674":"Une IA qui applique uniquement des règles programmées","2675":"Une base de données"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
e7b7b164-f0fa-4fa7-b127-768317a58683	aopia	M.	Anglais	A2-Test	06 06 06 06 06		Anglais 	\N	{"Niveau A1":{"score":6,"total":6,"percentage":100,"requiredCorrect":6,"validated":true}}	\N	\N	2026-07-10 13:05:43.796509	\N	\N	\N	\N	\N	Niveau A1	f	{"Niveau A1":{"2123":"is","2124":"have","2125":"is","2126":"is","2127":"is watching","2128":"goes"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		\N	\N
8af0a5cf-4b45-4f8b-bcd1-6e105bc93d08	aopia	M.	Anglais	C1-Test	06 06 06 06 06		Anglais 	\N	{"Niveau A1":{"score":6,"total":6,"percentage":100,"requiredCorrect":6,"validated":true},"Niveau A2":{"score":5,"total":6,"percentage":83.33333333333334,"requiredCorrect":5,"validated":true},"Niveau B1":{"score":5,"total":6,"percentage":83.33333333333334,"requiredCorrect":5,"validated":true}}	\N	\N	2026-07-10 13:10:17.118314	\N	\N	\N	\N	\N	Niveau B1	f	{"Niveau A1":{"2123":"is","2124":"have","2125":"is","2126":"is","2127":"is watching","2128":"goes"},"Niveau A2":{"15":"were","16":"was watching","17":"a few","18":"tallest","19":"as beautiful as","20":"went"},"Niveau B1":{"21":"since","22":"had","23":"was built","24":"has worked","25":"had eaten","26":"drank"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		\N	\N
27ebee49-5a32-4532-a19c-38396066467e	aopia	M.	Anglais	B2-Test	06 06 06 06 06		Anglais 	\N	{"Niveau A1":{"score":6,"total":6,"percentage":100,"requiredCorrect":6,"validated":true},"Niveau A2":{"score":5,"total":6,"percentage":83.33333333333334,"requiredCorrect":5,"validated":true},"Niveau B1":{"score":5,"total":6,"percentage":83.33333333333334,"requiredCorrect":5,"validated":true}}	\N	\N	2026-07-10 13:08:45.784446	\N	\N	\N	\N	\N	Niveau B1	f	{"Niveau A1":{"2123":"is","2124":"have","2125":"is","2126":"is","2127":"is watching","2128":"goes"},"Niveau A2":{"15":"were","16":"was watching","17":"a few","18":"tallest","19":"as beautiful as","20":"went"},"Niveau B1":{"21":"since","22":"had","23":"was built","24":"has worked","25":"had eaten","26":"drank"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		\N	\N
f3ef8b0f-50c6-4fe2-9f74-2e8a79642b3a	aopia	M.	a	a	06	Herizo Randria	Excel + IA	\N	{"IA Générative ":{"score":0,"total":3,"percentage":0,"requiredCorrect":3,"validated":false}}	IA Générative 	Aucun parcours actif ne correspond à cette progression.	2026-07-10 14:46:57.9642	2026-07-10 14:47:19.239	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"IA Générative ":{"2647":"Une IA qui applique uniquement des règles programmées","2671":"Classer automatiquement des emails par expéditeur","2672":"Le résultat produit par l’IA"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
7f2daea0-4779-4ca1-9bfc-cb7d8bcb1cb1	aopia	M.	WORD	oa	06	Herizo Randria	Excel	\N	{}	Inconnu	Digitales Compétences Basique (TOSA) & EXCEL Basique (TOSA)	2026-07-10 14:45:09.428946	2026-07-10 14:46:48.874	0	\N	\N	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	Essentiels Digitales Compétences & EXCEL	\N
f10aa74e-6833-4457-8372-f44993b86817	aopia	M.	a	a	a	Herizo Randria	Word	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Opérationnel":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true},"Avance":{"score":2,"total":5,"percentage":40,"requiredCorrect":5,"validated":false}}	Avance	Renforcement WORD | Perfectionnement WORD + EXCEL	2026-07-10 15:43:44.321109	\N	\N	\N	\N	\N	Opérationnel	t	{"Initial":{"2060":"A **rédiger** du contenu **traitement de texte**","2061":"**Fichier** > **Enregistrer sous**","2062":"**Insertion** > **Images **"},"Basique":{"2063":"CTRL + **S **","2064":"Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","2065":"Une **tabulation**","2066":"**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","2067":"Bleu"},"Opérationnel":{"2068":"**Accueil** > **Styles**","2069":"**Mise en page** > **Colonnes **","2070":".**DOTX**","2071":"**Copier** le tableau dans **Excel** > **Coller** de manière **spéciale** dans **Word **","2072":"**Références** > **Tables des matières **"},"Avance":{"2073":"En utilisant le principe du **document maître** et des **sous-documents**","2074":"La note de bas de page s’affiche **en bas de la page concernée**, tandis que la note de fin est **regroupée à la fin du document** ou d’une section","2075":"À avoir un **historique des différentes versions** du document","2076":"**Fichiers** > **Informations** > **Gérer le document**","2077":"Volet de **navigation**"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		\N	[{"id":483,"title":"Renforcement WORD","recommendations":["WORD Basique (TOSA)","WORD Opérationnel (ICDL)"],"explanationMessage":""},{"id":484,"title":"Perfectionnement WORD + EXCEL","recommendations":["WORD Opérationnel (TOSA)","EXCEL Opérationnel (TOSA)"],"explanationMessage":""}]
58ec2b2e-58c9-43ad-a038-dce0ead0653c	aopia	M.	H	h	a	Herizo Randria	Word	\N	{}	\N	\N	2026-07-10 15:38:47.304786	\N	\N	\N	\N	\N	\N	t	{}	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
91abfc20-06e2-4a09-8d09-470c533dabb6	aopia	M.	a	a	06	Herizo Randria	Word	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":1,"total":5,"percentage":20,"requiredCorrect":4,"validated":false}}	Basique	Digitales Compétences Basique (TOSA) | Word Basique (TOSA)	2026-07-10 16:25:30.48462	\N	\N	\N	\N	\N	Initial	f	{"Basique":{"2063":"CTRL + **E**","2064":"Sélectionner les cellules puis **Accueil** > **Couleur de surlignage**","2065":"Des **espaces**","2066":"**Double clic** dans la partie la plus **haute** de la page puis **Insérer** une image","2067":"Vert"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		Essentiels Digitales Compétences & WORD	\N
3ad7f458-db39-4b0a-8a64-cb6ad4a58cfd	aopia	M.	a	a	06	Herizo Randria	Excel + IA	\N	{"IA Générative ":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Initial":{"score":0,"total":3,"percentage":0,"requiredCorrect":3,"validated":false}}	Initial	Aucun parcours actif ne correspond à cette progression.	2026-07-13 01:03:34.964333	2026-07-13 01:04:12.242	\N	\N	{"43":"Après-midi","2641":""}	\N	IA Générative 	t	{"IA Générative ":{"2647":"Une IA capable de créer du contenu à partir de données apprises ","2671":"Générer automatiquement un texte ou une image à partir d’une demande ","2672":"La question ou la consigne donnée à l’IA"},"Initial":{"2653":"**=NBVAL()**","2654":"**Graphique Combiné**","2655":"Un **bloc**"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
b480d3c0-2c0a-41df-980d-6b3de25f45d6	aopia	M.	h	hh	h	Herizo Randria	Word	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":3,"total":5,"percentage":60,"requiredCorrect":4,"validated":false}}	Basique	Digitales Compétences Basique (TOSA) | Word Basique (TOSA)	2026-07-10 15:54:02.631615	\N	\N	\N	\N	\N	Initial	t	{"Initial":{"2060":"A **rédiger** du contenu **traitement de texte**","2061":"**Fichier** > **Enregistrer sous**","2062":"**Insertion** > **Images **"},"Basique":{"2063":"**F7**","2064":"Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","2065":"Une **tabulation**","2066":"**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","2067":"Bleu"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		Essentiels Digitales Compétences & WORD	\N
8f099588-4fd4-4b0f-91cb-3974924aec7c	aopia	M.	a	a	06	Herizo Randria	Illustrator	\N	{}	\N	\N	2026-07-11 11:19:00.17929	2026-07-11 11:19:40.054	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
e541150f-57c3-4b77-b909-9a24a0a07b6c	aopia	M.	aq	a	06	Herizo Randria	Illustrator	\N	{}	\N	\N	2026-07-12 22:55:31.163168	2026-07-12 22:55:54.163	\N	\N	{"43":"Entre 12h et 14h","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
f129de7d-6e98-484f-b9a6-ce01379462b5	aopia	M.	a	a	a	Herizo Randria	Word + IA	\N	{"IA Générative ":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	IA Générative 	Aucun parcours actif ne correspond à cette progression.	2026-07-13 00:23:03.369012	2026-07-13 00:23:22.709	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"IA Générative ":{"2673":"Générer automatiquement un texte ou une image à partir d’une demande ","2674":"Une IA capable de créer du contenu à partir de données apprises ","2675":"Le résultat produit par l’IA"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
66f1dfb4-37a6-4fb3-84a7-005b118be204	aopia	M.	a	a	06	Herizo Randria	WordPress	\N	{"Initial":{"score":4,"total":4,"percentage":100,"requiredCorrect":4,"validated":true},"Basique":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true},"Operationnel":{"score":5,"total":5,"percentage":100,"requiredCorrect":4,"validated":true}}	Operationnel	Word Basique (TOSA) & Word Opérationnel (ICDL)	2026-07-11 10:39:59.987934	2026-07-11 11:11:42.144	0	\N	{"43":"Après-midi","2641":""}	\N	Operationnel	t	{"Initial":{"2079":"Un nom de domaine (l'adresse du site) et un hébergement (l'espace de stockage sur un serveur).","2080":"Sur site officiel : https://fr.wordpress.org/","2081":"Un outil (CMS) qui permet de créer et gérer un site web sans forcément coder.","2082":"À définir l'apparence visuelle, la mise en page et le design du site."},"Basique":{"2083":"Ajouter des fonctionnalités à WordPress","2084":"Dans la gestion de votre compte via le tableau de bord de WordPress.","2085":"La Page est pour du contenu dit statique (Contact, À propos), l'Article est pour du contenu chronologique (Actualités).","2086":"Dans l'onglet Extensions\\" (Plugins).","2087":"Personnaliser le thème."},"Operationnel":{"2088":"À définir la structure des adresses URL des pages","2089":"L'élément de navigation qui permet aux visiteurs d'accéder aux différentes pages.","2090":"Publier des contenus actualisés qui s'affichent par ordre chronologique, du plus récent au plus ancien.","2091":"wp-include/wp-plugins","2092":"www.mon-site.com/exemple-article"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N		Renforcement WORDPRESS	\N
84192182-053f-4daf-a623-5d0cf5de8341	aopia	M.	h	a	06	Herizo Randria	Illustrator	\N	{}	\N	\N	2026-07-11 11:16:01.344652	2026-07-11 11:16:55.106	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
0ddc4d1c-0f1c-40de-ab6f-988215aa079a	aopia	M.	a	a	06	Herizo Randria	Excel + IA	\N	{"IA Générative ":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	IA Générative 	Aucun parcours actif ne correspond à cette progression.	2026-07-13 00:25:22.883494	2026-07-13 00:25:45.781	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"IA Générative ":{"2647":"Une IA capable de créer du contenu à partir de données apprises ","2671":"Générer automatiquement un texte ou une image à partir d’une demande ","2672":"Une base de données"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
db6b52bd-2594-42e7-a27d-6abcbb4a58c2	aopia	M.	a	a	06	Herizo Randria	Excel	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Débutant	Excel Basique (TOSA)	2026-07-11 12:12:42.182123	2026-07-11 12:14:32.094	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1975":"Une **cellule **","1976":"**=SOMME() **","1977":"**Graphique Combiné**"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	Word Basique (TOSA) + Word Opérationnel (ICDL) -> Excel Basique (TOSA)	Renforcement Word - P3	\N
05dec710-3a65-41e0-ab5a-36eb026f91a4	aopia	M.	a	a	06	Herizo Randria	Google Sheets	\N	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Opérationnel":{"score":3,"total":5,"percentage":60,"requiredCorrect":4,"validated":false}}	Basique	Google Sheets Opérationnel (ICDL) & Google Docs Opérationnel (ICDL)	2026-07-12 21:43:02.967555	2026-07-12 21:44:58.186	0	\N	{"43":"Après-midi","2641":""}	\N	Basique	t	{"Initial":{"2351":"Une cellule","2352":"Il n’y a rien à faire, l’enregistrement est automatique","2353":"C4"},"Basique":{"2354":"=SOMME(A1:A5)","2355":"À copier ou incrémenter une valeur ou une formule","2356":"Cliquer sur la première cellule puis maintenir Maj et cliquer sur la dernière","2357":"Données > Trier la plage","2358":"AUJOURDHUI()"},"Opérationnel":{"2359":"$","2360":"=SI(A1>=10;”Admis”;”Ajourné”)","2361":"Mise en forme conditionnelle","2362":"Histogramme","2363":"Une division par zéro a été effectuée"}}	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	Google WORKSPACE (SHEETS & DOCS)	\N
8151a910-72af-4caa-8bb8-70a2cbb6372d	aopia	M.	a	a	06	Herizo Randria	PowerPoint	\N	{}	\N	\N	2026-07-11 11:29:30.626198	2026-07-11 11:29:53.469	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
e48a8240-cf92-4f50-88f4-aea2068ae06c	aopia	M.	a	a	06	Herizo Randria	IA GENERATIVE (INKREA)	\N	{}	IA GENERATIVE (INKREA)	IA GENERATIVE (INKREA)	2026-07-11 12:55:57.891652	2026-07-11 12:57:15.335	-1	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					t	\N	3	\N	ILLUSTRATOR Basique (TOSA) + ILLUSTRATOR Opérationnel (ICDL) -> IA GENERATIVE (INKREA)	Renforcement Illustrator - P3	\N
8fcbe9a3-d6e8-4693-ae17-72dcdd034fbf	aopia	M.	a	a	06	Herizo Randria	Word + IA	\N	{"IA Générative ":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	Débutant	IA GENERATIVE (INKREA)	2026-07-13 01:06:13.209871	2026-07-13 01:08:01.49	0	\N	{"43":"Toute la journée","2641":""}	\N	Débutant	t	{"IA Générative ":{"2673":"Classer automatiquement des emails par expéditeur","2674":"Une IA capable de créer du contenu à partir de données apprises ","2675":"Le résultat produit par l’IA"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N		IA Générative & Word	\N
2ebe3161-b4ed-4f7c-933d-318913b2cda5	aopia	M.	a	a	06	Herizo Randria	Illustrator	\N	{"Initial":{"score":1,"total":4,"percentage":25,"requiredCorrect":4,"validated":false}}	Initial	IA GENERATIVE (INKREA) (Word + IA)	2026-07-12 23:02:07.766857	2026-07-12 23:02:27.922	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"2519":"Illustrator permet d'agrandir un dessin à l'infini sans perte de qualité. ","2520":"Je ne sais pas","2521":"De la retouche photo","2522":".MP4"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	Illustrator Basique (TOSA) + Illustrator Opérationnel (ICDL) -> IA GENERATIVE (INKREA) (Word + IA)	Renforcement Illustrator - P3	\N
c42cfcd8-525f-4bb8-a1b6-d7b95f7afa4d	aopia	M.	a	a	06	GRUAUD Sandrine	\N	\N	\N	\N	\N	2026-07-11 11:56:53.182564	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
2e99521a-e1a0-43dd-9221-13c14a30b954	aopia	M.	H	a	06	Herizo Randria	Word Opérationnel (ICDL)	\N	{"IA Générative ":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true},"Basique":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Opérationnel":{"score":4,"total":5,"percentage":80,"requiredCorrect":4,"validated":true},"Avancé":{"score":2,"total":5,"percentage":40,"requiredCorrect":4,"validated":false}}	Word Opérationnel (ICDL)	Word Opérationnel (ICDL)	2026-07-11 11:30:34.392139	2026-07-11 11:32:27.481	-1	\N	{"43":"Après-midi","2641":""}	\N	Opérationnel	t	{"IA Générative ":{"2673":"Générer automatiquement un texte ou une image à partir d’une demande ","2674":"Une IA capable de créer du contenu à partir de données apprises ","2675":"La question ou la consigne donnée à l’IA"},"Initial":{"9":"**Fichier** > **Enregistrer sous**","10":"**Insertion** > **Images **","11":"A **rédiger** du contenu **traitement de texte**"},"Basique":{"2676":"CTRL + **S **","2677":"Sélectionner les cellules puis **Création de tableau** > **Styles de tableau **","2678":"Une **tabulation**","2679":"**Insérer** une image > **Clic droit** > Positionner dans **l’en-tête**","2680":"Bleu"},"Opérationnel":{"2691":"**Insertion** > **Zone de texte**","2692":".**DOTX**","2693":"**Copier** le tableau dans **Excel** > **Coller** de manière **spéciale** dans **Word **","2694":"**Accueil** > **Styles**","2695":"**Références** > **Tables des matières **"},"Avancé":{"2681":"En utilisant le principe du **document maître** et des **sous-documents**","2682":"La note de bas de page s’affiche **en bas de la page concernée**, tandis que la note de fin est **regroupée à la fin du document** ou d’une section","2683":"À avoir un **historique des différentes versions** du document","2684":"**Fichiers** > **Informations** > **Gérer le document**","2685":"Sélectionner les **objets**"}}	\N	\N	\N	f	f	t	f					t	\N	1	\N	IA GENERATIVE (INKREA) + Word (TOSA) -> Word Opérationnel (ICDL)	IA Générative & Word - P3	\N
e0ca0763-343e-4626-b307-28d5b8440051	aopia	M.	a	a	06	herizo Randria	Excel	{"470":"Jamais","473":"Occasionnellement ","477":"Oui avec quelques difficultés ","2109":"Oui avec quelques difficultés ","2632":"Non","2633":"Occasionnellement","2636":"Oui"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true}}	\N	\N	2026-07-11 11:34:58.355572	2026-07-11 11:35:25.878	\N	\N	{"43":"Après-midi","2641":""}	\N	Initial	t	{"Initial":{"1975":"Une **cellule **","1976":"**=SOMME() **","1977":"Graphique **Camembert (Secteur) **"}}	az	["Salarié"]	\N	f	f	t	f					f	\N	3	\N		\N	\N
52f04085-d795-4c82-b923-e8a96124e1dd	aopia	M.	a	a	06	Herizo Randria	\N	\N	\N	\N	\N	2026-07-11 11:33:09.655997	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
6b78ac22-61f2-45e8-9b59-13dca06b0025	aopia	M.	06	H	a	Herizo Randria	Digitales Compétences	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Débutant	Digitales Compétences Basique (TOSA)	2026-07-11 11:56:59.734947	2026-07-11 12:00:08.089	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	IA GENERATIVE (INKREA) + Word (TOSA) -> Digitales Compétences Basique (TOSA)	IA Générative & Word - P3	\N
ecd32e3c-c5d0-4f84-9cb6-5c9fa13187f4	aopia	M.	a	a	06	Herizo Randria	Excel	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Débutant	EXCEL Basique (TOSA)	2026-07-11 11:43:16.958285	2026-07-11 11:44:00.493	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1975":"Une **cellule **","1976":"**=NBVAL()**","1977":"Graphique **Camembert (Secteur) **"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	Digitales Compétences Basique (TOSA) + WORD Basique (TOSA) -> EXCEL Basique (TOSA)	Essentiels Digitales Compétences & Word - P3	\N
da11090e-0ae9-4855-9a10-8443ba032d66	aopia	M.	az	a	06	Herizo Randria	Excel	{"470":"Occasionnellement","473":"Occasionnellement ","477":"Oui avec quelques difficultés ","2109":"Non","2632":"Non","2633":"Occasionnellement","2636":"Oui avec quelques difficultés"}	{"Initial":{"score":3,"total":3,"percentage":100,"requiredCorrect":3,"validated":true}}	Initial	Digitales Compétences Basique (TOSA) & Word Basique (TOSA)	2026-07-11 11:37:33.727601	2026-07-11 11:42:08.941	0	\N	{"43":"Après-midi","2641":""}	\N	Initial	t	{"Initial":{"1975":"Une **cellule **","1976":"**=SOMME() **","1977":"Graphique **Camembert (Secteur) **"}}	a	["Salarié"]	\N	f	f	t	f					f	\N	3	\N		\N	\N
81e17b3e-bc55-4f03-bbbd-15c51e5fc147	aopia	M.	a	a	069	Herizo Randria	TOSA Digcomp Initial & TOSA Word Initial	{"470":"Occasionnellement","473":"Occasionnellement ","477":"Non","2109":"Oui avec quelques difficultés ","2632":"Non","2633":"Occasionnellement","2636":"Oui avec quelques difficultés"}	\N	Inconnu	TOSA Digcomp Initial & TOSA Excel Initial	2026-07-11 11:36:02.234398	2026-07-11 11:36:29.11	0	\N	{"43":"Après-midi","2641":""}	\N	\N	t	\N	a	["Salarié"]	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
f361e9f6-8ddc-462a-af0c-d044198b9f00	aopia	M.	a	a	06	Herizo Randria	Digitales Compétences Basique (TOSA) & Word Basique (TOSA)	{"470":"Occasionnellement","473":"Occasionnellement ","477":"Oui avec quelques difficultés ","2109":"Non","2632":"Non","2633":"Jamais","2636":"Oui avec quelques difficultés"}	\N	\N	\N	2026-07-11 11:46:32.392087	\N	\N	\N	\N	\N	\N	f	\N	a	["Salarié"]	\N	f	f	f	f					f	\N	1	\N	\N	\N	\N
2a57e4f6-01c0-412e-923e-993b85cd709a	aopia	M.	a	a	06	Herizo Randria	SketchUp	\N	{"Initial":{"score":0,"total":3,"percentage":0,"requiredCorrect":3,"validated":false}}	Débutant	SKETCHUP Opérationnel (ICDL)	2026-07-11 11:50:54.310867	2026-07-11 11:52:45.979	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"2014":"Retouche photo","2015":"Supprimer un fichier","2016":"Mesurer une distance"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	WordPress Basique (TOSA) + WordPress Operationnel (ICDL) -> SKETCHUP Opérationnel (ICDL)	Renforcement Wordpress - P3	\N
48a1c86f-5aeb-46e3-b01c-e4c43faf86f3	aopia	M.	z	a	a	Herizo Randria	Illustrator	\N	{"Initial":{"score":3,"total":4,"percentage":75,"requiredCorrect":4,"validated":false}}	Débutant	ILLUSTRATOR Basique (TOSA)	2026-07-11 12:31:09.528447	2026-07-11 12:32:03.764	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"2519":"Illustrator permet d'agrandir un dessin à l'infini sans perte de qualité. ","2520":"La feuille de style.","2521":"Du dessin vectoriel ","2522":".AI"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	SKETCHUP Opérationnel (ICDL) + GIMP Opérationnel (ICDL) -> ILLUSTRATOR Basique (TOSA)	Création visuels : 3D/Images - P3	\N
541b9442-c58c-46c9-afab-c82aab19752c	aopia	M.	a	a	06	Herizo Randria	SketchUp	\N	{"Initial":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	Débutant	IA GENERATIVE (INKREA)	2026-07-11 12:32:11.559939	2026-07-11 12:33:08.05	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"2014":"Retouche photo","2015":"Choisir un élément du modèle","2016":"Créer une caméra"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	SketchUp Opérationnel (ICDL) + Gimp Opérationnel (ICDL) -> IA GENERATIVE (INKREA)	Création visuels : 3D/Images - P3	\N
f1b8a8b3-65eb-48ed-b6dc-a85cd9aa7e0d	aopia	M.	A	slides	06	Herizo Randria	Google Sheets	\N	{}	\N	\N	2026-07-12 20:57:25.019713	2026-07-12 20:57:58.929	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
b4e51cd1-b8a6-4291-a99e-3dd6016dadaf	aopia	M.	a	a	06	Herizo Randria	SketchUp	\N	{}	\N	\N	2026-07-12 21:49:30.291549	2026-07-12 21:49:50.63	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
1e629823-b920-4143-a485-c2fcc21c7180	aopia	M.	az	a	a	Herizo Randria	SketchUp	\N	{}	\N	\N	2026-07-12 22:04:38.11641	2026-07-12 22:05:02.693	\N	\N	{"43":"Après-midi","2641":""}	\N	\N	t	{}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
e7d5cee3-5417-44eb-bc90-1fc507af9f17	aopia	M.	z	a	06	Herizo Randria	SketchUp	\N	{"Initial":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	Débutant	SketchUp Opérationnel (ICDL)	2026-07-13 01:08:29.552148	2026-07-13 01:09:48.611	0	\N	{"43":"Matin","2641":""}	\N	Débutant	t	{"Initial":{"2014":"Retouche photo","2015":"Choisir un élément du modèle","2016":"Créer une caméra"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	Gimp Opérationnel (ICDL) + Illustrator Opérationnel (TOSA) -> SketchUp Opérationnel (ICDL)	Création visuels 3D - P3	\N
87caf892-1c65-4918-bec7-b3ddd2a3fd23	aopia	M.	a	hj	06	Herizo Randria	Digitales Compétences	\N	{"Initial":{"score":1,"total":3,"percentage":33.33333333333333,"requiredCorrect":3,"validated":false}}	Débutant	Digitales Compétences Opérationnel (TOSA)	2026-07-12 23:29:42.848447	2026-07-12 23:32:54.153	0	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Excel"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	Outils Collaboratifs Google Opérationnel (ICDL) + IA GENERATIVE (INKREA) -> Digitales Compétences Opérationnel (TOSA)	Google Workspace - P3	\N
8dbb4e9e-aa75-4f01-8a39-ced490ac7c79	aopia	M.	a	a	06	Herizo Randria	Digitales Compétences	\N	{"Initial":{"score":2,"total":3,"percentage":66.66666666666666,"requiredCorrect":3,"validated":false}}	Débutant	Aucun parcours actif ne correspond à cette progression.	2026-07-12 23:33:00.841317	2026-07-12 23:43:09.562	0	\N	{"43":"Entre 12h et 14h","2641":""}	\N	Débutant	t	{"Initial":{"1952":"Je l’ouvre et je copie le texte","1953":"J’utilise l’Identité Numérique La Poste","1954":"J’utilise Teams"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
ad889eab-0e7d-40c8-8847-6491a0c55630	aopia	M.	a	a	a	Herizo Randria	Excel + IA	\N	{"IA Générative ":{"score":0,"total":3,"percentage":0,"requiredCorrect":3,"validated":false}}	IA Générative 	Aucun parcours actif ne correspond à cette progression.	2026-07-13 00:30:18.175605	2026-07-13 00:30:39.691	\N	\N	{"43":"Après-midi","2641":""}	\N	Débutant	t	{"IA Générative ":{"2647":"Une IA spécialisée uniquement dans la reconnaissance vocale","2671":"Copier-coller un texte dans un document","2672":"Une base de données"}}	\N	\N	\N	f	f	t	f					f	\N	3	\N	\N	\N	\N
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (key, value, description) FROM stdin;
SUPPORT_PHONE	01 23 45 67 89	Téléphone de support affiché
POSITIONNEMENT_PAGINATED	false	Afficher le positionnement question par question
PREREQUIS_PAGINATED	false	Afficher les prérequis question par question
AUTO_SKIP_MISE_A_NIVEAU	true	Autoriser le saut automatique de l'étape 'mise à niveau' en l'absence de questions
AUTO_SKIP_POSITIONNEMENT	true	Autoriser le saut automatique de l'étape 'positionnement' en l'absence de questions
PREREQUISITE_FAILURE_VALUES	non,insuffisant,jamais	Valeurs considérées comme un échec aux prérequis (séparées par des virgules)
AUTO_SKIP_PREREQUIS	false	Passer automatiquement l'étape des prérequis
AUTO_SKIP_AVAILABILITIES	false	Passer automatiquement l'étape des disponibilités
AUTO_SKIP_COMPLEMENTARY	false	Passer automatiquement l'étape des questions complémentaires
AUTO_SEND_EMAIL	true	Envoyer automatiquement le bilan par email à l'administrateur
ENABLE_P3	true	Activer la fonctionnalité "Ajouter un autre parcours" (P3) à la fin
ENABLE_REFERRAL	false	Activer le programme de parrainage (Parrain/Marraine)
PLATFORM_NAME	Analyses des Besoins	Nom de la plateforme
SMTP_HOST	mail.wizi-learn.com	\N
SMTP_USERNAME	contact@wizi-learn.com	\N
SMTP_PORT	465	\N
SMTP_ENCRYPTION	ssl	\N
ADMIN_EMAIL	admin@ns-conseil.com	Email de réception des bilans
P3_SAME_FORMATION_TEST	true	Autoriser les tests sur la même formation en mode P3
P3_OTHER_FORMATION_TEST	true	Exiger les tests sur une autre formation avant P3
P3_OVERRIDE_ENABLED	true	\N
EMAIL_CC_ADV	admin@ns-conseil.com	Adresses emails en copie (CC) pour l'ADV (séparées par des virgules)
SMTP_PASSWORD	QNwYWuF78JSOXd4qWLA/0yty5Nnmn2Hp0XAEiXkOOvGXJRk9	\N
HIGH_LEVEL_ALERT_BEHAVIOR	modal	Comportement si niveau validÃ© supÃ©rieur au parcours : modal (afficher alerte), auto_change (rediriger formation), ignore (continuer sans alerte)
HIGH_LEVEL_ALERT_MESSAGE		Message personnalisÃ© affichÃ© dans l'alerte niveau supÃ©rieur (laisser vide pour message par dÃ©faut)
HIGH_LEVEL_ALERT_FORMATIONS		\N
HIGH_LEVEL_THRESHOLD_ORDER	2	\N
P3_OVERRIDE_ALLOW_MANUAL	true	\N
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
5	admin2@test.fr	$2b$10$vcgZl6snsnoVOXXC5awNsuc3iI467wvNiPS6npGsdD4PErlGR3n/y	admin	2026-03-20 14:33:00.946657	Test Admin
6	browsertest@test.fr	$2b$10$XPC5jvZkEQMzGG2B.VP8s.jG5kai.Mpj4DfXSIxRMO6x5BCeov/2C	admin	2026-03-20 14:33:55.713873	Browser Test
7	test3@test.fr	$2b$10$WIHnzlXtKaICswQ2UisKNeJCghS.rJ0VRNBmxqtvv4pvzbyuE8mDy	admin	2026-03-20 14:34:55.117354	Admin Test 3
\.


--
-- Data for Name: workflow_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflow_steps (id, code, label, "order", route, "isActive") FROM stdin;
1	IDENTIFICATION	Identification du bénéficiaire	0	/	t
3	PREREQUIS	Test informatique prérequis	1	/prerequis	f
2	FORMATION_SELECTION	Choix de la formation	2	/formations	t
9	MISE_A_NIVEAU	Mise Ã  niveau	3	/mise-a-niveau	f
4	POSITIONNEMENT	Test de positionnement	4	/positionnement	t
5	RESULTATS	Résultat et validation de la formation	5	/resultats	t
6	COMPLEMENTARY	Questions complémentaires	6	/complementary	f
7	AVAILABILITIES	Disponibilités	7	/availabilities	t
8	VALIDATION	Validation finale	8	/validation	t
\.


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contacts_id_seq', 157, true);


--
-- Name: formations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.formations_id_seq', 57, true);


--
-- Name: levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.levels_id_seq', 556, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 2, true);


--
-- Name: p3_override_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.p3_override_rules_id_seq', 352, true);


--
-- Name: parcours_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parcours_rules_id_seq', 487, true);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_id_seq', 2722, true);


--
-- Name: stagiaires_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stagiaires_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: workflow_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workflow_steps_id_seq', 15, true);


--
-- Name: p3_override_rules PK_03cff3155bb23e838d2f1aa4df9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.p3_override_rules
    ADD CONSTRAINT "PK_03cff3155bb23e838d2f1aa4df9" PRIMARY KEY (id);


--
-- Name: levels PK_05f8dd8f715793c64d49e3f1901; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT "PK_05f8dd8f715793c64d49e3f1901" PRIMARY KEY (id);


--
-- Name: email_templates PK_06c564c515d8cdb40b6f3bfbbb4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT "PK_06c564c515d8cdb40b6f3bfbbb4" PRIMARY KEY (id);


--
-- Name: p3_filter_rule PK_07fe39778488643f23d48b61a26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.p3_filter_rule
    ADD CONSTRAINT "PK_07fe39778488643f23d48b61a26" PRIMARY KEY (id);


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
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


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
-- Name: email_templates UQ_47fbf61afd456e17d308bb20443; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT "UQ_47fbf61afd456e17d308bb20443" UNIQUE (slug);


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
-- Name: p3_override_rules FK_a7f3c41190fafaebb1fb4fb15bb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.p3_override_rules
    ADD CONSTRAINT "FK_a7f3c41190fafaebb1fb4fb15bb" FOREIGN KEY ("formationId") REFERENCES public.formations(id) ON DELETE CASCADE;


--
-- Name: parcours_rules FK_caa8beed8c3f2d202b77f522b71; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcours_rules
    ADD CONSTRAINT "FK_caa8beed8c3f2d202b77f522b71" FOREIGN KEY ("formationId") REFERENCES public.formations(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO analyse_user;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v1() TO analyse_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v1mc() TO analyse_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v3(namespace uuid, name text) TO analyse_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v4() TO analyse_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v5(namespace uuid, name text) TO analyse_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_nil() TO analyse_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_ns_dns() TO analyse_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_ns_oid() TO analyse_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_ns_url() TO analyse_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_ns_x500() TO analyse_user;


--
-- Name: TABLE contacts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contacts TO analyse_user;


--
-- Name: SEQUENCE contacts_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.contacts_id_seq TO analyse_user;


--
-- Name: TABLE email_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.email_templates TO analyse_user;


--
-- Name: TABLE formations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.formations TO analyse_user;


--
-- Name: SEQUENCE formations_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.formations_id_seq TO analyse_user;


--
-- Name: TABLE levels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.levels TO analyse_user;


--
-- Name: SEQUENCE levels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.levels_id_seq TO analyse_user;


--
-- Name: TABLE migrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.migrations TO analyse_user;


--
-- Name: SEQUENCE migrations_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.migrations_id_seq TO analyse_user;


--
-- Name: TABLE p3_filter_rule; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.p3_filter_rule TO analyse_user;


--
-- Name: TABLE p3_override_rules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.p3_override_rules TO analyse_user;


--
-- Name: SEQUENCE p3_override_rules_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.p3_override_rules_id_seq TO analyse_user;


--
-- Name: TABLE parcours_rules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.parcours_rules TO analyse_user;


--
-- Name: SEQUENCE parcours_rules_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.parcours_rules_id_seq TO analyse_user;


--
-- Name: TABLE question_rules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.question_rules TO analyse_user;


--
-- Name: TABLE questions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.questions TO analyse_user;


--
-- Name: SEQUENCE questions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.questions_id_seq TO analyse_user;


--
-- Name: TABLE sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sessions TO analyse_user;


--
-- Name: TABLE settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.settings TO analyse_user;


--
-- Name: TABLE stagiaires; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.stagiaires TO analyse_user;


--
-- Name: SEQUENCE stagiaires_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.stagiaires_id_seq TO analyse_user;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO analyse_user;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_id_seq TO analyse_user;


--
-- Name: TABLE workflow_steps; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.workflow_steps TO analyse_user;


--
-- Name: SEQUENCE workflow_steps_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.workflow_steps_id_seq TO analyse_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO analyse_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO analyse_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO analyse_user;


--
-- PostgreSQL database dump complete
--

