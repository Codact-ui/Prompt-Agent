import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={`bg-notion-card rounded-lg border border-notion-border shadow-sm ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export default Card;