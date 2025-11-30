import React from 'react';

interface HeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Header: React.FC<HeaderProps> = ({ icon, title, description }) => {
  return (
    <header className="border-b border-notion-border pb-8">
      <div className="w-12 h-12 text-notion-text mb-4 opacity-80">{icon}</div>
      <h1 className="text-4xl font-bold tracking-tight text-notion-text">{title}</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{description}</p>
    </header>
  );
};

export default Header;