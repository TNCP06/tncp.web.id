import * as migration_20260703_092811_initial from './20260703_092811_initial';
import * as migration_20260703_202158_blog_phase2_articles from './20260703_202158_blog_phase2_articles';
import * as migration_20260703_214240_add_article_published_at from './20260703_214240_add_article_published_at';

export const migrations = [
  {
    up: migration_20260703_092811_initial.up,
    down: migration_20260703_092811_initial.down,
    name: '20260703_092811_initial',
  },
  {
    up: migration_20260703_202158_blog_phase2_articles.up,
    down: migration_20260703_202158_blog_phase2_articles.down,
    name: '20260703_202158_blog_phase2_articles',
  },
  {
    up: migration_20260703_214240_add_article_published_at.up,
    down: migration_20260703_214240_add_article_published_at.down,
    name: '20260703_214240_add_article_published_at'
  },
];
