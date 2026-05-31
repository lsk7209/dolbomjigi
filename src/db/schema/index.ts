import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// ─────────────────────────────────────────
// authors (다른 테이블에서 FK로 참조하므로 먼저 정의)
// ─────────────────────────────────────────
export const authors = sqliteTable('authors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  credentials_json: text('credentials_json'), // JSON string
  bio_short: text('bio_short'),
  avatar_url: text('avatar_url'),
});

// ─────────────────────────────────────────
// robots
// ─────────────────────────────────────────
export const robots = sqliteTable('robots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name_ko: text('name_ko').notNull(),
  name_en: text('name_en'),
  manufacturer: text('manufacturer').notNull(),
  manufacturer_country: text('manufacturer_country').notNull(),
  category: text('category', {
    enum: ['companion', 'senior_care', 'rehabilitation', 'monitoring'],
  }).notNull(),
  korea_market: integer('korea_market', { mode: 'boolean' }).notNull().default(false),
  price_min: integer('price_min'), // 원 단위
  price_max: integer('price_max'), // 원 단위
  subscription_monthly: integer('subscription_monthly'), // 원 단위
  rental_available: integer('rental_available', { mode: 'boolean' }).notNull().default(false),
  release_year: integer('release_year'),
  manufacturer_url: text('manufacturer_url'),
  description_short: text('description_short'), // 150자, OG용
  features_json: text('features_json'), // JSON string
  hero_image_url: text('hero_image_url'),
  created_at: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updated_at: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─────────────────────────────────────────
// regions
// ─────────────────────────────────────────
export const regions = sqliteTable('regions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sido_code: text('sido_code').notNull(),
  sigungu_code: text('sigungu_code'),
  sido_name: text('sido_name').notNull(),
  sigungu_name: text('sigungu_name'),
  level: text('level', { enum: ['sido', 'sigungu'] }).notNull(),
  slug: text('slug').notNull().unique(),
  population_65plus: integer('population_65plus'),
  single_elderly_households: integer('single_elderly_households'),
});

// ─────────────────────────────────────────
// support_programs
// ─────────────────────────────────────────
export const supportPrograms = sqliteTable('support_programs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  region_id: integer('region_id')
    .references(() => regions.id),
  name_ko: text('name_ko').notNull(),
  program_type: text('program_type', {
    enum: ['free_distribution', 'rental', 'subsidy', 'rd_grant'],
  }).notNull(),
  eligibility_json: text('eligibility_json'), // JSON string
  application_method: text('application_method'),
  application_url: text('application_url'),
  period_start: integer('period_start', { mode: 'timestamp' }),
  period_end: integer('period_end', { mode: 'timestamp' }),
  budget: integer('budget'),
  distribution_count: integer('distribution_count'),
  source_url: text('source_url').notNull(),
  source_publication_date: integer('source_publication_date', { mode: 'timestamp' }),
  source_license: text('source_license').notNull().default('공공누리 제1유형'),
  last_seen: integer('last_seen', { mode: 'timestamp' }),
  status: text('status', { enum: ['active', 'closed', 'unknown'] })
    .notNull()
    .default('active'),
  human_reviewed: integer('human_reviewed', { mode: 'boolean' })
    .notNull()
    .default(false),
  reviewer_id: integer('reviewer_id').references(() => authors.id),
});

// ─────────────────────────────────────────
// bizinfo_programs
// ─────────────────────────────────────────
export const bizinfoPrograms = sqliteTable('bizinfo_programs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pblanc_id: text('pblanc_id').notNull().unique(),
  title: text('title').notNull(),
  dept: text('dept'),
  region: text('region'),
  field: text('field'),
  start_date: integer('start_date', { mode: 'timestamp' }),
  end_date: integer('end_date', { mode: 'timestamp' }),
  detail_url: text('detail_url'),
  matched_keywords: text('matched_keywords'), // JSON string
  raw_json: text('raw_json'), // JSON string
  fetched_at: integer('fetched_at', { mode: 'timestamp' }),
});

