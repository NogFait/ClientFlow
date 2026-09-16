import { Link } from "react-router-dom"
import PublicNav from "../../components/marketing/PublicNav/PublicNav"
import PublicFooter from "../../components/marketing/PublicFooter/PublicFooter"
import { usePageMeta } from "../../hooks/usePageMeta"
import { getAllPosts } from "../../content/blog"
import { formatDateEs } from "../../content/blog/formatDateEs"
import { BLOG_INDEX_META, blogPostPath } from "../../seo/publicPages"
import styles from "./BlogIndexPage.module.css"

// Public /blog — the list of published posts, newest first. Posts are
// bundled Markdown (src/content/blog/*.md) rendered at load time, so this
// page has no data fetching and prerenders to complete HTML at build.
const BlogIndexPage = () => {
  usePageMeta(BLOG_INDEX_META)

  const posts = getAllPosts()

  return (
    <div className={styles.page}>
      <PublicNav />
      <main className={styles.main}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>BLOG</span>
          <h1 className={styles.title}>Blog</h1>
          <p className={styles.intro}>
            Novedades de ClientFlow y notas sobre trabajar por tu cuenta: clientes, proyectos, cobros.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className={styles.empty}>Todavía no hay posts. Volvé pronto.</p>
        ) : (
          <ul className={styles.list}>
            {posts.map((post) => (
              <li key={post.slug} className={styles.card}>
                <p className={styles.meta}>
                  <time dateTime={post.date}>{formatDateEs(post.date)}</time>
                  <span aria-hidden="true"> · </span>
                  <span>{post.readingMinutes} min de lectura</span>
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
