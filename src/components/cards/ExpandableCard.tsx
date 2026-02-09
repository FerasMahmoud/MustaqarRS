import React, { useState } from 'react';
import styles from './ExpandableCard.module.css';
import { ChevronDown } from 'lucide-react';

interface ExpandableCardProps {
  title: string;
  summary: string;
  highlights: string[];
  children?: React.ReactNode;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({
  title,
  summary,
  highlights,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`${styles.card} ${isExpanded ? styles.expanded : ''}`}
      onClick={toggleExpand}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          toggleExpand();
        }
      }}
    >
      {/* Header Section - Always Visible */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.summary}>{summary}</p>
        </div>
        <div className={`${styles.icon} ${isExpanded ? styles.rotated : ''}`}>
          <ChevronDown size={24} />
        </div>
      </div>

      {/* Expandable Content */}
      <div className={styles.contentWrapper}>
        <div className={styles.content}>
          {/* Highlights List */}
          <ul
            className={`${styles.highlights} ${isExpanded ? styles.visible : ''}`}
          >
            {highlights.map((highlight, index) => (
              <li key={index} className={styles.highlight}>
                <span className={styles.bullet}>•</span>
                {highlight}
              </li>
            ))}
          </ul>

          {/* Additional Content */}
          {children && (
            <div className={`${styles.extra} ${isExpanded ? styles.visible : ''}`}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
