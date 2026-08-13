-- 8Hope: Multi-language support for Moed daily content
-- Adds Spanish as a second fully-supported language for moed_daily_content
-- (AI-generated devotional commentary, cached per month/day/language) and
-- month_numerology (curated, hand-authored per month/language).
--
-- Spanish numerology rows below are a DRAFT — faithful translations of the
-- already-approved English versions, same devotional register — pending
-- sign-off from the team's Spanish-fluent theological reviewers, mirroring
-- the process the English content already went through with Dr. Anita.

-- ─── moed_daily_content ─────────────────────────────────────────────────────

alter table moed_daily_content add column language text not null default 'en';
alter table moed_daily_content drop constraint moed_daily_content_month_day_key;
alter table moed_daily_content add constraint moed_daily_content_month_day_language_key
  unique (month, day, language);

-- ─── month_numerology ───────────────────────────────────────────────────────
-- Switch from a plain `month` primary key to a surrogate UUID PK + composite
-- unique constraint, matching the convention already used by
-- moed_daily_content. No FKs elsewhere reference month_numerology(month).

alter table month_numerology add column id uuid not null default gen_random_uuid();
alter table month_numerology add column language text not null default 'en';
alter table month_numerology drop constraint month_numerology_pkey;
alter table month_numerology add constraint month_numerology_pkey primary key (id);
alter table month_numerology add constraint month_numerology_month_language_key
  unique (month, language);

insert into month_numerology (month, language, theme, explanation) values
(1,  'es', 'Comienzos y Señorío',
     'El número 1 habla de unidad y primacía — Dios como la única fuente (Dt. 6:4). Un mes para buscar una alineación renovada bajo su señorío antes de construir cualquier otra cosa.'),
(2,  'es', 'Testimonio y División',
     'El dos habla de testimonio y división — «por boca de dos testigos» (Dt. 19:15) se establece un asunto, mientras que la creación misma fue dividida en el segundo día. Un mes para discernir testigos verdaderos y las divisiones correctas.'),
(3,  'es', 'Plenitud y Resurrección',
     'El tres marca la plenitud divina — la Trinidad, y los tres días de Jonás que prefiguran la resurrección (Mt. 12:40). Un mes en el que lo que parecía sepultado puede resurgir.'),
(4,  'es', 'Creación y el Mundo Material',
     'El cuatro es el número de la tierra y la creación material — los cuatro vientos, las cuatro esquinas, el sol/luna/estrellas del cuarto día (Gn. 1:14-19). Un mes para administrar lo que se te ha confiado físicamente.'),
(5,  'es', 'Gracia',
     'El cinco es constantemente el número de la gracia en las Escrituras — el ministerio quíntuple, gracia sobre gracia. Un mes marcado por el favor inmerecido más que por el desempeño.'),
(6,  'es', 'El Hombre y la Debilidad',
     'El seis es el número del hombre, creado en el sexto día, uno menos que la perfección del siete — un recordatorio de la limitación humana aparte de Dios. Un mes para apoyarte en una fuerza más allá de la tuya.'),
(7,  'es', 'Plenitud y Descanso',
     'El siete es el número de la plenitud divina y el descanso sabático — la creación terminada, la semana sellada (Gn. 2:2-3). Un mes para reconocer lo que Dios ya ha terminado.'),
(8,  'es', 'Nuevos Comienzos',
     'El ocho está justo después de la plenitud del siete — el inicio de un nuevo ciclo, la circuncisión al octavo día (Gn. 17:12), la mañana de la resurrección como el «octavo día». Un mes de nuevos comienzos al otro lado de lo que ya se completó.'),
(9,  'es', 'Fructificación y Finalidad',
     'El nueve está vinculado al fruto — el fruto nueve veces del Espíritu (Gá. 5:22-23) y la gestación que llega a término. Un mes en el que lo que se sembró llega a su madurez.'),
(10, 'es', 'Testimonio y Orden Divino',
     'El diez habla de la ley y el testimonio completo — los Diez Mandamientos, el diez como número redondo y completo de orden (Ex. 20). Un mes para el orden bajo la palabra revelada de Dios.'),
(11, 'es', 'Desorden e Incompletitud',
     'El once no alcanza la plenitud gubernamental del doce — a menudo asociado con el desorden o un número transicional e inestable en las Escrituras. Un mes para estar atento a lo que aún se está ordenando antes de que llegue el orden.'),
(12, 'es', 'Perfección Gubernamental',
     'El doce es el número del gobierno divino y el fundamento apostólico — las doce tribus, los doce apóstoles, las doce puertas de la Nueva Jerusalén (Ap. 21:12-14). Un mes de plenitud gubernamental y de sentar fundamentos.');
