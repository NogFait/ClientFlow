import { Link } from "react-router-dom"
import PublicNav from "../../components/marketing/PublicNav/PublicNav"
import PublicFooter from "../../components/marketing/PublicFooter/PublicFooter"
import { usePageMeta } from "../../hooks/usePageMeta"
import { getAllPosts } from "../../content/blog"
import { useTranslation } from "react-i18next"
import { formatPostDate } from "../../content/blog/formatPostDate"
import { useCurrentLang } from "../../i18n/useCurrentLang"
import { usePreferredLanguageSync } from "../../i18n/usePreferredLanguageSync"
import { BLOG_INDEX_META, blogPostPath } from "../../seo/publicPages"
import styles from "./BlogIndexPage.module.css"

// Public /blog — the list of published posts, newest first. Posts are
// bundled Markdown (src/content/blog/*.md) rendered at load time, so this
// page has no data fetching and prerenders to complete HTML at build.
const BlogIndexPage = () => {
  // The prerendered HTML is Spanish (the posts are); a stored English
  // preference is applied after hydration so the frame follows the reader.
  usePreferredLanguageSync()
  const { t } = useTranslation()
  const lang = useCurrentLang()
  usePageMeta(BLOG_INDEX_META)

  const posts = getAllPosts()

  return (
    <div className={styles.page}>
      <PublicNav />
      <main className={styles.main}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>BLOG</span>
          <h1 className={styles.title}>{t("blog.title")}</h1>
          <p className={styles.intro}>{t("blog.intro")}</p>
          {lang !== "es" && <p className={styles.note}>{t("blog.spanishOnly")}</p>}
        </header>

        {posts.length === 0 ? (
          <p className={styles.empty}>{t("blog.empty")}</p>
        ) : (
          <ul className={styles.list}>
            {posts.map((post) => (
              <li key={post.slug} className={styles.card}>
                <p className={styles.meta}>
                  <time dateTime={post.date}>{formatPostDate(post.date, lang)}</time>
                  <span aria-hidden="true"> · </span>
                  <span>{t("blog.readingTime", { count: post.readingMinutes })}</span>
                </p>
                <h2 className={styles.cardTitle}>
                  <Link to={blogPostPath(post.slug)} className={styles.cardLink}>
                    {post.title}
                  </Link>
                </h2>
                <p className={styles.description}>{post.description}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}

export default BlogIndexPage
