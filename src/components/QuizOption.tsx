export function QuizOption({
  label,
  meaningJa,
  className,
  submitted,
  onClick,
}: {
  label: string
  meaningJa?: string
  className: string
  submitted: boolean
  onClick: () => void
}) {
  return (
    <button className={className} onClick={onClick} disabled={submitted}>
      <span>{label}</span>
      {submitted && meaningJa && (
        <span className="option-meaning-ja">{meaningJa}</span>
      )}
    </button>
  )
}
