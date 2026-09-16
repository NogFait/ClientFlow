import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import PublicNav from "../../components/marketing/PublicNav/PublicNav"
import PublicFooter from "../../components/marketing/PublicFooter/PublicFooter"
import CtaBlock from "../landing/sections/CtaBlock"
import JsonLd from "../../components/seo/JsonLd"
import NotFoundPage from "../not-found/NotFoundPage"
import { usePageMeta } from "../../hooks/usePageMeta"
import { getPostBySlug } from "../../content/blog"
import type { BlogPost } from "../../content/blog/types"
import { formatDateEs } from "../../content/blog/formatDateEs"
import { buildBlogPostingJsonLd } from "../../seo/blogPostingJsonLd"
import { blogPostPath, blogPostTitle } from "../../seo/publicPages"
import styles from "./BlogPostPage.module.css"

// Public /blog/:slug. Split in two so the hook call stays unconditional: the
// outer component resolves the post (or falls through to the 404), the inner
// one renders it and owns the <head> effects.
const BlogPostPage = () => {
  const { slug = "" } = useParams()
  // Drafts are previewable at their URL in `pnpm dev` only; production (and
  // the SSR bundle, which is a production build) treats them as missing.
  const post = getPostBySlug(slug, { includeDrafts: import.meta.env.DEV })

  if (!post) {
    return <NotFoundPage />
  }

  return <BlogPostArticle post={post} />
}

interface BlogPostArticleProps {
  post: BlogPost
}

const BlogPostArticle = ({ post }: BlogPostArticleProps) => {
  usePageMeta({
    title: blogPostTitle(post.title),
    description: post.description,
    path: blogPostPath(post.slug),
  })

  return (
    <div className={styles.page}>
      <JsonLd data={buildBlogPostingJsonLd(post)} />
      <PublicNav />
      <main className={styles.main}>
        <Link to="/blog" className={styles.back}>
          <ArrowLeft size={16} aria-hidden="true" />
          Volver al blog
        </Link>

        <article className={styles.article}>
          <header className={styles.header}>
            <h1 className={styles.title}>{post.title}</h1>
            <p className={styles.meta}>
              <time dateTime={post.date}>{formatDateEs(post.date)}</time>
              <span aria-hidden="true"> · </span>
              <span>{post.readingMinutes} min de lectura</span>
              <span aria-hidden="true"> · </span>
              <span>{post.author}</span>
            </p>
          </header>

          {/* Post HTML is rendered from our own repo Markdown at load time
              (see src/content/blog/renderMarkdown.ts); the same string is
              produced on the server and the client. */}
          <div className={styles.prose} dangerouslySetInnerHTML={{ __html: post.html }} />
        </article>
      </main>
      <CtaBlock />
      <PublicFooter />
    </div>
  )
}

export default BlogPostPage
