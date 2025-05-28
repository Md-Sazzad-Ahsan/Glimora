'use client';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`
      bg-white dark:bg-gray-900
      rounded-xl
      overflow-hidden
      transition-all
      duration-300
      hover:shadow-xl
      hover:ring-2
      hover:ring-orange-200
      dark:hover:ring-orange-400
      ${className}
    `}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  );
};

const CardContent = ({ children, className = '' }) => {
  return (
    <div className={`
      p-6
      space-y-4
      ${className}
    `}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '' }) => {
  return (
    <h3 className={`
      text-2xl
      font-bold
      tracking-tight
      ${className}
    `}>
      {children}
    </h3>
  );
};

export { Card, CardHeader, CardContent, CardTitle };
