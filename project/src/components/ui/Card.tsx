interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-card)] ${className}`}>
      {children}
    </div>
  );
}

export default Card;
