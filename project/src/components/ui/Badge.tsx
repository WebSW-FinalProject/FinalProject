interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'green' | 'orange' | 'warn';
}

const variantClass: Record<string, string> = {
  neutral: 'bd-n',
  green:   'bd-green',
  orange:  'bd-orange',
  warn:    'bd-warn',
};

function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={`badge ${variantClass[variant]}`}>
      {children}
    </span>
  );
}

export default Badge;
