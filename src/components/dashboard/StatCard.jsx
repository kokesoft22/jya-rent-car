import React from 'react';
import { TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <div className="glass-card stat-card">
        <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
            <Icon size={22} />
        </div>
        <div className="stat-info">
            <span className="stat-title">{title}</span>
            <h3 className="stat-value">{value}</h3>
            {trend && (
                <span className="stat-trend">
                    <TrendingUp size={14} />
                    {trend}
                </span>
            )}
        </div>
    </div>
);

export default StatCard;