// ─────────────────────────────────────────
// comparisons
// ─────────────────────────────────────────
export const comparisons = sqliteTable('comparisons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  robot_a_id: integer('robot_a_id')
    .notNull()
    .references(() => robots.id),
  robot_b_id: integer('robot_b_id')
    .notNull()
    .references(() => robots.id),
  title_ko: text('title_ko').notNull(),
  summary: text('summary'),
  pros_a_json: text('pros_a_json'), // JSON string
  pros_b_json: text('pros_b_json'), // JSON string
  recommended_persona: text('recommended_persona'),
  author_id: integer('author_id').references(() => authors.id),
  reviewer_id: integer('reviewer_id').references(() => authors.id),
  published_at: integer('published_at', { mode: 'timestamp' }),
});

// ─────────────────────────────────────────
// guides
// ─────────────────────────────────────────
export const guides = sqliteTable('guides', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  persona_group: text('persona_group', {
    enum: ['family_caregiver', 'social_worker', 'public_servant', 'institution'],
  }).notNull(),
  scenario: text('scenario'),
  title_ko: text('title_ko').notNull(),
  body_md: text('body_md').notNull(),
  recommended_robots_json: text('recommended_robots_json'), // JSON string
  author_id: integer('author_id').references(() => authors.id),
  reviewer_id: integer('reviewer_id').references(() => authors.id),
  published_at: integer('published_at', { mode: 'timestamp' }),
});

// ─────────────────────────────────────────
// research_studies
// ─────────────────────────────────────────
export const researchStudies = sqliteTable('research_studies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  authors_list: text('authors_list').notNull(),
  journal: text('journal'),
  year: integer('year'),
  doi: text('doi'),
  url: text('url'),
  summary_ko: text('summary_ko'),
  cited_robots_json: text('cited_robots_json'), // JSON string
});

// ─────────────────────────────────────────
// 관계 테이블: robot_region_availability
// ─────────────────────────────────────────
export const robotRegionAvailability = sqliteTable(
  'robot_region_availability',
  {
    robot_id: integer('robot_id')
      .notNull()
      .references(() => robots.id),
    region_id: integer('region_id')
      .notNull()
      .references(() => regions.id),
    via_program_id: integer('via_program_id').references(() => supportPrograms.id),
    distribution_count: integer('distribution_count'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.robot_id, table.region_id] }),
  })
);

// ─────────────────────────────────────────
// 관계 테이블: program_robots
// ─────────────────────────────────────────
export const programRobots = sqliteTable(
  'program_robots',
  {
    program_id: integer('program_id')
      .notNull()
      .references(() => supportPrograms.id),
    robot_id: integer('robot_id')
      .notNull()
      .references(() => robots.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.program_id, table.robot_id] }),
  })
);

