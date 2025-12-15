// FormInputGroup Component - untuk input yang berdampingan (flex gap-2)
export default function FormInputGroup({ children, className = '' }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {children}
    </div>
  );
}
