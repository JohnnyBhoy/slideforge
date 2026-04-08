import React from 'react';
import { getInitials } from '../../utils/format';

interface AvatarProps {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };

const Avatar: React.FC<AvatarProps> = ({ name, avatar, size = 'md' }) => {
  const cls = sizeMap[size];
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${cls} rounded-full object-cover`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div className={`${cls} rounded-full bg-blue-700 text-white flex items-center justify-center font-semibold`}>
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
