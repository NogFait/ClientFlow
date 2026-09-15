import { useId, useState } from "react"
import styles from "./Faq.module.css"

export interface FaqItem {
  question: string
  answer: string
}

interface FaqProps {
  items: FaqItem[]
}

// Accessible single-open accordion — matches the approved design (first
// item open, "−" for open / "+" for closed). Answers stay mounted in the
// DOM at all times so the CSS grid-rows height transition can animate them
// open/closed (see Faq.module.css); openness is expressed through
// aria-expanded + a CSS state class, not conditional rendering.
const Faq = ({ items }: FaqProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const baseId = useId()

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index))
  }

  return (
    <div className={styles.list}>
      {items.map((item, index) => {
        const isOpen = openIndex === index
        const questionId = `${baseId}-question-${index}`
        const answerId = `${baseId}-answer-${index}`

        return (
          <div key={item.question} className={styles.item}>
            <h3 className={styles.questionHeading}>
              <button
                type="button"
                id={questionId}
                className={styles.questionButton}
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => toggle(index)}
              >
                <span>{item.question}</span>
                <span className={styles.icon} aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div
              id={answerId}
              role="region"
              aria-labelledby={questionId}
              className={isOpen ? styles.answerOpen : styles.answerClosed}
            >
              <p className={styles.answerText}>{item.answer}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Faq
