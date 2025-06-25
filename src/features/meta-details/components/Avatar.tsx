import React from 'react';

interface AvatarProps {
  name: string;
  image?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  image,
  className = '',
}) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`w-24 h-24 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-bold ${className}`}
    >
      {initials}
    </div>
  );
};