// ─────────────────────────────────────────
// info_articles (T5 정보 페이지 전용)
// ─────────────────────────────────────────
export const infoArticles = sqliteTable('info_articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title_ko: text('title_ko').notNull(),
  summary: text('summary'),           // AnswerBlock용 250자 이내
  body_html: text('body_html').notNull(),
  topic_category: text('topic_category', {
    enum: ['technology', 'statistics', 'policy', 'comparison', 'history'],
  }),
  related_robots_json: text('related_robots_json'), // ['hyodol', 'dasom-k']
  author_id: integer('author_id').references(() => authors.id),
  published_at: integer('published_at', { mode: 'timestamp' }),
  updated_at: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─────────────────────────────────────────
// Relations
// ─────────────────────────────────────────
export const robotsRelations = relations(robots, ({ many }) => ({
  comparisonsAsA: many(comparisons, { relationName: 'robotA' }),
  comparisonsAsB: many(comparisons, { relationName: 'robotB' }),
  regionAvailabilities: many(robotRegionAvailability),
  programRobots: many(programRobots),
}));

export const regionsRelations = relations(regions, ({ many }) => ({
  supportPrograms: many(supportPrograms),
  robotAvailabilities: many(robotRegionAvailability),
}));

export const supportProgramsRelations = relations(supportPrograms, ({ one, many }) => ({
  region: one(regions, {
    fields: [supportPrograms.region_id],
    references: [regions.id],
  }),
  reviewer: one(authors, {
    fields: [supportPrograms.reviewer_id],
    references: [authors.id],
  }),
  robotAvailabilities: many(robotRegionAvailability),
  programRobots: many(programRobots),
}));

export const comparisonsRelations = relations(comparisons, ({ one }) => ({
  robotA: one(robots, {
    fields: [comparisons.robot_a_id],
    references: [robots.id],
    relationName: 'robotA',
  }),
  robotB: one(robots, {
    fields: [comparisons.robot_b_id],
    references: [robots.id],
    relationName: 'robotB',
  }),
  author: one(authors, {
    fields: [comparisons.author_id],
    references: [authors.id],
    relationName: 'comparisonAuthor',
  }),
  reviewer: one(authors, {
    fields: [comparisons.reviewer_id],
    references: [authors.id],
    relationName: 'comparisonReviewer',
  }),
}));

export const guidesRelations = relations(guides, ({ one }) => ({
  author: one(authors, {
    fields: [guides.author_id],
    references: [authors.id],
    relationName: 'guideAuthor',
  }),
  reviewer: one(authors, {
    fields: [guides.reviewer_id],
    references: [authors.id],
    relationName: 'guideReviewer',
  }),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  reviewedPrograms: many(supportPrograms),
  authoredComparisons: many(comparisons, { relationName: 'comparisonAuthor' }),
  reviewedComparisons: many(comparisons, { relationName: 'comparisonReviewer' }),
  authoredGuides: many(guides, { relationName: 'guideAuthor' }),
  reviewedGuides: many(guides, { relationName: 'guideReviewer' }),
}));

export const robotRegionAvailabilityRelations = relations(
  robotRegionAvailability,
  ({ one }) => ({
    robot: one(robots, {
      fields: [robotRegionAvailability.robot_id],
      references: [robots.id],
    }),
    region: one(regions, {
      fields: [robotRegionAvailability.region_id],
      references: [regions.id],
    }),
    viaProgram: one(supportPrograms, {
      fields: [robotRegionAvailability.via_program_id],
      references: [supportPrograms.id],
    }),
  })
);

export const programRobotsRelations = relations(programRobots, ({ one }) => ({
  program: one(supportPrograms, {
    fields: [programRobots.program_id],
    references: [supportPrograms.id],
  }),
  robot: one(robots, {
    fields: [programRobots.robot_id],
    references: [robots.id],
  }),
}));

// ─────────────────────────────────────────
// blog_posts
// ─────────────────────────────────────────
export const blogPosts = sqliteTable('blog_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title_ko: text('title_ko').notNull(),
  subtitle: text('subtitle'),            // 부제목: 메인+연관 키워드
  summary: text('summary'),              // 250자 이내, AnswerBlock용
  cover_image_url: text('cover_image_url'),
  body_md: text('body_md').notNull(),
  category: text('category', {
    enum: ['care_info', 'product_review', 'support_program', 'guide', 'news'],
  }).notNull().default('care_info'),
  target_persona: text('target_persona', {
    enum: ['family_caregiver', 'social_worker', 'public_servant', 'institution', 'all'],
  }).notNull().default('all'),
  tags_json: text('tags_json'),          // JSON string []
  reading_time_minutes: integer('reading_time_minutes'),
  author_id: integer('author_id').references(() => authors.id),
  published_at: integer('published_at', { mode: 'timestamp' }),
  updated_at: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(authors, {
    fields: [blogPosts.author_id],
    references: [authors.id],
  }),
}));

// ─────────────────────────────────────────
// Export types
// ─────────────────────────────────────────
export type Robot = typeof robots.$inferSelect;
export type NewRobot = typeof robots.$inferInsert;
export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;
export type SupportProgram = typeof supportPrograms.$inferSelect;
export type NewSupportProgram = typeof supportPrograms.$inferInsert;
export type BizinfoProgram = typeof bizinfoPrograms.$inferSelect;
export type NewBizinfoProgram = typeof bizinfoPrograms.$inferInsert;
export type Comparison = typeof comparisons.$inferSelect;
export type NewComparison = typeof comparisons.$inferInsert;
export type Guide = typeof guides.$inferSelect;
export type NewGuide = typeof guides.$inferInsert;
export type Author = typeof authors.$inferSelect;
export type NewAuthor = typeof authors.$inferInsert;
export type ResearchStudy = typeof researchStudies.$inferSelect;
export type NewResearchStudy = typeof researchStudies.$inferInsert;
export type RobotRegionAvailability = typeof robotRegionAvailability.$inferSelect;
export type NewRobotRegionAvailability = typeof robotRegionAvailability.$inferInsert;
export type ProgramRobot = typeof programRobots.$inferSelect;
export type NewProgramRobot = typeof programRobots.$inferInsert;
export type InfoArticle = typeof infoArticles.$inferSelect;
export type NewInfoArticle = typeof infoArticles.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
